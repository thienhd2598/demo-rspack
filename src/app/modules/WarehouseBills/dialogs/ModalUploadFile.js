import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useToasts } from 'react-toast-notifications';
import SVG from "react-inlinesvg";
import { toAbsoluteUrl } from '../../../../_metronic/_helpers';
import axios from "axios";
import { useMutation } from '@apollo/client';
import LoadingDialog from '../../ProductsStore/product-new/LoadingDialog';
import mutate_warehouseUserCreateBill from '../../../../graphql/mutate_warehouseUserCreateBill';
import { Field, Formik } from 'formik';
import { ReSelectVertical } from '../../../../_metronic/_partials/controls/forms/ReSelectVertical';
import _ from 'lodash';
import * as Yup from "yup";
import { PRODUCT_TYPE_OPTIONS, PROTOCOL_IN, PROTOCOL_OUT } from '../WarehouseBillsUIHelper';
import { TextArea } from '../../../../_metronic/_partials/controls';
import { saveAs } from 'file-saver';
import { useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import mutate_warehouseUserPreviewFileExport from '../../../../graphql/mutate_warehouseUserPreviewFileExport';
import ModalResult from '../WarehouseBillCreate/components/ModalResult';
import query_sme_catalog_inventory_items from '../../../../graphql/query_sme_catalog_inventory_items';
import { useLocation, useHistory } from "react-router-dom";
import client from '../../../../apollo';
import queryString from 'querystring'
const CancelToken = axios.CancelToken;

const getSmeVariant = async (ids, warehouseId) => {
    if (ids?.length == 0) return [];
    console.log(ids)
    const { data } = await client.query({
        query: query_sme_catalog_inventory_items,
        variables: {
            where: {
                variant: { is_combo: { _eq: 0 }, status: {_eq: 10}},
                variant_id: {_in: ids},
                sme_store_id: {
                    _eq: warehouseId
                }
            },
        },
        fetchPolicy: "network-only",
    });

    return data?.sme_catalog_inventory_items || [];
}

const ModalUploadFile = ({
    type,
    dataWarehouse,
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
    const [dataResults, setDataResults] = useState([])
    const [dataExpired, setDataExpired] = useState([])
    const history = useHistory()

    const resetData = () => {
        setLinkFile(null)
        setFileName(null)
        onHide();
    }

    const [warehouseUserCreateBillDraft, { loading: loadingWarehouseUserCreateBillDraft }] = useMutation(mutate_warehouseUserPreviewFileExport, {
        awaitRefetchQueries: true,
        refetchQueries: ['warehouse_bills']
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
            {modalResult && <ModalResult onHide={() => {
                setModalResult(false)
                history.push({
                    pathname: `/products/warehouse-bill/create`,
                    state: dataExpired,
                    search: `?type=${type}`
                })
            }} dataResults={dataResults} />}
            {show &&
                <Formik
                    initialValues={{
                        warehouseId: _.map(
                            _.filter(
                                dataWarehouse?.sme_warehouses, _warehouse => !!_warehouse?.is_default
                            ),
                            _warehouse => ({ value: _warehouse?.id, label: _warehouse?.name })
                        )[0],
                        note: '',
                        productType: PRODUCT_TYPE_OPTIONS?.find(option => option.value == 0),
                        protocol: type == 'in' ? _.find(PROTOCOL_IN, _bill => _bill.value == 2) : _.find(PROTOCOL_OUT, _bill => _bill.value == 1),
                    }}
                    validationSchema={Yup.object().shape({
                        note: Yup.string()
                            .notRequired()
                            .max(255, formatMessage({ defaultMessage: 'Ghi chú tối đa 255 ký tự' }))
                    })}
                    enableReinitialize
                    onSubmit={async values => {
                        
                        let { data: dataDraft } = await warehouseUserCreateBillDraft({
                            variables: {
                                    url: linkFile,
                                    product_type: values?.productType?.value,
                                    bill_type: type,
                            }
                        })
                        if(dataDraft?.warehouseUserPreviewFileExport?.success) {
                            const dataVariants = await getSmeVariant(dataDraft?.warehouseUserPreviewFileExport?.variants?.map(item => item?.id), values?.warehouseId?.value)
                            const dataExpired = dataVariants?.map(variant => {
                                return {
                                    ...variant,
                                    expire_info: dataDraft?.warehouseUserPreviewFileExport?.variants?.find(item => item ?.id == variant?.variant_id)
                                }
                            })
                            if(dataDraft?.warehouseUserPreviewFileExport?.total == dataDraft?.warehouseUserPreviewFileExport?.totalSuccess) {
                                history.push({
                                    pathname: `/products/warehouse-bill/create`,
                                    state: {
                                        dataVariants: dataExpired,
                                        productType: values?.productType?.value || 0,
                                        warehouseId: values?.warehouseId?.value || null,
                                        note: values?.note || null,
                                        protocol: values?.protocol?.value || null
                                    },
                                    search: `?type=${type}`
                                })
                                // let { data } = await warehouseUserCreateBill({
                                //     variables: {
                                //         warehouseUserCreateBillInput: {
                                //             smeWarehouseId: values?.warehouseId?.value || null,
                                //             fileUrl: linkFile,
                                //             note: values?.note || null,
                                //             protocol: values?.protocol?.value || null,
                                //             type,
                                //             productType: values?.productType?.value || 0
                                //         }
                                //     }
                                // })
                                // if (data?.warehouseUserCreateBill?.success == 1) {
                                //     if (data?.warehouseUserCreateBill?.total == data?.warehouseUserCreateBill?.totalSuccess) {
                                //         resetData();
                                //         addToast(formatMessage({ defaultMessage: "Tạo phiếu xuất kho thành công" }), { appearance: 'success' })
                                //     } else {
                                //         setDataResults(data?.warehouseUserCreateBill?.results)
                                //         setModalResult(true)
                                //     }
                                // } else {
                                //     addToast(data?.warehouseUserCreateBill?.message || formatMessage({ defaultMessage: "Tạo phiếu xuất kho không thành công" }), { appearance: 'error' });
                                // }
                            } else {
                                setDataExpired({
                                    dataVariants: dataExpired,
                                    productType: values?.productType?.value || 0,
                                    warehouseId: values?.warehouseId?.value || null,
                                    note: values?.note || null,
                                    protocol: values?.protocol?.value || null
                                })
                                setDataResults({
                                    errors: dataDraft?.warehouseUserPreviewFileExport?.errors,
                                    total: dataDraft?.warehouseUserPreviewFileExport?.total,
                                    totalSuccess: dataDraft?.warehouseUserPreviewFileExport?.totalSuccess
                                })
                                setModalResult(true)
                            }
                        } else {
                            addToast(dataDraft?.warehouseUserPreviewFileExport?.message || formatMessage({ defaultMessage: "Có lỗi xảy ra! Vui lòng thử lại" }), { appearance: 'error' });
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
                                            {type == 'in' ? formatMessage({ defaultMessage: 'Tải phiếu nhập kho' }) : formatMessage({ defaultMessage: 'Tải phiếu xuất kho' })}
                                        </Modal.Title>
                                    </Modal.Header>
                                    <Modal.Body className="overlay overlay-block cursor-default px-10 pb-15" style={{ position: 'relative' }}>
                                        <i
                                            className="fas fa-times"
                                            onClick={resetData}
                                            style={{ position: 'absolute', top: -45, right: 20, fontSize: 24, cursor: 'pointer' }}
                                        />
                                        <div className='row'>
                                            <div className='col-3'>{formatMessage({ defaultMessage: 'Kho' })} <span className='text-danger'>*</span></div>
                                            <div className='col-9 px-0 mb-6'>
                                                <Field
                                                    name="warehouseId"
                                                    component={ReSelectVertical}
                                                    onChanged={() => {
                                                        setFieldValue('__changed__', true)
                                                        setFileName(null)
                                                        setLinkFile(null)
                                                    }}
                                                    placeholder=""
                                                    label={""}
                                                    customFeedbackLabel={' '}
                                                    options={dataWarehouse?.sme_warehouses?.map(__ => {
                                                        return {
                                                            label: __.name,
                                                            value: __.id
                                                        }
                                                    })}
                                                    isClearable={false}
                                                />
                                            </div>
                                            <div className='col-3'>{formatMessage({ defaultMessage: 'Hình thức {title} kho' }, { title: type == 'in' ? formatMessage({ defaultMessage: 'nhập' }) : formatMessage({ defaultMessage: 'xuất' }) })} <span className='text-danger'>*</span></div>
                                            <div className='col-9 px-0 mb-6'>
                                                <Field
                                                    name="protocol"
                                                    required
                                                    component={ReSelectVertical}
                                                    onChange={() => {
                                                        setFieldValue('__changed__', true)
                                                    }}
                                                    placeholder=""
                                                    label={""}
                                                    customFeedbackLabel={' '}
                                                    options={type == 'in' ? PROTOCOL_IN.filter(__ => __.value != 0 && __.value != 1) : PROTOCOL_OUT.filter(__ => __.value != 0)}
                                                    isClearable={false}
                                                />
                                            </div>
                                            <div className='col-3'>{formatMessage({ defaultMessage: 'Ghi chú' })}</div>
                                            <div className='col-9 px-0 mb-6'>
                                                <Field
                                                    name="note"
                                                    component={TextArea}
                                                    placeholder={formatMessage({ defaultMessage: "Nhập ghi chú" })}
                                                    label={''}
                                                    required={false}
                                                    customFeedbackLabel={' '}
                                                    cols={['', 'col-12']}
                                                    countChar
                                                    rows={4}
                                                    maxChar={'255'}
                                                />
                                            </div>
                                            <div className='col-3'>{formatMessage({ defaultMessage: 'Loại sản phẩm' })}</div>
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
                                                {/* <a
                                                    href={
                                                        type == 'in'
                                                            ? 'https://prod-statics.s3.ap-southeast-1.amazonaws.com/template/UB_ma%CC%82%CC%83u_phie%CC%82%CC%81u+nha%CC%A3%CC%82p+kho.xlsx'
                                                            : 'https://prod-statics.s3.ap-southeast-1.amazonaws.com/template/UB_mẫu_phiếu+xuất+kho.xlsx'
                                                    }                                                
                                                > */}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (!!values?.productType && values?.productType.value == 0) {
                                                            saveAs(
                                                                type == 'in' ? 'https://prod-statics.s3.ap-southeast-1.amazonaws.com/template/UB_mau_phieunhapkho.xlsx' : 'https://prod-statics.s3.ap-southeast-1.amazonaws.com/template/UB_mau_phieuxuatkho.xlsx',
                                                                type == 'in' ? 'UB_mau_phieunhapkho' : 'UB_mau_phieuxuatkho'
                                                            )
                                                        } else {
                                                            saveAs(
                                                                type == 'in' ? 'https://prod-statics.s3.ap-southeast-1.amazonaws.com/template/Stagging/UB_mau_phieunhapkho_HSD.xlsx' : 'https://prod-statics.s3.ap-southeast-1.amazonaws.com/template/Stagging/UB_mau_phieuxuakho_HSD.xlsx',
                                                                type == 'in' ? 'UB_mau_phieunhapkho_HSD' : 'UB_mau_phieuxuatkho_HSD'
                                                            )
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
                                                <div className='text-secondary-custom fs-14'>{formatMessage({ defaultMessage: 'File nhập có dung lượng tối đa {max}MB và {maxRecord} bản ghi' }, { max: 5, maxRecord: '200' })}</div>
                                            </div>


                                        </div>
                                        {/* {
                                            <LoadingDialog show={loadingWarehouseUserCreateBill} />
                                        } */}
                                    </Modal.Body>
                                    <Modal.Footer className="form" style={{ borderTop: '1px solid #dbdbdb', justifyContent: 'end', paddingTop: 10, paddingBottom: 10 }} >
                                        <div className="form-group">
                                            {/* <button
                                                type="button"
                                                onClick={resetData}
                                                className="btn btn-secondary mr-5"
                                                style={{ width: 100 }}
                                            >
                                                Thoát
                                            </button> */}
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

export default memo(ModalUploadFile);