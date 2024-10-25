import React, { memo, useMemo } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    PointElement,
    LineElement,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Bar } from 'react-chartjs-2';
import query_getFinanceDashboardChart from '../../../../../graphql/query_getFinanceDashboardChart';
import { useQuery } from '@apollo/client';
import { KEY_FINANCE_DASHBOARD_CHART } from '../TradingReportHelper';
import { useIntl } from 'react-intl';
import { abbrNum, formatNumberToCurrency } from '../../../../../utils';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ChartDataLabels,
    PointElement,
    LineElement,
);

const TradingReportOverviewChart = ({ variables }) => {
    const { formatMessage } = useIntl();
    const { data: dataChart, loading } = useQuery(query_getFinanceDashboardChart, {
        variables,
        fetchPolicy: 'cache-and-network',
    });

    console.log({ dataChart });

    const chartDashboard = useMemo(() => {
        const chart = {
            labels: dataChart?.getFinanceDashboardChart?.map(item => item?.label || '--'),
            datasets: Object.keys(KEY_FINANCE_DASHBOARD_CHART).map(key => {
                const typeLine = key === 'profit' ? {
                    borderColor: KEY_FINANCE_DASHBOARD_CHART[key]?.color,
                    borderDash: [10],
                    tension: 0.4,
                    type: 'line'
                } : {}

                return {
                    label: formatMessage(KEY_FINANCE_DASHBOARD_CHART[key]?.label),
                    key,
                    data: dataChart?.getFinanceDashboardChart?.map(chart => ((key == 'revenue_sell' || key == 'profit') ? chart[key] : -Math.abs(chart[key])) || 0),
                    backgroundColor: KEY_FINANCE_DASHBOARD_CHART[key]?.color,
                    categoryPercentage: 0.4,
                    barPercentage: 0.5,
                    ...typeLine
                }
            })
        }

        return chart
    }, [dataChart]);

    return (
        <div className='mt-2 mb-8'>
            <div style={{ position: 'relative', minHeight: 300 }}>
                {loading && <div style={{ position: 'absolute', top: '20%', left: '50%', zIndex: 99 }}>
                    <span className="spinner spinner-primary" />
                </div>}
                {!loading && (
                    <Bar
                        style={{ maxHeight: 450 }}
                        data={chartDashboard}
                        options={{
                            interaction: {
                                mode: 'index',
                                intersect: false,
                            },
                            plugins: {
                                title: {
                                    display: false,
                                    text: 'Chart.js Bar Chart - Stacked',
                                },
                                legend: {
                                    align: 'center',
                                    position: 'right',
                                    onClick: (e) => e.stopPropagation(),
                                    labels: {
                                        padding: 20,
                                        boxWidth: 8,
                                        boxHeigth: 8,
                                        pointStyle: 'circle',
                                        usePointStyle: { width: 4, height: 4, borderRadius: 4 }
                                    },
                                },
                                datalabels: {
                                    anchor: 'end',
                                    align: 'top',
                                    formatter: function (value, context) {
                                        if (context.dataset.key == 'revenue_sell') {
                                            return `${abbrNum(value)}`
                                        }

                                        return null
                                    }
                                },
                                tooltip: {
                                    callbacks: {
                                        label: function (context) {
                                            let label = context.dataset.label || '';
                                            if (context.raw !== null) {
                                                const price = (context?.dataset?.key == 'revenue_sell' || context?.dataset?.key == 'profit')
                                                    ? formatNumberToCurrency(context.raw)
                                                    : formatNumberToCurrency(Math.abs(context.raw));
                                                label += ': ' + price + 'đ';
                                            }
                                            return label;
                                        }
                                    }
                                }
                            },
                            scales: {
                                x: {
                                    stacked: true,
                                    grid: {
                                        borderDash: [4]
                                    },
                                },
                                y: {
                                    stacked: true,
                                    grid: {
                                        color: (context) => {
                                            if (context?.tick?.value == 0) {
                                                return '#000000'
                                            }

                                            return '#d2d2d2'
                                        },
                                        borderDash: (context) => {
                                            if (context?.tick?.value == 0) {
                                                return [0]
                                            }

                                            return [4]
                                        },
                                    },
                                    afterFit: (context) => {
                                        context.paddingTop += 20;
                                    },
                                    ticks: {
                                        callback: function (value) {
                                            return value >= 0 ? `${abbrNum(value)}` : `-${abbrNum(Math.abs(value))}`
                                        }
                                    },
                                    beginAtZero: true
                                },
                            },
                        }}
                    />
                )}
            </div>
        </div>
    )
};

export default memo(TradingReportOverviewChart);