import clsx from "clsx";
import queryString from 'querystring';
import React, { Fragment, memo, useMemo } from "react";
import { useHistory, useLocation } from "react-router-dom";
import CountOrder from "../../components/CountOrder";
import { STATUS_ORDER_REFUND, STATUS_ORDER_REFUND_MAPPED } from "../../utils/contants";

const FilterStatus = memo(({
  onResetSelect,
  whereCondition
}) => {
  const location = useLocation();
  const history = useHistory();
  const params = queryString.parse(location.search.slice(1, 100000));

  const subStatus = useMemo(
    () => {
      if (!params?.status) return [];

      const findedStatusActive = STATUS_ORDER_REFUND?.find(_status =>
        _status.value == params?.status
        || _status?.sub?.some(_sub => _sub?.value == params?.status)
      );

      return findedStatusActive?.sub || []
    }, [params?.status]
  );

  return (
    <Fragment>
      <div className="d-flex w-100 mt-3">
        <ul className="nav nav-tabs" id="myTab" role="tablist" style={{ flex: 1 }}>
          {STATUS_ORDER_REFUND?.map((status, index) => {
            const isActive = (!params?.status && index == 0)
              || (!!params?.status && params?.status == status.value)
              || status?.sub?.some(_sub => _sub?.value == params?.status);

            const queryPush = `${location.pathname}?${queryString.stringify({
              ...params,
              page: 1,
              status: status?.sub?.[0]?.value || status?.value
            })}`;

            const hasCount = !!status?.value || status?.sub?.length > 0;
            const countStatus = !!status?.value
              ? STATUS_ORDER_REFUND_MAPPED[status.value]
              : status?.sub?.map(_sub => STATUS_ORDER_REFUND_MAPPED[_sub.value]);

            return (
              <li
                key={`status-refund-order-${index}`}
                className={clsx(`nav-item`, { active: isActive })}
              >
                <a
                  className={clsx(`nav-link font-weight-normal fs-14`, { active: isActive })}
                  onClick={() => {
                    onResetSelect();
                    history.push(queryPush);
                  }}
                >
                  {status.title}
                  {hasCount && <span className="ml-2 fs-14">
                    (<CountOrder
                      searchTypes={{
                        ...whereCondition,
                        processed_warehouse: countStatus,
                      }}
                    />)
                  </span>}
                </a>
              </li>
            )
          })}
        </ul>
      </div>
      {subStatus?.length > 0 && (
        <div
          className="d-flex flex-wrap py-2"
          style={{ position: "sticky", top: 120, background: "#fff", zIndex: 1, gap: 20, marginBottom: "5px" }}
        >
          {subStatus?.map((sub, index) => {
            const queryPush = `${location.pathname}?${queryString.stringify({ ...params, page: 1, status: sub?.value })}`;

            return (
              <span
                key={`sub-status-refund-order-${index}`}
                onClick={() => {
                  onResetSelect();
                  history.push(queryPush);
                }}
                className="py-2 px-6 d-flex justify-content-between align-items-center cursor-pointer"
                style={{
                  borderRadius: 20,
                  background: params?.status == sub?.value ? "rgb(255, 109, 73)" : "#828282",
                  color: "#fff",
                }}
              >
                {sub?.title}
                <span className="ml-2 fs-14">
                  (<CountOrder
                    searchTypes={{
                      ...whereCondition,
                      processed_warehouse: [STATUS_ORDER_REFUND_MAPPED[sub.value]],
                    }}
                  />)
                </span>
              </span>
            )
          })}
        </div>
      )}
    </Fragment>
  );
});

export default FilterStatus;