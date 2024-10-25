import React, { memo, useCallback, useMemo, useState, useEffect, useLayoutEffect } from "react";
import {
    Card,
    CardBody,
    CardHeader
} from "../../../../_metronic/_partials/controls";
import queryString from 'querystring';
import { useHistory, useLocation } from 'react-router-dom';
import Filter from "./Filter";
import Table from "./Table";
import { toAbsoluteUrl } from "../../../../_metronic/_helpers";
import SVG from "react-inlinesvg";
import { Helmet } from 'react-helmet-async';
import { useSubheader } from "../../../../_metronic/layout";
import _ from "lodash";
import { useToasts } from "react-toast-notifications";
import query_scGetPackages from "../../../../graphql/query_scGetPackages";
import query_sc_stores_basic from "../../../../graphql/query_sc_stores_basic";
import query_scGetWarehouses from "../../../../graphql/query_scGetWarehouses";
import query_sme_catalog_stores from "../../../../graphql/query_sme_catalog_stores";
import { useIntl } from 'react-intl'
import dayjs from "dayjs";
import { useMutation, useQuery } from "@apollo/client";
import { queryGetSmeProductVariants } from "../../Order/OrderUIHelpers";
import mutate_cancelManualOrder from "../../../../graphql/mutate_cancelManualOrder";
import LoadingDialog from "../../ProductsStore/product-new/LoadingDialog";
import ConfirmDialog from "./Dialogs/ConfirmDialog";
import SmeNoteDialog from "./Dialogs/SmeNoteDialog";
import { ResultDialog } from './Dialogs/ResultDialog'
import { useSelector } from 'react-redux';
import ExportOrderDialog from "./Dialogs/ExportOrderDialog";
import ImportFileMenual from "../approved-manual-order/Dialogs/ImportFileMenual";

