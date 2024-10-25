import { useQuery } from "@apollo/client";
import _ from 'lodash';
import queryString from 'querystring';
import React, { memo, useCallback, useMemo, useRef, useState } from "react";
import { useIntl } from "react-intl";
import { useHistory, useLocation } from "react-router-dom";
import Select from "react-select";
import op_sale_channel_categories from "../../../../../graphql/op_sale_channel_categories";
import query_sc_stores_basic from "../../../../../graphql/query_sc_stores_basic";
import { useProductsUIContext } from "../../ProductsUIContext";
import { OPTIONS_ORIGIN_IMAGE } from '../../ProductsUIHelpers';

const ProductFilterDrawer = ({ onToggleDrawer, isOpenDrawer, setFieldValue }) => {
    const location = useLocation();
    const history = useHistory();
    const { formatMessage } = useIntl();
    const removeCategoryRef = useRef(null);
    const params = queryString.parse(location.search.slice(1, 100000));
    let currentChannel = params?.channel || 'shopee';
    const [filterParams, setFilterParams] = useState({});
    const [categorySelected, onSelect] = useState();
    const { optionsProductTag } = useProductsUIContext();

    const { data: dataStore, loading } = useQuery(query_sc_stores_basic, {
        fetchPolicy: 'cache-and-network'
    });

    const { data: dataCategories } = useQuery(op_sale_channel_categories, {
        variables: {
            connector_channel_code: currentChannel
        }
    });

    useMemo(
        () => {
            setFilterParams({
                store: params?.store || undefined,
                tags: params?.tags || undefined,
                has_origin_img: params?.has_origin_img || undefined,
                filter_map_sme: params?.filter_map_sme || undefined,
            })
        }, [params?.tags, params?.has_origin_img, params?.filter_map_sme, params?.store, isOpenDrawer]
    );

    const categories = useMemo(
        () => {
            let category = _.groupBy(dataCategories?.sc_sale_channel_categories, _cate => _cate.parent_id || 'root');

            return category;
        }, [dataCategories]
    );

    useMemo(
        () => {
            if (!params?.categoryId || !dataCategories?.sc_sale_channel_categories) {
                onSelect()
                setFieldValue('category', undefined)
                return;
            };

            let currentSelected = dataCategories?.sc_sale_channel_categories?.find(_cate => _cate.id === Number(params?.categoryId));

            let categoryParamsSelected = [...dataCategories?.sc_sale_channel_categories]
                ?.sort((a, b) => b.id - a.id)
                ?.reduce(
                    (prev, value) => {
                        let { parent_id } = prev[prev?.length - 1];

                        if (!!parent_id && parent_id === value?.id) {
                            return prev.concat(value);
                        }

                        return prev;
                    }, [currentSelected]
                )
                ?.reverse();

            onSelect(currentSelected);
            setFieldValue('category', categoryParamsSelected);
            setFieldValue('__changed__', true);

        }, [dataCategories, params?.categoryId, isOpenDrawer]
    );

    const [current, options] = useMemo(() => {
        let _options = dataStore?.sc_stores?.filter(_store => !currentChannel || _store.connector_channel_code == currentChannel)
            .map(_store => {
                let _channel = dataStore?.op_connector_channels?.find(_ccc => _ccc.code == _store.connector_channel_code)
                return { label: _store.name, value: _store.id, logo: _channel?.logo_asset_url }
            }) || [];

        let _current = _options.find(_store => _store.value == filterParams?.store) || null

        return [_current, _options]
    }, [dataStore, filterParams]);

    const currentTags = useMemo(
        () => {
            let parseParamsTags = filterParams?.tags?.split(',');
            let _current = optionsProductTag?.filter(
                _option => parseParamsTags?.some(param => param == _option?.label)
            );

            return _current || []
        }, [filterParams, optionsProductTag]
    );

    const onResetFilterParams = useCallback(
        () => {
            onSelect()
            setFieldValue('category', undefined)
            setFilterParams({})
        }, []
    );

    const onUpdateFilterParams = useCallback(
        (key, value) => {
            setFilterParams(prevParams => ({
                ...prevParams,
                [key]: value
            }))
        }, []
    );

    const onRemoveFilterProducts = useCallback(
        () => {
            onResetFilterParams();
        }, []
    );

    const onConfirmFilterProducts = useCallback(
        () => {
            let filtered = {
                ..._.omit(params, ['store', 'tags', 'has_origin_img', 'filter_map_sme', 'categoryId']),
                ...filterParams,
                ...(!!categorySelected ? {
                    categoryId: categorySelected?.id
                } : {})
            };

            for (const key in filtered) {
                if (filtered[key] === undefined) delete filtered[key]
            };

            history.push(
                `${location.pathname}?${queryString.stringify(filtered)}`
                    .replaceAll('%2C', '\,')
            );
            onResetFilterParams();
            onToggleDrawer();
        }, [filterParams, location?.search, categorySelected]
    );

    return (
        <div className="drawer-filter-wrapper d-flex flex-column justify-content-between">
            <div className="d-flex flex-column">
                <div className="drawer-filter-header d-flex align-items-center">
                    <div className="d-flex align-items-center justify-content-between px-4 flex-grow-1">
                        <p className="drawer-filter-title font-weight-bold mb-0">{formatMessage({ defaultMessage: 'Lọc sản phẩm' })}</p>
                        <span onClick={onToggleDrawer}><i className="drawer-filter-icon fas fa-times icon-md ml-6"></i></span>
                    </div>
                </div>

                <div className="drawer-filter-body">
                    <div className="drawer-filter-item p-4">
                        <div style={{ zIndex: '9' }}>
                            <p className="mb-2 font-weight-bold">{formatMessage({ defaultMessage: 'Gian hàng' })}</p>
                            <Select
                                value={current}
                                options={options}
                                className='w-100'
                                placeholder={formatMessage({ defaultMessage: 'Gian hàng' })}
                                isClearable
                                isLoading={loading}
                                onChange={value => {
                                    onUpdateFilterParams('store', value?.value || undefined);
                                    onUpdateFilterParams('page', 1);
                                }}
                                formatOptionLabel={(option, labelMeta) => {
                                    return <div> <img src={option.logo} style={{ width: 20, height: 20, marginRight: 8 }} /> {option.label}</div>
                                }}
                            />
                        </div>
                    </div>

                    <div className="drawer-filter-item p-4">
                        <div style={{ zIndex: 9 }}>
                            <p className="mb-2 font-weight-bold">{formatMessage({ defaultMessage: 'Tag sản phẩm' })}</p>
                            <Select
                                placeholder={formatMessage({ defaultMessage: "Nhập tag sản phẩm" })}
                                isMulti
                                isClearable
                                value={currentTags}
                                onChange={values => {
                                    let paramsTag = values?.length > 0
                                        ? _.map(values, 'label')?.join(',')
                                        : undefined;

                                    onUpdateFilterParams('tags', paramsTag);
                                }}
                                options={optionsProductTag}
                            />
                        </div>
                    </div>

                    <div className="drawer-filter-item p-4">
                        <p className="mb-4 font-weight-bold">{formatMessage({ defaultMessage: 'Ảnh gốc sản phẩm' })}</p>
                        <div
                            className="radio-list"
                            onChange={e => {
                                let valueChecked = e.target.value;
                                if (
                                    'has_origin_img' in filterParams
                                    && Number(filterParams?.has_origin_img) == e.target.value
                                ) valueChecked = undefined;

                                onUpdateFilterParams('has_origin_img', valueChecked)
                            }}
                        >
                            {OPTIONS_ORIGIN_IMAGE?.map(_option => (
                                <label
                                    key={`option-origin-image-${_option.value}`}
                                    className="radio"
                                >
                                    <input
                                        type="checkbox"
                                        value={_option.value}
                                        checked={_option.value === Number(filterParams?.has_origin_img)}
                                    />
                                    <span></span>
                                    <p className="mb-0">{formatMessage(_option.name)}</p>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            <div className="form-group my-6 mx-4 d-flex justify-content-between">
                <button
                    className="btn btn-light btn-elevate mr-6"
                    style={{ width: '47%' }}
                    onClick={onRemoveFilterProducts}
                >
                    <span className="font-weight-boldest">{formatMessage({ defaultMessage: 'Xoá bộ lọc' })}</span>
                </button>
                <button
                    className={`btn btn-primary font-weight-bold`}
                    style={{ width: '47%' }}
                    onClick={onConfirmFilterProducts}
                >
                    <span className="font-weight-boldest">{formatMessage({ defaultMessage: 'Lọc' })}</span>
                </button>
            </div>
        </div>
    )
};

export default memo(ProductFilterDrawer);