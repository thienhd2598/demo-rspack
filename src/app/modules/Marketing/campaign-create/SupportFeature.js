import React, { useMemo, useState } from 'react'
import { Card, CardBody } from '../../../../_metronic/_partials/controls';
import query_mktLoadScheduleFrameVerifyResult from '../../../../graphql/query_mktLoadScheduleFrameVerifyResult';
import mutate_mktVerifyCampaignScheduleFrame from '../../../../graphql/mutate_mktVerifyCampaignScheduleFrame';
import mutate_mktReCreateScheduleFrame from '../../../../graphql/mutate_mktReCreateScheduleFrame';
import mutate_mktSyncCampaignScheduleFrame from '../../../../graphql/mutate_mktSyncCampaignScheduleFrame';
import { useIntl } from 'react-intl';
import { TooltipWrapper } from '../../Finance/payment-reconciliation/common/TooltipWrapper';
import Select from "react-select";
import HoverImage from '../../../../components/HoverImage';
import { useMutation, useQuery } from '@apollo/client';
import { Field, useFormikContext } from 'formik';
import { ReSelectVertical } from '../../../../_metronic/_partials/controls/forms/ReSelectVertical';
import { APPLY_TYPE_FRAME, OPTIONS_FRAME, STATUS_LIST_SCHEDULED_FRAME } from '../../FrameImage/FrameImageHelper';
import ModalFrameImage from '../../FrameImage/dialogs/ModalFrameImage';
import { TICK_SVG, WARNING_SVG } from '../Constants';
import ModalResultCheck from '../dialog/ModalResultCheck';
import { useToasts } from 'react-toast-notifications';
import LoadingDialog from '../../ProductsStore/products-list-draf/dialog/LoadingDialog';
import { useLocation, useHistory } from 'react-router-dom';
import queryString from 'querystring';
import { toAbsoluteUrl } from '../../../../_metronic/_helpers';
import query_get_scheduled_asset_frame_detail from '../../../../graphql/query_get_scheduled_asset_frame_detail';
import dayjs from 'dayjs';


