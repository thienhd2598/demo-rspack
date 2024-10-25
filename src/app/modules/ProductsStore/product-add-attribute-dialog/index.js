import React, { useMemo, useRef } from "react";
import { Modal } from "react-bootstrap";
import { useProductsUIContext } from "../ProductsUIContext";
import { FormattedMessage, injectIntl, useIntl } from "react-intl";
import { Formik, Form, Field, useFormikContext } from "formik";
import { ReSelect } from '../../../../_metronic/_partials/controls/forms/ReSelect';
import { InputVertical } from "../../../../_metronic/_partials/controls";
import * as Yup from "yup";
import slugify from 'react-slugify';
import { ATTRIBUTE_VALUE_TYPE } from '../ProductsUIHelpers'
import { randomString } from "../../../../utils";
import { ReSelectVertical } from "../../../../_metronic/_partials/controls/forms/ReSelectVertical";

const regex = new RegExp("[^\u0000-\u007F]+")
function ProductAddAtributeDialog({ show, onHide, attributeRename, name_attribute }) {
  // Products UI Context
  const { formatMessage } = useIntl()
  const { customAttributes, setCustomAttributes, attributesSelected, setAttributesSelected, currentChannel } = useProductsUIContext()

  // Validation schema
  const validationSchemaTiktok = Yup.object().shape({
    name_attribute: Yup.object().required(formatMessage({ defaultMessage: 'Vui lòng chọn nhóm phân loại' }))
  })

  const validationSchema = Yup.object().shape({
    name_attribute: Yup.string()
      .max(14, formatMessage({ defaultMessage: "{name} tối đa {length} ký tự" }, {
        length: 14, name: formatMessage({
          defaultMessage: 'Tên nhóm phân loại',
        }) || ''
      }))
      .required(formatMessage({ defaultMessage: 'Vui lòng nhập tên nhóm phân loại' }))
      .notOneOf(customAttributes.map(_attribute => _attribute.display_name), formatMessage({ defaultMessage: 'Tên các nhóm phân loại không được trùng nhau' }))
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

  console.log({ attributesSelected, customAttributes });

  return (
    <Modal
      show={show}
      onHide={onHide}
      aria-labelledby="example-modal-sizes-title-sm"
      centered
    >
      <Modal.Header>
        <Modal.Title>
          {!!attributeRename ? <FormattedMessage defaultMessage="Sửa nhóm phân loại" /> : <FormattedMessage defaultMessage="Thêm nhóm phân loại" />}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="overlay overlay-block cursor-default">
        <Formik
          initialValues={{ name_attribute: name_attribute || '' }}
          validationSchema={validationSchemaTiktok}
          onSubmit={(values) => {
            const [isTiktok, isLazada, isShopee] = [
              currentChannel?.connector_channel_code == 'tiktok',
              currentChannel?.connector_channel_code == 'lazada',
              currentChannel?.connector_channel_code == 'shopee',
            ];

            if (!attributeRename) {
              let att = {
                attribute_type: 1,
                display_name: values['name_attribute']?.label,
                name: slugify(values['name_attribute']?.label),
                id: randomString(),
                input_type: ATTRIBUTE_VALUE_TYPE.TEXT,
                isCustom: true,
                values: [{ v: '', code: randomString(8) }],
                groups: values['name_attribute']?.groups || [],
                sc_attribute_id: !values['name_attribute'].__isNew__ ? values['name_attribute']?.value : null,
              }
              
              setAttributesSelected(prev => {
                let has_asset = prev.length == 0
                return prev.concat([{ ...att, has_asset }])
              })
            } else {
              if (attributesSelected.some(_att => _att.id == attributeRename)) {
                setAttributesSelected(prev => {
                  return prev.map(_att => {
                    if (_att.id == attributeRename) {
                      return {
                        ..._att,
                        display_name: values['name_attribute']?.label,
                        name: slugify(values['name_attribute']?.label),
                        sc_attribute_id: !values['name_attribute'].__isNew__ ? values['name_attribute']?.value : null,
                        groups: values['name_attribute']?.groups || [],
                        currentGroupSelect: null,
                        values: _att?.values?.map(item => ({
                          ...item,
                          ref_attribute_group_id: null,
                          sc_attribute_group_id: null,
                          sc_option_id: null
                        }))
                      }
                    }
                    return _att;
                  })
                })
              }
              // setCustomAttributes(prev => {
              //   return prev.map(_att => {
              //     if (_att.id == attributeRename) {
              //       return {
              //         ..._att,
              //         display_name: values['name_attribute']?.label,
              //         name: slugify(values['name_attribute']?.label),
              //         sc_attribute_id: !values['name_attribute'].__isNew__ ? values['name_attribute']?.value : null
              //       }
              //     }
              //     return _att;
              //   })
              // })
            }
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
                  {/* {currentChannel?.connector_channel_code == 'tiktok' && <Field
                    name="name_attribute"
                    component={ReSelect}
                    placeholder={formatMessage({
                      defaultMessage: 'Tên nhóm phân loại',
                    })}
                    customFeedbackLabel={' '}
                    options={customAttributes
                      ?.filter(_pro => !!_pro.id && !attributesSelected?.some(_att => _att?.display_name == _pro?.display_name))
                      ?.map(_pro => {
                        return {
                          label: _pro.display_name,
                          value: String(_pro.id),
                        }
                      })}
                    cols={['col-0', 'col-12']}
                  />} */}
                  {currentChannel?.connector_channel_code != 'shopee' && <Field
                    name="name_attribute"
                    isCreatable={true}
                    component={ReSelectVertical}
                    placeholder={formatMessage({
                      defaultMessage: 'Tên nhóm phân loại',
                    })}
                    customFeedbackLabel={' '}
                    options={customAttributes
                      ?.filter(_pro => !!_pro.id && !attributesSelected?.some(_att => _att?.display_name == _pro?.display_name))
                      ?.map(_pro => {
                        return {
                          label: _pro.display_name,
                          value: String(_pro.id),
                        }
                      })}
                    cols={['col-0', 'col-12']}
                  />}
                  {currentChannel?.connector_channel_code == 'shopee' && <Field
                    name="name_attribute"
                    isCreatable={true}
                    component={ReSelectVertical}
                    placeholder={formatMessage({
                      defaultMessage: 'Tên nhóm phân loại',
                    })}
                    customFeedbackLabel={' '}
                    options={customAttributes
                      ?.filter(_pro => !!_pro.id && !attributesSelected?.some(_att => _att?.display_name == _pro?.display_name))
                      ?.map(_pro => {
                        return {
                          label: _pro.display_name,
                          value: String(_pro.id),
                          groups: _pro?.groups
                        }
                      })}
                    cols={['col-0', 'col-12']}
                  />}
                </div>
                <button
                  type="submit"
                  style={{ display: "none" }}
                  ref={btnRef}
                  onClick={async (e) => {
                    e.preventDefault();
                    let res = await validateForm()

                    if (Object.keys(res).length == 0) {
                      if (currentChannel?.connector_channel_code == 'lazada' && values['name_attribute']?.label?.trim()?.length > 15 && !!values['name_attribute']?.__isNew__) {
                        setFieldError('name_attribute', formatMessage({ defaultMessage: 'Tên nhóm phân loại không được vượt quá 15 ký tự' }));
                        return;
                      }

                      if (currentChannel?.connector_channel_code != 'lazada' && values['name_attribute']?.label?.trim()?.length > 14 && !!values['name_attribute']?.__isNew__) {
                        setFieldError('name_attribute', formatMessage({ defaultMessage: 'Tên nhóm phân loại không được vượt quá 14 ký tự' }));
                        return;
                      }

                      if (attributesSelected.some(_att => _att.display_name == values['name_attribute']?.label)) {
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