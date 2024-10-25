import React, { memo, useState } from "react";
import { Modal, OverlayTrigger, Tooltip } from "react-bootstrap";
import { useIntl } from "react-intl";
import PaginationModal from "../../../../../components/PaginationModal";

const ResultsDialog = ({ result, onHide }) => {
    const { formatMessage } = useIntl();
    const [page, setPage] = useState(1);
    const [isCopied, setIsCopied] = useState(false);
    let totalRecord = result?.errors?.length || 0;

    let totalPage = Math.ceil(totalRecord / 5);
    const onCopyToClipBoard = async (text) => {
        await navigator.clipboard.writeText(text);
        setIsCopied(true);
        setTimeout(() => {
            setIsCopied(false);
        }, 1500)
    };
    return (
        <Modal show={!!result} aria-labelledby="example-modal-sizes-title-sm" centered
            onHide={onHide}
            backdrop={true}
            dialogClassName={"body-dialog-connect"}>
            <Modal.Header>
                <Modal.Title>
                    {formatMessage({ defaultMessage: "Kết quả xuất hoá đơn " })}
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
                <>
                    <div className="row">
                        <div className="col-12 mt-3">
                            {formatMessage({ defaultMessage: "Tổng số đơn hàng cần xuất hoá đơn" })}:
                            <span className="font-weight-bold mx-2"><strong>{result?.total || 0}</strong></span>
                        </div>
                        <div className="col-12 mt-3">
                            {formatMessage({ defaultMessage: "Tổng số đơn hàng xuất hoá đơn nháp thành công" })}:<span className="font-weight-bold text-success mx-2">{(result?.total - result?.total_error) || 0}</span>
                        </div>
                        <div className="col-12 mt-3">
                            {formatMessage({ defaultMessage: "Tổng số đơn hàng xuất hoá đơn nháp thất bại" })}:<span className="font-weight-bold text-danger mx-2">{result?.total_error || 0}</span>
                        </div>

                    </div>
                    <div className="col-12 mt-2">
                        <table className="table product-list table-border table-borderless table-vertical-center fixed">
                            <thead
                                style={{
                                    borderRight: "1px solid #d9d9d9",
                                    borderLeft: "1px solid #d9d9d9",
                                }}
                            >
                                <tr className="font-size-lg">
                                    <th style={{ fontSize: "14px" }} width="50%">
                                        {formatMessage({ defaultMessage: "Số chứng từ" })}
                                    </th>
                                    <th style={{ fontSize: "14px" }}>
                                        {formatMessage({ defaultMessage: "Lỗi" })}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {result?.errors?.length > 0 &&
                                    result?.errors.slice(5 * (page - 1), 5 + 5 * (page - 1)).map((err, i) => (
                                        <tr key={i}>
                                            <td>
                                                <span className="d-flex align-items-center">
                                                    <span className="mr-2">{err?.code}</span>
                                                    <OverlayTrigger overlay={<Tooltip title='#1234443241434' style={{ color: 'red' }}><span>{isCopied ? `Copied!` : `Copy to clipboard`}</span></Tooltip>}>
                                                        <span style={{ cursor: 'pointer' }} onClick={() => onCopyToClipBoard(err?.code)} className='ml-2'><i style={{ fontSize: 12 }} className="far fa-copy"></i></span>
                                                    </OverlayTrigger>
                                                </span>
                                            </td>
                                            <td style={{ wordBreak: "break-word" }}>
                                                {err?.message}
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="col-12" style={{ padding: "1rem", boxShadow: "rgb(0 0 0 / 20%) 0px -2px 2px -2px" }}>
                        <PaginationModal
                            page={page}
                            totalPage={totalPage}
                            limit={5}
                            totalRecord={totalRecord}
                            count={result?.errors?.slice(5 * (page - 1), 5 + 5 * (page - 1))?.length}
                            onPanigate={(page) => setPage(page)}
                            emptyTitle=''
                        />
                    </div>
                </>

            </Modal.Body>
            <Modal.Footer className="form" style={{ borderTop: "1px solid #dbdbdb", justifyContent: "end", paddingTop: 10, paddingBottom: 10 }}>
                <div className="form-group">
                    <button type="button" onClick={onHide} className="btn btn-primary btn-elevate mr-3" style={{ width: 100 }}>
                        {formatMessage({ defaultMessage: "Đóng" })}
                    </button>
                </div>
            </Modal.Footer>
        </Modal>
    )
}

export default ResultsDialog