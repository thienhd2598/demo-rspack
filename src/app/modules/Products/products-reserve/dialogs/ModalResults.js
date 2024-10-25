import React, { memo, useMemo, useState } from 'react';
import { Modal } from 'react-bootstrap';
import { useIntl } from "react-intl";
import PaginationModal from '../../../../../components/PaginationModal';

const ModalResults = ({
    dataResults,
    onHide,
    sku = false
}) => {
    const { formatMessage } = useIntl();

    const [page, setPage] = useState(1);

    const [totalSuccess, totalError] = useMemo(() => {
        return [
            dataResults?.filter(item => !!item?.success)?.length,
            dataResults?.filter(item => !item?.success)?.length,
        ]
    }, [dataResults]);

    let totalRecord = dataResults?.length || 0;
    let totalPage = Math.ceil(dataResults?.length / 5);


    return (
        <Modal
            show={!!dataResults}
            aria-labelledby="example-modal-sizes-title-sm"
            centered
            onHide={onHide}
            backdrop={true}
            dialogClassName={'body-dialog-connect'}
        >
            <Modal.Header>
                <Modal.Title>
                    {formatMessage({ defaultMessage: 'Kết quả xử lý' })}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="overlay overlay-block cursor-default">
                <div className='row'>
                    <div className='col-12 mt-3'>{formatMessage({ defaultMessage: 'Tổng {name} cần xử lý' }, { name: !!sku ? 'hàng hóa' : 'phiếu dự trữ' })}: <span className='font-weight-bold'>{dataResults?.length}</span></div>
                    <div className='col-12 mt-3'>{formatMessage({ defaultMessage: 'Tổng {name} xử lý thành công' }, { name: !!sku ? 'hàng hóa' : 'phiếu dự trữ' })}: <span className='font-weight-bold text-success'>{totalSuccess}</span></div>
                    <div className='col-12 mt-3'>{formatMessage({ defaultMessage: 'Tổng {name} xử lý thất bại' }, { name: !!sku ? 'hàng hóa' : 'phiếu dự trữ' })}: <span className='font-weight-bold text-danger'>{totalError}</span></div>

                    {totalError > 0 && (
                        <div className='col-12 mt-4'>
                            <table className="table product-list table-border table-borderless table-vertical-center fixed">
                                <thead>
                                    <tr className="font-size-lg">
                                        <th style={{ fontSize: '14px' }} width="50%">
                                            {!!sku ? 'SKU' : formatMessage({ defaultMessage: 'Tên phiếu dự trữ' })}
                                        </th>
                                        <th style={{ fontSize: '14px' }}>
                                            {formatMessage({ defaultMessage: 'Lỗi' })}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dataResults?.slice(5 * (page - 1), 5 + 5 * (page - 1))?.map((data) => {
                                        return (<tr key={`inventory-row-${data.index}`}>
                                            <td>{!!sku ? data?.sku : data?.ticket_name}</td>
                                            <td style={{ wordBreak: 'break-word' }}>{data?.message}</td>
                                        </tr>)
                                    }

                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                </div>
                {totalError > 0 && (
                    <div className='mt-2'>
                        <PaginationModal
                            page={page}
                            totalPage={totalPage}
                            limit={5}
                            totalRecord={totalRecord}
                            count={dataResults.slice(5 * (page - 1), 5 + 5 * (page - 1))?.length}
                            onPanigate={(page) => setPage(page)}
                            // basePath={`/products/edit/${smeId}/affiliate`}
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