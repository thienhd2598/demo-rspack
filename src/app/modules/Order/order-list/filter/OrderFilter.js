import React, {
  Fragment,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useHistory, useLocation } from "react-router-dom";
import { useMutation, useQuery } from "@apollo/client";
import Select from "react-select";
import queryString from "querystring";
import { OPTIONS_AFTER_SALE_TYPE, OPTIONS_ORDER, OPTIONS_PROCESSING_DEADLINE, OPTIONS_SOURCE_ORDER, STATUS_PACK_MAIN_ORDER_TAB } from "../../OrderUIHelpers";
import OrderCount from "./OrderCount";
import _, { omit, sum, xor } from "lodash";
import DateRangePicker from "rsuite/DateRangePicker";
import dayjs from "dayjs";
import ExportDialog from "../ExportDialog";
import { HistoryRounded } from "@material-ui/icons";
import DrawerModal from "../../../../../components/DrawerModal";
import OrderFilterDrawer from "./OrderFilterDrawer";
import ModalTrackingLoadOrder from "../../../../../components/ModalTrackingLoadOrder";
import query_scGetTrackingLoadOrder from "../../../../../graphql/query_scGetTrackingLoadOrder";
import makeAnimated from 'react-select/animated';
import { Dropdown, OverlayTrigger, Spinner, Tooltip } from "react-bootstrap";
import { useIntl } from "react-intl";
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css'
import TreePicker from "rsuite/TreePicker";
import StoreLackOrderDialog from "../StoreLackOrderDialog";
import UploadFileShipping from "../../dialog/UploadFileShipping";
import { ModalResultShippingFile } from "../../dialog/ModalResultShippingFile";
import AuthorizationWrapper from "../../../../../components/AuthorizationWrapper";
import mutate_getShipmentLabel from "../../../../../graphql/mutate_getShipmentLabel";
import LoadingDialog from "../../../FrameImage/LoadingDialog";
import { useToasts } from "react-toast-notifications";
import { OPTIONS_ORDER_BY } from "../../order-fulfillment/OrderFulfillmentHelper";

