import React, { useRef } from "react";
import { useField, useFormikContext } from "formik";
import { FieldFeedbackLabel } from "./FieldFeedbackLabel";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import clsx from "clsx";



export function RadioGroup({
  field: { name, value, onChange, onBlur },
  form: { touched, submitCount },
  label,
  options = [],
  required = false,
  disabled = false,
  onChangeState,
  onChangeOption,
  isCenter = false,
  direction = 'row',
}) {
  const _refSubmitCount = useRef(submitCount)
  const { setFieldValue, setFieldTouched } = useFormikContext();
  let isTouched = submitCount != _refSubmitCount.current || touched[name]
  return (
    <div className={isCenter ? '' : 'form-group'}>
      {label && <label className={`col-form-label`}>{label}{!!required && <span className='text-danger' > *</span>}</label>}
      <div
        className={clsx("radio-inline", { "flex-column": direction == 'column' })}
        onChange={e => {
          setFieldValue('__changed__', true)
          !!onChangeState && onChangeState(e.target.value)
          !!onChangeOption && onChangeOption()
          !onChangeOption && setFieldValue(name, e.target.value)

        }}
      >
        {
          options.map(_op => {
            return (
              <label style={{ cursor: disabled ? 'no-drop' : 'pointer' }} key={`op-${_op.value}`} className="radio">
                <input type="radio" disabled={disabled} name={name} value={_op.value} checked={value == _op.value} />
                <span></span>
                {_op.label}                
                {!!_op?.sub && <><br />{_op?.sub}</>}
                {!!_op?.tooltip && <OverlayTrigger
                  overlay={
                    <Tooltip>
                      {_op?.tooltip}
                    </Tooltip>
                  }
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" className="ml-1 bi bi-info-circle" viewBox="0 0 16 16">
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
                    <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0" />
                  </svg>
                </OverlayTrigger>}
              </label>
            )
          })
        }
      </div>
    </div>
  );
}
