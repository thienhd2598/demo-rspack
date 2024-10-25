import React, { memo, useMemo, useState } from 'react';
import { Modal, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useIntl } from 'react-intl';
import PaginationModal from '../../../../../components/PaginationModal';

const ResultUpdateDialog = ({
    dataResults,
    onHide,
}) => {
    const { formatMessage } = useIntl();
    const [page, setPage] = useState(1);
    const [isCopied, setIsCopied] = useState(false);

    const onCopyToClipBoard = async (text) => {
        await navigator.clipboard.writeText(text);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 1500);
    };

    const totalRecord = dataResults?.list_fail?.length || 0;
    const totalPage = Math.ceil(dataResults?.list_fail?.length / 5);

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
                    {formatMessage({defaultMessage: 'Kết quả sửa giá và tồn kho'})}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="overlay overlay-block cursor-default">
                <i
                    className="fas fa-times"
                    onClick={onHide}
                    style={{ position: 'absolute', top: -45, right: 20, fontSize: 20, cursor: 'pointer' }}
                />
                <div className='row'>
                    <div className='col-12'>{formatMessage({defaultMessage: 'Tổng số sản phẩm'})}: <span className='font-weight-bold'>{(dataResults?.total_success + dataResults?.total_fail) ?? 0}</span></div>
                    <div className='col-12 mt-3'>{formatMessage({defaultMessage: 'Số sản phẩm thành công'})}: <span className='font-weight-bold text-success'>{dataResults?.total_success ?? 0}</span></div>
                    <div className='col-12 mt-3'>{formatMessage({defaultMessage: 'Số sản phẩm thất bại'})}: <span className='font-weight-bold text-danger'>{dataResults?.total_fail ?? 0}</span></div>
                    {dataResults?.list_fail?.length > 0 && <div className='col-12 mt-4'>
                        <table className="table table-borderless product-list table-vertical-center fixed">
                            <thead>
                                <tr className="font-size-lg">
                                    <th style={{ fontSize: '14px' }} width="40%">
                                        {formatMessage({ defaultMessage: 'SKU' })}
                                    </th>
                                    <th style-={{ fontSize: '14px' }}>{formatMessage({ defaultMessage: 'Lỗi' })}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dataResults?.list_fail?.slice(5 * (page - 1), 5 + 5 * (page - 1))?.map((data, index) => {
                                    return <tr key={index}>
                                        <td>
                                            <span>{data?.sku}</span>
                                            <OverlayTrigger
                                                overlay={
                                                    <Tooltip title='#1234443241434' style={{ color: 'red' }}>
                                                        <span>
                                                            {isCopied ? `Copy ${formatMessage({ defaultMessage: 'thành công' })}` : `Copy to clipboard`}
                                                        </span>
                                                    </Tooltip>
                                                }
                                            >
                                                <span className='ml-2'>
                                                    <i className="far fa-copy cursor-pointer text-info" onClick={() => onCopyToClipBoard(data?.sku)}/>
                                                </span>
                                            </OverlayTrigger>
                                        </td>
                                        <td>{data?.message}</td>
                                    </tr>
                                })}
                            </tbody>
                        </table>
                    </div>}
                    {dataResults?.list_fail?.length > 0 && <div style={{ padding: '1rem', boxShadow: 'rgb(0 0 0 / 20%) 0px -2px 2px -2px', width: "100%" }}>
                        <PaginationModal
                            page={page}
                            totalPage={totalPage}
                            limit={5}
                            totalRecord={totalRecord}
                            count={dataResults?.list_fail?.slice(5 * (page - 1), 5 + 5 * (page - 1))?.length}
                            onPanigate={(page) => setPage(page)}
                            emptyTitle={formatMessage({ defaultMessage: 'Chưa có sản phẩm nào' })}
                        />
                    </div>}
                </div>
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

export default memo(ResultUpdateDialog);