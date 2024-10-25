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
import query_sfCountSessionReceived from "../../../../../graphql/query_sfCountSessionReceived";
import query_sfListSessionReceived from "../../../../../graphql/query_sfListSessionReceived";
import query_smeCatalogStores from "../../../../../graphql/query_smeCatalogStores";
import LoadingDialog from "../../../FrameImage/LoadingDialog";
import HtmlPrint from "../../HtmlPrint";
import ModalConfirmCancel from "../../dialog/ModalConfirmCancel";
import { OPTIONS_SEARCH_SESSION_RECIEVED } from "../OrderFulfillmentHelper";
import OrderFulfillmentFilter from "../OrderSessionDeliveryList/OrderSessionDeliveryFilter";
import ModalResultActions from "../components/ModalResultActions";
import OrderSessionReceivedTable from "./OrderSessionReceivedTable";
import mutate_sfCancelSessionReceived from "../../../../../graphql/mutate_sfCancelSessionReceived";
import mutate_sfPrintSessionReceived from "../../../../../graphql/mutate_sfPrintSessionReceived";
import mutate_sfApproveSessionReceived from "../../../../../graphql/mutate_sfApproveSessionReceived";

const OrderSessionReceivedList = () => {
    const params = queryString.parse(useLocation().search.slice(1, 100000));
    const { formatMessage } = useIntl();
    // const { setBreadcrumbs } = useSubheader();
    const [ids, setIds] = useState([]);
    const [dataResults, setDataResults] = useState(null);
    const [currentAction, setCurrentAction] = useState(null);
    const [html, setHtml] = useState(false);
    const [namePrint, setNamePrint] = useState('');
    const { addToast } = useToasts();

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
            return { time_type: params?.time_type || OPTIONS_SEARCH_SESSION_RECIEVED[0].value };
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

    const { data: dataSfListSessionReceived, loading: loadingSfListSessionReceived, error: errorSfListSessionReceived } = useQuery(query_sfListSessionReceived, {
        variables,
        fetchPolicy: 'cache-and-network'
    });

    const { data: dataSfCountSessionReceived } = useQuery(query_sfCountSessionReceived, {
        variables: {
            search: omit(variables?.search, ['status'])
        },
        fetchPolicy: 'cache-and-network'
    });

    const [mutateSfPrintRecieved, { loading: loadingSfPrintRecieved }] = useMutation(mutate_sfPrintSessionReceived);

    const [mutateSfCancelSessionRecieved, { loading: loadingSfCancelSessionRecieved }] = useMutation(mutate_sfCancelSessionReceived, {
        awaitRefetchQueries: true,
        refetchQueries: ['sfListSessionReceived', 'sfCountSessionReceived']
    });

    const [mutateSfCompleteSessionRecieved, { loading: loadingSfCompleteSessionRecieved }] = useMutation(mutate_sfApproveSessionReceived, {
        awaitRefetchQueries: true,
        refetchQueries: ['sfListSessionReceived', 'sfCountSessionReceived']
    });

    const onPrintReceived = useCallback(async (id) => {
        try {
            const { data } = await mutateSfPrintRecieved({
                variables: {
                    list_session_received_id: !!id ? [id] : ids?.map(item => item?.id)
                }
            });

            if (!!id) {
                if (!!data?.sfPrintSessionReceived?.list_fail?.length == 0) {
                    setHtml(data?.sfPrintSessionReceived?.html);
                    setNamePrint(formatMessage({ defaultMessage: 'In_biên_bản_nhận' }));
                } else {
                    addToast(data?.sfPrintSessionReceived?.message || 'In biên bản thất bại', { appearance: 'error' });
                }
            } else {
                setDataResults({
                    type: 'print',
                    html: data?.sfPrintSessionReceived?.html,
                    list_fail: data?.sfPrintSessionReceived?.list_fail,
                    total: ids?.length,
                    total_success: ids?.length - data?.sfPrintSessionReceived?.list_fail?.length,
                    total_fail: data?.sfPrintSessionReceived?.list_fail?.length,
                });
                setIds([]);
            }
        } catch (error) {
            addToast(formatMessage({ defaultMessage: 'Đã có lỗi xảy ra, xin vui lòng thử lại' }), { appearance: 'error' });
        }
    }, [ids]);

    const onCancelSessionRecieved = useCallback(async () => {
        const isSingle = !!currentAction?.id;
        const { data } = await mutateSfCancelSessionRecieved({
            variables: {
                list_received_id: isSingle ? [currentAction?.id] : ids?.map(item => item?.id)
            }
        })

        if (isSingle) {
            if (!!data?.sfCancelSessionReceived?.list_fail?.length == 0) {
                addToast(formatMessage({ defaultMessage: 'Hủy phiên giao thành công' }), { appearance: "success" });
            } else {
                addToast(data?.sfCancelSessionReceived?.list_fail?.[0]?.error_message || formatMessage({ defaultMessage: 'Hủy phiên giao thất bại' }), { appearance: "error" });
            }
        } else {
            setDataResults({
                type: 'cancel',
                list_fail: data?.sfCancelSessionReceived?.list_fail,
                total: ids?.length,
                total_success: ids?.length - data?.sfCancelSessionReceived?.list_fail?.length,
                total_fail: data?.sfCancelSessionReceived?.list_fail?.length,
            });
            setIds([]);
        }
        setCurrentAction(null);
    }, [ids, currentAction]);

    const onCompleteSessionRecieved = useCallback(async () => {
        const isSingle = !!currentAction?.id;
        const { data } = await mutateSfCompleteSessionRecieved({
            variables: {
                list_received_id: isSingle ? [currentAction?.id] : ids?.map(item => item?.id)
            }
        });

        if (isSingle) {
            if (!!data?.sfApproveSessionReceived?.list_fail?.length == 0) {
                addToast(formatMessage({ defaultMessage: 'Nhận hàng thành công' }), { appearance: "success" });
            } else {
                addToast(data?.sfApproveSessionReceived?.list_fail?.[0]?.error_message || formatMessage({ defaultMessage: 'Nhận hàng thất bại' }), { appearance: "error" });
            }
        } else {
            setDataResults({
                type: 'complete',
                list_fail: data?.sfApproveSessionReceived?.list_fail,
                total: ids?.length,
                total_success: ids?.length - data?.sfApproveSessionReceived?.list_fail?.length,
                total_fail: data?.sfApproveSessionReceived?.list_fail?.length,
            });
            setIds([]);
        }
        setCurrentAction(null);
    }, [ids, currentAction]);

    return <>
        <LoadingDialog show={loadingSfCancelSessionRecieved || loadingSfCompleteSessionRecieved || loadingSfPrintRecieved} />

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
                ? formatMessage({ defaultMessage: 'Bạn có chắc chắn muốn hủy phiên nhận?' })
                : formatMessage({ defaultMessage: 'Bạn xác nhận nhận các kiện hàng từ đơn vị vận chuyển?' })
            }
            show={currentAction?.action == 'cancel' || currentAction?.action == 'complete'}
            titleSuccess={currentAction?.action == 'complete' ? formatMessage({ defaultMessage: 'Xác nhận' }) : formatMessage({ defaultMessage: 'Có, Hủy' })}
            onHide={() => setCurrentAction(null)}
            onConfirm={currentAction?.action == 'complete' ? onCompleteSessionRecieved : onCancelSessionRecieved}
        />

        <ModalResultActions
            type="received"
            result={dataResults}
            onHide={() => setDataResults(null)}
        />

        <OrderFulfillmentFilter
            // optionsSmeWarehouse={optionsSmeWarehouse}
            session="received"
        />

        <OrderSessionReceivedTable
            limit={limit}
            page={page}
            ids={ids}
            params={params}
            onPrintReceived={onPrintReceived}
            setCurrentAction={setCurrentAction}
            dataSfCountSessionReceived={dataSfCountSessionReceived}
            error={errorSfListSessionReceived}
            setIds={setIds}
            loading={loadingSfListSessionReceived}
            data={dataSfListSessionReceived?.sfListSessionReceived}
        />

    </>
}

