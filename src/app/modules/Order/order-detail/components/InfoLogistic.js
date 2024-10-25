import React, { memo, useEffect, useMemo } from 'react';
import { Card } from "../../../../../_metronic/_partials/controls";
import { useIntl } from 'react-intl';
import dayjs from 'dayjs';
import { formatNumberToCurrency } from '../../../../../utils';
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { EYE_SVG } from '../Constant'
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css'

const InfoLogistic = ({ orderDetail, isOrderManual, deliveryMethods }) => {
    const { formatMessage } = useIntl();

    let { logisticsPackages, p_delivery_method, tts_expired, shipping_original_fee } = orderDetail?.findOrderDetail || {};

    const [viewDeliveryMethod, viewShippingFee, viewTtsExpired, viewShippingCarrier] = useMemo(() => {
        let viewDeliveryMethod = <span>{isOrderManual ? (logisticsPackages?.[0]?.shipping_type == 1 ? formatMessage({ defaultMessage: 'Tự vận chuyển' }) : formatMessage({ defaultMessage: 'Giao hàng bởi đơn vị vận chuyển' })) : (deliveryMethods[p_delivery_method] || '--')}</span>
        let viewShippingFee = <span>{formatNumberToCurrency(shipping_original_fee)} đ</span>
        let viewShippingCarrier = <div className='d-flex flex-column'>
        {logisticsPackages?.map(_logistic => (
            <span key={`logisctic-orderdetail-${_logistic?.id}`}>
                {_logistic?.shipping_carrier || '--'}
            </span>
        ))}
    </div>
        let viewTtsExpired = <span>{tts_expired ? dayjs(tts_expired * 1000).format('DD/MM/YYYY HH:mm') : '--'}</span>
        if(logisticsPackages?.length > 1) {
            viewDeliveryMethod = <div className='d-flex align-items-center'>
              <span className='mr-2'>{logisticsPackages?.length} kiện</span>
              <OverlayTrigger id={`tooltip-right`} placement='right' overlay={
                <Tooltip title='#1234443241434' style={{ color: 'red' }}>
                  <span>
                    {logisticsPackages?.map((pack, index) => (
                        <div>Kiện {index + 1}: {deliveryMethods[pack?.order?.p_delivery_method]}</div>
                    ))}
                  </span>
                </Tooltip>
              }
              >
                {EYE_SVG}
              </OverlayTrigger>
            </div>

            viewShippingFee = <div className='d-flex align-items-center'>
              <span className='mr-2'>{logisticsPackages?.length} kiện</span>
              <OverlayTrigger id={`tooltip-right`} placement='right' overlay={
                <Tooltip title='#1234443241434' style={{ color: 'red' }}>
                  <span>
                    {logisticsPackages?.map((pack, index) => (
                        <div>Kiện {index + 1}: {formatNumberToCurrency(pack?.order?.shipping_original_fee)} đ</div>
                    ))}
                  </span>
                </Tooltip>
              }
              >
                {EYE_SVG}
              </OverlayTrigger>
            </div>

            viewTtsExpired = <div className='d-flex align-items-center'>
            <span className='mr-2'>{logisticsPackages?.length} kiện</span>
            <OverlayTrigger id={`tooltip-right`} placement='right' overlay={
                <Tooltip title='#1234443241434' style={{ color: 'red' }}>
                <span>
                    {logisticsPackages?.map((pack, index) => (
                        <div>Kiện {index + 1}: {pack?.order?.tts_expired ? dayjs(pack?.order?.tts_expired * 1000).format('DD/MM/YYYY HH:mm') : '--'}</div>
                    ))}
                </span>
                </Tooltip>
            }
            >
                {EYE_SVG}
            </OverlayTrigger>
            </div>

            viewShippingCarrier = <div className='d-flex align-items-center'>
                <span className='mr-2'>{logisticsPackages?.length} kiện</span>
                <OverlayTrigger OverlayTriggerid={`tooltip-right`} placement='right' overlay={
                    <Tooltip contentStyle={{ backgroundColor: '#4A4A4A' }} title='#1234443241434' style={{ color: 'red', }}>
                        {logisticsPackages?.map((pack, index) => (
                           <div>Kiện {index + 1}: <span>{pack?.shipping_carrier || '--'}</span></div>
                        ))}
                    </Tooltip>
                }
                >
                    {EYE_SVG}
                </OverlayTrigger>
                </div>
            
        }
        return [viewDeliveryMethod, viewShippingFee, viewTtsExpired, viewShippingCarrier]
    }, [orderDetail])



    return (
        <Card className="py-4 px-4" style={{ minHeight: 180 }}>
            <div className='d-flex flex-column pb-4'>
                <strong style={{ fontSize: 14, color: '#000' }}>{formatMessage({ defaultMessage: 'Thông tin vận chuyển' })}</strong>
            </div>
            <div className='row pb-4'>
                {!orderDetail ? (
                    <div className='col-6'><Skeleton style={{width: 170, height: 30 ,borderRadius: 8}} count={1}/></div>
                ) : (
                <div className='col-6'>
                    <div className='d-flex flex-column'>
                        <span className='text-muted'>{formatMessage({ defaultMessage: 'Hình thức vận chuyển' })}</span>
                        {viewDeliveryMethod}
                    </div>
                </div>
                )}
                {!orderDetail ? ( <div className='col-6'><Skeleton style={{width: 170, height: 30 ,borderRadius: 8}} count={1}/></div>) : (
                <div className='col-6'>
                    <div className='d-flex flex-column'>
                        <span className='text-muted'>{formatMessage({ defaultMessage: 'Phí vận chuyển' })}</span>
                        {viewShippingFee}
                    </div>
                </div>)
                }
            </div>
            <div className='row pb-4'>
                {!orderDetail ? ( <div className='col-6'><Skeleton style={{width: 170, height: 30 ,borderRadius: 8}} count={1}/></div>) : (
                <div className='col-6'>
                    <div className='d-flex flex-column'>
                        <span className='text-muted'>{formatMessage({ defaultMessage: 'Đơn vị vận chuyển' })}</span>
                        {viewShippingCarrier}
                    </div>
                </div>)}
                {!orderDetail ? (<div className='col-6'><Skeleton style={{width: 170, height: 30 ,borderRadius: 8}} count={1}/></div>) : (
                <div className='col-6'>
                    <div className='d-flex flex-column'>
                        <span className='text-muted'>{formatMessage({ defaultMessage: 'Giao trước' })}</span>
                        {viewTtsExpired}
                    </div>
                </div>)}
            </div>
        </Card>
    )
};

export default memo(InfoLogistic);