import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, OverlayTrigger, Tooltip } from 'react-bootstrap';
import PaginationModal from '../../../../components/PaginationModal';
import { useHistory } from 'react-router-dom';
import { formatNumberToCurrency } from '../../../../utils';
import { useIntl } from 'react-intl';

const ModalFileUploadResults = ({
    dataResults,
    onHide
}) => {
    const { formatMessage } = useIntl();
    const history = useHistory();
    const [page, setPage] = useState(1)
    let totalRecord = dataResults?.results?.length || 0;

    let totalPage = Math.ceil(dataResults?.results?.length / 5);

    return (
        <Modal
            show={!!dataResults}
            aria-labelledby="example-modal-sizes-title-sm"
            centered
            onHide={() => {
                onHide();
                history.push(`/products/warehouse-bill/${dataResults?.type}/${dataResults?.id}`);
            }}
            backdrop={true}
            dialogClassName={'body-dialog-connect'}
        >
            <Modal.Header>
                <Modal.Title>
                    {formatMessage({ defaultMessage: 'Kết quả tải file' })}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="overlay overlay-block cursor-default">
                <div className='row'>
                    <div className='col-12 mt-3'>{formatMessage({ defaultMessage: 'Tổng hàng hóa cần xử lý' })}: <span className='font-weight-bold'>{formatNumberToCurrency(dataResults?.total)}</span></div>
                    <div className='col-12 mt-3'>{formatMessage({ defaultMessage: 'Tổng hàng hóa xử lý thành công' })}: <span className='font-weight-bold text-success'>{formatNumberToCurrency(dataResults?.totalSuccess)}</span></div>
                    <div className='col-12 mt-3'>{formatMessage({ defaultMessage: 'Tổng hàng hóa xử lý thất bại' })}: <span className='font-weight-bold text-danger'>{formatNumberToCurrency(dataResults?.total - dataResults?.totalSuccess)}</span></div>
                    {dataResults?.results?.length > 0 && <div className='col-12'>
                        <table className="table table-borderless product-list table-vertical-center fixed">
                            <thead>
                                <tr className="font-size-lg">
                                    <th style={{ fontSize: '14px' }} width="50%">SKU</th>
                                    <th style={{ fontSize: '14px' }}>{formatMessage({ defaultMessage: 'Lỗi' })}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dataResults?.results.slice(5 * (page - 1), 5 + 5 * (page - 1))?.map((data) => {
                                    return (<tr key={`inventory-row-${data.index}`}>
                                        <td>{data.sku}</td>
                                        <td style={{ wordBreak: 'break-word' }}>{data.message}</td>
                                    </tr>)
                                }

                                )}
                                <div style={{ padding: '1rem', boxShadow: 'rgb(0 0 0 / 20%) 0px -2px 2px -2px' }}>
                                    <PaginationModal
                                        page={page}
                                        totalPage={totalPage}
                                        limit={5}
                                        totalRecord={totalRecord}
                                        count={dataResults?.results.slice(5 * (page - 1), 5 + 5 * (page - 1))?.length}
                                        onPanigate={(page) => setPage(page)}
                                        // basePath={`/products/edit/${smeId}/affiliate`}
                                        emptyTitle={formatMessage({ defaultMessage: 'Chưa có sản phẩm nào' })}
                                    />
                                </div>
                            </tbody>
                        </table>
                    </div>}
                </div>
            </Modal.Body>
            <Modal.Footer className="form" style={{ borderTop: '1px solid #dbdbdb', justifyContent: 'end', paddingTop: 10, paddingBottom: 10 }} >
                <div className="form-group">
                    <button
                        type="button"
                        onClick={() => {
                            onHide();
                            history.push(`/products/warehouse-bill/${dataResults?.type}/${dataResults?.id}`);
                        }}
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

export default memo(ModalFileUploadResults);