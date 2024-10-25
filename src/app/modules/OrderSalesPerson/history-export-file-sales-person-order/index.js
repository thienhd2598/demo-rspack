
import React, { memo, useEffect, useMemo } from "react";
import {
    Card,
    CardBody
} from "../../../../_metronic/_partials/controls";
import queryString from 'querystring';
import { useLocation } from 'react-router-dom';
import Table from "./Table";
import { toAbsoluteUrl } from "../../../../_metronic/_helpers";
import SVG from "react-inlinesvg";
import { useSubheader } from "../../../../_metronic/layout/_core/MetronicSubheader";
import { ArrowBackIos } from "@material-ui/icons";
import { useIntl } from "react-intl";

export default memo(() => {
    const location = useLocation()
    const { appendBreadcrumbs, setToolbar } = useSubheader()
    const { formatMessage } = useIntl()


    useEffect(() => {
        appendBreadcrumbs({
            title: formatMessage({ defaultMessage: 'Lịch sử xuất đơn hàng' }),
            pathname: ``
        })
    }, [location.pathname])


    return (
        <>
          <a href={`/order-sales-person/list-order`} className='mb-2' style={{ color: '#ff5629' }}> 
          <ArrowBackIos /> {formatMessage({ defaultMessage: 'Quay lại danh sách đơn của tôi' })}
          </a>
          <Card style={{ marginTop: 16 }}>
              <CardBody>
                  <Table/>
              </CardBody>
              <div id="kt_scrolltop1" className="scrolltop" style={{ bottom: 80 }} onClick={() => window.scrollTo({letf: 0,top: document.body.scrollHeight, behavior: 'smooth'})}>
                  <span className="svg-icon">
                      <SVG src={toAbsoluteUrl("/media/svg/icons/Navigation/Down-2.svg")} title={' '}></SVG>
                  </span>
              </div>
          </Card>
        </>
    )
});
