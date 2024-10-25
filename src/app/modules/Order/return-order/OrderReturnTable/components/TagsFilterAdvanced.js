import React, { useMemo } from 'react'
import { useIntl } from 'react-intl';
import queryString from 'querystring';
import { useHistory, useLocation } from "react-router-dom";
import _ from 'lodash';

const TagsFilterAdvanced = ({
  dataWarehouse
}) => {
  const { formatMessage } = useIntl()
  const location = useLocation();
  const history = useHistory();
  const params = queryString.parse(location.search.slice(1, 100000));

  const RETURN_TYPES = [
    {
      value: 1,
      label: formatMessage({defaultMessage: "Sản phẩm"}),
    },
    {
      value: 2,
      label: formatMessage({defaultMessage: "Xử lý đơn hàng"}),
    },
    {
      value: 3,
      label: formatMessage({defaultMessage: "Đơn vị vận chuyển"}),
    },
    {
      value: 4,
      label: formatMessage({defaultMessage: "Người mua"}),
    },
  ];

  const STATUS_WAREHOUSING = [
    {
      value: 0,
      label: formatMessage({defaultMessage: "Chưa xử lý"})
    },
    {
      value: 1,
      label: formatMessage({defaultMessage: "Không nhập kho"}),
    },
    {
      value: 2,
      label: formatMessage({defaultMessage: "Nhập kho một phần"}),
    },
    {
      value: 3,
      label: formatMessage({defaultMessage: "Nhập kho toàn bộ"}),
    },
  ];
  

  const filterBlock = useMemo(() => {

    let blockReasonType = params?.reasontype?.split(",")?.map(i => +i);
    const labelReason = RETURN_TYPES?.filter(op => blockReasonType?.includes(op?.value))

    let blockStatusWh = params?.process_wh?.split(",")?.map(i => +i);
    const labelStatusWh = STATUS_WAREHOUSING?.filter(op => blockStatusWh?.includes(op?.value))
    return (
      <div className="d-flex flex-wrap" style={{ gap: 10 }}>
        {blockReasonType?.length > 0 && (
          <span className="mb-4 py-2 px-4 d-flex justify-content-between align-items-center" style={{border: "1px solid #ff6d49",borderRadius: 20,background: "rgba(255,109,73, .1)"}}>
            <span>{`${formatMessage({defaultMessage: "Lỗi do",})}: ${_.map(labelReason, "label")?.join(", ")}`}</span>
            <i className="fas fa-times icon-md ml-4"
              style={{ cursor: "pointer" }}
              onClick={() => {
                history.push(`${location.pathname}?${queryString.stringify({..._.omit(params, "reasontype"),})}`.replaceAll("%2C", ","));
              }}
            />
          </span>
        )}

      {blockStatusWh?.length > 0 && (
          <span className="mb-4 py-2 px-4 d-flex justify-content-between align-items-center" style={{border: "1px solid #ff6d49",borderRadius: 20,background: "rgba(255,109,73, .1)"}}>
            <span>{`${formatMessage({defaultMessage: "Trạng thái nhập kho",})}: ${_.map(labelStatusWh, "label")?.join(", ")}`}</span>
            <i className="fas fa-times icon-md ml-4"
              style={{ cursor: "pointer" }}
              onClick={() => {
                history.push(`${location.pathname}?${queryString.stringify({..._.omit(params, "process_wh"),})}`.replaceAll("%2C", ","));
              }}
            />
          </span>
        )}

      </div>
    );
  }, [location?.search, dataWarehouse]);
  return (
    <div className="d-flex flex-wrap" style={{ gap: 10 }}>
        {filterBlock}
    </div>
  )
}

export default TagsFilterAdvanced