
import React, { useLayoutEffect } from 'react'
import { Helmet } from 'react-helmet';
import { ArrowBackIos } from '@material-ui/icons';
import { useIntl } from 'react-intl';
import { useSubheader } from '../../../../_metronic/layout';
import { Card, CardBody } from '../../../../_metronic/_partials/controls';
import Table from './Table';
import { toAbsoluteUrl } from '../../../../_metronic/_helpers';
import SVG from "react-inlinesvg";

const HistoryExportFileSettlementPending = () => {
  const { formatMessage } = useIntl()
  const { setBreadcrumbs } = useSubheader();
  useLayoutEffect(() => {
    setBreadcrumbs([
      {
        title: formatMessage({ defaultMessage: "Lịch sử xuất phiếu chờ quyết toán" }),
      },
    ]);
  }, []);

  return (
    <>
      <a
        href="/finance/payment-reconciliation"
        className="mb-5"
        style={{ display: "block", color: "#ff5629" }}
      >
        <ArrowBackIos />
        {formatMessage({ defaultMessage: "Quay lại danh sách chờ quyết toán " })}
      </a>
      <Card>
        <Helmet
          titleTemplate={formatMessage({ defaultMessage: "Lịch sử xuất phiếu chờ quyết toán" }) + " - Upbase"}
          defaultTitle={formatMessage({ defaultMessage: "Lịch sử xuất phiếu chờ quyết toán" }) + " - Upbase"}
        >
          <meta name="description" content={formatMessage({ defaultMessage: "Lịch sử xuất phiếu chờ quyết toán" }) + "- Upbase"} />
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

export default HistoryExportFileSettlementPending