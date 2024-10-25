import { useMutation, useQuery } from "@apollo/client";
import dayjs from "dayjs";
import { omit } from "lodash";
import queryString from 'querystring';
import React, { memo, useCallback, useLayoutEffect, useMemo, useState } from "react";
import { useIntl } from "react-intl";
import { useLocation } from 'react-router-dom';
import { useToasts } from "react-toast-notifications";
import { useSubheader } from "../../../../../_metronic/layout";
import mutate_sfCancelSessionHandover from "../../../../../graphql/mutate_sfCancelSessionHandover";
import mutate_sfCompleteSessionHandover from "../../../../../graphql/mutate_sfCompleteSessionHandover";
import mutate_sfPrintHandover from "../../../../../graphql/mutate_sfPrintHandover";
import query_sfCountSessionHandover from "../../../../../graphql/query_sfCountSessionHandover";
import query_sfListSessionHandover from "../../../../../graphql/query_sfListSessionHandover";
import query_smeCatalogStores from "../../../../../graphql/query_smeCatalogStores";
import LoadingDialog from "../../../FrameImage/LoadingDialog";
import HtmlPrint from "../../HtmlPrint";
import ModalConfirmCancel from "../../dialog/ModalConfirmCancel";
import { OPTIONS_SEARCH_SESSION_DELIVERY } from "../OrderFulfillmentHelper";
import ModalResultActions from "../components/ModalResultActions";
import OrderFulfillmentFilter from "./OrderSessionDeliveryFilter";
import OrderFulfillmentTable from "./OrderSessionDeliveryTable";

