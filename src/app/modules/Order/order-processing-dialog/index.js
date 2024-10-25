import React, { memo, useEffect, useMemo } from "react";
import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
// import TableProductVariant from "./TableProductVariant";
import { useToasts } from "react-toast-notifications";
import { Field, Formik } from "formik";
import { ReSelectVertical } from "../../../../_metronic/_partials/controls/forms/ReSelectVertical";
import query_sme_catalog_stores from "../../../../graphql/query_sme_catalog_stores";
import { TextArea } from "../../../../_metronic/_partials/controls";
import { RadioGroup } from "../../../../_metronic/_partials/controls/forms/RadioGroup";
import client from "../../../../apollo";
import query_sme_catalog_product_variant from "../../../../graphql/query_sme_catalog_product_variant";
import * as Yup from "yup";
import { RETURN_PROCESS_RETURN_TYPE } from "../../utils/contants";
import { useDidUpdate } from '../../../../../../hooks/useDidUpdate'
import { useIntl } from "react-intl";
import mutate_coImportWarehouse from "../../../../graphql/mutate_coImportWarehouse";

const WarehouseModal = ({ dataStore, refetch, idOrder, openModal, setOpenModal }) => {
    const { formatMessage } = useIntl();
    const [initialForm, setInitialForm] = useState({});
    const [validateSchema, setValidateSchema] = useState(null);
    const [orderItemsRebuild, setOrderItemsRebuild] = useState([]);
    const [getProductVariant, setGetProductVariant] = useState([]);
    const creationMethod = [
        {
            value: 1,
            label: formatMessage({ defaultMessage: "Không nhập kho" }),
        },
        {
            value: 2,
            label: formatMessage({ defaultMessage: "Nhập kho" }),
        },
    ];

    const queryGetProductVariant = async (sme_variant_id) => {
        if (!sme_variant_id) return null;

        const { data } = await client.query({
            query: query_sme_catalog_product_variant,
            variables: {
                where: {
                    id: { _eq: sme_variant_id },
                },
            },
            fetchPolicy: "network-only",
        });
        return data?.sme_catalog_product_variant?.[0] || null;
    };    

    const { addToast } = useToasts();
    const [loadingBuildForm, setLoadingBuildForm] = useState(false);

    const { data: dataWarehouse } = useQuery(query_sme_catalog_stores, {
        fetchPolicy: "cache-and-network",
    });
    const orderInreturnOrderItems = idOrder?.returnOrderItems.map(
        (or) => or?.orderItem
    );
    console.log('orderInreturnOrderItems', orderInreturnOrderItems)
    const checkIsNull = orderInreturnOrderItems?.every(
    );
    const [method, setMethod] = useState(checkIsNull ? 1 : 2);

    const [importReturnOrder, { loading }] = useMutation(mutate_coImportWarehouse);

    function removeProductVariant(index) {
        const productVariantDeleted = getProductVariant.filter(
            (ob) => ob.keyVariant !== index
        );
        setGetProductVariant(productVariantDeleted);
    }

    useMemo(() => {
        const defaultWarehouse =
            dataWarehouse?.sme_warehouses?.find(
                (element) => element.is_default == 1
            ) || null;

        setInitialForm((prev) => ({
            ...prev,
            warehouseId: {
                label: defaultWarehouse?.name,
                value: defaultWarehouse?.id,
            },
            creationMethod: method,
            note: "",
        }));
    }, [dataWarehouse?.sme_warehouses]);

    useMemo(async () => {
        let [schema, initValues] = [
            {
                note: Yup.string()
                    .notRequired()
                    .max(255, formatMessage({ defaultMessage: "Ghi chú tối đa 255 ký tự" })),
            },
            {},
        ];

        setLoadingBuildForm(true);
        setInitialForm(prev => ({
            ...prev,
            creationMethod: (getProductVariant?.length == 0 && checkIsNull) ? 1 : 2
        }));

        const totalVariants = await Promise.all(
            orderInreturnOrderItems?.map((_item) =>
                queryGetProductVariant(_item?.sme_variant_id || "")
            )
        );
        
        setLoadingBuildForm(false);
        const rebuild = orderInreturnOrderItems?.map((_item, index) => {
            const productVariant = totalVariants[index];
            const returnItem = idOrder?.returnOrderItems?.find(
                (_ro) => _ro?.order_item_id === _item?.id
            );
            const getProductVariantByIndex = getProductVariant.find(
                (ob) => ob.keyVariant == index
            );
            if (!!productVariant) {
                if (!!productVariant?.is_combo) {
                    productVariant.combo_items.forEach((_combo) => {
                        initValues[
                            `variant-${_combo?.combo_item?.id}-${productVariant.id}-combo-${index}-quantity`
                        ] = "--";
                        schema[
                            `variant-${_combo?.combo_item?.id}-${productVariant.id}-combo-${index}-quantity`
                        ] = Yup.number()
                            .typeError(formatMessage({ defaultMessage: "Vui lòng nhập số lượng nhập kho" }))
                            .min(0, formatMessage({ defaultMessage: "Số lượng sản phẩm phải lớn hơn hoặc bằng 0" }))
                            .max(999999, formatMessage({ defaultMessage: "Số lượng sản phẩm phải nhỏ hơn 999.999" }))
                            .lessThan(
                                _combo?.quantity * returnItem?.return_quantity + 1,
                                formatMessage({ defaultMessage: "Số lượng nhập kho phải nhỏ hơn hoặc bằng số lượng hàng hoá kho" })
                            );
                    });
                } else {
                    initValues[`variant-${productVariant?.id}-${index}-quantity`] = "--";
                    schema[`variant-${productVariant?.id}-${index}-quantity`] = Yup.number()
                        .typeError(formatMessage({ defaultMessage: "Vui lòng nhập số lượng nhập kho" }))
                        .min(0, formatMessage({ defaultMessage: "Số lượng sản phẩm phải lớn hơn hoặc bằng 0" }))
                        .max(999999, formatMessage({ defaultMessage: "Số lượng sản phẩm phải nhỏ hơn 999.999" }))
                        .lessThan(
                            returnItem?.return_quantity + 1,
                            formatMessage({ defaultMessage: "Số lượng nhập kho phải nhỏ hơn hoặc bằng số lượng hàng hoá kho" })
                        );
                }
            }
            if (!productVariant && getProductVariantByIndex) {
                if (!!getProductVariantByIndex._item?.is_combo) {
                    getProductVariantByIndex._item.combo_items.forEach(
                        (_combo, i) => {
                            initValues[
                                `variant-${_combo?.combo_item?.id}-${getProductVariantByIndex.keyVariant}-${index}-${i}-quantity`
                            ] = '--';
                            schema[
                                `variant-${_combo?.combo_item?.id}-${getProductVariantByIndex.keyVariant}-${index}-${i}-quantity`
                            ] = Yup.number()
                                .typeError(formatMessage({ defaultMessage: "Vui lòng nhập số lượng nhập kho" }))
                                .min(0, formatMessage({ defaultMessage: "Số lượng sản phẩm phải lớn hơn hoặc bằng 0" }))
                                .max(999999, formatMessage({ defaultMessage: "Số lượng sản phẩm phải nhỏ hơn 999.999" }))
                                .lessThan(
                                    _combo?.quantity * returnItem?.return_quantity + 1,
                                    formatMessage({ defaultMessage: "Số lượng nhập kho phải nhỏ hơn hoặc bằng số lượng hàng hoá kho" })
                                );
                        }
                    );
                } else {
                    initValues[
                        `variant-${getProductVariantByIndex._item.id}-${getProductVariantByIndex.keyVariant}-quantity`
                    ] = '--';
                    schema[
                        `variant-${getProductVariantByIndex._item.id}-${getProductVariantByIndex.keyVariant}-quantity`
                    ] = Yup.number()
                        .typeError(formatMessage({ defaultMessage: "Vui lòng nhập số lượng nhập kho" }))
                        .min(0, formatMessage({ defaultMessage: "Số lượng sản phẩm phải lớn hơn hoặc bằng 0" }))
                        .max(999999, formatMessage({ defaultMessage: "Số lượng sản phẩm phải nhỏ hơn 999.999" }))
                        .lessThan(
                            returnItem?.return_quantity + 1,
                            formatMessage({ defaultMessage: "Số lượng nhập kho phải nhỏ hơn hoặc bằng số lượng hàng hoá kho" })
                        );
                }
            }

            return {
                ..._item,
                productVariant,
                getProductVariantByIndex: getProductVariantByIndex,
                quantityReturn: returnItem?.return_quantity,
                returnItemId: returnItem?.id,
                index: index
            };
        });

        setOrderItemsRebuild(rebuild);
        setValidateSchema(Yup.object().shape(schema));
        setInitialForm((prev) => ({
            ...prev,
            ...initValues,
        }));
    }, [idOrder, getProductVariant]);

    return (
        <Formik
            initialValues={initialForm}
            validationSchema={validateSchema}
            enableReinitialize
            onSubmit={async (values) => {
                const bodyImportReturnOrder = {
                    return_obj_id: idOrder?.id,
                    import_type: +values.creationMethod,
                    type_return: RETURN_PROCESS_RETURN_TYPE.RETURN,
                    import_note: values.note,
                    import_items: orderItemsRebuild?.reduce((result, order) => {
                        if (!!order?.productVariant?.is_combo) {
                            const itemCombo = order?.productVariant?.combo_items?.map(
                                (_combo, index) => ({
                                    sme_variant_id: _combo?.combo_item?.id,
                                    sc_variant_id: order?.sc_variant_id,
                                    return_item_id: order?.returnItemId,
                                    order_item_transaction_id: _combo?.order_item_transaction_id,
                                    return_quantity: _combo?.quantity * order?.quantityReturn,
                                    import_quantity:
                                        values[
                                        `variant-${_combo?.combo_item?.id}-${order.productVariant.id}-combo-${order.index}-quantity`
                                        ],
                                })
                            );

                            result = result.concat(itemCombo);
                            return result;
                        }

                        if (!!order?.getProductVariantByIndex?._item.is_combo) {
                            const itemCombo = order?.getProductVariantByIndex?._item?.combo_items?.map(
                                (_combo, index) => ({
                                    sme_variant_id: _combo?.combo_item?.id,
                                    sc_variant_id: order?.sc_variant_id,
                                    return_item_id: order?.returnItemId,
                                    order_item_transaction_id: _combo?.order_item_transaction_id,
                                    return_quantity: _combo?.quantity * order?.quantityReturn,
                                    import_quantity:
                                        values[
                                        `variant-${_combo?.combo_item?.id}-${order.getProductVariantByIndex.keyVariant}-${order.index}-${index}-quantity`
                                        ],
                                })
                            );

                            result = result.concat(itemCombo);
                            return result;
                        }

                        if (order?.sme_variant_id) {
                            const itemNotCombo = {
                                sme_variant_id: order?.sme_variant_id,
                                sc_variant_id: order?.sc_variant_id,
                                return_item_id: order?.returnItemId,
                                return_quantity: order?.quantityReturn,
                                order_item_transaction_id: order?.order_item_transaction_id,
                                import_quantity:
                                    values[`variant-${order?.productVariant?.id}-${order.index}-quantity`],
                            };
                            result = result.concat(itemNotCombo);
                        }
                        if (order?.getProductVariantByIndex?._item.id) {
                            const itemNotCombo = {
                                sme_variant_id: order?.getProductVariantByIndex?._item.id,
                                sc_variant_id: order?.sc_variant_id,
                                return_item_id: order?.returnItemId,
                                order_item_transaction_id: order?.order_item_transaction_id,
                                return_quantity: order?.quantityReturn,
                                import_quantity:
                                    values[
                                    `variant-${order?.getProductVariantByIndex?._item.id}-${order.getProductVariantByIndex.keyVariant}-quantity`
                                    ],
                            };
                            result = result.concat(itemNotCombo);
                        }
                        return result;
                    }, []),
                };

                const { data } = await importReturnOrder({
                    variables: bodyImportReturnOrder,
                });
                if (data.coImportWarehouse) {
                    if (data?.coImportWarehouse?.success) {
                        addToast(data?.coImportWarehouse?.message, {
                            appearance: "success",
                        });
                        setOpenModal({ ...openModal, openWarehouse: false });
                        refetch();
                    } else {
                        addToast(data?.coImportWarehouse?.message, {
                            appearance: "error",
                        });
                        setOpenModal({ ...openModal, openWarehouse: false });
                        refetch();
                    }
                }
            }}
        >
            {({ values, handleSubmit, validateForm, setFieldValue }) => {
                setMethod(values?.creationMethod);

                return (
                    <div>
                        <div className="row mb-4">
                            <div className="col-2 text-right">
                                <span>
                                    {formatMessage({ defaultMessage: 'Kho nhận hàng' })} <span className="text-danger">*</span>
                                </span>
                            </div>
                            <div className="col-10">
                                <Field
                                    name="warehouseId"
                                    component={ReSelectVertical}
                                    onChange={() => {
                                        setFieldValue("__changed__", true);
                                    }}
                                    required
                                    placeholder=""
                                    label={""}
                                    customFeedbackLabel={" "}
                                    options={dataWarehouse?.sme_warehouses?.map((__) => {
                                        return {
                                            label: __.name,
                                            value: __.id,
                                        };
                                    })}
                                    isClearable={false}
                                />
                            </div>
                        </div>
                        <div className="row mb-2">
                            <div className="col-2 text-right">
                                <span>{formatMessage({ defaultMessage: 'Hình thức nhập kho' })}</span>
                            </div>
                            <div className="col-10">
                                <Field
                                    name="creationMethod"
                                    component={RadioGroup}
                                    curr
                                    value={(orderItemsRebuild?.every(or => !or.sme_variant_id)
                                        && !orderItemsRebuild?.some(or => or.getProductVariantByIndex)) ? 1 : method}
                                    // label={'Loại kiểm kho'}
                                    customFeedbackLabel={" "}
                                    disabled={orderItemsRebuild?.every(or => !or.sme_variant_id)
                                        && !orderItemsRebuild?.some(or => or.getProductVariantByIndex)}
                                    options={creationMethod}
                                ></Field>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-2 text-right">
                                <span>Ghi chú</span>
                            </div>
                            <div className="col-10">
                                <Field
                                    name="note"
                                    component={TextArea}
                                    placeholder={formatMessage({ defaultMessage: "Nhập ghi chú" })}
                                    label={""}
                                    required={false}
                                    customFeedbackLabel={" "}
                                    cols={["col-0", "col-12"]}
                                    countChar
                                    rows={4}
                                    maxChar={"255"}
                                />
                            </div>
                        </div>
                        {/* <TableProductVariant
                                getProductVariant={getProductVariant}
                                setGetProductVariant={setGetProductVariant}
                                returnOrder={idOrder}
                                method={method}
                                dataStore={dataStore}
                                loading={loadingBuildForm}
                                orderItems={orderItemsRebuild}
                                removeProductVariant={removeProductVariant}
                                lengthReturnItem={orderInreturnOrderItems?.length}
                            /> */}

                        <div
                            className="form-group"
                            style={{
                                display: "flex",
                                justifyContent: "center",
                                margin: "auto",
                            }}
                        >
                            {" "}
                            <button
                                type="button"
                                className="btn btn-secondary mr-3"
                                style={{ width: 100 }}
                                onClick={() =>
                                    setOpenModal({ ...openModal, openWarehouse: false })
                                }
                            >
                                {formatMessage({ defaultMessage: 'Hủy' })}
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary btn-elevate mr-3"
                                style={{ width: 100 }}
                                disabled={loading}
                                onClick={handleSubmit}
                            >
                                {formatMessage({ defaultMessage: 'Xác nhận' })}
                            </button>
                        </div>
                    </div>
                );
            }}
        </Formik>
    );
};

export default memo(WarehouseModal);