import React, { memo, useMemo, useCallback, useState, useLayoutEffect, Fragment } from 'react';
import { Helmet } from 'react-helmet-async';
import { FormattedMessage, useIntl } from 'react-intl';
import { useSubheader } from '../../../../../_metronic/layout';
import { useToasts } from 'react-toast-notifications';
import { useHistory, useLocation } from 'react-router-dom';
import query_sc_stores_basic from '../../../../../graphql/query_sc_stores_basic';
import { Card, CardBody } from '../../../../../_metronic/_partials/controls';
import ProductReserveFilter from './ProductReserveFilter';
import { useMutation, useQuery } from '@apollo/client';
import ModalInfoVariant from '../dialogs/ModalInfoVariant';
import ProductReserveTable from './ProductReserveTable';
import queryString from 'querystring';
import mutate_delete_warehouse_reserve_tickets from '../../../../../graphql/mutate_delete_warehouse_reserve_tickets';
import LoadingDialog from '../../../ProductsStore/product-new/LoadingDialog';
import mutate_userReserveRetryByTicket from '../../../../../graphql/mutate_userReserveRetryByTicket';
import mutate_userFinishReserveTicket from '../../../../../graphql/mutate_userFinishReserveTicket';
import ModalConfirm from '../dialogs/ModalConfirm';
import ModalResults from '../dialogs/ModalResults';

const ProductReserveList = () => {
    const { formatMessage } = useIntl();
    const history = useHistory();
    const location = useLocation();
    const { addToast } = useToasts();
    const { setBreadcrumbs } = useSubheader();
    const params = queryString.parse(location.search.slice(1, 100000));

    const [ids, setIds] = useState([]);
    const [action, setAction] = useState(null);
    const [dataResults, setDataResults] = useState(null);
    const [currentIdAction, setCurrentIdAction] = useState(null);

    useLayoutEffect(() => {
        setBreadcrumbs([
            { title: formatMessage({ defaultMessage: 'Dự trữ' }) },
        ])
    }, []);

    const { data: dataStores, loading: loadingStores } = useQuery(query_sc_stores_basic, {
        fetchPolicy: 'cache-and-network'
    });

    const [deleteReserveTicket, { loading: loadingDeleteReserveTicket }] = useMutation(mutate_delete_warehouse_reserve_tickets, {
        awaitRefetchQueries: true,
        refetchQueries: ['warehouse_reserve_tickets']
    });

    const [userReserveRetryByTicket, { loading: loadingUserReserveRetryByTicket }] = useMutation(mutate_userReserveRetryByTicket, {
        awaitRefetchQueries: true,
        refetchQueries: ['warehouse_reserve_tickets', 'warehouse_reserve_tickets_aggregate']
    });

    const [userFinishReserveTicket, { loading: loadingUserFinishReserveTicket }] = useMutation(mutate_userFinishReserveTicket, {
        awaitRefetchQueries: true,
        refetchQueries: ['warehouse_reserve_tickets', 'warehouse_reserve_tickets_aggregate']
    });

    const optionsStore = useMemo(() => {
        const stores = dataStores?.sc_stores?.map(store => {
            let findedChannel = dataStores?.op_connector_channels?.find(_ccc => _ccc.code == store.connector_channel_code);

            return {
                label: store?.name,
                value: store?.id,
                logo: findedChannel?.logo_asset_url
            };
        });

        return stores || [];
    }, [dataStores]);

    const sc_store_id = useMemo(() => {
        if (!params?.sc_store_id) return {};

        return { 
            sc_store_id: { 
                _in: params?.sc_store_id?.split(',').map(store => Number(store))
            } 
        }
    }, [params?.sc_store_id]);

    const status = useMemo(() => {
        if (!params?.status) return {};

        switch (params?.status) {
            case 'done':
                return {
                    status: { _eq: 'processing' }
                }
            case 'finished':
                return { status: { _eq: params?.status } }
            case 'error':
                return {
                    total_error: { _gt: 0 },
                    status: { _eq: 'processing' }
                }
            default:
                return {}
        }
    }, [params?.status]);

    const search = useMemo(() => {
        try {
            if (!params?.q) return {}

            return {
                name: {
                    _ilike: `%${params?.q?.trim()}%`
                }
            }
        } catch (err) {
            return {}
        }
    }, [params?.search_type, params?.q]);

    const whereCondition = useMemo(() => {
        return {
            ...status,
            ...sc_store_id,
            ...search
        }
    }, [status, sc_store_id, search]);

    const whereConditionCount = useMemo(() => {
        return {
            ...sc_store_id,
            ...search
        }
    }, [sc_store_id, search]);

    const titleAction = useMemo(() => {
        if (action == 'finish') {
            return formatMessage({ defaultMessage: 'Bạn có đồng ý dừng dự trữ phiếu?' })
        }
        if (action == 'delete') {
            return formatMessage({ defaultMessage: 'Bạn có đồng ý xóa dự trữ phiếu?' })
        }
    }, [action]);

    const onRemoveTicket = useCallback(async () => {
        try {
            const { data } = await deleteReserveTicket({
                variables: {
                    id: currentIdAction
                }
            });

            if (!!data?.delete_warehouse_reserve_tickets?.affected_rows) {
                addToast(formatMessage({ defaultMessage: 'Xóa phiếu dự trữ thành công' }), { appearance: "success" });
            } else {
                addToast(formatMessage({ defaultMessage: 'Xóa phiếu dự trữ thất bại' }), { appearance: "error" });
            }
        } catch (err) {
            addToast(formatMessage({ defaultMessage: 'Xóa phiếu dự trữ thất bại' }), { appearance: "error" });
        }
    }, [currentIdAction]);

    const onFinishTicket = useCallback(async () => {
        try {
            const { data } = await userFinishReserveTicket({
                variables: {
                    ids: [currentIdAction]
                }
            });

            if (!!data?.userFinishReserveTicket?.[0]?.success) {
                addToast(formatMessage({ defaultMessage: 'Dừng dự trữ thành công' }), { appearance: "success" });
            } else {
                addToast(formatMessage({ defaultMessage: 'Dừng dự trữ thất bại' }), { appearance: "error" });
            }
        } catch (err) {
            addToast(formatMessage({ defaultMessage: 'Dừng dự trữ thất bại' }), { appearance: "error" });
        }
    }, [currentIdAction]);

    const onRetryTicket = useCallback(async (id) => {
        try {
            const { data } = await userReserveRetryByTicket({
                variables: { ids: [id] }
            });

            if (!!data?.userReserveRetryByTicket?.[0]?.success) {
                addToast(formatMessage({ defaultMessage: 'Khấu trừ dự trữ thành công' }), { appearance: "success" });
            } else {
                addToast(formatMessage({ defaultMessage: 'Khấu trừ dự trữ thất bại' }), { appearance: "error" });
            }
        } catch (err) {
            addToast(formatMessage({ defaultMessage: 'Khấu trừ dự trữ thất bại' }), { appearance: "error" });
        }
    }, []);

    const onFinishMutilTicket = useCallback(async () => {
        try {
            const { data } = await userFinishReserveTicket({
                variables: {
                    ids: ids?.map(item => item?.id)
                }
            });

            setDataResults(data?.userFinishReserveTicket);            
            setIds([]);
        } catch (err) {
            setIds([]);
            addToast(formatMessage({ defaultMessage: 'Dừng dự trữ thất bại' }), { appearance: "error" });
        }
    }, [ids]);

    const onRetryMutilTicket = useCallback(async (id) => {
        try {
            const { data } = await userReserveRetryByTicket({
                variables: { 
                    ids: ids?.map(item => item?.id) 
                }
            });

            setDataResults(data?.userReserveRetryByTicket);            
            setIds([]);
        } catch (err) {
            setIds([]);
            addToast(formatMessage({ defaultMessage: 'Khấu trừ dự trữ thất bại' }), { appearance: "error" });
        }
    }, [ids]);

    return (
        <Fragment>
            <Helmet
                titleTemplate={formatMessage({ defaultMessage: "Dự trữ" }) + " - UpBase"}
                defaultTitle={formatMessage({ defaultMessage: "Dự trữ" }) + " - UpBase"}
            >
                <meta name="description" content={formatMessage({ defaultMessage: "Dự trữ" }) + " - UpBase"} />
            </Helmet>
            <LoadingDialog show={loadingDeleteReserveTicket || loadingUserFinishReserveTicket || loadingUserReserveRetryByTicket} />
            <ModalInfoVariant show={false} />
            {!!action && (
                <ModalConfirm
                    show={!!action}
                    title={titleAction}
                    onConfirm={() => {
                        if (action == 'delete') onRemoveTicket();
                        if (action == 'finish') onFinishTicket();
                        setAction(null);
                    }}
                    onHide={() => {
                        setAction(null);
                        setCurrentIdAction(null);
                    }}
                />
            )}
            {!!dataResults && (
                <ModalResults
                    dataResults={dataResults}
                    onHide={() => setDataResults(null)}
                />
            )}
            <Card>
                <CardBody>
                    <ProductReserveFilter
                        ids={ids}
                        loadingStores={loadingStores}
                        optionsStore={optionsStore}
                        onRetryMutilTicket={onRetryMutilTicket}
                        onFinishMutilTicket={onFinishMutilTicket}
                    />
                    <ProductReserveTable
                        ids={ids}
                        setIds={setIds}
                        onRetryTicket={(id) => onRetryTicket(id)}
                        onShowAction={(id, type) => {
                            setAction(type);
                            setCurrentIdAction(id);
                        }}
                        whereCondition={whereCondition}
                        whereConditionCount={whereConditionCount}
                        optionsStore={optionsStore}
                    />
                </CardBody>
            </Card>
        </Fragment>
    )
}

