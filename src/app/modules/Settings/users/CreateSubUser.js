/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useState, useEffect, useMemo } from "react";
import { Link, useHistory, useLocation } from "react-router-dom";
import { useSelector, shallowEqual, connect, useDispatch } from "react-redux";
import { useFormik, Formik } from "formik";
import * as Yup from "yup";
import * as auth from "../../Auth";
import { FormattedMessage, injectIntl, useIntl } from "react-intl";
import { actions } from "../../Auth/_redux/authRedux";
import LoadingDialog from "../../FrameImage/LoadingDialog";
import { useMutation, useQuery } from "@apollo/client";
import { useToasts } from "react-toast-notifications";
import { getUserByToken } from "../../Auth/_redux/authCrud";
import { useSubheader } from "../../../../_metronic/layout";
import Select from "react-select";
import { RouterPrompt } from "../../../../components/RouterPrompt";
import { Helmet } from "react-helmet";
import { Card, CardBody, CardHeader } from '../../../../_metronic/_partials/controls';
import query_sme_roles from "../../../../graphql/query_sme_roles";
import mutate_userCreateSubUser from "../../../../graphql/mutate_userCreateSubUser";
import client from "../../../../apollo";
import query_sme_sub_users_aggregate from "../../../../graphql/query_sme_sub_users_aggregate";
import query_sc_stores_basic from "../../../../graphql/query_sc_stores_basic";
import query_smeCatalogStores from "../../../../graphql/query_smeCatalogStores";
import query_sc_conversation_stores from "../../../../graphql/query_sc_conversation_stores";
import makeAnimated from 'react-select/animated';
import query_userGetRoles from "../../../../graphql/query_userGetRoles";
import mutate_userCreateSubUserV2 from "../../../../graphql/mutate_userCreateSubUserV2";

const animatedComponents = makeAnimated();
const regex = new RegExp("[^\u0000-\u007F]+")

export const queryCheckExistUsername = async (value, sme_id) => {
    let { data } = await client.query({
        query: query_sme_sub_users_aggregate,
        fetchPolicy: 'network-only',
        variables: {
            "where": {
                "sme_id": { "_eq": sme_id },
                "username": { "_eq": value }
            }
        }
    })
    return data?.sme_sub_users_aggregate?.aggregate?.count > 0;
}

