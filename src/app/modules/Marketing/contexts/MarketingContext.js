import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { useIntl } from "react-intl";
import { useLocation } from 'react-router-dom';
import queryString from 'querystring';
import * as Yup from "yup";
import { useQuery } from "@apollo/client";
import { queryGetScProductVariants } from "../../Order/OrderUIHelpers";
import { MAX_CAMPAIGN_ITEMS, OPTIONS_TYPE_LIMIT, TYPE_CAMPAIGN, queryGetScProducts } from "../Constants";
import { groupBy, minBy, omit, sum, sumBy } from "lodash";
import { APPLY_TYPE_FRAME, OPTIONS_FRAME } from "../../FrameImage/FrameImageHelper";
import dayjs from "dayjs";
import op_connector_channels from "../../../../graphql/op_connector_channels";
import query_sc_stores_basic from "../../../../graphql/query_sc_stores_basic";

const MarketingContext = createContext();

export function useMarketingContext() {
    return useContext(MarketingContext);
};

export function MarketingProvider({ children }) {
    const location = useLocation();
    const paramsQuery = queryString.parse(location.search.slice(1, 100000));
    const [initialValues, setInitialValues] = useState({
        name: '',
        store: '',
        typeDiscount: 2,
        typeItem: 2,
        quantity: OPTIONS_TYPE_LIMIT[0],
        quantity_per_user: OPTIONS_TYPE_LIMIT[0],
        quantity_per_user_number: 1,
        quantity_number: 1,
        discount_percent: null,
        timeValue: [new Date(dayjs().add(15, 'minute').toISOString()), new Date(dayjs().add(15, 'minute').add(1, "hour").toISOString())],
        on_create_schedule_frame: false,
        apply_before_minute: 0,
        sme_warehouses: {},
        apply_type: APPLY_TYPE_FRAME[0],
        option: OPTIONS_FRAME[1],
        day: 0,
        hour: 0,
        minute: 0,
        second: 0,
    });
    const [campaignItems, setCampaignItems] = useState([]);
    const [validateSchema, setValidateSchema] = useState(null);
    const { formatMessage } = useIntl();

    // [Query Graphql]: Query graphql for marketing actions
    const { data: dataChannel } = useQuery(op_connector_channels, {
        variables: {
            context: 'product'
        },
        fetchPolicy: 'cache-and-network'
    })
    const { data: dataStore } = useQuery(query_sc_stores_basic, {
        fetchPolicy: "cache-and-network",
    });

    // [Query Params]: Build query params marketing    
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

    const typeCampaign = useMemo(() => paramsQuery?.typeCampaign, [paramsQuery]);

    const queryVariables = useMemo(() => {
        return {
            page,
            limit,
            typeCampaign
        }
    }, [page, limit, typeCampaign]);

    let channelCampaign = useMemo(() => {
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

        let __optionsStores = stores?.flatMap(_store => {
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
        return __optionsStores;
    }, [paramsQuery.channel, dataStore]);    

    // [Schema]: Build schema validate marketing
    const schemaRoot = useRef({
        name: Yup.string().required('Vui lòng nhập tên CTKM')
            .max(150, 'Tên chương trình khuyến mãi tối đa 150 ký tự.'),
        store: Yup.string().required('Vui lòng chọn gian hàng'),
        timeValue: Yup.array().required('Vui lòng nhập thời gian').nullable(),
        discount_percent: Yup.number()
            .nullable()
            .min(1, 'Giảm giá phải lớn hơn 0%')
            .max(99, 'Giảm giá phải nhỏ hơn 100%'),
        discount_value: Yup.number()
            .nullable()
            .min(1, 'Giảm giá phải lớn hơn 0đ')
            .max(120000000, 'Giảm giá phải nhỏ hơn 120.000.000đ'),
        quantity_number: Yup.number('Vui lòng số lượng sản phẩm')
            .required('Vui lòng số lượng sản phẩm')
            .min(1, 'Vui lòng cài đặt số lượng sản phẩm lớn hơn 0'),
        quantity_per_user_number: Yup.number('Vui lòng nhập giới hạn mua')
            .required('Vui lòng nhập giới hạn mua')
            .min(1, 'Vui lòng cài đặt giới hạn mua hàng lớn hơn 0')
    })

    useMemo(() => {
        let schema = { ...schemaRoot.current };

        (campaignItems || []).forEach(product => {
            if (product?.itemType == 'product') {
                const sumSellableStock = sumBy(product?.productVariants || [], 'sellable_stock');
                const minPriceVariant = minBy(product?.productVariants || [], 'price')?.price;

                schema[`campaign-${product?.id}-discount-percent`] = Yup.number('Vui lòng nhập phần trăm giảm giá')
                    .nullable()
                    .required('Vui lòng nhập phần trăm giảm giá')
                    .min(1, 'Giảm giá phải lớn hơn 0%')
                    .max(99, 'Giảm giá phải nhỏ hơn 100%')
                schema[`campaign-${product?.id}-discount-value`] = Yup.number('Vui lòng nhập giá trị giảm giá')
                    .nullable()
                    .required('Vui lòng nhập giá trị giảm giá')
                    .min(1, 'Giảm giá phải lớn hơn 0đ')
                    .max(+minPriceVariant - 1, 'Giảm giá phải nhỏ hơn giá bán')
                schema[`campaign-${product?.id}-quantity_per_user_number`] = Yup.number('Vui lòng số lượng sản phẩm')
                    .nullable()
                    .required('Vui lòng số lượng sản phẩm')
                    .min(1, 'Vui lòng cài đặt số lượng sản phẩm lớn hơn 0')
                    .max(+sumSellableStock, 'Vui lòng nhập số lượng sản phẩm nhỏ hơn tồn kho')
                schema[`campaign-${product?.id}-purchase_limit_number`] = Yup.number('Vui lòng nhập số lượng sản phẩm')
                    .nullable()
                    .required('Vui lòng nhập số lượng sản phẩm')
                    .min(1, 'Vui lòng cài đặt số lượng sản phẩm lớn hơn 0')
                    .max(+sumSellableStock, 'Vui lòng nhập số lượng sản phẩm nhỏ hơn tồn kho')
                schema[`campaign-${product?.id}-promotion_price`] = Yup.number('Vui lòng cài đặt giá sau giảm ')
                    .nullable()
                    .required('Vui lòng cài đặt giá sau giảm ')
                    .min(1, 'Vui lòng cài đặt giá sau giảm sản phẩm lớn hơn 0')
                    .max(+minPriceVariant - 1, 'Vui lòng cài đặt giá sau giảm sản phẩm nhỏ hơn giá bán')
            }

            if (product?.itemType == 'variant') {
                (product?.productVariants || []).forEach(variant => {
                    schema[`campaign-${product?.id}-${variant?.id}-discount-percent`] = Yup.number('Vui lòng nhập phần trăm giảm giá')
                        .nullable()
                        .required('Vui lòng nhập phần trăm giảm giá')
                        .min(1, 'Giảm giá phải lớn hơn 0%')
                        .max(99, 'Giảm giá phải nhỏ hơn 100%')
                        .when(`campaign-${product?.id}-${variant?.id}-active`, (isActive, schema) => {
                            if (!isActive) {
                                return Yup.number().notRequired()
                            }
                        })
                    schema[`campaign-${product?.id}-${variant?.id}-discount-value`] = Yup.number('Vui lòng nhập giá trị giảm giá')
                        .nullable()
                        .required('Vui lòng nhập giá trị giảm giá')
                        .min(1, 'Giảm giá phải lớn hơn 0đ')
                        .max(+variant.price - 1, 'Giảm giá phải nhỏ hơn giá bán')
                        .when(`campaign-${product?.id}-${variant?.id}-active`, (isActive, schema) => {
                            if (!isActive) {
                                return Yup.number().notRequired()
                            }
                        })
                    schema[`campaign-${product?.id}-${variant?.id}-quantity_per_user_number`] = Yup.number('Vui lòng số lượng sản phẩm')
                        .nullable()
                        .required('Vui lòng số lượng sản phẩm')
                        .min(1, 'Vui lòng cài đặt số lượng sản phẩm lớn hơn 0')
                        .max(+variant.sellable_stock, 'Vui lòng nhập số lượng sản phẩm nhỏ hơn tồn kho')
                        .when(`campaign-${product?.id}-${variant?.id}-active`, (isActive, schema) => {
                            if (!isActive) {
                                return Yup.number().notRequired()
                            }
                        })
                    schema[`campaign-${product?.id}-${variant?.id}-purchase_limit_number`] = Yup.number('Vui lòng nhập số lượng sản phẩm')
                        .nullable()
                        .required('Vui lòng nhập số lượng sản phẩm')
                        .min(1, 'Vui lòng cài đặt số lượng sản phẩm lớn hơn 0')
                        .max(+variant.sellable_stock, 'Vui lòng nhập số lượng sản phẩm nhỏ hơn tồn kho')
                        .when(`campaign-${product?.id}-${variant?.id}-active`, (isActive, schema) => {
                            if (!isActive) {
                                return Yup.number().notRequired()
                            }
                        })
                    schema[`campaign-${product?.id}-${variant?.id}-promotion_price`] = Yup.number('Vui lòng cài đặt giá sau giảm ')
                        .nullable()
                        .required('Vui lòng cài đặt giá sau giảm ')
                        .min(1, 'Vui lòng cài đặt giá sau giảm sản phẩm lớn hơn 0')
                        .max(+variant.price - 1, 'Vui lòng cài đặt giá sau giảm sản phẩm nhỏ hơn giá bán')
                        .when(`campaign-${product?.id}-${variant?.id}-active`, (isActive, schema) => {
                            if (!isActive) {
                                return Yup.number().notRequired()
                            }
                        })
                })
            }

        });

        setValidateSchema(Yup.object().shape(schema));
    }, [campaignItems, schemaRoot]);

    const addCampaignItemsManual = async ({ infoCampaignItems, type, from }) => {
        let newItems = [];
        const [scProductVariantIds, scProductIds] = [
            infoCampaignItems?.map(item => item?.sc_variant_id)?.filter(item => Boolean(item)),
            infoCampaignItems?.map(item => item?.sc_product_id)?.filter(item => Boolean(item)),
        ];

        if (type == 'product' || from == 'modal' || from == 'template') {
            const scProducts = await queryGetScProducts(scProductIds);

            newItems = scProducts?.map(product => {
                return {
                    ...product,
                    itemType: type,
                    sync_status: 1,
                    productVariants: product?.productVariants?.map(variant => ({
                        ...variant,
                        sync_status: 1
                    }))
                }
            })
        }

        if (type == 'variant' && from != 'template') {
            let variantItems;
            const scProductVariants = await queryGetScProductVariants(scProductVariantIds);

            variantItems = scProductVariants

            const groupedVariantsByProduct = groupBy(variantItems, 'sc_product_id');

            newItems = Object.keys(groupedVariantsByProduct)?.flatMap(key => {
                const product = groupedVariantsByProduct[key]?.[0]?.product;

                return {
                    ...product,
                    itemType: type,
                    sync_status: 1,
                    productVariants: groupedVariantsByProduct[key]?.map(variant => ({
                        ...variant,
                        sync_status: 1
                    }))
                }
            });
        }

        setCampaignItems(prev => prev.concat(newItems)?.slice(0, MAX_CAMPAIGN_ITEMS));
    }

    const buildStateFromCampaignItems = async ({ type, infoCampaign = null, from = "single" }) => {
        let newItems = [];
        let formValues = {};

        const scProductIds = infoCampaign?.campaignItem
            ?.map(item => item?.sc_product_id)
            ?.filter(item => Boolean(item));
        const scProductIdsUniq = [...new Set(scProductIds)];

        const scProducts = await queryGetScProducts(scProductIdsUniq);

        newItems = scProducts?.map(product => {
            const campaignItem = infoCampaign?.campaignItem?.find(item => item?.sc_product_id == product?.id);
            const { id, sync_error_message, sync_status } = campaignItem || {};

            return {
                campaign_item_id: id,
                sync_error_message,
                sync_status,
                itemType: type,
                ...product,
                productVariants: product?.productVariants?.map(variant => {
                    const campaignVariantItem = infoCampaign?.campaignItem?.find(item => item?.sc_variant_id == variant?.id);
                    return {
                        ...variant,
                        ...(type == 'variant' ? {
                            campaign_item_id: campaignVariantItem?.id,
                            sync_error_message: campaignVariantItem?.sync_error_message,
                            sync_status: campaignVariantItem?.sync_status || 1,
                        } : {})
                    }
                })
            }
        });

        if (infoCampaign) {
            const day = Math.floor(infoCampaign?.campaignScheduleFrame?.apply_before_second / (3600 * 24))
            const hour = Math.floor(infoCampaign?.campaignScheduleFrame?.apply_before_second % (3600 * 24) / 3600)
            const minute = Math.floor(infoCampaign?.campaignScheduleFrame?.apply_before_second % 3600 / 60)
            const second = Math.floor(infoCampaign?.campaignScheduleFrame?.apply_before_second % 60)
            formValues = {
                ...formValues,
                id: infoCampaign?.id,
                name: infoCampaign?.name,
                status: infoCampaign?.status,
                store: infoCampaign?.store_id,
                channel: infoCampaign?.connector_channel_code,
                type: TYPE_CAMPAIGN[from == 'template' ? infoCampaign?.campaign_type : infoCampaign?.type],
                typeDiscount: infoCampaign?.discount_type == 1 ? 1 : 2,
                typeItem: infoCampaign?.item_type || 2,
                timeValue: [new Date(infoCampaign?.start_time * 1000), new Date(infoCampaign?.end_time * 1000)],
                on_create_schedule_frame: !!infoCampaign?.on_create_schedule_frame,
                on_create_reserve_ticket: !!infoCampaign?.on_create_reserve_ticket,
                apply_type: APPLY_TYPE_FRAME?.find(type => type?.value == infoCampaign?.campaignScheduleFrame?.apply_type) || APPLY_TYPE_FRAME[0],
                option: OPTIONS_FRAME?.find(op => op?.value == infoCampaign?.campaignScheduleFrame?.option) || OPTIONS_FRAME[1],
                frame: infoCampaign?.frameInfo || null,
                day: day ? { value: day, label: day < 10 ? `0${day}` : day } : null,
                hour: hour ? { value: hour, label: hour < 10 ? `0${hour}` : hour } : null,
                minute: minute ? { value: minute, label: minute < 10 ? `0${minute}` : minute } : null,
                second: second ? { value: second, label: second < 10 ? `0${second}` : second } : null,
            }

            newItems.forEach(product => {
                if (type == 'product') {
                    const campaignItem = infoCampaign?.campaignItem?.find(item => item?.sc_product_id == product?.id);
                    const dataSource = (from == 'template' ? infoCampaign?.campaign_type : infoCampaign?.type) == 1 ? campaignItem?.mktItemDiscount : campaignItem?.mktItemFlashSale;
                    const minPriceVariant = minBy(product?.productVariants || [], 'price')?.price;

                    formValues[`campaign-${product?.id}-discount-value`] = dataSource?.promotion_price ? (minPriceVariant - dataSource?.promotion_price) : minPriceVariant * dataSource?.discount_percent / 100
                    formValues[`campaign-${product?.id}-discount-percent`] = dataSource?.discount_percent ? dataSource?.discount_percent : (minPriceVariant - dataSource?.promotion_price) / minPriceVariant * 100
                    formValues[`campaign-${product?.id}-promotion_price`] = dataSource?.promotion_price ? dataSource?.promotion_price : minPriceVariant * (1 - dataSource?.discount_percent / 100)
                    formValues[`campaign-${product?.id}-purchase_limit`] = dataSource?.promotion_stock ? OPTIONS_TYPE_LIMIT[1] : OPTIONS_TYPE_LIMIT[0]
                    formValues[`campaign-${product?.id}-quantity_per_user`] = dataSource?.purchase_limit ? OPTIONS_TYPE_LIMIT[1] : OPTIONS_TYPE_LIMIT[0]
                    formValues[`campaign-${product?.id}-purchase_limit_number`] = dataSource?.promotion_stock || 1
                    formValues[`campaign-${product?.id}-quantity_per_user_number`] = dataSource?.purchase_limit || 1
                }

                if (type == 'variant') {
                    (product?.productVariants || []).forEach(variant => {
                        const campaignItem = infoCampaign?.campaignItem?.find(item => item?.sc_variant_id == variant?.id);
                        const dataSource = (from == 'template' ? infoCampaign?.campaign_type : infoCampaign?.type) == 1 ? campaignItem?.mktItemDiscount : campaignItem?.mktItemFlashSale;

                        if (!campaignItem) {
                            formValues[`campaign-${product?.id}-${variant?.id}-active`] = false
                            formValues[`campaign-${product?.id}-${variant?.id}-discount-value`] = ''
                            formValues[`campaign-${product?.id}-${variant?.id}-discount-percent`] = ''
                            formValues[`campaign-${product?.id}-${variant?.id}-promotion_price`] = ''
                            formValues[`campaign-${product?.id}-${variant?.id}-purchase_limit`] = OPTIONS_TYPE_LIMIT[0]
                            formValues[`campaign-${product?.id}-${variant?.id}-quantity_per_user`] = OPTIONS_TYPE_LIMIT[0]
                            formValues[`campaign-${product?.id}-${variant?.id}-purchase_limit_number`] = 1
                            formValues[`campaign-${product?.id}-${variant?.id}-quantity_per_user_number`] = 1
                            return;
                        }

                        formValues[`campaign-${product?.id}-${variant?.id}-active`] = variant?.sellable_stock > 0 ? true : false;
                        formValues[`campaign-${product?.id}-${variant?.id}-discount-value`] = dataSource?.promotion_price ? (variant?.price - dataSource?.promotion_price) : variant?.price * dataSource?.discount_percent / 100
                        formValues[`campaign-${product?.id}-${variant?.id}-discount-percent`] = dataSource?.discount_percent ? dataSource?.discount_percent : (variant?.price - dataSource?.promotion_price) / variant?.price * 100
                        formValues[`campaign-${product?.id}-${variant?.id}-promotion_price`] = dataSource?.promotion_price ? dataSource?.promotion_price : variant?.price * (1 - dataSource?.discount_percent / 100)
                        formValues[`campaign-${product?.id}-${variant?.id}-purchase_limit`] = dataSource?.promotion_stock ? OPTIONS_TYPE_LIMIT[1] : OPTIONS_TYPE_LIMIT[0]
                        formValues[`campaign-${product?.id}-${variant?.id}-quantity_per_user`] = dataSource?.purchase_limit ? OPTIONS_TYPE_LIMIT[1] : OPTIONS_TYPE_LIMIT[0]
                        formValues[`campaign-${product?.id}-${variant?.id}-purchase_limit_number`] = dataSource?.promotion_stock || 1
                        formValues[`campaign-${product?.id}-${variant?.id}-quantity_per_user_number`] = dataSource?.purchase_limit || 1
                    })
                }
            });

            setInitialValues(prev => ({ ...prev, ...formValues }));
        }

        setCampaignItems(newItems?.slice(0, MAX_CAMPAIGN_ITEMS));
    };

    const values = useMemo(() => {
        return {
            initialValues, validateSchema, setInitialValues, queryVariables, storeOptions, addCampaignItemsManual,
            buildStateFromCampaignItems, campaignItems, channelCampaign, paramsQuery, setCampaignItems
        }
    }, [initialValues, validateSchema, queryVariables, buildStateFromCampaignItems, campaignItems, channelCampaign, paramsQuery, addCampaignItemsManual]);

    return (
        <MarketingContext.Provider value={values}>
            {children}
        </MarketingContext.Provider>
    )
}