import React, { useLayoutEffect } from 'react'
import { useSubheader } from '../../../../_metronic/layout';
import { useIntl } from 'react-intl';
import { Helmet } from 'react-helmet';
import SVG from "react-inlinesvg";
import TableWarehouseList from './TableWarehouseList';
import { toAbsoluteUrl } from '../../../../_metronic/_helpers';

const WarehouseList = () => {
  const { setBreadcrumbs } = useSubheader();
  const { formatMessage } = useIntl()

  useLayoutEffect(() => {
    setBreadcrumbs([
      {
        title: formatMessage({ defaultMessage: " Danh sách kho" }),
      },
    ]);
  }, []);

  return (
    <>
      <Helmet titleTemplate={formatMessage({ defaultMessage: `Danh sách kho {key}` }, { key: " - UpBase" })}
        defaultTitle={formatMessage(
          { defaultMessage: `Danh sách kho {key}` },
          { key: " - UpBase" }
        )}>
        <meta name="description"
          content={formatMessage(
            { defaultMessage: `Danh sách kho {key}` },
            { key: " - UpBase" }
          )} />
      </Helmet>

      <TableWarehouseList />

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
        </span>{" "}
      </div>
    </>
  )
}

export default WarehouseList

export const actionKeys = {
  "warehouse_view": {
    router: '/products/warehouselist',
    actions: [
      "sme_warehouses", "userSetDefaultWarehouse", "sc_stores", "op_connector_channels", "sme_catalog_product_tags"
    ], 
    name: "Xem danh sách kho",
    group_code: 'warehouse_list',
    group_name: 'Danh sách kho',
    cate_code: 'product_service',
    cate_name: 'Quản lý kho',
  },
  "warehouse_action": {
    router: '',
    actions: ["userCreateWarehouse", "prvListProvider", "userGetListWarehouseFullfillment", "sme_warehouses_aggregate", "userUpdateWarehouse",
      "crmGetProvince", "crmGetDistrict", "crmGetWards", "userEnableWarehouse"
    ], 
    name: "Thêm/Cập nhật danh sách kho",
    group_code: 'warehouse_list',
    group_name: 'Danh sách kho',
    cate_code: 'product_service',
    cate_name: 'Quản lý kho',
  },
};