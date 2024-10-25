/*
 * Created by duydatpham@gmail.com on 23/06/2021
 * Copyright (c) 2021 duydatpham@gmail.com
 */
import { Divider } from '@material-ui/core'
import React, { memo, useCallback, useMemo, useState } from 'react'
import { toAbsoluteUrl } from '../../../../_metronic/_helpers'
import { Checkbox } from '../../../../_metronic/_partials/controls'
import _, { sum } from 'lodash'
import { formatNumberToCurrency } from '../../../../utils'
import dayjs from 'dayjs'
import SVG from "react-inlinesvg";
import { Link, useHistory, useLocation } from 'react-router-dom'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'
import { FormattedMessage } from 'react-intl'
import { Dropdown } from 'react-bootstrap'
import { useMutation } from '@apollo/client'
import mutate_scProductSyncUp from '../../../../graphql/mutate_scProductSyncUp'
import { useToasts } from 'react-toast-notifications'
import { useProductsUIContext } from '../ProductsUIContext'
import InfoProduct from '../../../../components/InfoProduct'
import { useIntl } from 'react-intl'
import HoverImage from '../../../../components/HoverImage'
import AuthorizationWrapper from '../../../../components/AuthorizationWrapper'
import { useSelector } from 'react-redux'
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

export default memo(({ product, onShowProductConnect, onShowProductConnectVariant, sc_stores, onDelete, onHide, onShow, setStoreDisconnect, onCopyToStore, onCreateMutilTag, setDataCombo }) => {
    const history = useHistory()
    const location = useLocation()
    const { formatMessage } = useIntl()
    const [isExpand, setIsExpand] = useState(false)
    const { ids, setIds } = useProductsUIContext();
    const [scProductSyncUp] = useMutation(mutate_scProductSyncUp, {
        refetchQueries: ['sme_catalog_product']
    })
    const user = useSelector((state) => state.auth.user);
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


    const renderAction = useMemo(() => {
        if (location.pathname == '/products/list') {
            return (
                <Dropdown drop='down' >
                    <Dropdown.Toggle className='btn-outline-secondary' >
                        {formatMessage({ defaultMessage: 'Chọn' })}
                    </Dropdown.Toggle>

                    <Dropdown.Menu>
                        {/* {
                            product.status == 0 && <Dropdown.Item className="mb-1 d-flex" onClick={async e => {
                                if (_checkStoreDisconnect()) {
                                    return
                                }
                                // await _syncUp(product.id)
                                onShow([product])
                                return
                            }} >Hiện sản phẩm</Dropdown.Item>
                        }
                        {
                            product.status == 10 && <Dropdown.Item className="mb-1 d-flex" onClick={async e => {
                                if (_checkStoreDisconnect()) {
                                    return
                                }
                                onHide([product])
                                return
                            }} >Ẩn sản phẩm</Dropdown.Item>
                        } */}
                        <AuthorizationWrapper keys={['product_detail']}>
                            <Dropdown.Item className="mb-1 d-flex" onClick={async e => {
                                e.preventDefault();

                                if (!!product?.is_combo) {
                                    window.open(`/products/edit-combo/${product?.id}`, '_blank')
                                } else {
                                    window.open(`/products/edit/${product?.id}`, '_blank')
                                }
                            }} >{formatMessage({ defaultMessage: 'Chỉnh sửa' })}</Dropdown.Item>
                        </AuthorizationWrapper>
                        <AuthorizationWrapper keys={['product_action']}>
                            <Dropdown.Item className="mb-1 d-flex" onClick={async e => {
                                onCreateMutilTag([product])
                                return
                            }} >{formatMessage({ defaultMessage: 'Thêm tag sản phẩm' })}</Dropdown.Item>
                            {/* <Dropdown.Item className="mb-1 d-flex" onClick={async e => {
                            }} >{formatMessage({ defaultMessage: 'Đẩy tồn' })}</Dropdown.Item> */}
                            <Dropdown.Item className="mb-1 d-flex" onClick={async e => {
                                onDelete([product])
                                return
                            }} >{formatMessage({ defaultMessage: 'Xoá sản phẩm' })}</Dropdown.Item>
                        </AuthorizationWrapper>
                        {/* <Dropdown.Item className="mb-1 d-flex" onClick={async e => {
                            e.preventDefault();
                            window.open(`/products/edit/${product?.id}/affiliate`, '_blank')
                        }} >Liên kết sản phẩm trên sàn</Dropdown.Item> */}
                        <AuthorizationWrapper keys={['product_create_store_product']}>
                            <Dropdown.Item className="mb-1 d-flex" onClick={async e => {
                                onCopyToStore(product)
                            }} >{formatMessage({ defaultMessage: 'Tạo sản phẩm sàn từ sản phẩm kho' })}</Dropdown.Item>
                        </AuthorizationWrapper>
                    </Dropdown.Menu>
                </Dropdown>
            )
        }

        return (
            <OverlayTrigger
                overlay={
                    <Tooltip>
                        <FormattedMessage defaultMessage="Lưu xuống UpBase" />
                    </Tooltip>
                }
            >
                <a
                    className="btn btn-icon btn-light btn-sm"
                    to={'#'}
                    onClick={() => { }}
                >
                    <span className="svg-icon svg-icon-md svg-icon-control">
                        <SVG src={toAbsoluteUrl("/media/svg/icons/General/Update.svg")} />
                    </span>
                </a>
            </OverlayTrigger>
        )
    }, [location.pathname, product])


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
                                <AuthorizationWrapper keys={['product_store_connect_view']}>
                                <p
                                    className={`${_variant.sc_variant_linked_aggregate.aggregate.count ? 'text-primary cursor-pointer' : "text-secondary-custom"} ` + 'fs-12 mb-0'}
                                    onClick={() => {
                                        if(user?.is_subuser && !['product_store_connect_view']?.some(key => user?.permissions?.includes(key))) {
                                            return
                                        }
                                        if (_variant.sc_variant_linked_aggregate.aggregate.count == 0) return;
                                        onShowProductConnectVariant(_variant.id);
                                    }}
                                >

                                    {_variant.sc_variant_linked_aggregate.aggregate.count || 0} {formatMessage({ defaultMessage: 'liên kết' })}
                                </p>
                                </AuthorizationWrapper>
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
                <td style={{ verticalAlign: 'top', borderRight: 'none', borderLeft: 'none' }} className="fs-12 borderRight" >
                    <p className='m-0'><b>{typeof _variant.price == 'number' ? formatNumberToCurrency(_variant.price) + ' đ' : '--'}</b></p>
                    {/* <p className='m-0'>{formatMessage({ defaultMessage: 'Giá vốn' })}: {typeof _variant.cost_price == 'number' ? formatNumberToCurrency(_variant.cost_price) + ' đ' : '--'}</p>
                    <p className='m-0'>{formatMessage({ defaultMessage: 'VAT' })}: {typeof _variant.vat_rate == 'number' ? `${_variant?.vat_rate}%` : '--'}</p> */}
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
                        <AuthorizationWrapper keys={['product_store_connect_view']}>
                        <span
                            className={`${product?.scProductMapping?.length ? 'text-primary cursor-pointer' : "text-secondary-custom"} ` + 'fs-12'}
                            onClick={() => {
                                if(user?.is_subuser && !['product_store_connect_view']?.some(key => user?.permissions?.includes(key))) {
                                    return
                                }
                                if (product?.scProductMapping?.length === 0) return;

                                onShowProductConnect(product?.scProductMapping?.map(_scProduct => _scProduct.sc_product_id), false, product.id);
                            }}
                        >
                            {product?.scProductMapping?.length || 0} {formatMessage({ defaultMessage: 'liên kết' })}
                        </span>
                        </AuthorizationWrapper>
                    </div>
                </div>
            </td>

            {/* {

                !hasAttribute ? variants[0] ?
                    (
                        infoVariant(variants[0], 0, false)
                    ) : (
                        <>
                            <td></td>
                            <td></td>
                            <td></td>
                        </>
                    ) : null
            }
 */}


            {
                variants.slice(0, 1).map((_variant, index) => {
                    return infoVariant(_variant, index)
                })}

            <td className='pt-6 fs-14' style={{ verticalAlign: 'top', whiteSpace: 'pre-wrap' }} rowSpan={variants.length || 1}>
                {
                    dayjs(product.updated_at).format('DD/MM/YYYY[\n]HH:mm')
                }
            </td>
            <td className='pt-6 text-center fs-14' style={{ verticalAlign: 'top', padding: 0 }} rowSpan={variants.length || 1} >
                {renderAction}
            </td>
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