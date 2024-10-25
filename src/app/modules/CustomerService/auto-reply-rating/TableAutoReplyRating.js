import React, { useMemo, useState } from 'react'
import { useIntl } from 'react-intl';
import RowTableAutoReply from './RowTableAutoReply';
import ListExReplyDialog from './dialogs/ListExReplyDialog';
import TemplateRatingDialog from './dialogs/TemplateRatingDialog';
import { toAbsoluteUrl } from '../../../../_metronic/_helpers';
import RowTableSample from './RowTableSample';
import { useHistory, useLocation } from "react-router-dom";
import queryString from "querystring";
import mutate_scDeleteTemplateReply from '../../../../graphql/mutate_scDeleteTemplateReply'
import mutate_scUpdateMapTemplateInStore from '../../../../graphql/mutate_scUpdateMapTemplateInStore'
import query_scGetAutoReplyTemplate from '../../../../graphql/query_scGetAutoReplyTemplate'
import query_scGetSetupAutomaticReplies from '../../../../graphql/query_scGetSetupAutomaticReplies'
import { useMutation, useQuery } from '@apollo/client';
import Pagination from '../../../../components/Pagination';
import { useToasts } from 'react-toast-notifications';
import LoadingDialog from '../../ProductsStore/product-new/LoadingDialog';
import { ConfirmDialog } from './dialogs/ConfirmDialog';
import AuthorizationWrapper from '../../../../components/AuthorizationWrapper';

