import React, { memo, useMemo, useState } from "react";
import { Modal, OverlayTrigger, Tooltip } from "react-bootstrap";
import { useIntl } from "react-intl";
import { useHistory } from "react-router-dom";
import PaginationModal from "../../../../../components/PaginationModal";

const ModalResultCreateHandover = ({ onHide, result }) => {
    const { formatMessage } = useIntl();
    const history = useHistory();
    const [page, setPage] = useState(1);
    const [isCopied, setIsCopied] = useState(false);

    let totalRecord = result?.list_package_fail?.length || 0;
    let totalPage = Math.ceil(totalRecord / 5);

    const onCopyToClipBoard = async (text) => {
        await navigator.clipboard.writeText(text);
        setIsCopied(true);
        setTimeout(() => {
            setIsCopied(false);
        }, 1500)
    };

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
                    {formatMessage({ defaultMessage: "Kết quả tạo phiên {name}" }, { name: result?.type == 'received' ? 'nhận' : 'bàn giao' })}
                </Modal.Title>
                <span>
                    <i
                        style={{ cursor: "pointer" }}
                        onClick={onHide}
                        className="drawer-filter-icon fas fa-times icon-md text-right"
                    ></i>
                </span>
            </Modal.Header>
            <Modal.Body className="overlay overlay-block cursor-default py-1">
                <div className="row">
                    <div className="col-12 mt-3">
                        <span>{formatMessage({ defaultMessage: "Kiện hàng đã chọn" })}:</span>
                        <span className="font-weight-bold ml-2">
                            <strong>
                                {result?.total_package}
                            </strong>
                        </span>
                    </div>
                    <div className="col-12 mt-3">
                        <span>{formatMessage({ defaultMessage: "Kiện hàng xử lý thành công" })}:</span>
                        <span className="font-weight-bold text-success ml-2">
                            {result?.total_package_success}
                        </span>
                    </div>                    
                    <div className="col-12 mt-3">
                        <span>{formatMessage({ defaultMessage: "Kiện hàng xử lý thất bại" })}:</span>
                        <span className="font-weight-bold text-danger ml-2">
                            {result?.total_package_fail}
                        </span>
                    </div>
                    {result?.total_package_fail !== 0 && (
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
                                                {formatMessage({ defaultMessage: "Mã kiện hàng" })}
                                            </th>
                                            <th style={{ fontSize: "14px" }}>
                                                {formatMessage({ defaultMessage: "Lỗi" })}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {result?.list_package_fail && result?.list_package_fail.slice(5 * (page - 1), 5 + 5 * (page - 1))
                                            .map((err, i) => (
                                                <tr key={i}>
                                                    <td>
                                                        <span>
                                                            {err?.system_package_number || err?.object_tracking_number}
                                                        </span>
                                                        <OverlayTrigger
                                                            overlay={
                                                                <Tooltip title='#1234443241434' style={{ color: 'red' }}>
                                                                    <span>
                                                                        {isCopied ? `Copy ${formatMessage({ defaultMessage: 'thành công' })}` : `Copy to clipboard`}
                                                                    </span>
                                                                </Tooltip>
                                                            }
                                                        >
                                                            <span className='ml-2'>
                                                                <i style={{ cursor: 'pointer', color: '#0D6EFD' }} onClick={() => onCopyToClipBoard(err?.system_package_number || err?.input_search)} className="far fa-copy"></i>
                                                            </span>
                                                        </OverlayTrigger>
                                                    </td>
                                                    <td style={{ wordBreak: "break-word" }}>
                                                        {err?.error_message || err?.message}
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                            <div
                                className="col-12"
                                style={{                                    
                                    boxShadow: "rgb(0 0 0 / 20%) 0px -2px 2px -2px",
                                }}
                            >
                                <PaginationModal
                                    page={page}
                                    totalPage={totalPage}
                                    limit={5}
                                    totalRecord={totalRecord}
                                    count={
                                        result?.list_package_fail?.slice(
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

export default memo(ModalResultCreateHandover);