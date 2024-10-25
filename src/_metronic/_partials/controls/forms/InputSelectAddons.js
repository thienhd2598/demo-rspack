import React, { useEffect, useMemo, useRef, useState } from "react";
import { OverlayTrigger } from "react-bootstrap";
import { Tooltip } from "react-bootstrap";
import { FieldFeedbackLabel } from "./FieldFeedbackLabel";
import NumberFormat from 'react-number-format';
import { useFormikContext } from "formik";
import OutsideClickHandler from 'react-outside-click-handler';

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

export function InputSelectAddons({
  field, // { name, value, onChange, onBlur }
  form: { touched, errors, submitCount, }, // also values, setXXXX, handleXXXX, dirty, isValid, status, etc.
  label,
  withFeedbackLabel = true,
  customFeedbackLabel,
  disabled = false,
  type = "text",
  required = false,
  addOnRight = "đ",
  clearUnit,
  tooltip = "",
  placeholders = "",
  unitOptions = [],
  keyUnit = "",
  countChar = false,
  maxChar,
  absolute = false,
  onChangeValue,
  onBlurChange,
  decimalScale = 0,
  ...props
}) {
  const _refSubmitCount = useRef(submitCount)
  const { setFieldValue, values } = useFormikContext();
  const [showAddons, setShowAddons] = useState(false);

  // useEffect(
  //   () => {
  //     if (unitOptions.length == 0) return;
  //     !values[`${field.name}-unit`] && setFieldValue(`${field.name}-unit`, unitOptions[0])
  //   }, [values[`${field.name}-unit`], unitOptions]
  // );

  return (
    <>
    {label && <label className="col-form-label">{label}</label>}
      <div className="input-group" style={{ position: 'relative', width: '100%' }} >
        <div style={{ flex: 1, display: 'flex', flexDirection: 'row' }} >
          <div className={`input-group ${getFieldCSSClasses(touched[field.name] || submitCount != _refSubmitCount.current, errors[field.name])}`} >
            <NumberFormat
              className={"form-control"}
              thousandSeparator={true}
              {...field}
              {...props}
              disabled={disabled}
              onChange={e => { }}
              onValueChange={value => {
                !!onChangeValue && onChangeValue(value.value)      
                if (decimalScale == 0) {
                  if (!value.floatValue)
                    setFieldValue(field.name, value.floatValue || 0)
                  else
                    setFieldValue(field.name, Math.floor(value.floatValue) || 0)
                } else {
                  if (!value.floatValue)
                    setFieldValue(field.name, value.floatValue || 0)
                  else
                    setFieldValue(field.name, value.floatValue || 0)
                }
                setFieldValue('__changed__', true)
              }}              
              {...placeholders}
              decimalScale={decimalScale}
              allowNegative={false}
            />
            {unitOptions?.length > 0 ? (
              <>
                <button
                  style={{ background: '#F7F7FA', borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                  class="btn btn-outline-secondary dropdown-toggle"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  onClick={() => setShowAddons(true)}
                >
                  {values[keyUnit || `${field?.name}-unit`]?.label || addOnRight}
                </button>
                <OutsideClickHandler onOutsideClick={() => setShowAddons(false)}>
                  <ul class="dropdown-menu dropdown-menu-end" style={{ display: showAddons ? 'block' : 'none', left: 'unset', right: 0, minWidth: '30%' }}>
                    {unitOptions?.map(
                      (_option, index) => (
                        <li key={`unit-option-${index}`}>
                          <a
                            class="dropdown-item"
                            href="#"
                            onClick={e => {
                              e.preventDefault();

                              setFieldValue('__changed__', true)
                              setShowAddons(false);
                              setFieldValue(field.name, 0);
                              setFieldValue(keyUnit || `${field?.name}-unit`, _option);
                            }}
                          >
                            {_option?.label}
                          </a>
                        </li>
                      )
                    )}
                  </ul>
                </OutsideClickHandler>
              </>
            ) : (
              !clearUnit && (
              <span
                className="input-group-text"
                id="basic-addon2"
                style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderLeft: 'none' }}
              >
                {addOnRight}
              </span>
              )
              
            )}
          </div>

        </div>
        {withFeedbackLabel && (
          <FieldFeedbackLabel
            error={errors[field.name]}
            touched={touched[field.name] || submitCount != _refSubmitCount.current}
            label={label}
            type={type}
            customFeedbackLabel={customFeedbackLabel}
            absolute={absolute}
          />
        )}
      </div >
    </>
  );
}
