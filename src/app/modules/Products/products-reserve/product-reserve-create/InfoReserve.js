import React, { memo, useCallback, useMemo, useState } from "react";
import { Card, CardBody, CardHeader, InputVertical } from "../../../../../_metronic/_partials/controls";
import { useIntl } from "react-intl";
import { ReSelectVertical } from "../../../../../_metronic/_partials/controls/forms/ReSelectVertical";
import { useFormikContext, Field } from "formik";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import DatePicker from "rsuite/DatePicker";
import dayjs from "dayjs";
import query_warehouse_reserve_tickets_aggregate from "../../../../../graphql/query_warehouse_reserve_tickets_aggregate";
import client from "../../../../../apollo";

export const queryCheckExistTicketName = async (value) => {
    let { data } = await client.query({
        query: query_warehouse_reserve_tickets_aggregate,
        fetchPolicy: 'network-only',
        variables: {
            "where": {
                "name": { "_eq": value }
            }
        }
    })
    return data?.warehouse_reserve_tickets_aggregate?.aggregate?.count > 0;
}

const InfoReserve = ({ optionsStore, onClearVariants }) => {
    const { setFieldValue, errors, handleBlur } = useFormikContext();
    const { formatMessage } = useIntl();
    const [loading, setLoading] = useState(false);

    const disabledFutureDate = useCallback((date) => {
        const unixDate = dayjs(date).unix();
        const today = dayjs().endOf('day').unix();

        return unixDate < today;
    }, []);

    return (
        <Card className="mb-6">
            <CardHeader
                title={formatMessage({ defaultMessage: 'Thông tin phiếu dự trữ' })}
            />
            <CardBody>
                <div className="row">
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
                                    onChangeCapture={e => {
                                        setFieldValue('name_boolean', { name: false })
                                    }}
                                    onBlurChange={async (value) => {
                                        // handleBlur(value);
                                        const valueErrorForm = errors?.['name'];
                                        if (!!valueErrorForm) return;

                                        setLoading(true);
                                        const checkExistUsername = await queryCheckExistTicketName(value);
                                        setLoading(false);
                                        if (checkExistUsername) {
                                            setFieldValue('name_boolean', { name: true })
                                        } else {
                                            setFieldValue('name_boolean', { name: false })
                                        }

                                    }}
                                    loading={loading}
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
                                <span className="ml-1 text-danger">*</span>
                            </label>
                            <div className="col-sm-5 d-flex flex-column" style={{ position: 'relative' }}>
                                <Field
                                    name="store"
                                    component={ReSelectVertical}
                                    onChange={() => {
                                        setFieldValue('__changed__', true)
                                    }}
                                    onChanged={() => {
                                        onClearVariants()
                                    }}
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
                        <div className="row">
                            <label className="col-sm-4 col-form-label text-right">
                                <span>{formatMessage({ defaultMessage: 'Thời gian bắt đầu CTKM' })}</span>
                                <OverlayTrigger
                                    overlay={
                                        <Tooltip>
                                            {formatMessage({ defaultMessage: 'Thời gian bắt đầu chương trình khuyến mại' })}
                                        </Tooltip>
                                    }
                                >
                                    <span className="ml-1" style={{ position: 'relative', top: '-1px' }}>
                                        <svg xmlns="http://www.w3.org/1800/svg" width="12" height="12" fill="currentColor" class="bi bi-info-circle" viewBox="0 0 16 16">
                                            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                                            <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
                                        </svg>
                                    </span>
                                </OverlayTrigger>
                                <span className="ml-1 text-danger">*</span>
                            </label>
                            <div className="col-sm-5 d-flex flex-column" style={{ position: 'relative' }}>
                                <DatePicker
                                    className='date-reserve-options w-100'
                                    format={"yyyy-MM-dd HH:00"}                                    
                                    placeholder={formatMessage({ defaultMessage: 'Chọn thời gian bắt đầu CTKM' })}
                                    // showMeridian
                                    placement={"bottomStart"}
                                    onChange={value => {
                                        setFieldValue(`start_date_campaign`, !!value ? dayjs(value).startOf('hour').unix() : undefined)
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
                        <div className="row mt-4">
                            <label className="col-sm-4 col-form-label text-right">
                                <span>{formatMessage({ defaultMessage: 'Thời gian kết thúc' })}</span>
                                <OverlayTrigger
                                    overlay={
                                        <Tooltip>
                                            {formatMessage({ defaultMessage: 'Chọn thời gian kết thúc dự trữ tồn' })}
                                        </Tooltip>
                                    }
                                >
                                    <span className="ml-1" style={{ position: 'relative', top: '-1px' }}>
                                        <svg xmlns="http://www.w3.org/1800/svg" width="12" height="12" fill="currentColor" class="bi bi-info-circle" viewBox="0 0 16 16">
                                            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                                            <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
                                        </svg>
                                    </span>
                                </OverlayTrigger>
                                <span className="ml-1 text-danger">*</span>
                            </label>
                            <div className="col-sm-5 d-flex flex-column" style={{ position: 'relative' }}>
                                <DatePicker
                                    className='date-reserve-options w-100'
                                    format={"yyyy-MM-dd HH:00"}                                    
                                    placeholder={formatMessage({ defaultMessage: 'Chọn thời gian kết thúc' })}
                                    // showMeridian
                                    placement={"bottomStart"}
                                    disabledDate={disabledFutureDate}
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
            </CardBody>
        </Card>
    )
}

export default memo(InfoReserve);