import React, { memo, useCallback, useMemo, useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  CardHeaderToolbar,
} from "../../../../_metronic/_partials/controls";
import { ProductsFilter } from "./filter/ProductsFilter";
import { ProductsTable } from "./ProductsTable";
import { useProductsUIContext } from "../ProductsUIContext";
import { FormattedMessage, useIntl } from "react-intl";
import { Modal } from "react-bootstrap";
import { useMutation } from "@apollo/client";
import mutate_userHideProduct from "../../../../graphql/mutate_userHideProduct";
import mutate_scProductSyncDown from "../../../../graphql/mutate_scProductSyncDown";
import { useToasts } from "react-toast-notifications";
import mutate_scProductRemoveOnStore from "../../../../graphql/mutate_scProductRemoveOnStore";

export default memo(() => {
  const [confirmSyncDownId, setConfirmSyncDownId] = useState(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const { messages, formatMessage } = useIntl()
  const { addToast } = useToasts();

  const [scProductRemoveOnStore] = useMutation(mutate_scProductRemoveOnStore, {
    refetchQueries: ['ScGetSmeProducts', 'scStatisticScProducts']
  })
  const [scProductSyncDown] = useMutation(mutate_scProductSyncDown, {
    refetchQueries: ['ScGetSmeProducts'],
    // awaitRefetchQueries: true
  })

  const _deleteProduct = useCallback((ids) => {
  }, [])

  const _hideProduct = useCallback(async (params) => {
    setShowConfirm({
      message: params.action_type == 1 ? formatMessage({defaultMessage:'Bạn có chắc chắn muốn xoá sản phẩm này?'}) : (params.action_type == 2 ? formatMessage({defaultMessage:'Bạn có chắc chắn muốn ẩn sản phẩm này?'}) : formatMessage({defaultMessage:'Bạn có chắc chắn muốn hiện sản phẩm này?'})),
      message_success: params.action_type == 1 ? formatMessage({defaultMessage:'Xoá sản phẩm thành công'}) : (params.action_type == 2 ? formatMessage({defaultMessage:'Ẩn sản phẩm thành công'}) : formatMessage({defaultMessage:'Hiện sản phẩm thành công'})),
      params: params,
      titleConfirm: params.action_type == 1 ? formatMessage({defaultMessage:'Có, xoá'}) : formatMessage({defaultMessage:'Tiếp tục'}),
    })
  }, [])
  return (
    <Card>
      <CardHeader title={formatMessage({defaultMessage:'Sản phẩm trên sàn'})}>
      </CardHeader>
      <CardBody>
        <ProductsFilter
          onDelete={_deleteProduct}
          onHide={_hideProduct}
        />
        <ProductsTable
          onDelete={_deleteProduct}
          onHide={_hideProduct}
          onConfirmSyncDown={setConfirmSyncDownId}
        />
      </CardBody>
      <Modal
        show={!!showConfirm}
        aria-labelledby="example-modal-sizes-title-lg"
        centered
        onHide={() => setShowConfirm(null)}
      >
        <Modal.Body className="overlay overlay-block cursor-default text-center">
          <div className="mb-4" >{showConfirm?.message}</div>

          <div className="form-group mb-0">
            <button
              className="btn btn-light btn-elevate mr-3"
              style={{ width: 90 }}
              onClick={() => setShowConfirm(null)}
            >
              <span className="font-weight-boldest">{formatMessage({defaultMessage:'Huỷ'})}</span>
            </button>
            <button
              className={`btn btn-primary font-weight-bold`}
              style={{ width: 90 }}
              onClick={async () => {
                setShowConfirm(null)
                let res = await scProductRemoveOnStore({
                  variables: showConfirm.params
                })
                if (res.data?.scProductRemoveOnStore?.success) {
                  addToast(showConfirm.message_success, { appearance: 'success' });
                } else {
                  addToast(res.data?.scProductRemoveOnStore?.message || res.errors[0].message, { appearance: 'error' });
                }
              }}
            >
              <span className="font-weight-boldest">{showConfirm?.titleConfirm}</span>
            </button>
          </div>
        </Modal.Body>
      </Modal >
      <Modal
        show={!!confirmSyncDownId}
        aria-labelledby="example-modal-sizes-title-lg"
        centered
        onHide={() => setConfirmSyncDownId(null)}
      >
        <Modal.Body className="overlay overlay-block cursor-default text-center">
          <div className="mb-4" >{formatMessage({defaultMessage:'Sản phẩm chưa được lưu xuống UpBase. Bạn có muốn lưu sản phẩm này xuống UpBase không'})}?</div>

          <div className="form-group mb-0">
            <button
              className="btn btn-light btn-elevate mr-3"
              style={{ width: 90 }}
              onClick={() => setConfirmSyncDownId(null)}
            >
              <span className="font-weight-boldest">{formatMessage({defaultMessage:'Không'})}</span>
            </button>
            <button
              className={`btn btn-primary font-weight-bold`}
              style={{ width: 90 }}
              onClick={async () => {
                let res = await scProductSyncDown({
                  variables: confirmSyncDownId
                })
                if (!!res?.data?.scProductSyncDown?.success) {
                  addToast(formatMessage({defaultMessage:'Bắt đầu lưu xuống UpBase'}), { appearance: 'success' });
                } else {
                  addToast(res?.data?.scProductSyncDown?.message || res.errors[0].message, { appearance: 'error' });
                }
                setConfirmSyncDownId(null)
              }}
            >
              <span className="font-weight-boldest">{formatMessage({defaultMessage:'Đồng ý'})}</span>
            </button>
          </div>
        </Modal.Body>
      </Modal >
    </Card>
  );
}
)