export default memo(OrderSessionReceivedList)

export const actionKeys = {    
    "order_session_received_create": {
        router: '/orders/session-received/create',
        actions: [
            "sc_stores", "op_connector_channels", "sme_warehouses", "sfSessionReceivedShippingCarrier",
            "scGetWarehouses", "sfFindPackageReceive", "sfCreateSessionReceived", "sfGetListPackageReceive"
        ],
        name: 'Tạo danh sách phiên nhận',
        group_code: 'order_session_received',
        group_name: 'Phiên nhận',
        cate_code: 'order_service',
        cate_name: 'Quản lý đơn hàng',
    },
    "order_session_received_actions": {
        router: '',
        actions: [
            "findSessionReceivedDetail", "sfFindPackageReceive", "sme_warehouses", "findSessionHandoverDetail", "sfDeleteReceivedPackage", "sfAddReceivedPackage",
            "sfChangeReceivedPackage", "sfPrintSessionReceived", "sfApproveSessionReceived", "sfCancelSessionReceived", "sfPrintSessionReceived"
        ],
        name: 'Thao tác với danh sách phiên nhận',
        group_code: 'order_session_received',
        group_name: 'Phiên nhận',
        cate_code: 'order_service',
        cate_name: 'Quản lý đơn hàng',
    },
}