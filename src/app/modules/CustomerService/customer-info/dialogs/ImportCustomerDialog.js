import React, { Fragment, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, OverlayTrigger, Tooltip } from 'react-bootstrap';
import axios from "axios";
import { useMutation } from '@apollo/client';
import { saveAs } from 'file-saver';
import { useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import LoadingDialog from '../../../ProductsStore/product-new/LoadingDialog';
import SVG from "react-inlinesvg";
import { useToasts } from 'react-toast-notifications';
import { toAbsoluteUrl } from '../../../../../_metronic/_helpers';
import mutate_crmImportCustomer from '../../../../../graphql/mutate_crmImportCustomer';

const ImportCustomerDialog = ({
    show, onHide, setDataResultImport
}) => {
    const { formatMessage } = useIntl();
    const user = useSelector((state) => state.auth.user);
    const { addToast } = useToasts();
    const inputRef = useRef(null);
    const [linkFile, setLinkFile] = useState(null);
    const [fileName, setFileName] = useState(null);
    const [loading, setLoading] = useState(false);

    const [crmImportCustomer, { loading: loadingCrmImportCustomer }] = useMutation(mutate_crmImportCustomer, {
        awaitRefetchQueries: true,
        refetchQueries: ['crmGetCustomers']
    });

    const handleFileChange = async (event) => {
        const fileObj = event.target.files && event.target.files[0];
        if (!fileObj) {
            return;
        }

        if (event.target.files[0].size > 5048576) {
            addToast(formatMessage({ defaultMessage: 'Dung lượng file tối đa 5MB' }), { appearance: 'error' });
            return;
        }
        const fileType = event.target.files[0].type;
        if (fileType !== 'application/vnd.ms-excel' && fileType !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
            addToast(formatMessage({ defaultMessage: 'Chưa đúng định dạng file' }), { appearance: 'error' });
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
        }
    }

    const resetData = useCallback(() => {
        setLinkFile(null);
        setFileName(null);
        onHide();
    }, []);

    const onImportCustomer = useCallback(async () => {
        let { data } = await crmImportCustomer({
            variables: {
                file_url: linkFile
            }
        })

        if (data?.crmImportCustomer?.success) {
            resetData();
            setDataResultImport(data);
        } else {
            addToast(data?.crmImportCustomer?.message || formatMessage({ defaultMessage: "Nhập file danh sách khách hàng không thành công" }), { appearance: 'error' });
        }
    }, [linkFile]);

    return (
        <Fragment>
            <LoadingDialog show={loadingCrmImportCustomer} />
            {!loadingCrmImportCustomer && <Modal
                size="lg"
                show={show}
                aria-labelledby="example-modal-sizes-title-sm"
                dialogClassName="modal-show-connect-product"
                centered
                onHide={resetData}
                backdrop={true}
            >
                <Modal.Header closeButton={true}>
                    <Modal.Title>
                        {formatMessage({ defaultMessage: 'Thêm file khách hàng' })}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="overlay overlay-block cursor-default px-10 pb-15" style={{ position: 'relative' }}>
                    <span
                        role='button'
                        style={{ position: 'absolute', top: -50, right: 20, fontSize: 26, cursor: 'pointer' }}
                        onClick={resetData}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-x-lg" viewBox="0 0 16 16">
                            <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z" />
                        </svg>
                    </span>
                    <div className='row'>
                        <div className='col-3'>{formatMessage({ defaultMessage: 'File mẫu' })}</div>
                        <div className='col-9 px-0 mb-6'>
                            <button
                                type="button"
                                onClick={() => {
                                    // saveAs('https://prod-statics.s3.ap-southeast-1.amazonaws.com/template/mau_thong_tin_khach_hang_staging.xlsx');
                                    saveAs('https://prod-statics.s3.ap-southeast-1.amazonaws.com/template/prod/mau_thong_tin_khach_hang.xlsx');
                                }}
                                className="btn"
                                style={{ color: '#ff5629', borderColor: '#ff5629', background: '#ffffff' }}
                            >
                                {formatMessage({ defaultMessage: 'Danh sách thông tin khách hàng' })}
                            </button>
                            {/* </a> */}
                        </div>
                        <div className='col-3'> {formatMessage({ defaultMessage: 'Tải lên kết quả' })} <span className='text-danger'>*</span></div>
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
                                    <div className='text-secondary-custom fs-14'>{formatMessage({ defaultMessage: 'File dưới {min}MB, định dạng xls' }, { min: 5 })}</div>
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
                            <div className='text-secondary-custom fs-14'>{formatMessage({ defaultMessage: 'File nhập có dung lượng tối đa {max}MB và {maxRecord} bản ghi' }, { max: 5, maxRecord: 500 })}</div>
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer className="form" style={{ borderTop: '1px solid #dbdbdb', justifyContent: 'end', paddingTop: 10, paddingBottom: 10 }} >
                    <div className="form-group">
                        <button
                            type="submit"
                            disabled={fileName ? false : true}
                            className="btn btn-primary"
                            style={{ minWidth: 100 }}
                            onClick={onImportCustomer}
                        >
                            {formatMessage({ defaultMessage: 'Đồng ý' })}
                        </button>
                    </div>
                </Modal.Footer>
            </Modal>}
        </Fragment>
    )
};

export default memo(ImportCustomerDialog);
