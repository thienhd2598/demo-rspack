import React, { memo, useEffect, useMemo } from "react";
import "../../utils/index.scss";
import { useState } from "react";
import { mutateA_coImportReturnOrder } from "../../utils/graphqls";
import { useMutation, useQuery } from "@apollo/client";
import TableProductVariant from "./TableProductVariant";
import { useToasts } from "react-toast-notifications";
import { Field, Formik } from "formik";
import { ReSelectVertical } from "../../../../../../_metronic/_partials/controls/forms/ReSelectVertical";
import query_sme_catalog_stores from "../../../../../../graphql/query_sme_catalog_stores";
import { TextArea } from "../../../../../../_metronic/_partials/controls";
import { RadioGroup } from "../../../../../../_metronic/_partials/controls/forms/RadioGroup";
import client from "../../../../../../apollo";
import query_sme_catalog_product_variant from "../../../../../../graphql/query_sme_catalog_product_variant";
import * as Yup from "yup";
import { RETURN_PROCESS_RETURN_TYPE } from "../../utils/contants";
import { useDidUpdate } from '../../../../../../hooks/useDidUpdate'
import { useIntl } from "react-intl";
import { InputNote } from "../../../order-process-fail-delivery/components/InputNote";
import ImageUpload from "../../../../../../components/ImageUpload";
import { randomString } from "../../../../../../utils";
import _ from "lodash";

const queryGetProductVariants = async (ids) => {
  if (ids?.length == 0) return [];

  const { data } = await client.query({
    query: query_sme_catalog_product_variant,
    variables: {
      where: {
        id: { _in: ids },
      },
    },
    fetchPolicy: "network-only",
  });

  return data?.sme_catalog_product_variant || [];
}

