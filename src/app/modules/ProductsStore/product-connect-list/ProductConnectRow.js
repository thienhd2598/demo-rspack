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
import { formatNumberToCurrency } from '../../../../utils'
import { toAbsoluteUrl } from '../../../../_metronic/_helpers'
import { Checkbox } from '../../../../_metronic/_partials/controls'
import OutsideClickHandler from 'react-outside-click-handler';
import client from '../../../../apollo'
import query_scGetSmeProduct from '../../../../graphql/query_scGetSmeProduct'
import { useQuery } from '@apollo/client';
import gql from 'graphql-tag';
import InfoProduct from '../../../../components/InfoProduct'
import { useIntl } from 'react-intl';
import HoverImage from '../../../../components/HoverImage'
import AuthorizationWrapper from '../../../../components/AuthorizationWrapper'

const query_sme_catalog_product_by_pk = gql`
    query sme_catalog_product_by_pk($id: uuid!, $skip: Boolean = false) {
        sme_catalog_product_by_pk(id: $id) @skip(if: $skip) {
            id
            sku
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
            sme_catalog_product_assets {
                asset_id
                asset_url
                catalog_product_id
                created_at
                id
                is_video
                position_show
              }
        }
    }
`;

export default memo(({ product, op_connector_channels, sc_stores, onLink, onRemoveLink, setDataCombo }) => {
    const { formatMessage } = useIntl();
    const history = useHistory();
    const { addToast } = useToasts();
    const [isExpand, setIsExpand] = useState(false);

    const { data, loading: loadingProduct } = useQuery(query_sme_catalog_product_by_pk, {
        variables: {
            id: product?.sme_product_id
        },
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

    let _store = sc_stores.find(_st => _st.id == product.store_id)
    let _channel = op_connector_channels.find(_st => _st.code == product.connector_channel_code)

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



    let __assets = useMemo(() => {
        if (!!data?.sme_catalog_product_by_pk?.sme_catalog_product_assets) {
            return _.sortBy(data?.sme_catalog_product_by_pk?.sme_catalog_product_assets, "position_show")[0]
        }
        return null
    }, [data?.sme_catalog_product_by_pk])


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
                            window.open(`/product-stores/edit/${product.id}`, '_blank')
                        }}
                        className='mr-6'
                    >
                        {
                            !!assetUrl && <HoverImage defaultSize={{ width: 68, height: 68 }} url={assetUrl} size={{ width: 320, height: 320 }} />
                        }
                    </div>
                    <div className='w-100 d-flex flex-column'>
                        <InfoProduct
                            name={product?.name}
                            sku={''}
                            url={`/product-stores/edit/${product.id}`}
                        />
                        <div className='mt-2 w-100 d-flex align-items-center justify-content-between'>
                            <div className="d-flex align-items-center" style={_store?.status == 1 ? {} : { opacity: 0.5 }}  ><img style={{ width: 16, height: 16 }} src={_channel?.logo_asset_url} className="mr-2" /><span className='fs-14' >{_store?.name}</span></div>
                            <span className={
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
                            }>
                                {product?.platform_text_status || ''}
                            </span>
                        </div>
                    </div>
                </div>
            </td>

            <td style={{ verticalAlign: 'top' }}>
                <div className='d-flex'>
                    <InfoProduct
                        name={''}
                        sku={product?.sku}
                        url={`/product-stores/edit/${product.id}`}
                    />
                </div>
            </td>

            <td style={{ verticalAlign: 'top' }}>
                {loadingProduct
                    ? <span className="spinner spinner-primary" />
                    : (<>
                        {product?.sme_product_id ? <>
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
                                        window.open(`/products/${data?.sme_catalog_product_by_pk?.is_combo == 1 ? 'edit-combo' : 'edit'}/${data?.sme_catalog_product_by_pk?.id}`, '_blank')
                                    }}
                                    className='mr-6'
                                >
                                    {
                                        !!__assets ? <HoverImage defaultSize={{ width: 68, height: 68 }} url={__assets.asset_url} size={{ width: 320, height: 320 }} /> : null
                                    }
                                </div>
                                <InfoProduct
                                    name={data?.sme_catalog_product_by_pk?.name}
                                    sku={data?.sme_catalog_product_by_pk?.sku}
                                    setDataCombo={setDataCombo}
                                    combo_items={data?.sme_catalog_product_by_pk?.combo_items}
                                    url={`/products/${data?.sme_catalog_product_by_pk?.is_combo == 1 ? 'edit-combo' : 'edit'}/${data?.sme_catalog_product_by_pk?.id}`}
                                />
                            </div>
                        </> : <a
                            style={{ fontSize: 14, color: '#ff5629' }}
                            onClick={e => {
                                e.preventDefault();
                                onLink(product?.id)
                            }}
                        >
                            {formatMessage({ defaultMessage: 'Liên kết' })}
                        </a>}
                    </>

                    )}
            </td>



            < td className='text-center fs-14' style={{ verticalAlign: 'top' }}>
                {!loadingProduct && (
                    <>
                        <AuthorizationWrapper keys={['product_store_connect']}>
                            {product?.sme_product_id && (
                                <Dropdown drop='down'>
                                    <Dropdown.Toggle className='btn-outline-secondary'>
                                        {formatMessage({ defaultMessage: 'Chọn' })}
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu style={{ zIndex: 99 }}>
                                        <Dropdown.Item className="mb-1 d-flex" onClick={async () => {
                                            onLink(product?.id, product?.sme_product_id)
                                        }} >
                                            {formatMessage({ defaultMessage: 'Thay đổi liên kết' })}
                                        </Dropdown.Item>
                                        <Dropdown.Item className="mb-1 d-flex" onClick={async () => {
                                            onRemoveLink({
                                                action: 'unlink_product',
                                                sc_product_id: product?.id,
                                                sme_product_id: product?.sme_product_id
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
        </tr >
    </>
})