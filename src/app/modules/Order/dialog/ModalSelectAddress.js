import dayjs from 'dayjs';
import { Field, Formik } from 'formik';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { InputVertical } from '../../../../_metronic/_partials/controls';
import weekday from 'dayjs/plugin/weekday';
import _ from "lodash";
import { useIntl } from 'react-intl';

dayjs.extend(weekday);

const ModalSelectAddress = ({
    listShipmentDetails,
    shipmentDetails,
    showModalAddress,
    setShipmentDetails,
    onHide
}) => {
    const {formatMessage} = useIntl()
    const [addressSelect, setAddressSelect] = useState();
    useEffect(() => {
        setAddressSelect(shipmentDetails)
    }, [showModalAddress]);

    return (
        <Modal
            show={!!showModalAddress}
            aria-labelledby="example-modal-sizes-title-sm"
            centered
            onHide={onHide}
            backdrop={true}
            dialogClassName={'body-dialog-connect modal-pack-order'}
        >
            <Modal.Header>
                <Modal.Title>
                    {formatMessage({defaultMessage: 'Danh sách địa chỉ'})}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="overlay overlay-block cursor-default">
                <i
                    className="fas fa-times"
                    onClick={onHide}
                    style={{ position: 'absolute', top: -45, right: 20, fontSize: 20, cursor: 'pointer' }}
                />
                <div className='row'>
                    {listShipmentDetails?.map((address, index) =>
                        <div className='border p-4 col-12 mb-5 d-flex align-items-start' key={index}>
                            <label key={`op-${index}`} className="radio mr-3">
                                <input
                                    type="radio"
                                    name='address'
                                    onChange={() => setAddressSelect(address)}
                                    checked={address?.address_id ===  addressSelect?.address_id}
                                />
                                <span></span>
                            </label>
                            <div>
                                <p>{address?.address}</p>
                                <p>{address?.city}</p>
                                <p>{address?.state}</p>
                            </div>
                        </div>
                    )}
                </div>
            </Modal.Body>
            <Modal.Footer className="form" style={{ borderTop: '1px solid #dbdbdb', justifyContent: 'end', paddingTop: 10, paddingBottom: 10 }} >
                <div className="form-group">
                    <button
                        type="button"
                        onClick={onHide}
                        className="btn btn-secondary mr-5"
                        style={{ width: 100 }}
                    >
                        {formatMessage({defaultMessage: 'Hủy bỏ'})}
                    </button>
                    <button
                        type="button"
                        onClick={() => { setShipmentDetails(addressSelect); onHide() }}
                        className="btn btn-primary btn-elevate mr-3"
                        style={{ width: 100 }}
                    >
                        {formatMessage({defaultMessage: 'Xác nhận'})}
                    </button>
                </div>
            </Modal.Footer>
        </Modal >
    )
};

export default memo(ModalSelectAddress);