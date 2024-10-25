import React from "react";
import { Modal } from "react-bootstrap";
import { useIntl } from "react-intl";
import WarehouseModal from "../refund-order/ModalReason/WarehouseModal";

import query_sc_stores_basic from "../../../../graphql/query_sc_stores_basic";
import { useQuery } from "@apollo/client";

const ImportWarehouseDialog = ({refetchDetail, currentStatus, show, order, onHide }) => {
  const { formatMessage } = useIntl();
  const { data: dataStore} = useQuery(query_sc_stores_basic, { fetchPolicy: "cache-and-network" });
  
  return (
    <Modal
      size="lg"
      show={show}
      className="overwriteModal"
      aria-labelledby="example-modal-sizes-title-sm"
      dialogClassName="modal-show-connect-product"
      centered
      onHide={onHide}
      backdrop={true}
    >
      <Modal.Header>
        <Modal.Title>
          {formatMessage({ defaultMessage: "Xử lý trả hàng" })}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div>
             <WarehouseModal
             refetchDetail={refetchDetail}
             setOpenModal={() => onHide()}
             orderProcess={order}
             dataStore={dataStore?.sc_stores}
           />
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default ImportWarehouseDialog;
