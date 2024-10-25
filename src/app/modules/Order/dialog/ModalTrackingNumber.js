import { useMutation, useQuery } from '@apollo/client';
import { Field, Formik } from 'formik';
import React, { Fragment, memo, useCallback, useMemo, useRef, useState } from 'react';
import { Modal, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';
import * as Yup from "yup";
import _ from 'lodash';
import dayjs from 'dayjs';
import { saveAs } from 'file-saver';
import axios from "axios";
import { InputVertical } from '../../../../_metronic/_partials/controls';
import { useSelector } from 'react-redux';
import LoadingDialog from '../../Products/product-new/LoadingDialog';
import mutate_updateManualPackageLabel from '../../../../graphql/mutate_updateManualPackageLabel';
import query_scGetOrder from '../../../../graphql/query_scGetOrder';

const CancelToken = axios.CancelToken;

const ModalTrackingNumber = ({
    currentOrder,
    onHide
}) => {
    const user = useSelector((state) => state.auth.user);
    const refInputFile = useRef();
    const refCancel = useRef();
    const { addToast } = useToasts();
    const { formatMessage } = useIntl();
    const [s3Document, setS3Document] = useState(null);
    const [loadingUploadFile, setLoadingUploadFile] = useState(false);
    const [initialValues, setInitialValues] = useState(null);
    const [pollTime, setPollTime] = useState(1500);

    const BILL_OF_LADING_PROCESSING = 1

    const [updateManualPackageLabel, { loading: loadingUpdateManualPackageLabel }] = useMutation(mutate_updateManualPackageLabel, {
        awaitRefetchQueries: true,
        refetchQueries: ['scGetPackages', 'scPackageAggregate']
    });

    const { data: orderDetail } = useQuery(query_scGetOrder, {
        variables: {
            id: Number(currentOrder?.id),
            context: 'order'
        },
        pollInterval: pollTime,
        skip: !currentOrder?.id,
        fetchPolicy: 'cache-and-network',
    });

    useMemo(() => {
        if(orderDetail?.findOrderDetail?.logisticsPackages[0]?.create_doc_status == BILL_OF_LADING_PROCESSING) {
            setPollTime(1500)
        } else {
            setPollTime(0)
        }
    }, [orderDetail])

    useMemo(() => {
        setS3Document(orderDetail?.findOrderDetail?.logisticsPackages?.[0]?.s3_document);
        setInitialValues({
            tracking_number: orderDetail?.findOrderDetail?.logisticsPackages?.[0]?.tracking_number
        })
    }, [orderDetail]);

    const validateSchema = Yup.object().shape({
        tracking_number: Yup.string()
            .nullable()
            .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: formatMessage({ defaultMessage: "Mã vận đơn" }).toLowerCase() }))
            .max(20, formatMessage({ defaultMessage: "{name} tối đa {length} ký tự" }, { length: 20, name: formatMessage({ defaultMessage: "Mã vận đơn" }) }))
            .test(
                'chua-ky-tu-space-o-dau-cuoi',
                formatMessage({ defaultMessage: 'Mã vận đơn không được chứa dấu cách ở đầu và cuối' }),
                (value, context) => {
                    if (!!value) {
                        return value.length == value.trim().length;
                    }
                    return true;
                },
            )
            .test(
                'chua-ky-tu-2space',
                formatMessage({ defaultMessage: 'Mã vận đơn không được chứa 2 dấu cách liên tiếp' }),
                (value, context) => {
                    if (!!value) {
                        return !(/\s\s+/g.test(value))
                    }
                    return true;
                },
            )
    })

    const onUploadFile = useCallback(async (file) => {
        try {
            let formData = new FormData();
            formData.append('type', 'file')
            formData.append('file', file, file.name || 'file.jpg')

            setLoadingUploadFile(true);
            let res = await axios.post(process.env.REACT_APP_URL_FILE_UPLOAD, formData, {
                isSubUser: user?.is_subuser,
                cancelToken: new CancelToken(function executor(c) {
                    refCancel.current = c;
                }),
            })

            setLoadingUploadFile(false);
            if (res.data?.success) {
                setS3Document(res.data?.data.source);
            } else {
                addToast(formatMessage({ defaultMessage: 'Tải ảnh không thành công.' }), { appearance: 'error' });
            }
        } catch (error) {
            setLoadingUploadFile(false);
            addToast(formatMessage({ defaultMessage: 'Đã có lỗi xảy ra' }), { appearance: 'error' });
        }
    }, [user]);

    return (
        <Formik
            initialValues={initialValues}
            validationSchema={validateSchema}
            enableReinitialize
        >
            {({
                handleSubmit,
                values,
                validateForm,
                setFieldValue,
                errors,
                resetForm,
            }) => {
                return (
                    <Fragment>
                        <LoadingDialog show={loadingUpdateManualPackageLabel} />
                        {!loadingUpdateManualPackageLabel && <Modal
                            show={!!currentOrder}
                            size="md"
                            aria-labelledby="example-modal-sizes-title-sm"
                            dialogClassName="modal-actions-cost-income"
                            centered
                            onHide={() => { }}
                            backdrop={true}
                        >
                            <Modal.Header closeButton={true}>
                                <Modal.Title>
                                    {formatMessage({ defaultMessage: 'Cập nhật vận đơn' })}
                                </Modal.Title>
                            </Modal.Header>
                            <Modal.Body className="overlay overlay-block cursor-default">
                                <div className='row mb-6'>
                                    <div className='col-3 text-right'>
                                        <span style={{ position: 'relative', top: 10 }}>
                                            <span>{formatMessage({ defaultMessage: 'Mã vận đơn' })}</span>
                                            <span className='text-danger ml-1'>*</span>
                                        </span>
                                    </div>
                                    <div className='col-9'>
                                        <Field
                                            disabled={orderDetail?.findOrderDetail?.logisticsPackages?.[0]?.create_doc_status == BILL_OF_LADING_PROCESSING}
                                            name={`tracking_number`}
                                            component={InputVertical}
                                            placeholder={formatMessage({ defaultMessage: 'Nhập mã vận đơn' })}
                                            label={""}
                                            customFeedbackLabel={' '}
                                            countChar
                                            maxChar={20}
                                            maxLength={20}
                                        />
                                    </div>
                                </div>
                                <div className='row'>
                                    <div className='col-3 text-right'>
                                        <span style={{ position: 'relative', top: 10 }}>
                                            <span>{formatMessage({ defaultMessage: 'Phiếu vận đơn' })}</span>
                                        </span>
                                    </div>
                                    {orderDetail?.findOrderDetail?.logisticsPackages[0]?.create_doc_status == BILL_OF_LADING_PROCESSING ? (
                                        <span style={{top: '10px'}} className="spinner spinner-primary" />
                                    ) : (
                                        <div className='col-9'>
                                        <div className='d-flex align-items-center'>
                                            <input
                                                ref={refInputFile}
                                                style={{ display: 'none' }}
                                                multiple
                                                type="file"
                                                accept=".pdf"
                                                onChange={async e => {
                                                    let _file = e.target.files[0];
                                                    if (_file.size > 2 * 1024 * 1024) {
                                                        addToast(formatMessage({ defaultMessage: 'Phiếu vận đơn tối đa 2MB.' }), { appearance: 'error' });
                                                        return;
                                                    }
                                                    refInputFile.current.value = null;
                                                    onUploadFile(_file);
                                                }}
                                            />
                                            {!!s3Document ? (
                                                <div className="d-flex align-items-center text-info">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-file-earmark-pdf" viewBox="0 0 16 16">
                                                        <path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2M9.5 3A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5z" />
                                                        <path d="M4.603 14.087a.8.8 0 0 1-.438-.42c-.195-.388-.13-.776.08-1.102.198-.307.526-.568.897-.787a7.7 7.7 0 0 1 1.482-.645 20 20 0 0 0 1.062-2.227 7.3 7.3 0 0 1-.43-1.295c-.086-.4-.119-.796-.046-1.136.075-.354.274-.672.65-.823.192-.077.4-.12.602-.077a.7.7 0 0 1 .477.365c.088.164.12.356.127.538.007.188-.012.396-.047.614-.084.51-.27 1.134-.52 1.794a11 11 0 0 0 .98 1.686 5.8 5.8 0 0 1 1.334.05c.364.066.734.195.96.465.12.144.193.32.2.518.007.192-.047.382-.138.563a1.04 1.04 0 0 1-.354.416.86.86 0 0 1-.51.138c-.331-.014-.654-.196-.933-.417a5.7 5.7 0 0 1-.911-.95 11.7 11.7 0 0 0-1.997.406 11.3 11.3 0 0 1-1.02 1.51c-.292.35-.609.656-.927.787a.8.8 0 0 1-.58.029m1.379-1.901q-.25.115-.459.238c-.328.194-.541.383-.647.547-.094.145-.096.25-.04.361q.016.032.026.044l.035-.012c.137-.056.355-.235.635-.572a8 8 0 0 0 .45-.606m1.64-1.33a13 13 0 0 1 1.01-.193 12 12 0 0 1-.51-.858 21 21 0 0 1-.5 1.05zm2.446.45q.226.245.435.41c.24.19.407.253.498.256a.1.1 0 0 0 .07-.015.3.3 0 0 0 .094-.125.44.44 0 0 0 .059-.2.1.1 0 0 0-.026-.063c-.052-.062-.2-.152-.518-.209a4 4 0 0 0-.612-.053zM8.078 7.8a7 7 0 0 0 .2-.828q.046-.282.038-.465a.6.6 0 0 0-.032-.198.5.5 0 0 0-.145.04c-.087.035-.158.106-.196.283-.04.192-.03.469.046.822q.036.167.09.346z" />
                                                    </svg>
                                                    <span className="ml-2" onClick={() => saveAs(s3Document, `Phieu_van_don`)}>
                                                        {s3Document}
                                                    </span>
                                                </div>
                                            ) : (
                                                    <button
                                                    className="btn btn-primary d-flex align-items-center justify-content-center"
                                                    style={{ minWidth: 100 }}
                                                    onClick={() => refInputFile.current.click()}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="mr-2 bi bi-upload" viewBox="0 0 16 16">
                                                        <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5" />
                                                        <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708z" />
                                                    </svg>
                                                    
                                                </button>
                                            )}
                                            {loadingUploadFile && <div className='ml-4'>
                                                <span style={{top: '20px'}} className="spinner spinner-primary" />
                                            </div>}
                                        </div>
                                        {!!s3Document && (
                                            <div className="d-flex align-items-center mt-2 text-primary">
                                                <span
                                                    className="cursor-pointer"
                                                    onClick={() => refInputFile.current.click()}
                                                >
                                                    {formatMessage({ defaultMessage: 'Thay đổi' })}
                                                </span>
                                                <span
                                                    className="ml-4 cursor-pointer"
                                                    onClick={() => setS3Document(null)}
                                                >
                                                    {formatMessage({ defaultMessage: 'Xóa' })}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    )}
                                   
                                </div>
                            </Modal.Body>
                            <Modal.Footer className="form" style={{ borderTop: '1px solid #dbdbdb', justifyContent: 'end', paddingTop: 10, paddingBottom: 10 }} >
                                <div className="form-group">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onHide();
                                            resetForm();
                                            setS3Document(null);
                                        }}
                                        className="btn btn-secondary mr-3"
                                        style={{ width: 120 }}
                                    >
                                        {formatMessage({ defaultMessage: 'Hủy' })}
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        style={{ width: 120 }}
                                        disabled={orderDetail?.findOrderDetail?.logisticsPackages[0]?.create_doc_status == BILL_OF_LADING_PROCESSING}
                                        onClick={async () => {
                                            let error = await validateForm();

                                            if (Object.keys(error).length > 0) {
                                                handleSubmit();
                                                return;
                                            }

                                            if (loadingUploadFile) {
                                                addToast(formatMessage({ defaultMessage: 'Phiếu vận đơn đang tải lên. Xin vui lòng thử lại sau.' }), { appearance: 'error' })
                                                return;            
                                            }

                                            const { data } = await updateManualPackageLabel({
                                                variables: {
                                                    tracking_number: values?.tracking_number,
                                                    s3_document: s3Document,
                                                    order_id: currentOrder?.id
                                                }
                                            });

                                            if (data?.updateManualPackageLabel?.success) {
                                                resetForm();
                                                setS3Document(null);
                                                onHide();
                                                addToast(formatMessage({ defaultMessage: 'Cập nhật vận đơn thành công' }), { appearance: "success" });
                                            } else {
                                                addToast(data?.updateManualPackageLabel?.message || formatMessage({ defaultMessage: 'Cập nhật vận đơn thất bại' }), { appearance: 'error' });
                                            }
                                        }}
                                    >
                                        {formatMessage({ defaultMessage: 'Cập nhật' })}
                                    </button>
                                </div>
                            </Modal.Footer>
                        </Modal>}
                    </Fragment>
                )
            }}
        </Formik >
    )
};

export default memo(ModalTrackingNumber);