const WarehouseModal = memo(
  ({ dataStore, refetch, orderProcess, openModal, setOpenModal }) => {
    const { formatMessage } = useIntl();    
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


    const [initialForm, setInitialForm] = useState({});
    const [validateSchema, setValidateSchema] = useState(null);
    const [orderItemsRebuild, setOrderItemsRebuild] = useState([]);
    const [getProductVariant, setGetProductVariant] = useState([]);
    const [imgsNote, setImgsNote] = useState([]);

    const { addToast } = useToasts();
    const [loadingBuildForm, setLoadingBuildForm] = useState(false);

    const { data: dataWarehouse } = useQuery(query_sme_catalog_stores, {
      fetchPolicy: "cache-and-network",
    });
    const orderInreturnOrderItems = orderProcess?.returnOrderItems.map(
      (or) => or?.orderItem
    );

    const checkIsNull = orderInreturnOrderItems?.every(
      (or) => !or.sme_variant_id
    );
    const [method, setMethod] = useState(checkIsNull ? 1 : 2);

    const [importReturnOrder, { loading }] = useMutation(
      mutateA_coImportReturnOrder
    );
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

      console.log({ orderInreturnOrderItems });

      const idsVariant = orderInreturnOrderItems.reduce((result, value) => {
        let total;
        if (!!value?.is_combo) {
          total = [
            value?.sme_variant_id || "",
            ...value?.comboItems?.map(item => item?.sme_variant_id),
          ]
        } else {
          total = value?.sme_variant_id || ""
        }

        return result.concat(total)
      }, []);      

      const idsQuery = _.flatten(idsVariant)?.filter(id => !!id);

      const totalVariants = await queryGetProductVariants(idsQuery);

      console.log({ orderInreturnOrderItems, totalVariants, orderProcess });

      setLoadingBuildForm(false);
      const rebuild = orderInreturnOrderItems?.map((_item, index) => {
        console.log({ _item })
        const findedVariant = totalVariants?.find(variant => variant?.id === _item?.sme_variant_id);
        
        let productVariant = {
          ...findedVariant,
          is_combo: _item?.is_combo,
          combo_items_origin: findedVariant?.combo_items,
          combo_items: _item?.comboItems?.map(_combo => {
            const smeVariant = totalVariants?.find(variant => variant?.id === _combo?.sme_variant_id);
            return {
              ..._combo,
              quantity: _combo?.purchased_quantity,
              combo_item: smeVariant
            }
          })
        };
        
        const returnItem = orderProcess?.returnOrderItems?.find(
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
                .typeError(formatMessage({defaultMessage:"Vui lòng nhập số lượng nhập kho"}))
                .min(0, formatMessage({defaultMessage:"Số lượng sản phẩm phải lớn hơn hoặc bằng 0"}))
                .max(999999, formatMessage({defaultMessage:"Số lượng sản phẩm phải nhỏ hơn 999.999"}))
                .lessThan(
                  (_combo?.quantity / _item?.quantity_purchased) * returnItem?.return_quantity + 1,
                  formatMessage({defaultMessage:"Số lượng nhập kho phải nhỏ hơn hoặc bằng số lượng hàng hoá kho"})
                );
            });
          } else {
            initValues[`variant-${productVariant?.id}-${index}-quantity`] = "--";
            schema[`variant-${productVariant?.id}-${index}-quantity`] = Yup.number()
              .typeError(formatMessage({defaultMessage:"Vui lòng nhập số lượng nhập kho"}))
              .min(0, formatMessage({defaultMessage:"Số lượng sản phẩm phải lớn hơn hoặc bằng 0"}))
              .max(999999, formatMessage({defaultMessage:"Số lượng sản phẩm phải nhỏ hơn 999.999"}))
              .lessThan(
                returnItem?.return_quantity + 1,
                formatMessage({defaultMessage:"Số lượng nhập kho phải nhỏ hơn hoặc bằng số lượng hàng hoá kho"})
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
    }, [orderProcess, getProductVariant]);

    return (
      <Formik
        initialValues={initialForm}
        validationSchema={validateSchema}
        enableReinitialize
        onSubmit={async (values) => {
          const bodyImportReturnOrder = {
            order_id: orderProcess?.id,
            import_type: +values.creationMethod,
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
                  return_quantity: order?.quantityReturn,
                  order_item_transaction_id: order?.order_item_transaction_id,
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
              <div className="row mb-4 d-flex justify-content-between">
                <div className="col-custom" style={{zIndex:100, cursor: 'not-allowed'}}>
                  <Field
                    label={formatMessage({ defaultMessage: 'Kho nhận hàng' })}
                    name="warehouseId"
                    component={ReSelectVertical}
                    onChange={() => {
                      setFieldValue("__changed__", true);
                    }}
                    isDisabled={true}
                    required
                    placeholder=""
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
                <div className="col-custom">
                  <Field
                    name="creationMethod"
                    label={formatMessage({ defaultMessage: 'Hình thức nhập kho' })}
                    component={RadioGroup}
                    value={(orderItemsRebuild?.every(or => !or.sme_variant_id)
                      && !orderItemsRebuild?.some(or => or.getProductVariantByIndex)) ? 1 : method}
                    customFeedbackLabel={" "}
                    disabled={orderItemsRebuild?.every(or => !or.sme_variant_id)
                      && !orderItemsRebuild?.some(or => or.getProductVariantByIndex)}
                    options={creationMethod}
                  />
                </div>
              </div>
              <div className="row mb-4 d-flex justify-content-between">
                <div className="col-custom d-flex ">
                  <span className="mr-3" style={{ flexShrink: 'inherit', color: '#000000' }}>
                    {formatMessage({ defaultMessage: 'Ghi chú' })}:
                  </span>
                  <div style={{ flex: 1 }}>
                    <Field
                      name="note"
                      component={InputNote}
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
                <div className="col-custom d-flex align-items-start">
                  <label className={`mr-3`} style={{ flexShrink: 'inherit' }}>{formatMessage({ defaultMessage: 'Hình ảnh' })}:</label>
                  <div className="d-flex flex-wrap" style={{ marginTop: -13 }}>
                    {imgsNote?.map((file, index) => (
                      <ImageUpload
                        key={`refund-order-note-${index}`}
                        data={file}
                        accept={".png, .jpg, .jpeg"}
                        allowEdit
                        allowRemove
                        isSmall
                        onRemove={() => {
                          setImgsNote(prev => {
                            let newImgs = [...prev];
                            newImgs.splice(index, 1);
                            return newImgs;
                          });
                        }}
                        onUploadSuccess={(dataAsset, id) => {
                          console.log({ dataAsset, id })
                        }}
                      />
                    ))}
                    {imgsNote?.length < 5 && (
                      <ImageUpload
                        accept={".png, .jpg, .jpeg"}
                        multiple={true}
                        isSmall
                        onChooseFile={files => {
                          console.log({ files })
                          let errors = files.filter(_file => _file.size > 3 * 1024 * 1024).map(_file => _file.name)
                          let errorDuplicate = [];
                          let filesAccept = files.filter(_file => _file.size <= 3 * 1024 * 1024)


                          setImgsNote(prev => prev.concat(filesAccept.map(_file => ({
                            id: randomString(12),
                            file: _file,
                            refFile: _file,
                          }))))
                          if (errorDuplicate.length > 0) {
                            addToast(formatMessage({ defaultMessage: 'Vui lòng không chọn hình ảnh trùng nhau' }), { appearance: 'error' });
                          }
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
              <TableProductVariant
                getProductVariant={getProductVariant}
                setGetProductVariant={setGetProductVariant}
                returnOrder={orderProcess}
                method={method}
                dataStore={dataStore}
                loading={loadingBuildForm}
                orderItems={orderItemsRebuild}
                removeProductVariant={removeProductVariant}
                lengthReturnItem={orderInreturnOrderItems?.length}
              />

              <div
                className="form-group"
                style={{
                  display: "flex",
                  justifyContent: "center",
                  margin: "auto",
                }}
              >
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
  }
);

export default WarehouseModal;