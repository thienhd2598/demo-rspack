import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import { Modal } from "react-bootstrap";
import { useProductsUIContext } from "../ProductsUIContext";
import { FormattedMessage, injectIntl, useIntl } from "react-intl";
import { Formik, Form, Field, useFormikContext } from "formik";
import { InputVertical } from "../../../../_metronic/_partials/controls";
import * as Yup from "yup";
import slugify from 'react-slugify';
import { ATTRIBUTE_VALUE_TYPE } from '../ProductsUIHelpers'
import { randomString } from "../../../../utils";
import { useQuery } from "@apollo/client";
import query_sc_stores_basic from "../../../../graphql/query_sc_stores_basic";
import { Link } from 'react-router-dom';
import { useHistory } from "react-router";

function ChooseStoreDialog({ show, onHide, options, idProductCreated, onChoosed }) {

  const [current, setCurrent] = useState()
  const history = useHistory()
  const { formatMessage } = useIntl()

  useEffect(() => {
    if (options?.length > 0) {
      setCurrent(options[0].value)
    }
  }, [options])

  return (
    <Modal
      show={show}
      aria-labelledby="example-modal-sizes-title-sm"
      centered
    >
      <Modal.Header style={{ justifyContent: 'center', border: 'none', paddingBottom: 0 }}>
        <Modal.Title>
          {formatMessage({ defaultMessage: 'Chọn gian hàng' })}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="overlay overlay-block cursor-default text-center" >
        {options.length == 0 && <div className="mb-4" >{formatMessage({ defaultMessage: 'Bạn chưa liên kết với gian hàng nào. Vui lòng liên kết gian hàng trước khi thực hiện tính năng này.' })}</div>}
        {
          !!current && options.length != 0 && <div className="radio-list" onChange={e => {
            setCurrent(e.target.value)
          }}>
            {
              options.map(_option => {
                return <label key={`_option--${_option.value}`} className="radio">
                  <input type="radio" name="radios1" value={_option.value} checked={current == _option.value} />
                  <span></span>
                  <img src={_option.logo} style={{ width: 20, height: 20, marginRight: 8 }} /> {_option.label}
                </label>
              })
            }
          </div>
        }
      </Modal.Body>
      <Modal.Footer className="form" style={{ borderTop: 'none', justifyContent: 'center', paddingTop: 0 }} >
        <div className="form-group">
          <button
            type="button"
            onClick={onHide}
            className="btn btn-light btn-elevate mr-3"
            style={{ width: 100 }}
          >
            {formatMessage({ defaultMessage: 'ĐÓNG' })}
          </button>
          {
            options.length == 0 ? <Link
              className={`btn btn-primary font-weight-bold`}
              style={{ width: 160 }}
              to='/setting/channels'
            >
              <span className="font-weight-boldest">{formatMessage({ defaultMessage: 'LIÊN KẾT NGAY' })}</span>
            </Link> :
              <button
                type="button"
                className="btn btn-primary btn-elevate"
                style={{ width: 100 }}
                disabled={!current}
                onClick={e => {
                  e.preventDefault()
                  onHide()
                  onChoosed(options.find(_opt => _opt.value == current))
                }}
              >
                {formatMessage({ defaultMessage: 'XÁC NHẬN' })}
              </button>
          }
        </div>
      </Modal.Footer>
    </Modal >
  );
}

export default injectIntl(memo(ChooseStoreDialog));