
import React, { memo, useMemo, useState } from "react";
import { Modal } from "react-bootstrap";
import { useIntl } from "react-intl";
import { useHistory } from "react-router-dom";
import PaginationModal from '../../../../../components/PaginationModal'

export const ResultDialog = ({ onHide, result, action }) => {
  const { formatMessage } = useIntl();
  const history = useHistory();
  const [page, setPage] = useState(1);
  let totalRecord = result?.list_error?.length || 0;

  const [title, titleTotal, titleSuccess, titleError] = useMemo(() => {
        switch (action) {
            case "import-file-manual": 
                  return [
                    formatMessage({ defaultMessage: 'Kết quả tạo đơn thủ công' }),
                    formatMessage({ defaultMessage: 'Tổng số đơn hàng cần tạo' }),
                    formatMessage({ defaultMessage: 'Tổng số đơn hàng tạo thành công' }),
                    formatMessage({ defaultMessage: 'Tổng số đơn hàng tạo thất bại' }),
                  ]
            case "approved-manual":
                return [
                    formatMessage({ defaultMessage: 'Kết quả duyệt đơn' }),
                    formatMessage({ defaultMessage: 'Tổng số đơn cần duyệt' }),
                    formatMessage({ defaultMessage: 'Tổng số đơn đã duyệt thành công' }),
                    formatMessage({ defaultMessage: 'Tổng số đơn đã duyệt thất bại' }),
                ];
            case "cancel-manual":
                return [
                    formatMessage({ defaultMessage: 'Kết quả huỷ đơn' }),
                    formatMessage({ defaultMessage: 'Tổng số đơn đã huỷ' }),
                    formatMessage({ defaultMessage: 'Tổng số đơn đã huỷ thành công' }),
                    formatMessage({ defaultMessage: 'Tổng số đơn đã huỷ thất bại' }),
                ];
            default: 
              return null
        }
    }, [action]
);

  let totalPage = Math.ceil(totalRecord / 5);
  return (
    <Modal
      show={!!result}
      aria-labelledby="example-modal-sizes-title-sm"
      centered
      onHide={onHide}
      backdrop={true}
      dialogClassName={"body-dialog-connect"}
    >
      <Modal.Header>
        <Modal.Title>{title}</Modal.Title>
        <span>
          <i style={{ cursor: "pointer" }} onClick={onHide} className="drawer-filter-icon fas fa-times icon-md text-right"></i>
        </span>
      </Modal.Header>
      <Modal.Body className="overlay overlay-block cursor-default">
        <div className="row">
          <div className="col-12 mt-3">
            {titleTotal}:
            <span className="font-weight-bold"><strong>{result?.total || 0}</strong></span>
          </div>
          <div className="col-12 mt-3">
            {titleSuccess} : <span className="font-weight-bold text-success">
              {result?.total_success || 0}
            </span>
          </div>
          <div className="col-12 mt-3">
            {titleError} : <span className="font-weight-bold text-danger">
            {result?.total_error || 0}
            </span>
          </div> 
          {!!result?.list_error?.length && (
              <>
              <div className="col-12 mt-2">
                <table className="table product-list table-border table-borderless table-vertical-center fixed">
                  <thead style={{borderRight: "1px solid #d9d9d9",borderLeft: "1px solid #d9d9d9"}}>
                    <tr className="font-size-lg">
                      <th style={{ fontSize: "14px" }} width="50%">{formatMessage({ defaultMessage: "Mã đơn hàng" })}</th>
                      <th style={{ fontSize: "14px" }} width="50%">{formatMessage({ defaultMessage: "Lỗi" })}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result?.list_error?.slice(5 * (page - 1), 5 + 5 * (page - 1)).map((err, i) => (
                        <tr key={i}>
                        <td style={{wordBreak: 'break-all'}}>{err?.id}</td>
                        <td style={{ wordBreak: "break-word" }}>{err?.msg}</td>
                        </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="col-12" style={{padding: "1rem", boxShadow: "rgb(0 0 0 / 20%) 0px -2px 2px -2px",}}>
                <PaginationModal
                  page={page}
                  totalPage={totalPage}
                  limit={5}
                  totalRecord={totalRecord}
                  count={result?.list_error?.slice(5 * (page - 1),5 + 5 * (page - 1))?.length}
                  onPanigate={(page) => setPage(page)}
                  // basePath={`/products/edit/${smeId}/affiliate`}
                  emptyTitle={formatMessage({
                    defaultMessage: "Không có lỗi",
                  })}
                />
              </div>
            </>
          )}
          
        </div>
      </Modal.Body>
      <Modal.Footer className="form" style={{borderTop: "1px solid #dbdbdb",justifyContent: "end",paddingTop: 10,paddingBottom: 10,}}>
        <div className="form-group">
          <button type="button" onClick={onHide} className="btn btn-primary btn-elevate mr-3" style={{ width: 100 }}>
            {formatMessage({ defaultMessage: "Đóng" })}
          </button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};