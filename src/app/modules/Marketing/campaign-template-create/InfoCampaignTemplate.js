import React, { Fragment, memo, useMemo, useState } from "react";
import { Card, InputVertical } from "../../../../_metronic/_partials/controls";
import { useIntl } from "react-intl";
import Skeleton from "react-loading-skeleton";
import Select from 'react-select';
import { useMarketingContext } from "../contexts/MarketingContext";
import { Field, useFormikContext } from "formik";
import DateRangePicker from 'rsuite/DateRangePicker';
import { RadioGroup } from "../../../../_metronic/_partials/controls/forms/RadioGroup";
import { CRITERIA, MAX_RANGE_TIME, OPTIONS_TYPE_DISCOUNT, STATUS_SALE } from "../Constants";
import dayjs from "dayjs";
import { randomString } from "../../../../utils";
import { Accordion, useAccordionToggle } from "react-bootstrap";

const CustomToggle = ({ children, eventKey, title }) => {
    const [show, setShow] = useState(true);    
    const decoratedOnClick = useAccordionToggle(eventKey, () => {
        setShow(prev => !prev);
    });

    return (
        <div className="mx-4 d-flex align-items-center justify-content-between pb-4 mt-4" onClick={decoratedOnClick}>
            <strong
                style={{ fontSize: 14, color: '#000' }}
            >
                {title}
            </strong>

            {show ? (
                <span className="cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" class="bi bi-chevron-up" viewBox="0 0 16 16">
                        <path fill-rule="evenodd" d="M7.646 4.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1-.708.708L8 5.707l-5.646 5.647a.5.5 0 0 1-.708-.708z" />
                    </svg>
                </span>
            ) : (
                <span className="cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" class="bi bi-chevron-down" viewBox="0 0 16 16">
                        <path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708" />
                    </svg>
                </span>
            )}
        </div>
    );
};

