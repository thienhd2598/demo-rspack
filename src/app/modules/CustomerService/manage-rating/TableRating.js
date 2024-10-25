import React, { useMemo, useState } from 'react'
import CountRating from './CountRating';
import { useIntl } from 'react-intl'
import { SUBTAB, CHILDREN_TAB, DEFAULT_POSITION_ACTION } from './constants';
import { useHistory, useLocation } from "react-router-dom";
import queryString from "querystring";
import { useToasts } from 'react-toast-notifications';
import { Checkbox } from '../../../../_metronic/_partials/controls';
import Pagination from '../../../../components/Pagination';
import RowTableRating from './RowTableRating'
import FeedBackDialog from './dialogs/FeedBackDialog';
import { ResultFeedBackDialog } from './dialogs/ResultFeedBackDialog';
import query_scGetComments from '../../../../graphql/query_scGetComments'
import mutate_scRetryReplyComments from '../../../../graphql/mutate_scRetryReplyComments'
import { useMutation, useQuery } from '@apollo/client';
import _, { omit } from 'lodash';
import LoadingDialog from '../../ProductsStore/product-new/LoadingDialog';
import { toAbsoluteUrl } from '../../../../_metronic/_helpers';
import mutate_scLoadRatingCommentById from '../../../../graphql/mutate_scLoadRatingCommentById'
import { Dropdown } from 'react-bootstrap';
import AuthorizationWrapper from '../../../../components/AuthorizationWrapper';

