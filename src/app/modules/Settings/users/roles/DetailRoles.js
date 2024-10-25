import React, { memo, useState, useCallback, useMemo, useLayoutEffect, Fragment, useEffect } from "react";
import { useSubheader } from "../../../../../_metronic/layout";
import { useIntl } from "react-intl";
import { RolesProvider, useRolesContext } from "./RolesContext";
import { RouterPrompt } from "../../../../../components/RouterPrompt";
import { Field, Formik } from "formik";
import { Card, CardBody, CardHeader, InputVertical, TextArea } from "../../../../../_metronic/_partials/controls";
import PermissionMapping from "../components/PermissionMapping";
import { Helmet } from "react-helmet-async";
import { useHistory } from 'react-router-dom';
import { useMutation, useQuery } from "@apollo/client";
import query_userGetPermissions from "../../../../../graphql/query_userGetPermissions";
import mutate_userUpdateRole from "../../../../../graphql/mutate_userUpdateRole";
import { useParams } from 'react-router-dom';
import query_userGetRoleDetail from "../../../../../graphql/query_userGetRoleDetail";
import { useToasts } from "react-toast-notifications";
import LoadingDialog from "../../../FrameImage/LoadingDialog";

const DetailRoles = () => {
    const { initialValues, validateSchema, setInitialValues } = useRolesContext();
    const { formatMessage } = useIntl();
    const { addToast } = useToasts();
    const { id } = useParams();
    const history = useHistory();
    const { setBreadcrumbs } = useSubheader();
    const [currentSelectedPermission, setCurrentSelectedPermission] = useState([]);
    const [currentSelectedCate, setCurrentSelectedCate] = useState([]);

    const { loading: loadingPermissions, data: dataPermissions } = useQuery(query_userGetPermissions, {
        fetchPolicy: 'cache-and-network',
        onCompleted: (data) => {
            console.log({ data });
        }
    });

    const { loading: loadingRoleDetail, data: dataRoleDetail } = useQuery(query_userGetRoleDetail, {
        variables: { id },
        fetchPolicy: 'cache-and-network'
    });

    const [updateRole, { loading: loadingUpdateRole }] = useMutation(mutate_userUpdateRole);

    useEffect(() => {
        setBreadcrumbs([
            { title: formatMessage({ defaultMessage: 'Cài đặt' }) },
            { title: formatMessage({ defaultMessage: 'Tài khoản' }) },
            { title: dataRoleDetail?.userGetRoleDetail?.data?.name },
        ])
    }, [dataRoleDetail?.userGetRoleDetail?.data]);

    useMemo(() => {
        if (!!dataRoleDetail?.userGetRoleDetail?.data) {
            setInitialValues(prev => ({
                ...prev,
                name: dataRoleDetail?.userGetRoleDetail?.data?.name,
                description: dataRoleDetail?.userGetRoleDetail?.data?.description,
            }));
            setCurrentSelectedPermission(dataRoleDetail?.userGetRoleDetail?.data?.permissions || []);
        }
    }, [dataRoleDetail]);

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

    const onUpdateRole = useCallback(async (values) => {
        try {
            const { data } = await updateRole({
                variables: {
                    userUpdateRoleInput: {
                        id: Number(id),
                        name: values?.name,
                        description: values?.description,
                        permissions: currentSelectedPermission
                    }
                }
            });

            if (data?.userUpdateRole?.success) {
                history.push('/setting/users?type=permission');
                addToast(formatMessage({ defaultMessage: 'Cập nhật nhóm quyền thành công' }), { appearance: 'success' })
            } else {
                addToast(data?.userUpdateRole?.message || formatMessage({ defaultMessage: 'Cập nhật nhóm quyền thất bại' }), { appearance: 'error' })

            }
        } catch (error) {
            addToast(formatMessage({ defaultMessage: 'Có lỗi xảy ra, xin vui lòng thử lại' }), { appearance: 'error' });
        }
    }, [currentSelectedPermission, id]);

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
                validateForm
            }) => {
                return <Fragment>
                    <LoadingDialog show={loadingUpdateRole} />
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

                                onUpdateRole(values);
                            }}
                        >
                            {formatMessage({ defaultMessage: 'Cập nhật' })}
                        </button>
                    </div>
                </Fragment>
            }}
        </Formik>
    )
};

const DetailRolesWrapper = () => {
    const { formatMessage } = useIntl();

    return (
        <RolesProvider>
            <Helmet
                titleTemplate={formatMessage({ defaultMessage: "Thông tin nhóm quyền" }) + "- UpBase"}
                defaultTitle={formatMessage({ defaultMessage: "Thông tin nhóm quyền" }) + "- UpBase"}
            >
                <meta name="description" content={formatMessage({ defaultMessage: "Thông tin nhóm quyền" }) + "- UpBase"} />
            </Helmet>
            <DetailRoles />
        </RolesProvider>
    )
}

export default memo(DetailRolesWrapper);