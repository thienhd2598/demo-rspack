import React, { memo, useMemo } from 'react';
import InfoProduct from '../../../../components/InfoProduct';

export default memo(({
    key, product, isBorder, item, warehouse
}) => {
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
    let hasAttribute = product?.variant?.attributes?.length > 0;// variants.length > 0 && variants[0].attributes.length > 0;


    const imgAssets = useMemo(() => {
        if (!!product?.variant?.sme_catalog_product_variant_assets[0] && product?.variant?.sme_catalog_product_variant_assets[0].asset_url) {
            return product?.variant?.sme_catalog_product_variant_assets[0]
        }
        return null //product?.product?.sme_catalog_product_assets[0]
    }, [product])

    const openProducts = () => {
        let url = !hasAttribute ? `/products/${product?.variant?.is_combo == 1 ? 'edit-combo' : 'edit'}/${product.product_id}` : `/products/stocks/detail/${product.variant_id}`
        return url
    }
    return (
        <tr className="font-size-lg" style={{ fontSize: '15px' }}>
            <td style={{ fontSize: '13px' }}>
                <div key={key} className='d-flex row w-100 m-0' style={!!isBorder ? { borderBottom: '0.5px solid #cbced4' } : {}}>
                    <div
                        className="col-11"
                        style={{ verticalAlign: 'top', display: 'flex', flexDirection: 'row' }}
                    >
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
                                    src={imgAssets?.asset_url || ''}
                                    style={{ width: 80, height: 80, objectFit: 'contain' }}
                                />
                            }
                        </div>
                        <div>
                            <InfoProduct
                                name={product.variant?.sme_catalog_product?.name}
                                sku={product.variant?.sku}
                                url={openProducts(product)}
                            />
                            <div>
                                {_attributes || '--'}
                            </div>
                        </div>
                    </div>
                </div>
            </td>
            <td className='text-center' style={{ fontSize: '22px' }}>{item?.unit || '--'}</td>
            <td className='text-center' style={{ fontSize: '22px' }}><b>{item.quantity_purchased}</b></td>

            {/* {amontProductAdd(item.id)} */}
            {warehouse?.fulfillment_scan_pack_mode == 1 && <td className='text-center' style={{ fontSize: '22px', background: item?.amount_product_add !== item?.quantity_purchased ? '#FE5629' : '#00DB6D', color: '#fff' }}>
                <b>{item.amount_product_add}</b>
            </td>}
        </tr>
    )
})