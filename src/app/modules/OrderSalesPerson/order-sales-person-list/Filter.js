import React, {
  Fragment,
  memo,
  useCallback,
  useMemo,
  useState,
} from "react";
import { useHistory, useLocation } from "react-router-dom";
import Select from "react-select";
import queryString from "querystring";
import _, { omit, sum, xor } from "lodash";
import DateRangePicker from "rsuite/DateRangePicker";
import dayjs from "dayjs";
import makeAnimated from 'react-select/animated';
import { useIntl } from "react-intl";
import 'react-loading-skeleton/dist/skeleton.css'
import TreePicker from "rsuite/TreePicker";
import {
  KEYS_IN_BOX_SEARCH, LIGHT_BULB_SVG, OPTIONS_SEARCH,
  OPTIONS_SEARCH_BY_TIME, OPTIONS_TYPE_PARCEL,
  OPTIONS_WAREHOUSE_FILTER, TABS
} from "./Constant";
import DrawerModal from "../../../../components/DrawerModal";
import OrderSalesPersonFilterDrawer from "./Dialogs/OrderSalesPersonFilterDrawer";
import Actions from "./Actions";
import OrderCount from "./OrderCount";
import { OPTIONS_AFTER_SALE_TYPE, STATUS_PACK_TAB } from "../../Order/OrderUIHelpers";

