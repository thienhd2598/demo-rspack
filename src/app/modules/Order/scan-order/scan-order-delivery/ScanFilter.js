import React, { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Card, CardBody } from "../../../../../_metronic/_partials/controls";
import queryString from "querystring";
import { useHistory, useLocation } from "react-router-dom";
import Select from "react-select";
import { useOnKeyPress } from "../../../../../hooks/useOnKeyPress";
import { useMutation } from "@apollo/client";
import mutate_coReadyToShipPackage from "../../../../../graphql/mutate_coReadyToShipPackage";
import mutate_coPrintShipmentPackage from "../../../../../graphql/mutate_coPrintShipmentPackage";
import ModalResultDelivery from "./components/ModalResultDelivery";
import { useToasts } from "react-toast-notifications";
import ModalPrintResults from "../../dialog/ModalPrintResults";
import useScanDetection from "../../../../../hooks/useScanDetection";
import { useIntl } from "react-intl";
import ModalInprogress from "../../order-list-batch/dialog/ModalInprogress";
import { typesScan } from "../../../WarehouseBills/WarehouseList/constants";

const DURATION = 10;

const ScanFilter = ({
  setDataScaned,
  setOrderSearchValue,
  totalOrder,
  setDetectFirstQuery,
  setIsRemoveData,
  checkStatus,
  setCheckStatus,
  oderSearchValue,
  refetchLoadOrder,
  dataScaned,
  optionWarehouses,
  warehouse,
  setWarehouse
}) => {
  const inputRefOrder = useRef(null);
  const refSelectOrder = useRef(null);
  const { formatMessage } = useIntl();
  const history = useHistory();
  const location = useLocation();
  const [dataResults, setDataResults] = useState(null);
  const [dataPrint, setDataPrint] = useState();
  const [typOrder, setTypeOrder] = useState("system_package_number");
  const [step, setStep] = useState(1);
  const [totalOrderSuccess, setTotalOrderSuccess] = useState(0);
  const [totalOrderError, setTotalOrderError] = useState(0);
  const [totalInprogress, setTotalInprogress] = useState(0);
  const [loadingInprogress, setLoadingInprogress] = useState(false);

  const { addToast } = useToasts();
  const [onReadyToShipPackage, { data, loading: loadingShipPackage }] = useMutation(mutate_coReadyToShipPackage, {
    refetchQueries: true
  });

  useLayoutEffect(() => inputRefOrder.current.focus(), [])

  useScanDetection({
    onComplete: async (value) => {
      if (document?.activeElement != inputRefOrder?.current) return;
      handleSearch(value);
    },
  });

  const [onPrintShipmentPackage, { data: printData, loading: loadingWithShipOrder }] = useMutation(mutate_coPrintShipmentPackage);

  useEffect(() => {
    setDataPrint(printData?.coPrintShipmentPackage?.data);
  }, [printData]);

  const onSetDataResult = useCallback((result) => {
    setTotalInprogress(0);
    setLoadingInprogress(false);
    setTotalOrderSuccess(0);
    setTotalOrderError(0);
    setDataResults(result);
  }, []);

  const handleReadyToShipPackage = async (e, count = DURATION, totalSuccess = 0, totalFail = 0, listFail = []) => {
    if (e.keyCode == 112 && count == DURATION && !dataScaned.length) {
      addToast(formatMessage({ defaultMessage: "Danh sách kiện hàng rỗng, xin vui lòng scan đơn" }), { appearance: "error" });
      return
    }

    if (step != 1 || (count == DURATION && !dataScaned.length) || warehouse?.fulfillment_scan_export_mode == typesScan?.SINGLE_SCAN) {
      return;
    }

    const result = {
      total_success: totalSuccess,
      total_fail: totalFail,
      list_package_fail: listFail
    };

    const dataHandled = dataScaned?.slice(count - DURATION, count);
    const dataRemaning = dataScaned?.slice(count);

    try {
      setTotalInprogress(dataRemaning?.length);
      setLoadingInprogress(true);

      if (dataHandled?.length == 0) {
        onSetDataResult(result);
        const dataFail = listFail?.map((packFail) => packFail?.package_id);
        const dataSuccess = dataScaned.filter((item) => !dataFail.includes(item?.id));
        setDataScaned(dataSuccess);
        if (listFail?.length !== (totalFail + totalSuccess)) {
          setStep(2);
        }

        return;
      }

      let { data } = await onReadyToShipPackage({
        variables: {
          list_package: dataHandled.map((e) => ({ package_id: e?.id })),
          need_check_shipping_carrier: 0
        },
      });

      if (!data?.coReadyToShipPackage?.success) {
        totalSuccess += 0;
        totalFail += dataHandled?.length;
        listFail = listFail?.concat(dataHandled?.map(item => ({
          system_package_number: item?.system_package_number,
          error_message: data?.coReadyToShipPackage?.message
        })));
      } else {
        totalSuccess += data?.coReadyToShipPackage?.data?.total_success;
        totalFail += data?.coReadyToShipPackage?.data?.total_fail;
        listFail = listFail?.concat(data?.coReadyToShipPackage?.data?.list_package_fail);
      }
      
      setTotalOrderSuccess(totalSuccess);
      setTotalOrderError(totalFail);

      handleReadyToShipPackage(e, count + DURATION, totalSuccess, totalFail, listFail);
    } catch (error) {
      onSetDataResult(result);
    }
  };

  useOnKeyPress(handleReadyToShipPackage, "F1");

  // IN biên bản bàn giao
  function handlePrintShipmentOrder(e) {
    try {
      if (step != 2 && warehouse?.fulfillment_scan_export_mode == typesScan?.MULTIPLE_SCAN) {
        return;
      }

      if (e.keyCode == 112 && !dataScaned.length) {
        addToast(formatMessage({ defaultMessage: "Danh sách kiện hàng rỗng, xin vui lòng scan đơn" }), { appearance: "error" });
        return
      }

      if (checkStatus) {
        onPrintShipmentPackage({
          variables: {
            awaitRefetchQueries: true,
            list_package: dataScaned.map((e) => ({ package_id: e?.id })),
            list_print_type: [4],
            need_check_shipping_carrier: 0
          },
        });
        return;
      }
    } catch (error) { }
  }
  useOnKeyPress(handlePrintShipmentOrder, "F1");
  function handleSearch(value) {

    history.push(`/orders/scan-order-delivery?${queryString.stringify({ q: value, search_type: typOrder })}`);
    setDetectFirstQuery(false);
  }

  function handleClear() {
    if (totalOrder || inputRefOrder.current.value || step == 2) {
      if (step == 2) {
        setStep(1);
        setCheckStatus(false);
      }
      history.push(`/orders/scan-order-delivery`);
      setDataScaned([]);
      setIsRemoveData(true);
      setTypeOrder('tracking_number')
      setOrderSearchValue(false);
      setDataResults(null);
      inputRefOrder.current.value = "";
      addToast(formatMessage({ defaultMessage: "Thành công" }), {
        appearance: "success",
      });
      return;
    }
  }
  useOnKeyPress(handleClear, "F3");

  const params = queryString.parse(decodeURIComponent(location.search).slice(1, 100000));

  useEffect(() => {
    inputRefOrder.current.value = params.q || "";
  }, [params.q]);

  useEffect(() => {
    if (oderSearchValue) {
      history.push(`/orders/scan-order-delivery`);
      inputRefOrder.current.value = "";
      setOrderSearchValue(false);
    }
  }, [oderSearchValue]);

  const optionsSearch = [
    {
      value: "system_package_number",
      label: formatMessage({ defaultMessage: "Mã kiện hàng" }),
    },
    {
      value: "tracking_number",
      label: formatMessage({ defaultMessage: "Mã vận đơn" }),
    },

  ];
  return (
    <>
      <ModalInprogress
        type="ready-to-deliver"
        show={loadingInprogress}
        total={dataScaned?.length}
        totalInprogress={totalInprogress}
        totalOrderError={totalOrderError}
        totalOrderSuccess={totalOrderSuccess}
      />
      <ModalPrintResults
        key={Math.random() * 99}
        onHide={() => {
          setDataPrint(null);
        }}
        totalOrder={totalOrder}
        status={true}
        showResults={dataPrint}
        optionPrint={[4]}
      />
      <ModalResultDelivery
        key={Math.random() * 99}
        totalOrder={totalOrder}
        dataResults={dataResults}
        type={"ready-to-deliver"}
        onHide={() => setDataResults(null)}
      />
      <Card>
        {
          warehouse?.fulfillment_scan_export_mode == typesScan?.MULTIPLE_SCAN && <div style={{ display: "flex", alignItems: "center" }}>
            <p className="ml-4" style={{ fontWeight: 500, fontSize: "1.275rem", color: "#000000" }}>{formatMessage({ defaultMessage: "Quét mã vạch" })}</p>
            <div style={{ margin: "auto" }} id="kt_subheader" className="subheader py-2 py-lg-4 subheader-transparent mb-0">
              <div className="d-flex align-items-center justify-content-between flex-wrap flex-sm-nowrap">
                <div className="d-flex align-items-center flex-wrap mr-1" style={{ fontSize: "14px", fontWeight: 700 }}>
                  <div className="d-flex align-items-baseline mr-1">
                    <p className="my-2 mr-1" style={{ color: step == 1 ? "#f86c45" : "" }}>
                      {formatMessage({ defaultMessage: "1.Sẵn sàng giao" })}
                    </p>
                  </div>
                  <ul className="breadcrumb breadcrumb-transparent font-weight-bold p-0 my-2">
                    <li className="breadcrumb-item"> ━ </li>
                    <li className="breadcrumb-item">
                      <p className="mb-0" style={{ color: step == 2 ? "#f86c45" : "", fontSize: "14px", fontWeight: 700, }}>
                        {formatMessage({ defaultMessage: "2.In biên bản bàn giao", })}
                      </p>
                    </li>
                  </ul>
                </div>
                <div className="d-flex align-items-center"></div>
              </div>
            </div>
          </div>

        }

        <CardBody className='py-5"'>
          <div className="row d-flex justify-content-between" style={{ fontSize: "15px" }}>
            <div className="col-4 pr-4 d-flex align-items-center" style={{ zIndex: 2 }}>
              <label className="mb-0 flex-3" style={{ lineHeight: '37px' }}>{formatMessage({ defaultMessage: "Kho xử lý" })}</label>
              <Select
                options={optionWarehouses}
                className="w-100 custom-select-order flex-7"
                style={{ borderRadius: 0 }}
                value={optionWarehouses?.find((_op) => _op.value === warehouse?.value)}
                onChange={(value) => {
                  setWarehouse(value);
                }}
                formatOptionLabel={(option, labelMeta) => {
                  return <div>{option.name}</div>;
                }}
                isDisabled={dataScaned?.length}
              />
            </div>
            <div className="col-7 d-flex" style={{ height: "fit-content" }}>
              <Select
                options={optionsSearch}
                ref={refSelectOrder}
                className="w-100 custom-select-order flex-3"
                style={{ borderRadius: 0 }}
                value={optionsSearch.find((_op) => _op.value === typOrder)}
                onKeyDown={e => {
                  if (e.keyCode === 39 && !e.target.value) {
                    inputRefOrder.current.focus();
                    return;
                  }
                }}
                onChange={(value) => {
                  inputRefOrder.current.focus();
                  setTypeOrder(value.value);
                  if (inputRefOrder?.current.value) {
                    history.push(`/orders/scan-order-delivery?${queryString.stringify({ ...params, search_type: value.value, })}`);
                  }
                }}
                formatOptionLabel={(option, labelMeta) => {
                  return <div>{option.label}</div>;
                }}
              />
              <div className="input-icon pl-0 flex-7">
                <input
                  disabled={step == 2}
                  type="text"
                  className="form-control"
                  placeholder={typOrder == "system_package_number" ?
                    formatMessage({ defaultMessage: "Quét hoặc nhập mã kiện hàng" })
                    : formatMessage({ defaultMessage: "Quét hoặc nhập mã vận đơn", })
                  }
                  style={{ height: 37, borderRadius: 0, paddingLeft: "50px", fontSize: "15px" }}
                  ref={inputRefOrder}
                  onKeyDown={(e) => {
                    if (e.keyCode === 37 && !e.target.value) {
                      refSelectOrder.current.focus();
                      return;
                    }

                    if (e.keyCode == 13) {
                      if (e.target.value == params.q) {
                        refetchLoadOrder();
                        return;
                      }
                      handleSearch(e.target.value);
                    }
                  }}
                />
                <span><i className="flaticon2-search-1 icon-md ml-6"></i></span>
              </div>
            </div>
          </div>
          <div className="d-flex justify-content-end my-6">
            {step == 1 && warehouse?.fulfillment_scan_export_mode == typesScan?.MULTIPLE_SCAN ? (
              <div className="mr-4" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                <button style={{ fontSize: "15px", fontWeight: 700 }} className="btn btn-primary btn-elevate w-100"
                  onClick={handleReadyToShipPackage}
                  disabled={loadingShipPackage || !checkStatus || !dataScaned.length}
                >
                  {loadingShipPackage ? formatMessage({ defaultMessage: "Xin chờ..." }) : formatMessage({ defaultMessage: "XÁC NHẬN ĐÓNG GÓI VÀ SẴN SÀNG GIAO (F1)" })}
                </button>
              </div>
            ) : null}

            {step == 2 || warehouse?.fulfillment_scan_export_mode == typesScan?.SINGLE_SCAN ? (
              <div className="mr-4">
                <button className="btn btn-primary w-100"
                  style={{ borderColor: "#ff5629", fontWeight: 700, fontSize: "15px" }}
                  type="submit"
                  disabled={loadingWithShipOrder || !dataScaned.length}
                  onClick={handlePrintShipmentOrder}
                >
                  {loadingWithShipOrder ? formatMessage({ defaultMessage: "Xin chờ..." }) : formatMessage({ defaultMessage: "IN BIÊN BẢN BÀN GIAO (F1)", })}
                </button>
              </div>
            ) : null}
            <div className="" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <button className="btn btn-primary btn-elevate w-100"
                style={{ background: "#6C757D", border: "#6C757D", fontSize: "15px", fontWeight: 700, }}
                onClick={handleClear}
              >
                {formatMessage({ defaultMessage: "XÓA VÀ QUÉT TIẾP (F3)" })}
              </button>
            </div>
          </div>
        </CardBody>
      </Card>
    </>
  );
};

export default memo(ScanFilter);
