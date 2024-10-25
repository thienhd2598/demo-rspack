import React, { Fragment, memo, useMemo } from 'react';
import { useIntl } from 'react-intl';
import { formatNumberToCurrency } from '../../../../../utils';
import { sum } from 'lodash';

const InfoCost = ({ dataOrderPackage, orderDetail }) => {
    const { formatMessage } = useIntl();
    const [totalQuantityVariant, totalPriceVariant, totalDiscountVariant] = useMemo(() => {
        const totalVariant = sum(dataOrderPackage?.map(order => sum(order?.data?.map(item => item?.quantity_purchased))))
        const totalPrice = sum(dataOrderPackage?.map(order => sum(order?.data?.map(item => item?.original_price))))
        const totalDiscount = sum(dataOrderPackage?.map(order => sum(order?.data?.map(item => item?.discount_seller_amount))))

        return [totalVariant, totalPrice, totalDiscount]
    }, [dataOrderPackage]);

    return (
        <Fragment>
            <div className='d-flex justify-content-end'>
                <strong className='text-right'>{formatMessage({ defaultMessage: 'Tổng chi phí' })}</strong>
            </div>
            <div className="my-4" style={{ height: 1, border: '1px solid #ebedf3' }}></div>
            <div className="row">
                <div className="col-7">
                    <span className="float-right">{formatMessage({ defaultMessage: 'Số lượng hàng hóa' })}:</span>
                </div>
                <div className="col-5">
                    <span className="float-right">{formatNumberToCurrency(totalQuantityVariant)}</span>
                </div>
            </div>
            <div className="row mt-5">
                <div className="col-7">
                    <span className="float-right">{formatMessage({ defaultMessage: 'Tổng tiền sản phẩm' })}:</span>
                </div>
                <div className="col-5">
                    {orderDetail?.source == 'manual'
                        ? <span className="float-right">{formatNumberToCurrency(totalPriceVariant)}đ</span>
                        : <span className="float-right">{formatNumberToCurrency(orderDetail?.original_price)}đ</span>}
                </div>
            </div>
            <div className="row mt-5">
                <div className="col-7">
                    <span className="float-right">{formatMessage({ defaultMessage: 'Tổng tiền chiết khấu' })}:</span>
                </div>
                <div className="col-5">
                    {orderDetail?.source == 'manual'
                        ? <span className="float-right">{formatNumberToCurrency(totalDiscountVariant + orderDetail?.promotion_seller_amount)}đ</span>
                        : <span className="float-right">{formatNumberToCurrency(orderDetail?.seller_discount_amount + orderDetail?.platform_discount + orderDetail?.promotion_seller_amount + orderDetail?.promotion_platform_amount)}đ</span>}
                </div>
            </div>
            <div className="row mt-5">
                <div className="col-7">
                    <span className="float-right text-secondary-custom">{formatMessage({ defaultMessage: 'Trợ giá sản phẩm' })}:</span>
                </div>
                <div className="col-5">
                    {orderDetail?.source == 'manual'
                        ? <span className="float-right">{formatNumberToCurrency(totalDiscountVariant)}đ</span>
                        : <span className="float-right">{formatNumberToCurrency(orderDetail?.seller_discount_amount + orderDetail?.platform_discount)}đ</span>}
                </div>
            </div>
            <div className="row mt-5 d-flex align-items-center">
                <div className="col-7">
                    <span className="float-right text-secondary-custom">{formatMessage({ defaultMessage: 'Mã giảm giá' })}:</span>
                </div>
                <div className="col-5">
                    {orderDetail?.source == 'manual'
                        ? <span className="float-right">{formatNumberToCurrency(orderDetail?.promotion_seller_amount)}đ</span>
                        : <span className="float-right">{formatNumberToCurrency(orderDetail?.promotion_seller_amount + orderDetail?.promotion_platform_amount)}đ</span>}
                </div>
            </div>
            <div className="row mt-5">
                <div className="col-7">
                    <span className="float-right">{formatMessage({ defaultMessage: 'Phí vận chuyển phải trả' })}:</span>
                </div>
                <div className="col-5">
                    {orderDetail?.source == 'manual'
                        ? <span className="float-right">{formatNumberToCurrency(orderDetail?.shipping_original_fee - orderDetail?.shipping_discount_seller_fee)}đ</span>
                        : <span className="float-right">{formatNumberToCurrency(orderDetail?.shipping_original_fee - (orderDetail?.shipping_discount_seller_fee + orderDetail?.shipping_discount_platform_fee + orderDetail?.shipping_fee_discount_from_3pl))}đ</span>}
                </div>
            </div>
            <div className="row mt-5">
                <div className="col-7">
                    <span className="float-right text-secondary-custom">{formatMessage({ defaultMessage: 'Phí vận chuyển thực tế' })}:</span>
                </div>
                <div className="col-5">
                    <span className="float-right">{formatNumberToCurrency(orderDetail?.shipping_original_fee)}đ</span>
                </div>
            </div>
            <div className="row mt-5 d-flex align-items-center">
                <div className="col-7">
                    <span className="float-right text-secondary-custom">{formatMessage({ defaultMessage: 'Hỗ trợ vận chuyển' })}:</span>
                </div>
                <div className="col-5">
                    {orderDetail?.source == 'manual' ? <span className="float-right">
                        {formatNumberToCurrency(orderDetail?.shipping_discount_seller_fee)}đ
                    </span> : <span className="float-right">
                        {formatNumberToCurrency(orderDetail?.shipping_discount_seller_fee + orderDetail?.shipping_discount_platform_fee + orderDetail?.shipping_fee_discount_from_3pl)}đ
                    </span>}
                </div>
            </div>
            <div className="my-4" style={{ height: 1, border: '1px solid #ebedf3' }}></div>
            <div className="row mt-5">
                <div className="col-7">
                    <span className="float-right">{formatMessage({ defaultMessage: 'Tổng tiền đơn hàng' })}:</span>
                </div>
                <div className="col-5">
                    <span className="float-right">
                        {formatNumberToCurrency(
                            (orderDetail?.source == 'manual' ? totalPriceVariant : orderDetail?.original_price)
                             - (orderDetail?.source == 'manual' ? (totalDiscountVariant + orderDetail?.promotion_seller_amount) : 
                             (orderDetail?.seller_discount_amount + orderDetail?.platform_discount + orderDetail?.promotion_seller_amount + 
                            orderDetail?.promotion_platform_amount)) + ((orderDetail?.shipping_original_fee || 0) - 
                            (orderDetail?.source == 'manual' ? orderDetail?.shipping_discount_seller_fee : 
                            (orderDetail?.shipping_discount_seller_fee + orderDetail?.shipping_discount_platform_fee + orderDetail?.shipping_fee_discount_from_3pl)))
                        )}đ
                    </span>
                </div>
            </div>
        </Fragment>
    )
};

export default memo(InfoCost);