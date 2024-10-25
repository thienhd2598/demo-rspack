import React, { useMemo, useState } from 'react'
import { Formik, Field } from 'formik'
import { useIntl } from 'react-intl'
import { Modal } from 'react-bootstrap'
import * as Yup from 'yup'
import { TooltipWrapper } from '../common/TooltipWrapper'
import { CREATION_METHODS } from '../common/Constants'
import { formatNumberToCurrency } from '../../../../../utils'
import { toAbsoluteUrl } from '../../../../../_metronic/_helpers'
import { RadioGroup } from '../../../../../_metronic/_partials/controls/forms/RadioGroup'
import { TextArea } from '../../../../../_metronic/_partials/controls'
import { detailOrder } from '../components/Details/Table/RowTable'
import mutate_processSettlement from '../../../../../graphql/mutate_processSettlement'
import { useMutation } from '@apollo/client'
import ConfirmDialog from './ConfirmDialog'
import { useToasts } from 'react-toast-notifications'
import { ResultDialog } from './ResultDialog'
import LoadingDialog from '../../../ProductsStore/product-new/LoadingDialog'


const ProcessDialog = ({ show, onHide, ids, setIds }) => {
  const { formatMessage } = useIntl()
  const { addToast } = useToasts()

  const [initialValues, setInitialValues] = useState({});
  const [initValidate, setInitValidate] = useState({})

  const [selectedIdItem, setSelectedIdItem] = useState({})
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [dataProcessed, setDataProcessed] = useState()

  useMemo(() => {
    let initValueItem = []
    let validateItem = []
    let dataForm = []
    ids.forEach(item => {
      let itemForm = {}
      itemForm['order_id'] = item.order_id
      itemForm['id'] = item.id
      itemForm['order_ref_id'] = item.order_ref_id
      itemForm['settlement_amount_estimate'] = item.settlement_amount_estimate
      itemForm['settlement_amount'] = item.settlement_amount
      itemForm['settlement_amount_adjustment'] = item.settlement_amount_adjustment
      dataForm.push(itemForm)
      initValueItem[`item-process-${item.id}-note`] = ''
      initValueItem[`item-process-${item.id}-settlement_type_selected`] = 2
      validateItem[`item-process-${item.id}-note`] = Yup.string().notRequired().max(550, formatMessage({ defaultMessage: "Nhập tối đa 550 kí tự." }))
    })

    setInitialValues(prev => ({
      ...prev,
      ...initValueItem,
      dataForm
    }));
    setInitValidate(Yup.object().shape(validateItem));
  }, [ids])

  const [processSettlementMutate, { loading }] = useMutation(
    mutate_processSettlement,
    {
      awaitRefetchQueries: true,
    }
  );
  return (
    <Formik
      enableReinitialize
      initialValues={initialValues}
      validationSchema={initValidate}
      onSubmit={async (values) => {
        let list_abnormal = []
        values.dataForm.forEach(item => {
          let abnormal_obj = {}
          abnormal_obj['id'] = item.id
          abnormal_obj['order_ref_id'] = item.order_ref_id
          abnormal_obj['settlement_type_selected'] = +values[`item-process-${item.id}-settlement_type_selected`]
          abnormal_obj['settlement_note'] = values[`item-process-${item.id}-note`]
          list_abnormal.push(abnormal_obj)
        })

        let { data } = await processSettlementMutate({
          variables: { list_abnormal },
        });
        if (!!data?.processSettlementAbnormal.success) {
          addToast(data?.processSettlementAbnormal?.message || '', { appearance: 'success' })
          setDataProcessed(data?.processSettlementAbnormal)
          values['dataForm'] = []
          setIds([])
          return
        } else {
          addToast(formatMessage({ defaultMessage: 'Có lỗi xảy ra.' }) || '', { appearance: 'error' })
          return
        }
      }}
    >
      {({ values, handleSubmit }) => {
        return (
          <>
            <LoadingDialog show={loading} />

            <ConfirmDialog isDelete={true} title={formatMessage({ defaultMessage: "Bạn có muốn xoá phiếu này không?" })} setInitialValues={setInitialValues}
              selectedIdItem={selectedIdItem}
              initValidate={initValidate}
              onHide={() => setConfirmDelete(false)}
              show={confirmDelete} />

            <ConfirmDialog title={formatMessage({ defaultMessage: "Mọi thao tác hiện tại sẽ không được lưu lại, bạn có muốn tiếp tục?" })}
              onHide={() => {
                setConfirmReset(false)
              }}
              reset={() => {
                onHide()
                setInitialValues({})
                setInitValidate({})
              }}
              show={confirmReset} />

            {!!dataProcessed && (
              <ResultDialog closeProcessDialog={onHide} show={!!dataProcessed} dataProcessed={dataProcessed} onHide={() => setDataProcessed(false)} />
            )}
            <Modal size="lg"
              className='overwriteModal_income'
              show={show}
              aria-labelledby="example-modal-sizes-title-sm"
              dialogClassName="modal-show-connect-product"
              centered
              onHide={() => {
                if (!!values.dataForm.length) {
                  setConfirmReset(true)
                  return
                }
                onHide()
              }}
              backdrop={true}
            >
              <Modal.Header closeButton={true}>
                <Modal.Title>
                  {formatMessage({ defaultMessage: "Xử lý đối soát bất thường" })}
                </Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <div>
                  <table style={{ borderBottom: "1px solid #d9d9d9", borderTop: "1px solid #d9d9d9", }}
                    className="table product-list table-borderless fixed mb-0">
                    <thead style={{
                      position: 'sticky',
                      top: 0,
                      background: "#F3F6F9",
                      fontWeight: "bold",
                      fontSize: "13px",
                      zIndex: 10,
                      borderRight: "1px solid #d9d9d9",
                      borderLeft: "1px solid #d9d9d9"
                    }}>
                      <tr>
                        <th className='text-center' style={{ width: '150px', fontSize: '14px' }}>{formatMessage({ defaultMessage: 'Mã đơn hàng' })}</th>
                        <th style={{ width: '150px', fontSize: '14px' }}>
                          {formatMessage({ defaultMessage: 'Số tiền sàn quyết toán' })}
                          <TooltipWrapper note={formatMessage({ defaultMessage: "Số tiền sàn đã quyết  toán về ví." })}>
                            <i className="fas fa-info-circle fs-14 ml-2"></i>
                          </TooltipWrapper>
                        </th>
                        <th style={{ width: '150px', fontSize: '14px' }} className='text-center'>
                          {formatMessage({ defaultMessage: 'Số tiền quyết toán ước tính' })}
                          <TooltipWrapper note={formatMessage({ defaultMessage: "Số tiền thanh toán ước tính = Giá gốc + Trợ giá và giảm giá từ người bán - phí nền tảng - Chênh lệch - Hoa hồng liên kết - Hoàn tiền." })}>
                            <i className="fas fa-info-circle fs-14 ml-2"></i>
                          </TooltipWrapper>
                        </th>
                        <th style={{ width: '150px', fontSize: '14px' }} className='text-center'>
                          {formatMessage({ defaultMessage: 'Số tiền chênh lệch' })}
                          <TooltipWrapper note={formatMessage({ defaultMessage: "Số tiền chênh lệch = Số tiền sàn quyết toán - Số tiền quyết toán ước tính." })}>
                            <i className="fas fa-info-circle fs-14 ml-2"></i>
                          </TooltipWrapper>
                        </th>
                        <th style={{ width: '200px', fontSize: '14px' }} className='text-center'>{formatMessage({ defaultMessage: 'Xử lý' })}</th>
                        <th style={{ width: '370px', fontSize: '14px' }} className='text-center'>{formatMessage({ defaultMessage: 'Ghi chú' })}</th>
                        <th style={{ width: '100px', fontSize: '14px' }} className='text-center'></th>
                      </tr>
                    </thead>
                    <tbody>
                      {values?.dataForm?.map(item => (
                        <tr key={`item-process-${item.id}`}>
                          <td className="text-center vertical-top">
                            <span style={{ cursor: 'pointer' }} onClick={() => detailOrder(item?.order_id)}>{item?.order_ref_id}</span>
                          </td>
                          <td className="text-center vertical-top">
                            <div className='d-flex justify-content-center align-items-center flex-column'>
                              {formatNumberToCurrency(item.settlement_amount)}đ
                              {values[`item-process-${item.id}-settlement_type_selected`] == 2 && (
                                <>
                                  <img style={{ width: '20px' }} src={toAbsoluteUrl('/media/arrow-down.svg')} alt=""></img>
                                  <span style={{ color: '#FF5629' }}>{formatNumberToCurrency(item.settlement_amount_estimate)}đ</span>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="text-center vertical-top">
                            <div className='d-flex justify-content-center align-items-center flex-column'>
                              <span>{formatNumberToCurrency(item.settlement_amount_estimate)}đ</span>
                              {values[`item-process-${item.id}-settlement_type_selected`] == 1 && (
                                <>
                                  <img style={{ width: '20px' }} src={toAbsoluteUrl('/media/arrow-down.svg')} alt=""></img>
                                  <span style={{ color: '#FF5629' }}>{formatNumberToCurrency(item.settlement_amount)}đ</span>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="text-center vertical-top">{formatNumberToCurrency(item.settlement_amount_adjustment)}đ</td>
                          <td className="text-center vertical-top">
                            <Field name={`item-process-${item.id}-settlement_type_selected`}
                              component={RadioGroup}
                              value={values[`item-process-${item.id}-settlement_type_selected`]}
                              customFeedbackLabel={" "}
                              options={CREATION_METHODS}></Field>
                          </td>
                          <td className="text-center vertical-top">
                            <Field name={`item-process-${item.id}-note`} value={values[`item-process-${item.id}-note`] || ''}
                              component={TextArea}
                              placeholder={formatMessage({
                                defaultMessage: "Nhập ghi chú",
                              })}
                              label={""}
                              required={false}
                              customFeedbackLabel={" "}
                              cols={["col-0", "col-12"]}
                              countChar
                              rows={2}
                              maxChar={"550"} />
                          </td>
                          <td>
                            <div className='mt-12 d-flex align-items-center justify-content-center'>
                              <img
                                onClick={() => {
                                  setConfirmDelete(true)
                                  setSelectedIdItem(item.id)
                                }}
                                style={{ width: "14px", cursor: "pointer" }}
                                src={toAbsoluteUrl("/media/trash_solid.svg")}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}

                    </tbody>
                  </table>
                </div>
              </Modal.Body>
              <Modal.Footer className="form" style={{ borderTop: "1px solid #dbdbdb", justifyContent: "end", addingTop: 10, paddingBottom: 10, }}>
                <div className="form-group">
                  <button onClick={() => {
                    if (!!values.dataForm.length) {
                      setConfirmReset(true)
                      return
                    }
                    onHide()
                  }} type="button" className="btn btn mr-3" style={{ width: 100, border: "1px solid #ff5629", color: "#ff5629" }}>
                    {formatMessage({ defaultMessage: "Hủy bỏ" })}
                  </button>
                  <button disabled={values.dataForm?.length == 0} type="submit" onClick={handleSubmit} className="btn btn-primary btn-elevate mr-3" style={{ width: 100 }}>
                    {formatMessage({ defaultMessage: "Xử lý" })}
                  </button>
                </div>
              </Modal.Footer>
            </Modal>
          </>
        )
      }}
    </Formik>
  )
}

export default ProcessDialog