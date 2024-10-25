import React, { Fragment, memo, useCallback, useMemo, useState } from "react";
import { Formik } from "formik";
import { useIntl } from "react-intl";
import OrderInfoProcess from "./components/OrderInfoProcess";
import OrderListProcess from "./components/OrderListProcess";
import { RouterPrompt } from "../../../../components/RouterPrompt";
import { useOrderProcessContext } from "./context";
import { OPTIONS_PROTOCOL } from "./OrderProcessFailDeliveryHelper";
import client from "../../../../apollo";
import query_sme_catalog_product_variant from "../../../../graphql/query_sme_catalog_product_variant";
import _ from "lodash";
import * as Yup from "yup";
import { useQuery } from "@apollo/client";
import query_sme_catalog_stores from "../../../../graphql/query_sme_catalog_stores";
import query_sc_stores_basic from "../../../../graphql/query_sc_stores_basic";

const exp = [
    {
        "id": 300061,
        "tracking_number": "",
        "order_id": 277699,
        "package_number": "OFG145274285281293",
        "shipping_carrier": "SPX Express",
        "print_status": "0",
        "pack_status": "packing",
        "order": {
            "connector_channel_code": "shopee",
            "id": 277699,
            "payment_method": "Cash on Delivery",
            "store_id": 367,
            "paid_price": 326777,
            "status": "PROCESSED",
            "sme_id": 79,
            "ref_store_id": "532495143",
            "ref_number": "2308097YEAR6TD",
            "ref_id": "QUANGLX-MOCKCOMBO",
            "__typename": "Order"
        },
        "orderItems": [
            {
                "comboItems": [
                    {
                        "purchased_quantity": 3,
                        "__typename": "ComboItems",
                        "id": 1927,
                        "order_item_id": 351780,
                        "sme_variant_id": "31f70a15-46b8-4ea9-a12a-14493ed721a3"
                    },
                    {
                        "purchased_quantity": 6,
                        "__typename": "ComboItems",
                        "id": 1928,
                        "order_item_id": 351780,
                        "sme_variant_id": "3ec7d3ab-6fe4-4b26-8564-fb8367e4d81d"
                    }
                ],
                "connector_channel_code": "shopee",
                "id": 351780,
                "order_id": 277699,
                "is_combo": 1,
                "product_name": "TUN 9/8 SP CON THỨ 2 của combo- có phân loại quần áo nữ quần áo nam",
                "quantity_purchased": 3,
                "ref_order_id": "QUANGLX-MOCKCOMBO",
                "ref_product_id": "21282813270",
                "ref_variant_id": "0",
                "variant_name": "hoa hoa",
                "variant_image": "https://cf.shopee.vn/file/sg-11134201-7qvf9-ljzdgw55gd8y49_tn",
                "variant_sku": "000079-TSCTCCCPLQANQA-HOAHO-1691567174",
                "sc_product_id": 61698,
                "sc_variant_id": 1441091,
                "sme_id": 79,
                "store_id": 367,
                "sme_product_id": "b70b9f6c-e9de-49ac-bce7-e2f0cdce7f3b",
                "sme_variant_id": "dfe4d8db-9251-4cf6-ab9c-8b287c8aba05",
                "__typename": "OrderItem"
            },
            {
                "comboItems": [],
                "connector_channel_code": "shopee",
                "id": 351781,
                "order_id": 277699,
                "is_combo": 0,
                "product_name": "TUN 9/8 SP CON THỨ 2 của combo- có phân loại quần áo nữ quần áo nam",
                "quantity_purchased": 5,
                "ref_order_id": "QUANGLX-MOCKCOMBO",
                "ref_product_id": "19191774763",
                "ref_variant_id": "0",
                "variant_name": "hoa hoa",
                "variant_image": "https://cf.shopee.vn/file/sg-11134201-7qvf9-ljzdgw55gd8y49_tn",
                "variant_sku": "000079-TSCTCCCPLQANQA-HOAHO-1691567174",
                "sc_product_id": 61696,
                "sc_variant_id": 1441088,
                "sme_id": 79,
                "store_id": 367,
                "sme_product_id": "0ec87e3e-95b9-4fee-94bc-8d66526548f4",
                "sme_variant_id": "31f70a15-46b8-4ea9-a12a-14493ed721a3",
                "__typename": "OrderItem"
            }
        ],
        "__typename": "LogisticsPackages"
    },
    {
        "id": 300061,
        "tracking_number": "",
        "order_id": 277699,
        "package_number": "OFG145274285281293",
        "shipping_carrier": "SPX Express",
        "print_status": "0",
        "pack_status": "packing",
        "order": {
            "connector_channel_code": "shopee",
            "id": 277699,
            "payment_method": "Cash on Delivery",
            "store_id": 367,
            "paid_price": 326777,
            "status": "PROCESSED",
            "sme_id": 79,
            "ref_store_id": "532495143",
            "ref_number": "2308097YEAR6TD",
            "ref_id": "QUANGLX-MOCKCOMBO",
            "__typename": "Order"
        },
        "orderItems": [
            {
                "comboItems": [
                    {
                        "purchased_quantity": 3,
                        "__typename": "ComboItems",
                        "id": 1927,
                        "order_item_id": 351780,
                        "sme_variant_id": "31f70a15-46b8-4ea9-a12a-14493ed721a3"
                    },
                    {
                        "purchased_quantity": 6,
                        "__typename": "ComboItems",
                        "id": 1928,
                        "order_item_id": 351780,
                        "sme_variant_id": "3ec7d3ab-6fe4-4b26-8564-fb8367e4d81d"
                    }
                ],
                "connector_channel_code": "shopee",
                "id": 351780,
                "order_id": 277699,
                "is_combo": 1,
                "product_name": "TUN 9/8 SP CON THỨ 2 của combo- có phân loại quần áo nữ quần áo nam",
                "quantity_purchased": 3,
                "ref_order_id": "QUANGLX-MOCKCOMBO",
                "ref_product_id": "21282813270",
                "ref_variant_id": "0",
                "variant_name": "hoa hoa",
                "variant_image": "https://cf.shopee.vn/file/sg-11134201-7qvf9-ljzdgw55gd8y49_tn",
                "variant_sku": "000079-TSCTCCCPLQANQA-HOAHO-1691567174",
                "sc_product_id": 61698,
                "sc_variant_id": 1441091,
                "sme_id": 79,
                "store_id": 367,
                "sme_product_id": "b70b9f6c-e9de-49ac-bce7-e2f0cdce7f3b",
                "sme_variant_id": "dfe4d8db-9251-4cf6-ab9c-8b287c8aba05",
                "__typename": "OrderItem"
            },
            {
                "comboItems": [],
                "connector_channel_code": "shopee",
                "id": 351781,
                "order_id": 277699,
                "is_combo": 0,
                "product_name": "TUN 9/8 SP CON THỨ 2 của combo- có phân loại quần áo nữ quần áo nam",
                "quantity_purchased": 5,
                "ref_order_id": "QUANGLX-MOCKCOMBO",
                "ref_product_id": "19191774763",
                "ref_variant_id": "0",
                "variant_name": "hoa hoa",
                "variant_image": "https://cf.shopee.vn/file/sg-11134201-7qvf9-ljzdgw55gd8y49_tn",
                "variant_sku": "000079-TSCTCCCPLQANQA-HOAHO-1691567174",
                "sc_product_id": 61696,
                "sc_variant_id": 1441088,
                "sme_id": 79,
                "store_id": 367,
                "sme_product_id": "0ec87e3e-95b9-4fee-94bc-8d66526548f4",
                "sme_variant_id": "31f70a15-46b8-4ea9-a12a-14493ed721a3",
                "__typename": "OrderItem"
            }
        ],
        "__typename": "LogisticsPackages"
    },
];

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
};

