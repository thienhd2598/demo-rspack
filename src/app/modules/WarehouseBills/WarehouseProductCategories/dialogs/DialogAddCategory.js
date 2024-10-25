import { useMutation, useQuery } from '@apollo/client';
import React, { memo, useState } from 'react';
import { Modal } from 'react-bootstrap';
import { useToasts } from 'react-toast-notifications';
import { useIntl } from 'react-intl';
import { Formik, Field } from 'formik'
import * as Yup from "yup";
import { Input, InputVertical } from '../../../../../_metronic/_partials/controls';
import query_sme_catalog_category_aggregate from '../../../../../graphql/query_sme_catalog_category_aggregate'
import client from '../../../../../apollo';

const DialogAddCategory = ({ updateAddCategory, handleAddCategory, dataDialogAddCategory, onHide }) => {
    const { formatMessage } = useIntl();
    const { addToast } = useToasts();
    const Schema = Yup.object()
    .shape({
    nameCategory: Yup.string().required("Vui lòng nhập tên danh mục.")
    .max(120, formatMessage({ defaultMessage: "Tên danh mục tối đa 120 ký tự." }))
    .when(`isNameExist`, {
        is: values => {
          return !!values && values !== dataDialogAddCategory?.name
        },
        then: Yup.string().oneOf([`nameExist`], formatMessage({ defaultMessage: 'Tên danh mục đã tồn tại' }))
      })
})
   

    const queryCetegoryName = async (name) => {
        const { data } = await client.query({
            query: query_sme_catalog_category_aggregate,
            variables: {
                where: {
                    name: {
                        _like: name
                    }
                },
            },
            fetchPolicy: "network-only",
        });

        return data?.sme_catalog_category_aggregate?.aggregate?.count || 0;
    }
  return (
    <Formik
    enableReinitialize
    initialValues={{
        nameCategory: dataDialogAddCategory?.name
    }}
    validationSchema={Schema}
    onSubmit={async (values) => {
        if(dataDialogAddCategory?.action == 'UPDATE') {
            await updateAddCategory(dataDialogAddCategory?.id, values['nameCategory'])
            return
        }
        await handleAddCategory(values['nameCategory'])
    }}
    >
        {({values, handleSubmit, setFieldError, isSubmitting, setFieldValue}) => {
            return (
            <Modal
            show={dataDialogAddCategory?.isOpen}
            aria-labelledby="example-modal-sizes-title-lg"
            centered
            onHide={onHide}
            >
                <Modal.Body className="overlay overlay-block cursor-default text-center">
                    <div>
                    <div className='mb-2 row'>
                        <span style={{position: 'relative', top: '9px'}} className='col-3 p-0 text-right'>{formatMessage({ defaultMessage: 'Tên danh mục' })}</span>
                        <div className="col-9 text-left">
                          <Field name={`nameCategory`}
                            component={Input}
                            onBlurChange={async (value) => {
                                const count = await queryCetegoryName(value)

                                if(count > 0) {
                                    setFieldValue('isNameExist', values['nameCategory'])
                                    setFieldValue('nameExist', values['nameCategory'])
                                  } else {
                                    setFieldValue('isNameExist', false)
                                    setFieldValue('nameExist',  '')
                                  }
                              }}
                            value={values['nameCategory']}
                            placeholder={formatMessage({
                              defaultMessage: "Điền tên danh mục",
                            })}
                            label={""}
                            required={false}
                            cols={["col-0", "col-12"]}
                            rows={2}
                        />
                        </div>
                      </div>
                    </div>
                </Modal.Body>
                <Modal.Footer className="form" style={{ borderTop: '1px solid #dbdbdb', justifyContent: 'end', paddingTop: 10, paddingBottom: 10 }} >
                    <div className="form-group">
                    <button
                        type="button"
                        className="btn btn-elevate mr-3"
                        disabled={isSubmitting}
                        onClick={onHide}
                        style={{ width: 100, background: 'grey', color: 'white' }}>
                        {formatMessage({ defaultMessage: 'Hủy' })}
                    </button>
                    <button
                        type="button"
                        className="btn btn-primary btn-elevate mr-3"
                        style={{ width: 100 }}
                        onClick={handleSubmit}
                    >
                        {dataDialogAddCategory?.action == 'UPDATE' ? formatMessage({ defaultMessage: 'Cập nhật' }) : formatMessage({ defaultMessage: 'Tạo' })}
                    </button>
                    </div>
                </Modal.Footer>
        </Modal>
            )}}
    </Formik>
    
  )
}

export default DialogAddCategory