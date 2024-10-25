import React, { memo, useMemo, useState } from 'react';
import { Modal, OverlayTrigger, Tooltip } from 'react-bootstrap';
import PaginationModal from '../../../../../../components/PaginationModal';
import { useIntl } from "react-intl";
const ModalResult = ({
    type,
    dataResults,
    onHide,
    totalOrder = 0
}) => {
    const [page, setPage] = useState(1)
    const {formatMessage} = useIntl()
    const [isCopied, setIsCopied] = useState(false);
    const title = useMemo(() => {
            if (type == 'pack-prepare') {
                return formatMessage({defaultMessage: 'Chuẩn bị hàng'})
            }
            if (type == 'ready-to-deliver') {
                return formatMessage({defaultMessage:'Sẵn sàng giao'})
            }
        }, [type]
    );

    const onCopyToClipBoard = async (text) => {
        await navigator.clipboard.writeText(text);
        setIsCopied(true);
        setTimeout(
            () => {
                setIsCopied(false);
            }, 1500
        )
    };

    let totalRecord = dataResults?.list_package_fail?.length || 0;

    let totalPage = Math.ceil(dataResults?.list_package_fail?.length / 5);
    
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
                    <div className='col-12'>{formatMessage({defaultMessage: 'Kiện hàng đã chọn'})}: <span className='font-weight-bold'>{(dataResults?.total_success ?? 0) + (dataResults?.list_package_fail?.length ?? 0)}</span></div>
                    <div className='col-12 mt-3'>{formatMessage({defaultMessage: 'Kiện hàng xử lý thành công'})}: <span className='font-weight-bold text-success'>{dataResults?.total_success ?? 0}</span></div>
                    <div className='col-12 mt-3'>{formatMessage({defaultMessage: 'Kiện hàng xử lý thất bại'})}: <span className='font-weight-bold text-danger'>{dataResults?.list_package_fail?.length ?? 0}</span></div>
                    {dataResults?.list_package_fail?.length > 0 && <div className='col-12 mt-4'>
                        <table className="table product-list table-borderless product-list table-vertical-center fixed">
                            <thead>
                                <tr className="font-size-lg">
                                    <th style={{fontSize: '14px'}} width="40%">{formatMessage({defaultMessage: 'Mã kiện hàng'})}</th>
                                    <th style={{fontSize: '14px'}}>{formatMessage({defaultMessage: 'Lỗi'})}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dataResults?.list_package_fail?.length ?  dataResults?.list_package_fail?.slice(5 * (page - 1), 5 + 5 * (page - 1))?.map((data) => {
                                return (<tr key={`order-row-error-${data.index}`}>
                                    <td>
                                        <span>{data?.system_package_number}</span>
                                        <OverlayTrigger
                                            overlay={
                                                <Tooltip title='#1234443241434' style={{ color: 'red' }}>
                                                    <span>
                                                        {isCopied ? formatMessage({defaultMessage:`Copy thành công`}) : `Copy to clipboard`}
                                                    </span>
                                                </Tooltip>
                                            }
                                        >
                                            <span className='ml-2'>
                                                <i style={{ cursor: 'pointer' }} onClick={() => onCopyToClipBoard(data?.system_package_number)} className="far fa-copy"></i>
                                            </span>
                                        </OverlayTrigger>
                                    </td>
                                    <td>{data?.error_message}</td>
                                </tr>)
                                }) : null
                                }
                            </tbody>
                        </table>
                        {
                            type === 'pack-prepare' && <p className='text-secondary-custom fs-12 mt-2'>
                                {formatMessage({defaultMessage: 'Chú ý: Những kiện hàng thất bại có thể xem ở mục “ Chuẩn bị hàng lỗi”'})}
                            </p>
                        }
                    </div>}

                    {dataResults?.total_fail > 0 && <div style={{ padding: '1rem', boxShadow: 'rgb(0 0 0 / 20%) 0px -2px 2px -2px', width: "100%" }}>
                        <PaginationModal
                            page={page}
                            totalPage={totalPage}
                            limit={5}
                            totalRecord={totalRecord}
                            count={dataResults?.list_package_fail?.slice(5 * (page - 1), 5 + 5 * (page - 1))?.length}
                            onPanigate={(page) => setPage(page)}
                            emptyTitle={formatMessage({defaultMessage:'Chưa có sản phẩm nào'})}
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
                       {formatMessage({defaultMessage:'Đóng'})} 
                    </button>
                </div>
            </Modal.Footer>
        </Modal >
    )
};

export default memo(ModalResult);