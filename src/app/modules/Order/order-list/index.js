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
import query_scGetOrders from "../../../../graphql/query_scGetOrders";
import query_scGetPackages from "../../../../graphql/query_scGetPackages";
import { useIntl } from 'react-intl'
import dayjs from "dayjs";
import query_sme_catalog_stores from "../../../../graphql/query_sme_catalog_stores";
import query_scGetWarehouses from "../../../../graphql/query_scGetWarehouses";
import query_listOrderCheckingQuantity from "../../../../graphql/query_listOrderCheckingQuantity";
import query_sc_stores_basic from "../../../../graphql/query_sc_stores_basic";
import mutate_approveManualOrder from "../../../../graphql/mutate_approveManualOrder";
import mutate_cancelManualOrder from "../../../../graphql/mutate_cancelManualOrder";
import ModalTrackingNumber from "../dialog/ModalTrackingNumber";
import mutate_coPreparePackage from "../../../../graphql/mutate_coPreparePackage";
import AddSmeNoteOrderDialog from "./AddSmeNoteOrderDialog";
import ModalConfirmDelivery from "../dialog/ModalConfirmDelivery";
import ModalConfirmCancel from "../dialog/ModalConfirmCancel";
import mutate_shipPackageManualOrder from "../../../../graphql/mutate_shipPackageManualOrder";
import { OPTIONS_SOURCE_ORDER, queryGetSmeProductVariants } from "../OrderUIHelpers";
import ModalResultMutiple from "../dialog/ModalResultMutiple";
import ModalDisconnectStore from "../dialog/ModalDisconnectStore";
import mutate_coRetryShipPackage from "../../../../graphql/mutate_coRetryShipPackage";
import mutate_coReloadOrderShipmentParam from "../../../../graphql/mutate_coReloadOrderShipmentParam";
import mutate_coHandleBuyerCancellationPackage from "../../../../graphql/mutate_coHandleBuyerCancellationPackage";
import mutate_coRetryWarehouseActionMultiPackage from "../../../../graphql/mutate_coRetryWarehouseActionMultiPackage";

