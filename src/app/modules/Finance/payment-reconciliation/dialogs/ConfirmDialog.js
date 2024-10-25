import React from 'react'
import { Modal } from 'react-bootstrap'
import { useIntl } from 'react-intl'

const ConfirmDialog = ({isDelete, reset, title, initValidate,
   setInitialValues,
   selectedIdItem,
   show, onHide }) => {

    const { formatMessage } = useIntl()

    const handleRemoveItem = () => {
      setInitialValues(prev => ({
        ...prev,
        dataForm: prev.dataForm.filter(item => item.id !== selectedIdItem)
      }));
      delete initValidate[`item-process-${selectedIdItem}-note`]
      onHide()
    }

  return (
    <Modal
      aria-labelledby="example-modal-sizes-title-lg"
      centered
      show={show}
      onHide={onHide}
    >
      <Modal.Body className="overlay overlay-block cursor-default text-center">
        <div className="mb-6">{title}</div>
        <div>
          <button
            className="btn btn-secondary mr-4"
            style={{ width: 150 }}
            onClick={onHide}
          >
            {formatMessage({ defaultMessage: "Huỷ" })}
          </button>
          {isDelete ? (
            <button
            className="btn btn-primary"
            style={{ width: 150 }}
            onClick={handleRemoveItem}
          >
            {formatMessage({ defaultMessage: "Có, Xoá" })}
          </button>
          ) : (
            <button
              className="btn btn-primary"
              style={{ width: 150 }}
              onClick={() => {
                reset()
                onHide()
              }}
           >
            {formatMessage({ defaultMessage: "Đồng ý" })}
          </button>
          )}
          
        </div>
      </Modal.Body>
    </Modal>
  )
}

export default ConfirmDialog