import { useFormikContext } from "formik";
import React, { useEffect, useRef } from "react";
import { toAbsoluteUrl } from "../../../_helpers";
import { FieldFeedbackLabel } from "./FieldFeedbackLabel";
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { useToasts } from "react-toast-notifications";
import { useIntl } from "react-intl";


const getFieldCSSClasses = (touched, errors) => {
  const classes = ["form-control"];
  // if (touched && errors) {
  //   classes.push("is-invalid");
  // }

  // if (touched && !errors) {
  //   classes.push("is-valid");
  // }

  return classes.join(" ");
};

export function TextArea({
  field, // { name, value, onChange, onBlur }
  form: { touched, errors, submitCount, ...rest }, // also values, setXXXX, handleXXXX, dirty, isValid, status, etc.
  label,
  withFeedbackLabel = true,
  customFeedbackLabel,
  setMessDescription,
  type = "text",
  required = false,
  onChanged,
  countChar = false,
  allowCopy = false,
  maxChar = 100,
  onBlurChange,
  rows = 10,
  cols = ['col-3', 'col-9'],
  ...props
}) {
  const _refSubmitCount = useRef(submitCount)
  const { setFieldValue } = useFormikContext()
  const { addToast } = useToasts();
  const { formatMessage } = useIntl()
  const _refArea = useRef(null)

  useEffect(() => {
    !!setMessDescription && setMessDescription(field.value)
  }, [])

  return (
    <div className="form-group row" style={{ position: 'relative' }} >
      {label && <label className={`${cols[0]} col-form-label`}>{label}{!!required && <span className='text-danger' > *</span>}</label>}
      <div className={`${cols[1]}`}>
        <div className='w-100' style={{ position: 'relative' }}>
          <textarea
            ref={_refArea}

            className={getFieldCSSClasses(submitCount != _refSubmitCount.current || touched[field.name], errors[field.name])}
            rows={rows}
            {...field}
            {...props}
            value={field.value || ''}
            onChange={e => {
              setFieldValue('__changed__', true)
              !!onChanged && onChanged(e)
              !!setMessDescription && setMessDescription(e.target.value)
              field.onChange(e)
            }}
            onBlur={(e) => {
              field.onBlur(e)
              !!onBlurChange && onBlurChange(e.target.value)
            }}
            style={{ background: '#F7F7FA', borderRadius: 6, border: (submitCount != _refSubmitCount.current || touched[field.name]) && errors[field.name] ? '1px solid #f14336' : 'none' }}
          />
          {
            (!!countChar || !!allowCopy) && <p>
              {
                countChar && <span className="" style={{ position: 'absolute', right: allowCopy ? 40 : 0, bottom: -22, color: 'rgba(0,0,0, 0.45)' }} >{`${(field.value || '').length}/${maxChar}`}</span>
              } {
                !!allowCopy && <CopyToClipboard text={(field.value || '')}
                  onCopy={() => {
                    addToast(formatMessage({ defaultMessage: 'Đã sao chép vào bộ nhớ' }), { appearance: 'success' });
                  }}>
                  <img src={toAbsoluteUrl(
                    "/media/ic_copy.svg"
                  )} style={{ position: 'absolute', right: 0, bottom: -24, color: 'rgba(0,0,0, 0.45)', cursor: 'pointer' }}
                    onClick={e => {
                      e.preventDefault()
                    }}
                  />
                </CopyToClipboard>
              }
            </p>
          }
        </div>
        {withFeedbackLabel && (
          <FieldFeedbackLabel
            error={errors[field.name]}
            touched={submitCount != _refSubmitCount.current || touched[field.name]}
            label={label}
            type={type}
            customFeedbackLabel={customFeedbackLabel}
          />
        )}
      </div>
    </div >
  );
}
