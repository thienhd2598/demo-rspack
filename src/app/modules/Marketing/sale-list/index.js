import React, { memo, useCallback, useMemo, useState, useEffect, useLayoutEffect, useRef } from "react";
import { useHistory, useLocation } from "react-router-dom";
import {
    Card,
    CardBody,
} from "../../../../_metronic/_partials/controls";
import queryString from 'querystring';
import Filter from "./Filter";
import Table from "./Table";
import { toAbsoluteUrl } from "../../../../_metronic/_helpers";
import SVG from "react-inlinesvg";
import { Helmet } from 'react-helmet-async';
import { useSubheader } from "../../../../_metronic/layout";
import _, { omit } from "lodash";
import { useToasts } from "react-toast-notifications";
import query_sc_stores_basic from "../../../../graphql/query_sc_stores_basic";
import { useIntl } from 'react-intl'
import { useMutation, useQuery } from "@apollo/client";
import { useSelector } from 'react-redux';
import query_mktListCampaign from "../../../../graphql/query_mktListCampaign";
import dayjs from "dayjs";
import { TABS_CAMPAIGN } from "../Constants";
import query_mktListCampaignTemplate from "../../../../graphql/query_mktListCampaignTemplate";
import CampaignTemplateTable from "./CampaignTemplateTable";
const filterType = [
    {
        label: 'Chương trình khuyến mãi chiết khấu',
        value: [1]
    },
    {
        label: 'Chương trình khuyến mãi  FlashSale',
        value: [2]
    },
    {
        label: 'Chương trình khác',
        value: [10]
    },
    {
        label: 'Mã giảm giá',
        value: [20, 21, 25, 26, 22, 23, 24]
    },
    {
        label: 'Chương trình quà tặng',
        value: [30]
    },
]
export default memo(() => {
    const params = queryString.parse(useLocation().search.slice(1, 100000));
    const { setBreadcrumbs } = useSubheader()
    const history = useHistory();

    const [searchType, setSearchType] = useState(params?.search_type || "ref_order_id");
    const { addToast } = useToasts();
    const [valueRangeTime, setValueRangeTime] = useState([]);    
    // const refInput = useRef(null);
    const { formatMessage } = useIntl()

    const user = useSelector((state) => state.auth.user);


    useLayoutEffect(() => {
        setBreadcrumbs([{ title: formatMessage({ defaultMessage: 'Chương trình khuyến mãi' }) }])
    }, []);

    // useEffect(() => {  
    //     history.push(`/marketing/sale-list?${queryString.stringify({ ...params })}`)
    //   }, []);

    const { data: dataStore, loading: loadingStore } = useQuery(query_sc_stores_basic, {
        fetchPolicy: "cache-and-network",
    });

    // ====================== varibales ========================
    const list_channel_code = useMemo(() => {
        try {
            if (!params?.channels) return { list_channel_code: [] }


            return { list_channel_code: params?.channels?.split(',')?.map(channel => channel) }
        } catch (error) {
            return {}
        }
    }, [params?.channels]);

    console.log({ list_channel_code })

    const list_store_id = useMemo(() => {
        try {
            if (!params?.stores) return { list_store_id: [] }
            return { list_store_id: params?.stores?.split(',')?.map(store => +store) }

        } catch (error) {
            return {}
        }
    }, [params?.stores]);

    const start_time = useMemo(() => {
        if (!params?.gt) return null;
        return +params?.gt
    }, [params?.gt]);

    const search_keyword = useMemo(() => {
        if (!params?.q) return null;
        return params?.q
    }, [params?.q]);

    const end_time = useMemo(() => {
        if (!params?.lt) return null;
        return +params?.lt
    }, [params?.lt]);

    const list_status = useMemo(() => {
        if (!params?.type) return [];
        if (params?.type == 'pending') {
            return [1]
        } else {
            return [2]
        }
    }, [params?.type]);

    const list_sub_status = useMemo(() => {
        if (!params?.type) return [];
        if (params?.type == 'pending') {
            return []
        } else {
            return params?.type?.split(',')
        }
    }, [params?.type]);

    const list_type = useMemo(() => {
        if (!params?.typesFilter) return [];
        return params?.typesFilter?.split(',').map(item => +item)
    }, [params?.typesFilter]);

    const [currentChannels, channelsActive, currentStores, optionsStores, currentTypes] = useMemo(() => {
        const channels = dataStore?.op_connector_channels
        const stores = dataStore?.sc_stores
        const channelsActive = channels?.filter(store => ({ channelsActive: stores?.some(sa => sa?.connector_channel_code === store?.code) }));
        let _optionsChannel = channelsActive?.filter(cn => cn?.code != 'other')?.map(_channel => ({
            label: _channel?.name,
            logo: _channel?.logo_asset_url,
            value: _channel?.code
        })) || [];

        let _currentChannel = !!params?.channels ? _optionsChannel?.filter(_channel => !!_channel?.value && params?.channels?.split(',').some(_param => _param == _channel.value)) : [];

        let _optionsStores = stores
            ?.filter(_store => _currentChannel?.length == 0 || _currentChannel?.some(cn => cn?.value == _store?.connector_channel_code))
            ?.map(_store => {
                const channel = _optionsChannel?.find(cn => cn?.value == _store?.connector_channel_code);
                return {
                    label: _store?.name,
                    logo: channel?.logo,
                    value: _store?.id,
                    channel: channel?.value
                }
            })
        let _currentStores = !!params?.stores
            ? _optionsStores?.filter(_stores => !!_stores?.value && params?.stores?.split(',').some(_param => _param == _stores.value))
            : [];
        let _currentTypes = !!params?.typesFilter ? filterType?.filter(type => {
            const listParamsType = params?.typesFilter?.split(',')?.map(item => +item)
            return listParamsType?.includes(type?.value?.[0])
        }) : [];

        console.log({ _currentTypes })

        return [_currentChannel, _optionsChannel, _currentStores, _optionsStores, _currentTypes];
    }, [dataStore, params.stores, params.channels, params.typesFilter]);

    let whereCondition = useMemo(() => {
        return {
            ...list_channel_code,
            ...list_store_id,
            list_status,
            list_sub_status,
            start_time,
            end_time,
            search_keyword,
            list_type
        }
    }, [list_channel_code, list_store_id, start_time, end_time, search_keyword, list_status, list_sub_status, list_type]);

    const page = useMemo(() => {
        try {
            let _page = Number(params.page);
            if (!Number.isNaN(_page)) {
                return Math.max(1, _page)
            } else {
                return 1
            }
        } catch (error) {
            return 1;
        }
    }, [params.page]);

    const limit = useMemo(() => {
        try {
            let _value = Number(params.limit)
            if (!Number.isNaN(_value)) {
                return Math.max(25, _value)
            } else {
                return 25
            }
        } catch (error) {
            return 25
        }
    }, [params.limit]);

    return (
        <Card>
            <Helmet titleTemplate={'UB - ' + formatMessage({ defaultMessage: "Chương trình khuyến mãi" })} defaultTitle={'UB - ' + formatMessage({ defaultMessage: "Chương trình khuyến mãi" })}>
                <meta name="description" content={'UB - ' + formatMessage({ defaultMessage: "Chương trình khuyến mãi" })} />
            </Helmet>

            <CardBody>
                <div style={{ flex: 1 }} className="mb-4" >
                    <ul className="nav nav-tabs">
                        {TABS_CAMPAIGN.map((tab, index) => {
                            const { title, type } = tab;
                            const isActive = type == (params?.typeCampaign || 'single')
                            return (
                                <li
                                    key={`tab-order-${index}`}
                                    className="nav-item"
                                >
                                    <a className={`nav-link font-weight-normal ${isActive ? 'active' : ''} fs-16`}
                                        onClick={e => {
                                            e.preventDefault();
                                            // refInput.current.value = "";
                                            history.push(`/marketing/sale-list?${queryString.stringify(
                                                { page: 1, typeCampaign: type, }
                                            )}`)
                                        }}
                                    >
                                        {title}
                                    </a>
                                </li>
                            )
                        })}
                    </ul>
                </div>
                <Filter                    
                    valueRangeTime={valueRangeTime}
                    setValueRangeTime={setValueRangeTime}
                    whereCondition={whereCondition}
                    dataFilterStoreChannel={{ currentChannels, channelsActive, currentStores, optionsStores, loadingStore, currentTypes, filterType }}
                />
                {(params?.typeCampaign == 'single' || !params?.typeCampaign) && <Table
                    limit={limit}
                    page={page}                    
                    variables={{
                        page,
                        per_page: limit,
                        search: whereCondition,
                        order_by: 'updated_at',
                        order_by_type: 'desc'
                    }}
                    data
                />}
                {params?.typeCampaign == 'template' && <CampaignTemplateTable
                    limit={limit}
                    page={page}
                    whereCondition={whereCondition}
                    dataStore={dataStore?.sc_stores}
                    dataChannel={dataStore?.op_connector_channels}
                />}
            </CardBody>
            <div
                id="kt_scrolltop1"
                className="scrolltop"
                style={{ bottom: 80 }}
                onClick={() => {
                    window.scrollTo({
                        letf: 0,
                        top: document.body.scrollHeight,
                        behavior: 'smooth'
                    });
                }}
            >
                <span className="svg-icon">
                    <SVG src={toAbsoluteUrl("/media/svg/icons/Navigation/Down-2.svg")} title={' '}></SVG>
                </span>
            </div>
        </Card>
    )
});

