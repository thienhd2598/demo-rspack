import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, OverlayTrigger, Tooltip } from 'react-bootstrap';
import weekday from 'dayjs/plugin/weekday';
import _ from "lodash";
import { toAbsoluteUrl } from '../../../../_metronic/_helpers';
import SVG from "react-inlinesvg";
import HtmlPrint from '../HtmlPrint';
import PaginationModal from '../../../../components/PaginationModal';
import { useToasts } from 'react-toast-notifications';
import { useIntl } from 'react-intl';

const ModalPrintResults = ({
    totalOrder,
    showResults,
    onHide,
    status,
    optionPrint
}) => {
    const [isCopied, setIsCopied] = useState(false);
    const [html, setHtml] = useState(false);
    const [namePrint, setNamePrint] = useState('');
    const { formatMessage } = useIntl()
    const [page, setPage] = useState(1)
    const { addToast } = useToasts();

    const onHidePopup = () => {
        setPage(1)
        onHide()
    }
    console.log('showResults', showResults)
    const printHtml = (html, name) => {
        setNamePrint(name)
        setHtml(html)
    }

    const onCopyToClipBoard = async (text) => {
        await navigator.clipboard.writeText(text);
        setIsCopied(true);
        setTimeout(() => {
            setIsCopied(false);
        }, 1500)
    };
    // let x = useMemo(() => {
    //     const grouped = showResults?.list_package_fail?.reduce((result, item) => {
    //         const { ref_order_id, error_message, system_package_number } = item;
    //         if (!result[ref_order_id]) {
    //             result[ref_order_id] = [];
    //         }
    //         result[ref_order_id].push(error_message);
    //         return result;
    //     }, {});

    //     for (let key in grouped) {
    //         grouped[key] = grouped[key].join(', ');
    //     }
    //     if (grouped) {
    //         return Object.entries(grouped)?.map(([key, value]) => ({ id: key, error_message: value }));
    //     }
    //     return [];

    // }, [showResults])

    let totalRecord = showResults?.list_package_fail?.length || 0;

    let totalPage = Math.ceil(showResults?.list_package_fail?.length / 5);
    return (
        <Modal
            show={!!showResults}
            aria-labelledby="example-modal-sizes-title-sm"
            centered
            onHide={onHidePopup}
            backdrop={true}
            dialogClassName={'body-dialog-connect modal-pack-order'}
        >
            {
                (html && namePrint) && <HtmlPrint setHtml={setHtml} setNamePrint={setNamePrint} html={html} namePrint={namePrint} />
            }
            <Modal.Header>
                <Modal.Title>
                    {formatMessage({ defaultMessage: 'Kết quả in phiếu hàng loạt' })}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="overlay overlay-block cursor-default pt-1">
                <div className='row p-3 pt-0'>
                    <div className='col-12 p-0 mb-4'>
                        <p> {formatMessage({ defaultMessage: 'Kiện hàng đã được chọn' })}: <span className='font-weight-bold' style={{ color: "#212529" }}> {(showResults?.total_success ?? 0) + (showResults?.total_fail) ?? 0}</span></p>
                        <p>{formatMessage({ defaultMessage: 'Kiện hàng xử lý thành công' })}: <span style={{ color: "#00DB6D" }} >{showResults?.total_success ?? 0}</span></p>
                        <p>{formatMessage({ defaultMessage: 'Kiện hàng xử lý thất bại' })}: <span style={{ color: "#F80D0D" }}>{showResults?.total_fail ?? 0}</span></p>
                    </div>

                    <div className='col-12 mb-4 border p-2'>
                        {optionPrint.includes(1) && <p>{formatMessage({ defaultMessage: 'Phiếu vận đơn' })}  <SVG className="ml-2" style={{ cursor: 'pointer' }} onClick={() => {
                            if (!showResults?.doc_url) {
                                addToast(formatMessage({ defaultMessage: 'In phiếu vận đơn bị lỗi' }), { appearance: 'error' });
                            } else {

                                window.open(showResults?.doc_url)
                            }
                        }} src={toAbsoluteUrl("/media/svg/printer.svg")} /></p>
                        }
                        {optionPrint.includes(2) && <p>{formatMessage({ defaultMessage: 'Phiếu xuất' })} <SVG className="ml-2"
                            onClick={() => {
                                if (!showResults?.html_phieu_xuat_kho) {
                                    addToast(formatMessage({ defaultMessage: 'In phiếu xuất bị lỗi' }), { appearance: 'error' });
                                } else {
                                    printHtml(showResults?.html_phieu_xuat_kho, 'Phiếu_xuất_kho')
                                }
                            }}
                            style={{ cursor: 'pointer' }} src={toAbsoluteUrl("/media/svg/printer.svg")} /></p>
                        }
                        {optionPrint.includes(16) && <p>{formatMessage({ defaultMessage: 'Phiếu nhặt hàng' })} <SVG className="ml-2"
                            onClick={() => {
                                if (!showResults?.html_phieu_tong_hop) {
                                    addToast(formatMessage({ defaultMessage: 'In phiếu nhặt hàng bị lỗi' }), { appearance: 'error' });
                                } else {
                                    printHtml(showResults?.html_phieu_tong_hop, 'Phiếu_nhặt_hàng')
                                }
                            }}
                            style={{ cursor: 'pointer' }} src={toAbsoluteUrl("/media/svg/printer.svg")} /></p>
                        }
                        {optionPrint.includes(32) && <p>{formatMessage({ defaultMessage: 'Phiếu đóng hàng' })} <SVG className="ml-2"
                            onClick={() => {
                                if (!showResults?.html_phieu_dong_hang) {
                                    addToast(formatMessage({ defaultMessage: 'In phiếu đóng hàng bị lỗi' }), { appearance: 'error' });
                                } else {
                                    printHtml(showResults?.html_phieu_dong_hang, 'Phiếu_đóng_hàng')
                                }
                            }}
                            style={{ cursor: 'pointer' }} src={toAbsoluteUrl("/media/svg/printer.svg")} /></p>
                        }
                        {optionPrint.includes(4) && <p>{formatMessage({ defaultMessage: 'Biên bản bàn giao' })} <SVG className="ml-2"
                            onClick={() => {
                                if (!showResults?.html_bbbg) {
                                    addToast(formatMessage({ defaultMessage: 'In biên bản bàn giao bị lỗi' }), { appearance: 'error' });
                                } else {
                                    printHtml(showResults?.html_bbbg, 'Biên_bản_bàn_giao')
                                }
                            }}
                            style={{ cursor: 'pointer' }} src={toAbsoluteUrl("/media/svg/printer.svg")} /></p>}
                    </div>

                    <div className='col-12 p-0 mb-4'>
                        

                        {showResults?.total_fail > 0 && <table className="table">
                            <thead>
                                <tr className="font-size-lg">
                                    <th width="30%">{formatMessage({ defaultMessage: 'Mã kiện hàng' })}</th>
                                    <th>{formatMessage({ defaultMessage: 'Lỗi' })}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {
                                    showResults?.list_package_fail?.slice(5 * (page - 1), 5 + 5 * (page - 1))?.map((data, index) => {
                                        return (<tr key={index}>
                                            <td className='d-flex'> <p className='mr-3'>{data?.system_package_number}</p>
                                                <OverlayTrigger
                                                    overlay={
                                                        <Tooltip title='#1234443241434' style={{ color: 'red' }}>
                                                            <span>
                                                                {isCopied ? `${formatMessage({ defaultMessage: 'Copy thành công' })}` : `Copy to clipboard`}
                                                            </span>
                                                        </Tooltip>
                                                    }
                                                >
                                                    <div>
                                                        <i style={{ cursor: 'pointer' }} onClick={() => onCopyToClipBoard(data.system_package_number)} className="far fa-copy"></i>
                                                    </div>
                                                </OverlayTrigger>
                                            </td>
                                            <td style={{ color: "#F80D0D", wordBreak: 'break-word' }}>{data.error_message}</td>
                                        </tr>)
                                    }
                                    )}
                            </tbody>
                        </table>}
                    </div>

                    {showResults?.total_fail > 0 && <div style={{ padding: '1rem', boxShadow: 'rgb(0 0 0 / 20%) 0px -2px 2px -2px', width: "100%" }}>
                        <PaginationModal
                            page={page}
                            totalPage={totalPage}
                            limit={5}
                            totalRecord={totalRecord}
                            count={showResults?.list_package_fail?.slice(5 * (page - 1), 5 + 5 * (page - 1))?.length}
                            onPanigate={(page) => setPage(page)}
                            // basePath={`/products/edit/${smeId}/affiliate`}
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
                        onClick={() => { onHidePopup() }}
                        className="btn btn-primary btn-elevate mr-3"
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