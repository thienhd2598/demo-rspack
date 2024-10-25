import { useFormikContext } from "formik";
import React, { useMemo } from "react";

export function Switch({
  field, // { name, value, onChange, onBlur }
  onChangeState,
  form: { touched, errors, submitCount, ...rest }, // also values, setXXXX, handleXXXX, dirty, isValid, status, etc.
  ...props
}) {
  const { setFieldValue } = useFormikContext()

  useMemo(() => {
    if (props?.isVariant && typeof field.value != 'boolean') {
      setFieldValue(field.name, true)
    }
  }, [props?.isVariant])

  useMemo(() => {
    if (props.disabled) {
      setFieldValue(field.name, false)
    }
  }, [props.disabled])
  return (
    <span className={`switch prd-new`}>
      <label className="product-stores-swbtn">
        <input
          type={'checkbox'}
          {...field}
          {...props}
          disabled={props?.disableActions || props.disabled}
          // value={String(field.value || '')}
          style={{ background: '#F7F7FA', border: 'none' }}
          onChange={e => {
            setFieldValue('__changed__', true)
            setFieldValue(field.name, e.target.checked)
            !!onChangeState && onChangeState()
          }}
          checked={field.value || false}
        />
        <span></span>
      </label>
    </span>
  );
}
