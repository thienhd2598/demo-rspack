import React, { memo, useEffect, useState, useRef, useCallback, useMemo, useLayoutEffect } from 'react';
import { Card, CardBody, InputVertical } from "../../../../_metronic/_partials/controls";
import { OverlayTrigger, Tooltip, Modal } from "react-bootstrap";
import SVG from "react-inlinesvg";
import { toAbsoluteUrl } from '../../../../_metronic/_helpers';
import { useSubheader } from "../../../../_metronic/layout";
import { useQuery, useMutation } from '@apollo/client';
import { useHistory } from 'react-router';
import Pagination from '../../../../components/Pagination';
import { Link, useRouteMatch } from "react-router-dom";
import { Field, Formik, useFormik } from "formik";
import { useToasts } from "react-toast-notifications";
import * as Yup from "yup";
import axios from "axios";
import { loadSizeImage, validateImageFile } from "../../../../utils/index";
import mutate_insertFrameImage from '../../../../graphql/mutate_insertFrameImage';
import LoadingDialog from '../LoadingDialog';
import query_sme_catalog_photo_frames from '../../../../graphql/query_sme_catalog_photo_frames';
import ToastAlert from '../../../../components/ToastAlert';
import { useShowToastAlert } from '../../../../hooks/useShowToastAlert';
import { Helmet } from 'react-helmet-async';
import { useSelector } from 'react-redux';
import { useIntl } from 'react-intl';

const CancelToken = axios.CancelToken;

