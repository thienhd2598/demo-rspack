
import React, { useState } from "react";
import { useIntl } from "react-intl";
import PaginationModal from "../../../../../components/PaginationModal";
import { useHistory, useLocation } from "react-router-dom";
import { Modal } from "react-bootstrap";
import querystring from 'querystring'

export const ResultDialog = ({closeProcessDialog, dataProcessed, onHide }) => {
  const { formatMessage } = useIntl();
  const location = useLocation();
  const history = useHistory()
  const params =  querystring.parse(location.search.slice(1, 100000))


  const [page, setPage] = useState(1);

  let totalRecord = dataProcessed?.list_error?.length || 0;

  let totalPage = Math.ceil(totalRecord / 5);

  const redirect = () => {
    history.push(`${location.pathname}?${querystring.stringify({
     ...params,
      page: 1,
      tab: 'PROCESSED',
      settlement_abnormal: 2,
      settlement_abnormal_status: 2
    })}`
  ) }

  return (
    <Modal show={!!dataProcessed}
      aria-labelledby="example-modal-sizes-title-sm"
      centered
      onHide={() => {
        onHide()
        closeProcessDialog()
        redirect()
      }}
      backdrop={true}
      dialogClassName={"body-dialog-connect"}
    >
      <Modal.Header>
        <Modal.Title>
          {formatMessage({ defaultMessage: "Kết quả xử lý" })}
        </Modal.Title>
        <span><i style={{ cursor: "pointer" }} onClick={() => {
          onHide() 
          closeProcessDialog()
          redirect()
         }}
         className="drawer-filter-icon fas fa-times icon-md text-right"></i>
        </span>
      </Modal.Header>
      <Modal.Body className="overlay overlay-block cursor-default">
        <div className="row">
          <div className="col-12 mt-3">
            {formatMessage({ defaultMessage: "Tổng phiếu cần xử lý" })}:
            <span className="font-weight-bold">
              <strong>{dataProcessed.total}</strong>
            </span>
          </div>
          <div className="col-12 mt-3">
            {formatMessage({
              defaultMessage: "Tổng phiếu xử lý thành công",
            })}
            : <span className="font-weight-bold text-success">
            {(+dataProcessed.total - +dataProcessed.total_error) || 0}
            </span>
          </div>
          <div className="col-12 mt-3">
            {formatMessage({
              defaultMessage: "Tổng phiếu xử lý thất bại",
            })}
            : <span className="font-weight-bold text-danger">{+dataProcessed.total_error || 0}</span>
          </div>
        {!!dataProcessed?.list_error?.length && (
          <>
          <div className="col-12">
            <table className="table product-list table-border table-borderless table-vertical-center fixed">
              <thead style={{
                  borderRight: "1px solid #d9d9d9",
                  borderLeft: "1px solid #d9d9d9",
                }}>
                <tr className="font-size-lg">
                  <th style={{ fontSize: "14px" }} width="50%">
                    {formatMessage({ defaultMessage: "Mã đơn hàng" })}
                  </th>
                  <th style={{ fontSize: "14px" }}>
                    {formatMessage({ defaultMessage: "Lỗi" })}
                  </th>
                </tr>
              </thead>
              <tbody>
                {dataProcessed && dataProcessed?.list_error?.map(list => (
                  <tr key={`${list?.settlement_id}`}>
                    <td>{list?.order_ref_id}</td>
                    <td style={{ wordBreak: "break-word" }}>{list?.message}</td>
                  </tr>
                ))}
                
              </tbody>
            </table>
          </div>
          <div
            className="col-12"
            style={{
              padding: "1rem",
              boxShadow: "rgb(0 0 0 / 20%) 0px -2px 2px -2px",
            }}
          >
            <PaginationModal
                page={page}
                totalPage={totalPage}
                limit={5}
                totalRecord={totalRecord}
                count={dataProcessed?.list_error?.slice(5 * (page - 1),5 + 5 * (page - 1))?.length}
                onPanigate={(page) => setPage(page)}
                emptyTitle={formatMessage({
                  defaultMessage: "Không có dữ liệu",
                })}
              />
          </div>
        </>
        )}
          
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
              closeProcessDialog()
              redirect()
            }}
          >
            {formatMessage({ defaultMessage: "Đóng" })}
          </button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};


