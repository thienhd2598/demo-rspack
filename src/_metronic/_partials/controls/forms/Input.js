import React, { useMemo, useRef } from "react";
import { FieldFeedbackLabel } from "./FieldFeedbackLabel";
import NumberFormat from 'react-number-format';
import { useFormikContext } from "formik";
import { useIntl } from "react-intl";
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

export function Input({
  field, // { name, value, onChange, onBlur }
  form: { touched, errors, submitCount, ...rest }, // also values, setXXXX, handleXXXX, dirty, isValid, status, etc.
  label,
  withFeedbackLabel = true,
  customFeedbackLabel,
  type = "text",
  required = false,
  addOnRight = "",
  countChar = false,
  maxChar,
  onBlurChange,
  minWidthLabel,
  cols = ['col-3', 'col-9'],
  decimalScale = 0,
  onChanged = null,
  ...props
}) {
  const _refSubmitCount = useRef(submitCount)
  const {formatMessage} = useIntl()
  const { setFieldValue } = useFormikContext();
  let placeholders = useMemo(() => {
    if (!!label) {
      if (type == 'text' || type == 'number') {
        return {
          placeholder: `${formatMessage({defaultMessage:'Nhập'})} ${label.toLowerCase()}`
        }
      } else {
        return {
          placeholder: `${formatMessage({defaultMessage:'Chọn'})} ${label.toLowerCase()}`
        }
      }
    }
    return {}
  }, [label])
  return (
    <div className="form-group row">
      {label && <label className={`${cols[0]} col-form-label`} style={!!minWidthLabel ? { minWidth: minWidthLabel } : {}} >{label}{!!required && <span className='text-danger' > *</span>}</label>}
      <div className={`${cols[1]} input-group`}>
        <div className={`w-100 input-group ${getFieldCSSClasses(touched[field.name] || submitCount != _refSubmitCount.current, errors[field.name])}`}>
          {
            type == 'number' ? (
              <NumberFormat
                className={"form-control"}
                thousandSeparator={true}
                {...field}
                {...props}
                onChange={e => { }}
                onValueChange={value => {
                  if (decimalScale == 0) {
                    if (!value.floatValue)
                      setFieldValue(field.name, value.floatValue)
                    else
                      setFieldValue(field.name, Math.floor(value.floatValue))
                  } else {
                    if (!value.floatValue)
                      setFieldValue(field.name, value.floatValue)
                    else
                      setFieldValue(field.name, value.floatValue)
                  }
                  setFieldValue('__changed__', true)
                  !!onChanged && onChanged(value.floatValue)
                }}
                style={{ background: '#F7F7FA', border: 'none' }}
                {...placeholders}
                // fixedDecimalScale={true}
                decimalScale={decimalScale}
                allowNegative={false}
              />
            ) : (
              <input
                type={type}
                className={"form-control"}
                {...field}
                {...props}
                value={field.value || ''}
                style={{ background: '#F7F7FA', border: 'none' }}
                onBlur={(e) => {
                  field.onBlur(e)
                  !!onBlurChange && onBlurChange(e.target.value)
                }}

                onChange={e => {
                  setFieldValue('__changed__', true)
                  field.onChange(e)
                  !!onChanged && onChanged(e.target.value)
                }}
                {...placeholders}
              />
            )
          }
          {!!addOnRight && <div className="input-group-append" style={{ background: '#F7F7FA', border: 'none', borderTopRightRadius: 6, borderBottomRightRadius: 6 }}><span className="input-group-text" style={{ background: '#F7F7FA', border: 'none' }}>{addOnRight}</span></div>}
          {countChar && <div className="input-group-append" style={{ background: '#F7F7FA', border: 'none', borderTopRightRadius: 6, borderBottomRightRadius: 6 }}><span className="input-group-text" style={{ background: '#F7F7FA', border: 'none' }}>{`${(field.value || '').length}/${maxChar}`}</span></div>}
        </div>
        {withFeedbackLabel && (
          <FieldFeedbackLabel
            error={errors[field.name]}
            touched={touched[field.name] || submitCount != _refSubmitCount.current}
            label={label}
            type={type}
            customFeedbackLabel={customFeedbackLabel}
          />
        )}
      </div>
    </div >
  );
}
