import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useToasts } from 'react-toast-notifications';
import SVG from "react-inlinesvg";
import { toAbsoluteUrl } from '../../../../../_metronic/_helpers';
import axios from "axios";
import { useMutation } from '@apollo/client';
import { Field, Formik } from 'formik';
import { ReSelectVertical } from '../../../../../_metronic/_partials/controls/forms/ReSelectVertical';
import _ from 'lodash';
import * as Yup from "yup";
import { PRODUCT_TYPE_OPTIONS } from '../../ProductsUIHelpers';
import { saveAs } from 'file-saver';
import { useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import { useLocation, useHistory } from "react-router-dom";
import ModalResults from './ModalResults';
import mutate_userImportSmeProductFromFile from '../../../../../graphql/mutate_userImportSmeProductFromFile'
import LoadingDialog from './LoadingDialog';

const ModalUploadProductFile = ({
    show,
    onHide,
}) => {
    const { formatMessage } = useIntl();
    const user = useSelector((state) => state.auth.user);
    const { addToast } = useToasts();
    const inputRef = useRef(null);
    const [linkFile, setLinkFile] = useState(null);
    const [fileName, setFileName] = useState(null);
    const [loading, setLoading] = useState(false);
    const [modalResult, setModalResult] = useState(false)
    const [dataResults, setDataResults] = useState([])
    // const [dataExpired, setDataExpired] = useState([])
    const history = useHistory()

    const resetData = () => {
        setLinkFile(null)
        setFileName(null)
        onHide();
    }

    const [userImportSmeProductFromFile, { loading: loadingUserImportSmeProductFromFile }] = useMutation(mutate_userImportSmeProductFromFile, {
        refetchQueries: ['sme_catalog_product']
    });

    const handleFileChange = async (event) => {
        const fileObj = event.target.files && event.target.files[0];
        const fileInput = event.target;
        if (!fileObj) {
            return;
        }

        if (event.target.files[0].size > 5048576) {
            addToast(formatMessage({ defaultMessage: 'Dung lượng file tối đa 5MB' }), { appearance: 'error' });
            fileInput.value = '';
            return;
        }
        const fileType = event.target.files[0].type;
        if (fileType !== 'application/vnd.ms-excel' && fileType !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
            addToast(formatMessage({ defaultMessage: 'Chưa đúng định dạng file' }), { appearance: 'error' });
            fileInput.value = '';
            return;
        }

        setLoading(true)
        try {
            let formData = new FormData();
            formData.append('type', 'file')
            formData.append('file', fileObj, fileObj.name)
            let res = await axios.post(process.env.REACT_APP_URL_FILE_UPLOAD, formData, {
                isSubUser: user?.is_subuser,
            });
            if (res.data?.success) {
                setLinkFile(res.data?.data.source)
                setFileName(fileObj.name)
            } else {
                addToast(formatMessage({ defaultMessage: 'Upload file không thành công.' }), { appearance: 'error' });
            }
        } catch (error) {
            console.log('error', error)
        } finally {
            setLoading(false)
            fileInput.value = '';
        }
    }

    return (
        <>
            {modalResult && <ModalResults onHide={() => {
                setModalResult(false)
            }} dataResults={dataResults} />}
            <LoadingDialog show={loadingUserImportSmeProductFromFile} />
            {show &&
                <Formik
                    initialValues={{
                        productType: PRODUCT_TYPE_OPTIONS?.find(option => option.value == 0),
                    }}
                    validationSchema={Yup.object().shape({
                        note: Yup.string()
                            .notRequired()
                            .max(255, formatMessage({ defaultMessage: 'Ghi chú tối đa 255 ký tự' }))
                    })}
                    enableReinitialize
                    onSubmit={async values => {
                        let { data } = await userImportSmeProductFromFile({
                            variables: {
                                url: linkFile,
                                type: +values?.productType?.value || 0
                            }
                        })
                        if (data?.userImportSmeProductFromFile?.success == 1) {
                            if (data?.userImportSmeProductFromFile?.total == data?.userImportSmeProductFromFile?.totalSuccess) {
                                setDataResults({ 
                                    errors: [],
                                    total: data?.userImportSmeProductFromFile?.total,
                                    totalSuccess: data?.userImportSmeProductFromFile?.totalSuccess,
                                    linkURL: data?.userImportSmeProductFromFile?.resultFile
                                })
                                setModalResult(true)
                                resetData();
                                addToast(formatMessage({ defaultMessage: "Thêm sản phẩm kho theo file thành công" }), { appearance: 'success' })
                            } else {
                                setDataResults({ 
                                    errors: data?.userImportSmeProductFromFile?.errors,
                                    total: data?.userImportSmeProductFromFile?.total,
                                    totalSuccess: data?.userImportSmeProductFromFile?.totalSuccess,
                                    linkURL: data?.userImportSmeProductFromFile?.resultFile
                                })
                                setModalResult(true)
                                resetData()
                            }
                        } else {
                            addToast(data?.userImportSmeProductFromFile?.message || formatMessage({ defaultMessage: "Thêm sản phẩm kho theo file không thành công" }), { appearance: 'error' });
                            resetData()
                        }
                    }}
                >
                    {({
                        values,
                        handleSubmit,
                        validateForm,
                        setFieldValue
                    }) => {
                        return (
                            <Modal
                                size="lg"
                                show={show}
                                aria-labelledby="example-modal-sizes-title-sm"
                                dialogClassName="modal-show-connect-product"
                                centered
                                onHide={resetData}
                                backdrop={true}
                            >
                                <>
                                    <Modal.Header closeButton={true}>
                                        <Modal.Title>
                                           {formatMessage({ defaultMessage: 'Tạo sản phẩm theo file' })}
                                        </Modal.Title>
                                    </Modal.Header>
                                    <Modal.Body className="overlay overlay-block cursor-default px-10 pb-15" style={{ position: 'relative' }}>
                                        <i
                                            className="fas fa-times"
                                            onClick={resetData}
                                            style={{ position: 'absolute', top: -45, right: 20, fontSize: 24, cursor: 'pointer' }}
                                        />
                                        <div className='row'>
                                            <div className='col-3'>{formatMessage({ defaultMessage: 'Loại sản phẩm' })} <span className='text-danger'>*</span></div>
                                            <div className='col-9 px-0 mb-6'>
                                                <Field
                                                    name="productType"
                                                    component={ReSelectVertical}
                                                    onChanged={() => {
                                                        setFieldValue('__changed__', true)
                                                        setFileName(null)
                                                        setLinkFile(null)
                                                    }}
                                                    required
                                                    placeholder=""
                                                    customFeedbackLabel={' '}
                                                    options={PRODUCT_TYPE_OPTIONS}
                                                    isClearable={false}
                                                />
                                            </div>
                                            <div className='col-3'>{formatMessage({ defaultMessage: 'Tải excel mẫu' })}</div>
                                            <div className='col-9 px-0 mb-6'>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (process.env.REACT_APP_MODE !== 'PROD') {
                                                            if (!!values?.productType && values?.productType.value == 0) {
                                                                saveAs(
                                                                   'https://prod-statics.s3.ap-southeast-1.amazonaws.com/template/Stagging/File_mau_tao_san_pham_kho_thuong.xlsx',
                                                                   'File_mau_tao_san_pham_kho_thuong'
                                                                )
                                                            } else if(!!values?.productType && values?.productType.value == 1) {
                                                                saveAs(
                                                                   'https://prod-statics.s3.ap-southeast-1.amazonaws.com/template/Stagging/File_mau_tao_san_pham_combo.xlsx',
                                                                   'File_mau_tao_san_pham_combo'
                                                                )
                                                            } else {
                                                                saveAs(
                                                                    'https://prod-statics.s3.ap-southeast-1.amazonaws.com/template/Stagging/File_mau_tao_san_pham_HSD.xlsx',
                                                                    'File_mau_tao_san_pham_HSD'
                                                                 )
                                                            }

                                                        } else {
                                                            if (!!values?.productType && values?.productType.value == 0) {
                                                                saveAs(
                                                                   'https://prod-statics.s3.ap-southeast-1.amazonaws.com/template/prod/File_mau_tao_san_pham_kho_thuong.xlsx',
                                                                   'File_mau_tao_san_pham_kho_thuong'
                                                                )
                                                            } else if(!!values?.productType && values?.productType.value == 1) {
                                                                saveAs(
                                                                   'https://prod-statics.s3.ap-southeast-1.amazonaws.com/template/prod/File_mau_tao_san_pham_combo.xlsx',
                                                                   'File_mau_tao_san_pham_combo'
                                                                )
                                                            } else {
                                                                saveAs(
                                                                    'https://prod-statics.s3.ap-southeast-1.amazonaws.com/template/prod/File_mau_tao_san_pham_HSD.xlsx',
                                                                    'File_mau_tao_san_pham_HSD'
                                                                 )
                                                            }
                                                        }
                                                    }}
                                                    className="btn btn-primary btn-elevate mr-3"
                                                >
                                                    {formatMessage({ defaultMessage: 'Tải file mẫu tại đây' })}
                                                </button>
                                                {/* </a> */}
                                            </div>
                                            <div className='col-3'> {formatMessage({ defaultMessage: 'Tải tập tin lên' })} <span className='text-danger'>*</span></div>
                                            <div className='col-9 d-flex align-items-center justify-content-center' style={{
                                                height: 150,
                                                padding: '16px, 0px, 16px, 0px',
                                                border: '1px solid rgba(0, 0, 0, 0.2)',
                                                borderRadius: 5
                                            }}>
                                                <input
                                                    accept=".xlsx, .xls"
                                                    style={{ display: 'none' }}
                                                    ref={inputRef}
                                                    type="file"
                                                    onChange={handleFileChange}
                                                />
                                                <div className='text-center'>
                                                    {loading && <span className="spinner "></span>}

                                                    {(!linkFile && !loading) && <>
                                                        <div
                                                            role="button"
                                                            onClick={async e => {
                                                                inputRef.current.click();
                                                            }}
                                                        >
                                                            <SVG
                                                                src={toAbsoluteUrl("/media/svg/icon.svg")}
                                                                className="h-75 align-self-end mb-5"
                                                            ></SVG>
                                                        </div>
                                                        <b className='fs-16 mb-2'>Click or drag file to this area to upload</b>
                                                        <div className='text-secondary-custom fs-14'>{formatMessage({ defaultMessage: 'File dưới {min}MB, định dạng xls' }, { min: 2 })}</div>
                                                    </>}

                                                    {
                                                        linkFile && <>
                                                            <i class="fas fa-file-excel mb-4" style={
                                                                {
                                                                    color: 'green',
                                                                    fontSize: 70
                                                                }
                                                            }></i>
                                                            <p className='text-secondary-custom fs-14'>{fileName}</p>
                                                        </>
                                                    }
                                                </div>
                                            </div>
                                            <div className='col-3'></div>
                                            <div className='col-9 px-0 mt-3'>
                                                <div className='text-secondary-custom fs-14'>{formatMessage({ defaultMessage: 'File nhập có dung lượng tối đa {max}MB và {maxRecord} bản ghi' }, { max: 2, maxRecord: '2000' })}</div>
                                            </div>


                                        </div>
                                    </Modal.Body>
                                    <Modal.Footer className="form" style={{ borderTop: '1px solid #dbdbdb', justifyContent: 'end', paddingTop: 10, paddingBottom: 10 }} >
                                        <div className="form-group">
                                            <button
                                                type="submit"
                                                disabled={fileName ? false : true}
                                                onClick={handleSubmit}
                                                className="btn btn-primary btn-elevate mr-3"
                                                style={{ width: 100 }}
                                            >
                                                {formatMessage({ defaultMessage: 'Đồng ý' })}
                                            </button>
                                        </div>
                                    </Modal.Footer>
                                </>
                            </Modal >
                        )
                    }}
                </Formik>
            }
        </>
    )
};

export default memo(ModalUploadProductFile);