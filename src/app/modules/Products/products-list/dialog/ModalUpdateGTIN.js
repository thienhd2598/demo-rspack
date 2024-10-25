import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useToasts } from 'react-toast-notifications';
import SVG from "react-inlinesvg";
import { toAbsoluteUrl } from '../../../../../_metronic/_helpers';
import axios from "axios";
import { useMutation } from '@apollo/client';
import { Field, Formik } from 'formik';
import _ from 'lodash';
import { saveAs } from 'file-saver';
import { useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import { useLocation, useHistory } from "react-router-dom";
import ModalResults from './ModalResults';
import mutate_userUpdateGtinFromFile from '../../../../../graphql/mutate_userUpdateGtinFromFile';
import LoadingDialog from './LoadingDialog';

const ModalUpdateGTIN = ({
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
    const history = useHistory()

    const resetData = () => {
        setLinkFile(null)
        setFileName(null)
        onHide();
    }

    const [userUpdateGtinFromFile, {loading: loadingUserUpdateGtin}] = useMutation(mutate_userUpdateGtinFromFile, {
        refetchQueries: ['sme_catalog_product']
    })
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
            <LoadingDialog show={loadingUserUpdateGtin} />
            {modalResult && <ModalResults 
                onHide={() => {
                    setModalResult(false)
                }} 
                dataResults={dataResults} 
                isGTINUpdate={true}
            />}
            {show &&
                <Formik
                    initialValues={{
                    }}
                    enableReinitialize
                    onSubmit={async values => {
                        let { data } = await userUpdateGtinFromFile({
                            variables: {
                                url: linkFile,
                            }
                        })
                        if (data?.userUpdateGtinFromFile?.success == 1) {
                            if (data?.userUpdateGtinFromFile?.total == data?.userUpdateGtinFromFile?.totalSuccess) {
                                setDataResults({
                                    errors: [],
                                    total: data?.userUpdateGtinFromFile?.total,
                                    totalSuccess: data?.userUpdateGtinFromFile?.totalSuccess
                                })
                                setModalResult(true)
                                resetData();
                                addToast(formatMessage({ defaultMessage: "Cập nhật GTIN qua file thành công" }), { appearance: 'success' })
                            } else {
                                setDataResults({
                                    errors: data?.userUpdateGtinFromFile?.errors,
                                    total: data?.userUpdateGtinFromFile?.total,
                                    totalSuccess: data?.userUpdateGtinFromFile?.totalSuccess
                                })
                                setModalResult(true)
                                resetData()
                            }
                        } else {
                            addToast(data?.userUpdateGtinFromFile?.message || formatMessage({ defaultMessage: "Cập nhật GTIN qua file không thành công" }), { appearance: 'error' });
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
                                           {formatMessage({ defaultMessage: 'Cập nhật GTIN theo File' })}
                                        </Modal.Title>
                                    </Modal.Header>
                                    <Modal.Body className="overlay overlay-block cursor-default px-10 pb-15" style={{ position: 'relative' }}>
                                        <i
                                            className="fas fa-times"
                                            onClick={resetData}
                                            style={{ position: 'absolute', top: -45, right: 20, fontSize: 24, cursor: 'pointer' }}
                                        />
                                        <div className='row'>
                                            <div className='col-3'>{formatMessage({ defaultMessage: 'Tải excel mẫu' })}</div>
                                            <div className='col-9 px-0 mb-6'>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (process.env.REACT_APP_MODE !== 'PROD') {
                                                            saveAs(
                                                                'https://prod-statics.s3.ap-southeast-1.amazonaws.com/template/Stagging/Cap_nhat_GTIN_theo_File.xlsx',
                                                                'Cap_nhat_GTIN_theo_File'
                                                            )
                                                        } else {
                                                            saveAs(
                                                                'https://prod-statics.s3.ap-southeast-1.amazonaws.com/template/prod/Cap_nhat_GTIN_theo_File.xlsx',
                                                                'Cap_nhat_GTIN_theo_File'
                                                            )
                                                        }
                                                    }}
                                                    className="btn btn-primary btn-elevate mr-3"
                                                >
                                                    {formatMessage({ defaultMessage: 'Tải file mẫu tại đây' })}
                                                </button>
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

export default memo(ModalUpdateGTIN);