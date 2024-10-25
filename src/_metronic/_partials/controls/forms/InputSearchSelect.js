import React, { useEffect, useMemo, useRef, useState } from "react";
import { OverlayTrigger } from "react-bootstrap";
import { Tooltip } from "react-bootstrap";
import { FieldFeedbackLabel } from "./FieldFeedbackLabel";
import NumberFormat from 'react-number-format';
import { useFormikContext } from "formik";
import { useIntl } from "react-intl";
import { debounce } from "lodash";
import { useDebouncedValue } from '../../../../hooks/useDebouncedValue'
import { useClickOutside } from "../../../../hooks/useClickOutside";

const getFieldCSSClasses = (touched, errors) => {
  const classes = [];
  if (touched && errors) {
    classes.push("border-is-invalid");
  }
  return classes.join(" ");
};

const ItemSelect = ({children}) => {
  const [color, setColor] = useState('')
  return (
      <div onMouseEnter={() => setColor('#3699ff21')} onMouseLeave={() => setColor('')} style={{padding: '10px 8px',background: color,cursor: 'pointer'}}>
        {children}
      </div>
  )
}
export default function InputSearchSelect({
  field, // { name, value, onChange, onBlur }
  form: { touched, errors, submitCount, }, // also values, setXXXX, handleXXXX, dirty, isValid, status, etc.
  label,
  style,
  withFeedbackLabel = true,
  customFeedbackLabel,
  disabled = false,
  type = "text",
  required = false,
  loading = false,
  changed = null,
  absolute = false,
  onClearReceiver,
  isPhone = false,
  onBlurChange,
  onIsChangeState,
  placeholder = "",
  onChangeValue,
  options,
  ...props
}) {
  const _refSubmitCount = useRef(submitCount)
  const { formatMessage } = useIntl()

  const { setFieldValue } = useFormikContext();
  const [valueInput, setValueInput] = useState('')
  const [opened, setOpened] = useState(false);
  const ref = useClickOutside(() => setOpened(false));
  
  const [debounced] = useDebouncedValue(valueInput, 500);
  useEffect(() => {
    if(!!onIsChangeState || opened) {
      onIsChangeState(debounced)
    } 
  }, [debounced, opened])
  
  return (
    <>
      {label && <label className="col-form-label">
        {label}{!!required && <span className='text-danger' > *</span>}</label>}
      <div ref={ref} className="input-group" style={{ position: 'relative', width: '100%' }} >
        <div className={`input-group ${getFieldCSSClasses(touched[field.name] || submitCount != _refSubmitCount.current, errors[field.name])}`} >
          {
              <input
                type={type}
                className={"form-control"}
                {...field}
                {...props}
                autoComplete="off"
                placeholder={placeholder}
                disabled={disabled}
                value={field.value || ''}
                style={!!style ? style : { background: '#F7F7FA', border: 'none', color: props.disabled ? '#00000073' : undefined }}
                onBlur={(e) => {
                  field.onBlur(e)
                  // setIsFocus(false)
                  !!onBlurChange && onBlurChange(e.target.value)
                }}
                onFocus={() => {
                  setOpened(true)
                }}
                onChange={e => {
                  !!onClearReceiver && onClearReceiver()
                  setValueInput(e.target.value)
                  setFieldValue('__changed__', true)
                  field.onChange(e)

                  !!onChangeValue && onChangeValue(e)

                }}
              />
          }
          
          {loading && <span className="spinner spinner-primary" style={{ position: 'absolute', top: 18, right: 45 }} />}
    
        </div>
        { opened ?
          <div style={{backgroundColor: '#white',
            borderRadius: '0.3rem',
            color: '#172B4D',
            display: 'inline-block',
            border: '1px solid #80808040',
            fontSize: 12,
            background: 'white',
            position: 'absolute',
            zIndex: 10,
            top: '100%',
            fontWeight: 'normal',
            lineHeight: '1',
            maxHeight: '250px',
            height: 'max-content',
            overflowY: 'scroll',
            marginTop: '4px',
            padding: '0.4rem 0',
          }} className="w-100">
            {options?.length ? options?.map(option => (
              <div onClick={() => {
                changed(option?.value)
                setOpened(false)
              }}>
                <ItemSelect>{option?.label}</ItemSelect>
              </div>
            )) : 
            <div style={{padding: '10px 8px',fontSize: '14px', color:'gray',display:'flex', alignItems: 'center', justifyContent: 'center'}}>
              No options
            </div>}
          </div> : null}
        {withFeedbackLabel && (
          <FieldFeedbackLabel
            error={errors[field.name]}
            touched={touched[field.name] || submitCount  != _refSubmitCount.current}
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

