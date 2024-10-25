import React, { memo, useCallback, useMemo, useState } from "react";
import queryString from 'querystring';
import { useHistory, useLocation } from "react-router-dom";
import Select from "react-select";
import { useQuery } from "@apollo/client";
import query_sc_stores_basic from "../../../../../graphql/query_sc_stores_basic";
import _ from 'lodash';
import { useIntl } from "react-intl";
import { OPTIONS_CONNECTED, OPTIONS_ORIGIN_IMAGE, PRODUCT_TYPE } from "../../../Products/ProductsUIHelpers";

const ProductFilterDrawer = ({ statusUpdateCostprice, isOpenDrawer, onToggleDrawer, optionsProductTag }) => {
    const location = useLocation();
    const history = useHistory();
    const params = queryString.parse(location.search.slice(1, 100000));    
    const [filterParams, setFilterParams] = useState({});

    const { data: dataStore, loading } = useQuery(query_sc_stores_basic, {
        fetchPolicy: 'cache-and-network'
    });
    const {formatMessage} = useIntl()
    useMemo(
        () => {
            setFilterParams({
                store: params?.store || undefined,
                tags: params?.tags || undefined,
                updateCostPrice: params?.updateCostPrice || undefined,
                has_origin_image: params?.has_origin_image || undefined,
                has_sc_product_linking: params?.has_sc_product_linking || undefined,
                is_combo: params?.is_combo || undefined,
            })
        }, [params?.tags, params?.updateCostPrice,params?.has_origin_image, params?.has_sc_product_linking, isOpenDrawer, params?.store]
    );

    const currentTags = useMemo(
        () => {
            let parseParamsTags = filterParams?.tags?.split(',');
            let _current = optionsProductTag?.filter(
                _option => parseParamsTags?.some(param => Number(param) == _option?.value)
            );

            return _current || []
        }, [filterParams, optionsProductTag]
    );

    const currentStatusCostPrice = useMemo(
        () => {
            let parseParamsUpdateCostPrice = filterParams?.updateCostPrice?.split(',');
            let _current = statusUpdateCostprice?.filter(
                _option => parseParamsUpdateCostPrice?.some(param => Number(param) == _option?.value)
            );

            return _current || []
        }, [filterParams, statusUpdateCostprice]
    );


    const [current, options] = useMemo(() => {
        let _options = dataStore?.sc_stores?.map(_store => {
            let _channel = dataStore?.op_connector_channels?.find(_ccc => _ccc.code == _store.connector_channel_code)
            return { label: _store.name, value: _store.id, logo: _channel?.logo_asset_url }
        }) || [];

        let _current = _options.find(_store => _store.value == filterParams?.store) || null
        return [_current, _options]
    }, [dataStore, filterParams]);

    const onResetFilterParams = useCallback(
        () => {
            setFilterParams({})
        }, []
    );

    const onUpdateFilterParams = useCallback(
        (key, value) => {
            console.log(value)
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
                ..._.omit(params, ['store', 'tags', 'has_origin_image', 'has_sc_product_linking', 'is_combo']),
                ...filterParams
            };

            for (const key in filtered) {
                if (filtered[key] === undefined) delete filtered[key]
            };

            history.push(`${location.pathname}?${queryString.stringify({
                ...filtered
            })}`.replaceAll('%2C', '\,'));
            onResetFilterParams();
            onToggleDrawer();
        }, [filterParams]
    );

    return (
        <div className="drawer-filter-wrapper d-flex flex-column justify-content-between">
            <div className="d-flex flex-column">
                <div className="drawer-filter-header d-flex align-items-center">
                    <div className="d-flex align-items-center justify-content-between px-4 flex-grow-1">
                        <p className="drawer-filter-title font-weight-bold mb-0">{formatMessage({defaultMessage:'Lọc sản phẩm'})}</p>
                        <span onClick={onToggleDrawer}><i className="drawer-filter-icon fas fa-times icon-md ml-6"></i></span>
                    </div>
                </div>

                <div className="drawer-filter-item p-4">
                    <p className="mb-2 font-weight-bold">{formatMessage({defaultMessage:'Tag sản phẩm'})}</p>
                    <Select
                        placeholder={formatMessage({defaultMessage:"Nhập tag sản phẩm"})}
                        isMulti
                        isClearable
                        value={currentTags}
                        onChange={values => {                            
                            let paramsTag = values?.length > 0
                                ? _.map(values, 'value')?.join(',')
                                : undefined;

                            onUpdateFilterParams('tags', paramsTag);
                        }}
                        options={optionsProductTag}
                    />
                </div>

                <div className="drawer-filter-item p-4">
                    <p className="mb-4 font-weight-bold">{formatMessage({defaultMessage:'Loại sản phẩm'})}</p>
                    <div
                        className="radio-list"
                        onChange={e => {
                            let valueChecked = Number(e.target.value);
                            if (
                                'is_combo' in filterParams
                                && Number(filterParams?.is_combo) == e.target.value
                            ) valueChecked = undefined;

                            onUpdateFilterParams('is_combo', valueChecked)
                        }}
                    >
                        {PRODUCT_TYPE?.map(_option => (
                            <label
                                key={`option-connected-${_option.value}`}
                                className="radio"
                            >
                                <input
                                    type="checkbox"
                                    value={_option.value}
                                    checked={_option.value === Number(filterParams?.is_combo)}
                                />
                                <span></span>
                                <p className="mb-0">{formatMessage(_option.name)}</p>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="drawer-filter-item p-4">
                    <p className="mb-2 font-weight-bold">{formatMessage({defaultMessage:'Trạng thái cập nhật giá vốn và VAT'})}</p>
                    <Select
                        placeholder={formatMessage({defaultMessage:"Tất cả"})}
                        isMulti
                        isClearable
                        value={currentStatusCostPrice}
                        onChange={values => {                            
                            let updateCostPrice = values?.length > 0
                                ? _.map(values, 'value')?.join(',')
                                : undefined;

                            onUpdateFilterParams('updateCostPrice', updateCostPrice);
                        }}
                        options={statusUpdateCostprice}
                    />
                </div>
            </div>

            <div className="form-group my-6 mx-4 d-flex justify-content-between">
                <button
                    className="btn btn-light btn-elevate mr-6"
                    style={{ width: '47%' }}
                    onClick={onRemoveFilterProducts}
                >
                    <span className="font-weight-boldest">{formatMessage({defaultMessage:'Xoá bộ lọc'})}</span>
                </button>
                <button
                    className={`btn btn-primary font-weight-bold`}
                    style={{ width: '47%' }}
                    onClick={onConfirmFilterProducts}
                >
                    <span className="font-weight-boldest">{formatMessage({defaultMessage:'Lọc'})}</span>
                </button>
            </div>
        </div>
    )
};

export default memo(ProductFilterDrawer);