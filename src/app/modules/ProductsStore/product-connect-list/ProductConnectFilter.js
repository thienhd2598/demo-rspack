import React, { Fragment, memo, useEffect, useMemo, useState } from 'react';
import { useHistory, useLocation } from "react-router-dom";
import { useMutation, useQuery } from "@apollo/client";
import op_connector_channels from "../../../../graphql/op_connector_channels";
import query_scStatisticScProducts from "../../../../graphql/query_scStatisticScProducts";
import { formatNumberToCurrency } from '../../../../utils'
import op_sale_channel_categories from "../../../../graphql/op_sale_channel_categories";
import query_sc_stores_basic from "../../../../graphql/query_sc_stores_basic";
import { Dropdown } from "react-bootstrap";
import _ from 'lodash';
import { useToasts } from "react-toast-notifications";
import queryString from 'querystring';
import ButtonAutoLink from '../products-list/filter/ButtonAutoLink';
import ProductAutoLink from '../products-list/dialog/ProductAutoLink';
import ProductAutoLinkInfo from '../products-list/dialog/ProductAutoLinkInfo';
import Select from "react-select";
import query_scStatisticSmeVariants from '../../../../graphql/query_scStatisticSmeVariants';
import ProductCount from "./ProductCount";
import ProductStockCount from "./ProductStockCount";
import { useIntl } from 'react-intl';
import AuthorizationWrapper from '../../../../components/AuthorizationWrapper';

