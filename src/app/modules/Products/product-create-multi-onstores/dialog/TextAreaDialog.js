import React, { memo, useState, useMemo, useCallback } from 'react';
import { Modal } from 'react-bootstrap';
import { Field, useField, useFormikContext } from "formik";
import {
    TextEditor
} from '../components/TextEditorStep3';
import {
    TextArea,
} from "../../../../../_metronic/_partials/controls/forms/TextArea";
import { TextEditorShopee } from '../../../../../_metronic/_partials/controls/forms/TextEditorShopee';
import { TextEditorTiktok } from '../../../../../_metronic/_partials/controls/forms/TextEditorTiktok';
import { useIntl } from 'react-intl';

const TextAreaDialog = memo(({
    type, name, required
}) => {
    const [field] = useField(name);
    const { errors, values } = useFormikContext()
    const [isShow, setShow] = useState(false);
    const [messDescription, setMessDescription] = useState('')
    const [errorDescription, setErrorDescription] = useState([]);
    const {formatMessage} = useIntl()
    const title = useMemo(
        () => {
            switch (type) {
                case 'description':
                    return formatMessage({defaultMessage:'Mô tả'});
                case 'description_extend':
                    return formatMessage({defaultMessage:'Mô tả kèm hình ảnh'});
                case 'description_html':
                    return formatMessage({defaultMessage:'Mô tả dạng HTML'});
                case 'description_short':
                    return formatMessage({defaultMessage:'Mô tả ngắn'});
                default:
                    return '';
            }
        }, [type]
    );

    return (
        <React.Fragment>
            <div style={{ width: 150, verticalAlign: 'initial', border: 'none' }} className='removeBorder'>
                <div
                    className="text-center"
                    style={{ cursor: 'pointer' }}
                    onClick={e => {
                        e.preventDefault();
                        setShow(true)
                    }}
                >
                    {!!field?.value ? (
                        <>
                            <span className="mr-2">Chỉnh sửa</span><i className="fa fa-pen icon-sm text-dark"></i>
                        </>
                    ) : (
                        <>
                            <i className="ki ki-plus icon-xs text-primary"></i><span className="ml-2 text-primary">{formatMessage({defaultMessage:'Thêm'})}</span>
                        </>
                    )}
                </div>
            </div>
            <Modal
                show={errorDescription.length > 0}
                // aria-labelledby="example-modal-sizes-title-lg"
                centered
                onHide={() => setErrorDescription('')}
                size='sm'
            >
                <Modal.Body className="overlay overlay-block cursor-default text-center">
                    {
                        errorDescription == -1 ? <div className="mb-6 text-left" >
                            {formatMessage({defaultMessage:'Tải hình hảnh không thành công'})}!
                            <p>{formatMessage({defaultMessage:'Vui lòng kiểm tra lại hình ảnh bạn đã tải lên. Yêu cầu về hình ảnh'})}:</p>
                            <p>• {formatMessage({defaultMessage:'Chiều cao tối thiểu: 32px'})}</p>
                            <p>• {formatMessage({defaultMessage:'Chiều rộng tối thiểu: 700px'})}</p>
                            <p>• {formatMessage({defaultMessage:'Tỷ lệ khung hình: 0.5-32'})}</p>
                            <p>• {formatMessage({defaultMessage:'Dung lượng ảnh tối đa: 2MB'})}</p>
                        </div> : <div className="mb-6 text-left" >
                            {errorDescription}
                        </div>
                    }
                    <button
                        className="btn btn-primary"
                        style={{ width: 80 }}
                        onClick={() => setErrorDescription('')}
                    >
                        {formatMessage({defaultMessage:'Đóng'})}
                    </button>
                </Modal.Body>
            </Modal>
            <Modal
                show={isShow}
                aria-labelledby="example-modal-sizes-title-lg"
                centered
                // backdrop={'true'}
                dialogClassName=''
                size='xl'
            >
                <Modal.Body className="overlay overlay-block cursor-default">
                    <div>
                        {type == 'description' && (
                            <>
                                <p className="mb-4">{title}{!!required && <span className='text-danger' > *</span>}</p>
                                <Field
                                    name={name}
                                    component={TextArea}
                                    setMessDescription={setMessDescription}
                                    placeholder={formatMessage({defaultMessage:"Nhập mô tả dạng văn bản"})}
                                    label={''}
                                    required={required}
                                    customFeedbackLabel={' '}
                                    cols={['', 'col-12']}
                                    countChar
                                    maxChar={'5,000'}
                                />
                            </>
                        )}
                        {type == 'description_extend' && (
                            <>
                                <p className="mb-4">{formatMessage({defaultMessage:'Mô tả kèm hình ảnh'})} ({values[`${name}_img_count`] || 0}/12 {formatMessage({defaultMessage:'ảnh'})})<span style={{ color: 'red' }} >*</span></p>
                                <Field
                                    name={name}
                                    component={TextEditorShopee}
                                    placeholder={formatMessage({defaultMessage:"Nhập mô tả kèm hình ảnh"})}
                                    onErrorUpload={setErrorDescription}
                                    label={''}
                                    required={required}
                                    customFeedbackLabel={' '}
                                    cols={['', 'col-12']}
                                    countChar
                                    maxChar={'5,000'}
                                />
                            </>
                        )}
                        {type == 'description_html' && (
                            <>
                                <p className="mb-4">{formatMessage({defaultMessage:'Mô tả dạng HTML'})} ({values[`${name}_img_count`] || 0}/30 {formatMessage({defaultMessage:'ảnh'})})<span style={{ color: 'red' }} >*</span></p>
                                <Field
                                    name={name}
                                    component={TextEditorTiktok}
                                    onErrorUpload={setErrorDescription}
                                    placeholder={formatMessage({defaultMessage:"Nhập mô tả dạng HTML"})}
                                    init="description_html_init"
                                    label={''}
                                    required={required}
                                    customFeedbackLabel={' '}
                                    cols={['col-12', 'col-12']}
                                />
                            </>
                        )}
                        {type == 'description_short' && (
                            <>
                                <p className="mb-4">{title}{!!required && <span className='text-danger' > *</span>}</p>
                                <Field
                                    name={name}
                                    component={TextEditor}
                                    placeholder={formatMessage({defaultMessage:"Nhập mô tả ngắn"})}
                                    label={''}
                                    init="description_short_init"
                                    required={required}
                                    customFeedbackLabel={' '}
                                    cols={['', 'col-12']}
                                    toolbar={{
                                        options: ['inline', 'list', 'textAlign', 'history'],
                                    }}
                                />
                            </>
                        )}
                    </div>
                    <div className="form-group mb-4 text-center" style={{ marginTop: 20 }}>
                        <button
                            type="button"
                            className="btn btn-light btn-elevate mr-3"
                            style={{ width: 150 }}
                            onClick={(e) => {
                                e.preventDefault();
                                setShow(false);
                            }}
                        >
                            <span className="font-weight-boldest">{formatMessage({defaultMessage:'Huỷ'})}</span>
                        </button>
                        <button
                            type="button"
                            className="btn btn-primary ml-3"
                            style={{ width: 150 }}
                            disabled={(type == 'description' && (messDescription.length < 100 || messDescription.length > 5000)) || !!errors[name]}
                            onClick={async e => {
                                e.preventDefault();
                                if (type == 'description' && (messDescription.length < 100 || messDescription.length > 5000)) return;

                                setShow(false);
                            }}
                        >
                            <span className="font-weight-boldest">{formatMessage({defaultMessage:'Xác nhận'})}</span>
                        </button>
                    </div>
                </Modal.Body>
            </Modal>
        </React.Fragment>
    )
});

export default TextAreaDialog;