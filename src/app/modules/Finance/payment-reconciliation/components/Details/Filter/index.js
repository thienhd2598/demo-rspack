import React, { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { Card, CardBody } from '../../../../../../../_metronic/_partials/controls';
import { useIntl } from 'react-intl';
import dayjs from 'dayjs';
import queryString from "querystring";
import DateRangePicker from "rsuite/DateRangePicker";
import Select from "react-select";
import { HistoryRounded } from "@material-ui/icons";
import { Dropdown } from "react-bootstrap"
import { optionsSearchByTimesSettlementing, optionsSearchByTimesSettlemented, tabs, optionsSearch, optionsOverdue, subTab } from "../../../common/Constants";
import { find, omit } from 'lodash';
import { TooltipWrapper } from '../../../common/TooltipWrapper';
import ExportFileDialog from '../../../dialogs/ExportFileDialog'
import { formatNumberToCurrency } from '../../../../../../../utils';
import ImportFileDialog from '../../../dialogs/ImportFileDialog'
import { ResultImportFileDialog } from '../../../dialogs/ResultImportFileDialog';
import AuthorizationWrapper from '../../../../../../../components/AuthorizationWrapper';
const Filter = ({
  platform,
  coReloadOrder,
  countTab,
  channel,
  valueRangeTime,
  setDialogFinaliztion,
  setValueRangeTime,
  settlement_abnormal,
  settlement_timeout, 
  refetch,
  search_type_time,
  tab_type,
  setDialogProcess,
  pushToUrl, countOrder,
  settlement_abnormal_status, ids, setIds }) => {

  const { params, history, location } = pushToUrl;

  const { formatMessage } = useIntl();

  const [valueRangeTimeSettlementing, setValueRangeTimeSettlementing] = useState(null)

  const [exportFileDialog, setExportFileDialog] = useState(false)
  const [importFileDialog, setImportFileDialog] = useState(false)
  const [dataImportMenual, setDataImportMenual] = useState(null)

  const [valueRangeTimeSettlemented, setValueRangeTimeSettlemented] = useState([new Date(dayjs().subtract(6, "day")), new Date(dayjs()),]);

  const [inputSearchValue, setInputSearchValue] = useState('')

  const [currentStatus, setCurrentStatus] = useState(subTab[0]?.title || "");

  const checkTimeSearchOption = tab_type == 'PENDING' ? optionsSearchByTimesSettlementing : optionsSearchByTimesSettlemented

  useEffect(() => {
    setInputSearchValue(params?.q || '');
  }, [params]);

  useMemo(() => {
    if (!params?.gt || !params?.lt) return;

    let rangeTimeConvert = [params?.gt, params?.lt]?.map(
      (_range) => new Date(_range * 1000)
    );
    setValueRangeTime(rangeTimeConvert);
  }, [params?.gt, params?.lt]);

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

  useMemo(() => {
    if (!params.settlement_abnormal) {
      setCurrentStatus(subTab[0]?.title);
    }

    let findedStatus =
      find(subTab, { status: params?.settlement_abnormal }) ||
      find(subTab, (_status) =>
        _status?.sub?.some((_sub) => _sub?.status === params?.settlement_abnormal)
      );

    setCurrentStatus(findedStatus?.title);
  }, [params?.settlement_abnormal]);

  const store = useMemo(() => {
    return params?.store || ''
  }, [params?.store])

  return (
    <>
    {importFileDialog && <ImportFileDialog show={importFileDialog} setDataImportMenual={setDataImportMenual} onHide={() => setImportFileDialog(false)}/>}
    {dataImportMenual && <ResultImportFileDialog dataProcessed={dataImportMenual} onHide={() => setDataImportMenual(null)}/>}
      {exportFileDialog && <ExportFileDialog params={params} status={tab_type} show={exportFileDialog} onHide={() => setExportFileDialog(false)} />}
      <p
        className="text-dark mb-2"
        style={{ fontSize: "14px", fontWeight: 700, width: "17%" }}
      >
        {formatMessage({ defaultMessage: "Chi tiết" })}
      </p>

      <div className="d-flex w-100 mb-4" style={{ zIndex: 1 }}>
        <div style={{ flex: 1 }}>
          <ul className="nav nav-tabs">
            {tabs.map((tab) => {
              return (
                <li
                  key={`tab-${tab.key}`}
                  onClick={() => {
                    setIds([])
                    setValueRangeTimeSettlemented(null)
                    setValueRangeTimeSettlementing(null)
                    history.push(
                      `${location.pathname}?${queryString.stringify({
                        page: 1,
                        platform,
                        channel,
                        store,
                        tab: tab?.key,
                        ...(params?.is_old_order ? { is_old_order: 1 } : {
                          // ...paramsTime
                        }),
                      })}`
                    );
                    setInputSearchValue('')
                  }}
                >
                  <a
                    style={{ fontSize: "16px" }}
                    className={`nav-link ${tab_type === tab.key ? "active" : ""
                      }`}
                  >
                    {formatMessage(tab.title)} {`(${tab?.key == 'PROCESSED' ? (formatNumberToCurrency(countTab.count_processed) || '0') : (formatNumberToCurrency(countTab.count_pending) || '0')})`}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="mb-4 row" style={{zIndex: 95}}>
        <div className="col-5 row">
          <div style={{ zIndex: 23 }} className="col-6 mr-0 pr-0">
            <Select
              options={checkTimeSearchOption}
              className="w-100 custom-select-order"
              style={{ padding: 0 }}
              value={checkTimeSearchOption.find(
                (_op) => _op.value == search_type_time
              )}
              onChange={(value) => {
                if (!!value) {
                  history.push(
                    `${location.pathname}?${queryString.stringify({
                      ...params,
                      search_type_time: value.value,
                    })}`
                  );
                }
              }}
              formatOptionLabel={(option, labelMeta) => {
                return <div>{formatMessage(option.label)}</div>;
              }}
            />
          </div>
          <div className="col-6 ml-0 pl-0">
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
                  let [gtCreateTime, ltCreateTime] = [
                    dayjs(values[0]).startOf("day").unix(),
                    dayjs(values[1]).endOf("day").unix(),
                  ];
                  queryParams = {
                    ...params,
                    page: 1,
                    gt: gtCreateTime,
                    lt: ltCreateTime,
                  }
                  let rangeTimeConvert = [gtCreateTime, ltCreateTime]?.map(
                    (_range) => new Date(_range * 1000)
                  );
                  setValueRangeTime(rangeTimeConvert);
                } else {
                  queryParams = omit({ ...params, page: 1 }, ["gt", "lt"]);
                }
                history.push(
                  `${location.pathname}?${queryString.stringify(queryParams)}`
                );
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
        </div>

        <div className='col-4 row'> 
          <div className="col-5 pr-0" style={{ zIndex: 20 }}>
            <Select
              options={optionsSearch}
              className="w-100 custom-select-order"
              style={{ borderRadius: 0 }}
              value={optionsSearch.find((_op) => _op.value)}
              formatOptionLabel={(option, labelMeta) => {
                return <div>{formatMessage(option.label)}</div>;
              }}
            />
          </div>
          <div className="col-7 input-icon pl-0"
            style={{ height: "fit-content" }}
          >
            <input
              type="text"
              className="form-control"
              placeholder={formatMessage({ defaultMessage: "Tìm đơn hàng" })}
              style={{ height: 37, borderRadius: 0, paddingLeft: "50px" }}
              onChange={(e) => {
                setInputSearchValue(e.target.value)
              }}
              value={inputSearchValue}
              onKeyDown={(e) => {
                if (e.keyCode == 13) {
                  if (inputSearchValue == params?.q) {
                    refetch()
                    return
                  }
                  history.push(
                    `${location.pathname}?${queryString.stringify({
                      ...params,
                      page: 1,
                      q: inputSearchValue,
                    })}`
                  );
                }
              }}
            />
            <span>
              <i className="flaticon2-search-1 icon-md ml-6"></i>
            </span>
          </div>
        </div>
        <div className='col-3 w-100' style={{ zIndex: 90}}>
        {tab_type == 'PENDING' && (
          <div className="pr-0" style={{ zIndex: 98 }}>
            <div className="d-flex align-items-center justify-content-arroud">
              <div className='d-flex align-items-center'>
                <span style={{ width: '50px' }}>{formatMessage({ defaultMessage: 'Quá hạn' })}</span>
                <TooltipWrapper note={formatMessage({ defaultMessage: 'Quyết toán không được giải quyết trong vòng 24 giờ sau khi đơn hàng được hoàn thành.' })}>
                  <i className="fas fa-info-circle fs-14 ml-2 mr-2"></i>
                </TooltipWrapper>
              </div>
              <Select
                options={optionsOverdue}
                className="w-100 custom-select-warehouse"
                style={{ padding: 0 }}
                value={optionsOverdue.find(
                  (_op) => _op.value == settlement_timeout
                )}
                onChange={(value) => {
                  if (!!value) {
                    history.push(
                      `${location.pathname}?${queryString.stringify({
                        ...params,
                        page: 1,
                        settlement_timeout: value.value,
                      })}`
                    );
                  }
                }}
                formatOptionLabel={(option, labelMeta) => {
                  return <div>{formatMessage(option.label)}</div>;
                }}
              />
            </div>
          </div>
        )
        }
        </div>
      </div>


      {tab_type == 'PENDING' && (
        <>
        <div style={{ position: 'sticky', top: 45, zIndex: 19, background: '#fff', width: '100%' }} className={`d-flex align-items-center py-4 ${!params?.is_old_order ? 'justify-content-between' : 'justify-content-end'}`}>
          {!params?.is_old_order && (
              params?.platform == 'manual' ? (
                <div className='d-flex align-items-center'>
                <div className="mr-4 text-primary" style={{ fontSize: 14 }}>{formatMessage({ defaultMessage: 'Đã chọn:' })} {ids.length}</div>
              <AuthorizationWrapper keys={['finance_settlement_order_confirm']}>
                <button
                onClick={() => setDialogFinaliztion(true)}
                type="button"
                disabled={ids?.length == 0}
                className="btn btn-primary mr-3 px-8"
                style={{ width: 120, background: ids?.length == 0 ? '#6c757d' : '', border: ids?.length == 0 ? '#6c757d' : '' }}
              >
                {formatMessage({ defaultMessage: 'Quyết toán' })}
              </button>
              </AuthorizationWrapper>
                </div>
              ) : 
              <div className='d-flex align-items-center'>
                <div className="mr-4 text-primary" style={{ fontSize: 14 }}>{formatMessage({ defaultMessage: 'Đã chọn:' })} {ids.length}</div>
                <button
                  onClick={() => coReloadOrder()}
                  type="button"
                  disabled={ids?.length == 0}
                  className="btn btn-primary mr-3 px-8"
                  style={{ width: 120, background: ids?.length == 0 ? '#6c757d' : '', border: ids?.length == 0 ? '#6c757d' : '' }}
                >
                  {formatMessage({ defaultMessage: 'Tải lại' })}
                </button>
  
              </div>
          )}
          
            <div className="col-3" style={{ display: 'flex'}}>
            {params?.platform == 'manual' && (
              <AuthorizationWrapper keys={['finance_settlement_order_import']}>
               <button onClick={() => setImportFileDialog(true)} type="submit" className="mr-1 w-100 btn btn-primary btn-elevate">
               {formatMessage({ defaultMessage: 'Nhập file' })}
              </button>
              </AuthorizationWrapper>
             )}
              <AuthorizationWrapper keys={['finance_settlement_order_export']}>
                <button onClick={() => setExportFileDialog(true)} type="submit" className="w-100 btn btn-primary btn-elevate">
                  {formatMessage({ defaultMessage: 'Xuất file' })}
                </button>
                <button
                  className="btn btn-secondary btn-elevate ml-1"
                  onClick={(e) => {
                    e.preventDefault();
                    history.push("/finance/exportfile-settlement-pending");
                  }}>
                  <HistoryRounded />
                </button>
              </AuthorizationWrapper>
            </div>
          </div>
        </>
      )}

      {tab_type == 'PROCESSED' && (
        <div style={{ position: 'sticky', top: 40, zIndex: 19, background: '#fff', width: '100%' }}>
          <div className={`d-flex align-items-center py-4 ${!params?.is_old_order ? 'justify-content-between' : 'justify-content-end'}`}>
            {!params?.is_old_order && <div className='d-flex align-items-center'>
            
            { params?.platform !== 'manual' && (
             <>
             <div className="mr-4 text-primary" style={{ fontSize: 14 }}>{formatMessage({ defaultMessage: 'Đã chọn:' })} {ids?.length}</div>
               {(settlement_abnormal == 2 && settlement_abnormal_status == 1) ? (
                <>
                <Dropdown drop='down' onSelect={() => {}} >
                    <Dropdown.Toggle disabled={ids?.length == 0} className={` btn ${ids.length ? 'btn-primary' : 'btn-darkk'}`}>
                      {formatMessage({ defaultMessage: "Thao tác hàng loạt" })}
                    </Dropdown.Toggle>
  
                    <Dropdown.Menu>
                      <Dropdown.Item onClick={() => coReloadOrder()} className="mb-1 d-flex" >{formatMessage({ defaultMessage: "Tải lại" })}</Dropdown.Item>
                      
                      <AuthorizationWrapper keys={['finance_dialog_process']}>
                        <Dropdown.Item onClick={() => setDialogProcess(true)} className="mb-1 d-flex" >{formatMessage({ defaultMessage: "Xử lý đối soát bất thường" })}</Dropdown.Item>
                      </AuthorizationWrapper>
                    </Dropdown.Menu>
  
                  </Dropdown>
                
                </>
              ) : (
                <button
                onClick={() => coReloadOrder()}
                type="button"
                disabled={ids?.length == 0}
                className="btn btn-primary mr-3 px-8"
                style={{ width: 120, background: ids?.length == 0 ? '#6c757d' : '', border: ids?.length == 0 ? '#6c757d' : '' }}
              >
                {formatMessage({ defaultMessage: 'Tải lại' })}
              </button>
              )}
             </>
            )}
              
             
            </div>}
            <div className="col-3" style={{ display: 'flex' }}>
            {params?.platform == 'manual' && (
              <AuthorizationWrapper keys={['finance_settlement_order_import']}>
               <button onClick={() => setImportFileDialog(true)} type="submit" className="mr-1 w-100 btn btn-primary btn-elevate">
               {formatMessage({ defaultMessage: 'Nhập file' })}
             </button>
             </AuthorizationWrapper>
             )}
              <AuthorizationWrapper keys={['finance_settlement_order_export']}>
                <button onClick={() => setExportFileDialog(true)} type="submit" className="w-100 btn btn-primary btn-elevate">
                  {formatMessage({ defaultMessage: 'Xuất file' })}
                </button>
                <button className="btn btn-secondary btn-elevate ml-1"
                  onClick={(e) => {
                    e.preventDefault();
                    history.push("/finance/exportfile-settlement-processed");
                  }}>
                  <HistoryRounded />
                </button>
              </AuthorizationWrapper>
            </div>
          </div>
         
          <>
             <div
            className="d-flex w-100 mt-2"
            style={{ background: "#fff", zIndex: 1, borderBottom: 'none' }}
          >
            <div style={{ flex: 1 }}>
              <ul className="nav nav-tabs" id="myTab" role="tablist">
                {subTab.map((_tab, index) => {
                  const { title, status } = _tab;
                  const isActive = status == (settlement_abnormal || "");
                  return (
                    <>
                      <li
                        key={`tab-order-${index}`}
                        className={`nav-item ${isActive ? "active" : ""}`}
                      >
                        <a
                          className={`nav-link font-weight-normal ${isActive ? "active" : ""
                            }`}
                          style={{ fontSize: "13px" }}
                          onClick={() => {
                            setIds([])
                            const queryParam = omit(params, ['settlement_abnormal_status'])
                            history.push(
                              `${location.pathname}?${queryString.stringify({
                                ...queryParam,
                                page: 1,
                                settlement_abnormal: status,
                              }
                              )}`
                            );
                          }}
                        >
                          {formatMessage(title)} {`(${countOrder(+status).count ?? '--'})`}
                        </a>
                      </li>
                    </>
                  );
                })}
              </ul>
            </div>
          </div>
          <div
            className="d-flex flex-wrap"
            style={{
              background: "#fff",
              zIndex: 1,
              gap: 20,
            }}
          >
            {find(subTab, { title: currentStatus })?.sub?.length > 0 && (
              <div
                className="d-flex flex-wrap py-2"
              >
                {find(subTab, { title: currentStatus })?.sub?.map(
                  (sub_status, index) => (
                    <span
                      key={`sub-status-order-${index}`}
                      className="mr-4 py-2 px-6 d-flex justify-content-between align-items-center"
                      style={{
                        borderRadius: 20,
                        background:
                          sub_status?.status == settlement_abnormal_status
                            ? "#ff6d49"
                            : "#828282",
                        color: "#fff",
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        setIds([])
                        history.push(
                          `${location.pathname}?${queryString.stringify({
                            ...params,
                            page: 1,
                            settlement_abnormal_status: sub_status?.status,
                          })}`
                        );
                      }}
                    >
                      {formatMessage(sub_status?.name)} {`(${countOrder(+sub_status?.status, true).count ?? '--'})`}
                    </span>
                  )
                )}
              </div>
            )}
          </div>
          </>
         
        </div>
      )}
    </>
  )
}

export default memo(Filter)