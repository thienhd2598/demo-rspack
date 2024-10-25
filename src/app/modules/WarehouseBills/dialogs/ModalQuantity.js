import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useToasts } from 'react-toast-notifications';
import SVG from "react-inlinesvg";
import { toAbsoluteUrl } from '../../../../_metronic/_helpers';
import axios from "axios";
import { useMutation, useQuery } from '@apollo/client';
import { Field, Formik } from 'formik';
import _ from 'lodash';
import { saveAs } from 'file-saver';
import { useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import { useHistory } from "react-router-dom";
import query_warehouseGetTemplateUpdateQuantityBill from '../../../../graphql/query_warehouseGetTemplateUpdateQuantityBill';
import { formatNumberToCurrency } from '../../../../utils';
import mutate_warehouseUpdateQuantityBillFromFile from '../../../../graphql/mutate_warehouseUpdateQuantityBillFromFile';
import ModalResult from './ModalResult';
import LoadingDialog from '../../ProductsStore/product-new/LoadingDialog';

const ModalQuantity = ({
    id,
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
    const [modalResult, setModalResult] = useState(false)
    const [dataResults, setDataResults] = useState({})

    const resetData = () => {
        setLinkFile(null)
        setFileName(null)
        onHide();
    }

    const { data: dataTemplate, loading: loadingTemplate } = useQuery(query_warehouseGetTemplateUpdateQuantityBill, {
        variables: {
            id: Number(id)
        },
        fetchPolicy: 'network-only',
        skip: !id
    })

    const [updateQuantityByFile, {loading: loadingUpdateQuantity}] = useMutation(mutate_warehouseUpdateQuantityBillFromFile,
        {refetchQueries: ['warehouse_bill_items', 'warehouse_bill_items_aggregate']}
    )

    const handleFileChange = async (event) => {
        const fileObj = event.target.files && event.target.files[0];
        const fileInput = event.target;
        if (!fileObj) {
            return;
        }

        if (event.target.files[0].size > 2019430) {
            addToast(formatMessage({ defaultMessage: 'Dung lượng file tối đa 2MB' }), { appearance: 'error' });
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
            <LoadingDialog show={loadingUpdateQuantity}/>
            {modalResult && <ModalResult
                onHide={() => {
                    setModalResult(false)
                }} 
                dataResults={dataResults} 
            />}
            {show && <Modal
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
                            {formatMessage({ defaultMessage: 'Nhập file số lượng thực tế' })}
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="overlay overlay-block cursor-default px-10 pb-15" style={{ position: 'relative' }}>
                        <div className='row'>
                            <div className='col-3'>{formatMessage({ defaultMessage: 'File danh sách' })}</div>
                            <div className='col-9 px-0 mb-6'>
                            <button
                                type="button"
                                onClick={async () => {
                                    let name = dataTemplate?.warehouseGetTemplateUpdateQuantityBill?.url?.split("/file/") || []
                                    saveAs(dataTemplate?.warehouseGetTemplateUpdateQuantityBill?.url, name[name.length - 1]);
                                }}
                                className="btn btn-primary btn-elevate mr-3"
                                style={{ color: '#ff5629', borderColor: '#ff5629', background: '#ffffff' }}
                                disabled={!dataTemplate?.warehouseGetTemplateUpdateQuantityBill?.success}
                            >
                                {formatMessage({defaultMessage:'Tải file danh sách sản phẩm'})} {
                                    loadingTemplate ? <span className="spinner spinner-primary" style={{ marginLeft: 20, marginRight: 20 }} ></span> : <span style={{
                                        color: "white",
                                        backgroundColor: "#ff5629",
                                        padding: "4px 8px 4px 8px",
                                        borderRadius: "4px"
                                    }} >{formatNumberToCurrency(dataTemplate?.warehouseGetTemplateUpdateQuantityBill?.quantity)}</span>}
                            </button>
                            {!loadingTemplate && !dataTemplate?.warehouseGetTemplateUpdateQuantityBill?.success && <span style={{ color: 'red' }} >{dataTemplate?.warehouseGetTemplateUpdateQuantityBill?.message}</span>}
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
                                <div className='text-secondary-custom fs-14'>{formatMessage({ defaultMessage: 'File nhập có dung lượng tối đa {max}MB và {maxRecord} bản ghi' }, { max: 2, maxRecord: '1000' })}</div>
                            </div>


                        </div>
                    </Modal.Body>
                    <Modal.Footer className="form" style={{ borderTop: '1px solid #dbdbdb', justifyContent: 'end', paddingTop: 10, paddingBottom: 10 }} >
                        <div className="form-group">
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault()
                                    resetData();
                                }}
                                className="btn btn-secondary btn-elevate mr-3"
                                style={{ width: 100 }}
                            >
                                {formatMessage({ defaultMessage: 'Hủy' })}
                            </button>
                            <button
                                type="submit"
                                disabled={fileName ? false : true}
                                onClick={async () => {
                                    let { data: dataUpdate } = await updateQuantityByFile({
                                        variables: {
                                                url: linkFile,
                                                id: Number(id),
                                        }
                                    })
                                    if(dataUpdate?.warehouseUpdateQuantityBillFromFile?.success) {
                                        if (dataUpdate?.warehouseUpdateQuantityBillFromFile?.total == dataUpdate?.warehouseUpdateQuantityBillFromFile?.totalSuccess) {
                                            setDataResults({
                                                errors: [],
                                                total: dataUpdate?.warehouseUpdateQuantityBillFromFile?.total,
                                                totalSuccess: dataUpdate?.warehouseUpdateQuantityBillFromFile?.totalSuccess
                                            })
                                            setModalResult(true)
                                            resetData();
                                            addToast(formatMessage({ defaultMessage: "Cập nhật số lượng thực tế qua file thành công" }), { appearance: 'success' })
                                        } else {
                                            setDataResults({
                                                errors: dataUpdate?.warehouseUpdateQuantityBillFromFile?.errors,
                                                total: dataUpdate?.warehouseUpdateQuantityBillFromFile?.total,
                                                totalSuccess: dataUpdate?.warehouseUpdateQuantityBillFromFile?.totalSuccess
                                            })
                                            setModalResult(true)
                                            resetData()
                                        }
                                    } else {
                                        addToast(dataUpdate?.warehouseUpdateQuantityBillFromFile?.message || formatMessage({ defaultMessage: "Có lỗi xảy ra! Vui lòng thử lại" }), { appearance: 'error' });
                                    }
                                }}
                                className="btn btn-primary btn-elevate mr-3"
                                style={{ width: 100 }}
                            >
                                {formatMessage({ defaultMessage: 'Đồng ý' })}
                            </button>
                        </div>
                    </Modal.Footer>
                </>
            </Modal >
            }
        </>
    )
};

export default memo(ModalQuantity);