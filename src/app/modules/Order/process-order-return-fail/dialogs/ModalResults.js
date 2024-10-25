import React, { memo, useState } from "react";
import { Modal } from "react-bootstrap";
import { useIntl } from "react-intl";
import { useHistory } from "react-router-dom";
import PaginationModal from "../../../../../components/PaginationModal";
export const ModalFileUploadResults = ({addOrderFromFileToList, onHide, resultUploadFile }) => {
  const { formatMessage } = useIntl();
  const [page, setPage] = useState(1);
  let totalRecord =
    resultUploadFile?.coValidateExcelImportWarehouse?.list_error?.length || 0;

  let totalPage = Math.ceil(totalRecord / 5);
  return (
    <Modal
      show={!!resultUploadFile}
      aria-labelledby="example-modal-sizes-title-sm"
      centered
      onHide={() => {
        addOrderFromFileToList()
        onHide()
      }}
      backdrop={true}
      dialogClassName={"body-dialog-connect"}
    >
      <Modal.Header>
        <Modal.Title>
          {formatMessage({ defaultMessage: "Kết quả tải file" })}
        </Modal.Title>
        <span>
          <i
            style={{ cursor: "pointer" }}
            onClick={() => {
              addOrderFromFileToList()
              onHide()
            }}
            className="drawer-filter-icon fas fa-times icon-md text-right"
          ></i>
        </span>
      </Modal.Header>
      <Modal.Body className="overlay overlay-block cursor-default">
        <div className="row">
          <div className="col-12 mt-3">
            {formatMessage({ defaultMessage: "Tổng mã vận đơn tải lên" })}:{" "}
            <span className="font-weight-bold">
              <strong>
                {resultUploadFile?.coValidateExcelImportWarehouse?.total}
              </strong>
            </span>
          </div>
          <div className="col-12 mt-3">
            {formatMessage({
              defaultMessage: "Tổng mã vận đơn tải lên hợp lệ",
            })}
            :{" "}
            <span className="font-weight-bold text-success">
              {resultUploadFile?.coValidateExcelImportWarehouse?.total_success}
            </span>
          </div>
          <div className="col-12 mt-3">
            {formatMessage({
              defaultMessage: "Tổng mã vận đơn tải lên thất bại",
            })}
            :{" "}
            <span className="font-weight-bold text-danger">
              {resultUploadFile?.coValidateExcelImportWarehouse?.total_error}
            </span>
          </div>
          {resultUploadFile?.coValidateExcelImportWarehouse?.total_error !==
            0 && (
            <>
              <div className="col-12">
                <table className="table product-list table-border table-borderless table-vertical-center fixed">
                  <thead
                    style={{
                      borderRight: "1px solid #d9d9d9",
                      borderLeft: "1px solid #d9d9d9",
                    }}
                  >
                    <tr className="font-size-lg">
                      <th style={{ fontSize: "14px" }} width="50%">
                        {formatMessage({ defaultMessage: "Mã vận đơn" })}
                      </th>
                      <th style={{ fontSize: "14px" }}>
                        {formatMessage({ defaultMessage: "Lỗi" })}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultUploadFile?.coValidateExcelImportWarehouse
                      ?.list_error &&
                      resultUploadFile?.coValidateExcelImportWarehouse?.list_error
                        .slice(5 * (page - 1), 5 + 5 * (page - 1))
                        .map((err, i) => (
                          <tr key={i}>
                            <td>{err?.tracking_number}</td>
                            <td style={{ wordBreak: "break-word" }}>
                              {err?.error_msg}
                            </td>
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
                  count={
                    resultUploadFile?.coValidateExcelImportWarehouse?.list_error?.slice(
                      5 * (page - 1),
                      5 + 5 * (page - 1)
                    )?.length
                  }
                  onPanigate={(page) => setPage(page)}
                  // basePath={`/products/edit/${smeId}/affiliate`}
                  emptyTitle={formatMessage({
                    defaultMessage: "Chưa có sản phẩm nào",
                  })}
                />
              </div>
            </>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer
        className="form"
        style={{
          borderTop: "1px solid #dbdbdb",
          justifyContent: "end",
          paddingTop: 10,
          paddingBottom: 10,
        }}
      >
        <div className="form-group">
          <button
            type="button"
            onClick={() => {
              addOrderFromFileToList()
              onHide()
            }}
            className="btn btn-primary btn-elevate mr-3"
            style={{ width: 100 }}
          >
            {formatMessage({ defaultMessage: "Đóng" })}
          </button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export const ModalImportResult = ({ onHide, resultImportWarehouse }) => {
  const { formatMessage } = useIntl();
  const history = useHistory();
  const [page, setPage] = useState(1);
  let totalRecord =
    resultImportWarehouse?.coMultipleImportWarehouse?.list_error?.length || 0;

  let totalPage = Math.ceil(totalRecord / 5);

  return (
    <Modal
      show={!!resultImportWarehouse}
      aria-labelledby="example-modal-sizes-title-sm"
      centered
      onHide={() => {
        onHide();
        history.push("/orders/fail-delivery-order");
      }}
      backdrop={true}
      dialogClassName={"body-dialog-connect"}
    >
      <Modal.Header>
        <Modal.Title>
          {formatMessage({ defaultMessage: "Kết quả xử lý đơn huỷ bất thường" })}
        </Modal.Title>
        <span>
          <i
            style={{ cursor: "pointer" }}
            onClick={() => {
              onHide();
              history.push("/orders/fail-delivery-order");
            }}
            className="drawer-filter-icon fas fa-times icon-md text-right"
          ></i>
        </span>
      </Modal.Header>
      <Modal.Body className="overlay overlay-block cursor-default">
        <div className="row">
          <div className="col-12 mt-3">
            {formatMessage({ defaultMessage: "Tổng đơn cần xử lý" })}:{" "}
            <span className="font-weight-bold">
              <strong>
                {resultImportWarehouse?.coMultipleImportWarehouse?.total}
              </strong>
            </span>
          </div>
          <div className="col-12 mt-3">
            {formatMessage({
              defaultMessage: "Tổng đơn xử lý thành công",
            })}
            :{" "}
            <span className="font-weight-bold text-success">
              {resultImportWarehouse?.coMultipleImportWarehouse?.total_success}
            </span>
          </div>
          <div className="col-12 mt-3">
            {formatMessage({
              defaultMessage: "Tổng đơn xử lý thất bại",
            })}
            :{" "}
            <span className="font-weight-bold text-danger">
              {resultImportWarehouse?.coMultipleImportWarehouse?.total_error}
            </span>
          </div>
          {resultImportWarehouse?.coMultipleImportWarehouse?.total_error !==
            0 && (
            <>
              <div className="col-12">
                <table className="table product-list table-border table-borderless table-vertical-center fixed">
                  <thead
                    style={{
                      borderRight: "1px solid #d9d9d9",
                      borderLeft: "1px solid #d9d9d9",
                    }}
                  >
                    <tr className="font-size-lg">
                      <th style={{ fontSize: "14px" }} width="50%">
                        {formatMessage({ defaultMessage: "Mã vận đơn" })}
                      </th>
                      <th style={{ fontSize: "14px" }}>
                        {formatMessage({ defaultMessage: "Lỗi" })}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultImportWarehouse?.coMultipleImportWarehouse
                      ?.list_error &&
                      resultImportWarehouse?.coMultipleImportWarehouse?.list_error
                        .slice(5 * (page - 1), 5 + 5 * (page - 1))
                        .map((err, i) => (
                          <tr key={i}>
                            <td>{err?.obj_tracking_number}</td>
                            <td style={{ wordBreak: "break-word" }}>
                              {err?.error_msg}
                            </td>
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
                  count={
                    resultImportWarehouse?.coMultipleImportWarehouse?.list_error?.slice(
                      5 * (page - 1),
                      5 + 5 * (page - 1)
                    )?.length
                  }
                  onPanigate={(page) => setPage(page)}
                  // basePath={`/products/edit/${smeId}/affiliate`}
                  emptyTitle={formatMessage({
                    defaultMessage: "Chưa có sản phẩm nào",
                  })}
                />
              </div>
            </>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer
        className="form"
        style={{
          borderTop: "1px solid #dbdbdb",
          justifyContent: "end",
          paddingTop: 10,
          paddingBottom: 10,
        }}
      >
        <div className="form-group">
          <button
            type="button"
            onClick={() => {
              onHide();
              history.push("/orders/fail-delivery-order");
            }}
            className="btn btn-primary btn-elevate mr-3"
            style={{ width: 100 }}
          >
            {formatMessage({ defaultMessage: "Đóng" })}
          </button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};