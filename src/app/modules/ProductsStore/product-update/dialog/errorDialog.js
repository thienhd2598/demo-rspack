import React, { useMemo, useState } from "react";
import { Modal } from "react-bootstrap";
import { FormattedMessage, useIntl } from "react-intl";

function ErrorDialog({ messageError, onHide }) {
    const { formatMessage } = useIntl()
    return (
        <>
            <Modal
                show={messageError}
                aria-labelledby="example-modal-sizes-title-lg"
                centered
                onHide={() => console.log('test')}
                backdrop={'static'}
                dialogClassName='width-fit-content'
            >
                <Modal.Body className="overlay overlay-block cursor-default text-center" style={{ width: 400 }} >
                    <>
                        <i className='far fa-times-circle text-danger' style={{ fontSize: 48, marginBottom: 8 }}></i>
                        <div className="mb-4" >{messageError}</div>

                        <div>
                            <button type="button" onClick={onHide} className="btn btn-light btn-elevate mr-3" style={{ width: 150 }}>
                                <span className="font-weight-boldest"><FormattedMessage defaultMessage="ĐÓNG" /></span>
                            </button>
                        </div>
                    </>

                </Modal.Body>
            </Modal >

        </>
    );
}

export default ErrorDialog;