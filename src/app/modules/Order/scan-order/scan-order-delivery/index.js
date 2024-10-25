import React, {
  memo,
  useState,
  useLayoutEffect,
  Fragment,
  useMemo
} from "react";
import { Card, CardBody } from "../../../../../_metronic/_partials/controls";

import SVG from "react-inlinesvg";
import { Helmet } from "react-helmet-async";
import { useSubheader } from "../../../../../_metronic/layout";
import { useMutation, useQuery } from "@apollo/client";
import { toAbsoluteUrl } from "../../../../../_metronic/_helpers";
import ScanFilter from "./ScanFilter";
import ScanTable from "./ScanTable";
import query_coGetPackage from "../../../../../graphql/query_coGetPackage";
import { useHistory, useLocation } from 'react-router-dom';
import queryString from 'querystring';
import { useIntl } from "react-intl";
import query_sc_stores_basic from "../../../../../graphql/query_sc_stores_basic";
import query_sme_catalog_stores from "../../../../../graphql/query_sme_catalog_stores";

export default memo(() => {
  const { setBreadcrumbs } = useSubheader();
  const [checkStatus, setCheckStatus] = useState(false);
  const [isRemoveData, setIsRemoveData] = useState(false);
  const [detectFistQuery, setDetectFirstQuery] = useState(true);
  const [totalOrder, setTotalOrder] = useState();
  const [oderSearchValue, setOrderSearchValue] = useState("");
  const [dataScaned, setDataScaned] = useState([]);
  const [warehouse, setWarehouse] = useState({})
  const location = useLocation();
  const { formatMessage } = useIntl()
  const params = queryString.parse(
    decodeURIComponent(location.search).slice(1, 100000)
  );
  useLayoutEffect(() => {
    setBreadcrumbs([
      {
        title: formatMessage({ defaultMessage: "Quét xác nhận đóng gói" }),
      },
    ]);
  }, []);
  const { data: dataStore, loading: loadingStore } = useQuery(query_sc_stores_basic, {
    fetchPolicy: 'cache-and-network',
  });
  const { data: dataSearch, loading, refetch: refetchLoadOrder } = useQuery(query_coGetPackage, {
    variables: {
      q: params.q,
      search_type: params.search_type,
      sme_warehouse_id: warehouse?.id
    },
    skip: !params.q && !params.search_type,
    fetchPolicy: 'cache-and-network',
  });
  console.log(warehouse)
  const { data: dataSmeWarehouse } = useQuery(query_sme_catalog_stores, {
    fetchPolicy: 'cache-and-network'
  });
  useMemo(() => {
    const selectedWarehouse = dataSmeWarehouse?.sme_warehouses?.map(wh => {
      return {
        ...wh,
        value: wh?.id
      }
    })?.find(wh => wh?.is_default)
    setWarehouse(selectedWarehouse)
  }, [dataSmeWarehouse])
  return (
    <Fragment>
      <Helmet
        titleTemplate={formatMessage({ defaultMessage: "Quét xác nhận đóng gói" }) + " - UpBase"}
        defaultTitle={formatMessage({ defaultMessage: "Quét xác nhận đóng gói" }) + " - UpBase"}
      >
        <meta name="description" content={formatMessage({ defaultMessage: "Quét xác nhận đóng gói" }) + " - UpBase"} />
      </Helmet>

      <ScanFilter
        setIsRemoveData={setIsRemoveData}
        oderSearchValue={oderSearchValue}
        setOrderSearchValue={setOrderSearchValue}
        checkStatus={checkStatus}
        totalOrder={totalOrder}
        setDetectFirstQuery={setDetectFirstQuery}
        setDataScaned={setDataScaned}
        setCheckStatus={setCheckStatus}
        refetchLoadOrder={refetchLoadOrder}
        dataScaned={dataScaned}
        warehouse={warehouse}
        setWarehouse={setWarehouse}
        optionWarehouses={dataSmeWarehouse?.sme_warehouses?.map(wh => {
          return {
            ...wh,
            value: wh?.id
          }
        })}
      />
      <ScanTable
        dataStore={dataStore}
        dataScaned={dataScaned}
        setDataScaned={setDataScaned}
        isRemoveData={isRemoveData}
        setCheckStatus={setCheckStatus}
        checkStatus={checkStatus}
        setTotalOrder={setTotalOrder}
        setOrderSearchValue={setOrderSearchValue}
        detectFistQuery={detectFistQuery}
        dataSearch={dataSearch}
        loading={loading}
        warehouse={warehouse}
        setWarehouse={setWarehouse}
      />
      <div
        id="kt_scrolltop1"
        className="scrolltop"
        style={{ bottom: 80 }}
        onClick={() => {
          window.scrollTo({
            letf: 0,
            top: document.body.scrollHeight,
            behavior: "smooth",
          });
        }}
      >
        <span className="svg-icon">
          <SVG
            src={toAbsoluteUrl("/media/svg/icons/Navigation/Down-2.svg")}
            title={" "}
          ></SVG>
        </span>{" "}
      </div>
    </Fragment>
  );
});

export const actionKeys = {
  "order_scan_delivery_view": {
    router: '/orders/scan-order-delivery',
    actions: [
      "sc_stores", "op_connector_channels", "coGetPackage", "coReadyToShipPackage", "coPrintShipmentPackage", "sme_catalog_product_variant_by_pk"
    ],
    name: 'Quét xác nhận đóng gói',
    group_code: 'order_scan',
    group_name: 'Quét đơn hàng',
    cate_code: 'order_service',
    cate_name: 'Quản lý đơn hàng',
  },
};
