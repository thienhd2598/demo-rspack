/* eslint-disable no-script-url,jsx-a11y/anchor-is-valid,jsx-a11y/role-supports-aria-props */
import React, { useMemo } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  CardHeaderToolbar,
  Input,
  InputVertical,
} from "../../../../_metronic/_partials/controls";
import { FormattedMessage, injectIntl } from "react-intl";
import { Link } from "react-router-dom";
import { useProductsUIContext } from "../ProductsUIContext";

import { Editor } from 'react-draft-wysiwyg';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import { Field, useFormikContext } from "formik";
import LogisticChannelList from "./LogisticChannelList";

function ProductShipping(props) {
  const { currentChannel } = useProductsUIContext();
  const { intl, storeInactive } = props;
  const { values, setFieldValue } = useFormikContext()

  // useMemo(() => {
  //   setFieldValue('require-size', !!values['width'] || !!values['length'] || !!values['height'])
  // }, [values['width'], values['length'], values['height']])

  return (
    <Card>
      <CardHeader title={intl.formatMessage({
        defaultMessage: "VẬN CHUYỂN",
      })}>
      </CardHeader>
      <CardBody>
        <div className='row' >
          <div className='col-3' >
            <Field
              name="weight"
              component={InputVertical}
              placeholder=""
              label={intl.formatMessage({
                defaultMessage: 'Cân nặng',
              })}
              // required
              customFeedbackLabel={' '}
              addOnRight={'gr'}
              type="number"
              decimalScale={2}
            />
          </div>
          <div className='col-3' >
            <Field
              name="width"
              component={InputVertical}
              placeholder=""
              label={intl.formatMessage({
                defaultMessage: 'Chiều rộng',
              })}
              // required={true}
              // required={currentChannel?.connector_channel_code != 'shopee'}
              customFeedbackLabel={' '}
              addOnRight={'cm'}
              type="number"
              decimalScale={2}
            />
          </div>
          <div className='col-3' >
            <Field
              name="length"
              component={InputVertical}
              placeholder=""
              label={intl.formatMessage({
                defaultMessage: "Chiều dài",
              })}
              // required={true}
              customFeedbackLabel={' '}
              addOnRight={'cm'}
              type="number"
              decimalScale={2}
            />
          </div>
          <div className='col-3' >
            <Field
              name="height"
              component={InputVertical}
              placeholder=""
              label={intl.formatMessage({
                defaultMessage: "Chiều cao",
              })}
              // required={true}
              customFeedbackLabel={' '}
              addOnRight={'cm'}
              type="number"
              decimalScale={2}
            />
          </div>
          {!!props?.isEdit && currentChannel?.connector_channel_code == 'shopee' && (
            <div className="col-12 mt-4">
              <span style={{ color: 'red' }}>
                {intl.formatMessage({ defaultMessage: 'Lưu ý cài đặt vận chuyển trên sàn Shopee: Với mỗi nhóm vận chuyển, vui lòng bật ít nhất 1 đơn vị vận chuyển để đảm bảo cho việc đồng bộ sản phẩm.' })}
              </span>
            </div>
          )}
          {
            !storeInactive && currentChannel?.connector_channel_code == 'shopee' && <div className='col-12' >
              <div className="mt-10">
                <LogisticChannelList channel_code={currentChannel.connector_channel_code} requiredSize={values['require-size']} />
              </div>
            </div>
          }
        </div>
      </CardBody>
    </Card>
  );
}

export default injectIntl(ProductShipping);