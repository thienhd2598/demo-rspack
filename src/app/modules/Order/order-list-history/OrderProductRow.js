import React, { memo, useCallback } from 'react';
import { toAbsoluteUrl } from '../../../../_metronic/_helpers'
import { useIntl } from 'react-intl'
import SVG from "react-inlinesvg";
import InfoProduct from '../../../../components/InfoProduct';
import HoverImage from '../../../../components/HoverImage';
export default memo(({
    errOrder, refProductId, isGift, key, product_name, 
    variant_name, variant_image, variant_sku, 
    quantity_purchased, isBorder, connector_channel_code, ref_store_id, ref_variant_id
}) => {
    const { formatMessage } = useIntl()
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
        <div key={key} className='d-flex row w-100 m-0 p-2' style={!!isBorder ? { borderBottom: '0.5px solid #cbced4' } : {}}>
            <div
                className="col-11"
                style={{ verticalAlign: 'top', display: 'flex', flexDirection: 'row' }}
            >
                <div
                    style={{
                        backgroundColor: '#F7F7FA',
                        width: 60, height: 60,
                        borderRadius: 4,
                        overflow: 'hidden',
                        minWidth: 60,
                        cursor: 'pointer'
                    }}
                    onClick={e => {
                        e.preventDefault();
                    }}
                    className='mr-6'
                >
                    {<HoverImage size={{ width: 320, height: 320 }} defaultSize={{ width: 60, height: 60 }} url={variant_image} />}
                </div>
                <div className='w-100'>
                    {!!isGift && (
                        <div style={{ border: '1px solid #FF0000', width: 'max-content', marginBottom: '3px', padding: '2px 4px', borderRadius: '3px' }}>
                            <span style={{ color: '#FF0000' }}> {formatMessage({ defaultMessage: 'Quà tặng' })}</span>
                        </div>
                    )}

                    <InfoProduct
                        short={true}
                        name={product_name}
                        sku={variant_sku}
                        url={openFloorProducts}
                        productOrder={true}
                    />

                    {!!variant_name && (
                        <div>
                            {variant_name || ''}
                        </div>
                    )}

                </div>
            </div>
            <div className='col-1 px-0'><span style={{ fontSize: 12 }} className="mr-1">x</span>{quantity_purchased || 0}</div>
            {errOrder ?
                <tr className='col-12 mt-1' style={{ background: 'rgba(254, 86, 41, 0.31)' }}>
                    <td className='remove_border_color py-2' colSpan={12}>
                        <div className='d-flex'>
                            <SVG src={toAbsoluteUrl("/media/svg/ic-warning.svg")} /> <span style={{ color: '#F80D0D', wordBreak: 'break-word' }} className='ml-4'>{formatMessage({ defaultMessage: 'Lỗi' })}: {errOrder}</span>
                        </div>

                    </td>
                </tr> : null}
        </div>
    )
})