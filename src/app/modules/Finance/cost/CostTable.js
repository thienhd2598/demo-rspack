import React, { Fragment, memo, useMemo } from 'react';
import Table from 'rc-table';
import 'rc-table/assets/index.css';
import { FormattedMessage, useIntl } from 'react-intl';
import { Dropdown, Tooltip } from 'react-bootstrap';
import { formatNumberToCurrency } from '../../../../utils';
import { useQuery } from '@apollo/client';
import query_list_cost_period from '../../../../graphql/query_list_cost_period';
import { useLocation } from 'react-router-dom';
import queryString from 'querystring';
import dayjs from 'dayjs';
import { OverlayTrigger, Popover } from 'react-bootstrap';
import { toAbsoluteUrl } from '../../../../_metronic/_helpers';
import _ from 'lodash';
import clsx from 'clsx';
import SVG from "react-inlinesvg";
import Pagination from '../../../../components/Pagination';
import AuthorizationWrapper from '../../../../components/AuthorizationWrapper';

const CostTable = ({ dataCostPeriodType, onConfirmDelete, onShowUpdateCost, optionsStores, currentDateRangeTime }) => {
    const { formatMessage } = useIntl();
    const params = queryString.parse(useLocation().search.slice(1, 100000));

    const type = useMemo(
        () => {
            if (!params.type) return {};
            return {
                type: [+params?.type]
            }
        }, [params.type]
    );

    const search_time = useMemo(
        () => {
            try {
                if (!params.time_from || !params.time_to) {
                    if (currentDateRangeTime?.length > 0) {
                        return {
                            search_time: [
                                dayjs().subtract(30, "day").format('YYYY-MM-DD'),
                                dayjs().format('YYYY-MM-DD'),
                            ]
                        }
                    } else return {}
                };

                return {
                    search_time: [
                        dayjs.unix(params?.time_from).format('YYYY-MM-DD'),
                        dayjs.unix(params?.time_to).format('YYYY-MM-DD'),
                    ]
                }
            } catch (error) {
                return {}
            }
        }, [params?.time_from, params?.time_to, currentDateRangeTime]
    );

    let page = useMemo(() => {
        try {
            let _page = Number(params.page)
            if (!Number.isNaN(_page)) {
                return Math.max(1, _page)
            } else {
                return 1
            }
        } catch (error) {
            return 1
        }
    }, [params.page]);

    let limit = useMemo(() => {
        try {
            let _value = Number(params.limit)
            if (!Number.isNaN(_value)) {
                return Math.max(25, _value)
            } else {
                return 25
            }
        } catch (error) {
            return 25
        }
    }, [params.limit])

    const { data, loading } = useQuery(query_list_cost_period, {
        variables: {
            first: limit,
            page: page,
            ...type,
            ...search_time
        },
        fetchPolicy: 'cache-and-network',
    });

    let totalRecord = data?.list_cost_period?.paginatorInfo?.total || 0
    let totalPage = Math.ceil(totalRecord / limit);

    const columns = [
        {
            title: formatMessage({ defaultMessage: 'Tên chi phí' }),
            dataIndex: 'name',
            key: 'name',
            align: 'left',
            width: 60,
        },
        {
            title: formatMessage({ defaultMessage: 'Khoản mục chi phí' }),
            dataIndex: 'cost_label',
            key: 'cost_label',
            align: 'left',
            width: 60,
        },
        {
            title: formatMessage({ defaultMessage: 'Nhóm chi phí' }),
            dataIndex: 'id',
            key: 'id',
            align: 'left',
            width: 60,
            render: (_item, record) => {
                const findedCostPeriod = dataCostPeriodType?.getCostPeriodType?.find(cost => cost?.type === record?.type);

                return findedCostPeriod?.label || '--'
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Tổng chi phí' }),
            dataIndex: 'cost',
            key: 'cost',
            width: 60,
            align: 'center',
            render: (item) => {
                return `${formatNumberToCurrency(item)}đ`;
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Gian hàng phân bổ' }),
            dataIndex: 'method',
            key: 'method',
            width: 60,
            align: 'center',
            render: (item, record) => {
                const grpCostDaily = _.groupBy(record?.dailyCostPeriod, cost => cost?.store?.id);
                const jobDailyDone = Object.keys(grpCostDaily)?.length == record?.stores?.length;

                return <div className='d-flex flex-column'>
                    <OverlayTrigger
                        className='cursor-pointer'
                        rootClose
                        trigger="click"
                        placement="bottom"
                        overlay={<Popover className='mt-2' style={{ minWidth: 350 }}>
                            <Popover.Content>
                                {jobDailyDone && Object.keys(grpCostDaily)?.map((key, idx) => {
                                    const costDaily = grpCostDaily[key][0];
                                    const isErrStore = !optionsStores?.some(store => store?.id == key);

                                    return (
                                        <div className="d-flex flex-column">
                                            <div className={clsx('d-flex justify-content-between align-items-center', Object.keys(grpCostDaily)?.length - 1 != idx && 'mb-4')}>
                                                <div className='d-flex align-items-center'>
                                                    <img
                                                        src={toAbsoluteUrl(`/media/logo_${costDaily?.connector_channel_code}.png`)}
                                                        style={{ width: 20, height: 20, objectFit: "contain" }}
                                                    />
                                                    <span className='fs-14 ml-2'>{costDaily?.store?.name}</span>
                                                    {isErrStore && <span className='ml-2' style={{ position: 'relative', top: -3 }}>
                                                        <OverlayTrigger
                                                            overlay={
                                                                <Tooltip>
                                                                    <FormattedMessage defaultMessage="Gian hàng đã bị ngắt kết nối" />
                                                                </Tooltip>
                                                            }
                                                        >
                                                            <SVG src={toAbsoluteUrl("/media/svg/ic-warning.svg")} />
                                                        </OverlayTrigger>
                                                    </span>}
                                                </div>
                                                <span className='fs-14'>
                                                    {formatNumberToCurrency(_.sum(grpCostDaily[key]?.map(item => item?.cost)).toFixed())}đ
                                                </span>
                                            </div>
                                        </div>
                                    )
                                })}
                                {!jobDailyDone && <div className='d-flex justify-content-center align-items-center my-4'>
                                    <span className="spinner spinner-primary" style={{ position: 'relative', right: 10 }} />
                                </div>}
                            </Popover.Content>
                        </Popover>}
                    >
                        <span className='cursor-pointer text-primary'>
                            {formatMessage({ defaultMessage: '{count} gian hàng' }, { count: record?.stores?.length })}
                        </span>
                    </OverlayTrigger>
                </div>
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Cách phân bổ' }),
            dataIndex: 'method',
            key: 'method',
            width: 60,
            align: 'center',
            render: (item) => {
                return <span>{item == 1 ? formatMessage({ defaultMessage: 'Phân bổ theo gian hàng' }) : formatMessage({ defaultMessage: 'Phân bổ theo đơn hàng' })}</span>
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Thời gian phân bổ' }),
            dataIndex: 'time_from',
            key: 'time_from',
            width: 60,
            align: 'center',
            render: (_item, record) => {
                return <div className='d-flex flex-column'>
                    <span className='mb-2'>
                        {dayjs(record?.time_from).format('DD-MM-YYYY')}
                    </span>
                    <span>
                        {dayjs(record?.time_to).format('DD-MM-YYYY')}
                    </span>
                </div>
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Thao tác' }),
            dataIndex: 'id',
            key: 'id',
            width: '10%',
            align: 'center',
            render: (item, record) => {
                return (
                    <AuthorizationWrapper keys={['finance_cost_period_crud']}>
                        <Dropdown drop='down'>
                            <Dropdown.Toggle
                                className='btn-outline-secondary'
                            >
                                {formatMessage({ defaultMessage: 'Chọn' })}
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                                <Dropdown.Item
                                    className="mb-1 d-flex"
                                    onClick={() => onShowUpdateCost(record)}
                                >
                                    {formatMessage({ defaultMessage: 'Sửa' })}
                                </Dropdown.Item>
                                <Dropdown.Item
                                    className="mb-1 d-flex"
                                    onClick={() => onShowUpdateCost(record, 'clone')}
                                >
                                    {formatMessage({ defaultMessage: 'Sao chép' })}
                                </Dropdown.Item>
                                <Dropdown.Item
                                    className="mb-1 d-flex"
                                    onClick={() => onConfirmDelete(record?.id)}
                                >
                                    {formatMessage({ defaultMessage: 'Xóa' })}
                                </Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                    </AuthorizationWrapper>
                )
            }
        },
    ];

    return (
        <Fragment>
            <div style={{ position: 'relative' }}>
                {loading && (
                    <div style={{ position: 'absolute', top: '50%', left: '50%', zIndex: 99 }}>
                        <span className="spinner spinner-primary" />
                    </div>
                )}
                <Table
                    style={loading ? { opacity: 0.4 } : {}}
                    className="upbase-table"
                    columns={columns}
                    data={data?.list_cost_period?.data || []}
                    emptyText={<div className='d-flex flex-column align-items-center justify-content-center my-10'>
                        <img src={toAbsoluteUrl("/media/empty.png")} alt="image" width={80} />
                        <span className='mt-4'>{formatMessage({ defaultMessage: 'Chưa có chi phí' })}</span>
                    </div>}
                    tableLayout="auto"
                    sticky={{ offsetHeader: 45 }}
                />
            </div>
            <Pagination
                page={page}
                totalPage={totalPage}
                loading={loading}
                limit={limit}
                totalRecord={totalRecord}
                count={data?.list_cost_period?.data?.length}
                basePath={'/finance/cost'}
                isShowEmpty={false}
            />
        </Fragment>
    )
};

export default memo(CostTable);