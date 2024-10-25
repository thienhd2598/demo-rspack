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
  
  const OPTIONS_MAP_SME = [
    {
      value: '0',
      label: formatMessage({defaultMessage: "Kiện hàng chưa liên kết kho"}),
    },
    {
      value: '1',
      label: formatMessage({defaultMessage: "Kiện hàng đã liên kết kho"})
    },
  ];

  const filterBlock = useMemo(() => {

    let blockReasonType = params?.reasontype?.split(",")?.map(i => +i);
    const labelReason = RETURN_TYPES?.filter(op => blockReasonType?.includes(op?.value))
    let blockFilterMapSme = params?.filter_map_sme
    const labelFilterMapSme = OPTIONS_MAP_SME?.find(op => op?.value == blockFilterMapSme)
    
    let blockWH = params?.processed_warehouse?.split(",")?.map(i => +i);
    const labelWarehouse = dataWarehouse?.flatMap(wh => blockWH?.some(w => w == wh?.id) ? wh : [])

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

        {blockFilterMapSme && (
          <span className="mb-4 py-2 px-4 d-flex justify-content-between align-items-center" style={{border: "1px solid #ff6d49", borderRadius: 20, background: "rgba(255,109,73, .1)"}}>
            <span>{`${formatMessage({defaultMessage: "Trạng thái liên kết hàng hoá kho"})}: ${labelFilterMapSme?.label}`}</span>
            <i className="fas fa-times icon-md ml-4" style={{ cursor: "pointer" }}
              onClick={() => {
                history.push(`${location.pathname}?${queryString.stringify({..._.omit(params, "filter_map_sme")})}`.replaceAll("%2C", ","));
              }}
            />
          </span>
        )}

        {blockWH?.length > 0 && (
          <span className="mb-4 py-2 px-4 d-flex justify-content-between align-items-center" style={{border: "1px solid #ff6d49",borderRadius: 20,background: "rgba(255,109,73, .1)"}}>
            <span>{`${formatMessage({defaultMessage: "Kho nhập hàng",})}: ${_.map(labelWarehouse, "name")?.join(", ")}`}</span>
            <i className="fas fa-times icon-md ml-4"
              style={{ cursor: "pointer" }}
              onClick={() => {
                history.push(`${location.pathname}?${queryString.stringify({..._.omit(params, "processed_warehouse"),})}`.replaceAll("%2C", ","));
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