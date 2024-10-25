import React from 'react'
import { useCallback } from "react";
import { Modal } from "react-bootstrap";
import { useIntl } from "react-intl";
const ConfirmDeleteStoreDialog = ({ show, onHide, onDeleteStore}) => {
    const { formatMessage } = useIntl();
  return (
    <Modal
    onHide={onHide}
    show={show}
    aria-labelledby="example-modal-sizes-title-lg"
    centered
  >
    <Modal.Body className="overlay overlay-block cursor-default text-center">
      <div className="mb-6">
        {formatMessage({defaultMessage: "Bạn có chắc chắn muốn xoá gian hàng này không?"})}
      </div>
      <div>
        <button
          className="btn btn-secondary mr-4"
          style={{ width: 150 }}
          onClick={onHide}
        >
          {formatMessage({ defaultMessage: "Không" })}
        </button>
        <button
          onClick={onDeleteStore}
          className="btn btn-primary"
          style={{ width: 150 }}
        >
          {formatMessage({ defaultMessage: "Có, xoá" })}
        </button>
      </div>
    </Modal.Body>
  </Modal>
  )
}

export default ConfirmDeleteStoreDialog