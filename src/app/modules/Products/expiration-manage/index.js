import React, { memo, useCallback, useLayoutEffect, useMemo, useState } from "react";
import {
  Card,
  CardBody,
} from "../../../../_metronic/_partials/controls";
import { ProductsFilter } from "./filter/ProductsFilter";
import { ProductsTable } from "./ProductsTable";
import _ from "lodash";
import { toAbsoluteUrl } from "../../../../_metronic/_helpers";
import SVG from "react-inlinesvg";
import { Helmet } from 'react-helmet-async';
import { useSubheader } from "../../../../_metronic/layout";
import { useIntl } from "react-intl";
export default memo(() => {
  const { formatMessage } = useIntl()

  const { setBreadcrumbs } = useSubheader()


  useLayoutEffect(() => {
    setBreadcrumbs([
      {
        title: formatMessage({ defaultMessage: 'Quản lý hạn sử dụng' }),
      },
    ])
  }, []);

  return (
    <>
      <Helmet
        titleTemplate={formatMessage({ defaultMessage: "Quản lý hạn sử dụng " }) + "- UpBase"}
        defaultTitle={formatMessage({ defaultMessage: "Quản lý hạn sử dụng " }) + "- UpBase"}
      >
        <meta name="description" content={formatMessage({ defaultMessage: "Quản lý hạn sử dụng" }) + "- UpBase"} />
      </Helmet>
      <Card>
        <CardBody>
          <ProductsFilter />
          <ProductsTable />
        </CardBody>

        <div
          id="kt_scrolltop1"
          className="scrolltop"
          style={{ bottom: 80 }}
          onClick={() => {
            window.scrollTo({
              letf: 0,
              top: document.body.scrollHeight,
              behavior: 'smooth'
            });
          }}
        >
          <span className="svg-icon">
            <SVG src={toAbsoluteUrl("/media/svg/icons/Navigation/Down-2.svg")} title={' '}></SVG>
          </span>{" "}
        </div>
      </Card>
    </>
  );
})

export const actionKeys = {
  "warehouse_expire": {
      router: '/products/expiration-manage',
      actions: ["sme_catalog_inventory_item_locations", "sme_catalog_inventory_item_locations_aggregate", "sme_warehouses", "userSumProductLocationExport", "sme_product_status", "sme_catalog_inventory_items_aggregate", "sc_stores", "op_connector_channels", "sme_catalog_product_tags", "sme_request_export_inventory_item_locations"],
      name: 'Danh sách quản lý hạn sử dụng',
      group_code: 'group_warehouse_expire',
      group_name: 'Bán tại điểm',
      cate_code: 'category_product_service',
      cate_name: 'Quản lý kho',
  }
};
