import React, { memo, useState, useMemo, useCallback } from 'react';
import { Modal } from 'react-bootstrap';
import { useIntl } from 'react-intl';

const LoadingDialog = memo(({ show, onHide }) => {
    const { formatMessage } = useIntl();
    return (
        <Modal
            show={show}
            aria-labelledby="example-modal-sizes-title-lg"
            centered
            backdrop={'static'}
            dialogClassName='width-fit-content'
        >
            <Modal.Body className="overlay overlay-block cursor-default text-center" style={{ width: 200 }}>
                <div className="mb-4" >{formatMessage({ defaultMessage: 'Đang thực hiện'})}</div>
                <div className="mb-2" style={{ paddingRight: 15, paddingTop: 10 }}><span className="spinner spinner-primary mb-8"></span></div>
            </Modal.Body>
        </Modal>
    )
});

export default LoadingDialog;