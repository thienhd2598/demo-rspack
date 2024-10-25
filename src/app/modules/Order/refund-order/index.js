/*
 * Created by dai15081999@gmail.com on 23/06/2023
 * Copyright (c) 2023 dai15081999@gmail.com
 */
import { cloneDeep, isEqual } from "lodash";
import { Helmet } from "react-helmet";
import SVG from "react-inlinesvg";
import { Card, CardBody } from "../../../../_metronic/_partials/controls";
import { useSubheader } from "../../../../_metronic/layout";
import { useMutation, useQuery } from "@apollo/client";
import { toAbsoluteUrl } from "../../../../_metronic/_helpers";
import ModalReason from "./ModalReason";
import { MoreReason } from "./ModalReason/Reason/MoreReason/index";
import NoteWarehouse from "./ModalReason/Reason/NoteWarehouse";
import ReasonReturn from "./ModalReason/Reason/ReasonReturn";
import WarehouseModal from "./ModalReason/WarehouseModal";
import OrderRefundFilter from "./OrderRefundFilter/index";
import OrderRefundTable from "./OrderRefundTable/index";
import OrderRefundTabs from "./OrderRefundTabs";
import React, { useLayoutEffect, useMemo, useState } from "react";
import { useDidUpdate } from "../../../../hooks/useDidUpdate";
import scGetReturnOrders from "../../../../graphql/query_scGetReturnOrders";
import query_scReturnOrderAggregate from "../../../../graphql/query_scReturnOrderAggregate";
import query_sc_stores_basic from "../../../../graphql/query_sc_stores_basic";
import { useIntl } from "react-intl";
import { useHistory, useLocation } from "react-router-dom";
import queryString from "querystring";
import { SEARCH_DATE_OPTIONS, STATUS_ORDER_REFUND_MAPPED } from "./utils/contants";
import WarehouseModalDetail from "./ModalReason/WarehouseModalDetail";
import { useToasts } from "react-toast-notifications";
import LoadingDialog from "../../Products/product-new/LoadingDialog";
import mutate_coReloadReturnOrder from "../../../../graphql/mutate_coReloadReturnOrder";
import dayjs from "dayjs";
import { OPTIONS_MAP_SME, RETURN_TYPES, STATUS_WAREHOUSING } from "./OrderReturnStatus";
import query_sme_catalog_stores from "../../../../graphql/query_sme_catalog_stores";

