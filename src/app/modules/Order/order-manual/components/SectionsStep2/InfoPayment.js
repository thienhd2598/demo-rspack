import React, { useMemo, memo, Fragment, useState, useCallback } from "react";
import { useIntl } from "react-intl";
import { Card, CardBody, CardHeader, InputVertical, TextArea } from "../../../../../../_metronic/_partials/controls";
import { Accordion, useAccordionToggle } from 'react-bootstrap';
import { Field, useFormikContext } from "formik";
import { ReSelectVertical } from "../../../../../../_metronic/_partials/controls/forms/ReSelectVertical";
import { OPTIONS_PAYMENT_METHOD } from '../../OrderManualHelper';
import DatePicker from "rsuite/DatePicker";
import dayjs from "dayjs";
import {useLocation} from 'react-router-dom'

const InfoPayment = () => {
    const { formatMessage } = useIntl();
    const location = useLocation()
    const { values, setFieldValue } = useFormikContext();
    console.log('values', values)
    const disabledFutureDate = useCallback((date, selectDate, selectedDone, target) => {
        const now = dayjs(date).unix() + 60;
        const hourStartNow = values?.[`order_at_step1`];

        if (now == hourStartNow && target == 'TOOLBAR_BUTTON_OK') return true;
        return now < hourStartNow;
    }, [values?.[`order_at_step1`]]);

    return (
        <Fragment>
            <div className="row mt-2 mb-4">
                <div className="col-6">
                    <Field
                        name="payment_method_step2"
                        component={ReSelectVertical}
                        style={{ marginBottom: 0 }}
                        required
                        placeholder={formatMessage({ defaultMessage: 'Chọn phương thức thanh toán' })}
                        label={formatMessage({ defaultMessage: 'Phương thức thanh toán' })}
                        customFeedbackLabel={' '}
                        options={OPTIONS_PAYMENT_METHOD}
                        cleanable={false}
                    />
                </div>
                {values[`payment_method_step2`]?.value != OPTIONS_PAYMENT_METHOD[0].value && (
                    <div className="col-6">
                        <label className="col-form-label">{formatMessage({ defaultMessage: 'Thời gian thanh toán' })}</label>
                        <DatePicker
                            className='date-reserve-options w-100'
                            format={"yyyy-MM-dd HH:mm"}
                            placeholder={formatMessage({ defaultMessage: 'Chọn thời gian thanh toán' })}
                            placement={"bottomStart"}
                            disabledDate={disabledFutureDate}
                            value={!!values[`paid_at_step2`] ? new Date(values[`paid_at_step2`] * 1000) : null}
                            onChange={value => {
                                setFieldValue('__changed__', true)
                                setFieldValue(`paid_at_step2`, !!value ? dayjs(value).unix() : undefined)
                            }}
                            locale={{
                                sunday: "CN",
                                monday: "T2",
                                tuesday: "T3",
                                wednesday: "T4",
                                thursday: "T5",
                                friday: "T6",
                                saturday: "T7",
                                ok: formatMessage({ defaultMessage: "Đồng ý" }),
                                today: formatMessage({ defaultMessage: "Hôm nay" }),
                                yesterday: formatMessage({ defaultMessage: "Hôm qua" }),
                                hours: formatMessage({ defaultMessage: "Giờ" }),
                                minutes: formatMessage({ defaultMessage: "Phút" }),
                                seconds: formatMessage({ defaultMessage: "Giây" }),
                                formattedMonthPattern: "MM/yyyy",
                                formattedDayPattern: "dd/MM/yyyy",
                                last7Days: formatMessage({ defaultMessage: "7 ngày qua" }),
                            }}
                        />
                    </div>
                )}
            </div>
            {values[`payment_method_step2`]?.value != OPTIONS_PAYMENT_METHOD[0].value && (
                <div className="row mt-2">
                    <div className="col-6">
                        <Field
                            name="payment_transaction_code_step2"
                            component={InputVertical}
                            placeholder={formatMessage({ defaultMessage: 'Nhập mã giao dịch' })}
                            label={formatMessage({ defaultMessage: 'Mã giao dịch' })}
                            customFeedbackLabel={' '}
                            countChar
                            maxChar={20}
                            maxLength={20}
                        />
                    </div>
                </div>
            )}
        </Fragment>
    )
};

export default memo(InfoPayment);