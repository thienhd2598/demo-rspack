import React, { Fragment, memo, useCallback, useMemo, useState } from 'react';
import queryString from 'querystring';
import { useHistory, useLocation } from "react-router-dom";
import Select from "react-select";
import { useIntl } from "react-intl";
import { useMutation, useQuery } from '@apollo/client';
import makeAnimated from 'react-select/animated';
import DateRangePicker from "rsuite/DateRangePicker";
import { ORDER_TYPE_OPTIONS, STATUS_ORDER } from '../TradingReportHelper';
import _ from 'lodash';
import dayjs from 'dayjs';
import mutate_CfExportFinanceReport from '../../../../../graphql/mutate_ cfExportFinanceReport';
import LoadingDialog from '../../../ProductsStore/product-new/LoadingDialog';
import { useToasts } from 'react-toast-notifications';
import { saveAs } from 'file-saver';
import AuthorizationWrapper from '../../../../../components/AuthorizationWrapper';

const animatedComponents = makeAnimated();

const TradingReportChannelFilter = ({ variables, currentChannel, channelsActive, loadingChannels }) => {
    const location = useLocation();
    const history = useHistory();
    const { formatMessage } = useIntl();
    const { addToast } = useToasts();
    const params = queryString.parse(location.search.slice(1, 100000));

    const [currentDateRangeTime, setCurrentDateRangeTime] = useState([
        new Date(dayjs().subtract(30, "day").startOf("day")),
        new Date(dayjs().subtract(1, "day").startOf("day")),
    ]);

    const [cfExportFinanceReport, { loading: loadingCfExportFinanceReport }] = useMutation(mutate_CfExportFinanceReport);

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

    const currentTimeType = useMemo(() => {
        return _.find((ORDER_TYPE_OPTIONS), _option => _option?.value == params?.time_type) || ORDER_TYPE_OPTIONS[0]
    }, [params?.time_type]);

    const onNavigate = useCallback(
        (key, value) => {
            history.push(`/finance/trading-report?${queryString.stringify({
                ...params,
                page: 1,
                [key]: value
            })}`);
        }, [params]
    );

    const onExportFinanceReport = useCallback(async () => {
        try {
            const { data } = await cfExportFinanceReport({
                variables
            });

            if (!!data?.cfExportFinanceReport?.success) {
                const nameFileExport = `BCKDtheosan_${dayjs(currentDateRangeTime[0]).format('DD/MM/YYYY').replaceAll('/', '')}_${dayjs(currentDateRangeTime[1]).format('DD/MM/YYYY').replaceAll('/', '')}.xlsx`;
                saveAs(data?.cfExportFinanceReport?.link, nameFileExport)
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
            <LoadingDialog show={loadingCfExportFinanceReport} />
            <div className='my-8 row align-items-center'>
                <div className='col-3' style={{ zIndex: 9 }}>
                    <div className='d-flex align-items-center'>
                        <span className="mr-4" style={{ minWidth: 'fit-content' }}>{formatMessage({ defaultMessage: 'Sàn' })}</span>
                        <Select
                            options={channelsActive}
                            className='w-100 select-report-custom'
                            placeholder={formatMessage({ defaultMessage: 'Tất cả' })}
                            components={animatedComponents}
                            isClearable
                            isMulti
                            value={currentChannel}
                            isLoading={loadingChannels}
                            onChange={values => {
                                const channelsPush = values?.length > 0
                                    ? _.map(values, 'value')?.join(',')
                                    : undefined;

                                history.push(`/finance/trading-report?${queryString.stringify({
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
                        <div className='col-4 pr-0'>
                            <span className='mr-4' style={{ float: 'right' }}>
                                {formatMessage({ defaultMessage: 'Thời gian đặt hàng' })}
                            </span>
                            {/* <Select
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
                                value={currentTimeType}
                                defaultValue={ORDER_TYPE_OPTIONS[0]}
                                options={ORDER_TYPE_OPTIONS}
                                onChange={value => onNavigate('time_type', value?.value)}
                                formatOptionLabel={(option, labelMeta) => {
                                    return <div>{option.label}</div>
                                }}
                            /> */}
                        </div>
                        <div className="col-8 pl-0">
                            <DateRangePicker
                                style={{ width: "100%" }}
                                character={" - "}
                                className='date-select-options'
                                disabledDate={disabledFutureDate}
                                format={"dd/MM/yyyy"}
                                value={currentDateRangeTime}
                                cleanable={false}
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
                                value={STATUS_ORDER.find(_option => (params?.time_type || 'completed') == _option?.value) || []}
                                onChange={values => {
                                    console.log('values', values)
                                    history.push(`/finance/trading-report?${queryString.stringify({
                                        ...params,
                                        time_type: values?.value
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
                <AuthorizationWrapper keys={['finance_trading_report_export']}>
                    <div className='col-2 d-flex'>
                        <button
                            type="submit"
                            className="w-100 btn btn-primary btn-elevate"
                            onClick={onExportFinanceReport}
                        >
                            {formatMessage({ defaultMessage: 'Xuất file' })}
                        </button>
                    </div>
                </AuthorizationWrapper>
            </div>
        </Fragment>
    )
};

export default memo(TradingReportChannelFilter);