import React, { memo, useState } from "react";

// import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
// import "react-loading-skeleton/dist/skeleton.css";
import FilterDate from './components/FilterDate'
import FilterInput from "./components/FilterInput";
import ExportOrders from "./components/ExportOrders";
import { useDidUpdate } from "../../../../../hooks/useDidUpdate";
import TagsFilterAdvanced from "../OrderReturnTable/components/TagsFilterAdvanced";
import queryString from 'querystring';
import { useHistory, useLocation } from "react-router-dom";
import { useIntl } from "react-intl";

const OrderRefundFilter = memo(({
  dataWarehouse,
    dataChannelStores,
    currentDateRangeTime,
    setCurrentDateRangeTime,
    ids,
    coReloadOrder,
    refetch
  }) => {
    const { formatMessage } = useIntl();
    const location = useLocation();
    const history = useHistory();
    const params = queryString.parse(location.search.slice(1, 100000));
    const [showExportDialog, setshowExportDialog] = useState(false);

    return (
      <>
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
                      history.push(
                        `${location.pathname}?${queryString.stringify({
                          page: 1,
                          ...(tab.key == 2 ? { is_old_order: 1 } : {}),
                        })}`
                      );
                    }}
                  >
                    <a style={{ fontSize: "16px" }} className={`nav-link ${isTabActive ? "active" : ""}`}>
                      {tab.title}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
        <FilterDate
         dataChannelStores={dataChannelStores}
          currentDateRangeTime={currentDateRangeTime}
          setCurrentDateRangeTime={setCurrentDateRangeTime}
        />

        <FilterInput
          dataWarehouse={dataWarehouse}
        />
        <TagsFilterAdvanced dataWarehouse={dataWarehouse} />
        <div style={{ position: 'sticky', top: 45, zIndex: 1, background: '#fff' }} className={`col-12 d-flex align-items-center py-4 ${!params?.is_old_order ? 'justify-content-between' : 'justify-content-end'}`}>
          {!params?.is_old_order && <div className='d-flex align-items-center'>
            <div className="mr-4 text-primary" style={{ fontSize: 14 }}>{formatMessage({ defaultMessage: 'Đã chọn:' })} {ids?.length} {formatMessage({ defaultMessage: 'đơn hàng' })}</div>
            <button
              type="button"
              onClick={() => coReloadOrder(ids.map(_ord => _ord?.id))}
              className={`btn btn-primary mr-3 px-8`}
              disabled={ids?.length == 0}
              style={{ width: 120, background: ids?.length == 0 ? '#6c757d' : '', border: ids?.length == 0 ? '#6c757d' : '' }}
            >
              {formatMessage({ defaultMessage: 'Tải lại' })}
            </button>

          </div>}
          <ExportOrders params={params} refetch={refetch} showExportDialog={showExportDialog} setshowExportDialog={setshowExportDialog} />
        </div>



      </>
    );
  }
);

export default OrderRefundFilter;