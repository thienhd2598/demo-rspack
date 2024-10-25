import { Modal } from "react-bootstrap";
import React from "react";
import { toAbsoluteUrl } from "../../../../../_metronic/_helpers";
//! Modal chung cho tất cả các component

const ModalReason = ({
  openModal,
  setOpenModal,
  title,
  children,
  iconx = null,
  iconu = null,
}) => {
  return (
    <Modal
      show={true}
      aria-labelledby="example-modal-sizes-title-sm "
      centered
      className={` ${(openModal.openWarehouse || openModal.openWarehouseDetail) && "overwriteModal"}`}
      onHide={() =>
        setOpenModal({
          ...openModal,
          openMoreReason: false,
          openReasonReturn: false,
          openNoteWarehouse: false,
        })
      }
      backdrop={true}
      dialogClassName={"body-dialog-connect"}
    >
      <Modal.Header>
        <Modal.Title className="title__modal">{title}</Modal.Title>
        {!!iconx && openModal.openMoreReason && (
          <i
            onClick={() =>
              setOpenModal({
                ...openModal,
                openAddReason: true,
                openMoreReason: false,
              })
            }
            style={{ marginLeft: "auto", width: "14px", cursor: "pointer" }}
            role="button"
            className="ml-4 text-dark  far fa-edit"
          ></i>
        )}
        {!!iconu && openModal.openNoteWarehouse && (
          <i
            onClick={() =>
              setOpenModal({
                ...openModal,
                openNoteWarehouse: false,
                openAddNoteWarehouse: true,
              })
            }
            style={{ marginLeft: "auto", width: "14px", cursor: "pointer" }}
            role="button"
            className="ml-4 text-dark  far fa-edit"
          ></i>
        )}
      </Modal.Header>
      <Modal.Body className="cursor-default">
        {((iconx && !openModal.openMoreReason) ||
          (iconu && !openModal.openNoteWarehouse) ||
            openModal.openReasonReturn ||
            openModal.openWarehouse) && (
          <i
            className="fas fa-times"
            onClick={() =>
              setOpenModal({
                ...openModal,
                openMoreReason: false,
                openAddReason: false,
                openWarehouse: false,
                openReasonReturn: false,
                openNoteWarehouse: false,
                openAddNoteWarehouse: false,
              })
            }
            style={{
              position: "absolute",
              top: -45,
              right: 20,
              fontSize: 20,
              cursor: "pointer",
            }}
          />
        )}
        {children}
      </Modal.Body>
    </Modal>
  );
};

export default ModalReason;