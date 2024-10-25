import React, { Fragment, memo, useMemo } from "react";
import { useIntl } from "react-intl";
import { sumBy, sum, reduce } from 'lodash';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { ArcElement, Chart as ChartJS, Legend, Tooltip, LinearScale, CategoryScale, BarElement } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { abbrNum, formatNumberToCurrency } from '../../../../utils';
import { toAbsoluteUrl } from "../../../../_metronic/_helpers";
import { useHistory } from 'react-router-dom';
import { ChevronRightOutlined } from "@material-ui/icons";
import dayjs from "dayjs";

ChartJS.register(
    ArcElement,
    Tooltip,
    Legend,
    ChartDataLabels,
    CategoryScale,
    LinearScale,
    BarElement,
);

const BlockUser = ({
    loadingOverviewCustomer,
    loadingOverviewCustomerArea,
    dataOverviewCustomer,
    dataOverviewCustomerArea
}) => {
    const history = useHistory();
    const { formatMessage } = useIntl();

    const [payloadOverViewCustomer, isEmptyData] = useMemo(
        () => {
            if (!dataOverviewCustomer?.overview_customer || dataOverviewCustomer?.overview_customer?.data?.length == 0) return [[], true];

            const isEmpty = dataOverviewCustomer?.overview_customer?.data?.every(item => !item?.value)
            const totalValue = sumBy(dataOverviewCustomer?.overview_customer?.data, item => item?.value);

            const data = dataOverviewCustomer?.overview_customer?.data?.map(
                (item) => {
                    const { label, color, value } = item || {};
                    const percent = totalValue > 0
                        ? ((value / totalValue) * 100).toFixed(2)
                        : 0;

                    return {
                        label,
                        color,
                        value,
                        percent
                    }
                }
            );

            return [data, isEmpty];
        }, [dataOverviewCustomer]
    );

    const isEmptyDataArea = useMemo(
        () => {
            if (!dataOverviewCustomerArea?.overview_customer_area || dataOverviewCustomerArea?.overview_customer_area?.data?.length == 0) return true;

            return dataOverviewCustomerArea?.overview_customer_area?.data?.every(item => !item?.value);
        }, [dataOverviewCustomerArea]
    );

    const dataSetsChart = useMemo(
        () => {
            return [
                {
                    label: 'Số lượng người mua',
                    data: dataOverviewCustomerArea?.overview_customer_area?.data?.map(item => {
                        let totalValue = dataOverviewCustomerArea?.overview_customer_area?.total;

                        return {
                            x: totalValue > 0 ? ((item?.value / totalValue) * 100).toFixed() : 0,
                            y: item?.value,
                        }
                    }),
                    borderColor: '#009900',
                    backgroundColor: '#009900',
                }
            ];
        }, [dataOverviewCustomerArea]
    );


    return (
        <Fragment>
            <div className="mb-6 d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                    <h3 className="txt-title mb-0">{formatMessage({ defaultMessage: "Người mua" })}</h3>
                    <span className="ml-3">({formatMessage({ defaultMessage: "Hôm qua" })} {dayjs().add(-1, 'day').format('DD/MM/YYYY')})</span>
                </div>
                <div
                    className='d-flex align-items-center justify-content-center cursor-pointer'
                    onClick={() => {
                        history.push(`/report/user`);
                    }}
                >
                    <span className="fs-14">{formatMessage({ defaultMessage: "Xem thêm" })}</span>
                    <ChevronRightOutlined className='ml-2' />
                </div>
            </div>
            <div className="row">
                <div className="col-6">
                    <div
                        className="px-8 py-8"
                        style={{ border: '1px solid #e5e8eb', borderRadius: 4 }}
                    >
                        {loadingOverviewCustomer && (
                            <div className='d-flex justify-content-center' style={{ minHeight: 100 }} >
                                <span className="spinner spinner-primary"></span>
                            </div>
                        )}
                        {!loadingOverviewCustomer && (
                            <div className="row d-flex align-items-center">
                                <div className="col-6 d-flex flex-column" style={{ gap: 30 }}>
                                    {payloadOverViewCustomer?.map(legend => (
                                        <div className="d-flex">
                                            <div className="mr-2" style={{ width: 14, height: 14, borderRadius: '50%', background: legend?.color, position: 'relative', top: 3 }} />
                                            <div className="d-flex flex-column">
                                                <span className="mb-1">{legend?.label}</span>
                                                <div className="d-flex align-items-center">
                                                    <span className="fs-16 mr-1">{legend?.value}</span>
                                                    {!!legend?.percent && (
                                                        <span className="fs-12 text-secondary-custom">{`(${legend?.percent}%)`}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="col-6">
                                    {!!isEmptyData && (
                                        <div className='d-flex  align-items-center justify-content-center'>
                                            <div className='d-flex flex-column align-items-center justify-content-center my-8'>
                                                <img src={toAbsoluteUrl("/media/empty.png")} alt="image" width={80} />
                                                <span className='mt-4'>
                                                    {formatMessage({ defaultMessage: "Chưa có thông tin người mua" })}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                    {!isEmptyData && (
                                        <Doughnut
                                            data={{
                                                labels: payloadOverViewCustomer?.map(_value => _value.label),
                                                datasets: [
                                                    {
                                                        label: payloadOverViewCustomer?.map(_value => _value.label),
                                                        data: payloadOverViewCustomer?.map(_value => _value.value),
                                                        backgroundColor: payloadOverViewCustomer?.map(_value => _value.color),
                                                        borderColor: payloadOverViewCustomer?.map(_value => _value.color),
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
                                                        ctx.font = "bolder 24px san-serif";
                                                        ctx.textAlign = "center";
                                                        ctx.textBaseline = "middle";
                                                        ctx.fillText(
                                                            abbrNum(sum([data?.datasets?.[0]?.data[0], data?.datasets?.[0]?.data[1], data?.datasets?.[0]?.data[2]])),
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

                                                                label += `: ${formatNumberToCurrency(context.raw)} (${percentData}%)`;
                                                                return label;
                                                            }
                                                        }
                                                    },
                                                },
                                            }}
                                        />
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="col-6">
                    <div
                        className="px-4 py-4"
                        style={{ border: '1px solid #e5e8eb', borderRadius: 4 }}
                    >
                        {loadingOverviewCustomerArea && (
                            <div className='d-flex justify-content-center' style={{ minHeight: 100 }} >
                                <span className="spinner spinner-primary"></span>
                            </div>
                        )}
                        {!loadingOverviewCustomerArea && (
                            <>
                                {isEmptyDataArea && (
                                    <div className='d-flex  align-items-center justify-content-center'>
                                        <div className='d-flex flex-column align-items-center justify-content-center mb-8 mt-2'>
                                            <span className="fs-14 mb-8" style={{ fontWeight: 550 }}>
                                                {formatMessage({ defaultMessage: 'Top 5 khu vực địa lý có số người mua nhiều nhất' })}
                                            </span>
                                            <img src={toAbsoluteUrl("/media/empty.png")} alt="image" width={80} />
                                            <span className='mt-4'>
                                                {formatMessage({ defaultMessage: "Chưa có dữ liệu" })}
                                            </span>
                                        </div>
                                    </div>
                                )}
                                {!isEmptyDataArea && (
                                    <Bar
                                        data={{
                                            labels: dataOverviewCustomerArea?.overview_customer_area?.data?.map(item => {
                                                let label;

                                                if (item?.label?.startsWith('Thành phố')) {
                                                    label = item?.label?.replace('Thành phố ', 'Tp.')
                                                } else {
                                                    label = item?.label
                                                }

                                                return label;
                                            }),
                                            datasets: dataSetsChart
                                        }}
                                        options={{
                                            indexAxis: 'y',
                                            elements: {
                                                bar: {
                                                    borderWidth: 0,
                                                },
                                            },
                                            stacked: false,
                                            responsive: true,
                                            plugins: {
                                                legend: {
                                                    display: false
                                                },
                                                title: {
                                                    display: true,
                                                    font: {
                                                        size: 14
                                                    },
                                                    text: formatMessage({ defaultMessage: 'Top 5 khu vực địa lý có số người mua nhiều nhất' })
                                                },
                                                tooltip: {
                                                    position: 'average',
                                                    callbacks: {
                                                        label: function (context) {
                                                            let label = context.dataset.label || '';
                                                            if (context.raw.x !== null) {
                                                                label += ': ' + context.raw.y;
                                                            }
                                                            return label;
                                                        }
                                                    }

                                                },
                                                datalabels: {
                                                    anchor: 'end',
                                                    align: 'end',
                                                    formatter: function (value, context) {
                                                        return value?.y;
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

                                                    ticks: {
                                                        stepSize: 20,
                                                        callback: function (value, index, values) {
                                                            return `${value}%`
                                                        }
                                                    },
                                                    stacked: true,
                                                },
                                                y: {
                                                    grid: {
                                                        display: false
                                                    },
                                                    stacked: true,
                                                }
                                            }
                                        }}
                                    />
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </Fragment>
    )
};

export default memo(BlockUser);