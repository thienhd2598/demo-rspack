import React, { memo, useState, useCallback, useMemo, useLayoutEffect, Fragment } from "react";
import { useSubheader } from "../../../../../_metronic/layout";
import { useIntl } from "react-intl";
import { RolesProvider, useRolesContext } from "./RolesContext";
import { RouterPrompt } from "../../../../../components/RouterPrompt";
import { Field, Formik } from "formik";
import { Card, CardBody, CardHeader, InputVertical, TextArea } from "../../../../../_metronic/_partials/controls";
import PermissionMapping from "../components/PermissionMapping";
import { Helmet } from "react-helmet-async";
import { useHistory, useLocation } from 'react-router-dom';
import { useMutation, useQuery } from "@apollo/client";
import query_userGetPermissions from "../../../../../graphql/query_userGetPermissions";
import mutate_userCreateRole from "../../../../../graphql/mutate_userCreateRole";
import { useToasts } from "react-toast-notifications";
import LoadingDialog from "../../../FrameImage/LoadingDialog";
import query_userGetRoleDetail from "../../../../../graphql/query_userGetRoleDetail";
import mutation_userCheckRoleName from "../../../../../graphql/mutation_userCheckRoleName";

const CreateRoles = () => {
    const { initialValues, validateSchema, setInitialValues } = useRolesContext();
    const { formatMessage } = useIntl();
    const { addToast } = useToasts();
    const history = useHistory();
    const location = useLocation();
    const [currentSelectedPermission, setCurrentSelectedPermission] = useState([]);
    const [currentSelectedCate, setCurrentSelectedCate] = useState([]);

    const { loading: loadingPermissions, data: dataPermissions } = useQuery(query_userGetPermissions, {
        fetchPolicy: 'cache-and-network'
    });

    const { loading: loadingRoleDetail, data: dataRoleDetail } = useQuery(query_userGetRoleDetail, {
        variables: { id: location?.state?.role?.id },
        fetchPolicy: 'cache-and-network',
        skip: !location?.state?.role?.id
    });

    const [createRole, { loading: loadingCreateRole }] = useMutation(mutate_userCreateRole);

    const [mutateCheckNameExist, { loading: loadingCheckNameExist }] = useMutation(mutation_userCheckRoleName);

    useMemo(() => {
        if (!!location?.state?.role && !!dataRoleDetail?.userGetRoleDetail?.data) {
            setInitialValues(prev => ({
                ...prev,
                name: `Sao chép ${dataRoleDetail?.userGetRoleDetail?.data?.name}`,
                description: dataRoleDetail?.userGetRoleDetail?.data?.description,
            }));
            setCurrentSelectedPermission(dataRoleDetail?.userGetRoleDetail?.data?.permissions || []);
        }
    }, [dataRoleDetail, location?.state?.role]);

    const dataMappingPermissions = useMemo(() => {
        if (dataPermissions?.userGetPermissions?.items?.length > 0) {
            const mappedPermissions = dataPermissions?.userGetPermissions?.items?.reduce((result, value) => {
                const hasCategory = result?.some(category => category?.categoryCode == value?.categoryCode);
                if (hasCategory) {
                    result = result?.map(cate => {
                        if (cate?.categoryCode == value?.categoryCode) {
                            const hasGroup = cate?.groups?.some(group => group?.groupCode == value?.groupCode);

                            return {
                                ...cate,
                                groups: hasGroup
                                    ? cate?.groups?.map(group => {
                                        if (group?.groupCode == value?.groupCode) {
                                            return {
                                                ...group,
                                                permissions: group?.permissions?.concat([{
                                                    id: value?.id,
                                                    code: value?.code,
                                                    name: value?.name
                                                }])
                                            }
                                        }
                                        return group
                                    })
                                    : cate?.groups?.concat([{
                                        groupCode: value?.groupCode,
                                        groupName: value?.groupName,
                                        permissions: [{
                                            id: value?.id,
                                            code: value?.code,
                                            name: value?.name
                                        }]
                                    }])
                            }
                        }
                        return cate
                    })
                } else {
                    result = result?.concat([{
                        categoryCode: value?.categoryCode,
                        categoryName: value?.categoryName,
                        groups: [{
                            groupCode: value?.groupCode,
                            groupName: value?.groupName,
                            permissions: [{
                                id: value?.id,
                                code: value?.code,
                                name: value?.name
                            }]
                        }]
                    }])
                }

                return result
            }, [])

            return mappedPermissions
        }

        return []
    }, [dataPermissions]);

    useMemo(() => {
        if (dataPermissions?.userGetPermissions?.items?.length > 0) {
            const mappingCategoryCode = dataPermissions?.userGetPermissions?.items
                ?.filter(item => dataRoleDetail?.userGetRoleDetail?.data?.permissions?.includes(item?.code))
                ?.map(item => item?.categoryCode);

            setCurrentSelectedCate([...new Set(mappingCategoryCode)]);
        }
    }, [dataRoleDetail, dataMappingPermissions]);

    const onCreateRole = useCallback(async (values) => {
        try {
            const { data } = await createRole({
                variables: {
                    userCreateRoleInput: {
                        name: values?.name,
                        description: values?.description,
                        permissions: currentSelectedPermission
                    }
                }
            });

            if (data?.userCreateRole?.success) {
                history.push('/setting/users?type=permission');
                addToast(formatMessage({ defaultMessage: 'Tạo nhóm quyền thành công' }), { appearance: 'success' })
            } else {
                addToast(data?.userCreateRole?.message || formatMessage({ defaultMessage: 'Tạo nhóm quyền thất bại' }), { appearance: 'error' })

            }
        } catch (error) {
            addToast(formatMessage({ defaultMessage: 'Có lỗi xảy ra, xin vui lòng thử lại' }), { appearance: 'error' });
        }
    }, [currentSelectedPermission]);

    return (
        <Formik
            initialValues={initialValues}
            validationSchema={validateSchema}
            enableReinitialize
        >
            {({
                submitForm,
                handleSubmit,
                values,
                setFieldValue,
                validateForm,
                setErrors,
                errors
            }) => {
                return <Fragment>
                    <LoadingDialog show={loadingCreateRole} />
                    <Card>
                        <CardHeader title={formatMessage({ defaultMessage: 'Thông tin nhóm quyền' })} />
                        <CardBody>
                            <div className="form-group row">
                                <label className="col-sm-3 col-form-label text-right">{formatMessage({ defaultMessage: 'Tên nhóm quyền' })} <span className="text-danger">*</span> </label>
                                <div className="col-sm-9">
                                    <Field
                                        name={`name`}
                                        component={InputVertical}
                                        placeholder={formatMessage({ defaultMessage: 'Nhập tên nhóm quyền' })}
                                        label={""}
                                        customFeedbackLabel={' '}
                                        countChar
                                        maxChar={120}
                                        maxLength={120}
                                        required
                                        onBlurChange={async () => {
                                            let { data: dataCheckNameExisted } = await mutateCheckNameExist({
                                                variables: {
                                                    name: values?.name
                                                }
                                            })
                                            if (!!dataCheckNameExisted?.userCheckRoleName?.isExists) {
                                              setFieldValue(`role_name_boolean`, { name: true })
                                            } else {
                                              setFieldValue(`role_name_boolean`, { name: false })
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="form-group row">
                                <label className="col-sm-3 col-form-label text-right">{formatMessage({ defaultMessage: 'Mô tả' })}</label>
                                <div className="col-sm-9">
                                    <Field
                                        name={`description`}
                                        component={TextArea}
                                        rows={4}
                                        cols={['col-12', 'col-12']}
                                        countChar
                                        maxChar={550}
                                        maxLength={550}
                                        label={""}
                                        placeholder={formatMessage({ defaultMessage: 'Nhập mô tả' })}
                                        required
                                        customFeedbackLabel={' '}
                                    />
                                </div>
                            </div>
                            <PermissionMapping
                                dataMappingPermissions={dataMappingPermissions}
                                currentSelectedPermission={currentSelectedPermission}
                                setCurrentSelectedPermission={setCurrentSelectedPermission}
                                currentSelectedCate={currentSelectedCate}
                                setCurrentSelectedCate={setCurrentSelectedCate}
                            />
                        </CardBody>
                    </Card>
                    <div className='form-group d-flex justify-content-end mt-8 group-button-fixed-bottom pr-10' style={{ zIndex: 9 }}>
                        <button
                            className="btn btn-secondary"
                            role="button"
                            type="submit"
                            style={{ width: 150 }}
                            onClick={() => {
                                history.push('/setting/users?type=permission');
                            }}
                        >
                            {formatMessage({ defaultMessage: 'Hủy bỏ' })}
                        </button>
                        <button
                            className="btn btn-primary ml-4"
                            type="submit"
                            style={{ width: 150 }}
                            onClick={async () => {
                                const errors = await validateForm(values);
                                if (Object.keys(errors)?.length) {
                                    handleSubmit();
                                    return;
                                }
                                let { data: dataCheckNameExisted } = await mutateCheckNameExist({
                                    variables: {
                                        name: values?.name
                                    }
                                })
                                if (!!dataCheckNameExisted?.userCheckRoleName?.isExists) {
                                  setFieldValue(`role_name_boolean`, { name: true })
                                  handleSubmit();
                                } else {
                                  setFieldValue(`role_name_boolean`, { name: false })
                                  onCreateRole(values);
                                }

                            }}
                        >
                            {formatMessage({ defaultMessage: 'Tạo' })}
                        </button>
                    </div>
                </Fragment>
            }}
        </Formik>
    )
};

const CreateRolesWrapper = () => {
    const { appendBreadcrumbs } = useSubheader();
    const { formatMessage } = useIntl();

    useLayoutEffect(() => {
        appendBreadcrumbs({
            title: formatMessage({ defaultMessage: 'Cài đặt' }),
            pathname: `/setting`
        })
        appendBreadcrumbs({
            title: formatMessage({ defaultMessage: 'Tài khoản' }),
            pathname: `/setting/users`
        })
        appendBreadcrumbs({
            title: formatMessage({ defaultMessage: 'Thông tin nhóm quyền' }),
            pathname: `/setting/users/create-role`
        })
    }, []);

    return (
        <RolesProvider>
            <Helmet
                titleTemplate={formatMessage({ defaultMessage: "Thông tin nhóm quyền" }) + "- UpBase"}
                defaultTitle={formatMessage({ defaultMessage: "Thông tin nhóm quyền" }) + "- UpBase"}
            >
                <meta name="description" content={formatMessage({ defaultMessage: "Thông tin nhóm quyền" }) + "- UpBase"} />
            </Helmet>
            <CreateRoles />
        </RolesProvider>
    )
}

export default memo(CreateRolesWrapper);