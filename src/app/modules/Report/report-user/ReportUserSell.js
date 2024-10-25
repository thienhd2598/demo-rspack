import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { reduce, sum, sumBy } from 'lodash';
import React, { Fragment, memo, useMemo } from "react";
import { OverlayTrigger, Tooltip as TooltipReport } from "react-bootstrap";
import { Doughnut } from 'react-chartjs-2';
import { useIntl } from "react-intl";
import { toAbsoluteUrl } from '../../../../_metronic/_helpers';
import {
    Card, CardBody,
} from "../../../../_metronic/_partials/controls";
import { abbrNum, formatNumberToCurrency } from '../../../../utils';

ChartJS.register(ArcElement, Tooltip, Legend);
ChartJS.register(ChartDataLabels);

const TableSell = ({ dataReportCustomers, loadingReportCustomer }) => {
    const { formatMessage } = useIntl();

    const headerReportSell = [
        { id: 1, title: formatMessage({ defaultMessage: 'Nhóm' }), width: '30%' },
        { id: 2, title: formatMessage({ defaultMessage: 'Doanh số' }), tooltip: 'Doanh số của nhóm người mua tương ứng đạt được theo bộ lọc đã chọn', width: '25%', align: 'center' },
        { id: 3, title: formatMessage({ defaultMessage: '% Doanh số' }), tooltip: 'Tỷ lệ phần trăm về doanh số của nhóm người mua tương ứng đạt được theo bộ lọc đã chọn', width: '45%' },
    ];

    const dataReportSell = useMemo(
        () => {
            if (!dataReportCustomers?.report_customers || dataReportCustomers?.report_customers?.data?.length == 0) return [];

            const totalValue = sumBy(dataReportCustomers?.report_customers?.data, item => item?.value2);

            return dataReportCustomers?.report_customers?.data?.map(
                item => {
                    const percent = totalValue > 0
                        ? ((item?.value2 / totalValue) * 100).toFixed(2)
                        : 0;

                    return {
                        name: item?.label,
                        color: item?.color,
                        value: item?.value2,
                        percent
                    }
                }
            );
        }, [dataReportCustomers]
    );

    return (
        <Fragment>
            <table className="table table-borderless product-list table-vertical-center fixed">
                <thead style={{
                    borderBottom: '1px solid #F0F0F0', borderRight: '1px solid #d9d9d9', borderLeft: '1px solid #d9d9d9', background: '#F3F6F9'
                }}>
                    <tr className="font-size-lg">
                        {headerReportSell.map(item => (
                            <th style={{ fontSize: '14px', textAlign: item?.align || '' }} width={item.width}>
                                {item?.title}
                                {!!item?.tooltip && (
                                    <OverlayTrigger
                                        overlay={
                                            <TooltipReport>
                                                {item?.tooltip}
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
                <tbody style={{ borderRight: "1px solid #D9D9D9", borderLeft: "1px solid #D9D9D9" }}>
                    {!!loadingReportCustomer && <div className='d-flex align-items-center justify-content-center w-100 mt-4' style={{ position: 'absolute', minHeight: 100 }} >
                        <span className="spinner spinner-primary"></span>
                    </div>}
                    {!loadingReportCustomer && dataReportSell?.map(item => (
                        <tr key={item?.name}>
                            <td style={{ verticalAlign: 'top' }}>
                                {item?.name}
                            </td>
                            <td style={{ verticalAlign: 'top', textAlign: 'center' }}>
                                {formatNumberToCurrency(item?.value)}đ
                            </td>
                            <td style={{ verticalAlign: 'top' }}>
                                <div className="d-flex align-items-center">
                                    <span style={{ minWidth: 45 }}>{formatNumberToCurrency(item?.percent)}%</span>
                                    <div className="ml-4" style={{ flex: 1, width: '100%' }}>
                                        <div style={{ width: `${item?.percent}%`, height: 20, background: item?.color, borderRadius: 4 }} />
                                    </div>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {dataReportSell?.length == 0 && (
                <div className='d-flex flex-column align-items-center justify-content-center mt-10 mb-25'>
                    <img src={toAbsoluteUrl("/media/empty.png")} alt="image" width={80} />
                    <span className='mt-4'>{formatMessage({ defaultMessage: 'Chưa có dữ liệu' })}</span>
                </div>
            )}
        </Fragment>
    )
}

const ReportUserSell = ({ dataReportCustomers, loadingReportCustomer }) => {
    const { formatMessage } = useIntl();

    const [payloadOverViewCustomer, isEmptyData] = useMemo(
        () => {
            if (!dataReportCustomers?.report_customers || dataReportCustomers?.report_customers?.data?.length == 0) return [[], true];

            const isEmpty = dataReportCustomers?.report_customers?.data?.every(item => !item?.value)
            const totalValue = sumBy(dataReportCustomers?.report_customers?.data, item => item?.value);

            const data = dataReportCustomers?.report_customers?.data?.map(
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
        }, [dataReportCustomers]
    );

    return (
        <Card className="mt-4">
            <CardBody>
                <p className="txt-title mb-6" style={{ fontSize: '1.25rem', color: '#000000', fontWeight: 'bold' }}>
                    {formatMessage({ defaultMessage: "Phân tích mua hàng" })}
                </p>
                <div className="row">
                    <div className="col-6">
                        <div
                            className="px-8 py-8"
                            style={{ border: '1px solid #e5e8eb', borderRadius: 4 }}
                        >
                            {loadingReportCustomer && (
                                <div className='d-flex justify-content-center' style={{ minHeight: 100 }} >
                                    <span className="spinner spinner-primary"></span>
                                </div>
                            )}
                            {!loadingReportCustomer && (
                                <div className="row d-flex align-items-center">
                                    <div className="col-6 d-flex flex-column" style={{ gap: 30 }}>
                                        {payloadOverViewCustomer?.map(legend => (
                                            <div className="d-flex">
                                                <div className="mr-2" style={{ width: 14, height: 14, borderRadius: '50%', background: legend?.color, position: 'relative', top: 3 }} />
                                                <div className="d-flex flex-column">
                                                    <span className="mb-1">{legend?.label}</span>
                                                    <div className="d-flex align-items-center">
                                                        <span className="fs-16 mr-1">{formatNumberToCurrency(legend?.value)}</span>
                                                        {!!legend?.percent && <span className="fs-12 text-secondary-custom">{`(${legend?.percent}%)`}</span>}
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
                                                style={{ maxHeight: 200 }}
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
                        <TableSell
                            dataReportCustomers={dataReportCustomers}
                            loadingReportCustomer={loadingReportCustomer}
                        />
                    </div>
                </div>
            </CardBody>
        </Card>
    )
};

export default memo(ReportUserSell);