const OrderSessionDeliveryList = () => {
    const params = queryString.parse(useLocation().search.slice(1, 100000));
    const { formatMessage } = useIntl();
    // const { setBreadcrumbs } = useSubheader();
    const [ids, setIds] = useState([]);
    const [dataResults, setDataResults] = useState(null);
    const [currentAction, setCurrentAction] = useState(null);
    const [html, setHtml] = useState(false);
    const [namePrint, setNamePrint] = useState('');
    const { addToast } = useToasts();

    // useLayoutEffect(() => {
    //     setBreadcrumbs([
    //         { title: formatMessage({ defaultMessage: 'Danh sách phiên giao' }) }
    //     ])
    // }, []);

    // const { data: dataCatalogStores } = useQuery(query_smeCatalogStores, {
    //     variables: {
    //         where: {
    //             fulfillment_by: { _eq: 1 },
    //             status: { _eq: 10 }
    //         }
    //     },
    //     fetchPolicy: 'cache-and-network'
    // });

    // const optionsSmeWarehouse = useMemo(() => {
    //     const optionsCatalogStores = dataCatalogStores?.sme_warehouses?.map(
    //         _store => ({
    //             value: _store?.id,
    //             label: _store?.name,
    //             isDefault: _store?.is_default,
    //             ..._store
    //         })
    //     );

    //     return optionsCatalogStores
    // }, [dataCatalogStores]);

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

    const shipping_carrier = useMemo(() => {
        try {
            if (!params?.shipping_carrier) return {};
            return { shipping_carrier: params?.shipping_carrier };
        } catch (error) {
            return {};
        }
    }, [params.shipping_carrier]);

    const code = useMemo(() => {
        try {
            if (!params?.code) return {};
            return { code: params?.code };
        } catch (error) {
            return {};
        }
    }, [params.code]);

    const time_type = useMemo(() => {
        try {
            return { time_type: params?.time_type || OPTIONS_SEARCH_SESSION_DELIVERY[0].value };
        } catch (error) {
            return {};
        }
    }, [params.time_type]);

    const status = useMemo(() => {
        try {
            if (!params?.status) return {};
            return { status: +params?.status };
        } catch (error) {
            return {};
        }
    }, [params.status]);

    const sme_warehouse_id = useMemo(() => {
        try {
            if (!params?.sme_warehouse_id) return {};
            return { sme_warehouse_id: +params?.sme_warehouse_id };
        } catch (error) {
            return {};
        }
    }, [params.sme_warehouse_id]);


    const range_time = useMemo(() => {
        try {
            if (!params.gt || !params.lt) return {
                range_time: [
                    dayjs().subtract(29, "day").startOf("day").unix(),
                    dayjs().endOf("day").unix(),
                ]
            };

            return {
                range_time: [Number(params?.gt), Number(params?.lt)],
            };
        } catch (error) {
            return {};
        }
    }, [params?.gt, params?.lt]);


    const variables = useMemo(() => {
        return {
            page,
            per_page: limit,
            search: {
                ...shipping_carrier,
                ...range_time,
                ...status,
                ...time_type,
                ...code,
                ...sme_warehouse_id
            }
        }
    }, [limit, page, range_time, status, time_type, shipping_carrier, code, sme_warehouse_id]);

    const { data: dataSfListSessionHandover, loading: loadingSfListSessionHandover, error: errorSfListSessionHandover } = useQuery(query_sfListSessionHandover, {
        variables,
        fetchPolicy: 'cache-and-network'
    });

    const { data: dataSfCountSessionHandover } = useQuery(query_sfCountSessionHandover, {
        variables: {
            search: omit(variables?.search, ['status'])
        },
        fetchPolicy: 'cache-and-network'
    });

    const [mutateSfPrintHandover, { loading: loadingSfPrintHandover }] = useMutation(mutate_sfPrintHandover);

    const [mutateSfCancelSessionHandover, { loading: loadingSfCancelSessionHandover }] = useMutation(mutate_sfCancelSessionHandover, {
        awaitRefetchQueries: true,
        refetchQueries: ['sfListSessionHandover', 'sfCountSessionHandover']
    });

    const [mutateSfCompleteSessionHandover, { loading: loadingSfCompleteSessionHandover }] = useMutation(mutate_sfCompleteSessionHandover, {
        awaitRefetchQueries: true,
        refetchQueries: ['sfListSessionHandover', 'sfCountSessionHandover']
    });

    const onPrintHandover = useCallback(async (id) => {
        try {
            const { data } = await mutateSfPrintHandover({
                variables: {
                    list_handover_id: !!id ? [id] : ids?.map(item => item?.id)
                }
            });

            if (!!id) {
                if (!!data?.sfPrintHandover?.list_fail?.length == 0) {
                    setHtml(data?.sfPrintHandover?.html);
                    setNamePrint(formatMessage({ defaultMessage: 'In_biên_bản_bàn_giao' }));
                } else {
                    addToast(data?.sfPrintHandover?.message || 'In biên bản thất bại', { appearance: 'error' });
                }
            } else {
                setDataResults({
                    type: 'print',
                    html: data?.sfPrintHandover?.html,
                    list_fail: data?.sfPrintHandover?.list_fail,
                    total: ids?.length,
                    total_success: ids?.length - data?.sfPrintHandover?.list_fail?.length,
                    total_fail: data?.sfPrintHandover?.list_fail?.length,
                });
                setIds([]);
            }
            // if (data?.sfPrintPickup?.success) {
            //     setHtml(data?.sfPrintPickup?.html);
            //     setNamePrint(type == 1 ? formatMessage({ defaultMessage: 'In_phiếu_nhặt_hàng' }) : formatMessage({ defaultMessage: 'In_phiếu_xuất_kho' }));
            // } else {
            //     addToast(data?.sfPrintPickup?.message || 'In danh sách thất bại', { appearance: 'error' });
            // }
        } catch (error) {
            addToast(formatMessage({ defaultMessage: 'Đã có lỗi xảy ra, xin vui lòng thử lại' }), { appearance: 'error' });
        }
    }, [ids]);

    const onCancelSessionHandover = useCallback(async () => {
        const isSingle = !!currentAction?.id;
        const { data } = await mutateSfCancelSessionHandover({
            variables: {
                list_handover_id: isSingle ? [currentAction?.id] : ids?.map(item => item?.id)
            }
        })

        if (isSingle) {
            if (!!data?.sfCancelSessionHandover?.list_fail?.length == 0) {
                addToast(formatMessage({ defaultMessage: 'Hủy phiên giao thành công' }), { appearance: "success" });
            } else {
                addToast(data?.sfCancelSessionHandover?.list_fail?.[0]?.error_message || formatMessage({ defaultMessage: 'Hủy phiên giao thất bại' }), { appearance: "error" });
            }
        } else {
            setDataResults({
                type: 'cancel',
                list_fail: data?.sfCancelSessionHandover?.list_fail,
                total: ids?.length,
                total_success: ids?.length - data?.sfCancelSessionHandover?.list_fail?.length,
                total_fail: data?.sfCancelSessionHandover?.list_fail?.length,
            });
            setIds([]);
        }
        setCurrentAction(null);
    }, [ids, currentAction]);

    const onCompleteSessionHandover = useCallback(async () => {
        const isSingle = !!currentAction?.id;
        const { data } = await mutateSfCompleteSessionHandover({
            variables: {
                list_handover_id: isSingle ? [currentAction?.id] : ids?.map(item => item?.id)
            }
        });

        if (isSingle) {
            if (!!data?.sfCompleteSessionHandover?.list_fail?.length == 0) {
                addToast(formatMessage({ defaultMessage: 'Bàn giao phiên thành công' }), { appearance: "success" });
            } else {
                addToast(data?.sfCompleteSessionHandover?.list_fail?.[0]?.error_message || formatMessage({ defaultMessage: 'Bàn giao phiên thất bại' }), { appearance: "error" });
            }
        } else {
            setDataResults({
                type: 'complete',
                list_fail: data?.sfCompleteSessionHandover?.list_fail,
                total: ids?.length,
                total_success: ids?.length - data?.sfCompleteSessionHandover?.list_fail?.length,
                total_fail: data?.sfCompleteSessionHandover?.list_fail?.length,
            });
            setIds([]);
        }
        setCurrentAction(null);
    }, [ids, currentAction]);


    return <>
        <LoadingDialog show={loadingSfCancelSessionHandover || loadingSfCompleteSessionHandover || loadingSfPrintHandover} />
        {html && namePrint && <HtmlPrint
            setNamePrint={setNamePrint}
            html={html}
            setHtml={setHtml}
            namePrint={namePrint}
            pageStyle={`
                            @page {
                                margin: auto;
                                size: A8 landscape;
                            }
                        `}
        />}
        <ModalConfirmCancel
            title={currentAction?.action == 'cancel'
                ? formatMessage({ defaultMessage: 'Bạn có chắc chắn muốn hủy phiên giao?' })
                : formatMessage({ defaultMessage: 'Bạn xác nhận bàn giao các kiện hàng cho đơn vị vận chuyển?' })
            }
            show={currentAction?.action == 'cancel' || currentAction?.action == 'complete'}
            titleSuccess={currentAction?.action == 'complete' ? formatMessage({ defaultMessage: 'Xác nhận' }) : formatMessage({ defaultMessage: 'Có, Hủy' })}
            onHide={() => setCurrentAction(null)}
            onConfirm={currentAction?.action == 'complete' ? onCompleteSessionHandover : onCancelSessionHandover}
        />
        <ModalResultActions
            type="handover"
            result={dataResults}
            onHide={() => setDataResults(null)}
        />
        <OrderFulfillmentFilter
        // optionsSmeWarehouse={optionsSmeWarehouse}
        />
        <OrderFulfillmentTable
            limit={limit}
            page={page}
            ids={ids}
            params={params}
            onPrintHandover={onPrintHandover}
            setCurrentAction={setCurrentAction}
            dataSfCountSessionHandover={dataSfCountSessionHandover}
            onCompleteSessionHandover={onCompleteSessionHandover}
            error={errorSfListSessionHandover}
            setIds={setIds}
            loading={loadingSfListSessionHandover}
            data={dataSfListSessionHandover?.sfListSessionHandover}
        />
    </>
}

