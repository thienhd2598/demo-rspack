import React, { useState, useCallback, useMemo, Fragment, memo } from 'react';
import { useIntl } from 'react-intl';
import { useHistory, useLocation } from "react-router-dom";
import queryString from 'querystring';
import Select from "react-select";
import makeAnimated from 'react-select/animated';
import { SEARCH_OPTIONS } from '../ProductsReserveUIHelpers';
import { map } from 'lodash';
import { Dropdown } from 'react-bootstrap';
import AuthorizationWrapper from '../../../../../components/AuthorizationWrapper';

const animatedComponents = makeAnimated();

const ProductReserveFilter = ({ loadingStores, optionsStore, ids, onRetryMutilTicket, onFinishMutilTicket }) => {
    const { formatMessage } = useIntl();
    const location = useLocation();
    const history = useHistory();
    const params = queryString.parse(location.search.slice(1, 100000));

    const currentStore = useMemo(() => {
        let _current = !!params?.sc_store_id
            ? optionsStore?.filter(
                _store => !!_store?.value && params?.sc_store_id?.split(',').some(_param => Number(_param) == _store.value)
            )
            : undefined;

        return _current
    }, [params?.sc_store_id, optionsStore]);

    return (
        <Fragment>
            <div className='row'>
                <div className='col-4'>
                    <div className='d-flex align-items-center'>
                        <span className="mr-4" style={{ minWidth: 'fit-content' }}>
                            {formatMessage({ defaultMessage: 'Gian hàng' })}
                        </span>
                        <Select
                            options={optionsStore}
                            className='w-100 select-report-custom'
                            placeholder={formatMessage({ defaultMessage: 'Tất cả' })}
                            components={animatedComponents}
                            isClearable
                            isMulti
                            value={currentStore}
                            isLoading={loadingStores}
                            onChange={values => {
                                const storesPush = values?.length > 0
                                    ? map(values, 'value')?.join(',')
                                    : undefined;

                                history.push(`/products/reserve?${queryString.stringify({
                                    ...params,
                                    sc_store_id: storesPush
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
                <div className='col-8'>
                    <div className='ml-10 row d-flex align-items-center'>
                        <div className='col-4 text-right'>
                            <span className="mr-4" style={{ minWidth: 'fit-content' }}>
                                {formatMessage({ defaultMessage: 'Tên phiếu dự trữ' })}
                            </span>
                        </div>
                        <div className="col-8 pl-0">
                            <div className='input-icon' style={{ height: 'fit-content' }}>
                                <input
                                    type="text"
                                    className="form-control pl-4"
                                    placeholder={formatMessage({ defaultMessage: "Tìm kiếm" })}
                                    style={{ height: 38 }}
                                    onBlur={(e) => {
                                        history.push(`/products/reserve?${queryString.stringify({
                                            ...params,
                                            q: e.target.value
                                        })}`.replaceAll('%2C', '\,'))
                                    }}
                                    defaultValue={params?.q || ''}
                                    onKeyDown={e => {
                                        if (e.keyCode == 13) {
                                            history.push(`/products/reserve?${queryString.stringify({
                                                ...params,
                                                q: e.target.value
                                            })}`.replaceAll('%2C', '\,'))
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className={`mt-4 d-flex align-items-center ${(params?.status == 'done' || params?.status == 'error') ? 'justify-content-between' : 'justify-content-end'}`}>
                <div className="d-flex align-items-center py-4">
                    {(params?.status == 'done' || params?.status == 'error') && (
                        <div className="mr-4 text-primary" style={{ fontSize: 14 }}>
                            {formatMessage({ defaultMessage: "Đã chọn {selected}" }, { selected: ids?.length })}
                        </div>
                    )}
                    <AuthorizationWrapper keys={['product_reserve_finish']}>
                        {params?.status == 'done' && (
                            <button
                                type="button"
                                className="btn btn-elevate btn-primary ml-4"
                                disabled={ids?.length == 0}
                                style={{
                                    color: "white",
                                    width: 'max-content',
                                    minWidth: 120,
                                    background: ids?.length == 0 ? "#6c757d" : "",
                                    border: ids?.length == 0 ? "#6c757d" : "",
                                }}
                                onClick={onFinishMutilTicket}
                            >
                                {formatMessage({ defaultMessage: "Kết thúc" })}
                            </button>
                        )}
                    </AuthorizationWrapper>
                    {params?.status == 'error' && (
                        <Dropdown drop='down'>
                            <Dropdown.Toggle disabled={ids?.length == 0} className={` btn ${ids.length ? 'btn-primary' : 'btn-darkk'}`}>
                                {formatMessage({ defaultMessage: "Thao tác hàng loạt" })}
                            </Dropdown.Toggle>

                            <Dropdown.Menu>
                                <AuthorizationWrapper keys={['product_reserve_action']}>
                                    <Dropdown.Item onClick={onRetryMutilTicket} className="mb-1 d-flex">
                                        {formatMessage({ defaultMessage: "Thử lại" })}
                                    </Dropdown.Item>
                                </AuthorizationWrapper>
                                <AuthorizationWrapper keys={['product_reserve_finish']}>
                                    <Dropdown.Item onClick={onFinishMutilTicket} className="d-flex" >
                                        {formatMessage({ defaultMessage: "Kết thúc" })}
                                    </Dropdown.Item>
                                </AuthorizationWrapper>
                            </Dropdown.Menu>

                        </Dropdown>
                    )}
                </div>
                <AuthorizationWrapper keys={['product_reserve_action']}>
                    <button
                        className="btn btn-primary d-flex align-items-center"
                        style={{ minWidth: 120 }}
                        onClick={(e) => {
                            e.preventDefault();
                            history.push('/products/reserve-create')
                        }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="mr-2 bi bi-plus-square" viewBox="0 0 16 16">
                            <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z" />
                            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
                        </svg>
                        <span>{formatMessage({ defaultMessage: "Tạo dự trữ" })}</span>
                    </button>
                </AuthorizationWrapper>
            </div>
        </Fragment>
    )
};

export default memo(ProductReserveFilter);