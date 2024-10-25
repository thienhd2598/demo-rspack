import React, { useLayoutEffect } from 'react'
import { useSubheader } from '../../../../_metronic/layout';
import { useIntl } from 'react-intl';
import { Helmet } from 'react-helmet';
import SVG from "react-inlinesvg";
import TableProviderProduct from './TableProviderProduct';
import { toAbsoluteUrl } from '../../../../_metronic/_helpers';
import { useHistory, useLocation, useParams} from "react-router-dom";
import { Card, CardBody } from '../../../../_metronic/_partials/controls';
const SettingProvider = () => {
  const { setBreadcrumbs } = useSubheader();
  const {formatMessage} = useIntl()
  let { id } = useParams();

  useLayoutEffect(() => {
    setBreadcrumbs([
        {
        title: formatMessage({ defaultMessage: "Cài đặt" }),
        },
        {
        title: formatMessage({ defaultMessage: "Kết nối mở rộng" }),
        },
        {
        title: id
        },
    ]);
  }, []);

  return (
    <>
      <Helmet titleTemplate={formatMessage({ defaultMessage: `Kết nối mở rộng {key}` },{ key: " - UpBase" })} 
      defaultTitle={formatMessage({ defaultMessage: `Kết nối mở rộng {key}` },{ key: " - UpBase" })}>
        <meta name="description" content={formatMessage({ defaultMessage: `Kết nối mở rộng {key}` },{ key: " - UpBase" })}/>
      </Helmet>
      <Card>
        <CardBody>
        <TableProviderProduct/>
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

export default SettingProvider