const OrderFilter = memo(
  ({
    storesAndChannel, setDataSmeNote, setTypeSearchTime,
    typeSearchTime, whereCondition, ids, setIds,
    valueRangeTime, listOrderCheckingQuantity, setValueRangeTime,
    loadingStore, dataStore, coReloadOrder, dataScWareHouse,
    dataSmeWarehouse, loadingListOrderChecking, refetchGetOrders,
    onShipManualOrder, onCancelManualOrder, onConfirmDelivery, onRetryWarehouseActionMultiPackage,
    onRetryShipPackage, onReloadOrderShipmentParam, onHandleBuyerCancellationPackage
  }) => {
    const location = useLocation();
    const history = useHistory();
    const { formatMessage } = useIntl();
    const { addToast } = useToasts();
    const animatedComponents = makeAnimated();

    const { currentChannels, channelsActive, currentStores, optionsStores } = storesAndChannel ?? {}

    const params = queryString.parse(location.search.slice(1, 100000));

    const disabledFutureDate = useCallback((date) => {
      const unixDate = dayjs(date).unix();
      const fromDate = dayjs().startOf('day').add(-89, 'day').unix();
      const toDate = !!params?.is_old_order
        ? dayjs().endOf('day').add(-90, 'day').unix()
        : dayjs().endOf("day").unix();

      return !!params?.is_old_order
        ? unixDate > toDate
        : (unixDate < fromDate || unixDate > toDate);
    }, [params?.is_old_order]);

    const [showExportDialog, setshowExportDialog] = useState(false);

    const [dataImportShipping, setDataImportShipping] = useState();

    const [trackingLoaderOrderModal, setshowModalTrackingAndLoadOrder] = useState(false);

    const [currentStatus, setCurrentStatus] = useState(STATUS_PACK_MAIN_ORDER_TAB[0]?.title || "");

    const [isOpenDrawer, setOpenDrawer] = useState(false);

    const onToggleDrawer = useCallback(() => setOpenDrawer((prev) => !prev), [setOpenDrawer]);

    const [search, setSearch] = useState("");

    const [searchType, setSearchType] = useState("ref_order_id");

    const [idTrackingOrder, setIdTrackingOrder] = useState(null);

    const [dialogLackOrder, setDialogLackOrder] = useState(false);

    const [dialogUploadFileShipping, setDialogUploadFileShipping] = useState(false);

    useEffect(() => {
      setSearch(params.q);
    }, [params.q]);

    useEffect(() => {
      setSearchType(params.search_type || "ref_order_id");
    }, [params.search_type]);

    const checkedFilterBoxOrders = useMemo(() => {
      const KEYS_IN_BOX_SEARCH = ["shipping_unit", "payments", "type_parcel", "print_status", "order_type"];

      let checked = KEYS_IN_BOX_SEARCH?.some((_key) => _key in params);

      return checked;
    }, [location.search]);

    const OPTIONS_WAREHOUSE_FILTER = [
      {
        value: 1,
        label: formatMessage({ defaultMessage: 'Kho kênh bán' }),
        children: dataScWareHouse?.scGetWarehouses?.filter(wh => wh?.warehouse_type == 1)?.map(wh => ({
          value: wh?.id,
          label: wh?.warehouse_name,
          parent_value: 1
        }))
      },
      {
        value: 2,
        label: formatMessage({ defaultMessage: 'Kho vật lý' }),
        children: dataSmeWarehouse?.sme_warehouses?.map(wh => ({
          value: wh?.id,
          label: wh?.name,
          parent_value: 2
        }))
      },
    ];

    const OPTIONS_SESSION_PICKUP = [
      { value: '1', label: formatMessage({ defaultMessage: 'Kiện đã trong danh sách' }) },
      { value: '0', label: formatMessage({ defaultMessage: 'Kiện chưa trong danh sách' }) },
    ];

    const OPTIONS_TYPE_PARCEL = [
      {
        value: 1,
        label: formatMessage({
          defaultMessage: "Sản phẩm đơn lẻ (Số lượng 1)",
        }),
      },
      {
        value: 2,
        label: formatMessage({
          defaultMessage: "Sản phẩm đơn lẻ (Số lượng nhiều)",
        }),
      },
      {
        value: 3,
        label: formatMessage({ defaultMessage: "Nhiều sản phẩm" }),
      },
      {
        value: 4,
        label: formatMessage({ defaultMessage: 'Có sản phẩm quà tặng' }),
      },

      {
        value: 5,
        label: formatMessage({ defaultMessage: 'Có ghi chú' }),
      },
    ];

    const OPTIONS_MAP_SME = [
      {
        value: '0',
        label: formatMessage({ defaultMessage: 'Kiện hàng chưa liên kết kho' })
      },
      {
        value: '1',
        label: formatMessage({ defaultMessage: 'Kiện hàng đã liên kết kho' })
      },
    ];

    const OPTIONS_PRINT_STATUS = [
      {
        value: "!1",
        label: formatMessage({ defaultMessage: "Chưa in vận đơn" }),
      },
      {
        value: 1,
        label: formatMessage({ defaultMessage: "Đã in vận đơn" }),
      },
      {
        value: "!2",
        label: formatMessage({ defaultMessage: "Chưa in phiếu xuất kho" }),
      },
      {
        value: 2,
        label: formatMessage({ defaultMessage: "Đã in phiếu xuất kho" }),
      },
      {
        value: "!4",
        label: formatMessage({ defaultMessage: "Chưa in biên bản bàn giao" }),
      },
      {
        value: 4,
        label: formatMessage({ defaultMessage: "Đã in biên bản bàn giao" }),
      }
    ];

    const optionsSearch = [
      {
        value: "ref_order_id",
        label: formatMessage({ defaultMessage: "Mã đơn hàng" }),
      },
      {
        value: "tracking_number",
        label: formatMessage({ defaultMessage: "Mã vận đơn" }),
      },
      {
        value: "sku",
        label: formatMessage({ defaultMessage: "SKU hàng hoá sàn" }),
      },
      {
        value: "product_name",
        label: formatMessage({ defaultMessage: "Tên sản phẩm" }),
      },
      {
        value: "print_code",
        label: formatMessage({ defaultMessage: "Mã phiếu in" }),
      },
      {
        value: "system_package_number",
        label: formatMessage({ defaultMessage: "Mã kiện hàng" }),
      }
    ];

    const optionsSearchByTimes = [
      {
        value: "order_at",
        label: formatMessage({ defaultMessage: "Thời gian tạo đơn hàng" }),
      },
      {
        value: "paid_at",
        label: formatMessage({ defaultMessage: "Thời gian thanh toán" }),
      },
      {
        value: "shipped_at",
        label: formatMessage({ defaultMessage: "Thời gian ĐVVC lấy hàng" }),
      },
      {
        value: "tts_expired",
        label: formatMessage({ defaultMessage: "Hạn xử lý" }),
      },
    ];

    const [getShipmentLabel, { loading: loadingGetShipmentLabel }] = useMutation(mutate_getShipmentLabel);

    useMemo(() => {
      setValueRangeTime([new Date(dayjs().subtract(29, "day").startOf("day")), new Date(dayjs().startOf("day"))]);

      history.push(`/orders/list?${queryString.stringify({ ...params, gt: dayjs().subtract(29, "day").startOf("day").unix(), lt: dayjs().endOf("day").unix() })}`)
    }, [params?.list_source]);

    useMemo(() => {
      if (!params?.gt || !params?.lt) {
        setValueRangeTime(null);
        return;
      };

      let rangeTimeConvert = [params?.gt, params?.lt]?.map((_range) => new Date(_range * 1000));
      setValueRangeTime(rangeTimeConvert);
    }, [params?.gt, params?.lt]);

    useMemo(() => {
      if (!params.type) {
        setCurrentStatus(STATUS_PACK_MAIN_ORDER_TAB[0]?.title);
      }

      let findedStatus = _.find(STATUS_PACK_MAIN_ORDER_TAB, { status: params?.type }) || _.find(STATUS_PACK_MAIN_ORDER_TAB, (_status) => _status?.sub?.some((_sub) => _sub?.status === params?.type));

      setCurrentStatus(findedStatus?.title);
    }, [params?.type]);

    const filterBlock = useMemo(() => {

      let parseParamsTypeParcel = params?.type_parcel?.split(",");
      let blockTypeParcel = OPTIONS_TYPE_PARCEL?.filter((_option) => parseParamsTypeParcel?.some((param) => param == _option?.value));

      let parseParamAfterSaleType = params?.after_sale_type?.split("$");
      let blockAfterSaleType = OPTIONS_AFTER_SALE_TYPE?.filter((_option) => parseParamAfterSaleType?.some((param) => param == _option?.value));

      let parseParamsPrintStatus = params?.print_status?.split(",");
      let blockPrintStatus = OPTIONS_PRINT_STATUS?.filter((_option) =>
        parseParamsPrintStatus?.some((param) => param == _option?.value)
      );

      let parseParamsFilterMapSme = params?.filter_map_sme?.split(",");
      let blockFilterMapSme = OPTIONS_MAP_SME?.filter((_option) => parseParamsFilterMapSme?.some((param) => param == _option?.value));

      let parseParamsSfSessionPick = params?.in_session_pickup?.split(",");
      let blockSfSessionPick = OPTIONS_SESSION_PICKUP?.filter((_option) => parseParamsSfSessionPick?.some((param) => param == _option?.value));

      let parseParamsDeadlineStatus = params?.deadline_status?.split(",");
      let blockDeadlineStatus = OPTIONS_PROCESSING_DEADLINE?.filter((_option) => parseParamsDeadlineStatus?.some((param) => param == _option?.value));

      let blockShippingUnit = params?.shipping_unit?.split("$");

      let blockPayments = params?.payments?.split(",");
      let blockOrderType = OPTIONS_ORDER?.find(type => type?.value == params?.order_type)

      return (
        <div className="d-flex flex-wrap" style={{ gap: 10 }}>
          {blockAfterSaleType?.length > 0 && (
            <span
              className="mb-4 py-2 px-4 d-flex justify-content-between align-items-center"
              style={{ border: "1px solid #ff6d49", borderRadius: 20, background: "rgba(255,109,73, .1)" }}>
              <span>{`${formatMessage({ defaultMessage: "Lý do" })}: ${_.map(blockAfterSaleType, "label")?.join(", ")}`}</span>
              <i className="fas fa-times icon-md ml-4" style={{ cursor: "pointer" }}
                onClick={() => {
                  history.push(`${location.pathname}?${queryString.stringify({ ..._.omit(params, "after_sale_type"), })}`.replaceAll("%2C", ","));
                }}
              />
            </span>
          )}
          {blockTypeParcel?.length > 0 && (
            <span
              className="mb-4 py-2 px-4 d-flex justify-content-between align-items-center"
              style={{ border: "1px solid #ff6d49", borderRadius: 20, background: "rgba(255,109,73, .1)" }}
            >
              <span>{`${formatMessage({
                defaultMessage: "Loại kiện hàng",
              })}: ${_.map(blockTypeParcel, "label")?.join(", ")}`}</span>
              <i
                className="fas fa-times icon-md ml-4"
                style={{ cursor: "pointer" }}
                onClick={() => {
                  history.push(`${location.pathname}?${queryString.stringify({ ..._.omit(params, "type_parcel") })}`.replaceAll("%2C", ","));
                }}
              />
            </span>
          )}
          {blockPrintStatus?.length > 0 && (
            <span className="mb-4 py-2 px-4 d-flex justify-content-between align-items-center" style={{ border: "1px solid #ff6d49", borderRadius: 20, background: "rgba(255,109,73, .1)" }}>
              <span>{`${formatMessage({ defaultMessage: "Trạng thái in" })}: ${_.map(blockPrintStatus, "label")?.join(", ")}`}</span>
              <i
                className="fas fa-times icon-md ml-4"
                style={{ cursor: "pointer" }}
                onClick={() => {
                  history.push(`${location.pathname}?${queryString.stringify({ ..._.omit(params, "print_status") })}`.replaceAll("%2C", ","));
                }}
              />
            </span>
          )}

          {blockDeadlineStatus?.length > 0 && (
            <span
              className="mb-4 py-2 px-4 d-flex justify-content-between align-items-center"
              style={{ border: "1px solid #ff6d49", borderRadius: 20, background: "rgba(255,109,73, .1)" }}
            >
              <span>{`${formatMessage({ defaultMessage: "Hạn xử lý" })}: ${_.map(blockDeadlineStatus, "label")?.join(", ")}`}</span>
              <i
                className="fas fa-times icon-md ml-4"
                style={{ cursor: "pointer" }}
                onClick={() => {
                  history.push(`${location.pathname}?${queryString.stringify({ ..._.omit(params, "deadline_status"), })}`.replaceAll("%2C", ","));
                }}
              />
            </span>
          )}

          {blockSfSessionPick?.length > 0 && (
            <span
              className="mb-4 py-2 px-4 d-flex justify-content-between align-items-center"
              style={{ border: "1px solid #ff6d49", borderRadius: 20, background: "rgba(255,109,73, .1)" }}
            >
              <span>{`${formatMessage({ defaultMessage: "Xử lý theo danh sách" })}: ${_.map(blockSfSessionPick, "label")?.join(", ")}`}</span>
              <i
                className="fas fa-times icon-md ml-4"
                style={{ cursor: "pointer" }}
                onClick={() => {
                  history.push(`${location.pathname}?${queryString.stringify({ ..._.omit(params, "in_session_pickup"), })}`.replaceAll("%2C", ","));
                }}
              />
            </span>
          )}

          {blockFilterMapSme?.length > 0 && (
            <span
              className="mb-4 py-2 px-4 d-flex justify-content-between align-items-center"
              style={{ border: "1px solid #ff6d49", borderRadius: 20, background: "rgba(255,109,73, .1)" }}
            >
              <span>{`${formatMessage({
                defaultMessage: "Trạng thái liên kết hàng hoá kho",
              })}: ${_.map(blockFilterMapSme, "label")?.join(", ")}`}</span>
              <i
                className="fas fa-times icon-md ml-4"
                style={{ cursor: "pointer" }}
                onClick={() => {
                  history.push(`${location.pathname}?${queryString.stringify({ ..._.omit(params, "filter_map_sme"), })}`.replaceAll("%2C", ","));
                }}
              />
            </span>
          )}

          {blockShippingUnit?.length > 0 && (
            <span
              className="mb-4 py-2 px-4 d-flex justify-content-between align-items-center"
              style={{ border: "1px solid #ff6d49", borderRadius: 20, background: "rgba(255,109,73, .1)" }}
            >
              <span>{`${formatMessage({
                defaultMessage: "Đơn vị vận chuyển",
              })}: ${blockShippingUnit?.join(", ")}`}</span>
              <i
                className="fas fa-times icon-md ml-4"
                style={{ cursor: "pointer" }}
                onClick={() => {
                  history.push(`${location.pathname}?${queryString.stringify({ ..._.omit(params, "shipping_unit"), })}`.replaceAll("%2C", ","));
                }}
              />
            </span>
          )}

          {blockPayments?.length > 0 && (
            <span
              className="mb-4 py-2 px-4 d-flex justify-content-between align-items-center"
              style={{ border: "1px solid #ff6d49", borderRadius: 20, background: "rgba(255,109,73, .1)" }}
            >
              <span>{`${formatMessage({ defaultMessage: "Hình thức thanh toán" })}: ${blockPayments?.join(", ")}`}</span>
              <i
                className="fas fa-times icon-md ml-4"
                style={{ cursor: "pointer" }}
                onClick={() => {
                  history.push(`${location.pathname}?${queryString.stringify({ ..._.omit(params, "payments"), })}`.replaceAll("%2C", ","));
                }}
              />
            </span>
          )}
          {blockOrderType && (
            <span
              className="mb-4 py-2 px-4 d-flex justify-content-between align-items-center"
              style={{
                border: "1px solid #ff6d49",
                borderRadius: 20,
                background: "rgba(255,109,73, .1)",
              }}
            >
              <span>{`${formatMessage({
                defaultMessage: "Loại đơn hàng",
              })}: ${blockOrderType?.label}`}</span>
              <i
                className="fas fa-times icon-md ml-4"
                style={{ cursor: "pointer" }}
                onClick={() => {
                  history.push(`${location.pathname}?${queryString.stringify({ ..._.omit(params, "order_type") })}`.replaceAll("%2C", ","));
                }}
              />
            </span>
          )}
        </div>
      );
    }, [location?.search, dataStore]);

    const currentTreePicker = useMemo(() => {
      if (!!params?.warehouse_id) return Number(params?.warehouse_id);
      if (!!params?.warehouse_filter) return Number(params?.warehouse_filter);

      return null
    }, [params?.warehouse_id, params?.warehouse_filter]);


    const { data: dataTrackingOrder, loading: loadingTrackingOrder, refetch: refetchGetTrackingSme, } = useQuery(query_scGetTrackingLoadOrder, { variables: { type: 1, }, });

    useEffect(() => {
      // Hàm để gọi lại API
      if (
        dataTrackingOrder?.scGetTrackingLoadOrder?.trackingLoadOrder?.length > 0
      ) {
        const callAPI = () => {
          refetchGetTrackingSme(); // Gọi lại API bằng cách sử dụng refetch
        };

        // Sử dụng setInterval để gọi lại hàm callAPI cách nhau 2s
        const interval = setInterval(callAPI, 1000);

        if (!idTrackingOrder) {
          setIdTrackingOrder(
            dataTrackingOrder?.scGetTrackingLoadOrder?.trackingLoadOrder?.[0]
              ?.id
          );
        }

        // Trả về một hàm từ useEffect để dọn dẹp khi component unmount
        return () => clearInterval(interval);
      }
    }, [dataTrackingOrder, refetchGetTrackingSme, loadingTrackingOrder]);

    const CLOCK_SVG = <svg className='mx-2' xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#808080" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-clock-3"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16.5 12" /></svg>


    const listOrderCheckingView = useMemo(() => {
      const viewTick = !sum(listOrderCheckingQuantity?.map(order => order?.local_quantity - order?.seller_quantity)) ? <>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00DB6D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check"><path d="M20 6 9 17l-5-5" /></svg>
        <span className="mx-2" style={{ color: '#00DB6D', fontWeight: '600' }}>{formatMessage({ defaultMessage: 'Tất cả đơn hàng đã được cập nhật' })}</span>
      </> :
        <>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF0000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-alert-triangle"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
          <span className="mx-2" style={{ color: '#FF0000', fontWeight: '600' }}>{formatMessage({ defaultMessage: `Cập nhật thiếu đơn hàng ({amount})` }, { amount: sum(listOrderCheckingQuantity?.map(order => order?.local_quantity - order?.seller_quantity)) })}</span>
        </>
      return (
        <div style={{ display: 'flex', position: 'relative', top: '-4px', marginLeft: 'auto', alignItems: 'center', padding: '7px', border: '1px solid #d9d9d9', borderRadius: '7px' }}>
          {viewTick}

          <OverlayTrigger overlay={
            <Tooltip title='#1234443241434' style={{ color: 'red' }}>
              <span>
                {formatMessage({ defaultMessage: 'Thời gian cập nhật gần nhất' })}
              </span>
            </Tooltip>
          }
          >
            {CLOCK_SVG}
          </OverlayTrigger>

          <span className="mx-2" style={{ color: 'gray' }}>
            {dayjs(listOrderCheckingQuantity?.at(0)?.check_time).format('HH:mm')}</span>
          <svg onClick={() => setDialogLackOrder(true)} style={{ cursor: 'pointer' }} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff5629" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-menu"><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></svg>
        </div>
      )
    }, [listOrderCheckingQuantity])

    const onGetShipmentLabel = async () => {
      let variables = {
        list_package_id: ids?.map(_id => _id?.id),
        connector_channel_code: ids?.[0]?.connector_channel_code,
        store_id: ids?.[0]?.store_id
      }

      let { data } = await getShipmentLabel({
        variables: variables
      });

      setIds([]);
      if (!!data?.getShipmentLabel?.success) {
        addToast(formatMessage({ defaultMessage: 'Hệ thống đang thực hiện lấy vận đơn từ sàn. Vui lòng chờ trong ít phút sau đó tải lại trang' }), { appearance: 'success' });
      } else {
        addToast(formatMessage({ defaultMessage: 'Xử lý hàng hàng loạt thất bại' }), { appearance: 'error' });
      }
    }

    return (
      <Fragment>
        <LoadingDialog show={loadingGetShipmentLabel} />
        <DrawerModal
          open={isOpenDrawer}
          onClose={onToggleDrawer}
          direction="right"
          size={500}
          enableOverlay={true}
        >
          <OrderFilterDrawer
            isOpenDrawer={isOpenDrawer}
            OPTIONS_PROCESSING_DEADLINE={OPTIONS_PROCESSING_DEADLINE}
            OPTIONS_SESSION_PICKUP={OPTIONS_SESSION_PICKUP}
            onToggleDrawer={onToggleDrawer}
            OPTIONS_PRINT_STATUS={OPTIONS_PRINT_STATUS}
            OPTIONS_MAP_SME={OPTIONS_MAP_SME}
            OPTIONS_TYPE_PARCEL={OPTIONS_TYPE_PARCEL}
            dataStore={dataStore}
            whereCondition={whereCondition}
          />
        </DrawerModal>

        <div className="d-flex align-items-center py-2 px-4 mb-4" style={{ backgroundColor: '#CFF4FC', border: '1px solid #B6EFFB', borderRadius: 4 }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" style={{ color: '#055160' }} className="bi bi-lightbulb mr-2" viewBox="0 0 16 16">
            <path d="M2 6a6 6 0 1 1 10.174 4.31c-.203.196-.359.4-.453.619l-.762 1.769A.5.5 0 0 1 10.5 13a.5.5 0 0 1 0 1 .5.5 0 0 1 0 1l-.224.447a1 1 0 0 1-.894.553H6.618a1 1 0 0 1-.894-.553L5.5 15a.5.5 0 0 1 0-1 .5.5 0 0 1 0-1 .5.5 0 0 1-.46-.302l-.761-1.77a1.964 1.964 0 0 0-.453-.618A5.984 5.984 0 0 1 2 6zm6-5a5 5 0 0 0-3.479 8.592c.263.254.514.564.676.941L5.83 12h4.342l.632-1.467c.162-.377.413-.687.676-.941A5 5 0 0 0 8 1z" />
          </svg>
          <span className="fs-14" style={{ color: '#055160' }}>
            {formatMessage({ defaultMessage: 'Các đơn hàng có thời gian hơn 90 ngày sẽ được chuyển vào Lịch sử và không thể xử lý được nữa.' })}
          </span>
        </div>
        <div className="d-flex w-100 mb-4" style={{ zIndex: 1 }}>
          <div style={{ flex: 1 }}>
            <ul className="nav nav-tabs">
              {OPTIONS_SOURCE_ORDER.map((tab) => {
                const isTabActive = !!params?.list_source ? params?.list_source == tab?.value : tab?.value == OPTIONS_SOURCE_ORDER[0].value;

                return (
                  <li
                    key={`tab-${tab?.value}`}
                    onClick={() => {
                      history.push(`${location.pathname}?${queryString.stringify({
                        page: 1,
                        list_source: tab?.value
                      })}`);
                    }}
                  >
                    <a style={{ fontSize: "16px" }} className={`nav-link ${isTabActive ? "active" : ""}`}>
                      {formatMessage(tab?.label)}
                    </a>
                  </li>
                );
              })}
              {loadingListOrderChecking ? <>
                <div style={{ display: 'flex', marginLeft: 'auto', alignItems: 'center' }}>
                  <Skeleton style={{ width: 370, height: 40, borderRadius: 4 }} count={1} />
                </div>
              </> :
                listOrderCheckingView}
            </ul>
          </div>
        </div>
        <div className="mb-4">
          <div className="row">
            <div className="col-2 mr-0 pr-0" style={{ zIndex: 95 }}>
              <Select
                options={optionsSearchByTimes}
                className="w-100 custom-select-order"
                isLoading={loadingStore}
                style={{ padding: 0 }}
                value={optionsSearchByTimes.find(
                  (_op) => _op.value == typeSearchTime
                )}
                onChange={(value) => {
                  setTypeSearchTime(value);
                  if (!!value) {
                    history.push(`${location.pathname}?${queryString.stringify({ ...params, search_time_type: value.value })}`);
                    setTypeSearchTime(value.value);
                  }
                }}
                formatOptionLabel={(option, labelMeta) => {
                  return <div>{option.label}</div>;
                }}
              />
            </div>
            <div className="col-4 ml-0 pl-0">
              <DateRangePicker
                style={{ float: "right", width: "100%" }}
                character={" - "}
                className="custome__style__input__date"
                format={"HH:mm dd/MM/yyyy"}
                value={valueRangeTime}
                placeholder={"hh:mm dd/mm/yyyy - hh:mm dd/mm/yyyy"}
                placement={"bottomEnd"}
                disabledDate={disabledFutureDate}
                onChange={(values) => {
                  let queryParams = {};
                  setValueRangeTime(values);

                  if (!!values) {
                    let [gtCreateTime, ltCreateTime] = [
                      dayjs(values[0]).unix(),
                      dayjs(values[1]).unix(),
                    ];
                    queryParams = _.omit({ ...params, page: 1, gt: gtCreateTime, lt: ltCreateTime }, ["shipping_unit", "payments"]);
                    let rangeTimeConvert = [gtCreateTime, ltCreateTime]?.map((_range) => new Date(_range * 1000));
                    setValueRangeTime(rangeTimeConvert);
                  } else {
                    queryParams = _.omit({ ...params, page: 1 }, ["shipping_unit", "payments", "gt", "lt"]);
                  }
                  history.push(`/orders/list?${queryString.stringify(queryParams)}`);
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
                  last7Days: formatMessage({ defaultMessage: "7 ngày qua" }),
                }}
              />
            </div>
            <div className='col-3' style={{ zIndex: 95 }}>
              <div className='d-flex align-items-center'>
                <Select
                  options={channelsActive?.filter(cn => params?.list_source == 'manual' || cn?.value != 'other')}
                  className='w-100 select-report-custom'
                  placeholder={formatMessage({ defaultMessage: 'Chọn sàn' })}
                  components={animatedComponents}
                  isClearable
                  isMulti
                  value={currentChannels}
                  isLoading={loadingStore}
                  onChange={values => {
                    const channelsPush = values?.length > 0 ? _.map(values, 'value')?.join(',') : undefined;
                    history.push(`/orders/list?${queryString.stringify(omit({ ...params, page: 1, channel: channelsPush }, ['stores']))}`.replaceAll('%2C', '\,'))
                  }}
                  formatOptionLabel={(option, labelMeta) => {
                    return <div>
                      {!!option.logo && <img src={option.logo} alt="" style={{ width: 15, height: 15, marginRight: 4 }} />}
                      {option.label}
                    </div>
                  }}
                />
              </div>
            </div>
            <div className='col-3' style={{ zIndex: 95 }}>
              <div className='d-flex align-items-center'>
                <Select
                  options={optionsStores?.filter(store => params?.list_source == 'manual' || store?.channel != 'other')}
                  className='w-100 select-report-custom'
                  placeholder={formatMessage({ defaultMessage: 'Chọn gian hàng' })}
                  components={animatedComponents}
                  isClearable
                  isMulti
                  value={currentStores}
                  isLoading={loadingStore}
                  onChange={values => {
                    const stores = values?.length > 0 ? _.map(values, 'value')?.join(',') : undefined;

                    history.push(`/orders/list?${queryString.stringify({ ...params, page: 1, stores: stores })}`.replaceAll('%2C', '\,'))
                  }}
                  formatOptionLabel={(option, labelMeta) => {
                    return <div>
                      {!!option.logo && <img src={option.logo} style={{ width: 15, height: 15, marginRight: 4 }} />}
                      {option.label}
                    </div>
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="form-group row my-4">
            <div className="col-2 pr-0" style={{ zIndex: 76 }}>
              <Select
                options={optionsSearch}
                className="w-100 custom-select-order"
                style={{ borderRadius: 0 }}
                isLoading={loadingStore}
                value={optionsSearch.find((_op) => _op.value == searchType)}
                onChange={(value) => {
                  setSearchType(value);
                  if (!!value) {
                    history.push(`/orders/list?${queryString.stringify({ ...params, page: 1, search_type: value.value, })}`);
                  } else {
                    history.push(`/orders/list?${queryString.stringify({ ...params, page: 1, search_type: undefined, })}`);
                  }
                }}
                formatOptionLabel={(option, labelMeta) => {
                  return <div>{option.label}</div>;
                }}
              />
            </div>
            <div
              className="col-4 input-icon pl-0"
              style={{ height: "fit-content" }}
            >
              <input
                type="text"
                className="form-control"
                placeholder={formatMessage({ defaultMessage: "Tìm đơn hàng" })}
                style={{ height: 37, borderRadius: 0, paddingLeft: "50px" }}
                onBlur={(e) => {
                  history.push(`/orders/list?${queryString.stringify({ ...params, page: 1, q: e.target.value })}`);
                }}
                value={search || ""}
                onChange={(e) => {
                  setSearch(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.keyCode == 13) {
                    history.push(`/orders/list?${queryString.stringify({ ...params, page: 1, q: e.target.value, })}`);
                  }
                }}
              />
              <span>
                <i className="flaticon2-search-1 icon-md ml-6"></i>
              </span>
            </div>

            <div className="col-3" style={{ zIndex: 2 }}>
              <TreePicker
                className="upbase-picker-tree"
                searchable={false}
                data={OPTIONS_WAREHOUSE_FILTER}
                style={{ width: '100%', height: 40 }}
                showIndentLine
                defaultExpandAll
                menuStyle={{ marginTop: 6 }}
                value={currentTreePicker}
                placeholder={formatMessage({ defaultMessage: 'Chọn kho' })}
                onChange={(value) => {
                  if (!value) {
                    history.push(`/orders/list?${queryString.stringify(_.omit({ ...params, page: 1, }, ['warehouse_id', 'warehouse_filter']))}`);
                  }
                }}
                onSelect={(value) => {
                  let queryBuilder;
                  if (!!value?.children) {
                    return;
                  } else {
                    queryBuilder = {
                      ...params,
                      page: 1,
                      warehouse_filter: value?.parent_value,
                      warehouse_id: value?.value
                    }
                  }

                  history.push(`/orders/list?${queryString.stringify(queryBuilder)}`)
                }}
                renderTreeNode={nodeData => {
                  return (
                    <span
                      className="d-flex align-items-center"
                      style={!!nodeData?.children ? { cursor: 'not-allowed' } : {}}
                      onClick={e => {
                        if (!!nodeData?.children) { e.stopPropagation() }
                      }}
                    >
                      {!!nodeData?.children && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" color="#ff5629" className="mr-4 bi bi-house-door" viewBox="0 0 16 16">
                          <path d="M8.354 1.146a.5.5 0 0 0-.708 0l-6 6A.5.5 0 0 0 1.5 7.5v7a.5.5 0 0 0 .5.5h4.5a.5.5 0 0 0 .5-.5v-4h2v4a.5.5 0 0 0 .5.5H14a.5.5 0 0 0 .5-.5v-7a.5.5 0 0 0-.146-.354L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293L8.354 1.146ZM2.5 14V7.707l5.5-5.5 5.5 5.5V14H10v-4a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5v4H2.5Z" />
                        </svg>
                      )}
                      <span style={!!nodeData?.children ? { pointerEvents: 'none', color: '#ff5629' } : {}}>{nodeData.label}</span>
                    </span>
                  );
                }}
                renderValue={(value, selectedItems, selectedElement) => {
                  let labels = [selectedElement];
                  if (!!selectedItems?.parent) {
                    labels = [selectedItems?.parent?.label].concat(labels)
                  }

                  return <div className="d-flex align-items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" className="mr-4 bi bi-house-door" viewBox="0 0 16 16">
                      <path d="M8.354 1.146a.5.5 0 0 0-.708 0l-6 6A.5.5 0 0 0 1.5 7.5v7a.5.5 0 0 0 .5.5h4.5a.5.5 0 0 0 .5-.5v-4h2v4a.5.5 0 0 0 .5.5H14a.5.5 0 0 0 .5-.5v-7a.5.5 0 0 0-.146-.354L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293L8.354 1.146ZM2.5 14V7.707l5.5-5.5 5.5 5.5V14H10v-4a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5v4H2.5Z" />
                    </svg>
                    <span>{labels[0]}</span>
                    {!!labels[1] && (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" className="mx-2 bi bi-chevron-right" viewBox="0 0 16 16">
                          <path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z" />
                        </svg>
                        <span>{labels[1]}</span>
                      </>
                    )}
                  </div>
                }}
              />
            </div>
            <div className="col-3">
              <div
                className="d-flex align-items-center justify-content-between px-4 py-2"
                style={{
                  color: checkedFilterBoxOrders ? "#ff6d49" : "",
                  border: `1px solid ${checkedFilterBoxOrders ? "#ff6d49" : "#ebecf3"}`,
                  borderRadius: 6,
                  height: 40,
                  cursor: "pointer",
                }}
                onClick={onToggleDrawer}
              >
                <span>
                  {formatMessage({ defaultMessage: "Lọc đơn hàng nâng cao" })}
                </span>
                <span>
                  <i style={{ color: checkedFilterBoxOrders ? "#ff6d49" : "" }} className="fas fa-filter icon-md ml-6"></i>
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4">{filterBlock}</div>
        </div>
        <div className="d-flex justify-content-end" style={{ gap: 10 }}>
          {params?.list_source == 'manual' && ['ready_to_ship', 'pending'].includes(params?.type) && <button
            className="btn btn-primary btn-elevate"
            style={{ minWidth: 120 }}
            onClick={() => setDialogUploadFileShipping(true)}
          >
            {formatMessage({ defaultMessage: 'Tải file vận chuyển' })}
          </button>}
          {!params?.is_old_order && (
            <AuthorizationWrapper keys={['refund_order_import_warehouse']}>
              <div
                className="pr-0"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <button
                  className="btn btn-primary btn-elevate w-100"
                  onClick={(e) => {
                    e.preventDefault();
                    history.push("/orders/list-batch");
                  }}
                  style={{}}
                >
                  {formatMessage({ defaultMessage: "Xử lý hàng loạt" })}
                </button>
              </div>
            </AuthorizationWrapper>
          )}
          <AuthorizationWrapper keys={['order_list_order_export']}>
            <div className="pr-0">
              <button
                className="btn btn-primary btn-elevate w-100"
                onClick={(e) => {
                  e.preventDefault();
                  setshowExportDialog(true);
                }}
                style={{ flex: 1 }}
              >
                {formatMessage({ defaultMessage: "Xuất đơn hàng" })}
              </button>
            </div>
            <div>
              <button
                className="btn btn-secondary btn-elevate"
                onClick={(e) => {
                  e.preventDefault();
                  history.push(`/orders/export-histories?${queryString.stringify({
                    type: params?.list_source,
                  })}`);
                }}
                style={{}}
              >
                <HistoryRounded />
              </button>
            </div>
          </AuthorizationWrapper>
        </div>
        <div style={{ position: "sticky", top: 45, background: "#fff", zIndex: 54 }}>
          <div className={`d-flex align-items-center py-4 justify-content-between`}>
            {params?.list_source != 'manual' && <div className="d-flex align-items-center">
              <div className="mr-4 text-primary" style={{ fontSize: 14 }}>
                {formatMessage({ defaultMessage: "Đã chọn:" })} {ids?.length}{" "}
                {formatMessage({ defaultMessage: "kiện hàng" })}
              </div>
              <div>
                {['pending', 'ready_to_ship', 'shipment_pending', 'pickup_retry', 'wait_shipping_carrier', 'in_cancel', 'warehouse_error']?.includes(params?.type) && (
                  <div >
                    <Dropdown drop='down'>
                      <Dropdown.Toggle disabled={!ids.length} className={`${ids?.length ? 'btn-primary' : 'btn-darkk'} btn`} >
                        {formatMessage({ defaultMessage: "Thao tác hàng loạt" })}
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        <>
                          <Dropdown.Item className="mb-1 d-flex" onClick={() => coReloadOrder(ids.map((_ord) => _ord?.order?.id))} >
                            {formatMessage({ defaultMessage: "Tải lại" })}
                          </Dropdown.Item>
                          {params?.type == 'warehouse_error' && <AuthorizationWrapper keys={['order_list_retry_warehouse']}>
                            <Dropdown.Item className="mb-1 d-flex" onClick={() => onRetryWarehouseActionMultiPackage(ids.map((_ord) => _ord?.id))}>
                              {formatMessage({ defaultMessage: "Đẩy lại đơn" })}
                            </Dropdown.Item>
                          </AuthorizationWrapper>}
                          {params?.type == 'in_cancel' && <AuthorizationWrapper keys={['order_list_order_handle_cancel']}>
                            <Dropdown.Item className="mb-1 d-flex" onClick={() => onHandleBuyerCancellationPackage(ids.map((_ord) => _ord?.id), 'ACCEPT', true)}>
                              {formatMessage({ defaultMessage: "Đồng ý hủy" })}
                            </Dropdown.Item>
                          </AuthorizationWrapper>}
                          {params?.type == 'in_cancel' && <AuthorizationWrapper keys={['order_list_order_handle_cancel']}>
                            <Dropdown.Item className="mb-1 d-flex" onClick={() => onHandleBuyerCancellationPackage(ids.map((_ord) => _ord?.id), 'REJECT', true)}>
                              {formatMessage({ defaultMessage: "Từ chối hủy" })}
                            </Dropdown.Item>
                          </AuthorizationWrapper>}
                          {params?.type == 'shipment_pending' && <AuthorizationWrapper keys={['']}>
                            <Dropdown.Item className="mb-1 d-flex" onClick={onGetShipmentLabel}>
                              {formatMessage({ defaultMessage: "Tải lại vận đơn" })}
                            </Dropdown.Item>
                          </AuthorizationWrapper>}
                          {params?.type == 'pickup_retry' && <AuthorizationWrapper keys={['order_list_order_retry_ship']}>
                            <Dropdown.Item className="mb-1 d-flex" onClick={() => onRetryShipPackage(ids.map((_ord) => _ord?.id), true)}>
                              {formatMessage({ defaultMessage: "Tìm lại tài xế" })}
                            </Dropdown.Item>
                          </AuthorizationWrapper>}
                          {params?.type == 'wait_shipping_carrier' && <AuthorizationWrapper keys={['order_list_order_reload_shipment']}>
                            <Dropdown.Item className="mb-1 d-flex" onClick={() => onReloadOrderShipmentParam(ids.map((_ord) => _ord?.order?.id), true)}>
                              {formatMessage({ defaultMessage: "Tải thông tin lấy hàng" })}
                            </Dropdown.Item>
                          </AuthorizationWrapper>}
                          {!['shipment_pending', 'pickup_retry', 'wait_shipping_carrier', 'warehouse_error'].includes(params?.type) && <AuthorizationWrapper keys={['order_list_order_update_note']}>
                            <Dropdown.Item className="mb-1 d-flex" onClick={() => setDataSmeNote(() => (
                              {
                                id: ids.filter(id => ['READY_TO_SHIP', 'PENDING']?.includes(id?.order?.status))?.map(item => item?.order?.id),
                                smeNote: ''
                              }))} >
                              {formatMessage({ defaultMessage: "Thêm ghi chú" })}
                            </Dropdown.Item>
                          </AuthorizationWrapper>}
                        </>
                      </Dropdown.Menu>
                    </Dropdown>
                  </div>
                )}
              </div>
              {!['pending', 'ready_to_ship', 'shipment_pending', 'pickup_retry', 'wait_shipping_carrier', 'in_cancel', 'warehouse_error']?.includes(params?.type) && (
                <button
                  type="button"
                  onClick={() => coReloadOrder(ids.map((_ord) => _ord?.order?.id))}
                  className="btn btn-elevate btn-primary mr-3 px-8"
                  disabled={ids?.length == 0}
                  style={{
                    color: "white",
                    width: 120,
                    background: ids?.length == 0 ? "#6c757d" : "",
                    border: ids?.length == 0 ? "#6c757d" : "",
                  }}
                >
                  {formatMessage({ defaultMessage: "Tải lại" })}
                </button>
              )}

            </div>}

            {params?.list_source == 'manual' && <div className="d-flex align-items-center">
              {['pending', 'ready_to_ship', 'shipping', 'packed', 'pack_error', 'packing', 'pickup_retry', 'warehouse_error']?.includes(params?.type) && <div className="mb-2 mr-4 text-primary" style={{ fontSize: 14 }}>
                {formatMessage({ defaultMessage: "Đã chọn:" })} {ids?.length}{" "}
                {formatMessage({ defaultMessage: "kiện hàng" })}
              </div>}
              <div>
                {['pending', 'ready_to_ship']?.includes(params?.type) && (
                  <div >
                    <Dropdown drop='down'>
                      <Dropdown.Toggle disabled={!ids.length} className={`${ids?.length ? 'btn-primary' : 'btn-darkk'} btn`} >
                        {formatMessage({ defaultMessage: "Thao tác hàng loạt" })}
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        <>
                          {/* {['PENDING']?.includes(params?.type) && <Dropdown.Item className="mb-1 d-flex" onClick={() => onApprovedManualOrder(ids?.map(item => item?.id), true)} >
                            {formatMessage({ defaultMessage: "Duyệt" })}
                          </Dropdown.Item>} */}
                          <AuthorizationWrapper keys={['order_list_order_cancel']}>
                            <Dropdown.Item className="mb-1 d-flex" onClick={() => onCancelManualOrder(ids?.map(item => item?.id))} >
                              {formatMessage({ defaultMessage: "Hủy đơn" })}
                            </Dropdown.Item>
                          </AuthorizationWrapper>
                          <AuthorizationWrapper keys={['order_list_order_update_note']}>
                            <Dropdown.Item className="mb-1 d-flex" onClick={() => setDataSmeNote(() => (
                              {
                                id: ids.filter(id => ['READY_TO_SHIP', 'PENDING']?.includes(id?.order?.status))?.map(item => item?.order?.id),
                                smeNote: ''
                              }))} >
                              {formatMessage({ defaultMessage: "Thêm ghi chú" })}
                            </Dropdown.Item>
                          </AuthorizationWrapper>
                        </>
                      </Dropdown.Menu>
                    </Dropdown>
                  </div>
                )}
              </div>
              {params?.type == 'warehouse_error' && <AuthorizationWrapper keys={['order_list_retry_warehouse']}>
                <button
                  type="button"
                  onClick={() => onRetryWarehouseActionMultiPackage(ids?.map(item => item?.id))}
                  className="btn btn-elevate btn-primary mr-3 px-8"
                  disabled={ids?.length == 0}
                  style={{ color: "white", width: 180, background: ids?.length == 0 ? "#6c757d" : "", border: ids?.length == 0 ? "#6c757d" : "" }}
                >
                  {formatMessage({ defaultMessage: "Đẩy lại đơn" })}
                </button>
              </AuthorizationWrapper>}
              {params?.type == 'pickup_retry' && <AuthorizationWrapper keys={['order_list_order_retry_ship']}>
                <button
                  type="button"
                  onClick={() => onRetryShipPackage(ids?.map(item => item?.id))}
                  className="btn btn-elevate btn-primary mr-3 px-8"
                  disabled={ids?.length == 0}
                  style={{ color: "white", width: 180, background: ids?.length == 0 ? "#6c757d" : "", border: ids?.length == 0 ? "#6c757d" : "" }}
                >
                  {formatMessage({ defaultMessage: "Tìm lại tài xế" })}
                </button>
              </AuthorizationWrapper>}
              <AuthorizationWrapper keys={["order_list_order_ship"]}>
                {['shipping']?.includes(params?.type) && (
                  <button
                    type="button"
                    onClick={() => onConfirmDelivery(ids?.map(item => item?.id))}
                    className="btn btn-elevate btn-primary mr-3 px-8"
                    disabled={ids?.length == 0}
                    style={{ color: "white", width: 180, background: ids?.length == 0 ? "#6c757d" : "", border: ids?.length == 0 ? "#6c757d" : "" }}
                  >
                    {formatMessage({ defaultMessage: "Xác nhận giao hàng" })}
                  </button>
                )}
                {['packed']?.includes(params?.type) && (
                  <button
                    type="button"
                    onClick={() => onShipManualOrder(ids?.map(item => item?.id), true)}
                    className="btn btn-elevate btn-primary mr-3 px-8"
                    disabled={ids?.length == 0}
                    style={{ color: "white", width: 120, background: ids?.length == 0 ? "#6c757d" : "", border: ids?.length == 0 ? "#6c757d" : "" }}
                  >
                    {formatMessage({ defaultMessage: "Giao hàng" })}
                  </button>
                )}
              </AuthorizationWrapper>
              <AuthorizationWrapper keys={['order_list_order_cancel']}>
                {['pack_error', 'packing']?.includes(params?.type) && (
                  <button
                    type="button"
                    onClick={() => onCancelManualOrder(ids?.map(item => item?.id))}
                    className="btn btn-elevate btn-primary mr-3 px-8"
                    disabled={ids?.length == 0}
                    style={{ color: "white", width: 120, background: ids?.length == 0 ? "#6c757d" : "", border: ids?.length == 0 ? "#6c757d" : "" }}
                  >
                    {formatMessage({ defaultMessage: "Hủy đơn" })}
                  </button>
                )}
              </AuthorizationWrapper>
            </div>}

            <div className="d-flex justify-content-end align-items-center">
              <div className='mr-3' style={{ width: '130px', textAlign: 'right' }}>
                {formatMessage({ defaultMessage: 'Sắp xếp theo' })}:
              </div>
              <div style={{ width: '250px' }} className="mr-3">
                <Select
                  className="w-100"
                  value={OPTIONS_ORDER_BY?.find(item => item?.value == (params?.order_by || 'order_at'))}
                  options={OPTIONS_ORDER_BY}
                  styles={{
                    container: (styles) => ({
                      ...styles,
                      zIndex: 99
                    }),
                  }}
                  onChange={value => {
                    history.push(`/orders/list?${queryString.stringify({
                      ...params,
                      page: 1,
                      order_by: value?.value
                    })}`)
                  }}
                />
              </div>
              <div
                className="justify-content-center d-flex align-items-center mr-3"
                onClick={() => {
                  history.push(`/orders/list?${queryString.stringify({
                    ...params,
                    page: 1,
                    sort: 'desc'
                  })}`)
                }}
                style={{ height: '38px', width: '38px', cursor: 'pointer', border: (!params?.sort || params?.sort == 'desc') ? '1px solid #FE5629' : '1px solid #D9D9D9' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-sort-down" viewBox="0 0 16 16">
                  <path d="M3.5 2.5a.5.5 0 0 0-1 0v8.793l-1.146-1.147a.5.5 0 0 0-.708.708l2 1.999.007.007a.497.497 0 0 0 .7-.006l2-2a.5.5 0 0 0-.707-.708L3.5 11.293V2.5zm3.5 1a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zM7.5 6a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5zm0 3a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1h-3zm0 3a.5.5 0 0 0 0 1h1a.5.5 0 0 0 0-1h-1z" />
                </svg>
              </div>

              <div
                className="justify-content-center d-flex align-items-center"
                onClick={() => {
                  history.push(`/orders/list?${queryString.stringify({
                    ...params,
                    page: 1,
                    sort: 'asc'
                  })}`);
                }}
                style={{ height: '38px', width: '38px', cursor: 'pointer', border: params?.sort == 'asc' ? '1px solid #FE5629' : '1px solid #D9D9D9' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-sort-up" viewBox="0 0 16 16">
                  <path d="M3.5 12.5a.5.5 0 0 1-1 0V3.707L1.354 4.854a.5.5 0 1 1-.708-.708l2-1.999.007-.007a.498.498 0 0 1 .7.006l2 2a.5.5 0 1 1-.707.708L3.5 3.707V12.5zm3.5-9a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zM7.5 6a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5zm0 3a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1h-3zm0 3a.5.5 0 0 0 0 1h1a.5.5 0 0 0 0-1h-1z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="d-flex w-100 mt-3">
            <div style={{ flex: 1 }}>
              <ul
                className="nav nav-tabs"
                id="myTab"
                role="tablist"
              >
                {STATUS_PACK_MAIN_ORDER_TAB.map((_tab, index) => {
                  const { title, status, sub } = _tab;
                  const isActive =
                    (!params.type && !status && sub.length == 0) ||
                    (params.type &&
                      (status === params?.type ||
                        sub?.some((_sub) => _sub?.status === params?.type)));

                  return (
                    <li
                      key={`tab-order-${index}`}
                      className={`nav-item ${isActive ? "active" : null} `}
                    >
                      <a
                        className={`nav-link font-weight-normal ${isActive ? "active" : ""
                          }`}
                        style={{ fontSize: "13px", padding: "11px" }}
                        onClick={() => {
                          setCurrentStatus(title);

                          const findedIndexOrderDefault = _.findIndex(sub, (_sub) => !!_sub?.default);

                          history.push(`/orders/list?${queryString.stringify({
                            ...params,
                            page: 1,
                            type:
                              sub?.length > 0
                                ? sub[findedIndexOrderDefault].status
                                : status,
                          })}`
                          );
                        }}
                      >
                        {!status && sub.length == 0 ? (
                          <>{title}</>
                        ) : (
                          <Fragment>
                            {status != 'NONE_MAP_WAREHOUSE' ? <Fragment>
                              {title}
                              <span className="ml-1">
                                ({<OrderCount
                                  whereCondition={_.omit({ ...whereCondition, list_status: sub.length > 0 ? _.map(sub, "status") : [status] }, ['filter_need_map_warehouse', 'wait_shipping_carrier'])}
                                />})
                              </span>
                            </Fragment> : <div className="d-flex align-items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" className="text-danger bi bi-exclamation-triangle-fill mr-2" viewBox="0 0 16 16">
                                <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
                              </svg>
                              <span>{title}</span>
                              <span className="ml-1">
                                ({<OrderCount whereCondition={_.omit({ ...whereCondition, filter_need_map_warehouse: 1, list_status: [], }, ['wait_shipping_carrier'])} />})
                              </span>
                            </div>}
                          </Fragment>
                        )}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
          {params?.type == 'NONE_MAP_WAREHOUSE' && (
            <div
              className="d-flex align-items-center flex-wrap py-2"
              style={{
                position: "sticky",
                top: 90,
                background: "#fff",
                zIndex: 1,
                marginBottom: "5px",
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" color="#00DB6D" width="16" height="16" fill="currentColor" className="bi bi-lightbulb mr-2" viewBox="0 0 16 16">
                <path d="M2 6a6 6 0 1 1 10.174 4.31c-.203.196-.359.4-.453.619l-.762 1.769A.5.5 0 0 1 10.5 13a.5.5 0 0 1 0 1 .5.5 0 0 1 0 1l-.224.447a1 1 0 0 1-.894.553H6.618a1 1 0 0 1-.894-.553L5.5 15a.5.5 0 0 1 0-1 .5.5 0 0 1 0-1 .5.5 0 0 1-.46-.302l-.761-1.77a1.964 1.964 0 0 0-.453-.618A5.984 5.984 0 0 1 2 6zm6-5a5 5 0 0 0-3.479 8.592c.263.254.514.564.676.941L5.83 12h4.342l.632-1.467c.162-.377.413-.687.676-.941A5 5 0 0 0 8 1z" />
              </svg>
              <span className="fs-14" style={{ color: '#00DB6D' }}>
                {formatMessage({ defaultMessage: 'Tiến hành cấu hình liên kết kho vật lý tương ứng rồi tải lại đơn hàng, hệ thống sẽ tự động thiết lập kho xử lý cho đơn hàng' })}
              </span>
            </div>
          )}
          {_.find(STATUS_PACK_MAIN_ORDER_TAB, { title: currentStatus })?.sub?.filter(
            item => params?.list_source != 'manual' || !['cancelled', 'in_cancel'].includes(item?.status)
          )?.length > 0 && (
              <div
                className="d-flex flex-wrap py-2"
                style={{
                  position: "sticky",
                  top: 90,
                  background: "#fff",
                  zIndex: 1,
                  gap: 20,
                  marginBottom: "5px",
                }}
              >
                {_.find(STATUS_PACK_MAIN_ORDER_TAB, { title: currentStatus })?.sub
                  ?.filter(item => params?.list_source == 'manual' ? item?.status != 'wait_shipping_carrier' : true)
                  ?.map(
                    (sub_status, index) => {
                      const isStatusPack = ['wait_shipping_carrier', 'ready_to_ship'].includes(sub_status?.status);

                      return (
                        <span
                          key={`sub-status-order-${index}`}
                          className="py-2 px-6 d-flex justify-content-between align-items-center"
                          style={{
                            borderRadius: 20,
                            background:
                              sub_status?.status === params?.type
                                ? "#ff6d49"
                                : "#828282",
                            color: "#fff",
                            cursor: "pointer",
                          }}
                          onClick={() => {
                            history.push(`/orders/list?${queryString.stringify({ ...params, page: 1, type: sub_status?.status })}`
                            );
                          }}
                        >
                          {params?.list_source == 'manual' && sub_status?.status == 'connector_channel_error'
                            ? formatMessage({ defaultMessage: 'Lỗi vận hành' }) : sub_status?.name} (<OrderCount
                            whereCondition={_.omit({
                              ...whereCondition,
                              ...(isStatusPack ? {
                                wait_shipping_carrier: sub_status?.status == 'wait_shipping_carrier' ? 1 : 2,
                              } : {}),
                              list_status: [sub_status?.status == 'wait_shipping_carrier' ? 'ready_to_ship' : sub_status?.status],
                            }, [isStatusPack ? '' : 'wait_shipping_carrier'])}
                          />)
                        </span>
                      )
                    })}
              </div>
            )}
        </div>
        <ModalResultShippingFile onHide={() => setDataImportShipping(null)} dataImport={dataImportShipping} />
        <StoreLackOrderDialog listOrderCheckingQuantity={listOrderCheckingQuantity} show={dialogLackOrder} onHide={() => setDialogLackOrder(false)} />
        <UploadFileShipping setDataImportShipping={setDataImportShipping} show={dialogUploadFileShipping} onHide={() => setDialogUploadFileShipping(false)} />
        {showExportDialog &&
          <ExportDialog
            show={showExportDialog}
            params={params}
            onHide={() => setshowExportDialog(false)}
            onChoosed={(_channel) => { }}
          />}

        <ModalTrackingLoadOrder
          params={params}
          show={trackingLoaderOrderModal}
          idTrackingOrder={idTrackingOrder}
          onHide={() => (
            setshowModalTrackingAndLoadOrder(false),
            setIdTrackingOrder(null),
            refetchGetOrders()
          )}
          refetchGetTrackingSme={() => refetchGetTrackingSme()}
          type={1}
          onChoosed={(_channel) => { }}
        />
      </Fragment>
    );
  }
);

export default OrderFilter;