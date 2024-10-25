import React, { useMemo, memo, Fragment, useState, useCallback } from "react";
import { useIntl } from "react-intl";
import { Card, CardBody, CardHeader, InputVertical, TextArea } from "../../../../../../_metronic/_partials/controls";
import { Accordion, useAccordionToggle } from 'react-bootstrap';
import { Field, useFormikContext } from "formik";
import { ReSelectVertical } from "../../../../../../_metronic/_partials/controls/forms/ReSelectVertical";
import { useOrderManualContext } from "../../OrderManualContext";
import { OPTIONS_CHANNEL } from "../../OrderManualHelper";
import makeAnimated from 'react-select/animated';
import dayjs from "dayjs";
import { useSelector } from "react-redux";
import mutate_coCheckRepOrderIdExist from "../../../../../../graphql/mutate_coCheckRepOrderIdExist";
import client from "../../../../../../apollo";
import DatePicker from "rsuite/DatePicker";
import { ReSelectConfirmVertical } from "../../../../../../_metronic/_partials/controls/forms/ReSelectConfirmVertical";
import { useLocation } from "react-router-dom";
const animatedComponents = makeAnimated();

export const queryCheckRepOrderIdExist = async (value) => {
    let { data } = await client.mutate({
        mutation: mutate_coCheckRepOrderIdExist,
        fetchPolicy: 'network-only',
        variables: {
            ref_id: value
        }
    })
    return data?.coCheckRepOrderIdExist?.count_exists > 0;
}

