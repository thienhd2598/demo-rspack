import React, { useMemo, memo, Fragment, useState, useRef, useCallback, useEffect } from "react";
import { useIntl } from "react-intl";
import { Card, CardBody, CardHeader, InputVertical, TextArea } from "../../../../../../_metronic/_partials/controls";
import { Accordion, OverlayTrigger, Tooltip, useAccordionToggle } from 'react-bootstrap';
import { Field, useFormikContext } from "formik";
import { ReSelectVertical } from "../../../../../../_metronic/_partials/controls/forms/ReSelectVertical";
import { useOrderManualContext } from "../../OrderManualContext";
import { useSelector } from "react-redux";
import { useToasts } from "react-toast-notifications";
import axios from "axios";
import { saveAs } from "file-saver";
import DatePicker from "rsuite/DatePicker";
import dayjs from "dayjs";
import { InputSelectAddons } from "../../../../../../_metronic/_partials/controls/forms/InputSelectAddons";
import { RadioGroup } from "../../../../../../_metronic/_partials/controls/forms/RadioGroup";
import { OPTIONS_LOGISTIC_PICKUP, OPTIONS_TYPE_DELIVERY } from "../../OrderManualHelper";
import _, { sum } from "lodash";
import mutate_coCheckLogisticFee from '../../../../../../graphql/mutate_coCheckLogisticFee'
import { TooltipWrapper } from "../../../../Finance/payment-reconciliation/common/TooltipWrapper";
import client from "../../../../../../apollo";
import LogisticFee from "../LogisticFee";
import { useHistory } from 'react-router-dom'
import { useMutation } from "@apollo/client";
import mutate_coGetLogisticServices from "../../../../../../graphql/mutate_coGetLogisticServices";
import { formatNumberToCurrency } from "../../../../../../utils";
const CancelToken = axios.CancelToken;


