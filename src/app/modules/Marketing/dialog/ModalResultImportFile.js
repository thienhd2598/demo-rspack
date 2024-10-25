import React, { memo, useMemo, useState } from "react";
import { Modal } from "react-bootstrap";
import { useIntl } from "react-intl";
import { useHistory } from "react-router-dom";
import PaginationModal from "../../../../components/PaginationModal";

const ModalResultImportFile = ({ onHide, result }) => {
    const { formatMessage } = useIntl();
    const history = useHistory();
    const [page, setPage] = useState(1);

    let totalRecord = result?.list_error?.length || 0;
    let totalPage = Math.ceil(totalRecord / 5);

    const targetHandled = useMemo(() => {
        return result?.type == 'product' ? 'sản phẩm' : 'hàng hóa'
    }, [result?.type]);

    return (
        <Modal
            show={!!result}
            aria-labelledby="example-modal-sizes-title-sm"
            centered
            onHide={() => { }}
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
                        onClick={onHide}
                        className="drawer-filter-icon fas fa-times icon-md text-right"
                    ></i>
                </span>
            </Modal.Header>
            <Modal.Body className="overlay overlay-block cursor-default">
                <div className="row">
                    <div className="col-12 mt-3">
                        <span>{formatMessage({ defaultMessage: "Số lượng {target} cần xử lý" }, { target: targetHandled })}:</span>
                        <span className="font-weight-bold ml-2">
                            <strong>
                                {result?.total}
                            </strong>
                        </span>
                    </div>
                    <div className="col-12 mt-3">
                        <span>{formatMessage({ defaultMessage: "Số lượng {target} xử lý thành công" }, { target: targetHandled })}:</span>
                        <span className="font-weight-bold text-success ml-2">
                            {result?.total_success}
                        </span>
                    </div>
                    <div className="col-12 mt-3">
                        <span>{formatMessage({ defaultMessage: "Số lượng {target} xử lý thất bại" }, { target: targetHandled })}:</span>
                        <span className="font-weight-bold text-danger ml-2">
                            {result?.total_error}
                        </span>
                    </div>
                    {result?.total_error !== 0 && (
                        <>
                            <div className="col-12 mt-3">
                                <table className="table product-list table-border table-borderless table-vertical-center fixed">
                                    <thead
                                        style={{
                                            borderRight: "1px solid #d9d9d9",
                                            borderLeft: "1px solid #d9d9d9",
                                        }}
                                    >
                                        <tr className="font-size-lg">
                                            <th style={{ fontSize: "14px" }} width="50%">
                                                {formatMessage({ defaultMessage: "SKU" })}
                                            </th>
                                            <th style={{ fontSize: "14px" }}>
                                                {formatMessage({ defaultMessage: "Lỗi" })}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {result?.list_error && result?.list_error.slice(5 * (page - 1), 5 + 5 * (page - 1))
                                            .map((err, i) => (
                                                <tr key={i}>
                                                    <td>{err?.sku}</td>
                                                    <td style={{ wordBreak: "break-word" }}>
                                                        {err?.message}
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
                                        result?.list_error?.slice(
                                            5 * (page - 1),
                                            5 + 5 * (page - 1)
                                        )?.length
                                    }
                                    onPanigate={(page) => setPage(page)}
                                    // basePath={`/products/edit/${smeId}/affiliate`}
                                    emptyTitle={formatMessage({
                                        defaultMessage: "Chưa có dữ liệu",
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
                        onClick={onHide}
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

export default memo(ModalResultImportFile);