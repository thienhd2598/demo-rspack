import React, { useEffect, useMemo } from "react";
import { Modal } from "react-bootstrap";
import { useIntl } from "react-intl";


const ModalCancellationReason = ({ dataCancellationReason, onHide }) => {
    const {formatMessage} = useIntl()

    return (
        <Modal
            show={dataCancellationReason}
            aria-labelledby="example-modal-sizes-title-sm "
            centered
            onHide={onHide}
            backdrop={true}
            dialogClassName={'body-dialog-connect'}
        >
            <Modal.Header>
                <Modal.Title>
                    {formatMessage({defaultMessage: 'Nguyên nhân hủy'})}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="overlay overlay-block cursor-default">

                <div className="row">
                    <div className="col-12 mb-3 fs-14">
                    {formatMessage({defaultMessage: 'Người hủy'})}: {dataCancellationReason?.cancel_by}
                    </div>
                    <div className="col-12 fs-14">
                    {formatMessage({defaultMessage: 'Nguyên nhân'})}: {dataCancellationReason?.cancel_reason}
                    </div>
                </div>

            </Modal.Body>
            <Modal.Footer className="form" style={{ borderTop: '1px solid #dbdbdb', justifyContent: 'end', paddingTop: 10, paddingBottom: 10 }} >
                <div className="form-group">
                    <button
                        type="button"
                        onClick={onHide}
                        className="btn btn-primary btn-elevate mr-3"
                        style={{ width: 100 }}
                    >
                        {formatMessage({defaultMessage: 'Đóng'})}
                    </button>
                </div>
            </Modal.Footer>
        </Modal>
    );
};

export default ModalCancellationReason;
