import React, { } from "react";
import { Modal } from "react-bootstrap";
import { FormattedMessage, useIntl } from "react-intl";
import { formatNumberToCurrency } from "../../../../../utils";


function LoadingPrintDialog({ show, onHide, totalStamp, totalVariant }) {
  const { formatMessage } = useIntl();

  return (
    <Modal
      style={{ zIndex: 9999 }}
      show={show}
      aria-labelledby="example-modal-sizes-title-lg"
      centered
      backdrop={'true'}
      dialogClassName='width-fit-content'
    >
      <Modal.Header>
        <Modal.Title>
          {formatMessage({ defaultMessage: 'In mã vạch' })}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="overlay overlay-block cursor-default" style={{ width: 500, zIndex: 9999 }} >
        <div className="mb-8">
          <span className="mb-2" style={{ display: 'block' }}>{formatMessage({ defaultMessage: 'Tổng hàng hóa cần in' })}: <strong>{formatNumberToCurrency(totalVariant)}</strong></span>
          <span>{formatMessage({ defaultMessage: 'Tổng tem cần in' })}: <strong>{formatNumberToCurrency(totalStamp)}</strong></span>
        </div>
        <div className="d-flex justify-content-center align-items-center flex-column">
          <div className="mb-4"><span className="spinner spinner-primary" style={{ marginRight: 20 }} ></span></div>
          <div className="mb-8">
            <span className="fs-16">{formatMessage({ defaultMessage: 'Đang xử lý' })}...</span>
          </div>
          <strong className="text-danger">{formatMessage({ defaultMessage: 'Chú ý: Xin vui lòng không đóng trình duyệt trong lúc hệ thống đang xử lý' })}</strong>
        </div>
      </Modal.Body>
      <Modal.Footer className="form" style={{ borderTop: '1px solid #dbdbdb', justifyContent: 'end', paddingTop: 10, paddingBottom: 10 }} >
        <div className="form-group">
          <button
            type="button"
            onClick={onHide}
            className="btn btn-secondary"
            style={{ width: 100 }}
          >
            {formatMessage({ defaultMessage: 'Hủy bỏ' })}
          </button>
        </div>
      </Modal.Footer>
    </Modal >
  );
}

export default LoadingPrintDialog;