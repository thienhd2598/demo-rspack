/* eslint-disable jsx-a11y/anchor-is-valid */
import { useMutation, useQuery } from "@apollo/client";
import { useFormik } from "formik";
import React, { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet";
import { injectIntl, useIntl } from "react-intl";
import { connect, shallowEqual, useDispatch, useSelector } from "react-redux";
import { useHistory, useLocation } from "react-router-dom";
import { useToasts } from "react-toast-notifications";
import * as Yup from "yup";
import { Card, CardBody, CardHeader } from '../../../../_metronic/_partials/controls';
import { useSubheader } from "../../../../_metronic/layout";
import { RouterPrompt } from "../../../../components/RouterPrompt";
import mutate_userUpdateSubUser from "../../../../graphql/mutate_userUpdateSubUser";
import query_sme_roles from "../../../../graphql/query_sme_roles";
import { actions } from "../../Auth/_redux/authRedux";
import LoadingDialog from "../../FrameImage/LoadingDialog";
import Select from "react-select";
import makeAnimated from 'react-select/animated';
import query_smeCatalogStores from "../../../../graphql/query_smeCatalogStores";
import query_sc_stores_basic from "../../../../graphql/query_sc_stores_basic";
import query_sc_conversation_stores from "../../../../graphql/query_sc_conversation_stores";
import mutate_userUpdateSubUserV2 from "../../../../graphql/mutate_userUpdateSubUserV2";
import query_userGetRoles from "../../../../graphql/query_userGetRoles";

const animatedComponents = makeAnimated();

function UpdateSubUser(props) {
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
    const [roles, setRoles] = useState(location?.state?.sub_user?.roles || []);

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
            title: formatMessage({ defaultMessage: 'Cập nhật tài khoản phụ' }),
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

    const [mutate, { loading: loadingUpdateSubUser }] = useMutation(mutate_userUpdateSubUserV2);
    const { data: dataRoles, loading: loadingRoles } = useQuery(query_userGetRoles, {
        variables: {
            pageSize: 100,
            page: 1,
        },
        fetchPolicy: 'cache-and-network'
    });

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
        name: Yup.string()
            .max(25, formatMessage({ defaultMessage: "Tên người dùng tối đa 25 ký tự" }))
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
    });    

    const initialValues = useMemo(() => {
        if (!location?.state?.sub_user) return {};
        
        const { name, username, warehouses, roles, stores, chatStores } = location?.state?.sub_user; 
        return {
            name, username,
            warehouses: optionsSmeWarehouse?.filter(wh => warehouses?.includes(wh?.value)),
            roles: optionsRole?.filter(role => roles?.map(item => item?.code)?.includes(role?.value)),
            stores: optionsStore?.filter(st => stores?.includes(st?.value)),
            chat_stores: optionsChatStore?.filter(st => chatStores?.includes(st?.value)),
        }
    }, [location?.state, optionsRole, optionsSmeWarehouse, optionsStore, optionsChatStore]);    

    console.log(`CHECK: `, location, optionsRole);


    const formik = useFormik({
        initialValues: initialValues,
        enableReinitialize: true,
        validationSchema: RegisterSchema,
        onSubmit: async (values, { setStatus, setSubmitting }) => {
            const { name, stores, roles, warehouses, chat_stores } = values || {};            
            formik.setFieldValue('__changed__', false)

            try {
                let { data } = await mutate({
                    variables: {
                        userUpdateSubUserInput: {
                            id: location?.state?.sub_user?.id,
                            name,
                            roles: (roles?.length > 0 ? roles : optionsRole)?.map(item => item?.value),
                            stores: stores?.length > 0 ? stores?.map(item => item?.value) : [-1],
                            warehouses: warehouses?.length > 0 ? warehouses?.map(item => item?.value) : [-1],
                            chatStores: chat_stores?.length > 0 ? chat_stores?.map(item => item?.value) : [-1],

                        }
                    }
                })

                if (data?.userUpdateSubUserV2?.success) {
                    addToast(`${formatMessage({ defaultMessage: 'Cập nhật thông tin tài khoản' })} ${location?.state?.sub_user?.username} ${formatMessage({ defaultMessage: 'thành công' })}`, { appearance: 'success' });

                    history.push('/setting/users');
                } else {
                    formik.setFieldValue('__changed__', true)
                    addToast(`${formatMessage({ defaultMessage: 'Cập nhật thông tin tài khoản' })} ${location?.state?.sub_user?.username} ${formatMessage({ defaultMessage: 'thất bại' })}`, { appearance: 'error' });
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
                titleTemplate={formatMessage({ defaultMessage: "Cập nhật tài khoản phụ" }) + "- UpBase"}
                defaultTitle={formatMessage({ defaultMessage: "Cập nhật tài khoản phụ" }) + "- UpBase"}
            >
                <meta name="description" content={formatMessage({ defaultMessage: "Cập nhật tài khoản phụ" }) + "- UpBase"} />
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
            <LoadingDialog show={loadingUpdateSubUser} />
            <Card>
                <CardHeader title={formatMessage({ defaultMessage: "Cập nhật tài khoản phụ" })} />
                <CardBody>
                    <div className="row">
                        <div className="col-9">
                            <form className="mt-4" onSubmit={formik.handleSubmit}>

                                <div className="form-group row">
                                    <label className="col-sm-4 col-form-label text-right">{formatMessage({ defaultMessage: "Tài khoản đăng nhập" })}</label>
                                    <div className="col-sm-8 d-flex flex-column">
                                        <input disabled type="text" value={formik.values?.username} name="username" className="form-control" />
                                    </div>
                                </div>
                                <div className="form-group row">
                                    <label className="col-sm-4 col-form-label text-right">{formatMessage({ defaultMessage: "Tên người dùng" })}</label>
                                    <div className="col-sm-8 d-flex flex-column">
                                        <input type="text" value={formik.values?.name} name="name" onBlur={formik.handleBlur} className="form-control" {...formik.getFieldProps("name")} />
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
                                            value={formik.values?.stores}
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
                                            value={formik.values?.warehouses}
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
                                            value={formik.values?.chat_stores}
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
                                            value={formik.values?.roles}
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
                                    {location?.state?.sub_user?.provider != 'agency' &&<button
                                        id="kt_create_sub_user_submit"
                                        type="submit"
                                        disabled={formik.isSubmitting}
                                        className={`btn btn-primary font-weight-bold px-9 py-3`}
                                        onClick={e => {
                                            e.preventDefault();
                                            formik.handleSubmit()
                                        }}
                                    >
                                        <span className="font-weight-boldest">{formatMessage({ defaultMessage: "Cập nhật" })}</span>
                                        {formik.isSubmitting && <span className="ml-3 spinner spinner-white"></span>}
                                    </button>}
                                </div>

                            </form>
                        </div>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
}
export default injectIntl(connect(null, actions)(UpdateSubUser));

