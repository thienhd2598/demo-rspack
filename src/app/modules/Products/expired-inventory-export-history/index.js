import React, { useState } from "react";
import { useSubheader } from "../../../../_metronic/layout";
import { useLayoutEffect } from "react";
import { Card, CardBody } from "../../../../_metronic/_partials/controls";
import { Helmet } from "react-helmet";
import TableInventory from "./TableInventory";
import { ArrowBackIos } from "@material-ui/icons";
import { useIntl } from "react-intl";
const ExpriedInventoryExportHistory = () => {
  const {formatMessage} = useIntl()
  const { setBreadcrumbs } = useSubheader();
  useLayoutEffect(() => {
    setBreadcrumbs([
      {
        title: formatMessage({defaultMessage:"Lịch sử xuất file hạn sử dụng"}),
      },
    ]);
  }, []);
  return (
    <>
      <a
        href="/products/expiration-manage"
        className="mb-5"
        style={{ display: "block", color: "#ff5629" }}
      >
        {" "}
        <ArrowBackIos />
        {formatMessage({defaultMessage:"Quay lại danh sách quản lý hạn sử dụng"})}
      </a>
      <Card>
        <Helmet
          titleTemplate={formatMessage({defaultMessage:"Lịch sử xuất file hạn sử dụng"}) + "- Upbase"}
          defaultTitle={formatMessage({defaultMessage:"Lịch sử xuất file hạn sử dụng"}) + "- Upbase"}
        >
          <meta name="description" content={formatMessage({defaultMessage:"Lịch sử xuất file hạn sử dụng"}) + "- Upbase"} />
        </Helmet>

        <CardBody>
          <TableInventory />
        </CardBody>
      </Card>
    </>
  );
};

export default ExpriedInventoryExportHistory;
