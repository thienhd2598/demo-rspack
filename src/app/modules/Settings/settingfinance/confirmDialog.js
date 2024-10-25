import React from 'react'
import { Modal } from 'react-bootstrap';
import { useIntl } from 'react-intl';

export const ConfirmDialog = ({ handleDisconnect, show, onHide }) => {
    const { formatMessage } = useIntl();

    return (
        <Modal
            onHide={onHide}
            show={true}
            aria-labelledby="example-modal-sizes-title-lg"
            centered
        >
            <Modal.Body className="overlay overlay-block cursor-default text-center">
                <div className="mb-6">
                    {formatMessage({ defaultMessage: "Bạn có đồng ý ngắt kết nối với hệ thống xuất hoá đơn Hoá đơn 360 không ?" })}
                </div>
                <div>
                    <button onClick={onHide} className="btn btn-secondary mr-4" style={{ width: 150 }}>
                        {formatMessage({ defaultMessage: "Huỷ" })}
                    </button>
                    <button
                        onClick={handleDisconnect}
                        className="btn btn-primary"
                        style={{ width: 150 }}
                    >
                        {formatMessage({ defaultMessage: "Đồng ý" })}
                    </button>
                </div>
            </Modal.Body>
        </Modal>
    );
};