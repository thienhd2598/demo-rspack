import React, { memo, useMemo, useState } from 'react';
import { Modal } from 'react-bootstrap';
import { useIntl } from "react-intl";

const ModalWarning = ({
    show,
    onHide,
}) => {
    const { formatMessage } = useIntl();

    return (
        <Modal
            show={!!show}
            aria-labelledby="example-modal-sizes-title-sm"
            centered
            onHide={onHide}
            backdrop={true}
            dialogClassName={'body-dialog-connect'}
        >
            <Modal.Header style={{justifyContent: 'flex-end'}}>
                    <span style={{cursor: 'pointer'}} onClick={onHide}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x-lg" viewBox="0 0 16 16" >
                        <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z"/>
                        </svg>
                    </span>
                </Modal.Header>
            <Modal.Body className="overlay overlay-block cursor-default">
                <div className='mt-4 mb-4 d-flex justify-content-center align-items-center text-danger fs-16'>
                    <span>{formatMessage({ defaultMessage: 'Gian hàng chưa được liên kết kho vật lý. Vui lòng liên kết để tiếp tục nhập tồn dữ trữ.' })}</span>
                </div>
            </Modal.Body>
        </Modal >
    )
};

export default memo(ModalWarning);