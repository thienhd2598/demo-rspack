/*
 * Created by duydatpham@gmail.com on 23/06/2021
 * Copyright (c) 2021 duydatpham@gmail.com
 */
import { useMutation } from '@apollo/client'
import dayjs from 'dayjs'
import _ from 'lodash'
import React, { memo, useMemo, useState } from 'react'
import { Dropdown, OverlayTrigger, Tooltip } from 'react-bootstrap'
import SVG from "react-inlinesvg"
import { FormattedMessage, useIntl } from 'react-intl'
import { Link, useHistory, useLocation } from 'react-router-dom'
import { useToasts } from 'react-toast-notifications'
import { toAbsoluteUrl } from '../../../../_metronic/_helpers'
import { Checkbox } from '../../../../_metronic/_partials/controls'
import HoverImage from '../../../../components/HoverImage'
import InfoProduct from '../../../../components/InfoProduct'
import mutate_scProductSyncUp from '../../../../graphql/mutate_scProductSyncUp'
import { formatNumberToCurrency } from '../../../../utils'

export default memo(({ product, onShowProductConnect, onShowProductConnectVariant, ids, setIds, sc_stores, onDelete, onHide, onShow, setStoreDisconnect, onCopyToStore, onCreateMutilTag, setDataCombo }) => {
    const history = useHistory()
    const location = useLocation()
    const { formatMessage } = useIntl()
    const [isExpand, setIsExpand] = useState(false)
    const [scProductSyncUp] = useMutation(mutate_scProductSyncUp, {
        refetchQueries: ['sme_catalog_product']
    })

    const { addToast } = useToasts();
    const imgAssets = useMemo(() => {
        return _.minBy(product?.sme_catalog_product_assets?.filter(_asset => !_asset.is_video).map(_asset => ({
            ..._asset,
            position_show: _asset.position_show || 0
        })), 'position_show')
    }, [product?.sme_catalog_product_assets])
    const sme_catalog_product_variants = product.sme_catalog_product_variants?.filter(variant => !variant?.product_status_id);
    let variants = isExpand ? sme_catalog_product_variants : sme_catalog_product_variants.slice(0, 4)
    let canExpand = sme_catalog_product_variants.length > 4;
    const [isCopied, setIsCopied] = useState(false);
    const [isHovering, setIsHovering] = useState(false);
    const handleMouseEnter = (id) => {
        setIsHovering(id);
    }

    const handleMouseLeave = () => {
        setIsHovering(false);
    }

    const _attributesWarehouse = (data) => {
        const item_attributes = data.attributes;
        let attributes = [];
        if (item_attributes && item_attributes.length > 0) {
            for (let index = 0; index < item_attributes.length; index++) {
                const element = item_attributes[index];
                attributes.push(`${element.sme_catalog_product_attribute_value?.name}`);

            }
            return attributes.join(' - ');
        }
        return null
    }

    const infoVariant = (_variant, index = 0, hasAttribute = true) => {
        return (
            <>
                <td style={{ verticalAlign: 'top', borderRight: 'none' }} >
                    <div style={{ verticalAlign: 'top', display: 'flex', flexDirection: 'row' }}>
                        <div>
                            <div>
                                <div className='d-flex align-items-center'>
                                    <InfoProduct
                                        name={''}
                                        short={true}
                                        sku={_variant?.sku}
                                        url={`#`}
                                    />
                                    {
                                        _variant?.is_combo == 1 && (
                                            <span onClick={() => setDataCombo(_variant.combo_items)} className='text-primary cursor-pointer ml-2'>Combo</span>
                                        )
                                    }
                                </div>
                                {hasAttribute && <p className='font-weight-normal mb-2 fs-12 text-secondary-custom' >{_attributesWarehouse(_variant)}</p>}
                            </div>
                        </div>
                    </div>


                    {index == 2 && canExpand && !isExpand && (
                        <div className='mt-8'>
                            <a className='d-flex align-items-center' onClick={e => {
                                e.preventDefault()
                                setIsExpand(true)
                            }} >
                                <span style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.15)', flex: 1 }} />
                                <span className='font-weight-normal mx-4 fs-14' style={{ color: 'rgba(0,0,0,0.85)' }} >{formatMessage({ defaultMessage: `Xem thêm {skus} SKU` }, { skus: (sme_catalog_product_variants.length - variants.length) })}</span>
                                <span style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.15)', flex: 1 }} />
                            </a>
                        </div>
                    )
                    }

                    {index == variants.length - 2 && canExpand && isExpand && (
                        <div className='mt-8'>
                            <a className='d-flex align-items-center' onClick={e => {
                                e.preventDefault()
                                setIsExpand(false)
                            }} >
                                <span style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.15)', flex: 1 }} />
                                <span className='font-weight-normal mx-4 fs-14' style={{ color: 'rgba(0,0,0,0.85)' }} >{formatMessage({ defaultMessage: `Thu gọn` })}</span>
                                <span style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.15)', flex: 1 }} />
                            </a>
                        </div>
                    )
                    }
                </td>
                <td style={{ verticalAlign: 'top', borderRight: 'none', borderLeft: 'none' }} className="fs-12 text-center borderRight" >
                    <span>
                        <b>{typeof _variant.cost_price == 'number' ? formatNumberToCurrency(_variant.cost_price, 3) + ' đ' : '--'}</b>
                    </span>
                </td>
                <td style={{ verticalAlign: 'top', borderLeft: 'none' }} className="fs-12 text-center" >
                    <span className='m-0'>
                        <b>{typeof _variant.vat_rate == 'number' ? `${_variant?.vat_rate}%` : '--'}</b>
                    </span>
                </td>
            </>
        )
    }

    // let hasAttribute = variants.length > 0 && variants[0].attributes.length > 0;
    const isSelected = ids.some(_id => _id.id == product.id)

    const onCopyToClipBoard = async (text) => {
        await navigator.clipboard.writeText(text);
        setIsCopied(true);
        setTimeout(
            () => {
                setIsCopied(false);
            }, 1500
        )
    };

    return <>
        <tr className="acd borderRight">
            <td style={{ verticalAlign: 'top', borderRight: 'none' }} rowSpan={variants.length || 1}>
                <Checkbox
                    inputProps={{
                        'aria-label': 'checkbox',
                    }}
                    isSelected={isSelected}
                    onChange={(e) => {
                        if (isSelected) {
                            setIds(prev => prev.filter(_id => _id.id != product.id))
                        } else {
                            setIds(prev => prev.concat([product]))
                        }
                    }}
                />
            </td>
            <td style={{ verticalAlign: 'top', borderLeft: 'none' }} rowSpan={variants.length || 1} >
                <div style={{ verticalAlign: 'top', display: 'flex', flexDirection: 'row' }}>
                    <Link to={!!product.is_combo ? `/products/edit-combo/${product.id}` : `/products/edit/${product.id}`}>
                        <div style={{
                            backgroundColor: '#F7F7FA',
                            width: 68, height: 68,
                            borderRadius: 8,
                            overflow: 'hidden',
                            minWidth: 68
                        }} className='mr-6' >
                            {
                                !!imgAssets && <HoverImage placement="right" defaultSize={{ width: 68, height: 68 }} size={{ width: 320, height: 320 }} url={imgAssets?.asset_url} />
                            }
                        </div>
                    </Link>
                    <div className='w-100'>
                        <InfoProduct
                            name={product.name}
                            short={true}
                            sku={product.sku}
                            url={!!product.is_combo ? `/products/edit-combo/${product.id}` : `/products/edit/${product.id}`}
                        />
                    </div>
                </div>
            </td>


            {variants.slice(0, 1).map((_variant, index) => {
                return infoVariant(_variant, index)
            })}
        </tr>
        {
            variants.slice(1).map((_variant, index) => {
                return (
                    <tr className='borderRight'>
                        {infoVariant(_variant, index)}
                    </tr>
                )
            })
        }
    </>
})