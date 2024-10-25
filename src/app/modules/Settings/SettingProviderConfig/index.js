import React, { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { useSubheader } from '../../../../_metronic/layout';
import { useIntl } from 'react-intl';
import { Helmet } from 'react-helmet';
import { useParams } from 'react-router-dom';
import { Card, CardBody, CardHeader, InputVertical } from '../../../../_metronic/_partials/controls';
import { useMutation, useQuery } from '@apollo/client';
import query_prvProviderConnectedDetail from '../../../../graphql/query_prvProviderConnectedDetail';
import { TEMPLATE_PROVIDER_INVOICE } from './TemplateSettingProvider';
import { Formik, Field } from 'formik';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import * as Yup from "yup";
import mutate_prvSaveSettingProviderConnected from '../../../../graphql/mutate_prvSaveSettingProviderConnected';
import { useToasts } from 'react-toast-notifications';
import LoadingDialog from '../../FrameImage/LoadingDialog';
import { omit } from 'lodash';

const SettingProviderConfig = () => {
    const { setBreadcrumbs } = useSubheader();
    const { formatMessage } = useIntl();
    let { id } = useParams();
    const { addToast } = useToasts();

    const { loading, data } = useQuery(query_prvProviderConnectedDetail, {
        variables: { id: Number(id) },
        fetchPolicy: 'cache-and-network',
    });
    console.log('cmm',data)
    const [saveSettingProvider, { loading: loadingSaveSetting }] = useMutation(mutate_prvSaveSettingProviderConnected, {
        awaitRefetchQueries: true,
        refetchQueries: ['prvProviderConnectedDetail']
    });

    useEffect(() => {
        setBreadcrumbs([
            { title: formatMessage({ defaultMessage: "Cài đặt" }) },
            { title: formatMessage({ defaultMessage: "Kết nối mở rộng" }) },
            { title: data?.prvProviderConnectedDetail?.provider_name || '' }
        ]);
    }, [data]);

    const [initialValues, settingConfigs] = useMemo(() => {
        const configs = TEMPLATE_PROVIDER_INVOICE?.[data?.prvProviderConnectedDetail?.system_code] || {}
        const settings = !!data?.prvProviderConnectedDetail?.settings ? JSON.parse(data?.prvProviderConnectedDetail?.settings) : {};

        return [settings, configs]
    }, [data]);

    const validateSchema = useMemo(() => {
        let schema = {};

        Object.keys(settingConfigs).forEach(key => {
            const config = settingConfigs[key];
            schema[key] = Yup.string().required(config?.required)
        })

        return Yup.object().shape(schema);
    }, [settingConfigs]);

    const onSaveSettingProvider = useCallback(async (values) => {
        try {
            const { data: dataSetting } = await saveSettingProvider({
                variables: {
                    provider_connected_id: data?.prvProviderConnectedDetail?.id,
                    setting: JSON.stringify(omit(values, ['__changed__']))
                }
            });

            if (!!dataSetting?.prvSaveSettingProviderConnected?.success) {
                addToast(formatMessage({ defaultMessage: 'Cập nhật cấu hình thành công' }), { appearance: "success" });
            } else {
                addToast(dataSetting?.prvSaveSettingProviderConnected?.message || formatMessage({ defaultMessage: 'Cập nhật cấu hình thất bại' }), { appearance: "error" });
            }
        } catch (error) {
            addToast(formatMessage({ defaultMessage: 'Đã có lỗi xảy ra, xin vui lòng thử lại' }), { appearance: "error" });
        }
    }, [data]);

    return (
        <Fragment>
            <Helmet titleTemplate={formatMessage({ defaultMessage: `Kết nối mở rộng {key}` }, { key: " - UpBase" })}
                defaultTitle={formatMessage(
                    { defaultMessage: `Kết nối mở rộng {key}` },
                    { key: " - UpBase" }
                )}>
                <meta name="description"
                    content={formatMessage(
                        { defaultMessage: `Kết nối mở rộng {key}` },
                        { key: " - UpBase" }
                    )} />
            </Helmet>
            <LoadingDialog show={loadingSaveSetting} />
            <Formik
                initialValues={initialValues}
                validationSchema={validateSchema}
                enableReinitialize
            >
                {({
                    handleSubmit,
                    values,
                    validateForm,
                    setFieldValue,
                    errors,
                    touched,
                    setFieldTouched,
                    ...rest
                }) => {
                    return (
                        <Card>
                            <CardHeader title={formatMessage({ defaultMessage: "Cài đặt" })} />
                            <CardBody>
                                <div className='row'>
                                    <div className='col-6'>
                                        {Object.keys(settingConfigs).map(key => {
                                            const config = settingConfigs[key] || {}

                                            return (
                                                <div className='row mb-6'>
                                                    <div className='col-3 text-right'>
                                                        <span style={{ position: 'relative', top: 10 }}>
                                                            <span>{config?.label}</span>
                                                            <OverlayTrigger
                                                                overlay={
                                                                    <Tooltip>
                                                                        {config?.tooltip}
                                                                    </Tooltip>
                                                                }
                                                            >
                                                                <span className="ml-1" style={{ position: 'relative', top: '-1px' }}>
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" class="bi bi-info-circle" viewBox="0 0 16 16">
                                                                        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                                                                        <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
                                                                    </svg>
                                                                </span>
                                                            </OverlayTrigger>
                                                        </span>
                                                    </div>
                                                    <div className='col-9'>
                                                        <Field
                                                            name={key}
                                                            component={InputVertical}
                                                            placeholder={config?.placeholder}
                                                            label={""}
                                                            required
                                                            customFeedbackLabel={' '}
                                                        />
                                                    </div>
                                                </div>
                                            )
                                        })}
                                        {!!data?.prvProviderConnectedDetail && <button
                                            type="submit"
                                            className="btn btn-primary"
                                            style={{ width: 120, float: 'right' }}
                                            onClick={async () => {
                                                let error = await validateForm();

                                                if (Object.keys(error).length > 0) {
                                                    handleSubmit();
                                                    return;
                                                } else {
                                                    onSaveSettingProvider(values);
                                                }
                                            }}
                                        >
                                            {formatMessage({ defaultMessage: 'Cập nhật' })}
                                        </button>}
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    )
                }}
            </Formik>
        </Fragment>
    )
}

export default SettingProviderConfig;