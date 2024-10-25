import React, { Fragment, useMemo, useRef, useState } from "react";
import { useField, useFormikContext } from "formik";
import { FieldFeedbackLabel } from "./FieldFeedbackLabel";
import { useIntl } from "react-intl";

import Select, { components } from 'react-select'
import CreatableSelect from 'react-select/creatable';
import { Modal } from "react-bootstrap";

const Menu = props => {
  const { formatMessage } = useIntl()
  const optionSelectedLength = props.getValue().length || 0;
  return (
    <components.Menu {...props}>
      {optionSelectedLength < 5 ? (
        props.children
      ) : (
        <div style={{ margin: 15 }}>{formatMessage({ defaultMessage: 'Chọn tối đa 5 giá trị' })}</div>
      )}
    </components.Menu>
  );
};


export function ReSelectConfirmVertical({
  field,
  form: { touched, errors, submitCount },
  label,
  withFeedbackLabel = true,
  type = "text",
  customFeedbackLabel,
  children,
  options = [],
  required = false,
  cols = ['col-3', 'col-9'],
  isClearable = true,
  isCreatable = false,
  isShowConfirm = true,
  onChanged = null,
  style = {},
  ...props
}) {
  const _refSubmitCount = useRef(submitCount)
  const { setFieldValue, setFieldTouched } = useFormikContext();
  const [currentValue, setCurrentValue] = useState(null);
  const { formatMessage } = useIntl()
  let isTouched = submitCount != _refSubmitCount.current || touched[field.name]
  let placeholders = useMemo(() => {
    if (!!label) {
      return {
        placeholder: `${formatMessage({ defaultMessage: 'Chọn' })} ${label.toLowerCase()}`
      }
    }
    return {}
  }, [label])


  const Container = isCreatable ? CreatableSelect : Select
  // console.log("field.name", field.name, field.value)

  return (
    <Fragment>
      <Modal
        aria-labelledby="example-modal-sizes-title-lg"
        centered
        show={!!currentValue}
        onHide={() => setCurrentValue(null)}
      >
        <Modal.Body className="overlay overlay-block cursor-default text-center">
          <div className="mb-6">
            {formatMessage({ defaultMessage: 'Việc thay đổi kho xử lý sẽ làm xóa thông tin hàng hoá bạn đã chọn bên dưới. Bạn vẫn muốn tiếp tục?' })}
          </div>
          <div>
            <button
              className="btn btn-secondary mr-4"
              style={{ width: 150 }}
              onClick={() => setCurrentValue(null)}
            >
              {formatMessage({ defaultMessage: "Đóng" })}
            </button>
            <button
              className="btn btn-primary"
              style={{ width: 150 }}
              onClick={() => {
                !!onChanged && onChanged(currentValue || undefined)
                setFieldValue(field.name, currentValue || undefined);
                setCurrentValue(null);
              }}
            >
              {formatMessage({ defaultMessage: "Xác nhận" })}
            </button>

          </div>
        </Modal.Body>
      </Modal>
      <div className="form-group" style={style}>
        {label && <label className={`col-form-label`}>{label}{!!required && <span className='text-danger' > *</span>}</label>}
        <Container
          options={options}
          components={!!props?.isRequiredMaxOptions ? {} : { Menu }}
          {...field}
          {...props}
          value={field.value || null}
          isOptionDisabled={(option) => option.disabled}
          onChange={value => {
            if (isShowConfirm) {
              setCurrentValue(value);
            } else {
              !!onChanged && onChanged(value || undefined)
              setFieldValue(field.name, value || undefined);
            }
          }}
          styles={{
            control: (styles) => ({
              ...styles,
              ...(errors[field.name] && isTouched ? { borderColor: '#f14336' } : { border: 'none' }),
              backgroundColor: '#F7F7FA',
            }),
          }}
          onBlur={() => {
            setFieldTouched(field.name, true)
          }}
          isClearable={isClearable}
          {...placeholders}
          formatCreateLabel={(inputValue) => `${formatMessage({ defaultMessage: 'Tạo mới' })}: "${inputValue}"`}
        />
        {withFeedbackLabel && (
          <FieldFeedbackLabel
            error={errors[field.name]}
            touched={isTouched}
            label={label}
            customFeedbackLabel={customFeedbackLabel}
          />
        )}
      </div>
    </Fragment>
  );
}
