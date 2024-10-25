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
import { useToasts } from 'react-toast-notifications'
import { useProductsUIContext } from '../ProductsUIContext'
import { PRODUCT_SYNC_STATUS } from '../ProductsUIHelpers'
import mutate_scProductSyncUpOnly from '../../../../graphql/mutate_scProductSyncUpOnly'

const CustomToggle = React.forwardRef(({ children, onClick }, ref) => (
    <a
        href=""
        ref={ref}
        onClick={(e) => {
            e.preventDefault();
            onClick(e);
        }}
    >
        {children}
    </a>
));

export default memo(({ product, op_connector_channels, sc_stores, setStoreDisconnect }) => {
    const history = useHistory()
    const location = useLocation()
    const [isExpand, setIsExpand] = useState(false)
    const { ids, setIds } = useProductsUIContext();
    const [scProductSyncUp, { loading }] = useMutation(mutate_scProductSyncUpOnly, {
        refetchQueries: ['scGetUpbaseSmeProducts', 'scStatisticUpbaseSmeProducts']
    })
    const { addToast } = useToasts();
    const { formatMessage } = useIntl()
    const isSelected = ids.some(_id => _id.id == product.id)
    let _store = sc_stores.find(_st => _st.id == product.store_id)
    let _channel = op_connector_channels.find(_st => _st.code == product.connector_channel_code)



    const _syncUp = useCallback(async (sme_product_id, id) => {
        let { data, errors } = await scProductSyncUp({
            variables: {
                products: [id]
            }
        })

        if (!!errors || !data.scProductSyncUp.success) {
            if (!!errors)
                addToast(errors[0].message, { appearance: 'error' });
            else {
                addToast(data.scProductSyncUp.message, { appearance: 'error' });
            }
        } else {
            addToast(formatMessage({defaultMessage:'Bắt đầu đồng bộ lên gian gian hàng'}), { appearance: 'success' });
        }
    }, [])

    const renderAction = useMemo(() => {
        if (product.sync_status == PRODUCT_SYNC_STATUS.SYNC_STATUS_ERROR ||
            product.sync_status == PRODUCT_SYNC_STATUS.SYNC_STATUS_LOADED ||
            product.sync_status == PRODUCT_SYNC_STATUS.SYNC_STATUS_OUT_OF_SYNC)
            return (
                <p style={{ textAlign: 'center' }} >
                    <OverlayTrigger
                        overlay={
                            <Tooltip>
                                {formatMessage({defaultMessage:"Đồng bộ"})}
                            </Tooltip>
                        }
                    >
                        <button
                            className="btn btn-icon btn-light btn-sm"
                            onClick={e => {
                                e.preventDefault();
                                if (_store.status == 1)
                                    _syncUp(product.sme_product_id, product.id)
                                else {
                                    setStoreDisconnect([_store.name])
                                }
                            }}
                            disabled={loading}
                        >
                            {
                                loading ? <span className="spinner spinner-primary mr-6" /> : <span className="svg-icon svg-icon-md svg-icon-control">
                                    <SVG src={toAbsoluteUrl("/media/svg/ic-sync.svg")} />
                                </span>
                            }
                        </button>
                    </OverlayTrigger>
                </p>
            )
        // if (product.sync_status == PRODUCT_SYNC_STATUS.SYNC_STATUS_SYNCING)
        //     return (
        //         <p style={{ textAlign: 'center' }} >
        //             <OverlayTrigger
        //                 overlay={
        //                     <Tooltip>
        //                         Huỷ đồng bộ
        //                     </Tooltip>
        //                 }
        //             >
        //                 <button
        //                     className="btn btn-icon btn-light btn-sm"
        //                     onClick={e => {
        //                         e.preventDefault();
        //                         // history.push(`/setting/channels/sync-confirm/${row.id}`)
        //                     }}
        //                 >
        //                     <span className="svg-icon svg-icon-md svg-icon-control">
        //                         <SVG src={toAbsoluteUrl("/media/svg/ic-cancel-sync.svg")} />
        //                     </span>
        //                 </button>
        //             </OverlayTrigger>
        //         </p>
        //     )
    }, [product, loading, _store])

    const renderStatus = useMemo(() => {
        if (product.sync_status == PRODUCT_SYNC_STATUS.SYNC_STATUS_SYNCED)
            return <p className="text-success">{formatMessage({defaultMessage:"Đã đồng bộ"})}</p>
        if (product.sync_status == PRODUCT_SYNC_STATUS.SYNC_STATUS_ERROR)
            return <>
                <span className="text-danger">{formatMessage({defaultMessage:"Đồng bộ lỗi"})} </span>
                <OverlayTrigger
                    placement='bottom'
                    overlay={
                        <Tooltip>
                            {product.sync_error_message}
                        </Tooltip>
                    }
                >
                    <i className="flaticon-warning text-danger"></i>
                </OverlayTrigger>
            </>
        if (product.sync_status == PRODUCT_SYNC_STATUS.SYNC_STATUS_LOADED)
            return <p className="text-secondary">{formatMessage({defaultMessage:"Đã tải"})}</p>
        if (product.sync_status == PRODUCT_SYNC_STATUS.SYNC_STATUS_SYNCING)
            return <p className="text-warning">{formatMessage({defaultMessage:"Đang đồng bộ"})}</p>
        if (product.sync_status == PRODUCT_SYNC_STATUS.SYNC_STATUS_OUT_OF_SYNC)
            return <p className="text-warning">{formatMessage({defaultMessage:"Đang đồng bộ"})}</p>
    }, [product.sync_status])

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

    return <tr style={{
        borderBottom: '1px solid #F0F0F0',
    }} >
        <td className='pt-6 pb-1' style={{ verticalAlign: 'top' }}>
            <Checkbox
                inputProps={{
                    'aria-label': 'checkbox',
                }}
                isSelected={isSelected}
                onChange={(e) => {
                    if (isSelected) {
                        setIds(prev => prev.filter(_id => _id.id != product.id))
                    } else {
                        setIds(prev => prev.concat([{
                            id: product.id,
                            sme_product_id: product.sme_product_id,
                            sync_status: product.sync_status,
                            store_status: _store.status,
                            store_name: _store.name
                        }]))
                    }
                }}
            />
        </td>
        <td className='pt-6 pb-1' style={{ verticalAlign: 'top' }}  >
            <div style={{ verticalAlign: 'top', display: 'flex', flexDirection: 'row', marginBottom: 16 }}>
                <Link to={`/products/edit/${product.sme_product_id}`} >
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
                </Link>
                <div>
                    <Link to={`/products/edit/${product.sme_product_id}`} style={{ color: 'black' }} >
                        <p className='font-weight-normal mb-2' >{product.name}</p>
                    </Link>
                    {
                        product?.productVariants?.length <= 2 && product?.productVariants?.map(_variant => {
                            return (
                                <div key={_variant.sku} >
                                    <p className='mb-1' ><img src={toAbsoluteUrl('/media/ic_sku.svg')} /> {_variant.sku}</p>
                                </div>
                            )
                        })
                    }
                    {
                        product?.productVariants?.length > 2 && (
                            <Dropdown drop='down' >
                                <Dropdown.Toggle as={CustomToggle} id="dropdown-custom-components">
                                    <span className="svg-icon svg-icon-md svg-icon-control  mr-2" >
                                        <SVG src={toAbsoluteUrl("/media/svg/ic_add_primary_.svg")} />
                                    </span>
                                    <span >{product?.productVariants?.length} SKU</span>
                                </Dropdown.Toggle>

                                <Dropdown.Menu>
                                    {
                                        product?.productVariants?.map((_variant, index) => {
                                            return (
                                                <Dropdown.Item key={`prod-${index}`} className="mb-1 d-flex"  ><p className='mb-1' ><img src={toAbsoluteUrl('/media/ic_sku.svg')} /> {_variant.sku}</p></Dropdown.Item>
                                            )
                                        })
                                    }
                                </Dropdown.Menu>
                            </Dropdown>
                        )
                    }

                </div>
            </div>
        </td>
        <td className='pt-6 pb-1' style={{ verticalAlign: 'top' }}>
            <p className="mb-1 d-flex" style={_store.status == 1 ? {} : { opacity: 0.5 }}  ><img style={{ width: 20, height: 20 }} src={_channel?.logo_asset_url} className="mr-2" /><span >{_store?.name}</span></p>
        </td>
        <td className='pt-6 pb-1' style={{ verticalAlign: 'top' }}>
            {/* hh:mm dd/mm/yyyy */}
            {(product.synced_up_at || product.synced_down_at) ? dayjs(product.synced_up_at || product.synced_down_at).format('HH:mm DD/MM/YYYY') : ''}
        </td>
        <td className='pt-6' style={{ verticalAlign: 'top' }} >
            {renderStatus}
        </td>
        <td className='pt-6' style={{ verticalAlign: 'top', padding: 0, paddingRight: 8 }} >
            {renderAction}
        </td>
    </tr>
})