export default memo(() => {
    const params = queryString.parse(useLocation().search.slice(1, 100000));
    const { setBreadcrumbs } = useSubheader()
    const [typeSearchTime, setTypeSearchTime] = useState(params?.search_time_type || 'order_at');
    const [dataSelectedOrder, setDataSelectedOrder] = useState([])
    const [searchType, setSearchType] = useState(params?.search_type || "ref_order_id");
    const [loadingSmeVariant, setLoadingSmeVariant] = useState();
    const [smeVariants, setSmeVariants] = useState();
    const [result, setResult] = useState();
    const [dataSmeNote, setDataSmeNote] = useState()
    const [exportOrderDialog, setExportOrderDialog] = useState(false)
    const [importFileDialog, setImportFileDialog] = useState(false)
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false
    });
    const { addToast } = useToasts();
    const [valueRangeTime, setValueRangeTime] = useState([]);
    const { formatMessage } = useIntl()

    const user = useSelector((state) => state.auth.user);
    

    useLayoutEffect(() => {
        setBreadcrumbs([{title: formatMessage({ defaultMessage: 'Đơn của tôi' })}])
    }, []);

    const { data: dataStore, loading: loadingStore } = useQuery(query_sc_stores_basic, {
        variables: {
            context: 'order'
        },
        fetchPolicy: "cache-and-network",
    });
        
    const { data: dataScWareHouse, loading: loadingScWarehouse } = useQuery(query_scGetWarehouses, {
        fetchPolicy: 'cache-and-network'
    });

    const { data: dataSmeWarehouse } = useQuery(query_sme_catalog_stores, {
        fetchPolicy: 'cache-and-network', 
    });

    const [mutateCancelManualOrder, { loading: loadingCancelManualOrder }] = useMutation(mutate_cancelManualOrder, {
        awaitRefetchQueries: true,
        refetchQueries: ['scGetPackages', 'scPackageAggregate'],
        onCompleted: () => setDataSelectedOrder([])
    });

        //======================mutation =======================
        const onCancelManualOrder = useCallback(async (idsOrder) => {
            try {
                let { data } = await mutateCancelManualOrder({variables: {
                    list_package_id: Array.isArray(idsOrder) ? idsOrder : [idsOrder]
                }})
    
                if (data?.cancelManualOrder?.success) {
                    if(Array.isArray(idsOrder)) {
                        setResult({
                            action: 'cancel-manual',
                            total: data?.cancelManualOrder?.total_fail + data?.cancelManualOrder?.total_success,
                            total_success: data?.cancelManualOrder?.total_success,
                            total_error: data?.cancelManualOrder?.total_fail,
                            list_error: data?.cancelManualOrder?.list_fail?.map(item => ({
                                msg: item?.message,
                                id: item?.order_ref_id
                            }))
                        })
                    }
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

        // ====================== varibales ========================
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

        const shipping_unit = useMemo(() => {
            if (!params.shipping_unit) return [];
            return { shipping_unit: params.shipping_unit?.split('$') }
        }, [params.shipping_unit]);

        const payments = useMemo(() => {
            if (!params.payments) return [];
            return { payments: params.payments?.split(',') }
        }, [params.payments]);

        const list_after_sale_type = useMemo(() => {
            if (!params.after_sale_type) return {};
            return { list_after_sale_type: params.after_sale_type?.split('$')?.map(v => +v) }
        }, [params.after_sale_type])

        const is_old_package = useMemo(() => {
            if (!params.is_old_order) return {};
    
            return { is_old_package: Number(params?.is_old_order) }
        }, [params.is_old_order]);

        const type_parcel = useMemo(() => {
            if (!params.type_parcel) return {};
            return {
                type_parcel: params.type_parcel?.split(',')?.filter(type => type != 5).map(function (x) {
                    return parseInt(x);
                })
            }
        }, [params.type_parcel]);

        const stores = useMemo(() => {
            if (!params.stores) return [];
            return {
                list_store: params.stores?.split(',')?.map(store => +store)
            }
        }, [params.stores]);

        const warehouse_filter = useMemo(() => {
            return {
                warehouse_filer: !!params?.warehouse_filter ? Number(params?.warehouse_filter) : 2
            }
        }, [params.warehouse_filter]);

        const warehouse_id = useMemo(() => {
            if (!params?.warehouse_id) return {};
            return {
                warehouse_id: Number(params?.warehouse_id)
            }
        }, [params.warehouse_id]);

        const have_sme_note = useMemo(() => {
            try {
                if (!params.type_parcel?.split(',')?.find(type => type == 5)) return {};
                return { have_sme_note: 1 };
            } catch (error) {
                return {};
            }
        }, [params.type_parcel]);

        const q = useMemo(() => {
            return params.q
        }, [params.q, params.search_type]);

        const channel = useMemo(() => {
            if (!params.channel) return {};
            return { connector_channel_code: params.channel?.split(',') }
        }, [params.channel]);

        const range_time = useMemo(() => {
            try {
                if (!params.gt || !params.lt) {
                    if (valueRangeTime?.length > 0) {
                        return [dayjs().startOf("day").unix(), dayjs().endOf("day").unix()]
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
        }, [params?.gt, params?.lt, params?.is_old_order, valueRangeTime]);

        const chooseTime = useMemo(() => {
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
        }, [typeSearchTime, range_time])

    
        const [currentChannels, channelsActive, currentStores, optionsStores] = useMemo(() => {
            const channels = dataStore?.op_connector_channels
            const stores = dataStore?.sc_stores
            const channelsActive = channels?.filter(store => ({ channelsActive: stores?.some(sa => sa?.connector_channel_code === store?.code)}));
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

        let whereCondition = useMemo(() => {
            setDataSelectedOrder([])
            return {
                list_source: ['manual'],
                ...status,
                ...list_after_sale_type,
                ...shipping_unit,
                ...payments,
                ...is_old_package,
                ...type_parcel,
                ...stores,
                ...warehouse_filter,
                ...warehouse_id,
                ...have_sme_note,
                list_person_in_charge: [user?.email],
                q: q,
                search_type: searchType ?? 'ref_order_id',
                ...channel,
                is_connected: 1,
                ...chooseTime,
            }
        }, [status, list_after_sale_type, stores,q,channel,user, chooseTime,is_old_package,searchType,shipping_unit,payments,type_parcel,warehouse_filter,warehouse_id,have_sme_note]);
    
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

        const warehouseOrder = (store_id, sc_warehouse_id, sme_warehouse_id) => { 
            let _store = dataStore?.sc_stores?.find(_st => _st.id == store_id);

            const scWarehouse = dataScWareHouse?.scGetWarehouses?.filter(wh => wh?.warehouse_type == 1)?.find(wh => wh?.id == sc_warehouse_id);
            const smeWarehouse = dataSmeWarehouse?.sme_warehouses?.find(wh => wh?.id == sme_warehouse_id);

            return {
                smeWhName: smeWarehouse?.name,
                enableMultiWarehouse: _store?.enable_multi_warehouse,
                scWhName: scWarehouse?.warehouse_name,
            }
            
        }
    
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
        
        const dataTable = useMemo(() => {
            const dataOrder = data?.scGetPackages?.map(pack => {
                const orderItems = pack?.orderItems?.map(item => ({
                    productName: item?.product_name,
                    variantName: item?.variant_name,
                    smeVariantId: item?.sme_variant_id,
                    variantImage: item?.variant_image,
                    refProductId: item.ref_product_id,
                    variantSku: item?.variant_sku,
                    quantityPurchased: item?.quantity_purchased,
                    refStoreId: pack?.ref_store_id,
                    errOrder: item.warehouse_error_message ? item.warehouse_error_message : null,
                    connectorChannelCode: item.connector_channel_code,
                    is_gift: item.is_gift
                }))
                let channel = dataStore?.op_connector_channels.find(_st => _st.code == pack.connector_channel_code);
                let store = dataStore?.sc_stores.find(_st => _st.id == pack.store_id);
                return {
                    orderItems,
                    tracking_number: pack?.tracking_number,
                    shipping_carrier: pack?.shipping_carrier,
                    connector_channel_error: pack?.connector_channel_error,
                    warehouse_error_message: pack?.warehouse_error_message,
                    logistic_provider_error: pack?.logistic_provider_error,
                    imgChannel: channel?.logo_asset_url,
                    refId: pack?.order?.ref_id,
                    smeNote: pack?.order?.sme_note,
                    package_number: pack?.package_number,
                    system_package_number: pack?.system_package_number,
                    pack_no: pack?.pack_no,
                    orderAt: pack?.order?.order_at,
                    print_status: pack?.print_status,
                    paidPrice: pack?.order?.paid_price,
                    paymentMethod: pack?.order?.payment_method,
                    expiring_soon: pack?.order?.expiring_soon,
                    pDeliveryMethod: pack?.order?.p_delivery_method,
                    shippedAt: pack?.order?.shipped_at,
                    customerRecipientAddress: pack?.order?.customerRecipientAddress,
                    ttsExpired: pack?.order?.tts_expired,
                    packId: pack?.id,
                    id: pack?.order?.id,
                    pack_status: pack?.pack_status,
                    provider_or_id: pack?.provider_or_id,
                    source: pack?.order?.source,
                    status: pack?.order?.status,
                    storeName: store?.name,
                    warehouseOfOrder: warehouseOrder(pack?.store_id, pack?.sc_warehouse_id, pack?.sme_warehouse_id)
                }
            })

            return {
                error, 
                loading: loadingGetPacks,
                refetch: refetchGetPacks,
                dataOrder,
                count: data?.scPackageAggregate?.count,
            }
        }, [data, dataStore, warehouseOrder])

    
    return (
        <Card>
            <Helmet titleTemplate={formatMessage({ defaultMessage: "Đơn của tôi" }) + ' - UpBase'} defaultTitle={formatMessage({ defaultMessage: "Đơn của tôi" }) + ' - UpBase'}>
                <meta name="description" content={formatMessage({ defaultMessage: "Đơn của tôi" }) + ' - UpBase'} />
            </Helmet>

            <LoadingDialog show={loadingCancelManualOrder} />
            {!!result && <ResultDialog onHide={() => setResult()} result={result} action={result?.action}/>}
            {importFileDialog && <ImportFileMenual setResult={setResult} show={importFileDialog} onHide={() => setImportFileDialog(false)}/>}
            {confirmDialog?.isOpen && 
            <ConfirmDialog 
                title={formatMessage({defaultMessage: 'Bạn có chắc chắn muốn hủy đơn ?'})}
                show={confirmDialog?.isOpen}
                onHide={() => setConfirmDialog({isOpen: false})}
                onConfirm={async() => await onCancelManualOrder(confirmDialog?.id || dataSelectedOrder?.map(pack => pack?.packId))}
            />}

            {!!dataSmeNote && 
            <SmeNoteDialog 
                dataSmeNote={dataSmeNote} 
                onHide={() => setDataSmeNote()}
            />}

            {!!result && 
            <ResultDialog 
                onHide={() => setResult()} 
                result={result} action={result?.action}
            />}

            {exportOrderDialog && 
            <ExportOrderDialog 
                show={exportOrderDialog}
                onHide={() => setExportOrderDialog(false)}
            />}

            <CardBody>
                <Filter
                    onShowImportDialog={() => setImportFileDialog(true)}
                    onShowExportDialog={() => setExportOrderDialog(true)}
                    onOpenConfirmDialog={() => setConfirmDialog({isOpen: true})}
                    searchType={searchType}
                    setSearchType={setSearchType}
                    valueRangeTime={valueRangeTime}
                    setValueRangeTime={setValueRangeTime}
                    setTypeSearchTime={setTypeSearchTime}
                    typeSearchTime={typeSearchTime}
                    whereCondition={whereCondition}
                    dataSelectedOrder={dataSelectedOrder}
                    dataSmeWarehouse={dataSmeWarehouse}
                    dataScWareHouse={dataScWareHouse}
                    onSetDataSmeNote={() => setDataSmeNote(() => ({id: dataSelectedOrder.filter(pack => (['READY_TO_SHIP', 'PENDING']?.includes(pack?.status)))?.map(item => item?.id),smeNote: ''}))}
                    dataFilterStoreChannel={{currentChannels, channelsActive, currentStores, optionsStores, loadingStore}}   
                />
                <Table
                    setDataSmeNote={setDataSmeNote}
                    onOpenConfirmDialog={(id) => setConfirmDialog({isOpen: true, id})}
                    dataSelectedOrder={dataSelectedOrder}
                    setDataSelectedOrder={setDataSelectedOrder}
                    limit={limit}
                    page={page}
                    dataSmeVariant={{
                        smeVariants,
                        loadingSmeVariant
                    }}
                    dataTable={dataTable}
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
    "order_sales_person_list_view": {
        router: '/order-sales-person/list-order',
        actions: [
            "scGetPackages", "scPackageAggregate", "sme_warehouses", "sc_stores", "op_connector_channels", 
            "coGetShippingCarrierFromListPackage", "coGetPaymentMethodFromListPackage", "cancelManualOrder"
        ],
        name: 'Xem danh sách',
        group_code: 'order_sales_person',
        group_name: 'Đơn của tôi',
        cate_code: 'order_service',
        cate_name: 'Quản lý đơn hàng',
    },
    "order_sales_person_create_manual": {
        router: '/orders/create-manual',
        actions: [
            "sme_catalog_inventory_items", 'sme_catalog_inventory_items_aggregate', 'crmGetChannelCode', "crmGetCustomers", "crmSearchRecipientAddressByCustomer",
            "saveManualOrder", "crmGetWards",
            "crmGetProvince", "crmGetDistrict", "prvListProvider", "scGetShippingUnit", "coGetLogisticServices"
        ],
        name: 'Tạo đơn thủ công',
        group_code: 'order_sales_person',
        group_name: 'Đơn của tôi',
        cate_code: 'order_service',
        cate_name: 'Quản lý đơn hàng',
    },
    "order_sales_person_export_file": {
        router: '',
        actions: [
            "scExportOrderAggregate", "coGetShippingCarrierFromListPackage", "sc_stores", "op_connector_channels", "scExportOrder", "scGetJobTrackingExportOrder", "co_get_job_tracking_export_order"
        ],
        name: 'Xuất file đơn của tôi',
        group_code: 'order_sales_person',
        group_name: 'Đơn của tôi',
        cate_code: 'order_service',
        cate_name: 'Quản lý đơn hàng',
    },
    "order_sales_person_order_detail_view": {
        router: '/order-sales-person/manual/:id',
        actions: [
            "findOrderDetail", "sc_stores", "op_connector_channels", "crmFindCrmCustomerRecipientAddress", "crmFindCustomer", "sme_catalog_inventory_items", "sme_catalog_inventory_items_aggregate"
        ],
        name: 'Xem chi tiết đơn của tôi',
        group_code: 'order_sales_person',
        group_name: 'Đơn của tôi',
        cate_code: 'order_service',
        cate_name: 'Quản lý đơn hàng',
    },
    "order_sales_person_order_cancel": {
        router: '/orders/create-manual',
        actions: [
            "cancelManualOrder", 'scGetPackages', 'scPackageAggregate'
        ],
        name: 'Hủy đơn',
        group_code: 'order_sales_person',
        group_name: 'Đơn của tôi',
        cate_code: 'order_service',
        cate_name: 'Quản lý đơn hàng',
    },
    "order_sales_person_order_add_note": {
        router: '/orders/create-manual',
        actions: [
            "coUpdateOrderNote", 'scGetPackages', 'scPackageAggregate', 'sme_catalog_product_variant', 'scGetWarehouses'
        ],
        name: 'Thêm ghi chú',
        group_code: 'order_sales_person',
        group_name: 'Đơn của tôi',
        cate_code: 'order_service',
        cate_name: 'Quản lý đơn hàng',
    },
};