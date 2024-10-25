import dayjs from "dayjs";
import { Field, Formik } from "formik";
import React, { useEffect, useMemo, useState } from "react";
import { Modal } from "react-bootstrap";
import { TextArea } from "../../../../../_metronic/_partials/controls";
import * as Yup from "yup";
import { mutation_coUpdateImportNote } from "../../refund-order/utils/graphqls";
import { useMutation } from "@apollo/client";
import { useToasts } from "react-toast-notifications";
import { useField, useFormikContext } from "formik";
import LoadingDialog from "../../../ProductsStore/product-new/LoadingDialog";
import { useIntl } from "react-intl";



const ModalRepositoryNote = ({ dataRepositoryNote, onHide }) => {
    const { addToast } = useToasts();
    const {formatMessage} = useIntl()
    const [isEdit, setIsEdit] = useState(!dataRepositoryNote?.import_note);
    const [coUpdateImportNote, { loading }] = useMutation(mutation_coUpdateImportNote, {
        awaitRefetchQueries: true,
        refetchQueries: ['scGetFailDeliveryOrders'],
    })

    return (
        <>
            {
                <LoadingDialog show={loading} />
            }
            <Formik
                initialValues={{ import_note: dataRepositoryNote?.import_note }}
                validationSchema={Yup.object().shape({
                    import_note: Yup.string()
                        .notRequired()
                        .max(255, formatMessage({defaultMessage:'Ghi chú tối đa 255 ký tự'}))
                })}
                onSubmit={async values => {
                    let variables = {
                        type_return: dataRepositoryNote.type_return,
                        return_obj_id: dataRepositoryNote.return_obj_id,
                        import_note: values?.import_note,
                    }

                    let { data } = await coUpdateImportNote({
                        variables: variables
                    })

                    if (data?.coUpdateImportNote?.success == 1) {
                        addToast(data?.coUpdateImportNote?.message, { appearance: 'success' });
                        onHide()
                    } else {
                        addToast(data?.coUpdateImportNote?.message, { appearance: 'error' });
                    }
                }}>


                {({
                    values,
                    handleSubmit,
                    validateForm,
                    setFieldValue
                }) => {
                    return (


                        <Modal
                            show={dataRepositoryNote}
                            aria-labelledby="example-modal-sizes-title-sm "
                            centered
                            onHide={onHide}
                            backdrop={true}
                            dialogClassName={'body-dialog-connect'}
                        >

                            <Modal.Header>
                                <Modal.Title>
                                    {dataRepositoryNote?.import_note ? formatMessage({defaultMessage:'Ghi chú nhập kho'}) : formatMessage({defaultMessage:'Thêm ghi chú nhập kho'})}

                                </Modal.Title><i
                                    onClick={
                                        () => {
                                            isEdit ? onHide() : setIsEdit(true)
                                        }
                                    }
                                    role="button" className={`ml-4 text-dark  ${isEdit ? 'fas fa-times' : 'far fa-edit'}`}></i>
                            </Modal.Header>
                            <Modal.Body className="overlay overlay-block cursor-default">
                                {isEdit ? (
                                    <div className="row">
                                        <div className="col-12">
                                            <Field
                                                name="import_note"
                                                component={TextArea}
                                                placeholder={formatMessage({defaultMessage:"Nhập ghi chú"})}
                                                label={''}
                                                required={false}
                                                customFeedbackLabel={' '}
                                                cols={['col-0', 'col-12']}
                                                countChar
                                                rows={4}
                                                maxChar={'255'}
                                            />
                                        </div>
                                    </div>

                                ) : (
                                    <div className="row">
                                        <div className="col-12 mb-3 fs-14">
                                            <span> {dataRepositoryNote?.import_note}</span>
                                        </div>
                                        <div className="col-12 mb-3 fs-14 text-right" style={{
                                            color: "#888484", fontWeight: "400",
                                            fontSize: "14px"
                                        }}>
                                            {formatMessage({defaultMessage:"Ngày cập nhật"})}: {dayjs(dataRepositoryNote?.updated_at).format(
                                                "DD/MM/YYYY HH:mm"
                                            )}
                                        </div>
                                    </div>
                                )}

                            </Modal.Body>
                            <Modal.Footer className="form" style={{ borderTop: '1px solid #dbdbdb', justifyContent: 'end', paddingTop: 10, paddingBottom: 10 }} >
                                <div className="form-group">
                                    {isEdit ? (
                                        <>
                                            <button
                                                type="button"
                                                onClick={onHide}
                                                className="btn btn-secondary mr-3"
                                                style={{ width: 100 }}
                                            >
                                                {formatMessage({defaultMessage:"Hủy"})}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleSubmit}
                                                className="btn btn-primary btn-elevate"
                                                style={{ width: 100 }}
                                            >
                                                {formatMessage({defaultMessage:"Lưu lại"})}
                                            </button>
                                        </>

                                    ) : (
                                        <button
                                            type="button"
                                            onClick={onHide}
                                            className="btn btn-primary btn-elevate"
                                            style={{ width: 100 }}
                                        >
                                            {formatMessage({defaultMessage:"Đóng"})}
                                        </button>
                                    )}

                                </div>
                            </Modal.Footer>
                        </Modal>
                    )
                }}

            </Formik>
        </>
    );
};

export default ModalRepositoryNote;
