import React, { Fragment, memo, useCallback, useMemo, useState } from "react";
import { Card, CardBody, CardHeader, InputVertical } from "../../../../_metronic/_partials/controls";
import { useIntl } from "react-intl";
import { ReSelectVertical } from "../../../../_metronic/_partials/controls/forms/ReSelectVertical";
import { useFormikContext, Field } from "formik";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import DateRangePicker from "rsuite/DateRangePicker";
import dayjs from "dayjs";
import { useParams } from 'react-router-dom';
import mutate_scheduledAssetFrameCheckDuplicate from "../../../../graphql/mutate_scheduledAssetFrameCheckDuplicate";
import client from "../../../../apollo";
import { APPLY_TYPE_FRAME, OPTIONS_FRAME, STATUS_LIST_SCHEDULED_FRAME } from "../FrameImageHelper";
import ModalFrameImage from "../dialogs/ModalFrameImage";
import HoverImage from "../../../../components/HoverImage";
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { useToasts } from "react-toast-notifications";

export const queryCheckExistScheduledName = async (value, id) => {
    let { data } = await client.mutate({
        mutation: mutate_scheduledAssetFrameCheckDuplicate,
        fetchPolicy: 'network-only',
        variables: {
            title: value,
            id: Number(id)
        }
    })
    return data?.scheduledAssetFrameCheckDuplicate?.count_exists > 0;
}

