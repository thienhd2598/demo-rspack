import React, { memo, useMemo, useState } from 'react';
import { Modal, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useIntl } from 'react-intl';
import PaginationModal from '../../../../components/PaginationModal';

const ModalResultMutiple = ({
    dataResults,
    onHide,
}) => {
    const { formatMessage } = useIntl();
    const [page, setPage] = useState(1);
    const [isCopied, setIsCopied] = useState(false);
    const [title, titleTotal, titleSuccess, titleError] = useMemo(
        () => {
            switch (dataResults?.type) {
                case "approved-manual":
                    return [
                        formatMessage({ defaultMessage: 'Kết quả duyệt đơn' }),
                        formatMessage({ defaultMessage: 'Tổng số đơn cần duyệt' }),
                        formatMessage({ defaultMessage: 'Tổng số đơn đã duyệt thành công' }),
                        formatMessage({ defaultMessage: 'Tổng số đơn đã duyệt thất bại' }),
                    ];
                case "cancel-manual":
                    return [
                        formatMessage({ defaultMessage: 'Kết quả huỷ kiện' }),
                        formatMessage({ defaultMessage: 'Tổng số kiện đã huỷ' }),
                        formatMessage({ defaultMessage: 'Tổng số kiện đã huỷ thành công' }),
                        formatMessage({ defaultMessage: 'Tổng số kiện đã huỷ thất bại' }),
                    ];
                case "retry-package":
                    return [
                        formatMessage({ defaultMessage: 'Kết quả đẩy lại đơn' }),
                        formatMessage({ defaultMessage: 'Tổng số kiện đẩy lại đơn' }),
                        formatMessage({ defaultMessage: 'Tổng số kiện đẩy lại đơn thành công' }),
                        formatMessage({ defaultMessage: 'Tổng số kiện đẩy lại đơn thất bại' }),
                    ];
                case "ship-manual":
                    return [
                        formatMessage({ defaultMessage: 'Kết quả giao hàng' }),
                        formatMessage({ defaultMessage: 'Tổng số kiện đã giao hàng cho ĐVVC' }),
                        formatMessage({ defaultMessage: 'Tổng số kiện đã giao hàng cho ĐVVC thành công' }),
                        formatMessage({ defaultMessage: 'Tổng số kiện đã giao hàng cho ĐVVC thất bại' }),
                    ];
                case "confirm-delivery-manual":
                    return [
                        formatMessage({ defaultMessage: 'Kết quả xác nhận giao hàng' }),
                        formatMessage({ defaultMessage: 'Tổng số kiện đã xác nhận giao hàng' }),
                        formatMessage({ defaultMessage: 'Tổng số kiện đã xác nhận giao hàng thành công' }),
                        formatMessage({ defaultMessage: 'Tổng số kiện đã xác nhận giao hàng thất bại' }),
                    ];
                case "retry-ship-package":
                    return [
                        formatMessage({ defaultMessage: 'Kết quả tìm lại tài xế' }),
                        formatMessage({ defaultMessage: 'Tổng số kiện đã tìm lại tài xế' }),
                        formatMessage({ defaultMessage: 'Tổng số kiện đã tìm lại tài xế thành công' }),
                        formatMessage({ defaultMessage: 'Tổng số kiện đã tìm lại tài xế thất bại' }),
                    ];
                case "accept-cancel-package":
                    return [
                        formatMessage({ defaultMessage: 'Kết quả đồng ý hủy' }),
                        formatMessage({ defaultMessage: 'Tổng số kiện đã đồng ý hủy' }),
                        formatMessage({ defaultMessage: 'Tổng số kiện đã đồng ý hủy thành công' }),
                        formatMessage({ defaultMessage: 'Tổng số kiện đã đồng ý hủy thất bại' }),
                    ];
                case "reject-cancel-package":
                    return [
                        formatMessage({ defaultMessage: 'Kết quả từ chối hủy' }),
                        formatMessage({ defaultMessage: 'Tổng số kiện đã từ chối hủy' }),
                        formatMessage({ defaultMessage: 'Tổng số kiện đã từ chối hủy thành công' }),
                        formatMessage({ defaultMessage: 'Tổng số kiện đã từ chối hủy thất bại' }),
                    ];
                default:
                    return [
                        formatMessage({ defaultMessage: 'Kết quả thao tác kiện' }),
                        formatMessage({ defaultMessage: 'Tổng số kiện đã thao tác' }),
                        formatMessage({ defaultMessage: 'Tổng số kiện đã thao tác thành công' }),
                        formatMessage({ defaultMessage: 'Tổng số kiện đã thao tác thất bại' }),
                    ];
            }
        }, [dataResults?.type]
    );

    const onCopyToClipBoard = async (text) => {
        await navigator.clipboard.writeText(text);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 1500);
    };

    const totalRecord = dataResults?.list_fail?.length || 0;
    const totalPage = Math.ceil(dataResults?.list_fail?.length / 5);

    return (
        <Modal
            show={!!dataResults}
            aria-labelledby="example-modal-sizes-title-sm"
            centered
            onHide={onHide}
            backdrop={true}
            dialogClassName={'body-dialog-connect'}
        >
            <Modal.Header>
                <Modal.Title>
                    {title}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="overlay overlay-block cursor-default">
                <i
                    className="fas fa-times"
                    onClick={onHide}
                    style={{ position: 'absolute', top: -45, right: 20, fontSize: 20, cursor: 'pointer' }}
                />
                <div className='row'>
                    <div className='col-12'>{titleTotal}: <span className='font-weight-bold'>{(dataResults?.total_success + dataResults?.total_fail) ?? 0}</span></div>
                    <div className='col-12 mt-3'>{titleSuccess}: <span className='font-weight-bold text-success'>{dataResults?.total_success ?? 0}</span></div>
                    <div className='col-12 mt-3'>{titleError}: <span className='font-weight-bold text-danger'>{dataResults?.total_fail ?? 0}</span></div>
                    {dataResults?.list_fail?.length > 0 && <div className='col-12 mt-4'>
                        <table className="table table-borderless product-list table-vertical-center fixed">
                            <thead>
                                <tr className="font-size-lg">
                                    <th style-={{ fontSize: '14px' }} width="40%">
                                        {dataResults?.type == 'approved-manual' ? formatMessage({ defaultMessage: 'Mã đơn hàng' }) : formatMessage({ defaultMessage: 'Mã kiện hàng' })}
                                    </th>
                                    <th style-={{ fontSize: '14px' }}>{formatMessage({ defaultMessage: 'Lỗi' })}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dataResults?.list_fail?.slice(5 * (page - 1), 5 + 5 * (page - 1))?.map((data) => {
                                    return <tr key={`order-row-error-${data.index}`}>
                                        <td>
                                            <span>{dataResults?.type == 'approved-manual' ? data?.order_ref_id : data?.system_package_number}</span>
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
                                                    <i
                                                        className="far fa-copy cursor-pointer text-info"
                                                        onClick={() => onCopyToClipBoard(dataResults?.type == 'approved-manual' ? data?.order_ref_id : data?.system_package_number)}
                                                    />
                                                </span>
                                            </OverlayTrigger>
                                        </td>
                                        <td>{data?.message || data?.error_message}</td>
                                    </tr>
                                })}
                            </tbody>
                        </table>
                    </div>}
                    {dataResults?.list_fail?.length > 0 && <div style={{ padding: '1rem', boxShadow: 'rgb(0 0 0 / 20%) 0px -2px 2px -2px', width: "100%" }}>
                        <PaginationModal
                            page={page}
                            totalPage={totalPage}
                            limit={5}
                            totalRecord={totalRecord}
                            count={dataResults?.list_fail?.slice(5 * (page - 1), 5 + 5 * (page - 1))?.length}
                            onPanigate={(page) => setPage(page)}
                            emptyTitle={formatMessage({ defaultMessage: 'Chưa có sản phẩm nào' })}
                        />
                    </div>}
                </div>
            </Modal.Body>
            <Modal.Footer className="form" style={{ borderTop: '1px solid #dbdbdb', justifyContent: 'end', paddingTop: 10, paddingBottom: 10 }} >
                <div className="form-group">
                    <button
                        type="button"
                        onClick={onHide}
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

export default memo(ModalResultMutiple);