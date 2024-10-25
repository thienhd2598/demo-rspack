import dayjs from "dayjs";
import { Field, useFormikContext } from "formik";
import React, { memo, useMemo } from "react";
import VideoUpload from "./VideoUpload";
import {
    CardBody, InputVertical
} from "../_metronic/_partials/controls";
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useIntl } from "react-intl";



const VideoLazadaUpload = ({
    type,
    productVideFiles,
    setProductVideFiles,
    setErrorVideo,
    onChooseFile,
    onUpdateType,
    nameUrl = 'video_url',
    // isEdit = false,
}) => {
    const { setFieldValue } = useFormikContext();
    const {formatMessage} = useIntl()
    const TYPE_VIDEO_LZD = [
        {
            label: formatMessage({defaultMessage:'Tải lên video'}),
            value: 'video'
        },
        {
            label: formatMessage({defaultMessage:'Đường dẫn Youtube'}),
            value: 'url'
        },
    ];
    const [isEdit, videoTimeline] = useMemo(
        () => {            
            if (productVideFiles?.length > 0) {
                const videoInfo = productVideFiles[0];                

                const isShowTimeline = !!videoInfo?.isDefault && !!videoInfo?.uploaded_at;
                const timeline = [
                    { isActive: true, isActiveBar: !!videoInfo?.platform_processed_at, event_name: 'Tải lên sàn', updated_time: videoInfo?.uploaded_at },
                    { isActive: !!videoInfo?.platform_processed_at, isActiveBar: !!videoInfo.synced_up_at, event_name: 'Xử lý video trên sàn', platform_message: videoInfo?.platform_message, updated_time: videoInfo?.platform_processed_at },
                    { isActive: !!videoInfo.synced_up_at, isActiveBar: !!videoInfo.synced_up_at, event_name: 'Cập nhật vào sản phẩm', updated_time: videoInfo.synced_up_at },
                ];                

                return [isShowTimeline, timeline];
            }

            return [false, []];
        }, [productVideFiles]
    )

    return (
        <CardBody className='mb-0 '>
            <div className="form-group mb-2">
                <h6 className='mb-0'>Video</h6>
            </div>
            <div
                className="d-flex mb-6"
                style={{ gap: '2rem' }}
                onChange={e => onUpdateType(e.target.value)}
            >
                {
                    TYPE_VIDEO_LZD?.map(_option => {
                        return <label key={`_option--${_option.value}`} className="radio" style={{ gap: 6 }}>
                            <input
                                type="radio"
                                value={_option.value}
                                checked={_option.value === type}
                            />
                            <span></span>
                            {_option.label}
                        </ label>
                    })
                }
            </div>
            {type == 'video' && (
                <>
                    {/* {isEdit && <span className='font-size-xs text-info mb-2' ><em style={{ color: '#019ef7', fontStyle: 'italic' }} >
                        * Định dạng hỗ trợ: MP4, độ phân giải không vượt quá 1280x1280px. Độ dài 10 - 60s.
                    </em></span>} */}
                    <div className="form-group w-100 d-flex align-items-center">
                        <div className='d-flex flex-wrap'>
                            {
                                productVideFiles.map((_file, index) => {
                                    return <VideoUpload
                                        key={`file-pro-${index}`}
                                        channel="lazada"
                                        data={_file}
                                        accept={".mp4"}
                                        setErrorVideo={setErrorVideo}
                                        onRemove={() => {
                                            setProductVideFiles(prev => prev.filter(_ff => _ff.id != _file.id))
                                        }}
                                        onUploadError={(isUploadError) => {
                                            setProductVideFiles(prev => prev.map(_ff => {
                                                if (_ff.id != _file.id) {
                                                    return _ff
                                                }
                                                return {
                                                    ..._ff,
                                                    isUploadError
                                                }
                                            }))
                                        }}
                                        onUploading={(isUploading) => {
                                            setProductVideFiles(prev => prev.map(_ff => {
                                                if (_ff.id != _file.id) {
                                                    return _ff
                                                }
                                                return {
                                                    ..._ff,
                                                    isUploading
                                                }
                                            }))
                                        }}
                                        onUploadSuccess={(dataAsset) => {
                                            setFieldValue('__changed__', true)
                                            setProductVideFiles(prev => prev.map(_ff => {
                                                if (_ff.id == _file.id) {
                                                    return dataAsset
                                                }
                                                return _ff
                                            }))
                                        }}
                                        allowRemove
                                    />
                                })
                            }
                            {
                                productVideFiles.length < 1 && <VideoUpload
                                    accept={".mp4"}
                                    setErrorVideo={setErrorVideo}
                                    onChooseFile={onChooseFile}
                                    channel="lazada"
                                />
                            }
                        </div>
                        <div>
                            {isEdit ? (
                                <ul className='video-lazada-wrapper'>
                                    {videoTimeline?.map(_timeline => (
                                        <li className={`video-lazada ${_timeline.isActive ? 'active' : ''} ${_timeline.isActiveBar ? 'activeBar' : ''}`}>
                                            <div className='video-lazada-block d-flex gap-4 align-items-center'>
                                                <span className='video-lazada-title'>
                                                    {_timeline?.event_name}
                                                    {!!_timeline?.platform_message && (
                                                        <span className="ml-2">
                                                            <OverlayTrigger
                                                                placement="bottom"
                                                                overlay={
                                                                    <Tooltip>
                                                                        {_timeline.platform_message}
                                                                    </Tooltip>
                                                                }
                                                            >
                                                                <i className="fas fa-info-circle" style={{ color: 'red' }}></i>
                                                            </OverlayTrigger>
                                                        </span>
                                                    )}
                                                </span>
                                                {!!_timeline?.updated_time && (
                                                    <span className='video-lazada-time'>{dayjs(_timeline?.updated_time).format('HH:mm DD/MM/YYYY')}</span>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <ul className="text-info" style={{ fontStyle: 'italic' }}>
                                    <li>{formatMessage({defaultMessage:'Định dạng MP4'})}</li>                                    
                                    <li>{formatMessage({defaultMessage:'Tối đa 100MB'})}</li>
                                    {/* <li>{formatMessage({defaultMessage:'Độ phân giải tối thiểu 480-480px'})}</li>                                    
                                    <li>{formatMessage({defaultMessage:'Độ dài tối đa 300s'})}</li> */}
                                </ul>
                            )}
                        </div>
                    </div>
                </>
            )}
            {type == 'url' && (
                <>
                    <Field
                        name={nameUrl}
                        component={InputVertical}
                        placeholder={formatMessage({defaultMessage:"Dán liên kết URL Youtube tại đây"})}
                        customFeedbackLabel={' '}
                    />
                </>
            )}
            {/* <div className="mt-2 fv-plugins-message-container">
                <div className="fv-help-block " ><i className="fv-help-block  flaticon2-warning font-weight-boldest" />&ensp;
                    Chú ý: Video /Đường dẫn Youtube sẽ không được xóa trên sàn Lazada khi bạn thao tác xóa ở phần mềm.
                </div>
            </div> */}
        </CardBody>
    )
};

export default memo(VideoLazadaUpload);