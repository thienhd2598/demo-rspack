import React, { useMemo, useRef } from "react";
import { useField, useFormikContext } from "formik";
import { FieldFeedbackLabel } from "./FieldFeedbackLabel";
import { useIntl } from "react-intl";

import Select, { components } from 'react-select'
import CreatableSelect from 'react-select/creatable';

const Menu = props => {
  const {formatMessage} = useIntl()
  const optionSelectedLength = props.getValue().length || 0;
  return (
    <components.Menu {...props}>
      {optionSelectedLength < 5 ? (
        props.children
      ) : (
        <div style={{ margin: 15 }}>{formatMessage({defaultMessage:'Chọn tối đa 5 giá trị'})}</div>
      )}
    </components.Menu>
  );
};


export function ReSelectVertical({
  field,
  form: { touched, errors, submitCount },
  label,
  withFeedbackLabel = true,
  type = "text",
  customFeedbackLabel,
  children,
  options = [],
  required = false,
  cols = ['col-3', 'col-9'],
  isClearable = true,
  isCreatable = false,
  onChanged = null,
  style = {},
  isFormGroup=true,
  ...props
}) {
  const _refSubmitCount = useRef(submitCount)
  const { setFieldValue, setFieldTouched } = useFormikContext();
  const {formatMessage} = useIntl()
  let isTouched = submitCount != _refSubmitCount.current || touched[field.name]
  let placeholders = useMemo(() => {
    if (!!label) {
      return {
        placeholder: `${formatMessage({defaultMessage:'Chọn'})} ${label.toLowerCase()}`
      }
    }
    return {}
  }, [label])


  const Container = isCreatable ? CreatableSelect : Select
  // console.log("field.name", field.name, field.value)

  return (
    <div className={isFormGroup ? "form-group" : ''} style={!!props.hideBottom ? { marginBottom: 0, ...style } : style}>
      {label && <label className={`col-form-label`}>{label}{!!required && <span className='text-danger' > *</span>}</label>}
      <Container
        options={options}
        components={!!props?.isRequiredMaxOptions ? {} : { Menu }}
        {...field}
        {...props}
        value={field.value || null}
        isOptionDisabled={(option) => option.disabled}
        onChange={value => {          
          setFieldValue(field.name, value || undefined)
          !!onChanged && onChanged(value || undefined)
        }}
        styles={{
          control: (styles) => ({
            ...styles,
            ...(errors[field.name] && isTouched ? { borderColor: '#f14336' } : { border: 'none' }),
            backgroundColor: '#F7F7FA',            
          }),          
        }}
        onBlur={() => {
          setFieldTouched(field.name, true)
        }}
        isClearable={isClearable}
        {...placeholders}
        formatCreateLabel={(inputValue) => `${formatMessage({defaultMessage:'Tạo mới'})}: "${inputValue}"`}
      />
      {withFeedbackLabel && (
        <FieldFeedbackLabel
          error={errors[field.name]}
          touched={isTouched}
          label={label}
          customFeedbackLabel={customFeedbackLabel}
        />
      )}
    </div>
  );
}
