/*
 * Created by duydatpham@gmail.com on 09/06/2021
 * Copyright (c) 2021 duydatpham@gmail.com
 */
import React, { memo, useEffect, useMemo, useRef, useState } from 'react'
import axios from "axios";
import _ from 'lodash'
import { getVideoDuration, validateVideoFile } from '../utils';
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { useSelector } from 'react-redux';
import { useIntl } from 'react-intl';

const CancelToken = axios.CancelToken;
export default memo(({
    data, allowRemove, accept, onChooseFile, onRemove, onUploadSuccess,
    setErrorVideo, onUploading, channel, onUploadError,
    setFieldValue, isSingle = true
}) => {
    const user = useSelector((state) => state.auth.user);
    const [preview, setPreview] = useState()
    const [uploading, setUploading] = useState(false)
    const [initVideo, setInitVideo] = useState(true);
    const refInput = useRef()
    const { file, source, id } = data || {}
    const [error, setError] = useState()
    const { formatMessage } = useIntl()
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

    useEffect(
        () => {
            if (!!source) {
                fetch(source)
                    .then((result) => {
                        return result.blob();
                    })
                    .then(async data => {
                        if (!!data) {
                            let { width, height, duration } = await getVideoDuration(data);

                            let error = validateVideoFile({ width, height, duration, size: data.size, channel })
                            !!onUploading && onUploading(false);
                            if (!!error) {
                                onUploadError(true);
                                setUploading(false);
                                setError(error)
                                return
                            }
                        }
                    })
                    .catch(() => !!onUploading && onUploading(false))
            }
        }, []
    );

    useMemo(async () => {
        let cancel = null;
        if (uploading) {
            try {
                if (!file?.name?.endsWith('.mp4') && !file?.name?.endsWith('.MP4')) {
                    setErrorVideo(formatMessage({ defaultMessage: "Định dạng hỗ trợ: MP4" }));
                    setError(formatMessage({ defaultMessage: "Định dạng hỗ trợ: MP4" }))
                    setUploading(false)
                    return
                }

                let { width, height, duration } = await getVideoDuration(file)

                let error = validateVideoFile({ width, height, duration, size: file.size, channel })
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
                let formData = new FormData();
                formData.append('type', 'file')
                formData.append('file', file)
                let res = await axios.post(process.env.REACT_APP_URL_FILE_UPLOAD, formData, {
                    isSubUser: user?.is_subuser,
                    cancelToken: new CancelToken(function executor(c) {
                        cancel = c;
                    }),
                })

                if (res.data.success) {
                    setError(null)
                    requestAnimationFrame(() => { !!onUploadSuccess && res.data.success && onUploadSuccess(res.data.data) })
                } else {
                    setError(formatMessage({ defaultMessage: 'Gặp lỗi trong quá trình tải lên' }))
                }



                console.log('res', res)
                setUploading(false)
            } catch (error) {
                console.log('error', error)
                setError(formatMessage({ defaultMessage: 'Gặp lỗi trong quá trình tải lên' }))
            }
        }
        return () => {
            !!cancel && cancel('unmount')
        }
    }, [uploading, file, channel, user])

    const view = (
        <div className="image-input image-input-video my-4 mr-4" id="kt_image_4" style={{
            width: 120, height: 120,
            // backgroundImage: !source && !preview && `url("/media/users/blank.png")`,
            cursor: 'pointer',
            backgroundColor: '#F7F7FA',
            border: !!error ? '1px solid #f14336' : '1px dashed #D9D9D9'
        }}
            onClick={e => {
                !!refInput.current && refInput.current.click()
            }}
        >
            {
                !source && !preview && !file && <div style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column'
                }}>
                    <i className='flaticon2-add-1' style={{ fontSize: 28, marginBottom: 4 }} ></i>
                    <span>{formatMessage({ defaultMessage: 'Tải video lên' })}</span>
                </div>
            }
            {
                !!source && <video controls className="image-input" style={{ width: '100%', height: '100%' }} >
                    <source src={source} type="video/mp4" />
                </video>
            }

            {((!preview && !source && !error) || uploading) && allowRemove && <div className='image-input' style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }} >
                <span className="mr-6 spinner spinner-white"  ></span>
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
        <OverlayTrigger
            placement='bottom'
            show={true}
            overlay={
                <Tooltip>
                    {error || ''}
                </Tooltip>
            }
        >
            {view}
        </OverlayTrigger>
    )
})