const TableAutoReplyRating = ({ dataStores }) => {
    const location = useLocation();
    const { formatMessage } = useIntl();
    const { addToast } = useToasts()
    const params = queryString.parse(location.search.slice(1, 100000))
    const [templateRatingDialog, setTemplateRatingDialog] = useState({
        isOpen: false,
        id: null,
        item: null
    })
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        action: null,
        template: null
    })

    const [chooseTemplateDialog, setChooseTemplateDialog] = useState({
        isOpen: false,
        template: null
    })

    const channel = useMemo(() => {
        return params?.channel ? { connector_channel_code: params?.channel } : {}
    }, [params?.channel])

    const viewThTag = useMemo(() => {
        return params?.tab == 'exampleReply' ? (
            <tr className="font-size-lg">
                <th className="text-left" style={{ fontSize: '14px', width: '30%' }}>{formatMessage({ defaultMessage: 'Tên mẫu' })}</th>
                <th className="text-left" style={{ fontSize: '14px', width: '30%' }}>{formatMessage({ defaultMessage: 'Xử lý đánh giá' })}</th>
                <th className="text-center" style={{ fontSize: '14px', width: '15%' }}>{formatMessage({ defaultMessage: 'Thời gian tạo' })}</th>
                <th className="text-center" style={{ fontSize: '14px', width: '15%' }}>{formatMessage({ defaultMessage: 'Thời gian cập nhật' })}</th>
                <th className="text-center" style={{ fontSize: '14px', width: '10%' }}>{formatMessage({ defaultMessage: 'Thao tác' })}</th>

            </tr>
        ) : (
            <tr className="font-size-lg">
                <th className="text-left" style={{ fontSize: '14px', width: '23%' }}>{formatMessage({ defaultMessage: 'Gian hàng' })}</th>
                <th className="text-left" style={{ fontSize: '14px', width: '20%' }}>{formatMessage({ defaultMessage: 'Mẫu trả lời' })}</th>
                <th className="text-left" style={{ fontSize: '14px', width: '20%' }}>{formatMessage({ defaultMessage: 'Xử lý đánh giá' })}</th>
                <th className="text-center" style={{ fontSize: '14px', width: '13%' }}>{formatMessage({ defaultMessage: 'Đã gửi hôm nay' })}</th>
                <th className="text-center" style={{ fontSize: '14px', width: '9%' }}>{formatMessage({ defaultMessage: 'Trạng thái' })}</th>
                <th className="text-center" style={{ fontSize: '14px', width: '15%' }}>{formatMessage({ defaultMessage: 'Thời gian cập nhật' })}</th>
            </tr>
        )
    }, [params?.tab])


    const page = useMemo(
        () => {
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
        }, [params.page]
    );

    const per_page = useMemo(
        () => {
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
        }, [params.limit]
    );

    //========= get data =========

    const { loading: loadingGetAuto, data: dataGetAuto, error: errorGetAuto, refetch: refetchGetAuto } = useQuery(query_scGetAutoReplyTemplate, {
        fetchPolicy: "cache-and-network",
        variables: {
            page,
            per_page
        },
        skip: params?.tab !== 'exampleReply'
    });

    const { loading, data, error, refetch } = useQuery(query_scGetSetupAutomaticReplies, {
        fetchPolicy: "cache-and-network",
        variables: {
            ...channel,
            page,
            per_page,
        },
        skip: params?.tab == 'exampleReply'
    });
    const dataAutoReplyTemplate = useMemo(() => {
        return dataGetAuto?.scGetAutoReplyTemplate?.auto_reply_teamplate?.map(item => ({
            id: item?.id,
            name: item?.name,
            stars: item?.autoRatingFilters?.flatMap(rt => !!rt?.status ? rt?.rating_star : []),
            created_at: item?.created_at,
            updated_at: item?.updated_at,
            mapStoreReplyTemplates: item?.mapStoreReplyTemplates,
            autoRatingFilters: item?.autoRatingFilters
        }))
    }, [dataGetAuto])
    console.log('data?.scGetSetupAutomaticReplies', data?.scGetSetupAutomaticReplies)
    const dataAutomaticReplies = useMemo(() => {
        return data?.scGetSetupAutomaticReplies?.list_sale_channel_store?.flatMap(item => {
            const stores = dataStores?.sc_stores?.find(store => store?.id == item?.id)
            const channel = dataStores?.op_connector_channels?.filter(cn => cn?.code !== 'tiktok')?.find(cn => cn?.code == stores?.connector_channel_code)
            if (channel) {
                return {
                    id: stores?.id,
                    status: item?.mapStoreReplyTemplate?.status,
                    logo: channel?.logo_asset_url,
                    nameStore: item?.name,
                    updatedAt: item?.mapStoreReplyTemplate?.updated_at,
                    autoReplyTemplate: item?.mapStoreReplyTemplate?.autoReplyTemplate,
                    repliedToday: item?.replied_today,
                }
            }
            return []

        })
    }, [data, dataStores])

    //========= end get data =========
    const [deleteTemplateReply, { loading: loadingDeleteTemplate }] = useMutation(mutate_scDeleteTemplateReply,
        { awaitRefetchQueries: true, refetchQueries: ['scGetAutoReplyTemplate'] }
    );

    const [updateMapTemplateInStore, { loading: loadingUpdateTemplateInStore }] = useMutation(mutate_scUpdateMapTemplateInStore,
        { awaitRefetchQueries: true, refetchQueries: ['scGetSetupAutomaticReplies'] }
    );
    // ======= Xóa mẫu =======================
    const handleDeleteTemplate = async (id) => {
        if (!id) return
        const { data } = await deleteTemplateReply({
            variables: {
                reply_template_id: id
            }
        })
        if (!!data?.scDeleteTemplateReply?.success) {
            addToast(formatMessage({ defaultMessage: 'Xóa mẫu đánh giá thành công' }), { appearance: 'success' })
            setConfirmDialog({ isOpen: false, template: null })
            return
        }
        setConfirmDialog({ isOpen: false, template: null })
        addToast(formatMessage({ defaultMessage: 'Xóa mẫu đánh giá thất bại' }), { appearance: 'error' })
    }


    // ===== Cập nhật mẫu trả lời tự động ========
    const handleUpdateMaptemplateInStore = async (id) => {
        if (chooseTemplateDialog?.template?.autoReplyTemplate?.id == id) {
            setChooseTemplateDialog({ isOpen: false, template: null })
            return
        }
        const { data } = await updateMapTemplateInStore({
            variables: {
                reply_template_id: id,
                status: chooseTemplateDialog?.template?.status ? chooseTemplateDialog?.template?.status : 0,
                store_id: chooseTemplateDialog?.template?.id
            }
        })

        if (!!data?.scUpdateMapTemplateInStore?.success) {
            addToast(formatMessage({ defaultMessage: 'Thêm mẫu đánh giá thành công' }), { appearance: 'success' })
            setChooseTemplateDialog({
                isOpen: false,
                template: null
            })
            return
        }
        setChooseTemplateDialog({ isOpen: false, template: null })
        addToast(formatMessage({ defaultMessage: 'Thêm mẫu đánh giá không thành công' }), { appearance: 'error' })
    }
    // ===== Bật tắt trả lời tự động ========
    const handleUpdateStatusAutoReply = async (id, status, storeId) => {
        await updateMapTemplateInStore({
            variables: {
                reply_template_id: id,
                status: status,
                store_id: storeId
            }
        })
    }


    const totalRecord = params?.tab == 'exampleReply' ? dataGetAuto?.scGetAutoReplyTemplate?.total : data?.scGetSetupAutomaticReplies?.total
    const totalPage = Math.ceil(totalRecord / per_page)
    const count = params?.tab == 'exampleReply' ? dataGetAuto?.scGetAutoReplyTemplate?.auto_reply_teamplate?.length : data?.scGetSetupAutomaticReplies?.list_sale_channel_store?.length

    return (
        <div>
            {confirmDialog?.isOpen &&
                <ConfirmDialog
                    dataStores={dataStores}
                    handleDeleteTemplate={async () => {
                        await handleDeleteTemplate(confirmDialog?.template?.id)
                    }}
                    handleUpdateStatusAutoReply={async () => {
                        const { autoReplyTemplate, status, id } = confirmDialog?.template ?? {}
                        await handleUpdateStatusAutoReply(autoReplyTemplate?.id, !!status ? 0 : 1, id)
                        setConfirmDialog({
                            isOpen: false,
                            action: null,
                            template: null
                        })

                    }}
                    confirmDialog={confirmDialog}
                    onHide={() => setConfirmDialog({ isOpen: false, action: null, template: null })}
                />}
            <LoadingDialog show={loadingUpdateTemplateInStore || loadingDeleteTemplate} />
            {chooseTemplateDialog.isOpen &&
                <ListExReplyDialog
                    isEdit={!!chooseTemplateDialog?.template?.autoReplyTemplate}
                    handleUpdateMaptemplateInStore={handleUpdateMaptemplateInStore}
                    show={chooseTemplateDialog.isOpen}
                    onHide={() => setChooseTemplateDialog({ isOpen: false, template: null })}
                />}
            {templateRatingDialog.isOpen &&
                <TemplateRatingDialog
                    namesTemplate={dataAutoReplyTemplate?.map(it => it?.name)}
                    itemUpdate={templateRatingDialog?.item}
                    onHide={() => setTemplateRatingDialog({ isOpen: false, id: null })}
                    show={templateRatingDialog.isOpen}
                />}
            {params?.tab == 'exampleReply' ? (
                <div className='d-flex justify-content-end mb-2'>
                    <AuthorizationWrapper keys={['customer_service_auto_reply_rating']}>
                        <button onClick={() => setTemplateRatingDialog({ isOpen: true, id: null })} className='btn btn-primary d-flex align-items-center'>
                            <img src={toAbsoluteUrl("/media/svg/plus-border.svg")} alt='' />
                            <span className='mx-2'>{formatMessage({ defaultMessage: 'Thêm mới' })}</span>
                        </button>
                    </AuthorizationWrapper>
                </div>
            ) : null}

            <table className="table table-borderless product-list table-vertical-center fixed">
                <thead style={{ position: 'sticky', top: `45px`, borderRight: '1px solid #d9d9d9', zIndex: 1, background: '#F3F6F9', fontWeight: 'bold', fontSize: '14px', borderLeft: '1px solid #d9d9d9' }}>
                    {viewThTag}
                </thead>
                <tbody>
                    {(loading || loadingGetAuto) && <div className='text-center w-100 mt-4' style={{ position: 'absolute' }} ><span className="ml-3 spinner spinner-primary"></span> </div>}
                    {(!!error || !!errorGetAuto) && !loading && !loadingGetAuto && (
                        <div className="w-100 text-center mt-8" style={{ position: 'absolute' }} >
                            <div className="d-flex flex-column justify-content-center align-items-center">
                                <i className='far fa-times-circle text-danger' style={{ fontSize: 48, marginBottom: 8 }}></i>
                                <p className="mb-6">{formatMessage({ defaultMessage: 'Xảy ra lỗi trong quá trình tải dữ liệu' })}</p>
                                <button
                                    className="btn btn-primary btn-elevate"
                                    style={{ width: 100 }}
                                    onClick={e => {
                                        e.preventDefault();
                                        params?.tab == 'exampleReply' ? refetchGetAuto() : refetch();

                                    }}
                                >
                                    {formatMessage({ defaultMessage: 'Tải lại' })}
                                </button>
                            </div>
                        </div>
                    )}

                    {params?.tab == 'exampleReply' ? !loadingGetAuto &&
                        dataAutoReplyTemplate?.map(item => <RowTableSample
                            setItemUpdate={() => setTemplateRatingDialog({ isOpen: true, item: item })}
                            confirmDeleteTemplate={() => setConfirmDialog({ isOpen: true, template: item })}
                            item={item} />) : !loading &&
                    dataAutomaticReplies?.map(item => <RowTableAutoReply handleUpdateStatusAutoReply={handleUpdateStatusAutoReply}
                        confirmUpdateStatus={() => setConfirmDialog({ isOpen: true, action: 'UPDATE_STATUS', template: item })}
                        chooseTemplate={setChooseTemplateDialog}
                        item={item} />)
                    }

                </tbody>
            </table>
            {(!error || !errorGetAuto) && (
                <Pagination
                    page={page}
                    totalPage={totalPage}
                    loading={loading || loadingGetAuto}
                    limit={per_page}
                    totalRecord={totalRecord}
                    count={count}
                    basePath={'/customer-service/auto-reply-rating'}
                    emptyTitle={formatMessage({ defaultMessage: 'Không tìm thấy dữ liệu' })}
                />
            )}
        </div>
    )
}

export default TableAutoReplyRating