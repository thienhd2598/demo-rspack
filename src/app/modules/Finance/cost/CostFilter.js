import React, { memo, useMemo, useState, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import _ from 'lodash';
import queryString from 'querystring';
import { useLocation, useHistory } from "react-router-dom";
import Select from "react-select";
import makeAnimated from 'react-select/animated';
import DateRangePicker from "rsuite/DateRangePicker";
import dayjs from 'dayjs';
import { OPTIONS_GROUP_COST } from './CostConstants';
import AuthorizationWrapper from '../../../../components/AuthorizationWrapper';

const animatedComponents = makeAnimated();

const CostFilter = ({ onShowCreateModal, dataCostPeriodType, currentDateRangeTime, setCurrentDateRangeTime }) => {
    const { formatMessage } = useIntl();
    const location = useLocation();
    const history = useHistory();
    const params = queryString.parse(location.search.slice(1, 100000));

    const disabledFutureDate = (date) => {
        const today = new Date();
        return date > today;
    };

    useMemo(() => {
        if (!params?.time_from || !params?.time_to) return;

        let rangeTimeConvert = [params?.time_from, params?.time_to]?.map(
            _range => new Date(_range * 1000)
        );
        setCurrentDateRangeTime(rangeTimeConvert)
    }, [params?.time_from, params?.time_to]);

    const optionsTypeCost = useMemo(() => {
        return dataCostPeriodType?.getCostPeriodType?.map(cost => ({
            value: cost?.type,
            label: cost?.label
        })) || [];
    }, [dataCostPeriodType]);

    const currentTypeCost = useMemo(() => {
        return !!params?.type ? optionsTypeCost?.filter(
            cost => !!cost?.value && params?.type?.split(',').some(_param => _param == cost.value)
        ) : undefined
    }, [params?.type, optionsTypeCost]);

    return (
        <div className='row mb-8'>
            <div className='col-4'>
                <div className='d-flex align-items-center'>
                    <span className="mr-4" style={{ minWidth: 'fit-content' }}>
                        {formatMessage({ defaultMessage: 'Nhóm chi phí' })}
                    </span>
                    <Select
                        options={optionsTypeCost}
                        className='w-100 select-report-custom'
                        placeholder={formatMessage({ defaultMessage: 'Tất cả' })}
                        components={animatedComponents}
                        isClearable
                        value={currentTypeCost}
                        onChange={values => history.push(`${location.pathname}?${queryString.stringify({
                            ...params,
                            page: 1,
                            type: values?.value
                        })}`)}
                        formatOptionLabel={(option) => {
                            return <div>
                                {!!option.logo && <img src={option.logo} style={{ width: 15, height: 15, marginRight: 4 }} />}
                                {option.label}
                            </div>
                        }}
                    />
                </div>
            </div>
            <div className='col-1'></div>
            <div className='col-4'>
                <div className='d-flex align-items-center'>
                    <span className="mr-4" style={{ minWidth: 'fit-content' }}>
                        {formatMessage({ defaultMessage: 'Thời gian phân bổ' })}
                    </span>
                    <DateRangePicker
                        style={{ width: "100%" }}
                        character={" - "}
                        className='date-cost-options'
                        disabledDate={disabledFutureDate}
                        format={"dd/MM/yyyy"}
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
                                        time_from: gtCreateTime,
                                        time_to: ltCreateTime,
                                    })}`
                                );
                            } else {
                                history.push(`${location.pathname}?${queryString.stringify(
                                    _.omit({ ...params }, ["time_from", "time_to"]
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
            <AuthorizationWrapper keys={['finance_cost_period_crud']}>
                <div className='col-3'>
                    <button
                        className='btn btn-primary'
                        style={{ width: 180, float: 'right' }}
                        onClick={onShowCreateModal}
                    >
                        {formatMessage({ defaultMessage: 'Nhập chi phí' })}
                    </button>
                </div>
            </AuthorizationWrapper>
        </div>
    )
};

export default memo(CostFilter);