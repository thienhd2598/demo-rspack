import React, { Fragment, useEffect, useState } from "react";
import { useFormik } from "formik";
import { connect } from "react-redux";
import { Redirect, useHistory, useLocation, useParams } from "react-router-dom";
import * as Yup from "yup";
import { FormattedMessage, injectIntl } from "react-intl";
import * as auth from "../_redux/authRedux";
import { Helmet } from 'react-helmet-async';
import AUTH_CHANGE_PASSWORD from '../../../../graphql/auth-change-password'
import { useMutation } from '@apollo/client'
import { toAbsoluteUrl } from "../../../../_metronic/_helpers";

import queryString from 'querystring'

const initialValues = {
  password: "",
  changepassword: ""
};

function ForgotPassword(props) {
  const [mutationChange, { data }] = useMutation(AUTH_CHANGE_PASSWORD)
  const { intl } = props;
  const history = useHistory()
  const params = useLocation()
  const [countTime, setCountTime] = useState(5)

  const ChangePasswordSchema = Yup.object().shape({
    password: Yup.string()
      .min(6, intl.formatMessage({
        defaultMessage: "Mật khẩu",
      }) + ' ' + intl.formatMessage({
        defaultMessage: "tối thiểu {min} ký tự",
      }, {
        min: 6
      }))
      .max(50, intl.formatMessage({
        defaultMessage: "Nhiều nhất {min} ký tự"
      }, {
        min: 50
      }))
      .required(
        intl.formatMessage({
          defaultMessage: "Vui lòng nhập mật khẩu mới",
        })
      ),
    changepassword: Yup.string()
      .required(
        intl.formatMessage({
          defaultMessage: "Vui lòng nhập lại mật khẩu mới",
        })
      )
      .when("password", {
        is: (val) => (val && val.length > 0 ? true : false),
        then: Yup.string().oneOf(
          [Yup.ref("password")],
          intl.formatMessage({
            defaultMessage: "Hai mật khẩu phải trùng khớp nhau",
          })
        ),
      }),
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


  useEffect(() => {
    let timeout = null
    if (data?.authChangePassword?.success) {
      if (countTime > 0) {
        timeout = setTimeout(() => {
          setCountTime(countTime - 1)
        }, 1000);
      } else {
        //xử lý hết đếm ngược
      }
    }
    return () => !!timeout && clearTimeout(timeout);
  }, [data?.authChangePassword?.success, countTime])


  const formik = useFormik({
    initialValues,
    validationSchema: ChangePasswordSchema,
    onSubmit: async (values, { setStatus, setSubmitting }) => {
      setStatus(
        ""
      );
      let { token } = queryString.parse(params.search.slice(1, params.search.length))
      console.log(token)

      try {
        let res = await mutationChange({
          variables: {
            password: values.password,
            token: token
          }
        })

        if (res.errors) {
          throw Error(res.errors[0].message)
        } else {
          if (res?.data?.authChangePassword?.success) {

          } else {
            throw Error(res?.data?.authChangePassword?.message)
          }
          // window.location.replace(res.data.authChangePassword.redirect_url)
        }
      } catch (error) {
        setSubmitting(false);
        setStatus(
          error.message
        );
      }

    },
  });

  let isSuccess = data?.authChangePassword?.success

  if (countTime <= 0) {
    return <Redirect to='/auth/login' />
  }
  return (
    <Fragment>
      <Helmet
        titleTemplate={`${intl.formatMessage({ defaultMessage: 'Đổi mật khẩu' })} - UpBase`}
        defaultTitle={`${intl.formatMessage({ defaultMessage: 'Đổi mật khẩu' })} - UpBase`}
      >
        <meta name="description" content={`${intl.formatMessage({ defaultMessage: 'Đổi mật khẩu' })} - UpBase`} />
      </Helmet>
      <div className="d-flex flex-column flex-root bg-white">
        <div className="d-flex flex-column position-relative flex-column-fluid  flex-center px-sm-30 overflow-hidden">
          <div className="login-form  cus-border px-20 pt-10 pb-30 w-100" style={{ display: "block", borderRadius: 12, maxWidth: 480 }}>
            <div className="text-center mb-6">
              <img className='mb-10' style={{ width: 150 }} src={toAbsoluteUrl("/media/logos/logo-dark.png")} />
              <h3 className="font-size-h1 font-weight-boldest"><FormattedMessage defaultMessage="Mật khẩu mới" /></h3>
              {
                isSuccess && <div className="text-muted font-weight-normal mt-5">
                  <FormattedMessage defaultMessage={`Đổi mật khẩu thành công. Hệ thống sẽ tự động\nchuyển hướng đến màn hình đăng nhập sau {second} giây`} values={{
                    second: countTime
                  }} />
                  <br />
                  ...
                </div>
              }
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
                      <div className="fv-help-block " ><i className="fv-help-block  flaticon2-warning font-weight-boldest" />&ensp;{formik.status}</div>
                    </div>
                  )}
                {/* begin: Password */}
                <div className="form-group fv-plugins-icon-container">
                  <input
                    placeholder={intl.formatMessage({
                      defaultMessage: "Mật khẩu mới",
                    })}
                    type="password"
                    className={`form-control form-control-solid h-auto py-5 px-6 ${getInputClasses(
                      "password"
                    )}`}
                    name="password"
                    {...formik.getFieldProps("password")}
                  />
                  {formik.touched.password && formik.errors.password ? (
                    <div className="fv-plugins-message-container">
                      <div className="fv-help-block">{formik.errors.password}</div>
                    </div>
                  ) : null}
                </div>
                {/* end: Password */}

                {/* begin: Confirm Password */}
                <div className="form-group fv-plugins-icon-container">
                  <input
                    placeholder={intl.formatMessage({
                      defaultMessage: "Nhập lại mật khẩu mới",
                    })}
                    type="password"
                    className={`form-control form-control-solid h-auto py-5 px-6 ${getInputClasses(
                      "changepassword"
                    )}`}
                    name="changepassword"
                    {...formik.getFieldProps("changepassword")}
                  />
                  {formik.touched.changepassword && formik.errors.changepassword ? (
                    <div className="fv-plugins-message-container">
                      <div className="fv-help-block">
                        {formik.errors.changepassword}
                      </div>
                    </div>
                  ) : null}
                </div>
                {/* end: Confirm Password */}
                <div className="form-group d-flex flex-wrap flex-center">
                  <button
                    id="kt_login_forgot_submit"
                    type="submit"
                    className="btn btn-primary font-weight-bold px-9 py-4 my-3 btn-block"
                    disabled={formik.isSubmitting}
                  >
                    <span className="font-weight-boldest"><FormattedMessage defaultMessage="Cập nhật" /></span>
                    {formik.isSubmitting && <span className="ml-3 spinner spinner-white"></span>}
                  </button>
                </div>
              </form>
            }


          </div>
        </div>
      </div>
    </Fragment>
  );
}

export default injectIntl(connect(null, auth.actions)(ForgotPassword));
