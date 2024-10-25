/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useState, useEffect, Fragment } from "react";
import { Link, useHistory, useLocation } from "react-router-dom";
import { useSelector, shallowEqual, connect, useDispatch } from "react-redux";
import { useFormik } from "formik";
import * as Yup from "yup";
import * as auth from "../Auth";
import { FormattedMessage, injectIntl } from "react-intl";
import { actions } from "../Auth/_redux/authRedux";
import LoadingDialog from "../FrameImage/LoadingDialog";
import { useMutation } from "@apollo/client";
import { useToasts } from "react-toast-notifications";
import { getUserByToken } from "../Auth/_redux/authCrud";
import { useSubheader } from "../../../_metronic/layout";
import Select from "react-select";
import { RouterPrompt } from "../../../components/RouterPrompt";
import { Helmet } from "react-helmet";
import { Card, CardBody, CardHeader } from "../../../_metronic/_partials/controls";
import query_sme_users_by_pk from "../../../graphql/query_sme_users_by_pk";
import client from "../../../apollo";
import mutate_userUpdateMe from "../../../graphql/mutate_userUpdateMe";

function UpdateInformation(props) {
    // Fields
    const [loading, setloading] = useState(false);
    const [isError, setisError] = useState(false);
    const dispatch = useDispatch();
    const user = useSelector((state) => state.auth.user, shallowEqual);
    const { addToast } = useToasts();
    const history = useHistory();
    useEffect(() => { }, [user]);
    const [mutate, { }] = useMutation(mutate_userUpdateMe)
    const { intl } = props;
    const location = useLocation()
    const { appendBreadcrumbs, setToolbar } = useSubheader()
    const [change, setChange] = useState(true);

    useEffect(() => {
        return () => {
            client.query({
                query: query_sme_users_by_pk,
                variables: {
                    id: user?.id
                },
                fetchPolicy: 'no-cache'
            }).then(({ data }) => {
                console.log({ data })
                if (!!data?.sme_users_by_pk && data?.sme_users_by_pk?.is_complete_tutorial == 0) {                    
                    dispatch(props.showIntroStep());                    
                }
            })
        }
    }, []);

    useEffect(() => {
        appendBreadcrumbs({
            title: intl.formatMessage({ defaultMessage: 'Cập nhật thông tin' }),
            pathname: `/user-profile/update-information`
        })
    }, [location.pathname])
    const blocking = () => {
        console.log(user)
        const unblock = history.block((location, action) => {
            if(location?.pathname =='/logout') {
                return true
            }
            if (!(user?.phone && user?.business_model && user?.full_name)) {
                return false
            }
            return true;
        });

        return () => {
            unblock();
        };
    }
    blocking()
    // Methods
    const OPTIONS_BUSINESS = [
        { value: 'enterprise', label: intl.formatMessage({ defaultMessage: 'Doanh nghiệp' }) },
        { value: 'individual', label: intl.formatMessage({ defaultMessage: 'Cá nhân' }) },
    ];


    const RegisterSchema = Yup.object().shape({
        phone: Yup.string()
            .required(
                intl.formatMessage({
                    defaultMessage: "Vui lòng nhập số điện thoại",
                })
            ).length(10, intl.formatMessage({ defaultMessage: "Độ dài số điện thoại phải {number} số" }, { number: 10 }))
            .test(
                'sai-dinh-dang-phone',
                'Số điện thoại không hợp lệ',
                (value, context) => {
                    if (!!value) {
                        return (/^0[0-9]\d{8}$/g.test(value))
                    }
                    return false;
                },
            ),
        business_model: Yup.string()
            .required(intl.formatMessage({ defaultMessage: 'Vui lòng chọn hình thức kinh doanh' })),
        full_name: Yup.string()
            .required(
            intl.formatMessage({
                defaultMessage: "Vui lòng nhập tên doanh nghiệp/cá nhân",
            }))
            .max(128, intl.formatMessage({ defaultMessage: "Tên doanh nghiệp/cá nhân tối đa 128 kí tự" }))
    });

    const handleChange = (evt) => {
        const financialGoal = (evt.target.validity.valid) ? evt.target.value : formik.getFieldProps("phone").value;
        formik.setFieldValue("phone", financialGoal.slice(0, 10), true)
        formik.setFieldValue('__changed__', true)
    }


    const formik = useFormik({
        initialValues: {
            phone: user?.phone || '',
            business_model: user?.business_model || '',
            full_name: user?.full_name || '',
            __changed__: false
        },
        validationSchema: RegisterSchema,
        onSubmit: async (values, { setStatus, setSubmitting }) => {
            formik.setFieldValue('__changed__', false)
            try {
                setloading(true);
                let { data } = await mutate({
                    variables: {
                        userUpdateMeInput: {
                            avatar_url: user?.avatar_url,
                            phone: values.phone,
                            business_model: values.business_model,
                            full_name: values.full_name,
                        }
                    }
                })
                if (!!data?.userUpdateMe) {
                    let updatedUser = Object.assign({ ...user }, {
                        phone: values.phone,
                        business_model: values.business_model,
                        full_name: values.full_name,
                    });
                    dispatch(props.setUser(updatedUser));
                    setloading(false);
                    addToast(intl.formatMessage({ defaultMessage: 'Đã cập nhật thông tin.' }), { appearance: 'success' });

                    history.push('/dashboard');
                } else {
                    formik.setFieldValue('__changed__', true)
                    addToast(intl.formatMessage({ defaultMessage: 'Cập nhật không thành công.' }), { appearance: 'error' });
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
        <Fragment>
            <Helmet
                titleTemplate={`${intl.formatMessage({ defaultMessage: 'Cập nhật thông tin' })} - UpBase`}
                defaultTitle={`${intl.formatMessage({ defaultMessage: 'Cập nhật thông tin' })} - UpBase`}
            >
                <meta name="description" content={`${intl.formatMessage({ defaultMessage: 'Cập nhật thông tin' })} - UpBase`} />
            </Helmet>
            <RouterPrompt
                when={formik.getFieldProps("__changed__").value}
                // when={false}
                title={intl.formatMessage({ defaultMessage: "Mọi thông tin bạn nhập trước đó sẽ bị xoá nếu bạn thoát màn hình này. Bạn có chắc chắn muốn thoát?" })}
                cancelText={intl.formatMessage({ defaultMessage: "KHÔNG" })}
                okText={intl.formatMessage({ defaultMessage: "CÓ, THOÁT" })}
                onOK={() => true}
                onCancel={() => false}
            />
            <LoadingDialog show={loading} />
            <Card>
                <CardHeader title="Cập nhật thông tin" />
                <CardBody>
                    <div className="col-9">
                        <form className="mt-4" onSubmit={formik.handleSubmit}>

                            <div className="form-group row">
                                <label className="col-sm-4 col-form-label text-right">Email</label>
                                <div className="col-sm-8">
                                    <input type="text" disabled value={user?.email} name="email" className="form-control" />
                                </div>
                            </div>

                            <div className="form-group row">
                                <label className="col-sm-4 col-form-label text-right">{intl.formatMessage({ defaultMessage: 'Số điện thoại' })} <span className="text-danger">*</span> </label>
                                <div className="col-sm-8">
                                    <div className="input-group-prepend">
                                        {/* <div className="input-group-text">+84</div> */}
                                        <input pattern="[0-9]*" value={formik.values.phone} onChange={handleChange}
                                            name="phone" onBlur={formik.handleBlur} className="form-control" />
                                    </div>
                                    {formik.touched.phone && formik.errors.phone ? (
                                        <div className="fv-plugins-message-container">
                                            <div className="fv-help-block">{formik.errors.phone}</div>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                            <div className="form-group row">
                                <label className="col-sm-4 col-form-label text-right">{intl.formatMessage({ defaultMessage: 'Hình thức kinh doanh' })} <span className="text-danger">*</span> </label>
                                <div className="col-sm-8">
                                    <Select
                                        className='w-100 select-report-order'
                                        placeholder={intl.formatMessage({ defaultMessage: 'Chọn hình thức kinh doanh' })}
                                        isClearable
                                        value={OPTIONS_BUSINESS.find(_op => _op.value == formik.getFieldProps("business_model").value)}
                                        options={OPTIONS_BUSINESS}
                                        onBlur={formik.handleBlur}
                                        onChange={(value) => {
                                            formik.setFieldValue('business_model', value?.value);
                                            formik.setFieldValue('__changed__', true)
                                        }}
                                    />
                                    {formik.touched['react-select-2-input'] && formik.errors.business_model ? (
                                        <div className="fv-plugins-message-container">
                                            <div className="fv-help-block">{formik.errors.business_model}</div>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                            <div className="form-group row">
                                <label className="col-sm-4 col-form-label text-right">{intl.formatMessage({ defaultMessage: 'Tên doanh nghiệp/cá nhân' })} <span className="text-danger">*</span></label>
                                <div className="col-sm-8">
                                    <input type="text" {...formik.getFieldProps("full_name")}
                                        onInput={() => {
                                            formik.setFieldValue('__changed__', true)
                                        }}
                                        placeholder={intl.formatMessage({ defaultMessage: "Nhập tên doanh nghiệp/ cá nhân" })} name="full_name" className="form-control" />
                                    {formik.touched.full_name && formik.errors.full_name ? (
                                        <div className="fv-plugins-message-container">
                                            <div className="fv-help-block">{formik.errors.full_name}</div>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                            <div className="form-group d-flex flex-wrap justify-content-end align-items-center">
                                <button
                                    id="kt_login_signin_submit"
                                    type="submit"
                                    disabled={Object.keys(formik.errors).length !== 0 || !formik.getFieldProps("business_model").value || !formik.getFieldProps("phone").value}
                                    className={`btn btn-primary font-weight-bold px-9 py-4`}
                                >
                                    <span className="font-weight-boldest">{intl.formatMessage({ defaultMessage: 'Cập nhật' })}</span>

                                </button>
                            </div>

                        </form>
                    </div>
                </CardBody>
            </Card>
        </Fragment>
    );
}
export default injectIntl(connect(null, actions)(UpdateInformation));

