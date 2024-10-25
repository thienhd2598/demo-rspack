import React, { memo, useCallback, useMemo, useState, useEffect, useLayoutEffect } from "react";
import {
    Card,
    CardBody,
    CardHeader
} from "../../../../_metronic/_partials/controls";
import queryString from 'querystring';
import { useHistory, useLocation } from 'react-router-dom';
import OrderFilter from "./filter/OrderFilter";
import OrderTable from "./OrderTable";
import { toAbsoluteUrl } from "../../../../_metronic/_helpers";
import SVG from "react-inlinesvg";
import { Helmet } from 'react-helmet-async';
import { useSubheader } from "../../../../_metronic/layout";
import _ from "lodash";
import mutate_coReloadOrder from "../../../../graphql/mutate_coReloadOrder";
import { useToasts } from "react-toast-notifications";
import { useMutation, useQuery } from "@apollo/client";
import LoadingDialog from "../../ProductsStore/product-new/LoadingDialog";
import OrderReturnTabs from "../refund-order/OrderRefundTabs";
import { OPTIONS_SOURCE_ORDER, STATUS_FAIL_DELIVERY_ORDER } from "../OrderUIHelpers";
import { useIntl } from "react-intl";
import query_sc_stores_basic from "../../../../graphql/query_sc_stores_basic";
import dayjs from "dayjs";
import query_sme_catalog_stores from "../../../../graphql/query_sme_catalog_stores";

