import React, { Fragment, useState } from "react";
import { useFormik } from "formik";
import { connect } from "react-redux";
import { Link, Redirect, useHistory } from "react-router-dom";
import * as Yup from "yup";
import { FormattedMessage, injectIntl } from "react-intl";
import * as auth from "../_redux/authRedux";
import { requestPassword } from "../_redux/authCrud";
import { Helmet } from 'react-helmet-async';
import AUTH_FORGOT_PASSWORD from '../../../../graphql/auth-forgot-password'
import { useMutation } from '@apollo/client'
import { toAbsoluteUrl } from "../../../../_metronic/_helpers";
import { LanguageSelectorDropdown } from "../../../../_metronic/layout/components/extras/dropdowns/LanguageSelectorDropdown";
const initialValues = {
  email: "",
};

function ForgotPassword(props) {
  const [mutationForgot, { data }] = useMutation(AUTH_FORGOT_PASSWORD)
  const { intl } = props;
  const history = useHistory()
  const [isRequested, setIsRequested] = useState(false);
  const ForgotPasswordSchema = Yup.object().shape({
    email: Yup.string()
      .email(intl.formatMessage({
        defaultMessage: "Email không hợp lệ",
      }))
      .required(
        intl.formatMessage({
          defaultMessage: "Vui lòng nhập email",
        })
      ),
  });

  const getInputClasses = (fieldname) => {
    if (formik.touched[fieldname] && formik.errors[fieldname]) {
      return "is-invalid";
    }

    // if (formik.touched[fieldname] && !formik.errors[fieldname]) {
    //   return "is-valid";
    // }

    return "";
  };

  const formik = useFormik({
    initialValues,
    validationSchema: ForgotPasswordSchema,
    onSubmit: async (values, { setStatus, setSubmitting }) => {
      setStatus(
        ""
      );
      try {
        let res = await mutationForgot({
          variables: {
            email: values.email
          }
        })

        if (res.errors) {
          throw Error(res.errors[0].message)
        } else {
          if (res?.data?.authForgotPassword?.success) {

          } else {
            throw Error(res?.data?.authForgotPassword?.message)
          }
          // window.location.replace(res.data.authForgotPassword.redirect_url)
        }
      } catch (error) {
        setSubmitting(false);
        setStatus(
          error.message
        );
      }

    },
  });

  let isSuccess = data?.authForgotPassword?.success

  return (
    <Fragment>
      <Helmet
        titleTemplate={`${intl.formatMessage({ defaultMessage: 'Quên mật khẩu' })} - UpBase`}
        defaultTitle={`${intl.formatMessage({ defaultMessage: 'Quên mật khẩu' })} - UpBase`}
      >
        <meta name="description" content={`${intl.formatMessage({ defaultMessage: 'Quên mật khẩu' })} - UpBase`} />
      </Helmet>
      <div className="d-flex flex-column flex-root bg-white">
        <div className="d-flex flex-column position-relative flex-column-fluid  flex-center px-30 overflow-hidden">
          <div style={{ position: 'absolute', top: 15, right: '7.5rem' }}>
            <LanguageSelectorDropdown showName={true} />
          </div>
          {isRequested && <Redirect to="/auth" />}
          {!isRequested && (
            <div className="login-form login-forgot cus-border px-20 pt-10 pb-30" style={{ display: "block", borderRadius: 12 }}>
              <div className="text-center mb-4">
                <img className='mb-10' style={{ width: 150 }} src={toAbsoluteUrl("/media/logos/logo-dark.png")} />
                <h3 className="font-size-h1 font-weight-boldest"><FormattedMessage defaultMessage="Quên mật khẩu" /></h3>
                <div className="text-muted font-weight-normal mt-5" style={{ whiteSpace: 'pre' }} >
                  {isSuccess ? (
                    <FormattedMessage defaultMessage={`UpBase đã gửi mã xác nhận tới email {email}.\n Bạn vui lòng kiểm tra email vào thao tác theo hướng dẫn.`} values={{
                      email: formik.values.email
                    }} />
                  ) : (
                    <FormattedMessage defaultMessage={`Vui lòng nhập email đã đăng ký tài khoản, UpBase sẽ \n gửi cho bạn mã xác nhận để cập nhật lại mật khẩu.`} values={{
                      email: formik.values.email
                    }} />
                  )}
                </div>
              </div>
              {
                //Render form forgot
                !isSuccess && <form
                  onSubmit={formik.handleSubmit}
                  className="form fv-plugins-bootstrap fv-plugins-framework animated animate__animated animate__backInUp"
                >
                  {
                    formik.status && (
                      <div className="mb-4 fv-plugins-message-container">
                        <div className="fv-help-block"><i className="fv-help-block  flaticon2-warning font-weight-boldest" />&ensp;{formik.status}</div>
                      </div>
                    )}
                  <div className="form-group fv-plugins-icon-container">
                    <input
                      placeholder='Email'
                      type="email"
                      className={`form-control form-control-solid h-auto py-5 px-6 ${getInputClasses(
                        "email"
                      )}`}
                      name="email"
                      {...formik.getFieldProps("email")}
                    />
                    {formik.touched.email && formik.errors.email ? (
                      <div className="fv-plugins-message-container">
                        <div className="fv-help-block">{formik.errors.email}</div>
                      </div>
                    ) : null}
                  </div>
                  <div className="form-group d-flex flex-wrap flex-center">
                    <button
                      id="kt_login_forgot_submit"
                      type="submit"
                      className="btn btn-primary font-weight-bold px-9 py-4 my-3 btn-block"
                      disabled={formik.isSubmitting}
                    >
                      <span className="font-weight-boldest"><FormattedMessage defaultMessage="Tiếp tục" /></span>
                      {formik.isSubmitting && <span className="ml-3 spinner spinner-white"></span>}
                    </button>
                  </div>
                </form>
              }


              {
                isSuccess && <div className="form-group d-flex flex-wrap flex-center">
                  <button
                    id="kt_login_forgot_submit"
                    type="submit"
                    className="btn btn-primary font-weight-bold px-9 py-4 my-3 btn-block"
                    disabled={formik.isSubmitting}
                    onClick={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      history.push('/auth/login')
                    }}
                  >
                    <span className="font-weight-boldest"><FormattedMessage defaultMessage="Đóng" /></span>
                  </button>
                </div>
              }
            </div>
          )}

        </div>
      </div>
    </Fragment>
  );
}

export default injectIntl(connect(null, auth.actions)(ForgotPassword));
