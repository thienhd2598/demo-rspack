import React, { useMemo, useRef } from "react";
import { Modal } from "react-bootstrap";
import { useProductsUIContext } from "../ProductsUIContext";
import { FormattedMessage, injectIntl } from "react-intl";
import { Formik, Form, Field } from "formik";
import { ReSelect } from "../../../../_metronic/_partials/controls/forms/ReSelect";
import { RadioGroup } from "../../../../_metronic/_partials/controls/forms/RadioGroup";
import { useQuery } from "@apollo/client";
import { useIntl } from "react-intl";
import op_brands from '../../../../graphql/op_brands'
import { ReSelectBranch } from "../../../../components/ReSelectBranch";

function ProductFilterAdvantDialog({ show, onHide }) {
  const {formatMessage} = useIntl()
  const { data: brands, loading: loadingBrands } = useQuery(op_brands)
  let brandsOptions = useMemo(() => {
    return brands?.op_brands?.map(_brand => {
      return {
        value: _brand.id,
        label: _brand.name,
        raw: _brand
      }
    })
  }, [brands])

  const btnRef = useRef();
  const saveClick = () => {
    if (btnRef && btnRef.current) {
      btnRef.current.click();
    }
  };
  return (
    <Modal
      show={show}
      onHide={onHide}
      aria-labelledby="example-modal-sizes-title-lg"
      centered
      size='lg'
    >
      <Modal.Header>
        <Modal.Title>
          {formatMessage({defaultMessage:'Bộ lọc nâng cao'})}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="overlay overlay-block cursor-default pt-3 pb-0" >
        <Formik
          initialValues={{}}
          onSubmit={(values) => {
            console.log('values', values)
            onHide()
          }}
        >
          {({
            handleSubmit,
            setFieldValue,
            initialValues
          }) => {
            return (
              <Form>
                <div className="form-group row pt-0">
                  <div className='col-6' >
                    <Field
                      name="brand"
                      component={ReSelect}
                      placeholder={formatMessage({defaultMessage:'Chọn danh mục'})}
                      label={formatMessage({defaultMessage:'Danh mục'})}
                      customFeedbackLabel={' '}
                      options={[]}
                      cols={['col-12', 'col-12']}
                    />
                  </div>
                  <div className='col-6' >
                    <Field
                      name="brand"
                      component={ReSelectBranch}
                      placeholder={formatMessage({defaultMessage:'Chọn thương hiệu'})}
                      label={formatMessage({defaultMessage:'Thương hiệu'})}
                      customFeedbackLabel={' '}
                      options={brandsOptions}
                      cols={['col-12', 'col-12']}
                      loading={loadingBrands}
                    />
                  </div>
                  <div className='col-12' >
                    <Field
                      name="revalue"
                      component={RadioGroup}
                      label={formatMessage({defaultMessage:'Doanh thu'})}
                      customFeedbackLabel={' '}
                      options={[
                        {
                          value: 1,
                          label: formatMessage({defaultMessage:'Chưa bán'})
                        },
                        {
                          value: 2,
                          label: formatMessage({defaultMessage:'Bán chậm'})
                        },
                        {
                          value: 3,
                          label: formatMessage({defaultMessage:'Bán tốt'})
                        },
                      ]}
                    />
                  </div>
                  <div className='col-12' >
                    <Field
                      name="tonkho"
                      component={RadioGroup}
                      label={formatMessage({defaultMessage:'Tồn kho'})}
                      customFeedbackLabel={' '}
                      options={[
                        {
                          value: 1,
                          label: formatMessage({defaultMessage:'Hết hàng'})
                        },
                        {
                          value: 2,
                          label: formatMessage({defaultMessage:'Sắp hết hàng'})
                        },
                        {
                          value: 3,
                          label: formatMessage({defaultMessage:'Còn hàng'})
                        },
                        {
                          value: 4,
                          label: formatMessage({defaultMessage:'Chưa có phân loại hàng'})
                        },
                      ]}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  style={{ display: "none" }}
                  ref={btnRef}
                  onSubmit={() => handleSubmit()}
                >
                </button>
              </Form>
            )
          }}
        </Formik>
      </Modal.Body>
      <Modal.Footer className="form" style={{ borderTop: 'none', justifyContent: 'center', paddingTop: 0 }} >
        <div className="form-group">
          <button
            type="button"
            onClick={onHide}
            className="btn btn-light btn-elevate mr-3"
            style={{ width: 100 }}
          >
            <FormattedMessage defaultMessage="ĐÓNG" />
          </button>
          <button
            type="button"
            onClick={saveClick}
            className="btn btn-primary btn-elevate"
            style={{ width: 100 }}
          >
            <FormattedMessage defaultMessage="XÁC NHẬN" />
          </button>
        </div>
      </Modal.Footer>
    </Modal>
  );
}

export default injectIntl(ProductFilterAdvantDialog);