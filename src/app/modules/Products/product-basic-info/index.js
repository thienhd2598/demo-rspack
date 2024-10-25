/* eslint-disable no-script-url,jsx-a11y/anchor-is-valid,jsx-a11y/role-supports-aria-props */
import React, { memo, useCallback, useMemo, useRef, useState } from "react";
import {
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardHeaderToolbar,
  FieldFeedbackLabel,
  Input,
  InputVertical,
  Checkbox
} from "../../../../_metronic/_partials/controls";
import { FormattedMessage, injectIntl, useIntl } from "react-intl";
import { Link } from "react-router-dom";
import { useProductsUIContext } from "../ProductsUIContext";
import { Field, useFormikContext } from "formik";
import { DropdownButton, Modal, OverlayTrigger, Tooltip } from "react-bootstrap";
import { Dropdown } from "react-bootstrap";
import { Divider } from "@material-ui/core";
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import { useToasts } from "react-toast-notifications";
import query_sme_catalog_category from '../../../../graphql/query_sme_catalog_category'


import op_brands from '../../../../graphql/op_brands'
import op_categories from '../../../../graphql/op_categories'
import { useQuery } from "@apollo/client";
import _ from 'lodash'
import { useReducer } from "react";
import { ReSelectBranch } from "../../../../components/ReSelectBranch";
import { NON_SERIAL, SERIAL, queryCheckExistSku, queryCheckExistSkuMain } from "../ProductsUIHelpers";
import { useSelector } from "react-redux";
import { createSKUProduct } from "../../../../utils";
import SelectInfinite from "../../../../components/SelectInfinite";
import client from "../../../../apollo";

