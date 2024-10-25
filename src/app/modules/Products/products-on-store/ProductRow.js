/*
 * Created by duydatpham@gmail.com on 23/06/2021
 * Copyright (c) 2021 duydatpham@gmail.com
 */
import { Divider } from '@material-ui/core'
import React, { memo, useCallback, useMemo, useState } from 'react'
import { toAbsoluteUrl } from '../../../../_metronic/_helpers'
import { Checkbox } from '../../../../_metronic/_partials/controls'
import _ from 'lodash'
import { formatNumberToCurrency } from '../../../../utils'
import dayjs from 'dayjs'
import SVG from "react-inlinesvg";
import { Link, useHistory, useLocation } from 'react-router-dom'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'
import { FormattedMessage, useIntl } from 'react-intl'
import { Dropdown } from 'react-bootstrap'
import { useMutation } from '@apollo/client'
import mutate_scProductSyncUp from '../../../../graphql/mutate_scProductSyncUp'
import { useToasts } from 'react-toast-notifications'
import { useProductsUIContext } from '../ProductsUIContext'
import mutate_scProductRemoveOnStore from '../../../../graphql/mutate_scProductRemoveOnStore'

export default memo(({ product, op_connector_channels, sc_stores, onHide, onConfirmSyncDown, setStoreDisconnect }) => {
    const history = useHistory()
    const [isExpand, setIsExpand] = useState(false)
    const {formatMessage} = useIntl()
    let variants = isExpand ? product.productVariants : product.productVariants.slice(0, 2)
    let canExpand = product.productVariants.length > 2

    let _store = sc_stores.find(_st => _st.id == product.store_id)
    let _channel = op_connector_channels.find(_st => _st.code == product.connector_channel_code)


    const renderAction = useMemo(() => {
        return (
            <Dropdown drop='down' >
                <Dropdown.Toggle className='btn-outline-secondary' >
                    {formatMessage({defaultMessage:'Chọn'})}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                    {
                        product.status == 10 && <Dropdown.Item className="mb-1 d-flex" onClick={async () => {
                            if (_store.status != 1) {
                                setStoreDisconnect([_store.name])
                                return
                            }
                            onHide({
                                action_type: 2,
                                list_product_id: [product.id]
                            })
                        }} >{formatMessage({defaultMessage:'Ẩn sản phẩm'})}</Dropdown.Item>
                    }
                    {
                        product.status == 0 && <Dropdown.Item className="mb-1 d-flex" onClick={async () => {
                            if (_store.status != 1) {
                                setStoreDisconnect([_store.name])
                                return
                            }
                            onHide({
                                action_type: 3,
                                list_product_id: [product.id]
                            })
                        }} >{formatMessage({defaultMessage:'Hiện sản phẩm'})}</Dropdown.Item>
                    }
                    <Dropdown.Item className="mb-1 d-flex" onClick={async () => {
                        if (_store.status != 1) {
                            setStoreDisconnect([_store.name])
                            return
                        }
                        onHide({
                            action_type: 1,
                            list_product_id: [product.id]
                        })
                    }}
                    >{formatMessage({defaultMessage:'Xoá sản phẩm'})}</Dropdown.Item>
                    {
                        !!product.ref_url && <Dropdown.Item className="mb-1 d-flex" href={product.ref_url} target='_blank' >{formatMessage({defaultMessage:'Xem sản phẩm trên sàn'})}</Dropdown.Item>
                    }
                </Dropdown.Menu>
            </Dropdown>
        )
    }, [product.status, product.ref_url, _store.status])

    const renderStatus = useMemo(() => {
        if (product.status == 10)
            return <p className="text-success">{formatMessage({defaultMessage:'Hoạt động'})}</p>
        if (product.status == 1)
            return <p className="text-secondary">{formatMessage({defaultMessage:'Bản nháp'})}</p>
        if (product.status == 0)
            return <p className="text-secondary">{formatMessage({defaultMessage:'Đang ẩn'})}</p>
    }, [product.status])

    let assetUrl = useMemo(() => {
        if (!product.productAssets) {
            return null;
        }
        try {
            let _asset = _.minBy(product.productAssets?.filter(_asset => !_asset.is_video), 'sme_asset_id')
            if (!!_asset) {
                return _asset.sme_url || _asset.ref_url
            }
            return null
        } catch (error) {
            return null
        }
    }, [product.productAssets])

    const onViewDetailInSme = useCallback(() => {
        if (!!product.sme_product_id) {
            history.push(`/products/edit/${product.sme_product_id}`)
        } else {
            onConfirmSyncDown({
                store_id: product.store_id,
                products: [product.id]
            })
        }
    }, [product.sme_product_id])

    return <>
        {
            variants.map((_variant, index) => {
                return (
                    <tr key={`variant--${_variant.id}`} style={(index == variants.length - 1 && !(canExpand)) ? {
                        borderBottom: '1px solid #F0F0F0',
                    } : {
                    }} >
                        {
                            index == 0 && <td className='pt-6 pb-1' style={{ verticalAlign: 'top' }} rowSpan={variants.length + (canExpand ? 1 : 0)} >
                                <div style={{ verticalAlign: 'top', display: 'flex', flexDirection: 'row', marginBottom: 16 }}>
                                    <a href={`/products/edit/${product.sme_product_id}`}
                                        onClick={e => {
                                            e.preventDefault();
                                            onViewDetailInSme()
                                        }}
                                    >
                                        <div style={{
                                            backgroundColor: '#F7F7FA',
                                            width: 80, height: 80,
                                            borderRadius: 8,
                                            overflow: 'hidden',
                                            minWidth: 80
                                        }} className='mr-6' >
                                            {
                                                !!assetUrl && <img src={assetUrl}
                                                    style={{ width: 80, height: 80, objectFit: 'contain' }} />
                                            }
                                        </div>
                                    </a>
                                    <div>
                                        <a href={`/products/edit/${product.sme_product_id}`} style={{ color: 'black' }}
                                            onClick={e => {
                                                e.preventDefault();
                                                onViewDetailInSme()
                                            }}
                                        >
                                            <p className='font-weight-normal mb-2'>{product.name}</p>
                                        </a>
                                        <p className="mb-1 d-flex" style={_store.status == 1 ? {} : { opacity: 0.5 }}  ><img style={{ width: 20, height: 20 }} src={_channel?.logo_asset_url} className="mr-2" /><span >{_store?.name}</span></p>
                                    </div>
                                </div>
                            </td>
                        }
                        <td className='pt-6 pb-1' style={{ verticalAlign: 'top' }}>
                            <div>
                                <p className='font-weight-normal mb-1' >{_variant.name}</p>
                                <p  className='d-flex'><img src={toAbsoluteUrl('/media/ic_sku.svg')} /> {_variant.sku}</p>
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
                            index == 0 && <td className='pt-6' style={{ verticalAlign: 'top', padding: 0, paddingRight: 8 }} rowSpan={variants.length} >
                                {renderAction}
                            </td>
                        }
                    </tr>
                )
            })
        }
        {
            canExpand && (!isExpand ? <tr style={{
                borderBottom: '1px solid #F0F0F0',
            }} >
                <td colSpan='7' className='pt-0' >
                    <a className='d-flex align-items-center ' onClick={e => {
                        e.preventDefault()
                        setIsExpand(true)
                    }} >
                        <span style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.15)', flex: 1 }} />
                        <span className='font-weight-normal mx-4' style={{ color: 'rgba(0,0,0,0.85)' }} >{formatMessage({defaultMessage:`Xem thêm {more} phân loại`}, {more: product.productVariants.length - variants.length})}</span>
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
            </tr>)
        }
    </>
})