import React, { useMemo, useRef } from "react";
import { FieldFeedbackLabel } from "./FieldFeedbackLabel";
import NumberFormat from 'react-number-format';
import { useFormikContext } from "formik";
import "react-datepicker/dist/react-datepicker.css";

import DatePicker from "react-datepicker";
const getFieldCSSClasses = (touched, errors) => {
  const classes = [];
  if (touched && errors) {
    classes.push("border-is-invalid");
  }

  // if (touched && !errors) {
  //   classes.push("is-valid");
  // }

  return classes.join(" ");
};

export function InputDate({
  field, // { name, value, onChange, onBlur }
  form: { touched, errors, submitCount, ...rest }, // also values, setXXXX, handleXXXX, dirty, isValid, status, etc.
  label,
  withFeedbackLabel = true,
  customFeedbackLabel,
  required = false,
  addOnRight = "",
  countChar = false,
  maxChar,
  onBlurChange,
  minWidthLabel,
  cols = ['col-3', 'col-9'],
  onChanged = null,
  ...props
}) {
  const _refSubmitCount = useRef(submitCount)
  const { setFieldValue } = useFormikContext();
  let placeholders = useMemo(() => {
    if (!!label) {
      return {
        placeholder: `Chọn ${label.toLowerCase()}`
      }
    }
  }, [label])
  return (
    <div className="form-group row w-100 ">
      {label && <label className={`${cols[0]} col-form-label`} style={!!minWidthLabel ? { minWidth: minWidthLabel } : {}}>{label}{!!required && <span className='text-danger' > *</span>}</label>}
      <div className={`w-100 ${cols[1]} input-group`}>
        <div className={`w-100 input-group ${getFieldCSSClasses(touched[field.name] || submitCount != _refSubmitCount.current, errors[field.name])}`}>
          <DatePicker
            wrapperClassName="w-100"
            className={"form-control"}
            style={{ width: "100%" }}
            {...field}
            {...props}
            selected={(field.value && new Date(field.value)) || null}
            onChange={val => {
              setFieldValue(field.name, val);
              !!onChanged && onChanged(val)
            }}
            dateFormat={'dd/MM/yyyy'}
          />
        </div>
        {withFeedbackLabel && (
          <FieldFeedbackLabel
            error={errors[field.name]}
            touched={touched[field.name] || submitCount != _refSubmitCount.current}
            label={label}
            customFeedbackLabel={customFeedbackLabel}
          />
        )}
      </div>
    </div >
  );
}
