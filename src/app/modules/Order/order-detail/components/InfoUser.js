import React, { memo, useMemo } from 'react';
import { Card } from "../../../../../_metronic/_partials/controls";
import { useIntl } from 'react-intl';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css'

const InfoUser = ({ orderDetail }) => {
    const { formatMessage } = useIntl();

    let { full_name, phone, full_address, district, state } = orderDetail?.findOrderDetail?.customerRecipientAddress || {};

    const address = useMemo(() => {
        let addressFull = full_address;

        return addressFull
    }, [full_address]);

    return (
        <Card className="py-4 px-4" style={{ minHeight: 180 }}>
            <div className='d-flex flex-column pb-4'>
                <strong style={{ fontSize: 14, color: '#000' }}>{formatMessage({ defaultMessage: 'Thông tin người nhận hàng' })}</strong>
            </div>
            <div className='row pb-4'>
                {!orderDetail ? <div className='col-6'><Skeleton style={{width: 170, height: 30 ,borderRadius: 8}} count={1}/></div> : (
                    <div className='col-6'>
                    <div className='d-flex flex-column'>
                        <span className='text-muted'>{formatMessage({ defaultMessage: 'Tên khách hàng' })}</span>
                        <span>{full_name}</span>
                    </div>
                    </div>
                )}
               {!orderDetail ? <div className='col-6'><Skeleton style={{width: 170, height: 30 ,borderRadius: 8}} count={1}/></div> : (
                <div className='col-6'>
                    <div className='d-flex flex-column'>
                        <span className='text-muted'>{formatMessage({ defaultMessage: 'Số điện thoại' })}</span>
                        <span>{phone}</span>
                    </div>
                </div>)}
            </div>
            {!orderDetail ? <div><Skeleton style={{width: 300, height: 50 ,borderRadius: 8}} count={1}/></div> : (
            <div className='d-flex flex-column'>
                <span className='text-muted'>{formatMessage({ defaultMessage: 'Địa chỉ' })}</span>
                <span>{address}</span>                
            </div>)}
        </Card>
    )
};

export default memo(InfoUser);