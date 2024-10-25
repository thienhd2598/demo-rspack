import { Field, Formik } from "formik";
import React, { useState } from "react";
import { Modal } from "react-bootstrap";
import * as Yup from "yup";
import Select from "react-select";
import { useQuery, useMutation } from "@apollo/client";
import query_sme_catalog_stores from "../../../../../graphql/query_sme_catalog_stores";
import _ from "lodash";
import query_inventorySumProductExport from "../../../../../graphql/query_inventorySumProductExport";
import mutate_inventoryCreateExportRequestInput from "../../../../../graphql/mutate_inventoryCreateExportRequestInput";
import { useMemo } from "react";
import { useToasts } from "react-toast-notifications";
import LoadingDialog from "../../../ProductsStore/product-new/LoadingDialog";
import { useHistory, useLocation } from "react-router-dom";
import queryString from 'querystring'
import { FieldFeedbackLabel } from "../../../../../_metronic/_partials/controls/forms/FieldFeedbackLabel";
import { useIntl } from "react-intl";
import query_sme_product_status from "../../../../../graphql/query_sme_product_status";

const ModalInventoryExport = ({ openModal }) => {
  const {formatMessage} = useIntl()
  const history = useHistory();
  const location = useLocation()
  const params = queryString.parse(location.search.slice(1, 100000))

  const {data: statusData} = useQuery(query_sme_product_status)
  const activeStatus = statusData?.sme_product_status?.filter((status) => status?.status)
  const OPTIONS_PRODUCT_TYPE = [
    {
      value: "all",
      label: formatMessage({defaultMessage:"Tất cả"}),
    },
    {
      value: "normal",
      label: formatMessage({defaultMessage:"Thường"}),
    },
    {
      value: "combo",
      label: "Combo",
    },
    {
      value: "multiunit",
      label: "Nhiều ĐVT",
    },
  ];

  const OPTIONS_STATUS_PRODUCT = [
    {
      value: "instock",
      label: formatMessage({defaultMessage:"Còn hàng"}),
    },
    {
      value: "near_outstock",
      label: formatMessage({defaultMessage:"Sắp hết hàng"}),
    },
    {
      value: "outstock",
      label: formatMessage({defaultMessage:"Hết hàng"}),
    },
    {
      value: "preallocate",
      label: formatMessage({defaultMessage:"Tạm ứng"}),
    },
  ];

  const OPTIONS_STATUS_PRODUCT_DEFFECTIVE = activeStatus.map((status) => {
    return {
      value: status?.id,
      label: status?.name
    }
  });
  const { data: dataWarehouse } = useQuery(query_sme_catalog_stores, {
    fetchPolicy: "cache-and-network",
  });

  const warehouses = useMemo(() => {
    return [{id: 'all', name: formatMessage({ defaultMessage: 'Tất cả' })}, dataWarehouse?.sme_warehouses]?.flat()
  }, [dataWarehouse])

  const { addToast } = useToasts();
  // const defaultWarehouse = dataWarehouse?.sme_warehouses.find(
  //   (wh) => !!wh?.is_default
  // );

  const [inventorySumOptions, setInventorySumOptions] = useState({
    product_status: [],
    product_stock_status: [],
    product_type: OPTIONS_PRODUCT_TYPE[0].value,
    warehouse_ids: [
      { value: 'all', label: 'Tất cả' },
    ],
  });

  const { product_status, product_type, warehouse_ids, product_stock_status } = inventorySumOptions;

  const defaultStatusIds = params?.status == 'defective' ? activeStatus?.map((status) => status?.id) : []

  const { data: total, loading: loadingInventorySum } = useQuery(
    query_inventorySumProductExport,
    {
      variables: {
        inventoryCreateExportRequestInput: {
          product_status: product_status.map((e) => e.value) || [],
          product_stock_status_ids:  product_stock_status?.length ? product_stock_status.map(e => e.value) : defaultStatusIds,
          product_type: product_type,
          warehouse_ids: warehouse_ids[0]?.value == 'all' ? [] : warehouse_ids.map((e) => +e.value)
        },
      },
      fetchPolicy: "no-cache",
    }
  );
  const [inventoryCreateExport, { loading }] = useMutation(
    mutate_inventoryCreateExportRequestInput,
    {
      variables: {
        inventoryCreateExportRequestInput: {
          product_status: product_status.map((e) => e.value) || [],
          product_stock_status_ids: product_stock_status?.length ? product_stock_status.map(e => e.value) : defaultStatusIds,
          product_type: product_type,
          warehouse_ids: warehouse_ids[0]?.value == 'all' ? [] : warehouse_ids.map((e) => +e.value)
        },
      },
      onCompleted: (data) => {
        if (data?.inventoryCreateExportRequest.success) {
          addToast(data?.inventoryCreateExportRequest.message, {
            appearance: "success",
          });
          openModal(false);
          history.push("/products/inventory-export-history");
          return;
        }
        addToast(data?.inventoryCreateExportRequest.message, {
          appearance: "error",
        });
      },
    }
  );
  return (
    <>
      {<LoadingDialog show={loading} />}
      <Modal
        aria-labelledby="example-modal-sizes-title-lg"
        centered
        show={true}
        onHide={() => openModal(false)}
      >
        <Modal.Header style={{ borderBottom: 'none', justifyContent: 'center'}}>
          <Modal.Title>{formatMessage({defaultMessage:"Xuất file tồn kho"})}</Modal.Title>
        </Modal.Header>
        <span style={{ fontStyle: 'italic' }} className="m-4">*{formatMessage({defaultMessage:"Thông tin được lưu về dạng file excel"})}</span>
        <Modal.Body className="overlay overlay-block cursor-default">
          <div className="col-12">
            <div className="row mt-3 display-flex align-items-center">
              <label
                className="col-4 col-form-label"
                style={{ color: "#000000" }}
              >
                {formatMessage({defaultMessage:"Kho"})}
                <span className="text-primary"> *</span>
              </label>
              <div className="col-8">
                <Select
                  placeholder={formatMessage({defaultMessage:"Chọn kho"})}
                  className="w-100 custom-select-warehouse"
                  value={
                    _.find(
                      _.map(warehouses, (_item) => ({
                          value: _item?.id,
                          label: _item?.name,
                      })),
                      (_item) => _item?.value == inventorySumOptions.warehouse_ids[0]?.value
                  ) 
                  }
                  options={_.map(warehouses, (_item) => ({
                    value: _item?.id,
                    label: _item?.name,
                  }))}
                  onChange={(tags) => {
                    setInventorySumOptions({
                      ...inventorySumOptions,
                      warehouse_ids: [{ label: tags.label, value: tags.value }]
                    });
                  }}
                />
              </div>
            </div>
            <div className="row">
              <div className="col-4"></div>
              <div className="col-8">
                <FieldFeedbackLabel
                  touched={
                    inventorySumOptions.warehouse_ids.length ? false : true
                  }
                  label={formatMessage({defaultMessage:"Vui lòng chọn kho"})}
                  error={formatMessage({defaultMessage:"Vui lòng chọn kho"})}
                />
              </div>
            </div>

            {params?.status != 'defective' && <div className="row mt-3 display-flex align-items-center">
              <label
                className="col-4 col-form-label"
                style={{ color: "#000000" }}
              >
                {formatMessage({defaultMessage:"Loại sản phẩm"})}
              </label>
              <div className="col-8">
                <Select
                  options={OPTIONS_PRODUCT_TYPE}
                  className="w-100 custom-select-order"
                  style={{ borderRadius: 0 }}
                  value={OPTIONS_PRODUCT_TYPE.find(
                    (_op) => _op.value == inventorySumOptions.product_type
                  )}
                  onChange={(value) => {
                    if (!!value) {
                      setInventorySumOptions({
                        ...inventorySumOptions,
                        product_type: value.value,
                      });
                    }
                  }}
                  formatOptionLabel={(option, labelMeta) => {
                    return <div>{option.label}</div>;
                  }}
                />
              </div>
            </div>}

            {params?.status != 'defective' && <div className="row mt-3 display-flex align-items-center">
              <label
                className="col-4 col-form-label"
                style={{ color: "#000000" }}
              >
                {formatMessage({defaultMessage:"Trạng thái"})}
              </label>
              <div className="col-8">
                <Select
                  placeholder={formatMessage({defaultMessage:"Tất cả"})}
                  isMulti
                  isClearable
                  options={OPTIONS_STATUS_PRODUCT}
                  value={inventorySumOptions?.product_status.map((tag) => {
                    return { label: tag.label, value: tag.value };
                  })}
                  onChange={(tags) => {
                    setInventorySumOptions({
                      ...inventorySumOptions,
                      product_status: (tags || [])?.map((tag) => {
                        return { label: tag.label, value: tag.value };
                      }),
                    });
                  }}
                />
              </div>
            </div>}

            {params?.status == 'defective' && <div className="row mt-3 display-flex align-items-center">
              <label
                className="col-4 col-form-label"
                style={{ color: "#000000" }}
              >
                {formatMessage({defaultMessage:"Trạng thái sản phẩm"})}
              </label>
              <div className="col-8">
                <Select
                  placeholder={formatMessage({defaultMessage:"Tất cả"})}
                  isMulti
                  isClearable
                  options={OPTIONS_STATUS_PRODUCT_DEFFECTIVE}
                  value={inventorySumOptions?.product_stock_status.map((status) => {
                    return { label: status.label, value: status.value };
                  })}
                  onChange={(statusList) => {
                    setInventorySumOptions({
                      ...inventorySumOptions,
                      product_stock_status: (statusList || [])?.map((status) => {
                        return { label: status.label, value: status.value };
                      }),
                    });
                  }}
                />
              </div>
            </div>}

            <div className="row mt-3 display-flex align-items-center">
              <label
                className="col-12 col-form-label"
                style={{ color: "#000000" }}
              >
                {formatMessage({defaultMessage:"Tổng hàng hóa đã chọn"})}
                <span className="ml-3">
                  <strong>
                    {loadingInventorySum ? (
                      <span className="ml-3 mr-6 spinner spinner-primary"></span>
                    ) : (
                      +total?.inventorySumProductExport?.data || 0
                    )}{" "}
                  </strong>{" "}
                  {formatMessage({defaultMessage:"hàng hoá"})}
                </span>
              </label>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="form" style={{ borderTop: 'none', justifyContent: 'center', paddingTop: 0 }}>
          <div className="form-group">
            <button
              type="button"
              className="btn btn-secondary mr-3"
              style={{ width: 100 }}
              onClick={() => openModal(false)}
            >
              {formatMessage({defaultMessage:"Đóng"})}
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-elevate"
              style={{ width: 100 }}
              onClick={() => inventoryCreateExport()}
              disabled={!+total?.inventorySumProductExport?.data || loading}
            >
              {formatMessage({defaultMessage:"Xác nhận"})}
            </button>
          </div>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ModalInventoryExport;
