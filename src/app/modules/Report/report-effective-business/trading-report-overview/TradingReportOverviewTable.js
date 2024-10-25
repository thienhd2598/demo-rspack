import React, { Fragment, memo, useCallback, useMemo, useState } from 'react';
import Table from 'rc-table';
import 'rc-table/assets/index.css'
import clsx from 'clsx';
import { formatNumberToCurrency } from '../../../../../utils';
import { useQuery } from '@apollo/client';
import { toAbsoluteUrl } from '../../../../../_metronic/_helpers';
import { useIntl } from 'react-intl';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import query_cfGetAnalysisFinanceTable from '../../../../../graphql/query_cfGetAnalysisFinanceTable';

function CustomExpandIcon({ onExpand, record, expanded }) {
    return (
        <span style={{ minWidth: 25, display: 'inline-block' }}>
            <i
                className={clsx('fas text-dark cursor-pointer', expanded ? `fa-chevron-down` : `fa-chevron-right`)}
                style={{ color: '#c4c4c4', fontSize: '0.9rem' }}
                onClick={e => onExpand(record, e)}
            />
        </span>
    );
};


const TradingReportOverviewTable = ({ variables }) => {
    const { formatMessage } = useIntl();

    const { data, loading } = useQuery(query_cfGetAnalysisFinanceTable, {
        variables,
        fetchPolicy: 'cache-and-network',
    });

    const dataTradingReportOverview = useMemo(
        () => {
            if (!data?.cfGetAnalysisFinanceTable) return [];

            const {
                amount_order,
                compare_amount_order,
                amount_order_growth,
                capital_price, compare_capital_price, gross_profit, compare_gross_profit,
                net_revenue, compare_net_revenue, profit, compare_profit,
                profit_margin, compare_profit_margin, revenue_sell, compare_revenue_sell,
                discount_sales, fees_platform, marketing_costs, operating_costs,
                capital_price_growth, gross_profit_growth, net_revenue_growth, profit_growth
                , profit_margin_growth, revenue_sell_growth, compare_money_about_wallet, money_about_wallet,
                money_about_wallet_growth
            } = data?.cfGetAnalysisFinanceTable || {};

            const dataTable = [
                {
                    key: 'profit',
                    code: '',
                    title: formatMessage({ defaultMessage: 'Lợi nhuận (03 - 04 - 06)' }),
                    titleMargin: formatMessage({ defaultMessage: 'Tỷ suất lợi nhuận' }),
                    titleAmountOrder: formatMessage({ defaultMessage: 'Tổng đơn' }),
                    value: profit ?? "--",
                    valueMargin: profit_margin ?? "--",
                    valueAmountOrder: amount_order ?? "--",
                    compareValue: compare_profit ?? "--",
                    type: profit_growth >= 0 ? 'increase' : 'decrease',
                    ratio: profit_growth
                },
                {
                    key: 'revenue_sell',
                    code: '01',
                    title: formatMessage({ defaultMessage: 'Doanh thu bán hàng' }),
                    value: revenue_sell ?? "--",
                    compareValue: compare_revenue_sell ?? "--",
                    type: revenue_sell_growth >= 0 ? 'increase' : 'decrease',
                    ratio: revenue_sell_growth
                },
                {
                    key: 'discount_sales',
                    code: '02',
                    title: formatMessage({ defaultMessage: 'Giảm giá hàng bán' }),
                    value: discount_sales?.value ?? "--",
                    compareValue: discount_sales?.compare_value ?? '--',
                    type: discount_sales?.growth >= 0 ? 'increase' : 'decrease',
                    ratio: discount_sales?.growth,
                    children: discount_sales?.items?.map((item, index) => ({
                        key: item?.label,
                        code: `2.${index + 1}`,
                        title: item?.label,
                        value: item?.cost ?? '--',
                        compareValue: item?.compare_cost ?? '--',
                        type: item?.growth >= 0 ? 'increase' : 'decrease',
                        ratio: item?.growth,
                    }))
                },
                {
                    key: 'net_revenue',
                    code: '03',
                    title: formatMessage({ defaultMessage: 'Doanh thu thuần (01 - 02)' }),
                    value: net_revenue ?? "--",
                    compareValue: compare_net_revenue ?? "--",
                    type: net_revenue_growth >= 0 ? 'increase' : 'decrease',
                    ratio: net_revenue_growth
                },                
                {
                    key: 'fees_platform',
                    code: '04',
                    title: formatMessage({ defaultMessage: 'Chi phí nội sàn' }),
                    value: fees_platform?.value ?? "--",
                    compareValue: fees_platform?.compare_value ?? '--',
                    type: fees_platform?.growth >= 0 ? 'increase' : 'decrease',
                    ratio: fees_platform?.growth,
                    children: fees_platform?.items?.map((item, index) => ({
                        key: item?.label,
                        code: `4.${index + 1}`,
                        title: item?.label,
                        value: item?.cost ?? '--',
                        compareValue: item?.compare_cost ?? '--',
                        type: item?.growth >= 0 ? 'increase' : 'decrease',
                        ratio: item?.growth,
                    }))
                },
                {
                    key: 'money_about_wallet',
                    code: '05',
                    title: formatMessage({ defaultMessage: 'Tiền về ví' }),
                    value: money_about_wallet ?? "--",
                    compareValue: compare_money_about_wallet ?? "--",
                    type: money_about_wallet_growth >= 0 ? 'increase' : 'decrease',
                    ratio: money_about_wallet_growth
                },
                {
                    key: 'marketing_costs',
                    code: '06',
                    title: formatMessage({ defaultMessage: 'Chi phí MKT' }),
                    value: marketing_costs?.value ?? "--",
                    compareValue: marketing_costs?.compare_value ?? '--',
                    type: marketing_costs?.growth >= 0 ? 'increase' : 'decrease',
                    ratio: marketing_costs?.growth,
                    children: marketing_costs?.items?.map((item, index) => ({
                        key: item?.label,
                        code: `6.${index + 1}`,
                        title: item?.label,
                        value: item?.cost ?? '--',
                        compareValue: item?.compare_cost ?? '--',
                        type: item?.growth >= 0 ? 'increase' : 'decrease',
                        ratio: item?.growth,
                    }))
                }                
            ];
            return dataTable
        }, [data]
    );

    const columns = [
        {
            title: 'Mã số',
            dataIndex: 'code',
            key: 'code',
            width: '8%',
            align: 'center',
            render: (item, record, index) => {
                console.log('item0099', item)
                console.log('record', record)
                if (record?.key === 'profit') return null;

                return <span className='font-weight-bolder'>{item}</span>;
            }
        },
        {
            title: 'Khoản mục',
            dataIndex: 'title',
            key: 'title',
            align: 'left',
            render(item, record, index) {
                const [isParent, isRowDefault] = [record?.children?.length > 0, record?.key === 'profit'];
                if (isRowDefault) {
                    return <div className='d-flex justify-content-between'>
                        <div className='d-flex flex-column ml-8'>
                            <strong className='mb-2'>{item}</strong>
                            <strong className='mb-2'>{record?.titleMargin}</strong>
                            <strong>{record?.titleAmountOrder}</strong>
                        </div>
                    </div>
                } else {
                    return (
                        <span className={clsx(record?.code?.length == 2 && `font-weight-bolder`, !isParent && `ml-8`)}>
                            {item}
                        </span>
                    )
                }
            },
        },
        {
            title: 'Giá trị',
            dataIndex: 'value',
            key: 'value',
            width: '18%',
            align: 'right',
            render: (item, record) => {
                const [isParent, isRowDefault] = [record?.children?.length > 0, record?.key === 'profit'];
                if (isRowDefault) {
                    return <div className='d-flex flex-column'>
                        <span className={clsx('font-weight-bolder mb-2', item >= 0 ? 'text-success' : 'text-danger')}>
                            {typeof item == 'number' ? `${formatNumberToCurrency(item)}đ` : item}
                        </span>
                        <span className={clsx('font-weight-bolder mb-2', record?.valueMargin >= 0 ? 'text-success' : 'text-danger')}>
                            {typeof record?.valueMargin == 'number' ? `${formatNumberToCurrency(record?.valueMargin)}%` : record?.valueMargin}
                        </span>

                        <span className={clsx('font-weight-bolder')}>
                            {typeof record?.valueAmountOrder == 'number' ? `${formatNumberToCurrency(record?.valueAmountOrder)}` : record?.valueAmountOrder}
                        </span>

                    </div>
                } else {
                    return <span className={clsx(record?.code?.length == 2 && 'font-weight-bolder')}>
                        {typeof item == 'number' ? `${formatNumberToCurrency(item)}đ` : item}
                    </span>
                }
            }
        },
        {
            title: 'Tăng trưởng',
            dataIndex: 'ratio',
            key: 'ratio',
            width: '15%',
            align: 'center',
            render: (item, record) => {
                return <OverlayTrigger
                    placement='bottom'
                    overlay={
                        <Tooltip>
                            <div className='d-flex flex-column align-items-center'>
                                <span className='mb-2 fs-14'>
                                    ({data?.cfGetAnalysisFinanceTable?.previous_label})
                                </span>
                                <span className={clsx('fs-14 font-weight-bolder')}>
                                    {typeof record?.compareValue == 'number' ? `${formatNumberToCurrency(record?.compareValue)}đ` : record?.compareValue}
                                </span>
                            </div>
                        </Tooltip>
                    }
                >
                    <div className='d-flex align-items-center justify-content-center'>
                        {typeof item == 'number' && (
                            <>
                                {record?.type == 'increase' ? (
                                    <i
                                        className={`fas fa-sort-up mr-2`}
                                        style={{ color: '#00DB6D', position: 'relative', top: 3 }}
                                    />
                                ) : (
                                    <i
                                        className={`fas fa-sort-down mr-1`}
                                        style={{ color: '#FF0000', position: 'relative', top: -2 }}
                                    />
                                )}
                            </>
                        )}
                        <span className={clsx((record?.code?.length == 2 || record?.key === 'profit') && 'font-weight-bolder')}>
                            {typeof item == 'number' ? `${Math.abs(item)}%` : '--'}
                        </span>
                    </div>
                </OverlayTrigger>
            }
        },
    ];

    return (
        <Fragment>
            <div style={{ position: 'relative' }}>
                {loading && <div style={{ position: 'absolute', top: '20%', left: '50%', zIndex: 99 }}>
                    <span className="spinner spinner-primary" />
                </div>}
                <Table
                    style={loading ? { opacity: 0.4 } : {}}
                    className="upbase-table"
                    columns={columns}
                    data={dataTradingReportOverview}
                    tableLayout="auto"
                    expandable={{
                        defaultExpandAllRows: false,
                        rowExpandable: (record, index) => {
                        },
                        expandIconColumnIndex: 1,
                        expandIcon: (item) => {
                            if (item?.record?.children?.length > 0) {
                                return CustomExpandIcon(item);
                            }
                            return <span style={{ minWidth: 26 }} />;
                        }
                    }}
                    emptyText={<div className='d-flex flex-column align-items-center justify-content-center my-10'>
                        <img src={toAbsoluteUrl("/media/empty.png")} alt="image" width={80} />
                        <span className='mt-4'>{formatMessage({ defaultMessage: 'Chưa có dữ liệu' })}</span>
                    </div>}
                    sticky={{
                        offsetHeader: 45,
                    }}
                />
            </div>
        </Fragment>
    )
};

export default memo(TradingReportOverviewTable);