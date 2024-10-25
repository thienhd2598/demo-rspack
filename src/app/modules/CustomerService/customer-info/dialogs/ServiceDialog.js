import { useMutation } from '@apollo/client';
import { Field, Formik } from 'formik';
import React, { Fragment, memo, useCallback, useMemo, useState } from 'react';
import { Modal } from 'react-bootstrap';
import { useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';
import * as Yup from "yup";
import makeAnimated from 'react-select/animated';
import { ReSelectVertical } from '../../../../../_metronic/_partials/controls/forms/ReSelectVertical';
import { InputVertical, TextArea } from '../../../../../_metronic/_partials/controls';
import { toAbsoluteUrl } from '../../../../../_metronic/_helpers';
import LoadingDialog from '../../../ProductsStore/product-new/LoadingDialog';
import mutate_crmCreateSupport from '../../../../../graphql/mutate_crmCreateSupport';
import mutate_crmUpdateSupport from '../../../../../graphql/mutate_crmUpdateSupport';

const animatedComponents = makeAnimated();

const ServiceDialog = ({ show, onHide, currentSupportUpdate, optionsSupport, idCustomer }) => {
    const { addToast } = useToasts();
    const { formatMessage } = useIntl();

    const [crmCreateSupport, { loading: loadingCrmCreateSupport }] = useMutation(mutate_crmCreateSupport, {
        awaitRefetchQueries: true,
        refetchQueries: ['crmSupportByCustomer']
    });

    const [crmUpdateSupport, { loading: loadingCrmUpdateSupport }] = useMutation(mutate_crmUpdateSupport, {
        awaitRefetchQueries: true,
        refetchQueries: ['crmSupportByCustomer']
    });

    const isActionUpdate = useMemo(() => !!currentSupportUpdate, [currentSupportUpdate]);

    const initialValues = useMemo(() => {
        if (!currentSupportUpdate) return {};

        const { type, content } = currentSupportUpdate || {};

        return {
            list_type: optionsSupport?.filter(op => !!type ? JSON.parse(type)?.some(item => item == op?.value) : false),
            content
        }
    }, [optionsSupport, currentSupportUpdate]);

    const validateSchema = Yup.object().shape({
        list_type: Yup.array().required(formatMessage({ defaultMessage: 'Vui lòng chọn kênh liên hệ' }))
    });    

    const onCreateCustomer = useCallback(async (values) => {
        try {
            const { list_type, content } = values || {};

            const body = {
                ...(isActionUpdate ? {
                    id: currentSupportUpdate?.id
                } : {
                    crm_customer_id: idCustomer
                }),
                list_type: list_type?.map(item => item?.value),
                content
            };

            console.log({ body })

            if (isActionUpdate) {
                const { data } = await crmUpdateSupport({
                    variables: body
                });

                if (!!data?.crmUpdateSupport?.success) {
                    addToast(formatMessage({ defaultMessage: 'Cập nhật hoạt động thành công' }), { appearance: "success" });
                } else {
                    addToast(formatMessage({ defaultMessage: 'Cập nhật hoạt động thất bại' }), { appearance: "error" });
                }
            } else {
                const { data } = await crmCreateSupport({
                    variables: body
                });

                if (!!data?.crmCreateSupport?.success) {
                    addToast(formatMessage({ defaultMessage: 'Thêm hoạt động thành công' }), { appearance: "success" });
                } else {
                    addToast(formatMessage({ defaultMessage: 'Thêm hoạt động thất bại' }), { appearance: "error" });
                }
            }

            onHide();
        } catch (error) {
            addToast(formatMessage({ defaultMessage: 'Đã có lỗi xảy ra, xin vui lòng thử lại' }), { appearance: "error" });
            onHide();
        }
    }, [idCustomer, isActionUpdate, currentSupportUpdate]);

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
                resetForm,
                setFieldValue,
                errors,
            }) => {
                return (
                    <Fragment>
                        <LoadingDialog show={loadingCrmCreateSupport || loadingCrmUpdateSupport} />
                        {!loadingCrmCreateSupport && !loadingCrmUpdateSupport && <Modal
                            show={show}
                            size="md"
                            aria-labelledby="example-modal-sizes-title-sm"
                            dialogClassName="modal-actions-cost-income"
                            centered
                            onHide={() => { }}
                            backdrop={true}
                        >
                            <Modal.Header closeButton={true}>
                                <Modal.Title>
                                    {isActionUpdate ? formatMessage({ defaultMessage: 'Cập nhật hoạt động CSKH' }) : formatMessage({ defaultMessage: 'Thêm hoạt động CSKH' })}
                                </Modal.Title>
                            </Modal.Header>
                            <Modal.Body className="overlay overlay-block cursor-default">
                                <div className='row'>
                                    <div className='col-2 text-right'>
                                        <span style={{ position: 'relative', top: 10 }}>
                                            <span>{formatMessage({ defaultMessage: 'Kênh liên hệ' })}</span>
                                            <span className='text-danger ml-1'>*</span>
                                        </span>
                                    </div>
                                    <div className='col-10'>
                                        <Field
                                            name={`list_type`}
                                            component={ReSelectVertical}
                                            placeholder={formatMessage({ defaultMessage: 'Chọn kênh liên hệ' })}
                                            isMulti
                                            label={""}                                            
                                            customFeedbackLabel={' '}
                                            components={animatedComponents}
                                            options={optionsSupport}
                                            isClearable={true}
                                        />
                                    </div>
                                </div>
                                <div className='row'>
                                    <div className='col-2 text-right'>
                                        <span style={{ position: 'relative', top: 10 }}>
                                            <span>{formatMessage({ defaultMessage: 'Ghi chú' })}</span>
                                        </span>
                                    </div>
                                    <div className='col-10'>
                                        <Field
                                            name={`content`}
                                            component={TextArea}
                                            rows={5}
                                            cols={['col-12', 'col-12']}
                                            countChar
                                            maxChar={550}
                                            maxLength={550}
                                            placeholder={formatMessage({ defaultMessage: 'Nhập ghi chú' })}
                                            label={""}
                                            nameTxt={"--"}
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
                                        onClick={() => {
                                            onHide();
                                            resetForm();
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
                                        onClick={async () => {
                                            let error = await validateForm();

                                            if (Object.keys(error).length > 0) {
                                                handleSubmit();
                                                return;
                                            } else {
                                                onCreateCustomer(values);
                                                resetForm();
                                            }
                                        }}
                                    >
                                        {isActionUpdate ? formatMessage({ defaultMessage: 'Cập nhật' }) : formatMessage({ defaultMessage: 'Tạo' })}
                                    </button>
                                </div>
                            </Modal.Footer>
                        </Modal>}
                    </Fragment>
                )
            }}
        </Formik>
    )
};

export default memo(ServiceDialog);
