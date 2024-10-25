import React, { memo, useEffect, useRef } from 'react';
import { Modal } from 'react-bootstrap';
import { useMutation } from "@apollo/client";
import { useProductsUIContext } from '../../ProductsUIContext';
import { Input } from '../../../../../_metronic/_partials/controls';
import { Field, Formik } from 'formik';
import * as Yup from "yup";
import mutate_update_sme_catalog_product_variant from '../../../../../graphql/mutate_update_sme_catalog_product_variant';
import { useToasts } from 'react-toast-notifications';
import { useIntl } from "react-intl";
const ModalProductConnect = ({
    scProductIds,
    hasAttribute,
    onHide,
    isShow
}) => {
    const {formatMessage} = useIntl()
    const _form = useRef(null)
    const { ids, setIds } = useProductsUIContext();
    const [mutate, { loading }] = useMutation(mutate_update_sme_catalog_product_variant, {
        refetchQueries: ['sme_catalog_inventories', 'sme_catalog_inventories_aggregate'],
        onCompleted: (data) => {
            setIds([])
          }
    })
    const { addToast } = useToasts();

    useEffect(() => {
        if (!isShow) {
            !!_form.current && _form.current.resetForm()
        }
    }, [isShow])
    return (
        <Formik
            initialValues={{
            }}
            onSubmit={async (values) => {
                await mutate({
                    variables: {
                        _in: ids.map(__ => __.variant_id),
                        stock_warning: values.stockWarning == 0 ? 0 : (values.stockWarning || null)
                    }
                })

                setIds([])
                onHide()
                addToast(formatMessage({defaultMessage:'Cập nhật thành công.'}), { appearance: 'success' });
            }}
            validationSchema={Yup.object().shape({
                stockWarning: Yup.number()
                    .max(999999, formatMessage({defaultMessage:"Số lượng sản phẩm phải nhỏ hơn 999.999"}))
                    .min(0, formatMessage({defaultMessage:"Số lượng sản phẩm phải lớn hơn 0"}))
                    .notRequired()
            })}
            innerRef={_form}
        >
            {({
                handleSubmit,
                values,
                validateForm,
                setFieldError,
                submitForm,
            }) => {
                return (
                    <Modal
                        show={isShow}
                        aria-labelledby="example-modal-sizes-title-sm"
                        dialogClassName="modal-show-connect-product"
                        centered
                        onHide={loading ? null : onHide}
                        backdrop={loading ? 'static' : true}

                    >
                        <Modal.Header closeButton={true}>
                            <Modal.Title>
                                {formatMessage({defaultMessage:"Cài đặt cảnh báo tồn"})}
                            </Modal.Title>
                        </Modal.Header>
                        <Modal.Body className="overlay overlay-block cursor-default">
                            <div className="form-group row mb-1">
                                <label className='col-12 col-form-label' >{formatMessage({defaultMessage:"Sản phẩm chọn"})}: <b>{ids?.length}</b></label>
                            </div>
                            <Field
                                name="stockWarning"
                                component={Input}
                                label={formatMessage({defaultMessage:"Cảnh báo tồn"})+": "}
                                type="number"
                                decimalScale={0}
                            />
                        </Modal.Body>
                        <Modal.Footer className="form" style={{ borderTop: '1px solid #dbdbdb', justifyContent: 'end', paddingTop: 10, paddingBottom: 10 }} >
                            <button
                                type="button"
                                onClick={onHide}
                                className="btn btn-secondary btn-elevate mr-3"
                                disabled={loading}
                            >
                                {formatMessage({defaultMessage:"Huỷ"})}
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                className="btn btn-primary btn-elevate"
                                disabled={loading}
                            >
                                {formatMessage({defaultMessage:"Cập nhật"})}
                            </button>
                        </Modal.Footer>
                    </Modal>
                )
            }
            }
        </Formik>
    )
};

export default memo(ModalProductConnect);