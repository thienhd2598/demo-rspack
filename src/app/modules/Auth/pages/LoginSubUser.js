/*
 * Created by duydatpham@gmail.com on 22/05/2021
 * Copyright (c) 2021 duydatpham@gmail.com
 */

import React, { Fragment, useEffect, useState } from "react";
import { Link, useHistory } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import { connect } from "react-redux";
import { FormattedMessage, injectIntl } from "react-intl";
import { actions } from "../_redux/authRedux";
import { getUserByToken, login } from "../_redux/authCrud";
import { Helmet } from 'react-helmet-async';
import firebase, { auth } from '../../../../firebase'
import { useMutation } from '@apollo/client'
import AUTH_SSO from '../../../../graphql/authen-sso'
import mutate_subUserLogin from '../../../../graphql/mutate_subUserLogin'
import { toAbsoluteUrl } from "../../../../_metronic/_helpers";
import { useToasts } from "react-toast-notifications";
import { LanguageSelectorDropdown } from "../../../../_metronic/layout/components/extras/dropdowns/LanguageSelectorDropdown";


function LoginSubUser(props) {
    const [mutationAuthen] = useMutation(AUTH_SSO)
    const { intl } = props;
    const history = useHistory();
    const { addToast } = useToasts();
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);

    const [mutate, { loading: loadingLogin }] = useMutation(mutate_subUserLogin);

    const LoginSchema = Yup.object().shape({
        smeId: Yup.string()
            .matches(/^[0-9]+$/, intl.formatMessage({ defaultMessage: "Tài khoản không hợp lệ" }))
            .required(intl.formatMessage({ defaultMessage: "Vui lòng nhập mã tài khoản" })),
        username: Yup.string()
            .required(intl.formatMessage({ defaultMessage: "Vui lòng nhập tài khoản" })),
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

    const formik = useFormik({
        initialValues: {
            email: '',
            password: ''
        },
        validationSchema: LoginSchema,
        onSubmit: async (values, { setStatus, setSubmitting }) => {
            const { username, password, smeId } = values || {};
            try {
                let { data } = await mutate({
                    variables: {
                        subUserLoginInput: {
                            username,
                            password,
                            smeId: Number(smeId)
                        }
                    }
                })

                console.log({ data })

                if (data?.subUserLogin?.success) {
                    props.login(data?.subUserLogin?.accessToken);
                    let _now = Date.now()
                    localStorage.setItem('refresh_token', data?.subUserLogin?.refreshToken);
                    localStorage.setItem('last_login', _now)
                    getUserByToken().then(data => {                
                        !!data && localStorage.setItem('info_sub_user', JSON.stringify(data));
                    })
                    !!window.changeLastLogin && window.changeLastLogin(_now)
                } else {
                    addToast(intl.formatMessage({ defaultMessage: 'Tài khoản hoặc mật khẩu không chính xác' }), { appearance: 'error' });
                }
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

    return (
        <Fragment>
            <Helmet
                titleTemplate={`${intl.formatMessage({ defaultMessage: 'Đăng nhập tài khoản phụ' })} - UpBase`}
                defaultTitle={`${intl.formatMessage({ defaultMessage: 'Đăng nhập tài khoản phụ' })} - UpBase`}
            >
                <meta name="description" content={`${intl.formatMessage({ defaultMessage: 'Đăng nhập tài khoản phụ' })} - UpBase`} />
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
                                        {intl.formatMessage({ defaultMessage: 'Đăng nhập tài khoản phụ' })}
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
                                            placeholder="Account ID"
                                            type="smeId"
                                            className={`form-control form-control-solid h-auto py-5 px-6`}
                                            name="smeId"
                                            {...formik.getFieldProps("smeId")}
                                        />
                                        {formik.touched.smeId && formik.errors.smeId ? (
                                            <div className="fv-plugins-message-container">
                                                <div className="fv-help-block">{formik.errors.smeId}</div>
                                            </div>
                                        ) : null}
                                    </div>
                                    <div className="form-group fv-plugins-icon-container">
                                        <input
                                            placeholder={intl.formatMessage({ defaultMessage: "Tài khoản" })}
                                            type="username"
                                            className={`form-control form-control-solid h-auto py-5 px-6`}
                                            name="username"
                                            {...formik.getFieldProps("username")}
                                        />
                                        {formik.touched.username && formik.errors.username ? (
                                            <div className="fv-plugins-message-container">
                                                <div className="fv-help-block">{formik.errors.username}</div>
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
                                    </div>
                                    <div className="form-group d-flex flex-wrap justify-content-between align-items-center">
                                        <button
                                            id="kt_login_signin_submit"
                                            type="submit"
                                            disabled={formik.isSubmitting}
                                            className={`btn btn-primary font-weight-bold px-9 py-4 btn-block`}
                                        >
                                            <span className="font-weight-boldest"><FormattedMessage defaultMessage="Đăng nhập" /></span>
                                            {loadingLogin && <span className="ml-3 spinner spinner-white"></span>}
                                        </button>
                                    </div>
                                    <div className="form-group d-flex flex-wrap justify-content-between align-items-center">
                                        <button
                                            id="kt_login_signin_submit"
                                            className={`btn font-weight-bold px-9 py-4 btn-block`}
                                            style={{ border: '1px solid #d9d9d9' }}
                                            disabled={loadingLogin}
                                            onClick={() => {
                                                history.push(`/auth/login`)
                                            }}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" class="bi bi-chevron-left" viewBox="0 0 16 16">
                                                <path fill-rule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z" />
                                            </svg>
                                            <span className="font-weight-boldest ml-2">{intl.formatMessage({ defaultMessage: 'Đăng nhập tài khoản chính' })}</span>
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

export default injectIntl(connect(null, actions)(LoginSubUser));
