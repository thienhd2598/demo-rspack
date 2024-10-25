import React, { memo, useMemo, useState } from 'react';
import { Card } from "../../../../../_metronic/_partials/controls";
import { useIntl } from 'react-intl';
import { filter } from 'lodash';
import query_scOrderHistory from '../../../../../graphql/query_scOrderHistory';
import dayjs from 'dayjs';
import clsx from 'clsx';
import { useQuery } from '@apollo/client';

const InfoHistory = ({ orderId, statusOrderDetail, orderDetail }) => {
    const { formatMessage } = useIntl();
    const [tabHistory, setTabHistory] = useState('order');
    const [shippingId, setShippingId] = useState();

    const TAB_SHIPPING_HISTORY = [
        { key: 'order', title: formatMessage({ defaultMessage: 'Đơn hàng' }) },
        { key: 'shipping', title: formatMessage({ defaultMessage: 'Vận chuyển' }) },
    ];

    const { data: orderHistory, loading: loadingOrderHistory } = useQuery(query_scOrderHistory, {
        variables: {
            order_id: orderId,
        },
        fetchPolicy: 'cache-and-network'
    });
    console.log('orderId', orderId)
    const dataHistoryOrder = useMemo(
        () => {
            if (!orderHistory && orderHistory?.scOrderHistory?.length == 0) return [];

            const filteredHistoryOrder = [
                ...filter(orderHistory?.scOrderHistory, _order => _order?.status === 'CREATED'),
                ...filter(orderHistory?.scOrderHistory, _order => _order?.status != 'CREATED')
            ];
            const sortedHistoryOrder = filteredHistoryOrder?.map(
                (_order, index) => {
                    let { status } = _order || {};
                    return {
                        ..._order,
                        status_name: statusOrderDetail[status],
                        isActiveBar: index == filteredHistoryOrder?.length - 1 ? true : false,
                        isActive: index == filteredHistoryOrder?.length - 1 ? true : false,
                    }
                }
            );


            return sortedHistoryOrder;
        }, [orderHistory]
    );

    const currentLogistic = useMemo(() => {
        return orderDetail?.findOrderDetail?.logisticsPackages?.find(pg => pg == shippingId) || orderDetail?.findOrderDetail?.logisticsPackages[0]
    }, [shippingId, orderDetail])

    return (
        <Card className="p-4" style={{ minHeight: 180 }}>
            {loadingOrderHistory && <span className="spinner spinner-primary mt-8"></span>}
            {!loadingOrderHistory && (
                <div>
                    <div className="pb-4" style={{ fontSize: 14, color: '#000' }}><strong>{formatMessage({ defaultMessage: 'Lịch sử' })}</strong></div>

                    <ul className="nav nav-tabs mb-4" id="myTab" role="tablist" >
                        {TAB_SHIPPING_HISTORY?.map((_status, index) => {
                            return (
                                <li
                                    key={`order-history-${index}`}
                                    className={clsx(`nav-item`, { active: tabHistory === _status?.key })}
                                >
                                    <a
                                        className={clsx(`nav-link font-weight-normal`, { active: tabHistory === _status?.key })}
                                        style={{ fontSize: '1.1rem', padding: 6 }}
                                        onClick={e => {
                                            e.preventDefault();
                                            setTabHistory(_status?.key)
                                        }}
                                    >
                                        {_status?.title}
                                    </a>
                                </li>
                            )
                        })}
                    </ul>

                    {tabHistory == 'order' && <div className='d-flex flex-column'>
                        <ul className='order-history-wrapper'>
                            {dataHistoryOrder?.map(_order => (
                                <li
                                    className={clsx('order-history', {
                                        active: _order?.isActive,
                                        activeBar: _order?.isActiveBar
                                    })}
                                >
                                    <div className='order-history-block d-flex flex-column gap-4'>
                                        <span className='order-history-title'>{_order?.event_name}</span>
                                        {!!_order?.updated_time && (
                                            <span className='order-history-time'>{dayjs.unix(_order?.updated_time).format('HH:mm:ss DD/MM/YYYY')}</span>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>}
                    
                    {tabHistory == 'shipping' && 
                    <div>
                        {orderDetail?.findOrderDetail?.logisticsPackages?.length > 1 && (
                            <div style={{overflowX: 'scroll'}}>
                                <div style={{width: 'max-content', display: 'flex'}}>
                                    {orderDetail?.findOrderDetail?.logisticsPackages?.map((pg, index) => (
                                        <div onClick={() => setShippingId(pg?.id)} style={{cursor: 'pointer', padding: '3px',marginLeft: '3px', color: 'white', borderRadius: '10px', background: (shippingId || orderDetail?.findOrderDetail?.logisticsPackages[0]?.id) == pg?.id ? '#ff5629' : 'gray'}}>
                                            <span>{formatMessage({defaultMessage: 'Kiện hàng: '})} {index + 1}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        <div className='d-flex flex-column'>
                        <ul className='order-history-wrapper mt-2'>
                            {currentLogistic?.logisticsTrackingInfo?.map((_shipping, index) => (
                                <li className={clsx('order-history', { active: index == orderDetail?.findOrderDetail?.logisticsPackages[0]?.logisticsTrackingInfo?.length - 1, activeBar: index == orderDetail?.findOrderDetail?.logisticsPackages[0]?.logisticsTrackingInfo?.length - 1})}>
                                    <div className='order-history-block d-flex flex-column gap-4'>
                                        <span className='order-history-title' dangerouslySetInnerHTML={{ __html: _shipping?.description }} ></span>
                                        {!!_shipping?.tracking_update_time && (
                                            <span className='order-history-time'>{dayjs.unix(_shipping?.tracking_update_time).format('HH:mm:ss DD/MM/YYYY')}</span>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                    </div>
                    }
                </div>

            )}
        </Card>
    )
};

export default memo(InfoHistory);