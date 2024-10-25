import { Field, Formik } from 'formik'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Modal } from 'react-bootstrap'
import { useIntl } from 'react-intl'
import { TextArea } from '../../../../../_metronic/_partials/controls'
import * as Yup from 'yup'
import mutate_scReplyComments from '../../../../../graphql/mutate_scReplyComments'
import { useMutation } from '@apollo/client'
import { useToasts } from 'react-toast-notifications'
import { useHistory, useLocation } from "react-router-dom";
import { ResultFeedBackDialog } from './ResultFeedBackDialog'
import LoadingDialog from "../../../ProductsStore/product-new/LoadingDialog";
import queryString from "querystring";
const FeedBackDialog = ({ feedbackDialog, setFeedbackDialog, setDataResult }) => {
    const { formatMessage } = useIntl()
    const location = useLocation();
    const params = queryString.parse(location.search.slice(1, 100000));
    const { addToast } = useToasts()
    const history = useHistory();
    const [initialValues, setInitialValues] = useState({});
    const [initValidate, setInitValidate] = useState({})
    useMemo(() => {
        let comment_reply = ''
        let validate = []

        validate['comment_reply'] = Yup.string().required('Vui lòng nhập nội dung.')
            .min(10, formatMessage({ defaultMessage: "Nội dung tối thiểu 10 ký tự." }))
            .max(500, formatMessage({ defaultMessage: "Nhập tối đa 500 kí tự." }))
            .test('chua-ky-tu-space-o-dau-cuoi', formatMessage({ defaultMessage: 'Nội dung không được chứa dấu cách ở đầu và cuối' }),
                (value, context) => {
                    if (!!value) {
                        return value.length == value.trim().length;
                    }
                    return false;
                })
            .test('chua-ky-tu-2space', formatMessage({ defaultMessage: 'Nội dung không được chứa 2 dấu cách liên tiếp' }), (value, context) => {
                if (!!value) {
                    return !(/\s\s+/g.test(value))
                }
                return false;
            })

        setInitialValues(prev => ({
            ...prev,
            comment_reply,
            replyCommentItems: feedbackDialog.replyComment
        }));
        setInitValidate(Yup.object().shape(validate));
    }, [feedbackDialog])

    const [replyCommentMutate, { loading }] = useMutation(mutate_scReplyComments,
        { awaitRefetchQueries: true, refetchQueries: ['scGetComments'] }
    );

    return (
        <div>
            <LoadingDialog show={loading} />

            <Formik enableReinitialize initialValues={initialValues} validationSchema={initValidate}
                onSubmit={async (values) => {
                    let listReplyComments = []

                    if (!Array.isArray(feedbackDialog.replyComment)) {
                        listReplyComments = [{
                            rating_id: values['replyCommentItems'],
                            comment: values['comment_reply']
                        }]
                    } else {
                        listReplyComments = values['replyCommentItems']?.map(ratingId => ({
                            rating_id: ratingId,
                            comment: values['comment_reply']
                        }))
                    }
                    let { data } = await replyCommentMutate({
                        variables: {
                            list_reply_comment: listReplyComments
                        }
                    });
                    if (!!data?.scReplyComments?.success && !data?.scReplyComments?.total_fail && !Array.isArray(feedbackDialog.replyComment)) {
                        addToast(formatMessage({ defaultMessage: 'Đánh giá được phản hồi thành công' }), { appearance: 'success' })
                        setFeedbackDialog({ isOpen: false, id: null })
                        history.push(`/customer-service/manage-rating?${queryString.stringify({ ...params, page: 1, status: 'reply' })}`.replaceAll('%2C', '\,'))
                        return
                    }
                    if (!!data?.scReplyComments?.success && Array.isArray(feedbackDialog.replyComment)) {
                        setDataResult(data?.scReplyComments)
                        setFeedbackDialog({ isOpen: false, id: null })
                        history.push(`/customer-service/manage-rating?${queryString.stringify({ ...params, page: 1, status: 'reply' })}`.replaceAll('%2C', '\,'))
                        return
                    }
                    addToast(formatMessage({ defaultMessage: 'Đánh giá được phản hồi không thành công' }), { appearance: 'error' })
                    setFeedbackDialog({ isOpen: false, id: null })
                    history.push(`/customer-service/manage-rating?${queryString.stringify({ ...params, page: 1, status: 'reply' })}`.replaceAll('%2C', '\,'))

                }}>
                {({ values, handleSubmit, setFieldValue }) => {
                    return (
                        <Modal size="lg" show={feedbackDialog.isOpen} aria-labelledby="example-modal-sizes-title-sm" dialogClassName="modal-show-connect-product" centered onHide={() => { }} backdrop={true}>
                            <Modal.Header closeButton={false}><Modal.Title>{Array.isArray(feedbackDialog.replyComment) ? formatMessage({ defaultMessage: "Phản hồi đánh giá khách hàng hàng loạt" }) : formatMessage({ defaultMessage: "Phản hồi đánh giá khách hàng" })}</Modal.Title></Modal.Header>
                            <Modal.Body>
                                <>
                                    {Array.isArray(feedbackDialog.replyComment) ? <div className='mb-2'>{formatMessage({ defaultMessage: 'Tổng đánh giá cần phản hồi' })}: <strong>{feedbackDialog.replyComment?.length}</strong></div> : null}
                                    <div className='mb-2'>{formatMessage({ defaultMessage: 'Soạn nội dung' })}</div>
                                    <Field name='comment_reply'
                                        component={TextArea}
                                        placeholder={formatMessage({ defaultMessage: "Nhập nội dung tại đây", })}
                                        label={""}
                                        value={values['comment_reply']}
                                        required={false}
                                        customFeedbackLabel={" "}
                                        cols={["col-0", "col-12"]}
                                        countChar
                                        rows={3}
                                        maxChar={"500"} />
                                    <div className='mt-2 mb-5'>
                                        <span
                                            onClick={() => {
                                                const domElm = document.querySelector(`[name='comment_reply']`)
                                                const lengthInsertStr = '{Tên khách hàng}'.length;
                                                const positionAreaForcus = domElm.selectionEnd;
                                                const newPositionInsert = positionAreaForcus + lengthInsertStr;
                                                setFieldValue('comment_reply', `${(values['comment_reply'] || '').slice(0, positionAreaForcus)}{Tên khách hàng}${(values['comment_reply'] || '').slice(positionAreaForcus)}`)
                                                setTimeout(() => {
                                                    domElm.focus();
                                                    domElm.setSelectionRange(newPositionInsert, newPositionInsert);
                                                }, 100)
                                            }}
                                            style={{ cursor: 'pointer', background: 'rgb(0, 219, 109)', padding: '5px', borderRadius: '5px', fontWeight: 'bold', color: 'white' }}>
                                            {`{Tên khách hàng}`}
                                        </span>
                                        <span className='mx-2'>{formatMessage({ defaultMessage: 'Chèn tên khách hàng' })}</span>
                                    </div>
                                    <div className='mt-2 mb-5'>
                                        <span onClick={() => {
                                            const domElm = document.querySelector(`[name='comment_reply']`)
                                            const lengthInsertStr = '{Tên gian hàng}'.length;
                                            const positionAreaForcus = domElm.selectionEnd;
                                            const newPositionInsert = positionAreaForcus + lengthInsertStr;
                                            setFieldValue('comment_reply', `${(values['comment_reply'] || '').slice(0, positionAreaForcus)}{Tên gian hàng}${(values['comment_reply'] || '').slice(positionAreaForcus)}`)
                                            setTimeout(() => {
                                                domElm.focus();
                                                domElm.setSelectionRange(newPositionInsert, newPositionInsert);
                                            }, 100)
                                        }} style={{ cursor: 'pointer', background: 'rgb(0, 219, 109)', padding: '5px', borderRadius: '5px', fontWeight: 'bold', color: 'white' }}>
                                            {`{Tên gian hàng}`}
                                        </span>
                                        <span className='mx-2'>{formatMessage({ defaultMessage: 'Chèn tên gian hàng' })}</span>
                                    </div>

                                    <div>
                                        <span onClick={() => {
                                            const domElm = document.querySelector(`[name='comment_reply']`)
                                            const lengthInsertStr = '{Tên sản phẩm}'.length;
                                            const positionAreaForcus = domElm.selectionEnd;
                                            const newPositionInsert = positionAreaForcus + lengthInsertStr;
                                            setFieldValue('comment_reply', `${(values['comment_reply'] || '').slice(0, positionAreaForcus)}{Tên sản phẩm}${(values['comment_reply'] || '').slice(positionAreaForcus)}`)
                                            setTimeout(() => {
                                                domElm.focus();
                                                domElm.setSelectionRange(newPositionInsert, newPositionInsert);
                                            }, 100)
                                        }} style={{ cursor: 'pointer', background: 'rgb(0, 219, 109)', padding: '5px', borderRadius: '5px', fontWeight: 'bold', color: 'white' }}>
                                            {`{Tên sản phẩm}`}
                                        </span>
                                        <span className='mx-2'>{formatMessage({ defaultMessage: 'Chèn tên sản phẩm' })}</span>
                                    </div>
                                </>
                            </Modal.Body>
                            <Modal.Footer className="form" style={{ borderTop: "1px solid #dbdbdb", justifyContent: "end", paddingTop: 10, paddingBottom: 10 }}>
                                <div className="form-group">
                                    <button type="button" className="btn btn-light btn-elevate mr-3" style={{ width: 100, background: 'gray', color: 'white' }}
                                        onClick={() => setFeedbackDialog({ isOpen: false, id: null })}>
                                        {formatMessage({ defaultMessage: "Hủy" })}
                                    </button>
                                    <button disabled={!values['comment_reply'] || loading || (Array.isArray(feedbackDialog.replyComment) ? !feedbackDialog.replyComment?.length : !feedbackDialog.replyComment)} type="button" className="btn btn-primary mr-3" style={{ width: 100 }} onClick={handleSubmit}>
                                        {formatMessage({ defaultMessage: "Trả lời" })}
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

export default FeedBackDialog
