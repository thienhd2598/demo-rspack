import React, { Fragment, memo, useCallback, useEffect, useMemo, useState, useRef } from 'react';
import {
    Card,
    CardBody,
} from "../../../../../_metronic/_partials/controls";
import _ from 'lodash';
import { formatNumberToCurrency } from '../../../../../utils';
import queryString from 'querystring';
import { useToasts } from 'react-toast-notifications';
import { useLocation } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip as TooltipChart,
    Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import dayjs from 'dayjs';
import { useIntl } from 'react-intl';
import query_report_chart from '../../../../../graphql/query_report_charts';
import "react-datepicker/dist/react-datepicker.css";
// Import Swiper React components
import { Swiper, SwiperSlide } from 'swiper/react';
import SwipperCore, { Navigation } from 'swiper';
// Import Swiper styles
import 'swiper/swiper.scss';
import 'swiper/components/navigation/navigation.scss';
import { rexToRGBAColor } from '../../ReportUIHelper';

SwipperCore.use([Navigation]);

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    TooltipChart,
    Legend
);

export const options = {
    responsive: true,
    plugins: {
        legend: {
            position: 'bottom',
            labels: {
                boxWidth: 6,
                boxHeigth: 6,
                usePointStyle: { width: 10, height: 10 }
            },
        },
    },
    scales: {
        y: {
            ticks: {
                callback: function (value, index, ticks) {
                    console.log(`Value`, value, index, ticks)
                    return 10;
                }
            }
        }
    }
};

const START_DAY_HOUR = '00:00:00';
const END_DAY_HOUR = '23:59:59';

const increaseTimeHour = (time, step) => {
    let splitedTime = Number(time.split(':')[0]);
    splitedTime += step;
    if (splitedTime == 24) return END_DAY_HOUR;

    return splitedTime < 10 ? `0${splitedTime}:00:00` : `${splitedTime}:00:00`;
};

