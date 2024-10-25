import React, { Fragment, memo, useMemo } from "react";
import { useIntl } from "react-intl";
import Select from 'react-select';
import DateRangePicker from 'rsuite/DateRangePicker';
import { Card, InputVertical } from "../../../../_metronic/_partials/controls";
import { RadioGroup } from "../../../../_metronic/_partials/controls/forms/RadioGroup";
import { Field, useFormikContext } from "formik";
import { useVoucherContext } from "../contexts/VoucherContext";
import { OPTIONS_TYPE_DISCOUNT, OPTIONS_TYPE_LIMIT, OPTIONS_TYPE_VOUCHER } from "../Constants";
import { ReSelectVertical } from "../../../../_metronic/_partials/controls/forms/ReSelectVertical";

const ConfigVoucher = ({ isEdit = false, isActionView = false, loading = false, voucherDetail = null }) => {
    const { storeOptions, channelVoucher, paramsQuery } = useVoucherContext();
    const { formatMessage } = useIntl();
    const { setFieldValue, errors, touched, values } = useFormikContext();

    return (
        <Card style={{ position: 'relative', opacity: loading ? 0.4 : 1 }}>
            {loading && <div style={{ position: 'absolute', top: '50%', left: '50%', zIndex: 99 }}>
                <span className="spinner spinner-primary" />
            </div>}
            <div className="m-4">
                <div className="mb-8">
                    <strong className="fs-14" style={{ color: '#000' }}>
                        {formatMessage({ defaultMessage: 'THIẾT LẬP MÃ GIẢM GIÁ' })}
                    </strong>
                </div>
                {values?.channel == 'shopee' && <div className="row">
                    <div className="col-2">
                        <span>{formatMessage({ defaultMessage: 'Loại voucher' })}</span>
                        <span className="text-danger">*</span>
                    </div>
                    <div className='col-4 '>
                        <Field
                            name="typeVoucher"
                            component={RadioGroup}
                            curr
                            disabled={isActionView || (isEdit && values?.status == 2 && !!voucherDetail?.ref_id)}
                            customFeedbackLabel={' '}
                            options={OPTIONS_TYPE_VOUCHER}
                            onChangeOption={() => {
                                if (values[`typeVoucher`] == 1) {
                                    setFieldValue('typeDiscount', 2);
                                    setFieldValue('typeVoucher', 3);
                                } else {
                                    setFieldValue('typeVoucher', 1)
                                }
                            }}
                        />
                    </div>
                </div>}
                <div className="row">
                    <div className="col-2">
                        <span>{formatMessage({ defaultMessage: 'Loại giảm giá' })}</span>
                        <span className="text-danger">*</span>
                    </div>
                    <div className='col-4 '>
                        <Field
                            name="typeDiscount"
                            component={RadioGroup}
                            curr
                            disabled={values?.typeVoucher == 3 || isActionView || (isEdit && values?.text_status == 'Đang diễn ra' && !!voucherDetail?.ref_id) || (isEdit && values?.channel == 'shopee' && values?.status == 2 && !!voucherDetail?.ref_id)}
                            customFeedbackLabel={' '}
                            options={OPTIONS_TYPE_DISCOUNT}
                            onChangeOption={() => {
                                setFieldValue('discount_amount', null);
                                if (values[`typeDiscount`] == 1) {
                                    setFieldValue('typeDiscount', 2)
                                } else {
                                    setFieldValue('typeLimit', OPTIONS_TYPE_LIMIT[0])
                                    setFieldValue('max_discount_price', null);
                                    setFieldValue('typeDiscount', 1)
                                }
                            }}
                        />
                    </div>
                </div>
                {values?.typeDiscount == 2 && <div className="row mb-4 d-flex align-items-center">
                    <div className="col-2">
                        <span>{formatMessage({ defaultMessage: 'Mức giảm giá tối đa' })}</span>
                        <span className="text-danger">*</span>
                    </div>
                    <div className='col-3'>
                        <Field
                            name={`typeLimit`}
                            component={ReSelectVertical}
                            isDisabled={isActionView || (isEdit && values?.status == 2 && !!voucherDetail?.ref_id)}
                            options={OPTIONS_TYPE_LIMIT}
                            onChanged={() => {
                                setFieldValue('max_discount_price', null);
                            }}
                            isFormGroup={false}
                            isClearable={false}
                            placeholder=""
                        />
                    </div>
                    {values?.typeLimit?.value == 2 && <div className='col-2'>
                        <Field
                            name={`max_discount_price`}
                            component={InputVertical}
                            disabled={isActionView || (isEdit && values?.status == 2 && !!voucherDetail?.ref_id)}
                            type='number'
                            placeholder=""
                            style={{ padding: '0 10px' }}
                            addOnRight={'đ'}
                        />
                    </div>}
                </div>}
                <div className="row mb-4 d-flex align-items-center">
                    <div className="col-2">
                        <span>{formatMessage({ defaultMessage: 'Giảm giá' })}</span>
                        <span className="text-danger">*</span>
                    </div>
                    <div className='col-3 d-flex flex-column'>
                        <Field
                            name={`discount_amount`}
                            component={InputVertical}
                            disabled={isActionView || (isEdit && values?.text_status == 'Đang diễn ra' && !!voucherDetail?.ref_id)}
                            type='number'
                            placeholder=""
                            style={{ padding: '0 10px' }}
                            addOnRight={values?.typeVoucher == 3 ? '% hoàn xu' : (values?.typeDiscount == 2 ? '%' : 'đ')}
                        />
                        {values?.typeDiscount == 2 && values?.discount_amount <= 99 && values?.discount_amount >= 50 && <span className="mt-1" style={{ color: '#ffbf00' }}>
                            {formatMessage({ defaultMessage: 'Mức giảm lớn hơn {target}%' }, { target: 50 })}
                        </span>}
                    </div>
                    <div className="col-3 text-right">
                        <span>{formatMessage({ defaultMessage: 'Giá trị đơn hàng tối thiểu' })}</span>
                        <span className="text-danger">*</span>
                    </div>
                    <div className='col-3'>
                        <Field
                            name={`min_order_price`}
                            disabled={isActionView || (isEdit && values?.text_status == 'Đang diễn ra' && !!voucherDetail?.ref_id)}
                            component={InputVertical}
                            type='number'
                            min={1}
                            placeholder=""
                            style={{ padding: '0 10px' }}
                            addOnRight={'đ'}
                        />
                    </div>
                </div>
                <div className="row d-flex align-items-center">
                    <div className="col-2">
                        <span>{formatMessage({ defaultMessage: 'Tổng lượt sử dụng tối đa' })}</span>
                        <span className="text-danger">*</span>
                    </div>
                    <div className='col-3'>
                        <Field
                            name={`usage_quantity`}
                            component={InputVertical}
                            disabled={isActionView || (isEdit && values?.text_status == 'Sắp diễn ra' && !!voucherDetail?.ref_id)}
                            type='number'
                            placeholder=""
                            style={{ padding: '0 10px' }}
                        />
                    </div>
                    {values?.channel != 'shopee' && values?.type != 22 && (
                        <Fragment>
                            <div className="col-3 text-right">
                                <span>{formatMessage({ defaultMessage: 'Lượt sử dụng tối đa/ Người' })}</span>
                                <span className="text-danger">*</span>
                            </div>
                            <div className='col-3'>
                                <Field
                                    name={`limit_per_user`}
                                    component={InputVertical}
                                    disabled={isActionView || (isEdit && values?.text_status == 'Đang diễn ra' && !!voucherDetail?.ref_id)}
                                    type='number'
                                    placeholder=""
                                    style={{ padding: '0 10px' }}
                                />
                            </div>
                        </Fragment>
                    )}
                </div>
            </div>
        </Card>
    )
}

export default memo(ConfigVoucher);