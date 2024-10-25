import React, { Fragment, useMemo, useState, memo } from 'react'
import { useIntl } from 'react-intl'
import { useHistory, useLocation } from "react-router-dom";
import queryString from "querystring";
import { useToasts } from 'react-toast-notifications';
import Table from 'rc-table';
import { Dropdown, OverlayTrigger, Tooltip } from "react-bootstrap";
import { useMutation, useQuery } from '@apollo/client';
import _, { omit } from 'lodash';
import LoadingDialog from '../../product-new/LoadingDialog';
import { STATUS_LIST_RESERVE } from '../ProductsReserveUIHelpers';
import clsx from 'clsx';
import { Checkbox } from '../../../../../_metronic/_partials/controls';
import query_warehouse_reserve_tickets from '../../../../../graphql/query_warehouse_reserve_tickets';
import Pagination from '../../../../../components/Pagination';
import { toAbsoluteUrl } from '../../../../../_metronic/_helpers';
import dayjs from 'dayjs';
import { formatNumberToCurrency } from '../../../../../utils';
import ProductReserveCount from './ProductReserveCount';
import AuthorizationWrapper from '../../../../../components/AuthorizationWrapper';

const ProductReserveTable = ({ ids, setIds, whereCondition, optionsStore, whereConditionCount, onShowAction, onRetryTicket }) => {
    const location = useLocation();
    const history = useHistory();
    const params = queryString.parse(location.search.slice(1, 100000));
    const { formatMessage } = useIntl();
    const { addToast } = useToasts()

    const page = useMemo(() => {
        try {
            let _page = Number(params.page);
            if (!Number.isNaN(_page)) {
                return Math.max(1, _page)
            } else {
                return 1
            }
        } catch (error) {
            return 1;
        }
    }, [params.page]);

    const limit = useMemo(() => {
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
    }, [params.limit]);

    const { data, loading, error, refetch } = useQuery(query_warehouse_reserve_tickets, {
        variables: {
            limit,
            offset: (page - 1) * limit,
            where: whereCondition
        },
        fetchPolicy: 'cache-and-network'
    });

    let totalRecord = data?.warehouse_reserve_tickets_aggregate?.aggregate?.count || 0;
    let totalPage = Math.ceil(totalRecord / limit);

    const isSelectAll = ids.length > 0 && ids.filter(_id => {
        return data?.warehouse_reserve_tickets?.some(item => item?.id === _id?.id);
    })?.length == data?.warehouse_reserve_tickets?.length;

    const columns = [
        {
            title: <div className='d-flex align-items-center'>
                {(params?.status == 'done' || params?.status == 'error') && (
                    <div className="mr-1">
                        <Checkbox
                            size="checkbox-md"
                            inputProps={{
                                'aria-label': 'checkbox',
                            }}
                            isSelected={isSelectAll}
                            onChange={e => {
                                if (isSelectAll) {
                                    setIds(ids.filter(x => {
                                        return !data?.warehouse_reserve_tickets?.some(ticket => ticket.id === x.id);
                                    }))
                                } else {
                                    const tempArray = [...ids];
                                    (data?.warehouse_reserve_tickets || []).forEach(ticket => {
                                        if (ticket && !ids.some(item => item.id === ticket.id)) {
                                            tempArray.push(ticket);
                                        }
                                    })
                                    setIds(tempArray)
                                }
                            }}
                        />
                    </div>
                )}
                <span>{formatMessage({ defaultMessage: 'Tên phiếu dự trữ' })}</span>
            </div>,
            dataIndex: 'name',
            key: 'name',
            width: '20%',
            align: 'left',
            render: (item, record) => {
                return <div className='d-flex align-items-center'>
                    {(params?.status == 'done' || params?.status == 'error') && (
                        <div className='mr-1'>
                            <Checkbox
                                size="checkbox-md"
                                inputProps={{
                                    'aria-label': 'checkbox',
                                }}
                                isSelected={ids.some(_id => _id?.id == record?.id)}
                                onChange={e => {
                                    if (ids.some((_id) => _id.id == record.id)) {
                                        setIds(prev => prev.filter((_id) => _id.id != record.id));
                                    } else {
                                        setIds(prev => prev.concat([record]));
                                    }
                                }}
                            />
                        </div>
                    )}
                    <span className='cursor-pointer' onClick={() => window.open(`/products/reserve/${record?.id}`)}>{item}</span>
                </div>
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Gian hàng' }),
            dataIndex: 'sc_store_id',
            key: 'sc_store_id',
            align: 'left',
            width: '17%',
            render: (item, record) => {
                const store = optionsStore.find(st => st?.value == item);

                return <div className='d-flex align-items-center'>
                    {!!store?.logo ? <img
                        style={{ width: 15, height: 15 }}
                        src={store?.logo}
                        className="mr-2"
                    /> : null}
                    <span >{store?.label}</span>
                </div>
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Thời gian dự trữ' }),
            dataIndex: 'end_date',
            key: 'end_date',
            align: 'left',
            width: '13%',
            render: (item, record) => {
                const rangeTime = [
                    dayjs(record?.created_at).format('HH:mm DD/MM/YYYY'),
                    dayjs.unix(record?.end_date).format('HH:mm DD/MM/YYYY'),
                ];

                return <>
                    <p>{rangeTime[0]}</p>
                    <p>- {rangeTime[1]}</p>
                </>
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Thời gian bắt đầu CTKM' }),
            dataIndex: 'end_date',
            key: 'end_date',
            align: 'left',
            width: '12%',
            render: (item, record) => {
                let campaignStartTime
                if (record?.start_date) {
                    campaignStartTime = dayjs.unix(record?.start_date).format('HH:mm DD/MM/YYYY')
                } else {
                    campaignStartTime = ""
                }

                return <span>{campaignStartTime}</span>
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Tổng hàng hóa' }),
            dataIndex: 'total_variant',
            key: 'total_variant',
            align: 'center',
            width: '15%',
            render: (item, record) => {
                return <span>{formatNumberToCurrency(record?.total_variant)}</span>
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Trạng thái' }),
            dataIndex: 'status',
            key: 'status',
            align: 'center',
            width: '13%',
            render: (item, record) => {
                const isStatusProcessing = record?.status == 'processing';

                return <div className={`d-flex align-items-center ${isStatusProcessing ? 'justify-content-between' : 'justify-content-center'}`}>
                    <div className='py-1' style={{ background: record?.status == 'processing' ? '#FF5629' : '#00DB6D', borderRadius: 6, minWidth: isStatusProcessing ? '80%' : '100%' }}>
                        <span className='text-white'>
                            {isStatusProcessing ? formatMessage({ defaultMessage: 'Đang dự trữ' }) : formatMessage({ defaultMessage: 'Kết thúc' })}
                        </span>
                    </div>
                    {isStatusProcessing && (
                        <>
                            {record?.total_error > 0 ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="text-danger bi bi-exclamation-triangle-fill" viewBox="0 0 16 16">
                                    <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="text-success bi bi-check-circle" viewBox="0 0 16 16">
                                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                                    <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z" />
                                </svg>
                            )}
                        </>
                    )}
                </div>
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Hành động' }),
            dataIndex: 'id',
            key: 'id',
            align: 'center',
            width: '10%',
            render: (item, record) => {
                return (
                    <Dropdown drop='down' >
                        <Dropdown.Toggle className='btn-outline-secondary' >
                            {formatMessage({ defaultMessage: 'Chọn' })}
                        </Dropdown.Toggle>

                        <Dropdown.Menu>
                            <AuthorizationWrapper keys={['product_reserve_detail']}>
                                <Dropdown.Item
                                    className="mb-1 d-flex"
                                    onClick={async e => {
                                        e.preventDefault();

                                        history.push(`/products/reserve/${record?.id}`)
                                    }}>
                                    {formatMessage({ defaultMessage: 'Xem chi tiết' })}
                                </Dropdown.Item>
                            </AuthorizationWrapper>
                            <AuthorizationWrapper keys={['product_reserve_action']}>
                                {record?.status == 'processing' && record?.total_error > 0 && (
                                    <Dropdown.Item
                                        className="mb-1 d-flex"
                                        onClick={() => onRetryTicket(record?.id)}
                                    >
                                        {formatMessage({ defaultMessage: 'Thử lại' })}
                                    </Dropdown.Item>
                                )}
                            </AuthorizationWrapper>
                            <AuthorizationWrapper keys={['product_reserve_finish']}>
                                {record?.status == 'processing' && (
                                    <Dropdown.Item
                                        className="mb-1 d-flex"
                                        onClick={() => onShowAction(record?.id, 'finish')}
                                    >
                                        {formatMessage({ defaultMessage: 'Kết thúc' })}
                                    </Dropdown.Item>
                                )}
                            </AuthorizationWrapper>
                            {(record?.status == 'finished' || record?.status == 'processing') && (
                                <>
                                    <AuthorizationWrapper keys={['product_reserve_action']}>
                                        <Dropdown.Item
                                            className="mb-1 d-flex"
                                            onClick={async e => {
                                                e.preventDefault();

                                                history.push({
                                                    pathname: `/products/reserve-create`,
                                                    state: { id: record?.id }
                                                })
                                            }}
                                        >
                                            {formatMessage({ defaultMessage: 'Sao chép mẫu dự trữ' })}
                                        </Dropdown.Item>
                                    </AuthorizationWrapper>
                                </>
                            )}
                        </Dropdown.Menu>
                    </Dropdown>
                )
            }
        },
    ];

    return (
        <Fragment>
            <LoadingDialog show={false} />
            <div className="d-flex w-100 mt-2" style={{ background: "#fff", zIndex: 1, borderBottom: 'none' }}>
                <div style={{ flex: 1 }}>
                    <ul className="nav nav-tabs" id="myTab" role="tablist">
                        {STATUS_LIST_RESERVE.map((_tab, index) => {
                            let queryCountStatus = {};
                            const { title, status } = _tab;
                            const isActive = status == (params?.status || "");


                            switch (status) {
                                case 'done':
                                    queryCountStatus = { status: { _eq: 'processing' } }
                                    break;
                                case 'finished':
                                    queryCountStatus = { status: { _eq: status } }
                                    break;
                                case 'error':
                                    queryCountStatus = { total_error: { _gt: 0 }, status: { _eq: 'processing' } }
                                    break;
                                default:
                                    queryCountStatus = {}
                                    break;
                            }

                            return (
                                <>
                                    <li
                                        key={`tab-reserve-${index}`}
                                        className={clsx(`nav-item cursor-pointer`, { active: isActive })}
                                    >
                                        <span className={clsx(`nav-link font-weight-normal`, { active: isActive })}
                                            style={{ fontSize: "13px" }}
                                            onClick={() => {
                                                setIds([]);
                                                const queryParams = _.omit({ ...params, page: 1, status: status }, [""]);
                                                history.push(`${location.pathname}?${queryString.stringify({ ...queryParams })}`);
                                            }}
                                        >
                                            {title}
                                            <span className='ml-2'>
                                                (<ProductReserveCount whereCondition={{
                                                    ...whereConditionCount,
                                                    ...queryCountStatus
                                                }} />)
                                            </span>
                                        </span>
                                    </li>
                                </>
                            );
                        })}
                    </ul>
                </div>
            </div>

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
                    data={data?.warehouse_reserve_tickets || []}
                    emptyText={<div className='d-flex flex-column align-items-center justify-content-center my-10'>
                        <img src={toAbsoluteUrl("/media/empty.png")} alt="image" width={80} />
                        <span className='mt-4'>{formatMessage({ defaultMessage: 'Chưa có phiếu dự trữ' })}</span>
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
                count={data?.warehouse_reserve_tickets?.length}
                basePath={'/products/reserve'}
                isShowEmpty={false}
            />
        </Fragment>
    )
};

export default memo(ProductReserveTable);