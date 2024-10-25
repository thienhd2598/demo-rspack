import React, { useCallback } from "react";
import { Modal } from "react-bootstrap";
import { useIntl } from "react-intl";

export const ModalConfirmReset = ({
  clearAllInputValue,
  setFieldValue,
  values,
  setValidateSchema,
  updateState,
  show,
}) => {
  const { formatMessage } = useIntl();
  return (
    <Modal
      onHide={() => updateState({ modalConfirm: false })}
      show={show}
      aria-labelledby="example-modal-sizes-title-lg"
      centered
    >
      <Modal.Body className="overlay overlay-block cursor-default text-center">
        <div className="mb-6">
          {formatMessage({
            defaultMessage:
              "Hệ thống sẽ xoá tất cả các đơn hoàn đang nhập/quét hiện tại, bạn có muốn tiếp tục?",
          })}
        </div>
        <div>
          <button
            onClick={() => updateState({ modalConfirm: false })}
            className="btn btn-secondary mr-4"
            style={{ width: 150 }}
          >
            {formatMessage({ defaultMessage: "Huỷ" })}
          </button>
          <button
            onClick={() => {
              clearAllInputValue();
              setFieldValue("import_form_type", 2, true);
              setValidateSchema(null);
              updateState({
                modalConfirm: false,
                typeOptionScan: "tracking_number",
                typeOptionSearch: "tracking_number",
                dataNote: [],
                dataScaned: [],
                scanInputValue: "",
              });
            }}
            className="btn btn-primary"
            style={{ width: 150 }}
          >
            {formatMessage({ defaultMessage: "Đồng ý" })}
          </button>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export const ModalConfirmDeleteOrder = ({
  setInitialForm,
  state,
  updateState,
  show,
}) => {
  const { formatMessage } = useIntl();

  const deleteOrder = useCallback(() => {
    try {
      const dataScanFiltered = state.dataScaned.filter((__order) => {
        const { other, products } = __order;
        if (other.id == state.key) {
          const init = products.map((item, indexVariant) => {
            if (item.sc_variant_product.orderItem?.is_combo) {
              const comboItems = item.sme_variant_product.combo_items;
              return comboItems.map((__comboItem, indexCombo) => `${other.id}-variant-${__comboItem?.id}-combo-quantity-${indexCombo}-${indexVariant}`);
            } else {
              return `${other.id}-variant-${item.sme_variant_product.id}-${indexVariant}-quantity`;
            }
          }).flat();
          setInitialForm((prev) => {
           Object.keys(prev).forEach(e => {
              if(init.includes(e)) {
                delete prev[e]
              }
            })
            return prev
          });
        }
        if (other.id !== state.key) {
          return __order;
        }
      });

      const removeNote = state.dataNote.filter(
        (note) => note.key !== state.key
      );
      updateState({
        dataScaned: [...dataScanFiltered],
        dataNote: [...removeNote],
        modalConfirmDelete: false,
        key: null,
      });
    } catch (err) {}
  }, [state.key]);
  return (
    <Modal
      onHide={() => updateState({ modalConfirmDelete: false, key: null })}
      show={show}
      aria-labelledby="example-modal-sizes-title-lg"
      centered
    >
      <Modal.Body className="overlay overlay-block cursor-default text-center">
        <div className="mb-6">
          {formatMessage({
            defaultMessage: "Bạn có muốn xoá đơn hoàn này không ?",
          })}
        </div>
        <div>
          <button
            onClick={() =>
              updateState({ modalConfirmDelete: false, key: null })
            }
            className="btn btn-secondary mr-4"
            style={{ width: 150 }}
          >
            {formatMessage({ defaultMessage: "Huỷ" })}
          </button>
          <button
            onClick={deleteOrder}
            className="btn btn-primary"
            style={{ width: 150 }}
          >
            {formatMessage({ defaultMessage: "Có, Xoá" })}
          </button>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export const ModalConfirmImport = ({ handleSubmit, updateState, show }) => {
  const { formatMessage } = useIntl();
  return (
    <>
      <Modal
        onHide={() => updateState({ modalConfirmImport: false })}
        show={show}
        aria-labelledby="example-modal-sizes-title-lg"
        centered
      >
        <Modal.Body className="overlay overlay-block cursor-default text-center">
          <div className="mb-6">
            {formatMessage({
              defaultMessage:
                "Bạn có xác nhận chắc chắn xử lý hàng loạt các đơn hoàn này không?",
            })}
          </div>
          <div>
            <button
              onClick={() => updateState({ modalConfirmImport: false })}
              className="btn btn-secondary mr-4"
              style={{ width: 150 }}
            >
              {formatMessage({ defaultMessage: "KHÔNG" })}
            </button>
            <button
              onClick={() => {
                handleSubmit();
                updateState({ modalConfirmImport: false });
              }}
              className="btn btn-primary"
              style={{ width: 150 }}
            >
              {formatMessage({ defaultMessage: "XÁC NHẬN" })}
            </button>
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
};

export const ModalDetailCombo = ({ dataCombo, onHide }) => {
  const { formatMessage } = useIntl();
  return (
    <Modal
      show={!!dataCombo}
      aria-labelledby="example-modal-sizes-title-sm"
      centered
      onHide={onHide}
      backdrop={true}
      dialogClassName={"body-dialog-connect"}
    >
      <Modal.Header>
        <Modal.Title>
          {formatMessage({ defaultMessage: "Thông tin combo" })}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="overlay overlay-block cursor-default">
        <i
          className="fas fa-times"
          onClick={onHide}
          style={{
            position: "absolute",
            top: -45,
            right: 20,
            fontSize: 20,
            cursor: "pointer",
          }}
        />
        <div className="row">
          <div className="col-12">
            <table className="table table-borderless product-list  table-vertical-center fixed">
              <thead
                style={{
                  background: "rgb(243, 246, 249)",
                  borderRight: "1px solid #d9d9d9",
                  borderLeft: "1px solid #d9d9d9",
                }}
              >
                <tr className="font-size-lg">
                  <th style={{ fontSize: "14px" }} width="50%">
                    SKU
                  </th>
                  <th style={{ fontSize: "14px" }}>
                    {formatMessage({ defaultMessage: "Số lượng" })}
                  </th>
                </tr>
              </thead>
              <tbody>
                {dataCombo?.map((data) => {
                  return (
                    <tr key={`inventory-row-${data.variant_id}`}>
                      <td>{data?.combo_item.sku}</td>
                      <td>{data?.quantity}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer
        className="form"
        style={{
          borderTop: "1px solid #dbdbdb",
          justifyContent: "end",
          paddingTop: 10,
          paddingBottom: 10,
        }}
      ></Modal.Footer>
    </Modal>
  );
};

export const ModalNotification = ({ show, updateState }) => {
  const { formatMessage } = useIntl();
  return (
    <Modal
      onHide={() => updateState({ modalNotification: false })}
      show={show}
      aria-labelledby="example-modal-sizes-title-lg"
      centered
    >
      <Modal.Body className="overlay overlay-block cursor-default text-center">
        <div className="mb-6">
          {formatMessage({ defaultMessage: "Vui lòng nhập đơn hoàn" })}
        </div>
        <div>
          <button
            onClick={() => updateState({ modalNotification: false })}
            className="btn btn-secondary mr-4"
            style={{ width: 150 }}
          >
            {formatMessage({ defaultMessage: "Đóng" })}
          </button>
        </div>
      </Modal.Body>
    </Modal>
  );
};
