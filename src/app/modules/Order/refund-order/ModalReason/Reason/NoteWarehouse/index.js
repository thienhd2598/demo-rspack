import dayjs from "dayjs";
import { useMutation } from "@apollo/client";
import { useToasts } from "react-toast-notifications";
import React, { useState, memo, useEffect } from "react";
import { Modal } from "react-bootstrap";
import { mutation_coUpdateImportNote } from "../../../utils/graphqls";
import "../../../utils/index.scss";
import { TextArea } from "../../../../../../../_metronic/_partials/controls";
import { Field, Formik } from "formik";
import * as Yup from "yup";
import { useMemo } from "react";
import { useIntl } from "react-intl";
//! Modal ghi chú nhập kho và sửa ghi chú nhập kho
const NoteWarehouse = memo(
  ({ data, idOrder, openModal, setOpenModal, refetch }) => {
    const {formatMessage} = useIntl()
    const { addToast } = useToasts();
    const [initialForm, setInitialForm] = useState({});
    const [validateSchema, setValidateSchema] = useState(null);
    const [reasonText, setReasonText] = useState("");
    const findOrderReturn = data?.find((or) => or.id == idOrder.id);
    useMemo(() => {
      setInitialForm((prev) => ({
        ...prev,
        note: reasonText,
      }));
    }, [reasonText]);
    useMemo(async () => {
      let [schema] = [
        {
          note: Yup.string()
            .notRequired()
            .max(255, formatMessage({defaultMessage: "Ghi chú tối đa 255 ký tự"})).nullable()
        },
        {},
      ];
      setValidateSchema(Yup.object().shape(schema));
    }, [idOrder]);
    //! Mutation sửa ghi chú nhập kho
    const [updateImportNote, { loading }] = useMutation(
      mutation_coUpdateImportNote
    );

    //! Lấy nguyên nhân
    useEffect(() => {
      setReasonText(findOrderReturn?.returnWarehouseImport.import_note);
    }, [findOrderReturn]);

    return (
      <>
        {openModal.openNoteWarehouse && !openModal.openAddNoteWarehouse && (
          <div className="flex align-items-center">
            <span
              style={{
                fontWeight: "400",
                fontSize: "16px",
                lineHeight: "150%",
                color: "#212529",
                wordWrap: "break-word",
              }}
            >
              {findOrderReturn?.returnWarehouseImport?.import_note}
            </span>
            <p
              className="mt-2"
              style={{
                fontWeight: "400",
                fontSize: "14px",
                lineHeight: "150%",
                textAlign: "right",
                color: "#888484",
              }}
            >
              {formatMessage({defaultMessage: "Ngày cập nhật"})}:{" "}
              {findOrderReturn?.returnWarehouseImport
                ? dayjs(
                    findOrderReturn?.returnWarehouseImport?.updated_at
                  ).format("DD/MM/YYYY HH:mm")
                : "--"}
            </p>
            <Modal.Footer
              className="form"
              style={{
                borderTop: "1px solid #dbdbdb",
                justifyContent: "end",
                paddingTop: 10,
                paddingBottom: 10,
              }}
            >
              <div className="form-group">
                {" "}
                <button
                  type="button"
                  className="btn btn-primary btn-elevate mr-3"
                  style={{ width: 100 }}
                  onClick={() =>
                    setOpenModal({
                      ...openModal,
                      openNoteWarehouse: false,
                      openAddNoteWarehouse: false,
                    })
                  }
                >
                  {formatMessage({defaultMessage: "Đóng"})}
                </button>{" "}
              </div>
            </Modal.Footer>
          </div>
        )}
        {openModal.openAddNoteWarehouse && !openModal.openNoteWarehouse && (
          <>
            <Formik
              initialValues={initialForm}
              validationSchema={validateSchema}
              onSubmit={async (values) => {
                const variants = {
                  type_return: idOrder?.returnWarehouseImport.type_return,
                  return_obj_id: idOrder?.returnWarehouseImport.return_obj_id,
                  import_note: values.note,
                };
                const { data } = await updateImportNote({
                  variables: variants,
                });
                if (data.coUpdateImportNote.success == 1) {
                  addToast(data.coUpdateImportNote.message, {
                    appearance: "success",
                  });
                  setOpenModal({
                    ...openModal,
                    openAddNoteWarehouse: false,
                    openNoteWarehouse: openModal.checkOpenModalWarehouseELse
                      ? false
                      : true,
                  });
                  refetch();
                  return;
                }
                if (data.coUpdateImportNote.success == 0) {
                  addToast(data.coUpdateImportNote.message, {
                    appearance: "error",
                  });
                  setOpenModal({
                    ...openModal,
                    openAddNoteWarehouse: false,
                    openNoteWarehouse: openModal.checkOpenModalWarehouseELse
                      ? false
                      : true,
                  });
                  return;
                }
              }}
            >
              {({ values, handleSubmit }) => {
                return (
                  <div className="flex align-items-center">
                    <div className="row mb-2">
                      <div className="col-12">
                        <Field
                          name="note"
                          component={TextArea}
                          placeholder={formatMessage({defaultMessage: "Nhập ghi chú"})}
                          label={""}
                          value={values.note}
                          required={false}
                          customFeedbackLabel={" "}
                          cols={["col-0", "col-12"]}
                          countChar
                          rows={4}
                          maxChar={"255"}
                        />
                      </div>
                    </div>
                    <Modal.Footer
                      className="form"
                      style={{
                        borderTop: "1px solid #dbdbdb",
                        justifyContent: "end",
                        paddingTop: 10,
                        paddingBottom: 10,
                      }}
                    >
                      <div className="form-group">
                        {" "}
                        <button
                          type="button"
                          className="btn btn-secondary mr-3"
                          style={{ width: 100 }}
                          onClick={() =>
                            setOpenModal({
                              ...openModal,
                              openNoteWarehouse: openModal.checkOpenModalWarehouseELse
                                ? false
                                : true,
                              openAddNoteWarehouse: false,
                            })
                          }
                        >
                          {formatMessage({defaultMessage: "Huỷ"})}
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary btn-elevate mr-3"
                          style={{ width: 100 }}
                          stype={{ cursor: loading && "progress" }}
                          onClick={handleSubmit}
                          disabled={loading}
                        >
                          {formatMessage({defaultMessage: "Lưu lại"})}
                        </button>{" "}
                      </div>
                    </Modal.Footer>
                  </div>
                );
              }}
            </Formik>
          </>
        )}
      </>
    );
  }
);

export default NoteWarehouse;