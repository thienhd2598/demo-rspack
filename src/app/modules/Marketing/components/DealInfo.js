import React, { memo, useMemo, useState } from "react";
import { useIntl } from "react-intl";
import Select from 'react-select';
import DateRangePicker from 'rsuite/DateRangePicker';
import DatePicker from 'rsuite/DatePicker';
import { Card, InputVertical, InputVerticalWithIncrease } from "../../../../_metronic/_partials/controls";
import { RadioGroup } from "../../../../_metronic/_partials/controls/forms/RadioGroup";
import { Field, useFormikContext } from "formik";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { useDealContext } from "../contexts/DealContext";
import dayjs from "dayjs";
import { randomString } from "../../../../utils";
import { MAX_RANGE_TIME } from "../Constants";

const DealInfo = ({
    loading = false, isTemplate = false, isEdit = false, isActionView = false,
    channelDetail, timeDeal, setTimeDeal, collectTime, setCollectTime,
    dealDetail = null, listRangeTime, setListRangeTime,
}) => {
    const { formatMessage } = useIntl();
    const { setFieldValue, errors, touched, values } = useFormikContext();
    const { storeOptions, channelDeal, paramsQuery, setProductsDeal, setCurrentStore } = useDealContext();
    const [isExpand, setIsExpand] = useState(false);

    const channel = useMemo(() => {
        return isEdit ? channelDetail : channelDeal
    }, [isEdit, channelDetail, channelDeal]);

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
                                setProductsDeal([]);
                                setCurrentStore(option?.value);                                
                                setFieldValue('store', `${option.value}`);
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
                        <span>{formatMessage({ defaultMessage: 'Tên chương trình' })}</span>
                        <span className="text-danger">*</span>
                    </div>
                    <div className='col-6'>
                        <Field
                            name={`name`}
                            component={InputVertical}                            
                            placeholder={formatMessage({ defaultMessage: "Nhập tên chương trình" })}
                            required
                            countChar
                            maxChar={isTemplate ? 12 : 25}
                            maxLength={isTemplate ? 12 : 25}
                            disabled={isActionView || (isEdit && values?.text_status != 'Sắp diễn ra' && values?.status == 2 && !!dealDetail?.ref_id)}
                        />
                    </div>
                </div>
                <div className="row mb-4 align-items-center">
                    <div className="col-2">
                        <span>{formatMessage({ defaultMessage: 'Điều kiện nhận quà' })}</span>
                        <span className="text-danger">*</span>
                    </div>
                    <div className='col-6 d-flex align-items-center'>
                        <div>{formatMessage({ defaultMessage: 'Mua' })}</div>
                        <div className="mx-2" style={{ maxWidth: '25%' }}>
                            <Field
                                name={'purchase_min_spend'}
                                component={InputVertical}
                                disabled={isActionView || (isEdit && values?.text_status != 'Sắp diễn ra' && values?.status == 2 && !!dealDetail?.ref_id)}
                                type='number'
                                placeholder=""
                                style={{ padding: '0 10px' }}
                                addOnRight={'đ'}
                            />
                        </div>
                        <div>{formatMessage({ defaultMessage: 'sản phẩm để được tặng' })}</div>
                        <div className="mx-2 text-center" style={{ maxWidth: '25%' }}>
                            <Field
                                name={'gift_num'}
                                component={InputVerticalWithIncrease}
                                disabled={isActionView || (isEdit && values?.text_status != 'Sắp diễn ra' && values?.status == 2 && !!dealDetail?.ref_id)}
                                label={''}
                                required={false}
                                customFeedbackLabel={' '}
                                cols={['', 'col-12']}
                                countChar
                                maxChar={'255'}
                                rows={4}
                            />
                        </div>
                        <div>{formatMessage({ defaultMessage: 'quà tặng' })}</div>
                    </div>
                </div>
                {!isTemplate && (
                    <div className="row mb-4 align-items-center">
                        <div className="col-2">
                            <span>{formatMessage({ defaultMessage: 'Thời gian diễn ra' })}</span>
                            <span className="text-danger">*</span>
                        </div>
                        <div className='col-7'>
                            <div className="row">
                                <div className="col-6">
                                    <DateRangePicker
                                        value={timeDeal?.values}
                                        character={' - '}
                                        className="custome__style__input__date"
                                        format={'HH:mm dd/MM/yyyy'}
                                        onChange={(valuesDate) => {
                                            if (isActionView || (isEdit && values?.text_status != 'Sắp diễn ra' && values?.status == 2 && !!dealDetail?.ref_id)) return;

                                            if (!valuesDate) {
                                                setTimeDeal(prev => ({ ...prev, error: formatMessage({ defaultMessage: 'Vui lòng chọn thời gian sử dụng' }), values: [] }))
                                                return;
                                            }

                                            let error = null;
                                            const now = dayjs().startOf('minute').unix();
                                            const [startTime, endTime] = [dayjs(valuesDate[0]).startOf('minute').unix(), dayjs(valuesDate[1]).startOf('minute').unix()];

                                            if (startTime >= endTime) {
                                                error = formatMessage({ defaultMessage: 'Thời gian kết thúc phải lớn hơn thời gian bắt đầu' })
                                            } else if (startTime <= now) {
                                                error = formatMessage({ defaultMessage: 'Thời gian bắt đầu phải lớn hơn thời gian hiện tại' })
                                            }
                                            // else if (endTime >= startTime + 86400 * 90) {
                                            //     error = formatMessage({ defaultMessage: 'Thời gian kết thúc không thể vượt quá 3 tháng sau thời gian bắt đầu' })
                                            // }

                                            setTimeDeal(prev => ({ ...prev, error, values: valuesDate }));
                                        }}
                                        disabled={isActionView || (isEdit && values?.text_status != 'Sắp diễn ra' && values?.status == 2 && !!dealDetail?.ref_id)}
                                        onClean={() => {
                                            if (isActionView || (isEdit && values?.text_status != 'Sắp diễn ra' && values?.status == 2 && !!dealDetail?.ref_id)) {
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
                                    {!!timeDeal?.error && <div className="mt-1 text-danger">{timeDeal?.error}</div>}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {isTemplate && (
                    <div className="row mb-4 align-items-start">
                        <div className="col-2">
                            <span>{formatMessage({ defaultMessage: 'Thời gian diễn ra' })}</span>
                            <span className="text-danger">*</span>
                        </div>
                        <div className='col-6'>
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
                                                            } else {
                                                                const hasDuplicate = unixTimeDates?.some(date => {
                                                                    const startCurrentTime = dayjs(values?.[0]).startOf('minute').unix();
                                                                    const endCurrentTime = dayjs(values?.[1]).startOf('minute').unix();

                                                                    return !(date[1] < startCurrentTime || endCurrentTime < date[0])
                                                                })

                                                                if (hasDuplicate) errorMess = 'Khung giờ bị trùng lặp'
                                                            }
                                                        }


                                                        return {
                                                            ...item,
                                                            range: values,
                                                            error: errorMess,                                                            
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
                        <span style={{ color: dealDetail?.color_status }}>{dealDetail?.text_status}</span>
                    </div>
                </div>}
            </div>
        </Card >
    )
}

export default memo(DealInfo);