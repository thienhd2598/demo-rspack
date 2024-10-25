import React from 'react'
import { Modal } from 'react-bootstrap'
import { useIntl } from 'react-intl'
import { Link } from 'react-router-dom'

const ModalDisconnectStore = ({storeDisconnect, onHide}) => {
    const { formatMessage} = useIntl()
  return (
    <div>
         <Modal
        show={!!storeDisconnect?.length}
        aria-labelledby="example-modal-sizes-title-lg"
        centered
        onHide={onHide}
      >
        <Modal.Body className="overlay overlay-block cursor-default text-center">
          <div className="mb-4" >{formatMessage({ defaultMessage: 'Kết nối đến gian hàng' })} {storeDisconnect.join(', ')} {formatMessage({ defaultMessage: 'không khả dụng. Vui lòng kết nối lại để thực hiện thao tác này.' })}</div>

          <div className="form-group mb-0">
            <button
              type="button"
              className="btn btn-light btn-elevate mr-3"
              style={{ width: 150 }}
              onClick={onHide}
            >
              <span className="font-weight-boldest">{formatMessage({ defaultMessage: 'Bỏ qua' })}</span>
            </button>
            <Link
              type="button"
              to='/setting/channels'
              className={`btn btn-primary font-weight-bold`}
              style={{ width: 150 }}
            >
              <span className="font-weight-boldest">{formatMessage({ defaultMessage: 'Kết nối lại' })}</span>
            </Link>
          </div>
        </Modal.Body>
      </Modal >
    </div>
  )
}

export default ModalDisconnectStore