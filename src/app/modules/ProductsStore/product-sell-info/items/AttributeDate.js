/*
 * Created by duydatpham@gmail.com on 09/06/2021
 * Copyright (c) 2021 duydatpham@gmail.com
 */
import { useFormikContext } from 'formik';
import React, { memo } from 'react'
import { FieldFeedbackLabel, InputVertical } from '../../../../../_metronic/_partials/controls';
import { useProductsUIContext } from '../../ProductsUIContext';
import DatePicker from "react-datepicker";

import "react-datepicker/dist/react-datepicker.css";


const getFieldCSSClasses = (touched, errors) => {
    const classes = ["form-control"];
    if (touched && errors) {
        classes.push("is-invalid");
    }

    // if (touched && !errors) {
    //     classes.push("is-valid");
    // }

    return classes.join(" ");
};

export default memo(({ value, index, attribute_id, onChange, hasProductChannel }) => {
    const {
        removeValueToAttributeSelected,
        updateValueToAttributeSelected
    } = useProductsUIContext();
    const { setFieldValue, errors, touched, values } = useFormikContext();

    let name = `att-${attribute_id}-${value.code}`
    let editing = `att-${attribute_id}-${value.code}-editing`

    return <div className="input-group mb-4">
        <DatePicker className='form-control' selected={values[name]} onChange={(date) => {
            setFieldValue(name, date)
            !!onChange && onChange()
            setFieldValue('__changed__', true)
        }} />
        {/* <div className="input-group-append">
            <button className="btn btn-light-success" type="button"><i className="fas fa-sort-amount-up-alt"></i></button>
        </div> */}
        {
            (!hasProductChannel || !values[editing]) && <div className="input-group-append" style={{ zIndex: 1 }} >
                <button className="btn btn-light-danger" type="button"
                    onClick={e => {
                        e.preventDefault();
                        removeValueToAttributeSelected(attribute_id, value.code)
                        setFieldValue('__changed__', true)
                    }}
                ><i className="far fa-trash-alt"></i></button>
            </div>
        }
        <FieldFeedbackLabel
            error={errors[name]}
            touched={touched[name]}
            label={false}
            type={'text'}
            customFeedbackLabel={''}
        />
    </div>
})