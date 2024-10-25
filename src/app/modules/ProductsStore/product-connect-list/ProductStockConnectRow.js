/*
 * Created by duydatpham@gmail.com on 23/06/2021
 * Copyright (c) 2021 duydatpham@gmail.com
 */
import dayjs from 'dayjs'
import _ from 'lodash'
import React, { memo, useCallback, useMemo, useState } from 'react'
import { Dropdown, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { useHistory } from 'react-router-dom'
import { useToasts } from 'react-toast-notifications'
import { toAbsoluteUrl } from '../../../../_metronic/_helpers'
import { useQuery } from '@apollo/client';
import gql from 'graphql-tag';
import InfoProduct from '../../../../components/InfoProduct'
import { useIntl } from 'react-intl';
import HoverImage from '../../../../components/HoverImage'
import AuthorizationWrapper from '../../../../components/AuthorizationWrapper'

const query_sme_catalog_product_by_pk = gql`
    query sme_catalog_product_variant_by_pk($id: uuid!) {
        sme_catalog_product_variant_by_pk(id: $id) {
            id
            sku
            name
            sme_catalog_product_variant_assets {
              asset_url
            }
            sme_catalog_product {
                id
                name
                is_combo
                combo_items {
                    combo_item{ 
                        id
                        sku
                        product_id
                    }
                    quantity
                }
                sme_catalog_product_variants {
                    id
                    attributes {
                        sme_catalog_product_attribute_value {
                        name
                        position
                        sme_catalog_product_custom_attribute {
                            display_name
                            name
                        }
                        assets {
                            asset_url
                            position_show
                        }
                        }
                    }
                }
            }
 
        }
    }
`;

export default memo(({ variant, op_connector_channels, sc_stores, onLinkVariant, onRemoveLink, setDataCombo }) => {
    const { formatMessage } = useIntl();
    const history = useHistory();
    const { addToast } = useToasts();

    const { data: dataCatalogProductVariant, loading: loadingCatalogProductVariant } = useQuery(query_sme_catalog_product_by_pk, {
        variables: {
            id: variant?.sme_product_variant_id
        },
        skip: !variant?.sme_product_variant_id,
        fetchPolicy: 'no-cache'
    })

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

    let _store = sc_stores.find(_st => _st.id == variant?.product?.store_id)
    let _channel = op_connector_channels.find(_st => _st.code == variant?.product?.connector_channel_code)

    let hasAttribute = variant?.product?.variantAttributeValues?.length > 0
    let hasAttributeWarehouse = dataCatalogProductVariant?.sme_catalog_product_variant_by_pk?.sme_catalog_product?.sme_catalog_product_variants?.length > 0

    const _attributesWarehouse = (data) => {
        const item_attributes = data?.sme_catalog_product?.sme_catalog_product_variants.find(element => element.id == data.id)?.attributes;
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

    const combinationVariant = () => {
        if (hasAttribute) {
            let combinationVariant = [];

            let _sc_product_attributes_value = variant?.sc_product_attributes_value ? JSON.parse(variant?.sc_product_attributes_value) : []
            let _sc_product_variant_attr = variant?.product?.productVariantAttributes

            let _variantAttributeValue = variant?.product?.variantAttributeValues?.filter(_value => {
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

    const linkProduct = () => {
        let is_combo = dataCatalogProductVariant?.sme_catalog_product_variant_by_pk?.sme_catalog_product?.is_combo == 1
        if (is_combo) {
            return `/products/edit-combo/${dataCatalogProductVariant?.sme_catalog_product_variant_by_pk?.sme_catalog_product?.id}`
        }
        if (hasAttribute) {
            return `/products/stocks/detail/${dataCatalogProductVariant?.sme_catalog_product_variant_by_pk?.id}`
        } else {
            return `/products/edit/${dataCatalogProductVariant?.sme_catalog_product_variant_by_pk?.sme_catalog_product?.id}`
        }
    }


    let assetUrl = useMemo(() => {
        let _asset = null
        try {
            let _sc_product_attributes_value = JSON.parse(variant.sc_product_attributes_value)
            let _variantAttributeValue = variant?.product?.variantAttributeValues?.find(_value => {
                return _value.scVariantValueAssets?.length > 0 && _sc_product_attributes_value.some(_v => _v == _value.ref_index)
            })
            if (!!_variantAttributeValue) {
                _asset = _variantAttributeValue.scVariantValueAssets[0]
            }
        } catch (error) {

        }
        try {
            if (!_asset) {
                let _variantAttributeValue = _.sortBy(variant?.product?.productAssets || [], 'position')
                if (!!_variantAttributeValue) {
                    _asset = _variantAttributeValue[0]
                }
            }
        } catch (error) {

        }
        return _asset;
    }, [variant])


    let __assets = useMemo(() => {
        if (!!dataCatalogProductVariant?.sme_catalog_product_variant_by_pk?.sme_catalog_product_variant_assets) {
            return dataCatalogProductVariant?.sme_catalog_product_variant_by_pk.sme_catalog_product_variant_assets[0]
        }
        return null
    }, [dataCatalogProductVariant?.sme_catalog_product_variant_by_pk])


    return <>
        <tr style={{
            borderBottom: '1px solid #F0F0F0',
        }} >
            <td style={{ verticalAlign: 'top' }}>
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
                            window.open(`/product-stores/edit/${variant?.product?.id}`, '_blank')
                        }}
                        className='mr-6'
                    >
                        {
                            (!!assetUrl) && <HoverImage defaultSize={{ width: 68, height: 68 }} url={assetUrl?.sme_url} size={{ width: 320, height: 320 }} />
                        }
                    </div>
                    <div className='w-100 d-flex flex-column'>
                        <InfoProduct
                            name={variant?.product?.name}
                            sku={''}
                            url={`/product-stores/edit/${variant?.product?.id}`}
                        />

                        {hasAttribute && <span className='d-flex align-items-center fs-12 text-secondary-custom my-2'>{combinationVariant()}</span>}

                        <div className='mt-2 w-100 d-flex align-items-center justify-content-between'>
                            <div className="d-flex mb-2" style={_store?.status == 1 ? {} : { opacity: 0.5 }}  ><img style={{ width: 16, height: 16 }} src={_channel?.logo_asset_url} className="mr-2" /><span className='fs-14' >{_store?.name}</span></div>
                            <span className={
                                (() => {
                                    switch (variant?.product?.status) {
                                        case 4:
                                            return 'text-danger';
                                        case 10:
                                            return 'text-success';
                                        default:
                                            return 'text-secondary';
                                    }
                                })()
                            }>
                                {variant?.product?.platform_text_status || ''}
                            </span>
                        </div>
                    </div>
                </div>
            </td>

            <td style={{ verticalAlign: 'top' }}>
                <div className='d-flex'>
                    <InfoProduct
                        name={''}
                        sku={variant?.sku}
                        url={`/product-stores/edit/${variant?.product?.id}`}
                    />
                </div>
            </td>

            <td style={{ verticalAlign: 'top' }}>
                {loadingCatalogProductVariant
                    ? <span className="spinner spinner-primary" />
                    : (<>
                        {variant?.sme_product_variant_id ? <>
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
                                        window.open(linkProduct(), '_blank')
                                    }}
                                    className='mr-6'
                                >
                                    {
                                        !!__assets ? <HoverImage defaultSize={{ width: 68, height: 68 }} url={__assets.asset_url} size={{ width: 320, height: 320 }} /> : null
                                    }
                                </div>
                                <div className='w-100'>
                                    <InfoProduct
                                        name={dataCatalogProductVariant?.sme_catalog_product_variant_by_pk?.sme_catalog_product?.name}
                                        sku={dataCatalogProductVariant?.sme_catalog_product_variant_by_pk?.sku}
                                        setDataCombo={setDataCombo}
                                        combo_items={dataCatalogProductVariant?.sme_catalog_product_variant_by_pk?.sme_catalog_product?.combo_items}
                                        url={linkProduct()}
                                    />
                                    {hasAttributeWarehouse && <span className='font-weight-normal mb-2 fs-12 text-secondary-custom'>{_attributesWarehouse(dataCatalogProductVariant?.sme_catalog_product_variant_by_pk)}</span>}
                                </div>
                            </div>
                        </> : <a
                            style={{ fontSize: 14, color: '#ff5629' }}
                            onClick={e => {
                                e.preventDefault();
                                onLinkVariant(variant?.id)
                            }}
                        >
                            {formatMessage({ defaultMessage: 'Liên kết' })}
                        </a>}
                    </>

                    )}
            </td>



            < td className='text-center fs-14' style={{ verticalAlign: 'top' }}>
                {!loadingCatalogProductVariant && (
                    <>
                        <AuthorizationWrapper keys={['product_store_variant_connect']}>
                        {variant?.sme_product_variant_id && (
                            <Dropdown drop='down'>
                                <Dropdown.Toggle className='btn-outline-secondary'>
                                    {formatMessage({ defaultMessage: 'Chọn' })}
                                </Dropdown.Toggle>
                                <Dropdown.Menu style={{ zIndex: 99 }}>
                                    <Dropdown.Item className="mb-1 d-flex" onClick={async () => {
                                        onLinkVariant(variant?.id, variant?.sme_product_variant_id)
                                    }} >
                                        {formatMessage({ defaultMessage: 'Thay đổi liên kết' })}
                                    </Dropdown.Item>
                                    <Dropdown.Item className="mb-1 d-flex" onClick={async () => {
                                        onRemoveLink({
                                            action: 'unlink_product_variant',
                                            sc_variant_id: variant?.id,
                                        })
                                    }} >
                                        {formatMessage({ defaultMessage: 'Hủy liên kết' })}
                                    </Dropdown.Item>
                                </Dropdown.Menu>
                            </Dropdown>
                        )}
                        </AuthorizationWrapper>
                    </>
                )}
            </td>
        </tr>
    </>
})