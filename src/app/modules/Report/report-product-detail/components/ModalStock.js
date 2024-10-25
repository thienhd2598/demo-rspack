import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Modal } from 'react-bootstrap';
import { useQuery } from "@apollo/client";
import query_sme_catalog_stores from '../../../../../graphql/query_sme_catalog_stores';
import { useIntl } from 'react-intl';

const ModalStock = ({
    onHide,
    title,
    dataStock,
}) => {
    const {formatMessage} = useIntl()

    const { data: dataWarehouse } = useQuery(query_sme_catalog_stores, {
        fetchPolicy: "cache-and-network"
    });

    return (
        <>
            <Modal
                show={dataStock}
                aria-labelledby="example-modal-sizes-title-md"
                dialogClassName="modal-show-connect-product"
                centered
                onHide={onHide}
                backdrop={true}
            >
                <Modal.Header closeButton={false}>
                    <Modal.Title>
                        {title}
                    </Modal.Title>
                    <div>
                        <i
                            className="drawer-filter-icon fas fa-times icon-md text-right cursor-pointer"
                            onClick={onHide}
                        ></i>
                    </div>
                </Modal.Header>
                <Modal.Body className="overlay overlay-block cursor-default" style={{ padding: 15 }}>
                        <table className="table table-borderless product-list table-vertical-center fixed">
                            <thead>
                                <tr className="font-size-lg">
                                    <th style={{ fontSize: '14px' }} width="50%">Kho</th>
                                    <th style={{ fontSize: '14px', textAlign:'center' }}>{formatMessage({ defaultMessage: 'Số lượng' })}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dataWarehouse?.sme_warehouses?.map((warehouse) => {
                                    return (<tr key={`inventory-row-${warehouse.id}`}>
                                        <td>{warehouse.name}</td>
                                        <td style={{ wordBreak: 'break-word', textAlign:'center' }}>{dataStock?.find(item => item?.sme_store_id == warehouse?.id)?.stock}</td>
                                    </tr>)
                                }

                                )}
                            </tbody>
                        </table>
                </Modal.Body>
            </Modal>
        </>
    )
};

export default memo(ModalStock);