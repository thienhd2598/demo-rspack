import React, { useEffect, useMemo, useRef, useState } from "react";
import { useField, useFormikContext } from "formik";
import { FieldFeedbackLabel } from "./FieldFeedbackLabel";

import Select, { components } from 'react-select'
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { useDebouncedValue } from "../../../../hooks/useDebouncedValue";

const Menu = props => {
  const optionSelectedLength = props.getValue().length || 0;
  return (
    <components.Menu {...props}>
      {optionSelectedLength < 5 ? (
        props.children
      ) : (
        <div style={{ margin: 15 }}>Chọn tối đa 5 giá trị</div>
      )}
    </components.Menu>
  );
};

export function ReSelect({
  field,
  form: { touched, errors, submitCount },
  label,
  isClear = true,
  hideText,
  withFeedbackLabel = true,
  type = "text",
  customFeedbackLabel,
  children,
  options = [],
  required = false,
  tooltip = "",
  cols = ['col-3', 'col-9'],
  minWidthLabel,
  absolute = false,
  onChanged = null,
  onSetInput,
  ...props
}) {
  const _refSubmitCount = useRef(submitCount)
  const { setFieldValue, setFieldTouched } = useFormikContext();
  let isTouched = submitCount != _refSubmitCount.current || touched[field.name]
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
        <i className="fas fa-info-circle" style={{ fontSize: 14 }}></i>
      </OverlayTrigger>
    )
  }
  let placeholders = useMemo(() => {
    if (!!hideText) {
      return {
        placeholder: `${hideText}`
      }
    }
    if (!!label) {
      return {
        placeholder: `Chọn ${label.toLowerCase()}`
      }
    }
    return {}
  }, [label]);

  return (
    <div className="form-group row" style={!!props.hideBottom ? { marginBottom: 0 } : {}}>
      {label && <label className={`${cols[0]} col-form-label`} style={!!minWidthLabel ? { minWidth: minWidthLabel } : {}} >{label}{!!required && <span className='text-danger' > *</span>} {_renderTooltip()}</label>}
      <div className={cols[1]}>
        <Select options={options}
          components={{ Menu }}
          {...field}
          {...props}
          onChange={value => {
            console.log({ value });
            setFieldValue(field.name, value || undefined)
            !!onChanged && onChanged(value || undefined)

          }}
          onInputChange={(value, action) => {
            !!onSetInput && onSetInput(value, action) 
          }}
          styles={{
            control: (styles) => ({
              ...styles,
              ...(errors[field.name] && isTouched ? { borderColor: '#f14336' } : { border: 'none' }),
              backgroundColor: '#F7F7FA'
            })
          }}
          onBlur={() => {
            setFieldTouched(field.name, true)
          }}
          isClearable={isClear}
          {...placeholders}
        />
        {withFeedbackLabel && (
          <FieldFeedbackLabel
            error={errors[field.name]}
            touched={isTouched}
            label={label}
            customFeedbackLabel={customFeedbackLabel}
            absolute={absolute}
          />
        )}
      </div>
    </div>
  );
}
