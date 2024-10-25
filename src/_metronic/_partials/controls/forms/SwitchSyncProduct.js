import { useFormikContext } from "formik";
import React, { useMemo } from "react";
import { useToasts } from 'react-toast-notifications';

export function SwitchSyncProduct({
  field, 
  form: { touched, errors, submitCount, ...rest }, 
  ...props
}) {
const { addToast } = useToasts();
  const { setFieldValue } = useFormikContext()
  useMemo(() => {
    if (props.disabled) {
      setFieldValue(field.name, false)
    }
  }, [props.disabled])
  return (
    <span className="switch">
      <label>
        <input
          type={'checkbox'}
          {...field}
          {...props}
          disabled={props?.disableActions || props.disabled}
          style={{ background: '#fff', border: 'none' }}
          onChange={e => {
            let checked = e.target.checked;
            setFieldValue('__changed__', true)            
            props.onSwitch()
                .then(value => {
                    console.log({ value })
                    if (value?.data?.success) {
                        addToast(value?.data?.message, { appearance: 'success' })
                        setFieldValue(field.name, checked);
                    } else {
                        addToast(value?.data?.message, { appearance: 'error' })
                    }
                })
                .catch(error => addToast(error, { appearance: 'error' }))
          }}
          checked={field.value || false}
        />
        <span></span>
      </label>
    </span>
  );
}
