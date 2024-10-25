/*
 * Created by duydatpham@gmail.com on 23/06/2021
 * Copyright (c) 2021 duydatpham@gmail.com
 */
import dayjs from 'dayjs'
import _ from 'lodash'
import React, { memo, useCallback, useMemo, useState } from 'react'
import { Dropdown, Modal, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { useHistory, useLocation } from 'react-router-dom';
import { useToasts } from 'react-toast-notifications'
import { formatNumberToCurrency } from '../../../../utils'
import { toAbsoluteUrl } from '../../../../_metronic/_helpers'
import { Checkbox } from '../../../../_metronic/_partials/controls'
import { useMutation, useQuery } from '@apollo/client';
import { useProductsUIContext } from '../ProductsUIContext'
import OutsideClickHandler from 'react-outside-click-handler';
import mutate_scSettingVariant from '../../../../graphql/mutate_scSettingVariant'
import mutate_scSettingLinkProduct from '../../../../graphql/mutate_scSettingLinkProduct'
import { queryCheckExistSkuMain } from '../../Products/ProductsUIHelpers'
import InfoProduct from '../../../../components/InfoProduct'
import { useIntl } from 'react-intl'
import HoverImage from '../../../../components/HoverImage'
import queryString from 'querystring';
import * as uiHelpers from '../ProductsUIHelpers';
import query_mktGetCampaignByVariant from '../../../../graphql/query_mktGetCampaignByVariant';
import AuthorizationWrapper from '../../../../components/AuthorizationWrapper';
import { useSelector } from 'react-redux';

export default memo(({ product, op_connector_channels, sc_stores, onHide, onReload, onConfirmSyncDown, setStoreDisconnect, onCreateMutilTag, onLink, currentProductSync, onSetCurrentProductSync, onLinkVariant, onSyncProduct, onShowProductConnect, onShowProductVariantConnect, onCheckExistSku, onShowInventory, setOpenModalCampaign, setCampaignList, dataCampaign, smeVariants }) => {
    const { formatMessage } = useIntl();
    const history = useHistory();
    const { addToast } = useToasts();
    const [isExpand, setIsExpand] = useState(false);
    const { ids, setIds } = useProductsUIContext();
    const params = queryString.parse(useLocation().search.slice(1, 100000));
    const productVariants = product.productVariants;
    const user = useSelector((state) => state.auth.user);
    // const {data: dataCampaign, loading: loadingCampaign} = useQuery(query_mktGetCampaignByVariant, {
    //     variables: {
    //         list_sc_variant_id: product?.productVariants?.map(item => item.id)
    //     }
    // })
    const campaignByVariant = dataCampaign?.mktGetCampaignByVariant?.flatMap(campaign => {
        return campaign?.campaignItem?.map(item => {
            return {...item, 
                end_time: campaign.end_time,
                discount_type: campaign.discount_type,
                start_time: campaign.start_time,
                status: campaign.status,
                name: campaign?.name,
                type: campaign?.type
            }
        })
    })

    const [scSettingVariant, { loading: loadingSettingVariant }] = useMutation(mutate_scSettingVariant, {
        awaitRefetchQueries: true,
        refetchQueries: ['sc_product', 'sme_catalog_product_by_pk']
    });
    const [scSettingLinkProduct] = useMutation(mutate_scSettingLinkProduct, {
        awaitRefetchQueries: true,
        refetchQueries: ['ScGetSmeProducts']
    })


    let variants = isExpand ? productVariants : productVariants.slice(0, 4)
    let canExpand = productVariants.length > 4

    let _store = sc_stores.find(_st => _st.id == product.store_id)
    let _channel = op_connector_channels.find(_st => _st.code == product.connector_channel_code)
    console.log(_store)
    const [isCopied, setIsCopied] = useState(false);

    const [isHovering, setIsHovering] = useState(false);

    const handleMouseEnter = (id) => {
        setIsHovering(id);
    }

    const handleMouseLeave = () => {
        setIsHovering(false);
    }


    const onCopyToClipBoard = async (text) => {
        await navigator.clipboard.writeText(text);
        setIsCopied(true);
        setTimeout(
            () => {
                setIsCopied(false);
            }, 1500
        )
    };

    const renderSyncAction = useMemo(
        () => {
            if (!product?.sme_product_id) return null;

            const [isSyncMergePrice, isSyncMergeStock] = [
                product?.productVariants?.every(
                    _variant => !!_variant?.merge_price
                ),
                product?.productVariants?.every(
                    _variant => !!_variant?.merge_stock
                ),
            ];

            return (
                <div className="d-flex justify-content-center align-items-center">
                    <OverlayTrigger
                        overlay={
                            <Tooltip>
                                {formatMessage({ defaultMessage: 'Đồng bộ tồn kho' })}
                            </Tooltip>
                        }
                    >
                        <div className="sync-channel-stock">
                            <i
                                className="fas fa-box d-flex justify-content-center align-items-center"
                                style={{
                                    width: 30, height: 30, borderRadius: '50%', fontSize: 12, cursor: 'pointer', marginRight: 6,
                                    ...(isSyncMergeStock ? { color: '#fff', background: '#00DB6D' } : { color: '#888484', background: '#D9D9D9' })
                                }}
                                onClick={() => onSetCurrentProductSync({
                                    id: product?.id,
                                    type: 'stock'
                                })}
                            />
                            {product?.id === currentProductSync?.id && currentProductSync?.type == 'stock' && (
                                <OutsideClickHandler onOutsideClick={() => onSetCurrentProductSync({})}>
                                    <div className="sync-popup-confirm-stock py-6 px-6 d-flex justify-content-between">
                                        <div className="">
                                            <div className="sync-popup-confirm-stock-title mb-2">{formatMessage({ defaultMessage: 'Tự động đồng bộ tồn kho' })}</div>
                                            <span>{formatMessage({ defaultMessage: 'Tự động cập nhật tồn kho mới nhất lên kênh bán này mỗi khi có thay đổi.' })}<br /> {formatMessage({ defaultMessage: 'Ví dụ có đơn hàng từ kênh bán hoặc bạn điều chỉnh tồn kho.' })}</span>
                                        </div>
                                        <span className="switch">
                                            <label>
                                                <input
                                                    type={'checkbox'}
                                                    style={{ background: '#F7F7FA', border: 'none' }}
                                                    onChange={async () => {
                                                        onSyncProduct({
                                                            product_id: product?.id,
                                                            merge_stock: (!product?.merge_stock || product?.merge_stock === 0) ? 1 : 0,
                                                            merge_price: product?.merge_price || 0,
                                                        }, 'stock');
                                                    }}
                                                    checked={isSyncMergeStock}
                                                />
                                                <span></span>
                                            </label>
                                        </span>
                                    </div>
                                </OutsideClickHandler>
                            )}
                        </div>
                    </OverlayTrigger>
                    <OverlayTrigger
                        overlay={
                            <Tooltip>
                                {formatMessage({ defaultMessage: `Đồng bộ giá` })}
                            </Tooltip>
                        }
                    >
                        <div className="sync-channel-stock">
                            <i
                                className="fas fa-dollar-sign d-flex justify-content-center align-items-center"
                                style={{
                                    width: 30, height: 30, borderRadius: '50%', fontSize: 16, cursor: 'pointer', marginRight: 6,
                                    ...(isSyncMergePrice ? { color: '#fff', background: '#00DB6D' } : { color: '#888484', background: '#D9D9D9' })
                                }}
                                onClick={() => onSetCurrentProductSync({
                                    id: product?.id,
                                    type: 'price'
                                })}
                            />
                            {product?.id === currentProductSync?.id && currentProductSync?.type == 'price' && (
                                <OutsideClickHandler onOutsideClick={() => onSetCurrentProductSync({})}>
                                    <div className="sync-popup-confirm-stock py-6 px-6 d-flex justify-content-between">
                                        <div className="">
                                            <div className="sync-popup-confirm-stock-title mb-2">Tự động đồng bộ giá bán</div>
                                            <span>Tự động cập nhật giá bán mới nhất lên kênh bán này mỗi khi có thay đổi.<br /> Ví dụ có đơn hàng từ kênh bán hoặc bạn điều chỉnh giá bán.</span>
                                        </div>
                                        <span className="switch">
                                            <label>
                                                <input
                                                    type={'checkbox'}
                                                    style={{ background: '#F7F7FA', border: 'none' }}
                                                    onChange={async () => {
                                                        onSyncProduct({
                                                            product_id: product?.id,
                                                            merge_stock: product?.merge_stock || 0,
                                                            merge_price: (!product?.merge_price || product?.merge_price === 0) ? 1 : 0,
                                                        }, 'price');
                                                    }}
                                                    checked={isSyncMergePrice}
                                                />
                                                <span></span>
                                            </label>
                                        </span>
                                    </div>
                                </OutsideClickHandler>
                            )}
                        </div>
                    </OverlayTrigger>
                </div>
            )
        }, [product, currentProductSync]
    );

    const renderAction = useMemo(() => {
        return (
            <Dropdown drop='down'>
                <Dropdown.Toggle
                    className='btn-outline-secondary'
                    disabled={product?.status === 3}
                    style={product?.status === 3 ? { cursor: 'not-allowed', opacity: 0.4 } : {}}
                >
                    {formatMessage({ defaultMessage: `Chọn` })}
                </Dropdown.Toggle>
                <Dropdown.Menu style={{ zIndex: 99 }}>
                    <AuthorizationWrapper keys={['product_store_detail']}>
                        <Dropdown.Item className="mb-1 d-flex" onClick={async () => {
                            window.open(`/product-stores/edit/${product.id}`, '_blank')
                        }} >{formatMessage({ defaultMessage: `Chỉnh sửa` })}</Dropdown.Item>
                    </AuthorizationWrapper>
                    <AuthorizationWrapper keys={['product_store_action']}>
                    {!!product?.ref_id && (
                        <Dropdown.Item
                            className="mb-1 d-flex"
                            onClick={async e => {
                                e.preventDefault();
                                if (_store?.status != 1) {
                                    setStoreDisconnect([_store.name])
                                    return
                                }
                                onReload({
                                    product: [product],
                                    isLinked: !!product?.sme_product_id
                                })
                            }}
                        >
                            {formatMessage({ defaultMessage: `Tải lại` })}
                        </Dropdown.Item>
                    )}
                    {
                        product?.status == 10 && !!product.ref_id && <Dropdown.Item className="mb-1 d-flex" onClick={async () => {
                            if (_store?.status != 1) {
                                setStoreDisconnect([_store.name])
                                return
                            }
                            onHide({
                                action_type: 2,
                                list_product_id: [product.id]
                            })
                        }} >
                            {formatMessage({ defaultMessage: `Ẩn sản phẩm` })}
                        </Dropdown.Item>
                    }
                    {
                        product?.status == 0 && <Dropdown.Item className="mb-1 d-flex" onClick={async () => {
                            if (_store?.status != 1) {
                                setStoreDisconnect([_store.name])
                                return
                            }
                            onHide({
                                action_type: 3,
                                list_product_id: [product.id]
                            })
                        }} >
                            {formatMessage({ defaultMessage: `Hiện sản phẩm` })}
                        </Dropdown.Item>
                    }
                    </AuthorizationWrapper>
                    {/* <Dropdown.Item className="mb-1 d-flex" onClick={async e => {
                        onCreateMutilTag([product])
                        return
                    }} >Thêm tag sản phẩm</Dropdown.Item> */}
                    <AuthorizationWrapper keys={['product_store_remove']}>
                        <Dropdown.Item className="mb-1 d-flex" onClick={async () => {
                            if (_store?.status != 1) {
                                setStoreDisconnect([_store.name])
                                return
                            }
                            onHide({
                                action_type: 1,
                                list_product_id: [product.id]
                            })
                        }}
                        >
                            {formatMessage({ defaultMessage: `Xoá sản phẩm` })}
                        </Dropdown.Item>
                    </AuthorizationWrapper>
                    <AuthorizationWrapper keys={['product_store_view']}>
                        {
                            !!product.ref_url && <Dropdown.Item className="mb-1 d-flex" href={product.ref_url} target='_blank' >{formatMessage({ defaultMessage: 'Xem sản phẩm trên sàn' })}</Dropdown.Item>
                        }
                    </AuthorizationWrapper>
                    <AuthorizationWrapper keys={['product_store_create_sme_product']}>
                        <Dropdown.Item onClick={async e => {
                            e.preventDefault();

                            const isPass = !product?.sme_product_id && product?.productVariants?.every(_variant => !_variant?.sme_product_variant_id);
                            if (!isPass) {
                                addToast(formatMessage({ defaultMessage: 'Sản phẩm đã liên kết kho' }), { appearance: 'error' })
                                return;
                            }

                            if(product?.sku) {
                                onCheckExistSku(true);
                                const checkedExistSku = await queryCheckExistSkuMain(null, product?.sku);
                                onCheckExistSku(false);
                                if (!!checkedExistSku) {
                                    addToast(formatMessage({ defaultMessage: 'Sản phẩm đã tồn tại trong kho' }), { appearance: 'error' })
                                    return;
                                }
        
                            }


                            history.push({
                                pathname: '/product-stores/single',
                                state: {
                                    store_id: product?.store_id || null,
                                    products: [product],
                                }
                            })
                        }} className="mb-1 d-flex" >
                            {formatMessage({ defaultMessage: 'Tạo sản phẩm kho' })}
                        </Dropdown.Item>
                    </AuthorizationWrapper>
                </Dropdown.Menu>
            </Dropdown>
        )
    }, [product?.status, product.ref_url, _store?.status, product?.ref_id, product])

    const renderStatus = useMemo(() => {
        if (!product.ref_id || product?.status == 2)
            return <p className="text-secondary">Lưu nháp</p>
        if (product?.status == 10)
            return <p className="text-success">Hoạt động</p>
        if (product?.status == 0)
            return <p className="text-secondary">Đang ẩn</p>
    }, [product?.status])

    let assetUrl = useMemo(() => {
        if (!product.productAssets) {
            return null;
        }
        try {

            let imgOrigin = (product.productAssets || []).find(_asset => _asset.type == 4)

            if (!!imgOrigin && !!imgOrigin.template_image_url) {
                return imgOrigin.sme_url || imgOrigin.ref_url
            }

            let _asset = _.minBy(product.productAssets?.filter(_asset => _asset.type == 1), 'position')
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
    const isSelected = ids.some(_id => _id.id == product.id)
    let hasAttribute = (variants.length == 1 && product.variantAttributeValues?.length > 0) || variants.length > 1;

    const combinationVariant = (variant) => {

        if (hasAttribute) {
            let combinationVariant = [];

            let _sc_product_attributes_value = variant?.sc_product_attributes_value ? JSON.parse(variant?.sc_product_attributes_value) : []
            let _sc_product_variant_attr = product.productVariantAttributes

            let _variantAttributeValue = product.variantAttributeValues?.filter(_value => {
                return _sc_product_attributes_value.includes(_value.ref_index)
            })
            _variantAttributeValue.forEach(variant_attr_value => {
                _sc_product_variant_attr.forEach(variant_attr => {
                    if (variant_attr_value.sc_variant_attribute_id == variant_attr.id) {
                        combinationVariant.push(variant_attr_value.value)
                    }
                });
            });
            return combinationVariant.join(' - ')
        }
    }

    const infoVariant = (_variant, index = 0, hasAttribute = true) => {
        const variantCampaign = campaignByVariant?.filter(campaign => {
            return campaign?.sc_variant_id == _variant?.id && (new Date(campaign?.end_time*1000) > new Date())  && campaign?.status == 2
        })
        const smeVariant = smeVariants?.sme_catalog_product_variant?.find(variant => {
            return variant?.id == _variant?.sme_product_variant_id
        })
        let _asset = null
        try {
            let _sc_product_attributes_value = JSON.parse(_variant.sc_product_attributes_value)
            let _variantAttributeValue = product.variantAttributeValues?.find(_value => {
                return _value.scVariantValueAssets?.length > 0 && _sc_product_attributes_value.some(_v => _v == _value.ref_index)
            })
            if (!!_variantAttributeValue) {
                _asset = _variantAttributeValue.scVariantValueAssets[0]
            }
        } catch (error) {

        }

        return (
            <>
                <td style={{ fontSize: '13px', verticalAlign: 'top', borderRight: 'none' }} >
                    <div style={{ verticalAlign: 'top', display: 'flex', flexDirection: 'row', marginBottom: 5 }} >
                        {/* <div style={{
                            backgroundColor: '#F7F7FA',
                            width: 50, height: 50,
                            borderRadius: 8,

                            overflow: 'hidden',
                            minWidth: 50
                        }} className='mr-6' >
                            {
                                (!!_asset) && <img src={_asset.sme_url}
                                    style={{ width: 50, height: 50, objectFit: 'contain' }} />
                            }
                        </div> */}
                        <div>
                            <InfoProduct
                                short={true}
                                sku={_variant?.sku}
                            />
                            {hasAttribute && <p style={{ verticalAlign: 'top' }} className='font-weight-normal mb-2 text-secondary-custom fs-12'>{combinationVariant(_variant)}</p>}
                            <AuthorizationWrapper keys={['product_store_connect_view']}>
                                {
                                    _variant?.sme_product_variant_id ? <div style={{ display: 'flex', alignItems: 'center' }} >
                                        <a
                                            className='px-2'
                                            style={{ backgroundColor: '#ff5629', fontSize: 12, color: 'white', borderRadius: 2 }}
                                            onClick={e => {
                                                e.preventDefault();
                                                onShowProductVariantConnect(_variant?.sme_product_variant_id, _variant.id)
                                            }}
                                        >
                                            {formatMessage({ defaultMessage: `Đã liên kết hàng hóa` })}
                                        </a>
                                    </div> : <div style={{ display: 'flex', alignItems: 'center' }} >
                                        <span className='px-2' style={{ backgroundColor: '#888484', fontSize: 12, color: 'white', borderRadius: 2 }} >{formatMessage({ defaultMessage: `Chưa liên kết` })}</span>
                                        <a
                                            href="#"
                                            className="ml-4"
                                            style={{ fontSize: 12, color: '#ff5629' }}
                                            onClick={e => {
                                                e.preventDefault();
                                                e.stopPropagation();

                                                onLinkVariant(_variant?.id)
                                            }}
                                        >
                                            {formatMessage({ defaultMessage: `Liên kết` })}
                                        </a>
                                    </div>
                                }
                            </AuthorizationWrapper>
                        </div>
                    </div>

                    {
                        index == 2 && canExpand && !isExpand && (
                            <div className='mt-8'>
                                <a className='d-flex align-items-center ' onClick={e => {
                                    e.preventDefault()
                                    setIsExpand(true)
                                }} >
                                    <span style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.15)', flex: 1 }} />
                                    <span className='font-weight-normal mx-4 fs-14' style={{ color: 'rgba(0,0,0,0.85)' }} >{`${formatMessage({ defaultMessage: 'Xem thêm' })} ${productVariants.length - variants.length} SKU`}</span>
                                    <span style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.15)', flex: 1 }} />
                                </a>
                            </div>
                        )}
                    {
                        index == variants.length - 2 && canExpand && isExpand && (
                            <div className='mt-8'>
                                <a className='d-flex align-items-center ' onClick={e => {
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
                <td className='fs-14 text-center' style={{ verticalAlign: 'top', borderLeft: 'none', borderRight: 'none' }} >
                    <p>{formatNumberToCurrency(_variant?.price)} đ</p>
                    <AuthorizationWrapper keys={['marketing_list_view']}>
                        {!!variantCampaign?.length && <a
                            className='px-2'
                            style={{ backgroundColor: '#ff5629', fontSize: 12, color: 'white', borderRadius: 2 }}
                            onClick={e => {
                                e.preventDefault();
                                setCampaignList(variantCampaign)
                                setOpenModalCampaign(true)
                            }}
                        >
                            {variantCampaign?.length} Ưu đãi
                        </a>}
                    </AuthorizationWrapper>
                </td>
                <td className='fs-14 text-center' style={{ verticalAlign: 'top', borderLeft: 'none' }} >
                    {!!_store?.enable_multi_warehouse && (
                        <div className='d-flex align-items-center justify-content-center'>
                            <span className='mr-2'>{formatNumberToCurrency(_variant?.stock_on_hand)} </span>
                            <span>{`(có sẵn ${formatNumberToCurrency(_variant?.sellable_stock)})`}</span>
                            <svg 
                            className="ml-2 bi bi-house-door-fill cursor-pointer" 
                            color="#ff5629" 
                            xmlns="http://www.w3.org/2000/svg" 
                            width="16" height="16" 
                            fill="currentColor" 
                            viewBox="0 0 16 16"
                            onClick={() => {
                                onShowInventory({
                                    sku: _variant?.sku,
                                    variant_id: _variant?.id,
                                    store_id: _store?.id
                                })
                            }}
                            >
                                <path d="M6.5 14.5v-3.505c0-.245.25-.495.5-.495h2c.25 0 .5.25.5.5v3.5a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5v-7a.5.5 0 0 0-.146-.354L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293L8.354 1.146a.5.5 0 0 0-.708 0l-6 6A.5.5 0 0 0 1.5 7.5v7a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5Z" />
                            </svg>
                        </div>
                    )}
                    {!_store?.enable_multi_warehouse && (
                        <>
                            <span>{formatNumberToCurrency(_variant?.stock_on_hand)} </span>
                            <span>{`(có sẵn ${formatNumberToCurrency(_variant?.sellable_stock)})`}</span>
                        </>
                    )}
                </td>
            </>
        )
    }

    return <>
        <tr style={!hasAttribute ? {
            borderBottom: '1px solid #F0F0F0',
        } : {
        }} >

            {params.type !== uiHelpers.TYPE_COUNT.HANG_HOA_AO && <td style={{ verticalAlign: 'top', borderRight: 'none' }} rowSpan={hasAttribute ? variants.length : 1}>
                <Checkbox
                    inputProps={{
                        'aria-label': 'checkbox',
                    }}
                    disabled={product?.status === 3}
                    style={product?.status === 3 ? { cursor: 'not-allowed', opacity: 0.4 } : {}}
                    isSelected={isSelected}
                    onChange={(e) => {
                        if (isSelected) {
                            setIds(prev => prev.filter(_id => _id.id != product.id))
                        } else {
                            setIds(prev => prev.concat([product]))
                        }
                    }}
                />
            </td>}
            <td style={{ verticalAlign: 'top', borderLeft: 'none' }} rowSpan={hasAttribute ? variants.length : 1} >
                <div style={{ verticalAlign: 'top', display: 'flex', flexDirection: 'row' }} className="mb-4" >
                    <div
                        style={{
                            backgroundColor: '#F7F7FA',
                            width: 68, height: 68,
                            borderRadius: 8,
                            overflow: 'hidden',
                            minWidth: 68,
                            cursor: 'pointer'
                        }}
                        onClick={e => {
                            e.preventDefault();
                            window.open(`/product-stores/edit/${product.id}`, '_blank')
                        }}
                        className='mr-6'
                    >
                        {
                            !!assetUrl && <HoverImage defaultSize={{ width: 68, height: 68 }} url={assetUrl} size={{ width: 320, height: 320 }} />
                        }
                    </div>
                    <div className='w-100'>
                        <InfoProduct
                            short={true}
                            name={product.name}
                            sku={product.sku}
                            url={`/product-stores/edit/${product.id}`}
                        />
                        <p className="d-flex mb-2" style={_store?.status == 1 ? {} : { opacity: 0.5 }}  ><img style={{ width: 16, height: 16 }} src={_channel?.logo_asset_url} className="mr-2" /><span className='fs-14' >{_store?.name}</span></p>
                        <div className="d-flex justify-content-between align-items-center"  >
                            <AuthorizationWrapper keys={['product_store_connect_view']}>
                                {
                                    product?.sme_product_id ? <div style={{ display: 'flex', alignItems: 'center' }} >
                                        <a
                                            className='px-2'
                                            style={{ backgroundColor: '#ff5629', fontSize: 12, color: 'white', borderRadius: 2 }}
                                            onClick={e => {
                                                // if (hasAttribute) {
                                                if(user?.is_subuser && !['product_store_connect_view']?.some(key => user?.permissions?.includes(key))) {
                                                    return
                                                }
                                                onShowProductConnect(product?.sme_product_id)
                                                // } else {
                                                //     onShowProductVariantConnect(product?.productVariants?.[0]?.sme_product_variant_id, 'product');
                                                // }
                                            }}
                                        >
                                            {formatMessage({ defaultMessage: 'Đã liên kết kho' })}
                                        </a>
                                    </div> : <div className="d-flex justify-content-between align-items-center"  >
                                        <div>
                                            <span className='px-2' style={{ backgroundColor: '#888484', fontSize: 12, color: 'white', borderRadius: 2 }} >{formatMessage({ defaultMessage: 'Chưa liên kết' })}</span>
                                            <a
                                                href='#'
                                                className="ml-4"
                                                style={{ fontSize: 12, color: '#ff5629' }}
                                                onClick={e => {
                                                    if(user?.is_subuser && !['product_store_connect_view']?.some(key => user?.permissions?.includes(key))) {
                                                        return
                                                    }
                                                    e.preventDefault();
                                                    e.stopPropagation();

                                                    onLink(product?.id)
                                                }}
                                            >
                                                {formatMessage({ defaultMessage: `Liên kết` })}
                                            </a>
                                        </div>
                                    </div>
                                }
                            </AuthorizationWrapper>
                            <p style={{ margin: 0 }} className={
                                (() => {
                                    switch (product?.status) {
                                        case 4:
                                            return 'text-danger';
                                        case 10:
                                            return 'text-success';
                                        default:
                                            return 'text-secondary';
                                    }
                                })()
                            }>{product?.platform_text_status || ''}</p>
                        </div>
                    </div>
                </div>
            </td>

            {
                !hasAttribute &&
                (
                    infoVariant(variants[0], 0, false)
                )
            }


            {
                hasAttribute && variants.slice(0, 1).map((_variant, index) => {
                    return infoVariant(_variant, index)
                })}
            <td className='fs-14' style={{ verticalAlign: 'top', whiteSpace: 'pre-wrap' }} rowSpan={hasAttribute ? variants.length : 1} >
                <div className="d-flex flex-column mb-2">
                    <span className="mb-1">{formatMessage({ defaultMessage: `Thời gian tạo` })}</span>
                    {dayjs(product.created_at).format('DD/MM/YYYY[\n]HH:mm')}
                </div>
                <div className="d-flex flex-column mb-2">
                    <span className="mb-1">{formatMessage({ defaultMessage: `Thời gian cập nhật` })}</span>
                    {dayjs(product.updated_at).format('DD/MM/YYYY[\n]HH:mm')}
                </div>
            </td>
            
            {params?.type != uiHelpers.TYPE_COUNT.HANG_HOA_AO && < td className='text-center fs-14' style={{ verticalAlign: 'top' }} rowSpan={hasAttribute ? variants.length : 1} >
                {renderAction}
            </td>}
        </tr>
        {
            hasAttribute && variants.slice(1).map((_variant, index) => {
                return (
                    <tr>
                        {infoVariant(_variant, index)}
                    </tr>
                )

            })
        }
    </>
})