import React, { Fragment, useMemo, useState, memo } from 'react'
import { useIntl } from 'react-intl'
import { useHistory, useLocation, Link } from "react-router-dom";
import queryString from "querystring";
import { useToasts } from 'react-toast-notifications';
import Table from 'rc-table';
import { Dropdown, OverlayTrigger, Tooltip } from "react-bootstrap";
import { useMutation, useQuery } from '@apollo/client';
import _, { omit } from 'lodash';
import clsx from 'clsx';
import { Checkbox } from '../../../../_metronic/_partials/controls';
import Pagination from '../../../../components/Pagination';
import { toAbsoluteUrl } from '../../../../_metronic/_helpers';
import dayjs from 'dayjs';
import { formatNumberToCurrency } from '../../../../utils';
import { STATUS_LIST_SCHEDULED_FRAME } from '../FrameImageHelper';
import InfoProduct from '../../../../components/InfoProduct';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css'
import HoverImage from '../../../../components/HoverImage';
import AuthorizationWrapper from '../../../../components/AuthorizationWrapper';

const ScheduledFrameTable = ({ ids, setIds, loading, data, optionsStore, page, limit, loadingFrameImg, dataFrame, loadingSummaryScheduledFrame, summaryScheduledFrame, onAction, onRetryScheduledFrame }) => {
    const location = useLocation();
    const history = useHistory();
    const params = queryString.parse(location.search.slice(1, 100000));
    const { formatMessage } = useIntl();

    const COUNT_SCHEDULED_FRAME = {
        1: summaryScheduledFrame['waiting'] ?? 0,
        2: summaryScheduledFrame['applying'] ?? 0,
        3: summaryScheduledFrame['finished'] ?? 0,
        4: summaryScheduledFrame['error'] ?? 0,
    };

    let totalRecord = COUNT_SCHEDULED_FRAME[+params?.status] ?? (summaryScheduledFrame['total'] ?? 0)
    let totalPage = Math.ceil(totalRecord / limit);

    const isSelectAll = ids.length > 0 && ids.filter(_id => {
        return data?.some(item => item?.id === _id?.id);
    })?.length == data?.length;

    const columns = [
        {
            title: <div className='d-flex align-items-center'>
                {!!params?.status && (
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
                                        return !data?.some(ticket => ticket.id === x.id);
                                    }))
                                } else {
                                    const tempArray = [...ids];
                                    (data || []).forEach(ticket => {
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
                <span>{formatMessage({ defaultMessage: 'Tên lịch' })}</span>
            </div>,
            dataIndex: 'name',
            key: 'name',
            width: '25%',
            align: 'left',
            render: (item, record) => {
                const store = optionsStore.find(st => st?.value == record?.store_id);

                return <div className='d-flex align-items-start'>
                    {!!params?.status && (
                        <div className='mr-1 mt-1'>
                            <Checkbox
                                size="checkbox-md"
                                inputProps={{
                                    'aria-label': 'checkbox',
                                }}
                                isSelected={ids.some(_id => _id?.id == record?.id)}
                                onChange={e => {
                                    if (ids.some((_id) => _id.id == record?.id)) {
                                        setIds(prev => prev.filter((_id) => _id.id != record?.id));
                                    } else {
                                        setIds(prev => prev.concat([record]));
                                    }
                                }}
                            />
                        </div>
                    )}
                    <div className='d-flex flex-column'>
                        <InfoProduct
                            name={record?.title}
                            isSingle
                            productOrder={true}
                            url={() => window.open(`/frame-image/scheduled-frame/${record?.id}`, "_blank")}
                        />
                        {!!store && <div className='mt-2 d-flex align-items-center'>
                            <img
                                style={{ width: 15, height: 15 }}
                                src={store?.logo}
                                className="mr-2"
                            />
                            <span>{store?.label}</span>
                        </div>}
                    </div>
                </div>
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Khung mẫu' }),
            dataIndex: 'frame_id',
            key: 'frame_id',
            align: 'left',
            width: '15%',
            render: (item, record) => {
                const frame = dataFrame?.find(fr => fr?.id == item);

                if (!frame) {
                    return formatMessage({ defaultMessage: 'Khung mẫu đã bị xóa' })
                }

                return <Fragment>
                    {loadingFrameImg && (
                        <div className='d-flex flex-column'>
                            <Skeleton
                                style={{
                                    width: 80, height: 80, marginRight: 4,
                                    borderRadius: 8, minWidth: 80
                                }}
                                count={1}
                            />
                            <div className='mt-2'>
                                <Skeleton
                                    style={{
                                        width: '80%', height: 10,
                                        borderRadius: 8, minWidth: '80%'
                                    }}
                                    count={1}
                                />
                            </div>
                        </div>
                    )}
                    {!loadingFrameImg && <div className='d-flex flex-column'>
                        <Link to={`/frame-image/editor/${frame?.id}`} target="_blank">
                            <HoverImage
                                styles={{ borderRadius: '4px', border: '1px solid #d9d9d9', cursor: 'pointer', marginRight: 10 }}
                                size={{ width: 320, height: 320 }}
                                defaultSize={{ width: 80, height: 80 }}
                                url={frame?.asset_url || ''}
                            />
                        </Link>
                        <div className='mt-2'>
                            <InfoProduct
                                name={frame?.name}
                                isSingle
                                productOrder={true}
                                url={() => window.open(`/frame-image/editor/${frame?.id}`, "_blank")}
                            />
                        </div>
                    </div>}
                </Fragment>
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Thời gian lập lịch' }),
            dataIndex: 'id',
            key: 'id',
            align: 'right',
            width: '25%',
            render: (item, record) => {
                return <div className='d-flex flex-column align-items-end'>
                    <div className='d-flex align-items-center mb-1'>
                        <span className='mr-1'>{formatMessage({ defaultMessage: 'Thời gian tạo' })}:</span>
                        <span>{dayjs(record?.created_at).format('HH:mm DD/MM/YYYY')}</span>
                    </div>
                    <div className='d-flex align-items-center mb-1'>
                        <span className='mr-1'>{formatMessage({ defaultMessage: 'Thời gian áp khung' })}:</span>
                        <span>{dayjs(record?.apply_from_time).format('HH:mm:ss DD/MM/YYYY')}</span>
                    </div>
                    <div className='d-flex align-items-center'>
                        <span className='mr-1'>{formatMessage({ defaultMessage: 'Thời gian gỡ khung' })}:</span>
                        <span>{dayjs(record?.apply_to_time).format('HH:mm:ss DD/MM/YYYY')}</span>
                    </div>
                </div>
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Số sản phẩm' }),
            dataIndex: 'count_product_success',
            key: 'count_product_success',
            align: 'center',
            width: '10%',
            render: (item, record) => {
                return <span>{formatNumberToCurrency(record?.count_product_success + record?.count_product_error)}</span>
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Trạng thái' }),
            dataIndex: 'status',
            key: 'status',
            align: 'center',
            width: '15%',
            render: (item, record) => {
                const isStatusProcessing = record?.status != 1;
                const statusScheduled = STATUS_LIST_SCHEDULED_FRAME.find(item => item?.status == record?.status);

                return <div className={`d-flex align-items-center ${isStatusProcessing ? 'justify-content-between' : 'justify-content-center'}`}>
                    <div className='py-1' style={{ background: statusScheduled?.color, borderRadius: 6, minWidth: isStatusProcessing ? '80%' : '100%' }}>
                        <span className='text-white'>
                            {statusScheduled?.title}
                        </span>
                    </div>
                    {isStatusProcessing && (
                        <>
                            {record?.count_product_error > 0 ? (
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
                    <AuthorizationWrapper keys={['frame_schedule_action']}>
                        <Dropdown drop='down' >
                            <Dropdown.Toggle className='btn-outline-secondary' >
                                {formatMessage({ defaultMessage: 'Chọn' })}
                            </Dropdown.Toggle>

                            <Dropdown.Menu>
                                <Dropdown.Item
                                    className="mb-1 d-flex"
                                    onClick={async e => {
                                        e.preventDefault();
                                        window.open(`/frame-image/scheduled-frame/${record?.id}`, '_blank');
                                    }}>
                                    {formatMessage({ defaultMessage: 'Xem chi tiết' })}
                                </Dropdown.Item>
                                {(record?.status == 3 || record?.status == 2) && record?.count_product_error > 0 && (
                                    <Dropdown.Item
                                        className="mb-1 d-flex"
                                        onClick={() => onRetryScheduledFrame(record?.id)}
                                    >
                                        {formatMessage({ defaultMessage: 'Thử lại' })}
                                    </Dropdown.Item>
                                )}
                                {(record?.status == 1 || record?.status == 2) && (
                                    <Dropdown.Item
                                        className="mb-1 d-flex"
                                        onClick={() => onAction(record?.id, record?.status == 1 ? 'finish' : 'finish-inprogress')}
                                    >
                                        {formatMessage({ defaultMessage: 'Kết thúc' })}
                                    </Dropdown.Item>
                                )}

                                <Dropdown.Item
                                    className="mb-1 d-flex"
                                    onClick={async e => {
                                        e.preventDefault();

                                        history.push({
                                            pathname: `/frame-image/scheduled-frame-create`,
                                            state: { scheduled: record }
                                        })
                                    }}
                                >
                                    {formatMessage({ defaultMessage: 'Sao chép lịch' })}
                                </Dropdown.Item>
                                {(record?.status == 1 || record?.status == 3) && record?.count_product_error == 0 && (
                                    <Dropdown.Item
                                        className="mb-1 d-flex"
                                        onClick={() => onAction(record?.id, record?.status == 1 ? 'delete' : 'delete-finish')}
                                    >
                                        {formatMessage({ defaultMessage: 'Xóa lịch' })}
                                    </Dropdown.Item>
                                )}
                            </Dropdown.Menu>
                        </Dropdown>
                    </AuthorizationWrapper>
                )
            }
        },
    ];

    return (
        <Fragment>
            <div className="d-flex w-100 mt-2" style={{ background: "#fff", zIndex: 1, borderBottom: 'none' }}>
                <div style={{ flex: 1 }}>
                    <ul className="nav nav-tabs" id="myTab" role="tablist">
                        {STATUS_LIST_SCHEDULED_FRAME.map((_tab, index) => {
                            const { title, status } = _tab;
                            const isActive = status == (params?.status || "");
                            const count = COUNT_SCHEDULED_FRAME[+status] ?? (summaryScheduledFrame['total'] ?? 0);

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
                                                ({loadingSummaryScheduledFrame ? '--' : count})
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
                    data={!loading ? (data || []) : []}
                    emptyText={<div className='d-flex flex-column align-items-center justify-content-center my-10'>
                        <img src={toAbsoluteUrl("/media/empty.png")} alt="image" width={80} />
                        <span className='mt-4'>{formatMessage({ defaultMessage: 'Chưa có danh sách áp khung' })}</span>
                    </div>}
                    tableLayout="auto"
                    sticky={{ offsetHeader: 45 }}
                />
            </div>
            <div style={{ marginLeft: -12.5, marginRight: -12.5 }}>
                <Pagination
                    page={page}
                    totalPage={totalPage}
                    loading={loading}
                    limit={limit}
                    totalRecord={totalRecord}
                    count={data?.length}
                    basePath={'/frame-image/scheduled-frame'}
                    isShowEmpty={false}
                />
            </div>
        </Fragment>
    )
};

export default memo(ScheduledFrameTable);