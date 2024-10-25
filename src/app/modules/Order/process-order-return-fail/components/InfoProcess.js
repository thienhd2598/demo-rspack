import React, { forwardRef, useImperativeHandle, useRef } from "react";
import Select from "react-select";
import { Card, CardBody } from "../../../../../_metronic/_partials/controls";
import { useIntl } from "react-intl";
import { CREATION_METHODS, OPTIONS_SELECT, PROVIDER_WH } from "../constants";
import SVG from "react-inlinesvg";
import { toAbsoluteUrl } from "../../../../../_metronic/_helpers";
import { useQuery } from "@apollo/client";
import query_sme_catalog_stores from "../../../../../graphql/query_sme_catalog_stores";
import { Field } from "formik";
import { RadioGroup } from "../../../../../_metronic/_partials/controls/forms/RadioGroup";
import useScanDetection from "../../../../../hooks/useScanDetection";
import { useToasts } from "react-toast-notifications";
const InfoProcess = (
  { loadingScan, refetchScan, values, state, updateState, dataWarehouse },
  ref
) => {
  const { formatMessage } = useIntl();
  const MAXIMUM_ORDER = 200
  const { addToast } = useToasts();
  const inputRefOrder = useRef();
  useImperativeHandle(ref, () => ({
    clearValue() {
      inputRefOrder.current.value = "";
    },
  }));
  
  const warehouses = dataWarehouse?.sme_warehouses;
  const OPTIONS_SELECT_WAREHOUSE = warehouses?.map((__warehouse) => {
    return {
      value: __warehouse?.id,
      label: __warehouse?.name,
      default: __warehouse?.is_default,
      isProviderWh: __warehouse?.fulfillment_by == PROVIDER_WH
    };
  });

  const values_select_scan = OPTIONS_SELECT?.find(
    (__item) => __item.value == state.typeOptionScan
  );
  const placeholderInputScan = `Quét hoặc nhập ${formatMessage(
    values_select_scan.label
  ).toLocaleLowerCase()} huỷ bất thường`;  

  const handleScan = (e) => {
    if (e.keyCode == 13) {
      if (!inputRefOrder.current.value) return;
      if (state?.dataScaned.length == MAXIMUM_ORDER) {
        inputRefOrder.current.value = "";
        addToast("Hiện tại, hệ thống chỉ xử lý 200 đơn/lần, vui lòng thêm đơn huỷ bất thường mới tại lượt xử lý kế tiếp", {
          appearance: "error",
        });
        return;
      }
      if (inputRefOrder.current.value == state.scanInputValue) {
        refetchScan();
        return;
      }
      updateState({ scanInputValue: inputRefOrder.current.value });
      inputRefOrder.current.value = "";
    }
  };
  useScanDetection({
    onComplete: async (value) => {
      if (document?.activeElement != inputRefOrder?.current) return;

      if (state?.dataScaned.length == MAXIMUM_ORDER) {
        inputRefOrder.current.value = "";
        addToast("Hiện tại, hệ thống chỉ xử lý 200 đơn/lần, vui lòng thêm đơn huỷ bất thường mới tại lượt xử lý kế tiếp", {
          appearance: "error",
        });
        return;
      }
      if (!value) return;
      if (value == state.scanInputValue) {
        refetchScan();
        return;
      }
      updateState({ scanInputValue: value });
      inputRefOrder.current.value = "";
    },
  });
  return (
    <Card>
      <CardBody>
        <>
          <p
            className="text-dark mb-2"
            style={{ fontSize: "14px", fontWeight: 700 }}
          >
            {formatMessage({ defaultMessage: "Thông tin xử lý" })}
          </p>
          <div className="row d-flex align-items-center">
            <div style={{ zIndex: 41, cursor: 'not-allowed' }} className="col-5 d-flex align-items-center">
              <span
                className="col-3 col-form-label p-0"
                style={{ color: "#000000" }}
              >
                {formatMessage({ defaultMessage: "Kho nhận hàng" })}
                <span className="text-primary"> *</span>
              </span>
              <Select
                name="warehouse"
                className="w-100 custom-select-order"
                placeholder={formatMessage({ defaultMessage: "Kho mặc định" })}
                style={{ borderRadius: 0 }}
                value={OPTIONS_SELECT_WAREHOUSE?.find(
                  (__item) => __item?.value == state?.warehouse
                ) || OPTIONS_SELECT_WAREHOUSE?.find(
                  (__item) => !!__item.default
                )}
                onChange={(valueSelect) => {
                  updateState({ warehouse: valueSelect.value });
                }}
                options={OPTIONS_SELECT_WAREHOUSE?.filter(wh => !wh?.isProviderWh)}
                formatOptionLabel={(option, labelMeta) => {
                  return <div>{option.label}</div>;
                }}
              />
            </div>
            <div className="row col-7 align-items-center">
              <div className="text-right col-6">
                <span>
                  {formatMessage({
                    defaultMessage: "Hình thức nhập kho",
                  })}
                </span>
              </div>
              <div className="col-6" style={{ marginTop: "27px" }}>
                <Field
                  name="import_form_type"
                  component={RadioGroup}
                  value={values.import_form_type}
                  curr
                  // label={'Loại kiểm kho'}
                  customFeedbackLabel={" "}
                  options={CREATION_METHODS}
                ></Field>
              </div>
            </div>
          </div>
        </>
        <div className="form-group row my-4">
          <Select
            disabled={loadingScan}
            options={OPTIONS_SELECT}
            className="w-100 col-3 mr-0 pr-0 custom-select-order"
            style={{ borderRadius: 0 }}
            value={values_select_scan || OPTIONS_SELECT[0]}
            onChange={(valueSelect) => {
              updateState({ typeOptionScan: valueSelect.value });
            }}
            formatOptionLabel={(option, labelMeta) => {
              return <div>{formatMessage(option.label)}</div>;
            }}
          />
          <div
            className="col-5 input-icon pl-0 ml-0"
            style={{ height: "fit-content" }}
          >
            <input
              type="text"
              aria-label="Quét"
              className="form-control placeholder_center"
              placeholder={placeholderInputScan}
              disabled={loadingScan}
              style={{
                height: 38,
                borderRadius: 0,
                paddingLeft: "50px",
              }}
              ref={inputRefOrder}
              onKeyUp={(e) => {
                handleScan(e);
              }}
            />
            <span>
              <i className="flaticon2-search-1 icon-md ml-6"></i>
            </span>
          </div>
          <div
            style={{ display: "flex", justifyContent: "flex-end" }}
            className="col-4 w-100"
          >
            <button
              className="btn"
              disabled={state.dataScaned.length > 0}
              onClick={() => updateState({ modalUpload: true })}
              style={{
                border: "1px solid #ff5629",
                color: "#ff5629",
              }}
            >
              <SVG
                className="mr-2"
                src={toAbsoluteUrl("/media/upload_cloud.svg")}
              ></SVG>
              {formatMessage({ defaultMessage: "Nhập file" })}
            </button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export default forwardRef(InfoProcess);
