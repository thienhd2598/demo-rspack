import dayjs from "dayjs";
import React, { useCallback, useState } from "react";
import { memo } from "react";
import { useIntl } from "react-intl";
import DateRangePicker from "rsuite/DateRangePicker";
import queryString from "querystring";
import { useHistory, useLocation } from "react-router-dom";
import _ from "lodash";
import Select from 'react-select';
import { SEARCH_DATE_OPTIONS } from "../../utils/contants";
import makeAnimated from 'react-select/animated';

const FilterDate = memo(({
  dataChannelStores,
  currentDateRangeTime,
  setCurrentDateRangeTime,
}) => {
  const {currentChannels, channelsActive, currentStores, optionsStores, loadingStore} = dataChannelStores || {}
  const location = useLocation();
  const history = useHistory();
  const params = queryString.parse(location.search.slice(1, 100000));  
  const { formatMessage } = useIntl();
  const animatedComponents = makeAnimated();
  const disabledFutureDate = useCallback((date) => {
    const unixDate = dayjs(date).unix();
    const fromDate = dayjs().startOf('day').add(-89, 'day').unix();
    const toDate = !!params?.is_old_order
      ? dayjs().endOf('day').add(-90, 'day').unix()
      : dayjs().endOf("day").unix();

    return !!params?.is_old_order
      ? unixDate > toDate
      : (unixDate < fromDate || unixDate > toDate);
  }, [params?.is_old_order]);

  return (
    <div className="mt-4 mb-4 d-flex align-items-center row">
      <div className='col-2 pr-0' style={{ zIndex: 98 }}>
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
            _.find((SEARCH_DATE_OPTIONS), _option => _option?.value == params?.search_type_date)
            || SEARCH_DATE_OPTIONS[0]
          }
          defaultValue={SEARCH_DATE_OPTIONS[0]}
          options={SEARCH_DATE_OPTIONS}
          onChange={value => {
            history.push(`/orders/return-order?${queryString.stringify({
              ...params,
              page: 1,
              search_type_date: value.value
            })}`);
          }}
          formatOptionLabel={(option, labelMeta) => {
            return <div>{option.label}</div>
          }}
        />
      </div>
      <div className="col-4 pl-0">
        <DateRangePicker
          style={{ width: "100%" }}
          character={" - "}
          className='date-select-options'
          disabledDate={disabledFutureDate}
          format={"HH:mm dd/MM/yyyy"}
          value={currentDateRangeTime}
          placeholder={"hh:mm dd/mm/yyyy - hh:mm dd/mm/yyyy"}
          placement={"bottomEnd"}
          onChange={(values) => {
            setCurrentDateRangeTime(values);
            if (!!values) {
              let [gtCreateTime, ltCreateTime] = [
                dayjs(values[0])
                  .unix(),
                dayjs(values[1])
                  .unix(),
              ];
              let rangeTimeConvert = [gtCreateTime, ltCreateTime]?.map(
                (_range) => new Date(_range * 1000)
              );
              setCurrentDateRangeTime(rangeTimeConvert);
              history.push(
                `${location.pathname}?${queryString.stringify({
                  ...params,
                  page: 1,
                  gt_orderAt: gtCreateTime,
                  lt_orderAt: ltCreateTime,
                })}`
              );
            } else {
              history.push(
                `${location.pathname}?${queryString.stringify(
                  _.omit(
                    {
                      ...params,
                      page: 1
                    },
                    ["gt_orderAt", "lt_orderAt"]
                  )
                )}`
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
      <div className='col-3' style={{ zIndex: 95 }}>
          <div className='d-flex align-items-center'>
            <Select
              options={channelsActive}
              className='w-100 select-report-custom'
              placeholder={formatMessage({ defaultMessage: 'Chọn sàn' })}
              components={animatedComponents}
              isClearable
              isMulti
              value={currentChannels}
              isLoading={loadingStore}
              onChange={values => {
                const channelsPush = values?.length > 0 ? _.map(values, 'value')?.join(',') : undefined;
                history.push(`${location.pathname}?${queryString.stringify({...params, page: 1,channel: channelsPush, stores: "",})}`);
  
              }}
              formatOptionLabel={(option, labelMeta) => {
                return <div>
                  {!!option.logo && <img src={option.logo} alt="" style={{ width: 15, height: 15, marginRight: 4 }} />}
                  {option.label}
                </div>
              }}
            />
          </div>
        </div>
      <div className='col-3' style={{ zIndex: 95 }}>
        <div className='d-flex align-items-center'>
          <Select
            options={optionsStores}
            className='w-100 select-report-custom'
            placeholder={formatMessage({ defaultMessage: 'Chọn gian hàng' })}
            components={animatedComponents}
            isClearable
            isMulti
            value={currentStores}
            isLoading={loadingStore}
            onChange={values => {
              const stores = values?.length > 0 ? _.map(values, 'value')?.join(',') : undefined;
              history.push(`${location.pathname}?${queryString.stringify({...params,page: 1, stores: stores})}`.replaceAll('%2C', '\,'));
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
  );
});

export default FilterDate;
