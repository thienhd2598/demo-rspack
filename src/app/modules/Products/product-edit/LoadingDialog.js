import React, { } from "react";
import { Modal } from "react-bootstrap";
import { FormattedMessage } from "react-intl";


function LoadingDialog({ show, onHide, title, fitWith }) {
  return (
    <Modal
      show={show}
      aria-labelledby="example-modal-sizes-title-lg"
      centered
      backdrop={'static'}
      dialogClassName='width-fit-content'
    >
      <Modal.Body className="overlay overlay-block cursor-default text-center" style={!!fitWith ? {} : { width: 200 }} >
        <div className="mb-4" >{!!title ? title : <FormattedMessage defaultMessage="Đang thực hiện" />}</div>
        <div className="mb-2"><span className="spinner spinner-primary" style={{ marginRight: 20 }} ></span></div>
      </Modal.Body>
    </Modal >
  );
}

export default LoadingDialog;