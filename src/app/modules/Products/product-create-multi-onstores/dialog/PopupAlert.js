import React, { memo } from 'react';
import { Modal } from 'react-bootstrap';
import { useIntl } from 'react-intl';

const PopupAlert = memo(({
    show,
    onHide
}) => {
    const {formatMessage} = useIntl()
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
                    <div className="mb-6" >
                        {formatMessage({defaultMessage:'Vui lòng cập nhật đầy đủ các trường thông tin bắt buộc'})}
                    </div>
                    <button
                        id="kt_login_signin_submit"
                        className={`btn btn-primary font-weight-bold px-9 `}
                        style={{ width: 150 }}
                        onClick={e => {
                            e.preventDefault();
                            onHide();
                        }}
                    >
                        <span className="font-weight-boldest">{formatMessage({defaultMessage:'ĐÓNG'})}</span>
                    </button>
                </div>
            </Modal.Body>
        </Modal>
    )
});

export default PopupAlert;