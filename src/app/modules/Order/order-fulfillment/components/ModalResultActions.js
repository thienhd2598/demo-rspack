import React, { memo, useMemo, useState } from "react";
import { Modal, OverlayTrigger, Tooltip } from "react-bootstrap";
import SVG from "react-inlinesvg";
import { useIntl } from "react-intl";
import { useHistory } from "react-router-dom";
import PaginationModal from "../../../../../components/PaginationModal";
import { useToasts } from "react-toast-notifications";
import HtmlPrint from "../../HtmlPrint";
import { toAbsoluteUrl } from "../../../../../_metronic/_helpers";

const ModalResultActions = ({ onHide, result, type = 'pick_up' }) => {
    const { formatMessage } = useIntl();
    const history = useHistory();
    const [page, setPage] = useState(1);
    const [isCopied, setIsCopied] = useState(false);
    const { addToast } = useToasts();
    const [html, setHtml] = useState(false);
    const [namePrint, setNamePrint] = useState('');

    let totalRecord = result?.list_fail?.length || 0;
    let totalPage = Math.ceil(totalRecord / 5);

    const onCopyToClipBoard = async (text) => {
        await navigator.clipboard.writeText(text);
        setIsCopied(true);
        setTimeout(() => {
            setIsCopied(false);
        }, 1500)
    };

    const actionName = useMemo(() => {
        if (result?.type == 'cancel') return formatMessage({ defaultMessage: 'hủy' })
        if (result?.type == 'complete') {
            if (type == "received") return formatMessage({ defaultMessage: 'nhận hàng' })
            else
                return formatMessage({ defaultMessage: 'bàn giao' })
        }
        if (result?.type == 'print') return formatMessage({ defaultMessage: 'in biên bản' })
        if (result?.type == 'assign') return formatMessage({ defaultMessage: 'phân công nhân viên' })
        if (result?.type == 'assign') return formatMessage({ defaultMessage: 'phân công nhân viên' })
    }, [result]);

    const printHtml = (html, name) => {
        setNamePrint(name)
        setHtml(html)
    }

    return (
        <Modal
            show={!!result}
            aria-labelledby="example-modal-sizes-title-sm"
            centered
            onHide={() => { }}
            backdrop={true}
            dialogClassName={"body-dialog-connect"}
        >
            {(html && namePrint) && <HtmlPrint setHtml={setHtml} setNamePrint={setNamePrint} html={html} namePrint={namePrint} />}
            <Modal.Header>
                <Modal.Title>
                    {formatMessage({ defaultMessage: "Kết quả {name}" }, { name: actionName })}
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
                        <span>{formatMessage({ defaultMessage: "Tổng {name} đã chọn" }, { name: type == 'handover' ? 'phiên giao' : type == "received" ? "phiên nhận" : 'danh sách' })}:</span>
                        <span className="font-weight-bold ml-2">
                            <strong>
                                {result?.total}
                            </strong>
                        </span>
                    </div>
                    <div className="col-12 mt-3">
                        <span>{formatMessage({ defaultMessage: "Tổng {name} thành công" }, { name: (type == 'handover' || type == "received") ? `phiên ${actionName}` : `danh sách ${actionName}` })}:</span>
                        <span className="font-weight-bold text-success ml-2">
                            {result?.total_success}
                        </span>
                    </div>
                    <div className="col-12 mt-3 mb-2">
                        <span>{formatMessage({ defaultMessage: "Tổng {name} thất bại" }, { name: (type == 'handover' || type == "received") ? `phiên ${actionName}` : `danh sách ${actionName}` })}:</span>
                        <span className="font-weight-bold text-danger ml-2">
                            {result?.total_fail}
                        </span>
                    </div>
                    {result?.type == 'print' && <div className='col-12 mt-1 mb-2 border p-4'>
                        <p>{type == "received" ? formatMessage({ defaultMessage: 'Biên bản nhận' }) : formatMessage({ defaultMessage: 'Biên bản bàn giao' })} <SVG className="ml-2"
                            onClick={() => {
                                if (!result?.html) {
                                    addToast(type == "received" ? formatMessage({ defaultMessage: 'In biên bản nhận bị lỗi' }) : formatMessage({ defaultMessage: 'In biên bản bàn giao bị lỗi' }), { appearance: 'error' });
                                } else {
                                    printHtml(result?.html, type == "received" ? 'Biên_bản_nhận' : 'Biên_bản_bàn_giao')
                                }
                            }}
                            style={{ cursor: 'pointer' }} src={toAbsoluteUrl("/media/svg/printer.svg")} /></p>
                    </div>}
                    {result?.list_fail?.length > 0 && (
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
                                                {formatMessage({ defaultMessage: "Mã danh sách" })}
                                            </th>
                                            <th style={{ fontSize: "14px" }}>
                                                {formatMessage({ defaultMessage: "Lỗi" })}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {result?.list_fail && result?.list_fail.slice(5 * (page - 1), 5 + 5 * (page - 1))
                                            .map((err, i) => (
                                                <tr key={i}>
                                                    <td>
                                                        <span>
                                                            {err?.code}
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
                                                                <i style={{ cursor: 'pointer', color: '#0D6EFD' }} onClick={() => onCopyToClipBoard(err?.code)} className="far fa-copy"></i>
                                                            </span>
                                                        </OverlayTrigger>
                                                    </td>
                                                    <td style={{ wordBreak: "break-word" }}>
                                                        {err?.error_message}
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

export default memo(ModalResultActions);