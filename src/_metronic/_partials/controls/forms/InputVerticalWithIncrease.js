import React, { useEffect, useMemo, useRef } from "react";
import { OverlayTrigger } from "react-bootstrap";
import { Tooltip } from "react-bootstrap";
import { FieldFeedbackLabel } from "./FieldFeedbackLabel";
import NumberFormat from 'react-number-format';
import { useFormikContext } from "formik";

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

export function InputVerticalWithIncrease({
  field, // { name, value, onChange, onBlur }
  form: { touched, errors, submitCount, values }, // also values, setXXXX, handleXXXX, dirty, isValid, status, etc.
  label,
  withFeedbackLabel = true,
  customFeedbackLabel,
  disabled = false,
  type = "text",
  required = false,
  addOnRight = "",
  slashValue = 0,
  slash = false,
  setValueZero = false,
  tooltip = "",
  countChar = false,
  maxChar,
  absolute = false,
  onChangedValue,
  onBlurChange,
  decimalScale = 0,
  ...props
}) {

  const _refSubmitCount = useRef(submitCount)
  const { setFieldValue } = useFormikContext();
  return (
    <>
      <div className="input-group" style={{ position: 'relative', width: '100%' }} >
        <div style={{ flex: 1, display: 'flex', flexDirection: 'row' }} >
          <button className="btn btn-primary" style={{ cursor: `${+values?.creationMethod == 1 ? 'not-allowed' : 'pointer'}`, color: '#ff5629', borderColor: '#ff5629', background: '#ffffff', width: 40 }}
            type="button"
            onClick={e => {
              !!onChangedValue && onChangedValue(field.value);
              setFieldValue(field.name, Math.max(0, field.value - 1))
            }}
            disabled={!field.value || disabled || +values?.creationMethod == 1}
          >-</button>
          <div style={{ flex: 1, paddingLeft: 8, paddingRight: 8 }} >
            <div className={`input-group ${getFieldCSSClasses(touched[field.name] || submitCount != _refSubmitCount.current, errors[field.name])}`} >
              <NumberFormat
                className={"form-control"}
                thousandSeparator={true}
                {...field}
                {...props}
                value={+values?.creationMethod == 1 ? 0 : field.value === undefined ? '' : field.value}
                disabled={disabled || +values?.creationMethod == 1}
                onChange={e => {
                  !!onChangedValue && onChangedValue();
                }}
                onValueChange={value => {
                  // !!onChangedValue && onChangedValue(value.floatValue);
                  if (value.floatValue == undefined) {
                    !!setValueZero &&
                      setTimeout(() => {
                        setFieldValue(field.name, 0)
                      }, 100)
                  }

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
                }}
                suffix={slash ? ` / ${slashValue}` : ''}
                style={{ background: '#F7F7FA', border: 'none', textAlign: 'center' }}
                placeholder={slash ? `0 / ${slashValue}` : '--'}
                decimalScale={decimalScale}
                allowNegative={false}
              />
            </div>
          </div>
          <button className="btn btn-primary" style={{ width: 40 }}
            type="button"
            onClick={e => {
              !!onChangedValue && onChangedValue(field.value);
              if (!field.value)
                setFieldValue(field.name, 1)
              else {
                setFieldValue(field.name, Math.min(999999, field.value + 1))
              }
            }}
            disabled={field.value >= 999999 || disabled || +values.creationMethod == 1}
          >+</button>
        </div>
        {withFeedbackLabel && (
          <FieldFeedbackLabel
            error={+values.creationMethod == 1 ? '' : errors[field.name]}
            touched={touched[field.name] || submitCount != _refSubmitCount.current}
            label={label}
            type={type}
            customFeedbackLabel={customFeedbackLabel}
            absolute={absolute}
          />
        )}
      </div>
    </>
  );
}
