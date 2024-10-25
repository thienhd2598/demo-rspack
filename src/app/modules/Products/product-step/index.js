/* eslint-disable no-script-url,jsx-a11y/anchor-is-valid,jsx-a11y/role-supports-aria-props */
import React, { } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  CardHeaderToolbar,
} from "../../../../_metronic/_partials/controls";
import { FormattedMessage, injectIntl } from "react-intl";
import { Link } from "react-router-dom";
import { useProductsUIContext } from "../ProductsUIContext";
import { useIntl } from "react-intl";
function ProductStep(props) {
  const {formatMessage} = useIntl()
  const { current = 0 } = props
  const STEP = [
    formatMessage({defaultMessage:'Thông tin chung'}), formatMessage({defaultMessage:'Gian hàng/Kênh bán'})
  ]

  const renderActive = (title, index) => {
    return (
      <div className='d-flex justify-content-center align-items-center' >
        <div className='d-flex justify-content-center  align-items-center' style={{
          border: '2px solid #FE5629', width: 24, height: 24,
          borderRadius: 24
        }} >
          <h5 className='text-primary mb-0' >{index}</h5>
        </div>
        <h5 className='text-primary ml-2 mb-0' >{title}</h5>
      </div>
    )
  }
  const renderInactive = (title, index) => {
    return (
      <div className='d-flex justify-content-center align-items-center' >
        <div className='d-flex justify-content-center  align-items-center' style={{
          border: '1px solid rgba(0, 0, 0, 0.85)', width: 24, height: 24,
          borderRadius: 24
        }} >
          <h6 className='mb-0' >{index}</h6>
        </div>
        <p className='ml-2 mb-0' >{title}</p>
      </div>
    )
  }

  return (
    <Card>
      <CardBody>
        <div className='d-flex justify-content-center align-items-center' >
          {current == 0 ? renderActive(STEP[0], 1) : renderInactive(STEP[0], 1)}
          <i className='fas fa-arrow-right text-primary mx-6' />
          {current == 1 ? renderActive(STEP[1], 2) : renderInactive(STEP[1], 2)}
        </div>
      </CardBody>
    </Card>
  );
}

export default injectIntl(ProductStep);