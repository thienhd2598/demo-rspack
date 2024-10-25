import React, { memo, useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Card, CardBody, InputVertical } from "../../../../_metronic/_partials/controls";
import { OverlayTrigger, Tooltip, Modal } from "react-bootstrap";
import SVG from "react-inlinesvg";
import { toAbsoluteUrl } from '../../../../_metronic/_helpers';
import { useSubheader } from "../../../../_metronic/layout";
import { useQuery, useMutation } from '@apollo/client';
import { useHistory } from 'react-router';
import Pagination from '../../../../components/Pagination';
import { Link, useRouteMatch } from "react-router-dom";
import { Field, Formik, useFormikContext } from "formik";
import { useToasts } from "react-toast-notifications";
import * as Yup from "yup";
import axios from "axios";
import { loadSizeImage, validateImageFile } from "../../../../utils/index";
import mutate_update_sme_catalog_photo_frames_by_pk from '../../../../graphql/mutate_update_sme_catalog_photo_frames_by_pk';
import query_sme_catalog_photo_frames_by_pk from '../../../../graphql/query_sme_catalog_photo_frames_by_pk';
import query_sme_catalog_photo_frames from '../../../../graphql/query_sme_catalog_photo_frames';
import LoadingDialog from '../LoadingDialog';
import { Helmet } from 'react-helmet-async';
import { useIntl } from 'react-intl';

const CancelToken = axios.CancelToken;

