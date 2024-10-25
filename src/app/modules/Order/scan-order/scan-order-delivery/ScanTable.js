import React, { memo, useEffect, useMemo } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  CardHeaderToolbar,
} from "../../../../../_metronic/_partials/controls";
import queryString from "querystring";
import { useLocation } from "react-router-dom";
import { useToasts } from "react-toast-notifications";
import { useDidUpdate } from "../../../../../hooks/useDidUpdate";
import { PackStatusName } from "../../OrderStatusName";
import { useIntl } from "react-intl";
import { useMutation } from "@apollo/client";
import mutate_coReadyToShipPackage from "../../../../../graphql/mutate_coReadyToShipPackage";
import _ from "lodash";
import { typesScan } from "../../../WarehouseBills/WarehouseList/constants";

const ScanTable = ({
  dataScaned,
  setDataScaned,
  setOrderSearchValue,
  setTotalOrder,
  isRemoveData,
  setCheckStatus,
  dataSearch,
  loading,
  dataStore,
  warehouse,
}) => {
  const { addToast } = useToasts();
  const location = useLocation();
  const { formatMessage } = useIntl();
  const params = queryString.parse(decodeURIComponent(location.search).slice(1, 100000));

  useDidUpdate(() => {
    setTotalOrder(dataScaned.map((elm) => elm.orderItems.map((elm) => elm.quantity_purchased)).flat().reduce((accumulator, currentValue) => +accumulator + +currentValue, 0));
  }, [dataScaned]);

  const [onReadyToShipPackage, { data, loading: loadingShipPackage }] = useMutation(mutate_coReadyToShipPackage, {
    refetchQueries: true
  });
  const hiddenTextStatus = (data) => {
    let { status, pack_status } = PackStatusName(data?.pack_status, data?.order?.status);

    return status;
  };
  const carriers = useMemo(() => dataScaned?.map((elm) => elm?.shipping_carrier),[dataScaned]);

  const carrier = useMemo(() => {
    if (carriers?.length > 0) {
      return carriers.includes(dataSearch?.coGetPackage?.data?.shipping_carrier);
    }
    return true;
  }, [dataSearch]);

  const isValidOrder = useMemo(async () => {
    if (dataSearch?.coGetPackage?.data && !loading && params.q) {
      let statusPk = dataSearch?.coGetPackage?.data?.pack_status == "packing";

      if (statusPk) {
        setCheckStatus(true);
        if (dataScaned?.some((elm) => elm.id == dataSearch?.coGetPackage?.data.id)) {
          setOrderSearchValue(true);
          addToast(formatMessage({ defaultMessage: "Kiện hàng đã quét rồi." }), {appearance: "error"});
          return false;
        }      
        
        setOrderSearchValue(true);
        if(warehouse?.fulfillment_scan_export_mode == typesScan?.SINGLE_SCAN) {
          let { data } = await onReadyToShipPackage({
            variables: {
              list_package: [{package_id: dataSearch?.coGetPackage?.data?.id}],
              need_check_shipping_carrier: 0
            },
          });
          if (data?.coReadyToShipPackage?.success && !data?.coReadyToShipPackage?.data?.list_package_fail?.length) {
            addToast(formatMessage({defaultMessage: 'Sẵn sàng giao thành công.'}), {appearance: 'success'})
            setDataScaned((prev) => {
              return [...prev, dataSearch?.coGetPackage?.data];
            });
          } else if (!data?.coReadyToShipPackage?.success) {
            addToast(data?.coReadyToShipPackage?.message || formatMessage({defaultMessage: 'Sẵn sàng giao thất bại'}), {appearance: 'error'})
          } else {
            addToast(formatMessage({defaultMessage: 'Sẵn sàng giao thất bại'}), {appearance: 'error'})
          }
        } else {
          setDataScaned((prev) => {
            return [...prev, dataSearch?.coGetPackage?.data];
          });
        }
      } else {
        setOrderSearchValue(true);
        addToast(formatMessage({defaultMessage:"Kiện hàng đang ở trạng thái “{status}” nên không hợp lệ .Tính năng này chỉ hỗ trợ những đơn hàng đang ở trạng thái “Đang đóng gói”.",},{ status: formatMessage(hiddenTextStatus(dataSearch?.coGetPackage?.data))}),{ appearance: "error" });
      }
    }
    if ( dataSearch && dataSearch?.coGetPackage?.data == null && !loading && params.q) {
      setOrderSearchValue(true);
      addToast(formatMessage({ defaultMessage: "Kiện hàng không tồn tại." }), {appearance: "error",});
    }
  }, [dataSearch, loading, params.q]);

  useDidUpdate(() => {
    if (isRemoveData) {
      setDataScaned([]);
      setCheckStatus(false);
    }
  }, [isRemoveData]);

  const newDataScaned = useMemo(() => {
    const parsedData = [...dataScaned].map((item) => {
      const quantity = item?.orderItems?.reduce((result, value) => {
        let totalQuantityItem;
        if (value.is_combo) {
          totalQuantityItem = _.sum(value?.comboItems?.map((_combo) => _combo?.purchased_quantity));
        } else {
          totalQuantityItem = value?.quantity_purchased;
        }

        result += totalQuantityItem;
        return result;
      }, 0);
      return {
        ...item,
        quantity,
      };
    });

    return parsedData;
  }, [dataScaned]);
  const totalItemsOrder = newDataScaned.map((elm) => elm?.quantity).reduce((result, current) => +result + +current, 0);
  const totalMoneyItemOrder = newDataScaned.map((elm) => elm?.order.paid_price).reduce((result, current) => result + current, 0);

  return (
    <Card>
      <CardHeader title={formatMessage({ defaultMessage: "Danh sách kiện hàng" })}>
        <CardHeaderToolbar></CardHeaderToolbar>
      </CardHeader>
      <CardBody className='px-8 py-5"'>
        <div
          className="d-flex align-items-center flex-wrap my-4 row    "
          style={{ gap: "10%", fontSize: "15px" }}
        >
          <div>
            <span className="mr-2">{formatMessage({ defaultMessage: "TỔNG KIỆN HÀNG" })}: </span>
            <b>{newDataScaned.length ? newDataScaned.length : 0}</b>
          </div>
          <div>
            <span className="mr-2">
              {formatMessage({ defaultMessage: "TỔNG HÀNG HÓA" })}:
            </span>
            <b>{totalItemsOrder}</b>
          </div>
          <div>
            <span className="mr-2">
              {formatMessage({ defaultMessage: "TỔNG GIÁ TRỊ" })}:
            </span>
            <b>
              {totalMoneyItemOrder?.toLocaleString("vi", {style: "currency", currency: "VND"})}
            </b>
          </div>
        </div>
        <div className="row d-flex justify-content-between">
          <table className="table  table-borderless product-list  table-vertical-center fixed">
            <tbody>
              {/* <tr className="font-size-lg" style={{ fontSize: "15px" }}>
                <td width={"25%"}>
                  <b>{formatMessage({ defaultMessage: "Vận chuyển" })}</b>
                </td>
                <td colSpan={4}>
                  {dataScaned && <b>{dataScaned[0]?.shipping_carrier}</b>}
                </td>
              </tr> */}
              <tr className="font-size-lg" style={{ fontSize: "15px", borderTop: "1px solid #d9d9d9" }}>
                <td width="25%" style={{ borderTop: "0" }}>
                  <b>{formatMessage({ defaultMessage: "Đơn hàng" })}</b>
                </td>
                <td width="20%" className="text-center" style={{ borderTop: "0" }}>
                  <b>{formatMessage({ defaultMessage: "Số lượng hàng hóa" })}</b>
                </td>
                <td width="20%" className="text-center" style={{ borderTop: "0" }}>
                  <b>{formatMessage({ defaultMessage: "Thành tiền" })}</b>
                </td>
                <td width="25%" className="text-center" style={{ borderTop: "0" }}>
                  <b>{formatMessage({ defaultMessage: "Vận chuyển" })}</b>
                </td>
                <td width="10%" className="text-center" style={{ borderTop: "0" }}>
                  <b>{formatMessage({ defaultMessage: "Thao tác" })}</b>
                </td>
              </tr>
              {loading && (
                <div className="text-center w-100 mt-4" style={{ position: "absolute" }}>
                  <span className="ml-3 spinner spinner-primary"></span>
                </div>
              )}

              {newDataScaned.length
                ? newDataScaned.map((data, __index) => (
                  <tr key={__index} className="font-size-lg">
                    <td style={{ fontSize: "15px" }}>
                      <div style={{ display: 'flex', flexDirection: 'column'}}>
                        <span className="mb-2">{data.order.ref_id}</span>
                        <span style={{color: 'gray', fontSize: '12px'}}>{formatMessage({defaultMessage: 'Mã kiện hàng: {packNumber}'}, {packNumber: data.system_package_number})}</span>
                      </div>
                    </td>
                    <td className="text-center" style={{ fontSize: "22px" }}>{data?.quantity}</td>

                    <td className="text-center" style={{ fontSize: "18px" }}>
                      <b> {data?.order?.paid_price?.toLocaleString("vi", { style: "currency",currency: "VND"})}</b>
                    </td>
                    <td style={{ fontSize: "15px" }}>
                      <>
                        {data.shipping_carrier} <br />
                        {formatMessage({ defaultMessage: "Mã vận đơn" })}:
                        {data.tracking_number}
                      </>
                    </td>
                    <td className="text-center" style={{ fontSize: "15px" }}>
                      <i className="fas fa-trash-alt text-danger cursor-pointer" 
                      onClick={() => {
                        setDataScaned(prev => prev.filter(item => item?.id != data?.id))
                      }}
                      />
                    </td>
                  </tr>
                ))
                : null}

              {loading && (
                <div className="text-center w-100 mt-4" style={{ position: "absolute" }}>
                  <span className="ml-3 spinner spinner-primary"></span>
                </div>
              )}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  );
};

export default memo(ScanTable);
