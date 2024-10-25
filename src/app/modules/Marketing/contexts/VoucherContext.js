import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { useIntl } from "react-intl";
import { useLocation } from 'react-router-dom';
import queryString from 'querystring';
import * as Yup from "yup";
import { useQuery } from "@apollo/client";
import { groupBy, max, minBy, omit, sum, sumBy } from "lodash";
import dayjs from "dayjs";
import op_connector_channels from "../../../../graphql/op_connector_channels";
import query_sc_stores_basic from "../../../../graphql/query_sc_stores_basic";
import { OPTIONS_TYPE_LIMIT, queryGetScProducts } from "../Constants";
import { formatNumberToCurrency } from "../../../../utils";

const VoucherContext = createContext();

export function useVoucherContext() {
    return useContext(VoucherContext);
};

export function VoucherProvider({ children, isTemplate = false }) {
    const location = useLocation();
    const { formatMessage } = useIntl();
    const paramsQuery = queryString.parse(location.search.slice(1, 100000));
    const [initialValues, setInitialValues] = useState({
        channel: 'shopee',
        type: null,
        store: '',
        typeVoucher: 1,
        typeDiscount: 2,
        typeLimit: OPTIONS_TYPE_LIMIT[0],
        typeItem: 3
    })
    const [validateSchema, setValidateSchema] = useState(null);
    const [productsVoucher, setProductsVoucher] = useState([]);
    const { data: dataChannel } = useQuery(op_connector_channels, {
        variables: {
            context: 'product'
        },
        fetchPolicy: 'cache-and-network'
    });

    const { data: dataStore } = useQuery(query_sc_stores_basic, {
        fetchPolicy: "cache-and-network",
    });

    useMemo(() => {
        if (!paramsQuery?.typeCampaign || !paramsQuery?.channel) return;

        setInitialValues(prev => ({
            ...prev, channel: paramsQuery?.channel, type: paramsQuery?.typeCampaign
        }))
    }, [paramsQuery?.channel, paramsQuery?.typeCampaign]);

    const page = useMemo(() => {
        try {
            let _page = Number(paramsQuery.page);
            if (!Number.isNaN(_page)) {
                return Math.max(1, _page)
            } else {
                return 1
            }
        } catch (error) {
            return 1;
        }
    }, [paramsQuery.page]);

    const limit = useMemo(() => {
        try {
            let _value = Number(paramsQuery.limit)
            if (!Number.isNaN(_value)) {
                return Math.max(25, _value)
            } else {
                return 25
            }
        } catch (error) {
            return 25
        }
    }, [paramsQuery.limit]);

    let channelVoucher = useMemo(() => {
        if (!paramsQuery?.channel) return null;
        let _channel = dataChannel?.op_connector_channels.find(
            (_st) => _st.code == paramsQuery?.channel
        );

        return _channel;
    }, [paramsQuery, dataChannel]);

    const storeOptions = useMemo(() => {
        const channels = dataStore?.op_connector_channels
        const stores = dataStore?.sc_stores
        const channelsActive = channels?.filter(store => ({ channelsActive: stores?.some(sa => sa?.connector_channel_code === store?.code) }));
        let _optionsChannel = channelsActive?.map(_channel => ({
            label: _channel?.name,
            logo: _channel?.logo_asset_url,
            value: _channel?.code
        })) || [];

        let optionsStores = stores?.flatMap(_store => {
            const channelParams = paramsQuery?.channel ? paramsQuery?.channel?.split(',') : null
            const channel = _optionsChannel?.find(cn => cn?.value == _store?.connector_channel_code)
            if (!channelParams) {
                return {
                    label: _store.name,
                    logo: channel?.logo,
                    value: _store?.id,
                    channel: channel?.value
                }
            }
            if (channelParams?.includes(_store?.connector_channel_code)) {
                return {
                    label: _store.name,
                    logo: channel?.logo,
                    value: _store?.id,
                    channel: channel?.value
                }
            }
            return []
        })
        return optionsStores;
    }, [paramsQuery.channel, dataStore]);

    useMemo(() => {
        let schema = {};
        schema['name'] = Yup.string().required(formatMessage({ defaultMessage: 'Vui lòng nhập tên chương trình' }))
            .max(100, formatMessage({ defaultMessage: 'Tên chương trình khuyến mãi tối đa 100 ký tự' }))
            .test(
                'chua-ky-tu-space-o-dau-cuoi',
                formatMessage({ defaultMessage: 'Tên chương trình không được chứa dấu cách ở đầu và cuối' }),
                (value, context) => {
                    if (!!value) {
                        return value.length == value.trim().length;
                    }
                    return false;
                },
            )
            .test(
                'chua-ky-tu-2space',
                formatMessage({ defaultMessage: 'Tên chương trình không được chứa 2 dấu cách liên tiếp' }),
                (value, context) => {
                    if (!!value) {
                        return !(/\s\s+/g.test(value))
                    }
                    return false;
                },
            );
        schema['store'] = Yup.string().required(formatMessage({ defaultMessage: 'Vui lòng chọn gian hàng' }));

        if (initialValues?.channel == 'shopee') {
            schema['code'] = Yup.string()
                .required(formatMessage({ defaultMessage: 'Vui lòng nhập mã voucher' }))
                .max(isTemplate ? 3 : 5, formatMessage({ defaultMessage: 'Mã voucher tối đa {count} ký tự' }, { count: isTemplate ? 3 : 5 }))
                .test(
                    'chua-ky-tu-space-o-dau-cuoi',
                    formatMessage({ defaultMessage: 'Mã voucher không được chứa dấu cách ở đầu và cuối' }),
                    (value, context) => {
                        if (!!value) {
                            return value.length == value.trim().length;
                        }
                        return false;
                    },
                )
                .test(
                    'chua-ky-tu-2space',
                    formatMessage({ defaultMessage: 'Mã voucher không được chứa 2 dấu cách liên tiếp' }),
                    (value, context) => {
                        if (!!value) {
                            return !(/\s\s+/g.test(value))
                        }
                        return false;
                    },
                );
        }

        schema[`discount_amount`] = Yup.number().nullable()
            .required(formatMessage({ defaultMessage: 'Vui lòng nhập mã giảm giá' }))
            .when('typeDiscount', (value) => {
                if (value == 1) {
                    return Yup.number().nullable()
                        .required(formatMessage({ defaultMessage: 'Vui lòng nhập mã giảm giá' }))
                        .min(1000, formatMessage({ defaultMessage: 'Giảm giá từ {min}đ đến {max}đ' }, { min: formatNumberToCurrency(1000), max: formatNumberToCurrency(120000000) }))
                        .max(120000000, formatMessage({ defaultMessage: 'Giảm giá từ {min}đ đến {max}đ' }, { min: formatNumberToCurrency(1000), max: formatNumberToCurrency(120000000) }))
                }

                if (value == 2) {
                    return Yup.number().nullable()
                        .required(formatMessage({ defaultMessage: 'Vui lòng nhập mã giảm giá' }))
                        .min(1, formatMessage({ defaultMessage: 'Giảm giá từ {min}% đến {max}%' }, { min: 1, max: 99 }))
                        .max(99, formatMessage({ defaultMessage: 'Giảm giá từ {min}% đến {max}%' }, { min: 1, max: 99 }))
                }
            })

        schema[`max_discount_price`] = Yup.number().nullable()
            .min(1000, formatMessage({ defaultMessage: 'Mức giảm từ {min}đ đến {max}đ' }, { min: formatNumberToCurrency(1000), max: formatNumberToCurrency(120000000) }))
            .max(120000000, formatMessage({ defaultMessage: 'Mức giảm từ {min}đ đến {max}đ' }, { min: formatNumberToCurrency(1000), max: formatNumberToCurrency(120000000) }))

        schema[`min_order_price`] = Yup.number().nullable()
            .required(formatMessage({ defaultMessage: 'Vui lòng nhập giá trị đơn hàng tối thiểu' }))
            .max(120000000, formatMessage({ defaultMessage: 'Giá trị đơn hàng tối thiểu đã vượt quá giá trị tối đa {max}đ' }, { max: formatNumberToCurrency(120000000) }))
            .when(['discount_amount', 'typeDiscount'], (value, type) => {
                if (!!value && type == 1) {
                    return Yup.number().nullable()
                        .required(formatMessage({ defaultMessage: 'Vui lòng nhập giá trị đơn hàng tối thiểu' }))
                        .test('min', 'Giá trị voucher không thể vượt quá giá trị tối thiểu của đơn hàng', (valueCurrent) => {                            
                            if (valueCurrent > 0) {
                                return value <= valueCurrent
                            }

                            return true
                        })
                        // .min(value, formatMessage({ defaultMessage: 'Giá trị voucher không thể vượt quá giá trị tối thiểu của đơn hàng' }))
                        .max(120000000, formatMessage({ defaultMessage: 'Giá trị đơn hàng tối thiểu đã vượt quá giá trị tối đa {max}đ' }, { max: formatNumberToCurrency(120000000) }))
                }
            })

        schema[`usage_quantity`] = Yup.number().nullable()
            .required(formatMessage({ defaultMessage: 'Vui lòng nhập tổng lượt sử dụng tối đa' }))
            .min(1, formatMessage({ defaultMessage: 'Tổng lượt sử dụng tối đa từ {min} đến {max}' }, { min: formatNumberToCurrency(1), max: formatNumberToCurrency(200000) }))
            .max(200000, formatMessage({ defaultMessage: 'Tổng lượt sử dụng tối đa từ {min} đến {max}' }, { min: formatNumberToCurrency(1), max: formatNumberToCurrency(200000) }))

        if (initialValues?.channel != 'shopee') {
            schema[`limit_per_user`] = Yup.number().nullable()
                .required(formatMessage({ defaultMessage: 'Vui lòng nhập lượt sử dụng tối đa/Người' }))
                .min(1, formatMessage({ defaultMessage: 'Lượt sử dụng tối đa/Người từ 1 đến {max}' }, { max: initialValues?.channel == 'shopee' ? 5 : 50 }))
                .max(50, formatMessage({ defaultMessage: 'Lượt sử dụng tối đa/Người từ 1 đến {max}' }, { max: 50 }))
        }

        setValidateSchema(Yup.object().shape(schema, [['discount_amount', 'typeDiscount']]));
    }, [initialValues, isTemplate]);

    const buildInitialValues = async ({ voucherDetail, isTemplate = false }) => {
        let formValues = {};

        const scProductIds = (isTemplate ? voucherDetail?.campaignItems : voucherDetail?.campaignItem)?.map(item => item?.sc_product_id);
        const scProductIdsUniq = [...new Set(scProductIds)];
        const scProducts = await queryGetScProducts(scProductIdsUniq);

        const productCampaignItems = scProducts?.map(product => {
            const campaignItem = (isTemplate ? voucherDetail?.campaignItems : voucherDetail?.campaignItem)?.find(item => item?.sc_product_id == product?.id);
            const { id, sync_error_message, sync_status } = campaignItem || {};

            return {
                ...product,
                campaign_item_id: id,
                sync_error_message,
                sync_status,
                productVariants: product?.productVariants
                    ?.filter(variant => !!variant?.ref_id)
                    ?.map(variant => {
                        const campaignVariantItem = (isTemplate ? voucherDetail?.campaignItems : voucherDetail?.campaignItem)?.find(item => item?.sc_variant_id == variant?.id);
                        return {
                            ...variant,
                            ...(voucherDetail?.connector_channel_code == 'lazada' ? {
                                campaign_item_id: campaignVariantItem?.id,
                                sync_error_message: campaignVariantItem?.sync_error_message,
                                sync_status: campaignVariantItem?.sync_status || 1,
                            } : {})
                        }
                    })
            }
        });

        if (voucherDetail?.connector_channel_code == 'lazada') {
            (productCampaignItems || []).forEach(product => {
                (product?.productVariants || []).forEach(variant => {
                    const campaignItem = (isTemplate ? voucherDetail?.campaignItems : voucherDetail?.campaignItem)?.find(item => item?.sc_variant_id == variant?.id);

                    formValues[`campaign-${product?.id}-${variant?.id}-active`] = !!campaignItem && variant?.sellable_stock > 0 ? true : false;
                })
            })
        }

        formValues['name'] = paramsQuery?.action == 'copy' ? `Sao chép ${voucherDetail?.name}` : voucherDetail?.name;
        formValues['code'] = voucherDetail?.code;
        formValues['channel'] = voucherDetail?.connector_channel_code;
        formValues['store'] = voucherDetail?.store_id;
        formValues['status'] = voucherDetail?.status;
        formValues['type'] = isTemplate ? voucherDetail?.campaign_type : voucherDetail?.type;
        formValues['text_status'] = voucherDetail?.text_status;
        formValues['typeItem'] = voucherDetail?.item_type;
        if (voucherDetail?.discount_type == 3) {
            formValues['typeDiscount'] = 2;
            formValues['typeVoucher'] = 3;
        } else {
            formValues['typeDiscount'] = voucherDetail?.discount_type;
            formValues['typeVoucher'] = 1;
        }
        formValues['discount_amount'] = voucherDetail?.campaignVoucher?.discount_amount;
        formValues['usage_quantity'] = voucherDetail?.campaignVoucher?.usage_quantity;
        formValues['limit_per_user'] = voucherDetail?.campaignVoucher?.limit_per_user;
        formValues['max_discount_price'] = voucherDetail?.campaignVoucher?.max_discount_price;
        formValues['min_order_price'] = voucherDetail?.campaignVoucher?.min_order_price;
        formValues['typeLimit'] = !!voucherDetail?.campaignVoucher?.max_discount_price
            ? OPTIONS_TYPE_LIMIT[1]
            : OPTIONS_TYPE_LIMIT[0]

        console.log({ voucherDetail, scProducts });
        setInitialValues(prev => ({
            ...prev,
            ...formValues
        }))
        setProductsVoucher(productCampaignItems)

    };

    const values = useMemo(() => {
        return {
            channelVoucher, storeOptions, initialValues, validateSchema, productsVoucher, setProductsVoucher, paramsQuery,
            page, limit, buildInitialValues
        }
    }, [channelVoucher, storeOptions, initialValues, validateSchema, productsVoucher, paramsQuery, page, limit, buildInitialValues]);

    return (
        <VoucherContext.Provider value={values}>
            {children}
        </VoucherContext.Provider>
    )
}