import { BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Tooltip } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { sumBy } from 'lodash';
import React, { memo, useMemo, useState } from "react";
import { OverlayTrigger, Tooltip as TooltipReport } from "react-bootstrap";
import { Bar } from 'react-chartjs-2';
import { useIntl } from "react-intl";
import { toAbsoluteUrl } from "../../../../_metronic/_helpers";
import {
    Card, CardBody,
} from "../../../../_metronic/_partials/controls";
import { formatNumberToCurrency } from '../../../../utils';
import PaginationModal from '../../../../components/PaginationModal';

ChartJS.register(
    Tooltip,
    Legend,
    ChartDataLabels,
    CategoryScale,
    LinearScale,
    BarElement,
);

const ReportUserDistribution = ({ dataReportBars, loadingReportBars, variables }) => {
    const { formatMessage } = useIntl();
    const [page, setPage] = useState(1);


    const headerReport = [
        { id: 1, title: formatMessage({ defaultMessage: 'Tỉnh/Thành phố' }), width: '30%' },
        { id: 2, title: formatMessage({ defaultMessage: 'Số người mua' }), tooltip: 'Tổng số người mua theo từng khu vực theo bộ lọc đã chọn', width: '15%', align: 'center' },
        { id: 3, title: formatMessage({ defaultMessage: '% Người mua' }), tooltip: 'Tỷ lệ phần trăm tổng số người mua theo từng khu vực theo bộ lọc đã chọn', width: '15%', align: 'center' },
        { id: 4, title: formatMessage({ defaultMessage: 'Doanh số' }), tooltip: 'Doanh số thu được theo từng khu vực theo bộ lọc đã chọn', width: '25%', align: 'center' },
        { id: 5, title: formatMessage({ defaultMessage: '% Doanh số' }), tooltip: 'Tỷ lệ phần trăm doanh số theo từng khu vực theo bộ lọc đã chọn', width: '15%', align: 'center' },
    ];

    useMemo(() => setPage(1), [variables]);

    const dataReport = useMemo(
        () => {
            if (!dataReportBars?.report_customer_area || dataReportBars?.report_customer_area?.data?.length == 0) return [];

            let [totalUser, totalRevenue] = [
                sumBy(dataReportBars?.report_customer_area?.data, item => item.value),
                sumBy(dataReportBars?.report_customer_area?.data, item => item.value2),
            ];
            const data = dataReportBars?.report_customer_area?.data?.map(item => {
                const { label, value, value2 } = item || {};

                return {
                    name: label,
                    userCount: value,
                    revenueCount: value2,
                    userPercent: totalUser > 0 ? ((value / totalUser) * 100).toFixed() : 0,
                    revenuePercent: totalRevenue > 0 ? ((value2 / totalRevenue) * 100).toFixed() : 0,
                }
            });

            return data;
        }, [dataReportBars]
    );

    const isEmptyDataArea = useMemo(
        () => {
            if (!dataReportBars?.report_customer_area || dataReportBars?.report_customer_area?.data?.length == 0) return true;

            return dataReportBars?.report_customer_area?.data?.every(item => !item?.value);
        }, [dataReportBars]
    );

    const dataSetsChart = useMemo(
        () => {
            return [
                {
                    label: 'Số người mua',
                    data: dataReportBars?.report_customer_area?.data?.slice(0, 5)?.map(item => {
                        let totalValue = dataReportBars?.report_customer_area?.total;

                        return {
                            x: totalValue > 0 ? ((item?.value / totalValue) * 100).toFixed() : 0,
                            y: item?.value,
                        }
                    }),
                    borderColor: '#0099FF',
                    backgroundColor: '#0099FF',
                    barThickness: 'flex',
                    group: true,
                    categoryPercentage: 0.5,
                    barPercentage: 0.8
                },
                {
                    label: 'Doanh số',
                    data: dataReportBars?.report_customer_area?.data?.slice(0, 5)?.map(item => {
                        let totalValue = dataReportBars?.report_customer_area?.total2;

                        return {
                            x: totalValue > 0 ? ((item?.value2 / totalValue) * 100).toFixed() : 0,
                            y: item?.value2,
                        }
                    }),
                    isUnit: true,
                    borderColor: '#FF6633',
                    backgroundColor: '#FF6633',
                    barThickness: 'flex',
                    group: true,
                    categoryPercentage: 0.5,
                    barPercentage: 0.8
                }
            ];
        }, [dataReportBars]
    );

    const maxWidthBar = useMemo(() => {
        const defaultWidth = 400;
        if (!dataReportBars?.report_customer_area || dataReportBars?.report_customer_area?.data?.length == 0) return defaultWidth;

        if (dataReportBars?.report_customer_area?.data?.length < 3) return 200;
        if (dataReportBars?.report_customer_area?.data?.length >= 3 || dataReportBars?.report_customer_area?.data?.length < 5) return 400;

    }, [dataReportBars?.report_customer_area?.data]);

    return (
        <Card className="mt-4">
            <CardBody>
                <p className="txt-title mb-6" style={{ fontSize: '1.25rem', color: '#000000', fontWeight: 'bold' }}>
                    {formatMessage({ defaultMessage: "Phân bổ người mua theo tỉnh/thành phố" })}
                </p>

                {!loadingReportBars && (
                    <>
                        {isEmptyDataArea && (
                            <div className='d-flex  align-items-center justify-content-center'>
                                <div className='d-flex flex-column align-items-center justify-content-center mb-8 mt-2'>
                                    <img src={toAbsoluteUrl("/media/empty.png")} alt="image" width={80} />
                                    <span className='mt-4'>
                                        {formatMessage({ defaultMessage: "Chưa có dữ liệu biểu đồ" })}
                                    </span>
                                </div>
                            </div>
                        )}
                        {!isEmptyDataArea && (
                            <Bar
                                style={{ maxHeight: maxWidthBar }}
                                data={{
                                    labels: dataReportBars?.report_customer_area?.data?.slice(0, 5)?.map(item => {
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
                                    responsive: true,
                                    plugins: {
                                        legend: {
                                            display: true,
                                            position: 'bottom',
                                            labels: {
                                                padding: 30,
                                                boxWidth: 6,
                                                boxHeigth: 6,
                                                pointStyle: 'rect',
                                                usePointStyle: { width: 6, height: 6, borderRadius: 8 }
                                            },
                                        },
                                        title: {
                                            display: false,
                                            font: {
                                                size: 14
                                            },
                                        },
                                        tooltip: {
                                            position: 'average',
                                            callbacks: {
                                                label: function (context) {
                                                    let label = context.dataset.label || '';
                                                    if (context.raw.x !== null) {
                                                        label += `: ${formatNumberToCurrency(context?.raw?.y || 0)}${context?.dataset?.isUnit ? 'đ' : ''}`;
                                                    }
                                                    return label;
                                                }
                                            }

                                        },
                                        datalabels: {
                                            anchor: 'end',
                                            align: 'end',
                                            formatter: function (value, context) {
                                                if (!!context?.dataset?.isUnit) {
                                                    return formatNumberToCurrency(value?.y) + 'đ';
                                                }
                                                return formatNumberToCurrency(value?.y);
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
                                            afterFit: (context) => {   
                                                const isAdd = dataSetsChart?.some(_chart => _chart?.data?.some(_data => Number(_data?.x) >= 95));
                                                const paddingAdd = isAdd ? 60 : 0;

                                                context.paddingRight += paddingAdd;
                                            },
                                            ticks: {
                                                stepSize: 20,
                                                callback: function (value, index, values) {
                                                    return `${value}%`
                                                }
                                            },
                                        },
                                        y: {
                                            grid: {
                                                display: false
                                            },
                                        }
                                    }
                                }}
                            />
                        )}
                    </>
                )}

                <table className="mt-6 table table-borderless product-list table-vertical-center fixed">
                    <thead style={{
                        borderBottom: '1px solid #F0F0F0', borderRight: '1px solid #d9d9d9', borderLeft: '1px solid #d9d9d9', background: '#F3F6F9'
                    }}>
                        <tr className="font-size-lg">
                            {headerReport.map(item => (
                                <th style={{ fontSize: '14px', textAlign: item?.align || '' }} width={item.width}>
                                    {item.title}
                                    {!!item?.tooltip && (
                                        <OverlayTrigger
                                            overlay={
                                                <TooltipReport>
                                                    {item.tooltip}
                                                </TooltipReport>
                                            }
                                        >
                                            <span className="ml-2" style={{ position: 'relative', top: '-1px' }}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" class="bi bi-info-circle" viewBox="0 0 16 16">
                                                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                                                    <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
                                                </svg>
                                            </span>
                                        </OverlayTrigger>
                                    )}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loadingReportBars && <div className='text-center w-100 mt-4' style={{ position: 'absolute' }} >
                            <span className="ml-3 spinner spinner-primary"></span>
                        </div>}
                        {!loadingReportBars && dataReport?.length > 0 && dataReport?.slice(5 * (page - 1), 5 + 5 * (page - 1))?.map(item => (
                            <tr key={item?.name} style={{ borderBottom: '1px solid #D9D9D9', }}>
                                <td style={{ verticalAlign: 'top' }}>
                                    {item?.name}
                                </td>
                                <td style={{ verticalAlign: 'top', textAlign: 'center' }}>
                                    {formatNumberToCurrency(item?.userCount)}
                                </td>
                                <td style={{ verticalAlign: 'top', textAlign: 'center' }}>
                                    <span>{formatNumberToCurrency(item?.userPercent)}%</span>
                                </td>
                                <td style={{ verticalAlign: 'top', textAlign: 'center' }}>
                                    {formatNumberToCurrency(item?.revenueCount)}đ
                                </td>
                                <td style={{ verticalAlign: 'top', textAlign: 'center' }}>
                                    <span>{formatNumberToCurrency(item?.revenuePercent)}%</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {!loadingReportBars && dataReport?.length == 0 && (
                    <div className='d-flex flex-column align-items-center justify-content-center mt-10 mb-25'>
                        <img src={toAbsoluteUrl("/media/empty.png")} alt="image" width={80} />
                        <span className='mt-4'>{formatMessage({ defaultMessage: 'Chưa có dữ liệu' })}</span>
                    </div>
                )}
                {!loadingReportBars && dataReportBars?.report_customer_area?.data?.length > 0 && (
                    <div style={{ width: '100%' }}>
                        <PaginationModal
                            page={page}
                            limit={5}
                            onPanigate={(page) => setPage(page)}
                            totalPage={Math.ceil(dataReportBars?.report_customer_area?.data?.length / 5)}
                            totalRecord={dataReportBars?.report_customer_area?.data?.length || 0}
                            count={dataReportBars?.report_customer_area?.data?.slice(5 * (page - 1), 5 + 5 * (page - 1))?.length}
                            emptyTitle={formatMessage({ defaultMessage: 'Chưa có dữ liệu' })}
                        />
                    </div>
                )}
            </CardBody>
        </Card>
    )
};

export default memo(ReportUserDistribution);