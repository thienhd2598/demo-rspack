import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, OverlayTrigger, Tooltip } from 'react-bootstrap';
import mutate_userImportUpdateCostPrice from '../../../../../graphql/mutate_userImportUpdateCostPrice';
import query_userGetTemplateImportUpdateCostPrice from '../../../../../graphql/query_userGetTemplateImportUpdateCostPrice';
import { useToasts } from 'react-toast-notifications';
import SVG from "react-inlinesvg";
import { toAbsoluteUrl } from '../../../../../_metronic/_helpers';
import axios from "axios";
import { useLazyQuery, useMutation, useQuery } from '@apollo/client';
import LoadingDialog from './LoadingDialog';
import { formatNumberToCurrency } from '../../../../../utils';
import { saveAs } from 'file-saver';
import { useSelector } from 'react-redux';
import { useIntl } from "react-intl";
const ModalUploadFileComplete = ({
    uploadFile,
    onHide,
}) => {
    const {formatMessage} = useIntl()
    const user = useSelector((state) => state.auth.user);
    const { addToast } = useToasts();
    const inputRef = useRef(null);
    const [linkFile, setLinkFile] = useState(null);
    const [fileName, setFileName] = useState(null);
    const [loading, setLoading] = useState(false)
    const [loadingSubmit, setLoadingSubmit] = useState(false)


    const resetData = () => {
        setLinkFile(null)
        setFileName(null)
        onHide();
    }
    const { data: dataTemplate, loading: loadingTemplate } = useQuery(query_userGetTemplateImportUpdateCostPrice, {
        fetchPolicy: 'network-only',
    })

    const [userImportUpdateCostPrice] = useMutation(mutate_userImportUpdateCostPrice, {
        awaitRefetchQueries: true,
        refetchQueries: ['sme_catalog_product']
    })


    const addProductFromFile = useCallback(async () => {
        setLoadingSubmit(true)
        let { data } = await userImportUpdateCostPrice({
            variables: {
                url: linkFile
            },
            refetchQueries: ['sme_catalog_product']
        })
        setLoadingSubmit(false)

        if (data?.userImportUpdateCostPrice?.success == 1) {
            addToast(formatMessage({defaultMessage:'Nhập file giá vốn và VAT thành công'}), { appearance: 'success' });
            resetData();
        } else {
            addToast(data?.userImportUpdateCostPrice?.message || formatMessage({defaultMessage:"Nhập file giá vốn và VAT không thành công"}), { appearance: 'error' });
        }
    }, [linkFile])


    const handleFileChange = useCallback(async (event) => {
        const fileObj = event.target.files && event.target.files[0];
        if (!fileObj) {
            return;
        }

        setLoading(true)
        try {
            let formData = new FormData();
            formData.append('type', 'file')
            formData.append('file', fileObj, fileObj.name)
            let res = await axios.post(process.env.REACT_APP_URL_FILE_UPLOAD, formData, {
                isSubUser: user?.is_subuser,
                // cancelToken: new CancelToken(function executor(c) {
                //     refCancel.current = c;
                // }),
            })
            if (res.data?.success) {
                setLinkFile(res.data?.data.source)
                setFileName(fileObj.name)
            } else {
                addToast(formatMessage({defaultMessage:'Tải file không thành công.'}), { appearance: 'error' });
            }
        } catch (error) {
            console.log('error', error)
        } finally {
            setLoading(false)
        }
    }, [])

    return (
        <Modal
            size="xl"
            show={!!uploadFile}
            aria-labelledby="example-modal-sizes-title-sm"
            dialogClassName="modal-show-connect-product"
            centered
            onHide={resetData}
            backdrop={true}
        >
            <Modal.Header closeButton={true}>
                <Modal.Title>
                    {formatMessage({defaultMessage:'Nhập file giá vốn và VAT'})}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="overlay overlay-block cursor-default px-10 pb-15">
                <div className='row'>
                    <div className='col-3'>{formatMessage({defaultMessage:'File mẫu'})}</div>
                    <div className='col-9 px-0 mb-5'>
                        <button
                            type="button"
                            onClick={async () => {
                                let name = dataTemplate?.userGetTemplateImportUpdateCostPrice?.url?.split("/file/") || []
                                saveAs(dataTemplate?.userGetTemplateImportUpdateCostPrice?.url, name[name.length - 1]);
                            }}
                            className="btn btn-primary btn-elevate mr-3"
                            style={{ color: '#ff5629', borderColor: '#ff5629', background: '#ffffff' }}
                            disabled={!dataTemplate?.userGetTemplateImportUpdateCostPrice?.success}
                        >
                            {formatMessage({defaultMessage:'Tải file mẫu giá vốn và VAT'})}
                        </button>
                        {!loadingTemplate && !dataTemplate?.userGetTemplateImportUpdateCostPrice?.success && <span style={{ color: 'red' }} >{dataTemplate?.userGetTemplateImportUpdateCostPrice?.message}</span>}
                    </div>
                    <div className='col-3'> {formatMessage({defaultMessage:'Tải lên file giá vốn và VAT'})}  <span className='text-danger'>*</span></div>
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
                                    onClick={async () => {
                                        inputRef.current.click();
                                    }}
                                >
                                    <SVG
                                        src={toAbsoluteUrl("/media/svg/icon.svg")}
                                        className="h-75 align-self-end mb-5"
                                    ></SVG>
                                </div>
                                <b className='fs-16 mb-2'>Click or drag file to this area to upload</b>
                                <div className='text-secondary-custom fs-14'>{formatMessage({defaultMessage:'File dưới 5MB, định dạng xls'})}</div>
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
                        <div className='text-secondary-custom fs-14'>{formatMessage({defaultMessage:'File nhập có dung lượng tối đa 5MB và 1000 bản ghi'})}</div>
                    </div>


                </div>
                {
                    <LoadingDialog show={loadingSubmit} />
                }
            </Modal.Body>
            <Modal.Footer className="form" style={{ borderTop: '1px solid #dbdbdb', justifyContent: 'end', paddingTop: 10, paddingBottom: 10 }} >
                <div className="form-group">
                    <button
                        type="button"
                        onClick={resetData}
                        className="btn btn-secondary mr-5"
                        style={{ width: 100 }}
                    >
                        {formatMessage({defaultMessage:'Thoát'})}
                    </button>
                    <button
                        type="button"
                        onClick={addProductFromFile}
                        className="btn btn-primary btn-elevate mr-3"
                        style={{ width: 100 }}
                        disabled={!linkFile}
                    >
                        {formatMessage({defaultMessage:'Đồng ý'})}
                    </button>
                </div>
            </Modal.Footer>
        </Modal >
    )
};

export default memo(ModalUploadFileComplete);