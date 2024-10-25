import React, { memo, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Calendar } from '../components/calendar/index';
import dayjs from 'dayjs';
import { useLocation, useHistory } from "react-router-dom";
import { Divider } from "@material-ui/core";
import queryString from 'querystring';
import _ from 'lodash';
import { useIntl } from 'react-intl';
var isoWeek = require('dayjs/plugin/isoWeek')

dayjs.extend(isoWeek);

const diffHoursDay = dayjs().startOf('hour').diff(
    dayjs().startOf('day')
    , 'hour'
);

export default memo(() => {
    const { formatMessage } = useIntl();
    const location = useLocation();
    const history = useHistory();
    const params = queryString.parse(location.search.slice(1, 100000));
    const refFilterCalendar = useRef();
    const [showFilterCalendar, setShowFilterCalendar] = useState(false);
    const [currentLabel, setCurrentLabel] = useState(formatMessage({ defaultMessage: 'Chọn thời gian' }));
    const [currentValue, setCurrentValue] = useState(dayjs().subtract(1, 'day').startOf('day').format('DD/MM/YYYY'));
    const [currentType, setCurrentType] = useState(params?.type_filter || 'day');
    const [currentTypeOption, setCurrentTypeOption] = useState(params?.type_filter_option || 'select')

    useEffect(() => {
        const checkIfClickedOutside = (e) => {
            if (showFilterCalendar && refFilterCalendar.current && !refFilterCalendar.current.contains(e.target)) {
                setShowFilterCalendar(false);
            }
        };

        document.addEventListener("mousedown", checkIfClickedOutside)

        return () => {
            document.removeEventListener("mousedown", checkIfClickedOutside)
        }
    }, [showFilterCalendar]);

    const optionsCalendar = useMemo(
        () => {
            return [
                // diffHoursDay >= 0 ? {
                //     title: formatMessage({ defaultMessage: 'Thời gian báo cáo' }),
                //     value: `${formatMessage({ defaultMessage: 'Tới' })} ${dayjs().startOf('hour').format('HH:mm')} ${formatMessage({ defaultMessage: 'hôm nay' })}`,
                //     type: 'today',
                //     onChange: () => {
                //         history.push(`/report/user?${queryString.stringify({
                //             ...params,
                //             from: dayjs().startOf('day').unix(),
                //             to: dayjs().startOf('hour').unix(),
                //             type: 'hours',
                //             type_filter: 'today',
                //             type_filter_option: 'select'
                //         })}`)
                //     }
                // } : {},
                {
                    title: formatMessage({ defaultMessage: 'Hôm qua' }),
                    value: dayjs().subtract(1, 'day').startOf('day').format('DD/MM/YYYY'),
                    type: 'day',
                    onChange: () => {
                        history.push(`/report/user?${queryString.stringify({
                            ...params,
                            from: dayjs().subtract(1, 'day').startOf('day').unix(),
                            to: dayjs().subtract(1, 'day').endOf('day').unix(),
                            type: 'hours',
                            type_filter: 'day',
                            type_filter_option: 'select'
                        })}`)
                    }
                },
                {
                    title: formatMessage({ defaultMessage: 'Trong 7 ngày qua' }),
                    type: 'last7day',
                    value: `${dayjs().subtract(7, 'day').startOf('day').format('DD/MM/YYYY')} - ${dayjs().subtract(1, 'day').startOf('day').format('DD/MM/YYYY')}`,
                    onChange: () => {
                        history.push(`/report/user?${queryString.stringify({
                            ...params,
                            from: dayjs().subtract(7, 'day').startOf('day').unix(),
                            to: dayjs().subtract(1, 'day').endOf('day').unix(),
                            type: 'day',
                            type_filter: 'last7day',
                            type_filter_option: 'select'
                        })}`)
                    }
                },
                {
                    title: formatMessage({ defaultMessage: 'Trong 30 ngày qua' }),
                    type: 'last30day',
                    value: `${dayjs().subtract(30, 'day').startOf('day').format('DD/MM/YYYY')} - ${dayjs().subtract(1, 'day').startOf('day').format('DD/MM/YYYY')}`,
                    onChange: () => {
                        history.push(`/report/user?${queryString.stringify({
                            ...params,
                            from: dayjs().subtract(30, 'day').startOf('day').unix(),
                            to: dayjs().subtract(1, 'day').endOf('day').unix(),
                            type: 'day',
                            type_filter: 'last30day',
                            type_filter_option: 'select'
                        })}`)
                    }
                }
            ].filter(
                _option => !_.isEmpty(_option)
            )
        }, [params, diffHoursDay]
    );

    const optionsDate = useMemo(
        () => {
            return [
                {
                    title: formatMessage({ defaultMessage: 'Theo ngày' }),
                    type: 'day',
                    value: <Calendar
                        value={params?.from ? dayjs(parseInt(params?.from) * 1000).toDate() : dayjs().add(-1, 'day').toDate()}
                        maxDate={dayjs().add(-1, 'day').toDate()}
                        locale={'vi'}
                        onChange={(value) => {
                            setShowFilterCalendar(false);
                            history.push(`/report/user?${queryString.stringify({
                                ...params,
                                from: dayjs(value).startOf('day').unix(),
                                to: dayjs(value).endOf('day').unix(),
                                type: 'hours',
                                type_filter: 'day',
                                type_filter_option: 'date'
                            })}`)
                        }}
                    />
                },
                {
                    title: formatMessage({ defaultMessage: 'Theo tuần' }),
                    type: 'week',
                    value: <Calendar
                        value={[params?.from ? dayjs(parseInt(params?.from) * 1000).toDate() : dayjs().add(-1, 'day').toDate(), params?.to ? dayjs(parseInt(params?.to) * 1000).toDate() : dayjs().add(-1, 'day').toDate()]}
                        maxDate={dayjs().add(-1, 'day').toDate()}
                        showFixedNumberOfWeeks={true}
                        locale={'vi'}
                        showWeekNumbers
                        onChange={(value) => {
                            setShowFilterCalendar(false);
                            history.push(`/report/user?${queryString.stringify({
                                ...params,
                                from: dayjs(value).isoWeekday(1).unix(),
                                to: dayjs(value).isoWeekday(7).unix(),
                                type: 'day',
                                type_filter: 'week',
                                type_filter_option: 'date'
                            })}`)
                        }}
                    />
                },
                {
                    title: formatMessage({ defaultMessage: 'Theo tháng' }),
                    type: 'month',
                    value: <Calendar
                        value={params?.from ? dayjs(parseInt(params?.from) * 1000).toDate() : dayjs().add(-1, 'day').toDate()}
                        maxDate={dayjs().add(-1, 'day').toDate()}
                        view={'year'}
                        locale={'vi'}
                        onClickMonth={value => {
                            setShowFilterCalendar(false);
                            history.push(`/report/user?${queryString.stringify({
                                ...params,
                                from: dayjs(value).startOf('month').unix(),
                                to: dayjs(value).endOf('month').unix(),
                                type: 'day',
                                type_filter: 'month',
                                type_filter_option: 'date'
                            })}`)
                        }}
                    />
                },
                {
                    title: formatMessage({ defaultMessage: 'Theo năm' }),
                    type: 'year',
                    value: <Calendar
                        value={params?.from ? dayjs(parseInt(params?.from) * 1000).toDate() : dayjs().add(-1, 'day').toDate()}
                        maxDate={dayjs().add(-1, 'day').toDate()}
                        view={'decade'}
                        locale={'vi'}
                        onClickYear={value => {
                            setShowFilterCalendar(false);
                            history.push(`/report/user?${queryString.stringify({
                                ...params,
                                from: dayjs(value).startOf('year').unix(),
                                to: dayjs(value).endOf('year').unix(),
                                type: 'month',
                                type_filter: 'year',
                                type_filter_option: 'date'
                            })}`)
                        }}
                    />
                },
            ]
        }, [params]
    );

    useMemo(
        () => {
            let label = diffHoursDay >= 0 ? formatMessage({ defaultMessage: 'Thời gian báo cáo' }) : formatMessage({ defaultMessage: 'Hôm qua' });
            if (params?.type_filter_option === 'select') {
                let findedOption = _.find(optionsCalendar, { type: params?.type_filter });

                label = findedOption?.title || label;
            }
            if (params?.type_filter_option === 'date') {
                let findedOption = _.find(optionsDate, { type: params?.type_filter });

                label = findedOption?.title || label;
            }

            setCurrentLabel(label);
        }, [params?.type_filter, params?.type_filter_option, diffHoursDay]
    )

    useMemo(
        () => {
            if (!params?.from || !params?.to) return;
            let value = ''

            if (params?.type_filter == 'today') {
                value = `${formatMessage({ defaultMessage: 'Tới' })} ${dayjs().startOf('hour').format('HH:mm')} ${formatMessage({ defaultMessage: 'hôm nay' })}`;
            } else {
                value = _.uniq(
                    [params?.from, params?.to]?.map(date => dayjs(date * 1000).startOf('day').format('DD/MM/YYYY'))
                )?.join(' - ');
            }

            setCurrentValue(value)
        }, [params?.from, params?.to, params?.type_filter]
    );

    return (
        <div
            className='upbase-calendar'
            onClick={() => {
                // setShowFilterCalendar(prev => !prev)
                setShowFilterCalendar(true)
            }}
        >
            <div>
                <i className="far fa-calendar-alt mr-2" />
                <span>{currentValue}</span>
            </div>
            <div
                className='upbase-calendar__wrapper'
                ref={refFilterCalendar}
                style={{ display: showFilterCalendar ? 'flex' : 'none' }}
            >
                <div
                    className="upbase-calendar-left"
                >
                    <ul
                        className='upbase-calendar-left__ul'
                    >
                        {optionsCalendar?.map(option => (
                            <li
                                className={`upbase-calendar-left__li ${currentTypeOption == 'select' && currentType === option.type ? 'upbase-calendar-left__li-active' : ''}`}
                                onClick={() => {
                                    setCurrentTypeOption('select');
                                    setCurrentType(option.type);
                                }}
                            >
                                {option.title}
                            </li>
                        ))}
                    </ul>
                    <Divider orientation='horizontal' />
                    <ul
                        className='upbase-calendar-left__ul'
                    >
                        {optionsDate?.map(option => (
                            <li
                                className={`upbase-calendar-left__li ${currentTypeOption == 'date' && currentType === option.type ? 'upbase-calendar-left__li-active' : ''}`}
                                onClick={() => {
                                    setCurrentTypeOption('date');
                                    setCurrentType(option.type);
                                }}
                            >
                                {option.title}
                                <span style={{ float: 'right' }}>
                                    <i
                                        class="fas fa-chevron-right mt-2"
                                        style={{ fontSize: 12, color: currentType === option.type ? 'rgb(254, 86, 15)' : 'unset' }}
                                    />
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
                <Divider orientation='vertical' variant='fullWidth' />
                <div className='upbase-calendar-right'>
                    {currentTypeOption === 'select' && (
                        <ul
                            className='upbase-calendar-right__ul'
                        >
                            {optionsCalendar?.map(option => (
                                <li
                                    className={`upbase-calendar-right__li`}
                                    style={{ visibility: currentType === option.type ? 'visible' : 'hidden' }}
                                >
                                    {option.value}
                                    <span
                                        className="upbase-calendar-right-pick d-flex justify-content-center align-items-center"
                                        onClick={e => {
                                            e.preventDefault();
                                            e.stopPropagation();

                                            setCurrentLabel(option.title);
                                            setShowFilterCalendar(false);
                                            option.onChange()
                                        }}
                                    >
                                        {formatMessage({ defaultMessage: 'Chọn ngay' })}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                    {currentTypeOption === 'date' && (
                        <>
                            {optionsDate?.map(option => (
                                <div
                                    style={{ display: currentType === option.type ? 'block' : 'none' }}
                                    onClick={e => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                    }}
                                >
                                    {option.value}
                                </div>
                            ))}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
})