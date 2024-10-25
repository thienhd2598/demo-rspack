import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useHistory } from 'react-router-dom';
import { formatNumberToCurrency } from '../../../../../utils';
import { useIntl } from 'react-intl';

const ModalCreateMultipleResults = ({
    dataResults,
    onHide
}) => {
    const { formatMessage } = useIntl();
    const history = useHistory();
    const [isCopied, setIsCopied] = useState(false);

    const onCopyToClipBoard = async (text) => {
        await navigator.clipboard.writeText(text);
        setIsCopied(true);
        setTimeout(
            () => {
                setIsCopied(false);
            }, 1500
        )
    };

    return (
        <Modal
            show={!!dataResults}
            aria-labelledby="example-modal-sizes-title-sm"
            centered
            onHide={() => {
                onHide();
                history.push(`/product-stores/list`);
            }}
            backdrop={true}
            dialogClassName={'body-dialog-connect'}
        >
            <Modal.Header>
                <Modal.Title>
                    {dataResults?.isSingle ?  formatMessage({ defaultMessage: 'Tạo sản phẩm kho' }) : formatMessage({ defaultMessage: 'Tạo sản phẩm kho hàng loạt' })}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="overlay overlay-block cursor-default">
                <div className='row'>
                    <div className='col-12 mt-3'>{formatMessage({ defaultMessage: 'Sản phẩm đã chọn' })}: <span className='font-weight-bold' style={{ fontWeight: 'bold' }}>{formatNumberToCurrency(dataResults?.total_product)}</span></div>
                    <div className='col-12 mt-3'>{formatMessage({ defaultMessage: 'Sản phẩm kho tạo thành công' })}: <span className='font-weight-bold text-success' style={{ fontWeight: 'bold' }}>{formatNumberToCurrency(dataResults?.total_success)}</span></div>
                    <div className='col-12 mt-3'>{formatMessage({ defaultMessage: 'Sản phẩm kho tạo thất bại' })}: <span className='font-weight-bold text-danger' style={{ fontWeight: 'bold' }}>{formatNumberToCurrency(dataResults?.total_fail)}</span></div>
                    {dataResults?.list_product_fail?.length > 0 && (
                        <div className='col-12 mt-3'>
                            <table className="table table-borderless product-list table-vertical-center fixed">
                                <thead>
                                    <tr className="font-size-lg">
                                        <th style={{ fontSize: '14px' }} width="40%">{formatMessage({ defaultMessage: 'SKU sản phẩm' })}</th>
                                        <th style={{ fontSize: '14px' }}>{formatMessage({ defaultMessage: 'Lỗi' })}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dataResults?.list_product_fail?.map((data) => {
                                        return (<tr key={`product-multiple-${data.index}`}>
                                            <td>
                                                <span>{data.sku}</span>
                                                <OverlayTrigger
                                                    overlay={
                                                        <Tooltip title='#1234443241434' style={{ color: 'red' }}>
                                                            <span>
                                                                {isCopied ? formatMessage({ defaultMessage: `Copy thành công` }) : `Copy to clipboard`}
                                                            </span>
                                                        </Tooltip>
                                                    }
                                                >
                                                    <span className='ml-2'>
                                                        <i style={{ cursor: 'pointer' }} onClick={() => onCopyToClipBoard(data?.sku)} className="far fa-copy"></i>
                                                    </span>
                                                </OverlayTrigger>
                                            </td>
                                            <td>{data.error_message}</td>
                                        </tr>)
                                    }

                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </Modal.Body>
            <Modal.Footer className="form" style={{ borderTop: '1px solid #dbdbdb', justifyContent: 'end', paddingTop: 10, paddingBottom: 10 }} >
                <div className="form-group">
                    <button
                        type="button"
                        onClick={() => {
                            onHide();
                            history.push(`/product-stores/list`);
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

export default memo(ModalCreateMultipleResults);