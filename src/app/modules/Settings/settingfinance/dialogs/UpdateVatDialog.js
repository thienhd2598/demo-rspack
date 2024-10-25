import { useMutation } from '@apollo/client';
import { Field, Formik } from 'formik';
import React, { Fragment, memo, useCallback, useMemo, useState } from 'react';
import { Modal, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';
import * as Yup from "yup";
import LoadingDialog from '../../../ProductsStore/product-new/LoadingDialog';
import { InputVertical } from '../../../../../_metronic/_partials/controls';
import { InputSelectAddons } from '../../../../../_metronic/_partials/controls/forms/InputSelectAddons';
import mutate_createOrUpdatePercentVat from '../../../../../graphql/mutate_createOrUpdatePercentVat';
import AuthorizationWrapper from '../../../../../components/AuthorizationWrapper';

const UpdateVat = ({ currentData, onHide }) => {
    const { addToast } = useToasts();
    const { formatMessage } = useIntl();

    const validationSchema = null;
    const initialValue = useMemo(() => {
        return {
            shopee: currentData?.setting_percent_vat?.find(_item => _item?.connector_channel_code == 'shopee')?.percent || 0,
            lazada: currentData?.setting_percent_vat?.find(_item => _item?.connector_channel_code == 'lazada')?.percent || 0,
            tiktok: currentData?.setting_percent_vat?.find(_item => _item?.connector_channel_code == 'tiktok')?.percent || 0,
            other: currentData?.setting_percent_vat?.find(_item => _item?.connector_channel_code == 'other')?.percent || 0,
        }
    }, [currentData]);

    const [createOrUpdatePercentVat, { loading: loadingCreateOrUpdatePercentVat }] = useMutation(mutate_createOrUpdatePercentVat, {
        awaitRefetchQueries: true,
        refetchQueries: ['cfGetListSettingPercentVat']
    })

    return (
        <Formik
            initialValues={initialValue}
            validationSchema={validationSchema}
            enableReinitialize
        >
            {({
                handleSubmit,
                values,
                validateForm,
                setFieldValue,                
                errors,
                resetForm
            }) => {
                return (
                    <Fragment>
                        <LoadingDialog show={loadingCreateOrUpdatePercentVat} />
                        {<Modal
                            show={!!currentData}
                            size="md"
                            aria-labelledby="example-modal-sizes-title-sm"
                            dialogClassName="modal-actions-cost-income"
                            centered
                            onHide={() => { }}
                            backdrop={true}
                        >
                            <Modal.Header closeButton={true}>
                                <Modal.Title>
                                    {formatMessage({ defaultMessage: 'Cập nhật VAT' })}
                                </Modal.Title>
                            </Modal.Header>
                            <Modal.Body className="overlay overlay-block cursor-default">
                                <div className='d-flex align-items-center mb-2'>
                                    <span className='mr-4'>{formatMessage({ defaultMessage: 'Tên phí' })}:</span>
                                    <span>{currentData?.type}</span>
                                </div>
                                <div className='row mb-6'>
                                    <div className='col-3 text-right'>
                                        <span style={{ position: 'relative', top: 10 }}>
                                            <span>{`${formatMessage({ defaultMessage: 'Shopee' })} (%)`}</span>
                                        </span>
                                    </div>
                                    <div className='col-9'>
                                        <Field
                                            name={`shopee`}
                                            component={InputSelectAddons}
                                            placeholder={formatMessage({ defaultMessage: 'Nhập mức thuế' })}
                                            type="number"
                                            label={""}
                                            clearUnit={true}
                                            isAllowed={(values) => {
                                                const { floatValue } = values;

                                                return !floatValue || (0 <= floatValue && floatValue <= 100);
                                            }}
                                            required
                                            customFeedbackLabel={' '}
                                        />
                                    </div>
                                </div>
                                <div className='row mb-6'>
                                    <div className='col-3 text-right'>
                                        <span style={{ position: 'relative', top: 10 }}>
                                            <span>{`${formatMessage({ defaultMessage: 'Lazada' })} (%)`}</span>
                                        </span>
                                    </div>
                                    <div className='col-9'>
                                        <Field
                                            name={`lazada`}
                                            component={InputSelectAddons}
                                            placeholder={formatMessage({ defaultMessage: 'Nhập mức thuế' })}
                                            type="number"
                                            label={""}
                                            clearUnit={true}
                                            isAllowed={(values) => {
                                                const { floatValue } = values;

                                                return !floatValue || (0 <= floatValue && floatValue <= 100);
                                            }}
                                            required
                                            customFeedbackLabel={' '}
                                        />
                                    </div>
                                </div>
                                <div className='row mb-6'>
                                    <div className='col-3 text-right'>
                                        <span style={{ position: 'relative', top: 10 }}>
                                            <span>{`${formatMessage({ defaultMessage: 'Tiktok' })} (%)`}</span>
                                        </span>
                                    </div>
                                    <div className='col-9'>
                                        <Field
                                            name={`tiktok`}
                                            component={InputSelectAddons}
                                            placeholder={formatMessage({ defaultMessage: 'Nhập mức thuế' })}
                                            type="number"
                                            clearUnit={true}
                                            label={""}
                                            isAllowed={(values) => {
                                                const { floatValue } = values;

                                                return !floatValue || (0 <= floatValue && floatValue <= 100);
                                            }}
                                            required
                                            customFeedbackLabel={' '}
                                        />
                                    </div>
                                    
                                </div>
                                <div className='row'>
                                    <div className='col-3 text-right'>
                                        <span style={{ position: 'relative', top: 10 }}>
                                            <span>{`${formatMessage({ defaultMessage: 'Khác' })} (%)`}</span>
                                        </span>
                                    </div>
                                    <div className='col-9'>
                                        <Field
                                            name={`other`}
                                            component={InputSelectAddons}
                                            placeholder={formatMessage({ defaultMessage: 'Nhập mức thuế' })}
                                            type="number"
                                            label={""}
                                            clearUnit={true}
                                            decimalScale={2}
                                            isAllowed={(values) => {
                                                const { floatValue } = values;

                                                return !floatValue || (0 <= floatValue && floatValue <= 100);
                                            }}
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
                                            onHide()
                                            resetForm()
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
                                                const body = {
                                                    type: currentData?.type,
                                                    list_percent_vat: [
                                                        { connector_channel_code: 'shopee', percent: typeof values[`shopee`] == 'number' ? values[`shopee`] : null },
                                                        { connector_channel_code: 'lazada', percent: typeof values[`lazada`] == 'number' ? values[`lazada`] : null },
                                                        { connector_channel_code: 'tiktok', percent: typeof values[`tiktok`] == 'number' ? values[`tiktok`] : null },
                                                        { connector_channel_code: 'other', percent: typeof values[`other`] == 'number' ? values[`other`] : null },
                                                    ]
                                                }

                                                const { data } = await createOrUpdatePercentVat({
                                                    variables: body
                                                });

                                                if (!!data?.createOrUpdatePercentVat?.success) {
                                                    resetForm()
                                                    onHide();
                                                    addToast(formatMessage({ defaultMessage: 'Cập nhật VAT thành công' }), { appearance: "success" });
                                                } else {
                                                    addToast(formatMessage({ defaultMessage: 'Cập nhật VAT thất bại' }), { appearance: "error" });
                                                }
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
        </Formik>
    )
};

export default memo(UpdateVat);