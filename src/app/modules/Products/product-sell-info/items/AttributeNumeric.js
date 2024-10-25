/*
 * Created by duydatpham@gmail.com on 09/06/2021
 * Copyright (c) 2021 duydatpham@gmail.com
 */
import { useFormikContext } from 'formik';
import React, { memo, useRef } from 'react'
import { FieldFeedbackLabel, InputVertical } from '../../../../../_metronic/_partials/controls';
import { useProductsUIContext } from '../../ProductsUIContext';


const getFieldCSSClasses = (touched, errors) => {
    const classes = ["form-control"];
    // if (touched && errors) {
    //     classes.push("is-invalid");
    // }

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
    const { setFieldValue, errors, touched, values, setFieldTouched, submitCount } = useFormikContext();
    const _refsubmitCount = useRef(submitCount)
    let name = `att-${attribute_id}-${value.code}`
    let editing = `att-${attribute_id}-${value.code}-editing`

    return <div className="input-group mb-4">
        <input type="number" className={getFieldCSSClasses(touched[name] || _refsubmitCount.current != submitCount, errors[name])} placeholder=""
            value={values[name] || ''}
            onChange={(e) => {
                setFieldValue(name, e.target.value)
                setFieldValue('__changed__', true)
            }}
            onBlur={(e) => {
                setFieldTouched(name, true)
                updateValueToAttributeSelected(attribute_id, e.target.value, value.code)
                !!onChange && onChange()
            }}
            autoFocus
            style={{ background: '#F7F7FA', borderRadius: 6, border: (touched[name] || submitCount != _refsubmitCount.current) && errors[name] ? '1px solid #f14336' : 'none' }}
            // disabled={hasProductChannel && !!values[editing]}
        />
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
            touched={touched[name] || _refsubmitCount.current != submitCount}
            label={false}
            type={'text'}
            customFeedbackLabel={''}
        />
    </div>
})