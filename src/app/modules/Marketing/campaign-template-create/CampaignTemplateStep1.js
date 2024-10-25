import React, { memo, useCallback, useMemo, useState, useEffect, useLayoutEffect } from "react";
import {
  Card,
  CardBody,
} from "../../../../_metronic/_partials/controls";
import queryString from 'querystring';
import { useHistory, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useSubheader } from "../../../../_metronic/layout";
import { useIntl } from 'react-intl'
import { useQuery } from "@apollo/client";
import op_connector_channels from "../../../../graphql/op_connector_channels";
import makeAnimated from 'react-select/animated';
import Select from 'react-select';
import _, { omit, sum, xor } from "lodash";
import SVG from "react-inlinesvg";
import { toAbsoluteUrl, checkIsActive } from "../../../../_metronic/_helpers";
import { OPTIONS_TYPE_MARKETING } from "../Constants";

export default memo(() => {
  const params = queryString.parse(useLocation().search.slice(1, 100000));
  const { setBreadcrumbs } = useSubheader()
  const { formatMessage } = useIntl()
  const animatedComponents = makeAnimated();
  const history = useHistory();

  useLayoutEffect(() => {
    setBreadcrumbs([{ title: formatMessage({ defaultMessage: 'Tạo chương trình khuyến mãi hàng loạt' }) }])
  }, []);

  const { data, loading: loadingChannel } = useQuery(op_connector_channels, {
    variables: {
      context: 'product'
    },
    fetchPolicy: 'cache-and-network'
  })
  console.log(data)
  const optionsChannel = data?.op_connector_channels?.map(channel => {
    return {
      label: channel?.name,
      logo: channel?.logo_asset_url,
      value: channel?.id,
      channel: channel?.code
    }
  })
  let currentChannel = useMemo(() => {
    return !!params?.channel ? (optionsChannel?.filter(_channel => !!_channel?.channel && _channel?.channel == params?.channel)?.length ? optionsChannel?.filter(_channel => !!_channel?.channel && _channel?.channel == params?.channel)[0] : {}) : {};
  }, [params?.channel, optionsChannel])
  return (
    <Card>
      <Helmet titleTemplate={'UB - ' + formatMessage({ defaultMessage: "Tạo chương trình khuyến mãi" })} defaultTitle={'UB - ' + formatMessage({ defaultMessage: "Tạo chương trình khuyến mãi" })}>
        <meta name="description" content={'UB - ' + formatMessage({ defaultMessage: "Tạo chương trình khuyến mãi" })} />
      </Helmet>

      <CardBody>
        <div className="mb-4">
          <div className="row mb-4" style={{ marginLeft: 0 }}>
            <div className="col-12 ml-0 pl-0" style={{ zIndex: 95 }}>
              <Select
                options={optionsChannel}
                className="select-report-custom w-100"
                placeholder={formatMessage({ defaultMessage: 'Tất cả' })}
                components={animatedComponents}
                value={currentChannel}
                isLoading={loadingChannel}
                onChange={values => {
                  history.push(`/marketing/campaign-template-create?${queryString.stringify(omit({ ...params, channel: values.channel }, ['stores']))}`.replaceAll('%2C', '\,'))
                }}
                formatOptionLabel={(option, labelMeta) => {
                  return (
                    <div>
                      {!!option.logo && (
                        <img
                          src={option.logo}
                          style={{
                            width: 15,
                            height: 15,
                            marginRight: 4,
                          }}
                        />
                      )}
                      {option.label}
                    </div>
                  );
                }}
              />
            </div>
          </div>
          <div className="mb-4" style={{ marginLeft: 0 }}>
            <p className="mb-4" style={{ fontWeight: 'bold' }}>{formatMessage({ defaultMessage: 'CHƯƠNG TRÌNH CỦA SHOP' })}</p>
            <div className="row mb-4">
              {OPTIONS_TYPE_MARKETING.map(item => {
                const isTypeActive = item.channels.includes(currentChannel.channel);

                if (!isTypeActive) return null;

                return <div className="col-3">
                  <div
                    className="d-flex align-items-center p-4"
                    style={{ backgroundColor: '#EAEAEA', cursor: 'pointer', minHeight: 110 }}
                    onClick={() => {
                      history.push(`${item.basePathTemplate}?${queryString.stringify(omit({ ...params, channel: currentChannel.channel, typeCampaign: item.type }))}`)
                    }}>
                    <div style={{ padding: '10px', marginRight: '10px', backgroundColor: '#D9D9D9', borderRadius: '50%' }}>
                      <SVG style={{ width: 50, height: 50 }} src={toAbsoluteUrl(item.sourceIcon)} />
                    </div>
                    <div>
                      <span style={{ fontWeight: 'bold' }}>{item.title}</span>
                      <p>{item.description}</p>
                    </div>
                  </div>
                </div>
              })}             
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  )
});
