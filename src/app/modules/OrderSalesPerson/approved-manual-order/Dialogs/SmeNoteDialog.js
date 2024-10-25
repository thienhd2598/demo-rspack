import { Field, Formik } from 'formik'
import React from 'react'
import { Modal } from 'react-bootstrap'
import { useIntl } from 'react-intl';
import LoadingDialog from '../../../ProductsStore/product-new/LoadingDialog';
import { TextArea } from '../../../../../_metronic/_partials/controls';
import mutate_coUpdateOrderNote from '../../../../../graphql/mutate_coUpdateOrderNote'
import * as Yup from "yup";
import { useMutation } from "@apollo/client";
import { useToasts } from 'react-toast-notifications';


const SmeNoteDialog = ({ dataSmeNote, onHide }) => {
  const { formatMessage } = useIntl();
  const { addToast } = useToasts()
  const [addSmeNoteMutation, { loading }] = useMutation(mutate_coUpdateOrderNote, {
    refetchQueries: ['scGetPackages', 'scPackageAggregate']
  })

  return (
    <Formik
      enableReinitialize
      initialValues={{
        smeNote: dataSmeNote?.smeNote || '',
      }}
      onSubmit={async (values) => {
        const { data } = await addSmeNoteMutation({
          variables: {
            list_order_id: Array.isArray(dataSmeNote?.id) ? [...dataSmeNote?.id] : [dataSmeNote?.id],
            sme_note: values['smeNote']
          }
        })
        const notificationAction = (type, message) => {
          addToast(message, { appearance: type })
          onHide()
        }
        if (!!data?.coUpdateOrderNote?.success) {
          notificationAction('success', 'Cập nhật ghi chú người bán thành công')
        } else {
          notificationAction('error', 'Cập nhật ghi chú người bán thất bại')
        }
      }}

      validationSchema={Yup.object().shape({
        smeNote: Yup.string()
          .max(250, formatMessage({ defaultMessage: "Ghi chú người bán tối đa 250 ký tự." }))
          .test('chua-ky-tu-space-o-dau-cuoi', formatMessage({ defaultMessage: 'Ghi chú người bán không được chứa dấu cách ở đầu và cuối' }),
            (value, context) => {
              if (!!value) {
                return value.length == value.trim().length;
              }
              return false;
            },
          )
          .test('chua-ky-tu-2space',formatMessage({ defaultMessage: 'Ghi chú người bán không được chứa 2 dấu cách liên tiếp' }),
            (value, context) => {
              if (!!value) {
                return !(/\s\s+/g.test(value))
              }
              return false;
            },
          ),
      })}
    >
      {({ values, handleSubmit, isSubmitting }) => {
        return (
          <>
            <Modal size="lg"
              show={!!dataSmeNote}
              aria-labelledby="example-modal-sizes-title-sm"
              dialogClassName="modal-show-connect-product"
              centered
              onHide={onHide}
              backdrop={true}
            >
              <Modal.Header closeButton={loading}>
                <Modal.Title>
                  {(dataSmeNote?.edit && !dataSmeNote?.isView) ? formatMessage({ defaultMessage: 'Cập nhật ghi chú người bán' }) : (dataSmeNote?.edit && dataSmeNote?.isView) ? formatMessage({ defaultMessage: 'Ghi chú người bán' }) : formatMessage({ defaultMessage: 'Thêm ghi chú người bán' })}
                </Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <div>
                  <LoadingDialog show={loading} />
                  {Array.isArray(dataSmeNote?.id) && <div className='mb-2 bold'>Số lượng đơn đã chọn: {dataSmeNote?.id?.length}</div>}
                  <div className='mb-2 row'>

                    <div className="col-12">
                      <Field name={`smeNote`}
                        value={values['smeNote']}
                        component={TextArea}
                        disabled={!!dataSmeNote?.isView}
                        placeholder={formatMessage({defaultMessage: "Nhập ghi chú người bán"})}
                        label={""}
                        required={false}
                        customFeedbackLabel={" "}
                        cols={["col-0", "col-12"]}
                        countChar
                        rows={4}
                        maxChar={"250"} />
                    </div>
                  </div>

                </div>
              </Modal.Body>
              {!dataSmeNote?.isView ? (
                <Modal.Footer className="form" style={{ borderTop: "1px solid #dbdbdb", justifyContent: "end", addingTop: 10, paddingBottom: 10, }}>
                  <div className="form-group">
                    <button onClick={onHide} type="button" className="btn mr-3" style={{ width: 100, background: 'gray', color: "#fff" }}>
                      {formatMessage({ defaultMessage: 'Hủy bỏ' })}
                    </button>
                    <button disabled={isSubmitting} type="submit" onClick={handleSubmit} className="btn btn-primary btn-elevate mr-3" style={{ width: 100 }}>
                      {formatMessage({ defaultMessage: 'Lưu lại' })}
                    </button>
                  </div>
                </Modal.Footer>
              ) : (
                <Modal.Footer className="form" style={{ borderTop: "1px solid #dbdbdb", justifyContent: "end", addingTop: 10, paddingBottom: 10, }}>
                  <button onClick={onHide} type="button" className="btn btn-primary mr-3" style={{ width: 100, color: "#fff" }}>
                    {formatMessage({ defaultMessage: 'Đóng' })}
                  </button>
                </Modal.Footer>
              )}

            </Modal>
          </>
        )
      }}
    </Formik >
  )
}

export default SmeNoteDialog