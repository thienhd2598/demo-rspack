import React, { useMemo, useCallback, memo } from 'react';
import { Modal, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useIntl } from 'react-intl';

const ModalIntroStep = ({ stepForcus, isDone, onHide, onConfirm, onUpdate }) => {
    const { formatMessage } = useIntl();

    return (
        <Modal
            show={!!stepForcus}
            aria-labelledby="example-modal-sizes-title-sm"
            centered
            backdrop={true}
            dialogClassName={'body-dialog-connect'}
        >
            <Modal.Body className="overlay overlay-block cursor-default">
                <div className='d-flex algin-items-center justify-content-between mb-4'>
                    <div className='d-flex algin-items-center'>
                        {isDone ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="mr-2 text-success bi bi-check-circle" viewBox="0 0 16 16">
                                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
                                <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05" />
                            </svg>
                        ) : (
                            <div className='mr-2' style={{ width: 16, height: 16, borderRadius: '50%', border: '1px solid #cbced4' }} />
                        )}
                        <span className='mr-2 font-weight-bolder'>
                            {stepForcus?.title}
                        </span>
                        <svg onClick={() => window.open(stepForcus?.introPath, "_blank")} xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="cursor-pointer bi bi-question-circle" viewBox="0 0 16 16">
                            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
                            <path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.267 0-2.655.59-2.75 2.286zm1.557 5.763c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94" />
                        </svg>
                    </div>
                    <svg onClick={onHide} xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="cursor-pointer bi bi-x-lg" viewBox="0 0 16 16">
                        <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z" />
                    </svg>
                </div>
                <div className="ml-7 mb-4">
                    <ul className='mb-0' style={{ listStyleType: 'circle', listStylePosition: 'inside' }}>
                        {stepForcus?.description?.map(des => <li className='fs-14 mb-1'>{des}</li>)}
                    </ul>
                </div>
                <div className="ml-7 mb-6">
                    <span className='font-weight-bolder'>{stepForcus?.content}</span>
                </div>
                <div className="d-flex align-items-center justify-content-between ml-7">
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={onConfirm}
                        style={{ minWidth: 120 }}
                    >
                        {stepForcus?.btn}
                    </button>
                    <span
                        role='button'
                        style={isDone ? { cursor: 'not-allowed' } : {}}
                        onClick={() => {
                            if (isDone) return;
                            onUpdate(stepForcus?.status)
                        }}
                    >
                        {formatMessage({ defaultMessage: 'Bỏ qua' })}
                    </span>
                </div>
            </Modal.Body>
        </Modal>
    )
};

export default memo(ModalIntroStep);