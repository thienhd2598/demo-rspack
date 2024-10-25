import React, { memo } from "react";
import CountOrder from "../../components/CountOrder";
import { STATUS_ORDER } from "../../utils/contants";
import _ from "lodash";
import { useIntl } from 'react-intl';
import queryString from 'querystring';
import { useHistory, useLocation } from "react-router-dom";
const TabLink = memo(({
  currentStatus,
  type,
  setIds,
  setCurrentTitle,
  setType,
  currentTitle,
  whereCondition
}) => {
  const location = useLocation();
  const history = useHistory();
  const params = queryString.parse(location.search.slice(1, 100000));
  const {formatMessage} = useIntl()
  return (
    <>
      <div className="d-flex w-100 mt-3">
        <div style={{ flex: 1 }}>
          <ul className="nav nav-tabs" id="myTab" role="tablist">
            {/* tab 1 - Trả hàng - hoàn tiền */}
              <li className={`nav-item ${!type ? "active" : ""}`}>
                <a
                   className={`nav-link font-weight-normal ${
                    !params.status ? "active" : ""
                  }`}
                  style={{ fontSize: "14px" }}
                  onClick={() => {
                    setIds([]);
                    setCurrentTitle(undefined);
                    setType(undefined);
                    history.push(`${location.pathname}?${queryString.stringify({...params,page: 1, status: ''})}`);
                  }}
                >
                  {formatMessage({defaultMessage: 'Tất cả'})}
                </a>
              </li>

            {STATUS_ORDER.map((_tab, index) => {
              const { title, value } = _tab;
              const isActive = (!type && !title) || (type && title === type);
              if(title == 'Đang xử lý') {
                return (
                  <li
                  key={`tab-returnorder-${index}`}
                  className={`nav-item ${isActive ? "active" : ""} `}
                >
                  <a
                    className={`nav-link ${
                      isActive ? "active" : ""
                    } font-weight-normal`}
                    style={{ fontSize: "13px" }}
                    onClick={() => {
                      setType(title);
                      setIds([]);
                      setCurrentTitle(title);
                      history.push(`${location.pathname}?${queryString.stringify({...params,page: 1,status: value[0]})}`);
                    }}
                  >
                    {formatMessage({defaultMessage:'Đang xử lý'})}
                    <span style={{ marginLeft: "5px", fontSize: 14 }}>
                      {"("}
                      <CountOrder
                        searchTypes={{
                          ...whereCondition,
                          is_connected: 1,
                          status: [...value],
                        }}
                      />
                      {")"}
                    </span>
                  </a>
                </li>
                )
              }
              return (
                <>
                  <li
                    key={`tab-returnorder-${index}`}
                    className={`nav-item ${isActive ? "active" : ""} `}
                  >
                    <a
                      className={`nav-link ${
                        isActive ? "active" : ""
                      } font-weight-normal`}
                      style={{ fontSize: "13px" }}
                      onClick={() => {
                        setType(title);
                        setIds([]);
                        setCurrentTitle(title);
                        history.push(`${location.pathname}?${queryString.stringify({...params, page: 1, status: value})}`);
                      }}
                    >
                      {title}
                      <span style={{ marginLeft: "5px", fontSize: 14 }}>
                        {"("}
                        <CountOrder
                           searchTypes={{
                            ...whereCondition,
                            is_connected: 1,
                            status: [value],
                          }}
                        />
                        {")"}
                      </span>
                    </a>
                  </li>
                </>
              );
            })}
          </ul>
        </div>
      </div>
      {_.find(STATUS_ORDER, { title: currentTitle })?.sub?.length > 0 && (
        <div
          className="d-flex flex-wrap py-2"
          style={{
            position: "sticky",
            top: 120,
            background: "#fff",
            zIndex: 1,
            gap: 20,
            marginBottom: "5px",
          }}
        >
          {_.find(STATUS_ORDER, { title: currentTitle })?.sub?.map(
            (sub_status, index) => (
              <span
              onClick={() => {
                setIds([]);
                history.push(`${location.pathname}?${queryString.stringify({...params,page: 1, status: sub_status.value})}`);
              }}
                key={`sub-status-returnorder-${index}`}
                className="py-2 px-6 d-flex justify-content-between align-items-center"
                style={{
                  borderRadius: 20,
                  background:
                     params.status == sub_status?.value
                      ? "rgb(255, 109, 73)"
                      : "#828282",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                {sub_status?.title}
                <span style={{ marginLeft: "5px", fontSize: 14 }}>
                    {"("}
                    <CountOrder
                      searchTypes={{
                        ...whereCondition,
                        status: [sub_status.value],
                      }}
                    />
                    {")"}
                  </span>
              </span>
            )
          )}
        </div>
      )}
    </>
  );
});

export default TabLink;