import React from 'react'
import { Modal } from 'react-bootstrap';
import { useIntl } from 'react-intl';
const ModalConfirmAddFrame = ({ productNotImgOrigin, setProductNotImgOrigin, setIsShowCreateFrameImg}) => {
    const { formatMessage } = useIntl()
  return (
    <div>
        <Modal
          show={productNotImgOrigin?.length > 0}
          aria-labelledby="example-modal-sizes-title-lg"
          centered
          onHide={() => setProductNotImgOrigin([])}
        >
          <Modal.Body className="overlay overlay-block cursor-default">
            <div className="mb-4" style={{ fontSize: 16 }}>
              {formatMessage({ defaultMessage: `Sản phẩm chưa có ảnh gốc sẽ không thao tác được với thay khung hàng loạt cho ảnh gốc:` })}
            </div>
            <ul style={{ maxHeight: 200, overflowY: 'auto' }}>
              {productNotImgOrigin?.map((_productName, _index) => (
                <li
                  key={`product-not-img-origin-${_index}`}
                  className="mb-4"
                >
                  {`${_productName}.`}
                </li>
              ))}
            </ul>
            <div className="form-group mb-0 text-center mt-6">
              <button
                className="btn btn-secondary mr-3"
                style={{ width: 120 }}
                onClick={() => setProductNotImgOrigin([])}
              >
                <span className="font-weight-boldest">{formatMessage({ defaultMessage: 'Đóng' })}</span>
              </button>
              <button
                className="btn btn-primary btn-elevate mr-3"
                style={{ width: 120 }}
                onClick={() => {
                  setProductNotImgOrigin([])
                  setIsShowCreateFrameImg(true);
                }}
              >
                <span className="font-weight-boldest">{formatMessage({ defaultMessage: 'Tiếp tục' })}</span>
              </button>
            </div>
          </Modal.Body>
        </Modal>
    </div>
  )
}

export default ModalConfirmAddFrame