const InfoTransport = () => {
    const { formatMessage } = useIntl();
    const refInputFile = useRef();
    const refCancel = useRef();
    const { addToast } = useToasts();
    const user = useSelector((state) => state.auth.user);
    const { setFieldValue, values } = useFormikContext();
    const {
        optionsFeeBearer, deliverys, setTypeDelyvery, optionsRuleCheck, optionsShippingUnit,
        variantsOrder, loadingUploadFile, logistics, setLogistics, setLoadingUploadFile
    } = useOrderManualContext();
    const history = useHistory()

    const [getLogisticServices, { loading: loadingCheckLogisticFee }] = useMutation(mutate_coGetLogisticServices);

    const disabledFutureDate = useCallback((date, selectDate, selectedDone, target) => {
        const now = dayjs(date).unix() + 60;
        const hourStartNow = values?.[`order_at_step1`];

        if (now == hourStartNow && target == 'TOOLBAR_BUTTON_OK') return true;
        return now < hourStartNow;
    }, [values?.[`order_at_step1`]]);

    const codAmount = useMemo(() => {
        const totalPriceVariant = variantsOrder.reduce((result, variant) => {
            const [variantQuantity, variantPrice] = [
                values[`variant_${variant?.variant?.id}_quantity_step1`] || 0,
                values[`variant_${variant?.variant?.id}_price_step1`],
            ];
            result += (variantQuantity * variantPrice)
            return result
        }, 0);

        const totalDiscountVariant = variantsOrder.reduce((result, variant) => {
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

        const cod = totalPriceVariant - (totalDiscountVariant + values[`promotion_seller_amount_step2`]);

        return cod
    }, [values]);

    const onUploadFile = useCallback(async (file) => {
        try {
            setLoadingUploadFile(true);
            let formData = new FormData();
            formData.append('type', 'file')
            formData.append('file', file, file.name || 'file.jpg')
            let res = await axios.post(process.env.REACT_APP_URL_FILE_UPLOAD, formData, {
                isSubUser: user?.is_subuser,
                cancelToken: new CancelToken(function executor(c) {
                    refCancel.current = c;
                }),
            })

            setLoadingUploadFile(false);
            if (res.data?.success) {
                setFieldValue('s3_document_step2', res.data?.data.source);
            } else {
                addToast(formatMessage({ defaultMessage: 'Tải ảnh không thành công.' }), { appearance: 'error' });
            }
        } catch (error) {
            setLoadingUploadFile(false);
            addToast(formatMessage({ defaultMessage: 'Đã có lỗi xảy ra' }), { appearance: 'error' });
        }
    }, [user]);

    const amountRowTableLogistic = (delivery) => {
        return !!delivery?.provider?.providerConnected?.length ? delivery?.logistic_services?.length : 1
    }

    const messWarningFee = useMemo(() => {
        let messWarning = [];
        const smeWh = values['sme_warehouse_step1']
        const district = values['district_step1']?.value
        const province = values['province_step1']?.value
        const wards = values['ward']?.value
        const debounce_weight = values['debounce_weight']

        if (!smeWh || !district || !province || !wards) {
            messWarning.push(`<strong>địa chỉ giao hàng</strong>`);
        }

        if (!debounce_weight) {
            messWarning.push(`<strong>trọng lượng</strong>`);
        }

        return messWarning
    }, [values['sme_warehouse_step1'],
    values['district_step1']?.value,
    values['province_step1']?.value,
    values['ward']?.value,
    values['debounce_weight']])

    const onResetLogistic = useCallback(() => {
        if (values?.typeDelivery == 1) return;
        setFieldValue('shipping_discount_seller_fee_step2', 0);
        setFieldValue('shipping_original_fee_logistic', 0);
        setFieldValue('service_logistic', null);
        setFieldValue('reCaculateFee', true);
    }, [values?.typeDelivery]);

    const onReCaculateLogisticFee = useCallback(async () => {
        try {
            const totalAmount = sum(variantsOrder?.map(variant => (values[`variant_${variant?.variant_id}_price_step1`] * values[`variant_${variant?.variant_id}_quantity_step1`])));

            const { data } = await getLogisticServices({
                variables: {
                    goods_value: codAmount,
                    length: values['package_length_step2'] || null,
                    width: values['package_width_step2'] || null,
                    height: values['package_height_step2'] || null,
                    weight: +values['debounce_weight'] || 0,
                    receiver: {
                        district: values['district_step1']?.value,
                        province: values['province_step1']?.value,
                        wards: values['ward']?.value
                    },
                    sender: {
                        district: values['sme_warehouse_step1']?.district_code,
                        province: values['sme_warehouse_step1']?.province_code,
                        wards: values['sme_warehouse_step1']?.ward_code
                    },
                    item_value: totalAmount
                }
            });

            if (data?.coGetLogisticServices?.success) {
                // (data?.coGetLogisticServices?.logistics || []).forEach(logistic => {
                //     (logistic?.logistic_services || []).forEach(service => {
                //         if (values?.service_logistic?.logisticId == logistic?.providerConnected?.[0]?.id && values?.service_logistic?.code == service?.code) {
                //             setFieldValue('service_logistic', {
                //                 name: service?.name,
                //                 logisticId: logistic?.providerConnected?.[0]?.id,
                //                 code: service?.code
                //             })
                //         }
                //     })
                // })
                setLogistics(data?.coGetLogisticServices?.logistics);
            } else {
                addToast(data?.coGetLogisticServices?.message || formatMessage({ defaultMessage: 'Có lỗi xảy ra, xin vui lòng thử lại' }), { appearance: 'error' });
            }
        } catch (error) {
            addToast(formatMessage({ defaultMessage: 'Có lỗi xảy ra, xin vui lòng thử lại' }), { appearance: 'error' });
        }
    }, [values, codAmount]);

    return (
        <Fragment>
            <div className="row mt-2">
                <div className="col-6">
                    <label className="col-form-label">{formatMessage({ defaultMessage: 'Kích thước kiện hàng' })} (cm)</label>
                    <div className="row">
                        <div className="col-4">
                            <Field
                                name="package_length_step2"
                                component={InputVertical}
                                onIsChangeState={() => onResetLogistic()}
                                placeholder={formatMessage({ defaultMessage: 'Chiều dài' })}
                                label={""}
                                type="number"
                                customFeedbackLabel={' '}
                            />
                        </div>
                        <div className="col-4">
                            <Field
                                name="package_width_step2"
                                component={InputVertical}
                                onIsChangeState={() => onResetLogistic()}
                                placeholder={formatMessage({ defaultMessage: 'Chiều rộng' })}
                                label={""}
                                type="number"
                                customFeedbackLabel={' '}
                            />
                        </div>
                        <div className="col-4">
                            <Field
                                name="package_height_step2"
                                component={InputVertical}
                                onIsChangeState={() => onResetLogistic()}
                                placeholder={formatMessage({ defaultMessage: 'Chiều cao' })}
                                label={""}
                                type="number"
                                customFeedbackLabel={' '}
                            />
                        </div>
                    </div>
                </div>
                <div className="col-6">
                    <Field
                        name="package_weight_step2"
                        component={InputVertical}
                        decimalScale={2}
                        placeholder={formatMessage({ defaultMessage: 'Nhập trọng lượng kiện hàng' })}
                        label={formatMessage({ defaultMessage: 'Trọng lượng kiện hàng' })}
                        customFeedbackLabel={' '}
                        type="number"
                        required
                        onIsChangeState={(value) => {
                            onResetLogistic();
                            if (value) {
                                setFieldValue('debounce_weight', value)
                            } else {
                                setFieldValue('debounce_weight', 0)
                            }

                        }}
                        addOnRight={"kg"}
                    />
                </div>
            </div>

            <div className="row mt-2">
                <div className="col-6">
                    <Field
                        name="fee_bearer"
                        component={ReSelectVertical}
                        required={false}
                        isClearable={false}
                        onChanged={(option) => {
                            setFieldValue('shipping_discount_seller_fee_step2', option?.value == 2 ? values['typeDelivery'] == 2 ? values['shipping_original_fee_logistic'] : values['shipping_original_fee_step2'] : 0)
                        }}
                        label={formatMessage({ defaultMessage: 'Người chịu phí' })}
                        customFeedbackLabel={' '}
                        options={optionsFeeBearer}
                    />
                </div>
                <div className="col-6">
                    <Field
                        name="shipping_rule_check"
                        isClearable={true}
                        component={ReSelectVertical}
                        placeholder={formatMessage({ defaultMessage: 'Chọn quy định kiểm hàng' })}
                        label={formatMessage({ defaultMessage: 'Quy định kiểm hàng' })}
                        customFeedbackLabel={' '}
                        options={optionsRuleCheck}
                    />
                </div>
            </div>
            <div className="row mt-2">
                <div className="col-6">
                    <label className="col-form-label">
                        <span className="mr-2">{formatMessage({ defaultMessage: 'Dự kiến lấy hàng' })}</span>
                        <span className="text-danger mr-1">*</span>
                        <OverlayTrigger
                            overlay={
                                <Tooltip>
                                    {formatMessage({ defaultMessage: 'Thời gian muộn nhất để giao hàng cho đơn vị vận chuyển.' })}
                                </Tooltip>
                            }
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" className="bi bi-info-circle" viewBox="0 0 16 16">
                                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
                                <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0" />
                            </svg>
                        </OverlayTrigger>
                    </label>
                    <DatePicker
                        className='date-reserve-options w-100'
                        format={"yyyy-MM-dd HH:mm"}
                        placeholder={formatMessage({ defaultMessage: 'Chọn thời gian dự kiến giao hàng' })}
                        placement={"bottomStart"}
                        disabledDate={disabledFutureDate}
                        value={!!values[`ship_expired_at_step2`] ? new Date(values[`ship_expired_at_step2`] * 1000) : null}
                        onChange={value => {
                            setFieldValue('__changed__', true)
                            setFieldValue(`ship_expired_at_step2`, !!value ? dayjs(value).unix() : undefined)
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
                <div className="col-6">
                    <Field
                        name="p_delivery_method"
                        component={ReSelectVertical}
                        required={true}
                        isClearable={true}
                        onChanged={(option) => {
                            setFieldValue('p_delivery_method', option)
                        }}
                        label={formatMessage({ defaultMessage: 'Phương thức lấy hàng' })}
                        customFeedbackLabel={' '}
                        options={OPTIONS_LOGISTIC_PICKUP}
                    />
                </div>
            </div>
            <div className="my-2">{formatMessage({ defaultMessage: "Phương thức giao hàng" })}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="mt-2">
                <div>
                    <Field
                        name="typeDelivery"
                        label=''
                        isCenter={true}
                        component={RadioGroup}
                        customFeedbackLabel={" "}
                        disabled={false}
                        onChangeState={(value) => {
                            if (!value) {
                                setTypeDelyvery(1)
                            } else {
                                setTypeDelyvery(value)
                            }
                            if (value == 1) {
                                setFieldValue('shipping_discount_seller_fee_step2', values['fee_bearer']?.value == 2 ? +values['shipping_original_fee_step2'] : 0)
                            }
                            if (value == 2) {
                                setFieldValue('shipping_discount_seller_fee_step2', values['fee_bearer']?.value == 2 ? +values['shipping_original_fee_logistic'] : 0)
                            }
                        }}
                        options={OPTIONS_TYPE_DELIVERY}
                    />
                </div>
                {values['typeDelivery'] == 2 && !values?.reCaculateFee && (
                    <div>

                        <button
                            disabled={!!messWarningFee?.length}
                            onClick={() => {
                                onReCaculateLogisticFee();
                                // setFieldValue('refetchCheckFreeLogistic', !values['refetchCheckFreeLogistic'])
                            }}
                            className="btn btn-primary"
                        >
                            {formatMessage({ defaultMessage: "Tính phí VC" })}
                            <TooltipWrapper note={formatMessage({ defaultMessage: 'Bấm "Tính phí VC" để cập nhật phí vận chuyển mới nhất' })}>
                                <i style={{ color: 'white' }} className="fas fa-info-circle fs-14 ml-2"></i>
                            </TooltipWrapper>
                        </button>
                    </div>
                )}

            </div>

            {values['typeDelivery'] == 1 ? (
                <>
                    <div className="row mt-2">
                        <div className="col-6">
                            <Field
                                name="shipping_carrier_step2"
                                component={ReSelectVertical}
                                required
                                placeholder={formatMessage({ defaultMessage: 'Chọn đơn vị vận chuyển' })}
                                label={formatMessage({ defaultMessage: 'Đơn vị vận chuyển' })}
                                customFeedbackLabel={' '}
                                options={optionsShippingUnit}
                            />
                        </div>
                        <div className="col-6">
                            <Field
                                name="tracking_number_step2"
                                component={InputVertical}
                                placeholder={formatMessage({ defaultMessage: 'Nhập mã vận đơn' })}
                                label={formatMessage({ defaultMessage: 'Mã vận đơn' })}
                                customFeedbackLabel={' '}
                                countChar
                                maxChar={20}
                                maxLength={20}
                            />
                        </div>
                    </div>
                    <div className="row mt-2">
                        <div className="col-6">
                            <Field
                                name="shipping_original_fee_step2"
                                component={InputSelectAddons}
                                type="number"
                                placeholder={formatMessage({ defaultMessage: 'Nhập phí vận chuyển' })}
                                label={formatMessage({ defaultMessage: 'Phí vận chuyển' })}
                                customFeedbackLabel={' '}
                                clearUnit={true}
                                onChangeValue={(value) => {
                                    setFieldValue('shipping_discount_seller_fee_step2', values['fee_bearer']?.value == 2 ? +value : 0)
                                }}
                                required={false}
                            />
                        </div>
                        <div className="col-6">
                            <label className="col-form-label">{formatMessage({ defaultMessage: 'Phiếu vận đơn' })}</label>
                            <div className="d-flex align-items-center">
                                <input
                                    ref={refInputFile}
                                    style={{ display: 'none' }}
                                    multiple
                                    type="file"
                                    accept=".pdf"
                                    onChange={async e => {
                                        let _file = e.target.files[0];
                                        if (_file.size > 2 * 1024 * 1024) {
                                            addToast(formatMessage({ defaultMessage: 'Phiếu vận đơn tối đa 2MB.' }), { appearance: 'error' });
                                            return;
                                        }
                                        refInputFile.current.value = null;
                                        onUploadFile(_file);
                                    }}
                                />
                                {!!values[`s3_document_step2`] ? (
                                    <div className="d-flex align-items-center text-info">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-file-earmark-pdf" viewBox="0 0 16 16">
                                            <path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2M9.5 3A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5z" />
                                            <path d="M4.603 14.087a.8.8 0 0 1-.438-.42c-.195-.388-.13-.776.08-1.102.198-.307.526-.568.897-.787a7.7 7.7 0 0 1 1.482-.645 20 20 0 0 0 1.062-2.227 7.3 7.3 0 0 1-.43-1.295c-.086-.4-.119-.796-.046-1.136.075-.354.274-.672.65-.823.192-.077.4-.12.602-.077a.7.7 0 0 1 .477.365c.088.164.12.356.127.538.007.188-.012.396-.047.614-.084.51-.27 1.134-.52 1.794a11 11 0 0 0 .98 1.686 5.8 5.8 0 0 1 1.334.05c.364.066.734.195.96.465.12.144.193.32.2.518.007.192-.047.382-.138.563a1.04 1.04 0 0 1-.354.416.86.86 0 0 1-.51.138c-.331-.014-.654-.196-.933-.417a5.7 5.7 0 0 1-.911-.95 11.7 11.7 0 0 0-1.997.406 11.3 11.3 0 0 1-1.02 1.51c-.292.35-.609.656-.927.787a.8.8 0 0 1-.58.029m1.379-1.901q-.25.115-.459.238c-.328.194-.541.383-.647.547-.094.145-.096.25-.04.361q.016.032.026.044l.035-.012c.137-.056.355-.235.635-.572a8 8 0 0 0 .45-.606m1.64-1.33a13 13 0 0 1 1.01-.193 12 12 0 0 1-.51-.858 21 21 0 0 1-.5 1.05zm2.446.45q.226.245.435.41c.24.19.407.253.498.256a.1.1 0 0 0 .07-.015.3.3 0 0 0 .094-.125.44.44 0 0 0 .059-.2.1.1 0 0 0-.026-.063c-.052-.062-.2-.152-.518-.209a4 4 0 0 0-.612-.053zM8.078 7.8a7 7 0 0 0 .2-.828q.046-.282.038-.465a.6.6 0 0 0-.032-.198.5.5 0 0 0-.145.04c-.087.035-.158.106-.196.283-.04.192-.03.469.046.822q.036.167.09.346z" />
                                        </svg>
                                        <span className="ml-2" onClick={() => saveAs(values[`s3_document_step2`], `Phieu_van_don`)}>{values[`s3_document_step2`]}</span>
                                    </div>
                                ) : (
                                    <button
                                        className="btn btn-primary d-flex align-items-center justify-content-center"
                                        style={{ minWidth: 100 }}
                                        onClick={() => refInputFile.current.click()}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="mr-2 bi bi-upload" viewBox="0 0 16 16">
                                            <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5" />
                                            <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708z" />
                                        </svg>
                                        <span>{formatMessage({ defaultMessage: 'Tải file' })}</span>
                                    </button>
                                )}
                                {loadingUploadFile && <div className='ml-4'>
                                    <span className="spinner spinner-primary" />
                                </div>}
                            </div>
                            {!!values[`s3_document_step2`] && (
                                <div className="d-flex align-items-center mt-2 text-primary">
                                    <span
                                        className="cursor-pointer"
                                        onClick={() => refInputFile.current.click()}
                                    >
                                        {formatMessage({ defaultMessage: 'Thay đổi' })}
                                    </span>
                                    <span
                                        className="ml-4 cursor-pointer"
                                        onClick={() => setFieldValue('s3_document_step2', null)}
                                    >
                                        {formatMessage({ defaultMessage: 'Xóa' })}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                </>
            ) : (
                <>
                    {!!messWarningFee?.length ? (
                        <div className="mt-2 mb-2" style={{ padding: '10px', background: '#D9D9D9' }}>
                            <div>{formatMessage({ defaultMessage: 'Hiện tại đơn hàng chưa đủ thông tin để chuyển sang cho đơn vị vận chuyển.' })}</div>
                            <div dangerouslySetInnerHTML={{
                                __html: `<div>
                                    Bạn vui lòng bổ sung thông tin ${messWarningFee?.join(', ')} để tính phí vận chuyển dự tính.
                                </div>`
                            }} />
                        </div>
                    ) : (
                        <div className="mt-2" style={{ minHeight: 200 }}>
                            <table className={`w-100 table table-borderless table-vertical-center fixed`} style={{ border: '1px solid #d9d9d9' }}>
                                <thead style={{ borderBottom: '1px solid #d9d9d9' }}>
                                    <tr>
                                        <th style={{ width: '300px' }}>{formatMessage({ defaultMessage: 'Đối tác vận chuyển' })}</th>
                                        <th style={{ width: '300px' }}>{formatMessage({ defaultMessage: 'Dịch vụ' })}</th>
                                        <th style={{ width: '300px', textAlign: 'center' }}>{formatMessage({ defaultMessage: 'Thời gian dự kiến' })}</th>
                                        <th style={{ width: '300px', textAlign: 'right' }}>{formatMessage({ defaultMessage: 'Phí vận chuyển dự tính' })}</th>
                                    </tr>
                                </thead>
                                {loadingCheckLogisticFee && <tbody>
                                    <div className="text-center w-100 mt-20" style={{ position: "absolute" }}>
                                        <span className="ml-3 spinner spinner-primary"></span>
                                    </div>
                                </tbody>}

                                {!loadingCheckLogisticFee && !!values?.reCaculateFee && <tbody>
                                    <td colSpan={4}>
                                        <div className="d-flex flex-column align-items-center justify-content-center my-8">
                                            <span className="mb-4">{formatMessage({ defaultMessage: 'Bạn vui lòng cập nhật lại phí vận chuyển sau khi sửa đơn hàng' })}</span>
                                            <button
                                                disabled={!!messWarningFee?.length}
                                                onClick={() => {
                                                    onReCaculateLogisticFee();
                                                    setFieldValue('reCaculateFee', false);
                                                    // setFieldValue('refetchCheckFreeLogistic', !values['refetchCheckFreeLogistic'])
                                                }}
                                                className="btn btn-primary mx-2">
                                                {formatMessage({ defaultMessage: "Tính phí VC" })}
                                                <TooltipWrapper note={formatMessage({ defaultMessage: 'Bấm "Tính phí VC" để cập nhật phí vận chuyển mới nhất' })}>
                                                    <i style={{ color: 'white' }} className="fas fa-info-circle fs-14 ml-2"></i>
                                                </TooltipWrapper>
                                            </button>
                                        </div>
                                    </td>
                                </tbody>}

                                {!loadingCheckLogisticFee && !values?.reCaculateFee && <tbody>
                                    {logistics?.map(delivery => (
                                        <>
                                            {!delivery?.logistic_services && <>
                                                <tr>
                                                    <td rowspan={amountRowTableLogistic(delivery)}>{delivery?.provider?.name}</td>
                                                    {!delivery?.provider?.providerConnected?.length ? (
                                                        <td colSpan={3}>Dịch vụ vận chuyển không khả dụng. Kết nối <span style={{ color: 'blue', cursor: 'pointer' }}><a href='/setting/third-party-connection' target="_blank">tại đây</a></span></td>
                                                    ) : (
                                                        <td colSpan={3}>{formatMessage({ defaultMessage: 'Không có dịch vụ nào phù hợp' })}</td>
                                                    )}
                                                </tr>
                                            </>}
                                            {delivery?.logistic_services?.length > 0 && delivery?.logistic_services?.map((service, index) => (
                                                <>
                                                    <tr>
                                                        {index == 0 && <td style={{ verticalAlign: 'top' }} rowspan={amountRowTableLogistic(delivery)}>{delivery?.provider?.name}</td>}
                                                        {!delivery?.provider?.providerConnected?.length ? (
                                                            <td colSpan={3}>Dịch vụ vận chuyển không khả dụng. Kết nối <span style={{ color: 'blue', cursor: 'pointer' }}><a href='/setting/third-party-connection' target="_blank">tại đây</a></span></td>
                                                        ) : (
                                                            <>
                                                                <td>
                                                                    <label style={{ cursor: 'pointer' }} key={`op-${service.code}`} className="radio">
                                                                        <input
                                                                            onChange={() => {
                                                                                setFieldValue('service_logistic', {
                                                                                    code: service?.code,
                                                                                    serviceName: service?.name,
                                                                                    logisticId: delivery?.provider?.providerConnected[0]?.id,
                                                                                    name: delivery?.provider?.name
                                                                                })
                                                                                setFieldValue('shipping_discount_seller_fee_step2', values['fee_bearer']?.value == 2 ? service?.price : 0)
                                                                                setFieldValue('shipping_original_fee_logistic', service?.price || 0)

                                                                            }}
                                                                            type="radio"
                                                                            name='service_logistic'
                                                                            value={values['service_logistic']}
                                                                            checked={values['service_logistic']?.code == service?.code && values['service_logistic']?.logisticId == delivery?.provider?.providerConnected[0]?.id}
                                                                        />
                                                                        <span className="mr-2"></span>
                                                                        {service?.name}
                                                                    </label>
                                                                </td>
                                                                <td style={{ textAlign: 'center' }}>
                                                                    {service?.delivery_time || formatMessage({ defaultMessage: 'Tùy vào dịch vụ ĐVVC cung cấp' })}
                                                                </td>
                                                                <td style={{ textAlign: 'right' }}>
                                                                    <span>{formatNumberToCurrency(service?.price)}đ</span>
                                                                    {/* <LogisticFee
                                                                        variables={{
                                                                            length: values['package_length_step2'] || 0, width: values['package_width_step2'] || 0, height: values['package_height_step2'] || 0,
                                                                            weight: +values['debounce_weight'] || 0, provider_connected_id: delivery?.id, shipping_service: service?.code,
                                                                            receiver: {
                                                                                district: values['district_step1']?.value,
                                                                                province: values['province_step1']?.value,
                                                                                wards: values['ward']?.value
                                                                            },
                                                                            sender: {
                                                                                district: values['sme_warehouse_step1']?.district_code,
                                                                                province: values['sme_warehouse_step1']?.province_code,
                                                                                wards: values['sme_warehouse_step1']?.ward_code
                                                                            },
                                                                            total_amount: _.sum(variantsOrder?.map(variant => (values[`variant_${variant?.variant_id}_price_step1`] * values[`variant_${variant?.variant_id}_quantity_step1`])))
                                                                        }}
                                                                    /> */}
                                                                </td>
                                                            </>
                                                        )}

                                                    </tr>
                                                </>
                                            ))}

                                        </>
                                    ))}
                                </tbody>}
                            </table>
                        </div>
                    )}

                </>
            )}





        </Fragment >
    )
};

export default memo(InfoTransport);