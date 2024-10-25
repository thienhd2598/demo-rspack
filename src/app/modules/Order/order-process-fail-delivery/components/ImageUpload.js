/*
 * Created by duydatpham@gmail.com on 09/06/2021
 * Copyright (c) 2021 duydatpham@gmail.com
 */
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import axios from "axios";
import { useHistory } from 'react-router';
import _ from 'lodash'
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { saveAs } from 'file-saver';
import { useSelector } from 'react-redux';
import { useIntl } from "react-intl"
const CancelToken = axios.CancelToken;

export default memo(({
    data, allowRemove, accept, onChooseFile, allowDelete = true, allowEdit = true,
    onRemove, onUploadSuccess, onOpenCrop, validateFile,
    onUploading,
    allowDowload = false,
    multiple = false,
    isValidate,
    isSingle = false,
    disabled,
    required = true
}) => {
    const { formatMessage } = useIntl()
    const history = useHistory()
    const [preview, setPreview] = useState()
    const [uploading, setUploading] = useState(false)
    const refInput = useRef()
    const refCancel = useRef()
    const refCancelMerged = useRef()
    const { file, refFile, source, id, rootFile, template_image_url, merged_image_url, isMergeOption } = data || {}
    const [error, setError] = useState()
    const _refRootFile = useRef(rootFile || source)
    const _refFile = useRef(refFile || file)
    const user = useSelector((state) => state.auth.user);

    const _upload = useCallback(async (file) => {
        setUploading(true)
        try {
            !!onUploading && onUploading(true)
            let formData = new FormData();
            formData.append('type', 'file')
            formData.append('file', file, file.name || 'file.jpg')
            let res = await axios.post(process.env.REACT_APP_URL_FILE_UPLOAD, formData, {
                isSubUser: user?.is_subuser,
                cancelToken: new CancelToken(function executor(c) {
                    refCancel.current = c;
                }),
            })
            if (res.data.success) {
                setError(null)
                requestAnimationFrame(() => {
                    !!onUploadSuccess && res.data.success && onUploadSuccess({ ...res.data.data, rootFile: _refRootFile.current, refFile: _refFile.current }, id)
                })
            } else {
                setError(formatMessage({ defaultMessage: 'Gặp lỗi trong quá trình tải lên' }))
            }

            console.log('res', res)
            setUploading(false)
        } catch (error) {
            console.log('error', error)
            setError(formatMessage({ defaultMessage: 'Gặp lỗi trong quá trình tải lên' }))
        } finally {
            setUploading(false)
        }
    }, [onUploadSuccess, onUploading, user])

    useMemo(async () => {
        if (!!file) {
            let reader = new FileReader();
            let url = reader.readAsDataURL(file);

            reader.onloadend = function (e) {
                let img = new Image()
                img.onload = function (imageEvent) {
                    let err = null
                    if (!!validateFile) {
                        err = validateFile({ width: img.width, height: img.height, size: file.size });
                    }
                    if (!err) {
                        _upload(file);
                        setError(null)
                    } else {
                        setError(err)
                    }
                    _refRootFile.current = e.target.result
                    setPreview(e.target.result)
                }
                img.src = e.target.result;
            }
        }
        return () => {
            !!refCancel.current && refCancel.current('unmount')
            setPreview()
        }
    }, [file]);

    useMemo(() => {
        if (!data) {
            setPreview(null)
            setUploading(false)
            setError(null)
            _refRootFile.current = null
            _refFile.current = null
        }
        return () => {
            setPreview()
        }
    }, [data])

    useMemo(() => {
        let img = new Image()
        img.onload = function (imageEvent) {
            let err = null
            if (!!validateFile) {
                err = validateFile({ width: img.width, height: img.height })
            }
            if (!err) {
                setError(null)
            } else {
                setError(err)
            }

        }
        if (!_refRootFile.current) {
            _refRootFile.current = source
        }
        img.src = source;
    }, [source])
    useMemo(() => {
        if (!!merged_image_url) {
            let img = new Image()
            img.onload = function (imageEvent) {
                let err = null
                if (!!validateFile) {
                    err = validateFile({ width: img.width, height: img.height })
                }
                if (!err) {
                    setError(null)
                } else {
                    setError(err)
                }

            }
            img.src = merged_image_url;
        }
    }, [merged_image_url])

    const view = (
        <div className="image-input mr-4 overlay" id="kt_image_4" style={{
            width: 46, height: 46,
            // backgroundImage: !source && !preview && `url("/media/users/blank.png")`,
            cursor: 'pointer',
            backgroundColor: '#F7F7FA',
            border: (!!error || !!isValidate) ? '1px solid #f14336' : '1px dashed #D9D9D9'

        }}
            onClick={e => {
                !!refInput.current && refInput.current.click()
            }}
        >
            {
                !source && !preview && <div style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column'
                }}>
                    <i className='flaticon2-add-1' style={{ fontSize: 12 }} ></i>
                    <span style={{ marginTop: 4, fontSize: 8 }} >{formatMessage({ defaultMessage: 'Tải ảnh lên' })}

                        {required > 0 &&
                            <span className='text-danger'>*</span>
                        }
                    </span>
                </div>
            }
            {
                !!source && <div className="image-input-wrapper" style={{
                    backgroundImage: `url("${merged_image_url || source}")`,
                    width: 46, height: 46
                }}></div>
            }
            {
                !!preview && !source && <img className="image-input-wrapper" style={{ width: 46, height: 46 }} src={preview} />
            }

            {((!preview && !source && !isSingle) || uploading) && allowRemove && <div className='image-input' style={{
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
                !preview && !source && (!allowRemove || isSingle) && <input ref={refInput} type="file" style={{ display: 'none' }}
                    multiple={multiple}
                    accept={accept}
                    onChange={e => {
                        !!onChooseFile && onChooseFile(_.range(0, e.target.files.length).map(_index => e.target.files.item(_index)))
                        e.target.value = ''
                    }}
                />
            }

            {
                !disabled && !!allowRemove && (!!preview || !!source) && !uploading && <div className="overlay-layer align-items-end justify-content-center">
                    <div className="d-flex flex-grow-1 flex-center bg-white-o-5 py-5">
                        {
                            allowEdit && !!onOpenCrop && <a href="#" className="btn btn-xs btn-icon btn-circle btn-white btn-hover-text-primary btn-shadow mr-2"
                                onClick={e => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    !!onOpenCrop && onOpenCrop(source || _refRootFile.current, async (blob) => {
                                        await _upload(blob)
                                    })
                                    // !!onOpenCrop && onOpenCrop(_refRootFile.current, async (blob) => {
                                    //     await _upload(blob)
                                    // })
                                }}
                            >
                                <i className="fa fa-pen icon-sm text-muted"></i>
                            </a>
                        }
                        {allowDelete && (
                            <a href="#" className="btn btn-xs btn-icon btn-circle btn-white btn-hover-text-primary btn-shadow"
                                onClick={e => {
                                    e.preventDefault();
                                    e.stopPropagation();

                                    !!onRemove && onRemove()
                                }}
                            >
                                <i className="ki ki-bold-close icon-xs text-muted"></i>
                            </a>
                        )}
                        {/* {allowDowload && (
                            <div
                                className="btn btn-xs btn-icon btn-circle btn-white btn-hover-text-primary btn-shadow ml-2"
                                onClick={e => {
                                    e.preventDefault();
                                    e.stopPropagation();

                                    saveAs(`${merged_image_url || source}`, 'image-ub.png');
                                }}
                            >
                                <i className="fas fa-download icon-xs text-muted"></i>
                            </div>
                        )} */}
                    </div>
                </div>
            }
        </div >
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
                    {error}
                </Tooltip>
            }
        >
            {view}
        </OverlayTrigger>
    )
})