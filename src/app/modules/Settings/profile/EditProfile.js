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
import MemberList from "./MemberList";
import GroupPermission from "./GroupPermission";
import { useDispatch, useSelector } from "react-redux";
import * as Yup from "yup";
import { Field, Formik, useFormik } from "formik";
import { useMutation } from "@apollo/client";
import mutate_update_sme_users_by_pk from "../../../../graphql/mutate_update_sme_users_by_pk";
import mutate_userUpdateMe from "../../../../graphql/mutate_userUpdateMe";
import { actionTypes } from "../../Auth/_redux/authRedux";
import { useToasts } from "react-toast-notifications";
import axios from "axios";
import { useHistory } from 'react-router';
import { useIntl } from "react-intl";

const CancelToken = axios.CancelToken;
export default function EditProfile() {
    const history = useHistory()
    const { appendBreadcrumbs } = useSubheader()
    const { user } = useSelector((state) => state.auth);
    const dispatch = useDispatch()
    const {formatMessage} = useIntl()
    const refInput = useRef()
    const refCancel = useRef()
    const { addToast } = useToasts();
    const [file, setFile] = useState()
    const [preview, setPreview] = useState()
    const [avatar_url, setAvatar_url] = useState()
    const [uploading, setUploading] = useState(false)

    const [mutate, { loading }] = useMutation(mutate_userUpdateMe)

    useMemo(() => {
        setAvatar_url(user?.avatar_url)
    }, [user?.avatar_url])

    const _upload = useCallback(async (file) => {
        setUploading(true)
        try {
            let formData = new FormData();
            formData.append('type', 'file')
            formData.append('file', file, file.name || 'file.jpg')
            let res = await axios.post(process.env.REACT_APP_URL_FILE_UPLOAD, formData, {
                isSubUser: user?.is_subuser,
                cancelToken: new CancelToken(function executor(c) {
                    refCancel.current = c;
                }),
            })

            if (res.data?.success) {
                setAvatar_url(res.data?.data.source)
            } else {
                addToast('Tải ảnh không thành công.', { appearance: 'error' });
            }
        } catch (error) {
            console.log('error', error)
        } finally {
            setUploading(false)
        }
    }, [])

    useEffect(() => {
        if (!!file) {
            let reader = new FileReader();
            let url = reader.readAsDataURL(file);

            reader.onloadend = function (e) {
                let img = new Image()
                img.onload = function (imageEvent) {
                    _upload(file);
                    setPreview(e.target.result)

                }
                img.src = e.target.result;
            }
        }
        return () => {
            !!refCancel.current && refCancel.current('unmount')
        }
    }, [file]);

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
            title: formatMessage({defaultMessage:'Chỉnh sửa thông tin'}),
            pathname: `/setting/profile/edit`
        })
    }, [])
    const ValidateSchema = Yup.object().shape({
        email: Yup.string()
            .email(formatMessage({defaultMessage:'Email không hợp lệ'}))
            .required(formatMessage({defaultMessage:'Vui lòng nhập email'})),
        full_name: Yup.string()
            .required(formatMessage({defaultMessage:'Vui lòng nhập họ và tên'})),

    });
    return (
        <Card className='card-stretch' >
            <CardBody style={{ padding: 24, margin: 0 }} className='row' >
                <div className='col-sm-6 col-lg-4' >
                    <Formik
                        initialValues={{
                            full_name: user?.full_name,
                            email: user?.email,
                            phone: user?.phone || ''
                        }}
                        validationSchema={ValidateSchema}
                        onSubmit={async (values) => {
                            let { data } = await mutate({
                                variables: {
                                    userUpdateMeInput: {
                                        avatar_url,
                                        phone: String(values.phone),
                                        business_model: user?.business_model,
                                        full_name: values.full_name,
                                    }
                                }
                            })
                            if (!!data?.userUpdateMe?.success) {
                                dispatch({ type: actionTypes.UserLoaded, payload: { user: { ...user,
                                    avatar_url,
                                    phone: String(values.phone),
                                    full_name: values.full_name,
                                 }} })
                                addToast(formatMessage({defaultMessage:'Đã cập nhật thông tin.'}), { appearance: 'success' });
                                history.push('/setting/profile/members')
                            } else {
                                addToast(formatMessage({defaultMessage:'Cập nhật không thành công.'}), { appearance: 'error' });
                            }
                        }}
                    >
                        {
                            ({ handleSubmit }) => {
                                return <>
                                    <Field
                                        name="full_name"
                                        component={InputVertical}
                                        placeholder=""
                                        label={formatMessage({defaultMessage:'Họ tên'})}
                                        required={true}
                                        disabled={loading}
                                    />
                                    <div className='mt-4' />
                                    <Field
                                        name="email"
                                        component={InputVertical}
                                        placeholder=""
                                        label={'Email'}
                                        required={true}
                                        disabled
                                    />
                                    <div className='mt-4' />
                                    <Field
                                        name="phone"
                                        component={InputVertical}
                                        type='number'
                                        placeholder=""
                                        label={formatMessage({defaultMessage:'Số điện thoại'})}
                                        format={"(+84) ##########"}
                                        disabled={loading}
                                    />
                                    <div className='mt-8' />
                                    <button type="submit" className="btn btn-primary" style={{ float: 'right', width: 170, height: 38 }}
                                        disabled={loading}
                                        onClick={handleSubmit}>{loading ? <span className="spinner spinner-white mr-4"></span> : formatMessage({defaultMessage:'Cập nhật'})}</button>
                                </>
                            }
                        }
                    </Formik>
                </div>
                <div className='col-sm-6 col-lg-4 ' >
                    <div style={{
                        boxShadow: '0px 3px 6px -4px rgba(0, 0, 0, 0.12), 0px 6px 16px rgba(0, 0, 0, 0.08), 0px 9px 28px 8px rgba(0, 0, 0, 0.05)',
                        borderRadius: 6,
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        width: 'fit-content',
                        paddingLeft: 24, paddingRight: 24
                    }} >
                        <div style={{
                            width: 200,
                            height: 200,
                            borderRadius: 200,
                            border: '1px dashed #D9D9D9',
                            marginTop: 24,
                            overflow: 'hidden',
                            position: 'relative'
                        }} >
                            <Avatar src={avatar_url || preview} variant='circle' style={{ width: 198, height: 198 }} />
                            {
                                uploading && <div className='image-input' style={{
                                    position: 'absolute',
                                    top: 0, left: 0, right: 0, bottom: 0,
                                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }} >
                                    <span className="mr-6 spinner spinner-white"  ></span>
                                </div>
                            }
                        </div>
                        <input ref={refInput} type="file" style={{ display: 'none' }}
                            multiple={false}
                            accept={".png, .jpg, .jpeg"}
                            onChange={e => {
                                // !!onChooseFile && onChooseFile(_.range(0, e.target.files.length).map(_index => e.target.files.item(_index)))
                                setFile(e.target.files[0])
                                e.target.value = ''
                            }}
                        />
                        <button className="btn btn-outline-secondary  btn-sm my-4" style={{ width: 180 }}
                            onClick={e => {
                                e.preventDefault()
                                refInput.current.click()
                            }}
                        ><i className="flaticon-upload-1 text-dark"></i>{formatMessage({defaultMessage:'Thay ảnh'})}</button>
                    </div>
                </div>
            </CardBody>
        </Card >
    )
}
