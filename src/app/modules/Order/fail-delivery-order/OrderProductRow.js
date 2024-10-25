import React, { memo, useCallback } from 'react';
import { useQuery } from "@apollo/client";
import query_sc_product_by_ref_id from '../../../../graphql/query_get_product_by_ref_id';
import { toAbsoluteUrl } from '../../../../_metronic/_helpers'

import SVG from "react-inlinesvg";
import InfoProduct from '../../../../components/InfoProduct';
import HoverImage from '../../../../components/HoverImage';

export default memo(({
    refProductId, key, product_name, variant_name, variant_image, variant_sku, quantity_purchased, isBorder, connector_channel_code, ref_store_id, ref_variant_id
}) => {

    const openFloorProducts = () => {
        let url = ''
        switch (connector_channel_code) {
            case 'shopee':
                url = `https://shopee.vn/product/${ref_store_id}/${refProductId}`
                break;

            case 'lazada':
                url = `https://www.lazada.vn/-i${refProductId}-s${ref_variant_id}.html`
                break;

            case 'tiktok':
                url = `https://oec-api.tiktokv.com/view/product/${refProductId}`
                break;

            default:
                break;
        }
        window.open(url || '', '_blank')
    }
    return (
        <div key={key} className='d-flex row w-100 m-0 p-3' style={!!isBorder ? { borderBottom: '0.5px solid #cbced4' } : {}}>
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
                        <HoverImage size={{width: 320, height: 320}} defaultSize={{width: 80, height:80}} url ={variant_image}/>
                    }
                </div>
                <div className='w-100'>
                    <InfoProduct
                        short={true}
                        name={product_name}
                        sku={variant_sku}
                        url={openFloorProducts}
                        productOrder={true}
                    />

                </div>
            </div>
            <div className='col-1 px-0'><span style={{ fontSize: 12 }} className="mr-1">x</span>{quantity_purchased || 0}</div>
        </div>
    )
})