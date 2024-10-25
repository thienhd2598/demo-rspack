import { Field, Formik } from 'formik';
import React from 'react'
import { Modal } from 'react-bootstrap'
import { FormattedMessage } from 'react-intl'
import { useIntl } from 'react-intl';
import { Input, TextArea } from '../../../../_metronic/_partials/controls';
import * as Yup from "yup";
import mutate_scCreateStoreChannelOther from '../../../../graphql/mutate_scCreateStoreChannelOther'
import mutate_scCheckNameStoreExist from '../../../../graphql/mutate_scCheckNameStoreExist'
import { useMutation } from "@apollo/client";
import { useFormikContext } from 'formik';
import { useToasts } from 'react-toast-notifications';
import { useLocation, useHistory } from "react-router-dom";
import LoadingDialog from '../../ProductsStore/product-new/LoadingDialog';

const AddStoreDialog = ({ show, onHide }) => {
    const { formatMessage } = useIntl();

    const [addStoreMutation , { loading }] = useMutation(mutate_scCreateStoreChannelOther)
    const [checkExistName , { loading: checkExist }] = useMutation(mutate_scCheckNameStoreExist)
  
    const history = useHistory();

    const { addToast } = useToasts()
    const SignupSchema = Yup.object().shape({
        nameStore: Yup.string()
          .required('Vui lòng nhập tên gian hàng.')
          .max(120, formatMessage({ defaultMessage: "Tên gian hàng tối đa 120 ký tự." }))
          .test(
            'chua-ky-tu-space-o-dau-cuoi',
            formatMessage({ defaultMessage: 'Tên gian hàng không được chứa dấu cách ở đầu và cuối' }),
            (value, context) => {
              if (!!value) {
                return value.length == value.trim().length;
              }
              return false;
            },
          )
          .test(
            'chua-ky-tu-2space',
            formatMessage({ defaultMessage: 'Tên gian hàng không được chứa 2 dấu cách liên tiếp' }),
            (value, context) => {
              if (!!value) {
                return !(/\s\s+/g.test(value))
              }
              return false;
            },
          ).when(`isNameExist`, {
            is: values => {
              return !!values
            },
            then: Yup.string().oneOf([`nameExist`], formatMessage({ defaultMessage: 'Tên gian hàng đã tồn tại' }))
          }),
          nameCompany: Yup.string()
          .max(120, formatMessage({ defaultMessage: "Tên công ty tối đa 120 ký tự." })),
          review: Yup.string()
          .max(500, formatMessage({ defaultMessage: "Mô tả tối đa 500 ký tự." })),
          email: Yup.string()
                .max(120, formatMessage({ defaultMessage: "Email tối đa 120 ký tự." }))
                .nullable()
                .email(formatMessage({ defaultMessage: "Email không hợp lệ" })),
    });
  return (
      <Formik
        enableReinitialize
        initialValues={{
            nameStore: '',
            email: '',
            nameCompany: '',
            review: ''
        }}
        onSubmit={async (values) => {

        const { data } = await addStoreMutation({
            variables: {
                company_name: values['nameCompany'],
                country_code: 'vn',
                description: values['review'],
                email: values['email'],
                name: values['nameStore'],
            }
        })
        if(!!data?.scCreateStoreChannelOther?.success) {
            addToast('Thêm gian hàng thành công', { appearance: 'success'})
            onHide()
            
            history.push({
                pathname: "/setting/channels",
                state: { reloadStore: true }
            })
        } else {
            addToast('Thêm gian hàng thành công', { appearance: 'error'})
        }
      }}

      validationSchema={SignupSchema}
    >
      {({ values, handleSubmit, isSubmitting, setFieldValue }) => {
        return (
          <>
            <Modal size="lg"
              show={show}
              aria-labelledby="example-modal-sizes-title-sm"
              dialogClassName="modal-show-connect-product"
              centered
              onHide={() => { console.log('hide')}}
              backdrop={true}
            >
              <Modal.Header closeButton={true}>
                <Modal.Title>
                  {formatMessage({defaultMessage: 'Thêm gian hàng'})}
                </Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <div>
                <LoadingDialog show={loading} />
                  <div className='mb-2 row'>
                    <span style={{ position: 'relative', top: '10px'}} className='col-2 p-0 text-right'>{formatMessage({ defaultMessage: 'Tên gian hàng' })} <span className='text-primary'>*</span></span>
                    <div className="col-10">
                      <Field name={`nameStore`}
                        component={Input}
                        value={values['nameStore']}
                        disabled={loading}
                        placeholder={formatMessage({
                          defaultMessage: 'Nhập tên gian hàng',
                        })}
                        onBlurChange={async (value) => {
                          const { data } = await checkExistName({
                            variables: {
                              name: value
                            }
                          })
                          if(!!data?.scCheckNameStoreExist?.count_exists) {
                            setFieldValue('isNameExist', true)
                            setFieldValue('nameExist', value['nameStore'])
                          } else {
                            setFieldValue('isNameExist', false)
                            setFieldValue('nameExist',  '')
                          }
                        }}
                        label={""}
                        required={true}
                        customFeedbackLabel={" "}
                        cols={["col-0", "col-12"]}
                        rows={2}
                        maxChar={"120"} />
                    </div>
                  </div>
                  <div className='mb-2 row'>
                    <span style={{ position: 'relative', top: '10px'}} className='col-2 p-0 text-right'>{formatMessage({ defaultMessage: 'Email' })}</span>
                    <div className="col-10">
                      <Field name={`email`}
                        component={Input}
                        value={values['email']}
                        placeholder={formatMessage({
                          defaultMessage: "Nhập Email",
                        })}
                        label={""}
                        required={false}
                        customFeedbackLabel={" "}
                        cols={["col-0", "col-12"]}
                        rows={2}
                        maxChar={"120"} />
                    </div>
                  </div>

                  <div className='mb-2 row'>
                    <span style={{ position: 'relative', top: '10px'}} className='col-2 p-0 text-right'>{formatMessage({ defaultMessage: 'Tên công ty' })}</span>
                    <div className="col-10">
                      <Field name={`nameCompany`}
                        component={Input}
                        value={values['nameCompany']}
                        placeholder={formatMessage({
                          defaultMessage: "Nhập tên công ty",
                        })}
                        label={""}
                        required={false}
                        customFeedbackLabel={" "}
                        cols={["col-0", "col-12"]}
                        rows={2}
                        maxChar={"120"} />
                    </div>
                  </div>

                  <div className='mb-2 row'>
                    <span style={{ position: 'relative', top: '10px'}} className='col-2 p-0 text-right'>Mô tả</span>
                    <div className="col-10">
                      <Field name={`review`}
                        value={values['review']}
                        component={TextArea}
                        placeholder={formatMessage({
                          defaultMessage: "Nhập mô tả",
                        })}
                        label={""}
                        required={false}
                        customFeedbackLabel={" "}
                        cols={["col-0", "col-12"]}
                        countChar
                        rows={4}
                        maxChar={"500"} />
                    </div>
                  </div>

                </div>
              </Modal.Body>
              <Modal.Footer className="form" style={{ borderTop: "1px solid #dbdbdb", justifyContent: "end", addingTop: 10, paddingBottom: 10, }}>
                <div className="form-group">
                  <button onClick={onHide} type="button" className="btn mr-3" style={{ width: 100, background: 'gray', color: "#fff" }}>
                    Hủy bỏ
                  </button>
                  <button disabled={isSubmitting} type="submit" onClick={handleSubmit} className="btn btn-primary btn-elevate mr-3" style={{ width: 100 }}>
                    {formatMessage({ defaultMessage: 'Lưu lại' })}
                  </button>
                </div>
              </Modal.Footer>
            </Modal>
          </>
        )
      }}
    </Formik >
     
  )
}

export default AddStoreDialog