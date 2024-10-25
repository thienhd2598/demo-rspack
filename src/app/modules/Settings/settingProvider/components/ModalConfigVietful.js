import React from 'react'
import { Modal } from 'react-bootstrap';
import { useIntl } from 'react-intl';
import { RadioGroup } from '../../../../../_metronic/_partials/controls/forms/RadioGroup';
import { Field, Formik } from 'formik';

export const ModalConfigVietful = ({ show, onHide, onSubmit, config, setConfig }) => {
    const { formatMessage } = useIntl();
    const configOptions = [
        {
            value: 1,
            label: formatMessage({defaultMessage: 'SKU'})
        },
        {
            value: 2,
            label: formatMessage({defaultMessage: 'GTIN'})
        }
    ]
    return (
        <Formik
            initialValues={{ radio_single: config }}  // Provide initial values
            onSubmit={(values) => onSumit(values)}    // Handle form submission
        >
            {({ values, setFieldValue }) => {
                return (
                    <Modal
                        onHide={() => {
                            setFieldValue('radio_single', 1)
                            setConfig(1)
                            onHide()
                        }}
                        show={show}
                        aria-labelledby="example-modal-sizes-title-md"
                        centered
                    >
                        <Modal.Body className="overlay overlay-block cursor-default text-center">
                            <div className="mb-6" style={{ fontSize: 18}}>
                                Chọn loại mã sản phẩm để đồng bộ sang Vietful
                            </div>
                            <div className='d-flex justify-content-center'>
                                <Field 
                                    name={`radio_single`}
                                    component={RadioGroup}
                                    value={values.radio_single}
                                    customFeedbackLabel={" "}
                                    options={configOptions}
                                    onChangeState={(value) => {
                                        setFieldValue('radio_single', value);
                                        setConfig(value);
                                    }}
                                />
                            </div>
                            <div className='d-flex justify-content-center'>
                                <button onClick={() => {
                                    setFieldValue('radio_single', 1)
                                    setConfig(1)
                                    onHide()
                                }} className="btn btn-secondary mr-4" style={{ width: 120 }}>
                                    {formatMessage({ defaultMessage: "Hủy" })}
                                </button>
                                <button onClick={() => {
                                    setFieldValue('radio_single', 1)
                                    setConfig(1)
                                    onSubmit()
                                }} className="btn btn-primary mr-4" style={{ width: 120 }}>
                                    {formatMessage({ defaultMessage: "Đồng bộ" })}
                                </button>
                            </div>
                        </Modal.Body>
                    </Modal>
                )
            }}
        </Formik>
    );
};