const ScheduledFrameInfo = ({ optionsStore, loadingDetailScheduledFrame }) => {
    const { id } = useParams();
    const { setFieldValue, errors, values } = useFormikContext();
    const { addToast } = useToasts();
    const { formatMessage } = useIntl();
    const [showFrameImage, setShowFrameImage] = useState(false);
    const [loading, setLoading] = useState(false);

    const disabledFutureDate = useCallback((date, selectDate, selectedDone, target) => {
        const now = dayjs(date).startOf('minute').unix();
        const minuteStartNow = dayjs().startOf('minute').unix();
        
        if (now == minuteStartNow && target == 'TOOLBAR_BUTTON_OK') return true;
        return now < minuteStartNow;
    }, []);

    const statusScheduled = useMemo(() => {
        return STATUS_LIST_SCHEDULED_FRAME.find(item => item?.status == values?.status)
    }, [values?.status]);    

    return (
        <Fragment>
            {!!showFrameImage && <ModalFrameImage
                currentFrame={values['frame']}
                show={showFrameImage}
                onHide={() => setShowFrameImage(false)}
                onSelect={(frame) => setFieldValue('frame', frame)}
            />}
            <Card className="mb-6">
                <CardHeader
                    title={<div className="d-flex align-items-center">
                        <span>{formatMessage({ defaultMessage: 'Thông tin' })}</span>
                        {!!values?.status && (
                            <div
                                className="ml-8 px-2 py-1 d-flex align-items-center justify-content-center"
                                style={{ borderRadius: 4, background: statusScheduled?.color }}
                            >
                                <span className="text-white fs-12">{statusScheduled?.title}</span>
                            </div>
                        )}
                    </div>}
                />
                <CardBody>
                    <div style={{ position: 'relative' }}>
                        {loadingDetailScheduledFrame && <div style={{ position: 'absolute', top: '50%', left: '50%', zIndex: 99 }}>
                            <span className="spinner spinner-primary" />
                        </div>}
                        <div className="row" style={loadingDetailScheduledFrame ? { opacity: 0.4 } : {}}>
                            <div className="col-5">
                                <div className="form-group row">
                                    <label className="col-sm-4 col-form-label text-right">
                                        <span>{formatMessage({ defaultMessage: 'Tên lịch' })}</span>
                                        <span className="ml-1 text-danger">*</span>
                                    </label>
                                    <div className="col-sm-8 d-flex flex-column" style={{ position: 'relative' }}>
                                        <Field
                                            name="name"
                                            component={InputVertical}
                                            onChangeCapture={e => {
                                                setFieldValue('name_boolean', { name: false })
                                            }}
                                            disabled={values?.status == 2 || values?.status == 3}
                                            onBlurChange={async (value) => {
                                                const valueErrorForm = errors?.['name'];
                                                if (!!valueErrorForm) return;

                                                setLoading(true);
                                                const checkExistUsername = await queryCheckExistScheduledName(value, id);
                                                setLoading(false);
                                                if (checkExistUsername) {
                                                    setFieldValue('name_boolean', { name: true })
                                                } else {
                                                    setFieldValue('name_boolean', { name: false })
                                                }

                                            }}
                                            loading={loading}
                                            required
                                            maxChar={120}
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
                                    <div className="col-sm-8 d-flex flex-column" style={{ position: 'relative', cursor: 'not-allowed' }}>
                                        <Field
                                            name="store"
                                            component={ReSelectVertical}
                                            onChange={() => {
                                                setFieldValue('__changed__', true)
                                            }}
                                            required
                                            isDisabled={true}
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
                                        />
                                    </div>
                                </div>
                                <div className="row">
                                    <label className="col-sm-4 col-form-label text-right">
                                        <span>{formatMessage({ defaultMessage: 'Thời gian áp khung' })}</span>
                                        <OverlayTrigger
                                            overlay={
                                                <Tooltip>
                                                    {formatMessage({ defaultMessage: 'Chọn khoảng thời gian bắt đầu áp khung và kết thúc áp khung ảnh sản phẩm' })}
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
                                    <div className="col-sm-8 d-flex flex-column" style={{ position: 'relative' }}>
                                        <DateRangePicker
                                            className='date-reserve-options w-100'
                                            format={"dd/MM/yyyy HH:mm:ss"}
                                            placeholder={formatMessage({ defaultMessage: 'Chọn thời gian áp khung' })}
                                            ranges={[]}
                                            placement={"bottomStart"}
                                            disabled={values?.status == 2 || values?.status == 3}                                            
                                            shouldDisableDate={disabledFutureDate}
                                            value={!!values['time'] ? [
                                                new Date(values['time'][0] * 1000),
                                                new Date(values['time'][1] * 1000),
                                            ] : null}
                                            onChange={values => {
                                                if (values?.status == 2 || values?.status == 3) return;
                                                if (!!values) {
                                                    const [from, to] = [dayjs(values[0]).unix(), dayjs(values[1]).unix()];

                                                    if (from + 3600 > to) {
                                                        addToast(formatMessage({ defaultMessage: 'Thời gian áp khung phải diễn ra tối thiểu 1h' }), { appearance: "error" });
                                                        return;
                                                    }

                                                    setFieldValue(`time`, values?.map(date => dayjs(date).unix()));
                                                } else {
                                                    setFieldValue(`time`, undefined);
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
                                    </div>
                                </div>
                            </div>
                            <div className="col-5">
                                <div className="row d-flex align-items-center mb-6">
                                    <label className="col-sm-4 col-form-label text-right">
                                        <span>{formatMessage({ defaultMessage: 'Khung mẫu' })}</span>
                                    </label>
                                    <div className="col-sm-8 d-flex flex-column" style={{ position: 'relative' }}>
                                        {values?.status == 1 ? (
                                            <span role="button" className="text-primary" onClick={() => setShowFrameImage(true)}>
                                                {formatMessage({ defaultMessage: 'Chọn khung mẫu' })}
                                            </span>
                                        ) : (
                                            <span className="font-weight-bolder">{values?.frame?.name || '--'}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="row">
                                    <label className="col-sm-4 col-form-label text-right">
                                        <span>{formatMessage({ defaultMessage: 'Loại ảnh sản phẩm' })}</span>
                                    </label>
                                    <div className="col-sm-8 d-flex flex-column" style={{ position: 'relative' }}>
                                        <Field
                                            name="apply_type"
                                            component={ReSelectVertical}
                                            onChange={() => {
                                                setFieldValue('__changed__', true)
                                            }}
                                            isDisabled={values?.status == 2 || values?.status == 3}
                                            required
                                            placeholder={formatMessage({ defaultMessage: 'Chọn loại ảnh sản phẩm' })}
                                            label={""}
                                            customFeedbackLabel={' '}
                                            options={APPLY_TYPE_FRAME}
                                            isClearable={false}
                                        />
                                    </div>
                                </div>
                                <div className="row">
                                    <label className="col-sm-4 col-form-label text-right">
                                        <span>{formatMessage({ defaultMessage: 'Hình thức áp khung' })}</span>
                                    </label>
                                    <div className="col-sm-8 d-flex flex-column" style={{ position: 'relative' }}>
                                        <Field
                                            name="option"
                                            component={ReSelectVertical}
                                            onChange={() => {
                                                setFieldValue('__changed__', true)
                                            }}
                                            isDisabled={values?.status == 2 || values?.status == 3}
                                            required
                                            placeholder={formatMessage({ defaultMessage: 'Chọn hình thức áp khung' })}
                                            label={""}
                                            customFeedbackLabel={' '}
                                            options={OPTIONS_FRAME}
                                            isClearable={false}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="col-2">
                                <div className="d-flex justify-content-end">
                                    {loadingDetailScheduledFrame && (
                                        <Skeleton
                                            style={{
                                                width: 140, marginRight: 4, height: 140,
                                                borderRadius: 8, minWidth: 140
                                            }}
                                            count={1}
                                        />
                                    )}
                                    {!loadingDetailScheduledFrame && !!values['frame']?.url && (
                                        <HoverImage
                                            styles={{ borderRadius: '4px', border: '1px solid #d9d9d9', cursor: 'pointer', textAlign: 'right' }}
                                            size={{ width: 320, height: 320 }}
                                            defaultSize={{ width: '70%' }}
                                            placement={'left'}
                                            url={values['frame']?.url}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </CardBody>
            </Card>
        </Fragment>
    )
}

export default memo(ScheduledFrameInfo);