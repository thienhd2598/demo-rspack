import React, { useLayoutEffect } from 'react'
import { Card, CardBody } from '../../../../_metronic/_partials/controls';
import { Helmet } from 'react-helmet';
import { ArrowBackIos } from '@material-ui/icons';
import { useSubheader } from '../../../../_metronic/layout';
import { useIntl } from 'react-intl';
import Table from './Table';
import { useQuery } from '@apollo/client';
import query_sme_catalog_stores from '../../../../graphql/query_sme_catalog_stores';

const HistoryExportTabGoods = () => {
    const {formatMessage} = useIntl()
    const { setBreadcrumbs } = useSubheader();
    useLayoutEffect(() => {
      setBreadcrumbs([
        {
          title: formatMessage({defaultMessage:"Lịch sử xuất file"}),
        },
      ]);
    }, []);
    const { data: dataWarehouse } = useQuery(query_sme_catalog_stores, {
      fetchPolicy: "cache-and-network",
    });
    return (
      <>
        <a
          href="/products/warehouse-bill/history"
          className="mb-5"
          style={{ display: "block", color: "#ff5629" }}
        >
          {" "}
          <ArrowBackIos />
          {formatMessage({defaultMessage:"Quay lại lịch sử thay đổi tồn"})}
        </a>
        <Card>
          <Helmet
            titleTemplate={formatMessage({defaultMessage:"Lịch sử xuất file"}) + " - Upbase"}
            defaultTitle={formatMessage({defaultMessage:"Lịch sử xuất file"}) + " - Upbase"}
          >
            <meta name="description" content={formatMessage({defaultMessage:"Lịch sử xuất file"}) + "- Upbase"} />
          </Helmet>
  
          <CardBody>
            <Table dataWarehouse={dataWarehouse}/>
          </CardBody>
        </Card>
      </>
    );
}

export default HistoryExportTabGoods