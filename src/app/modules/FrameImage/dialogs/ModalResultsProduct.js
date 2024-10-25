import React, { memo, useMemo, useState } from 'react';
import { Modal } from 'react-bootstrap';
import { useIntl } from "react-intl";
import PaginationModal from '../../../../components/PaginationModal';
import InfoProduct from '../../../../components/InfoProduct';

const ModalResults = ({
    dataResults,
    onHide
}) => {
    const { formatMessage } = useIntl();

    const [page, setPage] = useState(1);

    let totalRecord = dataResults?.list_error?.length || 0;
    let totalPage = Math.ceil(dataResults?.list_error?.length / 5);


    return (
        <Modal
            show={!!dataResults}
            aria-labelledby="example-modal-sizes-title-sm"
            centered
            onHide={() => {}}
            backdrop={true}
            dialogClassName={'body-dialog-connect'}
        >
            <Modal.Header>
                <Modal.Title>
                    {formatMessage({ defaultMessage: 'Kết quả thử lại' })}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="overlay overlay-block cursor-default">
                <div className='row'>
                    <div className='col-12 mt-3'>{formatMessage({ defaultMessage: 'Số sản phẩm cần thử lại' })}: <span className='font-weight-bold'>{dataResults?.total}</span></div>
                    <div className='col-12 mt-3'>{formatMessage({ defaultMessage: 'Số sản phẩm thử lại thành công' })}: <span className='font-weight-bold text-success'>{dataResults?.total - dataResults?.total_error}</span></div>
                    <div className='col-12 mt-3'>{formatMessage({ defaultMessage: 'Số sản phẩm thử lại thất bại' })}: <span className='font-weight-bold text-danger'>{dataResults?.total_error}</span></div>

                    {dataResults?.list_error?.length > 0 && (
                        <div className='col-12 mt-4'>
                            <table className="table product-list table-border table-borderless table-vertical-center fixed">
                                <thead>
                                    <tr className="font-size-lg">
                                        <th style={{ fontSize: '14px' }} width="50%">
                                            {formatMessage({ defaultMessage: 'Tên sản phẩm' })}
                                        </th>
                                        <th style={{ fontSize: '14px' }}>
                                            {formatMessage({ defaultMessage: 'Lỗi' })}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dataResults?.list_error?.slice(5 * (page - 1), 5 + 5 * (page - 1))?.map((data) => {
                                        return (<tr key={`scheduled-row-${data?.id}`}>
                                            <td>
                                                <InfoProduct
                                                    name={data?.name}
                                                    isSingle
                                                    productOrder={true}
                                                    url={() => window.open(`/product-stores/edit/${data?.id}`, "_blank")}
                                                />
                                            </td>
                                            <td style={{ wordBreak: 'break-word' }}>{data?.message}</td>
                                        </tr>)
                                    }

                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                </div>
                {dataResults?.list_error?.length > 0 && (
                    <div className='mt-2'>
                        <PaginationModal
                            page={page}
                            totalPage={totalPage}
                            limit={5}
                            totalRecord={totalRecord}
                            count={dataResults?.list_error?.slice(5 * (page - 1), 5 + 5 * (page - 1))?.length}
                            onPanigate={(page) => setPage(page)}
                            emptyTitle={formatMessage({ defaultMessage: 'Chưa có lỗi nào' })}
                        />
                    </div>
                )}
            </Modal.Body>
            <Modal.Footer className="form" style={{ borderTop: '1px solid #dbdbdb', justifyContent: 'end', paddingTop: 10, paddingBottom: 10 }} >
                <div className="form-group">
                    <button
                        type="button"
                        onClick={onHide}
                        className="btn btn-primary btn-elevate mr-3"
                        style={{ width: 100 }}
                    >
                        {formatMessage({ defaultMessage: 'Đóng' })}
                    </button>
                </div>
            </Modal.Footer>
        </Modal >
    )
};

export default memo(ModalResults);