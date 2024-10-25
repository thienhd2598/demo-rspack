/*
 * Created by duydatpham@gmail.com on 15/11/2021
 * Copyright (c) 2021 duydatpham@gmail.com
 */
import { useQuery } from "@apollo/client";
import React, { memo, useMemo } from "react";
import { useIntl } from 'react-intl';
import { formatNumberToCurrency } from "../../../../utils";
import { toAbsoluteUrl } from "../../../../_metronic/_helpers";
import { useProductsUIContext } from "../ProductsUIContext";
import query_sc_stores_basic from "../../../../graphql/query_sc_stores_basic";
import query_sc_product_variant from "../../../../graphql/query_sc_product_variant";
import { sum } from "lodash";

export default memo(() => {
    const { formatMessage } = useIntl();
    const {
        smeProduct,
        productEditing
    } = useProductsUIContext();


    const { data: dataStore, loading } = useQuery(query_sc_stores_basic, {
        fetchPolicy: 'cache-and-network'
    })
    const { data, } = useQuery(query_sc_product_variant, {
        fetchPolicy: 'cache-and-network',
        variables: {
            product_id: smeProduct?.id || productEditing?.sme_product_id
        }
    })
    console.log('data', data)

    const [options] = useMemo(() => {
        let _storeID = [];
        let _storeStatus = {};
        (data?.sme_catalog_product_variant || []).forEach(_variant => {
            (_variant.sc_product_variant || []).forEach(_scVariant => {
                let productStatus = ''
                if (!_scVariant?.product?.ref_id || _scVariant?.product?.status == 2)
                    productStatus = formatMessage({ defaultMessage: 'Lưu nháp' })
                else if (_scVariant?.product?.status == 10)
                    productStatus = formatMessage({ defaultMessage: 'Hoạt động' })
                else if (_scVariant?.product?.status == 0)
                    productStatus = formatMessage({ defaultMessage: 'Đang ẩn' })

                _storeID.push(_scVariant.storeChannel?.id)
                _storeStatus[_scVariant.storeChannel?.id] = {
                    status: _scVariant.storeChannel?.status,
                    productStatus
                }
            })
        });
        let _options = dataStore?.sc_stores?.
            filter(_store => _storeID?.length > 0
                && _storeID?.some(_var => _var == _store.id)
            )
            .map(_store => {
                let _channel = dataStore?.op_connector_channels?.find(_ccc => _ccc.code == _store.connector_channel_code)
                return {
                    label: _store.name,
                    value: _store.id,
                    logo: _channel?.logo_asset_url,
                    connector_channel_code: _store.connector_channel_code,
                    status: _storeStatus[_store.id].status,
                    productStatus: _storeStatus[_store.id].productStatus,
                }
            }) || [];
        return [_options]
    }, [dataStore, data])

    return (
        <table className="table table-borderless product-list table-vertical-center fixed" style={{ tableLayout: 'fixed', borderCollapse: 'collapse' }}>
            <thead >
                <tr >
                    <th rowSpan={2} className='text-center' style={{ border: '1px solid #828282', fontSize: '14px' }}>
                        <span className="text-dark-75">{formatMessage({ defaultMessage: 'Phân loại sản phẩm' })}</span>
                    </th>
                    <th colSpan={1 + options.length} className='text-center' style={{ fontSize: '14px', border: '1px solid #828282' }}>
                        <p className="text-dark-75 mb-0">{formatMessage({ defaultMessage: 'Tồn kho' })}</p>
                    </th>
                </tr>
                <tr >
                    <th className='text-center' style={{ fontSize: '14px', border: '1px solid #828282' }}>
                        <span className="text-dark-75">{formatMessage({ defaultMessage: 'Sản phẩm kho' })}</span>
                    </th>
                    {
                        options.map(_option => {
                            return <th key={`store-${_option.value}`} className='text-center' style={{ fontSize: '14px', border: '1px solid #828282' }}>
                                <p className="mb-0" style={{ opacity: _option.status == 1 ? 1 : 0.5 }} > <img src={_option.logo} style={{ width: 20, height: 20, marginRight: 8 }} /> <span className="text-dark-75" >{_option.label}</span></p>
                                <span style={{ opacity: _option.status == 1 ? 1 : 0.5, fontWeight: 'normal' }}>({_option.productStatus})</span>
                            </th>
                        })
                    }
                    {/* <th className='text-center' style={{ border: '1px solid #828282' }}>
                        <p className="text-dark-75 mb-0">Sản phẩm kho</p>
                    </th> */}
                </tr>
            </thead>
            <tbody  >
                {
                    (data?.sme_catalog_product_variant || []).map((_variant, index) => {
                        const stockOnHandSmeVariant = sum(_variant?.inventories?.map(iv => iv?.stock_actual));
                        
                        return <tr key={`row-table-index-${index}`} >
                            <td style={{ border: '1px solid #828282' }}>
                                <p className='font-weight-normal mb-2' >{_variant.name}</p>
                                <p className='mb-1'><img src={toAbsoluteUrl('/media/ic_sku.svg')} /> {_variant.sku}</p>
                            </td>
                            <td style={{ border: '1px solid #828282', textAlign: 'center' }}>
                                {formatNumberToCurrency(stockOnHandSmeVariant)}
                            </td>
                            {
                                options.map(_option => {
                                    let scVariant = _variant.sc_product_variant?.find(_var => _var.storeChannel?.id == _option.value)
                                    return <td key={`store-value-${_option.value}`} style={{ border: '1px solid #828282', textAlign: 'center' }}>
                                        {formatNumberToCurrency(scVariant?.stock_on_hand || 0)}
                                    </td>
                                })
                            }
                        </tr>
                    })
                }
            </tbody>
        </table>
    )
})