export function useDeepCopy(obj) {
  const [original, setOriginal] = useState(obj);

  return [
    cloneDeep(original),
    (newValue) => {
      if (!isEqual(original, newValue)) {
        setOriginal(newValue);
      }
    },
  ];
}
const ReturnOrder = () => {
  const [currentDateRangeTime, setCurrentDateRangeTime] = useState([]);
  const { formatMessage } = useIntl()
  const { addToast } = useToasts();
  const params = queryString.parse(useLocation().search.slice(1, 100000));
 
  useMemo(() => {
    if (!!params?.is_old_order) {
      setCurrentDateRangeTime([
        new Date(dayjs().subtract(119, "day").startOf("day")),
        new Date(dayjs().subtract(90, "day").endOf("day")),
      ]);
    } else {
      setCurrentDateRangeTime(null);
    }
  }, [params?.is_old_order]);

  const processed_warehouse = useMemo(() => {
    try {
      if (!params.status) return [];
      const process_wh_constant = STATUS_ORDER_REFUND_MAPPED[params?.status];

      return [process_wh_constant];
    } catch (error) {
      return {};
    }
  }, [params.status]);

  const filter_map_sme = useMemo(
    () => {
      if (!params.filter_map_sme) return {};
      return { filter_map_sme: Number(params.filter_map_sme) }
    }, [params.filter_map_sme]
  );

  const range_time_orderAt = useMemo(() => {
    try {
      if (!params.gt_orderAt || !params.lt_orderAt) {
        if (currentDateRangeTime?.length > 0 && !!params?.is_old_order) {
          return [
            dayjs().subtract(119, "day").startOf("day").unix(),
            dayjs().subtract(90, "day").endOf("day").unix()
          ]
        } else {
          return []
        }
      };

      return [Number(params?.gt_orderAt), Number(params?.lt_orderAt)];
    } catch (error) {
      return [];
    }
  }, [params?.gt_orderAt, params?.lt_orderAt, params?.is_old_order, currentDateRangeTime]);
  
  const stores = useMemo(() => {
    if (!params.stores) return [];
    return {
        list_store: params.stores?.split(',')?.map(store => +store)
    }
}, [params.stores]);

const list_warehouse_import = useMemo(() => {
  if (!params.processed_warehouse) return [];
  return {
    list_warehouse_import: params.processed_warehouse?.split(',')?.map(wh => +wh)
  }
}, [params.processed_warehouse]);

  const [searchType, setSearchType] = useState();

  const q = useMemo(() => {
    setSearchType(params.search_type);
    if (!params.q) return ''
    return params.q;
  }, [params.q, params.search_type]);

  const channel = useMemo(() => {
    if (!params.channel) return {};
    return { connector_channel_code: params.channel?.split(',') }
}, [params.channel]);

  const sme_reason_type = useMemo(() => {
    if (!params.reasontype) return [];
    return params.reasontype?.split(",").map(function (x) {
      return parseInt(x);
    });
  }, [params.reasontype]);

  const is_old_order = useMemo(() => {
    if (!params.is_old_order) return {};

    return { is_old_order: Number(params?.is_old_order) }
  }, [params.is_old_order]);

  const searchTypeDate = useMemo(() => {
    if (range_time_orderAt?.length == 0) return null
    if (!params?.search_type_date) {
      return SEARCH_DATE_OPTIONS[0].value
    }

    return params?.search_type_date
  }, [params?.search_type_date, range_time_orderAt])

  let whereCondition = useMemo(() => {
    return {
      status: [],
      ...list_warehouse_import,
      time_range: range_time_orderAt,
      search_time_type: searchTypeDate,
      ...stores,
      q: q,
      search_type: searchType ?? "ref_order_id",
      is_connected: 1,
      is_tracking_number: 1,
      ...channel,
      processed_warehouse: processed_warehouse,
      ...filter_map_sme,
      ...is_old_order,
      sme_reason_type: sme_reason_type,
    };
  }, [sme_reason_type,list_warehouse_import,searchTypeDate,processed_warehouse,filter_map_sme,range_time_orderAt,stores,is_old_order,searchType,channel,q]);
  //! Các biến phụ thuộc của modal
  const [openModal, setOpenModal] = useState({
    openMoreReason: false,
    openAddReason: false,
    openNoteWarehouse: false,
    openWarehouse: false,
    openWarehouseDetail: false,
    openReasonReturn: false,
    openAddNoteWarehouse: false,
    checkOpenModalElse: false,
    checkOpenModalWarehouseELse: false
  });

  useDidUpdate(() => {
    if (
      !openModal.openMoreReason &&
      !openModal.openAddReason &&
      openModal.checkOpenModalElse
    ) {
      setOpenModal({ ...openModal, checkOpenModalElse: false });
    }
    if (
      !openModal.openNoteWarehouse &&
      !openModal.openAddNoteWarehouse &&
      openModal.checkOpenModalWarehouseELse
    ) {
      setOpenModal({ ...openModal, checkOpenModalWarehouseELse: false });
    }
  }, [openModal]);

  //! Lọc tất cả các mảng trống ra ngoài của options search
  const checkSearchTypeEmpty = Object.entries(whereCondition)
    .map((elm) => {
      if (Array.isArray(elm.at(1))) {
        return elm.at(1)?.length > 0 ? elm : undefined;
      }
      return elm;
    })
    .filter((ob) => Array.isArray(ob));
  const convert = Object.fromEntries(checkSearchTypeEmpty);

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

  //! Query các kho và các kênh
  const { data: dataStore, loading: loadingStore } = useQuery(
    query_sc_stores_basic,
    {
      fetchPolicy: "cache-and-network",
    }
  );
  //! Query các đơn hoàn trả 
  const { data, loading, error, refetch } = useQuery(scGetReturnOrders, {
    variables: {
      page: page,
      per_page: limit,
      search: convert,
    },
    fetchPolicy: "cache-and-network",
  });

  //! Query lấy số lượng của các lần search
  const { data: orderAggregate } = useQuery(query_scReturnOrderAggregate, {
    variables: {
      search: convert,
    },
    fetchPolicy: "cache-and-network",
  });

  const { data: dataWarehouse } = useQuery(query_sme_catalog_stores, {
    fetchPolicy: "cache-and-network",
});

  let totalRecord = orderAggregate?.scReturnOrderAggregate?.count || 0;
  let totalPage = Math.ceil(totalRecord / limit);

  // set Header title
  const { setBreadcrumbs } = useSubheader();
  useLayoutEffect(() => {
    setBreadcrumbs([
      {
        title: "Xử lý trả hàng",
      },
    ]);
  }, []);

  const [type, setType] = useState();  //! Option tab hoàn trả hoặc đơn hủy
  const [ids, setIds] = useState([]); //! Kiểm tra checkbox 
  const [idOrder, setIdOrder] = useState(); //! ReturnOrder khi set

  const [mutate, { loading: loadingCoReloadOrder }] = useMutation(mutate_coReloadReturnOrder, {
    awaitRefetchQueries: true,
    refetchQueries: ['scGetReturnOrders'],
    onCompleted: () => {
      setIds([]);
    }
  })

  const coReloadOrder = async (idsOrder) => {
    let variables = {
      list_return_order_id: idsOrder,
    }

    let { data } = await mutate({
      variables: variables
    })
    if (data?.coReloadReturnOrder?.success) {
      addToast(formatMessage({ defaultMessage: 'Đơn hàng tải lại thành công' }), { appearance: 'success' });
    } else {
      addToast(formatMessage({ defaultMessage: 'Đơn hàng tải lại thất bại' }), { appearance: 'error' });
    }
  }

  const [currentChannels, channelsActive, currentStores, optionsStores] = useMemo(() => {
        const channels = dataStore?.op_connector_channels
        const stores = dataStore?.sc_stores
        const channelsActive = channels?.filter(store => ({channelsActive: stores?.some(sa => sa?.connector_channel_code === store?.code)}));
        let _optionsChannel = channelsActive?.map(_channel => ({
            label: _channel?.name,
            logo: _channel?.logo_asset_url,
            value: _channel?.code
        })) || [];

        let __optionsStores = stores?.flatMap(_store => {
            const channelParams = params?.channel ? params?.channel?.split(',') : null
            const channel = _optionsChannel?.find(cn => cn?.value == _store?.connector_channel_code)
            if (!channelParams) {

                return {
                    label: _store?.name,
                    logo: channel?.logo,
                    value: _store?.id,
                    channel: channel?.value
                }
            }
            if (channelParams?.includes(_store?.connector_channel_code)) {
                return {
                    label: _store?.name,
                    logo: channel?.logo,
                    value: _store?.id,
                    channel: channel?.value
                }
            }
            return []
        })

        let _currentChannel = !!params?.channel ? _optionsChannel?.filter(_channel => !!_channel?.value && params?.channel?.split(',').some(_param => _param == _channel.value)) : [];
        let _currentStores = !!params?.stores ? __optionsStores?.filter(_stores => !!_stores?.value && params?.stores?.split(',').some(_param => _param == _stores.value)) : [];

        return [_currentChannel, _optionsChannel, _currentStores, __optionsStores];
    }, [dataStore, params.stores, params.channel]);



  return (
    <Card>
      <Helmet
        titleTemplate={`${formatMessage({ defaultMessage: 'Xử lý trả hàng' })} - UpBase`}
        defaultTitle={`${formatMessage({ defaultMessage: 'Xử lý trả hàng' })} - UpBase`}
      >
        <meta name="description" content={`${formatMessage({ defaultMessage: 'Xử lý trả hàng' })} - UpBase`} />
      </Helmet>
      <LoadingDialog show={loadingCoReloadOrder} />
      {(openModal.openMoreReason || openModal.openAddReason) && (
        <ModalReason
          openModal={openModal}
          setOpenModal={setOpenModal}
          title={formatMessage({ defaultMessage: "Bổ sung nguyên nhân" })}
          iconx={"pen-to-square-solid"}
        >
          <MoreReason
            data={data?.scGetReturnOrders || []}
            refetch={refetch}
            openModal={openModal}
            setOpenModal={setOpenModal}
            idOrder={idOrder}
          />
        </ModalReason>
      )}
      {openModal.openReasonReturn && (
        <ModalReason
          openModal={openModal}
          setOpenModal={setOpenModal}
          title={formatMessage({ defaultMessage: "Nguyên nhân hoàn trả" })}
        >
          <ReasonReturn
            openModal={openModal}
            setOpenModal={setOpenModal}
            idOrder={idOrder}
          />
        </ModalReason>
      )}
      {openModal.openWarehouse && (
        <ModalReason
          openModal={openModal}
          setOpenModal={setOpenModal}
          title={formatMessage({ defaultMessage: "Xử lý trả hàng" })}
        >
          <WarehouseModal
            openModal={openModal}
            setOpenModal={setOpenModal}
            orderProcess={idOrder}
            refetch={refetch}
            dataStore={dataStore?.sc_stores}
          />
        </ModalReason>
      )}
      {openModal.openWarehouseDetail && (
        <ModalReason
          openModal={openModal}
          setOpenModal={setOpenModal}
          title={formatMessage({ defaultMessage: "Xử lý trả hàng" })}
        >
          <WarehouseModalDetail
            openModal={openModal}
            setOpenModal={setOpenModal}
            orderProcess={idOrder}
            refetch={refetch}
            dataStore={dataStore?.sc_stores}
          />
        </ModalReason>
      )}
      {(openModal.openNoteWarehouse || openModal.openAddNoteWarehouse) && (
        <ModalReason
          openModal={openModal}
          setOpenModal={setOpenModal}
          title={openModal.checkOpenModalWarehouseELse ? formatMessage({ defaultMessage: 'Thêm ghi chú nhập kho' }) : formatMessage({ defaultMessage: 'Ghi chú nhập kho' })}
          iconu={"pen-to-square-solid"}
        >
          <NoteWarehouse
            refetch={refetch}
            openModal={openModal}
            setOpenModal={setOpenModal}
            idOrder={idOrder}
            data={data?.scGetReturnOrders || []}
          />
        </ModalReason>
      )}
      <CardBody>
        <OrderRefundTabs />
        <OrderRefundFilter
          dataWarehouse={dataWarehouse?.sme_warehouses || []}
          dataChannelStores={{currentChannels, channelsActive, currentStores, optionsStores, loadingStore}}
          currentDateRangeTime={currentDateRangeTime}
          setCurrentDateRangeTime={setCurrentDateRangeTime}
          dataChannel={dataStore?.op_connector_channels}
          dataStore={dataStore?.sc_stores}
          setIds={setIds}
          ids={ids}
          refetch={refetch}
          coReloadOrder={coReloadOrder}
          whereCondition={whereCondition}
        />
        <OrderRefundTable
          setIdOrder={setIdOrder}
          page={page}
          whereCondition={whereCondition}
          totalRecord={totalRecord}
          totalPage={totalPage}
          limit={limit}
          error={error}
          setOpenModal={setOpenModal}
          openModal={openModal}
          setType={setType}
          loading={loading}
          refetch={refetch}
          data={data?.scGetReturnOrders || []}
          type={type}
          dataStore={dataStore?.sc_stores}
          setIds={setIds}
          ids={ids}
        />
      </CardBody>
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
    </Card>
  );
};

