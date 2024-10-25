import React, { useState } from "react";
import { useSubheader } from "../../../../_metronic/layout";
import { useLayoutEffect } from "react";
import { Card, CardBody } from "../../../../_metronic/_partials/controls";
import { Helmet } from "react-helmet";
import TableInventory from "./TableInventory";
import { ArrowBackIos } from "@material-ui/icons";
import { useIntl } from "react-intl";
const InventoryExportHistory = () => {
  const {formatMessage} = useIntl()
  const { setBreadcrumbs } = useSubheader();
  useLayoutEffect(() => {
    setBreadcrumbs([
      {
        title: formatMessage({defaultMessage:"Lịch sử xuất tồn kho"}),
      },
    ]);
  }, []);
  return (
    <>
      <a
        href="/products/stocks"
        className="mb-5"
        style={{ display: "block", color: "#ff5629" }}
      >
        {" "}
        <ArrowBackIos />
        {formatMessage({defaultMessage:"Quay lại danh sách tồn kho"})}
      </a>
      <Card>
        <Helmet
          titleTemplate={formatMessage({defaultMessage:"Lịch sử xuất tồn kho"}) + "- Upbase"}
          defaultTitle={formatMessage({defaultMessage:"Lịch sử xuất tồn kho"}) + "- Upbase"}
        >
          <meta name="description" content={formatMessage({defaultMessage:"Lịch sử xuất tồn kho"}) + "- Upbase"} />
        </Helmet>

        <CardBody>
          <TableInventory />
        </CardBody>
      </Card>
    </>
  );
};

export default InventoryExportHistory;
