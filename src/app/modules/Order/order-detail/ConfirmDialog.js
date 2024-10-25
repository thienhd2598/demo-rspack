import React from 'react'
import { Modal } from 'react-bootstrap';
import { useIntl } from 'react-intl';

export const ConfirmDialog = ({ title = null, show, onHide }) => {
    const { formatMessage } = useIntl();
    console.log('show', show)
    return (
        <Modal
            onHide={onHide}
            show={show}
            aria-labelledby="example-modal-sizes-title-lg"
            centered
        >
            <Modal.Body className="overlay overlay-block cursor-default text-center">
                <div className="mb-6">
                    {!!title ? title : formatMessage({ defaultMessage: 'Mã đơn hàng không hợp lệ' })}
                </div>
                <div className='d-flex justify-content-center'>
                    <button onClick={onHide} className="btn btn-secondary mr-4" style={{ width: 150 }}>
                        {formatMessage({ defaultMessage: "Đóng" })}
                    </button>
                </div>
            </Modal.Body>
        </Modal>
    );
};