const SupportFeature = ({ type, capaign, id, isActionView = false }) => {
    const { formatMessage } = useIntl()
    const location = useLocation();
    const paramsQuery = queryString.parse(location.search.slice(1, 100000));
    const action = paramsQuery?.action;
    const { addToast } = useToasts()
    const [showFrameImage, setShowFrameImage] = useState(false);
    const [veryfyResult, setVeryfyResult] = useState({
        isOpen: false
    });
    const history = useHistory()
    const { values, setFieldValue } = useFormikContext()
    const [mktVerifyCampaignScheduleFrame, { loading: loadingVerifyCampaignScheduleFrame }] = useMutation(mutate_mktVerifyCampaignScheduleFrame, {
        awaitRefetchQueries: true,
        refetchQueries: ['mktFindCampaign']
    });

    const [mktReCreateScheduleFrame, { loading: loadingMktReCreateScheduleFrame }] = useMutation(mutate_mktReCreateScheduleFrame, {
        awaitRefetchQueries: true,
        refetchQueries: ['mktFindCampaign']
    });

    const [mktSyncCampaignScheduleFrame, { loading: loadingMktSyncCampaignScheduleFrame }] = useMutation(mutate_mktSyncCampaignScheduleFrame, {
        awaitRefetchQueries: true,
        refetchQueries: ['mktFindCampaign']
    });

    const { loading: loadingDetailScheduledFrame, data: dataDetailScheduledFrame } = useQuery(query_get_scheduled_asset_frame_detail, {
        fetchPolicy: 'cache-and-network',
        variables: { id: Number(capaign?.campaignScheduleFrame?.schedule_frame_id) },
        skip: !capaign?.campaignScheduleFrame?.schedule_frame_id
    });

    let currentDate = new Date().getTime();
    const isOther = capaign?.type != 1 && capaign?.type != 2
    const coming_soon = !!(capaign?.start_time * 1000 > currentDate && capaign?.status != 1)
    const happening = !!(capaign?.start_time * 1000 < currentDate && capaign?.end_time * 1000 >= currentDate && capaign?.status != 1)
    const finished = !!(capaign?.end_time * 1000 < currentDate && capaign?.status != 1)
    const statusScheduled = STATUS_LIST_SCHEDULED_FRAME.find(item => item?.status == dataDetailScheduledFrame?.get_scheduled_asset_frame_detail?.status);

    return (
        <>
            <LoadingDialog show={loadingMktReCreateScheduleFrame || loadingMktSyncCampaignScheduleFrame || loadingVerifyCampaignScheduleFrame} />
            {veryfyResult?.isOpen &&
                <ModalResultCheck
                    dateCampaign={{ endTime: capaign?.end_time, startTime: capaign?.start_time }}
                    verified_result={capaign?.campaignScheduleFrame?.verified_result}
                    dateScheduledFrame={{ apply_from_time: dataDetailScheduledFrame?.get_scheduled_asset_frame_detail?.apply_from_time, apply_to_time: dataDetailScheduledFrame?.get_scheduled_asset_frame_detail?.apply_to_time }}
                    campaign_id={veryfyResult?.campaign_id}
                    onHide={() => setVeryfyResult({ isOpen: false })}
                    title={formatMessage({ defaultMessage: 'Kết quả kiểm tra lịch áp khung' })}
                    show={veryfyResult?.isOpen}
                />}
            {!!showFrameImage &&
                <ModalFrameImage
                    currentFrame={values['frame']}
                    show={showFrameImage}
                    onHide={() => setShowFrameImage(false)}
                    onSelect={(frame) => setFieldValue('frame', frame)}
                />}
            <Card>

                <CardBody>
                    <div style={{ background: '#D9D9D980', padding: '10px', borderRadius: '5px' }}>
                        <div className='mb-4' style={{ display: 'grid', gridTemplateColumns: '15% 1fr', alignItems: 'center' }}>
                            <div className='d-flex align-items-center'>
                                <div className='mr-2'>{formatMessage({ defaultMessage: 'Lập lịch áp khung' })}</div>
                                <TooltipWrapper note={formatMessage({ defaultMessage: "Hệ thống sẽ tự động lập lịch áp khung cho các sản phẩm có trong chương trình khuyến mãi." })}>
                                    <i className="fas fa-info-circle fs-14 ml-2"></i>
                                </TooltipWrapper>
                            </div>
                            <div className='d-flex'>
                                <span className="custom switch mx-2" style={{ transform: 'scale(0.8)' }}>
                                    <label>
                                        <input
                                            disabled={(capaign?.status == 2 ? !!capaign?.on_create_schedule_frame : false) || isActionView}
                                            type={'checkbox'}
                                            onChange={async () => {
                                                setFieldValue('on_create_schedule_frame', !values['on_create_schedule_frame'])
                                            }}
                                            style={{ background: '#F7F7FA', border: 'none' }}
                                            checked={!!values['on_create_schedule_frame']}
                                        />
                                        <span></span>
                                    </label>
                                </span>
                            </div>
                        </div>
                        {capaign?.status == 2 && !!capaign?.on_create_schedule_frame && values['on_create_schedule_frame'] && (
                            <div className='mb-4' style={{ display: 'grid', gridTemplateColumns: '15% 1fr', alignItems: 'center' }}>
                                <div className='d-flex align-items-center'>
                                    <div className='mr-2'>{formatMessage({ defaultMessage: 'Tên lịch' })}</div>
                                </div>
                                {!capaign?.campaignScheduleFrame?.schedule_frame_id ? (
                                    <div className='col-6 d-flex align-items-center'>
                                        <TooltipWrapper note="Lập lịch áp khung lỗi. Nhấn thử lại để lập lại lịch.">
                                            <img className='mx-2' src={toAbsoluteUrl("/media/warningsvg.svg")} alt=""></img>
                                        </TooltipWrapper>

                                        <span className="mx-2" onClick={async () => {
                                            const { data } = await mktReCreateScheduleFrame({ variables: { campaign_id: capaign?.id } })
                                            if (data?.mktReCreateScheduleFrame?.success) {
                                                addToast(data?.mktReCreateScheduleFrame?.message, { appearance: 'success' })
                                            } else {
                                                addToast(data?.mktReCreateScheduleFrame?.message, { appearance: 'error' })
                                            }
                                        }} style={{ cursor: 'pointer', color: 'blue' }}>Thử lại</span>
                                    </div>
                                ) : (
                                    <div className='col-6 d-flex align-items-center'>
                                        <span style={{ cursor: 'pointer' }} onClick={() => history.push(`/frame-image/scheduled-frame/${capaign?.campaignScheduleFrame?.schedule_frame_id}`)}
                                            className="text-primary">{dataDetailScheduledFrame?.get_scheduled_asset_frame_detail?.title}</span>
                                        <div className='py-1 px-1 mx-2' style={{ fontSize: '12px', background: statusScheduled?.color, borderRadius: 4 }}>
                                            <span className='text-white'>
                                                {statusScheduled?.title}
                                            </span>
                                        </div>
                                    </div>
                                )}

                            </div>
                        )}
                        {!!values['on_create_schedule_frame'] && (
                            <>
                                <div className='d-flex'>
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                        <div className='mb-4' style={{ display: 'grid', gridTemplateColumns: '32% 1fr', alignItems: 'center' }}>
                                            <div className='mr-2'>{formatMessage({ defaultMessage: 'Khung mẫu' })}</div>
                                            {capaign?.status == 2 && !!capaign?.on_create_schedule_frame ? (
                                                <div>{values['frame']?.name}</div>
                                            ) : (
                                                <div onClick={() => {
                                                    setShowFrameImage(true)
                                                }} className='text-primary' style={{ cursor: 'pointer' }}>{formatMessage({ defaultMessage: 'Chọn khung mẫu' })}</div>
                                            )}

                                        </div>
                                        <div className='mb-4' style={{ display: 'grid', gridTemplateColumns: '32% 1fr', alignItems: 'center' }}>
                                            <div className='mr-2'>{formatMessage({ defaultMessage: 'Loại ảnh sản phẩm' })}</div>

                                            <div style={{ padding: 0, width: '326px' }}>
                                                <Field
                                                    name="apply_type"
                                                    component={ReSelectVertical}
                                                    isDisabled={capaign?.status == 2 ? !!capaign?.on_create_schedule_frame : false}
                                                    onChange={() => {
                                                        setFieldValue('__changed__', true)
                                                    }}
                                                    isFormGroup={false}
                                                    required
                                                    placeholder={formatMessage({ defaultMessage: 'Chọn loại ảnh sản phẩm' })}
                                                    label={""}
                                                    customFeedbackLabel={' '}
                                                    options={APPLY_TYPE_FRAME}
                                                    isClearable={false}
                                                />
                                            </div>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '32% 1fr', alignItems: 'center' }}>
                                            <div className='mr-2'>{formatMessage({ defaultMessage: 'Hình thức áp dụng' })}</div>
                                            <div style={{ padding: 0, width: '326px' }}>
                                                <Field
                                                    name="option"
                                                    isDisabled={capaign?.status == 2 ? !!capaign?.on_create_schedule_frame : false}
                                                    component={ReSelectVertical}
                                                    onChange={() => {
                                                        setFieldValue('__changed__', true)
                                                    }}
                                                    isFormGroup={false}
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
                                    <div style={{ flex: 1 }}>
                                        {!!values['frame']?.url && (
                                            <HoverImage
                                                styles={{ borderRadius: '4px', border: '1px solid #d9d9d9', cursor: 'pointer', marginRight: 10 }}
                                                size={{ width: 320, height: 320 }}
                                                defaultSize={{ height: 150 }}
                                                url={values['frame']?.url || 'https://cf.shopee.vn/file/sg-11134201-7rd6z-lw2s24y0zs0l8a_tn'}
                                            />
                                        )}

                                    </div>
                                </div>

                                <div className='mt-8' style={{ display: 'grid', gridTemplateColumns: '15% 1fr', alignItems: 'center' }}>
                                    <div className='mr-2'>{formatMessage({ defaultMessage: 'Áp khung trước CTKM' })}</div>

                                    <div className='d-flex align-items-center'>
                                        <div style={{ width: '100px' }} className="ml-2 mr-0 pl-2 pr-0 p-0">
                                            <Field
                                                isDisabled={capaign?.status == 2 ? !!capaign?.on_create_schedule_frame : false}
                                                name="day"
                                                component={ReSelectVertical}
                                                options={[...Array(31)]?.fill(0).map((_, i) => ({ value: i, label: i < 10 ? `0${i}` : i }))}
                                                isFormGroup={false}
                                                required
                                                placeholder={formatMessage({ defaultMessage: '00' })}
                                                label={""}
                                                customFeedbackLabel={' '}
                                                isClearable={false}
                                            />
                                        </div>
                                        <div className='mr-3'>ngày</div>
                                        <div style={{ width: '100px' }} className="m-0 p-0">
                                            <Field
                                                name="hour"
                                                component={ReSelectVertical}
                                                options={[...Array(25)]?.fill(0).map((_, i) => ({ value: i, label: i < 10 ? `0${i}` : i }))}
                                                isFormGroup={false}
                                                required
                                                placeholder={formatMessage({ defaultMessage: '00' })}
                                                label={""}
                                                isDisabled={capaign?.status == 2 ? !!capaign?.on_create_schedule_frame : false}
                                                customFeedbackLabel={' '}
                                                isClearable={false}
                                            />
                                        </div>

                                        <div className='mr-3'>giờ</div>
                                        <div style={{ width: '100px' }} className="m-0 p-0">
                                            <Field
                                                name="minute"
                                                component={ReSelectVertical}
                                                options={[...Array(61)]?.fill(0).map((_, i) => ({ value: i, label: i < 10 ? `0${i}` : i }))}
                                                isFormGroup={false}
                                                required
                                                isDisabled={capaign?.status == 2 ? !!capaign?.on_create_schedule_frame : false}
                                                placeholder={formatMessage({ defaultMessage: '00' })}
                                                label={""}
                                                customFeedbackLabel={' '}
                                                isClearable={false}
                                            />
                                        </div>

                                        <div className='mr-3'>phút</div>
                                        <div style={{ width: '100px' }} className="m-0 p-0">
                                            <Field
                                                component={ReSelectVertical}
                                                name="second"
                                                isDisabled={capaign?.status == 2 ? !!capaign?.on_create_schedule_frame : false}
                                                options={[...Array(61)]?.fill(0).map((_, i) => ({ value: i, label: i < 10 ? `0${i}` : i }))}
                                                isFormGroup={false}
                                                required
                                                placeholder={formatMessage({ defaultMessage: '00' })}
                                                label={""}
                                                customFeedbackLabel={' '}
                                                isClearable={false}
                                            />
                                        </div>

                                        <div className='mr-3'>giây</div>
                                    </div>
                                </div>
                                {capaign?.status == 2 && capaign?.campaignScheduleFrame?.schedule_frame_id && !!capaign?.on_create_schedule_frame && values['on_create_schedule_frame'] && (
                                    <div className='mb-4 mt-4' style={{ display: 'grid', gridTemplateColumns: '15% 1fr', alignItems: 'center' }}>
                                        <div className='d-flex align-items-center'>
                                            <div className='mr-2'>{formatMessage({ defaultMessage: 'Kiểm tra lịch' })}</div>
                                        </div>
                                        <div className='col-6 d-flex align-items-center'>
                                            {(!!capaign?.campaignScheduleFrame?.verified_result || (!capaign?.campaignScheduleFrame?.verified_result && !capaign?.campaignScheduleFrame?.last_verified_at)) ? (
                                                <>
                                                    <TooltipWrapper note='Số lượng sản phẩm trong lịch áp khung đã khớp với chương trình khuyến mãi.'>
                                                        {TICK_SVG}
                                                    </TooltipWrapper>
                                                    <span className="ml-4 text-primary">{!!capaign?.campaignScheduleFrame?.last_verified_at ? dayjs(capaign?.campaignScheduleFrame?.last_verified_at).format('DD/MM/YYYY HH:mm') : '--'}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <TooltipWrapper note='Số lượng sản phẩm trong lịch áp khung chưa khớp với chương trình khuyến mãi.'>
                                                        <img className='mx-2' src={toAbsoluteUrl("/media/warningsvg.svg")} alt=""></img>
                                                    </TooltipWrapper>
                                                    <span className="ml-4 text-primary">{!!capaign?.campaignScheduleFrame?.last_verified_at ? dayjs(capaign?.campaignScheduleFrame?.last_verified_at).format('DD/MM/YYYY HH:mm') : '--'}</span>
                                                    <span className="ml-4" style={{ color: 'blue', cursor: 'pointer' }} onClick={() => setVeryfyResult({ isOpen: true, campaign_id: id })} >Xem chi tiết</span>
                                                </>
                                            )}

                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {capaign?.status == 2 && capaign?.campaignScheduleFrame?.schedule_frame_id && !!capaign?.on_create_schedule_frame && !finished && !!values['on_create_schedule_frame'] && (
                            <div className='mb-4 mt-4' style={{ display: 'flex', alignItems: 'center' }}>
                                <button disabled={false}
                                    onClick={async () => {
                                        try {
                                            const { data } = await mktVerifyCampaignScheduleFrame({
                                                variables: {
                                                    campaign_id: +id
                                                }
                                            })
                                            if (data?.mktVerifyCampaignScheduleFrame?.success) {
                                                setVeryfyResult({
                                                    isOpen: true,
                                                    campaign_id: id,
                                                })
                                            } else {

                                                addToast(data?.mktVerifyCampaignScheduleFrame?.message || 'Thất bại', { appearance: 'error' })
                                            }
                                        } catch (err) {

                                        } finally {
                                            setVeryfyResult({
                                                isOpen: true,
                                                campaign_id: id,
                                            })
                                        }


                                    }}
                                    className="btn btn-primary mr-2">
                                    {formatMessage({ defaultMessage: "Kiểm tra" })}
                                    <TooltipWrapper note={formatMessage({ defaultMessage: 'Hệ thống sẽ thực hiện kiểm tra dữ liệu sản phẩm trong lịch áp khung và chương trình khuyến mãi.' })}>
                                        <i style={{ color: 'white' }} className="fas fa-info-circle fs-14 ml-2"></i>
                                    </TooltipWrapper>
                                </button>
                                {!capaign?.campaignScheduleFrame?.verified_result && !!capaign?.campaignScheduleFrame?.last_verified_at && (
                                    <button onClick={async () => {
                                        const { data } = await mktSyncCampaignScheduleFrame({
                                            variables: {
                                                campaign_id: +id
                                            }
                                        })
                                        if (data?.mktSyncCampaignScheduleFrame?.success) {
                                            addToast(data?.mktSyncCampaignScheduleFrame?.message || 'Thành công', { appearance: 'success' })
                                        } else {
                                            addToast(data?.mktSyncCampaignScheduleFrame?.message || 'Thất bại', { appearance: 'error' })
                                        }
                                    }} disabled={loadingVerifyCampaignScheduleFrame} className="btn btn-primary mx-2">
                                        {formatMessage({ defaultMessage: "Cập nhật lịch" })}
                                        <TooltipWrapper note={formatMessage({ defaultMessage: 'Hệ thống sẽ thực hiện đồng nhất dữ liệu sản phẩm ở lịch áp khung với chương trình khuyến mãi' })}>
                                            <i style={{ color: 'white' }} className="fas fa-info-circle fs-14 ml-2"></i>
                                        </TooltipWrapper>
                                    </button>
                                )}

                            </div>
                        )}
                    </div>


                </CardBody>
            </Card>

        </>
    )
}

export default SupportFeature