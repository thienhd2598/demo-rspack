import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, OverlayTrigger, Tooltip } from 'react-bootstrap';
import _ from "lodash";
import SVG from "react-inlinesvg";
import { useToasts } from 'react-toast-notifications';
import { useIntl } from 'react-intl';
import PaginationModal from '../../../../../components/PaginationModal';
import { toAbsoluteUrl } from '../../../../../_metronic/_helpers';
import HtmlPrint from '../../../Order/HtmlPrint';

const ModalPrintResults = ({
    totalVariant,
    showResults,
    onHide,
}) => {
    const [isCopied, setIsCopied] = useState(false);
    const [html, setHtml] = useState(false);
    const [namePrint, setNamePrint] = useState('');
    const { formatMessage } = useIntl()
    const [page, setPage] = useState(1)
    const { addToast } = useToasts();

    const printHtml = (html, name) => {
        setNamePrint(name)
        setHtml(html)
    }

    const onCopyToClipBoard = async (text) => {
        await navigator.clipboard.writeText(text);
        setIsCopied(true);
        setTimeout(
            () => {
                setIsCopied(false);
            }, 1500
        )
    };

    let totalRecord = showResults?.fails?.length || 0;

    let totalPage = Math.ceil(showResults?.fails?.length / 5);
    return (
        <Modal
            show={!!showResults}
            aria-labelledby="example-modal-sizes-title-sm"
            centered            
            backdrop={true}
            dialogClassName={'body-dialog-connect modal-pack-order'}
        >
            {
                !!html && !!namePrint && <HtmlPrint setHtml={setHtml} setNamePrint={setNamePrint} html={html} namePrint={namePrint} />
            }
            <Modal.Header>
                <Modal.Title>
                    {formatMessage({ defaultMessage: 'Kết quả in mã vạch' })}
                </Modal.Title>
                <span>
                    <i
                        className="drawer-filter-icon fas fa-times icon-md text-right cursor-pointer"                        
                        onClick={onHide}
                    ></i>
                </span>
            </Modal.Header>
            <Modal.Body className="overlay overlay-block cursor-default pt-1">
                <div className='row p-3 pt-0'>
                    <div className='col-12 p-0 mb-4'>
                        <p>{formatMessage({ defaultMessage: 'Hàng hóa đã chọn' })}: <span className='font-weight-bold' style={{ color: "#212529" }}>
                            {totalVariant ?? 0}
                        </span></p>
                        <p>{formatMessage({ defaultMessage: 'Hàng hóa xử lý thành công' })}: <span style={{ color: "#00DB6D" }} >
                            {`${((totalVariant ?? 0) - (showResults?.fails?.length ?? 0))}/${totalVariant ?? 0}`}
                        </span></p>
                        <p>{formatMessage({ defaultMessage: 'Tem in thành công' })}: <span style={{ color: "#00DB6D" }}>
                            {`${((showResults?.totalLabel ?? 0) - (showResults?.totalLabelFail ?? 0))}/${showResults?.totalLabel ?? 0}`}
                        </span></p>
                        <p>{formatMessage({ defaultMessage: 'File mã vạch' })}  <SVG className="ml-2" style={{ cursor: 'pointer' }} onClick={() => {
                            if (!showResults?.path) {
                                addToast(formatMessage({ defaultMessage: 'In mã vạch bị lỗi' }), { appearance: 'error' });
                            } else {
                                window.open(showResults?.path)
                            }
                        }} src={toAbsoluteUrl("/media/svg/printer.svg")} /></p>
                    </div>

                    <div className='col-12 p-0 mb-4'>
                        <p>{formatMessage({ defaultMessage: 'Hàng hóa xử lý thất bại' })}: <span className='text-danger' >
                            {showResults?.fails?.length ?? 0}
                        </span></p>

                        {showResults?.fails?.length > 0 && <table className="table">
                            <thead>
                                <tr className="font-size-lg">
                                    <th width="50%">{formatMessage({ defaultMessage: 'Mã đơn hàng' })}</th>
                                    <th width="50%">{formatMessage({ defaultMessage: 'Lỗi' })}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {
                                    showResults?.fails?.slice(5 * (page - 1), 5 + 5 * (page - 1))?.map((data) => {
                                        return (<tr key={`inventory-row-${data?.sku}`}>
                                            <td className='d-flex'> <p className='mr-3'>{data?.sku}</p>  <OverlayTrigger
                                                overlay={
                                                    <Tooltip title='#1234443241434' style={{ color: 'red' }}>
                                                        <span>
                                                            {isCopied ? `${formatMessage({ defaultMessage: 'Copy thành công' })}` : `Copy to clipboard`}
                                                        </span>
                                                    </Tooltip>
                                                }
                                            >
                                                <div>
                                                    <i style={{ cursor: 'pointer' }} onClick={() => onCopyToClipBoard(data?.sku)} className="far fa-copy"></i>
                                                </div>
                                            </OverlayTrigger></td>
                                            <td style={{ color: "#F80D0D", wordBreak: 'break-word' }}>{data?.message}</td>
                                        </tr>)
                                    }
                                    )}
                            </tbody>
                        </table>}
                    </div>

                    {showResults?.fails > 0 && <div style={{ padding: '1rem', boxShadow: 'rgb(0 0 0 / 20%) 0px -2px 2px -2px', width: "100%" }}>
                        <PaginationModal
                            page={page}
                            totalPage={totalPage}
                            limit={5}
                            totalRecord={totalRecord}
                            count={showResults?.fails?.slice(5 * (page - 1), 5 + 5 * (page - 1))?.length}
                            onPanigate={(page) => setPage(page)}
                            emptyTitle={formatMessage({ defaultMessage: 'Chưa có sản phẩm nào' })}
                        />
                    </div>
                    }
                </div>
            </Modal.Body>
            <Modal.Footer className="form" style={{ borderTop: '1px solid #dbdbdb', justifyContent: 'end', paddingTop: 10, paddingBottom: 10 }} >
                <div className="form-group">
                    <button
                        type="button"
                        onClick={onHide}
                        className="btn btn-primary"
                        style={{ width: 100 }}
                    >
                        {formatMessage({ defaultMessage: 'Đóng' })}
                    </button>
                </div>
            </Modal.Footer>
        </Modal >
    )
};

export default memo(ModalPrintResults);