import { Field, Formik } from 'formik'
import React, { Fragment, useEffect, useMemo, useState } from 'react'
import { Modal } from 'react-bootstrap'
import { useIntl } from 'react-intl'
import { InputVertical } from '../../../../_metronic/_partials/controls'
import * as Yup from 'yup'
import { useMutation } from '@apollo/client'
import { useToasts } from 'react-toast-notifications'
import { useHistory, useLocation } from "react-router-dom";
import LoadingDialog from "../../ProductsStore/product-new/LoadingDialog";
import { TooltipWrapper } from '../../Finance/payment-reconciliation/common/TooltipWrapper'
import mutate_prvConnectProvider from '../../../../graphql/mutate_prvConnectProvider'

const DialogConnect = ({ auth_type, show, name, code, onHide }) => {
    const { formatMessage } = useIntl()
    const { addToast } = useToasts()
    const [initialValues, setInitialValues] = useState({});

    console.log({ auth_type });

    const validateSchema = useMemo(() => {
        if (auth_type == 'vtp') {
            const schema = {
                clientId: Yup.string()
                    .required(formatMessage({ defaultMessage: 'Bạn vui lòng nhập tài khoản' }))
                    .test(
                        'chua-ky-tu-space-o-dau-cuoi',
                        formatMessage({ defaultMessage: 'Tài khoản không được chứa dấu cách ở đầu và cuối' }),
                        (value, context) => {
                            if (!!value) {
                                return value.length == value.trim().length;
                            }
                            return false;
                        },
                    )
                    .test(
                        'chua-ky-tu-2space',
                        formatMessage({ defaultMessage: 'Tài khoản không được chứa 2 dấu cách liên tiếp' }),
                        (value, context) => {
                            if (!!value) {
                                return !(/\s\s+/g.test(value))
                            }
                            return false;
                        },
                    ),
                clientSecret: Yup.string()
                    .required(formatMessage({ defaultMessage: 'Bạn vui lòng nhập mật khẩu' }))
                    .test(
                        'chua-ky-tu-space-o-dau-cuoi',
                        formatMessage({ defaultMessage: 'Mật khẩu không được chứa dấu cách ở đầu và cuối' }),
                        (value, context) => {
                            if (!!value) {
                                return value.length == value.trim().length;
                            }
                            return false;
                        },
                    )
                    .test(
                        'chua-ky-tu-2space',
                        formatMessage({ defaultMessage: 'Mật khẩu không được chứa 2 dấu cách liên tiếp' }),
                        (value, context) => {
                            if (!!value) {
                                return !(/\s\s+/g.test(value))
                            }
                            return false;
                        },
                    )
            }

            return Yup.object().shape(schema)
        }

        if (auth_type == 'jnt') {
            const schema = {
                user_code: Yup.string()
                    .required(formatMessage({ defaultMessage: 'Bạn vui lòng nhập "Mã khách hàng" được J&T cung cấp để kết nối vận chuyển' }))
                    .test(
                        'chua-ky-tu-space-o-dau-cuoi',
                        formatMessage({ defaultMessage: 'Mã khách hàng không được chứa dấu cách ở đầu và cuối' }),
                        (value, context) => {
                            if (!!value) {
                                return value.length == value.trim().length;
                            }
                            return false;
                        },
                    )
                    .test(
                        'chua-ky-tu-2space',
                        formatMessage({ defaultMessage: 'Mã khách hàng không được chứa 2 dấu cách liên tiếp' }),
                        (value, context) => {
                            if (!!value) {
                                return !(/\s\s+/g.test(value))
                            }
                            return false;
                        },
                    )
            }

            return Yup.object().shape(schema)
        }

        return null;

    }, [auth_type]);

    useEffect(() => {
        let clientId = ''
        let clientSecret = ''
        setInitialValues(prev => ({
            ...prev,
            clientId,
            clientSecret,
            user_code: ''
        }));

    }, [])

    const [mutatePrvConnectProvider, { loading }] = useMutation(mutate_prvConnectProvider, { awaitRefetchQueries: true, refetchQueries: ['prvListProvider'] });

    return (
        <div>
            <LoadingDialog show={loading} />

            <Formik
                enableReinitialize
                initialValues={initialValues}
                validationSchema={validateSchema}
                onSubmit={async (values) => {
                    try {
                        const { data } = await mutatePrvConnectProvider({
                            variables: {
                                client_id: (auth_type == 'oauth' || auth_type == 'vtp') ? values['clientId'] : values['user_code'],
                                client_secret: values['clientSecret'],
                                provider_code: code,
                            }
                        })

                        if (!!data?.prvConnectProvider?.success) {
                            addToast(data?.prvConnectProvider?.message || formatMessage({ defaultMessage: 'Kết nối thành công' }), { appearance: 'success' })
                            onHide()
                        } else {
                            addToast(data?.prvConnectProvider?.message || formatMessage({ defaultMessage: 'Kết nối thất bại' }), { appearance: 'error' })
                        }
                    } catch (err) {
                        addToast(formatMessage({ defaultMessage: 'Có lỗi xảy ra, xin vui lòng thử lại' }), { appearance: 'error' })
                    }

                }}>
                {({ values, handleSubmit, setFieldValue }) => {
                    return (
                        <Modal size="md" show={show} aria-labelledby="example-modal-sizes-title-sm" dialogClassName="modal-show-connect-product" centered onHide={onHide} backdrop={true}>
                            <Modal.Header closeButton={false}><Modal.Title>{formatMessage({ defaultMessage: "Kết nối hệ thống {name}" }, { name: name })}</Modal.Title></Modal.Header>
                            <Modal.Body>
                                <>
                                    <div className='col-12 pb-2'>
                                        <div className="text-dark d-flex align-items-center" style={{ fontWeight: 700, fontSize: '14px' }}>
                                            <svg xmlns="http://www.w3.org/2000/svg" color="black" width="30" height="30" fill="currentColor" className="bi bi-lightbulb mr-2" viewBox="0 0 16 16">
                                                <path d="M2 6a6 6 0 1 1 10.174 4.31c-.203.196-.359.4-.453.619l-.762 1.769A.5.5 0 0 1 10.5 13a.5.5 0 0 1 0 1 .5.5 0 0 1 0 1l-.224.447a1 1 0 0 1-.894.553H6.618a1 1 0 0 1-.894-.553L5.5 15a.5.5 0 0 1 0-1 .5.5 0 0 1 0-1 .5.5 0 0 1-.46-.302l-.761-1.77a1.964 1.964 0 0 0-.453-.618A5.984 5.984 0 0 1 2 6zm6-5a5 5 0 0 0-3.479 8.592c.263.254.514.564.676.941L5.83 12h4.342l.632-1.467c.162-.377.413-.687.676-.941A5 5 0 0 0 8 1z" />
                                            </svg>
                                            <span>{formatMessage({ defaultMessage: "Để kết nối với hệ thống {name}, xin vui lòng làm theo hướng dẫn" }, { name: name })} <span className='text-primary' style={{ cursor: 'pointer' }}>tại đây</span> để lấy thông tin</span>
                                        </div>
                                    </div>
                                    {auth_type == 'oauth' && <Fragment>
                                        <div className='row d-flex align-items-center mb-2'>
                                            <div className='col-4 text-right'>
                                                <span>Client ID</span>
                                                <TooltipWrapper note={formatMessage({ defaultMessage: 'Nhập thông tin client ID.' })}>
                                                    <i className="fas fa-info-circle fs-14 ml-2 mr-2"></i>
                                                </TooltipWrapper>
                                            </div>
                                            <div className='col-8 hiddenCountText pl-0'>
                                                <Field name='clientId'
                                                    component={InputVertical}
                                                    placeholder={formatMessage({ defaultMessage: "Nhập thông tin client ID", })}
                                                    label={""}
                                                    value={'clientId'}
                                                    required={false}
                                                    customFeedbackLabel={" "}
                                                    cols={["col-0", "col-12"]}
                                                    countChar
                                                    rows={2}
                                                    maxChar={"50"} />
                                            </div>

                                        </div>

                                        <div className='row d-flex align-items-center'>
                                            <div className='col-4 text-right'>
                                                <span>Client secret</span>
                                                <TooltipWrapper note={formatMessage({ defaultMessage: 'Nhập thông tin client Secret.' })}>
                                                    <i className="fas fa-info-circle fs-14 ml-2 mr-2"></i>
                                                </TooltipWrapper>
                                            </div>
                                            <div className='col-8 hiddenCountText pl-0'>
                                                <Field name='clientSecret'
                                                    component={InputVertical}
                                                    placeholder={formatMessage({ defaultMessage: "Nhập thông tin client Secret", })}
                                                    label={""}
                                                    value={'clientSecret'}
                                                    required={false}
                                                    customFeedbackLabel={" "}
                                                    cols={["col-0", "col-12"]}
                                                    countChar
                                                    rows={2}
                                                    maxChar={"50"} />
                                            </div>
                                        </div>
                                    </Fragment>}

                                    {auth_type == 'vtp' && <Fragment>
                                        <div className='row d-flex align-items-center mb-2'>
                                            <div className='col-4 text-right'>
                                                <span>{formatMessage({ defaultMessage: 'Tài khoản' })}</span>
                                                <span className='text-danger' > *</span>
                                                <TooltipWrapper note={formatMessage({ defaultMessage: 'Nhập thông tin tài khoản.' })}>
                                                    <i className="fas fa-info-circle fs-14 ml-2 mr-2"></i>
                                                </TooltipWrapper>
                                            </div>
                                            <div className='col-8 hiddenCountText pl-0'>
                                                <Field
                                                    name='clientId'
                                                    component={InputVertical}
                                                    placeholder={formatMessage({ defaultMessage: "Nhập thông tin tài khoản" })}
                                                    label={""}
                                                    value={'clientId'}
                                                    required={false}
                                                    customFeedbackLabel={" "}
                                                    cols={["col-0", "col-12"]}
                                                    countChar
                                                    rows={2}
                                                    maxChar={"50"} />
                                            </div>

                                        </div>

                                        <div className='row d-flex align-items-center'>
                                            <div className='col-4 text-right'>
                                                <span>{formatMessage({ defaultMessage: 'Mật khẩu' })}</span>
                                                <span className='text-danger' > *</span>
                                                <TooltipWrapper note={formatMessage({ defaultMessage: 'Nhập thông tin mật khẩu.' })}>
                                                    <i className="fas fa-info-circle fs-14 ml-2 mr-2"></i>
                                                </TooltipWrapper>
                                            </div>
                                            <div className='col-8 hiddenCountText pl-0'>
                                                <Field name='clientSecret'
                                                    component={InputVertical}
                                                    placeholder={formatMessage({ defaultMessage: "Nhập thông tin mật khẩu", })}
                                                    label={""}
                                                    value={'clientSecret'}
                                                    required={false}
                                                    customFeedbackLabel={" "}
                                                    cols={["col-0", "col-12"]}
                                                    countChar
                                                    rows={2}
                                                    maxChar={"50"} />
                                            </div>
                                        </div>
                                    </Fragment>}

                                    {auth_type == 'jnt' && <div className='row d-flex align-items-center'>
                                        <div className='col-4 text-right'>
                                            {formatMessage({ defaultMessage: 'Mã khách hàng' })}
                                            <span className='text-danger' > *</span>
                                            <TooltipWrapper note={formatMessage({ defaultMessage: 'Mã khách hàng trên hệ thống J&T Express.' })}>
                                                <i className="fas fa-info-circle fs-14 ml-2 mr-2"></i>
                                            </TooltipWrapper>
                                        </div>
                                        <div className='col-8 hiddenCountText pl-0'>
                                            <Field name='user_code'
                                                component={InputVertical}
                                                placeholder={formatMessage({ defaultMessage: "Nhập mã khách hàng", })}
                                                label={""}
                                                value={'user_code'}
                                                required
                                                customFeedbackLabel={" "}
                                                cols={["col-0", "col-12"]}
                                                countChar
                                                rows={2}
                                                maxChar={50} />
                                        </div>
                                    </div>}
                                </>
                            </Modal.Body>
                            <Modal.Footer className="form" style={{ borderTop: "1px solid #dbdbdb", justifyContent: "end", paddingTop: 10, paddingBottom: 10 }}>
                                <div className="form-group">
                                    <button disabled={loading} type="button" className="btn mr-3" style={{ width: 100, background: 'gray', color: 'white' }} onClick={onHide}>
                                        {formatMessage({ defaultMessage: "Hủy" })}
                                    </button>
                                    <button disabled={loading} type="button" className="btn btn-primary mr-3" style={{ width: 100 }} onClick={handleSubmit}>
                                        {formatMessage({ defaultMessage: "Cập nhật" })}
                                    </button>
                                </div>
                            </Modal.Footer>
                        </Modal>
                    )
                }}
            </Formik>
        </div>
    )
}

export default DialogConnect