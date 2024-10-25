/*
 * Created by duydatpham@gmail.com on 23/06/2021
 * Copyright (c) 2021 duydatpham@gmail.com
 */
import React, { memo, useCallback, useMemo, useState } from 'react'
import { toAbsoluteUrl } from '../../../../_metronic/_helpers'
import _ from 'lodash'
import dayjs from 'dayjs'
import SVG from "react-inlinesvg";
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import InfoProduct from '../../../../components/InfoProduct';
import { useIntl } from 'react-intl';
import { Checkbox } from '../../../../_metronic/_partials/controls';

export default memo(({setProducts, isSelected, stores, dataWarehouse, job_stock, sc_stores, op_connector_channels }) => {
    let _store = sc_stores.find(_st => _st.id == job_stock.scProduct.store_id)
    let _channel = op_connector_channels.find(_st => _st.code == job_stock.scProduct.connector_channel_code)
    let hasAttribute = job_stock.scProduct.variantAttributeValues?.length > 0;
    const {formatMessage} = useIntl()
    const [isCopied, setIsCopied] = useState(false);
   
    const [isHovering, setIsHovering] = useState(false);

    const handleMouseEnter = (id) => {
        setIsHovering(id);
    }

    const handleMouseLeave = () => {
        setIsHovering(false);
    }

    console.log(`STOCK TRACKING: `, job_stock, imgProduct);


    const onCopyToClipBoard = async (text) => {
        await navigator.clipboard.writeText(text);
        setIsCopied(true);
        setTimeout(
            () => {
                setIsCopied(false);
            }, 1500
        )
    };

    let assetUrl = useMemo(() => {
        if (!job_stock?.scProduct?.productAssets) {
            return null;
        }
        try {

            let imgOrigin = (job_stock.scProduct.productAssets || []).find(_asset => _asset.type == 4)

            if (!!imgOrigin && !!imgOrigin.template_image_url) {
                return imgOrigin.sme_url || imgOrigin.ref_url
            }

            let _asset = _.minBy(job_stock.scProduct.productAssets?.filter(_asset => _asset.type == 1), 'position')
            if (!!_asset) {
                return _asset.sme_url || _asset.ref_url
            }
            return null
        } catch (error) {
            return null
        }
    }, [job_stock?.scProduct?.productAssets])

    const imgProduct = useMemo(() => {
        if (hasAttribute) {
            let _asset = null
            let _sc_product_attributes_value = !!job_stock?.sc_product_variant?.sc_product_attributes_value ? JSON.parse(job_stock?.sc_product_variant?.sc_product_attributes_value) : null;
            let _variantAttributeValue = job_stock?.scProduct?.variantAttributeValues?.find(_value => {
                return _value?.scVariantValueAssets?.length > 0 && _sc_product_attributes_value?.some(_v => _v == _value?.ref_index)
            })
            if (!!_variantAttributeValue) {
                _asset = _variantAttributeValue?.scVariantValueAssets?.[0]
            }
            return <img
                src={_asset?.sme_url || assetUrl}
                style={{ width: 60, height: 60, objectFit: 'contain' }} />
        } else {
            return <img
                src={assetUrl}
                style={{ width: 60, height: 60, objectFit: 'contain' }} />
        }
    })

    const warehouse = useMemo(() => {
        return dataWarehouse?.sme_warehouses?.find(wh => wh?.id == job_stock?.warehouse_id) || {}
    }, [dataWarehouse])
    const selectStore = useMemo(() => 
        stores?.find((store => store.id == job_stock?.scProduct?.store_id
    )),
    [stores, job_stock])
    
    console.log('selectStore', selectStore)
    return <>
        <tr style={{ borderBottom: '1px solid rgb(240, 240, 240)' }}>
            <td className='pt-6 pb-1' style={{ verticalAlign: 'top' }}>
            <div className='d-flex'>
                <div style={{verticalAlign: 'top'}}>
                <Checkbox
                    inputProps={{'aria-label': 'checkbox',}}
                    size='checkbox-md'
                    isSelected={isSelected}
                    onChange={(e) => {
                        if (isSelected) {
                            setProducts(prev => prev.filter(_id => _id.id != job_stock?.id))
                        } else {
                            setProducts(prev => prev.concat([job_stock]))
                        }
                    }}
                />
                </div>
                <div style={{ verticalAlign: 'top', display: 'flex', flexDirection: 'row', marginBottom: 2 }}>
                    <div style={{
                            backgroundColor: '#F7F7FA',
                            width: 60, height: 60,
                            borderRadius: 8,
                            overflow: 'hidden',
                            minWidth: 60,
                            cursor: 'pointer'
                        }}
                        onClick={e => {
                            e.preventDefault();
                            window.open(`/product-stores/edit/${job_stock?.scProduct?.id}`, '_blank')
                        }}
                        className='mr-6'
                    >
                        { imgProduct }
                    </div>
                    <div style={{display: 'flex', flexDirection: 'column'}}>
                        <InfoProduct
                            name={job_stock?.scProduct?.name}
                            sku={job_stock?.sc_product_variant?.sku}
                            url={`/product-stores/edit/${job_stock?.scProduct?.id}`}
                        />
                        <div className='d-flex align-items-center mt-2'>
                            <span><img style={{width: '20px', height: '20px', marginRight: '4px'}} src={selectStore?.url}></img></span>
                            <span>{selectStore?.name}</span>
                        </div>
                    </div>
                    
                </div>
            </div>
                
                
            </td>
            <td className='text-center'>
                <b>{job_stock.stock}</b>
            </td>
            <td className='text-center'>
              {warehouse?.name || '--'}
            </td>
            <td className='text-center'>
                {job_stock.sync_type == 1 ? formatMessage({defaultMessage:'Đẩy tự động'}) : formatMessage({defaultMessage:'Đẩy thủ công'})}
            </td>
            <td className='text-center' >
                <span className={`text-white text-center bold rounded ${job_stock.synced_status == 1 ? ' bg-success' : 'bg-danger'} p-2 col-8`}>{job_stock.synced_status == 1 ? formatMessage({defaultMessage:'Thành công'}) : formatMessage({defaultMessage:'Thất bại'})}</span>
            </td>
            <td className='text-center' >
                {dayjs(job_stock.synced_at).format('DD/MM/YYYY[\n]HH:mm')}
            </td>
        </tr>
        {job_stock?.synced_error_msg && <tr style={{ background: 'rgba(254, 86, 41, 0.31)' }}>
            <td colSpan={7}>
                <div className='d-flex'>
                    <SVG src={toAbsoluteUrl("/media/svg/ic-warning.svg")} />
                    <span style={{ color: '#F80D0D', wordBreak: 'break-word' }} 
                    className='ml-4'>{formatMessage({ defaultMessage: 'Lỗi' })}: {job_stock?.synced_error_msg}</span>
                </div>

            </td>
        </tr>}
    </>
})