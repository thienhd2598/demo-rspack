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
import query_sme_catalog_stores from "../../../../graphql/query_sme_catalog_stores";
import dayjs from "dayjs";

const animatedComponents = makeAnimated();

export default memo(({ visible, id }) => {
    const { formatMessage } = useIntl();
    const location = useLocation();
    const history = useHistory();
    const params = queryString.parse(location.search.slice(1, 100000));
    const { data: dataWarehouse, loading: loadingWarehouse } = useQuery(query_sme_catalog_stores);

    const [currentDateRangeTime, setCurrentDateRangeTime] = useState([
        new Date(dayjs().subtract(30, "day").startOf("day")),
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
                new Date(dayjs().subtract(30, "day").startOf("day")),
                new Date(dayjs().subtract(1, "day").startOf("day")),
            ]);
            return
        };

        let rangeTimeConvert = [params?.from, params?.to]?.map(
            _range => new Date(_range * 1000)
        );
        setCurrentDateRangeTime(rangeTimeConvert)
    }, [params?.from, params?.to]);

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
                'warehouse': currentWarehouse
            }
            let checkedEmptyCurrentValue = currentValue[type]?.every(_current => !!value && !_current?.value);

            if (!!value) {
                paramsValue = {
                    ...paramsValue,
                    [type]: checkedEmptyCurrentValue
                        ? value.value
                        : _.map(
                            _.filter(value, _current => !!_current.value),
                            'value'
                        ).join(',')
                }
            } else {
                paramsValue = {
                    ...paramsValue,
                    ...(type === 'warehouse' ? {
                        warehouse: undefined,
                    } : {})
                }
            }

            history.push(`/report/product/${id}?${queryString.stringify({
                ...params,
                ...paramsValue
            })}`.replaceAll('%2C', '\,'));

        }, [ params, currentWarehouse]
    );

    return (
        <Card>
            <CardBody>
                <div className={`row align-items-center justify-content-between ${!visible ? 'filter-report-fixed-top' : ''}`}>
                    <div className='col-12'>
                        <div className='row'>
                            <div className='col-4'>
                                <div className='d-flex align-items-center'>
                                    <span className="mr-4" style={{ minWidth: 'fit-content' }}>{formatMessage({ defaultMessage: 'Thời gian đặt hàng' })}</span>
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
                                </div>
                            </div>
                            {params?.type == 'warehouse' && <div className='col-4' style={{ zIndex: 9 }}>
                                <div className='d-flex align-items-center'>
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
                                </div>
                            </div>}
                            {/* <div className='col-4' style={{ zIndex: 9 }}>
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
                            </div> */}
                        </div>
                    </div>
                </div>
            </CardBody>
        </Card>
    )
});
