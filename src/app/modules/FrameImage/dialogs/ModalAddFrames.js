import React, { Fragment, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal } from 'react-bootstrap';
import { useIntl } from "react-intl";
import Table from 'rc-table';
import { Link } from "react-router-dom";
import { toAbsoluteUrl } from '../../../../_metronic/_helpers';
import { useMutation, useQuery } from '@apollo/client';
import { formatNumberToCurrency, loadSizeImage, validateImageFile } from '../../../../utils';
import dayjs from 'dayjs';
import { InputVertical } from '../../../../_metronic/_partials/controls';
import { Field, Formik } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useToasts } from "react-toast-notifications";
import { useSelector } from 'react-redux';
import { saveAs } from 'file-saver';
import mutate_insertMultipleFrame from '../../../../graphql/mutate_insertMultipleFrame';
import LoadingDialog from '../../ProductsStore/product-new/LoadingDialog';
import query_sme_catalog_photo_frames_aggregate from '../../../../graphql/query_sme_catalog_photo_frames_aggregate';
import client from '../../../../apollo';
import { groupBy } from 'lodash';

const CancelToken = axios.CancelToken;

export const queryCheckExistFrameName = async (value) => {
    let { data } = await client.query({
        query: query_sme_catalog_photo_frames_aggregate,
        fetchPolicy: 'network-only',
        variables: {
            "where": {
                "name": { "_ilike": value }
            }
        }
    })
    return data?.sme_catalog_photo_frames_aggregate?.aggregate?.count > 0;
}

