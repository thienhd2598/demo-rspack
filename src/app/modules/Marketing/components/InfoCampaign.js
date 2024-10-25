import React, { memo, useMemo } from "react";
import { Card, InputVertical } from "../../../../_metronic/_partials/controls";
import { useIntl } from "react-intl";
import Skeleton from "react-loading-skeleton";
import Select from 'react-select';
import { useMarketingContext } from "../contexts/MarketingContext";
import { Field, useFormikContext } from "formik";
import DateRangePicker from 'rsuite/DateRangePicker';
import { RadioGroup } from "../../../../_metronic/_partials/controls/forms/RadioGroup";
import { CRITERIA, OPTIONS_TYPE_DISCOUNT, STATUS_SALE } from "../Constants";

const InfoCampaign = ({ setShowWarningPrompt, isEdit = false, isActionView = false, channelDetail = null, saleStatus }) => {
    const { channelCampaign, paramsQuery, queryVariables, campaignItems, storeOptions } = useMarketingContext();
    const { setFieldValue, errors, touched, values } = useFormikContext();
    const { typeCampaign } = queryVariables;
    const { formatMessage } = useIntl();

    const channel = useMemo(() => {
        return isEdit ? channelDetail : channelCampaign
    }, [isEdit, channelDetail, channelCampaign]);    

    return (
        <Card>
            <div className="d-flex flex-column pb-4 mt-4">
                <strong
                    style={{ fontSize: 14, color: '#000', marginLeft: '12.5px' }}
                >
                    {formatMessage({ defaultMessage: 'THÔNG TIN CƠ BẢN' })}
                </strong>
            </div>
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
            <div className="row  pb-4 align-items-center">
                <div className="col-3 ">
                    <span className="ml-4">Thời gian khuyến mại</span>
                    <span style={{ color: 'red' }}>*</span>
                </div>
                <div className='col-4'>
                    <DateRangePicker
                        name='timeValue'
                        value={values.timeValue}
                        character={' - '}
                        className="custome__style__input__date"
                        format={'dd/MM/yyyy HH:mm'}
                        onChange={(value) => {
                            if (isActionView) {
                                return
                            }
                            setFieldValue('timeValue', value)
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
                    {errors.timeValue ? (
                        <div className="text-danger">{errors.timeValue}</div>
                    ) : null}
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
            {typeCampaign != 'other' && values?.type != 'other' && <div className="row  pb-4">
                <div className="col-3 ">
                    <span className=" ml-4">Loại giảm giá</span>
                    <span style={{ color: 'red' }}>*</span>
                </div>
                <div className='col-4 '>
                    <Field
                        name="typeDiscount"
                        component={RadioGroup}
                        curr
                        // disabled={paramsQuery?.channel == 'shopee' || isActionView || (isEdit && values?.channel == 'shopee')}
                        disabled={isActionView}
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

            {(paramsQuery?.typeCampaign == 'flashsale' || values?.type == 'flashsale') && <div className="row">
                <div className="col-3 ">
                    <span className=" ml-4">Tiêu chí sản phẩm</span>
                </div>
                <div className='col-6'>
                    <table class="w-100" style={{ border: '1px solid #ccc', borderRadius: '4px', padding: '10px' }}>
                        <tr>
                            <td style={{ border: 'none', padding: '10px' }}>
                                {CRITERIA[channel?.code]?.firstCriteria.map(criteria => {
                                    return <p>{criteria}</p>
                                })}
                            </td>
                            <td style={{ border: 'none', padding: '10px' }}>
                                {CRITERIA[channel?.code]?.secondCriteria.map(criteria => {
                                    return <p>{criteria}</p>
                                })}
                            </td>
                        </tr>
                    </table>
                </div>
            </div>}

            {isEdit && <div className="row py-4">
                <div className="col-3">
                    <span className="ml-4">{formatMessage({ defaultMessage: 'Trạng thái' })}</span>
                </div>
                <div className='col-2'>
                    <span style={{ color: STATUS_SALE[saleStatus]?.color }}>
                        {STATUS_SALE[saleStatus]?.label}
                    </span>
                </div>
            </div>}
        </Card>
    )
}

export default memo(InfoCampaign);