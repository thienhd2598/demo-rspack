import { useMutation } from '@apollo/client';
import axios from "axios";
import dayjs from 'dayjs';
import { saveAs } from 'file-saver';
import React, { memo, useCallback, useRef, useState } from 'react';
import { Modal } from 'react-bootstrap';
import SVG from "react-inlinesvg";
import { useIntl } from 'react-intl';
import { useSelector } from 'react-redux';
import { useToasts } from 'react-toast-notifications';
import mutate_coValidateExcelImportWarehouse from '../../../../../graphql/mutate_coValidateExcelImportWarehouse';
import { toAbsoluteUrl } from '../../../../../_metronic/_helpers';
import LoadingDialog from '../../../ProductsStore/product-new/LoadingDialog';

const ModalUploadFile = ({    
    show,
    onHide,
    onSetResultUpload
}) => {
    const { formatMessage } = useIntl();
    const user = useSelector((state) => state.auth.user);
    const { addToast } = useToasts();
    const inputRef = useRef(null);
    const [linkFile, setLinkFile] = useState(null);
    const [fileName, setFileName] = useState(null);
    const [loading, setLoading] = useState(false);

    const resetData = () => {
        setLinkFile(null)
        setFileName(null)
        onHide();
    };

    const [coValidateExcelImportWarehouse, { loading: loadingValidateExcelImportWarehouse }] = useMutation(mutate_coValidateExcelImportWarehouse,
        { awaitRefetchQueries: true }
    );

    const handleFileChange = async (event) => {
        const fileObj = event.target.files && event.target.files[0];
        if (!fileObj) {
            return;
        }

        if (event.target.files[0].size > 2 * 1024 * 1024) {
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

    const onUploadFile = useCallback(
        async () => {
            let { data } = await coValidateExcelImportWarehouse({
                variables: {
                    file_url: linkFile,
                    type_return: typeReturn,
                },
            });

            setLoadingSubmit(false);
            if (!!data?.coValidateExcelImportWarehouse?.success) {
                addToast(
                    formatMessage({ defaultMessage: "Nhập file đơn hoàn thành công" }),
                    { appearance: "success" }
                );
                onSetResultUpload(data);
                resetData();
            } else {
                addToast(
                    data?.coValidateExcelImportWarehouse?.message ||
                    formatMessage({
                        defaultMessage: "Nhập file đơn hoàn không thành công",
                    }),
                    { appearance: "error" }
                );
            }
        }, [linkFile]
    );

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
            <Modal.Header closeButton={true}>
                <Modal.Title>
                    {formatMessage({ defaultMessage: 'Tải phiếu nhập kho' })}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="overlay overlay-block cursor-default px-10 pb-15" style={{ position: 'relative' }}>
                <i
                    className="fas fa-times"
                    onClick={resetData}
                    style={{ position: 'absolute', top: -45, right: 20, fontSize: 24, cursor: 'pointer' }}
                />
                {<LoadingDialog show={loadingValidateExcelImportWarehouse} />}
                <div className='row'>
                    <div className='col-3'>{formatMessage({ defaultMessage: 'File danh sách' })}</div>
                    <div className='col-9 px-0 mb-6'>
                        <button
                            className="btn btn-primary btn-elevate mr-3"
                            type="button"
                            onClick={async () => {
                                const currentTime = dayjs().format('DDMMYYYY');
                                const [fileTemplate, dowloadName] = [
                                    "https://prod-statics.s3.ap-southeast-1.amazonaws.com/template/FiledonHBT.xlsx",
                                    `FiledonHBT${currentTime}.xlsx`
                                ];

                                saveAs(new Blob([fileTemplate]), dowloadName);
                            }}
                        >
                            {formatMessage({ defaultMessage: 'Tải file mẫu' })}
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
                                <div className='text-secondary-custom fs-14'>{formatMessage({ defaultMessage: 'File dưới {min}MB, định dạng xls' }, { min: 2 })}</div>
                            </>}

                            {linkFile && <>
                                <i class="fas fa-file-excel mb-4" style={{ color: 'green', fontSize: 70 }}></i>
                                <p className='text-secondary-custom fs-14'>{fileName}</p>
                            </>}
                        </div>
                    </div>
                    <div className='col-3'></div>
                    <div className='col-9 px-0 mt-3'>
                        <div className='text-secondary-custom fs-14'>{formatMessage({ defaultMessage: 'File nhập có dung lượng tối đa {max}MB và {maxRecord} bản ghi' }, { max: 2, maxRecord: '200' })}</div>
                    </div>


                </div>
            </Modal.Body>
            <Modal.Footer className="form" style={{ borderTop: '1px solid #dbdbdb', justifyContent: 'end', paddingTop: 10, paddingBottom: 10 }} >
                <div className="form-group">
                    <button
                        type="submit"
                        disabled={!fileName}
                        onClick={onUploadFile}
                        className="btn btn-primary btn-elevate mr-3"
                        style={{ width: 100 }}
                    >
                        {formatMessage({ defaultMessage: 'Đồng ý' })}
                    </button>
                </div>
            </Modal.Footer>
        </Modal >
    )
};

export default memo(ModalUploadFile);