import React, { useMemo } from 'react'
import { Helmet } from 'react-helmet'
import { useIntl } from 'react-intl'
import SVG from "react-inlinesvg";
import { toAbsoluteUrl } from '../../../_metronic/_helpers';
import { Card, CardBody } from '../../../_metronic/_partials/controls';
import Filter from './filter/Filter';
import { useQuery } from '@apollo/client';
import query_sc_stores_basic from '../../../graphql/query_sc_stores_basic'
import query_sme_catalog_stores from '../../../graphql/query_sme_catalog_stores';
import Table from './Table';

const AutoReconciliation = () => {
  const { formatMessage } = useIntl()
  const { data: dataStore, loading: loadingGetStore } = useQuery(query_sc_stores_basic, {
    variables: {
        context: 'order'
    },
    fetchPolicy: "cache-and-network",
});

const { data: dataWarehouse } = useQuery(query_sme_catalog_stores, {
  fetchPolicy: "cache-and-network",});

const smeWarehouses = useMemo(() => {
  return dataWarehouse?.sme_warehouses?.filter(wh => wh?.fulfillment_by !== 2)?.map(warehouse => {
    return {
      label: warehouse.name,
      value: warehouse.id,
    };
  })
}, [dataWarehouse])

const stores = useMemo(() => {
    const channels = dataStore?.op_connector_channels ?? {}

    return dataStore?.sc_stores?.map(store => {
      const channel = channels?.find(cn => cn?.code == store?.connector_channel_code)
      return {
        ...store, 
        logoChannel: channel?.logo_asset_url
      }
    })
}, [dataStore])

  return (
    <>
    
      <Helmet 
        titleTemplate={formatMessage({ defaultMessage: `Đối soát dữ liệu tự động {key}` },{ key: " - UpBase" })} 
        defaultTitle={formatMessage({ defaultMessage: `Đối soát dữ liệu tự động {key}` }, { key: " - UpBase" })}>
        <meta name="description" content={formatMessage({ defaultMessage: `Đối soát dữ liệu tự động {key}` }, { key: " - UpBase" })}/>
      </Helmet>

      <Card>
        <CardBody>
          <Filter smeWarehouses={smeWarehouses} dataStore={{stores, loadingGetStore}}/>
          <Table dataStore={{stores, loadingGetStore}} dataWarehouse={dataWarehouse}/>
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
          <SVG src={toAbsoluteUrl("/media/svg/icons/Navigation/Down-2.svg")} title={" "}></SVG>
        </span>{" "}
      </div>
    </>
  )
}

export default AutoReconciliation

export const actionKeys = {
  "auto_reconciliation_view": {
      router: '/auto-reconciliation',
      actions: [
          "sc_stores", 
          "op_connector_channels", 
          "sme_warehouses",
          "verify_public_verify_reports",
          "verify_public_verify_report_detail",
          "verify_public_verify_report_objects",
          "verify_public_summary"
      ],
      name: 'Đối soát dữ liệu tự động',
      group_code: 'auto_reconciliation',
      group_name: 'Đối soát dữ liệu tự động',
      cate_code: 'auto_reconciliation_service',
      cate_name: 'Đối soát dữ liệu tự động'
  },
}