function ProductBasicInfo(props) {
  const { intl, isCombo, isEdit } = props;
  console.log(props)
  const { addToast, removeAllToasts } = useToasts();
  const { setFieldValue, values } = useFormikContext()
  const { optionsProductTag, currentProduct } = useProductsUIContext();
  const user = useSelector((state) => state.auth.user);

  const checkExistSku = useCallback(async (code) => {
    if (code.trim().length == 0) {
      return false;
    }
    if (await queryCheckExistSkuMain(currentProduct?.id, code)) {
      setFieldValue(`variant-sku_boolean`, { sku: true })
    } else {
      setFieldValue(`variant-sku_boolean`, { sku: false })
    }
  }, [currentProduct?.id]);

  const { loading, data, error } = useQuery(query_sme_catalog_category, {
    fetchPolicy: "cache-and-network",
  });

  const optionsCategory = useMemo(() => {
    return data?.sme_catalog_category?.map(option => ({label: option?.name, value: option?.id}))
  }, [data])

  const queryCategory = async (limit = 10, page = 1) => {
    const { data } = await client.query({
        query: query_sme_catalog_category,
        variables: {
          limit,
          offset: (page - 1) * limit,
          order_by: { updated_at: 'desc' }
        },
        fetchPolicy: "network-only",
    });

    return data?.sme_catalog_category?.map(option => ({label: option?.name, value: option?.id})) || [];
}
  return (
    <Card>
      <CardHeader title={intl.formatMessage({
        defaultMessage: "THÔNG TIN CƠ BẢN",
      })}>
        <CardHeaderToolbar>
        </CardHeaderToolbar>
      </CardHeader>
      <CardBody>
        <div className='row'>
          <div className={`col-md-6`} >
            <Field
              name="name"
              component={InputVertical}
              placeholder=""
              label={intl.formatMessage({
                defaultMessage: "Tên sản phẩm",
              })}
              disabled={props?.isSyncVietful}
              required
              customFeedbackLabel={' '}
              countChar
              maxChar={255}
            />
          </div>
          <div className={`col-md-6`} >
            <label className="col-form-label mr-1">Tag</label>
            <OverlayTrigger
              overlay={
                <Tooltip>
                  {intl.formatMessage({ defaultMessage: 'Thêm tag sản phẩm để có thể tìm kiếm nhanh các sản phẩm cùng tag ở quản lý sản phẩm sàn' })}
                </Tooltip>
              }
            >
              <i className="fas fa-info-circle" style={{ fontSize: 14 }}></i>
            </OverlayTrigger>
            <CreatableSelect
              placeholder={intl.formatMessage({ defaultMessage: "Nhập tag sản phẩm" })}
              isMulti
              isClearable
              value={values?.product_tags || []}
              styles={{
                control: provided => ({ ...provided, background: '#f7f7fa', borderColor: '#f7f7fa' }),
              }}
              onChange={value => {
                if (value?.length > 0 && value?.some(_value => _value?.label?.trim()?.length > 255)) {
                  removeAllToasts();
                  addToast(intl.formatMessage({ defaultMessage: 'Tag sản phẩm tối đa chỉ được 255 ký tự' }), { appearance: 'error' });
                  return;
                }
                setFieldValue(`__changed__`, true);
                setFieldValue(`product_tags`, value)
              }}
              options={optionsProductTag}
              formatCreateLabel={(inputValue) => `${intl.formatMessage({ defaultMessage: 'Tạo mới' })}: "${inputValue}"`}
            />
          </div>
        </div>

        <div className="row mt-2">
          <div className={`col-md-6`} style={{ position: 'relative' }}>
            <Field
              name="seoName"
              component={InputVertical}
              placeholder=""
              label={intl.formatMessage({ defaultMessage: "Tên sản phẩm chuẩn SEO" })}
              tooltip={intl.formatMessage({ defaultMessage: "Tên sản phẩm chuẩn SEO dùng để đồng bộ sang sản phẩm sàn." })}
              customFeedbackLabel={' '}
              countChar
              maxChar={120}
              required
              absolute
            />

          </div>
          <div className={`col-md-6`} >
            <Field
              name="brand_name"
              component={InputVertical}
              placeholder={intl.formatMessage({ defaultMessage: 'Nhập thương hiệu' })}
              required={false}
              countChar
              maxChar={120}
              label={intl.formatMessage({ defaultMessage: "Thương hiệu" })}
              customFeedbackLabel={' '}
              absolute
            />
          </div>
        </div>

        <div className="row mt-2">
          <div className={`col-md-6`} style={{ position: 'relative' }}>
            <Field
              name="sku"
              component={InputVertical}
              placeholder=""
              label={intl.formatMessage({ defaultMessage: "Mã SKU thông tin" })}
              tooltip={intl.formatMessage({ defaultMessage: "Mã SKU của thông tin sản phẩm phục vụ cho mục đích liên kết sản phẩm" })}
              customFeedbackLabel={' '}
              countChar
              maxChar={50}
              absolute
              onBlurChange={async (value) => {
                await checkExistSku(value)
              }}
            />
            {!values.sku ? (
              <a href="#" style={{ position: 'absolute', top: '0.8rem', right: '1.1rem' }}
                onClick={e => {
                  e.preventDefault()

                  if (!!values.name)
                    setFieldValue('sku', createSKUProduct(user?.sme_id, values.name || ''))
                  else {
                    addToast(intl.formatMessage({ defaultMessage: 'Vui lòng nhập tên sản phẩm' }), { appearance: 'warning' });
                  }

                }}
              >{intl.formatMessage({ defaultMessage: 'Tự động tạo' })}</a>
            ) : null}

          </div>

          <div className={`col-md-6`} style={{ position: 'relative' }}>
          <div className="col-form-label mr-1">{intl.formatMessage({ defaultMessage: "Danh mục"})}</div>
          <SelectInfinite
              placeholder={intl.formatMessage({ defaultMessage: 'Chọn danh mục'})}
              isClearable
              disabled={props?.isSyncVietful}
              value={(optionsCategory || [])?.find((_op) => _op.value == values['catalog_category_id']) || []}
              getData={queryCategory}
              onChange={(item) => {
                setFieldValue(`catalog_category_id`, item?.value || null);
              }}
          />
          {/* <Select
              options={optionsCategory || []}
              className="w-100 custom-select-order"
              isLoading={loading}
              isDisabled={loading}
              isClearable
              style={{ padding: 0 }}
              placeholder={intl.formatMessage({ defaultMessage: 'Chọn danh mục'})}
              value={(optionsCategory || [])?.find((_op) => _op.value == values['catalog_category_id']) || []}
              onChange={(item) => {
                 if(item) {
                  setFieldValue(`catalog_category_id`, item?.value || null);
                 } else {
                  setFieldValue(`catalog_category_id`, null);
                 }
              }}
              formatOptionLabel={(option, labelMeta) => {
                return <div>{option.label}</div>;
              }}
            /> */}
          </div>
        </div>

        <div className="row mt-2">
          
          {!isCombo && <div className={`col-md-6`} style={{ position: 'relative' }}>
               <div className="col-form-label mr-1">{intl.formatMessage({ defaultMessage: "Hình thức quản lý tồn mở rộng"})}</div>
                <div className="d-flex align-items-center">
                <div>
                <Checkbox
                    size="checkbox-md"
                    inputProps={{
                        "aria-label": "checkbox",
                    }}
                    title={intl.formatMessage({ defaultMessage: "Có thông tin lô"})}
                    isSelected={values[`is_lot`]}
                    onChange={(e) => {
                        setFieldValue([`is_lot`], !values[`is_lot`]);
                    }}
                    disabled={props?.isSyncVietful}
                />
                </div>
                <div className="mx-4">
                <Checkbox
                    size="checkbox-md"
                    inputProps={{
                        "aria-label": "checkbox",
                    }}
                    title={intl.formatMessage({ defaultMessage: "Quản lý hạn sử dụng"})}
                    isSelected={values[`is_expired_date`]}
                    disabled={props?.isSyncVietful || (!values[`is_expired_date`] && isEdit)}
                    onChange={(e) => {
                        setFieldValue([`is_expired_date`], !values[`is_expired_date`]);
                    }}
                />
                </div>
                </div>
          </div>}

          <div className={`col-md-6`} style={{ position: 'relative' }}>
               <div className="col-form-label mr-1">{intl.formatMessage({ defaultMessage: "Loại dự trữ"})}</div>
                <div className="d-flex align-items-center">
                <div>
                <Checkbox
                    size="checkbox-md"
                    inputProps={{
                        "aria-label": "checkbox",
                    }}
                    disabled={props?.isSyncVietful}
                    title={intl.formatMessage({ defaultMessage: "Hàng quản lý theo số lượng"})}
                    isSelected={values[`serial_type`] == NON_SERIAL}
                    onChange={(e) => {
                        setFieldValue([`serial_type`], NON_SERIAL);
                    }}
                />
                </div>
                <div className="mx-4">
                <Checkbox
                    size="checkbox-md"
                    inputProps={{
                        "aria-label": "checkbox",
                    }}
                    disabled={props?.isSyncVietful}
                    title={intl.formatMessage({ defaultMessage: "Hàng có số seri"})}
                    isSelected={values[`serial_type`] == SERIAL}
                    onChange={(e) => {
                        setFieldValue([`serial_type`], SERIAL);
                    }}
                />
                </div>
                </div>
          </div>
        </div>

        
      </CardBody>
    </Card>
  );
}

export default injectIntl(ProductBasicInfo);