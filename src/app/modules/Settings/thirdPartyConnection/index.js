import React, { useLayoutEffect } from 'react'
import { useSubheader } from '../../../../_metronic/layout';
import { useIntl } from 'react-intl';
import { Helmet } from 'react-helmet';
import SVG from "react-inlinesvg";
import TableThirdPartyConnection from './TableThirdPartyConnection';
import { toAbsoluteUrl } from '../../../../_metronic/_helpers';
import { Card, CardBody } from '../../../../_metronic/_partials/controls';
import FilterThirdPartyConnection from './FilterThirdPartyConnection';

const ThirdPartyConnection = () => {
  const { setBreadcrumbs } = useSubheader();
  const { formatMessage } = useIntl()

  useLayoutEffect(() => {
    setBreadcrumbs([
      {
        title: formatMessage({ defaultMessage: "Cài đặt" }),
      },
      {
        title: formatMessage({ defaultMessage: "Kết nối mở rộng" }),
      },
    ]);
  }, []);

  return (
    <>
      <Helmet titleTemplate={formatMessage({ defaultMessage: `Kết nối mở rộng {key}` }, { key: " - UpBase" })}
        defaultTitle={formatMessage(
          { defaultMessage: `Kết nối mở rộng {key}` },
          { key: " - UpBase" }
        )}>
        <meta name="description"
          content={formatMessage(
            { defaultMessage: `Kết nối mở rộng {key}` },
            { key: " - UpBase" }
          )} />
      </Helmet>
      <div>
        <Card>
          <CardBody>
            <FilterThirdPartyConnection />
            <TableThirdPartyConnection />
          </CardBody>
        </Card>
      </div>


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

export default ThirdPartyConnection

export const actionKeys = {
  "setting_third_party_view": {
    router: '/setting/third-party-connection',
    actions: [
      "prvListCategory",
      "prvListProvider",
      "sc_stores",
      "op_connector_channels",
      "sc_store",
      "userGetListProductSyncFullfillment",
      "userCountProductSyncFullfillment",
      "prvProviderConnectedDetail"
    ],
    name: 'Danh sách kết nối mở rộng',
    group_code: 'setting_third_party',
    group_name: 'Kết nối mở rộng',
    cate_code: 'setting_service',
    cate_name: 'Cài đặt',
  },
  "setting_third_party_action": {
    router: '/setting/third-party-connection',
    actions: [
      "prvListProvider", "prvConnectProvider", "prvSaveSettingProviderConnected",
      'userGetListProductSyncFullfillment', 'userCountProductSyncFullfillment',
      'userSyncAllProductFromFullfillment', "userSyncInventoryFullfillment", "userSyncProductFullfillment"
    ],
    name: 'Các thao tác trong màn danh sách kết nối mở rộng',
    group_code: 'setting_third_party',
    group_name: 'Kết nối mở rộng',
    cate_code: 'setting_service',
    cate_name: 'Cài đặt',
  }
};