export default memo(OrderSessionDeliveryList);

export const actionKeys = {
    "order_session_handover_view": {
        router: '/orders/session-delivery/list',
        actions: [
            "sfListSessionHandover", "sme_warehouses", "sfCountSessionHandover", "sfSessionHandoverShippingCarrier",
            "sfSessionReceivedShippingCarrier", "sfCountSessionReceived", "sfListSessionReceived"
        ],
        name: 'Xem danh sách phiên giao',
        group_code: 'order_session_handover',
        group_name: 'Phiên giao',
        cate_code: 'order_service',
        cate_name: 'Quản lý đơn hàng',
    },
    "order_session_handover_create": {
        router: '/orders/session-delivery/create',
        actions: [
            "sc_stores", "op_connector_channels", "sme_warehouses", "coGetShippingCarrierFromListPackage",
            "scGetWarehouses", "coGetPackage", "sfCreateSessionHandover"
        ],
        name: 'Tạo danh sách phiên giao',
        group_code: 'order_session_handover',
        group_name: 'Phiên giao',
        cate_code: 'order_service',
        cate_name: 'Quản lý đơn hàng',
    },
    "order_session_handover_actions": {
        router: '',
        actions: [
            "coGetPackage", "sme_warehouses", "findSessionHandoverDetail", "sfDeleteSessionHandoverPackage", "sfAddSessionHandoverPackage",
            "sfCancelSessionHandover", "sfCompleteSessionHandover", "sfPrintHandover"
        ],
        name: 'Thao tác với danh sách phiên giao',
        group_code: 'order_session_handover',
        group_name: 'Phiên giao',
        cate_code: 'order_service',
        cate_name: 'Quản lý đơn hàng',
    },
}