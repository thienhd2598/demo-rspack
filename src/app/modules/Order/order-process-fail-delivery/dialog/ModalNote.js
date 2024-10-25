import { Field } from 'formik';
import React, { memo } from 'react';
import { Modal } from 'react-bootstrap';
import { useIntl } from 'react-intl';
import { InputNote } from '../components/InputNote';

const ModalConfirm = memo(({
    show,
    onHide,
    onConfirm
}) => {
    const { formatMessage } = useIntl();

    return (
        <Modal
            show={show}
            aria-labelledby="example-modal-sizes-title-sm"
            centered
            onHide={onHide}
            backdrop={true}
        >
            <Modal.Header closeButton={true}>
                <Modal.Title>
                    {formatMessage({ defaultMessage: 'Ghi chú xử lý trả hàng' })}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="overlay overlay-block cursor-default">
                <div className='row mb-4'>
                    <div className='col-3 text-right'>
                        <span>{formatMessage({ defaultMessage: 'Ghi chú' })}</span>
                    </div>
                    <div className='col-9'>
                        <Field
                            name={`order-note`}
                            component={InputNote}
                            placeholder={formatMessage({ defaultMessage: 'Nhập ghi chú' })}
                            label={""}                            
                            nameTxt={"--"}
                            countChar
                            required
                            customFeedbackLabel={' '}                            
                        />
                    </div>
                </div>
                <div className='row'>
                    <div className='col-3 text-right'>
                        <span>{formatMessage({ defaultMessage: 'Hình ảnh' })}</span>
                    </div>
                    <div className='col-9'>

                    </div>
                </div>
            </Modal.Body>
            <Modal.Footer className="form" style={{ borderTop: '1px solid #dbdbdb', justifyContent: 'end', paddingTop: 10, paddingBottom: 10 }} >
                <div className="form-group">
                    <button
                        type="submit"
                        onClick={() => { }}
                        className="btn btn-primary btn-elevate mr-3"
                        style={{ width: 100 }}
                    >
                        {formatMessage({ defaultMessage: 'Đóng' })}
                    </button>
                </div>
            </Modal.Footer>
        </Modal>
    )
});

export default ModalConfirm;