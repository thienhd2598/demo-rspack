/*
 * Created by duydatpham@gmail.com on 23/06/2021
 * Copyright (c) 2021 duydatpham@gmail.com
 */
import { Divider } from '@material-ui/core'
import React, { memo, useMemo, useState } from 'react'
import { toAbsoluteUrl } from '../../../../../_metronic/_helpers'
import { Checkbox } from '../../../../../_metronic/_partials/controls'
import _ from 'lodash'
import { formatNumberToCurrency } from '../../../../../utils'
import dayjs from 'dayjs'
import SVG from "react-inlinesvg";
import { Link, useHistory, useLocation } from 'react-router-dom'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'
import { FormattedMessage, useIntl } from 'react-intl'

export default memo(({ product, selectedId, setSelectedId, onSync, loadingSync }) => {
    const history = useHistory()
    const location = useLocation()
    const {formatMessage} = useIntl()
    const [isExpand, setIsExpand] = useState(false)
    const imgAssets = useMemo(() => {
        try {
            if (product?.productAssets?.length == 0) {
                return ''
            }
            (product?.productAssets || []).sort((s1, s2) => s1.id - s2.id);
            return product?.productAssets[0].sme_url || product?.productAssets[0].ref_url
        } catch (error) {

        }
        return ''
    }, [product?.productAssets])

    let variants = isExpand ? product.productVariants : product.productVariants.slice(0, 2)
    let canExpand = product.productVariants.length > 2

    let isSelected = selectedId.some(_id => _id == product.id);
    const stt = product.sync_status != 0 ? formatMessage({defaultMessage:"Đã lưu xuống UpBase"}) : formatMessage({defaultMessage:"Lưu xuống UpBase"})
    const renderAction = useMemo(() => {
        if (loadingSync && isSelected)
            return <span className="spinner spinner-primary mr-8" />
        return (
            <OverlayTrigger
                overlay={
                    <Tooltip>
                        {stt}
                    </Tooltip>
                }
            >
                <button
                    className="btn btn-icon btn-light btn-sm"
                    onClick={() => { onSync(product.id) }}
                    disabled={product.sync_status != 0 || loadingSync}
                >
                    <span className="svg-icon svg-icon-md svg-icon-control">
                        <SVG src={toAbsoluteUrl("/media/svg/icons/General/Update.svg")} />
                    </span>
                </button>
            </OverlayTrigger>
        )
    }, [onSync, loadingSync, isSelected])

    const renderStatus = useMemo(() => {
        if (!!product.sme_error_message)
            return <OverlayTrigger
                overlay={
                    <Tooltip>
                        {product.sme_error_message}
                    </Tooltip>
                }
            >
                <p className="text-danger">
                    <span className='mt-1' >{formatMessage({defaultMessage:"Lỗi tải xuống"})}</span>
                    <span className="svg-icon svg-icon-md svg-icon-danger ml-2">
                        <SVG src={toAbsoluteUrl("/media/svg/icons/Code/Warning-2.svg")} />
                    </span></p>
            </OverlayTrigger>
        return <p className="text-success">{formatMessage({defaultMessage:"Tải xuống thành công"})}</p>
    }, [product.sme_error_message])

    return <>
        {
            variants.map((_variant, index) => {
                return (
                    <tr key={`variant--${_variant.id}`} style={(index == variants.length - 1 && !(canExpand)) ? {
                        borderBottom: '1px solid #F0F0F0',
                    } : {
                    }} >
                        {
                            index == 0 && <td className='pt-6 pb-1' style={{ verticalAlign: 'top' }} rowSpan={variants.length + (canExpand  ? 1 : 0)} >
                                <div style={{ verticalAlign: 'top', display: 'flex', flexDirection: 'row', marginBottom: 16 }}>
                                    <div style={{
                                        backgroundColor: '#F7F7FA',
                                        width: 80, height: 80,
                                        borderRadius: 8,
                                        overflow: 'hidden',
                                        minWidth: 80
                                    }} className='mr-6' >
                                        {
                                            !!imgAssets && <img src={imgAssets}
                                                style={{ width: 80, height: 80, objectFit: 'contain' }} />
                                        }
                                    </div>
                                    <div style={{ textAlign: 'left' }} >
                                        <p className='font-weight-normal' >{product.name}</p>
                                    </div>
                                </div>
                            </td>
                        }
                        <td className='pt-6 pb-1' style={{ verticalAlign: 'top' }}>
                            <div style={{ textAlign: 'left' }} >
                                <p className='font-weight-normal mb-1' >{_variant?.name}</p>
                                <p ><img src={toAbsoluteUrl('/media/ic_sku.svg')} /> {_variant.sku}</p>
                            </div>
                        </td>
                        <td style={{ verticalAlign: 'top' }} className='text-center pt-6 pb-1'>
                            {formatNumberToCurrency(_variant.price)}đ
                        </td>
                        <td style={{ verticalAlign: 'top' }} className='text-center pt-6 pb-1'>
                            {formatNumberToCurrency(_variant.stock_on_hand)}
                        </td>
                        {
                            index == 0 && <td className='pt-6' style={{ verticalAlign: 'top' }} rowSpan={variants.length} >
                                {renderStatus}
                            </td>
                        }
                        {/* {
                            index == 0 && <td className='pt-6' style={{ verticalAlign: 'top', padding: 0 }} rowSpan={variants.length} >
                                {renderAction}
                            </td>
                        } */}
                    </tr>
                )
            })
        }
         {
            canExpand && (
                !isExpand ? <tr style={{
                    borderBottom: '1px solid #F0F0F0',
                }} >
                    <td colSpan='7' className='pt-0' >
                        <a className='d-flex align-items-center ' onClick={e => {
                            e.preventDefault()
                            setIsExpand(true)
                        }} >
                            <span style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.15)', flex: 1 }} />
                            <span className='font-weight-normal mx-4' style={{ color: 'rgba(0,0,0,0.85)' }} >{`${formatMessage({defaultMessage:"Xem thêm"})} ${product.productVariants.length - variants.length} ${formatMessage({defaultMessage:'phân loại'})}`}</span>
                            <span style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.15)', flex: 1 }} />
                        </a>
                    </td>
                </tr> : <tr style={{
                    borderBottom: '1px solid #F0F0F0',
                }} >
                    <td colSpan='7' className='pt-0' >
                        <a className='d-flex align-items-center ' onClick={e => {
                            e.preventDefault()
                            setIsExpand(false)
                        }} >
                            <span style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.15)', flex: 1 }} />
                            <span className='font-weight-normal mx-4' style={{ color: 'rgba(0,0,0,0.85)' }} >{formatMessage({defaultMessage:`Thu gọn`})}</span>
                            <span style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.15)', flex: 1 }} />
                        </a>
                    </td>
                </tr>
            )
        }
    </>
})