const ImageUploadFrame = ({ asset, onSetAssetFrame, onSetAssetFrameError, loading, onSetAssetFrameLoading, onRemoveAssetFrame, errorMessage }) => {
    const { formatMessage } = useIntl();
    const user = useSelector((state) => state.auth.user);
    const { addToast } = useToasts();
    const refInput = useRef();
    const refCancel = useRef();
    const [preview, setPreview] = useState();
    const [avatar_url, setAvatar_url] = useState();
    const [file, setFile] = useState();
    const [error, setError] = useState();

    const _upload = useCallback(async (file) => {
        onSetAssetFrameLoading(true)
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
                onSetAssetFrame({
                    asset_id: res?.data?.data?.id,
                    asset_url: res.data?.data.source,
                });
            } else {
                addToast(formatMessage({ defaultMessage: 'Tải ảnh không thành công.' }), { appearance: 'error' });
            }
        } catch (error) {
            onSetAssetFrameError(formatMessage({ defaultMessage: 'Đã có lỗi xảy ra' }))
        } finally {
            onSetAssetFrameLoading(false)
        }
    }, [user]);

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
        <Fragment>
            <div className='d-flex' style={{ flexDirection: 'column' }}>
                <div
                    className="image-input overlay"
                    id="kt_image_4"
                    style={{
                        width: 82, height: 82,
                        cursor: 'pointer',
                        backgroundColor: '#F7F7FA',
                        border: !!errorMessage ? '1px solid #f14336' : '1px dashed #D9D9D9'
                    }}
                    onClick={e => {
                        if (!!asset?.asset_url) return;
                        !!refInput.current && refInput.current.click()
                    }}
                >
                    {!!asset?.asset_url ? (
                        <div className="image-input-wrapper" style={{
                            width: 80, height: 80,
                            backgroundImage: `url("${asset?.asset_url}")`,
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
                            {!loading && (
                                <>
                                    <i className='flaticon2-add-1' style={{ fontSize: 28 }} ></i>
                                    <span style={{ marginTop: 4 }} >{formatMessage({ defaultMessage: 'Tải ảnh lên' })}</span>
                                </>
                            )}
                        </div>
                    )}
                    {!!loading && (
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
                    {
                        !!asset?.asset_url && !loading && <div className="overlay-layer align-items-end justify-content-center">
                            <div className="d-flex flex-grow-1 flex-center bg-white-o-5 py-5">
                                <a href="#" className="btn btn-xs btn-icon btn-circle btn-white btn-hover-text-primary btn-shadow"
                                    onClick={e => {
                                        e.preventDefault();
                                        e.stopPropagation();

                                        onRemoveAssetFrame();
                                    }}
                                >
                                    <i className="ki ki-bold-close icon-xs text-muted"></i>
                                </a>
                                <div
                                    className="btn btn-xs btn-icon btn-circle btn-white btn-hover-text-primary btn-shadow ml-2"
                                    onClick={e => {
                                        e.preventDefault();
                                        e.stopPropagation();

                                        saveAs(asset?.asset_url, 'image-ub.png');
                                    }}
                                >
                                    <i className="fas fa-download icon-xs text-muted"></i>
                                </div>
                            </div>
                        </div>
                    }
                </div>
                {!!errorMessage && <span className="mt-2" style={{ color: 'red' }}>{errorMessage}</span>}
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
        </Fragment>
    )
}

const ModalAddFrames = ({
    dataFiles,
    show,
    onHide,
}) => {
    const user = useSelector((state) => state.auth.user);
    const { addToast } = useToasts();
    const [assetFrames, setAssetFrames] = useState(null);
    const [checkNameFrame, setCheckNameFrame] = useState(null);
    const { formatMessage } = useIntl();

    const [createMultipleFrameImage, { loading: loadingCreateMultipleFrameImage }] = useMutation(mutate_insertMultipleFrame, {
        awaitRefetchQueries: true,
        refetchQueries: ['sme_catalog_photo_frames']
    });

    useMemo(async () => {
        const newAssetFrames = await Promise.all(Array.from({ length: dataFiles?.length })?.map(async (item, index) => {
            let error = "";
            let _file = dataFiles[index];
            let resFetchSize = await Promise.resolve(loadSizeImage(_file));
            if (_file.size > 3 * 1024 * 1024) {
                error = formatMessage({ defaultMessage: 'Không thể được tải lên. Kích thước tập tin vượt quá 3.0 MB.' });
            }
            if (resFetchSize.width != resFetchSize.height || !!validateImageFile({ ...resFetchSize, size: 0 })) {
                error = formatMessage({ defaultMessage: 'Khung ảnh mẫu phải có tỉ lệ 1 : 1, kích thước tối thiểu 500x500, tối đa 5000x5000.' });
            }

            return {
                id: index + 1,
                asset: null,
                assetError: error || null,
                isLoading: true
            }
        }));
        setAssetFrames(newAssetFrames);
    }, [dataFiles]);

    useMemo(async () => {
        try {
            const totalFrames = await Promise.all(dataFiles?.map(file => {
                let formData = new FormData();
                formData.append('type', 'file');
                formData.append('file', file);

                return axios.post(process.env.REACT_APP_URL_FILE_UPLOAD, formData, {
                    isSubUser: user?.is_subuser,
                });
            }));

            setAssetFrames(prev => prev?.map((frame, index) => {
                // if (!!frame?.assetError) return frame;

                if (!totalFrames[index]?.data?.success) {
                    return {
                        ...frame,
                        isLoading: false,
                        asset: null,
                        assetError: formatMessage({ defaultMessage: 'Đã có lỗi xảy ra' })
                    }
                }
                return {
                    ...frame,
                    isLoading: false,
                    asset: {
                        asset_id: totalFrames[index]?.data?.data?.id,
                        asset_url: totalFrames[index]?.data?.data?.source,
                    }
                }
            }));
        } catch (error) {

        }
    }, [dataFiles])

    console.log({ assetFrames });

    const validateSchema = useMemo(() => {
        const schema = assetFrames?.reduce((result, value) => {
            result[`name_${value?.id}`] = Yup.string()
                .required(formatMessage({ defaultMessage: 'Vui lòng nhập tên khung' }))
                .min(5, formatMessage({ defaultMessage: 'Vui lòng điền ít nhất 5 kí tự' }))
                .max(120, formatMessage({ defaultMessage: 'Tên khung tối đa 120 ký tự' }))
                .test(
                    'chua-ky-tu-space-o-dau-cuoi',
                    formatMessage({ defaultMessage: 'Tên khung không được chứa dấu cách ở đầu và cuối' }),
                    (value, context) => {
                        if (!!value) {
                            return value.length == value.trim().length;
                        }
                        return false;
                    },
                )
                .test(
                    'chua-ky-tu-2space',
                    formatMessage({ defaultMessage: 'Tên khung không được chứa 2 dấu cách liên tiếp' }),
                    (value, context) => {
                        if (!!value) {
                            return !(/\s\s+/g.test(value))
                        }
                        return false;
                    },
                )
                .when(`name_${value?.id}_out_boolean`, {
                    is: values => {
                        return !!values && !!values[`name_${value?.id}`];
                    },
                    then: Yup.string().oneOf([`name_${value?.id}`], formatMessage({ defaultMessage: 'Tên khung đã tồn tại' }))
                })
                .when(`name_in_boolean`, {
                    is: values => {
                        return !!values && !!values[`name_${value?.id}`];
                    },
                    then: Yup.string().oneOf([`name_${value?.id}`], formatMessage({ defaultMessage: 'Tên khung bị trùng lặp' }))
                });
            result[`name_${value?.id}_out_boolean`] = Yup.object().notRequired();
            result[`name_in_boolean`] = Yup.object().notRequired();

            return result;
        }, {});

        return Yup.object().shape(schema)
    }, [assetFrames]);


    return (
        <Formik
            initialValues={{}}
            validationSchema={validateSchema}
            enableReinitialize
        >
            {({ handleSubmit, values, validateForm, setFieldValue, errors }) => {
                return (
                    <Fragment>
                        <LoadingDialog show={loadingCreateMultipleFrameImage} />
                        {!loadingCreateMultipleFrameImage && <Modal
                            size="xl"
                            show={show}
                            aria-labelledby="example-modal-sizes-title-sm"
                            dialogClassName="modal-show-connect-product"
                            centered
                            onHide={() => { }}
                            backdrop={true}
                        >
                            <Modal.Header>
                                <Modal.Title>{formatMessage({ defaultMessage: 'Tải khung hàng loạt' })}</Modal.Title>
                            </Modal.Header>
                            <Modal.Body className="overlay overlay-block cursor-default">
                                <div className='d-flex align-items-center mb-4'>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="text-info bi bi-lightbulb mr-2" viewBox="0 0 16 16">
                                        <path d="M2 6a6 6 0 1 1 10.174 4.31c-.203.196-.359.4-.453.619l-.762 1.769A.5.5 0 0 1 10.5 13a.5.5 0 0 1 0 1 .5.5 0 0 1 0 1l-.224.447a1 1 0 0 1-.894.553H6.618a1 1 0 0 1-.894-.553L5.5 15a.5.5 0 0 1 0-1 .5.5 0 0 1 0-1 .5.5 0 0 1-.46-.302l-.761-1.77a1.964 1.964 0 0 0-.453-.618A5.984 5.984 0 0 1 2 6zm6-5a5 5 0 0 0-3.479 8.592c.263.254.514.564.676.941L5.83 12h4.342l.632-1.467c.162-.377.413-.687.676-.941A5 5 0 0 0 8 1z" />
                                    </svg>
                                    <span className='text-info'>
                                        {formatMessage({ defaultMessage: 'Hệ thống giới hạn 100 khung ảnh mẫu/ 1 lần tải lên' })}
                                    </span>
                                </div>
                                <span className='mt-2 text-primary'>
                                    {formatMessage({ defaultMessage: 'Số lượng khung mẫu: {count} / {max}' }, { count: assetFrames?.length, max: 100 })}
                                </span>
                                <Table
                                    className="upbase-table mt-2"
                                    columns={[
                                        {
                                            title: formatMessage({ defaultMessage: 'Tên khung' }),
                                            dataIndex: 'name',
                                            key: 'name',
                                            align: 'left',
                                            width: '60%',
                                            render: (_item, record) => {
                                                return <Field
                                                    name={`name_${record?.id}`}
                                                    component={InputVertical}
                                                    onChangeCapture={e => {
                                                        setFieldValue(`name_in_boolean`, {});
                                                        setFieldValue(`name_${record?.id}_out_boolean`, { [`name_${record?.id}`]: false })
                                                    }}                                                    
                                                    onBlurChange={async (value) => {                                                        
                                                        // const valueErrorForm = errors?.[`name_${record?.id}`];
                                                        // if (!!valueErrorForm) return;

                                                        let isError = false;
                                                        let validateBoolean = {}

                                                        assetFrames.forEach(frame => {
                                                            if (frame?.id != record?.id) {
                                                                if (values[`name_${frame?.id}`] == value) {
                                                                    isError = true;
                                                                    validateBoolean[`name_${frame?.id}`] = true;
                                                                } else {
                                                                    validateBoolean[`name_${frame?.id}`] = false;
                                                                }
                                                            }
                                                        })

                                                        validateBoolean[`name_${record?.id}`] = isError;
                                                        setFieldValue(`name_in_boolean`, validateBoolean);

                                                        setCheckNameFrame(`name_${record?.id}`);
                                                        const checkExistFramename = await queryCheckExistFrameName(value);

                                                        setCheckNameFrame(null);
                                                        if (checkExistFramename) {
                                                            setFieldValue(`name_${record?.id}_out_boolean`, { [`name_${record?.id}`]: true })
                                                        } else {
                                                            setFieldValue(`name_${record?.id}_out_boolean`, { [`name_${record?.id}`]: false })
                                                        }
                                                    }}
                                                    loading={checkNameFrame == `name_${record?.id}`}
                                                    label={""}
                                                    placeholder={formatMessage({ defaultMessage: 'Nhập tên khung mẫu' })}
                                                    required={true}
                                                />
                                            }
                                        },
                                        {
                                            title: formatMessage({ defaultMessage: 'Ảnh' }),
                                            dataIndex: 'id',
                                            key: 'id',
                                            align: 'left',
                                            width: '25%',
                                            render: (_item, record) => {
                                                return <ImageUploadFrame
                                                    asset={record?.asset}
                                                    errorMessage={record?.assetError}
                                                    loading={record?.isLoading}
                                                    onSetAssetFrame={assetFrame => {
                                                        setAssetFrames(prev => prev.map(frame => {
                                                            if (frame?.id == record?.id) {
                                                                return {
                                                                    ...frame,
                                                                    asset: assetFrame,
                                                                    assetError: null,
                                                                    isLoading: false
                                                                }
                                                            }
                                                            return frame
                                                        }))
                                                    }}
                                                    onRemoveAssetFrame={() => {
                                                        setAssetFrames(prev => prev.map(frame => {
                                                            if (frame?.id == record?.id) {
                                                                return {
                                                                    ...frame,
                                                                    asset: null,
                                                                    assetError: formatMessage({ defaultMessage: ' Vui lòng nhập khung ảnh mẫu' }),
                                                                    isLoading: false
                                                                }
                                                            }
                                                            return frame
                                                        }))
                                                    }}
                                                    onSetAssetFrameLoading={loading => {
                                                        setAssetFrames(prev => prev.map(frame => {
                                                            if (frame?.id == record?.id) {
                                                                return {
                                                                    ...frame,
                                                                    isLoading: loading
                                                                }
                                                            }
                                                            return frame
                                                        }))
                                                    }}
                                                    onSetAssetFrameError={error => {
                                                        setAssetFrames(prev => prev.map(frame => {
                                                            if (frame?.id == record?.id) {
                                                                return {
                                                                    ...frame,
                                                                    asset: null,
                                                                    assetError: error,
                                                                    isLoading: false
                                                                }
                                                            }
                                                            return frame
                                                        }))
                                                    }}
                                                />
                                            }
                                        },
                                        {
                                            title: formatMessage({ defaultMessage: 'Thao tác' }),
                                            dataIndex: 'id',
                                            key: 'id',
                                            align: 'center',
                                            width: '15%',
                                            render: (item, record) => {
                                                return <i
                                                    className="fas fa-trash-alt"
                                                    style={{ color: 'red', cursor: record?.isLoading ? 'not-allowed' : 'pointer' }}
                                                    onClick={() => {
                                                        if (record?.isLoading) return;
                                                        setAssetFrames(prev => prev.filter(frame => frame?.id != record?.id))
                                                    }}
                                                />
                                            }
                                        },
                                    ]}
                                    data={assetFrames || []}
                                    emptyText={<div className='d-flex flex-column align-items-center justify-content-center my-10'>
                                        <img src={toAbsoluteUrl("/media/empty.png")} alt="image" width={80} />
                                        <span className='mt-4'>{formatMessage({ defaultMessage: 'Chưa có khung mẫu nào' })}</span>
                                    </div>}
                                    tableLayout="auto"
                                    scroll={{ y: 450 }}
                                />
                            </Modal.Body>
                            <Modal.Footer className="form" style={{ borderTop: '1px solid #dbdbdb', justifyContent: 'end', paddingTop: 10, paddingBottom: 10 }} >
                                <div className="form-group">
                                    <button
                                        type="button"
                                        onClick={onHide}
                                        className="btn btn-secondary mr-4"
                                        style={{ width: 120 }}
                                    >
                                        {formatMessage({ defaultMessage: 'Hủy' })}
                                    </button>
                                    <button
                                        className="btn btn-primary"
                                        type="submit"
                                        disabled={assetFrames?.length == 0}
                                        style={{ width: 120 }}
                                        onClick={async () => {
                                            const isErrorFrame = assetFrames?.some(frame => !!frame?.assetError);

                                            const namesFrame = groupBy(assetFrames?.map(frame => ({
                                                name: values[`name_${frame?.id}`],
                                                key: `name_${frame?.id}`
                                            })), 'name');
                                            let nameErros = {};
                                            Object.values(namesFrame)
                                                .filter(item => item?.length > 1)
                                                .forEach(item => {
                                                    item.forEach(_item => {
                                                        nameErros[_item?.key] = true
                                                    })
                                                })

                                            setFieldValue(`name_in_boolean`, nameErros);
                                            if (Object.keys(nameErros)?.length > 0) {
                                                addToast(formatMessage({ defaultMessage: 'Vui lòng nhập đầy đủ các trường thông tin đã được khoanh đỏ' }), { appearance: 'error' })
                                                await validateForm(values);
                                                handleSubmit();
                                                return;
                                            }

                                            let error = await validateForm(values);

                                            if (Object.values(error).length > 0 || isErrorFrame) {
                                                handleSubmit();
                                                addToast(formatMessage({ defaultMessage: 'Vui lòng nhập đầy đủ các trường thông tin đã được khoanh đỏ' }), { appearance: 'error' })
                                                return;
                                            }

                                            const body = assetFrames?.map(frame => ({
                                                asset_url: frame?.asset?.asset_url,
                                                asset_id: frame?.asset?.asset_id,
                                                name: values[`name_${frame?.id}`],
                                                is_static: 1,
                                            }));

                                            console.log({ body });
                                            let { data } = await createMultipleFrameImage({
                                                variables: { objects: body }
                                            });

                                            if (!!data?.insert_sme_catalog_photo_frames?.affected_rows) {
                                                addToast(formatMessage({ defaultMessage: 'Tạo khung ảnh mẫu thành công' }), { appearance: 'success' });
                                            } else {
                                                addToast(formatMessage({ defaultMessage: 'Tạo khung ảnh mẫu thất bại' }), { appearance: 'error' });
                                            }
                                            onHide();
                                        }}
                                    >
                                        {formatMessage({ defaultMessage: 'Lưu lại' })}
                                    </button>
                                </div>
                            </Modal.Footer>
                        </Modal >}
                    </Fragment>
                )
            }}
        </Formik>
    )
};

export default memo(ModalAddFrames);