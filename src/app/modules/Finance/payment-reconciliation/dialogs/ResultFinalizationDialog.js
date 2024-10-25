import React from 'react'
import { Modal } from 'react-bootstrap'
import { useIntl } from 'react-intl';

const ResultFinalizationDialog = ({onHide, show, result}) => {
    const { formatMessage } = useIntl();
  return (
    <Modal show={show} aria-labelledby="example-modal-sizes-title-sm" centered backdrop={true} dialogClassName={"body-dialog-connect"}>
    <Modal.Header>
      <Modal.Title>
        {formatMessage({ defaultMessage: "Kết quả quyết toán" })}
      </Modal.Title>
      <span><i style={{ cursor: "pointer" }} onClick={() => {
        onHide() 
       }}
       className="drawer-filter-icon fas fa-times icon-md text-right"></i>
      </span>
    </Modal.Header>
    <Modal.Body className="overlay overlay-block cursor-default">
      <div className="row">
        <div className="col-12 mt-3">
          {formatMessage({ defaultMessage: "Tổng đơn hàng quyết toán" })}:
          <span className="font-weight-bold">
            <strong>{result?.total}</strong>
          </span>
        </div> 
        <div className="col-12 mt-3">
          {formatMessage({defaultMessage: "Tổng đơn hàng quyết toán thành công",})}
          : <span className="font-weight-bold text-success">
          {result?.total_success || 0}
          </span>
        </div>
        <div className="col-12 mt-3">
          {formatMessage({defaultMessage: "Tổng đơn hàng quyết toán thất bại",})}
          : <span className="font-weight-bold text-success">
          {result?.total_fail || 0}
          </span>
        </div>
      </div>
    </Modal.Body>
    <Modal.Footer className="form" style={{
        borderTop: "1px solid #dbdbdb",
        justifyContent: "end",
        paddingTop: 10,
        paddingBottom: 10,}}>
      <div className="form-group">
        <button
          type="button"
          className="btn btn-primary btn-elevate mr-3"
          style={{ width: 100 }}
          onClick={() => {
            onHide()
          }}
        >
          {formatMessage({ defaultMessage: "Đóng" })}
        </button>
      </div>
    </Modal.Footer>
  </Modal>
  )
}

export default ResultFinalizationDialog