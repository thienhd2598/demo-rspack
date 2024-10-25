import React, { memo, useMemo } from "react";
import { Card, CardBody } from "../../../../../../_metronic/_partials/controls";
import { useIntl } from "react-intl";
import { toAbsoluteUrl } from "../../../../../../_metronic/_helpers";
import { formatNumberToCurrency } from "../../../../../../utils";
import queryString from 'querystring';
import { useLocation } from "react-router-dom";

const Overview = ({ loading, dataSummary, }) => {
  const { formatMessage } = useIntl();
  const location = useLocation()
  const params =  queryString.parse(location.search.slice(1, 100000))

  const dataOverview = useMemo(
    () => {
      const {sum_abnormal, sum_pending, sum_processed_month, sum_processed_week, total_order_abnormal} = dataSummary?.summarySettlementOrder ?? {}
      
      return [
        {
          title: formatMessage({ defaultMessage:'Chờ quyết toán'}),
          titleSmall: formatMessage({ defaultMessage:'Tổng cộng'}),
          icon: '/media/svg/clock.svg',
          total: sum_pending
        }, {
          title: formatMessage({ defaultMessage:'Đã quyết toán'}),
          titleSmall: formatMessage({ defaultMessage:'Tháng này'}),
          icon: '/media/svg/tick.svg',
          total: sum_processed_month,
          isUnit: true
          },{
          title: formatMessage({ defaultMessage:'Bất thường'}),
          titleSmall: formatMessage({ defaultMessage:'Tổng tiền lệch'}),
          icon: '/media/svg/warning.svg',
          total: sum_abnormal,
          isUnit: false
        },
      ]
    }, [dataSummary]
  ); 
  
 
  return (
    <Card>
      <CardBody>

        <div className="d-flex align-items-center overview_income">
          {dataOverview.map((item, index) => (
              <div 
              key={`overview-payment-${index}`}
              className="box col-4"
              style={{borderRight: '2px solid #d9d9d9'}} 
              >
              <div className="d-flex align-items-center gap-2">
                <span
                  className="text-dark"
                  style={{ fontSize: "13px", fontWeight: 700 }}
                >
                  {item.title}
                </span>
                <img className="ml-3" src={toAbsoluteUrl(item.icon)} alt=""></img>
              </div>
              <div className="d-flex align-items-center mt-1">
                <div className="d-flex align-items-center justify-content-between w-100">
                  <span style={{ fontSize: "13px",color: '#888484' }} className="mt-6 mb-4">
                  {item.titleSmall}
                  </span>
                  { loading ? <div className="mt-3 spinner spinner-primary" /> :
                  <div
                    className="text-dark"
                    style={{ fontSize: "25px", fontWeight: 700 }}
                  >
                     {formatNumberToCurrency(item?.total)}đ
                  </div>}
                </div>
              </div>
            </div>
          ))}
        
        </div>
      </CardBody>
    </Card>
  );
};

export default memo(Overview);
