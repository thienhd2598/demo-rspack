/*
 * Created by duydatpham@gmail.com on 22/05/2021
 * Copyright (c) 2021 duydatpham@gmail.com
 */

import React, { Fragment, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import { connect } from "react-redux";
import { FormattedMessage, injectIntl } from "react-intl";
import { actions } from "../_redux/authRedux";
import { login } from "../_redux/authCrud";
import { useToasts } from 'react-toast-notifications';
import firebase, { auth } from '../../../../firebase'
import { useMutation } from '@apollo/client'
import AUTH_SSO from '../../../../graphql/authen-sso'
import auth_registerSSO from '../../../../graphql/auth_registerSSO';
import auth_checkEmailExist from "../../../../graphql/auth_checkEmailExist";
import auth_createUserByEmailPassword from "../../../../graphql/auth_createUserByEmailPassword";
import { toAbsoluteUrl } from "../../../../_metronic/_helpers";
import { useHistory } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { LanguageSelectorDropdown } from "../../../../_metronic/layout/components/extras/dropdowns/LanguageSelectorDropdown";


function Register(props) {
    const history = useHistory();
    const { addToast, removeAllToasts } = useToasts();
    const [mutationAuthen] = useMutation(AUTH_SSO)
    const [mutationRegister] = useMutation(auth_registerSSO)
    const [mutateCheckEmailExist, { loading: loadingCheckEmailExist }] = useMutation(auth_checkEmailExist);
    const [mutateCreateUserByEmailPassword, { loading: loadingCreateUserByEmailPassword }] = useMutation(auth_createUserByEmailPassword);
    const { intl } = props;
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);
    const [action, setAction] = useState('');

    const RegisterSchema = Yup.object().shape({
        email: Yup.string()
            .email(intl.formatMessage({
                defaultMessage: "Email không hợp lệ",
            }))
            .required(
                intl.formatMessage({
                    defaultMessage: "Vui lòng nhập email",
                })
            ),
        password: Yup.string()
            .required(
                intl.formatMessage({
                    defaultMessage: "Vui lòng nhập mật khẩu",
                })
            )
            .min(6, "Mật khẩu tối thiểu 6 ký tự"),
        confirmPassword: Yup.string()
            .required(
                intl.formatMessage({
                    defaultMessage: "Vui lòng nhập lại mật khẩu mới",
                })
            )
            .when("password", {
                is: (val) => (val && val.length > 0 ? true : false),
                then: Yup.string().oneOf(
                    [Yup.ref("password")],
                    intl.formatMessage({ defaultMessage: "2 mật khẩu phải trùng khớp nhau" })
                ),
            }),
    });

    const enableLoading = (provider) => {
        setLoading(provider);
    };

    const disableLoading = () => {
        setLoading(false);
    };


    async function onAuthStateChanged(user) {
        if (!!user) {
            try {
                let idToken = await user.getIdToken(true)
                formik.setSubmitting(true);
                enableLoading(user.providerData[0].providerId);
                let res;

                if (action === 'register-email') {
                    res = await mutationAuthen({
                        variables: {
                            firebase_id: user.uid,
                            idToken,
                            provider: user.providerData[0].providerId
                        }
                    })
                } else {
                    res = await mutationRegister({
                        variables: {
                            firebase_id: user.uid,
                            idToken,
                            provider: user.providerData[0].providerId
                        }
                    })
                }
                console.log('res', res)
                if (res.data) {
                    let newIdToken = await user.getIdToken(true)
                    props.login(newIdToken)
                    let _now = Date.now()
                    localStorage.setItem('last_login', _now)
                    !!window.changeLastLogin && window.changeLastLogin(_now)
                } else {
                    throw new Error(res.errors[0].message);
                }
            } catch (error) {
                console.log('error', error)
                auth.signOut()
                formik.setStatus(
                    error.message
                );
                formik.setSubmitting(false);
                disableLoading()
            } finally {
                disableLoading()
                formik.setSubmitting(false);
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

        return "";
    };

    const _registerWithGoogle = async () => {
        formik.setSubmitting(true);
        try {
            setAction('register-google');
            await auth.signInWithPopup(
                new firebase.auth.GoogleAuthProvider(),
            );
        } catch (error) {
            disableLoading();
            formik.setSubmitting(false);
        }
    }

    const formik = useFormik({
        initialValues: {
            email: '',
            password: '',
            confirmPassword: ''
        },
        validationSchema: RegisterSchema,
        onSubmit: async (values, { setStatus, setSubmitting }) => {
            let { data: dataCreateUser } = await mutateCreateUserByEmailPassword({
                variables: {
                    email: values?.email,
                    password: values?.password
                }
            })

            if (!!dataCreateUser?.createUserByEmailPassword?.success) {
                setStatus();
                enableLoading('email');
                formik.setSubmitting(true);
                setAction('register-email');
                await auth.signInWithEmailAndPassword(values.email, values.password)
            } else {
                removeAllToasts();
                addToast(dataCreateUser?.createUserByEmailPassword?.message, { appearance: 'error' })
            }
        },
    });

    return (
        <Fragment>
            <Helmet
                titleTemplate={`${intl.formatMessage({ defaultMessage: 'Đăng ký' })} - UpBase`}
                defaultTitle={`${intl.formatMessage({ defaultMessage: 'Đăng ký' })} - UpBase`}
            >
                <meta name="description" content={`${intl.formatMessage({ defaultMessage: 'Đăng ký' })} - UpBase`} />
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
                                        {intl.formatMessage({ defaultMessage: 'Đăng ký' })}
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
                                        <div style={{ position: 'relative' }} >
                                            <input
                                                placeholder={intl.formatMessage({ defaultMessage: "Email đăng ký" })}
                                                type="email"
                                                className={`form-control form-control-solid h-auto py-5 px-6`}
                                                disabled={loadingCreateUserByEmailPassword || loadingCheckEmailExist || formik.isSubmitting}
                                                name="email"
                                                onBlurCapture={async (e) => {
                                                    formik.setStatus();
                                                    if (!!formik.errors.email) return;
                                                    let { data: dataCheckEmailExist } = await mutateCheckEmailExist({
                                                        variables: {
                                                            email: formik.values.email
                                                        }
                                                    })

                                                    if (!!dataCheckEmailExist?.checkEmailExist?.isExist) {
                                                        formik.setStatus(intl.formatMessage({ defaultMessage: 'Tài khoản đã tồn tại' }))
                                                    }
                                                }}
                                                {...formik.getFieldProps("email")}
                                            />
                                            {loadingCheckEmailExist && <span style={{ position: 'absolute', right: 0, top: 8, padding: 18 }} className="ml-3 spinner"></span>}
                                            {formik.touched.email && formik.errors.email ? (
                                                <div className="fv-plugins-message-container">
                                                    <div className="fv-help-block">{formik.errors.email}</div>
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                    <div className="form-group fv-plugins-icon-container">
                                        <div style={{ position: 'relative' }} >
                                            <input
                                                placeholder={intl.formatMessage({ defaultMessage: 'Mật khẩu' })}
                                                type={showPass ? 'text' : "password"}
                                                className={`form-control form-control-solid h-auto py-5 pl-6 pr-14`}
                                                disabled={loadingCreateUserByEmailPassword || formik.isSubmitting}
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
                                    <div className="form-group fv-plugins-icon-container">
                                        <div style={{ position: 'relative' }} >
                                            <input
                                                placeholder={intl.formatMessage({ defaultMessage: 'Nhập lại mật khẩu' })}
                                                type={showConfirmPass ? 'text' : "password"}
                                                disabled={loadingCreateUserByEmailPassword || formik.isSubmitting}
                                                className={`form-control form-control-solid h-auto py-5 pl-6 pr-14`}
                                                name="confirmPassword"
                                                {...formik.getFieldProps("confirmPassword")}
                                            />
                                            <a style={{ position: 'absolute', right: 0, top: 0, padding: 18 }} onClick={e => { setShowConfirmPass(!showConfirmPass) }} ><i className={showConfirmPass ? "far fa-eye text-dark" : "far fa-eye-slash"}></i></a>
                                        </div>
                                        {formik.touched.confirmPassword && formik.errors.confirmPassword ? (
                                            <div className="fv-plugins-message-container">
                                                <div className="fv-help-block">{formik.errors.confirmPassword}</div>
                                            </div>
                                        ) : null}
                                    </div>
                                    <div className="form-group d-flex flex-wrap justify-content-between align-items-center">
                                        <button
                                            id="kt_login_signin_submit"
                                            type="submit"
                                            disabled={loadingCreateUserByEmailPassword || formik.isSubmitting || loading == 'email'}
                                            className={`btn btn-primary font-weight-bold px-9 py-4 btn-block`}
                                        >
                                            <span className="font-weight-boldest">{intl.formatMessage({ defaultMessage: 'Đăng ký' })}</span>
                                            {
                                                (loadingCreateUserByEmailPassword || formik.isSubmitting || loading == 'email') && <span className="ml-3 spinner spinner-white"></span>
                                            }
                                        </button>
                                    </div>
                                    <div className="form-group">
                                        <div className="text-center">{intl.formatMessage({ defaultMessage: 'hoặc' })}</div>
                                    </div>
                                    <div className="form-group d-flex flex-wrap justify-content-between align-items-center">
                                        <button
                                            id="kt_login_signin_submit"
                                            type="submit"
                                            disabled={formik.isSubmitting}
                                            className={`btn font-weight-bold px-9 py-4 btn-block`}
                                            style={{ border: '1px solid #d9d9d9', position: 'relative' }}
                                            onClick={_registerWithGoogle}
                                        >
                                            <span style={{ position: 'absolute', left: 20, top: 8 }}><img style={{ width: 30 }} src={toAbsoluteUrl('/media/icons/ic-google.svg')} /></span>
                                            <span className="font-weight-boldest">{intl.formatMessage({ defaultMessage: 'Đăng ký nhanh bằng Google' })}</span>
                                        </button>
                                    </div>
                                    <div className="form-group d-flex flex-wrap justify-content-center align-items-center">
                                        <span className="font-weight-boldest mr-2">{intl.formatMessage({ defaultMessage: 'Nếu bạn đã có tài khoản' })},</span>
                                        <span>
                                            <Link
                                                to="/auth/login"
                                                className="font-weight-boldest text-info text-hover-info"
                                                id="kt_login_forgot"
                                            >
                                                <span>{intl.formatMessage({ defaultMessage: 'Đăng nhập' })}</span>
                                            </Link>
                                        </span>
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

export default injectIntl(connect(null, actions)(Register));