export default memo(() => {
    const { formatMessage } = useIntl()
    const params = queryString.parse(useLocation().search.slice(1, 100000));
    const currentChannel = params?.channel || '';
    const { setBreadcrumbs } = useSubheader()
    const [loading, setLoading] = useState(false)
    const [valueRangeTime, setValueRangeTime] = useState(null);
    const { addToast } = useToasts();


    useLayoutEffect(() => {
        setBreadcrumbs([
            {
                title: formatMessage({ defaultMessage: 'Xử lý trả hàng' }),
            },
        ])
    }, []);
    const [ids, setIds] = useState([]);
    const [searchType, setSearchType] = useState();

    useMemo(() => {
        if (!!params?.is_old_order) {
            setValueRangeTime([
                new Date(dayjs().subtract(119, "day").startOf("day")),
                new Date(dayjs().subtract(90, "day").endOf("day")),
            ]);
        } else {
            setValueRangeTime(null);
        }
    }, [params?.is_old_order]);

    const range_time = useMemo(
        () => {
            try {
                if (!params.gt || !params.lt) {
                    if (valueRangeTime?.length > 0 && !!params?.is_old_order) {
                        return {
                            range_time: [
                                dayjs().subtract(119, "day").startOf("day").unix(),
                                dayjs().subtract(90, "day").endOf("day").unix()
                            ]
                        }
                    } else {
                        return {}
                    }
                };

                return {
                    range_time: [
                        Number(params?.gt),
                        Number(params?.lt)
                    ]
                }
            } catch (error) {
                return {}
            }
        }, [params?.gt, params?.lt, params?.is_old_order, valueRangeTime]
    );

    const list_warehouse_import = useMemo(() => {
        if (!params.processed_warehouse) return [];
        return {
          list_warehouse_import: params.processed_warehouse?.split(',')?.map(wh => +wh)
        }
      }, [params.processed_warehouse]);

    const q = useMemo(
        () => {
            setSearchType(params.search_type)
            return params.q
        }, [params.q]
    );

    const stores = useMemo(() => {
            if (!params.stores) return {};
            return {
                list_store: params.stores?.split(',').map(function (x) {
                    return parseInt(x);
                })
            }
        }, [params.stores]);

    const channel = useMemo(() => {
        if (!params.channel) return {};
        return { connector_channel_code: params.channel?.split(',') }
    }, [params.channel]);



    const logistic_fail = useMemo(
        () => {
            if (!params.logistic_fail) return STATUS_FAIL_DELIVERY_ORDER[0].status;
            return params.logistic_fail
        }, [params.logistic_fail]
    );

    const payments = useMemo(
        () => {
            if (!params.payments) return {};
            return { payments: params.payments?.split(',') }
        }, [params.payments]
    );

    const filter_map_sme = useMemo(
        () => {
            if (!params.filter_map_sme) return {};
            return { filter_map_sme: Number(params.filter_map_sme) }
        }, [params.filter_map_sme]
    );

    const list_source = useMemo(
        () => {
            if (!params.list_source) return {};

            return { list_source: params.list_source?.split(',') }
        }, [params.list_source]
    );

    const is_old_order = useMemo(() => {
        if (!params.is_old_order) return {};

        return { is_old_order: Number(params?.is_old_order) }
    }, [params.is_old_order]);

    const return_process_status = useMemo(
        () => {
            if (!params.return_process_status) return null;
            return { return_process_status: params.return_process_status };
        }, [params.return_process_status]
    );

    const import_type = useMemo(
        () => {
            if (!params?.import_type) return {};
            return { import_type: params?.import_type?.split(',')?.map(type => Number(type)) }
        }, [params?.import_type]
    );
    const search_type = useMemo(
        () => {
            let _search_type = params.search_type
            if (q) {
                setSearchType(_search_type)
            }
        }, [params.search_type]
    );

    const searchTypeDate = useMemo(() => {
        if (!params?.gt || !params?.lt) return null
        if (!params?.search_type_date) {
            return "order_at"
        }

        return params?.search_type_date
    }, [params?.search_type_date, params?.gt, params?.lt])


    let whereCondition = useMemo(
        () => {
            setIds([])
            return {
                logistic_fail: logistic_fail ? [logistic_fail] : [],
                ...range_time,
                ...payments,
                ...list_warehouse_import,
                ...filter_map_sme,
                ...stores,
                q: q,
                search_type: searchType ?? 'ref_order_id',
                search_time_type: searchTypeDate ?? 'order_at',
                ...channel,
                is_connected: 1,
                ...is_old_order,
                ...import_type,
                ...return_process_status,
                ...list_source
            }
        }, [logistic_fail,list_warehouse_import, return_process_status, stores, currentChannel, range_time, q, searchType, payments, return_process_status, import_type, searchTypeDate, filter_map_sme, is_old_order, list_source]
    );
    const { data: dataWarehouse } = useQuery(query_sme_catalog_stores, {
        fetchPolicy: "cache-and-network",
    });
    const { data: dataStore, loading: loadingStore } = useQuery(query_sc_stores_basic, {
        fetchPolicy: 'cache-and-network',
        variables: { context: 'order' }
    });

    const [mutate, { loading: loadingCoReloadOrder }] = useMutation(mutate_coReloadOrder, {
        awaitRefetchQueries: true,
        refetchQueries: ['scGetFailDeliveryOrders'],
        onCompleted: () => {
            setIds([]);
        }
    });

    const coReloadOrder = async (idsOrder) => {
        let variables = {
            list_sc_order_id: idsOrder,
        }

        let { data } = await mutate({
            variables: variables
        })
        if (data?.coReloadOrder?.success) {
            addToast(formatMessage({ defaultMessage: 'Đơn hàng tải lại thành công' }), { appearance: 'success' });
        } else {
            addToast(formatMessage({ defaultMessage: 'Đơn hàng tải lại thất bại' }), { appearance: 'error' });
        }
    }

    const pxSticky = useMemo(
        () => {
            if (['packing', 'pending', 'connector_channel_error', 'warehouse_error_code'].includes(params.type)) {
                return 45
            }
            return 0

        }, [params.type]
    );

    const [currentChannels, channelsActive, currentStores, optionsStores] = useMemo(() => {
        const channels = dataStore?.op_connector_channels
        const stores = dataStore?.sc_stores
        const channelsActive = channels?.filter(store => ({channelsActive: stores?.some(sa => sa?.connector_channel_code === store?.code)}));
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
    }, [dataStore, params.stores, params.channel]);


    return (
        <Card>
            <Helmet
                titleTemplate={formatMessage({ defaultMessage: 'Xử lý trả hàng' }) + " - UpBase"}
                defaultTitle={formatMessage({ defaultMessage: 'Xử lý trả hàng' }) + " - UpBase"}
            >
                <meta name="description" content={formatMessage({ defaultMessage: 'Xử lý trả hàng' }) + " - UpBase"} />
            </Helmet>

            {<LoadingDialog show={loading || loadingCoReloadOrder} />}

            <CardBody>
                <OrderReturnTabs
                />
                <OrderFilter dataWarehouse={dataWarehouse?.sme_warehouses || []} channelAndStores={{currentChannels, channelsActive, currentStores, optionsStores, loadingStore}} valueRangeTime={valueRangeTime} setValueRangeTime={setValueRangeTime} ids={ids} whereCondition={whereCondition} coReloadOrder={coReloadOrder} pxSticky={pxSticky} dataStore={dataStore} loadingStore={loadingStore} />
                <OrderTable ids={ids} setIds={setIds} whereCondition={whereCondition} coReloadOrder={coReloadOrder} pxSticky={pxSticky} dataStore={dataStore} loadingStore={loadingStore} />
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
                </span>{" "}
            </div>
        </Card>
    )
});
