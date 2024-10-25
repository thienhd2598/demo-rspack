import { useMutation } from '@apollo/client';
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
import { InputVertical, TextArea } from '../../../../_metronic/_partials/controls';
import { useSelector } from 'react-redux';
import LoadingDialog from '../../Products/product-new/LoadingDialog';
import mutate_updateManualPackageLabel from '../../../../graphql/mutate_updateManualPackageLabel';
import mutate_confirmDeliveryOrder from '../../../../graphql/mutate_confirmDeliveryOrder';

const ModalConfirmDelivery = ({
    currentOrder,
    isActionMutilple,
    onResetIsActionMultiple,
    setDataResults,
    onHide,
}) => {
    const { addToast } = useToasts();
    const { formatMessage } = useIntl();

    const OPTIONS_STATUS = [
        {
            status: 'success',
            title: formatMessage({ defaultMessage: 'Giao hàng thành công' }),
            icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="text-success bi bi-clipboard-check" viewBox="0 0 16 16">
                <path fill-rule="evenodd" d="M10.854 7.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 9.793l2.646-2.647a.5.5 0 0 1 .708 0" />
                <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1z" />
                <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0z" />
            </svg>
        },
        {
            status: 'error',
            title: formatMessage({ defaultMessage: 'Giao hàng thất bại' }),
            icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="text-danger bi bi-clipboard-x" viewBox="0 0 16 16">
                <path fill-rule="evenodd" d="M6.146 7.146a.5.5 0 0 1 .708 0L8 8.293l1.146-1.147a.5.5 0 1 1 .708.708L8.707 9l1.147 1.146a.5.5 0 0 1-.708.708L8 9.707l-1.146 1.147a.5.5 0 0 1-.708-.708L7.293 9 6.146 7.854a.5.5 0 0 1 0-.708" />
                <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1z" />
                <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0z" />
            </svg>
        },
    ];

    const [currentStatus, setCurrentStatus] = useState(OPTIONS_STATUS[0].status);

    const [confirmDeliveryOrder, { loading: loadingConfirmDelivery }] = useMutation(mutate_confirmDeliveryOrder, {
        awaitRefetchQueries: true,
        refetchQueries: ['scGetPackages', 'scPackageAggregate']
    });

    const validateSchema = Yup.object().shape({
        fail_reason: Yup.string()
            .nullable()
            .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: formatMessage({ defaultMessage: "Nguyên nhân thất bại" }).toLowerCase() }))
            .max(500, formatMessage({ defaultMessage: "{name} tối đa {length} ký tự" }, { length: 20, name: formatMessage({ defaultMessage: "Nguyên nhân thất bại" }) }))
            .test(
                'chua-ky-tu-space-o-dau-cuoi',
                formatMessage({ defaultMessage: 'Nguyên nhân thất bại không được chứa dấu cách ở đầu và cuối' }),
                (value, context) => {
                    if (!!value) {
                        return value.length == value.trim().length;
                    }
                    return true;
                },
            )
            .test(
                'chua-ky-tu-2space',
                formatMessage({ defaultMessage: 'Nguyên nhân thất bại không được chứa 2 dấu cách liên tiếp' }),
                (value, context) => {
                    if (!!value) {
                        return !(/\s\s+/g.test(value))
                    }
                    return true;
                },
            )
    })

    return (
        <Formik
            initialValues={{}}
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
                        <LoadingDialog show={loadingConfirmDelivery} />
                        {!loadingConfirmDelivery && <Modal
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
                                    {formatMessage({ defaultMessage: 'Xác nhận giao hàng' })}
                                </Modal.Title>
                            </Modal.Header>
                            <Modal.Body className="overlay overlay-block cursor-default">
                                <div className='mb-4'>
                                    <span>{formatMessage({ defaultMessage: 'Chọn trạng thái giao hàng' })}</span>
                                </div>
                                <div className='row mb-4'>
                                    {OPTIONS_STATUS.map(item => {
                                        const isActive = currentStatus == item.status;

                                        return (
                                            <div
                                                className='col-6'
                                                key={`status-${item?.status}`}
                                                onClick={() => setCurrentStatus(item.status)}
                                            >
                                                <div className='d-flex cursor-pointer justify-content-center align-items-center w-100 py-4' style={{ border: `1px solid ${isActive ? '#FE5629' : '#D9D9D9'}`, borderRadius: 4 }}>
                                                    {item?.icon}
                                                    <span className='ml-4'>{item?.title}</span>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                                {currentStatus == 'error' && <Field
                                    name={`fail_reason`}
                                    component={TextArea}
                                    rows={3}
                                    cols={['col-12', 'col-12']}
                                    countChar
                                    required
                                    maxChar={500}
                                    maxLength={500}
                                    label={formatMessage({ defaultMessage: 'Nguyên nhân thất bại' })}
                                    placeholder={formatMessage({ defaultMessage: 'Nhập nguyên nhân thất bại' })}
                                    nameTxt={"--"}
                                    customFeedbackLabel={' '}
                                />}
                            </Modal.Body>
                            <Modal.Footer className="form" style={{ borderTop: '1px solid #dbdbdb', justifyContent: 'end', paddingTop: 10, paddingBottom: 10 }} >
                                <div className="form-group">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onHide();
                                            resetForm();
                                            onResetIsActionMultiple();
                                            setCurrentStatus(OPTIONS_STATUS[0].status);
                                        }}
                                        className="btn btn-secondary mr-3"
                                        style={{ width: 120 }}
                                    >
                                        {formatMessage({ defaultMessage: 'Hủy bỏ' })}
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        style={{ width: 120 }}
                                        // disabled={}
                                        onClick={async () => {
                                            let error = await validateForm();

                                            if (Object.keys(error).length > 0 && currentStatus == OPTIONS_STATUS[1].status) {
                                                handleSubmit();
                                                return;
                                            }

                                            const { data } = await confirmDeliveryOrder({
                                                variables: {
                                                    list_package_id: currentOrder,
                                                    is_success: currentStatus == OPTIONS_STATUS[0].status ? 1 : 0,
                                                    fail_reason: values[`fail_reason`],
                                                }
                                            });

                                            if (isActionMutilple) {
                                                resetForm();
                                                onHide();
                                                onResetIsActionMultiple();
                                                setCurrentStatus(OPTIONS_STATUS[0].status);
                                                setDataResults({
                                                    ...(data?.confirmDeliveryOrder || {}),
                                                    type: 'confirm-delivery-manual'
                                                })
                                                return;
                                            }

                                            if (data?.confirmDeliveryOrder?.total_fail == 0) {
                                                resetForm();
                                                onHide();
                                                onResetIsActionMultiple();
                                                setCurrentStatus(OPTIONS_STATUS[0].status);
                                                addToast(formatMessage({ defaultMessage: 'Xác nhận giao hàng thành công' }), { appearance: "success" });
                                            } else {
                                                addToast(formatMessage({ defaultMessage: 'Xác nhận giao hàng thất bại' }), { appearance: 'error' });
                                            }
                                        }}
                                    >
                                        {formatMessage({ defaultMessage: 'Xác nhận' })}
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

export default memo(ModalConfirmDelivery);