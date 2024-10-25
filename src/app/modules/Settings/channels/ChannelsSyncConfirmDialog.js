import React, { useCallback, useMemo, useRef, useState } from "react";
import { Modal } from "react-bootstrap";
import { FormattedMessage, injectIntl, useIntl } from "react-intl";
import { Formik, Form } from "formik";
import op_connector_channels from '../../../../graphql/op_connector_channels'
import scSaleAuthorizationUrl from '../../../../graphql/scSaleAuthorizationUrl'
import scSaleAuthorizationGrant from '../../../../graphql/mutate_scSaleAuthorizationGrant'
import { useLazyQuery, useMutation, useQuery } from "@apollo/client";
import { Redirect, useHistory, useLocation, useRouteMatch } from "react-router";
import queryString from 'querystring'
import { useToasts } from 'react-toast-notifications';
import { Link, useParams } from "react-router-dom";
import mutate_scProductSyncDown from "../../../../graphql/mutate_scProductSyncDown";


function ChannelsSyncConfirmDialog({ show, onHide, path }) {
  const params = useParams()
  const {formatMessage} = useIntl()
  const [scProductSyncDown] = useMutation(mutate_scProductSyncDown, {
    refetchQueries: ['sc_store', 'sc_stores'],
    awaitRefetchQueries: true
  })
  return (
    <Modal
      show={show}
      onHide={onHide}
      aria-labelledby="example-modal-sizes-title-lg"
      centered
      dialogClassName='width-fit-content'
    >
      <Modal.Body className="overlay overlay-block cursor-default text-center" style={{ width: 500 }} >
        <div className="mb-6" >{formatMessage({defaultMessage:'Bạn muốn lưu tất cả các sản phẩm hay chỉ lưu 1 số sản phẩm của gian hàng xuống UpBase'})}?</div>
        <div  >
          <Link
            type="button"
            className="btn btn-light mr-3"
            style={{ flex: 1 }}
            to={(path || "").replace(':id', params.shopID || params.id)}
          >
            <span className="font-weight-boldest" style={{ textTransform: 'uppercase' }} >{formatMessage({defaultMessage:'Lưu xuống UpBase 1 phần'})}</span>
          </Link>
          <button
            className={`btn btn-primary font-weight-bold px-9 `}
            style={{ flex: 1 }}
            onClick={() => {
              scProductSyncDown({
                variables: {
                  store_id: parseInt(params.shopID || params.id),
                  products: []
                }
              })
              onHide()
            }}
          >
            <span className="font-weight-boldest" style={{ textTransform: 'uppercase' }}>{formatMessage({defaultMessage:'Lưu xuống UpBase tất cả'})}</span>
          </button>
        </div>
      </Modal.Body>
    </Modal >
  );
}

export default ChannelsSyncConfirmDialog;