export default memo(({ }) => {
    const { formatMessage } = useIntl();
    const route = useRouteMatch();
    const history = useHistory();
    const { isActive, message, openToastAlert } = useShowToastAlert();
    const { appendBreadcrumbs, setBreadcrumbs } = useSubheader();
    const user = useSelector((state) => state.auth.user);
    const refInput = useRef();
    const refCancel = useRef()    
    const { addToast } = useToasts();
    const [file, setFile] = useState()
    const [preview, setPreview] = useState()
    const [avatar_url, setAvatar_url] = useState();
    const [assetId, setAssetsId] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState();
    const [errorMessage, setErrorMessage] = useState('');
    const [showConfirm, setShowConfirm] = useState(false);

    const { data, loading } = useQuery(query_sme_catalog_photo_frames, {
        variables: {
        },
        fetchPolicy: 'cache-and-network'
    });

    const [createFrameImage, { loading: loadingCreateFrameImage }] = useMutation(mutate_insertFrameImage, {
        awaitRefetchQueries: true,
        refetchQueries: ['sme_catalog_photo_frames']
    });

    useLayoutEffect(() => {
        setBreadcrumbs([            
            { title: formatMessage({ defaultMessage: 'Tạo khung ảnh tĩnh' }) },
        ])
    }, []);

    const dataCatalogPhotoFrame = useMemo(
        () => {
            if (!data || !data?.sme_catalog_photo_frames) return [];

            return data?.sme_catalog_photo_frames || []
        }, [data]
    );

    const ValidateSchema = Yup.object().shape({
        name: Yup.string()
            .required(formatMessage({ defaultMessage: 'Vui lòng nhập tên mẫu khung ảnh' }))
            .min(5, formatMessage({ defaultMessage: 'Vui lòng điền ít nhất 5 kí tự' }))
            .max(120, formatMessage({ defaultMessage: 'Tên mẫu tối đa 120 ký tự' }))
            .test(
                'chua-ky-tu-space-o-dau-cuoi',
                formatMessage({ defaultMessage: 'Mẫu khung ảnh không được chứa dấu cách ở đầu và cuối' }),
                (value, context) => {
                    if (!!value) {
                        return value.length == value.trim().length;
                    }
                    return false;
                },
            )
            .test(
                'chua-ky-tu-2space',
                formatMessage({ defaultMessage: 'Mẫu khung ảnh không được chứa 2 dấu cách liên tiếp' }),
                (value, context) => {
                    if (!!value) {
                        return !(/\s\s+/g.test(value))
                    }
                    return false;
                },
            )
    });

    const _upload = useCallback(async (file) => {
        setUploading(true)
        try {
            let formData = new FormData();
            formData.append('type', 'file')
            formData.append('file', file, file.name || 'file.jpg')
            let res = await axios.post(process.env.REACT_APP_URL_FILE_UPLOAD, formData, {
                isSubUser: user?.is_subuser,
                cancelToken: new CancelToken(function executor(c) {
                    refCancel.current = c;
                }),
            })

            if (res.data?.success) {
                setAvatar_url(res.data?.data.source);
                setAssetsId(res?.data?.data?.id);
                setErrorMessage(null)
            } else {
                addToast(formatMessage({ defaultMessage: 'Tải ảnh không thành công.' }), { appearance: 'error' });
            }
        } catch (error) {
            console.log('error', error)
        } finally {
            setUploading(false)
        }
    }, [user])

    useEffect(() => {
        if (!!file) {
            let reader = new FileReader();
            let url = reader.readAsDataURL(file);

            reader.onloadend = function (e) {
                let img = new Image()

                img.onload = function (imageEvent) {
                    _upload(file);
                    setPreview(e.target.result)

                }
                img.src = e.target.result;
            }
        }
        return () => {
            !!refCancel.current && refCancel.current('unmount')
        }
    }, [file]);

    return (
        <>
            <Helmet
                titleTemplate={`${formatMessage({ defaultMessage: 'Thêm khung ảnh mẫu' })} - UpBase`}
                defaultTitle={`${formatMessage({ defaultMessage: 'Thêm khung ảnh mẫu' })} - UpBase`}
            >
                <meta name="description" content={`${formatMessage({ defaultMessage: 'Thêm khung ảnh mẫu' })} - UpBase`} />
            </Helmet>
            <Formik
                initialValues={{
                    name: ''
                }}
                validationSchema={ValidateSchema}
                onSubmit={async (values) => {
                    if (dataCatalogPhotoFrame?.some(ii => ii?.name?.toLowerCase() == values?.name?.toLowerCase())) {
                        setShowConfirm(true);
                        return;
                    }
                    if (!avatar_url) {
                        setErrorMessage(formatMessage({ defaultMessage: 'Vui lòng tải khung ảnh mẫu' }))
                        return;
                    }

                    let { data } = await createFrameImage({
                        variables: {
                            asset_url: avatar_url,
                            asset_id: assetId,
                            name: values.name,
                            is_static: 1,
                        }
                    })

                    if (!!data?.insert_sme_catalog_photo_frames?.affected_rows) {
                        addToast(formatMessage({ defaultMessage: 'Tạo khung ảnh mẫu thành công' }), { appearance: 'success' });
                        history.push('/frame-image/list');
                    } else {
                        addToast(formatMessage({ defaultMessage: 'Tạo khung ảnh mẫu thất bại' }), { appearance: 'error' });
                    }
                }}
            >
                {
                    ({ handleSubmit }) => {
                        return (
                            <Card>
                                <CardBody>
                                    <div className="col-lg-6">
                                        <Field
                                            name="name"
                                            component={InputVertical}
                                            label={formatMessage({ defaultMessage: 'Tên mẫu' })}
                                            placeholder=""
                                            required={true}
                                        />
                                        <div className='d-flex'>
                                            <div className='d-flex' style={{ flexDirection: 'column' }}>
                                                <div
                                                    className="image-input mt-6 mr-6 overlay"
                                                    id="kt_image_4"
                                                    style={{
                                                        width: 122, height: 122,
                                                        cursor: 'pointer',
                                                        backgroundColor: '#F7F7FA',
                                                        border: !!error ? '1px solid #f14336' : '1px dashed #D9D9D9'
                                                    }}
                                                    onClick={e => {
                                                        if (!!avatar_url || !!preview) return;
                                                        !!refInput.current && refInput.current.click()
                                                    }}
                                                >
                                                    {!!avatar_url || !!preview ? (
                                                        <div className="image-input-wrapper" style={{
                                                            backgroundImage: `url("${avatar_url || preview}")`,
                                                        }}></div>
                                                    ) : (
                                                        <div style={{
                                                            position: 'absolute',
                                                            top: 0, left: 0, right: 0, bottom: 0,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            flexDirection: 'column'
                                                        }}>
                                                            {!uploading && (
                                                                <>
                                                                    <i className='flaticon2-add-1' style={{ fontSize: 28 }} ></i>
                                                                    <span style={{ marginTop: 4 }} >{formatMessage({ defaultMessage: 'Tải ảnh lên' })}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    )}
                                                    {!!uploading && (
                                                        <div style={{
                                                            position: 'absolute',
                                                            top: 0, left: 0, right: 0, bottom: 0,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            flexDirection: 'column'
                                                        }}>
                                                            <span className="mr-6 spinner spinner-primary"></span>
                                                        </div>
                                                    )}
                                                </div>
                                                {!!errorMessage && <span className="mt-2" style={{ color: 'red' }}>{formatMessage({ defaultMessage: 'Vui lòng tải khung ảnh mẫu' })}</span>}
                                            </div>
                                            <input
                                                ref={refInput}
                                                type="file"
                                                style={{ display: 'none' }}
                                                multiple={false}
                                                accept={".png, .jpg, .jpeg"}
                                                onChange={async e => {
                                                    let _file = e.target.files[0];
                                                    let resFetchSize = await Promise.resolve(loadSizeImage(_file));
                                                    if (_file.size > 3 * 1024 * 1024) {
                                                        addToast(formatMessage({ defaultMessage: 'Không thể được tải lên. Kích thước tập tin vượt quá 3.0 MB.' }), { appearance: 'error' });
                                                        return;
                                                    }
                                                    if (resFetchSize.width != resFetchSize.height || !!validateImageFile({ ...resFetchSize, size: 0 })) {
                                                        addToast(formatMessage({ defaultMessage: 'Khung ảnh mẫu phải có tỉ lệ 1 : 1, kích thước tối thiểu 500x500, tối đa 5000x5000.' }), { appearance: 'error' });
                                                        return;
                                                    }
                                                    setError(null);
                                                    setFile(_file);
                                                    // e.target.value = ''
                                                }}
                                            />
                                            {!!avatar_url && <p
                                                className='mt-6'
                                                style={{ color: 'rgb(255, 86, 41)', cursor: 'pointer' }}
                                                onClick={e => {
                                                    !!refInput.current && refInput.current.click()
                                                }}
                                            >
                                                {formatMessage({ defaultMessage: 'Thay đổi ảnh' })}
                                            </p>}
                                        </div>
                                        <div className='d-flex justify-content-end mt-12' >
                                            <button
                                                className="btn btn-secondary mr-2"
                                                style={{ width: 150 }}
                                                onClick={e => {
                                                    e.preventDefault();

                                                    history.push('/frame-image/list');
                                                }}
                                            >
                                                {formatMessage({ defaultMessage: 'Huỷ bỏ' })}
                                            </button>
                                            <button
                                                className="btn btn-primary"
                                                type="submit"
                                                style={{ width: 150 }}
                                                onClick={handleSubmit}
                                            >
                                                {formatMessage({ defaultMessage: 'Thêm mẫu' })}
                                            </button>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        )
                    }
                }
            </Formik>

            <ToastAlert message={message} isActive={isActive} />
            <LoadingDialog show={loadingCreateFrameImage} />

            <Modal
                show={showConfirm}
                aria-labelledby="example-modal-sizes-title-lg"
                centered
                onHide={() => setShowConfirm(false)}
            >
                <Modal.Body className="overlay overlay-block cursor-default text-center">
                    <div className="mb-8">{formatMessage({ defaultMessage: 'Tên mẫu đã bị trùng, vui lòng nhập tên mẫu khác' })}</div>

                    <div className="form-group mb-0">
                        <button
                            className="btn btn-primary"
                            style={{ width: 90 }}
                            onClick={() => setShowConfirm(false)}
                        >
                            <span className="font-weight-boldest">{formatMessage({ defaultMessage: 'Đóng' })}</span>
                        </button>
                    </div>
                </Modal.Body>
            </Modal>

            <Modal
                show={!!error}
                aria-labelledby="example-modal-sizes-title-lg"
                centered
                onHide={() => setError(null)}
            >
                <Modal.Body className="overlay overlay-block cursor-default text-center">
                    <div className="mb-4" >
                        {error}
                    </div>
                    <button
                        className="btn btn-primary"
                        style={{ width: 80 }}
                        onClick={() => setError(null)}
                    >
                        {formatMessage({ defaultMessage: 'Đóng' })}
                    </button>
                </Modal.Body>
            </Modal>
        </>
    )
});