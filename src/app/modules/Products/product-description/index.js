/* eslint-disable no-script-url,jsx-a11y/anchor-is-valid,jsx-a11y/role-supports-aria-props */
import React, { useMemo, useRef, useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  CardHeaderToolbar,
  TextArea,
} from "../../../../_metronic/_partials/controls";
import { FormattedMessage, injectIntl } from "react-intl";
import { Link } from "react-router-dom";
import { useProductsUIContext } from "../ProductsUIContext";
import { Field, useFormikContext } from "formik";
import { TextEditor } from "../../../../_metronic/_partials/controls/forms/TextEditor";
import { TextEditorShopee } from "../../../../_metronic/_partials/controls/forms/TextEditorShopee";
import { Modal, Accordion, useAccordionToggle } from 'react-bootstrap';
import { toAbsoluteUrl } from "../../../../_metronic/_helpers";

function CustomToggle({ children, eventKey , title}) {
  const { openBlockDescription, setOpenBlockDescription, btnRefCollapseDescription } = useProductsUIContext();
  const decoratedOnClick = useAccordionToggle(eventKey, () => {
    setOpenBlockDescription(!openBlockDescription);
  });

  return (
      <CardHeader title={title} className="cursor-pointer" onClick={decoratedOnClick} ref={btnRefCollapseDescription} >
        <div className="d-flex justify-content-between align-items-center" >
          {children}
          <span>
            <i className={`${(openBlockDescription ? 'fas fa-angle-up ml-2' : 'fas fa-angle-down')} cursor-pointer`} style={{ fontSize: 30 }} />
          </span>
        </div>
      </CardHeader>
  );
};

function ProductDescription(props) {
  const { channelsSelected, setChannelsSelected } = useProductsUIContext();
  const { intl } = props;

  const [errorVideo, setErrorVideo] = useState('');
  const { values } = useFormikContext()

  return (
    <Accordion>
      <Card id='description'>

        <CustomToggle eventKey="description" title={intl.formatMessage({
          defaultMessage: "MÔ TẢ SẢN PHẨM",
        })} />

        <Accordion.Collapse eventKey="description">
          <CardBody>
            <p >{intl.formatMessage({defaultMessage:'Mô tả dạng văn bản'})} <img src={toAbsoluteUrl(
              "/media/ic_shopee.svg"
            )} style={{ marginBottom: 4 }} /></p>
            <Field
              name="description"
              component={TextArea}
              placeholder={intl.formatMessage({defaultMessage:"Nhập mô tả dạng văn bản"})}
              label={''}
              required={false}
              customFeedbackLabel={' '}
              cols={['', 'col-12']}
              countChar
              maxChar={'5,000'}
              allowCopy
            />
            <p className='mt-2' >{intl.formatMessage({defaultMessage:'Mô tả kèm hình ảnh'})} ({values['description_extend_img_count'] || 0}/12) <img src={toAbsoluteUrl(
              "/media/ic_shopee.svg"
            )} style={{ marginBottom: 4 }} /></p>
            <Field
              name="description_extend"
              component={TextEditorShopee}
              placeholder={intl.formatMessage({defaultMessage:"Nhập mô tả kèm hình ảnh"})}
              label={''}
              required={false}
              customFeedbackLabel={' '}
              cols={['', 'col-12']}
              onErrorUpload={setErrorVideo}
              countChar
              maxChar={'5,000'}
            // allowCopy
            />
            <p className='mt-2' >{intl.formatMessage({defaultMessage:'Mô tả dạng HTML'})} <img src={toAbsoluteUrl(
              "/media/ic_lazada.svg"
            )} style={{ marginBottom: 4 }} />
              <img src={toAbsoluteUrl(
                "/media/ic_tiktok.svg"
              )} style={{ marginBottom: 4 }} /></p>
            <Field
              name="description_html"
              component={TextEditor}
              placeholder={intl.formatMessage({defaultMessage:"Nhập mô tả dạng HTML"})}
              label={''}
              required={false}
              customFeedbackLabel={' '}
              cols={['col-12', 'col-12']}
            // countChar
            // maxChar={'3,000'}
            />
            <p className='mt-2' >{intl.formatMessage({defaultMessage:'Mô tả ngắn'})} <img src={toAbsoluteUrl(
              "/media/ic_lazada.svg"
            )} style={{ marginBottom: 4 }} /></p>
            <Field
              name="description_short"
              component={TextEditor}
              placeholder={intl.formatMessage({defaultMessage:"Nhập mô tả ngắn"})}
              label={''}
              required={false}
              customFeedbackLabel={' '}
              cols={['', 'col-12']}
              toolbar={{
                options: ['inline', 'list', 'textAlign', 'history'],
              }}
            // countChar
            // maxChar={'3,000'}
            />
          </CardBody>
        </Accordion.Collapse>

        <Modal
          show={errorVideo.length > 0}
          // aria-labelledby="example-modal-sizes-title-lg"
          centered
          onHide={() => setErrorVideo('')}
          size='sm'
        >
          <Modal.Body className="overlay overlay-block cursor-default text-center">
            {
              errorVideo == -1 ? <div className="mb-6 text-left" >
                {intl.formatMessage({defaultMessage:'Tải hình hảnh không thành công'})}!
                <p>{intl.formatMessage({defaultMessage:'Vui lòng kiểm tra lại hình ảnh bạn đã tải lên. Yêu cầu về hình ảnh'})}:</p>
                <p>• {intl.formatMessage({defaultMessage:'Chiều cao tối thiểu'})}: 32px</p>
                <p>• {intl.formatMessage({defaultMessage:'Chiều rộng tối thiểu'})}: 700px</p>
                <p>• {intl.formatMessage({defaultMessage:'Tỷ lệ khung hình'})}: 0.5-32</p>
                <p>• {intl.formatMessage({defaultMessage:'Dung lượng ảnh tối đa'})}: 2MB</p>
              </div> : <div className="mb-6 text-left" >
                {errorVideo}
              </div>
            }
            <button
              className="btn btn-primary"
              style={{ width: 80 }}
              onClick={() => setErrorVideo('')}
            >
              {intl.formatMessage({defaultMessage:'Đóng'})}
            </button>
          </Modal.Body>
        </Modal>
      </Card>
    </Accordion>
  );
}

export default injectIntl(ProductDescription);