const findVariant = (id, variants) => {
    return variants.find(variant => variant?.id === id) || {}
};

const OrderProcessPage = () => {
    const { ordersAdd, setOrders } = useOrderProcessContext();
    const { formatMessage } = useIntl();
    const [schema, setSchema] = useState([]);

    const { data: dataStores } = useQuery(query_sc_stores_basic, {
        fetchPolicy: "cache-and-network",
    });

    const initialValues = useMemo(
        async () => {
            const [schema, initValues] = [{}, {}];

            const idsQuery = exp?.map(order => {
                const idsOrderItems = order?.orderItems?.reduce(
                    (result, value) => {
                        let total;
                        if (value?.is_combo) {
                            total = [
                                ...value?.comboItems?.map(item => item?.sme_variant_id),
                                value?.sme_variant_id
                            ];
                        } else {
                            total = value?.sme_variant_id;
                        }

                        return result.concat(total)
                    }, []
                );
                return idsOrderItems
            });

            const totalVariants = await queryGetProductVariants(_.flatten(idsQuery));

            const orderBuilded = exp.map(order => {
                let totalItems = [];

                schema[`note-${order?.id}`] = Yup.string()
                    .notRequired()
                    .max(255, formatMessage({ defaultMessage: "Ghi chú tối đa 255 ký tự" }));

                const findedStore = dataStores?.sc_stores?.find(store => store?.id === order?.order?.store_id);

                order.orderItems.forEach(orderItem => {
                    let [smeVariantInfo, comboItems] = [null, []];

                    const findedVariantOrderItem = findVariant(orderItem?.sme_variant_id, totalVariants);
                    const sc_variant = {
                        name: orderItem?.product_name,
                        sku: orderItem?.variant_sku,
                        image: orderItem?.variant_image,
                        ref_product_id: orderItem?.ref_product_id,
                        ref_variant_id: orderItem?.ref_variant_id
                    };

                    if (!!orderItem.is_combo) {
                        smeVariantInfo = {
                            sku: findedVariantOrderItem?.sku
                        };
                        comboItems = orderItem.comboItems.reduce((result, value) => {
                            const findedSmeVariant = findVariant(value?.sme_variant_id, totalVariants);

                            initValues[`order-combo-${order?.id}-${orderItem?.id}-${value?.id}-quantity`] = "--";
                            schema[`order-combo-${order?.id}-${orderItem?.id}-${value?.id}-quantity`] = Yup.number()
                                .typeError(formatMessage({ defaultMessage: "Vui lòng nhập số lượng nhập kho" }))
                                .min(0, formatMessage({ defaultMessage: "Số lượng sản phẩm phải lớn hơn hoặc bằng 0" }))
                                .max(999999, formatMessage({ defaultMessage: "Số lượng sản phẩm phải nhỏ hơn 999.999" }))
                                .lessThan(
                                    value?.purchased_quantity * orderItem?.quantity_purchased + 1,
                                    formatMessage({ defaultMessage: "Số lượng nhập kho phải nhỏ hơn hoặc bằng số lượng hàng hoá kho" })
                                );

                            const smeVariant = {
                                sku: findedSmeVariant?.sku,
                                attributes: findedSmeVariant?.attributes,
                                name: findedSmeVariant?.name,
                                image: findedSmeVariant?.sme_catalog_product_variant_assets?.[0]?.asset_url
                            }

                            result = result.concat({
                                id: value?.id,
                                quantity: value?.purchased_quantity * orderItem?.quantity_purchased,
                                smeVariant,
                            });

                            return result;
                        }, [])
                    } else {
                        initValues[`order-${order?.id}-${orderItem?.id}-quantity`] = "--";
                        schema[`order-${order?.id}-${orderItem?.id}-quantity`] = Yup.number()
                            .typeError(formatMessage({ defaultMessage: "Vui lòng nhập số lượng nhập kho" }))
                            .min(0, formatMessage({ defaultMessage: "Số lượng sản phẩm phải lớn hơn hoặc bằng 0" }))
                            .max(999999, formatMessage({ defaultMessage: "Số lượng sản phẩm phải nhỏ hơn 999.999" }))
                            .lessThan(
                                orderItem?.quantity_purchased + 1,
                                formatMessage({ defaultMessage: "Số lượng nhập kho phải nhỏ hơn hoặc bằng số lượng hàng hoá kho" })
                            );

                        smeVariantInfo = {
                            sku: findedVariantOrderItem?.sku,
                            attributes: findedVariantOrderItem?.attributes,
                            name: findedVariantOrderItem?.name,
                            image: findedVariantOrderItem?.sme_catalog_product_variant_assets?.[0]?.asset_url
                        }
                    }

                    const infoOrderItem = {
                        id: orderItem?.id,
                        is_combo: !!orderItem?.is_combo,
                        quantity_purchased: orderItem?.quantity_purchased,
                        sc_variant,
                        sme_variant: smeVariantInfo,
                        comboItems
                    }

                    totalItems.push(infoOrderItem);
                });

                return {
                    id: order?.id,
                    connector_channel_code: order?.order?.connector_channel_code,
                    store: {
                        id: order?.order?.store_id,
                        name: findedStore?.name,
                        url: `/media/logo_${order?.order?.connector_channel_code}.png`
                    },
                    totalItems
                }
            });

            console.log(`CHECK BUILED:`, orderBuilded);
            setOrders(orderBuilded);

            return {
                warehouse: null,
                protocol: OPTIONS_PROTOCOL[0].value
            }
        }, [ordersAdd, dataStores?.sc_stores]
    );

    return (
        <Fragment>
            <Formik
                initialValues={initialValues}
                // validationSchema={false}
                enableReinitialize
            >
                {({ values }) => {
                    const changed = values?.['__changed__'];

                    return (
                        <Fragment>
                            <RouterPrompt
                                forkWhen={changed}
                                when={changed}
                                title={formatMessage({ defaultMessage: 'Lưu ý mọi thông tin bạn nhập trước đó sẽ không được lưu lại?' })}
                                cancelText={formatMessage({ defaultMessage: 'Quay lại' })}
                                okText={formatMessage({ defaultMessage: 'Tiếp tục' })}
                                onOK={() => true}
                                onCancel={() => false}
                            />
                            <OrderInfoProcess />
                            <OrderListProcess />
                            <div className='form-group d-flex justify-content-end mt-8 group-button-fixed-bottom pr-10'>
                                <button
                                    className="btn btn-secondary mr-4"
                                    style={{ width: 180, fontWeight: 'bold', background: '#6c757d', color: '#fff' }}
                                    onClick={e => {
                                        e.preventDefault()
                                    }}
                                >
                                    {formatMessage({ defaultMessage: 'XÓA VÀ QUÉT TIẾP (F3)' })}
                                </button>
                                <button
                                    className="btn btn-primary"
                                    style={{ width: 180, fontWeight: 'bold' }}
                                    onClick={() => { }}
                                >
                                    {formatMessage({ defaultMessage: 'XÁC NHẬN (F1)' })}
                                </button>
                            </div>
                        </Fragment>
                    )
                }}
            </Formik>
        </Fragment>
    )
};

export default memo(OrderProcessPage);