import React, { memo, useMemo, useState } from 'react';
import { Modal } from 'react-bootstrap';
import { useIntl } from "react-intl";
import dayjs from 'dayjs';

const ModalResults = ({
    dataInfo,
    onHide,
}) => {
    const { formatMessage } = useIntl();
    return (
        <Modal
            show={!!dataInfo}
            aria-labelledby="example-modal-sizes-title-sm"
            centered
            onHide={onHide}
            backdrop={true}
            dialogClassName={'body-dialog-connect'}
        >
            <Modal.Header>
                <Modal.Title>
                    {formatMessage({ defaultMessage: 'Thông tin lô hạn' })}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="overlay overlay-block cursor-default">
                <div className='row'>
                    <div className='col-12 mt-4'>
                        <table className="table table-borderless product-list table-vertical-center fixed">
                            <thead>
                                <tr className="font-size-lg">
                                    {/* <th style={{ fontSize: '14px', textAlign:'center' }} width="20%">
                                        {formatMessage({defaultMessage : 'SKU'})}
                                    </th> */}
                                    <th style={{ fontSize: '14px', textAlign:'center' }} width="24%">
                                        {formatMessage({defaultMessage : 'Mã lô'})}
                                    </th>
                                    <th style={{ fontSize: '14px', textAlign:'center' }} width="38%">
                                        {formatMessage({defaultMessage : 'Ngày sản xuất'})}
                                    </th>
                                    <th style={{ fontSize: '14px', textAlign: 'center' }}>
                                    {formatMessage({defaultMessage : 'Ngày hết hạn'})}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {dataInfo?.map((data) => {
                                    return (<tr key={`inventory-row-${data.index}`}>
                                        <td style={{textAlign: 'center'}}>{data?.lotSerial}</td>
                                        <td style={{ textAlign:'center' }}>{data?.manufactureDate ? dayjs(data?.manufactureDate*1000).format('DD-MM-YYYY') : '--'}</td>
                                        <td style={{ textAlign:'center' }}>{data?.expiredDate ? dayjs(data?.expiredDate*1000).format('DD-MM-YYYY') : '--'}</td>
                                    </tr>)
                                }

                                )}
                            </tbody>
                        </table>
                    </div>
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

export default memo(ModalResults);