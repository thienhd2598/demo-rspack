import { useLazyQuery } from '@apollo/client';
import { Formik } from 'formik';
import * as _ from 'lodash';
import React, { memo, useEffect, useState } from 'react';
import { Modal } from "react-bootstrap";
import { useIntl } from "react-intl";
import * as Yup from "yup";
import CategorySelect from '../../../../components/CategorySelect';
import op_sale_channel_categories from '../../../../graphql/op_sale_channel_categories';

const ModalDownloadBrand = ({ show, onHide, currentInfoStore, nameStore }) => {
  const { formatMessage } = useIntl();
  const [categories, setCategories] = useState({});
  const [categorySelected, setCategorySelected] = useState(0)
  const [getSaleChannelCategory, { loading }] = useLazyQuery(op_sale_channel_categories);

  useEffect(() => {
    if (currentInfoStore && show) {
      getSaleChannelCategory({
        variables: {
          connector_channel_code: currentInfoStore?.connector_channel_code
        }
      }).then(({ data }) => {
        let _categories = _.groupBy(data?.sc_sale_channel_categories, _cate => _cate.parent_id || 'root');
        setCategories(_categories);
      })
    }
  }, [currentInfoStore, show])

  const validationSchema = Yup.object().shape({
    sale_channel: Yup.array()
      .nullable()
      .required(formatMessage({ defaultMessage: 'Vui lòng chọn ngành hàng' })),
  });

  return (
    <Formik
      initialValues={{}}
      validationSchema={validationSchema}
      enableReinitialize={show}
    >
      {({
        // handleSubmit,
        // values,
        // validateForm,
        resetForm
      }) => {

        function _onHide(list_category_id) {
          resetForm({ values: {}, isValidating: false })
          setCategorySelected(0);
          setCategories({})
          onHide(list_category_id);
        }
        return <Modal
          onHide={() => { _onHide() }}
          show={show}
          aria-labelledby="example-modal-sizes-title-lg"
          centered
          size='lg'
        >
          <Modal.Header className='px-3 py-1'>
            <h5 class="modal-title" style={{ fontWeight: 600 }}>{formatMessage({ defaultMessage: "Tải thương hiệu" })}</h5>
            <button type="button" data-dismiss="modal" aria-label="Close" style={{ background: "transparent" }} onClick={() => { _onHide() }}>
              <span aria-hidden="true" style={{ fontSize: "32px", lineHeight: "32px" }}>&times;</span>
            </button>
          </Modal.Header>
          <Modal.Body className="overlay overlay-block cursor-default text-center">
            <div className="fs-14 d-flex mb-4">
              <label className='text-left' style={{ color: '#000000', width: "100px" }}>{formatMessage({ defaultMessage: 'Gian hàng' })}:</label>
              {currentInfoStore && nameStore(currentInfoStore)}
            </div>
            <div className="fs-14 d-flex">
              <label className='text-left' style={{ color: '#000000', width: "100px", lineHeight: "32px" }}>
                {formatMessage({ defaultMessage: 'Ngành hàng:' })}
                <span className='text-danger' > *</span></label>
              <div className='col-10' style={{ paddingLeft: 0 }}>
                <CategorySelect
                  categories={categories}
                  key={`category`}
                  name={`category`}
                  selected={categorySelected}
                  hideLabel
                  onSelect={(category) => {
                    setCategorySelected(category.id);
                  }}
                  disableFeedback
                />
              </div>
              {(loading && show) && <div className='text-center mt-2' >
                <span className="ml-1 spinner spinner-primary"></span>
              </div>}
            </div>
          </Modal.Body>
          <Modal.Footer className='p-2'>
            <button
              className="btn btn-secondary mr-2 px-6 py-2"
              style={{ color: "#fff", backgroundColor: "#6C757D", borderColor: "rgb(108, 117, 125)" }}
              onClick={() => { _onHide() }}
            >
              {formatMessage({ defaultMessage: "Đóng" })}
            </button>
            <button
              onClick={async () => {
                if (categorySelected) {
                  _onHide([categorySelected]);
                }
              }}
              disabled={!categorySelected}
              type='submit'
              className="btn btn-primary p-2"
              style={{ color: "#fff" }}
            >
              {formatMessage({ defaultMessage: "Tải thương hiệu" })}
            </button>
          </Modal.Footer>
        </Modal>
      }}
    </Formik >
  )
}

export default memo(ModalDownloadBrand)