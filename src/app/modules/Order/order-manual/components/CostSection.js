import React, { useMemo, memo, useEffect } from "react";
import { useIntl } from "react-intl";
import { Card, CardBody, CardHeader } from "../../../../../_metronic/_partials/controls";
import { useOrderManualContext } from "../OrderManualContext";
import { formatNumberToCurrency } from "../../../../../utils";
import { toAbsoluteUrl } from "../../../../../_metronic/_helpers";
import { Field, useFormikContext } from "formik";
import { InputSelectAddons } from "../../../../../_metronic/_partials/controls/forms/InputSelectAddons";
const Sticky = require('sticky-js');

const CostSection = ({ loading = false }) => {
    const { formatMessage } = useIntl();
    const { variantsOrder, setVariantsOrder, step } = useOrderManualContext();
    const { values, setFieldValue } = useFormikContext();

    const [totalQuantityVariant, totalPriceVariant, totalDiscountVariant] = useMemo(() => {
        const totalQuantity = variantsOrder.reduce((result, variant) => {
            const variantQuantity = values[`variant_${variant?.variant?.id}_quantity_step1`] || 0;
            result += variantQuantity
            return result
        }, 0);

        const totalPrice = variantsOrder.reduce((result, variant) => {
            const [variantQuantity, variantPrice] = [
                values[`variant_${variant?.variant?.id}_quantity_step1`] || 0,
                values[`variant_${variant?.variant?.id}_price_step1`],
            ];
            result += (variantQuantity * variantPrice)
            return result
        }, 0);

        const totalDiscount = variantsOrder.reduce((result, variant) => {
            const [variantDiscountUnit, variantPrice, variantQuantity, variantDiscount] = [
                values[`variant_${variant?.variant?.id}_unit_step1`] || 0,
                values[`variant_${variant?.variant?.id}_price_step1`],
                values[`variant_${variant?.variant?.id}_quantity_step1`] || 1,
                values[`variant_${variant?.variant?.id}_discount_step1`] || 0,
            ]
            let discounts;
            if (variantDiscountUnit?.value) {
                discounts = variantQuantity * Math.round((variantDiscount * variantPrice) / 100)
            } else {
                discounts = variantQuantity * variantDiscount
            };
            result += discounts
            return result
        }, 0);

        return [totalQuantity, totalPrice, totalDiscount];
    }, [
        ...variantsOrder?.map(variant => values[`variant_${variant?.variant?.id}_quantity_step1`]),
        ...variantsOrder?.map(variant => values[`variant_${variant?.variant?.id}_price_step1`]),
        ...variantsOrder?.map(variant => values[`variant_${variant?.variant?.id}_discount_step1`]),
        ...variantsOrder?.map(variant => values[`variant_${variant?.variant?.id}_unit_step1`]),
        variantsOrder
    ]);



    return (
        <Card style={{ position: 'relative', opacity: loading ? 0.4 : 1 }}>
            {loading && <div style={{ position: 'absolute', top: '50%', left: '50%', zIndex: 99 }}>
                <span className="spinner spinner-primary" />
            </div>}
            <CardHeader
                className="ml-auto"
                title={formatMessage({ defaultMessage: 'Tổng chi phí' })}
            />
            <CardBody className="px-4 py-4">
                <div className="row">
                    <div className="col-7">
                        <span className="float-right">{formatMessage({ defaultMessage: 'Số lượng hàng hóa' })}:</span>
                    </div>
                    <div className="col-5">
                        <span style={{ wordBreak: 'break-all' }} className="float-right">{formatNumberToCurrency(totalQuantityVariant)}</span>
                    </div>
                </div>
                <div className="row mt-5">
                    <div className="col-7">
                        <span className="float-right">{formatMessage({ defaultMessage: 'Tổng tiền sản phẩm' })}:</span>
                    </div>
                    <div className="col-5">
                        <span style={{ wordBreak: 'break-all' }} className="float-right">{formatNumberToCurrency(totalPriceVariant)}đ</span>
                    </div>
                </div>
                <div className="row mt-5">
                    <div className="col-7">
                        <span className="float-right">{formatMessage({ defaultMessage: 'Tổng tiền chiết khấu' })}:</span>
                    </div>
                    <div className="col-5">
                        <span style={{ wordBreak: 'break-all' }} className="float-right">{formatNumberToCurrency(totalDiscountVariant + values[`promotion_seller_amount_step2`])}đ</span>
                    </div>
                </div>
                <div className="row mt-5">
                    <div className="col-7">
                        <span className="float-right text-secondary-custom">{formatMessage({ defaultMessage: 'Trợ giá sản phẩm' })}:</span>
                    </div>
                    <div className="col-5">
                        <span style={{ wordBreak: 'break-all' }} className="float-right">{formatNumberToCurrency(totalDiscountVariant)}đ</span>
                    </div>
                </div>
                <div className="row mt-5 d-flex align-items-center">
                    <div className="col-7">
                        <span className="float-right text-secondary-custom">{formatMessage({ defaultMessage: 'Mã giảm giá' })}:</span>
                    </div>
                    <div className="col-5">
                        <span className="float-right">
                            <Field
                                name={`promotion_seller_amount_step2`}
                                component={InputSelectAddons}
                                onChangeValue={() => {
                                    if (step == 1 || values?.typeDelivery == 1) return;
                                    setFieldValue('shipping_discount_seller_fee_step2', 0);
                                    setFieldValue('shipping_original_fee_logistic', 0);
                                    setFieldValue('service_logistic', null);
                                    setFieldValue('reCaculateFee', true);
                                }}
                                addOnRight="đ"
                                unitOptions={[]}
                                label={''}
                                required={false}
                                customFeedbackLabel={' '}
                            />
                        </span>
                    </div>
                </div>
                <div className="row mt-5">
                    <div className="col-7">
                        <span className="float-right">{formatMessage({ defaultMessage: 'Phí vận chuyển phải trả' })}:</span>
                    </div>
                    <div className="col-5">
                        <span className="float-right">
                            {formatNumberToCurrency((values['typeDelivery'] == 2 ?
                                (values['shipping_original_fee_logistic'] || 0) : (values[`shipping_original_fee_step2`] || 0))
                                - (values[`shipping_discount_seller_fee_step2`] || 0))}đ
                        </span>
                    </div>
                </div>
                <div className="row mt-5">
                    <div className="col-7">
                        <span className="float-right text-secondary-custom">{formatMessage({ defaultMessage: 'Phí vận chuyển thực tế' })}:</span>
                    </div>
                    <div className="col-5">
                        <span className="float-right">{`${formatNumberToCurrency(values['typeDelivery'] == 2 ? values['shipping_original_fee_logistic'] : values[`shipping_original_fee_step2`])}`}đ</span>
                    </div>
                </div>
                <div className="row mt-5 d-flex align-items-center">
                    <div className="col-7">
                        <span className="float-right text-secondary-custom">{formatMessage({ defaultMessage: 'Hỗ trợ vận chuyển' })}:</span>
                    </div>
                    <div className="col-5">
                        <span className="float-right">
                            {formatNumberToCurrency(values['shipping_discount_seller_fee_step2'] || 0)}đ
                        </span>
                    </div>
                </div>
                <div className="my-4" style={{ height: 1, border: '1px solid #ebedf3' }}></div>
                <div className="row mt-5">
                    <div className="col-7">
                        <span className="float-right">{formatMessage({ defaultMessage: 'Tổng tiền đơn hàng' })}:</span>
                    </div>
                    <div className="col-5">
                        <span style={{ wordBreak: 'break-all' }} className="float-right">
                            {formatNumberToCurrency(totalPriceVariant - (totalDiscountVariant + values[`promotion_seller_amount_step2`]) + ((values['typeDelivery'] == 2 ? (values['shipping_original_fee_logistic'] || 0) : (values[`shipping_original_fee_step2`] || 0)) - (values[`shipping_discount_seller_fee_step2`] || 0)))}đ
                        </span>
                    </div>
                </div>
            </CardBody>
        </Card>
    )
};

export default memo(CostSection);