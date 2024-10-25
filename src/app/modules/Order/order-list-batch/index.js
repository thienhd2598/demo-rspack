import React, {
  memo,
  useCallback,
  useMemo,
  useState,
  useEffect,
  Fragment,
  useLayoutEffect,
} from "react";
import {
  Card,
  CardBody,
  CardHeader,
} from "../../../../_metronic/_partials/controls";
import queryString from "querystring";
import { useHistory, useLocation } from "react-router-dom";
import OrderFilter from "./filter/OrderFilter";
import OrderTable from "./OrderTable";
import { toAbsoluteUrl } from "../../../../_metronic/_helpers";
import SVG from "react-inlinesvg";
import { Helmet } from "react-helmet-async";
import { useSubheader } from "../../../../_metronic/layout";
import _ from "lodash";
import BlockPackPreparing from "./components/BlockPackPreparing";
import BlockReadyToDeliver from "./components/BlockReadyToDeliver";
import BatchPrinting from "./BatchPrinting";
import mutate_coReloadOrder from "../../../../graphql/mutate_coReloadOrder";
import { useMutation, useQuery } from "@apollo/client";
import LoadingDialog from "../../ProductsStore/product-new/LoadingDialog";
import { useToasts } from "react-toast-notifications";
import query_coGetShippingCarrierFromListPackage from "../../../../graphql/query_coGetShippingCarrierFromListPackage";
import query_coGetStoreFromListPackage from "../../../../graphql/query_coGetStoreFromListPackage";
import query_coGetSmeWarehousesFromListPackage from "../../../../graphql/query_coGetSmeWarehousesFromListPackage";
import query_sc_stores_basic from "../../../../graphql/query_sc_stores_basic";
import op_connector_channels from "../../../../graphql/op_connector_channels";
import HandlingInventory from "./components/HandlingInventory";
import BlockPackProcess from "./components/BlockPackProcess";
import query_scGetPackages from "../../../../graphql/query_scGetPackages";
import { useIntl } from "react-intl";
import query_sme_catalog_stores from "../../../../graphql/query_sme_catalog_stores";
import query_scGetWarehouses from "../../../../graphql/query_scGetWarehouses";
import query_listOrderCheckingQuantity from "../../../../graphql/query_listOrderCheckingQuantity";
import { queryGetSmeProductVariants } from "../OrderUIHelpers";
import BlockLoadDocument from "./components/BlockLoadDocument";
import BlockExportOrderMulti from "./components/BlockExportOrderMulti";
import BlockLoadShipmentParam from "./components/BlockLoadShipmentParam";

