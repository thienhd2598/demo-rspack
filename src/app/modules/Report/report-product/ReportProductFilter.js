import { useQuery } from "@apollo/client";
import queryString from 'querystring';
import React, { memo, useCallback, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { useHistory, useLocation } from "react-router-dom";
import Select from "react-select";
import makeAnimated from 'react-select/animated';
import DateRangePicker from "rsuite/DateRangePicker";
import DatePicker from "rsuite/DatePicker";
import {
    Card,
    CardBody,
} from "../../../../_metronic/_partials/controls";
import _ from 'lodash';
import op_connector_channels from "../../../../graphql/op_connector_channels";
import query_sme_catalog_stores from "../../../../graphql/query_sme_catalog_stores";
import dayjs from "dayjs";

const animatedComponents = makeAnimated();

export default memo(({ visible, dataStore, loadingStore, tabActive }) => {
    const { formatMessage } = useIntl();
    const location = useLocation();
    const history = useHistory();
    const params = queryString.parse(location.search.slice(1, 100000));
    const { data: dataChannel, loading: loadingChannel } = useQuery(op_connector_channels);
    const { data: dataWarehouse, loading: loadingWarehouse } = useQuery(query_sme_catalog_stores);

    const [currentDateRangeTime, setCurrentDateRangeTime] = useState([
        new Date(dayjs().subtract(7, "day").startOf("day")),
        new Date(dayjs().subtract(1, "day").startOf("day")),
    ]);
    const [currentDateTime, setCurrentDateTime] = useState(new Date(dayjs().subtract(1, "day").startOf("day")));

    const disabledFutureDate = useCallback((date) => {
        const unixDate = dayjs(date).unix();
        const today = dayjs().startOf('day').add(0, 'day').unix();

        return unixDate >= today;
    }, []);

    useMemo(() => {
        if (!params?.date) {
            setCurrentDateTime(new Date(dayjs().subtract(1, "day").startOf("day")))
            return
        };

        setCurrentDateTime(new Date(params?.date * 1000))
    }, [params?.date]);

    useMemo(() => {
        if (!params?.from || !params?.to) {
            setCurrentDateRangeTime([
                new Date(dayjs().subtract(7, "day").startOf("day")),
                new Date(dayjs().subtract(1, "day").startOf("day")),
            ]);
            return
        };

        let rangeTimeConvert = [params?.from, params?.to]?.map(
            _range => new Date(_range * 1000)
        );
        setCurrentDateRangeTime(rangeTimeConvert)
    }, [params?.from, params?.to]);

    const [currentValueChannel, optionsChannel] = useMemo(
        () => {
            let _options = [{
                label: formatMessage({ defaultMessage: 'Tất cả' }),
                value: '',
                logo: ''
            }].concat(dataChannel?.op_connector_channels?.map(
                _channel => ({
                    label: _channel?.name,
                    logo: _channel?.logo_asset_url,
                    value: _channel?.code
                })
            ) || []);

            let _current = !!params?.channel
                ? _options?.filter(
                    _channel => !!_channel?.value && params?.channel?.split(',').some(_param => _param == _channel.value)
                )
                : [{
                    label: formatMessage({ defaultMessage: 'Tất cả' }),
                    value: '',
                    logo: ''
                }];

            return [_current, _options];
        }, [dataChannel, params]
    );

    const [currentStore, optionsStore] = useMemo(() => {
        let _options = [{
            label: formatMessage({ defaultMessage: 'Tất cả' }),
            value: '',
            logo: ''
        }].concat(dataStore?.sc_stores?.filter(_store => !!currentValueChannel && currentValueChannel?.some(ii => ii.value == _store.connector_channel_code || !ii.value))
            ?.map(_store => {
                let _channel = dataStore?.op_connector_channels?.find(_ccc => _ccc.code == _store.connector_channel_code)
                return { label: _store.name, value: _store.id, logo: _channel?.logo_asset_url }
            }) || []);

        let _current = !!params?.store
            ? _options.filter(_store => !!_store?.value && params?.store?.split(',').some(_param => _param == _store.value))
            : [{
                label: formatMessage({ defaultMessage: 'Tất cả' }),
                value: '',
                logo: ''
            }];

        return [_current, _options]
    }, [dataStore, params, currentValueChannel]);

    const [currentWarehouse, optionWarehouse] = useMemo(
        () => {
            let _options = [{
                label: formatMessage({ defaultMessage: 'Tất cả' }),
                value: '',
            }].concat(dataWarehouse?.sme_warehouses?.map(
                warehouse => ({
                    label: warehouse?.name,
                    value: warehouse?.id
                })
            ) || []);

            let _current = !!params?.warehouse
                ? _options?.filter(
                    warehouse => !!warehouse?.value && params?.warehouse?.split(',').some(_param => _param == warehouse.value)
                )
                : [{
                    label: formatMessage({ defaultMessage: 'Tất cả' }),
                    value: '',
                }];

            return [_current, _options];
        }, [dataWarehouse, params]
    );

    const onChangeOptions = useCallback(
        (type, value) => {
            let paramsValue = {};
            let currentValue = {
                'channel': currentValueChannel,
                'store': currentStore,
                'warehouse': currentWarehouse
            }
            let checkedEmptyCurrentValue = currentValue[type]?.every(_current => !!value && !_current?.value);

            if (!!value) {
                let checkedEmptyValueMultilSelect = Array.isArray(value) && value?.length == 0;

                paramsValue = {
                    ...paramsValue,
                    // ...((checkedEmptyValueMultilSelect || type === "channel") ? {
                    //     store: undefined
                    // } : {}),
                    [type]: checkedEmptyCurrentValue
                        ? value.value
                        : _.map(
                            _.filter(value, _current => !!_current.value),
                            'value'
                        ).join(',')
                }
            } else {
                if (type === 'channel') {
                    // Clear both channel and store when channel is cleared
                    paramsValue = {
                        ...paramsValue,
                        channel: undefined,
                        store: undefined,
                    };
                } else if (type === 'store') {
                    // Clear only store when store is cleared
                    paramsValue = {
                        ...paramsValue,
                        store: undefined,
                    };
                } else if (type === 'warehouse') {
                    // Clear only warehouse when warehouse is cleared
                    paramsValue = {
                        ...paramsValue,
                        warehouse: undefined,
                    };
                }
            }

            history.push(`/report/product?${queryString.stringify({
                ...params,
                ...paramsValue
            })}`.replaceAll('%2C', '\,'));

        }, [currentValueChannel, params, currentStore, currentWarehouse]
    );

    return (
        <Card>
            <CardBody>
                <div className={`row align-items-center justify-content-between ${!visible ? 'filter-report-fixed-top' : ''}`}>
                    <div className='col-12'>
                        <div className='row'>
                            <div className='col-3'>
                                <div className='d-flex align-items-center'>
                                    <span className="mr-4" style={{ minWidth: 'fit-content' }}>{formatMessage({ defaultMessage: 'Thời gian đặt hàng' })}</span>
                                    {tabActive == 1 && (
                                        <DateRangePicker
                                            style={{ width: "100%" }}
                                            character={" - "}
                                            className='date-cost-options'
                                            disabledDate={disabledFutureDate}
                                            format={"dd/MM/yyyy"}
                                            cleanable={false}
                                            value={currentDateRangeTime}
                                            placeholder={"dd/mm/yyyy - dd/mm/yyyy"}
                                            placement={"bottomEnd"}
                                            onChange={(values) => {
                                                setCurrentDateRangeTime(values);
                                                if (!!values) {
                                                    let [gtCreateTime, ltCreateTime] = [
                                                        dayjs(values[0]).startOf("day").unix(),
                                                        dayjs(values[1]).endOf("day").unix(),
                                                    ];
                                                    let rangeTimeConvert = [gtCreateTime, ltCreateTime]?.map(
                                                        (_range) => new Date(_range * 1000)
                                                    );
                                                    setCurrentDateRangeTime(rangeTimeConvert);
                                                    history.push(
                                                        `${location.pathname}?${queryString.stringify({
                                                            ...params,
                                                            page: 1,
                                                            from: gtCreateTime,
                                                            to: ltCreateTime,
                                                        })}`
                                                    );
                                                } else {
                                                    history.push(`${location.pathname}?${queryString.stringify(
                                                        _.omit({ ...params }, ["from", "to"]
                                                        ))}`
                                                    );
                                                }
                                            }}
                                            locale={{
                                                sunday: "CN",
                                                monday: "T2",
                                                tuesday: "T3",
                                                wednesday: "T4",
                                                thursday: "T5",
                                                friday: "T6",
                                                saturday: "T7",
                                                ok: formatMessage({ defaultMessage: "Đồng ý" }),
                                                today: formatMessage({ defaultMessage: "Hôm nay" }),
                                                yesterday: formatMessage({ defaultMessage: "Hôm qua" }),
                                                hours: formatMessage({ defaultMessage: "Giờ" }),
                                                minutes: formatMessage({ defaultMessage: "Phút" }),
                                                seconds: formatMessage({ defaultMessage: "Giây" }),
                                                formattedMonthPattern: "MM/yyyy",
                                                formattedDayPattern: "dd/MM/yyyy",
                                                // for DateRangePicker
                                                last7Days: formatMessage({ defaultMessage: "7 ngày qua" }),
                                            }}
                                        />
                                    )}
                                    {tabActive == 2 && (
                                        <DatePicker
                                            style={{ width: "100%" }}
                                            format={"dd/MM/yyyy"}
                                            className='date-cost-options'
                                            cleanable={false}
                                            value={currentDateTime}
                                            placement={"bottomEnd"}
                                            disabledDate={disabledFutureDate}
                                            locale={{
                                                sunday: "CN",
                                                monday: "T2",
                                                tuesday: "T3",
                                                wednesday: "T4",
                                                thursday: "T5",
                                                friday: "T6",
                                                saturday: "T7",
                                                ok: formatMessage({ defaultMessage: "Đồng ý" }),
                                                formattedMonthPattern: "MM/yyyy",
                                                formattedDayPattern: "dd/MM/yyyy",
                                            }}
                                            onChange={(value) => {
                                                let time = dayjs(value).endOf("day").unix();
                                                let rangeTimeConvert = new Date(time * 1000);
                                                setCurrentDateTime(rangeTimeConvert);

                                                history.push(
                                                    `${location.pathname}?${queryString.stringify({
                                                        ...params,
                                                        page: 1,
                                                        date: time,
                                                    })}`
                                                );
                                            }}
                                        />
                                    )}
                                </div>
                            </div>
                            <div className='col-3' style={{ zIndex: 9 }}>
                                <div className='d-flex align-items-center'>
                                    <span className="mr-4" style={{ minWidth: 'fit-content' }}>{formatMessage({ defaultMessage: 'Sàn' })}</span>
                                    <Select
                                        options={optionsChannel}
                                        className='w-100 select-report-custom'
                                        placeholder='Tất cả'
                                        components={animatedComponents}
                                        isClearable
                                        isMulti={currentValueChannel?.every(_channel => !_channel?.value) ? false : true}
                                        value={currentValueChannel}
                                        isLoading={loadingChannel}
                                        onChange={value => {
                                            onChangeOptions('channel', value)
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
                            <div className='col-3' style={{ zIndex: 9 }}>
                                <div className='d-flex align-items-center'>
                                    <span className="mr-4" style={{ minWidth: 'fit-content' }}>{formatMessage({ defaultMessage: 'Gian hàng' })}</span>
                                    <Select
                                        value={currentStore}
                                        options={optionsStore}
                                        components={animatedComponents}
                                        isMulti={currentStore?.every(_store => !_store?.value) ? false : true}
                                        className='w-100 select-report-custom'
                                        placeholder={formatMessage({ defaultMessage: 'Tất cả' })}
                                        isClearable
                                        isLoading={loadingStore}
                                        onChange={value => onChangeOptions('store', value)}
                                        formatOptionLabel={(option, labelMeta) => {
                                            return <div>
                                                {!!option.logo && <img src={option.logo} style={{ width: 15, height: 15, marginRight: 4 }} />}
                                                {option.label}
                                            </div>
                                        }}
                                    />
                                </div>
                            </div>
                            {tabActive == 1 && <div className='col-3 d-flex align-items-center'>
                                    <span className="mr-4" style={{ minWidth: 'fit-content' }}>{formatMessage({ defaultMessage: 'Kho' })}</span>
                                    <Select
                                        options={optionWarehouse}
                                        className='w-100 select-report-custom'
                                        placeholder='Tất cả'
                                        components={animatedComponents}
                                        isClearable
                                        isMulti={currentWarehouse?.every(warehouse => !warehouse?.value) ? false : true}
                                        value={currentWarehouse}
                                        isLoading={loadingWarehouse}
                                        onChange={value => {
                                            onChangeOptions('warehouse', value)
                                        }}
                                        formatOptionLabel={(option, labelMeta) => {
                                            return <div>
                                                {option.label}
                                            </div>
                                        }}
                                    />
                                </div>}
                        </div>
                    </div>
                </div>
            </CardBody>
        </Card>
    )
});
