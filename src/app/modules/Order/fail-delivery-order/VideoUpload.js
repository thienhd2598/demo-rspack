import React, { memo, useEffect, useMemo, useRef, useState } from 'react'
import axios from "axios";
import _ from 'lodash'
import { getVideoDuration, randomString } from '../../../../utils';
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import { toAbsoluteUrl } from '../../../../_metronic/_helpers';

const CancelToken = axios.CancelToken;
export default memo(({
    customeStyle,
    data, allowRemove, accept, onChooseFile, onRemove, onUploadSuccess,
    setErrorVideo, onUploading, onUploadError,
    setFieldValue
}) => {
    const validateVideoFile = ({ size, duration }) => {
        if (duration > 120) {
            return 'Độ dài video tối đa 2 phút';
        }

        if (size > 60 * 1024 * 1024) {
            return 'Dung lượng video chưa đúng, dung lượng tối đa là 60Mb';
        }

        return null;
    }
    const user = useSelector((state) => state.auth.user);
    const [uploading, setUploading] = useState(false)
    const refInput = useRef()
    const vidref = useRef(null);
    const [isPause, setIsPause] = useState(true)
    const { file, source, id } = data || {}
    const refCancel = useRef();
    const [error, setError] = useState()
    const { formatMessage } = useIntl()
    console.log('file', file)
    const toggleFullScreenMode = () => {
        if (!document.fullscreenElement) {
            setIsPause(false)
            vidref.current.requestFullscreen()
            vidref.current.play()
        }
        if (document.fullscreenElement) {
            document.exitFullscreen()
            setIsPause(true)
        }

    }
    useMemo(() => {
        if (!!file) {
            setUploading(true)
        }
    }, [file]);

    useEffect(() => {
        if (!!id) {
            !!setFieldValue && setFieldValue(`upload-video-error-${id}`, !!error)
        }
    }, [error, id])

    useEffect(() => {
        if (!!source) {
            fetch(source)
                .then((result) => result.blob())
                .then(async data => {
                    if (!!data) {
                        let { width, height, duration } = await getVideoDuration(data);

                        let error = validateVideoFile({ width, height, duration, size: data.size })
                        !!onUploading && onUploading(false);
                        if (!!error) {
                            onUploadError(true);
                            setUploading(false);
                            setError(error)
                            return
                        }
                    }
                }).catch(() => !!onUploading && onUploading(false))
        }
    }, []);

    useMemo(async () => {
        let cancel = null;
        if (uploading) {
            try {
                if (!!file?.name && !file?.name?.endsWith('.mp4') && !file?.name?.endsWith('.MP4')) {
                    setErrorVideo(formatMessage({ defaultMessage: "Định dạng hỗ trợ: MP4" }));
                    setError(formatMessage({ defaultMessage: "Định dạng hỗ trợ: MP4" }))
                    setUploading(false)
                    return
                }

                let { width, height, duration } = await getVideoDuration(file)

                let error = validateVideoFile({ width, height, duration, size: file.size })
                if (!!error) {
                    !!onUploadError && onUploadError(true);
                    setErrorVideo(error);
                    setError(error)
                    setUploading(false)
                    return
                }
            } catch (error) {

            }

            try {
                !!onUploading && onUploading(true)

                await axios.post(process.env.REACT_APP_URL_FILE_UPLOAD_VIDEO, {
                    filename: file?.name
                }, {
                    isSubUser: user?.is_subuser,
                    cancelToken: new CancelToken(function executor(c) {
                        cancel = c;
                    }),
                }).then(async response => {                    
                    const url = response?.data?.data?.url

                    console.log(`URL: `, url);
                    if (response?.data?.data?.uploadUrl) {
                        fetch(response?.data?.data?.uploadUrl, {
                            method: 'PUT',
                            body: file
                        }).then(data => {
                            if (data?.ok) {
                                setError(null)
                                requestAnimationFrame(() => { !!onUploadSuccess && onUploadSuccess({ source: url, file: { ...file }, id: randomString(12) }) })
                            }
                        }).catch(() => {
                            setError(formatMessage({ defaultMessage: 'Gặp lỗi trong quá trình tải lên' }))
                        })
                    }
                }).catch(() => {
                    setError(formatMessage({ defaultMessage: 'Gặp lỗi trong quá trình tải lên' }))
                })

                setUploading(false)
            } catch (error) {
                console.log('error', error)
                setUploading(false)
                setError(formatMessage({ defaultMessage: 'Gặp lỗi trong quá trình tải lên' }))
            }
        }
        return () => {
            !!cancel && cancel('unmount')
        }
    }, [uploading, file, user])

    const view = (
        <div className="image-input image-input-video mr-4" id="kt_image_4"
            style={{ ...(customeStyle ? customeStyle : { width: 46, height: 46 }), cursor: 'pointer', backgroundColor: '#F7F7FA', border: !!error ? '1px solid #f14336' : '1px dashed #D9D9D9' }}
            onClick={e => !!refInput.current && refInput.current.click()}>
            {
                !source && !file && <div style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                }}>
                    <i className='flaticon2-add-1' style={{ fontSize: '12px', marginBottom: 4 }} ></i>
                    <span style={{ fontSize: '8px', textAlign: 'center' }}>{formatMessage({ defaultMessage: 'Tải video lên' })}</span>
                </div>
            }

            {
                !!source &&
                <OverlayTrigger
                    placement='bottom'
                    show={true}
                    overlay={
                        <Tooltip>
                            <span>Ấn vào để xem video</span>
                        </Tooltip>
                    }
                >
                    <div className='mb-2' style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        <div onClick={toggleFullScreenMode} style={{ position: 'relative', cursor: 'pointer' }}>
                            {isPause && <img src={toAbsoluteUrl("/media/play-circle.svg")} alt='' style={{ zIndex: '66', width: '23px', position: 'absolute', left: '50%', top: '50%', transform: "translate(-50%, -50%)" }} />}
                            <video autoplay={false} style={{ borderRadius: '4px', border: '1px solid #d9d9d9', ...(customeStyle ? customeStyle : { width: 46, height: 46 }) }} ref={vidref}>
                                <source src={source} type="video/mp4" />
                            </video>
                        </div>
                    </div>
                </OverlayTrigger>
            }

            {((!source && !error) || uploading) && allowRemove &&
                <div
                    className='image-input'
                    style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }} >
                    <span className="mr-6 spinner spinner-white" ></span>
                </div>}


            {
                !allowRemove && <input ref={refInput} type="file" style={{ display: 'none' }} accept={accept}
                    onChange={e => {
                        !!onChooseFile && onChooseFile(_.range(0, e.target.files.length).map(_index => e.target.files.item(_index)))
                        e.target.value = ''
                    }}
                />
            }

            {
                allowRemove && <span className="btn btn-xs btn-icon btn-circle btn-white btn-hover-text-primary btn-shadow image-input-video-cancel"
                    data-action="change" data-toggle="tooltip" title="Remove avatar"
                    onClick={e => {
                        e.preventDefault();
                        e.stopPropagation();

                        !!onRemove && onRemove()
                    }}
                >
                    <i className="ki ki-bold-close icon-xs text-muted"></i>
                </span>
            }
        </div>
    )
    if (!error || uploading) {
        return view
    }

    return (
        <>
            <div>
                {view}
                <div style={{ color: '#f14336', position: 'relative' }}>{error}</div>
            </div>

        </>
    )
})