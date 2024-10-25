import React, { Fragment, memo, useMemo, useState, useCallback } from 'react';
import queryString from 'querystring';
import { useHistory, useLocation } from "react-router-dom";
import Select from "react-select";
import { useIntl } from "react-intl";
import op_connector_channels from '../../../../../graphql/op_connector_channels';
import { useMutation, useQuery } from '@apollo/client';
import makeAnimated from 'react-select/animated';
import DateRangePicker from "rsuite/DateRangePicker";
import _ from 'lodash';
import dayjs from 'dayjs';
import { saveAs } from 'file-saver';
import { useElementOnScreen } from '../../../../../hooks/useElementOnScreen';
import clsx from 'clsx';
import { DATE_TYPE_OPTIONS, ORDER_TYPE_OPTIONS, COMPARE_TYPE_OPTIONS, STATUS_ORDER } from '../../../Finance/trading-report/TradingReportHelper';
import LoadingDialog from '../../../ProductsStore/product-new/LoadingDialog';
import { useToasts } from 'react-toast-notifications';
import mutate_cfExportAnalysisFinanceOverview from '../../../../../graphql/mutate_cfExportAnalysisFinanceOverview';

const animatedComponents = makeAnimated();
const MAX_COLUMN_CHART = 14;

const TradingReportOverviewFilter = ({ currentChannel, channelsActive, loadingChannels, variables }) => {
    const location = useLocation();
    const history = useHistory();
    const { formatMessage } = useIntl();
    const { addToast } = useToasts();
    const params = queryString.parse(location.search.slice(1, 100000));
    const [containerRef, isVisible] = useElementOnScreen({
        root: null,
        rootMargin: "0px",
        threshold: 1.0
    });

    const [currentDateRangeTime, setCurrentDateRangeTime] = useState([
        new Date(dayjs().subtract(30, "day").startOf("day")),
        new Date(dayjs().subtract(1, "day").startOf("day")),
    ]);

    const [cfExportAnalysisFinanceOverview, { loading: loadingCfExportOverviewFinanceReport }] = useMutation(mutate_cfExportAnalysisFinanceOverview);

    const disabledFutureDate = useCallback((date) => {
        const unixDate = dayjs(date).unix();
        const today = dayjs().startOf('day').add(0, 'day').unix();

        return unixDate >= today;
    }, []);

    useMemo(() => {
        if (!params?.from_date || !params?.to_date) return;

        let rangeTimeConvert = [params?.from_date, params?.to_date]?.map(
            _range => new Date(_range * 1000)
        );
        setCurrentDateRangeTime(rangeTimeConvert)
    }, [params?.from_date, params?.to_date]);

    const optionsDateType = useMemo(() => {
        const mappedRangeTime = currentDateRangeTime?.map(time => dayjs(time).format('YYYY-MM-DD'))
        const diffTime = dayjs(mappedRangeTime[1]).diff(mappedRangeTime[0], 'day');
        const targetTime = (diffTime + 1) / MAX_COLUMN_CHART;

        if (targetTime <= 1) {
            return DATE_TYPE_OPTIONS;
        }
        if (1 < targetTime && targetTime <= 7) {
            return DATE_TYPE_OPTIONS.slice(0, 4)
        }
        if (7 < targetTime && targetTime <= 30) {
            return DATE_TYPE_OPTIONS.slice(0, 3)
        }
        if (30 < targetTime && targetTime <= 90) {
            return DATE_TYPE_OPTIONS.slice(0, 2)
        }
        if (targetTime > 90) {
            return DATE_TYPE_OPTIONS.slice(0, 1)
        }
    }, [currentDateRangeTime]);

    const currentOrderType = useMemo(() => {
        return _.find((ORDER_TYPE_OPTIONS), _option => _option?.value == params?.order_type) || ORDER_TYPE_OPTIONS[0]
    }, [params?.order_type]);

    const currentDateType = useMemo(() => {
        return _.find((optionsDateType), _option => _option?.value == params?.date_type) || optionsDateType[optionsDateType?.length - 1] || DATE_TYPE_OPTIONS[3]
    }, [params?.date_type, optionsDateType]);

    const currentCompareType = useMemo(() => {
        return _.find((COMPARE_TYPE_OPTIONS), _option => _option?.value == params?.compare_type) || COMPARE_TYPE_OPTIONS[0]
    }, [params?.compare_type]);

    const onNavigate = useCallback(
        (key, value) => {
            history.push(`/report/effective-business?${queryString.stringify({
                ...params,
                page: 1,
                [key]: value
            })}`);
        }, [params]
    );

    const onExportOverviewFinanceReport = useCallback(async () => {
        try {
            const { data } = await cfExportAnalysisFinanceOverview({
                variables
            });

            if (!!data?.cfExportAnalysisFinanceOverview?.success) {
                const nameFileExport = `BCKD_${dayjs(currentDateRangeTime[0]).format('DD/MM/YYYY').replaceAll('/', '')}_${dayjs(currentDateRangeTime[1]).format('DD/MM/YYYY').replaceAll('/', '')}.xlsx`;
                saveAs(data?.cfExportAnalysisFinanceOverview?.link, nameFileExport)
                addToast(formatMessage({ defaultMessage: 'Xuất file thành công' }), {
                    appearance: "success",
                });
            } else {
                addToast(formatMessage({ defaultMessage: 'Xuất file thất bại' }), {
                    appearance: "error",
                });
            }
        } catch (err) {
            addToast(formatMessage({ defaultMessage: 'Có lỗi xảy ra, xin vui lòng thử lại' }), {
                appearance: "error",
            });
        }
    }, [variables])

    return (
        <Fragment>
            <div ref={containerRef}></div>
            <LoadingDialog show={loadingCfExportOverviewFinanceReport} />
            <div className={clsx(!isVisible && 'filter-report-fixed-top')}>
                <div className={clsx('row align-items-center', !isVisible ? 'mt-2 mb-4' : 'mt-8 mb-4')}>
                    <div className='col-3' style={{ zIndex: 9 }}>
                        <div className='d-flex align-items-center'>
                            <span className="mr-4" style={{ minWidth: 'fit-content' }}>{formatMessage({ defaultMessage: 'Sàn' })}</span>
                            <Select
                                options={channelsActive}
                                className='w-100 select-report-custom'
                                placeholder='Tất cả'
                                components={animatedComponents}
                                isClearable
                                isMulti
                                value={currentChannel}
                                isLoading={loadingChannels}
                                onChange={values => {
                                    const channelsPush = values?.length > 0
                                        ? _.map(values, 'value')?.join(',')
                                        : undefined;

                                    history.push(`/report/effective-business?${queryString.stringify({
                                        ...params,
                                        channels: channelsPush
                                    })}`.replaceAll('%2C', '\,'))
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
                    <div className='col-3'>
                        <div className='row d-flex align-items-center'>
                            <div className='col-5 pr-0'>
                                <span className='mr-4' style={{ float: 'right' }}>
                                    {formatMessage({ defaultMessage: 'Thời gian đặt hàng' })}
                                </span>
                                {/* <Select
                                    className='w-100 select-report-custom'
                                    theme={(theme) => ({
                                        ...theme,
                                        borderRadius: 0,
                                        colors: {
                                            ...theme.colors,
                                            primary: '#ff5629'
                                        }
                                    })}
                                    isLoading={false}
                                    value={currentOrderType}
                                    defaultValue={ORDER_TYPE_OPTIONS[0]}
                                    options={ORDER_TYPE_OPTIONS}
                                    onChange={value => onNavigate('order_type', value?.value)}
                                    formatOptionLabel={(option, labelMeta) => {
                                        return <div>{option.label}</div>
                                    }}
                                /> */}
                            </div>
                            <div className="col-7 pl-0">
                                <DateRangePicker
                                    style={{ width: "100%" }}
                                    character={" - "}
                                    className='date-select-options'
                                    disabledDate={disabledFutureDate}
                                    format={"dd/MM/yyyy"}
                                    value={currentDateRangeTime}
                                    placeholder={"dd/mm/yyyy - dd/mm/yyyy"}
                                    placement={"bottomEnd"}
                                    cleanable={false}
                                    onChange={(values) => {
                                        setCurrentDateRangeTime(values);
                                        if (!!values) {
                                            let typeAcecpt = [];
                                            let [gtCreateTime, ltCreateTime] = [
                                                dayjs(values[0]).startOf("day").unix(),
                                                dayjs(values[1]).endOf("day").unix(),
                                            ];
                                            let rangeTimeConvert = [gtCreateTime, ltCreateTime]?.map(
                                                (_range) => new Date(_range * 1000)
                                            );
                                            setCurrentDateRangeTime(rangeTimeConvert);

                                            const mappedRangeTime = rangeTimeConvert?.map(time => dayjs(time).format('YYYY-MM-DD'))
                                            const diffTime = dayjs(mappedRangeTime[1]).diff(mappedRangeTime[0], 'day');
                                            console.log({ diffTime })
                                            const targetTime = (diffTime + 1) / MAX_COLUMN_CHART;

                                            if (targetTime <= 1) {
                                                typeAcecpt = _.map(DATE_TYPE_OPTIONS, op => op?.value);
                                            }
                                            if (1 < targetTime && targetTime <= 7) {
                                                typeAcecpt = _.map(DATE_TYPE_OPTIONS.slice(0, 4), op => op?.value);
                                            }
                                            if (7 < targetTime && targetTime <= 30) {
                                                typeAcecpt = _.map(DATE_TYPE_OPTIONS.slice(0, 3), op => op?.value);
                                            }
                                            if (30 < targetTime && targetTime <= 90) {
                                                typeAcecpt = _.map(DATE_TYPE_OPTIONS.slice(0, 2), op => op?.value);
                                            }
                                            if (targetTime > 90) {
                                                typeAcecpt = _.map(DATE_TYPE_OPTIONS.slice(0, 1), op => op?.value);
                                            }

                                            console.log({ typeAcecpt });
                                            const currDateType = (!params?.date_type || !typeAcecpt?.some(type => type == params?.date_type))
                                                ? { date_type: typeAcecpt[typeAcecpt?.length - 1] }
                                                : {}

                                            history.push(
                                                `${location.pathname}?${queryString.stringify({
                                                    ...params,
                                                    ...currDateType,
                                                    page: 1,
                                                    from_date: gtCreateTime,
                                                    to_date: ltCreateTime,
                                                })}`
                                            );
                                        } else {
                                            history.push(
                                                `${location.pathname}?${queryString.stringify(
                                                    _.omit({ ...params }, ["from_date", "to_date"])
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
                        </div>
                    </div>
                    <div className='col-4'>
                        <div className='row d-flex align-items-center'>
                            <div className='col-4 pr-0'>
                                <span className='mr-4' style={{ float: 'right' }}>
                                    {formatMessage({ defaultMessage: 'Trạng thái đơn' })}
                                </span>
                            </div>
                            <div className="col-8 pl-0" style={{ zIndex: 90 }}>
                                <Select
                                    placeholder={formatMessage({ defaultMessage: "Hoàn thành" })}
                                    isClearable
                                    value={STATUS_ORDER.find(_option => (params?.order_type || 'completed') == _option?.value) || []}
                                    onChange={values => {
                                        console.log('values', values)
                                        history.push(`/report/effective-business?${queryString.stringify({
                                            ...params,
                                            order_type: values?.value
                                        })}`)
                                    }}
                                    formatOptionLabel={(option, labelMeta) => {
                                        return <div> {option.label}</div>
                                    }}
                                    options={STATUS_ORDER}
                                />
                            </div>
                        </div>
                    </div>
                    <div className='col-2 d-flex'>
                        <button
                            className="w-100 btn btn-primary btn-elevate"
                            type="submit"
                            onClick={onExportOverviewFinanceReport}
                        >
                            {formatMessage({ defaultMessage: 'Xuất file' })}
                        </button>
                    </div>
                </div>
                <div className={clsx('row align-items-center', !isVisible ? 'mb-2' : 'mt-8 mb-4')}>
                    <div className='col-4'>
                        <div className='d-flex align-items-center'>
                            <span className="mr-4" style={{ minWidth: 'fit-content' }}>
                                {formatMessage({ defaultMessage: 'Tổng hợp theo' })}
                            </span>
                            <Select
                                options={optionsDateType}
                                className='w-100 select-report-custom'
                                placeholder='Tất cả'
                                components={animatedComponents}
                                value={currentDateType}
                                onChange={value => onNavigate('date_type', value?.value)}
                            />
                        </div>
                    </div>
                    <div className='col-5'>
                        <div className='row d-flex align-items-center'>
                            <div className='col-5 d-flex justify-content-end'>
                                <span>{formatMessage({ defaultMessage: 'Kỳ so sánh' })}</span>
                            </div>
                            <div className='col-7 pl-0'>
                                <Select
                                    options={COMPARE_TYPE_OPTIONS}
                                    className='w-100 select-report-custom'
                                    placeholder='Tất cả'
                                    components={animatedComponents}
                                    value={currentCompareType}
                                    onChange={value => onNavigate('compare_type', value?.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Fragment>
    )
};

export default memo(TradingReportOverviewFilter);