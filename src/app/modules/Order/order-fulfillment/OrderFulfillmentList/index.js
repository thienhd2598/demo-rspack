import React, { Fragment, memo, useCallback, useLayoutEffect, useMemo, useState } from "react";
import { useIntl } from "react-intl";
import { Card, CardBody } from "../../../../../_metronic/_partials/controls";
import OrderFulfillmentFilter from "./OrderFulfillmentFilter";
import OrderFulfillmentTable from "./OrderFulfillmentTable";
import { useSubheader } from "../../../../../_metronic/layout";
import { useLocation } from 'react-router-dom';
import { Helmet } from "react-helmet-async";
import { useMutation, useQuery } from "@apollo/client";
import query_sfListSessionPick from "../../../../../graphql/query_sfListSessionPick";
import queryString from 'querystring';
import query_smeCatalogStores from "../../../../../graphql/query_smeCatalogStores";
import query_sfCountSessionPick from "../../../../../graphql/query_sfCountSessionPick";
import { omit } from "lodash";
import query_userGetSubUsers from "../../../../../graphql/query_userGetSubUsers";
import mutate_sfAssignPickupPic from "../../../../../graphql/mutate_sfAssignPickupPic";
import mutate_sfCancelSessionPickup from "../../../../../graphql/mutate_sfCancelSessionPickup";
import ModalConfirmCancel from "../../dialog/ModalConfirmCancel";
import LoadingDialog from "../../../FrameImage/LoadingDialog";
import { useToasts } from "react-toast-notifications";
import ModalAssignPic from "../components/ModalAssignPic";
import mutate_sfPackSessionPickup from "../../../../../graphql/mutate_sfPackSessionPickup";
import ModalResultActions from "../components/ModalResultActions";
import mutate_sfPrintPickup from "../../../../../graphql/mutate_sfPrintPickup";
import HtmlPrint from "../../HtmlPrint";
import dayjs from "dayjs";

