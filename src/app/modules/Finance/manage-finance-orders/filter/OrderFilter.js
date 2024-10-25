import React, {
  Fragment,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useHistory, useLocation } from "react-router-dom";
import { Dropdown, Modal } from "react-bootstrap";
import Select from "react-select";
import queryString from "querystring";
import query_sc_stores_basic from "../../../../../graphql/query_sc_stores_basic";
import _, { omit } from "lodash";
import DateRangePicker from "rsuite/DateRangePicker";
import dayjs from "dayjs";
import { HistoryRounded } from "@material-ui/icons";
import DrawerModal from "../../../../../components/DrawerModal";
import OrderFilterDrawer from "./OrderFilterDrawer";
import mutate_reloadFinanceOrderCostPrice from "../../../../../graphql/mutate_reloadFinanceOrderCostPrice"
import mutate_createMultipleInvoice from "../../../../../graphql/mutate_createMultipleInvoice"
import mutate_reloadFinanceOrderVatRate from "../../../../../graphql/mutate_reloadFinanceOrderVatRate"
import { useIntl } from "react-intl";
import { useMutation, useQuery } from "@apollo/client";
import { TooltipWrapper } from '../../payment-reconciliation/common/TooltipWrapper'
import { useToasts } from "react-toast-notifications";
import LoadingDialog from "../../../ProductsStore/product-new/LoadingDialog";
import { CHILD_TAB, CHILD_TAB_RETURN_ORDER, NOT_EXPORT_BILL, OPTIONS_SOURCE_ORDER, ORDER_STATUS, SELL_LOWER_COST_PRICE, TAB_SELL_PRODUCT } from "../constants";
import ResultsDialog from "../dialogs/resultsDialog";
import mutate_processFinanceOrderLowPrice from "../../../../../graphql/mutate_processFinanceOrderLowPrice";
import makeAnimated from 'react-select/animated';
import AuthorizationWrapper from "../../../../../components/AuthorizationWrapper";
import { formatNumberToCurrency } from "../../../../../utils";
import { OPTIONS_ORDER, PRICE_IN_ORDER_OPTION } from "../../../Order/OrderUIHelpers";

