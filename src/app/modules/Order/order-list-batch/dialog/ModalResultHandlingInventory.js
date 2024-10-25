import React, { memo, useState } from 'react';
import { Modal, OverlayTrigger, Tooltip } from 'react-bootstrap';
import {useIntl} from 'react-intl'
const ModalResultHandlingInventory = ({
    dataResults,
    onHide,
    totalOrder
}) => {
    const [isCopied, setIsCopied] = useState(false);
    const {formatMessage} = useIntl()
    const onCopyToClipBoard = async (text) => {
        await navigator.clipboard.writeText(text);
        setIsCopied(true);
        setTimeout(() => {
            setIsCopied(false);
        }, 1500)
    };

    console.log(`RESULT: `, dataResults);

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
                    {formatMessage({defaultMessage: 'Kết quả xử lý tồn hàng loạt'})}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="overlay overlay-block cursor-default">
                <i className="fas fa-times" onClick={onHide} style={{ position: 'absolute', top: -45, right: 20, fontSize: 20, cursor: 'pointer' }}/>
                <div className='row'>
                    <div className='col-12'>{formatMessage({defaultMessage: 'Kiện hàng đã chọn'})}: <span className='font-weight-bold'>{totalOrder ?? 0}</span></div>
                    <div className='col-12 mt-3'>{formatMessage({defaultMessage: 'Kiện hàng xử lý thành công'})}: <span className='font-weight-bold text-success'>{totalOrder - dataResults?.list_fail?.length ?? 0}</span></div>
                    <div className='col-12 mt-3'>{formatMessage({defaultMessage: 'Kiện hàng xử lý thất bại'})}: <span className='font-weight-bold text-danger'>{dataResults?.list_fail?.length ?? 0}</span></div>
                    {dataResults?.list_fail?.length > 0 && <div className='col-12 mt-4'>
                        <table className="table table-borderless product-list table-vertical-center fixed">
                            <thead>
                                <tr className="font-size-lg">
                                    <th style={{fontSize: '14px'}} width="40%">{formatMessage({defaultMessage: 'Mã kiện hàng'})}</th>
                                    <th style={{fontSize: '14px'}}>{formatMessage({defaultMessage: 'Lỗi'})}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dataResults?.list_fail?.map((data, index) => {
                                        return (<tr key={`order-row-error-${index}`}>
                                            <td>
                                                <span>{data?.system_package_number}</span>
                                                <OverlayTrigger
                                                    overlay={
                                                        <Tooltip title='#1234443241434' style={{ color: 'red' }}>
                                                            <span>
                                                                {isCopied ? `Copy ${formatMessage({defaultMessage: 'thành công'})}` : `Copy to clipboard`}
                                                            </span>
                                                        </Tooltip>
                                                    }
                                                >
                                                    <span className='ml-2'>
                                                        <i style={{ cursor: 'pointer' }} onClick={() => onCopyToClipBoard(data?.system_package_number)} className="far fa-copy"></i>
                                                    </span>
                                                </OverlayTrigger>
                                            </td>
                                            <td style={{ wordBreak: 'break-word' }}>{data?.error_message}</td>
                                        </tr>)
                                    })
                                }
                            </tbody>
                        </table>
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
                        {formatMessage({defaultMessage: 'Đóng'})}
                    </button>
                </div>
            </Modal.Footer>
        </Modal >
    )
};

export default memo(ModalResultHandlingInventory);