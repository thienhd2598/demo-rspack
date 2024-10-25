import React, { Fragment, memo, useCallback, useMemo, useRef, useState } from 'react';
import Table from 'rc-table';
import 'rc-table/assets/index.css';
import clsx from 'clsx';
import { formatNumberToCurrency } from '../../../../../utils';
import { OverlayTrigger, Popover, Tooltip } from 'react-bootstrap';
import { useIntl } from 'react-intl';
import { toAbsoluteUrl } from '../../../../../_metronic/_helpers';
import _ from 'lodash';
import { useQuery } from '@apollo/client';
import query_cfGetAnalysisFinancePlatformTable from '../../../../../graphql/query_cfGetAnalysisFinancePlatformTable';

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


const TradingReportChannelTable = ({ onToggleDrawer, onSetCurrentKeyChart, listChannelCode, optionsStores, variables }) => {
    const { formatMessage } = useIntl();
    const [selectedStores, setSelectedStores] = useState([]);
    const [selectedStoresTemp, setSelectedStoresTemp] = useState([]);

    console.log({ variables, listChannelCode });

    const { data, loading } = useQuery(query_cfGetAnalysisFinancePlatformTable, {
        variables,
        fetchPolicy: 'cache-and-network',
    });

    console.log({ data });

    const parseDataChannel = useCallback((data, key = "") => {
        const newData = _.reduce(data, (result, value) => {
            result[`value${key || ''}_${value?.channel_code}`] = value?.value ?? "--";
            result[`ratio${key || ''}_${value?.channel_code}`] = value?.ratio ?? "--";

            (value?.group_store || []).forEach(store => {
                result[`value${key || ''}_${store?.store_id}`] = store?.value ?? "--";
                result[`ratio${key || ''}_${store?.store_id}`] = store?.ratio ?? "--";
            });

            return result;
        }, {});

        return newData;
    }, []);

    const dataTabe = useMemo(() => {
        if (!data?.cfGetAnalysisFinancePlatformTable) return [];

        const {
            capital_price, discount_sales, fees_platform, gross_profit,
            marketing_costs, net_revenue, operating_costs, profit,
            profit_margin, revenue_sell, amount_order, money_about_wallet
        } = data?.cfGetAnalysisFinancePlatformTable || {};

        const table = [
            {
                key: 'profit',
                code: '',
                title: formatMessage({ defaultMessage: 'Lợi nhuận (03 - 04 - 06)' }),
                titleMargin: formatMessage({ defaultMessage: 'Tỷ suất lợi nhuận' }),
                titleAmountOrder: formatMessage({ defaultMessage: 'Tổng đơn' }),
                value: profit?.value ?? "--",
                valueAmountOrder: amount_order?.value ?? "--",
                ...parseDataChannel(amount_order?.group_channel, '_order'),
                valueMargin: profit_margin?.value ?? "--",
                ...parseDataChannel(profit?.group_channel),
                ...parseDataChannel(profit_margin?.group_channel, '_margin'),
            },
            {
                key: 'revenue_sell',
                code: '01',
                title: formatMessage({ defaultMessage: 'Doanh thu bán hàng' }),
                value: revenue_sell?.value ?? "--",
                ...parseDataChannel(revenue_sell?.group_channel),
            },
            {
                key: 'discount_sales',
                code: '02',
                title: formatMessage({ defaultMessage: 'Giảm giá hàng bán' }),
                value: discount_sales?.value ?? "--",
                ...parseDataChannel(discount_sales?.group_channel),
                children: discount_sales?.items?.map((item, index) => ({
                    key: item?.label,
                    code: `2.${index + 1}`,
                    title: item?.label,
                    value: item?.cost ?? "--",
                    ...parseDataChannel(item?.group_channel),
                }))
            },
            {
                key: 'net_revenue',
                code: '03',
                title: formatMessage({ defaultMessage: 'Doanh thu thuần (01 - 02)' }),
                value: net_revenue?.value ?? "--",
                ...parseDataChannel(net_revenue?.group_channel),
            },
            {
                key: 'fees_platform',
                code: '04',
                title: formatMessage({ defaultMessage: 'Chi phí nội sàn' }),
                value: fees_platform?.value ?? "--",
                ...parseDataChannel(fees_platform?.group_channel),
                children: fees_platform?.items?.map((item, index) => ({
                    key: item?.label,
                    code: `4.${index + 1}`,
                    title: item?.label,
                    value: item?.cost ?? "--",
                    ...parseDataChannel(item?.group_channel),
                }))
            },
            {
                key: 'money_about_wallet',
                code: '05',
                title: formatMessage({ defaultMessage: 'Tiền về ví' }),
                value: money_about_wallet?.value ?? "--",
                ...parseDataChannel(money_about_wallet?.group_channel),
            },
            {
                key: 'marketing_costs',
                code: '06',
                title: formatMessage({ defaultMessage: 'Chi phí MKT' }),
                value: marketing_costs?.value ?? "--",
                ...parseDataChannel(marketing_costs?.group_channel),
                children: marketing_costs?.items?.map((item, index) => ({
                    key: item?.label,
                    code: `6.${index + 1}`,
                    title: item?.label,
                    value: item?.cost ?? "--",
                    ...parseDataChannel(item?.group_channel),
                }))
            }
        ];

        return table
    }, [data]);

    const groupStores = useMemo(() => {
        return _.groupBy(optionsStores, store => store?.connector_channel_code);
    }, [optionsStores]);

    const buildPopupStore = useCallback(
        (channel) => {
            const stores = groupStores[channel]?.map(store => ({
                label: store?.name,
                value: store?.id
            })) || [];

            return (
                <Popover className='mt-2' style={{ minWidth: 280 }}>
                    <Popover.Title className="p-3" as="h6">
                        {formatMessage({ defaultMessage: "Chọn gian hàng" })}
                    </Popover.Title>
                    <Popover.Content>
                        <div className="d-flex flex-column">
                            <div className="d-flex flex-column">
                                {stores?.map(_op => {
                                    const isSelected = selectedStoresTemp?.some(value => value === _op?.value);
                                    return (
                                        <label
                                            style={{ cursor: 'pointer' }}
                                            key={`op-${_op?.value}`}
                                            className="checkbox checkbox-primary mb-4 mr-4"
                                        >
                                            <input
                                                type="checkbox"
                                                value={_op?.value}
                                                checked={isSelected}
                                                onChange={() => {
                                                    if (isSelected) {
                                                        setSelectedStoresTemp(store => store?.filter(prev => prev != _op?.value))
                                                    } else {
                                                        setSelectedStoresTemp(store => store?.concat(_op?.value))
                                                    }
                                                }}
                                            />
                                            <span></span>
                                            &ensp;
                                            <img
                                                src={toAbsoluteUrl(`/media/logo_${channel}.png`)}
                                                style={{ width: 20, height: 20, objectFit: "contain" }}
                                            />
                                            &ensp;
                                            {_op.label}
                                        </label>
                                    )
                                })}
                            </div>
                            <div className='d-flex justify-content-end'>
                                <button
                                    className='btn btn-primary'
                                    onClick={() => {
                                        setSelectedStores(selectedStoresTemp);
                                        document.body.click()
                                    }}
                                >
                                    {formatMessage({ defaultMessage: 'Đồng ý' })}
                                </button>
                            </div>
                        </div>
                    </Popover.Content>
                </Popover>
            )
        }, [groupStores, selectedStores, selectedStoresTemp]
    );


    const columns = useMemo(() => {
        const dataColums = _.flatten([
            {
                title: formatMessage({ defaultMessage: 'Mã số' }),
                dataIndex: 'code',
                key: 'code',
                width: 60,
                align: 'center',
                render: (item, record) => {
                    if (record?.key === 'profit') return null;

                    return <span className='font-weight-bolder'>{item}</span>;
                }
            },
            {
                title: formatMessage({ defaultMessage: 'Khoản mục' }),
                dataIndex: 'title',
                key: 'title',
                width: 300,
                align: 'left',
                render(item, record) {
                    const [isParent, isRowDefault] = [record?.children?.length > 0, record?.key === 'profit'];
                    if (isRowDefault) {
                        return <div className='d-flex justify-content-between'>
                            <div className='d-flex flex-column ml-8'>
                                <strong className='mb-2'>{item}</strong>
                                <strong className='mb-2'>{record?.titleMargin}</strong>
                                <strong>{record?.titleAmountOrder}</strong>
                            </div>
                            <span className='cursor-pointer' onClick={() => {
                                onSetCurrentKeyChart(record?.key)
                                onToggleDrawer();
                            }}>
                                <svg color='#ff5629' xmlns="http://www.w3.org/1800/svg" width="16" height="16" fill="currentColor" class="bi bi-bar-chart-line-fill" viewBox="0 0 16 16">
                                    <path d="M11 2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v12h.5a.5.5 0 0 1 0 1H.5a.5.5 0 0 1 0-1H1v-3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3h1V7a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v7h1V2z" />
                                </svg>
                            </span>
                        </div>
                    } else {
                        return (
                            <span className='justify-content-between' style={{ display: 'inline-flex', width: 'calc(100% - 25px)' }}>
                                <span className={clsx(record?.code?.length == 2 && `font-weight-bolder`, !isParent && `ml-8`)}>
                                    {item}
                                </span>
                                {isParent && <span className='cursor-pointer' onClick={() => {
                                    onSetCurrentKeyChart(record?.key)
                                    onToggleDrawer();
                                }}>
                                    <svg color='#ff5629' xmlns="http://www.w3.org/1800/svg" width="16" height="16" fill="currentColor" class="bi bi-bar-chart-line-fill" viewBox="0 0 16 16">
                                        <path d="M11 2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v12h.5a.5.5 0 0 1 0 1H.5a.5.5 0 0 1 0-1H1v-3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3h1V7a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v7h1V2z" />
                                    </svg>
                                </span>}
                            </span>
                        )
                    }
                },
            },
            {
                title: formatMessage({ defaultMessage: 'Giá trị' }),
                dataIndex: 'value',
                key: 'value',
                width: 180,
                align: 'right',
                render: (item, record) => {
                    const [isParent, isRowDefault] = [record?.children?.length > 0, record?.key === 'profit'];

                    if (isRowDefault) {
                        return <div className='d-flex flex-column'>
                            <span className={clsx('font-weight-bolder mb-2', item >= 0 ? 'text-success' : 'text-danger')}>
                                {typeof item == 'number' ? `${formatNumberToCurrency(item)}đ` : item}
                            </span>

                            <span className={clsx('font-weight-bolder mb-2', record?.valueMargin >= 0 ? 'text-success' : 'text-danger')}>
                                {(record?.valueMargin).toFixed(2)}%
                            </span>

                            <span className={clsx('font-weight-bolder', record?.valueAmountOrder >= 0 ? 'text-success' : 'text-danger')}>
                                {(record?.valueAmountOrder)}
                            </span>
                        </div>
                    } else {
                        return <span className={clsx(record?.code?.length == 2 && 'font-weight-bolder')}>
                            {typeof item == 'number' ? `${formatNumberToCurrency(item)}đ` : item}
                        </span>
                    }
                }
            },
            listChannelCode?.some(code => code === 'shopee') && groupStores['shopee']?.length > 0 ? {
                title: <OverlayTrigger
                    className='cursor-pointer'
                    rootClose
                    trigger="click"
                    placement="bottom"
                    overlay={buildPopupStore('shopee')}
                    onExit={() => setSelectedStoresTemp(selectedStores)}
                >
                    <div className='cursor-pointer'>
                        <span>Shopee</span>
                        <span style={{ position: 'absolute', right: 4 }}>
                            <i className="fas fa-chevron-right text-dark" style={{ fontSize: '0.9rem' }} />
                        </span>
                    </div>
                </OverlayTrigger>,
                key: 'shopee',
                align: 'center',
                children: [
                    {
                        title: formatMessage({ defaultMessage: 'Giá trị' }),
                        dataIndex: 'value_shopee',
                        key: 'value_shopee',
                        width: 180,
                        align: 'right',
                        render(item, record, index) {
                            const [isParent, isRowDefault] = [record?.children?.length > 0, record?.key === 'profit'];
                            if (isRowDefault) {
                                return <div className='d-flex flex-column'>
                                    <span className={clsx('font-weight-bolder mb-2', item >= 0 ? 'text-success' : 'text-danger')}>
                                        {typeof item == 'number' ? `${formatNumberToCurrency(item)}đ` : item}
                                    </span>
                                    <span className={clsx('font-weight-bolder mb-2', record[`value_margin_shopee`] >= 0 ? 'text-success' : 'text-danger')}>
                                        {(record[`value_margin_shopee`]).toFixed(2)}%
                                    </span>

                                    <span className={clsx('font-weight-bolder')}>
                                        {(record[`value_order_shopee`])}
                                    </span>
                                </div>
                            } else {
                                return <span className={clsx(record?.code?.length == 2 && 'font-weight-bolder')}>
                                    {typeof item == 'number' ? `${formatNumberToCurrency(item)}đ` : item}
                                </span>
                            }
                        },
                    },
                    {
                        title: <div>
                            <span>{formatMessage({ defaultMessage: 'Tỷ lệ' })}</span>
                            <OverlayTrigger
                                overlay={
                                    <Tooltip>
                                        {formatMessage({ defaultMessage: 'Tỷ lệ phần trăm giá trị của sàn {channel} so với toàn hệ thống' }, { channel: 'Shopee' })}
                                    </Tooltip>
                                }
                            >
                                <span className="ml-2" style={{ position: 'relative', top: '-1px' }}>
                                    <svg xmlns="http://www.w3.org/1800/svg" width="14" height="14" fill="currentColor" class="bi bi-info-circle" viewBox="0 0 16 16">
                                        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                                        <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
                                    </svg>
                                </span>
                            </OverlayTrigger>
                        </div>,
                        dataIndex: 'ratio_shopee',
                        key: 'ratio_shopee',
                        align: 'center',
                        width: 100,
                        render: (item, record) => {
                            const [isParent, isRowDefault] = [record?.children?.length > 0, record?.key === 'profit'];
                            if (isRowDefault) {
                                return <div className='d-flex flex-column'>
                                    <span className={clsx('font-weight-bolder mb-2', item >= 0 ? 'text-success' : 'text-danger')}>
                                        {typeof item == 'number' ? `${formatNumberToCurrency(item)}%` : item}
                                    </span>
                                    <span className='mb-2' style={{ height: 18 }} />

                                    <span className={clsx('font-weight-bolder', record[`ratio_order_shopee`] >= 0 ? 'text-success' : 'text-danger')}>
                                        {(record[`ratio_order_shopee`]).toFixed(2)}%
                                    </span>
                                </div>
                            } else {
                                return <span className={clsx(record?.code?.length == 2 && 'font-weight-bolder')}>
                                    {typeof item == 'number' ? `${formatNumberToCurrency(item)}%` : item}
                                </span>
                            }
                        }
                    },
                ],
            } : {},
            listChannelCode?.some(code => code === 'shopee') && groupStores['shopee']?.map(store => ({
                title: <div className='d-flex justify-content-center align-items-center'>
                    <img
                        src={toAbsoluteUrl(`/media/logo_shopee.png`)}
                        style={{ width: 20, height: 20, objectFit: "contain" }}
                    />
                    <span className='ml-2'>{store?.name}</span>
                </div>,
                dataIndex: 'c',
                key: store?.id,
                className: 'upbase-table-column-shopee',
                style: { background: 'red' },
                align: 'center',
                children: [
                    {
                        title: formatMessage({ defaultMessage: 'Giá trị' }),
                        dataIndex: `value_${store?.id}`,
                        width: 180,
                        align: 'right',
                        className: 'upbase-table-column-shopee',
                        render(item, record, index) {
                            const [isParent, isRowDefault] = [record?.children?.length > 0, record?.key === 'profit'];
                            if (isRowDefault) {
                                return <div className='d-flex flex-column'>
                                    <span className={clsx('font-weight-bolder mb-2', item >= 0 ? 'text-success' : 'text-danger')}>
                                        {typeof item == 'number' ? `${formatNumberToCurrency(item)}đ` : item}
                                    </span>
                                    <span className={clsx('font-weight-bolder mb-2', record[`value_margin_${store?.id}`] >= 0 ? 'text-success' : 'text-danger')}>
                                        {(record[`value_margin_${store?.id}`]).toFixed(2)}%
                                    </span>
                                    <span className={clsx('font-weight-bolder')}>
                                        {(record[`value_order_${store?.id}`])}
                                    </span>
                                </div>
                            } else {
                                return <span className={clsx(record?.code?.length == 2 && 'font-weight-bolder')}>
                                    {typeof item == 'number' ? `${formatNumberToCurrency(item)}đ` : item}
                                </span>
                            }
                        },
                    },
                    {
                        title: <div>
                            <span>{formatMessage({ defaultMessage: 'Tỷ lệ' })}</span>
                            <OverlayTrigger
                                overlay={
                                    <Tooltip>
                                        {formatMessage({ defaultMessage: 'Tỷ lệ phần trăm giá trị của gian hàng {store} so với toàn sàn {channel}' }, { store: store?.name, channel: 'Shopee' })}
                                    </Tooltip>
                                }
                            >
                                <span className="ml-2" style={{ position: 'relative', top: '-1px' }}>
                                    <svg xmlns="http://www.w3.org/1800/svg" width="14" height="14" fill="currentColor" class="bi bi-info-circle" viewBox="0 0 16 16">
                                        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                                        <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
                                    </svg>
                                </span>
                            </OverlayTrigger>
                        </div>,
                        dataIndex: `ratio_${store?.id}`,
                        render: (item, record) => {
                            const [isParent, isRowDefault] = [record?.children?.length > 0, record?.key === 'profit'];
                            if (isRowDefault) {
                                return <div className='d-flex flex-column'>
                                    <span className={clsx('font-weight-bolder mb-2', item >= 0 ? 'text-success' : 'text-danger')}>
                                        {typeof item == 'number' ? `${formatNumberToCurrency(item)}%` : item}
                                    </span>
                                    <span style={{ height: 18 }} className='mb-2' />
                                    <span className={clsx('font-weight-bolder', record[`ratio_order_${store?.id}`] >= 0 ? 'text-success' : 'text-danger')}>
                                        {(record[`ratio_order_${store?.id}`]).toFixed(2)}%
                                    </span>
                                </div>
                            } else {
                                return <span className={clsx(record?.code?.length == 2 && 'font-weight-bolder')}>
                                    {typeof item == 'number' ? `${formatNumberToCurrency(item)}%` : item}
                                </span>
                            }
                        },
                        className: 'upbase-table-column-shopee',
                        align: 'center',
                        width: 100,
                    },
                ],
            })),
            listChannelCode?.some(code => code === 'lazada') && groupStores['lazada']?.length > 0 ? {
                title: <OverlayTrigger
                    className='cursor-pointer'
                    rootClose
                    trigger="click"
                    placement="bottom"
                    overlay={buildPopupStore('lazada')}
                    onExit={() => setSelectedStoresTemp(selectedStores)}
                >
                    <div className='cursor-pointer'>
                        <span>Lazada</span>
                        <span style={{ position: 'absolute', right: 4 }}>
                            <i className="fas fa-chevron-right text-dark" style={{ fontSize: '0.9rem' }} />
                        </span>
                    </div>
                </OverlayTrigger>,
                key: 'lazada',
                align: 'center',
                children: [
                    {
                        title: formatMessage({ defaultMessage: 'Giá trị' }),
                        dataIndex: 'value_lazada',
                        key: 'value_lazada',
                        width: 180,
                        align: 'right',
                        render(item, record, index) {
                            const [isParent, isRowDefault] = [record?.children?.length > 0, record?.key === 'profit'];
                            if (isRowDefault) {
                                return <div className='d-flex flex-column'>
                                    <span className={clsx('font-weight-bolder mb-2', item >= 0 ? 'text-success' : 'text-danger')}>
                                        {typeof item == 'number' ? `${formatNumberToCurrency(item)}đ` : item}
                                    </span>
                                    <span className={clsx('font-weight-bolder mb-2', record[`value_margin_lazada`] >= 0 ? 'text-success' : 'text-danger')}>
                                        {(record[`value_margin_lazada`]).toFixed(2)}%
                                    </span>

                                    <span className={clsx('font-weight-bolder')}>
                                        {(record[`value_order_lazada`])}
                                    </span>
                                </div>
                            } else {
                                return <span className={clsx(record?.code?.length == 2 && 'font-weight-bolder')}>
                                    {typeof item == 'number' ? `${formatNumberToCurrency(item)}đ` : item}
                                </span>
                            }
                        },
                    },
                    {
                        title: <div>
                            <span>{formatMessage({ defaultMessage: 'Tỷ lệ' })}</span>
                            <OverlayTrigger
                                overlay={
                                    <Tooltip>
                                        {formatMessage({ defaultMessage: 'Tỷ lệ phần trăm giá trị của sàn {channel} so với toàn hệ thống' }, { channel: 'Lazada' })}
                                    </Tooltip>
                                }
                            >
                                <span className="ml-2" style={{ position: 'relative', top: '-1px' }}>
                                    <svg xmlns="http://www.w3.org/1800/svg" width="14" height="14" fill="currentColor" class="bi bi-info-circle" viewBox="0 0 16 16">
                                        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                                        <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
                                    </svg>
                                </span>
                            </OverlayTrigger>
                        </div>,
                        dataIndex: 'ratio_lazada',
                        key: 'ratio_lazada',
                        align: 'center',
                        width: 100,
                        render: (item, record) => {
                            const [isParent, isRowDefault] = [record?.children?.length > 0, record?.key === 'profit'];
                            if (isRowDefault) {
                                return <div className='d-flex flex-column'>
                                    <span className={clsx('font-weight-bolder mb-2', item >= 0 ? 'text-success' : 'text-danger')}>
                                        {typeof item == 'number' ? `${formatNumberToCurrency(item)}%` : item}
                                    </span>
                                    <span style={{ height: 18 }} className='mb-2' />
                                    <span className={clsx('font-weight-bolder', record[`ratio_order_lazada`] >= 0 ? 'text-success' : 'text-danger')}>
                                        {(record[`ratio_order_lazada`]).toFixed(2)}%
                                    </span>
                                </div>
                            } else {
                                return <span className={clsx(record?.code?.length == 2 && 'font-weight-bolder')}>
                                    {typeof item == 'number' ? `${formatNumberToCurrency(item)}%` : item}
                                </span>
                            }
                        }
                    },
                ],
            } : {},
            listChannelCode?.some(code => code === 'lazada') && groupStores['lazada']?.map(store => ({
                title: <div className='d-flex justify-content-center align-items-center'>
                    <img
                        src={toAbsoluteUrl(`/media/logo_lazada.png`)}
                        style={{ width: 20, height: 20, objectFit: "contain" }}
                    />
                    <span className='ml-2'>{store?.name}</span>
                </div>,
                dataIndex: 'c',
                key: store?.id,
                className: 'upbase-table-column-lazada',
                style: { background: 'red' },
                align: 'center',
                children: [
                    {
                        title: formatMessage({ defaultMessage: 'Giá trị' }),
                        dataIndex: `value_${store?.id}`,
                        width: 180,
                        align: 'right',
                        className: 'upbase-table-column-lazada',
                        render(item, record) {
                            const [isParent, isRowDefault] = [record?.children?.length > 0, record?.key === 'profit'];
                            if (isRowDefault) {
                                return <div className='d-flex flex-column'>
                                    <span className={clsx('font-weight-bolder mb-2', item >= 0 ? 'text-success' : 'text-danger')}>
                                        {typeof item == 'number' ? `${formatNumberToCurrency(item)}đ` : item}</span>
                                    <span className={clsx('font-weight-bolder mb-2', record[`value_margin_${store?.id}`] >= 0 ? 'text-success' : 'text-danger')}>
                                        {(record[`value_margin_${store?.id}`]).toFixed(2)}%
                                    </span>
                                    <span className={clsx('font-weight-bolder')}>
                                        {(record[`value_order_${store?.id}`])}
                                    </span>
                                </div>
                            } else {
                                return <span className={clsx(record?.code?.length == 2 && 'font-weight-bolder')}>
                                    {typeof item == 'number' ? `${formatNumberToCurrency(item)}đ` : item}
                                </span>
                            }
                        },
                    },
                    {
                        title: <div>
                            <span>{formatMessage({ defaultMessage: 'Tỷ lệ' })}</span>
                            <OverlayTrigger
                                overlay={
                                    <Tooltip>
                                        {formatMessage({ defaultMessage: 'Tỷ lệ phần trăm giá trị của gian hàng {store} so với toàn sàn {channel}' }, { store: store?.name, channel: 'Lazada' })}
                                    </Tooltip>
                                }
                            >
                                <span className="ml-2" style={{ position: 'relative', top: '-1px' }}>
                                    <svg xmlns="http://www.w3.org/1800/svg" width="14" height="14" fill="currentColor" class="bi bi-info-circle" viewBox="0 0 16 16">
                                        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                                        <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
                                    </svg>
                                </span>
                            </OverlayTrigger>
                        </div>,
                        dataIndex: `ratio_${store?.id}`,
                        render: (item, record) => {
                            const [isParent, isRowDefault] = [record?.children?.length > 0, record?.key === 'profit'];
                            if (isRowDefault) {
                                return <div className='d-flex flex-column'>
                                    <span className={clsx('font-weight-bolder mb-2', item >= 0 ? 'text-success' : 'text-danger')}>
                                        {typeof item == 'number' ? `${formatNumberToCurrency(item)}%` : item}
                                    </span>
                                    <span style={{ height: 18 }} className='mb-2' />
                                    <span className={clsx('font-weight-bolder', record[`ratio_order_${store?.id}`] >= 0 ? 'text-success' : 'text-danger')}>
                                        {(record[`ratio_order_${store?.id}`]).toFixed(2)}%
                                    </span>
                                </div>
                            } else {
                                return <span className={clsx(record?.code?.length == 2 && 'font-weight-bolder')}>
                                    {typeof item == 'number' ? `${formatNumberToCurrency(item)}%` : item}
                                </span>
                            }
                        },
                        className: 'upbase-table-column-lazada',
                        align: 'center',
                        width: 100,
                    },
                ],
            })),
            listChannelCode?.some(code => code === 'tiktok') && groupStores['tiktok']?.length > 0 ? {
                title: <OverlayTrigger
                    className='cursor-pointer'
                    rootClose
                    trigger="click"
                    placement="bottom"
                    overlay={buildPopupStore('tiktok')}
                    onExit={() => setSelectedStoresTemp(selectedStores)}
                >
                    <div className='cursor-pointer'>
                        <span>Tiktok</span>
                        <span style={{ position: 'absolute', right: 4 }}>
                            <i className="fas fa-chevron-right text-dark" style={{ fontSize: '0.9rem' }} />
                        </span>
                    </div>
                </OverlayTrigger>,
                key: 'tiktok',
                align: 'center',
                children: [
                    {
                        title: formatMessage({ defaultMessage: 'Giá trị' }),
                        dataIndex: 'value_tiktok',
                        key: 'value_tiktok',
                        width: 180,
                        align: 'right',
                        render(item, record) {
                            const [isParent, isRowDefault] = [record?.children?.length > 0, record?.key === 'profit'];
                            if (isRowDefault) {
                                return <div className='d-flex flex-column'>
                                    <span className={clsx('font-weight-bolder mb-2', item >= 0 ? 'text-success' : 'text-danger')}>
                                        {typeof item == 'number' ? `${formatNumberToCurrency(item)}đ` : item}
                                    </span>
                                    <span className={clsx('font-weight-bolder mb-2', record[`value_margin_tiktok`] >= 0 ? 'text-success' : 'text-danger')}>
                                        {(record[`value_margin_tiktok`]).toFixed(2)}%
                                    </span>
                                    <span className={clsx('font-weight-bolder mb-2')}>
                                        {(record[`value_order_tiktok`])}
                                    </span>
                                </div>
                            } else {
                                return <span className={clsx(record?.code?.length == 2 && 'font-weight-bolder')}>
                                    {typeof item == 'number' ? `${formatNumberToCurrency(item)}đ` : item}
                                </span>
                            }
                        },
                    },
                    {
                        title: <div>
                            <span>{formatMessage({ defaultMessage: 'Tỷ lệ' })}</span>
                            <OverlayTrigger
                                overlay={
                                    <Tooltip>
                                        {formatMessage({ defaultMessage: 'Tỷ lệ phần trăm giá trị của sàn {channel} so với toàn hệ thống' }, { channel: 'Tiktok' })}
                                    </Tooltip>
                                }
                            >
                                <span className="ml-2" style={{ position: 'relative', top: '-1px' }}>
                                    <svg xmlns="http://www.w3.org/1800/svg" width="14" height="14" fill="currentColor" class="bi bi-info-circle" viewBox="0 0 16 16">
                                        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                                        <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
                                    </svg>
                                </span>
                            </OverlayTrigger>
                        </div>,
                        dataIndex: 'ratio_tiktok',
                        key: 'ratio_tiktok',
                        align: 'center',
                        width: 100,
                        render: (item, record) => {
                            const [isParent, isRowDefault] = [record?.children?.length > 0, record?.key === 'profit'];
                            if (isRowDefault) {
                                return <div className='d-flex flex-column'>
                                    <span className={clsx('font-weight-bolder mb-2', item >= 0 ? 'text-success' : 'text-danger')}>
                                        {typeof item == 'number' ? `${formatNumberToCurrency(item)}%` : item}
                                    </span>
                                    <span style={{ height: 18 }} className='mb-2' />
                                    <span className={clsx('font-weight-bolder', record[`ratio_order_tiktok`] >= 0 ? 'text-success' : 'text-danger')}>
                                        {(record[`ratio_order_tiktok`]).toFixed(2)}%
                                    </span>
                                </div>
                            } else {
                                return <span className={clsx(record?.code?.length == 2 && 'font-weight-bolder')}>
                                    {typeof item == 'number' ? `${formatNumberToCurrency(item)}%` : item}
                                </span>
                            }
                        }
                    },
                ],
            } : {},
            listChannelCode?.some(code => code === 'tiktok') && groupStores['tiktok']?.map(store => ({
                title: <div className='d-flex justify-content-center align-items-center'>
                    <img
                        src={toAbsoluteUrl(`/media/logo_tiktok.png`)}
                        style={{ width: 20, height: 20, objectFit: "contain" }}
                    />
                    <span className='ml-2'>{store?.name}</span>
                </div>,
                dataIndex: 'c',
                key: store?.id,
                className: 'upbase-table-column-tiktok',
                style: { background: 'red' },
                align: 'center',
                children: [
                    {
                        title: formatMessage({ defaultMessage: 'Giá trị' }),
                        dataIndex: `value_${store?.id}`,
                        width: 180,
                        align: 'right',
                        className: 'upbase-table-column-tiktok',
                        render(item, record) {
                            const [isParent, isRowDefault] = [record?.children?.length > 0, record?.key === 'profit'];
                            if (isRowDefault) {
                                return <div className='d-flex flex-column'>
                                    <span className={clsx('font-weight-bolder mb-2', item >= 0 ? 'text-success' : 'text-danger')}>
                                        {typeof item == 'number' ? `${formatNumberToCurrency(item)}đ` : item}
                                    </span>
                                    <span className={clsx('font-weight-bolder mb-2', record[`value_margin_${store?.id}`] >= 0 ? 'text-success' : 'text-danger')}>
                                        {(record[`value_margin_${store?.id}`]).toFixed(2)}%
                                    </span>
                                    <span className={clsx('font-weight-bolder')}>
                                        {(record[`value_order_${store?.id}`])}
                                    </span>
                                </div>
                            } else {
                                return <span className={clsx(record?.code?.length == 2 && 'font-weight-bolder')}>
                                    {typeof item == 'number' ? `${formatNumberToCurrency(item)}đ` : item}
                                </span>
                            }
                        },
                    },
                    {
                        title: <div>
                            <span>{formatMessage({ defaultMessage: 'Tỷ lệ' })}</span>
                            <OverlayTrigger
                                overlay={
                                    <Tooltip>
                                        {formatMessage({ defaultMessage: 'Tỷ lệ phần trăm giá trị của gian hàng {store} so với toàn sàn {channel}' }, { store: store?.name, channel: 'Tiktok' })}
                                    </Tooltip>
                                }
                            >
                                <span className="ml-2" style={{ position: 'relative', top: '-1px' }}>
                                    <svg xmlns="http://www.w3.org/1800/svg" width="14" height="14" fill="currentColor" class="bi bi-info-circle" viewBox="0 0 16 16">
                                        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                                        <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
                                    </svg>
                                </span>
                            </OverlayTrigger>
                        </div>,
                        dataIndex: `ratio_${store?.id}`,
                        render: (item, record) => {
                            const [isParent, isRowDefault] = [record?.children?.length > 0, record?.key === 'profit'];
                            if (isRowDefault) {
                                return <div className='d-flex flex-column'>
                                    <span className={clsx('font-weight-bolder mb-2', item >= 0 ? 'text-success' : 'text-danger')}>
                                        {typeof item == 'number' ? `${formatNumberToCurrency(item)}%` : item}
                                    </span>
                                    <span style={{ height: 18 }} className='mb-2' />
                                    <span className={clsx('font-weight-bolder', record[`ratio_order_${store?.id}`] >= 0 ? 'text-success' : 'text-danger')}>
                                        {(record[`ratio_order_${store?.id}`]).toFixed(2)}%
                                    </span>
                                </div>
                            } else {
                                return <span className={clsx(record?.code?.length == 2 && 'font-weight-bolder')}>
                                    {typeof item == 'number' ? `${formatNumberToCurrency(item)}%` : item}
                                </span>
                            }
                        },
                        className: 'upbase-table-column-tiktok',
                        align: 'center',
                        width: 100,
                    },
                ],
            })),
            listChannelCode?.some(code => code === 'other') && groupStores['other']?.length > 0 ? {
                title: <OverlayTrigger
                    className='cursor-pointer'
                    rootClose
                    trigger="click"
                    placement="bottom"
                    overlay={buildPopupStore('other')}
                    onExit={() => setSelectedStoresTemp(selectedStores)}
                >
                    <div className='cursor-pointer'>
                        <span>{formatMessage({ defaultMessage: 'Khác' })}</span>
                        <span style={{ position: 'absolute', right: 4 }}>
                            <i className="fas fa-chevron-right text-dark" style={{ fontSize: '0.9rem' }} />
                        </span>
                    </div>
                </OverlayTrigger>,
                key: 'other',
                align: 'center',
                children: [
                    {
                        title: formatMessage({ defaultMessage: 'Giá trị' }),
                        dataIndex: 'value_other',
                        key: 'value_other',
                        width: 180,
                        align: 'right',
                        render(item, record) {
                            const [isParent, isRowDefault] = [record?.children?.length > 0, record?.key === 'profit'];
                            if (isRowDefault) {
                                return <div className='d-flex flex-column'>
                                    <span className={clsx('font-weight-bolder mb-2', item >= 0 ? 'text-success' : 'text-danger')}>
                                        {typeof item == 'number' ? `${formatNumberToCurrency(item)}đ` : item}
                                    </span>
                                    <span className={clsx('font-weight-bolder mb-2', record[`value_margin_other`] >= 0 ? 'text-success' : 'text-danger')}>
                                        {(record[`value_margin_other`]).toFixed(2)}%
                                    </span>
                                    <span className={clsx('font-weight-bolder mb-2')}>
                                        {(record[`value_order_other`])}
                                    </span>
                                </div>
                            } else {
                                return <span className={clsx(record?.code?.length == 2 && 'font-weight-bolder')}>
                                    {typeof item == 'number' ? `${formatNumberToCurrency(item)}đ` : item}
                                </span>
                            }
                        },
                    },
                    {
                        title: <div>
                            <span>{formatMessage({ defaultMessage: 'Tỷ lệ' })}</span>
                            <OverlayTrigger
                                overlay={
                                    <Tooltip>
                                        {formatMessage({ defaultMessage: 'Tỷ lệ phần trăm giá trị của sàn {channel} so với toàn hệ thống' }, { channel: 'Khác' })}
                                    </Tooltip>
                                }
                            >
                                <span className="ml-2" style={{ position: 'relative', top: '-1px' }}>
                                    <svg xmlns="http://www.w3.org/1800/svg" width="14" height="14" fill="currentColor" class="bi bi-info-circle" viewBox="0 0 16 16">
                                        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                                        <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
                                    </svg>
                                </span>
                            </OverlayTrigger>
                        </div>,
                        dataIndex: 'ratio_other',
                        key: 'ratio_other',
                        align: 'center',
                        width: 100,
                        render: (item, record) => {
                            const [isParent, isRowDefault] = [record?.children?.length > 0, record?.key === 'profit'];
                            if (isRowDefault) {
                                return <div className='d-flex flex-column'>
                                    <span className={clsx('font-weight-bolder mb-2', item >= 0 ? 'text-success' : 'text-danger')}>
                                        {typeof item == 'number' ? `${formatNumberToCurrency(item)}%` : item}
                                    </span>
                                    <span style={{ height: 18 }} className='mb-2' />
                                    <span className={clsx('font-weight-bolder', record[`ratio_order_other`] >= 0 ? 'text-success' : 'text-danger')}>
                                        {(record[`ratio_order_other`]).toFixed(2)}%
                                    </span>
                                </div>
                            } else {
                                return <span className={clsx(record?.code?.length == 2 && 'font-weight-bolder')}>
                                    {typeof item == 'number' ? `${formatNumberToCurrency(item)}%` : item}
                                </span>
                            }
                        }
                    },
                ],
            } : {},
            listChannelCode?.some(code => code === 'other') && groupStores['other']?.map(store => ({
                title: <div className='d-flex justify-content-center align-items-center'>
                    <img
                        src={toAbsoluteUrl(`/media/logo_other.png`)}
                        style={{ width: 20, height: 20, objectFit: "contain" }}
                    />
                    <span className='ml-2'>{store?.name}</span>
                </div>,
                dataIndex: 'c',
                key: store?.id,
                className: 'upbase-table-column-other',
                style: { background: 'red' },
                align: 'center',
                children: [
                    {
                        title: formatMessage({ defaultMessage: 'Giá trị' }),
                        dataIndex: `value_${store?.id}`,
                        width: 180,
                        align: 'right',
                        className: 'upbase-table-column-other',
                        render(item, record) {
                            const [isParent, isRowDefault] = [record?.children?.length > 0, record?.key === 'profit'];
                            if (isRowDefault) {
                                return <div className='d-flex flex-column'>
                                    <span className={clsx('font-weight-bolder mb-2', item >= 0 ? 'text-success' : 'text-danger')}>
                                        {typeof item == 'number' ? `${formatNumberToCurrency(item)}đ` : item}
                                    </span>
                                    <span className={clsx('font-weight-bolder mb-2', record[`value_margin_${store?.id}`] >= 0 ? 'text-success' : 'text-danger')}>
                                        {(record[`value_margin_${store?.id}`]).toFixed(2)}%
                                    </span>
                                    <span className={clsx('font-weight-bolder')}>
                                        {(record[`value_order_${store?.id}`])}
                                    </span>
                                </div>
                            } else {
                                return <span className={clsx(record?.code?.length == 2 && 'font-weight-bolder')}>
                                    {typeof item == 'number' ? `${formatNumberToCurrency(item)}đ` : item}
                                </span>
                            }
                        },
                    },
                    {
                        title: <div>
                            <span>{formatMessage({ defaultMessage: 'Tỷ lệ' })}</span>
                            <OverlayTrigger
                                overlay={
                                    <Tooltip>
                                        {formatMessage({ defaultMessage: 'Tỷ lệ phần trăm giá trị của gian hàng {store} so với toàn sàn {channel}' }, { store: store?.name, channel: 'Khác' })}
                                    </Tooltip>
                                }
                            >
                                <span className="ml-2" style={{ position: 'relative', top: '-1px' }}>
                                    <svg xmlns="http://www.w3.org/1800/svg" width="14" height="14" fill="currentColor" class="bi bi-info-circle" viewBox="0 0 16 16">
                                        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                                        <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
                                    </svg>
                                </span>
                            </OverlayTrigger>
                        </div>,
                        dataIndex: `ratio_${store?.id}`,
                        render: (item, record) => {
                            const [isParent, isRowDefault] = [record?.children?.length > 0, record?.key === 'profit'];
                            if (isRowDefault) {
                                return <div className='d-flex flex-column'>
                                    <span className={clsx('font-weight-bolder mb-2', item >= 0 ? 'text-success' : 'text-danger')}>
                                        {typeof item == 'number' ? `${formatNumberToCurrency(item)}%` : item}
                                    </span>
                                    <span style={{ height: 18 }} className='mb-2' />
                                    <span className={clsx('font-weight-bolder', record[`ratio_order_${store?.id}`] >= 0 ? 'text-success' : 'text-danger')}>
                                        {(record[`ratio_order_${store?.id}`]).toFixed(2)}%
                                    </span>
                                </div>
                            } else {
                                return <span className={clsx(record?.code?.length == 2 && 'font-weight-bolder')}>
                                    {typeof item == 'number' ? `${formatNumberToCurrency(item)}%` : item}
                                </span>
                            }
                        },
                        className: 'upbase-table-column-other',
                        align: 'center',
                        width: 100,
                    },
                ],
            })),
        ]);

        return dataColums;
    }, [groupStores, buildPopupStore, listChannelCode])


    return (
        <Fragment>
            <div style={{ position: 'relative', minHeight: 300 }}>
                {loading && (
                    <div style={{ position: 'absolute', top: '30%', left: '50%', zIndex: 99 }}>
                        <span className="spinner spinner-primary" />
                    </div>
                )}
                {!loading && (
                    <Table
                        className="upbase-table"
                        columns={columns?.filter(clm => typeof clm?.key == 'string' || selectedStores?.some(store => store == clm?.key))}
                        data={dataTabe}
                        tableLayout="auto"
                        expandable={{
                            defaultExpandAllRows: false,
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
                        scroll={{ x: selectedStores?.length > 0 ? 'max-content' : 'unset' }}
                    />
                )}
            </div>
        </Fragment>
    )
};

export default memo(TradingReportChannelTable);