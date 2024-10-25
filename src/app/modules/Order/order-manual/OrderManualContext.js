import { useQuery } from "@apollo/client";
import React, { createContext, useContext, useMemo, useRef, useState } from "react";
import { useIntl } from "react-intl";
import * as Yup from "yup";
import { groupBy } from 'lodash';
import { useLocation } from 'react-router-dom'
import query_crmGetProvince from "../../../../graphql/query_crmGetProvince";
import query_crmGetDistrict from "../../../../graphql/query_crmGetDistrict";
import query_sc_stores_basic from "../../../../graphql/query_sc_stores_basic";
import query_smeCatalogStores from "../../../../graphql/query_smeCatalogStores";
import query_scGetShippingUnit from "../../../../graphql/query_scGetShippingUnit";
import query_prvListProvider from "../../../../graphql/query_prvListProvider";

const OrderManualContext = createContext();

export function useOrderManualContext() {
    return useContext(OrderManualContext);
}

export function OrderManualProvider({ children, type = 'create' }) {
    const location = useLocation()
    const { formatMessage } = useIntl();
    const [step, setStep] = useState(1);
    const [stepPassed, setStepPassed] = useState({});
    const [variantsOrder, setVariantsOrder] = useState([]);
    const [validateSchema, setValidateSchema] = useState({});
    const [loadingProduct, setLoadingProduct] = useState(false);
    const [loadingUploadFile, setLoadingUploadFile] = useState(false);
    const [products, setProducts] = useState([]);
    const [infoCustomer, setInfoCustomer] = useState(null);
    const [infoReceiver, setInfoReceiver] = useState(null);
    const [logistics, setLogistics] = useState([]);
    const [smeWarehouseSelected, setSmeWarehouseSelected] = useState(null);
    const [isApproved, setIsApproved] = useState(false);
    const [typeDelyvery, setTypeDelyvery] = useState(2);
    const [cacheStep1, setCacheStep1] = useState({})
    const [cacheStep2, setCacheStep2] = useState({})
    const [cacheStep3, setCacheStep3] = useState({});
    console.log('typeDelyvery', typeDelyvery)
    const { data: dataCrmGetProvince } = useQuery(query_crmGetProvince, {
        fetchPolicy: "cache-and-network",
    });

    const { data: dataCrmGetDistrict } = useQuery(query_crmGetDistrict, {
        fetchPolicy: "cache-and-network",
    });
    console.log('dataCrmGetDistrict', dataCrmGetDistrict)
    const { data: dataStore } = useQuery(query_sc_stores_basic, {
        variables: { context: 'order' },
        fetchPolicy: 'cache-and-network'
    });

    const { data: dataCatalogStores } = useQuery(query_smeCatalogStores, {
        fetchPolicy: 'cache-and-network'
    });

    const { data: dataShippingUnit } = useQuery(query_scGetShippingUnit, {
        fetchPolicy: 'cache-and-network'
    });

    const { loading, data, error, refetch } = useQuery(query_prvListProvider, {
        fetchPolicy: "cache-and-network",
        variables: {
            list_category_code: ['logistic']
        }
    });

    const deliverys = useMemo(() => {
        return data?.prvListProvider?.data?.map(item => ({
            name: item?.name,
            logistic_services: item?.logistic_services,
            id: item?.providerConnected[0]?.id,
            code: item?.code,
            isConnected: !!item?.providerConnected?.length
        }))
    }, [data])
    console.log('data?.prvListProvider', data?.prvListProvider)
    const optionsProvince = useMemo(() => {
        return dataCrmGetProvince?.crmGetProvince?.map(province => ({
            value: province?.code,
            label: province?.name
        }));
    }, [dataCrmGetProvince]);

    const [optionsDistrict, opsParse] = useMemo(() => {
        const opsParse = dataCrmGetDistrict?.crmGetDistrict?.map(district => ({
            value: district?.code,
            label: district?.full_name,
            province_code: district?.province_code,
        }));

        return [groupBy(opsParse, 'province_code'), opsParse]
    }, [dataCrmGetDistrict]);

    const optionsStore = useMemo(() => {
        return dataStore?.sc_stores?.map(store => ({
            value: store?.id,
            label: store?.name,
            logo: dataStore?.op_connector_channels?.find(channel => channel?.code == store?.connector_channel_code)?.logo_asset_url,
            connector_channel_code: store?.connector_channel_code,
            ref_shop_id: store?.ref_shop_id
        }));
    }, [dataStore]);

    const optionsSmeWarehouse = useMemo(() => {
        const optionsCatalogStores = dataCatalogStores?.sme_warehouses?.map(
            _store => ({
                value: _store?.id,
                label: _store?.name,
                isDefault: _store?.is_default,
                ..._store
            })
        );

        if (type == 'create') {
            const smeWarehouseDefault = optionsCatalogStores?.find(wh => wh?.isDefault);
            setSmeWarehouseSelected(smeWarehouseDefault);
        }

        return optionsCatalogStores
    }, [dataCatalogStores, type]);

    const optionsTypeOrderSale = [{ label: formatMessage({ defaultMessage: 'Gửi bù hàng' }), value: 1 },
    { label: formatMessage({ defaultMessage: 'Đổi hàng lỗi' }), value: 2 }, { label: formatMessage({ defaultMessage: 'Đổi sản phẩm' }), value: 3 }]

    const optionsRuleCheck = [
        { label: formatMessage({ defaultMessage: 'Cho khách thử hàng' }), value: 'Cho khách thử hàng' },
        { label: formatMessage({ defaultMessage: 'Cho khách xem hàng, không cho thử' }), value: 'Cho khách xem hàng, không cho thử' },
        { label: formatMessage({ defaultMessage: 'Không cho xem hàng' }), value: 'Không cho xem hàng' }
    ]

    const optionsShippingUnit = useMemo(() => {
        const options = dataShippingUnit?.scGetShippingUnit?.map(item => ({
            label: item?.name,
            value: item?.key
        }));

        return options
    }, [dataShippingUnit]);

    const optionsFeeBearer = [{ label: formatMessage({ defaultMessage: 'Người nhận' }), value: 1 }, { label: formatMessage({ defaultMessage: 'Người bán' }), value: 2 }]

    const REQUIRE_RECEIVER_SCHEMA = useRef({
        name_receiver_step1: Yup.string()
            .nullable()
            .max(35, formatMessage({ defaultMessage: "{name} tối đa {length} ký tự" }, { length: 35, name: formatMessage({ defaultMessage: "Tên người nhận" }) }))
            .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: formatMessage({ defaultMessage: "Tên người nhận" }).toLowerCase() }))
            .test('chua-ky-tu-space-o-dau-cuoi', formatMessage({ defaultMessage: 'Tên người nhận không được chứa dấu cách ở đầu và cuối' }),
                (value, context) => {
                    if (!!value) {
                        return value.length == value.trim().length;
                    }
                    return true;
                },
            )
            .test('chua-ky-tu-2space', formatMessage({ defaultMessage: 'Tên người nhận không được chứa 2 dấu cách liên tiếp' }),
                (value, context) => {
                    if (!!value) {
                        return !(/\s\s+/g.test(value))
                    }
                    return true;
                },
            ), phone_receiver_step1: Yup.string()
                .nullable()
                .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: formatMessage({ defaultMessage: "Số điện thoại người nhận" }).toLowerCase() }))
                .length(10, formatMessage({ defaultMessage: "Độ dài số điện thoại người nhận phải {number} số" }, { number: 10 }))
                .test('sai-dinh-dang-phone', 'Số điện thoại người nhận không hợp lệ',
                    (value, context) => {
                        if (!!value) {
                            return (/^0[0-9]\d{8}$/g.test(value))
                        }
                        return true;
                    },
                ), province_step1: Yup.object()
                    .nullable()
                    .required(formatMessage({ defaultMessage: "Vui lòng chọn {name}" }, { name: formatMessage({ defaultMessage: "Tỉnh/thành phố" }).toLowerCase() })),
        district_step1: Yup.object()
            .nullable()
            .required(formatMessage({ defaultMessage: "Vui lòng chọn {name}" }, { name: formatMessage({ defaultMessage: "Quận/huyện" }).toLowerCase() })),
        address_step1: Yup.string()
            .nullable()
            .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: formatMessage({ defaultMessage: "Địa chỉ người nhận" }).toLowerCase() }))
    })

    const RECEIVER_SCHEMA = useRef({
        name_receiver_step1: Yup.string()
            .nullable()
            .max(35, formatMessage({ defaultMessage: "{name} tối đa {length} ký tự" }, { length: 35, name: formatMessage({ defaultMessage: "Tên người nhận" }) }))
            // .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: formatMessage({ defaultMessage: "Tên người nhận" }).toLowerCase() }))
            .test('chua-ky-tu-space-o-dau-cuoi', formatMessage({ defaultMessage: 'Tên người nhận không được chứa dấu cách ở đầu và cuối' }),
                (value, context) => {
                    if (!!value) {
                        return value.length == value.trim().length;
                    }
                    return true;
                },
            )
            .test('chua-ky-tu-2space', formatMessage({ defaultMessage: 'Tên người nhận không được chứa 2 dấu cách liên tiếp' }),
                (value, context) => {
                    if (!!value) {
                        return !(/\s\s+/g.test(value))
                    }
                    return true;
                },
            ),
        phone_receiver_step1: Yup.string().nullable()
            // .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: formatMessage({ defaultMessage: "Số điện thoại người nhận" }).toLowerCase() }))
            .length(10, formatMessage({ defaultMessage: "Độ dài số điện thoại người nhận phải {number} số" }, { number: 10 }))
            .test('sai-dinh-dang-phone', 'Số điện thoại người nhận không hợp lệ',
                (value, context) => {
                    if (!!value) {
                        return (/^0[0-9]\d{8}$/g.test(value))
                    }
                    return true;
                },
            ), province_step1: Yup.object()
                .nullable()
        // .required(formatMessage({ defaultMessage: "Vui lòng chọn {name}" }, { name: formatMessage({ defaultMessage: "Tỉnh/thành phố" }).toLowerCase() })),
        , district_step1: Yup.object()
            .nullable()
        // .required(formatMessage({ defaultMessage: "Vui lòng chọn {name}" }, { name: formatMessage({ defaultMessage: "Quận/huyện" }).toLowerCase() })),
        , address_step1: Yup.string()
            .nullable()
        // .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: formatMessage({ defaultMessage: "Địa chỉ người nhận" }).toLowerCase() })),
        ,
    })

    const SHIPPING_CARRIER_SCHEMA = useRef({
        shipping_carrier_step2: Yup.object()
            .nullable()
            .required(formatMessage({ defaultMessage: "Vui lòng chọn {name}" }, { name: formatMessage({ defaultMessage: "Đơn vị vận chuyển" }).toLowerCase() })),
    })

    const BASE_SCHEMA = useRef({
        name_customer_step1: Yup.string()
            .nullable()
            .max(35, formatMessage({ defaultMessage: "{name} tối đa {length} ký tự" }, { length: 35, name: formatMessage({ defaultMessage: "Tên người mua" }) }))
            .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: formatMessage({ defaultMessage: "Tên người mua" }).toLowerCase() }))
            .test(
                'chua-ky-tu-space-o-dau-cuoi',
                formatMessage({ defaultMessage: 'Tên người mua không được chứa dấu cách ở đầu và cuối' }),
                (value, context) => {
                    if (!!value) {
                        return value.length == value.trim().length;
                    }
                    return false;
                },
            )
            .test(
                'chua-ky-tu-2space',
                formatMessage({ defaultMessage: 'Tên người mua không được chứa 2 dấu cách liên tiếp' }),
                (value, context) => {
                    if (!!value) {
                        return !(/\s\s+/g.test(value))
                    }
                    return false;
                },
            ),
        phone_customer_step1: Yup.string()
            .nullable()
            .length(10, formatMessage({ defaultMessage: "Độ dài số điện thoại người mua phải {number} số" }, { number: 10 }))
            .test(
                'sai-dinh-dang-phone',
                'Số điện thoại người mua không hợp lệ',
                (value, context) => {
                    if (!!value) {
                        return (/^0[0-9]\d{8}$/g.test(value))
                    }
                    return true;
                },
            ),

        channel_step1: Yup.object()
            .nullable()
            .required(formatMessage({ defaultMessage: "Vui lòng chọn {name}" }, { name: formatMessage({ defaultMessage: "Kênh bán" }).toLowerCase() })),
        store_step1: Yup.object()
            .nullable()
            .required(formatMessage({ defaultMessage: "Vui lòng chọn {name}" }, { name: formatMessage({ defaultMessage: "Gian hàng" }).toLowerCase() })),
        sme_warehouse_step1: Yup.object()
            .nullable()
            .required(formatMessage({ defaultMessage: "Vui lòng chọn {name}" }, { name: formatMessage({ defaultMessage: "Kho xử lý" }).toLowerCase() })),
        person_charge_step1: Yup.string()
            .nullable()
            .max(35, formatMessage({ defaultMessage: "{name} tối đa {length} ký tự" }, { length: 35, name: formatMessage({ defaultMessage: "Tên người phụ trách" }) }))
            // .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: formatMessage({ defaultMessage: "Tên người phụ trách" }).toLowerCase() }))
            .test(
                'chua-ky-tu-space-o-dau-cuoi',
                formatMessage({ defaultMessage: 'Tên người phụ trách không được chứa dấu cách ở đầu và cuối' }),
                (value, context) => {
                    if (!!value) {
                        return value.length == value.trim().length;
                    }
                    return true;
                },
            )
            .test(
                'chua-ky-tu-2space',
                formatMessage({ defaultMessage: 'Tên người phụ trách không được chứa 2 dấu cách liên tiếp' }),
                (value, context) => {
                    if (!!value) {
                        return !(/\s\s+/g.test(value))
                    }
                    return true;
                },
            ),
        order_code_step1: Yup.string()
            .nullable()
            .max(20, formatMessage({ defaultMessage: "{name} tối đa {length} ký tự" }, { length: 20, name: formatMessage({ defaultMessage: "Mã đơn hàng" }) }))
            .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: formatMessage({ defaultMessage: "Mã đơn hàng" }).toLowerCase() }))
            .test(
                'chua-ky-tu-space-o-dau-cuoi',
                formatMessage({ defaultMessage: 'Mã đơn hàng không được chứa dấu cách ở đầu và cuối' }),
                (value, context) => {
                    if (!!value) {
                        return value.length == value.trim().length;
                    }
                    return false;
                },
            )
            .test(
                'chua-ky-tu-2space',
                formatMessage({ defaultMessage: 'Mã đơn hàng không được chứa 2 dấu cách liên tiếp' }),
                (value, context) => {
                    if (!!value) {
                        return !(/\s\s+/g.test(value))
                    }
                    return false;
                },
            )
            .when(`order_code_boolean_step1`, {
                is: values => {
                    return !!values && !!values[`order_code_step1`];
                },
                then: Yup.string().oneOf([`order_code_step1`], formatMessage({ defaultMessage: 'Mã đơn hàng đã tồn tại' }))
            }),
        order_code_boolean_step1: Yup.object().notRequired(),
        payment_method_step2: Yup.object().required(formatMessage({ defaultMessage: "Vui lòng chọn {name}" }, { name: formatMessage({ defaultMessage: "Phương thức thanh toán" }).toLowerCase() })),
        p_delivery_method: Yup.object().required(formatMessage({ defaultMessage: "Vui lòng chọn {name}" }, { name: formatMessage({ defaultMessage: "Phương thức lấy hàng" }).toLowerCase() })),
        package_length_step2: Yup.number()
            .notRequired()
            .nullable()
            .min(1, formatMessage({ defaultMessage: "Chiều dài tối thiểu {min} cm" }, { min: 1 }))
            .max(100, formatMessage({ defaultMessage: "Chiều dài tối đa {max} cm" }, { max: 100 })),
        package_width_step2: Yup.number()
            .notRequired()
            .nullable()
            .min(1, formatMessage({ defaultMessage: "Chiều rộng tối thiểu {min} cm" }, { min: 1 }))
            .max(100, formatMessage({ defaultMessage: "Chiều rộng tối đa {max} cm" }, { max: 100 })),
        package_height_step2: Yup.number()
            .notRequired()
            .nullable()
            .min(1, formatMessage({ defaultMessage: "Chiều cao tối thiểu {min} cm" }, { min: 1 }))
            .max(100, formatMessage({ defaultMessage: "Chiều cao tối đa {max} cm" }, { max: 100 })),
        package_weight_step2: Yup.number()
            .nullable()
            .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: formatMessage({ defaultMessage: "Trọng lượng kiện hàng" }).toLowerCase() }))
            .moreThan(0, formatMessage({ defaultMessage: "Trọng lượng kiện hàng phải lớn hơn {min} kg" }, { min: 0 }))
            .max(100, formatMessage({ defaultMessage: "Trọng lượng kiện hàng tối đa {max} kg" }, { max: 100 })),

        tracking_number_step2: Yup.string()
            .nullable()
            .max(20, formatMessage({ defaultMessage: "{name} tối đa {length} ký tự" }, { length: 20, name: formatMessage({ defaultMessage: "Mã vận đơn" }) }))
            .test(
                'chua-ky-tu-space-o-dau-cuoi',
                formatMessage({ defaultMessage: 'Mã vận đơn không được chứa dấu cách ở đầu và cuối' }),
                (value, context) => {
                    if (!!value) {
                        return value.length == value.trim().length;
                    }
                    return true;
                },
            )
            .test(
                'chua-ky-tu-2space',
                formatMessage({ defaultMessage: 'Mã vận đơn không được chứa 2 dấu cách liên tiếp' }),
                (value, context) => {
                    if (!!value) {
                        return !(/\s\s+/g.test(value))
                    }
                    return true;
                },
            ),
        payment_transaction_code_step2: Yup.string()
            .nullable()
            .max(20, formatMessage({ defaultMessage: "{name} tối đa {length} ký tự" }, { length: 20, name: formatMessage({ defaultMessage: "Mã giao dịch" }) }))
            .test(
                'chua-ky-tu-space-o-dau-cuoi',
                formatMessage({ defaultMessage: 'Mã giao dịch không được chứa dấu cách ở đầu và cuối' }),
                (value, context) => {
                    if (!!value) {
                        return value.length == value.trim().length;
                    }
                    return true;
                },
            )
            .test(
                'chua-ky-tu-2space',
                formatMessage({ defaultMessage: 'Mã giao dịch không được chứa 2 dấu cách liên tiếp' }),
                (value, context) => {
                    if (!!value) {
                        return !(/\s\s+/g.test(value))
                    }
                    return true;
                },
            ),
        shipping_original_fee_step2: Yup.number()
            .max(10000000, formatMessage({ defaultMessage: "{name} tối đa {max}đ" }, { max: '10,000,000', name: formatMessage({ defaultMessage: "Phí vận chuyển" }) })),
        // shipping_discount_seller_fee_step2: Yup.number()
        //     .when(typeDelyvery == 1 ? `shipping_original_fee_step2` : 'shipping_original_fee_logistic', values => {
        //         if (typeof values == 'number') {
        //             return Yup.number()
        //                 .max(values, formatMessage({ defaultMessage: 'Hỗ trợ vận chuyển không thể lớn hơn phí vận chuyển thực tế' }))
        //         }
        //     }),
        promotion_seller_amount_step2: Yup.number()
            .max(120000000, formatMessage({ defaultMessage: "{name} tối đa {max}đ" }, { max: '120,000,000', name: formatMessage({ defaultMessage: "Mã giảm giá" }) }))
    });

    useMemo(() => {
        let schema = { ...BASE_SCHEMA.current, ...(typeDelyvery == 1 ? { ...SHIPPING_CARRIER_SCHEMA.current } : {}), ...(isApproved ? { ...REQUIRE_RECEIVER_SCHEMA.current } : { ...RECEIVER_SCHEMA.current }), };

        (variantsOrder || []).forEach(variant => {
            if (!smeWarehouseSelected) return;

            console.log({ smeWarehouseSelected })
            const smeWarehouse = variant?.variant?.inventories?.find(wh => wh?.sme_store_id == smeWarehouseSelected?.value);
            const isCheckStock = !smeWarehouseSelected?.allow_preallocate && smeWarehouse?.stock_available <= 999999;

            schema[`variant_${variant?.variant?.id}_discount_step1`] = Yup.number()
                .notRequired()
                .when(`variant_${variant?.variant?.id}_price_step1`, values => {
                    if (typeof values == 'number') {
                        return Yup.number()
                            .max(values, formatMessage({ defaultMessage: 'Chiết khấu không được vượt quá đơn giá của hàng hóa' }))
                    }
                })
                .when(`variant_${variant?.variant?.id}_unit_step1`, values => {
                    if (!!values?.value) {
                        return Yup.number()
                            .max(100, formatMessage({ defaultMessage: 'Chiết khấu tối đa 100%' }))
                    }
                })
            schema[`variant_${variant?.variant?.id}_price_step1`] = Yup.number()
                .required(formatMessage({ defaultMessage: 'Vui lòng nhập đơn giá' }))
                .max(120000000, formatMessage({ defaultMessage: 'Đơn giá tối đa 120.000.000đ' }))
            schema[`variant_${variant?.variant?.id}_quantity_step1`] = Yup.number()
                .required(formatMessage({ defaultMessage: 'Vui lòng nhập số lượng hàng hóa' }))
                .moreThan(0, formatMessage({ defaultMessage: 'Số lượng hàng hóa phải lớn hơn 0' }))
                .max(
                    isCheckStock ? smeWarehouse?.stock_available : 999999,
                    isCheckStock ? formatMessage({ defaultMessage: 'Số lượng phải nhỏ hơn hoặc bằng tồn sẵn sàng bán' }) : formatMessage({ defaultMessage: 'Số lượng hàng hóa phải nhỏ hơn hoặc bằng 999.999' })
                )


        })

        setValidateSchema(Yup.object().shape(schema))
    }, [variantsOrder, smeWarehouseSelected, isApproved, typeDelyvery]);


    const value = useMemo(() => {
        return {
            deliverys,
            optionsTypeOrderSale,
            optionsRuleCheck,
            isApproved,
            setIsApproved,
            optionsFeeBearer,
            step, setStep,
            products, setProducts, validateSchema,
            variantsOrder, setVariantsOrder,
            stepPassed, setStepPassed,
            cacheStep1, setCacheStep1,
            cacheStep2, setCacheStep2,
            cacheStep3, setCacheStep3,
            optionsProvince, optionsDistrict,
            optionsStore, optionsSmeWarehouse, optionsShippingUnit,
            infoCustomer, setInfoCustomer,
            infoReceiver, setInfoReceiver, type,
            loadingProduct, setLoadingProduct,
            loadingUploadFile, setLoadingUploadFile,
            smeWarehouseSelected, setSmeWarehouseSelected,
            setTypeDelyvery, logistics, setLogistics,
            opsParse
        }
    }, [
        deliverys, setTypeDelyvery,
        optionsRuleCheck,
        opsParse, logistics,
        step, isApproved, products, stepPassed, cacheStep1, cacheStep2, cacheStep3, variantsOrder,
        optionsProvince, optionsDistrict, optionsStore, optionsSmeWarehouse, optionsShippingUnit,
        infoCustomer, infoReceiver, validateSchema, type, loadingProduct, smeWarehouseSelected, loadingUploadFile
    ])

    return (
        <OrderManualContext.Provider value={value}>
            {children}
        </OrderManualContext.Provider>
    );
}
