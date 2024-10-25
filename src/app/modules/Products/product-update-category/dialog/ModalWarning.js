import React, { memo, useMemo, useState } from 'react';
import { Modal } from 'react-bootstrap';
import { useIntl } from "react-intl";
import { useHistory, useLocation } from "react-router-dom";

const ModalWarning = ({
    show,
    onHide,
}) => {
    const { formatMessage } = useIntl();
    const history = useHistory();

    return (
        <Modal
            show={!!show}
            aria-labelledby="example-modal-sizes-title-sm"
            centered
            onHide={onHide}
            backdrop={true}
            dialogClassName={'body-dialog-connect'}
        >
            <Modal.Body className="overlay overlay-block cursor-default text-center">
                <div className='mt-4 mb-4 d-flex justify-content-center align-items-center'>
                    <span>{formatMessage({ defaultMessage: 'Hệ thống sẽ không lưu lại những thông tin bạn đã cập nhật. Bạn có đồng ý hủy bỏ?' })}</span>
                </div>
                <div className="form-group mb-0">
                    <button onClick={onHide} type="button" className="btn mr-3" style={{ width: 100, background: 'gray', color: "#fff" }}>
                        {formatMessage({ defaultMessage: 'Hủy'})}
                    </button>
                    <button type="submit" onClick={() => history.push(`/products/list`)} className="btn btn-primary btn-elevate mr-3" style={{ width: 100 }}>
                        {formatMessage({ defaultMessage: 'Đồng ý' })}
                    </button>
                </div>
            </Modal.Body>
            
        </Modal >
    )
};

export default memo(ModalWarning);