const InfoCampaignTemplate = ({ listRangeTime, setListRangeTime, setShowWarningPrompt, isEdit = false, isActionView = false, channelDetail = null, saleStatus }) => {
    const { channelCampaign, paramsQuery, queryVariables, campaignItems, storeOptions } = useMarketingContext();
    const { setFieldValue, errors, touched, values } = useFormikContext();
    const { typeCampaign } = queryVariables;
    const { formatMessage } = useIntl();

    const [isExpand, setIsExpand] = useState(false);

    const channel = useMemo(() => {
        return isEdit ? channelDetail : channelCampaign
    }, [isEdit, channelDetail, channelCampaign]);

    const viewInfo = (
        <Fragment>
            {!channel && <div className="row pb-4">
                <div className="col-5">
                    <Skeleton
                        style={{ width: 170, height: 30, borderRadius: 8 }}
                        count={1}
                    />
                </div>
            </div>}
            {!!channel && <div className="row pb-4">
                <div className="col-3">
                    <div className="d-flex">
                        <span className="ml-4">
                            {formatMessage({ defaultMessage: 'Sàn' })}
                        </span>
                        <span style={{ color: 'red' }}>*</span>
                    </div>
                </div>
                <div className='col-3'>
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
            </div>}
            {!paramsQuery ? (
                <div className="row pb-4">
                    <div className="col-4">
                        <Skeleton
                            style={{ width: 170, height: 30, borderRadius: 8 }}
                            count={1}
                        />
                    </div>
                </div>
            ) : (
                <div className="row pb-4 align-items-center">

                    <div className="col-3">
                        <span className="ml-4">
                            {formatMessage({ defaultMessage: 'Gian hàng' })}
                        </span>
                        <span style={{ color: 'red' }}>*</span>
                    </div>
                    <div className='col-3'>
                        <Select
                            id="store"
                            options={storeOptions}
                            onChange={option => setFieldValue('store', `${option.value}`)}
                            value={storeOptions?.find(option => option.value === values.store)}
                            required
                            placeholder="Chọn gian hàng"
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
            )}
            <div className="row  pb-4 align-items-center">
                <div className="col-3">
                    <span className="ml-4">{formatMessage({ defaultMessage: 'Tên chương trình khuyến mại' })}</span>
                    <span style={{ color: 'red' }}>*</span>
                </div>
                <div className='col-5'>
                    <Field
                        name={`name`}
                        component={InputVertical}
                        placeholder="Nhập tên chương trình khuyến mãi"
                        required
                        countChar
                        maxChar={150}
                        value={values.name}
                        onChange={(e) => {
                            setFieldValue('name', e.target.value)
                        }}
                        disabled={isActionView}
                    />
                </div>
            </div>
            <div className="row  pb-4">
                <div className="col-3 ">
                    <span className="ml-4">Thời gian khuyến mại</span>
                    <span style={{ color: 'red' }}>*</span>
                </div>
                <div className='col-4'>
                    {listRangeTime?.slice(0, isActionView && !isExpand ? 2 : listRangeTime?.length)?.map(time => {
                        return <div className="mb-4">
                            <div className="d-flex align-items-center">
                                <DateRangePicker
                                    name='timeValue'
                                    value={time?.range}
                                    character={' - '}
                                    className="custome__style__input__date"
                                    format={'dd/MM/yyyy HH:mm'}
                                    onChange={(value) => {
                                        if (isActionView) return;
                                        const unixTimeDates = listRangeTime
                                            ?.filter(item => item?.range?.length > 0 && item?.id != time?.id)
                                            ?.map(item => item?.range?.map(_range => dayjs(_range).startOf('minute').unix()));


                                        setListRangeTime(prev => prev?.map(item => {
                                            if (item?.id == time?.id) {
                                                let errorMess = null;
                                                if (value?.length) {
                                                    const hasDuplicate = unixTimeDates?.some(date => {
                                                        const startCurrentTime = dayjs(value?.[0]).startOf('minute').unix();
                                                        const endCurrentTime = dayjs(value?.[1]).startOf('minute').unix();

                                                        return !(date[1] < startCurrentTime || endCurrentTime < date[0])
                                                    })

                                                    if (hasDuplicate) errorMess = 'Khung giờ bị trùng lặp'
                                                }

                                                return {
                                                    ...item,
                                                    range: value,
                                                    error: errorMess
                                                }
                                            }

                                            return item
                                        }))
                                        setFieldValue('timeValue', value)
                                    }}
                                    disabled={isActionView}
                                    onClean={() => {
                                        if (isActionView) {
                                            return;
                                        }
                                        setListRangeTime(prev => prev?.map(item => {
                                            if (item?.id == time?.id) {
                                                return {
                                                    ...item,
                                                    error: 'Vui lòng nhập thời gian'
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
                                {listRangeTime?.length > 1 && !isActionView && <svg
                                    onClick={() => setListRangeTime(prev => prev.filter(item => item?.id != time?.id))}
                                    xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="cursor-pointer text-danger bi bi-x-lg ml-4" viewBox="0 0 16 16"
                                >
                                    <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z" />
                                </svg>}
                            </div>
                            {time?.error ? (
                                <div className="text-danger">{time?.error}</div>
                            ) : null}
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
            {isEdit && values?.type == 'other' && <div className="row  pb-4 align-items-center">
                <div className="col-3 ">
                    <span className="ml-4">Loại chương trình</span>
                </div>
                <div className='col-4'>
                    <span>Mặc định</span>
                </div>
            </div>}
            {(typeCampaign != 'other' || values?.type != 'other') && <div className="row  pb-4">
                <div className="col-3 ">
                    <span className=" ml-4">Loại giảm giá</span>
                    <span style={{ color: 'red' }}>*</span>
                </div>
                <div className='col-4 '>
                    <Field
                        name="typeDiscount"
                        component={RadioGroup}
                        curr
                        disabled={paramsQuery?.channel == 'shopee' || isActionView || (isEdit && values?.channel == 'shopee')}
                        customFeedbackLabel={' '}
                        options={OPTIONS_TYPE_DISCOUNT}
                        onChangeOption={() => {
                            if (campaignItems.length > 0) {
                                setShowWarningPrompt(true)
                            } else {
                                if (values[`typeDiscount`] == 1) {
                                    setFieldValue('typeDiscount', 2)
                                } else {
                                    setFieldValue('typeDiscount', 1)
                                }
                            }
                        }}
                    />
                </div>
            </div>}
        </Fragment>
    )

    return (
        <Fragment>
            {isActionView && (
                <Accordion key={`other-pos-card`} defaultActiveKey="other-pos">
                    <Card id={`other-pos`} className="mb-4" style={{ overflow: 'unset' }}>
                        <CustomToggle
                            eventKey={`other-pos`}
                            title={formatMessage({ defaultMessage: 'THÔNG TIN CƠ BẢN' })}
                        />
                        <Accordion.Collapse eventKey={`other-pos`}>
                            {viewInfo}
                        </Accordion.Collapse>
                    </Card>
                </Accordion>
            )}
            {!isActionView && (
                <Card>
                    <div className="d-flex flex-column pb-4 mt-4">
                        <strong
                            style={{ fontSize: 14, color: '#000', marginLeft: '12.5px' }}
                        >
                            {formatMessage({ defaultMessage: 'THÔNG TIN CƠ BẢN' })}
                        </strong>
                    </div>
                    {viewInfo}
                </Card>
            )}
        </Fragment>
    )
}

export default memo(InfoCampaignTemplate);