const ProductConnectFilter = ({ product_type }) => {
    const { formatMessage } = useIntl();
    const history = useHistory()
    const { addToast } = useToasts();
    const location = useLocation();

    const TYPE_PRODUCT_CONNECT = [
        { title: formatMessage({ defaultMessage: 'Sản phẩm' }), value: 'product' },
        { title: formatMessage({ defaultMessage: 'Hàng hóa' }), value: 'stock' },
    ]

    const OPTIONS_STATUS_PRODUCT = [
        { label: formatMessage({ defaultMessage: 'Hoạt động' }), value: 10 },
        { label: formatMessage({ defaultMessage: 'Đã ẩn' }), value: 0 },
        { label: formatMessage({ defaultMessage: 'Vi phạm' }), value: 4 },
    ];

    const [search, setSearch] = useState('');

    const [showAutoLinkDialog, setShowAutoLinkDialog] = useState(false);
    const [showAutoLinkInfoDialog, setShowAutoLinkInfoDialog] = useState(false);

    const params = queryString.parse(location.search.slice(1, 100000))
    let currentChannel = params?.channel || 'shopee';
    const currentType = params?.type || 'product';
    const currentStore = params?.store;

    const [currentCategory, setCurrentCategory] = useState([]);
    const { data: dataStore, loading } = useQuery(query_sc_stores_basic, {
        fetchPolicy: 'cache-and-network'
    })

    const { data } = useQuery(op_connector_channels, {
        variables: {
            context: 'product'
        },
        fetchPolicy: 'cache-and-network'
    })

    const { data: dataCategories } = useQuery(op_sale_channel_categories, {
        variables: {
            connector_channel_code: currentChannel
        },
        // fetchPolicy: 'cache-and-network'
    });
    useEffect(() => {
        setSearch(params.name)
    }, [params.name]);


    const [options,] = useMemo(() => {
        let _options = dataStore?.sc_stores?.filter(_store => _store.status == 1 && (_store.connector_channel_code == currentChannel)).map(_store => {
            let _channel = dataStore?.op_connector_channels?.find(_ccc => _ccc.code == _store.connector_channel_code)
            return {
                label: _store.name,
                value: _store.id,
                logo: _channel?.logo_asset_url,
                connector_channel_code: _store.connector_channel_code,
                connector_channel_name: _channel.name
            }
        }) || [];

        return [_options];
    }, [dataStore, currentChannel]);

    let store_id = useMemo(() => {
        try {
            let store = !!params?.store ? parseInt(params?.store) : null
            if (!store || Number.isNaN(store)) {
                return null
            }
            return store
        } catch (error) {
            return null
        }
    }, [params.store]);

    let filter_map_sme = useMemo(() => {
        let filter_map_sme = Number(params?.filter_map_sme);
        if (!isNaN(filter_map_sme)) {
            return filter_map_sme
        }
        return null
    }, [params?.filter_map_sme]);

    const { data: dataStatis, error, loading: loadingStatics } = useQuery(query_scStatisticScProducts, {
        fetchPolicy: 'cache-and-network',
        variables: {
            store_id: store_id,
            q: !!params.name ? params.name : '',
            filter_map_sme,
            product_type
        }
    });

    const { data: dataStaticsVariant, loading: loadingStaticsVariant } = useQuery(query_scStatisticSmeVariants, {
        fetchPolicy: 'cache-and-network',
        variables: {
            store_id: store_id,
            q: !!params.name ? params.name : '',
        }
    });

    console.log({ dataStaticsVariant });
    const keys = useMemo(() => {
        if(params?.type == 'stock') {
            return ['product_store_variant_connect']
        }
        return ['product_store_connect']
    })
    return (
        <Fragment>
            <div className="d-flex w-100 mb-4" style={{ zIndex: 1 }}>
                <div style={{ flex: 1 }}>
                    <ul
                        className="nav nav-tabs"
                    >
                        {TYPE_PRODUCT_CONNECT?.map(_type => {
                            return (
                                <li
                                    className={`nav-item`}
                                    onClick={() => history.push(`/product-stores/connect?${queryString.stringify(_.omit({
                                        page: 1,
                                        type: _type.value
                                    }, ['channel', 'filter_map_sme', 'store']))}`)}
                                >
                                    <a style={{ fontSize: '16px' }} className={`nav-link ${currentType === _type.value ? "active" : ""}`}>
                                        {_type?.title}
                                    </a>
                                </li>
                            )
                        })}
                    </ul>
                </div>
            </div>
            {!!data && (
                <div
                    className={`d-flex align-items-center flex-wrap`}
                >
                    {
                        data?.op_connector_channels.map(_channel => {
                            let totalProduct;

                            if (product_type == 1) {
                                let statics = dataStatis?.scStatisticScProducts?.find(_static => _static.connector_channel_code == _channel.code)
                                totalProduct = statics?.total_product;
                            } else {
                                let staticsVariant = dataStaticsVariant?.scStatisticSmeVariants?.find(_static => _static.connector_channel_code == _channel.code);

                                if (filter_map_sme === 1) {
                                    totalProduct = staticsVariant?.group?.count_linked;
                                } else if (filter_map_sme === 0) {
                                    totalProduct = staticsVariant?.group?.count_not_link;
                                } else {
                                    totalProduct = staticsVariant?.group?.total;
                                };

                            }

                            return (
                                <div className="d-flex align-items-center justify-content-between" key={`_channel-${_channel.code}`} style={{
                                    maxWidth: 178, border: currentChannel == _channel.code ? '1px solid #FE5629' : '1px solid #D9D9D9',
                                    borderRadius: 4, padding: 10,

                                    marginRight: 16, flex: 1, cursor: 'pointer'
                                }}
                                    onClick={e => {
                                        e.preventDefault()
                                        history.push(`/product-stores/connect?${queryString.stringify(_.omit({
                                            ...params,
                                            page: 1,
                                            channel: _channel.code,
                                        }, 'store'))}`)
                                    }} >
                                    <span> <img src={_channel.logo_asset_url} style={{ width: 30, height: 30 }} /> {_channel.name}</span>
                                    <span style={{ fontSize: 18 }}>{
                                        currentType == 'product' && <ProductCount
                                            whereCondition={
                                                {
                                                    connector_channel_code: _channel.code,
                                                }
                                            }
                                        />

                                    }
                                        {
                                            currentType == 'stock' && <ProductStockCount
                                                whereCondition={
                                                    {
                                                        connector_channel_code: _channel.code,
                                                    }
                                                }
                                            />
                                        }
                                    </span>
                                </div>
                            )
                        })
                    }
                </div>
            )}
            <div className="form-group row d-flex align-items-center my-6">
                <div className="col-3 input-icon " style={{ height: 'fit-content' }} >
                    <input type="text" className="form-control" placeholder={formatMessage({ defaultMessage: "Tên sản phẩm/SKU" })}
                        onBlur={(e) => {
                            history.push(`/product-stores/connect?${queryString.stringify({
                                ...params,
                                page: 1,
                                name: e.target.value
                            })}`)
                        }}

                        value={search || ''}
                        onChange={(e) => {
                            setSearch(e.target.value)
                        }} onKeyDown={e => {
                            if (e.keyCode == 13) {
                                history.push(`/product-stores/connect?${queryString.stringify({
                                    ...params,
                                    page: 1,
                                    name: e.target.value
                                })}`)
                            }
                        }}
                    />
                    <span><i className="flaticon2-search-1 icon-md ml-6"></i></span>
                </div>
                <div className="col-3" style={{ height: 'fit-content' }} >
                    <div className='d-flex flex-row' style={{
                        alignItems: 'center'
                    }}>
                        <p style={{ verticalAlign: 'center' }}>{formatMessage({ defaultMessage: 'Gian hàng' })}</p>
                        <div style={{ flex: 1, paddingLeft: 16, zIndex: 99 }} >
                            <Select
                                value={options.find(__ => __.value == currentStore) || null}
                                options={options}
                                className='w-100'
                                placeholder={formatMessage({ defaultMessage: 'Tất cả' })}
                                isClearable
                                // isLoading={loadingStore}
                                onChange={value => {
                                    if (!!value) {
                                        history.push(`/product-stores/connect?${queryString.stringify({
                                            ...params,
                                            page: 1,
                                            store: value.value
                                        })}`)
                                    } else {
                                        history.push(`/product-stores/connect?${queryString.stringify(_.omit({
                                            ...params,
                                            page: 1,
                                        }, 'store'))}`)
                                    }
                                }}
                                formatOptionLabel={(option, labelMeta) => {
                                    return <div>
                                        {!!option.logo && <img src={option.logo} style={{ width: 15, height: 15, marginRight: 4 }} />}
                                        {option.label}
                                    </div>
                                }}
                            />
                        </div>
                    </div>
                </div>
                <div className="col-4" style={{ height: 'fit-content' }} >
                    <div className='d-flex flex-row' style={{
                        alignItems: 'center'
                    }}>
                        <span style={{ verticalAlign: 'center' }}>
                            {params?.type == 'stock' ? formatMessage({ defaultMessage: 'Trạng thái của hàng hóa sàn' }) : formatMessage({ defaultMessage: 'Trạng thái của sản phẩm sàn' })}
                        </span>
                        <div style={{ flex: 1, paddingLeft: 16, zIndex: 99 }} >
                            <Select
                                value={OPTIONS_STATUS_PRODUCT.find(status => status.value == params?.status) || null}
                                options={OPTIONS_STATUS_PRODUCT}
                                className='w-100'
                                placeholder={formatMessage({ defaultMessage: 'Tất cả' })}
                                isClearable
                                onChange={value => {
                                    if (!!value) {
                                        history.push(`/product-stores/connect?${queryString.stringify({
                                            ...params,
                                            page: 1,
                                            status: value.value
                                        })}`)
                                    } else {
                                        history.push(`/product-stores/connect?${queryString.stringify(_.omit({
                                            ...params,
                                            page: 1,
                                        }, 'status'))}`)
                                    }
                                }}
                                formatOptionLabel={(option, labelMeta) => {
                                    return <div>
                                        {!!option.logo && <img src={option.logo} style={{ width: 15, height: 15, marginRight: 4 }} />}
                                        {option.label}
                                    </div>
                                }}
                            />
                        </div>
                    </div>
                </div>
                <AuthorizationWrapper keys={keys} >
                    <div className='text-right col-2'>
                        <ButtonAutoLink
                            onAutoLinkProduct={setShowAutoLinkDialog}
                            onAutoLinkProductInfo={setShowAutoLinkInfoDialog}
                            product_type={product_type}
                        />
                    </div>
                </AuthorizationWrapper>
            </div>

            <ProductAutoLink
                product_type={product_type}
                show={showAutoLinkDialog}
                onHide={setShowAutoLinkDialog}
                onShowInfo={setShowAutoLinkInfoDialog}
            />
            <ProductAutoLinkInfo
                product_type={product_type}
                show={showAutoLinkInfoDialog}
                onHide={setShowAutoLinkInfoDialog}
                showStep1={setShowAutoLinkDialog}
            />
        </Fragment>
    )
};

export default memo(ProductConnectFilter);