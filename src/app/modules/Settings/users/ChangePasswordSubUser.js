/*
 * Created by duydatpham@gmail.com on 09/08/2021
 * Copyright (c) 2021 duydatpham@gmail.com
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import 'react-bootstrap-table-next/dist/react-bootstrap-table2.min.css';
import { Card, CardBody, CardHeader, InputVertical } from "../../../../_metronic/_partials/controls";
import _ from 'lodash'
import { Link, NavLink, Route, Switch } from "react-router-dom";
import SVG from "react-inlinesvg";
import { toAbsoluteUrl } from "../../../../_metronic/_helpers";
import { useSubheader } from "../../../../_metronic/layout";
import { Avatar, Divider } from "@material-ui/core";
import MemberList from "../profile/MemberList";
import GroupPermission from "../profile/GroupPermission";
import { useDispatch, useSelector } from "react-redux";
import * as Yup from "yup";
import { Field, Formik, useFormik } from "formik";
import { useMutation } from "@apollo/client";
import { actionTypes } from "../../Auth/_redux/authRedux";
import { useToasts } from "react-toast-notifications";
import axios from "axios";
import { useHistory, useLocation } from 'react-router';
import { useIntl } from "react-intl";
import mutate_userChangePasswordSubUser from "../../../../graphql/mutate_userChangePasswordSubUser";
import LoadingDialog from "../../Products/product-new/LoadingDialog";
import { Helmet } from "react-helmet-async";


export default function ChangePasswordSubUser() {
    const history = useHistory();
    const location = useLocation();
    const { appendBreadcrumbs } = useSubheader()
    const { addToast } = useToasts();
    const { formatMessage } = useIntl()
    const [showPass, setShowPass] = useState(false);
    const [showPassNew, setShowPassNew] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);
    const user = useSelector((state) => state.auth.user);
    const [mutate, { loading }] = useMutation(mutate_userChangePasswordSubUser);

    console.log(`STATE:`, location.state)

    useEffect(() => {
        appendBreadcrumbs({
            title: formatMessage({defaultMessage:'Cài đặt'}),
            pathname: `/setting`
        })
        appendBreadcrumbs({
            title: formatMessage({defaultMessage:'Quản lý tài khoản & phân quyền'}),
            pathname: `/setting/profile/members`
        })
        appendBreadcrumbs({
            title: formatMessage({defaultMessage:'Đổi mật khẩu tài khoản phụ'}),
            pathname: `/setting/profile/change-password-sub-user`
        })
    }, [])
    const ValidateSchema = Yup.object().shape({       
        password: Yup.string()
            .min(6, formatMessage({
                defaultMessage: "Mật khẩu",
            }) + ' ' + formatMessage({
                defaultMessage: "tối thiểu {min} ký tự",
            }, {
                min: 6
            }))
            .max(50, formatMessage({
                defaultMessage: "Nhiều nhất {min} ký tự",
            }, {
                min: 50
            }))
            .required(
                formatMessage({
                    defaultMessage: "Vui lòng nhập mật khẩu mới",
                })
            ),
        changepassword: Yup.string()
            .required(
                formatMessage({
                    defaultMessage: "Vui lòng nhập lại mật khẩu mới",
                })
            )
            .when("password", {
                is: (val) => (val && val.length > 0 ? true : false),
                then: Yup.string().oneOf(
                    [Yup.ref("password")],
                    formatMessage({
                        defaultMessage: "Hai mật khẩu phải trùng khớp nhau",
                    })
                ),
            }),

    });


    return (
        <>
            <Helmet
                titleTemplate={formatMessage({defaultMessage:"Đổi mật khẩu tài khoản phụ"})+ "- UpBase"}
                defaultTitle={formatMessage({defaultMessage:"Đổi mật khẩu tài khoản phụ"})+ "- UpBase"}
            >
                <meta name="description" content={formatMessage({defaultMessage:"Đổi mật khẩu tài khoản phụ"})+ "- UpBase"} />
            </Helmet>
            <Card>
                <LoadingDialog show={loading} />
                <CardHeader title={formatMessage({defaultMessage:"Đổi mật khẩu tài khoản phụ"})} />
                <CardBody style={{ padding: 24, margin: 0 }} className='row' >
                    <div className='col-9' >
                        <Formik
                            initialValues={{
                                username: location?.state?.sub_user?.username || '--',                                
                                password: '',
                                changepassword: ''
                            }}
                            validationSchema={ValidateSchema}
                            onSubmit={async (values) => {
                                let { data } = await mutate({
                                    variables: {
                                        userChangePasswordSubUserInput: {
                                            id: location?.state?.sub_user?.id,
                                            password: values.password,                                            
                                        }
                                    }
                                })
                                if (data?.userChangePasswordSubUser?.success) {
                                    addToast(`${formatMessage({defaultMessage:'Cập nhật mật khẩu tài khoản'})} ${location?.state?.sub_user?.username} ${formatMessage({defaultMessage:'thành công'})}`, { appearance: 'success' });
                                    history.push('/setting/users')
                                } else {
                                    addToast(`${formatMessage({defaultMessage:'Cập nhật mật khẩu tài khoản'})} ${location?.state?.sub_user?.username} ${formatMessage({defaultMessage:'thất bại'})}`, { appearance: 'error' });
                                }
                            }}
                        >
                            {
                                ({ handleSubmit }) => {
                                    return <>
                                        <div className="row d-flex align-items-center mb-8">
                                            <div className="col-4 text-right">
                                            {formatMessage({defaultMessage:'Tài khoản'})}
                                            </div>
                                            <div className="col-8">
                                                <Field
                                                    name="username"
                                                    component={InputVertical}
                                                    placeholder=""
                                                    label={''}
                                                    disabled={true}
                                                    type="text"
                                                />
                                            </div>
                                        </div>                                        
                                        <div className="row d-flex align-items-center mb-8">
                                            <div className="col-4 text-right">
                                            {formatMessage({defaultMessage:'Mật khẩu mới'})} <span className="text-danger">*</span>
                                            </div>
                                            <div className="col-8">
                                                <div style={{ position: 'relative' }}>
                                                    <Field
                                                        name="password"
                                                        component={InputVertical}
                                                        style={{}}
                                                        placeholder={formatMessage({defaultMessage:"Nhập mật khẩu mới"})}
                                                        label={''}
                                                        required={true}
                                                        disabled={loading}
                                                        type={showPassNew ? 'text' : "password"}
                                                    />
                                                    <a style={{ position: 'absolute', zIndex: 9, right: 0, top: -6, padding: 18 }} onClick={e => { setShowPassNew(!showPassNew) }} ><i className={showPassNew ? "far fa-eye text-dark" : "far fa-eye-slash"}></i></a>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="row d-flex align-items-center mb-8">
                                            <div className="col-4 text-right">
                                            {formatMessage({defaultMessage:'Nhập lại mật khẩu mới'})} <span className="text-danger">*</span>
                                            </div>
                                            <div className="col-8">
                                                <div style={{ position: 'relative' }}>
                                                    <Field
                                                        name="changepassword"
                                                        component={InputVertical}
                                                        placeholder={formatMessage({defaultMessage:"Nhập lại mật khẩu mới"})}
                                                        style={{}}
                                                        label={''}
                                                        disabled={loading}
                                                        type={showConfirmPass ? 'text' : "password"}
                                                        required={true}
                                                    />
                                                    <a style={{ position: 'absolute', zIndex: 9, right: 0, top: -6, padding: 18 }} onClick={e => { setShowConfirmPass(!showConfirmPass) }} ><i className={showConfirmPass ? "far fa-eye text-dark" : "far fa-eye-slash"}></i></a>
                                                </div>
                                            </div>
                                        </div>
                                        <button type="submit" className="btn btn-primary" style={{ float: 'right', width: 150, height: 38 }}
                                            disabled={loading}
                                            onClick={handleSubmit}>{loading ? <span className="spinner spinner-white mr-4"></span> : formatMessage({defaultMessage:'Cập nhật'})}</button>
                                    </>
                                }
                            }
                        </Formik>
                    </div>
                </CardBody>
            </Card >
        </>
    )
}
