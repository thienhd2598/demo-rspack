import { useQuery } from '@apollo/client';
import React, { memo, useMemo } from 'react';
import InfoProduct from '../../../../components/InfoProduct';
import query_sme_catalog_product_variant_by_pk from '../../../../graphql/query_sme_catalog_product_variant_by_pk';

export default memo(({
    key, isBorder, item, setDataCombo, warehouse
}) => {

    const _attributes = (attributes) => {

        let attributes_prod = [];
        if (attributes && attributes.length > 0) {

            for (let index = 0; index < attributes.length; index++) {
                const element = attributes[index];
                attributes_prod.push(`${element.sme_catalog_product_attribute_value?.name}`);

            }
            return attributes_prod.join(' - ');
        }
        return null
    }


    const imgAssets = (sme_catalog_product_variant_assets) => {
        if (!!sme_catalog_product_variant_assets[0] && sme_catalog_product_variant_assets[0].asset_url) {
            return sme_catalog_product_variant_assets[0]
        }
        return null //product?.product?.sme_catalog_product_assets[0]
    }

    const openProducts = (product) => {
        let hasAttribute = product?.variant?.attributes?.length > 0;// variants.length > 0 && variants[0].attributes.length > 0;
        let url = !hasAttribute ? `/products/${product?.variant?.is_combo == 1 ? 'edit-combo' : 'edit'}/${product.product_id}` : `/products/stocks/detail/${product.variant_id}`
        return url
    }

    const { loading: loadingSmeProductVariant, data: dataSmeProductVariant, } = useQuery(query_sme_catalog_product_variant_by_pk, {
        variables: { id: item[0]?.orderItem?.sme_variant_id },
        fetchPolicy: "network-only",
    });

    const linkProduct = useMemo(
        () => {
            if (dataSmeProductVariant?.sme_catalog_product_variant_by_pk?.sme_catalog_product?.is_combo == 1) {
                return `/products/edit-combo/${dataSmeProductVariant?.sme_catalog_product_variant_by_pk?.sme_catalog_product?.id}`
            }
            if (dataSmeProductVariant?.sme_catalog_product_variant_by_pk?.attributes?.length > 0) {
                return `/products/stocks/detail/${dataSmeProductVariant?.sme_catalog_product_variant_by_pk?.id}`
            } else {
                return `/products/edit/${dataSmeProductVariant?.sme_catalog_product_variant_by_pk?.sme_catalog_product?.id}`
            }
        }, [dataSmeProductVariant]
    );


    return (
        item.map((itemCombo, index) => (
            <tr className="font-size-lg" style={{ fontSize: '15px' }}>

                <td style={{ fontSize: '13px', borderBottom: index !== item.length - 1 ? 'none' : '0.5px solid #cbced4', borderTop: index == item.length - 1 ? 'none' : '0.5px solid #cbced4' }}>
                    {index == 0 &&
                        <div className='d-flex mb-3 col-12'>
                            <div onClick={() => {
                                window.open(linkProduct, "_blank");
                            }}>
                                <InfoProduct
                                    name={''}
                                    sku={dataSmeProductVariant?.sme_catalog_product_variant_by_pk?.sku}
                                />
                            </div>
                            <span
                                style={{ cursor: "pointer" }}
                                onClick={() => setDataCombo(dataSmeProductVariant?.sme_catalog_product_variant_by_pk?.sme_catalog_product?.combo_items)}
                                className="ml-4 text-primary"
                            >
                                Combo
                            </span>
                        </div>
                    }
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
                                        src={imgAssets(itemCombo?.product?.variant?.sme_catalog_product_variant_assets)?.asset_url || ''}
                                        style={{ width: 80, height: 80, objectFit: 'contain' }}
                                    />
                                }
                            </div>
                            <div>
                                <InfoProduct
                                    name={itemCombo?.product.variant?.sme_catalog_product?.name}
                                    sku={itemCombo?.product.variant?.sku}
                                    url={openProducts(itemCombo?.product)}
                                />

                                <div>
                                    {_attributes(itemCombo?.product?.variant?.attributes)}
                                </div>
                            </div>
                        </div>
                    </div>
                </td>
                <td className='text-center' style={{ fontSize: '22px' }}><b>--</b></td>
                <td className='text-center' style={{ fontSize: '22px' }}><b>{itemCombo?.quantity_purchased}</b></td>

                {/* {amontProductAdd(itemComboid)} */}
                {warehouse?.fulfillment_scan_pack_mode == 1 && <td className='text-center' style={{ fontSize: '22px', background: itemCombo?.amount_product_add !== itemCombo?.quantity_purchased ? '#FE5629' : '#00DB6D', color: '#fff' }}>
                    <b>{itemCombo?.amount_product_add || 0}</b>
                </td>}
            </tr>
        ))
    )
})