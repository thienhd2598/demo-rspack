import React, { Fragment, memo, useState, useMemo, useCallback } from 'react';
import { abbrNum, formatNumberToCurrency } from '../../../../utils';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { ChevronRightOutlined } from "@material-ui/icons";
import { useHistory } from 'react-router-dom';
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { useIntl } from 'react-intl';
import dayjs from 'dayjs';
import _ from 'lodash';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    Filler,
    PointElement,
    LineElement,
    Title,
    Tooltip as TooltipChart,
    Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
    Filler,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    TooltipChart,
    Legend
);

const rexToRGBAColor = (color, alpha = 0.8) => {
    return `rgba(${parseInt(color?.substring(1, 3), 16)}, ${parseInt(color?.substring(3, 5), 16)}, ${parseInt(color?.substring(5, 7), 16)}, ${alpha})`;
}

const parseLableTime = (time) => {
    return time < 10 ? `0${time}:00:00` : `${time}:00:00`
}

const LAST_HOUR_IN_DAY = 24;
const TIME_LAST_DAY = `23:59`;
const LINE_TIME_ENABLE = [0, 3, 6, 9, 12, 15, 18, 21, 24];
const LINE_TIME = _.range(25);


const BlockSaleAnalys = ({ loading, data }) => {
    const { formatMessage } = useIntl();
    const history = useHistory();
    const [currentSelected, setCurrentSelected] = useState(0);
    const nowHour = dayjs().startOf('hour').format('H');    

    const dataSetsChart = useMemo(
        () => {
            if (!data?.overview_charts) return [];
            const originTime = {
                "__typename": "ChartItem",
                "label": "00:00:00",
                "value": 0
            };

            let dataSets = [
                { ...data?.overview_charts?.[currentSelected], title: formatMessage({ defaultMessage: `{title} hôm nay` }, { title: data?.overview_charts?.[currentSelected]?.title }) },
                { ...data?.overview_charts?.[currentSelected], isPrev: true, color: '#c4c4c4', title: formatMessage({ defaultMessage: 'So với hôm qua' }) }
            ]?.map(
                _data => ({
                    ..._data,
                    data: LINE_TIME.map(
                        (_item, index) => {
                            const dataItem = [
                                originTime,
                                ...(_data?.isPrev ? _data?.prevData : _data?.data)?.map((_prev, idx) => ({ ..._prev, label: parseLableTime(idx + 1) }))
                            ];

                            let label = parseLableTime(_item);

                            if (dataItem?.some(_value => _value?.label == label)) {
                                let { value } = _.find(dataItem, { label: label }) || {};

                                const itemsPrev = LINE_TIME.slice(0, index + 1);
                                const dataPrev = (!_data?.isPrev && _item > nowHour) ? [] : _.filter(dataItem, _item => {
                                    return itemsPrev.some(prev => {
                                        let labelPrev = _.range(prev)?.map(_range => parseLableTime(_range));
                                        return labelPrev.some(__ => __ == _item?.label);
                                    })
                                });

                                const sumItemsPrev = _.sum(dataPrev?.map(_item => _item?.value))

                                return {
                                    label: _item,
                                    value: !_data?.isPrev && _item > nowHour ? undefined : value + sumItemsPrev,
                                }
                            }
                            return {
                                label: _item,
                                value: !_data?.isPrev && _item > nowHour ? undefined : 0,
                            }
                        })
                }));

            return dataSets;
        }, [data?.overview_charts, currentSelected, nowHour]
    );
    

    const dataLineChart = useMemo(
        () => {
            let labelLineChart = dataSetsChart ? dataSetsChart[0]?.data?.map(_chart => {
                if (_chart.label == LAST_HOUR_IN_DAY) return TIME_LAST_DAY
                return `${_chart.label}:00`
            }) : [];

            return {
                labels: labelLineChart,
                datasets: dataSetsChart?.map(
                    _data => {
                        return {
                            label: _data?.title,
                            data: _data?.data?.map(_chart => ({
                                x: _chart?.value,
                                y: _chart?.value
                            })),
                            borderColor: _data?.color,
                            backgroundColor: (context) => {
                                if (!context?.chart?.chartArea) return;

                                const { ctx, data, chartArea: { top, bottom } } = context?.chart;
                                const gradientBg = ctx.createLinearGradient(0, top, 0, bottom);

                                gradientBg.addColorStop(0, rexToRGBAColor(_data?.color, .8));
                                gradientBg.addColorStop(0.3, rexToRGBAColor(_data?.color, .6));
                                gradientBg.addColorStop(0.5, rexToRGBAColor(_data?.color, .4));
                                gradientBg.addColorStop(0.8, rexToRGBAColor(_data?.color, .2));
                                gradientBg.addColorStop(1, rexToRGBAColor(_data?.color, .1));

                                return gradientBg;
                            },
                            fill: true,
                            pointStyle: 'circle',
                            tension: 0.5,
                            pointHoverRadius: (context) => {
                                if (LINE_TIME_ENABLE.some(_time => _time == context?.parsed?.x) || context?.parsed?.x == nowHour) {
                                    return 6
                                }
                                return 0
                            },
                            pointRadius: (context) => {
                                if (LINE_TIME_ENABLE.some(_time => _time == context?.parsed?.x) || context?.parsed?.x == nowHour) {
                                    return 4
                                }
                                return 0
                            },
                        }
                    }
                ) || []
            }
        }, [dataSetsChart, currentSelected, nowHour]
    );

    return (
        <div className='sale-analys-wrapper'>
            <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                    <h3 className="txt-title">
                        {formatMessage({ defaultMessage: "Phân tích bán hàng" })}
                    </h3>
                    <span className="ml-3">({formatMessage({ defaultMessage: "Hôm nay đến" })} {dayjs().startOf('hours').format('HH:mm')})</span>
                </div>
                <div
                    className='d-flex align-items-center justify-content-center cursor-pointer'
                    onClick={() => {
                        history.push(`/report/overview`);
                    }}
                >
                    <span className="fs-14">{formatMessage({ defaultMessage: "Xem thêm" })}</span>
                    <ChevronRightOutlined className='ml-2' />
                </div>
            </div>
            <div className="row mt-6">
                <div className="col-9">
                    <Line
                        data={dataLineChart}
                        style={{ maxHeight: '400px', position: 'relative', top: "-30px" }}
                        plugins={[
                            {
                                id: 'legendMargin',
                                beforeInit(chart, legend, options) {
                                    const fitValue = chart.legend.fit;

                                    chart.legend.fit = function fit() {
                                        fitValue.bind(chart.legend)();
                                        return this.height += 15;
                                    }
                                }
                            }                            
                        ]}
                        options={{
                            responsive: true,
                            interaction: {
                                mode: 'index',
                                intersect: false,
                            },
                            stacked: false,
                            plugins: {
                                legend: {
                                    align: 'start',
                                    position: 'top',
                                    onClick: (e) => e.stopPropagation(),
                                    labels: {
                                        padding: 30,
                                        boxWidth: 6,
                                        boxHeigth: 6,
                                        pointStyle: 'rect',
                                        usePointStyle: { width: 10, height: 10, borderRadius: 4 }
                                    },
                                },
                                datalabels: {
                                    display: false
                                },
                                tooltip: {
                                    callbacks: {
                                        label: function (context) {
                                            let { unit } = _.find(dataSetsChart, { title: context?.dataset?.label });

                                            var label = context.dataset.label || '';
                                            if (context.raw.x !== null) {
                                                label += ': ' + formatNumberToCurrency(context.raw.x) + `${unit || ''}`;
                                            }
                                            return label;
                                        }
                                    }
                                }
                            },
                            scales: {
                                y: {
                                    // min: 0,
                                    // max: 100,
                                    grid: {
                                        borderDash: [4]
                                    },
                                    beginAtZero: true,
                                    ticks: {
                                        // stepSize: 25,
                                        callback: function (value, index, values) {
                                            return `${abbrNum(value)}`
                                        }
                                    }
                                },
                                x: {
                                    grid: {
                                        // borderColor: '#3c7ed5',
                                        // borderWidth: 2,
                                        // tickWidth: 3,
                                        // tickColor: '#3c7ed5'
                                    },
                                    ticks: {
                                        callback: function (value, index, values) {
                                            if (value == LAST_HOUR_IN_DAY) return TIME_LAST_DAY;
                                            return LINE_TIME_ENABLE.some(item => item == value) ? value : null;
                                        }
                                    }
                                }
                            }
                        }}
                    />
                </div>
                <div className="col-3">
                    {loading && <Skeleton count={3} height={100} className='mb-4' />}
                    {!loading && data?.overview_charts?.map((_static, index) => (
                        <div style={{ position: 'relative' }}>
                            <div className='arrow-block-report' style={{ borderRight: currentSelected == index ? `10px solid ${rexToRGBAColor(_static?.color, .8)}` : '10px solid transparent' }} />
                            <div
                                className='filter-block-report d-flex flex-column mb-4'
                                key={`sale-analys-${index}`}
                                onClick={() => setCurrentSelected(index)}
                                style={currentSelected == index ? { background: rexToRGBAColor(_static?.color, .8), border: 'none', color: '#fff' } : {}}
                            >
                                <div className="d-flex flex-column">
                                    <span className="mb-2">
                                        {_static?.title}
                                        {_static?.tooltip && (
                                            <span>
                                                <OverlayTrigger
                                                    placement='bottom'
                                                    overlay={
                                                        <Tooltip>
                                                            <span>
                                                                {_static?.tooltip}
                                                            </span>
                                                        </Tooltip>
                                                    }
                                                >
                                                    <span
                                                        style={{ cursor: 'pointer' }}
                                                    >
                                                        <span className='ml-2 mr-4'>
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" class="bi bi-info-circle" viewBox="0 0 16 16">
                                                                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                                                                <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
                                                            </svg>
                                                            {/* <i className="fas fa-exclamation-circle" style={{ fontSize: 14 }}></i> */}
                                                        </span>
                                                    </span>
                                                </OverlayTrigger>
                                            </span>
                                        )}
                                    </span>
                                    <span className="txt-value">{formatNumberToCurrency(_static?.value)}{_static?.unit}</span>
                                </div>
                                <div className='d-flex justify-content-between align-items-start' style={{ gap: 5 }}>
                                    <span>{formatMessage({ defaultMessage: 'So với hôm qua' })}</span>
                                    {
                                        !_static?.increase && _static?.increase != 0 ? <span className='d-flex align-items-center'>
                                            -
                                        </span> : <span className='d-flex align-items-center'>
                                            <span>
                                                <i
                                                    className={`fas ${_static?.increase >= 0 ? 'fa-sort-up' : 'fa-sort-down'} mr-1`}
                                                    style={{ color: _static?.increase >= 0 ? '#6cee0e' : 'red', position: 'relative', top: _static?.increase >= 0 ? 5 : 0 }}
                                                >
                                                </i>
                                            </span>
                                            {Math.abs(_static?.increase * 100).toFixed(2)}%
                                        </span>
                                    }

                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
};

export default memo(BlockSaleAnalys);