import React, { memo, useCallback, useMemo, useState, useEffect } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  CardHeaderToolbar,
} from "../../../../_metronic/_partials/controls";
import ProductsFilter from "./filter/ProductsFilter";
import { ProductsTable } from "./ProductsTable";
import { useProductsUIContext } from "../ProductsUIContext";
import { useHistory, useLocation } from 'react-router-dom';
import { toAbsoluteUrl } from "../../../../_metronic/_helpers";
import SVG from "react-inlinesvg";
import { Helmet } from 'react-helmet-async';
import queryString from 'querystring';
import query_sc_stores_basic from "../../../../graphql/query_sc_stores_basic";
import { useQuery } from "@apollo/client";
import { useIntl } from "react-intl";
import query_sme_catalog_stores from "../../../../graphql/query_sme_catalog_stores";
export default memo(() => {
  const history = useHistory();
  const [productHasTemplateOrigin, setProductHasTemplateOrigin] = useState([]);
  const { setIds } = useProductsUIContext();
  const { formatMessage } = useIntl()
  const params = queryString.parse(useLocation().search.slice(1, 100000));
  const currentChannel = params?.channel || 'shopee';
  const [products, setProducts] = useState([])
  useEffect(
    () => {
      const notificationDiv = document.querySelector('.react-toast-notifications__container');

      // notificationDiv.style.right = 'unset';
      // notificationDiv.style.top = '50%';
      // notificationDiv.style.left = '50%';
      // notificationDiv.style.transform = 'translateX(-50%)';

      return () => {
        setIds([]);
      }
    }, []
  );


  const { data: dataStore, loading: loadingStore } = useQuery(query_sc_stores_basic, {
    fetchPolicy: 'cache-and-network'
  });
  const { data: dataWarehouse } = useQuery(query_sme_catalog_stores, {
    fetchPolicy: "cache-and-network",
  });

  const defaultWarehouse = useMemo(() => {
    return dataWarehouse?.sme_warehouses?.find(wh => !!wh?.is_default) || {}
  }, [dataWarehouse])

  const sc_stores = useMemo(() => dataStore?.sc_stores?.map(store => {

    const platforms = dataStore?.op_connector_channels?.map(plf => {
      return {
        url: plf.logo_asset_url,
        code: plf.code
      }
    })
    return {
      ...store,
      url: platforms.find(plf => plf.code == store.connector_channel_code)?.url || ''
    }
  })?.filter(e => e), [dataStore])

  return (
    <>
      <Helmet
        titleTemplate={formatMessage({ defaultMessage: "Lịch sử đẩy tồn" }) + "- UpBase"}
        defaultTitle={formatMessage({ defaultMessage: "Lịch sử đẩy tồn" }) + "- UpBase"}
      >
        <meta name="description" content={formatMessage({ defaultMessage: "Lịch sử đẩy tồn" }) + "- UpBase"} />
      </Helmet>
      <Card>
        <CardBody>
          <ProductsFilter
            setProducts={setProducts}
            products={products}
            defaultWarehouse={defaultWarehouse}
            dataWarehouse={dataWarehouse}
            dataStore={dataStore}
            loadingStore={loadingStore}
          />
          <ProductsTable
            products={products}
            setProducts={setProducts}
            defaultWarehouse={defaultWarehouse}
            sc_stores={sc_stores}
            dataWarehouse={dataWarehouse}
          />
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
}
)

export const actionKeys = {
  "product_store_stock_view": {
    router: '/product-stores/list-stock-tracking',
    actions: [
      "sc_stores", "op_connector_channels", "sme_warehouses", "scGetJobStockTracking", "ScTags"
    ],
    name: 'Lịch sử đẩy tồn',
    group_code: 'product_store_stock_tracking',
    group_name: 'Lịch sử đẩy tồn',
    cate_code: 'product_store_service',
    cate_name: 'Quản lý sàn',
  },
  "product_store_stock_delete": {
    router: '',
    actions: [
      "scDeleteJobStockTracking", "scGetJobStockTracking"
    ],
    name: 'Xóa lịch sử',
    group_code: 'product_store_stock_tracking',
    group_name: 'Lịch sử đẩy tồn',
    cate_code: 'product_store_service',
    cate_name: 'Quản lý sàn',
  },
};