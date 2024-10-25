import React, { memo, useState } from "react";
import { Modal } from "react-bootstrap";
import { useIntl } from "react-intl";

export const ResultFeedBackDialog = ({ clearResult, onHide, dataResult }) => {
  const { formatMessage } = useIntl();

  return (
    <Modal show={!!dataResult} aria-labelledby="example-modal-sizes-title-sm" centered
      onHide={onHide}
      backdrop={true}
      dialogClassName={"body-dialog-connect"}>
      <Modal.Header>
        <Modal.Title>
          {dataResult?.retry ? formatMessage({ defaultMessage: "Thử lại hàng loạt" }) : formatMessage({ defaultMessage: "Kết quả phản hồi đánh giá khách hàng hàng loạt" })}
        </Modal.Title>
        <span>
          <i
            style={{ cursor: "pointer" }}
            onClick={onHide}
            className="drawer-filter-icon fas fa-times icon-md text-right"
          ></i>
        </span>
      </Modal.Header>
      <Modal.Body className="overlay overlay-block cursor-default">
        <div className="row">
          <div className="col-12 mt-3">
            {dataResult?.retry ? formatMessage({ defaultMessage: "Tổng phản hồi cần thử lại" }) : formatMessage({ defaultMessage: "Tổng đánh giá cần phản hồi" })}:
            <span className="font-weight-bold mx-2"><strong>{dataResult?.total || 0}</strong></span>
          </div>
          <div className="col-12 mt-3">
            {dataResult?.retry ? formatMessage({ defaultMessage: "Tổng phản hồi thử lại thành công" }) : formatMessage({ defaultMessage: "Tổng đánh giá phản hồi thành công" })}:<span className="font-weight-bold text-success mx-2">{dataResult?.total_success || 0}</span>
          </div>
          <div className="col-12 mt-3">
            {dataResult?.retry ? formatMessage({ defaultMessage: "Tổng phản hồi thử lại thất bại" }) : formatMessage({ defaultMessage: "Tổng đánh giá phản hồi thất bại" })}:<span className="font-weight-bold text-danger mx-2">{dataResult?.total_fail || 0}</span>
          </div>

          {dataResult?.retry && <div style={{ color: 'gray' }} className="col-12 mt-3">
            {formatMessage({ defaultMessage: "Chú ý: Những phản hồi thất bại có thể xem ở mục “Phản hồi lỗi”" })}
          </div>}

        </div>
      </Modal.Body>
      <Modal.Footer className="form" style={{ borderTop: "1px solid #dbdbdb", justifyContent: "end", paddingTop: 10, paddingBottom: 10 }}>
        <div className="form-group">
          <button type="button" onClick={onHide} className="btn btn-primary btn-elevate mr-3" style={{ width: 100 }}>
            {formatMessage({ defaultMessage: "Đóng" })}
          </button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};


