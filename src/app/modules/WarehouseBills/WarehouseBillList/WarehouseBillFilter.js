import React, { Fragment, memo, useMemo, useRef, useState } from 'react';
import { useHistory, useLocation } from "react-router-dom";
import { useMutation, useQuery } from "@apollo/client";
import { formatNumberToCurrency } from '../../../../utils'
import _ from 'lodash';
import { useToasts } from "react-toast-notifications";
import queryString from 'querystring';
import Select from "react-select";
import DateRangePicker from 'rsuite/DateRangePicker';
import { PROTOCOL_IN, PROTOCOL_OUT, SEARCH_OPTIONS, TYPE_WAREHOUSE, SEARCH_OPTIONS_BILL_OUT } from '../WarehouseBillsUIHelper';
import dayjs from 'dayjs';
import query_sme_catalog_stores from '../../../../graphql/query_sme_catalog_stores';
import { toAbsoluteUrl } from '../../../../_metronic/_helpers';
import WarehouseBillCount from './WarehouseBillCount';
import { useIntl } from 'react-intl';
import query_sc_stores_basic from '../../../../graphql/query_sc_stores_basic';
import AuthorizationWrapper from '../../../../components/AuthorizationWrapper';

const WarehouseBillFilter = ({ onShowUploadFile, dataWarehouse, whereCondition }) => {
    const { formatMessage } = useIntl();
    const location = useLocation()
    const history = useHistory()
    const params = queryString.parse(location.search.slice(1, 100000));
    const [valueRangeTime, setValueRangeTime] = useState(null);

    const { data: dataStore, loading } = useQuery(query_sc_stores_basic, {
        fetchPolicy: 'cache-and-network'
    })
    useMemo(
        () => {
            if (!params?.gt || !params?.lt) return;

            let rangeTimeConvert = [params?.gt, params?.lt]?.map(
                _range => new Date(_range * 1000)
            );
            setValueRangeTime(rangeTimeConvert);
        }, [params?.gt, params?.lt]
    );

    const disabledFutureDate = (date) => {
        const today = new Date();
        return date > today; // trả về true nếu ngày được chọn là ngày trong tương lai
    };

    const [current, options] = useMemo(() => {
        let _options = dataStore?.sc_stores?.map(_store => {
            let _channel = dataStore?.op_connector_channels?.find(_ccc => _ccc.code == _store.connector_channel_code)
            return { label: _store.name, value: _store.id, logo: _channel?.logo_asset_url }
        }) || [];

        let _current = _options.find(_store => _store.value == params?.store) || []

        return [_current, _options]
    }, [dataStore, params]);
    return (
        <Fragment>
               <div style={{ flex: 1 }} className="mb-8" >
                <ul className="nav nav-tabs">
                    {
                        TYPE_WAREHOUSE.map((_tab, index) => {
                            const { title, type } = _tab;
                            const isActive = type == (params?.type || 'in')
                            return (
                                <li
                                    key={`tab-order-${index}`}
                                    className="nav-item"
                                >
                                    <a className={`nav-link font-weight-normal ${isActive ? 'active' : ''}`}
                                        style={{ fontSize: '16px' }}
                                        onClick={e => {
                                            e.preventDefault();
                                            history.push(`/products/warehouse-bill/list?${queryString.stringify(
                                                _.omit({
                                                    page: 1,
                                                    type: type,
                                                }, ['warehouseId', 'protocol', 'q', 'search_type', 'store'])
                                            )}`)
                                        }}
                                    >
                                        {title}
                                    </a>
                                </li>
                            )
                        })
                    }
                </ul>
              
            </div>
            <div className='row mb-4 d-flex align-items-center'>
                {
                    (params.type != 'out') ? <div className='col-2 pr-0 text-right'>
                        <Select
                            className='w-100 custom-select-warehouse'
                            theme={(theme) => ({
                                ...theme,
                                borderRadius: 0,
                                colors: {
                                    ...theme.colors,
                                    primary: '#ff5629'
                                }
                            })}
                            isLoading={false}
                            isDisabled={true}
                            value={_.omit(SEARCH_OPTIONS_BILL_OUT[0], ['placeholder'])}
                            defaultValue={_.omit(SEARCH_OPTIONS_BILL_OUT[0], ['placeholder'])}
                            options={_.map(...SEARCH_OPTIONS_BILL_OUT.slice(0, 1), _bill => _.omit(_bill, ['placeholder']))}
                            onChange={value => {
                                history.push(`/products/warehouse-bill/list?${queryString.stringify({
                                    ...params,
                                    page: 1,
                                    date_search_type: value.value
                                })}`)
                            }}
                            formatOptionLabel={(option, labelMeta) => {
                                return <div>{option.label}</div>
                            }}
                        />
                    </div> : <div className='col-2 pr-0' style={{ zIndex: 95 }}>
                        <Select
                            className='w-100 custom-select-warehouse'
                            theme={(theme) => ({
                                ...theme,
                                borderRadius: 0,
                                colors: {
                                    ...theme.colors,
                                    primary: '#ff5629'
                                }
                            })}
                            isLoading={false}
                            value={
                                _.find(_.omit(SEARCH_OPTIONS_BILL_OUT, ['placeholder']), _bill => _bill?.value == params?.date_search_type)
                                || _.omit(SEARCH_OPTIONS_BILL_OUT[0], ['placeholder'])
                            }
                            defaultValue={_.omit(SEARCH_OPTIONS_BILL_OUT[0], ['placeholder'])}
                            options={_.map(SEARCH_OPTIONS_BILL_OUT, _bill => _.omit(_bill, ['placeholder']))}
                            onChange={value => {
                                history.push(`/products/warehouse-bill/list?${queryString.stringify({
                                    ...params,
                                    page: 1,
                                    date_search_type: value.value
                                })}`)
                            }}
                            formatOptionLabel={(option, labelMeta) => {
                                return <div>{option.label}</div>
                            }}
                        />
                    </div>
                }
                <div className='col-4 p-0'>
                    <DateRangePicker
                        className='custome__style__input__date '
                        style={{ width: '100%' }}
                        character={' - '}
                        format={'dd/MM/yyyy'}
                        value={valueRangeTime}
                        disabledDate={disabledFutureDate}
                        placeholder={'dd/mm/yyyy - dd/mm/yyyy'}
                        placement={'bottomEnd'}
                        onChange={values => {
                            let queryParams = {};
                            setValueRangeTime(values)

                            if (!!values) {
                                let [gtCreateTime, ltCreateTime] = [dayjs(values[0]).startOf('day').unix(), dayjs(values[1]).endOf('day').unix()];

                                queryParams = {
                                    ...params,
                                    gt: gtCreateTime,
                                    lt: ltCreateTime
                                }
                            } else {
                                queryParams = _.omit({ ...params }, ['gt', 'lt'])
                            }

                            history.push(`/products/warehouse-bill/list?${queryString.stringify(queryParams)}`);
                        }}
                        locale={{
                            sunday: 'CN',
                            monday: 'T2',
                            tuesday: 'T3',
                            wednesday: 'T4',
                            thursday: 'T5',
                            friday: 'T6',
                            saturday: 'T7',
                            ok: 'Đồng ý',
                            today: 'Hôm nay',
                            yesterday: 'Hôm qua',
                            hours: 'Giờ',
                            minutes: 'Phút',
                            seconds: 'Giây',
                            formattedMonthPattern: 'MM/yyyy',
                            formattedDayPattern: 'dd/MM/yyyy',
                            // for DateRangePicker
                            last7Days: '7 ngày qua'
                        }}
                    />
                </div>

                <div className='col-3' style={{ zIndex: 95 }}>
                    <Select
                        placeholder={formatMessage({ defaultMessage: 'Kho' })}
                        isClearable
                        className="w-100 custom-select-warehouse"
                        value={_.find(
                            _.map(dataWarehouse?.sme_warehouses, _item => ({ value: _item?.id, label: _item?.name })),
                            _item => _item?.value == params?.warehouseId
                        ) || null}
                        options={_.map(dataWarehouse?.sme_warehouses, _item => ({ value: _item?.id, label: _item?.name }))}
                        onChange={values => {
                            if (!values) {
                                history.push(`/products/warehouse-bill/list?${queryString.stringify(
                                    _.omit({
                                        ...params,
                                    }, ['warehouseId'])
                                )}`)
                                return
                            }
                            history.push(`/products/warehouse-bill/list?${queryString.stringify({
                                ...params,
                                page: 1,
                                warehouseId: values.value
                            })}`)
                        }}
                    />
                </div>

            </div>
            <div className='row mb-4'>
                <div className='col-2 pr-0' style={{ zIndex: 2 }}>
                    <Select
                        className='w-100 custom-select-warehouse'
                        theme={(theme) => ({
                            ...theme,
                            borderRadius: 0,
                            colors: {
                                ...theme.colors,
                                primary: '#ff5629'
                            }
                        })}
                        isLoading={false}
                        value={
                            _.find(_.omit(SEARCH_OPTIONS, ['placeholder']), _bill => _bill?.value == params?.search_type)
                            || _.omit(SEARCH_OPTIONS[0], ['placeholder'])
                        }
                        defaultValue={_.omit(SEARCH_OPTIONS[0], ['placeholder'])}
                        options={_.map(SEARCH_OPTIONS, _bill => _.omit(_bill, ['placeholder']))}
                        onChange={value => {
                            history.push(`/products/warehouse-bill/list?${queryString.stringify({
                                ...params,
                                page: 1,
                                search_type: value.value
                            })}`)
                        }}
                        formatOptionLabel={(option, labelMeta) => {
                            return <div>{option.label}</div>
                        }}
                    />
                </div>
                <div className="col-4 input-icon p-0" style={{ height: 'fit-content' }} >
                    <input
                        type="text"
                        className="form-control"

                        placeholder={formatMessage(_.find(SEARCH_OPTIONS, _bill => _bill.value == params?.search_type)?.placeholder || SEARCH_OPTIONS[0].placeholder)}
                        style={{ height: 38, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                        onBlur={(e) => {
                            history.push(`/products/warehouse-bill/list?${queryString.stringify({
                                ...params,
                                page: 1,
                                q: e.target.value
                            })}`)
                        }}
                        defaultValue={params.q || ''}
                        onKeyDown={e => {
                            if (e.keyCode == 13) {
                                history.push(`/products/warehouse-bill/list?${queryString.stringify({
                                    ...params,
                                    page: 1,
                                    q: e.target.value
                                })}`)
                            }
                        }}
                    />
                    <span><i className="flaticon2-search-1 icon-md ml-6 mr-4"></i></span>
                </div>
                     <div className='col-3'>
                        <Select
                            placeholder={formatMessage({ defaultMessage: 'Gian hàng' })}
                            isClearable
                            className="w-100 custom-select-warehouse"
                            value={current}
                            options={options}
                            onChange={values => {
                                if (!values) {
                                    history.push(`/products/warehouse-bill/list?${queryString.stringify(
                                        _.omit({
                                            ...params,
                                        }, ['store'])
                                    )}`)
                                    return
                                }
                                history.push(`/products/warehouse-bill/list?${queryString.stringify({
                                    ...params,
                                    page: 1,
                                    store: values.value
                                })}`)
                            }}
                            formatOptionLabel={(option, labelMeta) => {
                                return <div> <img src={option.logo} style={{ width: 20, height: 20, marginRight: 8 }} /> {option.label}</div>
                            }}
                        />
                    </div>
                
                <div className='col-3'>
                    <Select
                        placeholder={formatMessage({ defaultMessage: 'Hình thức' })}
                        isClearable
                        className="w-100 custom-select-warehouse"
                        value={_.find(
                            params?.type == 'out' ? PROTOCOL_OUT : PROTOCOL_IN,
                            _item => _item?.value == params?.protocol
                        ) || null}
                        options={params?.type == 'out' ? PROTOCOL_OUT : PROTOCOL_IN}
                        onChange={values => {
                            if (!values) {
                                history.push(`/products/warehouse-bill/list?${queryString.stringify(
                                    _.omit({
                                        ...params,
                                    }, ['protocol'])
                                )}`)
                                return
                            }
                            history.push(`/products/warehouse-bill/list?${queryString.stringify({
                                ...params,
                                page: 1,
                                protocol: values.value
                            })}`)
                        }}
                        formatOptionLabel={(option, labelMeta) => {
                            return <div>{option.label}</div>
                        }}
                    />
                </div>
            </div>
            <div className="row d-flex align-items-center justify-content-end">

                <div className='col-3 d-flex'>
                    {params?.type == 'out' && <AuthorizationWrapper keys={['warehouse_bill_out_action']}>
                        <button
                            className="btn btn-outline-primary btn-elevate mr-2"
                            onClick={e => {
                                e.preventDefault();
                                onShowUploadFile();
                            }}
                        >
                            {formatMessage({ defaultMessage: 'Nhập file' })}
                        </button>
                    </AuthorizationWrapper>}
                    {params?.type != 'out' && <AuthorizationWrapper keys={['warehouse_bill_in_create']}>
                        <button
                            className="btn btn-outline-primary btn-elevate mr-2"
                            onClick={e => {
                                e.preventDefault();
                                onShowUploadFile();
                            }}
                        >
                            {formatMessage({ defaultMessage: 'Nhập file' })}
                        </button>
                    </AuthorizationWrapper>}
                    
                    {params?.type == 'out' && <AuthorizationWrapper keys={['warehouse_bill_out_action']}>
                        <button
                            className="btn btn-primary btn-elevate"
                            onClick={e => {
                                e.preventDefault();
                                history.push(`/products/warehouse-bill/create?type=${params?.type == 'out' ? 'out' : 'in'}`)
                            }}
                            style={{ flex: 1, }}
                        >
                                {formatMessage({ defaultMessage: 'Tạo phiếu xuất kho' })}
                        </button>
                    </AuthorizationWrapper>}
                    {params?.type != 'out' && <AuthorizationWrapper keys={['warehouse_bill_in_create']}>
                        <button
                            className="btn btn-primary btn-elevate"
                            onClick={e => {
                                e.preventDefault();
                                history.push(`/products/warehouse-bill/create?type=${params?.type == 'out' ? 'out' : 'in'}`)
                            }}
                            style={{ flex: 1, }}
                        >
                            {formatMessage({ defaultMessage: 'Tạo phiếu nhập kho' })}
                        </button>
                    </AuthorizationWrapper>}
                </div>
            </div>
        </Fragment>
    )
};

export default memo(WarehouseBillFilter);