const InfoGeneral = ({ loading: loadingOrder = false }) => {
    const { formatMessage } = useIntl();
    const { optionsStore,optionsTypeOrderSale, optionsSmeWarehouse, type, setVariantsOrder, setSmeWarehouseSelected, variantsOrder } = useOrderManualContext();
    const { setFieldValue, values, errors, setValues } = useFormikContext();
    const user = useSelector((state) => state.auth.user);
    const [loading, setLoading] = useState(false);
    const location = useLocation()
    const disabledFutureDate = useCallback((date, selectDate, selectedDone, target) => {
        const now = dayjs(date).unix() + 60;
        const hourStartNow = dayjs().unix();

        if (now == hourStartNow && target == 'TOOLBAR_BUTTON_OK') return true;
        return now < hourStartNow;
    }, []);

    return (
        <div style={{ position: 'relative', opacity: loadingOrder ? 0.4 : 1 }}>
            {loadingOrder && <div style={{ position: 'absolute', top: '50%', left: '50%', zIndex: 99 }}>
                <span className="spinner spinner-primary" />
            </div>}
            <div className="row">
                <div className="col-6">
                    <Field
                        name="channel_step1"
                        component={ReSelectVertical}
                        isDisabled={location?.state?.isSale || values['related_order_id']}
                        style={{ marginBottom: 0 }}
                        onChanged={() => setFieldValue('store_step1', undefined)}
                        placeholder={formatMessage({ defaultMessage: 'Chọn kênh bán' })}
                        label={formatMessage({ defaultMessage: 'Kênh bán' })}
                        customFeedbackLabel={' '}
                        required
                        options={OPTIONS_CHANNEL}
                    />
                </div>
                <div className="col-6">
                    <Field
                        name="store_step1"
                        component={ReSelectVertical}
                        style={{ marginBottom: 0 }}
                        isDisabled={!values['channel_step1'] || location?.state?.isSale || values['related_order_id']}
                        placeholder={formatMessage({ defaultMessage: 'Chọn gian hàng' })}
                        label={formatMessage({ defaultMessage: 'Gian hàng' })}
                        customFeedbackLabel={' '}
                        required
                        components={animatedComponents}
                        options={optionsStore?.filter(store => store?.connector_channel_code == values?.channel_step1?.value)}
                        formatOptionLabel={(option, labelMeta) => {
                            return <div className='d-flex align-items-center'>
                                {!!option.logo && <img src={option.logo} style={{ width: 15, height: 15, marginRight: 8 }} />}
                                <span>{option.label}</span>
                            </div>
                        }}
                    />
                </div>
            </div>
            <div className="row mt-2">
                <div className="col-6">
                    <Field
                        name="sme_warehouse_step1"
                        isDisabled={location?.state?.isSale || values['related_order_id']}
                        component={ReSelectConfirmVertical}
                        style={{ marginBottom: 0 }}
                        placeholder={formatMessage({ defaultMessage: 'Chọn kho xử lý' })}
                        label={formatMessage({ defaultMessage: 'Kho xử lý' })}
                        isShowConfirm={variantsOrder?.length > 0}
                        onChanged={value => {
                            const warehouseFinded = optionsSmeWarehouse?.find(wh => wh?.value == value?.value);
                            setSmeWarehouseSelected(warehouseFinded);
                            setVariantsOrder([]);

                            const newValues = { ...values };
                            
                            Object.keys(newValues).forEach(key => {
                                if (key.startsWith('variant')) delete newValues[key]
                            });
                            setValues(newValues);
                        }}
                        customFeedbackLabel={' '}
                        isClearable={false}
                        components={animatedComponents}
                        options={optionsSmeWarehouse}
                        required
                    />
                </div>
                <div className="col-6">
                    <Field
                        name="person_charge_step1"
                        component={InputVertical}
                        placeholder={formatMessage({ defaultMessage: 'Nhập tên người phụ trách' })}
                        label={formatMessage({ defaultMessage: 'Người phụ trách' })}
                        customFeedbackLabel={' '}
                        countChar
                        maxChar={35}
                        maxLength={35}
                        disabled={true}
                    />
                </div>
            </div>
            <div className="row mt-2">
                <div className="col-6">
                    <label className="col-form-label">
                        <span>{formatMessage({ defaultMessage: 'Ngày đặt hàng' })}</span>
                        <span className="text-danger ml-1">*</span>
                    </label>
                    <DatePicker
                        className='date-reserve-options w-100'
                        format={"yyyy-MM-dd HH:mm"}
                        placeholder={formatMessage({ defaultMessage: 'Chọn ngày đặt hàng' })}
                        placement={"bottomStart"}
                        disabledDate={disabledFutureDate}
                        value={!!values[`order_at_step1`] ? new Date(values[`order_at_step1`] * 1000) : null}
                        onChange={value => {
                            setFieldValue('__changed__', true)
                            setFieldValue(`order_at_step1`, !!value ? dayjs(value).unix() : undefined)
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
                <div className="col-6" style={{ position: 'relative' }}>
                    <Field
                        name="order_code_step1"
                        component={InputVertical}
                        disabled={(type == 'edit' && !location?.state?.isSale)}
                        placeholder={formatMessage({ defaultMessage: 'Nhập mã đơn hàng' })}
                        label={formatMessage({ defaultMessage: 'Mã đơn hàng' })}
                        onChangeCapture={e => {
                            setFieldValue('order_code_boolean_step1', { order_code_step1: false })
                        }}
                        onBlurChange={async (value) => {
                            const valueErrorForm = errors?.['order_code_step1'];
                            if (!!valueErrorForm) return;

                            setLoading(true);
                            const checkExistRefOrderId = await queryCheckRepOrderIdExist(value);
                            setLoading(false);
                            if (checkExistRefOrderId) {
                                setFieldValue('order_code_boolean_step1', { order_code_step1: true })
                            } else {
                                setFieldValue('order_code_boolean_step1', { order_code_step1: false })
                            }
                        }}
                        loading={loading}
                        customFeedbackLabel={' '}
                        countChar
                        maxChar={20}
                        maxLength={20}
                        required
                    />
                    <a
                        href="#"
                        className="text-primary"
                        style={{ position: 'absolute', top: '0.8rem', right: '1.1rem', cursor: type == 'edit' && !location?.state?.isSale ? 'not-allowed' : 'pointer' }}
                        onClick={e => {
                            e.preventDefault();
                            if (type == 'edit' && !location?.state?.isSale) return;

                            setFieldValue('order_code_step1', `OR${user?.sme_id}${dayjs().unix()}`);
                        }}
                    >
                        {formatMessage({ defaultMessage: 'Tự động tạo' })}
                    </a>
                </div>
            </div>
            <div className="row mt-2">
                {(location?.state?.isSale || values['related_order_id']) && (
                    <div className="col-6">
                    <Field
                        name="type_order_sale"
                        component={ReSelectVertical}
                        style={{ marginBottom: 0 }}
                        placeholder={formatMessage({ defaultMessage: 'Chọn loại đơn sau bán' })}
                        label={formatMessage({ defaultMessage: 'Lý do' })}
                        customFeedbackLabel={' '}
                        isClearable={false}
                        components={animatedComponents}
                        options={optionsTypeOrderSale}
                    />
                    </div>
                )}
                <div className="col-6">
                    <Field
                        name={`note_step1`}
                        component={TextArea}
                        rows={3}
                        cols={['col-12', 'col-12']}
                        countChar
                        maxChar={500}
                        maxLength={500}
                        label={formatMessage({ defaultMessage: 'Ghi chú' })}
                        placeholder={formatMessage({ defaultMessage: 'Nhập ghi chú' })}
                        nameTxt={"--"}
                        customFeedbackLabel={' '}
                    />
                </div>
            </div>
        </div>
    )
};

export default memo(InfoGeneral);