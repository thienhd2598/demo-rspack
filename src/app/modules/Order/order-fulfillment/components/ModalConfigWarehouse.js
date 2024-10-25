import { useMutation } from '@apollo/client';
import { Field, Formik } from 'formik';
import React, { Fragment, memo, useState } from 'react';
import { Modal } from 'react-bootstrap';
import { useIntl } from 'react-intl';
import Select from 'react-select';
import * as Yup from "yup";
import mutate_update_sme_warehouses_by_pk from '../../../../../graphql/mutate_update_sme_warehouses_by_pk';
import LoadingDialog from '../../../FrameImage/LoadingDialog';
import { useToasts } from 'react-toast-notifications';
import { InputVertical } from '../../../../../_metronic/_partials/controls';

const ModalConfigWarehouse = ({
    show,
    onConfirm,
    onHide,
    warehouse,
}) => {
    const { addToast } = useToasts();
    const { formatMessage } = useIntl();

    const [mutateUpdateWarehouse, { loading: loadingUpdateWarehouse }] = useMutation(mutate_update_sme_warehouses_by_pk, {
        awaitRefetchQueries: true,
        refetchQueries: ['sme_warehouses']
    });

    const validateSchema = Yup.object().shape({
        max_mio: Yup.number().nullable()
            .required("Vui lòng thiết lập số kiện hàng tối đa")
            .min(2, formatMessage({ defaultMessage: 'Số đơn tối đa trong một danh sách xử lý phải lớn hơn 1 và nhỏ hơn hoặc bằng 200' }, { min: 2, max: 200 }))
            .max(200, formatMessage({ defaultMessage: 'Số đơn tối đa trong một danh sách xử lý phải lớn hơn 1 và nhỏ hơn hoặc bằng 200' }, { min: 2, max: 200 })),
        max_sio: Yup.number().nullable()
            .required("Vui lòng thiết lập số kiện hàng tối đa")
            .min(2, formatMessage({ defaultMessage: 'Số đơn tối đa trong một danh sách xử lý phải lớn hơn 1 và nhỏ hơn hoặc bằng 200' }, { min: 2, max: 200 }))
            .max(200, formatMessage({ defaultMessage: 'Số đơn tối đa trong một danh sách xử lý phải lớn hơn 1 và nhỏ hơn hoặc bằng 200' }, { min: 2, max: 200 }))
    });

    return (
        <Formik
            initialValues={{
                max_mio: warehouse?.max_mio || null,
                max_sio: warehouse?.max_sio || null,
            }}
            validationSchema={validateSchema}
            enableReinitialize
        >
            {({
                handleSubmit,
                values,
                validateForm,
                resetForm,
            }) => {
                return (
                    <Fragment>
                        <LoadingDialog show={loadingUpdateWarehouse} />
                        <Modal
                            show={show}
                            size="md"
                            aria-labelledby="example-modal-sizes-title-sm"
                            dialogClassName="modal-export-income"
                            centered
                            onHide={() => { }}
                            backdrop={true}
                        >
                            <Modal.Header closeButton={true}>
                                <Modal.Title>{formatMessage({ defaultMessage: 'Thiết lập số kiện hàng tối đa' })}</Modal.Title>
                            </Modal.Header>
                            <Modal.Body className="overlay overlay-block cursor-default">
                                <div className='row mb-4 d-flex align-items-center'>
                                    <div className='col-3 text-right'>
                                        <span>{formatMessage({ defaultMessage: 'Một sản phẩm' })}</span>
                                        <span className='ml-1 text-danger'>*</span>
                                    </div>
                                    <div className='col-9'>
                                        <Field
                                            name={'max_sio'}
                                            component={InputVertical}
                                            type="number"
                                            placeholder={formatMessage({ defaultMessage: 'Nhập giá trị ' })}
                                            addOnRight={''}
                                            required
                                            customFeedbackLabel={' '}
                                        />
                                    </div>
                                </div>
                                <div className='row mb-2 d-flex align-items-center'>
                                    <div className='col-3 text-right'>
                                        <span>{formatMessage({ defaultMessage: 'Nhiều sản phẩm' })}</span>
                                        <span className='ml-1 text-danger'>*</span>
                                    </div>
                                    <div className='col-9'>
                                        <Field
                                            name={'max_mio'}
                                            component={InputVertical}
                                            type="number"
                                            placeholder={formatMessage({ defaultMessage: 'Nhập giá trị ' })}
                                            addOnRight={''}
                                            required
                                            customFeedbackLabel={' '}
                                        />
                                    </div>
                                </div>
                            </Modal.Body>
                            <Modal.Footer className="form" style={{ borderTop: '1px solid #dbdbdb', justifyContent: 'end', paddingTop: 10, paddingBottom: 10 }} >
                                <div className="form-group">
                                    <button
                                        type="button"
                                        onClick={onHide}
                                        className="btn btn-secondary mr-3"
                                        style={{ width: 120 }}
                                    >
                                        {formatMessage({ defaultMessage: 'Hủy' })}
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        style={{ width: 120 }}
                                        onClick={async () => {
                                            let error = await validateForm();

                                            if (Object.keys(error).length > 0) {
                                                handleSubmit();
                                                return;
                                            }

                                            const { data } = await mutateUpdateWarehouse({
                                                variables: {
                                                    userUpdateWarehouseInput: {
                                                        id: warehouse?.id,
                                                        max_mio: values?.max_mio,
                                                        max_sio: values?.max_sio,
                                                    }   
                                                }
                                            })

                                            if (data?.userUpdateWarehouse?.success) {
                                                onConfirm();
                                            } else {
                                                addToast(data?.userUpdateWarehouse?.message || "Thiết lập số kiện hàng thất bại", { appearance: "error" });
                                            }
                                            onHide();
                                        }}
                                    >
                                        {formatMessage({ defaultMessage: 'Cập nhật' })}
                                    </button>
                                </div>
                            </Modal.Footer>
                        </Modal>
                    </Fragment>
                )
            }}
        </Formik>
    )
};


export default memo(ModalConfigWarehouse);