export default ReturnOrder;

export const actionKeys = {
  "refund_order_list_view": {
    router: '/orders/refund-order',
    actions: ['scReturnOrderAggregate', 'scGetReturnOrders',
     'sc_stores', 'op_connector_channels', 'sme_warehouses', "coReloadReturnOrder", "coReloadOrder", "scGetFailDeliveryOrders", "scFailDeliveryOrderAggregate", "sme_catalog_product_variant_aggregate", "sme_catalog_product_variant"],
     name: 'Xem danh sách xử lý trả hàng (Bao gồm tải lại)',
     group_code: 'order_refund',
     group_name: 'Xử lý trả hàng',
     cate_code: 'order_service',
     cate_name: 'Quản lý đơn hàng',
  },
  "refund_order_detail_view": {
    router: '',
    actions: ["findOrderDetail", "sc_stores", "op_connector_channels", "sme_catalog_product_variant", "sme_catalog_product_variant_aggregate", "scGetWarehouses",
    "sme_warehouses", "detailFinanceOrder", "warehouse_bills", "warehouse_bills_aggregate", "scGetProduct", "sme_catalog_product_variant_by_pk", "sc_product_variant"],
     name: 'Xem chi tiết trả hàng',
     group_code: 'order_refund',
     group_name: 'Xử lý trả hàng',
     cate_code: 'order_service',
     cate_name: 'Quản lý đơn hàng',
  },
  "refund_order_import_warehouse": {
    router: '',
    actions: [
      'coImportWarehouse', "coUpdateImportNote", "sme_catalog_product_variant", "op_connector_channels", "sc_stores", 
      "coGetReturnOrder", "sme_warehouses", "coMultipleImportWarehouse", "coGetPackage",
      "coValidateExcelImportWarehouse"
    ],
     name: 'Xử lý trả hàng',
     group_code: 'order_refund',
     group_name: 'Xử lý trả hàng',
     cate_code: 'order_service',
     cate_name: 'Quản lý đơn hàng',
  },
  "refund_order_export_file": {
    router: '',
    actions: ['scExportReturnOrder', "sc_stores", "op_connector_channels", "scRetryExportOrder", "scGetJobTrackingExportOrder"],
     name: 'Xuất file đơn trả hàng',
     group_code: 'order_refund',
     group_name: 'Xử lý trả hàng',
     cate_code: 'order_service',
     cate_name: 'Quản lý đơn hàng',
  },
};