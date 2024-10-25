import { useQuery } from "@apollo/client";
import React, { Fragment, memo, useCallback, useEffect, useMemo, useState } from "react";
import { useIntl } from "react-intl";
import query_cfGetChartFinancePlatform from "../../../../../graphql/query_cfGetChartFinancePlatform";
import dayjs from "dayjs";
import { find, sum, reduce, flatten, groupBy } from 'lodash';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { ArcElement, Chart as ChartJS, Legend, Tooltip, LinearScale, CategoryScale, BarElement } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { abbrNum, formatNumberToCurrency } from "../../../../../utils";
import { toAbsoluteUrl } from "../../../../../_metronic/_helpers";
import randomColor from "randomcolor";
import { KEY_FINANCE_DASHBOARD_CHART } from "../TradingReportHelper";

ChartJS.register(
    ArcElement,
    Tooltip,
    Legend,
    ChartDataLabels,
    CategoryScale,
    LinearScale,
    BarElement,
);

const COLOR_CHANNEL = {
    'shopee': '#FE5629',
    'lazada': '#0a62f3',
    'tiktok': '#323232',
};

const TradingReportDialog = ({ currentKeyChart, channelsActive, onResetCurrentKeyChart, onToggleDrawer, variables }) => {
    const { formatMessage } = useIntl();

    const { data, loading } = useQuery(query_cfGetChartFinancePlatform, {
        variables,
        fetchPolicy: 'cache-and-network',
    });

    const title = useMemo(() => {
        switch (currentKeyChart) {
            case 'profit':
                return formatMessage({ defaultMessage: 'Biểu đồ báo cáo kinh doanh' });
            case 'discount_sales':
                return formatMessage({ defaultMessage: 'Biểu đồ tỷ lệ giảm giá bán hàng' });
            case 'fees_platform':
                return formatMessage({ defaultMessage: 'Biểu đồ tỷ lệ chi phí nội sàn' });
            case 'marketing_costs':
                return formatMessage({ defaultMessage: 'Biểu đồ tỷ lệ chi phí MKT' });
            case 'operating_costs':
                return formatMessage({ defaultMessage: 'Biểu đồ tỷ lệ chi phí vận hành' });
            default:
                return formatMessage({ defaultMessage: 'Biểu đồ báo cáo ' });
        }
    }, [currentKeyChart]);

    const channelsActiveChart = useMemo(
        () => {
            const channelsFiltered = channelsActive
                ?.filter(channel => variables?.list_channel_code?.some(code => code == channel?.value))
                ?.map(channel => ({
                    ...channel,
                    color: COLOR_CHANNEL[channel?.value]
                }));

            return channelsFiltered
        }, [variables?.list_channel_code, channelsActive]
    );

    const [revenueCostChart, isEmptyRevenueCostChart] = useMemo(
        () => {
            if (
                !data?.cfGetChartFinancePlatform
                || data?.cfGetChartFinancePlatform?.revenue_costs?.revenue_costs_item?.length == 0
                || currentKeyChart != 'profit'
            ) {
                return [[], true]
            }
            const dataRevenue = data?.cfGetChartFinancePlatform?.revenue_costs?.revenue_costs_item;

            const dataCost = dataRevenue?.map(item => {
                const channelKey = find(channelsActiveChart, channel => channel?.value == item?.connector_channel_code);
                return {
                    expense: item?.expense,
                    revenue_sell: item?.revenue_sell,
                    label: channelKey?.label,
                    color: channelKey?.color,
                }
            });

            const isNullData = dataRevenue?.every(item => !item?.expense && !item?.expense)

            if (isNullData) return [[], true]

            const dataChart = {
                labels: dataCost?.map(item => item?.label),
                datasets: [
                    {
                        label: formatMessage({ defaultMessage: ' Doanh thu bán hàng' }),
                        data: dataRevenue?.map(item => ({ x: item?.revenue_sell, y: item?.revenue_sell })),
                        borderColor: 'blue',
                        backgroundColor: 'blue',
                        barThickness: 'flex',
                        group: true,
                        categoryPercentage: 0.8,
                        barPercentage: 0.8
                    },
                    {
                        label: formatMessage({ defaultMessage: ' Chi phí' }),
                        data: dataRevenue?.map(item => ({ x: item?.expense, y: item?.expense })),
                        borderColor: 'red',
                        backgroundColor: 'red',
                        barThickness: 'flex',
                        group: true,
                        categoryPercentage: 0.8,
                        barPercentage: 0.8
                    },
                ]
            }

            return [dataChart, false]
        }, [data, currentKeyChart, channelsActiveChart]
    );

    const [costAllocationRatio, costAllocationChart, isEmptyCostAllocationRatio] = useMemo(() => {
        if (
            !data?.cfGetChartFinancePlatform
            || data?.cfGetChartFinancePlatform?.revenue_costs?.cost_allocation?.length == 0
            || currentKeyChart != 'profit'
        ) return [[], [], true]

        const dataCostAllocation = flatten(data?.cfGetChartFinancePlatform?.revenue_costs?.cost_allocation?.map(item => item?.items));
        const groupCostAllocation = groupBy(dataCostAllocation, cost => cost?.label);

        const costRatio = Object.keys(groupCostAllocation)?.map((key) => {
            const keyCost = groupCostAllocation[key]?.[0]?.key;
            return {
                label: key,
                value: sum(groupCostAllocation[key]?.map(item => item?.value)),
                color: KEY_FINANCE_DASHBOARD_CHART[keyCost]?.color
            }
        });

        const isNullData = costRatio?.every(item => !item?.value);

        if (isNullData) return [[], [], true]

        const costRatioChart = {
            labels: channelsActive?.map?.(channel => channel?.label),
            datasets: Object.keys(groupCostAllocation)?.map((key) => {
                const keyCost = groupCostAllocation[key]?.[0]?.key;

                return {
                    label: key,
                    data: groupCostAllocation[key]?.map((item, idx) => {
                        const totalValue = sum(Object.keys(groupCostAllocation)?.map(_key => groupCostAllocation[_key][idx]?.value));

                        return {
                            x: totalValue > 0 ? ((item?.value / totalValue) * 100).toFixed() : 0,
                            y: item?.value
                        }
                    }),
                    borderColor: KEY_FINANCE_DASHBOARD_CHART[keyCost]?.color,
                    backgroundColor: KEY_FINANCE_DASHBOARD_CHART[keyCost]?.color,
                    barThickness: 'flex',
                    group: true,
                    categoryPercentage: 0.8,
                    barPercentage: 0.8
                }
            })
        }
        return [costRatio, costRatioChart, false]
    }, [data, currentKeyChart, channelsActiveChart]);

    const [ratioByChannelChart, isEmptyRatioByChannel] = useMemo(
        () => {
            if (!data?.cfGetChartFinancePlatform || data?.cfGetChartFinancePlatform?.[currentKeyChart]?.length == 0 || currentKeyChart == 'profit') {
                return [[], true]
            }
            const dataChart = data?.cfGetChartFinancePlatform?.[currentKeyChart];

            const dataRatio = dataChart?.map(item => {
                const channelKey = find(channelsActiveChart, channel => channel?.value == item?.connector_channel_code);
                return {
                    value: sum(item?.items?.map(item => item?.value)),
                    label: channelKey?.label,
                    color: channelKey?.color,
                }
            });

            const isNullData = dataRatio?.every(item => !item?.value);

            if (isNullData) return [[], true]

            return [dataRatio, false]
        }, [data, currentKeyChart, channelsActiveChart]
    );

    const [allocattionByChannelRatio, allocattionByChannelChart, isEmptyAllocationByChannelChart] = useMemo(() => {
        if (
            !data?.cfGetChartFinancePlatform
            || data?.cfGetChartFinancePlatform?.[currentKeyChart]?.length == 0
            || currentKeyChart == 'profit'
        ) return [[], [], true]

        const dataAllocationChannel = flatten(data?.cfGetChartFinancePlatform?.[currentKeyChart]?.map(item => item?.items?.map(i => ({ ...i, connector_channel_code: item?.connector_channel_code }))));
        const groupAllocationChannel = groupBy(dataAllocationChannel, cost => cost?.label);

        const colorChartRandom = randomColor({ luminosity: 'dark', count: 100 });

        const costRatio = Object.keys(groupAllocationChannel)?.map((key, index) => ({
            label: key,
            value: sum((groupAllocationChannel[key]?.map(item => item?.value))),
            color: colorChartRandom[index]
        }));

        const isNullData = costRatio?.every(item => !item?.value);

        if (isNullData) return [[], [], true]

        const costRatioChart = {
            labels: channelsActive?.map?.(channel => channel?.label),
            datasets: Object.keys(groupAllocationChannel)?.map((key, index) => {
                return {
                    label: key,
                    data: channelsActive?.map((item, idx) => {
                        const value = find(groupAllocationChannel[key], cost => cost?.connector_channel_code == item?.value)?.value || 0
                        const totalValue = sum(Object.keys(groupAllocationChannel)?.map(_key => find(groupAllocationChannel[_key], cost => cost?.connector_channel_code == item?.value)?.value || 0));

                        return {
                            x: totalValue > 0 ? ((value / totalValue) * 100).toFixed() : 0,
                            y: value,
                            display: groupAllocationChannel[key]?.some(cost => cost?.connector_channel_code == item?.value)
                        }
                    }),
                    labelsGroup: groupAllocationChannel[key]?.map(item => item?.label),
                    borderColor: colorChartRandom[index],
                    backgroundColor: colorChartRandom[index],
                    barThickness: 'flex',
                    group: true,
                    categoryPercentage: 0.8,
                    barPercentage: 0.8,
                    // minBarLength: 40,
                    order: index + 1
                }
            })
        }
        return [costRatio, costRatioChart, false]
    }, [data, currentKeyChart, channelsActiveChart]);

    return (
        <div className="drawer-filter-wrapper d-flex flex-column justify-content-between">
            <div className="d-flex flex-column">
                <div className="drawer-filter-header d-flex align-items-center">
                    <div className="d-flex align-items-center justify-content-between px-4 flex-grow-1">
                        <p className="drawer-filter-title mb-0" style={{ fontWeight: 'bold' }}>
                            {title}
                        </p>
                        <span className="cursor-pointer" onClick={onToggleDrawer}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" class="bi bi-x-lg" viewBox="0 0 16 16">
                                <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z" />
                            </svg>
                        </span>
                    </div>
                </div>
                <div style={{ overflow: 'scroll', overflowX: 'hidden', height: 'calc(100vh - 65px)' }}>
                    <div className="d-flex justify-content-center mt-4 mb-8">
                        <span className="fs-14">
                            {formatMessage({ defaultMessage: `Từ ngày {from_date} - {to_date}` }, {
                                from_date: dayjs(variables?.from_date).format('DD/MM/YYYY'),
                                to_date: dayjs(variables?.to_date).format('DD/MM/YYYY'),
                            })}
                        </span>
                    </div>
                    <div className="mt-4">
                        {currentKeyChart == 'profit' && (
                            <div className="mx-6">
                                <div className="mb-6">
                                    <strong className="fs-14">{formatMessage({ defaultMessage: 'Doanh thu và chi phí' })}</strong>
                                </div>
                                {loading && <div className='d-flex justify-content-center' style={{ minHeight: 200 }} >
                                    <span className="spinner spinner-primary"></span>
                                </div>}
                                {!loading && (
                                    <>
                                        {!!isEmptyRevenueCostChart && (
                                            <div className='d-flex  align-items-center justify-content-center'>
                                                <div className='d-flex flex-column align-items-center justify-content-center my-8'>
                                                    <img src={toAbsoluteUrl("/media/empty.png")} alt="image" width={80} />
                                                    <span className='mt-4'>
                                                        {formatMessage({ defaultMessage: "Chưa có thông tin doanh thu và chi phí" })}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                        {!isEmptyRevenueCostChart && (
                                            <Bar
                                                data={revenueCostChart}
                                                options={{
                                                    indexAxis: 'x',
                                                    interaction: {
                                                        mode: 'index',
                                                        intersect: false,
                                                    },
                                                    elements: {
                                                        bar: {
                                                            borderWidth: 0,
                                                        },
                                                    },
                                                    stacked: false,
                                                    responsive: true,
                                                    plugins: {
                                                        legend: {
                                                            align: 'center',
                                                            position: 'bottom',
                                                            onClick: (e) => e.stopPropagation(),
                                                            labels: {
                                                                padding: 20,
                                                                boxWidth: 8,
                                                                boxHeigth: 8,
                                                                pointStyle: 'circle',
                                                                usePointStyle: { width: 4, height: 4, borderRadius: 4 }
                                                            },
                                                        },
                                                        title: {
                                                            display: false,
                                                        },
                                                        tooltip: {
                                                            position: 'average',
                                                            callbacks: {
                                                                label: function (context) {
                                                                    let label = context.dataset.label || '';
                                                                    if (context.raw.x !== null) {
                                                                        label += ': ' + formatNumberToCurrency(context.raw.y) + 'đ';
                                                                    }
                                                                    return label;
                                                                }
                                                            }

                                                        },
                                                        datalabels: {
                                                            display: true,
                                                            anchor: 'end',
                                                            align: 'end',
                                                            formatter: function (value, context) {
                                                                return abbrNum(value?.y);
                                                            }
                                                        },
                                                    },
                                                    scales: {
                                                        x: {
                                                            borderDash: (context) => {
                                                                if (context?.tick?.value == 0) {
                                                                    return [0]
                                                                }

                                                                return [4]
                                                            },
                                                            stacked: false,
                                                        },
                                                        y: {
                                                            grid: {
                                                                display: false
                                                            },
                                                            borderDash: (context) => {
                                                                if (context?.tick?.value == 0) {
                                                                    return [0]
                                                                }

                                                                return [4]
                                                            },
                                                            ticks: {
                                                                callback: function (value, index, values) {
                                                                    return `${abbrNum(value)}`
                                                                }
                                                            },
                                                            afterFit: (context) => {
                                                                context.paddingTop += 20;
                                                            },
                                                            stacked: false,
                                                        }
                                                    }
                                                }}
                                            />
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                        {currentKeyChart != 'profit' && (
                            <div>
                                <div className="mb-6 ml-6">
                                    <strong className="fs-14">{formatMessage({ defaultMessage: 'Tỷ lệ theo sàn' })}</strong>
                                </div>
                                {loading && <div className='d-flex justify-content-center' style={{ minHeight: 200 }} >
                                    <span className="spinner spinner-primary"></span>
                                </div>}
                                {!loading && (
                                    <>
                                        {!!isEmptyRatioByChannel && (
                                            <div className='d-flex  align-items-center justify-content-center'>
                                                <div className='d-flex flex-column align-items-center justify-content-center my-8'>
                                                    <img src={toAbsoluteUrl("/media/empty.png")} alt="image" width={80} />
                                                    <span className='mt-4'>
                                                        {formatMessage({ defaultMessage: "Chưa có thông tin tỷ lệ theo sàn" })}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                        {!isEmptyRatioByChannel && (
                                            <Doughnut
                                                style={{ maxHeight: 200 }}
                                                data={{
                                                    labels: ratioByChannelChart?.map(_value => _value.label),
                                                    datasets: [
                                                        {
                                                            label: ratioByChannelChart?.map(_value => _value?.label),
                                                            data: ratioByChannelChart?.map(_value => _value?.value),
                                                            backgroundColor: ratioByChannelChart?.map(_value => _value?.color),
                                                            borderColor: ratioByChannelChart?.map(_value => _value?.color),
                                                            borderWidth: 1,
                                                        },
                                                    ],
                                                }}
                                                plugins={[
                                                    {
                                                        id: 'textCenter',
                                                        beforeDatasetDraw(chart, args, pluginOptions) {
                                                            const { ctx, data } = chart;

                                                            ctx.save();
                                                            ctx.fillStyle = "#000000";
                                                            ctx.font = "bolder 22px san-serif";
                                                            ctx.textAlign = "center";
                                                            ctx.textBaseline = "middle";
                                                            ctx.fillText(
                                                                abbrNum(Math.floor(sum(ratioByChannelChart?.map(item => item?.value)))),
                                                                chart?.getDatasetMeta(0)?.data?.[0]?.x,
                                                                chart?.getDatasetMeta(0)?.data?.[0]?.y
                                                            )
                                                        }
                                                    }
                                                ]}
                                                options={{
                                                    responsive: true,
                                                    plugins: {
                                                        title: {
                                                            display: false,
                                                        },
                                                        legend: {
                                                            display: false,
                                                        },
                                                        datalabels: {
                                                            formatter: (val, context) => {
                                                                var label = context.label || '';
                                                                let total = reduce(context.dataset.data, (sum, n) => sum + n, 0);
                                                                let percentData = ((context.dataset.data[context.dataIndex] / total) * 100).toFixed(2);

                                                                if (Number(percentData).toFixed() > 5) {
                                                                    label += `${percentData}%`;
                                                                } else {
                                                                    label += '';
                                                                }
                                                                return label;
                                                            },
                                                            borderRadius: 25,
                                                            borderWidth: 3,
                                                            color: "#fff",
                                                            font: {
                                                                weight: "bold"
                                                            },
                                                            padding: 6
                                                        },
                                                        tooltip: {
                                                            titleFont: '14px',
                                                            // enabled: false,`
                                                            callbacks: {
                                                                label: function (context) {
                                                                    var label = context.label || '';
                                                                    let total = reduce(context.dataset.data, (sum, n) => sum + n, 0);
                                                                    let percentData = ((context.dataset.data[context.dataIndex] / total) * 100).toFixed(2);

                                                                    label += `: ${formatNumberToCurrency(context.raw)}đ (${percentData}%)`;
                                                                    return label;
                                                                }
                                                            }
                                                        },
                                                    },
                                                }}
                                            />
                                        )}
                                        <div className='d-flex justify-content-center align-items-center mt-6 mb-1' style={{ gap: 60 }}>
                                            {channelsActiveChart?.map(channel => (
                                                <div className='d-flex align-items-center'>
                                                    <span
                                                        className='mr-1'
                                                        style={{ backgroundColor: channel?.color, minWidth: 8, height: 8, borderRadius: '50%' }}
                                                    />
                                                    {!!channel.logo && <img src={channel?.logo} style={{ width: 10, height: 10, marginRight: 2 }} />}
                                                    <span title={channel?.label}>
                                                        {channel?.label}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="mt-8 mb-6">
                        <div className="mb-6 ml-6">
                            <strong className="fs-14">{formatMessage({ defaultMessage: 'Phân bổ chi phí' })}</strong>
                        </div>
                        {currentKeyChart != 'profit' && (
                            <>
                                {loading && <div className='d-flex justify-content-center' style={{ minHeight: 200 }} >
                                    <span className="spinner spinner-primary"></span>
                                </div>}
                                {!loading && (
                                    <>
                                        {isEmptyAllocationByChannelChart && <div className='d-flex  align-items-center justify-content-center'>
                                            <div className='d-flex flex-column align-items-center justify-content-center my-8'>
                                                <img src={toAbsoluteUrl("/media/empty.png")} alt="image" width={80} />
                                                <span className='mt-4'>
                                                    {formatMessage({ defaultMessage: "Chưa có thông tin phân bổ chi phí" })}
                                                </span>
                                            </div>
                                        </div>}
                                        {!isEmptyAllocationByChannelChart && (
                                            <Fragment>
                                                <Doughnut
                                                    style={{ maxHeight: 200 }}
                                                    data={{
                                                        labels: allocattionByChannelRatio?.map(_value => _value.label),
                                                        datasets: [
                                                            {
                                                                label: allocattionByChannelRatio?.map(_value => _value?.label),
                                                                data: allocattionByChannelRatio?.map(_value => _value?.value),
                                                                backgroundColor: allocattionByChannelRatio?.map(_value => _value?.color),
                                                                borderColor: allocattionByChannelRatio?.map(_value => _value?.color),
                                                                borderWidth: 1,
                                                            },
                                                        ],
                                                    }}
                                                    plugins={[
                                                        {
                                                            id: 'textCenter',
                                                            beforeDatasetDraw(chart, args, pluginOptions) {
                                                                const { ctx, data } = chart;

                                                                ctx.save();
                                                                ctx.fillStyle = "#000000";
                                                                ctx.font = "bolder 22px san-serif";
                                                                ctx.textAlign = "center";
                                                                ctx.textBaseline = "middle";
                                                                ctx.fillText(
                                                                    abbrNum(Math.floor(sum(allocattionByChannelRatio?.map(item => item?.value)))),
                                                                    chart?.getDatasetMeta(0)?.data?.[0]?.x,
                                                                    chart?.getDatasetMeta(0)?.data?.[0]?.y
                                                                )
                                                            }
                                                        }
                                                    ]}
                                                    options={{
                                                        responsive: true,
                                                        plugins: {
                                                            title: {
                                                                display: false,
                                                            },
                                                            legend: {
                                                                display: false,
                                                            },
                                                            datalabels: {
                                                                formatter: (val, context) => {
                                                                    var label = context.label || '';
                                                                    let total = reduce(context.dataset.data, (sum, n) => sum + n, 0);
                                                                    let percentData = ((context.dataset.data[context.dataIndex] / total) * 100).toFixed(2);

                                                                    if (Number(percentData).toFixed() > 5) {
                                                                        label += `${percentData}%`;
                                                                    } else {
                                                                        label += '';
                                                                    }
                                                                    return label;
                                                                },
                                                                borderRadius: 25,
                                                                borderWidth: 3,
                                                                color: "#fff",
                                                                font: {
                                                                    weight: "bold"
                                                                },
                                                                padding: 6
                                                            },
                                                            tooltip: {
                                                                titleFont: '14px',
                                                                // enabled: false,`
                                                                callbacks: {
                                                                    label: function (context) {
                                                                        var label = context.label || '';
                                                                        let total = reduce(context.dataset.data, (sum, n) => sum + n, 0);
                                                                        let percentData = ((context.dataset.data[context.dataIndex] / total) * 100).toFixed(2);

                                                                        label += `: ${formatNumberToCurrency(context.raw)}đ (${percentData}%)`;
                                                                        return label;
                                                                    }
                                                                }
                                                            },
                                                        },
                                                    }}
                                                />
                                                <div className="mt-6 mx-4">
                                                    <Bar
                                                        // style={{ minHeight: 200 }}                                                 
                                                        data={allocattionByChannelChart}
                                                        options={{
                                                            indexAxis: 'y',
                                                            interaction: {
                                                                // mode: 'index',
                                                                intersect: false,
                                                            },
                                                            elements: {
                                                                bar: {
                                                                    borderWidth: 0,
                                                                },
                                                            },
                                                            // stacked: true,
                                                            responsive: true,
                                                            plugins: {
                                                                legend: {
                                                                    align: 'center',
                                                                    position: 'bottom',
                                                                    onClick: (e) => e.stopPropagation(),
                                                                    labels: {
                                                                        padding: 20,
                                                                        boxWidth: 8,
                                                                        boxHeigth: 8,
                                                                        pointStyle: 'circle',
                                                                        usePointStyle: { width: 4, height: 4, borderRadius: 4 }
                                                                    },
                                                                },
                                                                title: {
                                                                    display: false,
                                                                },
                                                                tooltip: {
                                                                    position: 'average',
                                                                    callbacks: {
                                                                        label: function (context) {
                                                                            if (context.raw?.display) {
                                                                                let label = context.dataset.label || '';
                                                                                if (context.raw.x !== null) {
                                                                                    label += ': ' + formatNumberToCurrency(context.raw.y) + 'đ';
                                                                                }
                                                                                return label;
                                                                            }

                                                                            return null;
                                                                        }
                                                                    }

                                                                },
                                                                datalabels: {
                                                                    display: false,
                                                                    anchor: 'end',
                                                                    align: 'end',
                                                                    formatter: function (value, context) {
                                                                        return abbrNum(value?.y);
                                                                    }
                                                                },
                                                            },
                                                            scales: {
                                                                x: {
                                                                    min: 0,
                                                                    max: 100,
                                                                    grid: {
                                                                        display: false,
                                                                    },
                                                                    // afterFit: (context) => {
                                                                    //     const isAdd = dataSetsChart?.some(_chart => _chart?.data?.some(_data => Number(_data?.x) >= 95));
                                                                    //     const paddingAdd = isAdd ? 60 : 0;

                                                                    //     context.paddingRight += paddingAdd;
                                                                    // },
                                                                    stacked: true,
                                                                    ticks: {
                                                                        stepSize: 20,
                                                                        callback: function (value, index, values) {
                                                                            return `${value}`
                                                                        }
                                                                    },
                                                                },
                                                                y: {
                                                                    stacked: true,
                                                                    grid: {
                                                                        display: false
                                                                    },
                                                                }
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </Fragment>
                                        )}
                                    </>
                                )}
                            </>
                        )}
                        {currentKeyChart == 'profit' && (
                            <>
                                {loading && <div className='d-flex justify-content-center' style={{ minHeight: 200 }} >
                                    <span className="spinner spinner-primary"></span>
                                </div>}
                                {!loading && (
                                    <>
                                        {isEmptyCostAllocationRatio && <div className='d-flex  align-items-center justify-content-center'>
                                            <div className='d-flex flex-column align-items-center justify-content-center my-8'>
                                                <img src={toAbsoluteUrl("/media/empty.png")} alt="image" width={80} />
                                                <span className='mt-4'>
                                                    {formatMessage({ defaultMessage: "Chưa có thông tin phân bổ chi phí" })}
                                                </span>
                                            </div>
                                        </div>}
                                        {!isEmptyCostAllocationRatio && (
                                            <Fragment>
                                                <Doughnut
                                                    style={{ maxHeight: 200 }}
                                                    data={{
                                                        labels: costAllocationRatio?.map(_value => _value.label),
                                                        datasets: [
                                                            {
                                                                label: costAllocationRatio?.map(_value => _value?.label),
                                                                data: costAllocationRatio?.map(_value => _value?.value),
                                                                backgroundColor: costAllocationRatio?.map(_value => _value?.color),
                                                                borderColor: costAllocationRatio?.map(_value => _value?.color),
                                                                borderWidth: 1,
                                                            },
                                                        ],
                                                    }}
                                                    plugins={[
                                                        {
                                                            id: 'textCenter',
                                                            beforeDatasetDraw(chart, args, pluginOptions) {
                                                                const { ctx, data } = chart;

                                                                ctx.save();
                                                                ctx.fillStyle = "#000000";
                                                                ctx.font = "bolder 22px san-serif";
                                                                ctx.textAlign = "center";
                                                                ctx.textBaseline = "middle";
                                                                ctx.fillText(
                                                                    abbrNum(Math.floor(sum(costAllocationRatio?.map(item => item?.value)))),
                                                                    chart?.getDatasetMeta(0)?.data?.[0]?.x,
                                                                    chart?.getDatasetMeta(0)?.data?.[0]?.y
                                                                )
                                                            }
                                                        }
                                                    ]}
                                                    options={{
                                                        responsive: true,
                                                        plugins: {
                                                            title: {
                                                                display: false,
                                                            },
                                                            legend: {
                                                                display: false,
                                                            },
                                                            datalabels: {
                                                                formatter: (val, context) => {
                                                                    var label = context.label || '';
                                                                    let total = reduce(context.dataset.data, (sum, n) => sum + n, 0);
                                                                    let percentData = ((context.dataset.data[context.dataIndex] / total) * 100).toFixed(2);

                                                                    if (Number(percentData).toFixed() > 5) {
                                                                        label += `${percentData}%`;
                                                                    } else {
                                                                        label += '';
                                                                    }
                                                                    return label;
                                                                },
                                                                borderRadius: 25,
                                                                borderWidth: 3,
                                                                color: "#fff",
                                                                font: {
                                                                    weight: "bold"
                                                                },
                                                                padding: 6
                                                            },
                                                            tooltip: {
                                                                titleFont: '14px',
                                                                // enabled: false,`
                                                                callbacks: {
                                                                    label: function (context) {
                                                                        var label = context.label || '';
                                                                        let total = reduce(context.dataset.data, (sum, n) => sum + n, 0);
                                                                        let percentData = ((context.dataset.data[context.dataIndex] / total) * 100).toFixed(2);

                                                                        label += `: ${formatNumberToCurrency(context.raw)}đ (${percentData}%)`;
                                                                        return label;
                                                                    }
                                                                }
                                                            },
                                                        },
                                                    }}
                                                />
                                                <div className="mt-6 mx-4">
                                                    <Bar
                                                        data={costAllocationChart}
                                                        options={{
                                                            indexAxis: 'y',
                                                            interaction: {
                                                                mode: 'index',
                                                                intersect: false,
                                                            },
                                                            elements: {
                                                                bar: {
                                                                    borderWidth: 0,
                                                                },
                                                            },
                                                            stacked: true,
                                                            responsive: true,
                                                            plugins: {
                                                                legend: {
                                                                    align: 'center',
                                                                    position: 'bottom',
                                                                    onClick: (e) => e.stopPropagation(),
                                                                    labels: {
                                                                        padding: 20,
                                                                        boxWidth: 8,
                                                                        boxHeigth: 8,
                                                                        pointStyle: 'circle',
                                                                        usePointStyle: { width: 4, height: 4, borderRadius: 4 }
                                                                    },
                                                                },
                                                                title: {
                                                                    display: false,
                                                                },
                                                                tooltip: {
                                                                    position: 'average',
                                                                    callbacks: {
                                                                        label: function (context) {
                                                                            let label = context.dataset.label || '';
                                                                            if (context.raw.x !== null) {
                                                                                label += ': ' + formatNumberToCurrency(context.raw.y) + 'đ';
                                                                            }
                                                                            return label;
                                                                        }
                                                                    }

                                                                },
                                                                datalabels: {
                                                                    display: false,
                                                                    anchor: 'end',
                                                                    align: 'end',
                                                                    formatter: function (value, context) {
                                                                        return abbrNum(value?.y);
                                                                    }
                                                                },
                                                            },
                                                            scales: {
                                                                x: {
                                                                    min: 0,
                                                                    max: 100,
                                                                    grid: {
                                                                        display: false,
                                                                    },
                                                                    // afterFit: (context) => {
                                                                    //     const isAdd = dataSetsChart?.some(_chart => _chart?.data?.some(_data => Number(_data?.x) >= 95));
                                                                    //     const paddingAdd = isAdd ? 60 : 0;

                                                                    //     context.paddingRight += paddingAdd;
                                                                    // },
                                                                    stacked: true,
                                                                    ticks: {
                                                                        stepSize: 20,
                                                                        callback: function (value, index, values) {
                                                                            return `${value}`
                                                                        }
                                                                    },
                                                                },
                                                                y: {
                                                                    stacked: true,
                                                                    grid: {
                                                                        display: false
                                                                    },
                                                                }
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </Fragment>
                                        )}
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
            <div>
            </div>
        </div>
    )
};

export default memo(TradingReportDialog);
