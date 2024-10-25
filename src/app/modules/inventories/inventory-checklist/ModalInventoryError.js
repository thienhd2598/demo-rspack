import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, OverlayTrigger, Tooltip } from 'react-bootstrap';
import axios from "axios";
import { useIntl } from "react-intl";
const ModalInventoryError = ({
    dataError,
    setDataError
}) => {
    const {formatMessage} = useIntl()

    return (
        <Modal
            show={!!dataError}
            aria-labelledby="example-modal-sizes-title-sm"
            dialogClassName="modal-show-connect-product"
            centered
            onHide={setDataError}
            backdrop={true}
        >
            <Modal.Header>
                <Modal.Title>
                    {formatMessage({defaultMessage: 'Lỗi kiểm kho'})}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="overlay overlay-block cursor-default px-10 pb-15">
                <div className='row'>
                    <div className='col-12 text-center'>{formatMessage({defaultMessage: 'Không thực hiện kiểm kho được do có hàng hóa đang thực hiện kiểm kho'})}</div>
                    <div className='col-12 mt-5'>
                        <span>{formatMessage({defaultMessage: 'Chi tiết'})}:</span>
                    </div>
                    <div className='col-12'>
                        <table className="table table-border product-list table-borderless table-vertical-center fixed">
                            <thead>
                                <tr className="font-size-lg">
                                    <th style={{fontSize: '14px'}} width="50%">SKU</th>
                                    <th style={{fontSize: '14px'}}>{formatMessage({defaultMessage: 'Phiếu kiểm'})}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dataError?.error_items?.slice(0, 5)?.map((data) => {
                                    return (<tr key={`inventory-row-${data.index}`}>
                                        <td>{data.sku}</td>
                                        <td>{data.checklistCode}</td>
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
                        onClick={setDataError}
                        className="btn btn-primary btn-elevate mr-3"
                        style={{ width: 100 }}
                    >
                        {formatMessage({defaultMessage: 'Đóng'})}
                    </button>
                </div>
            </Modal.Footer>
        </Modal >
    )
};

export default memo(ModalInventoryError);