import React, { useEffect, useMemo, useState } from "react";
import { useMutation } from "@apollo/client";
import mutate_coUpdateReturnOrderReason from "../../../../../../../graphql/mutate_coUpdateReturnOrderReason";
import { Modal } from "react-bootstrap";
import Select from "react-select";
import { useToasts } from "react-toast-notifications";
// import { RETURN_TYPES } from "../../../utils/contants";
import "../../../utils/index.scss";
import { Field, Formik } from "formik";
import * as Yup from "yup";
import { TextArea } from "../../../../../../../_metronic/_partials/controls";
import 'video-react/dist/video-react.css';
import { useIntl } from "react-intl";
//! Modal nguyên nhân bổ sung và sửa nguyên nhân
export const MoreReason = ({
  data,
  refetch,
  setOpenModal,
  idOrder,
  openModal,
}) => {
  const {formatMessage} = useIntl()
  const RETURN_TYPES = [
    {
      value: "1",
      label: formatMessage({defaultMessage:"Sản phẩm"}),
    },
    {
      value: "2",
      label: formatMessage({defaultMessage:"Xử lý đơn hàng"}),
    },
    {
      value: "3",
      label: formatMessage({defaultMessage:"Đơn vị vận chuyển"}),
    },
    {
      value: "4",
      label: formatMessage({defaultMessage:"Người mua"}),
    },
  ];

  const findOrderReturn = data?.find((or) => or.id == idOrder.id);

  const [reasonType, setReasonType] = useState(
    findOrderReturn?.sme_reason_type || "1"
  );
  function checkReturnType(type) {
    if (type == 1) {
      return formatMessage({defaultMessage:"Sản phẩm"});
    }
    if (type == 2) {
      return formatMessage({defaultMessage:"Xử lý đơn hàng"});
    }
    if (type == 3) {
      return formatMessage({defaultMessage:"Đơn vị vận chuyển"});
    }
    if (type == 4) {
      return formatMessage({defaultMessage:"Người mua"});
    }
    return "";
  }
  const [initialForm, setInitialForm] = useState({});
  const [validateSchema, setValidateSchema] = useState(null);
  const { addToast } = useToasts();

  const [updateReasonOrder, { loading }] = useMutation(
    mutate_coUpdateReturnOrderReason
  );
  useMemo(() => {
    setInitialForm((prev) => ({
      ...prev,
      reasonType: reasonType,
      note: findOrderReturn?.sme_reason_text || '',
    }));
  }, [findOrderReturn, reasonType]);
  useMemo(async () => {
    let [schema] = [
      {
        note: Yup.string()
          .notRequired()
          .max(255, formatMessage({defaultMessage:"Ghi chú tối đa 255 ký tự"})).nullable(),
      },
      {},
    ];
    setValidateSchema(Yup.object().shape(schema));
  }, [idOrder]);

  return (
    <>
      {openModal.openMoreReason && !openModal.openAddReason && (
        <>
          <div className="flex align-items-center">
            <p
              style={{
                fontWeight: 400,
                fontSize: "16px",
                lineHeight: "150%",
                color: "#212529",
              }}
              className="mb-4"
            >
              {formatMessage({defaultMessage: 'Lỗi do'})}: {checkReturnType(findOrderReturn?.sme_reason_type)}
            </p>
            <p
              style={{
                fontWeight: 400,
                fontSize: "16px",
                lineHeight: "150%",
                color: "#212529",
                wordWrap: "break-word",
              }}
              className="mb-2"
            >
              {formatMessage({defaultMessage: 'Ghi chú'})}: {findOrderReturn?.sme_reason_text}
            </p>
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
                className="btn btn-primary btn-elevate mr-3"
                style={{ width: 100 }}
                onClick={() =>
                  setOpenModal({
                    ...openModal,
                    openMoreReason: false,
                    openAddReason: false,
                  })
                }
              >
                {formatMessage({defaultMessage: 'Đóng'})}
              </button>{" "}
            </div>
          </Modal.Footer>
        </>
      )}

      {openModal.openAddReason && !openModal.openMoreReason && (
        <>
          <Formik
            initialValues={initialForm}
            validationSchema={validateSchema}
            onSubmit={async (values) => {
              const variants = {
                return_order_id: +idOrder.id,
                sme_reason_text: values.note,
                sme_reason_type: +reasonType,
              };
              const { data } = await updateReasonOrder({
                variables: variants,
              });
              if (data.coUpdateReturnOrderReason.success == 1) {
                refetch();
                addToast(data.coUpdateReturnOrderReason.message, {
                  appearance: "success",
                });
                setOpenModal({
                  ...openModal,
                  openAddReason: false,
                  openMoreReason: openModal.checkOpenModalElse ? false : true,
                });
                return;
              }
              if (data.coUpdateReturnOrderReason.success == 0) {
                addToast(data.coUpdateReturnOrderReason.message, {
                  appearance: "error",
                });
                return;
              }
            }}
          >
            {({values, handleSubmit}) => {
              return (
                <div className="flex align-items-center">
                  <div className="row mb-2">
                    <div className="col-2 text-right">
                      <span style={{ width: "15%", marginRight: "7px" }}>
                        {" "}
                        {formatMessage({defaultMessage: 'Lỗi do'})}:{" "}
                      </span>
                    </div>
                    <div className="col-10">
                      <Select
                        options={RETURN_TYPES}
                        className="w-100 custom-select-order"
                        value={RETURN_TYPES.find(
                          (_op) => _op.value == reasonType
                        )}
                        onChange={(value) => {
                          setReasonType(+value.value);
                        }}
                        formatOptionLabel={(option, labelMeta) => {
                          return <div>{option.label}</div>;
                        }}
                      />
                    </div>
                  </div>
                  <div className="row mb-2">
                    <div className="col-2 text-right">
                      <span style={{ width: "15%", marginRight: "7px" }}>
                        {" "}
                        {formatMessage({defaultMessage: 'Ghi chú'})}:{" "}
                      </span>
                    </div>
                    <div className="col-10">
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
                            openAddReason: false,
                            openMoreReason: openModal.checkOpenModalElse
                              ? false
                              : true,
                          })
                        }
                      >
                        {formatMessage({defaultMessage: 'Huỷ'})}
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary btn-elevate mr-3"
                        style={{ width: 100 }}
                        onClick={handleSubmit}
                        disabled={loading}
                      >
                        {formatMessage({defaultMessage: 'Lưu lại'})}
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
};