import React, { useMemo, useState } from 'react'
import { useIntl } from 'react-intl';
import { toAbsoluteUrl } from '../../../../../_metronic/_helpers';
import PaginationModal from '../../../../../components/PaginationModal'
import { Modal } from 'react-bootstrap';
import { useQuery } from '@apollo/client';
import query_scGetAutoReplyTemplate from '../../../../../graphql/query_scGetAutoReplyTemplate';
const ListExReplyDialog = ({ isEdit, handleUpdateMaptemplateInStore, show, onHide }) => {
    const { formatMessage } = useIntl();
    const [page, setPage] = useState(1);

    const { loading, data, error, refetch } = useQuery(query_scGetAutoReplyTemplate, {
        fetchPolicy: "no-cache",
        variables: {
            page,
            per_page: 5
        },
    });

    const dataAutoReplyTemplate = useMemo(() => {
        return data?.scGetAutoReplyTemplate?.auto_reply_teamplate?.map(item => ({
            id: item?.id,
            name: item?.name,
            stars: item?.autoRatingFilters?.flatMap(rt => !!rt?.status ? rt?.rating_star : []),
            created_at: item?.created_at,
            updated_at: item?.updated_at,
        }))
    }, [data])

    let totalRecord = data?.scGetAutoReplyTemplate?.total || 0;

    let totalPage = Math.ceil(totalRecord / 5);

    return (
        <>
            <Modal size="lg"
                show={show}
                aria-labelledby="example-modal-sizes-title-sm"
                dialogClassName="modal-show-connect-product"
                centered
                onHide={() => { }}
                backdrop={true}
            >
                <Modal.Body>
                    <div className='mb-2 d-flex align-items-center justify-content-between'>
                        <strong style={{ fontSize: '15px' }}>{formatMessage({ defaultMessage: "Danh sách mẫu trả lời" })}</strong>
                        <span><i style={{ cursor: "pointer", fontSize: '15px' }} onClick={onHide} className="drawer-filter-icon fas fa-times icon-md text-right"></i></span>
                    </div>
                    {isEdit && <div className='font-italic mb-2'>{formatMessage({ defaultMessage: 'Chọn mẫu bạn muốn thay đổi' })}</div>}
                    <table className="table table-borderless product-list table-vertical-center fixed">
                        <thead style={{ borderRight: '1px solid #d9d9d9', zIndex: 1, background: '#F3F6F9', fontWeight: 'bold', fontSize: '14px', borderLeft: '1px solid #d9d9d9' }}>
                            <tr className="font-size-lg">
                                <th className="text-left" style={{ fontSize: '14px', width: '40%' }}>{formatMessage({ defaultMessage: 'Tên mẫu' })}</th>
                                <th className="text-left" style={{ fontSize: '14px', width: '40%' }}>{formatMessage({ defaultMessage: 'Xử lý đánh giá' })}</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {(loading) && <div className='text-center w-100 mt-4' style={{ position: 'absolute' }} ><span className="ml-3 spinner spinner-primary"></span> </div>}
                            {!error && !loading && dataAutoReplyTemplate?.map(template => (
                                <tr>
                                    <td>{template?.name}</td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            {template?.stars?.sort()?.map(amountStar => <span>{Array(amountStar).fill(0).map(star => <img className="my-2" src={toAbsoluteUrl("/media/svg/star-fill.svg")} alt='' />)}</span>)}
                                        </div>
                                    </td>
                                    <td className='text-center'>
                                        <span onClick={async () => handleUpdateMaptemplateInStore(template?.id)} className='text-primary' style={{ cursor: 'pointer' }}>Chọn</span>
                                    </td>
                                </tr>
                            ))}


                        </tbody>
                    </table>
                    <div className="col-12" style={{ padding: "1rem", boxShadow: "rgb(0 0 0 / 20%) 0px -2px 2px -2px", }}>
                        <PaginationModal
                            page={page}
                            totalPage={totalPage}
                            limit={5}
                            totalRecord={totalRecord}
                            count={dataAutoReplyTemplate?.length}
                            onPanigate={(page) => setPage(page)}
                            emptyTitle={formatMessage({ defaultMessage: "Chưa có mẫu nào", })}
                        />
                    </div>
                </Modal.Body>
            </Modal>
        </>


    )
}

export default ListExReplyDialog
