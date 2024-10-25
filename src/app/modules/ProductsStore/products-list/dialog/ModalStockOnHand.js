import { useQuery } from '@apollo/client';
import React, { memo, useMemo } from 'react';
import { Modal } from 'react-bootstrap';
import { useIntl } from "react-intl";
import query_scGetWarehouses from '../../../../../graphql/query_scGetWarehouses';
import { formatNumberToCurrency } from '../../../../../utils';
import query_ScGetSmeProductsList from '../../../../../graphql/query_ScGetSmeProductsList';

const ModalStockOnHand = ({ onHide, variant, variables }) => {
    const { store_id, sku, variant_id } = variant;
    console.log({ variant });
    const { formatMessage } = useIntl();

    const { data: dataScWareHouse } = useQuery(query_scGetWarehouses, {
        variables: { store_id },
        skip: !store_id,
        fetchPolicy: 'cache-and-network',
    });

    const {data: dataInventories} = useQuery(query_ScGetSmeProductsList, {
        variables,
        fetchPolicy: 'cache-and-network',
    })

    let variantInventoris = useMemo(() => {
        if (!dataInventories || !variant_id) return [];

        // Find the product that contains the desired variant
        const products = dataInventories.ScGetSmeProducts.products || [];
        
        const foundVariantInventoris = products.flatMap(product => 
            product.productVariants.flatMap(variant => 
                variant.id === variant_id ? variant.variantInventoris : []
            )
        );

        return foundVariantInventoris;
    }, [variant_id, dataInventories])

    return (
        <Modal
            show={!!variant}
            aria-labelledby="example-modal-sizes-title-sm"
            dialogClassName={"modal-show-stock-product"}
            centered
            onHide={onHide}
            backdrop={true}
        >
            <Modal.Header closeButton={true}>
                <Modal.Title>
                    {formatMessage({ defaultMessage: 'Thông tin tồn' })}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="overlay overlay-block cursor-default" style={{ padding: 0 }}>
                <i
                    className="fas fa-times"
                    onClick={onHide}
                    style={{ position: 'absolute', top: -42, right: 20, fontSize: 20, cursor: 'pointer' }}
                />
                <div style={{ padding: '0rem 1rem' }}>
                    <div className="d-flex align-items-center mt-4 mb-2">
                        <span style={{ width: '50%' }}>SKU: {sku || '--'}</span>
                        {/* <span style={{ width: '50%' }}>GTIN: {valuesProduct[`gtin`] || '--'}</span> */}
                    </div>
                    <table className="table product-list table-head-custom table-head-bg  table-borderless  table-vertical-center fixed" style={{ tableLayout: 'fixed', borderRight: '1px solid transparent' }}>
                        <thead>
                            <tr className="text-left text-uppercase" >
                                <th style={{ border: '1px solid', fontSize: '12px' }} width='50%'>
                                    <span className="text-dark-75">{formatMessage({ defaultMessage: 'Kho kênh bán' })}</span>
                                </th>
                                <th style={{ border: '1px solid', fontSize: '12px' }} width='50%'>
                                    <span className="text-dark-75">{formatMessage({ defaultMessage: 'Tồn kho' })}</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {dataScWareHouse?.scGetWarehouses
                                ?.filter(wh => wh?.warehouse_type == 1)
                                ?.map((wh, index) => {
                                    const stockOnHand = variantInventoris?.find(iv => iv?.sc_warehouse_id == wh?.id)?.stock_on_hand || 0;

                                    return (
                                        <tr key={`sc-warehouse-${index}`}>
                                            <td style={{ border: '1px solid #c8c7c9' }}>
                                                <span className="text-dark-75" >
                                                    {wh?.warehouse_name}
                                                </span>
                                            </td>
                                            <td style={{ border: '1px solid #c8c7c9', padding: '1.25rem 0.75rem' }}>
                                                {formatNumberToCurrency(stockOnHand)}
                                            </td>
                                        </tr>
                                    )
                                })}
                        </tbody>
                    </table>
                </div>
            </Modal.Body>
        </Modal>
    )
};

export default memo(ModalStockOnHand);