const OrderFilter = memo(({
  storesAndChannel,
  amountOrderTabReturn,
  amountOrderTab,
  whereConditionPayments,
  valueRangeTime,
  setValueRangeTime,
  ids,
  setIds,
  refetchListFinanceOrder,
  openDialogExportFile,
  totalPaidPrice
}) => {
  const location = useLocation();
  const history = useHistory();
  const { formatMessage } = useIntl();
  const { addToast } = useToasts()
  const animatedComponents = makeAnimated();
  const params = queryString.parse(location.search.slice(1, 100000));

  const [isOpenDrawer, setOpenDrawer] = useState(false);

  const onToggleDrawer = useCallback(() => setOpenDrawer((prev) => !prev), [
    setOpenDrawer,
  ]);

  const [search, setSearch] = useState(params?.q || '');
  const [searchType, setSearchType] = useState(1);
  const [result, setResult] = useState(null);

  const {loadingGetChannel, currentChannels, channelsActive, currentStores, optionsStores} = storesAndChannel ?? {}

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

  useEffect(() => {
    setSearch(params.q);
  }, [params.q]);

  useEffect(() => {
    setSearchType(params.search_type || 1);
  }, [params.search_type]);

  const placeholderInput = useMemo(() => {
    return searchType == 1 ? formatMessage({ defaultMessage: 'Tìm chứng từ' }) : formatMessage({ defaultMessage: 'Tìm đơn hàng' })
  }, [searchType])

  const checkedFilterBoxOrders = useMemo(() => {
    const KEYS_IN_BOX_SEARCH = [
      "capital_price_status",
      "payments",
      "warehouse_status",
      'order_type',
      'is_lower_cost_price'
    ];

    let checked = KEYS_IN_BOX_SEARCH?.some((_key) => _key in params);

    return checked;
  }, [location.search]);


  const OPTIONS_WAREHOUSE_STATUS = [
    {
      value: 2,
      label: formatMessage({ defaultMessage: "Đã xuất kho" }),
    },
    {
      value: 1,
      label: formatMessage({ defaultMessage: "Đã nhập kho" }),
    },
    {
      value: 3,
      label: formatMessage({ defaultMessage: "Chưa nhập kho" }),
    }
  ];

  const STATUS_ORDER_FIlTER_DRAWER = [
    {
      value: "SHIPPED",
      label: formatMessage({ defaultMessage: "Đã giao cho ĐVVC" }),
    },
    {
      value: "COMPLETED",
      label: formatMessage({ defaultMessage: "Hoàn thành" }),
    },
    {
      value: "TO_CONFIRM_RECEIVE",
      label: formatMessage({ defaultMessage: "Đã giao cho người mua" }),
    },
    {
      value: "CANCELLED",
      label: formatMessage({ defaultMessage: "Hủy" }),
    },
  ];

  const CAPITAL_PRICE_STATUS = [
    {
      value: 1,
      label: formatMessage({ defaultMessage: "Giá vốn = 0" }),
    },
    {
      value: 2,
      label: formatMessage({ defaultMessage: "Giá vốn > 0" }),
    },
  ]

  const optionsSearch = [
    {
      value: 1,
      label: formatMessage({ defaultMessage: "Số chứng từ" }),
    },
    {
      value: 2,
      label: formatMessage({ defaultMessage: "Mã đơn hàng" }),
    },
  ];

  const optionsSearchByTimes = [
    {
      value: "order_at",
      label: formatMessage({ defaultMessage: "Thời gian đặt hàng" }),
    },
    {
      value: "completed_at",
      label: formatMessage({ defaultMessage: "Ngày hoàn thành" }),
    },
    {
      value: "received_at",
      label: formatMessage({ defaultMessage: "Thời gian giao cho người mua" }),
    },
    {
      value: "wh_exported_at",
      label: formatMessage({ defaultMessage: "Thời gian xuất kho" })
    }
  ];
  const optionsTimes = !!params?.is_old_order ? optionsSearchByTimes.slice(0, 2) : optionsSearchByTimes

  useMemo(() => {
    if (!params?.gt || !params?.lt) return;

    let rangeTimeConvert = [params?.gt, params?.lt]?.map(
      (_range) => new Date(_range * 1000)
    );
    setValueRangeTime(rangeTimeConvert);
  }, [params?.gt, params?.lt]);

  const { data: dataStore, loading: loadingStore } = useQuery(query_sc_stores_basic, { fetchPolicy: "cache-and-network", });

  const filterBlock = useMemo(() => {

    let parseParamsCapitalPriceStatus = params?.capital_price_status
    let blockCapitalPriceStatus = CAPITAL_PRICE_STATUS?.find((_option) => parseParamsCapitalPriceStatus == _option?.value)

    let blockWarehouseStatus = OPTIONS_WAREHOUSE_STATUS?.find(status => status?.value == params?.warehouse_status)
    let blockOrderStatus = STATUS_ORDER_FIlTER_DRAWER?.find(status => status?.value == params?.order_status)
    let blockOrderType = OPTIONS_ORDER?.find(type => type?.value == params?.order_type)
    let blockPriceInOrderType = PRICE_IN_ORDER_OPTION?.find(type => type?.value == params?.is_lower_cost_price)

    const blockListSource = OPTIONS_SOURCE_ORDER?.filter((_option) => params?.list_source?.split(",")?.some((param) => param == _option?.value));

    let blockPayments = params?.payments
    return (
      <div className="d-flex flex-wrap" style={{ gap: 10 }}>

        {blockCapitalPriceStatus && (
          <span className="mb-4 py-2 px-4 d-flex justify-content-between align-items-center" style={{ border: "1px solid #ff6d49", borderRadius: 20, background: "rgba(255,109,73, .1)", }}>
            <span>{`${formatMessage({ defaultMessage: "Giá vốn", })}: ${blockCapitalPriceStatus?.label}`}</span>
            <i className="fas fa-times icon-md ml-4" style={{ cursor: "pointer" }}
              onClick={() => {
                history.push(`${location.pathname}?${queryString.stringify({ ..._.omit(params, "capital_price_status") })}`.replaceAll("%2C", ","));
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
            <span>{`${formatMessage({ defaultMessage: "Hình thức thanh toán" })}: ${blockPayments}`}</span>
            <i
              className="fas fa-times icon-md ml-4"
              style={{ cursor: "pointer" }}
              onClick={() => {
                history.push(`${location.pathname}?${queryString.stringify({ ..._.omit(params, "payments"), })}`.replaceAll("%2C", ","));
              }}
            />
          </span>
        )}

        {blockWarehouseStatus && (
          <span
            className="mb-4 py-2 px-4 d-flex justify-content-between align-items-center"
            style={{
              border: "1px solid #ff6d49",
              borderRadius: 20,
              background: "rgba(255,109,73, .1)",
            }}
          >
            <span>{`${formatMessage({ defaultMessage: "Tình trạng kho", })}: ${blockWarehouseStatus?.label}`}</span>
            <i
              className="fas fa-times icon-md ml-4"
              style={{ cursor: "pointer" }}
              onClick={() => {
                history.push(`${location.pathname}?${queryString.stringify({ ..._.omit(params, "warehouse_status") })}`.replaceAll("%2C", ","));
              }}
            />
          </span>
        )}

        {blockOrderStatus && (
          <span
            className="mb-4 py-2 px-4 d-flex justify-content-between align-items-center"
            style={{
              border: "1px solid #ff6d49",
              borderRadius: 20,
              background: "rgba(255,109,73, .1)",
            }}
          >
            <span>{`${formatMessage({
              defaultMessage: "Trạng thái đơn",
            })}: ${blockOrderStatus?.label}`}</span>
            <i
              className="fas fa-times icon-md ml-4"
              style={{ cursor: "pointer" }}
              onClick={() => {
                history.push(`${location.pathname}?${queryString.stringify({ ..._.omit(params, "order_status") })}`.replaceAll("%2C", ","));
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

        {blockPriceInOrderType && (
          <span
            className="mb-4 py-2 px-4 d-flex justify-content-between align-items-center"
            style={{
              border: "1px solid #ff6d49",
              borderRadius: 20,
              background: "rgba(255,109,73, .1)",
            }}
          >
            <span>{`${formatMessage({
              defaultMessage: "Giá vốn trong đơn",
            })}: ${blockPriceInOrderType?.label}`}</span>
            <i
              className="fas fa-times icon-md ml-4"
              style={{ cursor: "pointer" }}
              onClick={() => {
                history.push(`${location.pathname}?${queryString.stringify({ ..._.omit(params, "is_lower_cost_price") })}`.replaceAll("%2C", ","));
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
      </div>
    );
  }, [location?.search, dataStore]);


  const tabs = [{ title: formatMessage({ defaultMessage: 'Bán hàng' }), key: 1 }, { title: formatMessage({ defaultMessage: 'Trả lại hàng bán' }), key: 2 },]

  const tab_type = useMemo(() => {
    return params?.tab ? params?.tab : 1
  }, [params?.tab])

  // ==================================== mutate ==========================================

  const [reloadFinanceOrderCostPrice, { loading: loadingReloadFinance }] = useMutation(
    mutate_reloadFinanceOrderCostPrice,
    { refetchQueries: ['getListFinanceOrder'] });

  const [createMultipleInvoice, { loading: loadingCreateMultipleInvoice }] = useMutation(
    mutate_createMultipleInvoice,
    { refetchQueries: ['getListFinanceOrder'] });

  const [reloadFinanceOrderVatRate, { loading: loadingReloadFinanceOrderVatRate }] = useMutation(
    mutate_reloadFinanceOrderVatRate,
    { refetchQueries: ['getListFinanceOrder'] });

  const [processFinanceOrderLowPrice, { loading: loadingProcessFinanceOrderLowPrice }] = useMutation(
    mutate_processFinanceOrderLowPrice,
    { refetchQueries: ['getListFinanceOrder'] });

  // ==================================== mutation ==============================

  const handleProcessFinanceOrderLowPrice = async () => {
    const { data } = await processFinanceOrderLowPrice({
      variables: {
        list_finance_order_id: ids?.map(item => item?.id)
      }
    })

    if (!!data?.processFinanceOrderLowPrice?.success) {
      addToast(formatMessage({ defaultMessage: 'Thành công' }), { appearance: 'success' })
      return
    }
    addToast(formatMessage({ defaultMessage: 'Có lỗi xảy ra' }), { appearance: 'error' })
  }

  const handleReloadFinanceOrderVatRate = async () => {
    const { data } = await reloadFinanceOrderVatRate({
      variables: {
        list_finance_order_id: ids?.map(item => item?.id)
      }
    })

    if (!!data?.reloadFinanceOrderVatRate?.success) {
      addToast(formatMessage({ defaultMessage: 'Thành công' }), { appearance: 'success' })
      return
    }
    addToast(formatMessage({ defaultMessage: 'Có lỗi xảy ra' }), { appearance: 'error' })
  }

  const handleCreateMultipleInvoice = async () => {
    const { data } = await createMultipleInvoice({
      variables: {
        list_id: ids?.map(item => item?.id)
      }
    })
    if (!!data?.createMultipleInvoice?.success) {
      setResult(data?.createMultipleInvoice)
      return
    } else {
      addToast(data?.createMultipleInvoice?.message || formatMessage({ defaultMessage: 'Có lỗi xảy ra' }), { appearance: 'error' })
    }
  }


  const updateCostPrice = async () => {
    const { data } = await reloadFinanceOrderCostPrice({
      variables: {
        list_finance_order_id: ids?.map(item => item?.id)
      }
    })
    if (!!data?.reloadFinanceOrderCostPrice?.success) {
      addToast(formatMessage({ defaultMessage: 'Thành công' }), { appearance: 'success' })
      setIds([])
      return
    }
    addToast(data?.reloadFinanceOrderCostPrice?.message || formatMessage({ defaultMessage: 'Có lỗi xảy ra' }), { appearance: 'error' })
    return
  }

  return (
    <Fragment>
      <LoadingDialog show={loadingReloadFinance || loadingProcessFinanceOrderLowPrice || loadingCreateMultipleInvoice || loadingReloadFinanceOrderVatRate} />
      <ResultsDialog result={result} onHide={() => {
        setResult(null)
        history.push(`/finance/manage-finance-order?${queryString.stringify({ ...params, page: 1, invoice: 1, })}`)
      }} />
      <DrawerModal
        open={isOpenDrawer}
        onClose={onToggleDrawer}
        direction="right"
        size={500}
        enableOverlay={true}
      >
        <OrderFilterDrawer
          CAPITAL_PRICE_STATUS={CAPITAL_PRICE_STATUS}
          isOpenDrawer={isOpenDrawer}
          onToggleDrawer={onToggleDrawer}
          STATUS_ORDER_FIlTER_DRAWER={STATUS_ORDER_FIlTER_DRAWER}
          OPTIONS_WAREHOUSE_STATUS={OPTIONS_WAREHOUSE_STATUS}
          dataStore={dataStore}
          whereCondition={whereConditionPayments}
        />
      </DrawerModal>

      <div className="d-flex w-100 mb-4" style={{ zIndex: 1 }}>
        <div style={{ flex: 1 }}>
          <ul className="nav nav-tabs">
            {tabs.map((tab) => {
              return (
                <li
                  key={`tab-${tab.key}`}
                  onClick={() => {
                    setValueRangeTime(null)
                    history.push(`${location.pathname}?${queryString.stringify({ page: 1, tab: tab?.key, })}`
                    );
                  }}
                >
                  <a style={{ fontSize: "16px" }} className={`nav-link ${tab_type == tab.key ? "active" : ""}`}>
                    {tab.title}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

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
            {[
              { key: 1, title: formatMessage({ defaultMessage: 'Trong vòng 90 ngày' }) },
              { key: 2, title: formatMessage({ defaultMessage: 'Lịch sử' }) },
            ].map((tab) => {
              const isTabActive = (tab.key == 1 && !params?.is_old_order) || (tab.key == 2 && !!params?.is_old_order);
              return (
                <li
                  key={`tab-${tab.key}`}
                  onClick={() => {
                    history.push(`${location.pathname}?${queryString.stringify({ page: 1, tab: params?.tab, ...(tab.key == 2 ? { is_old_order: 1 } : {}), })}`);
                  }}
                >
                  <a style={{ fontSize: "16px" }} className={`nav-link ${isTabActive ? "active" : ""}`}>{tab.title}</a>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="mb-4">
        <div className="row">
          <div className="col-3 mr-0 pr-0">
            <Select
              options={optionsTimes}
              className="w-100 custom-select-order"
              isLoading={loadingStore}
              style={{ padding: 0 }}
              value={optionsTimes?.find((_op) => _op.value == (params?.time_type || 'order_at'))}
              styles={{
                container: (styles) => ({
                  ...styles,
                  zIndex: 99
                }),
              }}
              onChange={(value) => {
                if (!!value) {
                  history.push(`${location.pathname}?${queryString.stringify({
                    ...params,
                    time_type: value.value,
                  })}`
                  );
                }
              }}
              formatOptionLabel={(option, labelMeta) => {
                return <div>{option.label}</div>;
              }}
            />
          </div>
          <div className="col-3 ml-0 pl-0">
            <DateRangePicker
              style={{ float: "right", width: "100%" }}
              character={" - "}
              className="custome__style__input__date"
              format={"dd/MM/yyyy"}
              value={valueRangeTime}
              placeholder={"dd/mm/yyyy - dd/mm/yyyy"}
              placement={"bottomEnd"}
              disabledDate={disabledFutureDate}
              onChange={(values) => {
                let queryParams = {};
                setValueRangeTime(values);

                if (!!values) {
                  let [gtCreateTime, ltCreateTime] = [dayjs(values[0]).startOf("day").unix(), dayjs(values[1]).endOf("day").unix(),];
                  queryParams = _.omit({ ...params, gt: gtCreateTime, lt: ltCreateTime, page: 1 }, ["payments"]);
                  let rangeTimeConvert = [gtCreateTime, ltCreateTime]?.map((_range) => new Date(_range * 1000));
                  setValueRangeTime(rangeTimeConvert);
                } else {
                  queryParams = _.omit({ ...params, page: 1 }, ["payments", "gt", "lt"]);
                }
                history.push(`/finance/manage-finance-order?${queryString.stringify(queryParams)}`);
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
                      placeholder='Chọn sàn'
                      components={animatedComponents}
                      isClearable
                      isMulti
                      value={currentChannels}
                      isLoading={loadingGetChannel}
                      onChange={values => {
                          const channelsPush = values?.length > 0 ? _.map(values, 'value')?.join(',') : undefined;
                          history.push(`/finance/manage-finance-order?${queryString.stringify(omit({ ...params, page: 1, channel: channelsPush }, ['stores']))}`.replaceAll('%2C', '\,'))
                      }}
                      formatOptionLabel={(option, labelMeta) => {
                          return <div className="d-flex align-items-center">
                              {!!option.logo && <img src={option.logo} alt="" style={{ width: 15, height: 15, marginRight: 4 }} />}
                              <span>{option.label}</span>
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
                        placeholder='Chọn gian hàng'
                        components={animatedComponents}
                        isClearable
                        isMulti
                        value={currentStores}
                        isLoading={loadingGetChannel}
                        onChange={values => {
                            const stores = values?.length > 0 ? _.map(values, 'value')?.join(',') : undefined;

                            history.push(`/finance/manage-finance-order?${queryString.stringify({ ...params, page: 1, stores: stores })}`.replaceAll('%2C', '\,'))
                        }}
                        formatOptionLabel={(option, labelMeta) => {
                            return <div className="d-flex align-items-center">
                                {!!option.logo && <img src={option.logo} style={{ width: 15, height: 15, marginRight: 4 }} />}
                                <span>{option.label}</span>
                            </div>
                        }}
                    />
                </div>
            </div>
        </div>
      </div>

      <div>
        <div className="form-group row my-4">
          <div className="col-3 pr-0" style={{ zIndex: 91 }}>
            <Select
              options={optionsSearch}
              className="w-100 custom-select-order"
              style={{ borderRadius: 0 }}
              isLoading={loadingStore}
              value={optionsSearch.find((_op) => _op.value == searchType)}
              onChange={(value) => {
                setSearchType(value);
                if (!!value) {
                  history.push(`/finance/manage-finance-order?${queryString.stringify({ ...params, page: 1, search_type: value.value })}`);
                } else {
                  history.push(`/finance/manage-finance-order?${queryString.stringify({
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
            className="col-6 input-icon pl-0"
            style={{ height: "fit-content" }}
          >
            <input
              type="text"
              className="form-control"
              placeholder={placeholderInput}
              style={{ height: 37, borderRadius: 0, paddingLeft: "50px" }}
              onBlur={(e) => {
                if (e.target.value == search) {
                  refetchListFinanceOrder()
                }
                history.push(`/finance/manage-finance-order?${queryString.stringify({
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
                  if (e.target.value == search) {
                    refetchListFinanceOrder()
                  }
                  history.push(`/finance/manage-finance-order?${queryString.stringify({
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
          <div className="col-3">
            <div className="d-flex align-items-center justify-content-between px-4 py-2"
              style={{ color: checkedFilterBoxOrders ? "#ff6d49" : "", border: `1px solid ${checkedFilterBoxOrders ? "#ff6d49" : "#ebecf3"}`, borderRadius: 6, height: 40, cursor: "pointer" }}
              onClick={onToggleDrawer}
            >
              <span>{formatMessage({ defaultMessage: "Lọc đơn hàng nâng cao" })}</span>
              <span><i style={{ color: checkedFilterBoxOrders ? "#ff6d49" : "" }} className="fas fa-filter icon-md ml-6"></i></span>
            </div>
          </div>
        </div>

        <div className="mt-4">{filterBlock}</div>
      </div>
      <div className="row">
          <div className="col-3">
            <span>{formatMessage({defaultMessage: "Tổng tiền thanh toán"})}: </span>
            <span style={{color: '#FE5629'}}>{formatNumberToCurrency(totalPaidPrice)} đ</span>
          </div>
      </div>
      <div style={{ position: "sticky", top: 45, background: "#fff", zIndex: 90 }}>
        <div className={`col-12 d-flex align-items-center py-4 ${!params?.is_old_order ? 'justify-content-between' : 'justify-content-end'}`}>
          {!params?.is_old_order && <div className="d-flex align-items-center">
            {(!!params?.invoice && params?.invoice == NOT_EXPORT_BILL) && <div className="mr-4 text-primary" style={{ fontSize: 14 }}>
              {formatMessage({ defaultMessage: "Đã chọn:" })} {ids?.length}
            </div>}

            {(!!params?.invoice && (params?.invoice == NOT_EXPORT_BILL || params?.invoice == SELL_LOWER_COST_PRICE)) ? (
              <Dropdown drop='down'>
                <Dropdown.Toggle disabled={!ids.length} className={`${ids?.length ? 'btn-primary' : 'btn-darkk'} btn`} >
                  {formatMessage({ defaultMessage: "Thao tác hàng loạt" })}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <AuthorizationWrapper keys={['finance_order_cost_price_process']}>
                      <Dropdown.Item className="mb-1 d-flex" onClick={updateCostPrice} >
                        {formatMessage({ defaultMessage: "Cập nhật giá vốn" })}
                        <TooltipWrapper note={formatMessage({ defaultMessage: "Giá vốn của sản phẩm trong đơn sẽ được lấy từ sản phẩm kho hiện tại." })}>
                          <i className="fas fa-info-circle fs-14 ml-2"></i>
                        </TooltipWrapper>
                      </Dropdown.Item>
                  </AuthorizationWrapper>
                  {params?.invoice == NOT_EXPORT_BILL && (
                    <>
                      <AuthorizationWrapper keys={['finance_order_manage_export']}>
                        <Dropdown.Item className="mb-1 d-flex" onClick={handleCreateMultipleInvoice} >
                          {formatMessage({ defaultMessage: "Xuất hoá đơn" })}
                        </Dropdown.Item>
                      </AuthorizationWrapper>
                      <AuthorizationWrapper keys={['finance_order_vat_rate_reload']}>
                        <Dropdown.Item className="mb-1 d-flex" onClick={handleReloadFinanceOrderVatRate} >
                          {formatMessage({ defaultMessage: "Cập nhật VAT" })}
                        </Dropdown.Item>
                      </AuthorizationWrapper>
                    </>
                  )}
                  {params?.invoice == SELL_LOWER_COST_PRICE && (
                    <Dropdown.Item className="mb-1 d-flex" onClick={handleProcessFinanceOrderLowPrice} >
                      {formatMessage({ defaultMessage: "Đã xử lý nghiệp vụ" })}
                    </Dropdown.Item>
                  )}

                </Dropdown.Menu>
              </Dropdown>
            ) : (
              <Fragment>
                <AuthorizationWrapper keys={['finance_order_cost_price_process']}>
                  <button type="button" className="btn btn-elevate btn-primary mr-3 px-4" disabled={ids?.length == 0}
                    style={{ color: "white", width: 'max-content', background: ids?.length == 0 ? "#6c757d" : "", border: ids?.length == 0 ? "#6c757d" : "", }}
                    onClick={updateCostPrice}
                  >
                    {formatMessage({ defaultMessage: "Cập nhật giá vốn" })}
                    <TooltipWrapper note={formatMessage({ defaultMessage: "Giá vốn của sản phẩm trong đơn sẽ được lấy từ sản phẩm kho hiện tại." })}>
                      <i className="fas fa-info-circle fs-14 ml-2"></i>
                    </TooltipWrapper>
                  </button>
                </AuthorizationWrapper>
              </Fragment>
            )}
          </div>}

          <div className="d-flex justify-content-end" style={{ gap: 10 }}>
            <div className="pr-0">
              <button className="btn btn-primary btn-elevate w-100"
                onClick={(e) => {
                  e.preventDefault();
                  openDialogExportFile()
                }}
                style={{ flex: 1 }}
              >
                {formatMessage({ defaultMessage: "Xuất dữ liệu" })}
              </button>
            </div>
            <div>
              <button className="btn btn-secondary btn-elevate"
                onClick={(e) => {
                  e.preventDefault();
                  history.push(`/finance/exportfile-finance-order?type=${params?.tab || TAB_SELL_PRODUCT}`);
                }}
              >
                <HistoryRounded />
              </button>
            </div>
          </div>


        </div>

        {params?.tab != 2 && (
          <div className="d-flex w-100 mt-2" style={{ background: "#fff", zIndex: 1, borderBottom: 'none' }}>
            <div style={{ flex: 1 }}>
              <ul className="nav nav-tabs" id="myTab" role="tablist">
                {CHILD_TAB?.slice(0, CHILD_TAB.length).map((_tab, index) => {
                  const { title, status } = _tab;
                  const isActive = status == (params?.invoice || "");
                  return (
                    <>
                      <li style={{ cursor: 'pointer' }} key={`tab-order-${index}`} className={`nav-item ${isActive ? "active" : ""}`}>
                        <span className={`nav-link font-weight-normal ${isActive ? "active" : ""}`} style={{ fontSize: "13px" }}
                          onClick={() => {
                            setIds([])
                            history.push(`${location.pathname}?${queryString.stringify({ ...params, page: 1, invoice: status })}`);
                          }}
                        >
                          {formatMessage(title)}
                          <span className='mx-2'>
                            {`(${amountOrderTab[status || 'all'] || 0})`}
                          </span>
                        </span>
                      </li>
                    </>
                  );
                })}
              </ul>
            </div>
          </div>
        )}

        {params?.tab == 2 && (
          <div className="d-flex w-100 mt-2" style={{ background: "#fff", zIndex: 1, borderBottom: 'none' }}>
            <div style={{ flex: 1 }}>
              <ul className="nav nav-tabs" id="myTab" role="tablist">
                {CHILD_TAB_RETURN_ORDER.map((_tab, index) => {
                  const { title, status } = _tab;
                  const isActive = status == (params?.invoiceCancel || "");
                  return (
                    <>
                      <li style={{ cursor: 'pointer' }} key={`tab-order-${index}`} className={`nav-item ${isActive ? "active" : ""}`}>
                        <span className={`nav-link font-weight-normal ${isActive ? "active" : ""}`} style={{ fontSize: "13px" }}
                          onClick={() => {
                            setIds([])
                            history.push(`${location.pathname}?${queryString.stringify({ ...params, page: 1, invoiceCancel: status })}`);
                          }}
                        >
                          {formatMessage(title)}
                          <span className='mx-2'>
                            {`(${amountOrderTabReturn[status || 'all'] || 0})`}
                          </span>
                        </span>
                      </li>
                    </>
                  );
                })}
              </ul>
            </div>
          </div>
        )}

      </div>
    </Fragment>
  );
}
);

export default OrderFilter;