export default memo(({ variables }) => {
    const { formatMessage } = useIntl();
    const location = useLocation();
    const params = queryString.parse(location.search.slice(1, 100000));
    const { addToast, removeAllToasts } = useToasts();
    const _initSelected = useRef(true);

    const type_date = useMemo(
        () => {
            try {
                let type = params?.type || 'hours'

                return { type }
            } catch (error) {
                return {}
            }
        }, [params.type]
    );

    const source = useMemo(
        () => {
            try {
                if (params?.source) {
                    return {
                        source: params?.source
                    }
                }
                return {}
            } catch (error) {
                return {}
            }
        }, [params?.source]
    )
    const { data: dataReportChart, loading: loadingReportChart } = useQuery(query_report_chart, {
        variables: {
            ...variables,
            ...type_date,
            ...source,
            last_type: params?.type_filter || 'today'
        },
        fetchPolicy: 'cache-and-network'
    });

    const [currentSelected, setCurrentSelected] = useState([]);

    useMemo(
        () => {
            if (!dataReportChart || dataReportChart?.report_charts?.length == 0 || !_initSelected.current) return;

            let selectedChartDefault = dataReportChart?.report_charts
                ?.filter(_chart => !!_chart?.defaultSelected)
                ?.map(_chart => _chart?.title)
            setCurrentSelected(selectedChartDefault || []);
            _initSelected.current = false;
        }, [dataReportChart]
    );

    const dataLineChart = useMemo(
        () => {
            let labelLineChart = dataReportChart?.report_charts ? dataReportChart?.report_charts[0]?.data?.map(_chart => _chart.label) : [];

            return {
                labels: labelLineChart,
                datasets: dataReportChart?.report_charts
                    ?.filter(_static => currentSelected?.some(_selected => _selected === _static?.title))
                    ?.map(
                        _data => {
                            let parseValue = _data?.data?.map(item => item.value);
                            let maxValue = Math.max(...parseValue);
                            let total = _.reduce(parseValue, (sum, n) => sum + n, 0);

                            return {
                                label: _data?.title,
                                data: _data?.data?.map(_chart => ({
                                    x: _chart?.value,
                                    y: total > 0 ? ((_chart?.value / maxValue) * 100).toFixed() : 0
                                })),
                                borderColor: _data?.color,
                                backgroundColor: _data?.color,
                                pointStyle: 'circle',
                                pointRadius: 4,
                                pointHoverRadius: 6,
                                // tension: 0.5
                            }
                        }
                    ) || []
            }
        }, [dataReportChart, currentSelected, dataReportChart?.report_charts]
    );

    const onSelectedStatic = useCallback(
        (_static) => {
            setCurrentSelected(prev => {
                if (prev?.some(_selected => _selected === _static?.title)) {
                    if (currentSelected?.length < 2) {
                        removeAllToasts();
                        addToast(formatMessage({ defaultMessage: 'Phải có ít nhất 1 chỉ số' }), { appearance: 'warning' });
                        return prev;
                    }
                    return prev?.filter(_selected => _selected != _static?.title)
                } else {
                    if (currentSelected?.length > 3) {
                        removeAllToasts();
                        addToast(formatMessage({ defaultMessage: 'Chỉ có thể chọn tối đa 4 chỉ số' }), { appearance: 'warning' });
                        return prev;
                    } else {
                        return prev.concat(_static?.title)
                    }
                }
            })
        }, [options, currentSelected]
    );

    return (
        <Card>
            <CardBody>
                {
                    loadingReportChart && <div className='text-center w-100 mt-6' style={{ position: 'absolute' }} >
                        <span className="ml-3 spinner spinner-primary"></span>
                    </div>
                }
                <Swiper
                    onSlideChange={() => { }}
                    onSwiper={(swiper) => { }}
                    observer={true}
                    // slidesPerGroup={5}                    
                    observeParents={true}
                    freeMode={true}
                    watchSlidesVisibility={true}
                    watchSlidesProgress={true}
                    modules={[Navigation]}
                    navigation={{ clickable: true }}
                    style={{ padding: '5px 0px' }}
                    autoplay={{
                        delay: 3000,
                        disableOnInteraction: false
                    }}
                    breakpoints={{
                        0: {
                            slidesPerView: 1,
                            slidesPerGroup: 1,
                            spaceBetween: 10
                        },
                        480: {
                            slidesPerView: 2,
                            slidesPerGroup: 2,
                            spaceBetween: 10
                        },
                        768: {
                            slidesPerView: 4,
                            slidesPerGroup: 4,
                            spaceBetween: 10,
                        },
                        1024: {
                            slidesPerView: 4,
                            slidesPerGroup: 4,
                            spaceBetween: 15
                        },
                        1280: {
                            slidesPerView: 5,
                            slidesPerGroup: 5,
                            spaceBetween: 15
                        },
                        1500: {
                            slidesPerView: 5,
                            slidesPerGroup: 5,
                            spaceBetween: 20
                        }
                    }}
                >
                    {!loadingReportChart && dataReportChart?.report_charts?.map(
                        (_static, index) => (
                            <SwiperSlide key={`static-report-${index}`}>
                                <div
                                    className='filter-block-report d-flex flex-column'
                                    onClick={() => onSelectedStatic(_static)}
                                    style={currentSelected?.some(_selected => _selected === _static?.title) ? {
                                        borderTop: `4px solid ${_static?.color}`,
                                        background: rexToRGBAColor(_static?.color, .08)
                                    } : {}}
                                >
                                    <div className="d-flex flex-column">
                                        <p className="filter-block-report-title">
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
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" class="bi bi-info-circle" viewBox="0 0 16 16">
                                                                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                                                                    <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
                                                                </svg>
                                                            </span>
                                                        </span>
                                                    </OverlayTrigger>
                                                </span>
                                            )}
                                        </p>
                                        <span className="txt-value">{formatNumberToCurrency(_static?.value)}{_static?.unit}</span>
                                    </div>
                                    <div className='d-flex justify-content-between align-items-start' style={{ gap: 5 }}>
                                        <span>{formatMessage({ defaultMessage: "So với kì trước" })}</span>
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
                            </SwiperSlide>
                        )
                    )}
                </Swiper>
                {/* </div> */}

                {/* Filter 3 */}
                <div className='d-flex flex-row-reverse justify-content-between align-items-center mt-8'>
                    <p>{formatMessage({ defaultMessage: 'Đã chọn' })} {currentSelected?.length}/4</p>
                </div>

                {/* Line chart */}
                <Line
                    data={dataLineChart}
                    style={{ maxHeight: '300px' }}
                    options={{
                        responsive: true,
                        interaction: {
                            mode: 'index',
                            intersect: false,
                        },
                        stacked: false,
                        plugins: {
                            legend: {
                                align: 'center',
                                position: 'bottom',
                                labels: {
                                    padding: 30,
                                    boxWidth: 6,
                                    boxHeigth: 6,
                                    pointStyle: 'rect',
                                    usePointStyle: { width: 6, height: 6, borderRadius: 8 }
                                },
                            },
                            datalabels: {
                                display: false
                            },
                            tooltip: {
                                callbacks: {
                                    label: function (context) {
                                        let { unit } = _.find(dataReportChart?.report_charts, { title: context?.dataset?.label });

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
                                min: 0,
                                // max: 100,
                                grid: {
                                    borderDash: [4]
                                },
                                ticks: {
                                    stepSize: 20,
                                    callback: function (value, index, values) {
                                        return ''
                                    }
                                }
                            },
                            x: {
                                grid: {
                                    borderColor: '#3c7ed5',
                                    borderWidth: 2,
                                    tickWidth: 3,
                                    tickColor: '#3c7ed5'
                                },
                            }
                        }
                    }}
                />

            </CardBody>
        </Card>
    )
});
