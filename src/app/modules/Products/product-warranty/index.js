/* eslint-disable no-script-url,jsx-a11y/anchor-is-valid,jsx-a11y/role-supports-aria-props */
import React, { useMemo } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  CardHeaderToolbar,
  Input,
  TextArea,
} from "../../../../_metronic/_partials/controls";
import { FormattedMessage, injectIntl } from "react-intl";
import { Link } from "react-router-dom";
import { useProductsUIContext } from "../ProductsUIContext";

import { Editor } from 'react-draft-wysiwyg';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import { Field, useFormikContext } from "formik";
import { ReSelect } from "../../../../_metronic/_partials/controls/forms/ReSelect";
import { ATTRIBUTE_VALUE_TYPE } from "../ProductsUIHelpers";
import { WARRANTY_TIME, WARRANTY_TYPE } from "../../../../constants";
import { useIntl } from "react-intl";
function ProductWarranty(props) {
  const { categorySelected } = useProductsUIContext();
  const { values, setFieldValue } = useFormikContext()
  const { intl } = props;
  const {formatMessage} = useIntl()
  useMemo(() => { 
    if(!!values['warranty_type'] && values['warranty_type'].value == 'khong_bao_hanh'){
      setFieldValue('warranty_time', null)
      setFieldValue('warranty_policy', '')
    }
  }, [values['warranty_type']])

  return (
    <Card>
      <CardHeader title={intl.formatMessage({
        defaultMessage: "BẢO HÀNH",
      })}>
      </CardHeader>
      <CardBody>
        <div className='row' >
          <div className='col-6' >
            <Field
              name={'warranty_type'}
              component={ReSelect}
              placeholder={formatMessage({defaultMessage:'Chọn loại bảo hành'})}
              label={formatMessage({defaultMessage:'Loại bảo hành'})}
              customFeedbackLabel={' '}
              options={WARRANTY_TYPE}
              required={categorySelected?.is_required_warranty == 1}
              cols={['col-4', 'col-8']}
            />
          </div>
          <div className='col-6' >
            <Field
              name={'warranty_time'}
              component={ReSelect}
              placeholder={formatMessage({defaultMessage:'Chọn thời gian bảo hành'})}
              label={formatMessage({defaultMessage:'Thời gian bảo hành'})}
              customFeedbackLabel={' '}
              options={WARRANTY_TIME}
              required={categorySelected?.is_required_warranty == 1}
              cols={['col-4', 'col-8']}
              isDisabled={!!values['warranty_type'] && values['warranty_type'].value == 'khong_bao_hanh'}
            />
          </div>
          <div className='col-12' >
            <Field
              name={'warranty_policy'}
              component={TextArea}
              label={formatMessage({defaultMessage:'Chính sách Bảo hành'})}
              customFeedbackLabel={' '}
              options={[]}
              required={false}
              // rows={5}
              countChar
              // maxChar={5000}
              cols={['col-2', 'col-10']}
              disabled={!!values['warranty_type'] && values['warranty_type'].value == 'khong_bao_hanh'}
            />
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

export default injectIntl(ProductWarranty);