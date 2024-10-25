import React, { memo, useMemo } from "react";
import { Card, CardBody, CardHeader, InputVertical } from "../../../../../_metronic/_partials/controls";
import { useIntl } from "react-intl";
import { ReSelectVertical } from "../../../../../_metronic/_partials/controls/forms/ReSelectVertical";
import { useFormikContext, Field } from "formik";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import DatePicker from "rsuite/DatePicker";
import dayjs from "dayjs";
import { useProductsReserveDetailContext } from "./ProductReserveDetailContext";

const InfoReserve = ({ loadingReserveTicketItems }) => {
    const { setFieldValue, values } = useFormikContext();
    const { formatMessage } = useIntl();
    const { optionsStore } = useProductsReserveDetailContext()
    return (
        <Card className="mb-6">
            <CardHeader
                title={<div className="d-flex align-items-center">
                    <span>{formatMessage({ defaultMessage: 'Thông tin phiếu dự trữ' })}</span>
                    {!!values?.status && (
                        <div
                            className="ml-8 px-2 py-1 d-flex align-items-center justify-content-center"
                            style={{ borderRadius: 4, background: values?.status == 'processing' ? '#ff5629' : '#00DB6D' }}
                        >
                            <span className="text-white fs-12">{values?.status == 'processing' ? formatMessage({ defaultMessage: 'Đang dự trữ' }) : formatMessage({ defaultMessage: 'Kết thúc' })}</span>
                        </div>
                    )}
                </div>}
            />
            <CardBody>
                <div style={{ position: 'relative' }}>
                    {loadingReserveTicketItems && <div style={{ position: 'absolute', top: '50%', left: '50%', zIndex: 99 }}>
                        <span className="spinner spinner-primary" />
                    </div>}
                    <div className="row" style={loadingReserveTicketItems ? { opacity: 0.4 } : {}}>
                        <div className="col-8">
                            <div className="form-group row">
                                <label className="col-sm-4 col-form-label text-right">
                                    <span>{formatMessage({ defaultMessage: 'Tên' })}</span>
                                    <span className="ml-1 text-danger">*</span>
                                </label>
                                <div className="col-sm-8 d-flex flex-column" style={{ position: 'relative' }}>
                                    <Field
                                        name="name"
                                        component={InputVertical}
                                        onChange={() => {
                                            setFieldValue('__changed__', true)
                                        }}
                                        disabled
                                        required
                                        maxChar={35}
                                        placeholder={formatMessage({ defaultMessage: 'Nhập tên' })}
                                        label={""}
                                        countChar
                                        customFeedbackLabel={' '}
                                    />
                                </div>
                            </div>
                            <div className="row">
                                <label className="col-sm-4 col-form-label text-right">
                                    <span>{formatMessage({ defaultMessage: 'Gian hàng' })}</span>
                                </label>
                                <div className="col-sm-5 d-flex flex-column" style={{ position: 'relative' }}>
                                    <Field
                                        name="store"
                                        component={ReSelectVertical}
                                        onChange={() => {
                                            setFieldValue('__changed__', true)
                                        }}
                                        isDisabled
                                        required
                                        placeholder={formatMessage({ defaultMessage: 'Chọn gian hàng' })}
                                        label={""}
                                        customFeedbackLabel={' '}
                                        options={optionsStore}
                                        formatOptionLabel={(option, labelMeta) => {
                                            return <div className="d-flex align-items-center">
                                                {!!option.logo && <img src={option.logo} style={{ width: 15, height: 15, marginRight: 6 }} />}
                                                <span>{option.label}</span>
                                            </div>
                                        }}
                                        isClearable
                                    />
                                </div>
                            </div>
                            <div className="row mb-6">
                                <label className="col-sm-4 col-form-label text-right">
                                    <span>{formatMessage({ defaultMessage: 'Thời gian bắt đầu CTKM' })}</span>
                                    <span className="ml-1 text-danger">*</span>
                                </label>
                                <div className="col-sm-5 d-flex flex-column" style={{ position: 'relative', pointerEvents: 'none' }}>
                                    <DatePicker
                                        className='date-reserve-options w-100'
                                        format={"yyyy-MM-dd HH:mm"}
                                        disabled
                                        placeholder={formatMessage({ defaultMessage: 'Chọn thời gian bắt đầu CTKM' })}
                                        placement={"bottomStart"}
                                        value={!!values[`start_date`] ? new Date(values[`start_date`] * 1000) : null}
                                        onChange={value => {
                                            setFieldValue(`start_date`, !!value ? dayjs(value).unix() : undefined)
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
                            </div>
                            <div className="row mb-6">
                                <label className="col-sm-4 col-form-label text-right">
                                    <span>{formatMessage({ defaultMessage: 'Thời gian bắt đầu' })}</span>
                                    <span className="ml-1 text-danger">*</span>
                                </label>
                                <div className="col-sm-5 d-flex flex-column" style={{ position: 'relative', pointerEvents: 'none' }}>
                                    <DatePicker
                                        className='date-reserve-options w-100'
                                        format={"yyyy-MM-dd HH:mm"}
                                        disabled
                                        placeholder={formatMessage({ defaultMessage: 'Chọn thời gian bắt đầu' })}
                                        placement={"bottomStart"}
                                        value={!!values[`created_at`] ? new Date(values[`created_at`] * 1000) : null}
                                        onChange={value => {
                                            setFieldValue(`created_at`, !!value ? dayjs(value).unix() : undefined)
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
                            </div>
                            <div className="row">
                                <label className="col-sm-4 col-form-label text-right">
                                    <span>{formatMessage({ defaultMessage: 'Thời gian kết thúc' })}</span>
                                    <span className="ml-1 text-danger">*</span>
                                </label>
                                <div className="col-sm-5 d-flex flex-column" style={{ position: 'relative', pointerEvents: 'none' }}>
                                    <DatePicker
                                        className='date-reserve-options w-100'
                                        format={"yyyy-MM-dd HH:00"}
                                        disabled
                                        placeholder={formatMessage({ defaultMessage: 'Chọn thời gian kết thúc' })}
                                        placement={"bottomStart"}
                                        value={!!values[`end_date`] ? new Date(values[`end_date`] * 1000) : null}
                                        onChange={value => {
                                            setFieldValue(`end_date`, !!value ? dayjs(value).unix() : undefined)
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
                            </div>
                        </div>
                    </div>
                </div>
            </CardBody>
        </Card>
    )
}

export default memo(InfoReserve);