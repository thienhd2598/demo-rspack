import React, { memo } from 'react';
import { Modal } from 'react-bootstrap';
import { useIntl } from 'react-intl';

const ModalConfirmCancel = memo(({
    show,
    onHide,
    onConfirm,
    title,
    titleSuccess
}) => {
    const { formatMessage } = useIntl();

    return (
        <Modal
            show={show}
            aria-labelledby="example-modal-sizes-title-sm"
            centered
            onHide={onHide}
            backdrop={true}
        >
            <Modal.Body className="overlay overlay-block cursor-default">
                <div className='text-center'>
                    <div className="mb-10" >
                        {title}
                    </div>
                    <div className="form-group mb-0">
                        <button
                            id="kt_login_signin_submit"
                            className="btn btn-light btn-elevate mr-3"
                            style={{ width: 120 }}
                            onClick={e => {
                                e.preventDefault();
                                onHide();
                            }}
                        >
                            <span className="font-weight-boldest">
                                {formatMessage({ defaultMessage: 'Không' })}
                            </span>
                        </button>
                        <button
                            className={`btn btn-primary font-weight-bold`}
                            style={{ width: 120 }}
                            onClick={onConfirm}
                        >
                            <span className="font-weight-boldest">
                                {titleSuccess || formatMessage({ defaultMessage: 'Có, Hủy' })}
                            </span>
                        </button>
                    </div>
                </div>
            </Modal.Body>
        </Modal>
    )
});

export default ModalConfirmCancel;