const OrderFulfillmentList = () => {
    const params = queryString.parse(useLocation().search.slice(1, 100000));
    const { formatMessage } = useIntl();
    const { setBreadcrumbs } = useSubheader();
    const [ids, setIds] = useState([]);
    const [dataResults, setDataResults] = useState(null);
    const [currentAction, setCurrentAction] = useState(null);
    const [html, setHtml] = useState(false);
    const [namePrint, setNamePrint] = useState('');
    const { addToast } = useToasts();

    useLayoutEffect(() => {
        setBreadcrumbs([
            { title: formatMessage({ defaultMessage: 'Danh sách xử lý đơn' }) }
        ])
    }, []);

    const { data: dataCatalogStores } = useQuery(query_smeCatalogStores, {
        variables: {
            where: {
                fulfillment_by: { _eq: 1 },
                status: {_eq: 10}
            }
        },
        fetchPolicy: 'cache-and-network'
    });

    const optionsSmeWarehouse = useMemo(() => {
        const optionsCatalogStores = dataCatalogStores?.sme_warehouses?.map(
            _store => ({
                value: _store?.id,
                label: _store?.name,
                isDefault: _store?.is_default,
                ..._store
            })
        );

        return optionsCatalogStores
    }, [dataCatalogStores]);

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

    const type = useMemo(() => {
        try {
            if (!params?.type) return {};
            return { type: params?.type };
        } catch (error) {
            return {};
        }
    }, [params.type]);

    const code = useMemo(() => {
        try {
            if (!params?.code) return {};
            return { code: params?.code };
        } catch (error) {
            return {};
        }
    }, [params.code]);

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
                ...range_time,
                ...status,
                ...type,
                ...code,
                ...sme_warehouse_id
            }
        }
    }, [limit, page, range_time, status, type, code, sme_warehouse_id]);

    const { data: dataSfListSessionPick, loading: loadingSfListSessionPick, error: errorSfListSessionPick } = useQuery(query_sfListSessionPick, {
        variables,
        fetchPolicy: 'cache-and-network'
    });

    const { data: dataSfCountSessionPick } = useQuery(query_sfCountSessionPick, {
        variables: {
            search: omit(variables?.search, ['status'])
        },
        fetchPolicy: 'cache-and-network'
    });

    const { data: dataSubUsers } = useQuery(query_userGetSubUsers, {
        variables: {
            page: 1,
            pageSize: 200,
        },
        fetchPolicy: 'cache-and-network'
    });

    const optionsSubUser = useMemo(() => {
        if (!dataSubUsers?.userGetSubUsers) return []

        return dataSubUsers?.userGetSubUsers?.items?.map(item => ({
            ...item,
            value: item?.id,
            label: item?.username,
        }))
    }, [dataSubUsers]);

    const [mutateSfAssignPickupPic, { loading: loadingSfAssignPickupPic }] = useMutation(mutate_sfAssignPickupPic, {
        awaitRefetchQueries: true,
        refetchQueries: ['sfListSessionPick', 'sfCountSessionPick']
    });

    const [mutateSfPrintPickup, { loading: loadingSfPrintPickup }] = useMutation(mutate_sfPrintPickup);

    const [mutateSfCancelSessionPickup, { loading: loadingSfCancelSessionPickup }] = useMutation(mutate_sfCancelSessionPickup, {
        awaitRefetchQueries: true,
        refetchQueries: ['sfListSessionPick', 'sfCountSessionPick']
    });

    const [mutateSfPackSessionPickup, { loading: loadingSfPackSessionPickup }] = useMutation(mutate_sfPackSessionPickup, {
        awaitRefetchQueries: true,
        refetchQueries: ['sfListSessionPick', 'sfCountSessionPick']
    });

    const onPrintPickup = useCallback(async (id, type) => {
        try {
            const { data } = await mutateSfPrintPickup({
                variables: {
                    id,
                    print_type: type,
                }
            });

            if (data?.sfPrintPickup?.success) {
                if (type == 4) {
                    window.open(data?.sfPrintPickup?.html);
                    return;
                }

                setHtml(data?.sfPrintPickup?.html);
                setNamePrint(type == 1 ? formatMessage({ defaultMessage: 'In_phiếu_nhặt_hàng' }) : formatMessage({ defaultMessage: 'In_phiếu_xuất_kho' }));
            } else {
                addToast(data?.sfPrintPickup?.message || 'In danh sách thất bại', { appearance: 'error' });
            }
        } catch (error) {
            addToast(formatMessage({ defaultMessage: 'Đã có lỗi xảy ra, xin vui lòng thử lại' }), { appearance: 'error' });
        }
    }, []);

    const onCancelSessionPick = useCallback(async () => {
        const isSingle = !!currentAction?.id;
        const { data } = await mutateSfCancelSessionPickup({
            variables: {
                list_session_pickup_id: isSingle ? [currentAction?.id] : ids?.map(item => item?.id)
            }
        })

        if (isSingle) {
            if (!!data?.sfCancelSessionPickup?.list_fail?.length == 0) {
                addToast(formatMessage({ defaultMessage: 'Hủy danh sách xử lý đơn thành công' }), { appearance: "success" });
            } else {
                addToast(data?.sfCancelSessionPickup?.list_fail?.[0]?.error_message || formatMessage({ defaultMessage: 'Hủy danh sách xử lý đơn thất bại' }), { appearance: "error" });
            }
        } else {
            setDataResults({
                type: 'cancel',
                list_fail: data?.sfCancelSessionPickup?.list_fail,
                total: ids?.length,
                total_success: ids?.length - data?.sfCancelSessionPickup?.list_fail?.length,
                total_fail: data?.sfCancelSessionPickup?.list_fail?.length,
            });
            setIds([]);
        }
        setCurrentAction(null);
    }, [ids, currentAction]);

    const onPackSessionPick = useCallback(async (id) => {
        const { data } = await mutateSfPackSessionPickup({
            variables: {
                list_id: !!id ? [id] : ids?.map(item => item?.id)
            }
        })

        if (!!data?.sfPackSessionPickup?.success) {
            addToast(formatMessage({ defaultMessage: 'Chuẩn bị hàng thành công' }), { appearance: "success" });
        } else {
            addToast(data?.sfPackSessionPickup?.message || formatMessage({ defaultMessage: 'Chuẩn bị hàng thất bại' }), { appearance: "error" });
        }

        !id && setIds([]);
    }, [ids]);

    const onAssignSessionPick = useCallback(async (currentPic) => {
        const isSingle = !!currentAction?.id;
        const { data } = await mutateSfAssignPickupPic({
            variables: {
                pic_id: String(currentPic),
                list_session_pickup_id: isSingle ? [currentAction?.id] : ids?.map(item => item?.id),
            }
        })

        if (isSingle) {
            if (!!data?.sfAssignPickupPic?.list_fail?.length == 0) {
                addToast(formatMessage({ defaultMessage: 'Phân công nhân viên thành công' }), { appearance: "success" });
            } else {
                addToast(data?.sfAssignPickupPic?.list_fail?.[0]?.error_message || formatMessage({ defaultMessage: 'Phân công nhân viên thất bại' }), { appearance: "error" });
            }
        } else {
            setDataResults({
                type: 'assign',
                list_fail: data?.sfAssignPickupPic?.list_fail,
                total: ids?.length,
                total_success: ids?.length - data?.sfAssignPickupPic?.list_fail?.length,
                total_fail: data?.sfAssignPickupPic?.list_fail?.length,
            });
            setIds([]);
        }
        setCurrentAction(null);
    }, [ids, currentAction]);

    console.log({ dataSfListSessionPick, dataSfCountSessionPick, optionsSubUser });

    return <Fragment>
        <Helmet
            titleTemplate={formatMessage({ defaultMessage: 'Danh sách xử lý đơn - UpBase' })}
            defaultTitle={formatMessage({ defaultMessage: 'Danh sách xử lý đơn - UpBase' })}
        >
            <meta
                name="description"
                content={formatMessage({ defaultMessage: 'Danh sách xử lý đơn - UpBase' })}
            />
        </Helmet>
        <Card>
            <CardBody>
                <LoadingDialog show={loadingSfAssignPickupPic || loadingSfCancelSessionPickup || loadingSfPackSessionPickup || loadingSfPrintPickup} />
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
                    title={formatMessage({ defaultMessage: 'Bạn có chắc chắn muốn hủy danh sách xử lý đơn ?' })}
                    show={currentAction?.action == 'cancel'}
                    onHide={() => setCurrentAction(null)}
                    onConfirm={onCancelSessionPick}
                />
                <ModalResultActions
                    result={dataResults}
                    onHide={() => setDataResults(null)}
                />
                <ModalAssignPic
                    show={currentAction?.action == 'assign'}
                    onHide={() => setCurrentAction(null)}
                    onConfirm={(currentPic) => onAssignSessionPick(currentPic)}
                    optionsSubUser={optionsSubUser}
                />
                <OrderFulfillmentFilter
                    optionsSmeWarehouse={optionsSmeWarehouse}
                />
                <OrderFulfillmentTable
                    limit={limit}
                    page={page}
                    ids={ids}
                    params={params}
                    onPrintPickup={onPrintPickup}
                    setCurrentAction={setCurrentAction}
                    optionsSubUser={optionsSubUser}
                    dataSfCountSessionPick={dataSfCountSessionPick}
                    onPackSessionPick={onPackSessionPick}
                    error={errorSfListSessionPick}
                    setIds={setIds}
                    loading={loadingSfListSessionPick}
                    data={dataSfListSessionPick?.sfListSessionPick}
                />
            </CardBody>
        </Card>
    </Fragment>
}

