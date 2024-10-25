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
import { FormattedMessage } from 'react-intl'
import { useIntl } from "react-intl";
export default memo(({ product, selectedId, setSelectedId, onSync, loadingSync }) => {
    const history = useHistory()
    const location = useLocation()
    const [isExpand, setIsExpand] = useState(false)
    const {formatMessage} = useIntl()
    const imgAssets = useMemo(() => {
        let asset = null
        try {
            let _asset_payload = JSON.parse(product.asset_payload)
            asset = _asset_payload[0]
        } catch (error) {

        }


        return asset
    }, [product?.asset_payload])

    let variants = isExpand ? product.productVariants : product.productVariants.slice(0, 2)
    let canExpand = product.productVariants.length > 2

    let isSelected = selectedId.some(_id => _id == product.id);

    const renderAction = useMemo(() => {
        if (loadingSync && isSelected)
            return <span className="spinner spinner-primary mr-8" />
        return (
            <OverlayTrigger
                overlay={
                    <Tooltip>
                        <FormattedMessage id={product.sync_status != 0 ? formatMessage({defaultMessage:"Đã lưu xuống UpBase"}) : formatMessage({defaultMessage:"Lưu xuống UpBase"})} />
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
        return <p className="text-success">{formatMessage({defaultMessage:"Hoạt động"})}</p>
    }, [])

    return <>
        {
            variants.map((_variant, index) => {
                return (
                    <tr key={`variant--${_variant.id}`} style={(index == variants.length - 1 && !(canExpand && !isExpand)) ? {
                        borderBottom: '1px solid #F0F0F0',
                    } : {
                    }} >
                        {
                            index == 0 && <td className='pt-6 pb-1' style={{ verticalAlign: 'top' }} rowSpan={variants.length + (canExpand && !isExpand ? 1 : 0)} >
                                <Checkbox
                                    inputProps={{
                                        'aria-label': 'checkbox',
                                    }}
                                    isSelected={isSelected}
                                    disabled={product.sync_status != 0}
                                    onChange={(e) => {
                                        if (isSelected) {
                                            setSelectedId(prev => prev.filter(_id => _id != product.id))
                                        } else {
                                            setSelectedId(prev => prev.concat([product.id]))
                                        }
                                    }}
                                />
                            </td>
                        }
                        {
                            index == 0 && <td className='pt-6 pb-1' style={{ verticalAlign: 'top' }} rowSpan={variants.length + (canExpand && !isExpand ? 1 : 0)} >
                                <div style={{ verticalAlign: 'top', display: 'flex', flexDirection: 'row', marginBottom: 16 }}>
                                    <div style={{
                                        backgroundColor: '#F7F7FA',
                                        width: 80, height: 80,
                                        borderRadius: 8,
                                        overflow: 'hidden',
                                        minWidth: 80
                                    }} className='mr-6' >
                                        {
                                            !!imgAssets && <img src={imgAssets?.url}
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
                        {
                            index == 0 && <td className='pt-6' style={{ verticalAlign: 'top', padding: 0 }} rowSpan={variants.length} >
                                {renderAction}
                            </td>
                        }
                    </tr>
                )
            })
        }
        {
            (canExpand && !isExpand && <tr style={{
                borderBottom: '1px solid #F0F0F0',
            }} >
                <td colSpan='7' className='pt-0' >
                    <a className='d-flex align-items-center ' onClick={e => {
                        e.preventDefault()
                        setIsExpand(true)
                    }} >
                        <span style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.15)', flex: 1 }} />
                        <span className='font-weight-normal mx-4' style={{ color: 'rgba(0,0,0,0.85)' }} >{`Xem thêm ${product.productVariants.length - variants.length} phân loại`}</span>
                        <span style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.15)', flex: 1 }} />
                    </a>
                </td>
            </tr>)
        }
    </>
})