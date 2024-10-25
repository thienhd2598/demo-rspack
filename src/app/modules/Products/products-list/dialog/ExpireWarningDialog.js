import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useIntl } from 'react-intl';
import { InputSelectAddons } from '../../../../../_metronic/_partials/controls/forms/InputSelectAddons';
import { Field, Formik } from 'formik';
import { Form } from 'formik';
import * as Yup from "yup";
import { useProductsUIContext } from '../../ProductsUIContext';
import mutate_userUpdateProductWarningExpired from '../../../../../graphql/mutate_userUpdateProductWarningExpired';
import { useMutation } from '@apollo/client';
import { useToasts } from 'react-toast-notifications';

const ExpireWarningDialog = ({
    showDialog,
    dataProducts,
    onHide,
    setDataResults
}) => {
    const {formatMessage} = useIntl()

    const initialValues = {
        expireTime: null,
        stopSellingTime: null,
    }

    const productEditSchema = {
        expireTime: Yup.number().notRequired()
            .min(0, formatMessage({ defaultMessage: "Giá trị cần nhập {min}->{max}" }, { min: 0, max: '365' }))
            .max(365, formatMessage({ defaultMessage: 'Mốc cảnh báo tối đa là {max} ngày' }, { max: '365' }))
            .nullable(),
        stopSellingTime: Yup.number().notRequired()
            .min(0, formatMessage({ defaultMessage: "Giá trị cần nhập {min}->{max}" }, { min: 0, max: '365' }))
            .max(365, formatMessage({ defaultMessage: 'Mốc cảnh báo tối đa là {max} ngày' }, { max: '365' }))
            .nullable(),
        };

    const {addToast} = useToasts()

    const [mutate, {loading}] = useMutation(mutate_userUpdateProductWarningExpired)

    return (
        <Formik
            initialValues={initialValues}
            enableReinitialize={true}
            validationSchema={Yup.object().shape(productEditSchema)}
            onSubmit={async (values, {resetForm}) => {
                let {data} = await mutate({
                    variables: {
                        products: dataProducts?.map(product => {
                            let body = { product_id: product?.id }
                            if(!!values?.stopSellingTime || values?.stopSellingTime == 0 ) {
                                body = {
                                    ...body,
                                    expired_stop_sale_days: Number(values?.stopSellingTime)
                                }
                            }
                            if(!!values?.expireTime || values?.expireTime == 0 ) {
                                body = {
                                    ...body,
                                    expired_warning_days: Number(values?.expireTime)
                                }
                            }
                            return {
                                ...body
                            }
                        })
                    }
                })
                if(data?.userUpdateProductWarningExpired?.success) {
                    setDataResults({
                        total: data?.userUpdateProductWarningExpired?.total,
                        total_success: data?.userUpdateProductWarningExpired?.totalSuccess,
                        errors: data?.userUpdateProductWarningExpired?.errors
                    })
                    resetForm();
                    onHide()
                } else {
                    addToast(data?.userUpdateProductWarningExpired?.message || "Cập nhật cảnh báo hạn thất bại", { appearance: 'error' })
                }
            }}
        >
            {({handleSubmit, errors}) => {
                return (
                    <Modal
                        show={showDialog}
                        aria-labelledby="example-modal-sizes-title-md"
                        centered
                        onHide={onHide}
                        backdrop={true}
                        // dialogClassName={'body-dialog-connect'}
                    >
                        <Modal.Header>
                            <Modal.Title>
                                {formatMessage({defaultMessage:'Cài đặt cảnh báo hạn'})}
                            </Modal.Title>
                        </Modal.Header>
                        <Modal.Body className="overlay overlay-block cursor-default">
                            <i
                                className="fas fa-times"
                                onClick={onHide}
                                style={{ position: 'absolute', top: -45, right: 20, fontSize: 20, cursor: 'pointer' }}
                            />
                            <div className='row d-flex align-items-center'>
                                <div className="col-4">Mốc cảnh báo hết hạn: </div>
                                <div className="col-6">
                                    <Field
                                        name="expireTime"
                                        component={InputSelectAddons}
                                        addOnRight="ngày"
                                        type='number'
                                        placeholder=""
                                        required={false}
                                        customFeedbackLabel={' '}
                                        absolute
                                    />
                                </div>
                            </div>
                            <div className='row mt-6 d-flex align-items-center'>
                                <div className="col-4">Mốc dừng bán: </div>
                                <div className="col-6">
                                    <Field
                                        name="stopSellingTime"
                                        component={InputSelectAddons}
                                        addOnRight="ngày"
                                        type='number'
                                        placeholder=""
                                        required={false}
                                        customFeedbackLabel={' '}
                                        absolute
                                    />
                                </div>
                            </div>
                        </Modal.Body>
                        <Modal.Footer className="form" style={{ borderTop: '1px solid #dbdbdb', justifyContent: 'end', paddingTop: 10, paddingBottom: 10 }} >
                            <div className="form-group">
                                <button
                                    type="button"
                                    onClick={onHide}
                                    className="btn btn-elevate mr-3"
                                    style={{ width: 100 }}
                                >
                                    Đóng
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    className="btn btn-primary btn-elevate mr-3"
                                    style={{ width: 100 }}
                                    disabled={loading}
                                >
                                    Cập nhật
                                </button>
                            </div>
                        </Modal.Footer>
                    </Modal >
                )
            }}
        </Formik>
    )
};

export default memo(ExpireWarningDialog);