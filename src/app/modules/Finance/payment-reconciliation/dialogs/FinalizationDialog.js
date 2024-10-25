import React, { useState } from 'react'
import { Modal } from 'react-bootstrap'
import { useIntl } from 'react-intl'

import dayjs from 'dayjs';
import DatePicker from "rsuite/DatePicker";

const FinalizationDialog = ({ handleFinalization, show, onHide}) => {

    const [valueTime, setValueime] = useState();
    console.log('valueRangeTime', valueTime)
    const { formatMessage } = useIntl()

    const disabledFutureDate = (date) => {
        const unixDate = dayjs(date).unix();
        const today = dayjs()
            .endOf("day")
            .unix();

        return unixDate > today;
    };

  return (
    <Modal
        aria-labelledby="example-modal-sizes-title-lg"
        centered
        show={show}
        onHide={onHide}
    >
    <div>
    <Modal.Header closeButton={false}>
        <Modal.Title>{formatMessage({ defaultMessage: "Chọn thời gian quyết toán" })}</Modal.Title>
    </Modal.Header>
    <Modal.Body className="overlay overlay-block cursor-default text-center">
      <div>

    <div className="col-12 mb-6">
        <DatePicker 
            onChange={value => {
            if (!!value) {
                setValueime(value)
            } else {
                setValueime(null)
            }

        }}
        format={"dd/MM/yyyy HH:mm"}
        value={valueTime}
        // disabledDate={disabledFutureDate}
        placeholder="Chọn thời gian"
        className="w-100 custome__style__input__date border border-gray" 
        />
    </div>
        
      </div>
    </Modal.Body>
    <Modal.Footer className="form mt-10" style={{ borderTop: "1px solid #dbdbdb", justifyContent: "end", paddingTop: 10, paddingBottom: 10, }}>
        <div className="form-group">
        <button onClick={onHide} type="button" className="btn mr-3" style={{ width: 100, background: 'gray', color: "#fff" }}>
        {formatMessage({ defaultMessage: 'Hủy bỏ'})}
        </button>
        <button disabled={!valueTime} type="submit" onClick={async () => handleFinalization(valueTime)} className="btn btn-primary btn-elevate mr-3" style={{ width: 100 }}>
        {formatMessage({ defaultMessage: 'Lưu lại' })}
        </button>
        </div>
    </Modal.Footer>
    </div>
  </Modal>
  )
}

export default FinalizationDialog