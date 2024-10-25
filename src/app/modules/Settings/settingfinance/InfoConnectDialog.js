import { Field, Formik } from 'formik'
import React, { useMemo, useState } from 'react'
import { Modal } from 'react-bootstrap'
import { useIntl } from 'react-intl'
import { InputVertical } from '../../../../_metronic/_partials/controls'
import * as Yup from 'yup'
import { useMutation } from '@apollo/client'
import { useToasts } from 'react-toast-notifications'
import { useHistory, useLocation } from "react-router-dom";
import LoadingDialog from "../../ProductsStore/product-new/LoadingDialog";
import { TooltipWrapper } from '../../Finance/payment-reconciliation/common/TooltipWrapper'
import mutate_loginInvoicePartner from '../../../../graphql/mutate_loginInvoicePartner'

const InfoConnectDialog = ({ show, onHide }) => {
    const { formatMessage } = useIntl()
    const { addToast } = useToasts()
    const history = useHistory();
    const [initialValues, setInitialValues] = useState({});
    const [initValidate, setInitValidate] = useState({})

    const PARTNERNAME = 'hoadon30s'
    useMemo(() => {
        let validate = []
        let clientId = ''
        let clientSecret = ''

        validate['clientId'] = Yup.string().required('Vui lòng nhập clientId.')
        validate['clientSecret'] = Yup.string().required('Vui lòng nhập clientSecret.')
        setInitialValues(prev => ({
            ...prev,
            clientId,
            clientSecret
        }));
        setInitValidate(Yup.object().shape(validate));
    }, [])

    const [loginInvoicePartnerMutate, { loading }] = useMutation(mutate_loginInvoicePartner,
        { awaitRefetchQueries: true, refetchQueries: ['getInvoiceSetting'] }
    );

    return (
        <div>
            <LoadingDialog show={loading} />

            <Formik enableReinitialize initialValues={initialValues} validationSchema={initValidate}
                onSubmit={async (values) => {

                    const { data } = await loginInvoicePartnerMutate({
                        variables: {
                            client_id: values['clientId'],
                            client_secret: values['clientSecret'],
                            partner_name: PARTNERNAME,
                        }
                    })
                    if (!!data?.loginInvoicePartner?.success) {
                        addToast(formatMessage({ defaultMessage: 'Kết nối thành công' }), { appearance: 'success' })
                        onHide()
                        return
                    }
                    addToast(formatMessage({ defaultMessage: 'Kết nối thất bại' }), { appearance: 'error' })
                    onHide()

                }}>
                {({ values, handleSubmit, setFieldValue }) => {
                    return (
                        <Modal size="md" show={show} aria-labelledby="example-modal-sizes-title-sm" dialogClassName="modal-show-connect-product" centered onHide={onHide} backdrop={true}>
                            <Modal.Header closeButton={false}><Modal.Title>{formatMessage({ defaultMessage: "Kết nối hệ thống xuất hoá đơn " })}</Modal.Title></Modal.Header>
                            <Modal.Body>
                                <>
                                    <div className='col-12 pb-2'>
                                        <div className="text-dark d-flex align-items-center" style={{ fontWeight: 700, fontSize: '14px' }}>
                                            <svg xmlns="http://www.w3.org/2000/svg" color="black" width="30" height="30" fill="currentColor" className="bi bi-lightbulb mr-2" viewBox="0 0 16 16">
                                                <path d="M2 6a6 6 0 1 1 10.174 4.31c-.203.196-.359.4-.453.619l-.762 1.769A.5.5 0 0 1 10.5 13a.5.5 0 0 1 0 1 .5.5 0 0 1 0 1l-.224.447a1 1 0 0 1-.894.553H6.618a1 1 0 0 1-.894-.553L5.5 15a.5.5 0 0 1 0-1 .5.5 0 0 1 0-1 .5.5 0 0 1-.46-.302l-.761-1.77a1.964 1.964 0 0 0-.453-.618A5.984 5.984 0 0 1 2 6zm6-5a5 5 0 0 0-3.479 8.592c.263.254.514.564.676.941L5.83 12h4.342l.632-1.467c.162-.377.413-.687.676-.941A5 5 0 0 0 8 1z" />
                                            </svg>
                                            <span>{formatMessage({ defaultMessage: "Để kết nối với hệ thống Hoadon30s, xin vui lòng làm theo hướng dẫn" })} <span className='text-primary' style={{ cursor: 'pointer' }}>tại đây</span> để lấy thông tin</span>
                                        </div>
                                    </div>
                                    <div className='row d-flex align-items-center mb-2'>
                                        <div className='col-4 text-right'>Client ID
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
                                        <div className='col-4 text-right'>Client secret
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

                                </>
                            </Modal.Body>
                            <Modal.Footer className="form" style={{ borderTop: "1px solid #dbdbdb", justifyContent: "end", paddingTop: 10, paddingBottom: 10 }}>
                                <div className="form-group">
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

export default InfoConnectDialog