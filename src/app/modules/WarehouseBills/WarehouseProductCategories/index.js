import React, { useLayoutEffect } from 'react'
import { useSubheader } from '../../../../_metronic/layout';
import { useIntl } from 'react-intl';
import { Helmet } from 'react-helmet';
import SVG from "react-inlinesvg";
import TableProductCategories from './TableProductCategories';
import { toAbsoluteUrl } from '../../../../_metronic/_helpers';
import { Card, CardBody } from '../../../../_metronic/_partials/controls';

const WarehouseList = () => {
  const { setBreadcrumbs } = useSubheader();
  const {formatMessage} = useIntl()

  useLayoutEffect(() => {
    setBreadcrumbs([
      {
        title: formatMessage({ defaultMessage: "Danh mục sản phẩm" }),
      },
    ]);
  }, []);

  return (
    <>
      <Helmet titleTemplate={formatMessage({ defaultMessage: `Danh mục sản phẩm {key}` },{ key: " - UpBase" })} 
      defaultTitle={formatMessage(
          { defaultMessage: `Danh mục sản phẩm {key}` },
          { key: " - UpBase" }
        )}>
        <meta name="description"
          content={formatMessage(
            { defaultMessage: `Danh mục sản phẩm {key}` },
            { key: " - UpBase" }
          )}/>
      </Helmet>
      <Card>
        <CardBody>
        <TableProductCategories/>
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
        }}
      >
        <span className="svg-icon">
          <SVG
            src={toAbsoluteUrl("/media/svg/icons/Navigation/Down-2.svg")}
            title={" "}
          ></SVG>
        </span>
      </div>
    </>
  )
}

export default WarehouseList

export const actionKeys = {
  "warehouse_category_view": {
    router: '/products/warehouse-bill/product-categories',
    actions: [
      "sme_catalog_category", "sme_catalog_category_aggregate"
    ],
    name: "Xem danh mục sản phẩm",
    group_code: 'warehouse_category',
    group_name: 'Danh mục sản phẩm kho',
    cate_code: 'product_service',
    cate_name: 'Quản lý kho',
  },
  "warehouse_category_action": {
    router: '',
    actions: [
      "update_sme_catalog_category",
      "insert_sme_catalog_category_one", 
      "query_sme_catalog_category_aggregate", 
      "sme_catalog_category",
      "userDeleteCatalogCategory"
    ],
    name: "Thêm/Cập nhật/Xóa danh mục sản phẩm",
    group_code: 'warehouse_category',
    group_name: 'Danh mục sản phẩm kho',
    cate_code: 'product_service',
    cate_name: 'Quản lý kho',
  }  
};