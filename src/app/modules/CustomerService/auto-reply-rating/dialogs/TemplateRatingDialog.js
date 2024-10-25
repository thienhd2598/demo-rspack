import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useIntl } from 'react-intl';
import { v4 as uuidv4 } from 'uuid';
import { toAbsoluteUrl } from '../../../../../_metronic/_helpers';
import { Modal } from 'react-bootstrap'
import { Field, Formik, useFormikContext } from 'formik';
import { TextArea, Input, InputVertical } from '../../../../../_metronic/_partials/controls'
import mutate_scSaveReplyTemplate from '../../../../../graphql/mutate_scSaveReplyTemplate'
import { STARTAB } from '../constants'
import * as Yup from 'yup'
import { useMutation } from '@apollo/client';
import { useToasts } from 'react-toast-notifications';
import LoadingDialog from '../../../ProductsStore/product-new/LoadingDialog';
import { ConfirmDialog } from './ConfirmDialog'

const TemplateRatingDialog = ({ namesTemplate, itemUpdate, onHide, show }) => {
    const [FIVE_STAR, FOUR_STAR, THREE_STAR, TWO_STAR, ONE_STAR] = [5, 4, 3, 2, 1]
    const { formatMessage } = useIntl();
    const { addToast } = useToasts()
    const [initialValues, setInitialValues] = useState({});
    const [initValidate, setInitValidate] = useState({})
    const [confirmDialog, setConfirmDialog] = useState(false)
    const [disabledButton, setDisabledButton] = useState(false)

    const [queue, setQueue] = useState()
    const bottomEl = useRef(null);

    const [listTemplate, setListTemplate] = useState({
        [FIVE_STAR]: [],
        [FOUR_STAR]: [],
        [THREE_STAR]: [],
        [TWO_STAR]: [],
        [ONE_STAR]: [],
    })
    const [starTab, setStarTab] = useState(5)
    const sleep = (ms) =>
        new Promise((resolve) => {
            setTimeout(() => {
                resolve(undefined);
            }, ms);
        });
    const ScrollToFieldError = async (msgError, tab) => {
        try {
            const fieldErrorNames = Object.keys(msgError).flatMap(key => (+key?.slice(0, 1) == tab || key == 'nameTemplate') ? key : [])
            if (fieldErrorNames.length <= 0) return
            await sleep(300)
            const element = document.querySelector(`[name='${fieldErrorNames[0]}']`)
            if (!element) return
            element.scrollIntoView({ behavior: "smooth", block: "center" })
            fieldErrorNames.forEach(elm => {
                document.querySelector(`[name='${elm}']`).focus()
                document.querySelector(`[name='${elm}']`).blur()
            })

        } catch (err) {

        }
    }

    const scrollToBottom = async () => {
        setDisabledButton(true)
        await sleep(500)
        setDisabledButton(false)
        if (!bottomEl.current?.lastElementChild) return
        bottomEl.current.lastElementChild.scrollIntoView({ behavior: 'smooth' });
    };

    useMemo(() => {
        if (!!itemUpdate) {
            itemUpdate.autoRatingFilters.forEach(item => {
                const addStar = item?.autoRatingComments?.map(comment => ({ ...comment, status: item?.status, star: item?.rating_star }))
                setListTemplate(prev => ({ ...prev, ...Object.groupBy(addStar?.flat() || [], item => item?.star) }))
            })
        }
    }, [itemUpdate])

    useMemo(() => {
        let validate = []
        let initValue = []

        Object.keys(listTemplate).forEach(key => {
            (listTemplate[+key] || []).forEach((item, index) => {
                initValue[`status-${key}`] = !!item?.status
                validate[`${item?.star}-item-template-${item?.id}`] = Yup.string()
                    .required(formatMessage({ defaultMessage: 'Vui lòng nhập nội dung' }))
                    .min(10, formatMessage({ defaultMessage: "Nhập tối thiểu 10 ký tự." }))
                    .max(500, formatMessage({ defaultMessage: "Nhập tối đa 500 ký tự." }))
                    .test('chua-ky-tu-space-o-dau-cuoi', formatMessage({ defaultMessage: 'Không được chứa dấu cách ở đầu và cuối' }),
                        (value, context) => {
                            if (!!value) {
                                return value.length == value.trim().length;
                            }
                            return false;
                        })
                    .test('chua-ky-tu-2space', formatMessage({ defaultMessage: 'Không được chứa 2 dấu cách liên tiếp' }), (value, context) => {
                        if (!!value) {
                            return !(/\s\s+/g.test(value))
                        }
                        return false;
                    })
                initValue[`${item?.star}-item-template-${item?.id}`] = item?.comment || ''
            })
        })

        validate['nameTemplate'] = Yup.string().required(formatMessage({ defaultMessage: 'Vui lòng nhập tên mẫu' }))
            .min(10, formatMessage({ defaultMessage: "Tên mẫu tối thiểu 10 ký tự." }))
            .max(50, formatMessage({ defaultMessage: "Nhập tên mẫu tối đa 50 ký tự." }))
            .test('chua-ky-tu-space-o-dau-cuoi', formatMessage({ defaultMessage: 'Tên mẫu không được chứa dấu cách ở đầu và cuối' }),
                (value, context) => {
                    if (!!value) {
                        return value.length == value.trim().length;
                    }
                    return false;
                })
            .test('chua-ky-tu-2space', formatMessage({ defaultMessage: 'Tên mẫu không được chứa 2 dấu cách liên tiếp' }), (value, context) => {
                if (!!value) {
                    return !(/\s\s+/g.test(value))
                }
                return false;
            }).when(`checkExitsName`, {
                is: values => {
                    return !!values
                },
                then: Yup.string().oneOf([`nameTemplate`], formatMessage({ defaultMessage: 'Tên mẫu đã tồn tại' }))
            })
        setInitialValues(prev => ({
            ...prev,
            nameTemplate: itemUpdate?.name || '',
            ...initValue,
            listTemplate
        }));
        setInitValidate(Yup.object().shape(validate));
    }, [listTemplate, starTab, itemUpdate])

    const [saveReplyTemplateMutate, { loading }] = useMutation(mutate_scSaveReplyTemplate,
        { awaitRefetchQueries: true, refetchQueries: ['scGetAutoReplyTemplate'] }
    );

    const isMapStoreReplyTemplates = useMemo(() => {
        return itemUpdate?.mapStoreReplyTemplates?.length && itemUpdate?.stars?.includes(starTab)
    }, [itemUpdate, starTab])

    return (
        <div>

            <Formik initialValues={initialValues} validationSchema={initValidate}
                onSubmit={async (values) => {
                    const starListTemplate = Object.keys(values['listTemplate'])?.map(key => ({
                        rating_star: +key,
                        status: !listTemplate[+key].length ? 0 : !!values[`status-${+key}`] ? 1 : 0,
                        comment_list: listTemplate[+key].flatMap(item => {
                            if (values[`${item?.star}-item-template-${item?.id}`]) {
                                return {
                                    id: typeof item?.id == 'number' ? item?.id : null,
                                    comment: values[`${item?.star}-item-template-${item?.id}`]
                                }
                            }
                            return []

                        })
                    }))
                    const varibalesCreateTeamplate = {
                        name: values['nameTemplate'],
                        star_list_template: starListTemplate
                    }

                    const varibalesUpdateTeamplate = {
                        reply_template_id: itemUpdate?.id,
                        name: values['nameTemplate'],
                        star_list_template: starListTemplate
                    }

                    const { data } = await saveReplyTemplateMutate({
                        variables: !!itemUpdate ? {
                            ...varibalesUpdateTeamplate
                        } : {
                            ...varibalesCreateTeamplate
                        }
                    })
                    if (!!data?.scSaveReplyTemplate?.success) {
                        addToast(!!itemUpdate ? formatMessage({ defaultMessage: 'Cập nhật mẫu phản hồi thành công' }) : formatMessage({ defaultMessage: 'Tạo mẫu phản hồi thành công.' }), { appearance: 'success' })
                        onHide()
                        return
                    }
                    if (!!data?.scSaveReplyTemplate && !data?.scSaveReplyTemplate?.success) {
                        values[`checkExitsName`] = true
                        ScrollToFieldError({ nameTemplate: '' })
                        return
                    }
                    addToast(!!itemUpdate ? formatMessage({ defaultMessage: 'Cập nhật mẫu phản hồi không thành công' }) : formatMessage({ defaultMessage: 'Tạo mẫu phản hồi không thành công.' }), { appearance: 'error' })
                }}
            >
                {({ values, setFieldValue, handleSubmit, errors, handleBlur, validateForm }) => {

                    return (
                        <Modal onHide={() => { }} className={`overwriteModal preventScroll ${listTemplate[starTab].length > 2 ? '' : 'overHeight'}`} show={show} aria-labelledby="example-modal-sizes-title-sm" dialogClassName="modal-show-connect-product" centered backdrop={true}>
                            <Modal.Header closeButton={false}>
                                <Modal.Title>{formatMessage({ defaultMessage: "Mẫu phản hồi đánh giá khách hàng" })}</Modal.Title>
                            </Modal.Header>
                            <Modal.Body>
                                <div>
                                    {confirmDialog && <ConfirmDialog onHide={() => setConfirmDialog(false)} confirmOffStatus={() => {
                                        setFieldValue(`status-${starTab}`, !values[`status-${starTab}`])
                                        setConfirmDialog(false)
                                    }} />}
                                    <LoadingDialog show={loading} />
                                    <div className='mb-4 row'>
                                        <span className='col-2 text-right mt-2'>{formatMessage({ defaultMessage: 'Tên:' })}</span>
                                        <div className="col-9">
                                            <Field name={`nameTemplate`}
                                                component={InputVertical}
                                                value={values['nameTemplate']}
                                                placeholder={formatMessage({
                                                    defaultMessage: "Nhập tên",
                                                })}
                                                label={""}
                                                onChangeValue={() => {
                                                    if (!!values[`checkExitsName`]) {
                                                        setFieldValue('checkExitsName', false)
                                                    }
                                                }}
                                                required={false}
                                                customFeedbackLabel={" "}
                                                cols={["col-0", "col-12"]}
                                                countChar
                                                rows={2}
                                                minChar={"0"}
                                                maxChar={"50"} />
                                        </div>
                                    </div>

                                    <div className="d-flex align-items-center flex-wrap py-2 mt-4"
                                        style={{ background: "#fff", zIndex: 1, marginBottom: "5px" }}>
                                        <i style={{ color: '#00DB6D' }} className="fas fa-info-circle fs-14 ml-2 mr-2"></i>
                                        <span className="fs-14" style={{ color: '#00DB6D' }}>
                                            {formatMessage({ defaultMessage: 'Mỗi ngôi sao cài đặt nhiều nhất 5 trả lời đánh giá, mỗi lần ngẫu nhiên chọn 1 câu.' })}
                                        </span>
                                    </div>

                                    <div style={{ position: 'sticky', top: '0px', background: "#fff", zIndex: 1, }}>
                                        <div className='mt-2 mb-2 d-flex align-items-center'>
                                            <div onClick={() => {
                                                try {
                                                    if (!listTemplate[starTab].length) return
                                                    const domElm = document.querySelector(`[name='${queue}']`)
                                                    if (!domElm) return
                                                    const lengthInsertStr = '{Tên khách hàng}'.length;
                                                    const positionAreaForcus = domElm?.selectionEnd;
                                                    const newPositionInsert = positionAreaForcus + lengthInsertStr;
                                                    setFieldValue(queue, `${(values[queue] || '').slice(0, positionAreaForcus)}{Tên khách hàng}${(values[queue] || '').slice(positionAreaForcus)}`)
                                                    setTimeout(() => {
                                                        domElm.focus();
                                                        domElm.setSelectionRange(newPositionInsert, newPositionInsert);
                                                    }, 100)
                                                } catch {

                                                }

                                            }}
                                                style={{ cursor: 'pointer', width: 'max-content', background: 'rgb(0, 219, 109)', padding: '5px', borderRadius: '5px', fontWeight: 'bold', color: 'white' }}>
                                                {`{Tên khách hàng}`}
                                            </div>
                                            <span className='mx-2'>{formatMessage({ defaultMessage: 'Chèn tên khách hàng' })}</span>
                                        </div>
                                        <div className='d-flex align-items-center'>
                                            <div
                                                onClick={() => {
                                                    try {
                                                        if (!listTemplate[starTab].length) return
                                                        const domElm = document.querySelector(`[name='${queue}']`)
                                                        if (!domElm) return
                                                        const lengthInsertStr = '{Tên gian hàng}'.length;
                                                        const positionAreaForcus = domElm?.selectionEnd;
                                                        const newPositionInsert = positionAreaForcus + lengthInsertStr;
                                                        setFieldValue(queue, `${(values[queue] || '').slice(0, positionAreaForcus)}{Tên gian hàng}${(values[queue] || '').slice(positionAreaForcus)}`)
                                                        setTimeout(() => {
                                                            domElm.focus();
                                                            domElm.setSelectionRange(newPositionInsert, newPositionInsert);
                                                        }, 100)
                                                    } catch (err) {

                                                    }
                                                }}
                                                style={{ cursor: 'pointer', width: 'max-content', background: 'rgb(0, 219, 109)', padding: '5px', borderRadius: '5px', fontWeight: 'bold', color: 'white' }}>
                                                {`{Tên gian hàng}`}
                                            </div>
                                            <span className='mx-2'>{formatMessage({ defaultMessage: 'Chèn tên gian hàng' })}</span>
                                        </div>

                                        <div className='d-flex align-items-center mt-2'>
                                            <div
                                                onClick={() => {
                                                    try {
                                                        if (!listTemplate[starTab].length) return
                                                        const domElm = document.querySelector(`[name='${queue}']`)
                                                        if (!domElm) return
                                                        const lengthInsertStr = '{Tên sản phẩm}'.length;
                                                        const positionAreaForcus = domElm?.selectionEnd;
                                                        const newPositionInsert = positionAreaForcus + lengthInsertStr;
                                                        setFieldValue(queue, `${(values[queue] || '').slice(0, positionAreaForcus)}{Tên sản phẩm}${(values[queue] || '').slice(positionAreaForcus)}`)
                                                        setTimeout(() => {
                                                            domElm.focus();
                                                            domElm.setSelectionRange(newPositionInsert, newPositionInsert);
                                                        }, 100)
                                                    } catch (err) {

                                                    }
                                                }}
                                                style={{ cursor: 'pointer', width: 'max-content', background: 'rgb(0, 219, 109)', padding: '5px', borderRadius: '5px', fontWeight: 'bold', color: 'white' }}>
                                                {`{Tên sản phẩm}`}
                                            </div>
                                            <span className='mx-2'>{formatMessage({ defaultMessage: 'Chèn tên sản phẩm' })}</span>
                                        </div>

                                        <div className="d-flex w-100 mt-2" style={{ borderBottom: 'none' }}>
                                            <div style={{ flex: 1 }}>
                                                <ul className="nav nav-tabs" id="myTab" role="tablist">
                                                    {STARTAB.map((_tab, index) => {
                                                        const { title, star } = _tab;
                                                        const isActive = star == starTab
                                                        return (
                                                            <>
                                                                <li style={{ cursor: 'pointer' }} key={`tab-order-${index}`} className={`nav-item ${isActive ? "active" : ""}`}>
                                                                    <span className={`nav-link font-weight-normal ${isActive ? "active" : ""}`} style={{ fontSize: "13px" }} onClick={() => {
                                                                        setStarTab(star)
                                                                        if (star !== starTab) {
                                                                            setQueue(null)
                                                                        }
                                                                    }}>
                                                                        {!!listTemplate[star].length && !!values[`status-${star}`] && <img className='mx-2' src={toAbsoluteUrl("/media/tick-orange.svg")} alt='' />}
                                                                        {formatMessage(title)}
                                                                        <span className='mx-2'>{`(${listTemplate[star].length})`}</span>
                                                                    </span>
                                                                </li>
                                                            </>
                                                        );
                                                    })}
                                                </ul>
                                            </div>
                                        </div>
                                        <div className="d-flex justify-content-between mt-4 mb-4">
                                            <div className='d-flex align-items-center'>
                                                <span className="switch" style={{ transform: 'scale(0.8)' }}>
                                                    <label>
                                                        <input disabled={!listTemplate[starTab].length} type={'checkbox'} onChange={async () => {
                                                            if (isMapStoreReplyTemplates && values[`status-${starTab}`]) {
                                                                setConfirmDialog(true)
                                                                return
                                                            }
                                                            setFieldValue(`status-${starTab}`, !values[`status-${starTab}`])
                                                        }} style={{ background: '#F7F7FA', border: 'none' }} checked={listTemplate[starTab].length && !!values[`status-${starTab}`]} />
                                                        <span></span>
                                                    </label>
                                                </span>
                                                <span className='mx-2'>{formatMessage({ defaultMessage: 'Cài đặt trả lời tự động' })}</span>
                                            </div>

                                            <div className='d-flex align-items-center'>
                                                <span className='mx-2'>{formatMessage({ defaultMessage: 'Số lượng mẫu trả lời' })} {listTemplate[starTab].length}/5</span>
                                                <button disabled={listTemplate[starTab].length == 5 || disabledButton}
                                                    onClick={() => {
                                                        setListTemplate(prev => ({ ...prev, [prev[starTab]]: prev[starTab].push({ star: starTab, id: uuidv4() }) }))
                                                        scrollToBottom()
                                                    }} className='btn btn-primary d-flex align-items-center'>
                                                    <img src={toAbsoluteUrl("/media/svg/plus-border.svg")} alt='' />
                                                    <span className='mx-2'>{formatMessage({ defaultMessage: 'Thêm mới' })}</span>
                                                </button>

                                            </div>
                                        </div>
                                    </div>


                                    <div ref={bottomEl}>
                                        {listTemplate[starTab]?.map((row, index) => (
                                            <div className="d-flex align-items-center" style={{ border: '1px solid #d9d9d9', padding: '5px' }}>
                                                <div className='col-1 d-flex align-items-center justify-content-center'>
                                                    <b style={{ fontSize: '16px' }}>{index + 1}</b>
                                                </div>

                                                <div className='col-10'>
                                                    <span className='mb-2'>{formatMessage({ defaultMessage: 'Soạn nội dụng' })}</span>
                                                    <Field name={`${row.star}-item-template-${row?.id}`}
                                                        component={TextArea}
                                                        placeholder={formatMessage({ defaultMessage: "Nhập nội dung tại đây" })}
                                                        label={""}
                                                        onBlurChange={() => setQueue(`${row.star}-item-template-${row?.id}`)}
                                                        value={`${row.star}-item-template-${row?.id}`}
                                                        required={false}
                                                        customFeedbackLabel={" "}
                                                        cols={["col-0", "col-12"]}
                                                        countChar
                                                        rows={3}
                                                        maxChar={"500"} />
                                                </div>

                                                <div onClick={() => {
                                                    delete errors[`${row.star}-item-template-${row?.id}`]
                                                    setListTemplate(prev => ({ ...prev, [starTab]: listTemplate[starTab]?.filter(item => item?.id !== row?.id) }))
                                                    delete initValidate[`${row.star}-item-template-${row?.id}`]
                                                    delete initialValues[`${row.star}-item-template-${row?.id}`]

                                                }} style={{ cursor: 'pointer' }} className='col-1 d-flex align-items-center justify-content-center'>
                                                    <img src={toAbsoluteUrl("/media/svg/trash-red.svg")} alt='' />
                                                </div>

                                            </div>
                                        ))}
                                    </div>

                                    <Modal.Footer className="form" style={{ borderTop: "1px solid #dbdbdb", justifyContent: "end", paddingTop: 10, paddingBottom: 10, marginTop: 50 }}>
                                        <div className="form-group">
                                            <button onClick={onHide} type="button" className="btn btn-light btn-elevate mr-3" style={{ width: 100, background: 'gray', color: 'white' }}>
                                                {formatMessage({ defaultMessage: "Hủy" })}
                                            </button>
                                            <button disabled={!Object.keys(values['listTemplate']).map(key => listTemplate[+key]?.map(it => it))?.flat()?.length}
                                                onClick={() => {
                                                    validateForm().then(errors => {
                                                        const codeErr = Object.keys(errors).map(key => +key?.slice(0, 1))?.filter(e => e)

                                                        if (codeErr?.length) {
                                                            setStarTab(Math.max(...codeErr))
                                                            ScrollToFieldError(errors, Math.max(...codeErr))
                                                            setQueue(null)
                                                        } else {
                                                            if (Object.keys(errors).includes('nameTemplate')) {
                                                                ScrollToFieldError({ 'nameTemplate': '' }, null)
                                                                return
                                                            }
                                                            handleSubmit()
                                                        }
                                                    });
                                                }} type="button" className="btn btn-primary mr-3" style={{ width: 100 }} >
                                                {!!itemUpdate ? formatMessage({ defaultMessage: "Cập nhật" }) : formatMessage({ defaultMessage: "Tạo" })}
                                            </button>
                                        </div>
                                    </Modal.Footer>
                                </div>
                            </Modal.Body>
                        </Modal>
                    )
                }}
            </Formik>
        </div>

    )
}

export default TemplateRatingDialog
