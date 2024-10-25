/*
 * Created by duydatpham@gmail.com on 09/06/2021
 * Copyright (c) 2021 duydatpham@gmail.com
 */
import { useFormikContext } from 'formik';
import React, { memo, useMemo, useRef } from 'react'
import { FieldFeedbackLabel, InputVertical } from '../../../../../_metronic/_partials/controls';
import { useProductsUIContext } from '../../ProductsUIContext';
import CreatableSelect from 'react-select/creatable';
import { useIntl } from 'react-intl';
export default memo(({ value, index, attribute_id, options = [], onChange, hasProductChannel }) => {
    const { formatMessage } = useIntl();
    const {
        productEditing,
        setAttributesSelected,
        removeValueToAttributeSelected,
        updateValueToAttributeSelected
    } = useProductsUIContext();
    const { setFieldValue, errors, touched, values, submitCount, setFieldTouched } = useFormikContext();

    const _refsubmitCount = useRef(submitCount)
    let name = `att-${attribute_id}-${value.code}`
    let editing = `att-${attribute_id}-${value.code}-editing`

    const valueAttribute = useMemo(() => {
        return {
            ...value,
            value: value?.sc_attribute_group_id || value?.v,
            label: value?.v,
            ...(!value?.sc_attribute_group_id ? {
                __isNew__: true
            } : {})
        }
    }, [value]);

    console.log({ valueAttribute })

    return <div className="input-group mx-4" style={{ maxWidth: '95%' }}>
        <CreatableSelect
            options={options}
            value={valueAttribute}
            className='mr-4'
            placeholder={formatMessage({ defaultMessage: 'Chọn phân loại' })}
            onChange={val => {
                console.log({ val });
                setFieldValue(name, val?.label);
                updateValueToAttributeSelected(attribute_id, val, value.code, true)
                !!onChange && onChange()
                setFieldValue('__changed__', true)
            }}
            styles={{
                container: (styles) => ({
                    ...styles,
                    flex: 1
                }),
                control: (styles) => ({
                    ...styles,
                    ...(errors[name] && (touched[name] || _refsubmitCount.current != submitCount) ? { borderColor: '#f14336' } : { border: 'none' }),
                    backgroundColor: '#F7F7FA'
                })
            }}
            onBlur={() => setFieldTouched(name, true)}
            autoFocus
            formatCreateLabel={(inputValue) => `${formatMessage({ defaultMessage: 'Tạo mới' })}: "${inputValue}"`}
        />
        {/* <div className="input-group-append">
            <button className="btn btn-light-success" type="button"><i className="fas fa-sort-amount-up-alt"></i></button>
        </div> */}
        {
            (!values[`disable-edit-attribute`] || !values[`disable-att-value-${attribute_id}-${value.code}`] || productEditing?.status == 2) && <div className="" style={{ zIndex: 1 }} >
                <button className="btn btn-light-danger" type="button"
                    onClick={e => {
                        e.preventDefault();
                        removeValueToAttributeSelected(attribute_id, value.code)
                        setFieldValue('__changed__', true)
                    }}
                ><i className="far fa-trash-alt p-0"></i></button>
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