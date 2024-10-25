import React, { memo } from 'react';
import { Modal } from 'react-bootstrap';
import { useIntl } from "react-intl";

const ModalReloadResult = ({    
    dataResults,
    onHide,    
}) => {    
    const {formatMessage} = useIntl()    
    
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
                    {formatMessage({ defaultMessage: 'Tải lại chương trình' })}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="overlay overlay-block cursor-default">
                <i
                    className="fas fa-times"
                    onClick={onHide}
                    style={{ position: 'absolute', top: -45, right: 20, fontSize: 20, cursor: 'pointer' }}
                />
                <div className='row'>
                    <div className='col-12'>{formatMessage({defaultMessage: 'Chương trình đã chọn'})}: <span className='font-weight-bold'>{(dataResults?.total_success ?? 0) + (dataResults?.total_fail ?? 0)}</span></div>
                    <div className='col-12 mt-3'>{formatMessage({defaultMessage: 'Chương trình tải lại thành công'})}: <span className='font-weight-bold text-success'>{dataResults?.total_success ?? 0}</span></div>
                    <div className='col-12 mt-3'>{formatMessage({defaultMessage: 'Chương trình tải lại thất bại'})}: <span className='font-weight-bold text-danger'>{dataResults?.total_fail ?? 0}</span></div>
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
                       {formatMessage({defaultMessage:'Đóng'})} 
                    </button>
                </div>
            </Modal.Footer>
        </Modal >
    )
};

export default memo(ModalReloadResult);