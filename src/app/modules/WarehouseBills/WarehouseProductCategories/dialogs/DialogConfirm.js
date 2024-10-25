import React, { Fragment } from 'react'
import { Modal } from 'react-bootstrap';
import { useIntl } from 'react-intl';

const DialogConfirm = ({handleDeleteCategory, show, onHide}) => {
  const { formatMessage } = useIntl()
  return (
    <Fragment>
    <Modal
      aria-labelledby="example-modal-sizes-title-lg"
      centered
      show={show}
      onHide={onHide}
    >
      <Modal.Body className="overlay overlay-block cursor-default text-center">
        <div>
          {formatMessage({ defaultMessage: 'Bạn có muốn xoá danh mục này không?' })}
        </div>
      </Modal.Body>

      <Modal.Footer className="form" style={{ borderTop: '1px solid #dbdbdb', justifyContent: 'center', paddingTop: 10, paddingBottom: 10 }} >
          <div className="form-group">
          <button
              type="button"
              className="btn btn-elevate mr-3"
              onClick={onHide}
              style={{ width: 100, background: 'grey', color: 'white' }}>
              {formatMessage({ defaultMessage: 'Hủy' })}
          </button>
          <button
              type="button"
              className="btn btn-primary btn-elevate mr-3"
              style={{ width: 100 }}
              onClick={handleDeleteCategory}
          >
              {formatMessage({ defaultMessage: 'Xóa' })}
          </button>
          </div>
        </Modal.Footer>
    </Modal>

  </Fragment>
  )
}

export default DialogConfirm