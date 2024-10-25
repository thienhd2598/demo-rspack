import React, { memo, useMemo, useState } from 'react';
import { Modal } from 'react-bootstrap';
import { useIntl } from "react-intl";
import PaginationModal from '../../../../components/PaginationModal';
import { saveAs } from 'file-saver';

const ModalResults = ({
    dataResults,
    onHide
}) => {
    const { formatMessage } = useIntl();
    const [page, setPage] = useState(1);
    let totalRecord = dataResults?.errors?.length || 0;
    let totalPage = Math.ceil(totalRecord / 5);
    console.log(dataResults.errors?.slice(5 * (page - 1), 5 + 5 * (page - 1)))
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
                    {formatMessage({ defaultMessage: 'Kết quả tải file' })}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="overlay overlay-block cursor-default" style={{ position: 'relative' }}>
                <i
                    className="fas fa-times"
                    onClick={onHide}
                    style={{ position: 'absolute', top: -45, right: 20, fontSize: 24, cursor: 'pointer' }}
                />
                <div className='col-12 mt-3'>{formatMessage({ defaultMessage: 'Tổng {name} cần xử lý' }, { name:"hàng hóa"})}: <span className='font-weight-bold'>{dataResults?.total}</span></div>
                    <div className='col-12 mt-3'>{formatMessage({ defaultMessage: 'Tổng {name} xử lý thành công' }, { name:"hàng hóa"})}: <span className='font-weight-bold text-success'>{dataResults?.totalSuccess}</span></div>
                    <div className='col-12 mt-3'>{formatMessage({ defaultMessage: 'Tổng {name} xử lý thất bại' }, { name:"hàng hóa"})}: <span className='font-weight-bold text-danger'>{dataResults?.total - dataResults?.totalSuccess}</span></div>
                <div className='row'>
                    <div className='col-12 mt-4'>
                        <table className="table table-borderless product-list table-vertical-center fixed">
                            <thead>
                                <tr className="font-size-lg">
                                    <th style={{ fontSize: '14px', textAlign:'center' }} width="50%">
                                        {'SKU'}
                                    </th>
                                    <th style={{ fontSize: '14px', textAlign: 'center' }}>
                                        {formatMessage({ defaultMessage: 'Lỗi' })}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {dataResults.errors?.slice(5 * (page - 1), 5 + 5 * (page - 1))?.map((data) => {
                                    return (<tr key={`inventory-row-${data?.index}`}>
                                        <td style={{textAlign: 'center'}}>{data?.title}</td>
                                        <td style={{ wordBreak: 'break-word', textAlign:'center' }}>{data?.message}</td>
                                    </tr>)
                                }

                                )}
                               
                            </tbody>
                        </table>
                    </div>
                </div>
                    <PaginationModal
                        page={page}
                        totalPage={totalPage}
                        limit={5}
                        totalRecord={totalRecord}
                        count={
                            dataResults.errors?.slice(
                                5 * (page - 1),
                                5 + 5 * (page - 1)
                            )?.length
                        }
                        onPanigate={(page) => setPage(page)}
                        emptyTitle={formatMessage({
                            defaultMessage: "Chưa có dữ liệu",
                        })}
                    />
            </Modal.Body>
        </Modal >
    )
};

export default memo(ModalResults);