
import React, { useLayoutEffect } from 'react'
import { Helmet } from 'react-helmet';
import { ArrowBackIos } from '@material-ui/icons';
import { useIntl } from 'react-intl';
import { useQuery } from '@apollo/client';
import { useSubheader } from '../../../../_metronic/layout';
import { Card, CardBody } from '../../../../_metronic/_partials/controls';
import Table from './Table';
import { toAbsoluteUrl } from '../../../../_metronic/_helpers';
import SVG from "react-inlinesvg";

const HistoryExportFileSettlementProcessed = () => {
  const { formatMessage } = useIntl()
  const { setBreadcrumbs } = useSubheader();
  useLayoutEffect(() => {
    setBreadcrumbs([
      {
        title: formatMessage({ defaultMessage: "Lịch sử xuất phiếu đã quyết toán" }),
      },
    ]);
  }, []);

  return (
    <>
      <a
        href="/finance/payment-reconciliation?page=1&channel=shopee&tab=PROCESSED&gt=1694451600&lt=1695142799"
        className="mb-5"
        style={{ display: "block", color: "#ff5629" }}
      >
        <ArrowBackIos />
        {formatMessage({ defaultMessage: "Quay lại danh sách đã quyết toán " })}
      </a>
      <Card>
        <Helmet
          titleTemplate={formatMessage({ defaultMessage: "Lịch sử xuất phiếu đã quyết toán" }) + " - Upbase"}
          defaultTitle={formatMessage({ defaultMessage: "Lịch sử xuất phiếu đã quyết toán" }) + " - Upbase"}
        >
          <meta name="description" content={formatMessage({ defaultMessage: "Lịch sử xuất phiếu đã quyết toán" }) + "- Upbase"} />
        </Helmet>

        <CardBody>
          <Table />
        </CardBody>
      </Card>
      <div
        id="kt_scrolltop1"
        className="scrolltop"
        style={{ bottom: 80 }}
        onClick={() => {
          window.scrollTo({
            letf: 0,
            top: document.body.scrollHeight,
            behavior: "smooth",
          });
        }}>
        <span className="svg-icon">
          <SVG
            src={toAbsoluteUrl("/media/svg/icons/Navigation/Down-2.svg")}
            title={" "}
          ></SVG>
        </span>{" "}
      </div>
    </>
  );
}

export default HistoryExportFileSettlementProcessed
