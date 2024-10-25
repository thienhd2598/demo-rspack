/*
 * Created by duydatpham@gmail.com on 09/08/2021
 * Copyright (c) 2021 duydatpham@gmail.com
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import 'react-bootstrap-table-next/dist/react-bootstrap-table2.min.css';
import { Card, CardBody, InputVertical, TextArea } from "../../../../_metronic/_partials/controls";
import _ from 'lodash'
import { Link, NavLink, Route, Switch, useRouteMatch } from "react-router-dom";
import SVG from "react-inlinesvg";
import { toAbsoluteUrl } from "../../../../_metronic/_helpers";
import { useSubheader } from "../../../../_metronic/layout";
import { Avatar, Divider } from "@material-ui/core";
import MemberList from "./MemberList";
import GroupPermission from "./GroupPermission";
import { useDispatch, useSelector } from "react-redux";
import * as Yup from "yup";
import { Field, Formik, useFormik } from "formik";
import { useMutation, useQuery } from "@apollo/client";
import query_sme_users_by_pk from "../../../../graphql/query_sme_users_by_pk";
import mutate_update_sme_users_by_pk from "../../../../graphql/mutate_update_sme_users_by_pk";
import { actionTypes } from "../../Auth/_redux/authRedux";
import { useToasts } from "react-toast-notifications";
import axios from "axios";
import { useHistory } from 'react-router';
import { useIntl } from "react-intl";
import { Modal } from "react-bootstrap";
import { ReSelectVertical } from "../../../../_metronic/_partials/controls/forms/ReSelectVertical";
import mutate_userCreateMember from "../../../../graphql/mutate_userCreateMember";


export default function CreateGroupPermission() {
    const route = useRouteMatch()
    const history = useHistory()
    const {formatMessage} = useIntl()
    const [showModal, setShowModal] = useState(false)
    const { appendBreadcrumbs } = useSubheader()
    const { addToast } = useToasts();

    const { data, loading: loadingUser } = useQuery(query_sme_users_by_pk, {
        variables: {
            id: route?.params?.id,
            skip: !route?.params?.id
        },
        fetchPolicy: 'cache-and-network'
    })
    const [mutate, { loading }] = useMutation(mutate_userCreateMember, {
        refetchQueries: ['sme_users'],
        awaitRefetchQueries: true
    })
    const [mutateUpdate, { loading: loadingUpdate }] = useMutation(mutate_update_sme_users_by_pk, {
        refetchQueries: ['sme_users'],
        awaitRefetchQueries: true
    })

    useEffect(() => {
        appendBreadcrumbs({
            title: formatMessage({defaultMessage:'Cài đặt'}),
            pathname: `/setting`
        })
        appendBreadcrumbs({
            title: formatMessage({defaultMessage:'Quản lý tài khoản & phân quyền'}),
            pathname: `/setting/profile/members`
        })
        if (!route?.params?.id) {
            appendBreadcrumbs({
                title: formatMessage({defaultMessage:'Tạo thông tin tài khoản'}),
                pathname: route.url
            })
        } else {
            appendBreadcrumbs({
                title: formatMessage({defaultMessage:'Tạo nhóm quyền'}),
                pathname: route.url
            })
        }
    }, [])
    const ValidateSchema = Yup.object().shape({
        email: Yup.string()
            .email(formatMessage({defaultMessage:'Email không hợp lệ'}))
            .required(formatMessage({defaultMessage:'Vui lòng nhập email'})),
        full_name: Yup.string()
            .required(formatMessage({defaultMessage:'Vui lòng nhập họ và tên'})),

    });

    if (!!route?.params?.id && (loadingUser || !data)) {
        return (
            <Card className='card-stretch' >
                <CardBody style={{ padding: 24, margin: 0, textAlign: 'center' }}>
                    <span className="spinner spinner-primary mr-4"></span>
                </CardBody>
            </Card>
        )
    }

    return (
        <>
            <Formik
                initialValues={{
                    full_name: data?.sme_users_by_pk?.full_name || '',
                    email: data?.sme_users_by_pk?.email || '',
                    phone: data?.sme_users_by_pk?.phone || ''
                }}
                validationSchema={ValidateSchema}
                onSubmit={async (values) => {
                    if (!route?.params?.id) {
                        let { data, errors } = await mutate({
                            variables: {
                                full_name: values.full_name,
                                phone: String(values.phone),
                                email: values.email
                            }
                        })
                        if (!!data?.userCreateMember?.success) {
                            setShowModal(true)
                        } else {
                            addToast(data?.userCreateMember?.message || formatMessage({defaultMessage:'Tạo tài khoản không thành công'}), { appearance: 'error' });
                        }
                    } else {
                        let { data, errors } = await mutateUpdate({
                            variables: {
                                id: route?.params?.id,
                                _set: {
                                    full_name: values.full_name,
                                    phone: String(values.phone),
                                }
                            }
                        })
                        if (!!data?.update_sme_users_by_pk) {
                            addToast(formatMessage({defaultMessage:'Đã cập nhật thông tin.'}), { appearance: 'success' });
                            history.push('/setting/profile/members')
                        } else {
                            addToast(formatMessage({defaultMessage:'Cập nhật không thành công.'}), { appearance: 'error' });
                        }
                    }
                }}
            >
                {
                    ({ handleSubmit }) => {
                        return <Card className='card-stretch' >
                            <CardBody style={{ padding: 24, margin: 0 }}>
                                <div className='row' >
                                    <div className='col-sm-6 col-lg-4' >
                                        <Field
                                            name="full_name"
                                            component={InputVertical}
                                            placeholder=""
                                            label={formatMessage({defaultMessage:'Tên nhóm'})}
                                            required={true}
                                            disabled={loading || loadingUpdate}
                                        />
                                        <div className='mt-4' />
                                        <Field
                                            name="email"
                                            component={TextArea}
                                            placeholder={formatMessage({defaultMessage:"Nhập mô tả"})}
                                            label={formatMessage({defaultMessage:'Mô tả'})}
                                            cols={['col-12', 'col-12']}
                                            disabled={!!route?.params?.id || loading || loadingUpdate}
                                        />
                                        <div className='mt-8' />
                                    </div>
                                </div>
                                <Divider variant='fullWidth' light />
                                <div className='row' >
                                    <div className='col-lg-9' >
                                        <div className="react-bootstrap-table mt-8">
                                            <h5 className='mb-4'>{formatMessage({defaultMessage:'Cài đặt phân quyền'})}</h5>
                                            <table className="table product-list table-bordered table table-vertical-center overflow-hidden">
                                                <thead>
                                                    <tr className="header-member">
                                                        <th style={{fontSize: '14px'}} tabIndex="0" width='30%'>{formatMessage({defaultMessage:'NỘI DUNG'})}</th>
                                                        <th style={{fontSize: '14px'}} tabIndex="0">{formatMessage({defaultMessage:'ĐÃ CHỌN'})}</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr>
                                                        <td>Vũ Hoàng Anh</td>
                                                        <td >{formatMessage({defaultMessage:'Nhóm kinh doanh'})}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                        <button type="submit" className="btn btn-primary" style={{ float: 'right', width: 170, height: 38 }}
                                            disabled={loading}
                                            onClick={handleSubmit}>{loading || loadingUpdate ? <span className="spinner spinner-white mr-4"></span> : (!route?.params?.id ? formatMessage({defaultMessage:'Tạo'}) : formatMessage({defaultMessage:'Cập Nhật'}))}</button>

                                        <Link to='/setting/profile/members' className="btn btn-secondary mr-4" style={{ float: 'right', width: 170, height: 38 }}>Huỷ bỏ</Link>
                                    </div>
                                </div>
                            </CardBody>
                        </Card >
                    }
                }
            </Formik>
            <Modal
                show={showModal}
                aria-labelledby="example-modal-sizes-title-lg"
                centered
                backdrop={'static'}
            >
                <Modal.Body className="overlay overlay-block cursor-default text-center" >
                    <img src={toAbsoluteUrl("/media/svg/ic_cicle_success.svg")} style={{ fontSize: 48, marginBottom: 16 }} />
                    <div className="mb-1" >{formatMessage({defaultMessage:'UpBase đã gửi email tới nhân sự của bạn.'})}</div>
                    <div className="mb-6" >{formatMessage({defaultMessage:'Vui lòng thông báo nhân sự kiểm tra email và làm theo hướng dẫn.'})}</div>
                    <div  >
                        <Link
                            to='/setting/profile/members'
                            className={`btn btn-primary font-weight-bold px-9 `}
                            style={{ width: 150 }}
                        >
                            <span className="font-weight-boldest">OK</span>
                        </Link>
                    </div>
                </Modal.Body>
            </Modal >
        </>
    )
}
