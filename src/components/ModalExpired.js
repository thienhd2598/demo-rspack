import React, { memo } from 'react';
import { Modal } from 'react-bootstrap';
import { useIntl } from 'react-intl';

const ModalExpired = ({
    message,
    onSubmit
}) => {
    const { formatMessage } = useIntl();
    const fromAgency = localStorage.getItem('fromAgency')
    const jwt = localStorage.getItem('jwt')
    return (
        <Modal
            show={!!fromAgency && !jwt}
            aria-labelledby="example-modal-sizes-title-sm"
            centered
            backdrop={true}
        >
            <Modal.Body className="overlay overlay-block cursor-default">
                <div className='text-center'>
                    <div className="mb-8" >
                        {formatMessage({defaultMessage: "Phiên đăng nhập của bạn đã hết hạn. Vui lòng đăng nhập lại từ Agency App."})}
                    </div>
                    <div className="form-group mb-0">
                        <button
                            className={`btn btn-primary font-weight-bold`}
                            style={{ width: 120 }}
                            onClick={() => {
                                localStorage.removeItem('fromAgency')
                                localStorage.removeItem('accessToken')
                                window.close()
                            }}
                        >
                            <span className="font-weight-boldest">
                                {formatMessage({ defaultMessage: 'Đóng' })}
                            </span>
                        </button>
                    </div>
                </div>
            </Modal.Body>
        </Modal>
    )
};

export default ModalExpired;