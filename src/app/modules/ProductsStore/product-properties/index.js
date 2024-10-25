/* eslint-disable no-script-url,jsx-a11y/anchor-is-valid,jsx-a11y/role-supports-aria-props */
import React, { } from "react";
import {
  Card,
  CardHeader,
} from "../../../../_metronic/_partials/controls";
import { injectIntl } from "react-intl";
import { useProductsUIContext } from "../ProductsUIContext";
import { Divider } from "@material-ui/core";
import _ from 'lodash'
import BrandProperty from "./BrandProperty";


function ProductAttributes(props) {
  const { channelsSelected } = useProductsUIContext();

  const { intl } = props;

  const channels = _.groupBy(channelsSelected, _channel => _channel.brand.code)

  return (
    <Card>
      <CardHeader title={intl.formatMessage({
        defaultMessage: "THUỘC TÍNH SẢN PHẨM",
      })}>
      </CardHeader>
      <BrandProperty name='Upbase' brand={'upbase'} properties={[]} />
      {
        Object.keys(channels).map((key, index) => {
          let _channel = channels[key][0]
          return [
            <Divider key={`Divider-${key}`} className={'mt-2'} />,
            <BrandProperty key={`CardBody-${key}`} brand={_channel.brand.code} name={_channel.brand.name} properties={_channel.brand.properties} />
          ]
        })
      }
    </Card>
  );
}

export default injectIntl(ProductAttributes);