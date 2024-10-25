import React, { useMemo, useCallback, memo, useState } from 'react';
import { useIntl } from "react-intl";
import * as Yup from "yup";
import { Field, useFormikContext, Form, Formik } from "formik";
import { useProductsUIContext } from '../../ProductsUIContext';
import { InputVertical } from '../../../../../_metronic/_partials/controls';
import { Modal } from 'react-bootstrap';
import { toAbsoluteUrl } from '../../../../../_metronic/_helpers';

const ModalVariantStockOnHand = ({ currentCodesVariant, onHide }) => {
    const { formatMessage } = useIntl();
    const { values: valuesProduct, setFieldValue } = useFormikContext();
    const { scWarehouses } = useProductsUIContext();

    const initialValues = useMemo(() => {
        const init = scWarehouses?.reduce(
            (result, wh) => {
                result[`variant-${currentCodesVariant}-${wh?.value}-stockOnHand`] = valuesProduct[`variant-${currentCodesVariant}-${wh?.value}-stockOnHand`] || 0;
                return result;
            }, {}
        );

        return init;
    }, [scWarehouses, valuesProduct, currentCodesVariant]);

    const validateSchema = useMemo(() => {
        return Yup.object().shape(scWarehouses.reduce(
            (result, wh) => {
                result[`variant-${currentCodesVariant}-${wh?.value}-stockOnHand`] = Yup.number()
                    .min(0, formatMessage({ defaultMessage: "Giá trị cần nhập {min}->{max}" }, { min: 0, max: '999.999' }))
                    .max(999999, formatMessage({ defaultMessage: "Giá trị cần nhập {min}->{max}" }, { min: 0, max: '999.999' }))
                    .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: formatMessage({ defaultMessage: 'Tồn kho' }) }));

                return result;
            }, {}
        ))
    }, [scWarehouses, currentCodesVariant]);

    return (
        <Modal
            show={!!currentCodesVariant}
            aria-labelledby="example-modal-sizes-title-sm"
            dialogClassName={"modal-show-stock-product"}
            centered
            onHide={onHide}
            backdrop={true}
        >
            <Formik
                initialValues={initialValues}
                validationSchema={validateSchema}
                enableReinitialize
            >
                {({
                    handleSubmit,
                    values,
                    validateForm
                }) => {
                    return (
                        <Form>
                            <Modal.Header closeButton={true}>
                                <Modal.Title>
                                    {formatMessage({ defaultMessage: 'Thiết lập tồn kho' })}
                                </Modal.Title>
                            </Modal.Header>
                            <Modal.Body className="overlay overlay-block cursor-default" style={{ padding: 0 }}>
                                <i
                                    className="fas fa-times"
                                    onClick={onHide}
                                    style={{ position: 'absolute', top: -55, right: 20, fontSize: 20, cursor: 'pointer' }}
                                />
                                <div style={{ padding: '0rem 1rem' }}>
                                    <div className="d-flex align-items-center mt-4 mb-2">
                                        <span style={{ width: '50%' }}>SKU: {valuesProduct[`variant-${currentCodesVariant}-sku`] || '--'}</span>
                                        {/* <span style={{ width: '50%' }}>GTIN: {valuesProduct[`gtin`] || '--'}</span> */}
                                    </div>
                                    <table className="table product-list table-head-custom table-head-bg  table-borderless  table-vertical-center fixed" style={{ tableLayout: 'fixed', borderRight: '1px solid transparent' }}>
                                        <thead>
                                            <tr className="text-left text-uppercase" >
                                                <th style={{ border: '1px solid', fontSize: '12px' }} width='50%'>
                                                    <span className="text-dark-75">{formatMessage({ defaultMessage: 'Kho kênh bán' })}</span>
                                                </th>
                                                <th style={{ border: '1px solid', fontSize: '12px' }} width='50%'>
                                                    <span className="text-dark-75">{formatMessage({ defaultMessage: 'Tồn kho' })}</span>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {scWarehouses?.map((wh, index) => {
                                                return (
                                                    <tr key={`sc-warehouse  -${index}`}>
                                                        <td style={{ border: '1px solid #c8c7c9' }}>
                                                            <span className="text-dark-75" >
                                                                {wh?.label}
                                                            </span>
                                                        </td>
                                                        <td style={{ border: '1px solid #c8c7c9', padding: '1.25rem 0.75rem' }}>
                                                            <Field
                                                                name={`variant-${currentCodesVariant}-${wh?.value}-stockOnHand`}
                                                                component={InputVertical}
                                                                placeholder=""
                                                                label={false}
                                                                type='number'
                                                                customFeedbackLabel={' '}
                                                                absolute={true}
                                                            />
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </Modal.Body>
                            <Modal.Footer className="form" style={{ borderTop: '1px solid #dbdbdb', justifyContent: 'end', paddingTop: 10, paddingBottom: 10 }} >
                                <div className="form-group">
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            let error = await validateForm(values);
                                            const isErrorForm = Object.keys(error)?.length > 0;

                                            if (isErrorForm) {
                                                handleSubmit();
                                            } else {
                                                scWarehouses.forEach(wh => {
                                                    setFieldValue(
                                                        `variant-${currentCodesVariant}-${wh?.value}-stockOnHand`,
                                                        values[`variant-${currentCodesVariant}-${wh?.value}-stockOnHand`] || 0
                                                    );
                                                })
                                                onHide();
                                            }
                                        }}
                                        className="btn btn-primary btn-elevate mr-3"
                                        style={{ width: 100 }}
                                    >
                                        {formatMessage({ defaultMessage: 'Cập nhật' })}
                                    </button>
                                </div>
                            </Modal.Footer>
                        </Form>
                    )
                }}
            </Formik>
        </Modal>
    )
};

export default memo(ModalVariantStockOnHand);