import React, { memo, useState, useMemo, useCallback } from 'react';
import { Modal } from 'react-bootstrap';

const ProductShowInfo = memo(({
    show,
    onHide
}) => {    

    return (
        <Modal
            show={show}
            aria-labelledby="example-modal-sizes-title-sm"
            centered
            onHide={onHide}
            backdrop={'static'}
            dialogClassName={'body-dialog-connect'}
        >
            <Modal.Body className="overlay overlay-block cursor-default" style={{ padding: 0 }}>

            </Modal.Body>
        </Modal>
    )
});