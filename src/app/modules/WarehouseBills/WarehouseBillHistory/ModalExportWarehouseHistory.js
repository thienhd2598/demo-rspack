import React, { useMemo, useState } from "react";
import { Modal } from "react-bootstrap";
import Select from "react-select";
import { useQuery, useMutation } from "@apollo/client";
import query_sme_catalog_stores from "../../../../graphql/query_sme_catalog_stores";
import _ from "lodash";
import query_inventorySumProductChangeActual from "../../../../graphql/query_inventorySumProductChangeActual";
import mutate_inventoryCreateExportChangeActualRequest from "../../../../graphql/mutate_inventoryCreateExportChangeActualRequest";
import { useToasts } from "react-toast-notifications";
import LoadingDialog from "../../ProductsStore/product-new/LoadingDialog";
import { FieldFeedbackLabel } from "../../../../_metronic/_partials/controls/forms/FieldFeedbackLabel";
import { useIntl } from "react-intl";
import DateRangePicker from "rsuite/DateRangePicker";
import dayjs from "dayjs";
import {useHistory} from 'react-router-dom'

const ModalExportWarehouseHistory = ({ openModal }) => {
  const { formatMessage } = useIntl();
  const history = useHistory()
  const [valueRangeTime, setValueRangeTime] = useState();
  const [timeSearch, setTimeSearch] = useState([]);
  const disabledFutureDate = (date) => {
    const unixDate = dayjs(date).unix();
    const today = dayjs().startOf('day').add(0, 'day').unix();

    return unixDate >= today;
}
  const { data: dataWarehouse } = useQuery(query_sme_catalog_stores, {
    fetchPolicy: "cache-and-network",
  });

  const { addToast } = useToasts();
  const defaultWarehouse = dataWarehouse?.sme_warehouses.find(
    (wh) => !!wh.is_default
  );

  const warehouses = useMemo(() => {
    return [{id: null, name: 'Tất cả'}, dataWarehouse?.sme_warehouses]?.flat()
  }, [dataWarehouse])

  const [inventorySumOptions, setInventorySumOptions] = useState({
    warehouse_id: {value: defaultWarehouse?.id, label: defaultWarehouse?.name },
  });
  const {  warehouse_id } = inventorySumOptions;

  const variablesQuery = useMemo(() => {
      return  {
        from: timeSearch?.[0] || null,
        to: timeSearch?.[1] || null,
        warehouseId: +warehouse_id?.value,
      }
  }, [timeSearch, warehouse_id])

  const checkSearchTypeEmpty = Object.entries(variablesQuery)
  .map((elm) => {
    if (!!elm.at(1)) {
      return elm
    }
  }).filter(e => e)
  const convert = Object.fromEntries(checkSearchTypeEmpty);


  const { data: total, loading: loadingInventorySum } = useQuery(
    query_inventorySumProductChangeActual,
    {
      variables: {
        inventorySumProductChangeActualInput:convert
      },
      fetchPolicy: "cache-and-network",
      skip: !timeSearch?.length
    },
   
  );


  const [inventoryCreateExport, { loading }] = useMutation(
    mutate_inventoryCreateExportChangeActualRequest,
    {
      variables: {
        inventorySumProductChangeActualInput: convert
      },
      onCompleted: (data) => {
        if (data?.inventoryCreateExportChangeActualRequest.success) {
          addToast(data?.inventoryCreateExportChangeActualRequest.message, {
            appearance: "success",
          });
          openModal(false);
          history.push("/products/history-export-tab-goods");
          return;
        }
        addToast(data?.inventoryCreateExportChangeActualRequest.message, {
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
        <Modal.Header style={{ justifyContent: 'center', border: 'none', paddingBottom: 0 }}>
          <Modal.Title>
            {formatMessage({
              defaultMessage: "Xuất file lịch sử thay đổi tồn ",
            })}
          </Modal.Title>
        </Modal.Header>
        <span style={{ fontStyle: 'italic' }} className="m-4">
          *
          {formatMessage({
            defaultMessage: "Thông tin được lưu về dạng file excel",
          })}
        </span>
        <Modal.Body className="overlay overlay-block cursor-default">
          <div className="col-12">
            <div className="row mt-3 display-flex align-items-center">
              <label
                className="col-4 col-form-label"
                style={{ color: "#000000" }}
              >
                {formatMessage({ defaultMessage: "Kho" })}
                <span className="text-primary"> *</span>
              </label>
              <div className="col-8">
                <Select
                  placeholder={formatMessage({ defaultMessage: "Chọn kho" })}
                  className="w-100 custom-select-warehouse"
                  value={inventorySumOptions.warehouse_id}
                  options={_.map(warehouses, (_item) => ({
                    value: _item?.id,
                    label: _item?.name,
                  }))}
                  onChange={(tags) => {
                    setInventorySumOptions({
                      warehouse_id: { label: tags.label, value: tags.value }
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
                    inventorySumOptions.warehouse_id ? false : true
                  }
                  label={formatMessage({ defaultMessage: "Vui lòng chọn kho" })}
                  error={formatMessage({ defaultMessage: "Vui lòng chọn kho" })}
                />
              </div>
            </div>
              <div className="row mt-3 display-flex align-items-center">
                <label
                  className="col-4 col-form-label"
                  style={{ color: "#000000" }}
                >
                  {formatMessage({ defaultMessage: "Thời gian" })}:
                  <span className="text-primary"> *</span>
                </label>
                <div className="col-8">
                  <DateRangePicker
                    style={{ float: "right", width: "100%" }}
                    character={" - "}
                    format={"dd/MM/yyyy"}
                    disabledDate={(date) => disabledFutureDate(date)}
                    placeholder={"dd/mm/yyyy - dd/mm/yyyy"}
                    placement={"left"}
                    value={valueRangeTime}
                    onChange={(values) => {
                      setValueRangeTime(values)
                      setTimeSearch([])
                      if (!!values) {
                          let times = [dayjs(values[0]).startOf('day').unix(), dayjs(values[1]).endOf('day').unix()];
                          setTimeSearch([...times])
              
                          let rangeTimeConvert = times.map(
                              _range => new Date(_range * 1000)
                          );
                          setValueRangeTime(rangeTimeConvert)
                    
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
                      // for DateRangePicker
                      last7Days: formatMessage({
                        defaultMessage: "7 ngày qua",
                      }),
                    }}
                  />
                </div>
              </div>
            {timeSearch?.length ?   <div className="row mt-3 display-flex align-items-center">
              <label
                className="col-12 col-form-label"
                style={{ color: "#000000" }}
              >
                {formatMessage({ defaultMessage: "Tổng hàng hóa đã chọn:" })}
                <span className="ml-3">
                  <strong>
                    {loadingInventorySum ? (
                      <span className="ml-3 mr-6 spinner spinner-primary"></span>
                    ) : (
                      +total?.inventorySumProductChangeActual?.data || 0
                    )}{" "}
                  </strong>{" "}
                  {formatMessage({ defaultMessage: "hàng hoá" })}
                </span>
              </label>
            </div> : null}
          
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
              {formatMessage({ defaultMessage: "Đóng" })}
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-elevate"
              style={{ width: 100 }}
              onClick={() => inventoryCreateExport()}
              disabled={loading || !+total?.inventorySumProductChangeActual?.data}
            >
              {formatMessage({ defaultMessage: "Xác nhận" })}
            </button>
          </div>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ModalExportWarehouseHistory;
