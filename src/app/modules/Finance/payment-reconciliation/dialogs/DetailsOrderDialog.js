import React from 'react'
import { Modal } from 'react-bootstrap'
import { useIntl } from 'react-intl'
import { Formik, Field } from 'formik'
import { RadioGroup } from '../../../../../_metronic/_partials/controls/forms/RadioGroup'
import { CREATION_METHODS } from '../common/Constants'
import { formatNumberToCurrency } from '../../../../../utils'
import { toAbsoluteUrl } from '../../../../../_metronic/_helpers'


const DetailsOrderDialog = ({ onHide, show, selectDetailsOrder }) => {

  const { formatMessage } = useIntl()

  return (
    <>
      <Modal size="lg"
        show={show}
        onHide={onHide}
        aria-labelledby="example-modal-sizes-title-sm"
        dialogClassName="modal-show-connect-product"
        centered
        backdrop={true}
      >
        <Modal.Header closeButton={false}>
          <Modal.Title>
            {formatMessage({ defaultMessage: "Chi tiết phiếu đã xử lý bất thường" })}
          </Modal.Title>
          <span>
            <i
              onClick={onHide}
              style={{ cursor: "pointer" }}
              className="drawer-filter-icon fas fa-times icon-md text-right"
            ></i>
          </span>
        </Modal.Header>
        <Modal.Body>
          <Formik
            initialValues={{radio_single: selectDetailsOrder.settlement_type_selected}}
          >
            {({ values }) => {
              return (
            <div>
              <div className='mb-4' style={{display: 'grid', gridTemplateColumns: '30% auto', gap: '5px 5px'}}>
                  <span className='text-right'>{formatMessage({ defaultMessage: "Số tiền nền tảng quyết toán"})}:</span>
                  <div className='d-flex align-items-center'>
                    <span>{formatNumberToCurrency(selectDetailsOrder?.settlement_amount)}</span>
                    {selectDetailsOrder.settlement_type_selected == 2 && (
                      <>
                      <img className="ml-3" src={toAbsoluteUrl('/media/arrow-right.svg')} alt=""></img>
                      <span style={{color: '#FF5629', marginLeft: '5px'}}>{formatNumberToCurrency(selectDetailsOrder?.settlement_amount_estimate)}</span>
                      </>
                    )}
                  </div>
              </div>
              <div className='mb-4' style={{display: 'grid', gridTemplateColumns: '30% auto', gap: '5px 5px'}}>
                  <span className='text-right'>{formatMessage({ defaultMessage: "Số tiền quyết toán dự tính"})}:</span>
                  <div className='d-flex align-items-center'>
                    <span>{formatNumberToCurrency(selectDetailsOrder?.settlement_amount_estimate)}</span>
                    {selectDetailsOrder.settlement_type_selected == 1 && (
                      <>
                        <img className="ml-3" src={toAbsoluteUrl('/media/arrow-right.svg')} alt=""></img>
                        <span style={{color: '#FF5629', marginLeft: '5px'}}>{formatNumberToCurrency(selectDetailsOrder?.settlement_amount)}</span>
                      </>
                    )}
                  </div>
              </div>
              <div style={{display: 'grid', gridTemplateColumns: '30% auto', gap: '5px 5px'}}>
                  <span className='text-right'>{formatMessage({ defaultMessage: "Xử lý"})}:</span>
                  <span>
                  <Field name={`radio_single`}
                    component={RadioGroup}
                    value={values['radio_single']}
                    customFeedbackLabel={" "}
                    disabled={true}
                    options={CREATION_METHODS}></Field>
                  </span>
              </div>
              <div className='mb-4' style={{display: 'grid', gridTemplateColumns: '30% auto', gap: '5px 5px'}}>
                  <span className='text-right'>
                    {formatMessage({ defaultMessage: "Ghi chú"})}:
                  </span>
                  <div style={{
                    display: 'block',
                    width: '450px',
                    wordWrap: 'break-word'
                  }}>{selectDetailsOrder.settlement_note || '--'}</div>
              </div>
          </div>
              )
            }}
          </Formik>
        </Modal.Body>
      </Modal>
      </>
  )
}

export default DetailsOrderDialog