function CreateSubUser(props) {
    // Fields
    const [loading, setloading] = useState(false);
    const [isError, setisError] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);
    const { formatMessage } = useIntl()
    const dispatch = useDispatch();
    const user = useSelector((state) => state.auth.user, shallowEqual);
    const { addToast } = useToasts();
    const history = useHistory();
    useEffect(() => { }, [user]);
    const { intl } = props;
    const location = useLocation()
    const { appendBreadcrumbs, setToolbar } = useSubheader()
    const [change, setChange] = useState(true);
    const [roles, setRoles] = useState([]);

    useEffect(() => {
        appendBreadcrumbs({
            title: formatMessage({ defaultMessage: 'Cài đặt' }),
            pathname: `/setting`
        })
        appendBreadcrumbs({
            title: formatMessage({ defaultMessage: 'Tài khoản' }),
            pathname: `/setting/users`
        })
        appendBreadcrumbs({
            title: formatMessage({ defaultMessage: 'Thêm tài khoản phụ' }),
            pathname: `/setting/users/create-sub-user`
        })
    }, [location.pathname])

    const { data: dataCatalogStores, loading: loadingCatalogStores } = useQuery(query_smeCatalogStores, {
        fetchPolicy: 'cache-and-network'
    });

    const { data: dataStore, loading: loadingStores } = useQuery(query_sc_stores_basic, {
        variables: { context: 'order' },
        fetchPolicy: 'cache-and-network'
    });

    const { data: dataChatStore, loading: loadingDataChatStore } = useQuery(query_sc_conversation_stores, {
        variables: { status: 1 },
        fetchPolicy: 'cache-and-network'
    });

    const { data: dataRoles, loading: loadingRoles } = useQuery(query_userGetRoles, {
        variables: {
            pageSize: 100,
            page: 1,
        },
        fetchPolicy: 'cache-and-network'
    });

    const [mutate, { loading: loadingCreateSubUser }] = useMutation(mutate_userCreateSubUserV2);

    const optionsStore = useMemo(() => {
        return dataStore?.sc_stores
            ?.map(store => ({
                value: store?.id,
                label: store?.name,
                logo: dataStore?.op_connector_channels?.find(channel => channel?.code == store?.connector_channel_code)?.logo_asset_url,
                ...store
            }));
    }, [dataStore]);

    const optionsChatStore = useMemo(() => {
        return dataChatStore?.sc_conversation_stores
            ?.map(store => ({
                value: store?.id,
                label: store?.name,
                logo: dataChatStore?.op_connector_channels?.find(channel => channel?.code == store?.connector_channel_code)?.logo_asset_url,
                ...store
            }));
    }, [dataChatStore]);

    const optionsRole = useMemo(() => {
        const optionsDataRole = dataRoles?.userGetRoles?.items?.map(item => ({
            ...item,
            label: item?.name,
            value: item?.code
        }))

        return optionsDataRole
    }, [dataRoles]);

    const optionsSmeWarehouse = useMemo(() => {
        const optionsCatalogStores = dataCatalogStores?.sme_warehouses?.map(
            _store => ({
                value: _store?.id,
                label: _store?.name,
                isDefault: _store?.is_default,
                ..._store
            })
        );

        return optionsCatalogStores
    }, [dataCatalogStores]);


    const RegisterSchema = Yup.object().shape({
        username: Yup.string()
            .required(formatMessage({ defaultMessage: "Vui lòng nhập tên tài khoản" }))
            .max(25, formatMessage({ defaultMessage: "Tài khoản đăng nhập tối đa 25 ký tự" }))
            .test(
                'chua-ky-tu-space-o-dau-cuoi',
                formatMessage({ defaultMessage: 'Tài khoản bắt buộc phải viết liền không dấu' }),
                (value, context) => {
                    if (!!value) {
                        return value.length == value.trim().length;
                    }
                    return true;
                },
            )
            .test(
                'chua-ky-tu-tieng-viet',
                formatMessage({ defaultMessage: 'Tài khoản bắt buộc phải viết liền không dấu' }),
                (value, context) => {
                    if (!!value) {
                        return !regex.test(value);
                    }
                    return true;
                },
            )
            .when(`username_boolean`, {
                is: values => {
                    return !!values && !!values[`username`];
                },
                then: Yup.string().oneOf([`username`], formatMessage({ defaultMessage: 'Tên tài khoản đã tồn tại' }))
            }),
        [`username_boolean`]: Yup.object().notRequired(),
        name: Yup.string()
            .max(25, formatMessage({ defaultMessage: "Tên người dùng tối đa 25 ký tự" }))
            .notRequired()
            .test(
                'chua-ky-tu-space-o-dau-cuoi',
                formatMessage({ defaultMessage: 'Tên người dùng không được chứa dấu cách ở đầu và cuối' }),
                (value, context) => {
                    if (!!value) {
                        return value.length == value.trim().length;
                    }
                    return true;
                },
            )
            .test(
                'chua-ky-tu-2space',
                formatMessage({ defaultMessage: 'Tên người dùng không được chứa 2 dấu cách liên tiếp' }),
                (value, context) => {
                    if (!!value) {
                        return !(/\s\s+/g.test(value))
                    }
                    return true;
                },
            ),
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
            .required(formatMessage({ defaultMessage: 'Vui lòng nhập mật khẩu đăng nhập' })),
        confirm_password: Yup.string()
            .required(formatMessage({ defaultMessage: 'Vui lòng nhập xác nhận mật khẩu' }))
            .when("password", {
                is: (val) => (val && val.length > 0 ? true : false),
                then: Yup.string().oneOf(
                    [Yup.ref("password")],
                    formatMessage({ defaultMessage: 'Xác nhận mật khẩu không trùng khớp' })
                ),
            }),
    });


    const formik = useFormik({
        initialValues: {
            username: '',
            password: '',
            confirm_password: '',
            name: '',
            stores: [],
            chat_stores: [],
            warehouses: [],
            roles: [],
            __changed__: false
        },
        validationSchema: RegisterSchema,
        onSubmit: async (values, { setStatus, setSubmitting }) => {
            const { username, password, name, stores, roles, warehouses, chat_stores } = values || {};
            formik.setFieldValue('__changed__', false)

            try {
                let { data } = await mutate({
                    variables: {
                        userCreateSubUserInput: {
                            username,
                            password,
                            name,
                            roles: (roles?.length > 0 ? roles : optionsRole)?.map(item => item?.value),
                            stores: stores?.length > 0 ? stores?.map(item => item?.value) : [-1],
                            warehouses: warehouses?.length > 0 ? warehouses?.map(item => item?.value) : [-1],
                            chatStores: chat_stores?.length > 0 ? chat_stores?.map(item => item?.value) : [-1]
                        }
                    }
                })

                if (data?.userCreateSubUserV2?.success) {
                    addToast(formatMessage({ defaultMessage: 'Tạo tài khoản phụ thành công' }), { appearance: 'success' });

                    history.push('/setting/users')
                } else {
                    formik.setFieldValue('__changed__', true)
                    addToast(formatMessage({ defaultMessage: 'Tạo tài khoản phụ thất bại' }), { appearance: 'error' });
                }
            } catch (error) {
                formik.setFieldValue('__changed__', true)
                setSubmitting(false);
                setStatus(
                    error.message
                );
            }
        },

    },

    );

    return (
        <div>
            <Helmet
                titleTemplate={formatMessage({ defaultMessage: "Thêm tài khoản phụ" }) + "- UpBase"}
                defaultTitle={formatMessage({ defaultMessage: "Thêm tài khoản phụ" }) + "- UpBase"}
            >
                <meta name="description" content={formatMessage({ defaultMessage: "Thêm tài khoản phụ" }) + "- UpBase"} />
            </Helmet>
            <RouterPrompt
                when={formik.getFieldProps("__changed__").value}
                // when={false}
                title={formatMessage({ defaultMessage: "Mọi thông tin bạn nhập trước đó sẽ bị xoá nếu bạn thoát màn hình này. Bạn có chắc chắn muốn thoát?" })}
                cancelText={formatMessage({ defaultMessage: "KHÔNG" })}
                okText={formatMessage({ defaultMessage: "CÓ, THOÁT" })}
                onOK={() => true}
                onCancel={() => false}
            />
            <LoadingDialog show={loadingCreateSubUser} />
            <Card>
                <CardHeader title={formatMessage({ defaultMessage: "Thêm tài khoản phụ" })} />
                <CardBody>
                    <div className="row">
                        <div className="col-9">
                            <form className="mt-4" onSubmit={formik.handleSubmit}>

                                <div className="form-group row">
                                    <label className="col-sm-4 col-form-label text-right">{formatMessage({ defaultMessage: 'Tài khoản đăng nhập' })} <span className="text-danger">*</span></label>
                                    <div className="col-sm-8 d-flex flex-column" style={{ position: 'relative' }}>
                                        <input
                                            type="text"
                                            value={user?.username}
                                            name="username"
                                            disabled={loading}
                                            className="form-control"
                                            {...formik.getFieldProps("username")}
                                            onChangeCapture={e => {
                                                formik.setFieldValue('username_boolean', { username: false })
                                            }}
                                            onBlur={async (e) => {
                                                const value = e.target.value;

                                                formik.handleBlur(e);
                                                const valueErrorForm = formik?.errors?.['username'];
                                                if (!!valueErrorForm) return;

                                                setloading(true);
                                                const checkExistUsername = await queryCheckExistUsername(value, user?.sme_id);
                                                setloading(false);
                                                if (checkExistUsername) {
                                                    formik.setFieldValue('username_boolean', { username: true })
                                                } else {
                                                    formik.setFieldValue('username_boolean', { username: false })
                                                }

                                            }}
                                            maxLength={25}
                                        />
                                        <span className="text-secondary-custom mt-1">{formatMessage({ defaultMessage: 'Vui lòng nhập thông tin tài khoản nhỏ hơn 25 kí tự và viết liền không dấu' })}</span>
                                        {formik.touched.username && formik.errors.username ? (
                                            <div className="fv-plugins-message-container">
                                                <div className="fv-help-block">{formik.errors.username}</div>
                                            </div>
                                        ) : null}
                                        {loading && <span className="spinner spinner-primary" style={{ position: 'absolute', top: 18, right: 45 }} />}
                                    </div>
                                </div>

                                <div className="form-group row">
                                    <label className="col-sm-4 col-form-label text-right">{formatMessage({ defaultMessage: 'Mật khẩu đăng nhập' })} <span className="text-danger">*</span> </label>
                                    <div className="col-sm-8">
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                type={showPass ? 'text' : "password"}
                                                value={user?.password}
                                                onBlur={formik.handleBlur}
                                                name="password"
                                                className="form-control pr-14"
                                                {...formik.getFieldProps("password")}
                                            />
                                            <a style={{ position: 'absolute', right: 0, top: -6, padding: 18 }} onClick={e => { setShowPass(!showPass) }} ><i className={showPass ? "far fa-eye text-dark" : "far fa-eye-slash"}></i></a>
                                        </div>
                                        {formik.touched.password && formik.errors.password ? (
                                            <div className="fv-plugins-message-container">
                                                <div className="fv-help-block">{formik.errors.password}</div>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                                <div className="form-group row">
                                    <label className="col-sm-4 col-form-label text-right">{formatMessage({ defaultMessage: 'Xác nhận mật khẩu' })} <span className="text-danger">*</span> </label>
                                    <div className="col-sm-8">
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                type={showConfirmPass ? 'text' : "password"}
                                                value={user?.confirm_password}
                                                onBlur={formik.handleBlur}
                                                name="confirm_password"
                                                className="form-control pr-14"
                                                {...formik.getFieldProps("confirm_password")}
                                            />
                                            <a style={{ position: 'absolute', right: 0, top: -6, padding: 18 }} onClick={e => { setShowConfirmPass(!showConfirmPass) }} ><i className={showConfirmPass ? "far fa-eye text-dark" : "far fa-eye-slash"}></i></a>
                                        </div>
                                        {formik.touched.confirm_password && formik.errors.confirm_password ? (
                                            <div className="fv-plugins-message-container">
                                                <div className="fv-help-block">{formik.errors.confirm_password}</div>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                                <div className="form-group row">
                                    <label className="col-sm-4 col-form-label text-right">{formatMessage({ defaultMessage: 'Tên người dùng' })}</label>
                                    <div className="col-sm-8 d-flex flex-column">
                                        <input type="text" value={user?.name} name="name" onBlur={formik.handleBlur} className="form-control" {...formik.getFieldProps("name")} />
                                        {formik.touched.name && formik.errors.name ? (
                                            <div className="fv-plugins-message-container">
                                                <div className="fv-help-block">{formik.errors.name}</div>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                                <div className="form-group row">
                                    <label className="col-sm-4 col-form-label text-right">{formatMessage({ defaultMessage: 'Gian hàng' })}</label>
                                    <div className="col-sm-8 d-flex flex-column">
                                        <Select
                                            options={optionsStore}
                                            className='w-100 select-report-custom'
                                            placeholder='Tất cả'
                                            components={animatedComponents}
                                            isClearable
                                            isMulti
                                            isLoading={loadingStores}
                                            onChange={values => {
                                                formik.setFieldValue('stores', values)
                                            }}
                                            styles={{
                                                container: (styles) => ({
                                                    ...styles,
                                                    zIndex: 9
                                                }),
                                            }}
                                            formatOptionLabel={(option, labelMeta) => {
                                                return <div>
                                                    {!!option.logo && <img src={option.logo} style={{ width: 15, height: 15, marginRight: 4 }} />}
                                                    {option.label}
                                                </div>
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="form-group row">
                                    <label className="col-sm-4 col-form-label text-right">{formatMessage({ defaultMessage: 'Kho' })}</label>
                                    <div className="col-sm-8 d-flex flex-column">
                                        <Select
                                            options={optionsSmeWarehouse}
                                            className='w-100 select-report-custom'
                                            placeholder='Tất cả'
                                            components={animatedComponents}
                                            isClearable
                                            isMulti
                                            isLoading={loadingCatalogStores}
                                            styles={{
                                                container: (styles) => ({
                                                    ...styles,
                                                    zIndex: 8
                                                }),
                                            }}
                                            onChange={values => {
                                                formik.setFieldValue('warehouses', values)
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="form-group row">
                                    <label className="col-sm-4 col-form-label text-right">{formatMessage({ defaultMessage: 'Gian hàng chat' })}</label>
                                    <div className="col-sm-8 d-flex flex-column">
                                        <Select
                                            options={optionsChatStore}
                                            className='w-100 select-report-custom'
                                            placeholder='Tất cả'
                                            components={animatedComponents}
                                            isClearable
                                            isMulti
                                            isLoading={loadingDataChatStore}
                                            onChange={values => {
                                                formik.setFieldValue('chat_stores', values)
                                            }}
                                            styles={{
                                                container: (styles) => ({
                                                    ...styles,
                                                    zIndex: 7
                                                }),
                                            }}
                                            formatOptionLabel={(option, labelMeta) => {
                                                return <div>
                                                    {!!option.logo && <img src={option.logo} style={{ width: 15, height: 15, marginRight: 4 }} />}
                                                    {option.label}
                                                </div>
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="form-group row">
                                    <label className="col-sm-4 col-form-label text-right">
                                        {formatMessage({ defaultMessage: 'Nhóm quyền' })}
                                    </label>
                                    <div className="col-sm-8 d-flex flex-column">
                                        <Select
                                            className='w-100 select-report-custom'
                                            placeholder='Tất cả'
                                            components={animatedComponents}
                                            options={optionsRole}
                                            isClearable
                                            isMulti
                                            isLoading={loadingRoles}
                                            styles={{
                                                container: (styles) => ({
                                                    ...styles,
                                                    zIndex: 6
                                                }),
                                            }}
                                            onChange={values => {
                                                formik.setFieldValue('roles', values)
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="form-group d-flex flex-wrap justify-content-end align-items-center">
                                    <button
                                        id="kt_create_sub_user_submit"
                                        type="submit"
                                        disabled={formik.isSubmitting}
                                        className={`btn btn-primary font-weight-bold px-9 py-3`}
                                        onClick={e => {
                                            e.preventDefault();
                                            formik.handleSubmit()
                                        }}
                                    >
                                        <span className="font-weight-boldest">{formatMessage({ defaultMessage: 'Tạo tài khoản' })}</span>
                                        {formik.isSubmitting && <span className="ml-3 spinner spinner-white"></span>}
                                    </button>
                                </div>

                            </form>
                        </div>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
}
export default injectIntl(connect(null, actions)(CreateSubUser));