export default memo(() => {
    const params = queryString.parse(useLocation().search.slice(1, 100000));
    const currentChannel = params?.channel || '';
    const { setBreadcrumbs } = useSubheader()
    const [loading, setLoading] = useState(false)
    const { addToast } = useToasts();
    const { formatMessage } = useIntl()
    const [currentOrderUpdate, setCurrentOrderUpdate] = useState(null);
    const [currentOrderDelivery, setCurrentOrderDelivery] = useState(null);
    const [currentOrderCancel, setCurrentOrderCancel] = useState(false);
    const [loadingSmeVariant, setLoadingSmeVariant] = useState(false);
    const [smeVariants, setSmeVariants] = useState([]);
    const [dataResults, setDataResults] = useState(null);
    const [isActionMutilple, setIsActionMutiple] = useState(false);
    const [typeSearchTime, setTypeSearchTime] = useState('order_at');
    const [storeDisconnect, setStoreDisconnect] = useState()
    const [valueRangeTime, setValueRangeTime] = useState([
        new Date(dayjs().subtract(29, "day").startOf("day")),
        new Date(dayjs().startOf("day")),
    ]);

    useLayoutEffect(() => {
        setBreadcrumbs([
            {
                title: formatMessage({ defaultMessage: 'Tất cả đơn hàng' }),
            },
        ])
    }, []);

    const [ids, setIds] = useState([]);
    const [searchType, setSearchType] = useState();
    const [dataSmeNote, setDataSmeNote] = useState()
    console.log('ids', ids)
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

    const { data: dataListOrderCheckingQuantity, loading: loadingListOrderCheckingQuantity, refetch } = useQuery(query_listOrderCheckingQuantity, {
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

    const listOrderCheckingQuantity = useMemo(() => {
        return dataListOrderCheckingQuantity?.listOrderCheckingQuantity?.map(item => {
            const channelDetail = dataStore?.op_connector_channels?.find(cn => cn?.code == item?.connector_channel_code)
            const storeDetail = dataStore?.sc_stores?.find(store => store?.id == item?.store_id)
            return {
                ...item,
                img: channelDetail?.logo_asset_url,
                name: storeDetail?.name,
                ref_shop_id: storeDetail?.ref_shop_id
            }
        })
    }, [dataStore, dataListOrderCheckingQuantity])

    const [mutate] = useMutation(mutate_coReloadOrder, {
        awaitRefetchQueries: true,
        refetchQueries: ['scGetPackages', 'scPackageAggregate'],
        onCompleted: (data) => {
            setIds([])
        }
    })

    const [mutateApprovedManualOrder, { loading: loadingApprovedManualOrder }] = useMutation(mutate_approveManualOrder, {
        awaitRefetchQueries: true,
        refetchQueries: ['scGetPackages', 'scPackageAggregate'],
        onCompleted: () => setIds([])
    });

    const [mutateCancelManualOrder, { loading: loadingCancelManualOrder }] = useMutation(mutate_cancelManualOrder, {
        awaitRefetchQueries: true,
        refetchQueries: ['scGetPackages', 'scPackageAggregate'],
        onCompleted: () => setIds([])
    });

    const [coReloadOrderShipmentParam, { loading: loadingReloadOrderShipmentParam }] = useMutation(mutate_coReloadOrderShipmentParam, {
        awaitRefetchQueries: true,
        refetchQueries: ['scGetPackages', 'scPackageAggregate'],
        onCompleted: () => setIds([])
    });

    const [mutateRetryShipPackage, { loading: loadingRetryShipPackage }] = useMutation(mutate_coRetryShipPackage, {
        awaitRefetchQueries: true,
        refetchQueries: ['scGetPackages', 'scPackageAggregate'],
        onCompleted: () => setIds([])
    });
    const wait = (ms) => new Promise((res) => setTimeout(res, ms))
    const delayRefetchedQuery = async (observableQuery) => {
        await wait(3000) // 3s to make it super obvious if working or not
        observableQuery.refetch()
    }

    const [mutateHandleBuyerCancellationPackage, { loading: loadingHandleBuyerCancellationPackage }] = useMutation(mutate_coHandleBuyerCancellationPackage, {
        awaitRefetchQueries: true,
        refetchQueries: ['scGetPackages', 'scPackageAggregate'],
        onQueryUpdated: delayRefetchedQuery,
        onCompleted: () => setIds([]),
    });

    const [retryWarehouseActionMultiPackage, { loading: loadingActionMultiPackage }] = useMutation(mutate_coRetryWarehouseActionMultiPackage, {
        awaitRefetchQueries: true,
        refetchQueries: ['scGetPackages', 'scPackageAggregate'],
        onCompleted: () => setIds([]),
    });

    const [shipPackageManualOrder, { loading: loadingShipManualOrder }] = useMutation(mutate_shipPackageManualOrder, {
        awaitRefetchQueries: true,
        refetchQueries: ['scGetPackages', 'scPackageAggregate'],
        onCompleted: () => setIds([])
    });

    const [mutatePreparePackage, { loading: loadingPrepareOrder }] = useMutation(mutate_coPreparePackage, {
        awaitRefetchQueries: true,
        refetchQueries: ['scGetPackages', 'scPackageAggregate'],
        onCompleted: () => setIds([])
    });

    const onRetryWarehouseActionMultiPackage = useCallback(async (idsOrder) => {
        let { data } = await retryWarehouseActionMultiPackage({
            variables: {
                list_package_id: idsOrder
            }
        });
        
        if (data?.coRetryWarehouseActionMultiPackage?.success == 0) {
            addToast(data?.coRetryWarehouseActionMultiPackage?.message || formatMessage({ defaultMessage: 'Đẩy lại đơn hàng loạt thất bại' }), { appearance: 'error' });
            return
        }

        if (!!data?.coRetryWarehouseActionMultiPackage) {
            setDataResults({
                ...(data?.coRetryWarehouseActionMultiPackage || {}),
                type: 'retry-package',
                total_success: (data?.coRetryWarehouseActionMultiPackage?.total ?? 0) - (data?.coRetryWarehouseActionMultiPackage?.total_fail ?? 0)
            });
        } else {
            addToast(formatMessage({ defaultMessage: 'Đẩy lại đơn hàng loạt thất bại' }), { appearance: 'error' });
        }
    }, []);

    const onApprovedManualOrder = useCallback(async (idsOrder, isMutil = false) => {
        console.log({ idsOrder });
        try {
            let { data } = await mutateApprovedManualOrder({
                variables: {
                    list_order_id: idsOrder
                }
            })

            if (isMutil) {
                setDataResults({
                    ...(data?.approveManualOrder || {}),
                    type: 'approved-manual'
                })
                return;
            }

            if (data?.approveManualOrder?.success) {
                if (data?.approveManualOrder?.total_success > 0) {
                    addToast(formatMessage({ defaultMessage: 'Duyệt đơn hàng thành công' }), { appearance: 'success' });
                } else {
                    addToast(data?.approveManualOrder?.list_fail?.[0]?.message || formatMessage({ defaultMessage: 'Duyệt đơn hàng thất bại' }), { appearance: 'error' });
                }
            } else {
                addToast(data?.approveManualOrder?.message || formatMessage({ defaultMessage: 'Duyệt đơn hàng thất bại' }), { appearance: 'error' });
            }
        } catch (error) {
            addToast(formatMessage({ defaultMessage: 'Duyệt đơn hàng thất bại' }), { appearance: "error" });
        }
    }, []);

    const onCancelManualOrder = useCallback(async (idsOrder, isMutil = false) => {
        try {
            let { data } = await mutateCancelManualOrder({
                variables: {
                    list_package_id: idsOrder
                }
            })

            if (isMutil) {
                setDataResults({
                    ...(data?.cancelManualOrder || {}),
                    type: 'cancel-manual'
                })
                return;
            }

            if (data?.cancelManualOrder?.success) {
                if (data?.cancelManualOrder?.total_success > 0) {
                    addToast(formatMessage({ defaultMessage: 'Hủy đơn hàng thành công' }), { appearance: 'success' });
                } else {
                    addToast(data?.cancelManualOrder?.list_fail?.[0]?.message || formatMessage({ defaultMessage: 'Hủy đơn hàng thất bại' }), { appearance: 'error' });
                }
            } else {
                addToast(data?.cancelManualOrder?.message || formatMessage({ defaultMessage: 'Hủy đơn hàng thất bại' }), { appearance: 'error' });
            }
        } catch (error) {
            addToast(formatMessage({ defaultMessage: 'Hủy đơn hàng thất bại' }), { appearance: "error" });
        }
    }, []);

    const onHandleBuyerCancellationPackage = useCallback(async (idsOrder, type = "ACCEPT", isMutil = false) => {
        const nameAction = type == 'ACCEPT' ? formatMessage({ defaultMessage: 'Đồng ý hủy' }) : formatMessage({ defaultMessage: 'Từ chối hủy' });
        try {
            let { data } = await mutateHandleBuyerCancellationPackage({
                variables: {
                    list_package: idsOrder?.map(id => ({
                        package_id: id
                    })),
                    operation: type
                }
            })

            if (isMutil) {
                if (data?.coHandleBuyerCancellationPackage?.success) {
                    setDataResults({
                        ...(data?.coHandleBuyerCancellationPackage?.data || {}),
                        list_fail: data?.coHandleBuyerCancellationPackage?.data?.list_package_fail?.map(item => ({
                            ...item,
                            message: item?.error_message
                        })),
                        type: type == 'ACCEPT' ? 'accept-cancel-package' : 'reject-cancel-package'
                    })
                } else {
                    addToast(data?.coHandleBuyerCancellationPackage?.message || formatMessage({ defaultMessage: '{name} thất bại' }, { name: nameAction }), { appearance: 'error' });
                }
                return;
            }

            if (data?.coHandleBuyerCancellationPackage?.success) {
                if (data?.coHandleBuyerCancellationPackage?.data?.total_success > 0) {
                    addToast(formatMessage({ defaultMessage: '{name} thành công' }, { name: nameAction }), { appearance: 'success' });
                } else {
                    addToast(data?.coHandleBuyerCancellationPackage?.data?.list_package_fail?.[0]?.error_message || formatMessage({ defaultMessage: '{name} thất bại' }, { name: nameAction }), { appearance: 'error' });
                }
            } else {
                addToast(data?.coHandleBuyerCancellationPackage?.message || formatMessage({ defaultMessage: '{name} thất bại' }, { name: nameAction }), { appearance: 'error' });
            }
        } catch (error) {
            addToast(formatMessage({ defaultMessage: '{name} thất bại' }, { name: nameAction }), { appearance: "error" });
        }
    }, []);

    const onRetryShipPackage = useCallback(async (idsOrder, isMutil = false) => {
        try {
            let { data } = await mutateRetryShipPackage({
                variables: {
                    list_package: idsOrder?.map(id => ({
                        package_id: id
                    }))
                }
            })

            if (isMutil) {
                if (data?.coRetryShipPackage?.success) {
                    setDataResults({
                        ...(data?.coRetryShipPackage?.data || {}),
                        list_fail: data?.coRetryShipPackage?.data?.list_package_fail?.map(item => ({
                            ...item,
                            message: item?.error_message
                        })),
                        type: 'retry-ship-package'
                    })
                } else {
                    addToast(data?.coRetryShipPackage?.message || formatMessage({ defaultMessage: 'Tìm lại tài xế thất bại' }), { appearance: 'error' });
                }
                return;
            }

            if (data?.coRetryShipPackage?.success) {
                if (data?.coRetryShipPackage?.data?.total_success > 0) {
                    addToast(formatMessage({ defaultMessage: 'Tìm lại tài xế thành công' }), { appearance: 'success' });
                } else {
                    addToast(data?.coRetryShipPackage?.data?.list_package_fail?.[0]?.error_message || formatMessage({ defaultMessage: 'Tìm lại tài xế thất bại' }), { appearance: 'error' });
                }
            } else {
                addToast(data?.coRetryShipPackage?.message || formatMessage({ defaultMessage: 'Tìm lại tài xế thất bại' }), { appearance: 'error' });
            }
        } catch (error) {
            addToast(formatMessage({ defaultMessage: 'Tìm lại tài xế thất bại' }), { appearance: "error" });
        }
    }, []);

    const onReloadOrderShipmentParam = async (idsOrder) => {
        let variables = {
            list_sc_order_id: idsOrder,
        }

        let { data } = await coReloadOrderShipmentParam({
            variables: variables
        });

        setIds([]);
        if (!!data?.coReloadOrderShipmentParam?.success) {
            addToast(formatMessage({ defaultMessage: 'Hệ thống đang thực hiện lấy thông tin lấy hàng từ sàn. Vui lòng chờ trong ít phút sau đó tải lại trang' }), { appearance: 'success' });
        } else {
            addToast(formatMessage({ defaultMessage: 'Xử lý hàng hàng loạt thất bại' }), { appearance: 'error' });
        }
    }

    const onShipManualOrder = useCallback(async (idsOrder, isMutil = false) => {
        try {
            let { data } = await shipPackageManualOrder({
                variables: {
                    list_package_id: idsOrder
                }
            });

            if (isMutil) {
                setDataResults({
                    ...(data?.shipPackageManualOrder || {}),
                    type: 'ship-manual'
                })
                return;
            }

            if (data?.shipPackageManualOrder?.success) {
                if (data?.shipPackageManualOrder?.total_success > 0) {
                    addToast(formatMessage({ defaultMessage: 'Giao hàng thành công' }), { appearance: 'success' });
                } else {
                    addToast(data?.shipPackageManualOrder?.list_fail?.[0]?.message || formatMessage({ defaultMessage: 'Giao hàng thất bại' }), { appearance: 'error' });
                }
            } else {
                addToast(data?.shipPackageManualOrder?.message || formatMessage({ defaultMessage: 'Giao hàng thất bại' }), { appearance: 'error' });
            }
        } catch (error) {
            addToast(formatMessage({ defaultMessage: 'Giao hàng thất bại' }), { appearance: "error" });
        }
    }, []);

    const onPrepareManualPackage = useCallback(async (idsOrder) => {
        try {
            let { data } = await mutatePreparePackage({
                variables: {
                    list_package: idsOrder?.map(item => ({
                        package_id: item
                    }))
                }
            })

            if (data?.coPreparePackage?.success) {
                if (data?.coPreparePackage?.data?.total_success > 0) {
                    addToast(formatMessage({ defaultMessage: 'Chuẩn bị hàng thành công' }), { appearance: 'success' });
                } else {
                    addToast(data?.coPreparePackage?.data?.list_package_fail?.[0]?.error_message || formatMessage({ defaultMessage: 'Chuẩn bị hàng thất bại' }), { appearance: 'error' });
                }
            } else {
                addToast(data?.coPreparePackage?.message || formatMessage({ defaultMessage: 'Chuẩn bị hàng thất bại' }), { appearance: 'error' });
            }
        } catch (error) {
            addToast(formatMessage({ defaultMessage: 'Chuẩn bị hàng thất bại' }), { appearance: "error" });
        }
    }, []);

    const coReloadOrder = async (idsOrder) => {
        setLoading(true)
        let variables = {
            list_sc_order_id: idsOrder,
        }

        let { data } = await mutate({
            variables: variables
        })
        setLoading(false)
        if (data?.coReloadOrder?.success) {
            addToast(formatMessage({ defaultMessage: 'Đơn hàng tải lại thành công' }), { appearance: 'success' });
        } else {
            addToast(data?.coReloadOrder?.message || formatMessage({ defaultMessage: 'Đơn hàng tải lại thất bại' }), { appearance: 'error' });
        }
    }

    const list_after_sale_type = useMemo(() => {
        if (!params.after_sale_type) return {};
        return { list_after_sale_type: params.after_sale_type?.split('$')?.map(v => +v) }
    }, [params.after_sale_type])

    const status = useMemo(() => {
        try {
            if (!params.type) return { list_status: [] }

            if (params?.type == "NONE_MAP_WAREHOUSE") {
                return { filter_need_map_warehouse: 1, list_status: [] }
            }

            // Status packing
            if (params?.type == 'ready_to_ship') {
                return { wait_shipping_carrier: 2, list_status: [params?.type] }
            }

            if (params?.type == "wait_shipping_carrier") {
                return { wait_shipping_carrier: 1, list_status: ['ready_to_ship'] }
            }

            return { list_status: [params?.type] }
        } catch (error) {
            return {}
        }
    }, [params.type]);


    const range_time = useMemo(
        () => {
            try {
                if (!params.gt || !params.lt) {
                    if (valueRangeTime?.length > 0) {
                        return [
                            dayjs().subtract(!!params?.is_old_order ? 119 : 29, "day").startOf("day").unix(),
                            dayjs().subtract(!!params?.is_old_order ? 90 : 0, "day").endOf("day").unix()
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
        }, [params?.gt, params?.lt, params?.is_old_order, valueRangeTime]
    );

    const q = useMemo(() => {
        setSearchType(params.search_type)
        return params.q
    }, [params.q, params?.search_type]);

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
        if (!params.list_source) return {
            list_source: [OPTIONS_SOURCE_ORDER[0].value]
        };

        if (params.list_source == 'manual') {
            return { list_source: ['manual', 'pos'] }
        }

        return { list_source: params.list_source?.split(',') }
    }, [params.list_source]);

    const filter_map_sme = useMemo(() => {
        if (!params.filter_map_sme) return {};
        return { filter_map_sme: Number(params.filter_map_sme) }
    }, [params.filter_map_sme]);

    const processingDeadline = useMemo(() => {
        if (!params.deadline_status) return {};
        return { processing_deadline: params.deadline_status }
    }, [params.deadline_status]);

    const sfSessionPick = useMemo(() => {
        if (!params.in_session_pickup) return {};
        return { in_session_pickup: +params.in_session_pickup }
    }, [params.in_session_pickup]);

    const is_old_order = useMemo(() => {
        if (!params.is_old_order) return {};

        return { is_old_order: Number(params?.is_old_order) }
    }, [params.is_old_order]);

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

    const abnormal = useMemo(() => {
        return (params?.order_type == 0 || !!params?.order_type) ? +params?.order_type : null
    }, [params?.order_type])

    const type_parcel = useMemo(() => {
        if (!params.type_parcel) return {};
        return {
            type_parcel: params.type_parcel?.split(',')?.filter(type => type != 5).map(function (x) {
                return parseInt(x);
            })
        }
    }, [params.type_parcel]);

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
        if (typeSearchTime == 'tts_expired') {
            return { tts_expired: [...range_time] }
        }
        return {}
    }
    let whereCondition = useMemo(() => {
        setIds([])
        return {
            ...list_after_sale_type, ...list_source, ...shipping_unit,
            ...payments, ...is_old_order, ...filter_map_sme,
            ...type_parcel, ...print_status, ...stores,
            ...processingDeadline, ...status, ...warehouse_filter, ...warehouse_id,
            ...have_sme_note, ...sfSessionPick,
            q: q,
            abnormal,
            search_type: searchType ?? 'ref_order_id',
            ...channel,
            is_connected: 1,
            ...chooseTime(),
        }
    }, [
        list_after_sale_type, processingDeadline, sfSessionPick,
        params?.search_time_type, stores,
        currentChannel, range_time, q, status, is_old_order,
        searchType, shipping_unit, payments, filter_map_sme,
        type_parcel, print_status, warehouse_filter,
        warehouse_id, have_sme_note, list_source, abnormal]);


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


    const { data, loading: loadingGetOrders, error, refetch: refetchGetOrders } = useQuery(query_scGetPackages, {
        variables: {
            per_page: limit,
            page: page,
            search: whereCondition,
            context: 'order',
            order_by: params?.order_by || 'order_at',
            order_by_type: params.sort || 'desc'
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
                titleTemplate={formatMessage({ defaultMessage: "Tất cả đơn hàng" }) + ' - UpBase'}
                defaultTitle={formatMessage({ defaultMessage: "Tất cả đơn hàng" }) + ' - UpBase'}
            >
                <meta name="description" content={formatMessage({ defaultMessage: "Tất cả đơn hàng" }) + ' - UpBase'} />
            </Helmet>

            <LoadingDialog show={loading || loadingReloadOrderShipmentParam || loadingCancelManualOrder || loadingRetryShipPackage || loadingApprovedManualOrder || loadingPrepareOrder || loadingShipManualOrder || loadingHandleBuyerCancellationPackage || loadingActionMultiPackage} />

            {!!currentOrderCancel && <ModalConfirmCancel
                show={!!currentOrderCancel}
                onHide={() => {
                    setIsActionMutiple(false);
                    setCurrentOrderCancel(null)
                }
                }
                onConfirm={() => {
                    onCancelManualOrder(currentOrderCancel, isActionMutilple);
                    setCurrentOrderCancel(null);
                    setIsActionMutiple(false);
                }}
                title={formatMessage({ defaultMessage: 'Bạn có chắc chắn muốn hủy đơn ?' })}
            />}

            {!!storeDisconnect &&
                <ModalDisconnectStore
                    storeDisconnect={storeDisconnect}
                    onHide={() => setStoreDisconnect()} />}

            {!!currentOrderUpdate && <ModalTrackingNumber
                currentOrder={currentOrderUpdate}
                onHide={() => setCurrentOrderUpdate(null)}
            />}

            {!!currentOrderDelivery && <ModalConfirmDelivery
                currentOrder={currentOrderDelivery}
                isActionMutilple={isActionMutilple}
                onResetIsActionMultiple={() => setIsActionMutiple(false)}
                setDataResults={setDataResults}
                onHide={() => {
                    setIsActionMutiple(false);
                    setCurrentOrderDelivery(null)
                }}
            />}

            <ModalResultMutiple
                dataResults={dataResults}
                onHide={() => {
                    setDataResults(null);
                    setIds([]);
                }}
            />

            <AddSmeNoteOrderDialog dataSmeNote={dataSmeNote} onHide={() => setDataSmeNote()} />

            <CardBody>
                <OrderFilter
                    setDataSmeNote={setDataSmeNote}
                    setTypeSearchTime={setTypeSearchTime}
                    typeSearchTime={typeSearchTime}
                    dataStore={dataStore}
                    loadingStore={loadingStore}
                    storesAndChannel={{ currentChannels, channelsActive, currentStores, optionsStores }}
                    listOrderCheckingQuantity={listOrderCheckingQuantity}
                    ids={ids}
                    setIds={setIds}
                    loadingListOrderChecking={loadingListOrderCheckingQuantity}
                    valueRangeTime={valueRangeTime}
                    setValueRangeTime={setValueRangeTime}
                    loadingScWarehouse={loadingScWarehouse}
                    dataSmeWarehouse={dataSmeWarehouse}
                    dataScWareHouse={dataScWareHouse}
                    chooseTime={chooseTime}
                    whereCondition={whereCondition}
                    coReloadOrder={coReloadOrder}
                    onRetryWarehouseActionMultiPackage={onRetryWarehouseActionMultiPackage}
                    onReloadOrderShipmentParam={onReloadOrderShipmentParam}
                    onHandleBuyerCancellationPackage={onHandleBuyerCancellationPackage}
                    refetchGetOrders={refetchGetOrders}
                    onApprovedManualOrder={onApprovedManualOrder}
                    onShipManualOrder={onShipManualOrder}
                    onRetryShipPackage={onRetryShipPackage}
                    onConfirmDelivery={(idsOrder) => {
                        setIsActionMutiple(true);
                        setCurrentOrderDelivery(idsOrder)
                    }}
                    onCancelManualOrder={(idsOrder) => {
                        setIsActionMutiple(true);
                        setCurrentOrderCancel(idsOrder)
                    }}
                />
                <OrderTable
                    ids={ids}
                    setIds={setIds}
                    data={data}
                    setStoreDisconnect={setStoreDisconnect}
                    setDataSmeNote={setDataSmeNote}
                    loading={loadingGetOrders}
                    loadingSmeVariant={loadingSmeVariant}
                    dataSmeWarehouse={dataSmeWarehouse}
                    dataScWareHouse={dataScWareHouse}
                    error={error}
                    refetch={refetchGetOrders}
                    page={page}
                    limit={limit}
                    dataStore={dataStore?.sc_stores}
                    smeVariants={smeVariants}
                    onHandleBuyerCancellationPackage={onHandleBuyerCancellationPackage}
                    coReloadOrder={coReloadOrder}
                    onApprovedManualOrder={onApprovedManualOrder}
                    onReloadOrderShipmentParam={onReloadOrderShipmentParam}
                    onPrepareManualPackage={onPrepareManualPackage}
                    onShipManualOrder={onShipManualOrder}
                    onRetryShipPackage={onRetryShipPackage}
                    onCancelManualOrder={(idsOrder) => setCurrentOrderCancel(idsOrder)}
                    onUpdateTrackingNumber={(order) => setCurrentOrderUpdate(order)}
                    onConfirmDelivery={(order) => setCurrentOrderDelivery(order)}
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
    "order_list_view_reload": {
        router: '/orders/list',
        actions: [
            "scGetWarehouses", "scGetPackages", "scPackageAggregate", "sc_stores", "op_connector_channels", "listOrderCheckingQuantity", "sme_warehouses", "scGetTrackingLoadOrder", "coGetShippingCarrierFromListPackage", "coGetPaymentMethodFromListPackage",
            "coReloadOrder"
        ],
        name: 'Xem danh sách đơn hàng (Bao gồm cả quyền tải lại đơn hàng)',
        group_code: 'order_list',
        group_name: 'Danh sách đơn',
        cate_code: 'order_service',
        cate_name: 'Quản lý đơn hàng',
    },
    "order_list_order_export": {
        router: '/orders/list',
        actions: [
            "sc_stores", "op_connector_channels", "scExportOrderAggregate", "cfGetTemplateExport", "coGetShippingCarrierFromListPackage", "scExportOrder", "co_get_job_tracking_export_order", "scGetJobTrackingExportOrder"
        ],
        name: 'Xuất đơn hàng',
        group_code: 'order_list',
        group_name: 'Danh sách đơn',
        cate_code: 'order_service',
        cate_name: 'Quản lý đơn hàng',
    },
    "order_list_order_prepare": {
        router: '/orders/list',
        actions: [
            "coPreparePackage", 'scGetPackages', 'scPackageAggregate', "sme_catalog_product_variant"
        ],
        name: 'Thao tác Chuẩn bị hàng',
        group_code: 'order_list',
        group_name: 'Danh sách đơn',
        cate_code: 'order_service',
        cate_name: 'Quản lý đơn hàng',
    },
    "order_list_order_ready_to_ship": {
        router: '/orders/list',
        actions: [
            "coReadyToShipPackage", 'scGetPackages'
        ],
        name: 'Thao tác Sẵn sàng giao',
        group_code: 'order_list',
        group_name: 'Danh sách đơn',
        cate_code: 'order_service',
        cate_name: 'Quản lý đơn hàng',
    },
    "order_list_order_update_note": {
        router: '/orders/list',
        actions: [
            "coUpdateOrderNote", "scGetPackages"
        ],
        name: 'Thêm ghi chú người bán',
        group_code: 'order_list',
        group_name: 'Danh sách đơn',
        cate_code: 'order_service',
        cate_name: 'Quản lý đơn hàng',
    },
    "order_list_order_print_ticket": {
        router: '/orders/list',
        actions: [
            "coPrintShipmentPackage", "scGetPackages", "coPrintInvoice"
        ],
        name: 'In các loại phiếu',
        group_code: 'order_list',
        group_name: 'Danh sách đơn',
        cate_code: 'order_service',
        cate_name: 'Quản lý đơn hàng',
    },
    "order_list_after_sale_order": {
        router: '/orders/list',
        actions: [
            "sme_catalog_inventory_items", 'sme_catalog_inventory_items_aggregate', 'crmGetChannelCode', "crmGetCustomers", "crmSearchRecipientAddressByCustomer",
            "saveManualOrder"
        ],
        name: 'Tạo đơn sau bán hàng',
        group_code: 'order_list',
        group_name: 'Danh sách đơn',
        cate_code: 'order_service',
        cate_name: 'Quản lý đơn hàng',
    },
    "order_list_order_cancel": {
        router: '/orders/list',
        actions: [
            "cancelManualOrder", 'scGetPackages', 'scPackageAggregate'
        ],
        name: 'Hủy đơn thủ công',
        group_code: 'order_list',
        group_name: 'Danh sách đơn',
        cate_code: 'order_service',
        cate_name: 'Quản lý đơn hàng',
    },
    "order_list_order_ship": {
        router: '/orders/list',
        actions: [
            "shipPackageManualOrder", 'scGetPackages', 'scPackageAggregate'
        ],
        name: 'Giao hàng đơn thủ công',
        group_code: 'order_list',
        group_name: 'Danh sách đơn',
        cate_code: 'order_service',
        cate_name: 'Quản lý đơn hàng',
    },
    "order_list_order_retry_ship": {
        router: '/orders/list',
        actions: [
            "coRetryShipPackage", 'scGetPackages', 'scPackageAggregate'
        ],
        name: 'Thao tác Tìm lại tài xế',
        group_code: 'order_list',
        group_name: 'Danh sách đơn',
        cate_code: 'order_service',
        cate_name: 'Quản lý đơn hàng',
    },
    "order_list_order_reload_shipment": {
        router: '/orders/list',
        actions: [
            "coReloadOrderShipmentParam", 'scGetPackages', 'scPackageAggregate'
        ],
        name: 'Tải thông tin lấy hàng',
        group_code: 'order_list',
        group_name: 'Danh sách đơn',
        cate_code: 'order_service',
        cate_name: 'Quản lý đơn hàng',
    },
    "order_list_order_handle_cancel": {
        router: '/orders/list',
        actions: [
            "coHandleBuyerCancellationPackage", 'scGetPackages', 'scPackageAggregate'
        ],
        name: 'Xác nhận hủy',
        group_code: 'order_list',
        group_name: 'Danh sách đơn',
        cate_code: 'order_service',
        cate_name: 'Quản lý đơn hàng',
    },
    "order_list_retry_warehouse": {
        router: '/orders/list',
        actions: [
            "coRetryWarehouseActionMultiPackage", 'scGetPackages', 'scPackageAggregate'
        ],
        name: 'Đẩy lại đơn',
        group_code: 'order_list',
        group_name: 'Danh sách đơn',
        cate_code: 'order_service',
        cate_name: 'Quản lý đơn hàng',
    },
};