export default memo(() => {
  const params = queryString.parse(useLocation().search.slice(1, 100000));
  const { setBreadcrumbs } = useSubheader();
  const [loadingSmeVariant, setLoadingSmeVariant] = useState(false);
  const [smeVariants, setSmeVariants] = useState([]);
  const { addToast } = useToasts();
  const { formatMessage } = useIntl()

  useLayoutEffect(() => {
    setBreadcrumbs([{ title: formatMessage({ defaultMessage: "Xử lý hàng loạt" }) }]);
  }, []);


  const [ids, setIds] = useState([]);
  const [total, setTotal] = useState();
  const [orderHandleBatch, setOrderHandleBatch] = useState(null);

  const { data: dataScWareHouse, loading: loadingScWarehouse } = useQuery(query_scGetWarehouses, {
    fetchPolicy: 'cache-and-network'
  });
  const { data: dataListOrderCheckingQuantity, loading: loadingListOrderChecking } = useQuery(query_listOrderCheckingQuantity, {
    fetchPolicy: 'cache-and-network'
  });

  const { data: dataStore, loading: loadingStore } = useQuery(query_sc_stores_basic, {
    variables: {
      context: 'order'
    },
    fetchPolicy: "cache-and-network",
  });

  const { data: dataSmeWarehouse, refetch: refetchSmeWarehouse } = useQuery(query_sme_catalog_stores, {
    fetchPolicy: 'cache-and-network'
  });

  const listOrderCheckingQuantity = useMemo(() => {
    return dataListOrderCheckingQuantity?.listOrderCheckingQuantity?.map(item => {
      const channelDetail = dataStore?.op_connector_channels?.find(cn => cn?.code == item?.connector_channel_code)
      const storeDetail = dataStore?.sc_stores?.find(store => store?.id == item?.store_id)
      return {
        ...item,
        img: channelDetail?.logo_asset_url,
        name: storeDetail?.name
      }
    })

  }, [dataStore, dataListOrderCheckingQuantity])


  const type = useMemo(() => {
    try {
      return params?.type || "ready_to_ship";
    } catch (error) {
      return {};
    }
  }, [params.type]);

  const not_document = useMemo(() => {
    try {
      if (!params?.not_document) return {};
      return { not_document: 1 };
    } catch (error) {
      return {};
    }
  }, [params.not_document]);

  const have_sme_note = useMemo(() => {
    try {
      if (!params?.have_sme_note) return {};
      return { have_sme_note: 1 };
    } catch (error) {
      return {};
    }
  }, [params.have_sme_note]);

  const range_time = useMemo(() => {
    try {
      if (!params.gt || !params.lt) return {};

      return {
        range_time: [Number(params?.gt), Number(params?.lt)],
      };
    } catch (error) {
      return {};
    }
  }, [params?.gt, params?.lt]);

  const q = useMemo(() => {
    return params.q;
  }, [params.q]);

  const payments = useMemo(() => {
    if (!params.payments) return {};
    return { payments: params.payments?.split(",") };
  }, [params.payments]);

  const type_parcel = useMemo(() => {
    if (!params.type_parcel) return {};
    return {
      type_parcel: params.type_parcel?.split(",")?.filter(type => type != 5).map(function (x) {
        return parseInt(x);
      }),
    };
  }, [params.type_parcel]);

  const print_status = useMemo(() => {
    if (!params.print_status) return {};
    return { print_status: params.print_status?.split(",") };
  }, [params.print_status]);

  const search_type = useMemo(() => {
    let _search_type = params.search_type || 'product_name';
    return _search_type;
  }, [params.search_type]);

  const check_status = useMemo(() => {
    let stt = params.is_check_status;
    if (stt) return +stt;
    return null
  }, [params.is_check_status]);

  const in_van_don = useMemo(() => {
    return { in_van_don: params.in_van_don };
  }, [params.in_van_don]);

  const in_phieu_xuat_kho = useMemo(() => {
    return { in_phieu_xuat_kho: params.in_phieu_xuat_kho };
  }, [params.in_phieu_xuat_kho]);

  const in_phieu_tong_hop = useMemo(() => {
    return { in_phieu_tong_hop: params.in_phieu_tong_hop };
  }, [params.in_phieu_tong_hop]);

  const status = useMemo(() => {
    try {
      if (!params.status) {
        return "not_error";
      }

      if (params?.status == 'wait_shipping_carrier') return "";

      return params?.status;
    } catch (error) {
      return {};
    }
  }, [params.status]);

  const [mutate, { loading: loadingReloadOrder }] = useMutation(mutate_coReloadOrder, {
    awaitRefetchQueries: true,
    refetchQueries: ["scGetPackages"],
  });

  const coReloadOrder = async (idsOrder) => {
    try {
      let variables = {
        list_sc_order_id: idsOrder,
      };

      let { data } = await mutate({
        variables: variables,
      });

      setIds([]);
      if (data?.coReloadOrder?.success) {
        addToast(formatMessage({ defaultMessage: "Đơn hàng tải lại thành công" }), { appearance: "success" });
      } else {
        addToast(formatMessage({ defaultMessage: "Đơn hàng tải lại thất bại" }), { appearance: "error" });
      }
    } catch (error) {
      addToast(formatMessage({ defaultMessage: "Đơn hàng tải lại thất bại" }), { appearance: "error" });
    }
  };

  const { data: dataChannel } = useQuery(op_connector_channels);

  const dataChannelCode = useMemo(() => {
    let data = dataChannel?.op_connector_channels;
    return data;
  }, [dataChannel]);



  const statusGetOrder = useMemo(() => {
    try {
      if (!!params?.not_document) return "";

      if (!params.status && params?.type != 'packed') {
        return "not_error";
      }

      if (params?.status == 'wait_shipping_carrier') return ""

      return params?.status;
    } catch (error) {
      return {};
    }
  }, [params.status, params?.not_document, params?.type]);

  const typeGetOrder = useMemo(() => {
    try {
      if (!params.type) {
        return "ready_to_ship";
      }

      if (params.type == "packed") {
        return "packed";
      }

      return params?.type;
    } catch (error) {
      return {};
    }
  }, [params.type]);

  const warehouse_id = useMemo(() => {
    let smeWarehouseDefault = dataSmeWarehouse?.sme_warehouses?.find(wh => wh?.is_default);
    if (!smeWarehouseDefault && dataSmeWarehouse?.sme_warehouses?.length) {
      smeWarehouseDefault = dataSmeWarehouse?.sme_warehouses[0]
    } else if (!dataSmeWarehouse?.sme_warehouses?.length) {
      smeWarehouseDefault = {}
    }
    if (!params?.warehouse_id) return {
      warehouse_id: smeWarehouseDefault?.id
    };
    return {
      warehouse_id: Number(params?.warehouse_id)
    }
  }, [params.warehouse_id, dataSmeWarehouse]);

  const { data: dataGetStoreFromListPackage, refetch: refetchGetStoreFromListOrder } = useQuery(query_coGetStoreFromListPackage, {
    fetchPolicy: 'cache-and-network',
    variables: {
      search: {
        warehouse_id: warehouse_id?.warehouse_id,
        list_status: [type],
        is_connected: 1,
        warehouse_filer: 2,
      }
    }
  });

  const [currentStore, optionStores] = useMemo(() => {
    let _options = dataGetStoreFromListPackage?.coGetStoreFromListPackage?.data.map((_store) => {
      let _channel = dataStore?.op_connector_channels?.find((_ccc) => _ccc.code == _store.connector_channel_code);
      return {
        label: _store.name,
        value: _store.id,
        logo: _channel?.logo_asset_url,
        number_package: _store?.number_package,
      };
    }) || [];

    let parseParamsStores = params?.stores?.split(",");
    let _currentStore = _options?.filter((_option) => parseParamsStores?.some((param) => param == _option?.value));

    return [_currentStore, _options];

  }, [dataStore, dataGetStoreFromListPackage, params.stores]);

  const stores = useMemo(() => {
    if (!params.stores)
      return {
        list_store: [optionStores[0]?.value],
      };
    return {
      list_store: params?.stores?.split(",").map(function (x) {
        return parseInt(x);
      }),
    };
  }, [params.stores, optionStores]);

  const { data: dataShippingCarrierFromListPackage, refetch: refetchCoGetShippingCarrier, } = useQuery(query_coGetShippingCarrierFromListPackage, {
    variables: {
      search: {
        list_status: [type],
        is_connected: 1,
        warehouse_id: warehouse_id?.warehouse_id,
        warehouse_filer: 2,
        ...stores,
      },
    },
    fetchPolicy: "cache-and-network",
  });

  const shipping_unit = useMemo(() => {
    if (!params.shipping_unit && dataShippingCarrierFromListPackage?.coGetShippingCarrierFromListPackage?.data) {
      return {
        shipping_unit: dataShippingCarrierFromListPackage?.coGetShippingCarrierFromListPackage?.data?.[0]?.shipping_carrier,
      };
    }
    return { shipping_unit: params.shipping_unit };
  }, [params.shipping_unit, dataShippingCarrierFromListPackage]);



  const { data: dataSmeWarehouses, refetch: refetchSmeWareHouse } = useQuery(query_coGetSmeWarehousesFromListPackage, {
    variables: {
      search: {
        list_status: [type],
        is_connected: 1,
        warehouse_filer: 2,
      },
    },
    fetchPolicy: "cache-and-network"
  });

  const mappingSmeWarehouse = useMemo(() => {
    return dataSmeWarehouse?.sme_warehouses?.map(wh => {
      const findWh = dataSmeWarehouses?.coGetSmeWarehousesFromListPackage?.data?.find(warehouse => warehouse?.sme_warehouse_id == wh?.id)
      return {
        ...wh,
        number_package: findWh?.number_package
      }
    })
  }, [dataSmeWarehouse, dataSmeWarehouses])

  const wait_shipping_carrier = useMemo(() => {
    if (!params?.type || params?.type == 'ready_to_ship') {
      return {
        wait_shipping_carrier: params?.status == 'wait_shipping_carrier' ? 1 : 2
      }
    }

    return {}
  }, [params?.status, params?.type]);

  let whereCondition = useMemo(() => {
    setIds([])
    return {
      list_status: type == "packed" ? [type] : [type, status],
      ...have_sme_note,
      ...not_document,
      ...range_time,
      ...shipping_unit,
      ...payments,
      ...type_parcel,
      ...print_status,
      ...stores,
      ...warehouse_id,
      ...wait_shipping_carrier,
      q: q,
      search_type: search_type,
      ...in_van_don,
      ...in_phieu_xuat_kho,
      ...in_phieu_tong_hop,
      is_connected: 1,
      warehouse_filer: 2,
    };
  }, [
    have_sme_note, not_document, type,
    status, stores, range_time,
    q, search_type, shipping_unit,
    warehouse_id, payments, type_parcel, wait_shipping_carrier,
    print_status, in_van_don, in_phieu_xuat_kho, in_phieu_tong_hop,
  ]);

  const [currentShippingUnit, optionsShippingUnit] = useMemo(() => {
    let parseParamsShippingUnit = params?.shipping_unit;
    let optionsShippingUnit = dataShippingCarrierFromListPackage?.coGetShippingCarrierFromListPackage?.data?.map((_ship) => {
      return { label: _ship.shipping_carrier, value: _ship.shipping_carrier, number_package: _ship?.number_package };
    });
    let currentShippingUnit = optionsShippingUnit?.filter((_option) => parseParamsShippingUnit == _option?.value);

    return [currentShippingUnit, optionsShippingUnit];
  }, [dataShippingCarrierFromListPackage, params]);

  const order_by = useMemo(() => {
    return params.order_by;
  }, [params.order_by]);

  const sort = useMemo(() => {
    return params.sort;
  }, [params.sort]);

  const page = useMemo(() => {
    try {
      let _page = Number(params.page);
      if (!Number.isNaN(_page)) {
        return Math.max(1, _page);
      } else {
        return 1;
      }
    } catch (error) {
      return 1;
    }
  }, [params.page]);

  const limit = useMemo(() => {
    try {
      let _value = Number(params.limit);
      if (!Number.isNaN(_value)) {
        return Math.max(25, _value);
      } else {
        return 25;
      }
    } catch (error) {
      return 25;
    }
  }, [params.limit]);

  const { data, loading: getOrderLoading, error, refetch } = useQuery(query_scGetPackages, {
    variables: {
      per_page: limit,
      page: page,
      order_by: order_by,
      order_by_type: sort || 'desc',
      context: 'order',
      search: {
        ...whereCondition,
        is_check_status: check_status,
        list_status: [statusGetOrder, typeGetOrder]?.filter(Boolean)
      },
    },
    fetchPolicy: "cache-and-network",
    onCompleted: async (data) => {
      setOrderHandleBatch(data?.scGetPackages?.[0]);
      const allIdsOrder = ids?.map(i => i.id)
      const filterLoaded = data?.scGetPackages?.map(el => {
        if (allIdsOrder.includes(el.id)) {
          return el
        }
      }).filter(el => el)
      setIds(filterLoaded)

      setLoadingSmeVariant(true);
      const smeVariants = await queryGetSmeProductVariants(data?.scGetPackages?.flatMap(order => order?.orderItems?.map(item => item?.sme_variant_id)));

      setLoadingSmeVariant(false);
      setSmeVariants(smeVariants);
    },
  }
  );
  console.log('data', data)

  return (
    <Fragment>
      <Helmet
        titleTemplate={formatMessage({ defaultMessage: 'Xử lý đơn hàng loạt' }) + " - UpBase"}
        defaultTitle={formatMessage({ defaultMessage: 'Xử lý đơn hàng loạt' }) + " - UpBase"}
      >
        <meta name="description" content={formatMessage({ defaultMessage: 'Xử lý đơn hàng loạt' }) + " - UpBase"} />
      </Helmet>
      <LoadingDialog show={loadingReloadOrder} />

      <div className="row">
        <div className="col-9">
          <Card>
            <CardBody>
              <OrderFilter
                ids={ids}
                listOrderCheckingQuantity={listOrderCheckingQuantity}
                loadingListOrderChecking={loadingListOrderChecking}
                mappingSmeWarehouse={mappingSmeWarehouse}
                getOrderLoading={getOrderLoading}
                whereCondition={whereCondition}
                dataChannel={dataChannel}
                dataChannelCode={dataChannelCode}
                orderHandleBatch={orderHandleBatch}
                optionStores={optionStores}
                currentStore={currentStore}
                optionsShippingUnit={optionsShippingUnit}
                currentShippingUnit={currentShippingUnit}
                coReloadOrder={coReloadOrder}
                type={type}
              />
              <OrderTable
                data={data}
                ids={ids}
                limit={limit}
                error={error}
                dataSmeWarehouse={dataSmeWarehouse}
                dataScWareHouse={dataScWareHouse}
                getOrderLoading={getOrderLoading}
                loadingSmeVariant={loadingSmeVariant}
                smeVariants={smeVariants}
                setIds={setIds}
                setTotal={setTotal}
                page={page}
                refetch={refetch}
                whereCondition={whereCondition}
              />
            </CardBody>
          </Card>
        </div>
        <div
          className="col-3"
          style={{ position: "sticky", zIndex: 2, height: "400px", top: 45 }}
        >
          {(["ready_to_ship"].includes(type) || !type) && params?.status != 'wait_shipping_carrier' && (
            <BlockPackProcess
              setIDs={setIds}
              refetch={() => {
                refetch();
                refetchSmeWareHouse();
                refetchCoGetShippingCarrier();
                refetchGetStoreFromListOrder();
              }}
              getOrderLoading={getOrderLoading}
              ids={ids}
              total={total}
            />
          )}
          {(["ready_to_ship"].includes(type) || !type) &&
            params?.status != 'wait_shipping_carrier' && !["warehouse_error"].includes(status) && (
              <BlockPackPreparing
                ids={ids}
                total={total}
                whereCondition={whereCondition}
                orderHandleBatch={orderHandleBatch}
                refetch={() => {
                  refetch();
                  refetchSmeWareHouse();
                  refetchCoGetShippingCarrier();
                  refetchGetStoreFromListOrder();
                }}
              />
            )}
          {["packing", "packed"].includes(type) && !["warehouse_error"].includes(status) && !params?.not_document && (
            <>
              <BatchPrinting
                ids={ids}
                setIds={setIds}
                total={total}
                status={type}
                whereCondition={whereCondition}
              />

            </>
          )}
          {type == 'packed' && (
            <BlockExportOrderMulti
              ids={ids}
              total={total}
              whereCondition={whereCondition}
              setIds={setIds} />
          )}
          {["packing"].includes(type) && !["warehouse_error"].includes(status) && !params?.not_document &&
            (<BlockReadyToDeliver
              ids={ids}
              setIds={setIds}
              total={total}
              status={type}
              refetch={refetch}
              whereCondition={whereCondition}
            />
            )}
          {["warehouse_error"].includes(status) && (
            <HandlingInventory
              ids={ids}
              setIds={setIds}
              total={total}
              status={type}
              whereCondition={whereCondition}
            />
          )}
          {params?.not_document &&
            <BlockLoadDocument
              ids={ids}
              setIds={setIds}
              orderHandleBatch={orderHandleBatch}
            />}
          {params?.status == 'wait_shipping_carrier' &&
            <BlockLoadShipmentParam
              ids={ids}
              setIds={setIds}
              orderHandleBatch={orderHandleBatch}
            />}
        </div>
      </div>

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
        </span>
      </div>
    </Fragment>
  );
});
export const actionKeys = {
  "order_list_batch_view": {
    router: '/orders/list-batch',
    actions: [
      "scGetWarehouses", "scGetPackages", "scPackageAggregate", "sc_stores", "op_connector_channels", "coGetSmeWarehousesFromListPackage", "coGetShippingCarrierFromListPackage",
      "coGetStoreFromListPackage", "sme_warehouses", "listOrderCheckingQuantity", "sme_warehouses_aggregate"
    ],
    name: 'Xem danh sách đơn xử lý hàng loạt',
    group_code: 'order_multiple',
    group_name: 'Xử lý hàng loạt',
    cate_code: 'order_service',
    cate_name: 'Quản lý đơn hàng',
  },
  "order_list_batch_order_prepare_multiple": {
    router: '',
    actions: [
      "coPreparePackage", 'scGetPackages', 'scPackageAggregate', "coGetPrepareParamViaFilter", "coActionPackageViaFilter"
    ],
    name: 'Chuẩn bị hàng hàng loạt',
    group_code: 'order_multiple',
    group_name: 'Xử lý hàng loạt',
    cate_code: 'order_service',
    cate_name: 'Quản lý đơn hàng',
  },
  "order_list_batch_ticket_print_multiple": {
    router: '',
    actions: [
      "coPrintShipmentPackage", "scGetPackages", "coActionPackageViaFilter"
    ],
    name: 'In các loại phiếu hàng loạt',
    group_code: 'order_multiple',
    group_name: 'Xử lý hàng loạt',
    cate_code: 'order_service',
    cate_name: 'Quản lý đơn hàng',
  },
  "order_list_batch_retry_package_multiple": {
    router: '',
    actions: [
      "coRetryWarehouseActionMultiPackage", "coRetryWarehousePackageViaFilter", "scGetPackages", 'coGetSmeWarehousesFromListPackage', 'coGetShippingCarrierFromListPackage'
    ],
    name: 'Xử lý tồn hàng loạt',
    group_code: 'order_multiple',
    group_name: 'Xử lý hàng loạt',
    cate_code: 'order_service',
    cate_name: 'Quản lý đơn hàng',
  },
  "order_list_batch_ready_to_ship_multiple": {
    router: '',
    actions: [
      "coReadyToShipPackage", "coActionPackageViaFilter", 'scGetPackages', 'coGetSmeWarehousesFromListPackage', 'coGetShippingCarrierFromListPackage', 'sme_warehouses'
    ],
    name: 'Sẵn sàng giao hàng loạt',
    group_code: 'order_multiple',
    group_name: 'Xử lý hàng loạt',
    cate_code: 'order_service',
    cate_name: 'Quản lý đơn hàng',
  },
  "order_list_batch_export_package_multiple": {
    router: '',
    actions: [
      "coExportPackageViaFilter", 'scGetPackages', 'coGetSmeWarehousesFromListPackage', 'coGetShippingCarrierFromListPackage', 'sme_warehouses'
    ],
    name: 'Xuất kiện hàng hàng loạt',
    group_code: 'order_multiple',
    group_name: 'Xử lý hàng loạt',
    cate_code: 'order_service',
    cate_name: 'Quản lý đơn hàng',
  },
  "order_list_batch_reload_shipment": {
    router: '',
    actions: [
      "coReloadOrderShipmentParam", 'scGetPackages', 'coGetSmeWarehousesFromListPackage', 'coGetShippingCarrierFromListPackage', 'sme_warehouses'
    ],
    name: 'Tải thông tin lấy hàng hàng loạt',
    group_code: 'order_multiple',
    group_name: 'Xử lý hàng loạt',
    cate_code: 'order_service',
    cate_name: 'Quản lý đơn hàng',
  },
};