import React, {useCallback} from "react";
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
              "Hệ thống sẽ xoá tất cả các đơn hàng đang nhập/quét hiện tại, bạn có muốn tiếp tục?",
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

export const ModalConfirmDeleteOrder = ({ setInitialForm, state, updateState, show }) => {
  const { formatMessage } = useIntl();
  
  const deleteOrder = useCallback(() => {
    try {
        const dataScanFiltered = state.dataScaned.filter(__order => {
          const {other, products} = __order
          if (other.id == state.key) {
            const init = products.map((item, indexVariant) => {
              if (item.sc_variant_product.orderItem?.is_combo) {
                const comboItems = item.sme_variant_product.combo_items;
                return comboItems.map((__comboItem, indexCombo) => `${other.id}-variant-${__comboItem?.id}-combo-quantity-${indexCombo}-${indexVariant}`);
              } else {
                return `${other.id}-variant-${item.sme_variant_product.id}-${indexVariant}-quantity`;
              }
            }).flat();
            console.log('init', init)
            setInitialForm((prev) => {
              Object.keys(prev).forEach(e => {
                if(init.includes(e)) {
                  delete prev[e]
                }
              })
              return prev
            });
          }
            if(other.id !== state.key) {
            
            return __order
            }
        })
        const removeNote = state.dataNote.filter(note => note.key !== state.key)
        updateState({dataScaned: dataScanFiltered ,dataNote: [...removeNote], modalConfirmDelete: false, key: null})
    } catch(err) {

    }
  }, [state.key])
  return (
    <Modal onHide={() => updateState({modalConfirmDelete: false, key: null})} show={show} aria-labelledby="example-modal-sizes-title-lg" centered>
      <Modal.Body className="overlay overlay-block cursor-default text-center">
        <div className="mb-6">{formatMessage({defaultMessage: "Bạn có muốn xoá đơn hàng này không?"})}</div>
        <div>
          <button onClick={() => updateState({modalConfirmDelete: false, key: null})} className="btn btn-secondary mr-4" style={{ width: 150 }}>
            {formatMessage({ defaultMessage: "Huỷ" })}
          </button>
          <button onClick={deleteOrder} className="btn btn-primary" style={{ width: 150 }}>
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
      <Modal onHide={() => updateState({modalConfirmImport: false})} show={show} aria-labelledby="example-modal-sizes-title-lg" centered>
      <Modal.Body className="overlay overlay-block cursor-default text-center">
        <div className="mb-6">{formatMessage({defaultMessage: "Bạn có xác nhận chắc chắn xử lý hàng loạt các đơn huỷ bất thường này không?"})}</div>
        <div>
          <button onClick={() => updateState({modalConfirmImport: false})} className="btn btn-secondary mr-4" style={{ width: 150 }}>
            {formatMessage({ defaultMessage: "Không" })}
          </button>
          <button onClick={() => {
            handleSubmit()
            updateState({modalConfirmImport: false})
          }} className="btn btn-primary" style={{ width: 150 }}>
            {formatMessage({ defaultMessage: "Xác nhận" })}
          </button>
        </div>
      </Modal.Body>
    </Modal>
    </>
  );
};

export const ModalNotification = ({show, updateState}) => {
  const { formatMessage } = useIntl();
return (
  <Modal onHide={() => updateState({modalNotification: false})} show={show} aria-labelledby="example-modal-sizes-title-lg" centered>
    <Modal.Body className="overlay overlay-block cursor-default text-center">
      <div className="mb-6">{formatMessage({defaultMessage: "Vui lòng nhập đơn hàng"})}</div>
      <div>
        <button onClick={() => updateState({modalNotification: false})} className="btn btn-secondary mr-4" style={{ width: 150 }}>
          {formatMessage({ defaultMessage: "Đóng" })}
        </button>
      </div>
    </Modal.Body>
  </Modal>
)
}