const Filter = memo(({
  onShowImportDialog, onShowExportDialog, onOpenConfirmDialog, searchType,
  setSearchType, valueRangeTime, setValueRangeTime,
  setTypeSearchTime, typeSearchTime, whereCondition,
  dataSelectedOrder, dataSmeWarehouse, dataScWareHouse, onSetDataSmeNote,
  dataFilterStoreChannel
}) => {
  const location = useLocation();
  const history = useHistory();
  const { formatMessage } = useIntl();
  const animatedComponents = makeAnimated();
  const params = queryString.parse(location.search.slice(1, 100000));
  const [currentStatus, setCurrentStatus] = useState(STATUS_PACK_TAB[0]?.title || "");
  const [search, setSearch] = useState(params?.q || "");

  const disabledFutureDate = (date) => {
    const today = new Date();
    return date > today;
  };

  const currentTreePicker = useMemo(() => {
    if (!!params?.warehouse_id) return Number(params?.warehouse_id);
    if (!!params?.warehouse_filter) return Number(params?.warehouse_filter);

    return null
  }, [params.warehouse_id, params.warehouse_filter]);

  const checkedFilterBoxOrders = useMemo(() => {
    return KEYS_IN_BOX_SEARCH?.some((_key) => _key in params);
  }, [location.search]);

  const [isOpenDrawer, setOpenDrawer] = useState(false);
  const onToggleDrawer = useCallback(() => setOpenDrawer((prev) => !prev), [setOpenDrawer]);

  useMemo(() => {
    if (!params.type) {
      setCurrentStatus(STATUS_PACK_TAB[0]?.title);
    }

    let findedStatus = _.find(STATUS_PACK_TAB, { status: params?.type }) || _.find(STATUS_PACK_TAB, (_status) => _status?.sub?.some((_sub) => _sub?.status === params?.type));

    setCurrentStatus(findedStatus?.title);
  }, [params?.type]);

  const { currentChannels, channelsActive, currentStores, optionsStores, loadingStore } = dataFilterStoreChannel || {}

  const filterBlock = useMemo(() => {
    let parseParamsTypeParcel = params?.type_parcel?.split(",");

    let blockTypeParcel = OPTIONS_TYPE_PARCEL?.filter((_option) => parseParamsTypeParcel?.some((param) => param == _option?.value));

    let blockShippingUnit = params?.shipping_unit?.split("$");

    let blockPayments = params?.payments?.split(",");

    let parseParamAfterSaleType = params?.after_sale_type?.split("$");
    let blockAfterSaleType = OPTIONS_AFTER_SALE_TYPE?.filter((_option) => parseParamAfterSaleType?.some((param) => param == _option?.value));

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
          <span className="mb-4 py-2 px-4 d-flex justify-content-between align-items-center" style={{ border: "1px solid #ff6d49", borderRadius: 20, background: "rgba(255,109,73, .1)" }}>
            <span>{`${formatMessage({ defaultMessage: "Loại kiện hàng", })}: ${_.map(blockTypeParcel, "label")?.join(", ")}`}</span>
            <i className="fas fa-times icon-md ml-4"
              style={{ cursor: "pointer" }}
              onClick={() => {
                history.push(`${location.pathname}?${queryString.stringify({ ..._.omit(params, "type_parcel"), })}`.replaceAll("%2C", ","));
              }}
            />
          </span>
        )}

        {blockShippingUnit?.length > 0 && (
          <span className="mb-4 py-2 px-4 d-flex justify-content-between align-items-center" style={{ border: "1px solid #ff6d49", borderRadius: 20, background: "rgba(255,109,73, .1)" }}>
            <span>{`${formatMessage({ defaultMessage: "Đơn vị vận chuyển" })}: ${blockShippingUnit?.join(", ")}`}</span>
            <i className="fas fa-times icon-md ml-4" style={{ cursor: "pointer" }}
              onClick={() => {
                history.push(`${location.pathname}?${queryString.stringify({ ..._.omit(params, "shipping_unit") })}`.replaceAll("%2C", ","));
              }}
            />
          </span>
        )}

        {blockPayments?.length > 0 && (
          <span
            className="mb-4 py-2 px-4 d-flex justify-content-between align-items-center"
            style={{ border: "1px solid #ff6d49", borderRadius: 20, background: "rgba(255,109,73, .1)", }}
          >
            <span>{`${formatMessage({ defaultMessage: "Hình thức thanh toán" })}: ${blockPayments?.join(", ")}`}</span>
            <i className="fas fa-times icon-md ml-4"
              style={{ cursor: "pointer" }}
              onClick={() => {
                history.push(`${location.pathname}?${queryString.stringify({ ..._.omit(params, "payments"), })}`.replaceAll("%2C", ","));
              }}
            />
          </span>
        )}
      </div>
    );
  }, [location?.search]);
  return (
    <Fragment>
      <DrawerModal open={isOpenDrawer} onClose={onToggleDrawer} direction="right" size={500} enableOverlay={true}>
        <OrderSalesPersonFilterDrawer isOpenDrawer={isOpenDrawer} onToggleDrawer={onToggleDrawer} whereCondition={whereCondition} />
      </DrawerModal>

      <div className="d-flex align-items-center py-2 px-4 mb-4" style={{ backgroundColor: '#CFF4FC', border: '1px solid #B6EFFB', borderRadius: 4 }}>
        {LIGHT_BULB_SVG}
        <span className="fs-14" style={{ color: '#055160' }}>
          {formatMessage({ defaultMessage: 'Các đơn hàng có thời gian hơn 90 ngày sẽ được chuyển vào Lịch sử và không thể xử lý được nữa.' })}
        </span>
      </div>

      <div className="d-flex w-100 mb-4" style={{ zIndex: 1 }}>
        <div style={{ flex: 1 }}>
          <ul className="nav nav-tabs">
            {TABS.map((tab) => {
              const isTabActive = (tab.key == 1 && !params?.is_old_order) || (tab.key == 2 && !!params?.is_old_order);
              return (
                <li style={{ cursor: 'pointer' }} key={`tab-${tab?.status}`} onClick={() => {
                  setSearch('')
                  history.push(`${location.pathname}?${queryString.stringify({ page: 1, ...(tab.key == 2 ? { is_old_order: 1 } : {}), })}`)
                }}>
                  <span style={{ fontSize: "16px" }} className={`nav-link ${isTabActive ? "active" : ""}`}>
                    {tab?.title}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      <div className="mb-4">
        <div className="row">
          <div className="col-2 mr-0 pr-0" style={{ zIndex: 93 }}>
            <Select
              options={OPTIONS_SEARCH_BY_TIME}
              className="w-100 custom-select-order"
              isLoading={false}
              style={{ padding: 0 }}
              value={OPTIONS_SEARCH_BY_TIME.find((_op) => _op.value == typeSearchTime)}
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
                  let [gtCreateTime, ltCreateTime] = [dayjs(values[0]).unix(), dayjs(values[1]).unix(),];
                  queryParams = _.omit({ ...params, page: 1, gt: gtCreateTime, lt: ltCreateTime, }, ["shipping_unit", "payments"]);
                  let rangeTimeConvert = [gtCreateTime, ltCreateTime]?.map((_range) => new Date(_range * 1000));

                  setValueRangeTime(rangeTimeConvert);
                } else {
                  queryParams = _.omit({ ...params, page: 1 }, ["shipping_unit", "payments", "gt", "lt"]);
                }
                history.push(`/order-sales-person/list-order?${queryString.stringify(queryParams)}`);
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
                  history.push(`/order-sales-person/list-order?${queryString.stringify(omit({ ...params, page: 1, channel: channelsPush }, ['stores']))}`.replaceAll('%2C', '\,'))
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

                  history.push(`/order-sales-person/list-order?${queryString.stringify({ ...params, page: 1, stores: stores })}`.replaceAll('%2C', '\,'))
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
          <div className="col-2 pr-0" style={{ zIndex: 90 }}>
            <Select
              options={OPTIONS_SEARCH}
              className="w-100 custom-select-order"
              style={{ borderRadius: 0 }}
              isLoading={loadingStore}
              value={OPTIONS_SEARCH.find((_op) => _op.value == searchType)}
              onChange={(value) => {

                if (!!value) {
                  setSearchType(value?.value);
                  history.push(`/order-sales-person/list-order?${queryString.stringify({ ...params, page: 1, search_type: value.value, })}`);
                } else {
                  history.push(`/order-sales-person/list-order?${queryString.stringify({ ...params, page: 1, search_type: undefined, })}`);
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
              onBlur={(e) => history.push(`/order-sales-person/list-order?${queryString.stringify({ ...params, page: 1, q: e.target.value, })}`)}
              value={search || ""}
              onChange={(e) => {
                setSearch(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.keyCode == 13) {
                  history.push(`/order-sales-person/list-order?${queryString.stringify({ ...params, page: 1, q: e.target.value, })}`);
                }
              }}
            />
            <span><i className="flaticon2-search-1 icon-md ml-6"></i></span>
          </div>

          <div className="col-3" style={{ zIndex: 2 }}>
            <TreePicker
              className="upbase-picker-tree"
              searchable={false}
              data={OPTIONS_WAREHOUSE_FILTER(dataScWareHouse, dataSmeWarehouse)}
              style={{ width: '100%', height: 40 }}
              showIndentLine
              defaultExpandAll
              menuStyle={{ marginTop: 6 }}
              value={currentTreePicker}
              placeholder={formatMessage({ defaultMessage: 'Chọn kho' })}
              onChange={(value) => {
                if (!value) {
                  history.push(`/order-sales-person/list-order?${queryString.stringify(_.omit({ ...params, page: 1 }, ['warehouse_id', 'warehouse_filter']))}`);
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

                history.push(`/order-sales-person/list-order?${queryString.stringify(queryBuilder)}`)
              }}
              renderTreeNode={nodeData => {
                return (
                  <span className="d-flex align-items-center"
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
              style={{ color: checkedFilterBoxOrders ? "#ff6d49" : "", border: `1px solid ${checkedFilterBoxOrders ? "#ff6d49" : "#ebecf3"}`, borderRadius: 6, height: 40, cursor: "pointer", }}
              onClick={onToggleDrawer}
            >
              <span>{formatMessage({ defaultMessage: "Lọc đơn hàng nâng cao" })}</span>
              <span>
                <i style={{ color: checkedFilterBoxOrders ? "#ff6d49" : "" }} className="fas fa-filter icon-md ml-6"></i>
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4">{filterBlock}</div>

      </div>
      <Actions
        onShowImportDialog={onShowImportDialog}
        onShowExportDialog={onShowExportDialog}
        onSetDataSmeNote={onSetDataSmeNote}
        onOpenConfirmDialog={onOpenConfirmDialog}
        dataSelectedOrder={dataSelectedOrder}
      />

      <div className="d-flex w-100 mt-3">
        <div style={{ flex: 1 }}>
          <ul className="nav nav-tabs" id="myTab" role="tablist">
            {STATUS_PACK_TAB.map((_tab, index) => {
              const { title, status, sub } = _tab;
              const isActive = (!params.type && !status && sub.length == 0) || (params.type && (status === params?.type || sub?.some((_sub) => _sub?.status === params?.type)));

              return (
                <li style={{ cursor: 'pointer' }} key={`tab-order-${index}`} className={`nav-item ${isActive ? "active" : null} `}>
                  <div className={`nav-link font-weight-normal ${isActive ? "active" : ""}`}
                    style={{ fontSize: "13px", padding: "11px" }}
                    onClick={() => {
                      setCurrentStatus(title);

                      const findedIndexOrderDefault = _.findIndex(sub, (_sub) => !!_sub?.default);

                      history.push(`/order-sales-person/list-order?${queryString.stringify({ ...params, page: 1, type: sub?.length > 0 ? sub[findedIndexOrderDefault].status : status, })}`);
                    }}
                  >
                    {!status && sub.length == 0 ? (
                      <>{title}</>
                    ) : (
                      <>
                        {status != 'NONE_MAP_WAREHOUSE' ? <>
                          {title}
                          <span className="ml-1">
                            ({<OrderCount
                              whereCondition={_.omit({ ...whereCondition, list_status: sub.length > 0 ? _.map(sub, "status") : [status] }, 'filter_need_map_warehouse')}
                            />})
                          </span>
                        </> : <div className="d-flex align-items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" className="text-danger bi bi-exclamation-triangle-fill mr-2" viewBox="0 0 16 16">
                            <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
                          </svg>
                          <span>{title}</span>
                          <span className="ml-1">
                            ({<OrderCount whereCondition={{ ...whereCondition, filter_need_map_warehouse: 1, list_status: [], }} />})
                          </span>
                        </div>}
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

      </div>

      {_.find(STATUS_PACK_TAB, { title: currentStatus })?.sub?.length > 0 && (
        <div className="d-flex flex-wrap py-2" style={{ position: "sticky", top: 90, background: "#fff", zIndex: 1, gap: 20, marginBottom: "5px", }}>
          {_.find(STATUS_PACK_TAB, { title: currentStatus })?.sub?.map(
            (sub_status, index) => (
              <span key={`sub-status-order-${index}`} className="py-2 px-6 d-flex justify-content-between align-items-center"
                style={{ borderRadius: 20, background: sub_status?.status === params?.type ? "#ff6d49" : "#828282", color: "#fff", cursor: "pointer", }}
                onClick={() => {
                  history.push(`/order-sales-person/list-order?${queryString.stringify({ ...params, page: 1, type: sub_status?.status, })}`);
                }}
              >
                {sub_status?.status == 'connector_channel_error' ? formatMessage({ defaultMessage: 'Lỗi vận hành' }) : sub_status?.name} ({
                  <OrderCount
                    whereCondition={{
                      ...whereCondition,
                      list_status: [sub_status?.status],
                    }}
                  />})
              </span>
            )
          )}
        </div>
      )}
    </Fragment>
  );
}
);

export default Filter;