export default memo(({ }) => {
    const { formatMessage } = useIntl();
    const route = useRouteMatch();
    const history = useHistory();
    const { appendBreadcrumbs } = useSubheader();
    const refInput = useRef();
    const refCancel = useRef()
    const { addToast } = useToasts();
    const [file, setFile] = useState()
    const [preview, setPreview] = useState()
    const [avatar_url, setAvatar_url] = useState();
    const [assetId, setAssetsId] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState();
    const [showConfirm, setShowConfirm] = useState(false);

    const { data } = useQuery(query_sme_catalog_photo_frames, {
        variables: {
        },
        fetchPolicy: 'cache-and-network'
    });

    const [updateFrameImage, { loading: loadingUpdateFrameImage }] = useMutation(mutate_update_sme_catalog_photo_frames_by_pk, {
        awaitRefetchQueries: true,
        refetchQueries: ['sme_catalog_photo_frames', 'sme_catalog_photo_frames_by_pk']
    });

    const dataCatalogPhotoFrame = useMemo(
        () => {
            if (!data || !data?.sme_catalog_photo_frames) return [];

            return data?.sme_catalog_photo_frames || []
        }, [data]
    );

    const { data: dataDetail, loading } = useQuery(query_sme_catalog_photo_frames_by_pk, {
        variables: {
            id: Number(route?.params?.id)
        },
        fetchPolicy: 'network-only'
    });

    useEffect(
        () => {
            appendBreadcrumbs({
                title: formatMessage({ defaultMessage: 'Chỉnh sửa khung ảnh mẫu' }),
                pathname: route.url
            })
        }, []
    );

    useMemo(
        () => {
            if (!dataDetail || !dataDetail?.sme_catalog_photo_frames_by_pk) return {};

            setAvatar_url(dataDetail?.sme_catalog_photo_frames_by_pk?.asset_url || '');
            setAssetsId(dataDetail?.sme_catalog_photo_frames_by_pk?.asset_id || '');
        }, [dataDetail]
    );

    const ValidateSchema = Yup.object().shape({
        name: Yup.string()
            .required(formatMessage({ defaultMessage: 'Vui lòng nhập tên mẫu khung ảnh' }))
            .min(5, formatMessage({ defaultMessage: 'Vui lòng điền ít nhất 5 kí tự' }))
            .max(120, formatMessage({ defaultMessage: 'Tên mẫu tối đa 120 ký tự' }))
    });

    const _upload = useCallback(async (file) => {
        setUploading(true)
        try {
            let formData = new FormData();
            formData.append('type', 'file')
            formData.append('file', file, file.name || 'file.jpg')
            let res = await axios.post(process.env.REACT_APP_URL_FILE_UPLOAD, formData, {
                cancelToken: new CancelToken(function executor(c) {
                    refCancel.current = c;
                }),
            })

            if (res.data?.success) {
                setAvatar_url(res.data?.data.source);
                setAssetsId(res?.data?.data?.id);
            } else {
                addToast(formatMessage({ defaultMessage: 'Tải ảnh không thành công' }), { appearance: 'error' });
            }
        } catch (error) {
            console.log('error', error)
        } finally {
            setUploading(false)
        }
    }, [])

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

    const helmetRender = useMemo(
        () => {
            if (!dataDetail?.sme_catalog_photo_frames_by_pk?.name) return null;

            return (
                <Helmet
                    titleTemplate={`${dataDetail?.sme_catalog_photo_frames_by_pk?.name} - UpBase`}
                    defaultTitle={`${dataDetail?.sme_catalog_photo_frames_by_pk?.name} - UpBase`}
                >
                    <meta name="description" content={`${dataDetail?.sme_catalog_photo_frames_by_pk?.name} - UpBase`} />
                </Helmet>
            )
        }, [dataDetail?.sme_catalog_photo_frames_by_pk?.name]
    );

    return (
        <>
            {helmetRender}
            {!loading && (
                <Formik
                    initialValues={{
                        name: dataDetail?.sme_catalog_photo_frames_by_pk?.name
                    }}

                    validationSchema={ValidateSchema}
                    onSubmit={async (values) => {
                        if (dataCatalogPhotoFrame?.some(ii => ii?.name == values.name && ii?.name != dataDetail?.sme_catalog_photo_frames_by_pk?.name)) {
                            setShowConfirm(true);
                            return;
                        }
                        let { data } = await updateFrameImage({
                            variables: {
                                id: Number(route?.params?.id),
                                _set: {
                                    asset_url: avatar_url,
                                    asset_id: assetId,
                                    name: values.name
                                }
                            }
                        });

                        if (!!data?.update_sme_catalog_photo_frames_by_pk) {
                            history.push('/frame-image/list');
                            addToast(formatMessage({ defaultMessage: 'Cập nhật khung ảnh mẫu thành công' }), { appearance: 'success' });
                        } else {
                            addToast(formatMessage({ defaultMessage: 'Cập nhật khung ảnh mẫu thất bại' }), { appearance: 'error' });
                        }
                    }}
                >
                    {
                        ({ handleSubmit, values, setFieldValue }) => {
                            return (
                                <Card>
                                    <CardBody>
                                        {dataDetail?.sme_catalog_photo_frames_by_pk?.scheduleCount?.total_scheduled > 0 && (
                                            <div className='col mb-6 d-flex align-items-center'>
                                                <img src={toAbsoluteUrl("/media/warningsvg.svg")} alt=""></img>
                                                <span className='ml-2 text-danger'>Khung ảnh đang có lịch ở trạng thái Chờ áp khung hoặc Đang áp khung thì không được phép chỉnh sửa hoặc thay thế</span>
                                            </div>
                                        )}
                                        <div className="col-lg-6">
                                            <Field
                                                name="name"
                                                component={InputVertical}
                                                label={formatMessage({ defaultMessage: 'Tên mẫu' })}
                                                placeholder=""
                                                required={true}
                                            />
                                            <div className='d-flex'>
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
                                                            setError(formatMessage({ defaultMessage: 'Không thể được tải lên. Kích thước tập tin vượt quá 3.0 MB.' }));
                                                            return;
                                                        }
                                                        if (resFetchSize.width != resFetchSize.height || !!validateImageFile({ ...resFetchSize, size: 0 })) {
                                                            setError(formatMessage({ defaultMessage: 'Khung ảnh mẫu phải có tỉ lệ 1 : 1, kích thước tối thiểu 500x500, tối đa 1024x1024.' }))
                                                            return;
                                                        }
                                                        setError(null);
                                                        setFile(_file);
                                                        // e.target.value = ''
                                                    }}
                                                />
                                                {!!avatar_url && dataDetail?.sme_catalog_photo_frames_by_pk?.scheduleCount?.total_scheduled == 0 && <p
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
                                                    disabled={dataDetail?.sme_catalog_photo_frames_by_pk?.scheduleCount?.total_scheduled > 0}

                                                >
                                                    {formatMessage({ defaultMessage: 'Cập nhật' })}
                                                </button>
                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>
                            )
                        }
                    }
                </Formik>
            )}

            <LoadingDialog show={loadingUpdateFrameImage || loading} />

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