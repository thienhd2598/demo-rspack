import { Field, Formik } from "formik";
import React, { useState } from "react";
import { Modal } from "react-bootstrap";
import * as Yup from "yup";
import Select from "react-select";
import { useQuery, useMutation } from "@apollo/client";
import query_sme_catalog_stores from "../../../../../graphql/query_sme_catalog_stores";
import _ from "lodash";
import query_inventorySumProductExport from "../../../../../graphql/query_inventorySumProductExport";
import query_userSumProductLocationExport from "../../../../../graphql/query_userSumProductLocationExport";
// import mutate_inventoryCreateExportRequestInput from "../../../../../graphql/mutate_inventoryCreateExportRequestInput";
import mutate_userCreateProductLocationExportRequest from "../../../../../graphql/mutate_userCreateProductLocationExportRequest";
import { useMemo } from "react";
import { useToasts } from "react-toast-notifications";
import { useHistory, useLocation } from "react-router-dom";
import queryString from 'querystring'
import { FieldFeedbackLabel } from "../../../../../_metronic/_partials/controls/forms/FieldFeedbackLabel";
import { useIntl } from "react-intl";
import query_sme_product_status from "../../../../../graphql/query_sme_product_status";
import DateRangePicker from "rsuite/DateRangePicker";
import dayjs from "dayjs";

