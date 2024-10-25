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
import { OPTIONS_SOURCE_ORDER, STATUS_PACK_TAB } from "../../OrderUIHelpers";
import OrderCount from "./OrderCount";
import _, { omit } from "lodash";
import DateRangePicker from "rsuite/DateRangePicker";
import dayjs from "dayjs";
import ExportDialog from "../ExportDialog";
import { HistoryRounded } from "@material-ui/icons";
import DrawerModal from "../../../../../components/DrawerModal";
import OrderFilterDrawer from "./OrderFilterDrawer";
import makeAnimated from 'react-select/animated';
import { useIntl } from "react-intl";
import 'react-loading-skeleton/dist/skeleton.css'
import TreePicker from "rsuite/TreePicker";

const OrderFilter = memo(
  ({
    storesAndChannel,
    setTypeSearchTime,
    typeSearchTime,
    whereCondition,
    valueRangeTime,
    setValueRangeTime,
    loadingStore,
    dataStore,
    dataScWareHouse,
    dataSmeWarehouse,
  }) => {
    const location = useLocation();
    const history = useHistory();
    const { formatMessage } = useIntl();
    const animatedComponents = makeAnimated();

    const { currentChannels, channelsActive, currentStores, optionsStores } = storesAndChannel ?? {}

    const params = queryString.parse(location.search.slice(1, 100000));
    const disabledFutureDate = useCallback((date) => {
      const unixDate = dayjs(date).unix();
      const toDate = dayjs().endOf('day').add(-90, 'day').unix();

      return unixDate > toDate;
    }, []);

    const [showExportDialog, setshowExportDialog] = useState(false);
    const [currentStatus, setCurrentStatus] = useState(
      STATUS_PACK_TAB[0]?.title || ""
    );
    const [isOpenDrawer, setOpenDrawer] = useState(false);
    const onToggleDrawer = useCallback(() => setOpenDrawer((prev) => !prev), [setOpenDrawer]);

    const [search, setSearch] = useState("");
    const [searchType, setSearchType] = useState("ref_order_id");
    const [idTrackingOrder, setIdTrackingOrder] = useState(null);

    useEffect(() => {
      setSearch(params.q);
    }, [params.q]);

    useEffect(() => {
      setSearchType(params.search_type || "ref_order_id");
    }, [params.search_type]);

    const checkedFilterBoxOrders = useMemo(() => {
      const KEYS_IN_BOX_SEARCH = [
        "shipping_unit",
        "payments",
        "type_parcel",
        "print_status",
      ];

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
      },
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
        label: formatMessage({ defaultMessage: "Mã kiện hàng"}),
      },
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
        label: formatMessage({ defaultMessage: "Thời gian ĐVVC lấy hàng " }),
      },
    ];

    useMemo(() => {
      setValueRangeTime([
        new Date(dayjs().subtract(119, "day").startOf("day")),
        new Date(dayjs().subtract(90, "day").startOf("day")),
      ]);

      history.push(
        `/orders/list-history?${queryString.stringify({ ...params, gt: dayjs().subtract(119, "day").startOf("day").unix(), lt: dayjs().subtract(90, "day").endOf("day").unix() })}`
      )
    }, [params?.is_old_order]);

    useMemo(() => {
      if (!params?.gt || !params?.lt) {
        setValueRangeTime(null);
        return;
      };

      let rangeTimeConvert = [params?.gt, params?.lt]?.map(
        (_range) => new Date(_range * 1000)
      );
      setValueRangeTime(rangeTimeConvert);
    }, [params?.gt, params?.lt]);

    useMemo(() => {
      if (!params.type) {
        setCurrentStatus(STATUS_PACK_TAB[0]?.title);
      }

      let findedStatus = _.find(STATUS_PACK_TAB, { status: params?.type }) ||
        _.find(STATUS_PACK_TAB, (_status) => _status?.sub?.some((_sub) => _sub?.status === params?.type));

      setCurrentStatus(findedStatus?.title);
    }, [params?.type])


    const filterBlock = useMemo(() => {

      let parseParamsTypeParcel = params?.type_parcel?.split(",");
      let blockTypeParcel = OPTIONS_TYPE_PARCEL?.filter((_option) =>
        parseParamsTypeParcel?.some((param) => param == _option?.value)
      );
      

      let parseParamsPrintStatus = params?.print_status?.split(",");
      let blockPrintStatus = OPTIONS_PRINT_STATUS?.filter((_option) =>
        parseParamsPrintStatus?.some((param) => param == _option?.value)
      );

      const blockListSource = OPTIONS_SOURCE_ORDER?.filter((_option) =>
        params?.list_source?.split(",")?.some((param) => param == _option?.value)
      );

      let parseParamsFilterMapSme = params?.filter_map_sme?.split(",");
      let blockFilterMapSme = OPTIONS_MAP_SME?.filter((_option) =>
        parseParamsFilterMapSme?.some((param) => param == _option?.value)
      );

      let blockShippingUnit = params?.shipping_unit?.split("$");

      let blockPayments = params?.payments?.split(",");

      return (
        <div className="d-flex flex-wrap" style={{ gap: 10 }}>
          {blockTypeParcel?.length > 0 && (
            <span
              className="mb-4 py-2 px-4 d-flex justify-content-between align-items-center"
              style={{
                border: "1px solid #ff6d49",
                borderRadius: 20,
                background: "rgba(255,109,73, .1)",
              }}
            >
              <span>{`${formatMessage({
                defaultMessage: "Loại kiện hàng",
              })}: ${_.map(blockTypeParcel, "label")?.join(", ")}`}</span>
              <i
                className="fas fa-times icon-md ml-4"
                style={{ cursor: "pointer" }}
                onClick={() => {
                  history.push(
                    `${location.pathname}?${queryString.stringify({
                      ..._.omit(params, "type_parcel"),
                    })}`.replaceAll("%2C", ",")
                  );
                }}
              />
            </span>
          )}
          {blockPrintStatus?.length > 0 && (
            <span
              className="mb-4 py-2 px-4 d-flex justify-content-between align-items-center"
              style={{
                border: "1px solid #ff6d49",
                borderRadius: 20,
                background: "rgba(255,109,73, .1)",
              }}
            >
              <span>{`${formatMessage({
                defaultMessage: "Trạng thái in",
              })}: ${_.map(blockPrintStatus, "label")?.join(", ")}`}</span>
              <i
                className="fas fa-times icon-md ml-4"
                style={{ cursor: "pointer" }}
                onClick={() => {
                  history.push(
                    `${location.pathname}?${queryString.stringify({
                      ..._.omit(params, "print_status"),
                    })}`.replaceAll("%2C", ",")
                  );
                }}
              />
            </span>
          )}
          {blockListSource?.length > 0 && (
            <span
              className="mb-4 py-2 px-4 d-flex justify-content-between align-items-center"
              style={{
                border: "1px solid #ff6d49",
                borderRadius: 20,
                background: "rgba(255,109,73, .1)",
              }}
            >
              <span>{`${formatMessage({
                defaultMessage: "Loại đơn",
              })}: ${_.map(blockListSource, item => formatMessage(item.label))?.join(", ")}`}</span>
              <i
                className="fas fa-times icon-md ml-4"
                style={{ cursor: "pointer" }}
                onClick={() => {
                  history.push(
                    `${location.pathname}?${queryString.stringify({
                      ..._.omit(params, "list_source"),
                    })}`.replaceAll("%2C", ",")
                  );
                }}
              />
            </span>
          )}

          {blockFilterMapSme?.length > 0 && (
            <span
              className="mb-4 py-2 px-4 d-flex justify-content-between align-items-center"
              style={{
                border: "1px solid #ff6d49",
                borderRadius: 20,
                background: "rgba(255,109,73, .1)",
              }}
            >
              <span>{`${formatMessage({
                defaultMessage: "Trạng thái liên kết hàng hoá kho",
              })}: ${_.map(blockFilterMapSme, "label")?.join(", ")}`}</span>
              <i
                className="fas fa-times icon-md ml-4"
                style={{ cursor: "pointer" }}
                onClick={() => {
                  history.push(
                    `${location.pathname}?${queryString.stringify({
                      ..._.omit(params, "filter_map_sme"),
                    })}`.replaceAll("%2C", ",")
                  );
                }}
              />
            </span>
          )}

          {blockShippingUnit?.length > 0 && (
            <span
              className="mb-4 py-2 px-4 d-flex justify-content-between align-items-center"
              style={{
                border: "1px solid #ff6d49",
                borderRadius: 20,
                background: "rgba(255,109,73, .1)",
              }}
            >
              <span>{`${formatMessage({
                defaultMessage: "Đơn vị vận chuyển",
              })}: ${blockShippingUnit?.join(", ")}`}</span>
              <i
                className="fas fa-times icon-md ml-4"
                style={{ cursor: "pointer" }}
                onClick={() => {
                  history.push(
                    `${location.pathname}?${queryString.stringify({
                      ..._.omit(params, "shipping_unit"),
                    })}`.replaceAll("%2C", ",")
                  );
                }}
              />
            </span>
          )}

          {blockPayments?.length > 0 && (
            <span
              className="mb-4 py-2 px-4 d-flex justify-content-between align-items-center"
              style={{
                border: "1px solid #ff6d49",
                borderRadius: 20,
                background: "rgba(255,109,73, .1)",
              }}
            >
              <span>{`${formatMessage({
                defaultMessage: "Hình thức thanh toán",
              })}: ${blockPayments?.join(", ")}`}</span>
              <i
                className="fas fa-times icon-md ml-4"
                style={{ cursor: "pointer" }}
                onClick={() => {
                  history.push(
                    `${location.pathname}?${queryString.stringify({
                      ..._.omit(params, "payments"),
                    })}`.replaceAll("%2C", ",")
                  );
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


    return (
      <Fragment>
        <DrawerModal
          open={isOpenDrawer}
          onClose={onToggleDrawer}
          direction="right"
          size={500}
          enableOverlay={true}
        >
          <OrderFilterDrawer
            isOpenDrawer={isOpenDrawer}
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
        <div className="mb-4">
          <div className="row">
            <div className="col-2 mr-0 pr-0" style={{ zIndex: 97 }}>
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
                    history.push(`${location.pathname}?${queryString.stringify({...params,search_time_type: value.value,})}`);
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
                    let [gtCreateTime, ltCreateTime] = [dayjs(values[0]).unix(), dayjs(values[1]).unix(),];
                    queryParams = _.omit({...params,
                        page: 1,
                        gt: gtCreateTime,
                        lt: ltCreateTime,
                      },["shipping_unit", "payments"]);
                    let rangeTimeConvert = [gtCreateTime, ltCreateTime]?.map((_range) => new Date(_range * 1000));
                    setValueRangeTime(rangeTimeConvert);
                  } else {
                    queryParams = _.omit({...params, page: 1}, ["shipping_unit", "payments", "gt", "lt"]);
                  }
                  history.push(`/orders/list-history?${queryString.stringify(queryParams)}`);
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
                  options={channelsActive}
                  className='w-100 select-report-custom'
                  placeholder={formatMessage({ defaultMessage: 'Chọn sàn' })}
                  components={animatedComponents}
                  isClearable
                  isMulti
                  value={currentChannels}
                  isLoading={loadingStore}
                  onChange={values => {
                    const channelsPush = values?.length > 0 ? _.map(values, 'value')?.join(',') : undefined;
                    history.push(`/orders/list-history?${queryString.stringify(omit({ ...params, page: 1, channel: channelsPush }, ['stores']))}`.replaceAll('%2C', '\,'))
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
                  options={optionsStores}
                  className='w-100 select-report-custom'
                  placeholder={formatMessage({ defaultMessage: 'Chọn gian hàng' })}
                  components={animatedComponents}
                  isClearable
                  isMulti
                  value={currentStores}
                  isLoading={loadingStore}
                  onChange={values => {
                    const stores = values?.length > 0 ? _.map(values, 'value')?.join(',') : undefined;

                    history.push(`/orders/list-history?${queryString.stringify({ ...params, page: 1, stores: stores })}`.replaceAll('%2C', '\,'))
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
                    history.push(
                      `/orders/list-history?${queryString.stringify({
                        ...params,
                        page: 1,
                        search_type: value.value,
                      })}`
                    );
                  } else {
                    history.push(
                      `/orders/list-history?${queryString.stringify({
                        ...params,
                        page: 1,
                        search_type: undefined,
                      })}`
                    );
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
                  history.push(
                    `/orders/list-history?${queryString.stringify({
                      ...params,
                      page: 1,
                      q: e.target.value,
                    })}`
                  );
                }}
                value={search || ""}
                onChange={(e) => {
                  setSearch(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.keyCode == 13) {
                    history.push(
                      `/orders/list-history?${queryString.stringify({
                        ...params,
                        page: 1,
                        q: e.target.value,
                      })}`
                    );
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
                    history.push(
                      `/orders/list-history?${queryString.stringify(_.omit({
                        ...params,
                        page: 1,
                      }, ['warehouse_id', 'warehouse_filter']))}`
                    );
                  }
                }}
                onSelect={(value) => {
                  let queryBuilder;
                  if (!!value?.children) {
                    return;
                    // queryBuilder = _.omit({
                    //   ...params,
                    //   page: 1,
                    //   warehouse_filter: value?.value
                    // }, ['warehouse_id'])
                  } else {
                    queryBuilder = {
                      ...params,
                      page: 1,
                      warehouse_filter: value?.parent_value,
                      warehouse_id: value?.value
                    }
                  }

                  history.push(`/orders/list-history?${queryString.stringify(queryBuilder)}`)
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
              <div className="d-flex align-items-center justify-content-between px-4 py-2"
                style={{ color: checkedFilterBoxOrders ? "#ff6d49" : "", border: `1px solid ${checkedFilterBoxOrders ? "#ff6d49" : "#ebecf3"}`,
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
                  <i
                    style={{ color: checkedFilterBoxOrders ? "#ff6d49" : "" }}
                    className="fas fa-filter icon-md ml-6"
                  ></i>
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4">{filterBlock}</div>
        </div>
        <div
          style={{ position: "sticky", top: 45, background: "#fff", zIndex: 54 }}
        >
          <div className={`col-12 d-flex align-items-center py-4 justify-content-end`}>            
            <div className="d-flex justify-content-end" style={{ gap: 10 }}>                            
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
                    history.push("/orders/export-histories");
                  }}
                  style={{}}
                >
                  <HistoryRounded />
                </button>
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
                {STATUS_PACK_TAB.map((_tab, index) => {
                  const { title, status, sub } = _tab;
                  const isActive = (!params.type && !status && sub.length == 0) ||
                    (params.type && (status === params?.type || sub?.some((_sub) => _sub?.status === params?.type)));

                  return (
                    <li key={`tab-order-${index}`} className={`nav-item ${isActive ? "active" : null} `}>
                      <a className={`nav-link font-weight-normal ${isActive ? "active" : ""}`}
                        style={{ fontSize: "13px", padding: "11px" }}
                        onClick={() => {
                          setCurrentStatus(title);

                          const findedIndexOrderDefault = _.findIndex(sub,(_sub) => !!_sub?.default);

                          history.push(`/orders/list-history?${queryString.stringify({...params,page: 1, type: sub?.length > 0 ? sub[findedIndexOrderDefault].status : status})}`);
                        }}
                      >
                        {!status && sub.length == 0 ? (
                          <>{title}</>
                        ) : (
                          <>
                            {status != 'NONE_MAP_WAREHOUSE' ? <>
                              {title}
                              <span className="ml-1">
                                ({
                                  <OrderCount
                                    whereCondition={_.omit({ ...whereCondition, list_status: sub.length > 0 ? _.map(sub, "status") : [status] }, 'filter_need_map_warehouse')}
                                  />
                                })
                              </span>
                            </> : <div className="d-flex align-items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" className="text-danger bi bi-exclamation-triangle-fill mr-2" viewBox="0 0 16 16">
                                <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
                              </svg>
                              <span>{title}</span>
                              <span className="ml-1">
                                ({
                                  <OrderCount
                                    whereCondition={{
                                      ...whereCondition,
                                      filter_need_map_warehouse: 1,
                                      list_status: [],
                                    }}
                                  />
                                })
                              </span>
                            </div>}
                          </>
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
          {_.find(STATUS_PACK_TAB, { title: currentStatus })?.sub?.length > 0 && (
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
              {_.find(STATUS_PACK_TAB, { title: currentStatus })?.sub?.map((sub_status, index) => (
                  <span key={`sub-status-order-${index}`}
                    className="py-2 px-6 d-flex justify-content-between align-items-center"
                    style={{borderRadius: 20,background: sub_status?.status === params?.type ? "#ff6d49" : "#828282",
                      color: "#fff",
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      history.push(`/orders/list-history?${queryString.stringify({...params,page: 1,  type: sub_status?.status, })}`);
                    }}
                  >
                    {sub_status?.name} ({
                      <OrderCount
                      whereCondition={{
                        ...whereCondition,
                        list_status: [sub_status?.status],
                      }}
                    />
                    })
                  </span>
                )
              )}
            </div>
          )}
        </div>

        <ExportDialog
          show={showExportDialog}
          params={params}
          onHide={() => setshowExportDialog(false)}
          onChoosed={(_channel) => { }}
        />

      </Fragment>
    );
  }
);

export default OrderFilter;
