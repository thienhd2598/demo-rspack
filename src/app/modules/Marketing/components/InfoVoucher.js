import React, { memo, useMemo, useState } from "react";
import { useIntl } from "react-intl";
import Select from 'react-select';
import DateRangePicker from 'rsuite/DateRangePicker';
import DatePicker from 'rsuite/DatePicker';
import { Card, InputVertical } from "../../../../_metronic/_partials/controls";
import { RadioGroup } from "../../../../_metronic/_partials/controls/forms/RadioGroup";
import { Field, useFormikContext } from "formik";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { useVoucherContext } from "../contexts/VoucherContext";
import dayjs from "dayjs";
import { randomString } from "../../../../utils";
import { MAX_RANGE_TIME } from "../Constants";

const InfoVoucher = ({
    loading = false, isTemplate = false, isEdit = false, isActionView = false,
    channelDetail, timeVoucher, setTimeVoucher, collectTime, setCollectTime,
    voucherDetail = null, listRangeTime, setListRangeTime,
}) => {
    const { formatMessage } = useIntl();
    const { setFieldValue, errors, touched, values } = useFormikContext();
    const { storeOptions, channelVoucher, paramsQuery, setProductsVoucher } = useVoucherContext();
    const [isExpand, setIsExpand] = useState(false);

    const channel = useMemo(() => {
        return isEdit ? channelDetail : channelVoucher
    }, [isEdit, channelDetail, channelVoucher]);    

    return (
        <Card style={{ position: 'relative', opacity: loading ? 0.4 : 1 }}>
            {loading && <div style={{ position: 'absolute', top: '50%', left: '50%', zIndex: 99 }}>
                <span className="spinner spinner-primary" />
            </div>}
            <div className="m-4">
                <div className="mb-8">
                    <strong className="fs-14" style={{ color: '#000' }}>
                        {formatMessage({ defaultMessage: 'THÔNG TIN CƠ BẢN' })}
                    </strong>
                </div>
                <div className="row mb-4">
                    <div className="col-2">
                        <div className="d-flex align-items-center">
                            <span>{formatMessage({ defaultMessage: 'Sàn' })}</span>
                            <span className="text-danger">*</span>
                        </div>
                    </div>
                    <div className="col-9 d-flex align-items-center">
                        {!!channel?.logo_asset_url && (
                            <img
                                src={channel?.logo_asset_url}
                                className="mr-1"
                                style={{ width: 15, height: 15, objectFit: 'contain' }}
                                alt=""
                            />
                        )}
                        <span>{channel?.name}</span>
                    </div>
                </div>
                <div className="row mb-4 d-flex align-items-center">
                    <div className="col-2">
                        <div className="d-flex align-items-center">
                            <span>{formatMessage({ defaultMessage: 'Gian hàng' })}</span>
                            <span className="text-danger">*</span>
                        </div>
                    </div>
                    <div className="col-3">
                        <Select
                            id="store"
                            options={storeOptions}
                            onChange={option => {
                                setProductsVoucher([]);
                                setFieldValue('store', `${option.value}`)
                            }}
                            value={storeOptions?.find(option => option.value === values.store)}
                            required
                            placeholder={formatMessage({ defaultMessage: "Chọn gian hàng" })}
                            isDisabled={paramsQuery?.action == 'copy' || isEdit}
                            formatOptionLabel={(option, labelMeta) => {
                                return (
                                    <div className="d-flex align-items-center">
                                        {!!option.logo && <img
                                            src={option.logo}
                                            style={{ width: 15, height: 15 }}
                                        />}
                                        <span className="ml-2">{option.label}</span>
                                    </div>
                                );
                            }}
                        />
                        {errors.store && touched.store ? (
                            <div className="text-danger">{errors.store}</div>
                        ) : null}
                    </div>
                </div>
                <div className="row mb-4 align-items-center">
                    <div className="col-2">
                        <span>{formatMessage({ defaultMessage: 'Tên chương trình giảm giá' })}</span>
                        <span className="text-danger">*</span>
                    </div>
                    <div className='col-5'>
                        <Field
                            name={`name`}
                            component={InputVertical}
                            placeholder={formatMessage({ defaultMessage: "Nhập tên chương trình" })}
                            required
                            countChar
                            maxChar={100}
                            disabled={isActionView || (isEdit && values?.text_status == 'Đang diễn ra' && !!voucherDetail?.ref_id)}
                        />
                    </div>
                </div>
                {channel?.code == 'shopee' && values?.type != 22 && values?.type != 21 && values?.type != 25 && <div className="row mb-4 align-items-center">
                    <div className="col-2">
                        <span>{formatMessage({ defaultMessage: 'Mã voucher' })}</span>
                        <span className="text-danger">*</span>
                    </div>
                    <div className='col-5'>
                        {isTemplate && <div className="my-1 text-danger">{formatMessage({ defaultMessage: 'Hệ thống sẽ tự động gen mã voucher' })}</div>}
                        {!isTemplate && <Field
                            name={`code`}
                            component={InputVertical}
                            placeholder={formatMessage({ defaultMessage: "Nhập mã voucher" })}
                            required
                            maxLength={isTemplate ? 3 : 5}
                            countChar
                            maxChar={isTemplate ? 3 : 5}
                            disabled={isActionView || (isEdit && values?.status == 2 && !!voucherDetail?.ref_id)}
                        />}
                    </div>
                </div>}
                {!isTemplate && (
                    <div className="row mb-4 align-items-center">
                        <div className="col-2">
                            <span>{formatMessage({ defaultMessage: 'Thời gian sử dụng' })}</span>
                            <span className="text-danger">*</span>
                        </div>
                        <div className='col-7'>
                            <div className="row">
                                <div className="col-6">
                                    <DateRangePicker
                                        value={timeVoucher?.values}
                                        character={' - '}
                                        className="custome__style__input__date"
                                        format={'HH:mm dd/MM/yyyy'}
                                        onChange={(valuesDate) => {
                                            if (isActionView || (isEdit && values?.text_status == 'Đang diễn ra' && !!voucherDetail?.ref_id)) return;

                                            if (!valuesDate) {
                                                setCollectTime(prev => ({ ...prev, error: null }));
                                                setTimeVoucher(prev => ({ ...prev, error: formatMessage({ defaultMessage: 'Vui lòng chọn thời gian sử dụng' }), values: [] }))
                                                return;
                                            }

                                            let error = null;
                                            let errorCollectTime = null;
                                            const now = dayjs().startOf('minute').unix();
                                            const [startTime, endTime] = [dayjs(valuesDate[0]).startOf('minute').unix(), dayjs(valuesDate[1]).startOf('minute').unix()];

                                            if (startTime >= endTime) {
                                                error = formatMessage({ defaultMessage: 'Thời gian kết thúc phải lớn hơn thời gian bắt đầu' })
                                            } else if (startTime <= now) {
                                                error = formatMessage({ defaultMessage: 'Thời gian bắt đầu phải lớn hơn thời gian hiện tại' })
                                            } else if (endTime >= startTime + 86400 * 90) {
                                                error = formatMessage({ defaultMessage: 'Thời gian kết thúc không thể vượt quá 3 tháng sau thời gian bắt đầu' })
                                            }

                                            if (!!collectTime?.value && !collectTime?.error) {
                                                const collectTimeUnix = dayjs(collectTime?.value).startOf('minute').unix();

                                                if (collectTimeUnix >= startTime) {
                                                    errorCollectTime = formatMessage({ defaultMessage: 'Thời gian sưu tầm phải sớm hơn thời gian bắt đầu' })
                                                }
                                            }

                                            setCollectTime(prev => ({ ...prev, error: errorCollectTime }));
                                            setTimeVoucher(prev => ({ ...prev, error, values: valuesDate }));
                                        }}
                                        disabled={isActionView || (isEdit && values?.text_status == 'Đang diễn ra' && !!voucherDetail?.ref_id)}
                                        onClean={() => {
                                            if (isActionView || (isEdit && values?.text_status == 'Đang diễn ra' && !!voucherDetail?.ref_id)) {
                                                return
                                            }
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
                                    {!!timeVoucher?.error && <div className="mt-1 text-danger">{timeVoucher?.error}</div>}
                                </div>
                                {!(values?.channel == 'shopee' && (values?.type == 26 || values?.type == 25)) && <div className="col-6">
                                    <div className="row d-flex align-items-center">
                                        <div className="col-4 d-flex align-items-center justify-content-end">
                                            <span className="mr-1">{formatMessage({ defaultMessage: 'Sưu tầm' })}</span>
                                            <OverlayTrigger
                                                overlay={
                                                    <Tooltip>
                                                        {formatMessage({ defaultMessage: 'Thời gian được lưu mã trước khi sử dụng' })}
                                                    </Tooltip>
                                                }
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" className="bi bi-info-circle" viewBox="0 0 16 16">
                                                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
                                                    <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0" />
                                                </svg>
                                            </OverlayTrigger>
                                        </div>
                                        <div className="col-8">
                                            <DatePicker
                                                value={collectTime?.value}
                                                character={' - '}
                                                className="custome__style__input__date"
                                                format={'HH:mm dd/MM/yyyy'}
                                                onChange={(value) => {
                                                    if (isActionView || (isEdit && values?.status == 2 && !!voucherDetail?.ref_id)) return;

                                                    if (!!timeVoucher?.values?.length && !!value) {
                                                        const startTime = dayjs(timeVoucher?.values?.[0]).startOf('minute').unix();
                                                        const currentTimeCollect = dayjs(value).startOf('minute').unix();

                                                        if (currentTimeCollect >= startTime) {
                                                            setCollectTime(prev => ({ ...prev, error: formatMessage({ defaultMessage: 'Thời gian sưu tầm phải sớm hơn thời gian bắt đầu' }), value }))
                                                            return;
                                                        }
                                                    }

                                                    setCollectTime(prev => ({ ...prev, error: null, value }))
                                                }}
                                                disabled={isActionView || (isEdit && values?.status == 2 && !!voucherDetail?.ref_id)}
                                                onClean={() => {
                                                    if (isActionView || (isEdit && values?.status == 2 && !!voucherDetail?.ref_id)) {
                                                        return
                                                    }
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
                                            {!!collectTime?.error && <div className="mt-1 text-danger">{collectTime?.error}</div>}
                                        </div>
                                    </div>
                                </div>}
                            </div>
                        </div>
                    </div>
                )}

                {isTemplate && (
                    <div className="row mb-4 align-items-start">
                        <div className="col-2">
                            <span>{formatMessage({ defaultMessage: 'Thời gian sử dụng' })}</span>
                            <span className="text-danger">*</span>
                        </div>
                        <div className='col-8'>
                            {listRangeTime?.slice(0, isActionView && !isExpand ? 2 : listRangeTime?.length)?.map(time => {
                                return <div className="row d-flex align-items-center mb-4">
                                    <div className="col-6">
                                        <DateRangePicker
                                            value={time?.range}
                                            character={' - '}
                                            className="custome__style__input__date"
                                            format={'HH:mm dd/MM/yyyy'}
                                            onChange={(values) => {
                                                if (isActionView) return;

                                                const unixTimeDates = listRangeTime
                                                    ?.filter(item => item?.range?.length > 0 && item?.id != time?.id)
                                                    ?.map(item => item?.range?.map(_range => dayjs(_range).startOf('minute').unix()));


                                                setListRangeTime(prev => prev?.map(item => {
                                                    if (item?.id == time?.id) {
                                                        let errorMess = null;
                                                        let errorCollectTime = null;
                                                        if (values?.length) {
                                                            const now = dayjs().startOf('minute').unix();
                                                            const [startTime, endTime] = [dayjs(values[0]).startOf('minute').unix(), dayjs(values[1]).startOf('minute').unix()];

                                                            if (startTime >= endTime) {
                                                                errorMess = formatMessage({ defaultMessage: 'Thời gian kết thúc phải lớn hơn thời gian bắt đầu' })
                                                            } else if (startTime <= now) {
                                                                errorMess = formatMessage({ defaultMessage: 'Thời gian bắt đầu phải lớn hơn thời gian hiện tại' })
                                                            } else if (endTime >= startTime + 86400 * 90) {
                                                                errorMess = formatMessage({ defaultMessage: 'Thời gian kết thúc không thể vượt quá 3 tháng sau thời gian bắt đầu' })
                                                            } else {
                                                                const hasDuplicate = unixTimeDates?.some(date => {
                                                                    const startCurrentTime = dayjs(values?.[0]).startOf('minute').unix();
                                                                    const endCurrentTime = dayjs(values?.[1]).startOf('minute').unix();

                                                                    return !(date[1] < startCurrentTime || endCurrentTime < date[0])
                                                                })

                                                                if (hasDuplicate) errorMess = 'Khung giờ bị trùng lặp'
                                                            }

                                                            if (!!time?.collectTime && !time?.errorCollectTime) {
                                                                const collectTimeUnix = dayjs(time?.collectTime).startOf('minute').unix();

                                                                if (collectTimeUnix >= startTime) {
                                                                    errorCollectTime = formatMessage({ defaultMessage: 'Thời gian sưu tầm phải sớm hơn thời gian bắt đầu' });
                                                                }
                                                            }
                                                        }


                                                        return {
                                                            ...item,
                                                            range: values,
                                                            error: errorMess,
                                                            errorCollectTime
                                                        }
                                                    }

                                                    return item
                                                }))
                                            }}
                                            disabled={isActionView}
                                            onClean={() => {
                                                if (isActionView) {
                                                    return
                                                }

                                                setListRangeTime(prev => prev?.map(item => {
                                                    if (item?.id == time?.id) {
                                                        return {
                                                            ...item,
                                                            error: 'Vui lòng nhập thời gian',
                                                            errorCollectTime: null
                                                        }
                                                    }

                                                    return item
                                                }))
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
                                        {time?.error ? (
                                            <div className="text-danger mt-1">{time?.error}</div>
                                        ) : null}
                                    </div>
                                    {!(values?.channel == 'shopee' && values?.type == 26) && <div className="col-5">
                                        <div className="row d-flex align-items-center">
                                            <div className="col-4 d-flex align-items-center justify-content-end">
                                                <span className="mr-1">{formatMessage({ defaultMessage: 'Sưu tầm' })}</span>
                                                <OverlayTrigger
                                                    overlay={
                                                        <Tooltip>
                                                            {formatMessage({ defaultMessage: 'Thời gian được lưu mã trước khi sử dụng' })}
                                                        </Tooltip>
                                                    }
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" className="bi bi-info-circle" viewBox="0 0 16 16">
                                                        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
                                                        <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0" />
                                                    </svg>
                                                </OverlayTrigger>
                                            </div>
                                            <div className="col-8">
                                                <DatePicker
                                                    value={time?.collectTime}
                                                    character={' - '}
                                                    className="custome__style__input__date w-100"
                                                    format={'HH:mm dd/MM/yyyy'}
                                                    onChange={(value) => {
                                                        if (isActionView) return;

                                                        let error = null;
                                                        if (!!time?.range?.length && !!value) {
                                                            const startTime = dayjs(time?.range?.[0]).startOf('minute').unix();
                                                            const currentTimeCollect = dayjs(value).startOf('minute').unix();

                                                            if (currentTimeCollect >= startTime) {
                                                                error = formatMessage({ defaultMessage: 'Thời gian sưu tầm phải sớm hơn thời gian bắt đầu' })
                                                            }
                                                        }

                                                        setListRangeTime(prev => prev?.map(item => {
                                                            if (item?.id == time?.id) {
                                                                return {
                                                                    ...item,
                                                                    errorCollectTime: error,
                                                                    collectTime: value
                                                                }
                                                            }

                                                            return item
                                                        }))
                                                    }}
                                                    disabled={isActionView}
                                                    onClean={() => {
                                                        if (isActionView) {
                                                            return
                                                        }
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
                                                {!!time?.errorCollectTime && <div className="mt-1 text-danger">{time?.errorCollectTime}</div>}
                                            </div>
                                        </div>
                                    </div>}
                                    {listRangeTime?.length > 1 && !isActionView && <svg
                                        onClick={() => setListRangeTime(prev => prev.filter(item => item?.id != time?.id))}
                                        xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="cursor-pointer text-danger bi bi-x-lg ml-4" viewBox="0 0 16 16"
                                    >
                                        <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z" />
                                    </svg>}
                                </div>
                            })}
                            {listRangeTime?.length < MAX_RANGE_TIME && !isActionView && <div className="mt-2">
                                <span
                                    className="text-primary cursor-pointer"
                                    onClick={() => {
                                        setListRangeTime(prev => prev.concat([{ id: randomString(), range: [], error: 'Vui lòng nhập thời gian' }]))
                                    }}
                                >
                                    {formatMessage({ defaultMessage: '+ Thêm khoảng khuyến mại' })}
                                </span>
                            </div>}
                            {isActionView && listRangeTime?.length > 2 && <div className="d-flex align-items-center">
                                <div style={{ width: 60, height: 1, background: '#ff5629' }} />
                                <span
                                    className="text-primary cursor-pointer mx-2"
                                    onClick={() => {
                                        setIsExpand(prev => !prev);
                                    }}
                                >
                                    {isExpand ? formatMessage({ defaultMessage: 'Thu gọn' }) : formatMessage({ defaultMessage: 'Xem thêm {count} khung giờ' }, { count: listRangeTime?.length - 2 })}
                                </span>
                                <div style={{ width: 60, height: 1, background: '#ff5629' }} />
                            </div>}
                        </div>
                    </div>
                )}

                {isEdit && !isTemplate && <div className="row mb-4 align-items-center">
                    <div className="col-2">
                        <span>{formatMessage({ defaultMessage: 'Trạng thái' })}</span>
                    </div>
                    <div className='col-5'>
                        <span style={{ color: voucherDetail?.color_status }}>{voucherDetail?.text_status}</span>
                    </div>
                </div>}
            </div>
        </Card >
    )
}

export default memo(InfoVoucher);