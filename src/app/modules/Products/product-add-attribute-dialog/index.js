import React, { useRef } from "react";
import { Modal } from "react-bootstrap";
import { useProductsUIContext } from "../ProductsUIContext";
import { FormattedMessage, injectIntl, useIntl } from "react-intl";
import { Formik, Form, Field, useFormikContext } from "formik";
import { InputVertical } from "../../../../_metronic/_partials/controls";
import * as Yup from "yup";
import slugify from 'react-slugify';
import { ATTRIBUTE_VALUE_TYPE } from '../ProductsUIHelpers'
import { randomString } from "../../../../utils";
const regex = new RegExp("[^\u0000-\u007F]+")

function ProductAddAtributeDialog({ show, onHide, attributeRename, resetUnit, name_attribute }) {
  // Products UI Context
  const { formatMessage } = useIntl()
  const { attributes, customAttributes, setCustomAttributes, attributesSelected, setAttributesSelected } = useProductsUIContext()
  // Validation schema
  const validationSchema = Yup.object().shape({
    name_attribute: Yup.string()
      .max(14, formatMessage({ defaultMessage: "{name} tối đa {length} ký tự" }, {
        length: 14, name: formatMessage({
          defaultMessage: 'Tên nhóm phân loại',
        }) || ''
      }))
      .required(formatMessage({ defaultMessage: "Vui lòng nhập tên nhóm phân loại" }))
      .notOneOf(attributes.concat(customAttributes).filter(_att => _att.id != attributeRename).map(_attribute => _attribute.display_name), "Tên các nhóm phân loại không được trùng nhau")
      .test(
        'chua-ky-tu-space-o-dau-cuoi',
        formatMessage({ defaultMessage: 'Tên nhóm phân loại không được chứa dấu cách ở đầu và cuối' }),
        (value, context) => {
          if (!!value) {
            return value.length == value.trim().length;
          }
          return false;
        },
      )
      .test(
        'chua-ky-tu-2space',
        formatMessage({ defaultMessage: 'Tên nhóm phân loại không được chứa 2 dấu cách liên tiếp' }),
        (value, context) => {
          if (!!value) {
            return !(/\s\s+/g.test(value))
          }
          return false;
        },
      ),
  });

  const btnRef = useRef();
  const saveClick = () => {
    if (btnRef && btnRef.current) {
      btnRef.current.click();
    }
  };

  // console.log(`______attributed`, attributesSelected);

  return (
    <Modal
      show={show}
      onHide={onHide}
      aria-labelledby="example-modal-sizes-title-sm"
      centered
    >
      <Modal.Header>
        <Modal.Title>
          {!!attributeRename ? formatMessage({ defaultMessage: "Sửa nhóm phân loại" }) : <FormattedMessage defaultMessage="Thêm nhóm phân loại" />}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="overlay overlay-block cursor-default" >
        <Formik
          initialValues={{ name_attribute: name_attribute || '' }}
          validationSchema={validationSchema}
          onSubmit={(values) => {
            if (!attributeRename) {
              let att = {
                attribute_type: 1,
                display_name: values['name_attribute'],
                name: slugify(values['name_attribute']),
                id: randomString(),
                input_type: ATTRIBUTE_VALUE_TYPE.TEXT,
                isCustom: true,
                values: [{ v: '', code: randomString(8) }]
              }
              setCustomAttributes(prev => {
                let has_asset = prev.length == 0
                console.log('has_asset', has_asset)
                return prev.concat([{ ...att, has_asset }])
              })
              setAttributesSelected(prev => {
                let has_asset = prev.length == 0
                console.log('has_asset', has_asset, prev)
                return prev.concat([{ ...att, has_asset }])
              })
            } else {

              if (attributesSelected.some(_att => _att.id == attributeRename)) {
                setAttributesSelected(prev => {
                  return prev.map(_att => {
                    if (_att.id == attributeRename) {
                      return {
                        ..._att,
                        display_name: values['name_attribute'],
                        name: slugify(values['name_attribute']),
                      }
                    }
                    return _att;
                  })
                })
              }

              setCustomAttributes(prev => {
                return prev.map(_att => {
                  if (_att.id == attributeRename) {
                    return {
                      ..._att,
                      display_name: values['name_attribute'],
                      name: slugify(values['name_attribute']),
                    }
                  }
                  return _att;
                })
              })
            }
            resetUnit()
            onHide()
          }}
        >
          {({
            handleSubmit,
            values,
            validateForm,
            setFieldError,
            submitForm,
          }) => {
            return (
              <Form>
                <div className="form-group mb-0">
                  <Field
                    name="name_attribute"
                    component={InputVertical}
                    placeholder={formatMessage({
                      defaultMessage: 'Tên nhóm phân loại',
                    })}
                    label={''}
                    required
                    customFeedbackLabel={' '}
                    countChar
                    maxChar={14}
                  />
                </div>
                <button
                  type="submit"
                  style={{ display: "none" }}
                  ref={btnRef}
                  onClick={async (e) => {
                    e.preventDefault();
                    let res = await validateForm()
                    if (Object.keys(res).length == 0) {
                      if (customAttributes.some(_att => _att.id != attributeRename && _att.name == slugify(values['name_attribute']))) {
                        setFieldError('name_attribute', formatMessage({
                          defaultMessage: "Tên nhóm phân loại đã tồn tại",
                        }))
                      } else {
                        submitForm()
                      }
                    } else {
                      submitForm()
                    }
                  }}
                >
                </button>
              </Form>
            )
          }}
        </Formik>
      </Modal.Body>
      <Modal.Footer className="form" style={{ borderTop: 'none', justifyContent: 'center', paddingTop: 0 }} >
        <div className="form-group">
          <button
            type="button"
            onClick={onHide}
            className="btn btn-light btn-elevate mr-3"
            style={{ width: 100 }}
          >
            <FormattedMessage defaultMessage="ĐÓNG" />
          </button>
          <button
            type="button"
            onClick={saveClick}
            className="btn btn-primary btn-elevate"
            style={{ width: 100 }}
          >
            <FormattedMessage defaultMessage="XÁC NHẬN" />
          </button>
        </div>
      </Modal.Footer>
    </Modal >
  );
}

export default injectIntl(ProductAddAtributeDialog);