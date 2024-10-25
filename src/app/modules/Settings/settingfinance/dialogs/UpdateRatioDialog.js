import { useMutation } from '@apollo/client';
import { Field, Formik } from 'formik';
import React, { Fragment, memo, useCallback, useMemo, useState } from 'react';
import { Modal, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';
import * as Yup from "yup";
import LoadingDialog from '../../../ProductsStore/product-new/LoadingDialog';
import { InputVertical } from '../../../../../_metronic/_partials/controls';
import mutate_cfCreateOrUpdatePercentFee from '../../../../../graphql/mutate_cfCreateOrUpdatePercentFee';
import mutate_cfGeneratePercentFeeAuto from '../../../../../graphql/mutate_cfGeneratePercentFeeAuto';
import AuthorizationWrapper from '../../../../../components/AuthorizationWrapper';

const UpdateRatioDialog = ({ currentData, onHide, optionsStore }) => {
    const { addToast } = useToasts();
    const { formatMessage } = useIntl();

    const validationSchema = null;
    const initialValue = useMemo(() => {
        return {
            commission_fee: currentData?.setting_percent_fee?.find(_item => _item?.key == 'commission_fee')?.percent,
            payment_fee: currentData?.setting_percent_fee?.find(_item => _item?.key == 'payment_fee')?.percent,
            service_fee: currentData?.setting_percent_fee?.find(_item => _item?.key == 'service_fee')?.percent
        }
    }, [currentData]);

    const [cfCreateOrUpdatePercentFee, { loading: loadingCfCreateOrUpdatePercentFee }] = useMutation(mutate_cfCreateOrUpdatePercentFee, {
        awaitRefetchQueries: true,
        refetchQueries: ['cfGetListSettingPercentFee']
    });

    const [cfGeneratePercentFeeAuto, { loading: loadingCfGeneratePercentFeeAuto }] = useMutation(mutate_cfGeneratePercentFeeAuto, {
        awaitRefetchQueries: true,
    });

    const store = useMemo(() => {
        return optionsStore?.find(st => st?.value == currentData?.store_id)
    }, [currentData, optionsStore]);

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
            }) => {
                return (
                    <Fragment>
                        <LoadingDialog show={loadingCfCreateOrUpdatePercentFee || loadingCfGeneratePercentFeeAuto} />
                        {!loadingCfCreateOrUpdatePercentFee && <Modal
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
                                    {formatMessage({ defaultMessage: 'Cập nhật tỷ lệ phí' })}
                                </Modal.Title>
                            </Modal.Header>
                            <Modal.Body className="overlay overlay-block cursor-default">
                                <div className='d-flex align-items-center mb-2'>
                                    <span className='mr-4'>{formatMessage({ defaultMessage: 'Gian hàng' })}:</span>
                                    <img
                                        style={{ width: 15, height: 15 }}
                                        src={store?.logo}
                                        className="mr-2"
                                    />
                                    <span>{store?.label}</span>
                                </div>
                                <div className='mb-4 d-flex align-items-center justify-content-end'>
                                    <OverlayTrigger
                                        overlay={
                                            <Tooltip>
                                                {formatMessage({ defaultMessage: 'Tự động tạo hỗ trợ thiết lập tỷ lệ chi phí ban đầu dựa trên các dữ liệu đơn hàng có sẵn trước đó' })}
                                            </Tooltip>
                                        }
                                    >
                                        <span className="ml-1" style={{ position: 'relative', top: '-1px' }}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" class="bi bi-info-circle" viewBox="0 0 16 16">
                                                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                                                <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
                                            </svg>
                                        </span>
                                    </OverlayTrigger>
                                    <span
                                        className='ml-2 text-primary'
                                        role='button'
                                        onClick={async () => {
                                            const { data } = await cfGeneratePercentFeeAuto({
                                                variables: {
                                                    store_id: currentData?.store_id
                                                }
                                            });
                                            
                                            if (!!data?.cfGeneratePercentFeeAuto?.success) {
                                                setFieldValue(`commission_fee`, data?.cfGeneratePercentFeeAuto?.percent_fee?.find(_item => _item?.key == 'commission_fee')?.percent);
                                                setFieldValue(`payment_fee`, data?.cfGeneratePercentFeeAuto?.percent_fee?.find(_item => _item?.key == 'payment_fee')?.percent);
                                                setFieldValue(`service_fee`, data?.cfGeneratePercentFeeAuto?.percent_fee?.find(_item => _item?.key == 'service_fee')?.percent);
                                            } else {
                                                addToast(data?.cfGeneratePercentFeeAuto?.message || formatMessage({ defaultMessage: 'Tự động tạo tỷ lệ phí thất bại' }), { appearance: "error" });
                                            }
                                        }}
                                    >
                                        {formatMessage({ defaultMessage: 'Tự động tạo' })}
                                    </span>
                                </div>
                                <div className='row mb-6'>
                                    <div className='col-3 text-right'>
                                        <span style={{ position: 'relative', top: 10 }}>
                                            <span>{`${formatMessage({ defaultMessage: 'Phí cố định' })} (%)`}</span>
                                        </span>
                                    </div>
                                    <div className='col-9'>
                                        <Field
                                            name={`commission_fee`}
                                            component={InputVertical}
                                            placeholder={formatMessage({ defaultMessage: 'Nhập tỷ lệ phí cố định' })}
                                            type="number"
                                            label={""}
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
                                <div className='row mb-6'>
                                    <div className='col-3 text-right'>
                                        <span style={{ position: 'relative', top: 10 }}>
                                            <span>{`${formatMessage({ defaultMessage: 'Phí thanh toán' })} (%)`}</span>
                                        </span>
                                    </div>
                                    <div className='col-9'>
                                        <Field
                                            name={`payment_fee`}
                                            component={InputVertical}
                                            placeholder={formatMessage({ defaultMessage: 'Nhập tỷ lệ phí thanh toán' })}
                                            type="number"
                                            label={""}
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
                                <div className='row'>
                                    <div className='col-3 text-right'>
                                        <span style={{ position: 'relative', top: 10 }}>
                                            <span>{`${formatMessage({ defaultMessage: 'Phí dịch vụ' })} (%)`}</span>
                                        </span>
                                    </div>
                                    <div className='col-9'>
                                        <Field
                                            name={`service_fee`}
                                            component={InputVertical}
                                            placeholder={formatMessage({ defaultMessage: 'Nhập tỷ lệ phí dịch vụ' })}
                                            type="number"
                                            label={""}
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
                                        onClick={onHide}
                                        className="btn btn-secondary mr-3"
                                        style={{ width: 120 }}
                                    >
                                        {formatMessage({ defaultMessage: 'Hủy' })}
                                    </button>
                                    <AuthorizationWrapper keys={['setting_finance_action']}>
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
                                                        store_id: currentData?.store_id,
                                                        list_percent_fee: [
                                                            { key: 'commission_fee', percent: typeof values[`commission_fee`] == 'number' ? values[`commission_fee`] : null },
                                                            { key: 'payment_fee', percent: typeof values[`payment_fee`] == 'number' ? values[`payment_fee`] : null },
                                                            { key: 'service_fee', percent: typeof values[`service_fee`] == 'number' ? values[`service_fee`] : null },
                                                        ]
                                                    }

                                                    const { data } = await cfCreateOrUpdatePercentFee({
                                                        variables: body
                                                    });

                                                    if (!!data?.cfCreateOrUpdatePercentFee?.success) {
                                                        onHide();
                                                        addToast(formatMessage({ defaultMessage: 'Cập nhật tỷ lệ phí thành công' }), { appearance: "success" });
                                                    } else {
                                                        addToast(formatMessage({ defaultMessage: 'Cập nhật tỷ lệ phí thất bại' }), { appearance: "error" });
                                                    }
                                                }
                                            }}
                                        >
                                            {formatMessage({ defaultMessage: 'Cập nhật' })}
                                        </button>
                                    </AuthorizationWrapper>
                                </div>
                            </Modal.Footer>
                        </Modal>}
                    </Fragment>
                )
            }}
        </Formik>
    )
};

export default memo(UpdateRatioDialog);