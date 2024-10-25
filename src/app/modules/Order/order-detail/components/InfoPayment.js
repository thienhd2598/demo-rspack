import React, { memo } from 'react';
import { Card } from "../../../../../_metronic/_partials/controls";
import { formatNumberToCurrency } from '../../../../../utils';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useIntl } from 'react-intl';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css'


const InfoPayment = ({ orderDetail, onCopyToClipBoard, isOrderManual, isCopied }) => {
    const { formatMessage } = useIntl();

    let { paid_price, promotion_platform_amount, promotion_seller_amount, payment_method,
        shipping_discount_platform_fee, shipping_discount_seller_fee, seller_transaction_fee, connector_channel_code,
        seller_discount_amount, platform_discount, buyer_transaction_fee, shipping_fee_discount_from_3pl, total_discount
    } = orderDetail?.findOrderDetail || {};

    let discount_sme = 0;
    if (connector_channel_code == 'shopee') {
        discount_sme = seller_discount_amount + platform_discount + promotion_seller_amount + promotion_platform_amount + shipping_discount_seller_fee + shipping_fee_discount_from_3pl;
    }
    if (connector_channel_code == 'lazada') {
        discount_sme = seller_discount_amount + platform_discount + promotion_seller_amount + promotion_platform_amount + shipping_discount_seller_fee + shipping_discount_platform_fee + shipping_fee_discount_from_3pl;
    }
    if (connector_channel_code == 'tiktok') {
        discount_sme = seller_discount_amount + platform_discount + shipping_discount_seller_fee + shipping_discount_platform_fee + shipping_fee_discount_from_3pl;
    }

    return (
        <Card className="py-4 px-4" style={{ minHeight: 180 }}>
            <div className='d-flex flex-column pb-4'>
                <strong style={{ fontSize: 14, color: '#000' }}>{formatMessage({ defaultMessage: 'Thông tin thanh toán' })}</strong>
            </div>
            <div className='row mb-4'>
                 {!orderDetail ? <div className='col-6'><Skeleton style={{width: 170, height: 30 ,borderRadius: 8}} count={1}/></div> : (
                <div className='col-6'>
                    <div className='d-flex flex-column'>
                        <span className='text-muted'>{formatMessage({ defaultMessage: 'Phương thức thanh toán' })}</span>
                        <span>{payment_method || 'No Data'}</span>
                    </div>
                </div>)}
                {isOrderManual && <div className='col-6'>
                    <div className='d-flex flex-column'>
                        <span className='text-muted'>{formatMessage({ defaultMessage: 'Mã giao dịch' })}</span>
                        {!!orderDetail?.findOrderDetail?.payment_transaction_code ? <OverlayTrigger
                            overlay={
                                <Tooltip title='#1234443241434' style={{ color: 'red' }}>
                                    <span>
                                        {isCopied ? `Copied!` : `Copy to clipboard`}
                                    </span>
                                </Tooltip>
                            }
                        >
                            <span
                                style={{ cursor: 'pointer' }}
                                onClick={() => onCopyToClipBoard(orderDetail?.findOrderDetail?.payment_transaction_code)}
                            >
                                {`${orderDetail?.findOrderDetail?.payment_transaction_code}`}
                                <span className='ml-2 mr-4'><i style={{ fontSize: 12 }} className="far fa-copy text-info"></i></span>
                            </span>
                        </OverlayTrigger> : '--'}
                    </div>
                </div>}
            </div>
            <div className='row'>
            {!orderDetail ? <div className='col-6'><Skeleton style={{width: 170, height: 30 ,borderRadius: 8}} count={1}/></div> : (
                <div className='col-6'>
                    <div className='d-flex flex-column'>
                        <span className='text-muted'>{formatMessage({ defaultMessage: 'Chiết khấu' })}</span>
                        <span>{formatNumberToCurrency(total_discount)} đ</span>
                    </div>
                </div>)}
                {!orderDetail ? <div className='col-6'><Skeleton style={{width: 170, height: 30 ,borderRadius: 8}} count={1}/></div> : (
                <div className='col-6'>
                    <div className='d-flex flex-column'>
                        <span className='text-muted'>{formatMessage({ defaultMessage: 'Tổng tiền đơn hàng' })}</span>
                        <span>{formatNumberToCurrency(paid_price)} đ</span>
                    </div>
                </div>)}
            </div>
        </Card>
    )
};

export default memo(InfoPayment);