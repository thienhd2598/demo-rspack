import { useMutation, useQuery } from '@apollo/client';
import queryString from 'querystring';
import React, { Fragment, memo, useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useIntl } from 'react-intl';
import { useHistory, useLocation } from 'react-router-dom';
import { useToasts } from 'react-toast-notifications';
import { Card, CardBody } from '../../../../_metronic/_partials/controls';
import { useSubheader } from '../../../../_metronic/layout';
import query_sc_stores_basic from '../../../../graphql/query_sc_stores_basic';
import ScheduledFrameFilter from './ScheduledFrameFilter';
import query_getListScheduledFrame from '../../../../graphql/query_getListScheduledFrame';
import ScheduledFrameTable from './ScheduledFrameTable';
import client from '../../../../apollo';
import query_sme_catalog_photo_frames from '../../../../graphql/query_sme_catalog_photo_frames';
import query_getSummaryScheduledFrame from '../../../../graphql/query_getSummaryScheduledFrame';
import mutate_scheduledAssetFrameDelete from '../../../../graphql/mutate_scheduledAssetFrameDelete';
import mutate_scheduledAssetFrameFinish from '../../../../graphql/mutate_scheduledAssetFrameFinish';
import LoadingDialog from '../../ProductsStore/product-new/LoadingDialog';
import ModalResults from '../dialogs/ModalResults';
import ModalConfirm from '../dialogs/ModalConfirm';
import mutate_scheduledAssetFrameRetry from '../../../../graphql/mutate_scheduledAssetFrameRetry';

