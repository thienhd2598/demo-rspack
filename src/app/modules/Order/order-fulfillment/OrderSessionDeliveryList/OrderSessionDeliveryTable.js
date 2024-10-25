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
import { OPTIONS_TYPE_PICKUP, STATUS_SESSION_DELIVERY, TABS_STATUS_SESSION_DELIVERY } from "../OrderFulfillmentHelper";
import queryString from 'querystring';
import AuthorizationWrapper from "../../../../../components/AuthorizationWrapper";
import { Dropdown, OverlayTrigger, Tooltip } from "react-bootstrap";
import { shallowEqual, useSelector } from "react-redux";

const OrderSessionDeliveryTable = ({ ids, setIds, loading, data, limit, page, error, params, dataSfCountSessionHandover, setCurrentAction, onPrintHandover }) => {
    const history = useHistory();
    const location = useLocation();
    const [isCopied, setIsCopied] = useState(false);
    const { formatMessage } = useIntl();
    const user = useSelector((state) => state.auth.user, shallowEqual);

    const isSelectAll = ids.length > 0 && ids.filter(_id => {
        return data?.list_record?.some(item => item?.id === _id?.id);
    })?.length == data?.list_record?.length;

    const tabsOrderFulfillment = useMemo(() => {
        if (!dataSfCountSessionHandover?.sfCountSessionHandover) return TABS_STATUS_SESSION_DELIVERY;
        const { total, total_new, total_completed, total_cancelled } = dataSfCountSessionHandover?.sfCountSessionHandover || {}

        return TABS_STATUS_SESSION_DELIVERY?.map(tab => {
            let totalTabs = 0;
            if (!tab?.status) totalTabs = total;
            if (tab?.status == 1) totalTabs = total_new;
            if (tab?.status == 3) totalTabs = total_completed;
            if (tab?.status == 2) totalTabs = total_cancelled;

            return { ...tab, total: totalTabs }
        })
    }, [dataSfCountSessionHandover, TABS_STATUS_SESSION_DELIVERY]);

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
                {(params?.status == 1 || params?.status == 3) && <div className="mr-2">
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
                <span>{formatMessage({ defaultMessage: 'Mã phiên' })}</span>
            </div>,
            dataIndex: 'name',
            key: 'name',
            align: 'left',
            width: '15%',
            render: (_item, record) => {
                return <div className="d-flex align-items-center">
                    {(params?.status == 1 || params?.status == 3) && <Checkbox
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
                        onClick={() => window.open(`/orders/session-delivery/${record?.id}`, '_blank')}
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
                return <span>{record?.count_package || 0}</span>
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Vận chuyển' }),
            dataIndex: 'sku',
            key: 'sku',
            align: 'center',
            width: '10%',
            render: (_item, record) => {
                return <span>{record?.shipping_carrier || '--'}</span>
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Trạng thái' }),
            dataIndex: 'sku',
            key: 'sku',
            align: 'center',
            width: '10%',
            render: (_item, record) => {
                let colorText = '#000';
                if (record?.status == 1) colorText = '#00DB6D';
                if (record?.status == 3) colorText = '#0D6EFD';
                if (record?.status == 2) colorText = '#F80D0D';

                return <span style={{ color: colorText }}>{STATUS_SESSION_DELIVERY?.[record?.status]}</span>
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
            title: formatMessage({ defaultMessage: 'Thời gian bàn giao' }),
            dataIndex: 'sku',
            key: 'sku',
            align: 'center',
            width: '10%',
            render: (_item, record) => {
                return <span>{!!record?.handover_at ? dayjs(record?.handover_at).format('DD/MM/YYYY HH:mm') : '--'}</span>
            }
        },
        {
            title: formatMessage({ defaultMessage: 'ĐVVC nhận hàng' }),
            dataIndex: 'sku',
            key: 'sku',
            align: 'center',
            width: '10%',
            render: (_item, record) => {
                if (record?.status != 3) return '--';

                return <div className="d-flex justify-content-center align-items-center">
                    <span>{record?.count_package_valid || 0}</span>
                    <span className="mx-1">/</span>
                    <span className="text-danger">{record?.count_package || 0}</span>
                </div>
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
                    <AuthorizationWrapper keys={['order_session_handover_actions']}>
                        <Dropdown drop='down' >
                            <Dropdown.Toggle className='btn-outline-secondary' >
                                {formatMessage({ defaultMessage: 'Chọn' })}
                            </Dropdown.Toggle>

                            <Dropdown.Menu>
                                <Dropdown.Item
                                    className="mb-1 d-flex"
                                    onClick={async e => {
                                        e.preventDefault();
                                        window.open(`/orders/session-delivery/${record?.id}`, '_blank');
                                    }}>
                                    {formatMessage({ defaultMessage: 'Xem chi tiết' })}
                                </Dropdown.Item>
                                {(record?.status == 1 || record?.status == 3) && <Dropdown.Item
                                    className="mb-1 d-flex"
                                    onClick={async e => {
                                        e.preventDefault();
                                        onPrintHandover(record?.id)
                                    }}>
                                    {formatMessage({ defaultMessage: 'In biên bản' })}
                                </Dropdown.Item>}
                                {record?.status == 1 && <Dropdown.Item
                                    className="mb-1 d-flex"
                                    onClick={async e => {
                                        e.preventDefault();
                                        setCurrentAction({ id: record?.id, action: 'complete' })
                                    }}>
                                    {formatMessage({ defaultMessage: 'Bàn giao' })}
                                </Dropdown.Item>}
                                {record?.status == 1 && <Dropdown.Item
                                    className="mb-1 d-flex"
                                    onClick={async e => {
                                        e.preventDefault();
                                        setCurrentAction({ id: record?.id, action: 'cancel' })
                                    }}>
                                    {formatMessage({ defaultMessage: 'Hủy' })}
                                </Dropdown.Item>}
                            </Dropdown.Menu>
                        </Dropdown>
                    </AuthorizationWrapper>
                )
            }
        },
    ];

    return <div className="mt-8">
        <div className='d-flex justify-content-between align-items-center mb-4' style={{ position: 'sticky', top: 45, background: '#fff', zIndex: 3, minHeight: 37.5 }}>
            {(params?.status == 1 || params?.status == 3) ? <div className='d-flex align-items-center' style={{ minHeight: 37.5 }}>
                <div className="mr-4 text-primary">
                    {formatMessage({ defaultMessage: 'Đã chọn: {count} phiên' }, { count: ids?.length })}
                </div>
                <AuthorizationWrapper keys={['order_session_handover_actions']}>
                    <Dropdown drop='down' style={{ zIndex: 10 }}>
                        <Dropdown.Toggle disabled={ids?.length == 0} className={` btn ${ids.length ? 'btn-primary' : 'btn-darkk'}`}>
                            {formatMessage({ defaultMessage: "Thao tác hàng loạt" })}
                        </Dropdown.Toggle>

                        <Dropdown.Menu>
                            {(params?.status == 1 || params?.status == 3) && <Dropdown.Item onClick={() => onPrintHandover()} className="d-flex">
                                {formatMessage({ defaultMessage: "In biên bản" })}
                            </Dropdown.Item>}
                            {params?.status == 1 && <Dropdown.Item onClick={() => setCurrentAction({ action: 'complete' })} className="d-flex">
                                {formatMessage({ defaultMessage: "Bàn giao" })}
                            </Dropdown.Item>}
                            {params?.status == 1 && <Dropdown.Item onClick={() => setCurrentAction({ action: 'cancel' })} className="d-flex">
                                {formatMessage({ defaultMessage: "Hủy" })}
                            </Dropdown.Item>}
                        </Dropdown.Menu>
                    </Dropdown>
                </AuthorizationWrapper>
            </div> : <div></div>}
            <AuthorizationWrapper keys={['order_session_handover_create']}>
                <button
                    className="btn btn-primary"
                    style={{ minWidth: 120 }}
                    onClick={() => history.push('/orders/session-delivery/create')}
                >
                    {formatMessage({ defaultMessage: 'Tạo phiên' })}
                </button>
            </AuthorizationWrapper>
        </div>
        <div className="d-flex w-100" style={{ position: 'sticky', top: 83, background: '#fff', zIndex: 2 }}>
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
                    <span className='mt-4'>{formatMessage({ defaultMessage: 'Chưa có phiên giao' })}</span>
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
                basePath={'/orders/session-received/list'}
                isShowEmpty={false}
            />}
        </div>
    </div>
}

export default memo(OrderSessionDeliveryTable);