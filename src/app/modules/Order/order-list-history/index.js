import React, { memo, useCallback, useMemo, useState, useEffect, useLayoutEffect } from "react";
import {
    Card,
    CardBody,
    CardHeader
} from "../../../../_metronic/_partials/controls";
import queryString from 'querystring';
import { useLocation } from 'react-router-dom';
import OrderFilter from "./filter/OrderFilter";
import OrderTable from "./OrderTable";
import { toAbsoluteUrl } from "../../../../_metronic/_helpers";
import SVG from "react-inlinesvg";
import { Helmet } from 'react-helmet-async';
import { useSubheader } from "../../../../_metronic/layout";
import {  useQuery } from "@apollo/client";
import { useIntl } from 'react-intl'
import dayjs from "dayjs";
import query_sme_catalog_stores from "../../../../graphql/query_sme_catalog_stores";
import query_scGetWarehouses from "../../../../graphql/query_scGetWarehouses";
import query_sc_stores_basic from "../../../../graphql/query_sc_stores_basic";
import query_scGetPackages from "../../../../graphql/query_scGetPackages";
import { queryGetSmeProductVariants } from "../OrderUIHelpers";

export default memo(() => {
    const params = queryString.parse(useLocation().search.slice(1, 100000));
    const currentChannel = params?.channel || '';
    const { setBreadcrumbs } = useSubheader()
    const { formatMessage } = useIntl()
    const [loadingSmeVariant, setLoadingSmeVariant] = useState(false);
    const [smeVariants, setSmeVariants] = useState([]);
    const [typeSearchTime, setTypeSearchTime] = useState('order_at');
    const [valueRangeTime, setValueRangeTime] = useState([
        new Date(dayjs().subtract(29, "day").startOf("day")),
        new Date(dayjs().startOf("day")),
    ]);

    useLayoutEffect(() => {
        setBreadcrumbs([
            {
                title: formatMessage({ defaultMessage: 'Lịch sử đơn hàng' }),
            },
        ])
    }, []);

    const [ids, setIds] = useState([]);
    const [searchType, setSearchType] = useState();

    const { data: dataScWareHouse, loading: loadingScWarehouse } = useQuery(query_scGetWarehouses, {
        fetchPolicy: 'cache-and-network'
    });



    const { data: dataSmeWarehouse } = useQuery(query_sme_catalog_stores, {
        fetchPolicy: 'cache-and-network'
    });

    const { data: dataStore, loading: loadingStore } = useQuery(query_sc_stores_basic, {
        variables: {
            context: 'order'
        },
        fetchPolicy: "cache-and-network",
    });

 
    const [currentChannels, channelsActive, currentStores, optionsStores] = useMemo(() => {
            const channels = dataStore?.op_connector_channels
            const stores = dataStore?.sc_stores
            const channelsActive = channels?.filter(store => {
                return {
                    channelsActive: stores?.some(sa => sa?.connector_channel_code === store?.code)
                }
            });
            let _optionsChannel = channelsActive?.map(_channel => ({
                label: _channel?.name,
                logo: _channel?.logo_asset_url,
                value: _channel?.code
            })) || [];

            let __optionsStores = stores?.flatMap(_store => {
                const channelParams = params?.channel ? params?.channel?.split(',') : null
                const channel = _optionsChannel?.find(cn => cn?.value == _store?.connector_channel_code)
                if (!channelParams) {

                    return {
                        label: _store?.name,
                        logo: channel?.logo,
                        value: _store?.id,
                        channel: channel?.value
                    }
                }
                if (channelParams?.includes(_store?.connector_channel_code)) {
                    return {
                        label: _store?.name,
                        logo: channel?.logo,
                        value: _store?.id,
                        channel: channel?.value
                    }
                }
                return []
            })

            let _currentChannel = !!params?.channel ? _optionsChannel?.filter(_channel => !!_channel?.value && params?.channel?.split(',').some(_param => _param == _channel.value)) : [];
            let _currentStores = !!params?.stores ? __optionsStores?.filter(_stores => !!_stores?.value && params?.stores?.split(',').some(_param => _param == _stores.value)) : [];

            return [_currentChannel, _optionsChannel, _currentStores, __optionsStores];
        }, [dataStore, params.stores, params.channel]
    );


    const status = useMemo(() => {
        try {
            if (!params.type) return { list_status: [] }

            if (params?.type == "NONE_MAP_WAREHOUSE") {
                return { filter_need_map_warehouse: 1, list_status: [] }
            } else {
                return { list_status: [params?.type] }
            }
        } catch (error) {
            return {}
        }
    }, [params.type]);

    const list_after_sale_type = useMemo(() => {
        if (!params.after_sale_type) return {};
        return { list_after_sale_type: params.after_sale_type?.split('$')?.map(v => +v) }
    }, [params.after_sale_type])


    const range_time = useMemo(() => {
        try {
            if (!params.gt || !params.lt) {
                if (valueRangeTime?.length > 0) {
                    return [
                        dayjs().subtract(119, "day").startOf("day").unix(),
                        dayjs().subtract(90, "day").endOf("day").unix()
                    ]
                } else {
                    return []
                }
            };

            return [
                Number(params?.gt),
                Number(params?.lt)
            ]

        } catch (error) {
            return {}
        }
        }, [params?.gt, params?.lt, valueRangeTime]);

    const q = useMemo(() => {
        setSearchType(params.search_type)
        return params.q
    }, [params.q]);

    const stores = useMemo(() => {
        if (!params.stores) return [];
        return {
            list_store: params.stores?.split(',')?.map(store => +store)
        }
    }, [params.stores]);

    const channel = useMemo(() => {
        if (!params.channel) return {};
        return { connector_channel_code: params.channel?.split(',') }
    }, [params.channel]);

    const shipping_unit = useMemo(() => {
        if (!params.shipping_unit) return [];
        return { shipping_unit: params.shipping_unit?.split('$') }
    }, [params.shipping_unit]);

    const payments = useMemo(() => {
        if (!params.payments) return [];
        return { payments: params.payments?.split(',') }
        }, [params.payments]);

    const list_source = useMemo(() => {
        if (!params.list_source) return {};
        return { list_source: params.list_source?.split(',') }
        }, [params.list_source]);

    const filter_map_sme = useMemo(() => {
        if (!params.filter_map_sme) return {};
        return { filter_map_sme: Number(params.filter_map_sme) }
        }, [params.filter_map_sme]);    

    const warehouse_filter = useMemo(() => {
        return {
            warehouse_filer: !!params?.warehouse_filter ? Number(params?.warehouse_filter) : 2
        }
    }, [params?.warehouse_filter]);

    const warehouse_id = useMemo(() => {
        if (!params?.warehouse_id) return {};
        return {
            warehouse_id: Number(params?.warehouse_id)
        }
    }, [params?.warehouse_id]);

    const type_parcel = useMemo(() => {
        if (!params.type_parcel) return {};
        return {
            type_parcel: params.type_parcel?.split(',')?.filter(type => type != 5).map(function (x) {
                return parseInt(x);
            })
        }
    }, [params.type_parcel]
    );

    const have_sme_note = useMemo(() => {
        try {
            if (!params.type_parcel?.split(',')?.find(type => type == 5)) return {};
            return { have_sme_note: 1 };
        } catch (error) {
            return {};
        }
    }, [params.type_parcel]);

    const print_status = useMemo(() => {
            if (!params.print_status) return {};
            return { print_status: params.print_status?.split(',') }
    }, [params.print_status]);
    
    const chooseTime = () => {
        if (typeSearchTime == 'order_at') {
            return { range_time: [...range_time] }
        }
        if (typeSearchTime == 'paid_at') {
            return { paid_at: [...range_time] }
        }
        if (typeSearchTime == 'shipped_at') {
            return { shipped_at: [...range_time] }
        }
        return {}
    }
    let whereCondition = useMemo(() => {
        setIds([])
        return {
            ...status,
            ...list_source,
            ...shipping_unit,
            ...payments,
            is_old_package: 1,
            ...list_after_sale_type,
            ...filter_map_sme,
            ...type_parcel,
            ...print_status,
            ...stores,
            ...warehouse_filter,
            ...warehouse_id,
            ...have_sme_note,
            q: q,
            search_type: searchType ?? 'ref_order_id',
            ...channel,
            is_connected: 1,
            ...chooseTime(),
        }
        }, [
        list_after_sale_type,
        params?.search_time_type, status,stores, currentChannel,range_time,
        q,
        searchType,
        shipping_unit,
        payments,
        filter_map_sme,
        type_parcel,
        print_status,
        warehouse_filter,
        warehouse_id,
        have_sme_note,
        list_source
    ]
    );

    const pxSticky = useMemo(() => {
            if (['packing', 'pending', 'connector_channel_error', 'warehouse_error_code'].includes(params.type)) {
                return 45
            }
            return 0

        }, [params.type]);

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

    const { data, loading: loadingGetPacks, error, refetch: refetchGetPacks } = useQuery(query_scGetPackages, {
        variables: {
            per_page: limit,
            page: page,
            search: whereCondition,
            context: 'order',
            order_by: 'order_at',
            order_by_type: 'desc'
        },
        fetchPolicy: 'cache-and-network',
        onCompleted: async (data) => {
            setLoadingSmeVariant(true);
            const smeVariants = await queryGetSmeProductVariants(data?.scGetPackages?.flatMap(order => order?.orderItems?.map(item => item?.sme_variant_id)));            
            
            setLoadingSmeVariant(false);
            setSmeVariants(smeVariants);
        }
    });

    return (
        <Card>
            <Helmet
                titleTemplate={formatMessage({ defaultMessage: "Lịch sử đơn hàng" }) + ' - UpBase'}
                defaultTitle={formatMessage({ defaultMessage: "Lịch sử đơn hàng" }) + ' - UpBase'}
            >
                <meta name="description" content={formatMessage({ defaultMessage: "Lịch sử đơn hàng" }) + ' - UpBase'} />
            </Helmet>

            <CardBody>
                <OrderFilter
                    setTypeSearchTime={setTypeSearchTime}
                    typeSearchTime={typeSearchTime}
                    dataStore={dataStore}
                    loadingStore={loadingStore}
                    storesAndChannel={{ currentChannels, channelsActive, currentStores, optionsStores }}
                    ids={ids}
                    valueRangeTime={valueRangeTime}
                    setValueRangeTime={setValueRangeTime}
                    loadingScWarehouse={loadingScWarehouse}
                    dataSmeWarehouse={dataSmeWarehouse}
                    dataScWareHouse={dataScWareHouse}
                    chooseTime={chooseTime}
                    whereCondition={whereCondition}
                    refetchGetOrders={refetchGetPacks}
                    pxSticky={pxSticky} />
                <OrderTable
                    ids={ids}
                    setIds={setIds}
                    data={data}
                    loading={loadingGetPacks}
                    loadingSmeVariant={loadingSmeVariant}
                    dataSmeWarehouse={dataSmeWarehouse}
                    dataScWareHouse={dataScWareHouse}
                    error={error}
                    refetch={refetchGetPacks}
                    page={page}
                    limit={limit}
                    smeVariants={smeVariants}
                    pxSticky={pxSticky}
                />
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
    "order_list_history_view": {
        router: '/orders/list-history',
        actions: ["scGetWarehouses", "scGetPackages", "scPackageAggregate", "sc_stores", "op_connector_channels", "sme_warehouses", "coGetShippingCarrierFromListPackage", "coGetPaymentMethodFromListPackage", "scExportOrder", "scExportOrderAggregate", "scGetJobTrackingExportOrder"],
        name: 'Lịch sử',
        group_code: 'order_list_history',
        group_name: 'Lịch sử',
        cate_code: 'order_service',
        cate_name: 'Quản lý đơn hàng',
    }
};