const ScheduledFrameList = () => {
    const { formatMessage } = useIntl();
    const history = useHistory();
    const location = useLocation();
    const { addToast } = useToasts();
    const { setBreadcrumbs } = useSubheader();
    const params = queryString.parse(location.search.slice(1, 100000));

    const [currentIdAction, setCurrentIdAction] = useState(null);
    const [action, setAction] = useState(null);
    const [ids, setIds] = useState([]);
    const [dataResults, setDataResults] = useState(null);
    const [loadingFrameImg, setLoadingFrameImg] = useState(false);
    const [dataFrame, setDataFrame] = useState([]);

    useLayoutEffect(() => {
        setBreadcrumbs([
            { title: formatMessage({ defaultMessage: 'Lập lịch áp khung' }) },
        ])
    }, []);

    const [deleteScheduledAssetFrame, { loading: loadingDeleteScheduledAssetFrame }] = useMutation(mutate_scheduledAssetFrameDelete, {
        awaitRefetchQueries: true,
        refetchQueries: ['getListScheduledFrame', 'getSummaryScheduledFrame']
    });

    const [finishScheduledAssetFrame, { loading: loadingFinishScheduledAssetFrame }] = useMutation(mutate_scheduledAssetFrameFinish, {
        awaitRefetchQueries: true,
        refetchQueries: ['getListScheduledFrame', 'getSummaryScheduledFrame']
    });

    const [retryScheduledAssetFrame, { loading: loadingRetryScheduledAssetFrame }] = useMutation(mutate_scheduledAssetFrameRetry, {
        awaitRefetchQueries: true,
        refetchQueries: ['getListScheduledFrame', 'getSummaryScheduledFrame']
    });

    const { data: dataStores, loading: loadingStores } = useQuery(query_sc_stores_basic, {
        fetchPolicy: 'cache-and-network'
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

    const store_id = useMemo(() => {
        if (!params?.store_id) return {};

        return {
            store_id: params?.store_id?.split(',').map(store => Number(store))
        }
    }, [params?.store_id]);

    const status = useMemo(() => {
        if (!params?.status) return {};

        return {
            status: Number(params?.status)
        }
    }, [params?.status]);

    const search_text = useMemo(() => {
        try {
            if (!params?.q) return {}

            return {
                search_text: params?.q
            }
        } catch (err) {
            return {}
        }
    }, [params?.q]);

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

    const { loading: loadingSummaryScheduledFrame, data: dataSummaryScheduledFrame } = useQuery(query_getSummaryScheduledFrame, {
        fetchPolicy: 'cache-and-network',
        variables: {
            ...search_text,
            ...store_id,
        }
    });

    const { loading: loadingListScheduledFrame, data: dataListScheduledFrame } = useQuery(query_getListScheduledFrame, {
        fetchPolicy: 'cache-and-network',
        variables: {
            page,
            per_page: limit,
            ...search_text,
            ...store_id,
            ...status
        },
        onCompleted: async (scheduled) => {
            if (scheduled?.getListScheduledFrame?.length > 0) {
                setLoadingFrameImg(true);
                const { data } = await client.query({
                    query: query_sme_catalog_photo_frames,
                    variables: {
                        limit,
                        offset: 0,
                        where: {
                            id: { _in: scheduled?.getListScheduledFrame?.map(frame => frame?.frame_id) }
                        }
                    },
                    fetchPolicy: "network-only",
                });

                setDataFrame(data?.sme_catalog_photo_frames);
                setTimeout(() => {
                    setLoadingFrameImg(false);
                }, 500)
            }
        }
    });

    const titleAction = useMemo(() => {
        if (action == 'finish' || action == 'finish-multiple') {
            return formatMessage({ defaultMessage: 'Lịch áp khung sẽ dừng lại và không thực hiện áp khung nữa. Bạn có đồng ý kết thúc ?' })
        }

        if (action == 'finish-inprogress' || action == 'finish-inprogress-multiple') {
            return formatMessage({ defaultMessage: 'Hệ thống sẽ kết thúc áp khung cho sản phẩm. Bạn có đồng ý kết thúc ?' })
        }

        if (action == 'delete' || action == 'delete-multiple') {
            return formatMessage({ defaultMessage: 'Lịch áp khung sẽ bị xoá khỏi danh sách và không thực hiện áp khung nữa. Bạn có đồng ý xoá lịch đã chọn ?' })
        }

        if (action == 'delete-finish' || action == 'delete-finish-multiple') {
            return formatMessage({ defaultMessage: 'Lịch áp khung sẽ bị xoá khỏi danh sách. Bạn có đồng ý xoá lịch đã chọn ?' })
        }
    }, [action]);

    const onDeleteScheduledFrame = useCallback(async (isSingle) => {
        try {
            const { data } = await deleteScheduledAssetFrame({
                variables: {
                    list_id: isSingle ? [currentIdAction] : ids?.map(item => item?.id)
                }
            });

            if (isSingle) {
                if (!!data?.scheduledAssetFrameDelete?.list_error?.length == 0) {
                    addToast(formatMessage({ defaultMessage: 'Xoá lịch áp khung thành công' }), { appearance: "success" });
                } else {
                    addToast(formatMessage({ defaultMessage: 'Xoá lịch áp khung thất bại' }), { appearance: "error" });
                }
                setCurrentIdAction(null);
            } else {
                const listErrorNew = data?.scheduledAssetFrameDelete?.list_error?.map(error => {
                    const scheduledFrame = ids?.find(item => item?.id == error?.id);
                    return {
                        ...error,
                        name: scheduledFrame?.title
                    }
                });
                setDataResults({ ...data?.scheduledAssetFrameDelete, type: 'delete', list_error: listErrorNew });
                setIds([]);
            }
        } catch (err) {
            setIds([]);
            setCurrentIdAction(null);
            addToast(formatMessage({ defaultMessage: 'Xoá lịch áp khung thất bại' }), { appearance: "error" });
        }
    }, [currentIdAction, ids]);

    const onFinishScheduledFrame = useCallback(async (isSingle) => {
        try {
            const { data } = await finishScheduledAssetFrame({
                variables: {
                    list_id: isSingle ? [currentIdAction] : ids?.map(item => item?.id)
                }
            });

            if (isSingle) {
                if (!!data?.scheduledAssetFrameFinish?.list_error?.length == 0) {
                    addToast(formatMessage({ defaultMessage: 'Kết thúc thành công' }), { appearance: "success" });
                } else {
                    addToast(formatMessage({ defaultMessage: 'Kết thúc thất bại' }), { appearance: "error" });
                }
                setCurrentIdAction(null);
            } else {
                const listErrorNew = data?.scheduledAssetFrameDelete?.list_error?.map(error => {
                    const scheduledFrame = ids?.find(item => item?.id == error?.id);
                    return {
                        ...error,
                        name: scheduledFrame?.title
                    }
                });
                setDataResults({ ...data?.scheduledAssetFrameFinish, type: 'finish', list_error: listErrorNew });
                setIds([]);
            }
        } catch (err) {
            setIds([]);
            setCurrentIdAction(null);
            addToast(formatMessage({ defaultMessage: 'Kết thúc thất bại' }), { appearance: "error" });
        }
    }, [currentIdAction, ids]);

    const onRetryScheduledFrame = useCallback(async (isSingle, id) => {
        try {
            const { data } = await retryScheduledAssetFrame({
                variables: {
                    list_id: isSingle ? [id] : ids?.map(item => item?.id)
                }
            });

            if (isSingle) {
                if (!!data?.scheduledAssetFrameRetry?.success) {
                    addToast(formatMessage({ defaultMessage: 'Thử lại thành công' }), { appearance: "success" });
                } else {
                    addToast(formatMessage({ defaultMessage: 'Thử lại thất bại' }), { appearance: "error" });
                }
                setCurrentIdAction(null);
            } else {
                const listErrorNew = data?.scheduledAssetFrameDelete?.list_error?.map(error => {
                    const scheduledFrame = ids?.find(item => item?.id == error?.id);
                    return {
                        ...error,
                        name: scheduledFrame?.name
                    }
                });
                setDataResults({ ...data?.scheduledAssetFrameRetry, type: 'retry', list_error: listErrorNew });
                setIds([]);
            }
        } catch (err) {
            setIds([]);
            setCurrentIdAction(null);
            addToast(formatMessage({ defaultMessage: 'Thử lại thất bại' }), { appearance: "error" });
        }
    }, [ids]);

    return (
        <Fragment>
            <Helmet
                titleTemplate={formatMessage({ defaultMessage: "Lập lịch áp khung" }) + " - UpBase"}
                defaultTitle={formatMessage({ defaultMessage: "Lập lịch áp khung" }) + " - UpBase"}
            >
                <meta name="description" content={formatMessage({ defaultMessage: "Lập lịch áp khung" }) + " - UpBase"} />
            </Helmet>
            <LoadingDialog show={loadingDeleteScheduledAssetFrame || loadingFinishScheduledAssetFrame || loadingRetryScheduledAssetFrame} />
            {!!dataResults && <ModalResults
                dataResults={dataResults}
                onHide={() => setDataResults(null)}
            />}
            {!!action && <ModalConfirm
                show={!!action}
                title={titleAction}
                onConfirm={() => {
                    if (action == 'delete' || action == 'delete-multiple' || action == 'delete-finish' || action == 'delete-finish-multiple') onDeleteScheduledFrame(action == 'delete' || action == 'delete-finish');
                    if (action == 'finish' || action == 'finish-multiple' || action == 'finish-inprogress' || action == 'finish-inprogress-multiple') onFinishScheduledFrame(action == 'finish' || action == 'finish-inprogress');
                    if (action == 'retry' || action == 'retry-multiple') onRetryScheduledFrame(action == 'retry');
                    setAction(null);
                }}
                onHide={() => {
                    setAction(null);
                    setIds([]);
                    setCurrentIdAction(null);
                }}
            />}
            <Card>
                <CardBody>
                    <ScheduledFrameFilter
                        ids={ids}
                        loadingStores={loadingStores}
                        optionsStore={optionsStore}
                        onFinishScheduledFrame={(status) => setAction(status == 1 ? 'finish-multiple' : 'finish-inprogress-multiple')}
                        onDeleteScheduledFrame={(status) => setAction(status == 1 ? 'delete-multiple' : 'delete-finish-multiple')}
                        onRetryScheduledFrame={() => onRetryScheduledFrame(false)}
                    />
                    <ScheduledFrameTable
                        ids={ids}
                        setIds={setIds}
                        onAction={(id, type) => {
                            setCurrentIdAction(id);
                            setAction(type);
                        }}
                        onRetryScheduledFrame={(id) => {
                            onRetryScheduledFrame(true, id)
                        }}
                        loading={loadingListScheduledFrame}
                        loadingSummaryScheduledFrame={loadingSummaryScheduledFrame}
                        summaryScheduledFrame={dataSummaryScheduledFrame?.getSummaryScheduledFrame || {}}
                        data={dataListScheduledFrame?.getListScheduledFrame}
                        loadingFrameImg={loadingFrameImg}
                        dataFrame={dataFrame}
                        optionsStore={optionsStore}
                        page={page}
                        limit={limit}
                    />
                </CardBody>
            </Card>
        </Fragment>
    )
}

export default memo(ScheduledFrameList);

export const actionKeys = {
    "frame_schedule_view": {
        router: '/frame-image/scheduled-frame',
        actions: [
            "sc_stores", "op_connector_channels", "getListScheduledFrame", "getSummaryScheduledFrame",
            "sme_catalog_photo_frames", "sme_catalog_photo_frames_aggregate"
        ],
        name: "Lập lịch áp khung",
        group_code: 'frame_image',
        group_name: 'Quản lý khung ảnh sản phẩm',
        cate_code: 'frame_image__service',
        cate_name: 'Quản lý khung ảnh mẫu',
    },
    "frame_schedule_action": {
        router: '',
        actions: [
            "scheduledAssetFrameFinish",
            "scheduledAssetFrameDelete",
            "scheduledAssetFrameRetry",
            'getListScheduledFrame', 
            'getSummaryScheduledFrame',
            "scGetSmeProductByListId"
        ],
        name: "Các thao tác lịch áp khung",
        group_code: 'frame_image',
        group_name: 'Quản lý khung ảnh sản phẩm',
        cate_code: 'frame_image__service',
        cate_name: 'Quản lý khung ảnh mẫu',
    }
};