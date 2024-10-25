import { Divider } from '@material-ui/core'
import React, { memo, useCallback, useMemo, useState } from 'react'

import { Link, useHistory, useLocation } from 'react-router-dom'
import {  OverlayTrigger, Tooltip } from 'react-bootstrap'
import InfoProduct from '../../../../../components/InfoProduct'
import {
    Card,
    CardBody,
} from "../../../../../_metronic/_partials/controls";
import ModalSmeProductConnect from '../../report-product/components/ModalSmeProductConnect'
import { useIntl } from 'react-intl'
import { useQuery } from '@apollo/client'
import query_sc_stores_basic from '../../../../../graphql/query_sc_stores_basic'
import { toAbsoluteUrl } from "../../../../../_metronic/_helpers";
import ModalStock from './ModalStock'

export default memo(({dataProduct, type}) => {
    const [currentVariantConnect, setCurrentVariantConnect] = useState(null);
    const {formatMessage} = useIntl()
    const [dataStock, setDataStock] = useState(null)
    const [title, setTitle] = useState('')

    const { data: dataStore, loading: loadingStore } = useQuery(query_sc_stores_basic, {
        variables: {
            context: 'order'
        },
        fetchPolicy: 'cache-and-network'
    });
    console.log(dataProduct)
    const url = useMemo(() => {
        if(type =='warehouse') {
            if (dataProduct?.attributes?.length > 0) {
                return `/products/stocks/detail/${dataProduct?.id}`;
            } else {
                return `/products/edit/${dataProduct?.sme_catalog_product?.id}`;
            }
        } else {
            return `/product-stores/edit/${dataProduct?.product?.id}`;
        }
    }, [type, dataProduct])

    let imgOrigin = useMemo(() => (dataProduct?.product?.productAssets || []).find(_asset => _asset?.type == 4), [dataProduct])
    const productAsset = useMemo(() => !!imgOrigin && !!imgOrigin.template_image_url ? imgOrigin?.sme_url : (dataProduct?.product?.productAssets || []).filter(_asset => _asset?.type == 1)[0]?.sme_url, [imgOrigin, dataProduct])

    const currentStore = useMemo(() => {
        const _store = dataStore?.sc_stores?.find(store => store?.id == dataProduct?.product?.store_id)
        const _channel = dataStore?.op_connector_channels?.find(channel => channel?.code == _store?.connector_channel_code)    
        return {
            ..._store,
            channel: _channel
        }    
    }, [dataProduct, dataStore])

    return <>
        {!!currentVariantConnect && (
            <ModalSmeProductConnect
                dataStore={dataStore}
                variantId={currentVariantConnect}
                onHide={() => setCurrentVariantConnect(null)}
            />
        )}
        {!!dataStock && 
            <ModalStock 
                dataStock={dataStock}
                title={title}
                onHide={() => setDataStock(null)}
            />}
        <Card style={{marginBottom: '12px'}}>
            <CardBody>
            <div className='row'>
                <div className={type == 'warehouse' ? 'col-6' : 'col-12'}>
                <div className='d-flex align-items-center'>
                    {
                        type == 'warehouse' && (
                            <>
                                <div
                                    style={{
                                        backgroundColor: '#F7F7FA',
                                        width: 60, height: 60,
                                        borderRadius: 8,
                                        overflow: 'hidden',
                                        minWidth: 60,
                                        cursor: 'pointer'
                                    }}
                                    onClick={e => {
                                        e.preventDefault();
                                    }}
                                    className='mr-6'
                                >
                                    <img
                                        src={dataProduct?.sme_catalog_product_variant_assets[0]?.asset_url}
                                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                        onClick={() => window.open(url, '_blank')}
                                    />
                                </div>
                                <div>
                                    <InfoProduct
                                        name={dataProduct?.variant_full_name}
                                        sku={dataProduct?.sku}
                                        url={() => window.open(url, '_blank')}
                                        short={true}
                                        productOrder={true}
                                    />
                                    <span
                                        className="text-primary cursor-pointer"
                                        onClick={() => setCurrentVariantConnect(dataProduct?.id)}
                                    >
                                        {formatMessage({ defaultMessage: '{count} liên kết' }, { count: dataProduct?.sc_variant_linked?.length })}
                                    </span>
                                </div>
                            </>
                        )
                    }
                    {
                        type == 'channel' && (
                            <div style={{ verticalAlign: 'center', display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                                <div
                                    style={{
                                        backgroundColor: '#F7F7FA',
                                        width: 60, height: 60,
                                        borderRadius: 8,
                                        overflow: 'hidden',
                                        minWidth: 60,
                                        cursor: 'pointer'
                                    }}
                                    onClick={e => {
                                        e.preventDefault();
                                    }}
                                    className='mr-6'
                                >
                                    <img
                                        src={dataProduct?.asset?.sme_url || productAsset}
                                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                        onClick={() => window.open(url, '_blank')}
                                    />
                                </div>
                                <div className="w-100" style={{ display: 'flex', flexDirection: 'column' }}>
                                    <InfoProduct
                                        url={() => window.open(url, '_blank')}
                                        short={true}
                                        name={dataProduct?.product?.name}
                                        sku={dataProduct?.sku}
                                        productOrder={true}
                                    />
                                    <div>
                                        {dataProduct?.product?.productVariantAttributes?.length > 0 ? dataProduct?.name : ''}
                                    </div>
                                    <div>
                                        {currentStore ? <div className="d-flex justify-content-start align-items-center">
                                            <img
                                                className="mr-2"
                                                src={toAbsoluteUrl(`/media/logo_${currentStore?.connector_channel_code}.png`)}
                                                style={{ width: 20, height: 20, objectFit: "contain" }}
                                            />
                                            <span>
                                                {currentStore?.name}
                                            </span>
                                        </div> : ''}
                                    </div>
                                </div>
                            </div>
                        )
                    }
                    </div>
                </div>
                {type == 'warehouse' && <div className='col-6'>
                    <div className='row h-100 align-items-center'>
                        <div className='col-4'>
                            <span>{formatMessage({defaultMessage: 'Tồn sẵn bán: '})} </span>
                            <span className="text-primary cursor-pointer" onClick={() => {
                                setTitle(formatMessage({defaultMessage: 'Tồn sẵn bán'}))
                                setDataStock(dataProduct?.inventories?.map(wh => ({
                                    sme_store_id: wh?.sme_store_id,
                                    stock: wh?.stock_available
                                })))
                            }}>{dataProduct?.inventory?.stock_available}</span>
                        </div>
                        <div className='col-4'>
                            <span>{formatMessage({defaultMessage: 'Tồn tạm giữ: '})} </span>
                            <span className="text-primary cursor-pointer" onClick={() => {
                                setTitle(formatMessage({defaultMessage: 'Tồn tạm giữ'}))
                                setDataStock(dataProduct?.inventories?.map(wh => ({
                                    sme_store_id: wh?.sme_store_id,
                                    stock: wh?.stock_allocated
                                })))
                            }}>{dataProduct?.inventory?.stock_allocated}</span>
                        </div>
                        <div className='col-4'>
                            <span>{formatMessage({defaultMessage: 'Tồn dự trữ: '})} </span>
                            <span className="text-primary cursor-pointer" onClick={() => {
                                setTitle(formatMessage({defaultMessage: 'Tồn dự trữ'}))
                                setDataStock(dataProduct?.inventories?.map(wh => ({
                                    sme_store_id: wh?.sme_store_id,
                                    stock: wh?.stock_reserve
                                })))
                            }}>{dataProduct?.inventory?.stock_reserve}</span>
                        </div>
                        <div className='col-4'>
                            <span>{formatMessage({defaultMessage: 'Tồn thực tế: '})} </span>
                            <span className="text-primary cursor-pointer" onClick={() => {
                                setTitle(formatMessage({defaultMessage: 'Tồn thực tế'}))
                                setDataStock(dataProduct?.inventories?.map(wh => ({
                                    sme_store_id: wh?.sme_store_id,
                                    stock: wh?.stock_actual
                                })))
                            }}>{dataProduct?.inventory?.stock_actual}</span>
                        </div>
                        <div className='col-8'>
                            <span>{formatMessage({defaultMessage: 'Tồn đang vận chuyển: '})} </span>
                            <span className="text-primary cursor-pointer" onClick={() => {
                                setTitle(formatMessage({defaultMessage: 'Tồn đang vận chuyển'}))
                                setDataStock(dataProduct?.inventories?.map(wh => ({
                                    sme_store_id: wh?.sme_store_id,
                                    stock: wh?.stock_shipping
                                })))
                            }}>{dataProduct?.inventory?.stock_shipping}</span>
                        </div>
                    </div>
                </div>}
            </div>
            </CardBody>
        </Card>
    </>
})