const ModalInventoryExport = ({ openModal }) => {
  const {formatMessage} = useIntl()
  const history = useHistory();
  const location = useLocation()
  const params = queryString.parse(location.search.slice(1, 100000))
  const [valueRangeTime, setValueRangeTime] = useState([])

  const {data: statusData} = useQuery(query_sme_product_status)
  

  const OPTIONS_STATUS_PRODUCT = [
    {
      value: 0,
      label: formatMessage({defaultMessage:"Còn hạn"}),
    },
    {
      value: 1,
      label: formatMessage({defaultMessage:"Sắp hết hạn"}),
    },
    {
      value: 2,
      label: formatMessage({defaultMessage:"Dừng bán"}),
    },
    {
      value: 3,
      label: formatMessage({defaultMessage:"Hết hạn"}),
    },
  ];
  const { data: dataWarehouse } = useQuery(query_sme_catalog_stores, {
    fetchPolicy: "cache-and-network",
  });

  const warehouses = useMemo(() => {
    return [dataWarehouse?.sme_warehouses]?.flat()
  }, [dataWarehouse])

  const { addToast } = useToasts();
  // const defaultWarehouse = dataWarehouse?.sme_warehouses.find(
  //   (wh) => !!wh?.is_default
  // );

  const [inventorySumOptions, setInventorySumOptions] = useState({
    product_status: [],
    range_time: [],
    warehouse_ids: [
    ],
  });

  const { product_status, range_time, warehouse_ids  } = inventorySumOptions;

  console.log(inventorySumOptions)
  const { data: total, loading: loadingTotal } = useQuery(
    query_userSumProductLocationExport,
    {
      variables: {
        userSumProductLocationExportInput: {
          product_status: product_status?.map((e) => e.value) || [],
          inbound_from:  range_time[0],
          inbound_to: range_time[1],
          warehouse_ids: !warehouse_ids?.length ? [] : warehouse_ids?.map((e) => +e.value)
        },
      },
      fetchPolicy: "no-cache",
    }
  );
  const [inventoryCreateExport, { loading }] = useMutation(
    mutate_userCreateProductLocationExportRequest,
    {
      variables: {
        userSumProductLocationExportInput: {
          product_status: product_status?.map((e) => e.value) || [],
          inbound_from:  range_time[0],
          inbound_to: range_time[1],
          warehouse_ids: !warehouse_ids?.length ? [] : warehouse_ids?.map((e) => +e.value)
        },
      },
      onCompleted: (data) => {
        if (data?.userCreateProductLocationExportRequest.success) {
          addToast(data?.userCreateProductLocationExportRequest.message, {
            appearance: "success",
          });
          openModal(false);
          history.push("/products/expired-inventory-export-history");
          return;
        }
        addToast(data?.userCreateProductLocationExportRequest.message, {
          appearance: "error",
        });
      },
    }
  );
  return (
    <>
      <Modal
        aria-labelledby="example-modal-sizes-title-lg"
        centered
        show={true}
        onHide={() => openModal(false)}
      >
        <Modal.Header style={{ borderBottom: 'none', justifyContent: 'center'}}>
          <Modal.Title>{formatMessage({defaultMessage:"Xuất file quản lý hạn sử dụng"})}</Modal.Title>
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
                  placeholder={formatMessage({defaultMessage:"Tất cả"})}
                  className="w-100 custom-select-warehouse"
                  // value={
                  //   _.find(
                  //     _.map(warehouses, (_item) => ({
                  //         value: _item?.id,
                  //         label: _item?.name,
                  //     })),
                  //     (_item) => _item?.value == inventorySumOptions.warehouse_ids[0]?.value
                  // ) 
                  // }
                  options={_.map(warehouses, (_item) => ({
                    value: _item?.id,
                    label: _item?.name,
                  }))}
                  onChange={(whs) => {
                    setInventorySumOptions({
                      ...inventorySumOptions,
                      warehouse_ids: whs?.map(wh => ({ label: wh.label, value: wh.value }))
                    });
                  }}
                  isMulti
                  isClearable
                />
              </div>
            </div>
            {/* <div className="row">
              <div className="col-4"></div>
              <div className="col-8">
                <FieldFeedbackLabel
                  touched={
                    inventorySumOptions?.warehouse_ids?.length ? false : true
                  }
                  label={formatMessage({defaultMessage:"Vui lòng chọn kho"})}
                  error={formatMessage({defaultMessage:"Vui lòng chọn kho"})}
                />
              </div>
            </div> */}

            <div className="row mt-3 display-flex align-items-center">
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
            </div>

            <div className="row mt-3 display-flex align-items-center">
              <label
                className="col-4 col-form-label"
                style={{ color: "#000000" }}
              >
                {formatMessage({defaultMessage:"Ngày nhập kho"})}
                <span className="text-primary"> *</span>
              </label>
              <div className="col-8">
              <DateRangePicker
                  style={{ width: "100%", borderRadius: 0, height: 38}}
                  character={" - "}
                  format={"dd/MM/yyyy"}
                  value={valueRangeTime}
                  className="custom-date-range-picker"
                  styles
                  placeholder={"dd/mm/yyyy - dd/mm/yyyy"}
                  placement={"topStart"}
                  onChange={(values) => {
                      setValueRangeTime(values)
                      if (!!values) {
                        setInventorySumOptions({
                          ...inventorySumOptions,
                          range_time: [dayjs(values[0]).startOf("day").unix(),dayjs(values[1]).endOf("day").unix()]
                        })
                      } else {
                        setInventorySumOptions({
                          ...inventorySumOptions,
                          range_time: []
                        })
                      }
                  }}
                  locale={{
                      sunday: "CN",
                      monday: "T2",
                      tuesday: "T3",
                      wednesday: "T4",
                      thursday: "T5",
                      friday: "T6",
                      saturday: "T7",
                      ok: formatMessage({ defaultMessage: "Đồng ý" }),
                      today: formatMessage({ defaultMessage: "Hôm nay" }),
                      yesterday: formatMessage({ defaultMessage: "Hôm qua" }),
                      hours: formatMessage({ defaultMessage: "Giờ" }),
                      minutes: formatMessage({ defaultMessage: "Phút" }),
                      seconds: formatMessage({ defaultMessage: "Giây" }),
                      formattedMonthPattern: "MM/yyyy",
                      formattedDayPattern: "dd/MM/yyyy",
                      last7Days: formatMessage({ defaultMessage: "7 ngày qua" }),
                  }}
              />
              </div>
            </div>

            {!!valueRangeTime?.length && <div className="row mt-3 display-flex align-items-center">
              <label
                className="col-12 col-form-label"
                style={{ color: "#000000" }}
              >
                {formatMessage({defaultMessage:"Tổng hàng hóa đã chọn"})}
                <span className="ml-3">
                  <strong>
                    {loadingTotal ? (
                      <span className="ml-3 mr-6 spinner spinner-primary"></span>
                    ) : (
                      +total?.userSumProductLocationExport?.data || 0
                    )}{" "}
                  </strong>{" "}
                  {formatMessage({defaultMessage:"hàng hoá"})}
                </span>
              </label>
            </div>}
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
              disabled={!+total?.userSumProductLocationExport?.data || loading || valueRangeTime?.length == 0}
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