export const actionKeys = {
    "marketing_list_view": {
        router: '/marketing/sale-list',
        actions: ["sc_stores", "mktListCampaign", "mktCampaignAggregate", "op_connector_channels",
            "mktFindCampaign", "scGetProductVariantByIds", "scGetProductVariants", "mktLoadCampaign"
        ],
        name: 'Danh sách chương trình khuyến mại',
        group_code: 'marketing_campaign',
        group_name: 'Chương trình khuyến mãi',
        cate_code: 'marketing_service',
        cate_name: 'E - Marketing'
    },
    "marketing_list_update": {
        router: '/marketing/sale-list',
        actions: [
            "mktDeleteCampaign",
            "mktListCampaign",
            "mktCampaignAggregate",
            "mktEndCampaign",
            'mktFindCampaign',
            "mktRetryCampaignItem",
            "mktSaveCampaign",
            "scGetProductVariantByIds"
        ],
        name: 'Thao tác chương trình',
        group_code: 'marketing_campaign',
        group_name: 'Chương trình khuyến mãi',
        cate_code: 'marketing_service',
        cate_name: 'E - Marketing'
    },
    "marketing_list_approved": {
        router: '/marketing/sale-list',
        actions: ["mktApprovedCampaign", "mktListCampaign", "mktCampaignAggregate", "mktSaveCampaign"],
        name: 'Duyệt chương trình',
        group_code: 'marketing_campaign',
        group_name: 'Chương trình khuyến mãi',
        cate_code: 'marketing_service',
        cate_name: 'E - Marketing'
    }
};
