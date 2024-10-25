import React, { memo, useMemo, useCallback, Fragment } from 'react';

import { Link, useHistory, useLocation } from 'react-router-dom';
import InfoProduct from '../../../../components/InfoProduct';
import { formatNumberToCurrency } from '../../../../utils';
import { toAbsoluteUrl } from '../../../../_metronic/_helpers';
import AuthorizationWrapper from '../../../../components/AuthorizationWrapper';


const InventoryChecklistRow = ({ product, deleteProduct }) => {
    console.log('product', product)
    const imgAssets = useMemo(() => {
        if (!!product?.variant?.sme_catalog_product_variant_assets[0] && product?.variant?.sme_catalog_product_variant_assets[0].asset_url) {
            return product?.variant?.sme_catalog_product_variant_assets[0]
        }
        return null //product?.product?.sme_catalog_product_assets[0]
    }, [product])

    let hasAttribute = product?.variant?.attributes?.length > 0;// variants.length > 0 && variants[0].attributes.length > 0;

    const _attributes = useMemo(() => {

        let attributes = [];
        if (product?.variant?.attributes && product?.variant?.attributes.length > 0) {
            for (let index = 0; index < product?.variant?.attributes.length; index++) {
                const element = product?.variant?.attributes[index];
                attributes.push(`${element.sme_catalog_product_attribute_value?.name}`);

            }
            return attributes.join(' - ');
        }
        return null
    }, [product])



    return (
        <Fragment>
            <tr>
                <td>
                    <div style={{ verticalAlign: 'top', display: 'flex', flexDirection: 'row', marginBottom: 16 }}>
                        <Link to={!hasAttribute ? `/products/edit/${product?.variant?.sme_catalog_product?.id}` : `/products/stocks/detail/${product.variant_id}`} target="_blank">
                            <div style={{
                                backgroundColor: '#F7F7FA',
                                width: 80, height: 80,
                                borderRadius: 8,
                                overflow: 'hidden',
                                minWidth: 80
                            }} className='mr-6' >
                                {
                                    !!imgAssets && <img src={imgAssets?.asset_url}
                                        style={{ width: 80, height: 80, objectFit: 'contain' }} />
                                }
                            </div>
                        </Link>
                        <div className='w-100'>
                            <InfoProduct
                                name={product.variant?.sme_catalog_product?.name}
                                sku={product.variant?.sku}
                                url={!hasAttribute ? `/products/edit/${product?.variant?.sme_catalog_product?.id}` : `/products/stocks/detail/${product.variant_id}`}
                            />
                            {!!_attributes && <p className='font-weight-normal mb-2 text-secondary-custom fs-12' >{_attributes}</p>}
                        </div>
                    </div>
                </td>
                <td className='text-center'>{product?.variant?.unit || '--'}</td>
                <td className='text-center'>{formatNumberToCurrency(product.stock_quantity)}</td>
                <td className='text-center'>
                    <AuthorizationWrapper keys={['product_inventory_action']}>
                    <i role="button" onClick={() => {
                        deleteProduct(product.id)
                    }} class="fas fa-trash-alt text-danger"></i>
                    </AuthorizationWrapper>
                </td>
            </tr>
        </Fragment>
    )
};

export default memo(InventoryChecklistRow);