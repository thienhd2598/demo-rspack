/* eslint-disable no-script-url,jsx-a11y/anchor-is-valid,jsx-a11y/role-supports-aria-props */
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  CardHeaderToolbar,
  Input,
  InputVertical,
  Checkbox
} from "../../../../_metronic/_partials/controls";
import { FormattedMessage, injectIntl, useIntl } from "react-intl";
import { Field, useFormikContext } from "formik";
import { RadioGroup } from "../../../../_metronic/_partials/controls/forms/RadioGroup";

import _ from 'lodash'
import { InputSelectAddons } from "../../../../_metronic/_partials/controls/forms/InputSelectAddons";
import { useAccordionToggle } from "react-bootstrap";
import { useProductsUIContext } from "../ProductsUIContext";
import { Accordion } from "react-bootstrap";

function CustomToggle({ children, eventKey , title}) {
  const { openBlockDescription, setOpenBlockDescription, btnRefCollapseDescription } = useProductsUIContext();
  const decoratedOnClick = useAccordionToggle(eventKey, () => {
    setOpenBlockDescription(!openBlockDescription);
  });

  return (
      <CardHeader title={title} className="cursor-pointer" onClick={decoratedOnClick} ref={btnRefCollapseDescription} >
        <div className="d-flex justify-content-between align-items-center" >
          {children}
          <span>
            <i className={`${(openBlockDescription ? 'fas fa-angle-up ml-2' : 'fas fa-angle-down')} cursor-pointer`} style={{ fontSize: 30 }} />
          </span>
        </div>
      </CardHeader>
  );
};

function ProductExpireInfo(props) {
  const { intl, isEdit } = props;
  const {currentProduct} = useProductsUIContext()
  const isDisable = useMemo(() => {
    return currentProduct?.sme_catalog_product_variants?.some(variant => {
      return variant.inventories.some(item => 
        item.stock_actual !== 0 ||
        item.stock_available !== 0 ||
        item.stock_preallocate !== 0 ||
        item.stock_reserve !== 0 ||
        item.stock_allocated !== 0 ||
        item.stock_shipping !== 0
      )
  })}, [currentProduct])
  return (
    <Accordion>
    <Card id='expireInfo'>
        <CustomToggle eventKey="expireInfo" title={intl.formatMessage({
          defaultMessage: "CẤU HÌNH HẠN SỬ DỤNG",
        })} />
        <Accordion.Collapse eventKey="expireInfo">
      <CardBody>
        <div className='row'>
            <div className="col-2">Loại xuất kho: </div>
            <div className="col-7">
              <Field
                  name="outboundType"
                  component={RadioGroup}
                  disabled={props?.isSyncVietful}
                  customFeedbackLabel={' '}
                  options={[
                  {
                      value: 'FIFO',
                      label: 'FIFO (Nhập trước xuất trước)'
                  },
                  {
                      value: 'FEFO',
                      label: 'FEFO (Hết hạn trước xuất trước)'
                  },
                  ]}
              />
            </div>
        </div>

        <div className='row mt-2 d-flex align-items-center'>
            <div className="col-2">Mốc cảnh báo hết hạn: </div>
            <div className="col-3">
                <Field
                    name="expireTime"
                    component={InputSelectAddons}
                    addOnRight="ngày"
                    type='number'
                    placeholder=""
                    disabled={isEdit && isDisable}
                    required={false}
                    customFeedbackLabel={' '}
                    absolute
                />
            </div>
            <div className="col-1"></div>
            <div className="col-2 ml-2">Mốc dừng bán: </div>
            <div className="col-3">
                <Field
                    name="stopSellingTime"
                    disabled={isEdit && isDisable}
                    component={InputSelectAddons}
                    addOnRight="ngày"
                    type='number'
                    placeholder=""
                    required={false}
                    customFeedbackLabel={' '}
                    absolute
                />
            </div>
        </div>

        <div className="row mt-2">
        </div>
       
      </CardBody>
      </Accordion.Collapse>
    </Card>
  </Accordion>
  );
}

export default injectIntl(ProductExpireInfo);