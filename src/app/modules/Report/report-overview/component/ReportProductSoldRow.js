import React, { memo, useCallback } from 'react';
import { toAbsoluteUrl } from "../../../../../_metronic/_helpers";
import { useQuery } from "@apollo/client";
import { formatNumberToCurrency } from '../../../../../utils';
import query_sc_product_by_ref_id from '../../../../../graphql/query_get_product_by_ref_id';
import _ from 'lodash';

export default memo(({
    key, index, productId, soldCount, storeCount
}) => {
    const { data: dataProductByPk } = useQuery(query_sc_product_by_ref_id, {
        variables: {
            ref_id: productId,            
        },
        fetchPolicy: 'network-only'
    });

    const renderAssetsUrl = useCallback(
        (product) => {
            if (!product?.productAssets) {
                return null;
            }
            try {
                let _asset = _.minBy(product.productAssets?.filter(_asset => _asset.type == 1), 'position')

                if (!!_asset) {
                    return _asset.sme_url || _asset.ref_url
                }
                return null
            } catch (error) {
                return null
            }
        }, []
    );

    return (
        <tr key={key}>
            <td style={{ verticalAlign: 'top' }} className='pt-2 pb-1'>
                {index + 1}
            </td>
            <td className='pt-2 pb-1' style={{ verticalAlign: 'top' }}>
                <div style={{ verticalAlign: 'top', display: 'flex', flexDirection: 'row', marginBottom: 16 }}>
                    <div
                        style={{
                            backgroundColor: '#F7F7FA',
                            width: 80, height: 80,
                            borderRadius: 8,
                            overflow: 'hidden',
                            minWidth: 80,
                            cursor: 'pointer'
                        }}
                        onClick={e => {
                            e.preventDefault();
                        }}
                        className='mr-6'
                    >
                        {
                            <img
                                src={renderAssetsUrl(dataProductByPk?.scGetProduct)}
                                style={{ width: 80, height: 80, objectFit: 'contain' }}
                            />
                        }
                    </div>
                    <div>
                        <p
                            className='font-weight-normal mb-2 text-truncate-order'
                            style={{ cursor: 'pointer', maxWidth: '95%' }}
                            onClick={e => {
                                e.preventDefault();
                                window.open(`/product-stores/edit/${dataProductByPk?.scGetProduct?.id}`, '_blank')
                            }}
                        >
                            {dataProductByPk?.scGetProduct?.name || ''}
                        </p>
                        <div className="mt-1 d-flex align-items-center">
                            <p className='d-flex align-items-center' style={{ position: 'relative', top: 3 }}>
                                <img src={toAbsoluteUrl('/media/ic_sku.svg')} className="pr-2" />
                                <span className='text-truncate-order'>
                                    {dataProductByPk?.scGetProduct?.sku || ''}
                                </span>
                            </p>
                            {/* <p className="ml-12">{storeCount} gian hàng</p> */}
                        </div>
                    </div>
                </div>
            </td>
            <td>
                <p style={{ marginRight: 40 }}>
                    {formatNumberToCurrency(soldCount)}
                </p>
            </td>
        </tr>
    )
})