export default memo(ProductReserveList);

export const actionKeys = {
    "product_reserve_view": {
        router: '/products/reserve',
        actions: [
            "sc_stores", 
            "op_connector_channels", 
            "warehouse_reserve_tickets", 
            "warehouse_reserve_tickets_aggregate",
            "scGetProductVariantLinked",
            "sme_catalog_product_tags",
            "sme_warehouses"
        ], 
        name: "Danh sách phiếu dự trữ",
        group_code: 'product_reserve',
        group_name: 'Dự trữ',
        cate_code: 'product_service',
        cate_name: 'Quản lý kho',
    },
    "product_reserve_action": {
        router: '',
        actions: [
            "delete_warehouse_reserve_tickets", 
            "userReserveRetryByTicket",
            "warehouse_reserve_ticket_items",
            'warehouse_reserve_tickets', 
            'warehouse_reserve_tickets_aggregate',
            "sc_stores", 
            "op_connector_channels", 
            "sme_warehouses", 
            "userCreateReserveTicket",
            "sme_catalog_product_variant", 
            "sme_catalog_product_variant_aggregate",
            "scGetWarehouseMapping",
            "scGetProductVariants",
            "sme_catalog_product_tags",
            "userReserveAddItem",
            "userReserveRemoveItem",
            "userReserveRetryByVariant"
        ], 
        name: "Các thao tác phiếu dự trữ",
        group_code: 'product_reserve',
        group_name: 'Dự trữ',
        cate_code: 'product_service',
        cate_name: 'Quản lý kho',
    },
};