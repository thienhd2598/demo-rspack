import clsx from "clsx";
import React, { memo, useMemo, useState } from "react";
import { useIntl } from "react-intl";
import Table from 'rc-table';
import 'rc-table/assets/index.css';
import { toAbsoluteUrl } from "../../../../../_metronic/_helpers";
import { Checkbox } from "../../../../../_metronic/_partials/controls";
import Pagination from "../../../../../components/Pagination";
import dayjs from "dayjs";
import { useHistory, useLocation } from 'react-router-dom';
import { OPTIONS_TYPE_PICKUP, STATUS_PICKUP, TABS_STATUS_FULFILLMENT } from "../OrderFulfillmentHelper";
import queryString from 'querystring';
import AuthorizationWrapper from "../../../../../components/AuthorizationWrapper";
import { Dropdown, OverlayTrigger, Tooltip } from "react-bootstrap";
import { formatNumberToCurrency } from "../../../../../utils";

const OrderFulfillmentTable = ({ ids, setIds, loading, data, limit, page, error, params, dataSfCountSessionPick, optionsSubUser, setCurrentAction, onPackSessionPick, onPrintPickup }) => {
    const history = useHistory();
    const location = useLocation();
    const [isCopied, setIsCopied] = useState(false);
    const { formatMessage } = useIntl();

    const isSelectAll = ids.length > 0 && ids.filter(_id => {
        return data?.list_record?.some(item => item?.id === _id?.id);
    })?.length == data?.list_record?.length;

    const tabsOrderFulfillment = useMemo(() => {
        if (!dataSfCountSessionPick?.sfCountSessionPick) return TABS_STATUS_FULFILLMENT;
        const { total, total_new, total_picked, total_picking, total_ready, total_cancelled } = dataSfCountSessionPick?.sfCountSessionPick || {}

        return TABS_STATUS_FULFILLMENT?.map(tab => {
            let totalTabs = 0;
            if (!tab?.status) totalTabs = total;
            if (tab?.status == 1) totalTabs = total_new;
            if (tab?.status == 2) totalTabs = total_ready;
            if (tab?.status == 3) totalTabs = total_picking;
            if (tab?.status == 5) totalTabs = total_picked;
            if (tab?.status == 4) totalTabs = total_cancelled;

            return { ...tab, total: totalTabs }
        })
    }, [dataSfCountSessionPick, TABS_STATUS_FULFILLMENT]);

    const totalRecord = useMemo(() => {
        const findedTabActive = tabsOrderFulfillment?.find(tab => tab?.status == (params?.status || ''));
        return findedTabActive?.total;
    }, [tabsOrderFulfillment, params?.status]);

    const onCopyToClipBoard = async (text) => {
        await navigator.clipboard.writeText(text);
        setIsCopied(true);
        setTimeout(() => {
            setIsCopied(false);
        }, 1500)
    };

    const columns = [
        {
            title: <div className="d-flex align-items-center">
                {(params?.status == 1 || params?.status == 2) && <div className="mr-2">
                    <Checkbox
                        size="checkbox-md"
                        inputProps={{
                            'aria-label': 'checkbox',
                        }}
                        isSelected={isSelectAll}
                        onChange={e => {
                            if (isSelectAll) {
                                setIds(ids.filter(x => {
                                    return !data?.list_record?.some(ffm => ffm.id === x.id);
                                }))
                            } else {
                                const tempArray = [...ids];
                                (data?.list_record || []).forEach(ffm => {
                                    if (ffm && !ids.some(item => item.id === ffm.id)) {
                                        tempArray.push(ffm);
                                    }
                                })
                                setIds(tempArray)
                            }
                        }}
                    />
                </div>}
                <span>{formatMessage({ defaultMessage: 'Mã danh sách' })}</span>
            </div>,
            dataIndex: 'name',
            key: 'name',
            align: 'left',
            width: '13%',
            render: (_item, record) => {
                return <div className="d-flex align-items-center">
                    {(params?.status == 1 || params?.status == 2) && <Checkbox
                        size='checkbox-md'
                        className="mr-2"
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
                    />}
                    <span
                        className="cursor-pointer"
                        style={{ color: '#0962f3' }}
                        onClick={() => window.open(`/orders/fulfillment/${record?.id}`, '_blank')}
                    >
                        {record?.code}
                    </span>
                    <OverlayTrigger
                        overlay={
                            <Tooltip title='#1234443241434' style={{ color: 'red' }}>
                                <span>
                                    {isCopied ? `Copied!` : `Copy to clipboard`}
                                </span>
                            </Tooltip>
                        }
                    >
                        <span style={{ cursor: 'pointer' }} onClick={() => onCopyToClipBoard(record?.code)}
                            className='ml-2'><i style={{ fontSize: 12 }} className="far fa-copy text-info"></i></span>

                    </OverlayTrigger>
                </div>
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Số lượng kiện hàng' }),
            dataIndex: 'sku',
            key: 'sku',
            align: 'center',
            width: '10%',
            render: (_item, record) => {
                return <span>{record?.count_package}</span>
            }
        },
        // {
        //     title: formatMessage({ defaultMessage: 'Số lượng hàng hóa' }),
        //     dataIndex: 'sku',
        //     key: 'sku',
        //     align: 'center',
        //     width: '10%',
        //     render: (_item, record) => {
        //         return <span>{record?.total_purchased}</span>
        //     }
        // },
        {
            title: formatMessage({ defaultMessage: 'Loại danh sách' }),
            dataIndex: 'sku',
            key: 'sku',
            align: 'center',
            width: '10%',
            render: (_item, record) => {
                return <span>{OPTIONS_TYPE_PICKUP?.[record?.type]}</span>
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Trạng thái' }),
            dataIndex: 'sku',
            key: 'sku',
            align: 'center',
            width: '12%',
            render: (_item, record) => {
                let colorText = '#000';
                if (record?.status == 1) colorText = '#00DB6D';
                if (record?.status == 5) colorText = '#0D6EFD';
                if (record?.status == 4) colorText = '#F80D0D';

                return <div>
                    <span style={{ color: colorText }}>{STATUS_PICKUP?.[record?.status]}</span>
                    {record?.status == 3 && <span className="ml-2">({record?.total_packaged}/<span className="text-primary">{record?.count_package}</span>)</span>}
                </div>
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Nhân viên phụ trách' }),
            dataIndex: 'sku',
            key: 'sku',
            align: 'center',
            width: '10%',
            render: (_item, record) => {
                const subUser = optionsSubUser?.find(item => item?.value == record?.pic_id);

                return <span>{subUser?.username || ''}</span>
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Thời gian tạo' }),
            dataIndex: 'sku',
            key: 'sku',
            align: 'center',
            width: '10%',
            render: (_item, record) => {
                return <span>{dayjs(record?.created_at).format('DD/MM/YYYY HH:mm')}</span>
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Thao tác' }),
            dataIndex: 'sku',
            key: 'sku',
            align: 'center',
            width: '8%',
            render: (_item, record) => {
                return (
                    <AuthorizationWrapper keys={['order_session_pickup_actions']}>
                        <Dropdown drop='down' >
                            <Dropdown.Toggle className='btn-outline-secondary' >
                                {formatMessage({ defaultMessage: 'Chọn' })}
                            </Dropdown.Toggle>

                            <Dropdown.Menu>
                                <Dropdown.Item
                                    className="mb-1 d-flex"
                                    onClick={async e => {
                                        e.preventDefault();
                                        window.open(`/orders/fulfillment/${record?.id}`, '_blank');
                                    }}>
                                    {formatMessage({ defaultMessage: 'Xem chi tiết' })}
                                </Dropdown.Item>
                                {record?.status == 1 && <Dropdown.Item
                                    className="mb-1 d-flex"
                                    onClick={async e => {
                                        e.preventDefault();
                                        setCurrentAction({ id: record?.id, action: 'assign' })
                                    }}>
                                    {formatMessage({ defaultMessage: 'Phân công nhân viên' })}
                                </Dropdown.Item>}
                                {(record?.status == 2 || record?.status == 3 || record?.status == 5) && <Dropdown.Item
                                    className="mb-1 d-flex"
                                    onClick={async e => {
                                        e.preventDefault();
                                        onPrintPickup(record?.id, 1)
                                    }}>
                                    {formatMessage({ defaultMessage: 'In phiếu nhặt' })}
                                </Dropdown.Item>}
                                {(record?.status == 2 || record?.status == 3 || record?.status == 5) && <Dropdown.Item
                                    className="mb-1 d-flex"
                                    onClick={async e => {
                                        e.preventDefault();
                                        onPrintPickup(record?.id, 2)
                                    }}>
                                    {formatMessage({ defaultMessage: 'In phiếu xuất' })}
                                </Dropdown.Item>}
                                {(record?.status == 3 || record?.status == 5) && <Dropdown.Item
                                    className="mb-1 d-flex"
                                    onClick={async e => {
                                        e.preventDefault();
                                        onPrintPickup(record?.id, 4)
                                    }}>
                                    {formatMessage({ defaultMessage: 'In vận đơn' })}
                                </Dropdown.Item>}
                                {(record?.status == 1 || record?.status == 2) && <Dropdown.Item
                                    className="mb-1 d-flex"
                                    onClick={async e => {
                                        e.preventDefault();
                                        setCurrentAction({ id: record?.id, action: 'cancel' })
                                    }}>
                                    {formatMessage({ defaultMessage: 'Hủy' })}
                                </Dropdown.Item>}
                                {(record?.status == 2) && <Dropdown.Item
                                    className="mb-1 d-flex"
                                    onClick={async e => {
                                        e.preventDefault();
                                        onPackSessionPick(record?.id);
                                    }}>
                                    {formatMessage({ defaultMessage: 'Chuẩn bị hàng' })}
                                </Dropdown.Item>}
                            </Dropdown.Menu>
                        </Dropdown>
                    </AuthorizationWrapper>
                )
            }
        },
    ];

    return <div className="mt-8">
        <div className="mb-4 d-flex align-items-center">
            <span>{formatMessage({ defaultMessage: 'Tổng số lượng kiện hàng đã xử lý' })}</span>
            <OverlayTrigger
                overlay={
                    <Tooltip>
                        {formatMessage({ defaultMessage: 'Tổng số lượng kiện hàng đã xử lý được tính bằng tổng số lượng kiện hàng trong tất cả các danh sách đã tạo, ngoại trừ danh sách "Đã huỷ"' })}
                    </Tooltip>
                }
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" className="ml-1 bi bi-info-circle" viewBox="0 0 16 16">
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
                    <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0" />
                </svg>
            </OverlayTrigger>
            <span> : {formatNumberToCurrency(dataSfCountSessionPick?.sfCountSessionPick?.total_package ?? 0)}</span>
        </div>
        <div className='d-flex justify-content-between align-items-center mb-4' style={{ position: 'sticky', top: 45, background: '#fff', zIndex: 3 }}>
            {(params?.status == 1 || params?.status == 2) ? <div className='d-flex align-items-center' style={{ minHeight: 37.5 }}>
                <div className="mr-4 text-primary">
                    {formatMessage({ defaultMessage: 'Đã chọn: {count} danh sách' }, { count: ids?.length })}
                </div>
                <AuthorizationWrapper keys={['order_session_pickup_actions']}>
                    <Dropdown drop='down' style={{ zIndex: 10 }}>
                        <Dropdown.Toggle disabled={ids?.length == 0} className={` btn ${ids.length ? 'btn-primary' : 'btn-darkk'}`}>
                            {formatMessage({ defaultMessage: "Thao tác hàng loạt" })}
                        </Dropdown.Toggle>

                        <Dropdown.Menu>
                            {params?.status == 1 && <Dropdown.Item onClick={() => setCurrentAction({ action: 'assign' })} className="d-flex">
                                {formatMessage({ defaultMessage: "Phân công nhân viên" })}
                            </Dropdown.Item>}
                            {(params?.status == 2) && <Dropdown.Item onClick={() => onPackSessionPick()} className="d-flex">
                                {formatMessage({ defaultMessage: "Chuẩn bị hàng" })}
                            </Dropdown.Item>}
                            {(params?.status == 1 || params?.status == 2) && <Dropdown.Item onClick={() => setCurrentAction({ action: 'cancel' })} className="d-flex">
                                {formatMessage({ defaultMessage: "Hủy" })}
                            </Dropdown.Item>}
                        </Dropdown.Menu>
                    </Dropdown>
                </AuthorizationWrapper>
            </div> : <div></div>}
            <AuthorizationWrapper keys={['order_session_pickup_create']}>
                <button
                    className="btn btn-primary"
                    style={{ minWidth: 120 }}
                    onClick={() => history.push('/orders/fulfillment/create')}
                >
                    {formatMessage({ defaultMessage: 'Tạo danh sách' })}
                </button>
            </AuthorizationWrapper>
        </div>
        <div className="d-flex w-100" style={{ position: 'sticky', top: 83, background: '#fff', zIndex: 2, minHeight: 37.5 }}>
            <div style={{ flex: 1 }}>
                <ul className="nav nav-tabs">
                    {tabsOrderFulfillment?.map(tab => {
                        const isTabActive = tab.status == (params?.status || '');

                        return (
                            <li style={{ cursor: 'pointer' }} key={`tab-${tab?.status}`} onClick={() => {
                                setIds([]);
                                history.push(`${location.pathname}?${queryString.stringify({ ...params, page: 1, status: tab?.status })}`)
                            }
                            }>
                                <span className={`d-flex align-items-center nav-link ${isTabActive ? "active" : ""}`}>
                                    <span>{tab.title}</span>
                                    {!!tab?.status && <span className="ml-2">({tab.total})</span>}
                                </span>
                            </li>
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
                style={(loading) ? { opacity: 0.4 } : {}}
                className="upbase-table mb-4"
                columns={columns}
                data={data?.list_record || []}
                emptyText={<div className='d-flex flex-column align-items-center justify-content-center my-10'>
                    <img src={toAbsoluteUrl("/media/empty.png")} alt="image" width={80} />
                    <span className='mt-4'>{formatMessage({ defaultMessage: 'Chưa có danh sách xử lý đơn' })}</span>
                </div>}
                tableLayout="auto"
                sticky={{ offsetHeader: 118 }}
            />
            {!error && <Pagination
                page={page}
                totalPage={Math.ceil(totalRecord / limit)}
                loading={loading}
                limit={limit}
                totalRecord={totalRecord}
                count={data?.list_record?.length}
                basePath={'/orders/fulfillment/list'}
                isShowEmpty={false}
            />}
        </div>
    </div>
}

export default memo(OrderFulfillmentTable);