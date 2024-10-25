import React, { useRef } from "react";
import { Modal } from "react-bootstrap";
import { useProductsUIContext } from "../ProductsUIContext";
import { FormattedMessage, injectIntl } from "react-intl";
import { Formik, Form } from "formik";
import { useIntl } from "react-intl";

const parseInitialValues = (channelsSelected) => {
  let init = {

  }
  channelsSelected.forEach(_chanel => {
    init[_chanel.id] = true
  })
  return init
}

function ProductChannelSelectDialog({ show, onHide }) {
  // Products UI Context
  const { channelsSupported, channelsSelected, setChannelsSelected } = useProductsUIContext();
  const {formatMessage} = useIntl()
  const btnRef = useRef();
  const saveClick = () => {
    if (btnRef && btnRef.current) {
      btnRef.current.click();
    }
  };
  return (
    <Modal
      show={show}
      onHide={onHide}
      aria-labelledby="example-modal-sizes-title-lg"
      centered
      size='lg'
    >
      <Modal.Header>
        <Modal.Title>
          <FormattedMessage defaultMessage="Chọn gian hàng/kênh bán" />
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="overlay overlay-block cursor-default">
        <Formik
          initialValues={parseInitialValues(channelsSelected)}
          onSubmit={(values) => {
            setChannelsSelected(Object.keys(values).map(key => {
              if (values[key]) {
                return channelsSupported.find(_chanel => _chanel.id == key)
              }
              return null;
            }).filter(_chanel => !!_chanel))
            onHide()
          }}
        >
          {({
            handleSubmit,
            setFieldValue,
            initialValues
          }) => {
            return (
              <Form>
                <div className="form-group row">
                  {
                    channelsSupported.map(_channel => {
                      return (
                        <label key={_channel.id} className="col-3 checkbox checkbox-outline checkbox-primary mt-3 mb-1">
                          <input type="checkbox" name={`channel-${_channel.id}`}
                            defaultChecked={initialValues[_channel.id] || false}
                            onChange={(e) => {
                              setFieldValue(_channel.id, e.target.checked)
                            }} />
                          <span></span>
                          &ensp;{_channel.brand?.iconName && <i className={`fab ${_channel.brand?.iconName} text-primary mr-2`}></i>}{_channel.name}
                        </label>
                      )
                    })
                  }
                </div>
                <button
                  type="submit"
                  style={{ display: "none" }}
                  ref={btnRef}
                  onSubmit={() => handleSubmit()}
                >
                </button>
              </Form>
            )
          }}
        </Formik>
      </Modal.Body>
      <Modal.Footer className="form">
        <div className="form-group">
          <button
            type="button"
            onClick={onHide}
            className="btn btn-light btn-elevate mr-3"
          >
            <FormattedMessage defaultMessage="ĐÓNG" />
          </button>
          <button
            type="button"
            onClick={saveClick}
            className="btn btn-primary btn-elevate"
          >
            <FormattedMessage defaultMessage="XÁC NHẬN" />
          </button>
        </div>
      </Modal.Footer>
    </Modal>
  );
}

export default injectIntl(ProductChannelSelectDialog);