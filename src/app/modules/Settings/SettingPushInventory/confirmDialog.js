import React from 'react'
import { Modal } from 'react-bootstrap'
import { useIntl } from 'react-intl';

const ConfirmDialog = ({ show, onHide, handle }) => {
    const { formatMessage } = useIntl();
    return (
        <Modal onHide={() => console.log('99')} show={show} aria-labelledby="example-modal-sizes-title-lg" centered>
            <Modal.Body className="overlay overlay-block cursor-default text-center">
                <div className="mb-6">
                    {formatMessage({ defaultMessage: "Lưu ý mọi thông tin bạn nhập trước đó sẽ không được lưu lại?" })}
                </div>
                <div>
                    <button onClick={onHide} className="btn btn-secondary mr-4" style={{ width: 150 }}>
                        {formatMessage({ defaultMessage: "Quay lại" })}
                    </button>
                    <button onClick={handle} className="btn btn-primary" style={{ width: 150 }}>
                        {formatMessage({ defaultMessage: "Tiếp tục" })}
                    </button>
                </div>
            </Modal.Body>
        </Modal>
    )
}

export default ConfirmDialog