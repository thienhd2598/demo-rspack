import React, { useEffect, useMemo, useRef, useState } from "react";
import { OverlayTrigger } from "react-bootstrap";
import { Tooltip } from "react-bootstrap";
import { FieldFeedbackLabel } from "./FieldFeedbackLabel";
import NumberFormat from 'react-number-format';
import { useFormikContext } from "formik";
import { useIntl } from "react-intl";
import { debounce } from "lodash";
import { useDebouncedValue } from '../../../../hooks/useDebouncedValue'

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

export function InputVertical({
  field, // { name, value, onChange, onBlur }
  form: { touched, errors, submitCount, }, // also values, setXXXX, handleXXXX, dirty, isValid, status, etc.
  label,
  style,
  withFeedbackLabel = true,
  customFeedbackLabel,
  disabled = false,
  hideText,
  type = "text",
  required = false,
  loading = false,
  addOnRight = "",
  tooltip = "",
  countChar = false,
  maxChar,
  absolute = false,
  isPhone = false,
  onBlurChange,
  onIsChangeState,
  decimalScale = 0,
  placeholder = "",
  onChangeValue,
  onFocusChangeValue,
  isCampaign = false,
  ...props
}) {
  const _refSubmitCount = useRef(submitCount)
  const { formatMessage } = useIntl()
  const _renderTooltip = () => {
    if (!tooltip) {
      return null
    }
    return (
      <OverlayTrigger
        overlay={
          <Tooltip>
            {tooltip}
          </Tooltip>
        }
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" className="bi bi-info-circle" viewBox="0 0 16 16">
          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
          <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0" />
        </svg>        
      </OverlayTrigger>
    )
  }
  const { setFieldValue } = useFormikContext();
  let placeholders = useMemo(() => {
    if (!!hideText) {
      return {
        placeholder: hideText
      }
    }
    if (placeholder) {
      return {
        placeholder: placeholder
      }
    }
    if (!!label && typeof label == 'string') {
      if (type == 'number' || type == 'text' || type == 'password') {
        let lll = label.toLowerCase();
        return {
          placeholder: lll.startsWith(formatMessage({ defaultMessage: 'nhập' })) ? label : `${formatMessage({ defaultMessage: 'Nhập' })} ${label.toLowerCase()}`
        }
      } else {
        return {
          placeholder: `${formatMessage({ defaultMessage: 'Chọn' })} ${label.toLowerCase()}`
        }
      }
    }
    return {}
  }, [label])
  const [valueInput, setValueInput] = useState(field.value || '')
  const [debounced] = useDebouncedValue(valueInput, 500);

  useEffect(() => {
    if(!!onIsChangeState) {
      onIsChangeState(debounced)
    } 
  }, [debounced])
  return (
    <>
      {label && <label className="col-form-label">
        {label}{!!required && <span className='text-danger' > *</span>} {_renderTooltip()}</label>}
      <div className="input-group" style={{ position: 'relative', width: '100%' }} >
        <div className={`input-group ${getFieldCSSClasses(touched[field.name] || submitCount != _refSubmitCount.current, errors[field.name])}`} >
          {
            type == 'number' ? (
              <NumberFormat
                className={"form-control"}
                thousandSeparator={true}
                {...field}
                {...props}
                value={(typeof field.value == 'number' || typeof field.value == 'string') ? field.value : ''}
                disabled={disabled}
                onChange={e => {   
                  isCampaign && setFieldValue(field.name, e.target.value.replaceAll(',', ''));
                  setValueInput(e.target.value.replaceAll(',', '')) 
                  !!onFocusChangeValue && onFocusChangeValue(e.target.value.replaceAll(',', ''))         
                }}
                onValueChange={value => {            
                  if (isCampaign) return;

                  !!onChangeValue && onChangeValue(value.value)      
                  setFieldValue('__changed__', true);
                  if (isPhone) {
                    setFieldValue(field.name, value.value);
                    return;
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
                }}
                style={!!style ? style : { background: '#F7F7FA', border: 'none', color: props.disabled ? '#00000073' : undefined }}
                {...placeholders}
                decimalScale={decimalScale}
                allowNegative={false}
              />
            ) : (
              <input
                type={type}
                className={"form-control"}
                {...field}
                {...props}
                disabled={disabled}
                value={field.value || ''}
                style={!!style ? style : { background: '#F7F7FA', border: 'none', color: props.disabled ? '#00000073' : undefined }}
                onBlur={(e) => {
                  field.onBlur(e)
                  !!onBlurChange && onBlurChange(e.target.value)
                }}
                onChange={e => {
                  setFieldValue('__changed__', true)
                  field.onChange(e)

                  !!onChangeValue && onChangeValue(e)

                }}
                {...placeholders}
              />
            )
          }
          {loading && <span className="spinner spinner-primary" style={{ position: 'absolute', top: 18, right: 45 }} />}
          {!!addOnRight && <div className="input-group-append" style={{ background: '#F7F7FA', border: 'none', borderTopRightRadius: 6, borderBottomRightRadius: 6 }}><span className="input-group-text" style={{ background: '#F7F7FA', border: 'none' }}>{addOnRight}</span></div>}
          {countChar && <div className="input-group-append" style={{ background: '#F7F7FA', border: 'none', borderTopRightRadius: 6, borderBottomRightRadius: 6 }}><span className="input-group-text" style={{ background: '#F7F7FA', border: 'none' }}>{`${(field.value || '').length}/${maxChar}`}</span></div>}
        </div>
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
