/*
 * Created by duydatpham@gmail.com on 15/03/2023
 * Copyright (c) 2023 duydatpham@gmail.com
 */
import _ from "lodash";
import React, { memo, useCallback, useMemo, useState } from "react";
import { useIntl } from "react-intl";
import { Link } from "react-router-dom";
import { toAbsoluteUrl } from "../../../../../_metronic/_helpers";
import { Card, CardBody, CardHeader, CardHeaderToolbar } from "../../../../../_metronic/_partials/controls";
import ModalProductConnect from "../../products-list/dialog/ModalProductConnect";

export default memo(({ variant, refetch }) => {
    const { formatMessage } = useIntl();
    const [idsProductsConnected, setIdsProductsConnected] = useState([]);
    
    const imgAssets = useMemo(() => {
        return _.minBy(variant?.product?.sme_catalog_product_assets?.map(_asset => ({
            ..._asset,
            position_show: _asset.position_show || 0
        })), 'position_show')
    }, [variant?.product?.sme_catalog_product_assets])
    
    const onShowProductConnect = useCallback(() => {
        setIdsProductsConnected(variant?.product?.scProductMapping?.map(_scProduct => _scProduct.sc_product_id))
    }, [variant]);
    
    console.log({ variant });

    return <Card>
        <ModalProductConnect
            scProductIds={idsProductsConnected}
            hasAttribute={false}
            smeProductIdSelect={variant?.product?.id}
            onHide={() => { 
                refetch();
                setIdsProductsConnected([]) 
            }}
        />
        <CardHeader title={formatMessage({ defaultMessage: "SẢN PHẨM CHÍNH" })}>
            <CardHeaderToolbar>
            </CardHeaderToolbar>
        </CardHeader>
        <CardBody>
            <div style={{ verticalAlign: 'top', display: 'flex', flexDirection: 'row', marginBottom: 16 }}>
                <Link to={`/products/edit/${variant?.product?.id}`} target="_blank">
                    <div style={{
                        backgroundColor: '#F7F7FA',
                        width: 80, height: 80,
                        borderRadius: 8,
                        overflow: 'hidden',
                        minWidth: 80
                    }} className='mr-6' >
                        {
                            !!imgAssets && <img src={imgAssets?.asset_url}
                                style={{ width: 80, height: 80, objectFit: 'contain' }} />
                        }
                    </div>
                </Link>
                <div>
                    <Link to={`/products/edit/${variant?.product?.id}`} target="_blank">
                        <p className='font-weight-normal mb-2' style={{ color: 'black' }} >{variant?.product?.name}</p>
                    </Link>
                    <p className='mb-1 d-flex align-items-center'>
                        <img src={toAbsoluteUrl('/media/ic_sku.svg')} />
                        <span className='text-truncate-sku ml-2'>{variant?.product?.sku}</span>
                    </p>
                    <span
                        className={`${variant?.product?.scProductMapping?.length ? 'text-primary cursor-pointer' : "text-secondary-custom"} ` + 'fs-12'}
                        onClick={() => {
                            if (variant?.product?.scProductMapping?.length === 0) return;
                            onShowProductConnect()

                        }}
                    >
                        {variant?.product?.scProductMapping?.length || 0} {formatMessage({ defaultMessage: 'liên kết' })}
                    </span>

                </div>
            </div>
        </CardBody>
    </Card>
})