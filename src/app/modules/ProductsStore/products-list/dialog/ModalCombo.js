import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useIntl } from 'react-intl';
import { Link } from 'react-router-dom';

const ModalCombo = ({
    dataCombo,
    onHide
}) => {
    const { formatMessage } = useIntl();
    return (
        <Modal
            show={!!dataCombo}
            aria-labelledby="example-modal-sizes-title-sm"
            centered
            onHide={onHide}
            backdrop={true}
            dialogClassName={'body-dialog-connect'}
        >
            <Modal.Header>
                <Modal.Title>
                    {formatMessage({ defaultMessage: 'Thông tin combo'})}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="overlay overlay-block cursor-default">
                <i
                    className="fas fa-times"
                    onClick={onHide}
                    style={{ position: 'absolute', top: -45, right: 20, fontSize: 20, cursor: 'pointer' }}
                />
                <div className='row'>
                    <div className='col-12'>
                        <table className="table table-borderless product-list table-vertical-center fixed ">
                            <thead style={{background: 'rgb(243, 246, 249)', borderRight: '1px solid #d9d9d9',borderLeft: '1px solid #d9d9d9'}}>
                                <tr className="font-size-lg">
                                    <th style={{fontSize: '14px'}} width="50%">{formatMessage({ defaultMessage: 'SKU'})}</th>
                                    <th style={{fontSize: '14px'}}>{formatMessage({ defaultMessage: 'Số lượng'})}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dataCombo?.map((data) => {
                                    return (<tr key={`inventory-row-${data.variant_id}`}>
                                        <td>
                                            <Link style={{color: '#000000'}} to={`/products/edit/${data?.combo_item?.sme_catalog_product?.id || data?.combo_item?.product_id}`} target="_blank">
                                                {data?.combo_item?.sku}
                                            </Link>
                                        </td>
                                        <td>{data?.quantity}</td>
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
                    {/* <button
                        type="button"
                        onClick={onHide}
                        className="btn btn-primary btn-elevate mr-3"
                        style={{ width: 100 }}
                    >
                        OK
                    </button> */}
                </div>
            </Modal.Footer>
        </Modal >
    )
};

export default memo(ModalCombo);