export default memo(OrderFulfillmentList);

export const actionKeys = {
    "order_session_pickup_view": {
        router: '/orders/fulfillment/list',
        actions: [
            "sfListSessionPick", "sme_warehouses", "sfCountSessionPick", "userGetSubUsers",            
        ],
        name: 'Xem danh sách xử lý',
        group_code: 'order_session_pickup',
        group_name: 'Xử lý theo danh sách',
        cate_code: 'order_service',
        cate_name: 'Quản lý đơn hàng',
    },
    "order_session_pickup_create": {
        router: '/orders/fulfillment/create',
        actions: [
            "sc_stores", "op_connector_channels", "sme_warehouses", "coGetShippingCarrierFromListPackage",
            "scGetWarehouses", "sfCreateSessionPickup", "scGetPackages", "scPackageAggregate", "scSfPackageCount"
        ],
        name: 'Tạo danh sách xử lý',
        group_code: 'order_session_pickup',
        group_name: 'Xử lý theo danh sách',
        cate_code: 'order_service',
        cate_name: 'Quản lý đơn hàng',
    },
    "order_session_pickup_actions": {
        router: '',
        actions: [
            "sfAssignPickupPic", "sfCancelSessionPickup", "sfPackSessionPickup", "sfPrintPickup", "findSessionPickupDetail", "sfUpdateNote",
            "sfListPackageInSessionPickup", "sfListProductInSessionPickup", "sme_catalog_product_variant", "sme_catalog_product_variant_aggregate", "sfDeleteSessionPickupPackage",
            "sfPackSessionPickupPackages", "sfCountPackageInSessionPickup", "getShipmentLabel", "coExportSessionPick", "sfPrintPackageInPickup"
        ],
        name: 'Thao tác với danh sách xử lý',
        group_code: 'order_session_pickup',
        group_name: 'Xử lý theo danh sách',
        cate_code: 'order_service',
        cate_name: 'Quản lý đơn hàng',
    },
}