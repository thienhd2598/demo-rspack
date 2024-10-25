import React from "react";
import { TAB_STATUS } from './utils/contants'
import { useHistory } from "react-router-dom";

const OrderReturnTabs = () => {
  const history = useHistory();
  return (
    <div
      className="d-flex w-100"
      style={{ zIndex: 1 }}
    >
      <div style={{ flex: 1 }}>
        <ul
          className="nav nav-tabs"
        >
          {TAB_STATUS?.map((_status, index) => {
            return (
              <li
                key={index}
                className={`nav-item`}
              >
                <a
                  style={{ fontSize: '16px' }}
                  className={`nav-link ${history.location.pathname === _status.key ? "active" : ""
                    }`}
                  onClick={(e) => {
                    e.preventDefault();
                    if (_status.key == '/orders/fail-delivery-order') {
                      history.push("/orders/fail-delivery-order");
                    } else {
                      history.push("/orders/refund-order");

                    }

                  }}
                >
                  {_status?.title}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default OrderReturnTabs;