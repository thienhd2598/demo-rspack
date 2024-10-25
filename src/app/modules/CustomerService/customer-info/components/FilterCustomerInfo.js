import React, { useState, useCallback, useMemo, Fragment, memo } from 'react';
import { useIntl } from 'react-intl';
import { useHistory, useLocation } from "react-router-dom";
import queryString from 'querystring';
import Select from "react-select";
import { map } from 'lodash';
import InputRangeVertical from './InputRangeVertical';
import makeAnimated from 'react-select/animated';

const animatedComponents = makeAnimated();

const FilterCustomerInfo = ({ optionsProvince, optionsChannelCode, optionsStore, optionsTags }) => {
    const { formatMessage } = useIntl();
    const location = useLocation();
    const history = useHistory();
    const params = queryString.parse(location.search.slice(1, 100000));

    const currentChannel = useMemo(() => {
        let _current = !!params?.channels
            ? optionsChannelCode?.filter(
                _channel => !!_channel?.value && params?.channels?.split(',').some(_param => _param == _channel.value)
            )
            : undefined;

        return _current
    }, [params?.channels, optionsChannelCode]);

    const currentStore = useMemo(() => {
        let _current = !!params?.stores
            ? optionsStore?.filter(
                _store => !!_store?.value && params?.stores?.split(',').some(_param => +_param == _store.value)
            )
            : [];

        return _current
    }, [params?.stores, optionsStore]);    

    const currentTags = useMemo(() => {
        let _current = !!params?.tags
            ? optionsTags?.filter(
                _tag => !!_tag?.value && params?.tags?.split(',').some(_param => +_param == _tag.value)
            )
            : undefined;

        return _current
    }, [params?.tags, optionsTags]);

    const currentProvinces = useMemo(() => {
        let _current = !!params?.city_province
            ? optionsProvince?.filter(
                _province => !!_province?.value && params?.city_province?.split(',').some(_param => _param == _province.value)
            )
            : undefined;

        return _current
    }, [params?.city_province, optionsProvince]);

    return (
        <Fragment>
            <div className='mb-4 d-flex align-items-center' style={{ color: '#0057FF' }}>
                <div>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="mr-2 bi bi-info-circle" viewBox="0 0 18 18">
                        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
                        <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0" />
                    </svg>
                </div>
                <span>{formatMessage({ defaultMessage: 'Dữ liệu về đơn hàng, phản hồi khách hàng sẽ được cập nhật và tổng hợp thông tin định kỳ 1h/lần nên số liệu có thể bị lệch so với thực tế!' })}</span>
            </div>
            <div className='row mb-4'>
                <div className='col-3'>
                    <div className='d-flex align-items-center'>
                        <span className="mr-4" style={{ minWidth: 'fit-content' }}>
                            {formatMessage({ defaultMessage: 'Kênh bán' })}
                        </span>
                        <Select
                            options={optionsChannelCode}
                            className='w-100 select-report-custom'
                            placeholder={formatMessage({ defaultMessage: 'Tất cả' })}
                            components={animatedComponents}
                            isClearable
                            isMulti
                            value={currentChannel}
                            isLoading={false}
                            onChange={values => {
                                const channelsPush = values?.length > 0
                                    ? map(values, 'value')?.join(',')
                                    : undefined;

                                history.push(`/customer-service/customer-info?${queryString.stringify({
                                    ...params,
                                    page: 1,
                                    channels: channelsPush,
                                    stores: undefined,
                                })}`.replaceAll('%2C', '\,'))
                            }}
                            formatOptionLabel={(option, labelMeta) => {
                                return <div className='d-flex align-items-center'>
                                    {!!option.logo && <img src={option.logo} style={{ width: 15, height: 15, marginRight: 8 }} />}
                                    <span>{option.label}</span>
                                </div>
                            }}
                        />
                    </div>
                </div>
                <div className='col-3'>
                    <div className='d-flex align-items-center'>
                        <span className="mr-4" style={{ minWidth: 'fit-content' }}>
                            {formatMessage({ defaultMessage: 'Gian hàng' })}
                        </span>
                        <Select
                            options={optionsStore?.filter(store => {
                                if (currentChannel?.length > 0) {
                                    return currentChannel?.some(channel => channel?.value == store?.connector_channel_code)
                                }
                                return true
                            })}
                            className='w-100 select-report-custom'
                            placeholder={formatMessage({ defaultMessage: 'Tất cả' })}
                            components={animatedComponents}
                            isClearable
                            isMulti
                            value={currentStore}
                            isLoading={false}
                            onChange={values => {
                                const storesPush = values?.length > 0
                                    ? map(values, 'value')?.join(',')
                                    : undefined;

                                history.push(`/customer-service/customer-info?${queryString.stringify({
                                    ...params,
                                    page: 1,
                                    stores: storesPush
                                })}`.replaceAll('%2C', '\,'))
                            }}
                            formatOptionLabel={(option, labelMeta) => {
                                return <div className='d-flex align-items-center'>
                                    {!!option.logo && <img src={option.logo} style={{ width: 15, height: 15, marginRight: 8 }} />}
                                    <span>{option.label}</span>
                                </div>
                            }}
                        />
                    </div>
                </div>
                <div className='col-3'>
                    <div className='d-flex align-items-center'>
                        <span className="mr-4" style={{ minWidth: 'fit-content' }}>
                            {formatMessage({ defaultMessage: 'Tag' })}
                        </span>
                        <Select
                            options={optionsTags}
                            className='w-100 select-report-custom'
                            placeholder={formatMessage({ defaultMessage: 'Chọn tag' })}
                            components={animatedComponents}
                            isClearable
                            isMulti
                            value={currentTags}
                            isLoading={false}
                            onChange={values => {
                                const tagsPush = values?.length > 0
                                    ? map(values, 'value')?.join(',')
                                    : undefined;

                                history.push(`/customer-service/customer-info?${queryString.stringify({
                                    ...params,
                                    page: 1,
                                    tags: tagsPush
                                })}`.replaceAll('%2C', '\,'))
                            }}
                            formatOptionLabel={(option, labelMeta) => {
                                return <div className='d-flex align-items-center'>
                                    {!!option.logo && <img src={option.logo} style={{ width: 15, height: 15, marginRight: 8 }} />}
                                    <span>{option.label}</span>
                                </div>
                            }}
                        />
                    </div>
                </div>
                <div className='col-3'>
                    <div className='d-flex align-items-center'>
                        <span className="mr-4" style={{ minWidth: 'fit-content' }}>
                            {formatMessage({ defaultMessage: 'Tỉnh/Thành phố' })}
                        </span>
                        <Select
                            options={optionsProvince}
                            className='w-100 select-report-custom'
                            placeholder={formatMessage({ defaultMessage: 'Tất cả' })}
                            components={animatedComponents}
                            isClearable
                            isMulti
                            value={currentProvinces}
                            isLoading={false}
                            onChange={values => {
                                const provincesPush = values?.length > 0
                                    ? map(values, 'value')?.join(',')
                                    : undefined;

                                history.push(`/customer-service/customer-info?${queryString.stringify({
                                    ...params,
                                    page: 1,
                                    city_province: provincesPush
                                })}`.replaceAll('%2C', '\,'))
                            }}
                            formatOptionLabel={(option, labelMeta) => {
                                return <div className='d-flex align-items-center'>
                                    {!!option.logo && <img src={option.logo} style={{ width: 15, height: 15, marginRight: 8 }} />}
                                    <span>{option.label}</span>
                                </div>
                            }}
                        />
                    </div>
                </div>
            </div>
            <div className='row mb-10'>
                <div className='col-4'>
                    <div className='d-flex align-items-center'>
                        <span className="mr-4" style={{ minWidth: 'fit-content' }}>
                            {formatMessage({ defaultMessage: 'Tìm kiếm' })}
                        </span>
                        <div className='input-icon w-100' style={{ height: 'fit-content' }}>
                            <input
                                type="text"
                                className="form-control pl-4"
                                placeholder={formatMessage({ defaultMessage: "Nhập tên người dùng, tên tài khoản, sđt, id, email" })}
                                style={{ height: 38 }}
                                onBlur={(e) => {
                                    history.push(`/customer-service/customer-info?${queryString.stringify({
                                        ...params,
                                        page: 1,
                                        q: e.target.value
                                    })}`.replaceAll('%2C', '\,'))
                                }}
                                defaultValue={params?.q || ''}
                                onKeyDown={e => {
                                    if (e.keyCode == 13) {
                                        history.push(`/customer-service/customer-info?${queryString.stringify({
                                            ...params,
                                            page: 1,
                                            q: e.target.value
                                        })}`.replaceAll('%2C', '\,'))
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>
                <div className='col-4'>
                    <div className='d-flex align-items-center'>
                        <InputRangeVertical
                            title={formatMessage({ defaultMessage: 'Khoảng tiền' })}
                            key={[`fromPrice`, `toPrice`]}
                            min={0}
                            max={1000000000}
                            rangeUrl={{
                                from: !!params?.fromPrice ? Number(params?.fromPrice) : null,
                                to: !!params?.toPrice ? Number(params?.toPrice) : null
                            }}
                            onComplete={value => {
                                const [from, to] = value || [];
                                history.push(`/customer-service/customer-info?${queryString.stringify({
                                    ...params,
                                    page: 1,
                                    fromPrice: from,
                                    toPrice: to,
                                })}`)
                            }}
                        />
                    </div>
                </div>
                <div className='col-4'>
                    <div className='d-flex align-items-center'>
                        <InputRangeVertical
                            title={formatMessage({ defaultMessage: 'Số lượng đơn' })}
                            key={[`fromOrder`, `toOrder`]}
                            min={0}
                            max={1000}
                            rangeUrl={{
                                from: !!params?.fromOrder ? Number(params?.fromOrder) : null,
                                to: !!params?.toOrder ? Number(params?.toOrder) : null
                            }}
                            onComplete={value => {
                                const [from, to] = value || [];
                                history.push(`/customer-service/customer-info?${queryString.stringify({
                                    ...params,
                                    page: 1,
                                    fromOrder: from,
                                    toOrder: to,
                                })}`)
                            }}
                        />
                    </div>
                </div>
            </div>
        </Fragment>
    )
};

export default memo(FilterCustomerInfo);