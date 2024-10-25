import { useQuery } from "@apollo/client";
import queryString from 'querystring';
import React, { createContext, useContext, useMemo, useState } from "react";
import { useIntl } from "react-intl";
import { useLocation } from 'react-router-dom';
import * as Yup from "yup";
import op_connector_channels from "../../../../graphql/op_connector_channels";
import query_sc_stores_basic from "../../../../graphql/query_sc_stores_basic";
import query_scGetLogisticChannelByChannel from "../../../../graphql/query_scGetLogisticChannelByChannel";
import { formatNumberToCurrency } from "../../../../utils";
import { OPTIONS_TYPE_LIMIT, queryGetScProducts } from "../Constants";

const DealContext = createContext();

export function useDealContext() {
    return useContext(DealContext);
};

export function DealProvider({ children, isTemplate = false }) {
    const location = useLocation();
    const { formatMessage } = useIntl();
    const paramsQuery = queryString.parse(location.search.slice(1, 100000));
    const [initialValues, setInitialValues] = useState({
        channel: 'shopee',
        type: null,
        store: '',
        typeDeal: 1,
        typeDiscount: 2,
        typeLimit: OPTIONS_TYPE_LIMIT[0],
        typeItem: 3
    })
    const [validateSchema, setValidateSchema] = useState(null);
    const [productsDeal, setProductsDeal] = useState([]);
    const [giftsDeal, setGiftsDeal] = useState([]);
    const [currentStore, setCurrentStore] = useState(null);
    const { data: dataChannel } = useQuery(op_connector_channels, {
        variables: {
            context: 'product'
        },
        fetchPolicy: 'cache-and-network'
    });

    const { data: dataStore } = useQuery(query_sc_stores_basic, {
        fetchPolicy: "cache-and-network",
    });

    const { data: dataLogisticChannel } = useQuery(query_scGetLogisticChannelByChannel, {
        variables: {
            connector_channel_code: initialValues?.channel,
            store_id: currentStore
        },
        fetchPolicy: 'cache-and-network',
        skip: !initialValues?.channel || !currentStore
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

    let channelDeal = useMemo(() => {
        if (!paramsQuery?.channel) return null;
        let _channel = dataChannel?.op_connector_channels.find(
            (_st) => _st.code == paramsQuery?.channel
        );

        return _channel;
    }, [paramsQuery, dataChannel]);

    const logisticsChannel = useMemo(() => {
        if (!dataLogisticChannel?.scGetLogisticChannel?.logistics) return []

        return dataLogisticChannel?.scGetLogisticChannel?.logistics?.map(lg => ({
            ...lg,
            value: lg?.ref_channel_id,
            label: lg?.channel_name
        }));
    }, [dataLogisticChannel]);

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
            .max(isTemplate ? 12 : 25, formatMessage({ defaultMessage: 'Tên chương trình tối đa {count} ký tự' }, { count: isTemplate ? 12 : 25 }))
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

        schema['gift_num'] = Yup.number().nullable()
            .required(formatMessage({ defaultMessage: 'Vui lòng nhập số lượng quà tặng' }))
            .min(1, formatMessage({ defaultMessage: 'Chọn từ {min} đến {max} quà tặng' }, { min: formatNumberToCurrency(1), max: formatNumberToCurrency(50) }))
            .max(50, formatMessage({ defaultMessage: 'Chọn từ {min} đến {max} quà tặng' }, { min: formatNumberToCurrency(1), max: formatNumberToCurrency(50) }))

        schema['purchase_min_spend'] = Yup.number().nullable()
            .required(formatMessage({ defaultMessage: 'Vui lòng nhập giá trị' }))
            .min(1000, formatMessage({ defaultMessage: 'Giá trị từ {min}đ đến {max}đ' }, { min: formatNumberToCurrency(1000), max: formatNumberToCurrency(100000000) }))
            .max(100000000, formatMessage({ defaultMessage: 'Giá trị từ {min}đ đến {max}đ' }, { min: formatNumberToCurrency(1000), max: formatNumberToCurrency(100000000) }))

        setValidateSchema(Yup.object().shape(schema));
    }, [initialValues, isTemplate]);

    const buildInitialValues = async ({ dealDetail, isTemplate = false }) => {
        let formValues = {};
        setCurrentStore(dealDetail?.store_id);

        const scProductDealIds = (isTemplate ? dealDetail?.campaignItems : dealDetail?.campaignItem)?.map(item => item?.sc_product_id);
        const scProductDealIdsUniq = [...new Set(scProductDealIds)];
        const scProductsDeal = await queryGetScProducts(scProductDealIdsUniq);
        const scGiftDealIds = dealDetail?.campaignSubItem?.map(item => item?.sc_product_id);
        const scGiftDealIdsUniq = [...new Set(scGiftDealIds)];
        const scGiftsDeal = await queryGetScProducts(scGiftDealIdsUniq);

        const productCampaignItems = scProductsDeal?.map(product => {
            const campaignItem = (isTemplate ? dealDetail?.campaignItems : dealDetail?.campaignItem)?.find(item => item?.sc_product_id == product?.id);
            const { id, sync_error_message, sync_status } = campaignItem || {};

            return {
                ...product,
                campaign_item_id: id,
                sync_error_message,
                sync_status,
                productVariants: product?.productVariants
                    ?.filter(variant => !!variant?.ref_id)
                    ?.map(variant => {
                        const campaignVariantItem = (isTemplate ? dealDetail?.campaignItems : dealDetail?.campaignItem)?.find(item => item?.sc_variant_id == variant?.id);
                        return {
                            ...variant,
                            ...(dealDetail?.connector_channel_code == 'lazada' ? {
                                campaign_item_id: campaignVariantItem?.id,
                                sync_error_message: campaignVariantItem?.sync_error_message,
                                sync_status: campaignVariantItem?.sync_status || 1,
                            } : {})
                        }
                    })
            }
        });

        const giftCampaignItems = scGiftsDeal?.map(product => {
            const campaignItem = dealDetail?.campaignSubItem?.find(item => item?.sc_product_id == product?.id);
            const { id, sync_error_message, sync_status } = campaignItem || {};

            return {
                ...product,
                campaign_item_id: id,
                sync_error_message,
                sync_status,
                productVariants: product?.productVariants
                    ?.filter(variant => !!variant?.ref_id)
                    ?.map(variant => {
                        const campaignVariantItem = dealDetail?.campaignSubItem?.find(item => item?.sc_variant_id == variant?.id);
                        return {
                            ...variant,
                            campaign_item_id: campaignVariantItem?.id,
                            sync_error_message: campaignVariantItem?.sync_error_message,
                            sync_status: campaignVariantItem?.sync_status || 1,
                        }
                    })
            }
        });

        (productCampaignItems || []).forEach(product => {
            const campaignItem = (isTemplate ? dealDetail?.campaignItems : dealDetail?.campaignItem)?.find(item => item?.sc_product_id == product?.id);
            formValues[`campaign-${product?.id}-active`] = campaignItem?.is_enable == 1 ? true : false;
        });

        (giftCampaignItems || []).forEach(product => {
            (product?.productVariants || []).forEach(variant => {
                const campaignItem = dealDetail?.campaignSubItem?.find(item => item?.sc_variant_id == variant?.id);

                formValues[`campaign-${product?.id}-${variant?.id}-active`] = campaignItem?.is_enable == 1 ? true : false;
            })
        });     
        
        console.log({ productCampaignItems, giftCampaignItems });

        formValues['id'] = dealDetail?.id;
        formValues['name'] = paramsQuery?.action == 'copy' ? `Sao chép ${dealDetail?.name}` : dealDetail?.name;
        formValues['channel'] = dealDetail?.connector_channel_code;
        formValues['store'] = dealDetail?.store_id;
        formValues['status'] = dealDetail?.status;
        formValues['type'] = isTemplate ? dealDetail?.campaign_type : dealDetail?.type;
        formValues['text_status'] = dealDetail?.text_status;
        formValues['gift_num'] = dealDetail?.campaignAddOnDeal?.gift_num;
        formValues['purchase_min_spend'] = dealDetail?.campaignAddOnDeal?.purchase_min_spend;

        setInitialValues(prev => ({
            ...prev,
            ...formValues
        }))

        setProductsDeal(productCampaignItems)
        setGiftsDeal(giftCampaignItems)
    };

    const values = useMemo(() => {
        return {
            channelDeal, storeOptions, initialValues, validateSchema, productsDeal, setProductsDeal, paramsQuery,
            page, limit, buildInitialValues, setCurrentStore, logisticsChannel, giftsDeal, setGiftsDeal
        }
    }, [channelDeal, storeOptions, initialValues, validateSchema, productsDeal, paramsQuery, page, limit, buildInitialValues, logisticsChannel, giftsDeal]);

    return (
        <DealContext.Provider value={values}>
            {children}
        </DealContext.Provider>
    )
}