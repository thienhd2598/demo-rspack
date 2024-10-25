import React from 'react'
import { Modal } from 'react-bootstrap'
import { useIntl } from 'react-intl'

const ConfirmDialog = ({ action, title, show, onHide }) => {

    const { formatMessage } = useIntl()

  return (
    <Modal
      aria-labelledby="example-modal-sizes-title-lg"
      centered
      show={show}
      onHide={onHide}
    >
      <Modal.Body className="overlay overlay-block cursor-default text-center">
        <div className="mb-6">{ title }</div>
        <div>
          <button
            className="btn btn-secondary mr-4"
            style={{ width: 150 }}
            onClick={onHide}
          >
            {formatMessage({ defaultMessage: "Huỷ" })}
          </button>
            <button
              className="btn btn-primary"
              style={{ width: 150 }}
              onClick={() => {
                action()
                onHide()
              }}
           >
            {formatMessage({ defaultMessage: "Đồng ý" })}
          </button>
          
        </div>
      </Modal.Body>
    </Modal>
  )
}

export default ConfirmDialog