import React, { memo, useEffect, useRef } from 'react';
import { Modal } from 'react-bootstrap';
import { useMutation } from "@apollo/client";
import { useProductsUIContext } from '../../ProductsUIContext';
import { Input } from '../../../../../_metronic/_partials/controls';
import { Field, Formik } from 'formik';
import * as Yup from "yup";
import mutate_update_sme_catalog_product_variant_price from '../../../../../graphql/mutate_update_sme_catalog_product_variant_price';
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
    const [mutate, { loading }] = useMutation(mutate_update_sme_catalog_product_variant_price, {
        refetchQueries: ['sme_catalog_inventories'],
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
                stockWarning: 0
            }}
            onSubmit={async (values) => {

                if (!!values.priceMinumum && (!values.price || values.price < values.priceMinumum)) {
                    addToast(formatMessage({defaultMessage:'Giá bán phải lớn hơn hoặc bằng giá bán tối thiểu '}), { appearance: 'error' });
                    return
                }

                await mutate({
                    variables: {
                        _in: ids.map(__ => __.variant_id),
                        price: values.price || null,
                        price_minimum: values.priceMinumum || null,
                    }
                })

                setIds([])
                onHide()
                addToast(formatMessage({defaultMessage:'Cập nhật thành công.'}), { appearance: 'success' });
            }}
            validationSchema={Yup.object().shape({
                price: Yup.number()
                    .max(120000000, formatMessage({defaultMessage:"Giá tối đa là 120.000.000đ"}))
                    .min(1000, formatMessage({defaultMessage:"Giá tối thiểu là 1.000đ"}))
                    .required(formatMessage({defaultMessage:'Vui lòng nhập giá bán'}))
                    .when(`priceMinumum`, values => {
                        if (values) {
                            return Yup.number()
                                .min(values, formatMessage({defaultMessage:'Giá bán phải lớn hơn hoặc bằng giá bán tối thiểu'}))
                        }
                    }),
                priceMinumum: Yup.number()
                    .max(120000000, formatMessage({defaultMessage:"Giá tối đa là 120.000.000đ"}))
                    .min(1000, formatMessage({defaultMessage:"Giá tối thiểu là 1.000đ"}))
                    .required(formatMessage({defaultMessage:'Vui lòng nhập giá bán tối thiểu'})),
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
                                {formatMessage({defaultMessage:"Cập nhật giá"})}
                            </Modal.Title>
                        </Modal.Header>
                        <Modal.Body className="overlay overlay-block cursor-default">
                            <div className="form-group row mb-1">
                                <label className='col-12 col-form-label' >{formatMessage({defaultMessage:"Sản phẩm chọn"})}: <b>{ids?.length}</b></label>
                            </div>
                            <Field
                                name="price"
                                component={Input}
                                label={formatMessage({defaultMessage:"Giá bán"})+": "}
                                type="number"
                                decimalScale={0}
                                addOnRight='đ'
                                cols={['col-4', 'col-8']}
                            />
                            <Field
                                name="priceMinumum"
                                component={Input}
                                label={formatMessage({defaultMessage:"Giá bán tối thiểu"})+": "}
                                type="number"
                                decimalScale={0}
                                addOnRight='đ'
                                cols={['col-4', 'col-8']}
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