const TableRating = ({ stores, whereConditions, searchVaribales }) => {
    const location = useLocation();
    const history = useHistory();
    const { formatMessage } = useIntl();
    const { addToast } = useToasts()
    const params = queryString.parse(location.search.slice(1, 100000));
    const [ids, setIds] = useState([])
    const [feedbackDialog, setFeedbackDialog] = useState({
        isOpen: false,
        replyComment: []
    })
    const [dataResult, setDataResult] = useState(null)

    const { loading, data: comments, error, refetch } = useQuery(query_scGetComments, {
        fetchPolicy: "cache-and-network",
        variables: {
            ...whereConditions
        }
    });
    console.log('comments', comments)

    const [replyCommentMutate, { loading: loadingRetry }] = useMutation(mutate_scRetryReplyComments,
        { awaitRefetchQueries: true, refetchQueries: ['scGetComments'] }
    );
    const [updateRating, { loading: loadingUpdate }] = useMutation(mutate_scLoadRatingCommentById,
        { awaitRefetchQueries: true, refetchQueries: ['scGetComments'] }
    );

    const isSelectAll = ids.length > 0 && ids.filter(x => {
        return comments?.scGetComments?.some(comment => comment.id === x.id);
    })?.length == comments?.scGetComments?.length;

    let totalRecord = comments?.scCommentAggregate?.count || 0;
    let totalPage = Math.ceil(totalRecord / whereConditions?.per_page);

    const queryVaribalesCount = useMemo(() => {
        return {
            ...(searchVaribales?.q ? { q: searchVaribales?.q, search_type: searchVaribales.search_type } : {}),
            ...(searchVaribales?.list_channel ? { list_channel: searchVaribales?.list_channel } : {}),
            ...(searchVaribales?.list_store ? { list_store: searchVaribales?.list_store } : {}),
            ...(searchVaribales?.range_time ? { range_time: searchVaribales?.range_time } : {}),
            ...(searchVaribales?.search_user ? { search_user: searchVaribales?.search_user } : {}),
            ...(searchVaribales?.status ? { status: searchVaribales?.status } : {}),
        }
    }, [searchVaribales])

    const handleReplyComments = () => {
        setFeedbackDialog({ isOpen: true, replyComment: ids?.filter(cm => !!cm?.can_reply)?.map(comment => comment?.id) })
    }

    const handleUpdateComments = async (ids) => {
        const { data } = await updateRating({
            variables: {
                list_comment_id: ids
            }
        })
        if(!!data?.scLoadRatingCommentById?.success) {
            addToast(formatMessage({ defaultMessage: "Tải lại đánh giá thành công." }), { appearance: 'success' })
            return
        }
        addToast(formatMessage({ defaultMessage: "Tải lại đánh giá không thành công." }), { appearance: 'error' })
    }

    const handleRetryReply = async (idRetry, single = false) => {

        const { data } = await replyCommentMutate({
            variables: {
                list_id_retry: idRetry
            }
        })
        if (!!data?.scRetryReplyComments?.success && !data?.scRetryReplyComments?.total_fail && single) {
            addToast(formatMessage({ defaultMessage: "Phản hồi đánh giá thành công." }), { appearance: 'success' })
            history.push(`/customer-service/manage-rating?${queryString.stringify({ ...params, page: 1, status: 'reply' })}`.replaceAll('%2C', '\,'))
            return
        }
        if (!!data?.scRetryReplyComments?.success && !single) {
            setDataResult({ ...data?.scRetryReplyComments, retry: true })
            return
        }
        addToast(formatMessage({ defaultMessage: "Phản hồi đánh giá không thành công." }), { appearance: 'error' })
    }

    const positionSticky = useMemo(() => {
        const statusAddPx = ['not_reply', 'reply_error']
        return statusAddPx.includes(params?.status) ? DEFAULT_POSITION_ACTION + 60 : DEFAULT_POSITION_ACTION
    }, [params?.status])

    const viewAction = useMemo(() => {
        if (!!params?.status && params?.status !== 'reply') {
            return (
                <div className='d-flex align-items-center py-4'>
                <div className="mr-4 text-primary" style={{ fontSize: 14 }}>{formatMessage({ defaultMessage: 'Đã chọn:' })} {ids?.length}</div>
                
                <Dropdown drop='down'>
                    <Dropdown.Toggle disabled={!ids.length} className={`${ids?.length ? 'btn-primary' : 'btn-darkk'} btn`} >
                        {formatMessage({ defaultMessage: "Thao tác hàng loạt" })}
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <>
                        <Dropdown.Item className="mb-1 d-flex"  onClick={() => handleUpdateComments(ids.map((_ord) => _ord.id))} >
                          {formatMessage({ defaultMessage: "Tải lại" })}
                        </Dropdown.Item>
                        <AuthorizationWrapper keys={['customer_service_rating_update']}>
                            <Dropdown.Item className="mb-1 d-flex" onClick={async () => params?.status == 'reply_error' ? await handleRetryReply(ids?.map(cm => cm?.id), false) : handleReplyComments()}>
                            {params?.status == 'reply_error' ? formatMessage({ defaultMessage: 'Thử lại' }) : formatMessage({ defaultMessage: 'Trả lời' })}
                            </Dropdown.Item>
                        </AuthorizationWrapper>
                      </>
                     </Dropdown.Menu>
                </Dropdown>
                </div>
            )
        } else {
            return (
                <div className='d-flex align-items-center py-4'>
                    <div className="mr-4 text-primary" style={{ fontSize: 14 }}>{formatMessage({ defaultMessage: 'Đã chọn:' })} {ids?.length}</div>
                    <button onClick={async () =>  handleUpdateComments(ids.map((_ord) => _ord.id))}
                        type="button" disabled={!ids?.length}
                        className="btn btn-primary mr-3 px-8"
                        style={{ width: 120, background: ids?.length == 0 ? "#6c757d" : "", border: ids?.length == 0 ? "#6c757d" : "" }}
                    >
                        {formatMessage({ defaultMessage: 'Tải lại' })}
                    </button>
                </div>
            )
        }
    }, [ids, params?.status])
    return (
        <>
            <LoadingDialog show={loadingRetry || loadingUpdate} />
            {feedbackDialog.isOpen &&
                <FeedBackDialog feedbackDialog={feedbackDialog} setDataResult={setDataResult} setFeedbackDialog={setFeedbackDialog} />}
            {dataResult && <ResultFeedBackDialog
                onHide={() => {
                    setDataResult(null)
                    history.push(`/customer-service/manage-rating?${queryString.stringify({ ...params, page: 1, status: 'reply' })}`.replaceAll('%2C', '\,'))
                }}
                dataResult={dataResult}
            />}
            <div
                className="d-flex align-items-center flex-wrap py-2" style={{ background: "#fff", zIndex: 1, marginBottom: "5px", }}>
                <i style={{ color: '#00DB6D' }} className="fas fa-info-circle fs-14 ml-2 mr-2"></i>
                <span className="fs-14" style={{ color: '#00DB6D' }}>
                    {formatMessage({ defaultMessage: 'Hiện tại hệ thống đang chỉ hỗ trợ tải và trả lời đánh giá từ kênh Shopee, Lazada.' })}
                </span>
            </div>
            <div style={{ position: 'sticky', top: '45px', zIndex: 98, background: 'white' }}>
                <div className="d-flex w-100 mt-2" style={{ background: "#fff", zIndex: 1, borderBottom: 'none' }}>
                    <div style={{ flex: 1 }}>
                        <ul className="nav nav-tabs" id="myTab" role="tablist">
                            {SUBTAB.map((_tab, index) => {
                                const { title, status } = _tab;
                                const isActive = status == (params?.status || "");
                                return (
                                    <>
                                        <li style={{ cursor: 'pointer' }}
                                            key={`tab-order-${index}`}
                                            className={`nav-item ${isActive ? "active" : ""}`}>
                                            <span className={`nav-link font-weight-normal ${isActive ? "active" : ""}`}
                                                style={{ fontSize: "13px" }}
                                                onClick={() => {
                                                    setIds([])
                                                    const queryParams = _.omit({ ...params, page: 1, status: status }, ["star"])
                                                    history.push(`${location.pathname}?${queryString.stringify({ ...queryParams })}`);
                                                }}
                                            >
                                                {status == 'reply_error' && <img className='mx-2' src={toAbsoluteUrl("/media/warningsvg.svg")} alt=""></img>}
                                                {formatMessage(title)}
                                                <span className='mx-2'>
                                                    <CountRating whereCondition={{ ...omit({ ...queryVaribalesCount }, ['status']), ...(status ? { status: status } : {}), }} />
                                                </span>
                                            </span>
                                        </li>
                                    </>
                                );
                            })}
                        </ul>
                    </div>
                </div>

                <div className="d-flex flex-wrap py-2">
                    {CHILDREN_TAB.map(
                        (sub_status, index) => (
                            <span
                                key={`sub-status-order-${index}`}
                                className="mr-4 py-2 px-6 d-flex justify-content-between align-items-center"
                                style={{ borderRadius: 20, background: sub_status?.star == (params?.star || '') ? "#ff6d49" : "#828282", color: "#fff", cursor: "pointer", }}
                                onClick={() => {
                                    setIds([])
                                    history.push(`${location.pathname}?${queryString.stringify({ ...params, page: 1, star: sub_status?.star, })}`)
                                }
                                }>
                                {formatMessage(sub_status?.title)}
                                <span className='mx-2'>
                                    <CountRating whereCondition={{ ...queryVaribalesCount, ...(sub_status?.star ? { rating_star: sub_status?.star } : {}) }} />
                                </span>
                            </span>
                        )
                    )}
                </div>
                {viewAction}

            </div>
            <div style={{ boxShadow: "inset -1px 0px 0px #D9D9D9, inset 1px 0px 0px #D9D9D9, inset 0px 1px 0px #D9D9D9, inset 0px -1px 0px #D9D9D9", borderBottomLeftRadius: 6, borderBottomRightRadius: 6, borderTopRightRadius: 6, minHeight: 300 }}>
                <table className="table table-borderless product-list fixed">
                    <thead style={{ position: 'sticky', top: `${positionSticky}px`, borderRight: '1px solid #d9d9d9', zIndex: 95, background: '#F3F6F9', fontWeight: 'bold', fontSize: '14px', borderLeft: '1px solid #d9d9d9' }}>
                        <tr className="font-size-lg">
                            <th className="text-center" style={{ fontSize: '14px', width: '30%' }}>
                                <div className="d-flex">

                                        <Checkbox size='checkbox-md' inputProps={{ 'aria-label': 'checkbox', }} isSelected={isSelectAll}
                                            onChange={(e) => {
                                                const commentCanReply = comments?.scGetComments
                                                // params?.status !== 'reply_error' ? comments?.scGetComments?.filter(cm => !!cm?.can_reply)
                                                if (isSelectAll) {
                                                    setIds(ids.filter(x => !commentCanReply?.some(cm => cm.id === x.id)))
                                                } else {
                                                    const tempArray = [...ids];
                                                    (commentCanReply || []).forEach(cm => {
                                                        if (cm && !ids.some(item => item.id === cm.id)) {
                                                            tempArray.push(cm);
                                                        }
                                                    })
                                                    setIds(tempArray)
                                                }
                                            }}
                                        />

                                    <span className="mx-4">{formatMessage({ defaultMessage: 'Thông tin sản phẩm' })}</span>
                                </div>
                            </th>
                            <th className="text-center" style={{ fontSize: '14px', width: '30%' }}>{formatMessage({ defaultMessage: 'Đánh giá người mua' })}</th>
                            <th className="text-center" style={{ fontSize: '14px', width: '30%' }}>{formatMessage({ defaultMessage: 'Phản hồi đánh giá' })}</th>
                            <th className="text-center" style={{ fontSize: '14px', width: '10%' }}>{formatMessage({ defaultMessage: 'Thao tác' })}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && <div className='text-center w-100 mt-4' style={{ position: 'absolute' }} ><span className="ml-3 spinner spinner-primary"></span></div>}
                        {!!error && !loading && (
                            <div className="w-100 text-center mt-8" style={{ position: 'absolute' }} >
                                <div className="d-flex flex-column justify-content-center align-items-center">
                                    <i className='far fa-times-circle text-danger' style={{ fontSize: 48, marginBottom: 8 }}></i>
                                    <p className="mb-6">{formatMessage({ defaultMessage: 'Xảy ra lỗi trong quá trình tải dữ liệu' })}</p>
                                    <button className="btn btn-primary btn-elevate" style={{ width: 100 }}
                                        onClick={e => {
                                            e.preventDefault();
                                            refetch();
                                        }}>
                                        {formatMessage({ defaultMessage: 'Tải lại' })}
                                    </button>
                                </div>
                            </div>
                        )}
                        {!loading && !error && comments?.scGetComments?.map(comment => (
                            <RowTableRating handleRetryReply={handleRetryReply}
                                setFeedbackDialog={setFeedbackDialog}
                                setIds={setIds}
                                isSelected={ids.some(_id => _id.id == comment.id)}
                                stores={stores} key={comment?.id}
                                comment={comment} />
                        ))}
                    </tbody>
                </table>
                {!error && !loading && (
                    <Pagination
                        page={whereConditions?.page}
                        totalPage={totalPage}
                        loading={loading}
                        limit={whereConditions?.per_page}
                        totalRecord={totalRecord}
                        count={comments?.scGetComments.length}
                        basePath={'/customer-service/manage-rating'}
                        emptyTitle={formatMessage({ defaultMessage: 'Không có đánh giá' })}
                    />
                )}


            </div>
        </>
    )
}

export default TableRating