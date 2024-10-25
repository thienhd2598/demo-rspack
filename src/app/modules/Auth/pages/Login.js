/*
 * Created by duydatpham@gmail.com on 22/05/2021
 * Copyright (c) 2021 duydatpham@gmail.com
 */

import React, { Fragment, useEffect, useState } from "react";
import { Link, useHistory, useLocation } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import { connect } from "react-redux";
import { FormattedMessage, injectIntl } from "react-intl";
import { actions } from "../_redux/authRedux";
import { login } from "../_redux/authCrud";
import { Helmet } from 'react-helmet-async';
import firebase, { auth } from '../../../../firebase'
import { useMutation } from '@apollo/client'
import AUTH_SSO from '../../../../graphql/authen-sso'
import { toAbsoluteUrl } from "../../../../_metronic/_helpers";
import { LanguageSelectorDropdown } from "../../../../_metronic/layout/components/extras/dropdowns/LanguageSelectorDropdown";
import queryString from 'querystring';
import getCustomToken from "../../../../utils/getCustomToken";

function Login(props) {
  const [mutationAuthen] = useMutation(AUTH_SSO)
  const { intl } = props;
  const location = useLocation();
  const history = useHistory();
  let { source } = queryString.parse(location.search.slice(1, location.search.length));
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const LoginSchema = Yup.object().shape({
    email: Yup.string()
      .email(intl.formatMessage({
        defaultMessage: "Email không hợp lệ",
      }))
      // .min(3, "Minimum 3 symbols")
      // .max(50, "Maximum 50 symbols")
      .required(
        intl.formatMessage({
          defaultMessage: "Vui lòng nhập email",
        })
      ),
    password: Yup.string()
      // .min(3, "Minimum 3 symbols")
      // .max(50, "Maximum 50 symbols")
      .required(
        intl.formatMessage({
          defaultMessage: "Vui lòng nhập mật khẩu",
        })
      ),
  });

  const enableLoading = (provider) => {
    setLoading(provider);
  };

  const disableLoading = () => {
    setLoading(false);
  };

  console.log(`PATH NAME: `, process.env.PUBLIC_URL)

  async function onAuthStateChanged(user) {
    console.log({ user })
    if (!!user) {
      try {
        let idToken = await user?.getIdToken(true)
        console.log({ uid: user?.uid, idToken })

        formik.setSubmitting(true);
        enableLoading(user?.providerData[0].providerId);

        let res = await mutationAuthen({
          variables: {
            firebase_id: user?.uid,
            idToken,
            provider: user?.providerData[0].providerId
          }
        })
        console.log('res', res)
        if (!!res.data?.authSSO?.user_id) {
          let newIdToken = await user?.getIdToken(true)
          props.login(newIdToken)
          let _now = Date.now()
          localStorage.setItem('last_login', _now)
          !!window.changeLastLogin && window.changeLastLogin(_now);
          if (source == 'chat') {
            getCustomToken(token => {
              if (!!token) {
                window.location.replace(`${process.env.REACT_APP_CHAT_ENDPOINT}/verify-token?uid=${user?.id}&token=${idToken}&isSubUser=${!!user?.is_subuser}&customToken=${token}`);
              } else {
                window.location.replace(`${process.env.REACT_APP_CHAT_ENDPOINT}/verify-token?uid=${user?.id}&token=${idToken}&isSubUser=${!!user?.is_subuser}`);                        
              }
            });
          }          
        } else {
          throw new Error(res?.errors?.[0]?.message || intl.formatMessage({
            defaultMessage: "Tài khoản này không có trong hệ thống",
          }));
        }
      } catch (error) {
        console.log('error', error)
        auth.signOut()
        formik.setStatus(
          error.message
        );
        formik.setSubmitting(false);
        disableLoading();
      }
    } else {
    }
  }

  useEffect(() => {
    const subscriberStateChanged = auth.onAuthStateChanged(onAuthStateChanged);
    return () => {
      subscriberStateChanged()
    }; // unsubscribe on unmount
  }, []);

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
    initialValues: {
      email: '',
      password: ''
    },
    validationSchema: LoginSchema,
    onSubmit: async (values, { setStatus, setSubmitting }) => {
      enableLoading('password');
      try {
        await auth.signInWithEmailAndPassword(values.email, values.password)
      } catch (error) {
        setStatus(
          // error.message
          intl.formatMessage({ defaultMessage: "Tài khoản hoặc mật khẩu không chính xác" })
        );
        disableLoading();
        setSubmitting(false);
      }
    },
  });

  const _loginWithGoogle = async () => {
    formik.setSubmitting(true);
    enableLoading('google');
    try {
      await auth.signInWithPopup(
        new firebase.auth.GoogleAuthProvider(),
      );
    } catch (error) {
      disableLoading();
      formik.setSubmitting(false);
    }
  }

  return (
    <Fragment>
      <Helmet
        titleTemplate={`${intl.formatMessage({ defaultMessage: `Đăng nhập` })} - UpBase`}
        defaultTitle={`${intl.formatMessage({ defaultMessage: `Đăng nhập` })} - UpBase`}
      >
        <meta name="description" content={`${intl.formatMessage({ defaultMessage: `Đăng nhập` })} - UpBase`} />
      </Helmet>
      <div className="d-flex flex-column flex-root">
        <div
          className="login login-1 login-signin-on d-md-flex bg-white h-100"
          id="kt_login"
        >
          <div
            className="login-aside d-flex flex-row-auto bgi-size-cover bgi-position-center bgi-no-repeat"
            style={{
              backgroundImage: `url(${toAbsoluteUrl("/media/logos/login_bg.svg")})`,
            }}
          >
            <div className="d-flex flex-row-fluid flex-column justify-content-center align-items-center">
              <img src={toAbsoluteUrl("/media/logos/login_image.svg")} style={{ maxWidth: 600, maxHeight: 600 }} />

            </div>
          </div>
          <div className="d-flex flex-column position-relative p-md-30 p-10 overflow-hidden">
            <div style={{ position: 'absolute', top: 15, right: '7.5rem' }}>
              <LanguageSelectorDropdown showName={true} />
            </div>
            <div className="d-flex flex-column-fluid " style={{ justifyContent: 'center' }} >
              <div className="login-form login-signin" id="kt_login_signin_form">
                <div className="d-flex justify-content-center">
                  <h1 className="font-size-h1 font-weight-boldest">
                    <FormattedMessage defaultMessage="Đăng nhập" />
                  </h1>
                </div>
                <form
                  onSubmit={formik.handleSubmit}
                  className="form fv-plugins-bootstrap fv-plugins-framework"
                >
                  {
                    formik.status ? (
                      <div className="mb-2 fv-plugins-message-container">
                        <div className="fv-help-block " ><i className="fv-help-block  flaticon2-warning font-weight-boldest" />&ensp;{formik.status}</div>
                      </div>
                    ) : <div className="mb-2 fv-plugins-message-container">
                      <div className="fv-help-block " >&ensp;</div>
                    </div>
                  }

                  <div className="form-group fv-plugins-icon-container">
                    <input
                      placeholder={intl.formatMessage({ defaultMessage: "Email đăng nhập" })}
                      type="email"
                      className={`form-control form-control-solid h-auto py-5 px-6`}
                      name="email"
                      {...formik.getFieldProps("email")}
                    />
                    {formik.touched.email && formik.errors.email ? (
                      <div className="fv-plugins-message-container">
                        <div className="fv-help-block">{formik.errors.email}</div>
                      </div>
                    ) : null}
                  </div>
                  <div className="form-group fv-plugins-icon-container">
                    <div style={{ position: 'relative' }} >
                      <input
                        placeholder={intl.formatMessage({ defaultMessage: 'Nhập mật khẩu' })}
                        type={showPass ? 'text' : "password"}
                        className={`form-control form-control-solid h-auto py-5 pl-6 pr-14`}
                        name="password"
                        {...formik.getFieldProps("password")}
                      />
                      <a style={{ position: 'absolute', right: 0, top: 0, padding: 18 }} onClick={e => { setShowPass(!showPass) }} ><i className={showPass ? "far fa-eye text-dark" : "far fa-eye-slash"}></i></a>
                    </div>
                    {formik.touched.password && formik.errors.password ? (
                      <div className="fv-plugins-message-container">
                        <div className="fv-help-block">{formik.errors.password}</div>
                      </div>
                    ) : null}
                    <div className="d-flex flex-wrap justify-content-between align-items-center mt-2">
                      <h4 className="font-weight-boldest"></h4>
                      <Link
                        to="/auth/forgot-password"
                        className="font-weight-boldest text-info text-hover-info"
                        id="kt_login_forgot"
                      >
                        <span><FormattedMessage defaultMessage="Quên mật khẩu?" /></span>
                      </Link>
                    </div>
                  </div>
                  <div className="form-group d-flex flex-wrap justify-content-between align-items-center">
                    <button
                      id="kt_login_signin_submit"
                      type="submit"
                      disabled={formik.isSubmitting && loading == 'password'}
                      className={`btn btn-primary font-weight-bold px-9 py-4 btn-block`}
                    >
                      <span className="font-weight-boldest"><FormattedMessage defaultMessage="Đăng nhập" /></span>
                      {loading == 'password' && <span className="ml-3 spinner spinner-white"></span>}
                    </button>
                  </div>
                  <div className="form-group">
                    <div className="text-center">{intl.formatMessage({ defaultMessage: 'hoặc' })}</div>
                  </div>
                  <div className="form-group d-flex flex-wrap justify-content-between align-items-center">
                    <button
                      id="kt_login_signin_submit"
                      disabled={formik.isSubmitting}
                      className={`btn font-weight-bold px-9 py-4 btn-block`}
                      style={{ border: '1px solid #d9d9d9', position: 'relative' }}
                      onClick={_loginWithGoogle}
                    >
                      <span style={{ position: 'absolute', left: 20, top: 8 }}><img style={{ width: 30 }} src={toAbsoluteUrl('/media/icons/ic-google.svg')} /></span>
                      <span className="font-weight-boldest">{intl.formatMessage({ defaultMessage: 'Đăng nhập nhanh bằng Google' })}</span>
                      {loading === 'google' && <span style={{ position: 'absolute', right: 28, top: 24 }} className="ml-3 spinner spinner-primary"></span>}
                    </button>
                  </div>
                  <div className="form-group d-flex flex-wrap justify-content-center align-items-center">
                    <span className="font-weight-boldest mr-2">{intl.formatMessage({ defaultMessage: 'Bạn chưa có tài khoản?' })}</span>
                    <span>
                      <Link
                        to="/auth/register"
                        className="font-weight-boldest text-info text-hover-info"
                        id="kt_login_forgot"
                      >
                        <span>{intl.formatMessage({ defaultMessage: 'Đăng ký ngay' })}</span>
                      </Link>
                    </span>
                  </div>
                  <div className="form-group d-flex flex-wrap justify-content-between align-items-center">
                    <button
                      id="kt_login_signin_submit"
                      className={`btn font-weight-bold px-9 py-4 btn-block`}
                      style={{ border: '1px solid #d9d9d9' }}
                      onClick={() => {
                        history.push(`/auth/login-sub-user`)
                      }}
                    >
                      <span className="font-weight-boldest mr-2">{intl.formatMessage({ defaultMessage: 'Đăng nhập tài khoản phụ' })}</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" class="bi bi-chevron-right" viewBox="0 0 16 16">
                        <path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z" />
                      </svg>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  );
}

export default injectIntl(connect(null, actions)(Login));
