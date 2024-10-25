import React, { memo, useState, useMemo, useCallback, Fragment, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useHistory } from "react-router-dom";
import * as Yup from "yup";
import { FastField, Field, Form, Formik } from "formik";
import {
    Card,
    CardBody,
    InputVertical,
} from "../../../../_metronic/_partials/controls";
import { useSubheader } from "../../../../_metronic/layout";
import { RouterPrompt } from '../../../../components/RouterPrompt';
import { toAbsoluteUrl } from "../../../../_metronic/_helpers";
import SVG from "react-inlinesvg";
import { useToasts } from "react-toast-notifications";
import LoadingDialog from "../product-new/LoadingDialog";
import ProductUpdateImageRow from "./ProductUpdateImageRow";
import query_sc_stores_basic from "../../../../graphql/query_sc_stores_basic";
import { useIntl } from "react-intl";
import _ from 'lodash';
import mutate_scUpdateMultiProductImage from "../../../../graphql/mutate_scUpdateMultiProductImage";
import ProductImageEditDialog from "../product-image-edit-dialog";
import { Modal, OverlayTrigger, Tooltip } from "react-bootstrap";
import ImageView from "../../../../components/ImageView";

const ProductUpdateImage = () => {
    const { setBreadcrumbs } = useSubheader();
    const { formatMessage } = useIntl();
    const { addToast } = useToasts();
    const history = useHistory();
    const initialProducts = useRef(null);

    useEffect(() => {
        setBreadcrumbs([
            {
                title: formatMessage({ defaultMessage: 'Sửa thông tin sản phẩm' }),
                pathname: '/product-stores/update-images'
            }
        ])
    }, []);

    const [products, setProducts] = useState([]);
    const [dataCrop, setDataCrop] = useState();
    const [imageInvalid, setImageInvalid] = useState([]);
    const [productSchema, setProductSchema] = useState(null);
    const [errorMessage, setErrorMessage] = useState([]);

    const { data: dataStore, loading: loadingStore } = useQuery(query_sc_stores_basic, {
        fetchPolicy: 'cache-and-network'
    });

    const [updateMultiProductImage, { loading: loadingUpdateMultiProductImage }] = useMutation(mutate_scUpdateMultiProductImage);

    const [optionsStore] = useMemo(
        () => {
            let _options = dataStore?.sc_stores?.map(_store => {
                let _channel = dataStore?.op_connector_channels?.find(_ccc => _ccc.code == _store.connector_channel_code)
                return { label: _store.name, value: _store.id, logo: _channel?.logo_asset_url }
            }) || [];

            return [_options];
        }, [dataStore]
    );

    const initialValues = useMemo(
        () => {
            let schema = {};
            let initial = {};

            console.log(`CHECK PRODUCT: `, history?.location?.state?.list_product);

            const parseProducts = history?.location?.state?.list_product?.map(
                _product => {
                    let _store = optionsStore?.find(store => store.value == _product?.store_id) || {};
                    let productFiles = _.sortBy((_product?.productAssets || []).filter(_asset => _asset.type == 1), 'position').map(_asset => {
                        return {
                            id: _asset.sme_asset_id,
                            source: _asset.origin_image_url || _asset.sme_url,
                            scId: _asset.id,
                            source_draft: _asset.origin_image_url || _asset.sme_url,
                            merged_image_url: _asset.sme_url,
                            template_image_url: _asset.template_image_url,
                        }
                    });
                    let imageOrigin = (_product?.productAssets || []).filter(_asset => _asset.type == 4).map(_asset => {
                        return {
                            id: _asset.sme_asset_id,
                            source: _asset.origin_image_url || _asset.sme_url,
                            scId: _asset.id,
                            source_draft: _asset.origin_image_url || _asset.sme_url,
                            merged_image_url: _asset.sme_url,
                            template_image_url: _asset.template_image_url,
                        }
                    })[0] || null

                    return {
                        ..._product,
                        productFiles,
                        productImageOrigin: imageOrigin,
                        store: _store
                    }
                }
            )

            setProducts(parseProducts);
            initialProducts.current = parseProducts;

            (history?.location?.state?.list_product || []).forEach(
                product => {
                    initial[`product-${product?.id}-name`] = product?.name;
                    schema[`product-${product?.id}-name`] = Yup.string()
                        .min(product?.connector_channel_code == 'tiktok' ? 25 : 10, formatMessage({ defaultMessage: "{name} phải có tối thiểu {length} ký tự" }, { length: product?.connector_channel_code == 'tiktok' ? 25 : 10, name: formatMessage({ defaultMessage: "Tên sản phẩm" }) }))
                        .max(product?.connector_channel_code == 'shopee' ? 120 : 255, formatMessage({ defaultMessage: "{name} tối đa {length} ký tự" }, { length: product?.connector_channel_code == 'shopee' ? 120 : 255, name: formatMessage({ defaultMessage: "Tên sản phẩm" }) }))
                        .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: formatMessage({ defaultMessage: "Tên sản phẩm" }).toLowerCase() }))
                        .test(
                            'chua-ky-tu-space-o-dau-cuoi',
                            formatMessage({ defaultMessage: 'Tên sản phẩm sàn không được chứa dấu cách ở đầu và cuối' }),
                            (value, context) => {
                                if (!!value) {
                                    return value.length == value.trim().length;
                                }
                                return false;
                            },
                        )
                        .test(
                            'chua-ky-tu-2space',
                            formatMessage({ defaultMessage: 'Tên sản phẩm sàn không được chứa 2 dấu cách liên tiếp' }),
                            (value, context) => {
                                if (!!value) {
                                    return !(/\s\s+/g.test(value))
                                }
                                return false;
                            },
                        );

                    (product?.productVariants || []).forEach(_variant => {
                        initial[`variant-${product?.id}-${_variant?.id}-disabled`] = _variant?.sme_product_variant_id;
                        initial[`variant-${product?.id}-${_variant?.id}-price`] = _variant?.price;
                        initial[`variant-${product?.id}-${_variant?.id}-stockOnHand`] = _variant?.stock_on_hand;
                    })
                }
            );

            setProductSchema(Yup.object().shape(schema));

            return initial;
        }, [history?.location?.state, optionsStore]
    );

    return (
        <>
            <Formik
                initialValues={initialValues}
                validationSchema={productSchema}
                enableReinitialize
                onSubmit={async (values) => {
                    const body = products?.map((product, index) => {
                        return {
                            product_id: product?.id,
                            ...(product?.name != values[`product-${product?.id}-name`] ? {
                                product_name: values[`product-${product?.id}-name`]
                            } : {}),
                            assets_delete: (initialProducts?.current?.[index]?.productAssets || [])
                                ?.filter(asset => asset?.type == 1)
                                ?.filter(_init => !product?.productFiles?.some(_file => _file.id == _init.sme_asset_id))
                                ?.map(_file => parseInt(_file?.id)),
                            assets_updated: product?.productFiles?.map(
                                (_file, idx) => {
                                    const checkedNotUpdate = (initialProducts?.current?.[index]?.productAssets || [])?.some(_init => _init.sme_asset_id == _file.id);

                                    if (checkedNotUpdate) return null;

                                    return {
                                        asset_id: _file.id,
                                        url: _file.merged_image_url || _file.source,
                                        type: 1,
                                        origin_image_url: _file.source,
                                        template_image_url: _file.template_image_url,
                                        position: idx,
                                        ...(!!_file.scId ? { id: _file.scId } : {})
                                    }
                                }
                            )?.filter(_file => Boolean(_file)),
                        }
                    })

                    console.log({ body });

                    let res = await updateMultiProductImage({
                        variables: {
                            products: body
                        }
                    });

                    if (res?.data?.scUpdateMultiProductImage?.success) {
                        history.push(history?.location?.state?.from == 'draf' ? `/product-stores/draf?channel=${products?.[0]?.connector_channel_code}` : `/product-stores/list?channel=${products?.[0]?.connector_channel_code}`);
                        addToast(formatMessage({ defaultMessage: 'Cập nhật ảnh sản phẩm thành công' }), { appearance: 'success' })
                    } else {
                        addToast(res?.data?.scUpdateMultiProductImage?.message || formatMessage({ defaultMessage: 'Cập nhật ảnh sản phẩm không thành công' }), { appearance: 'error' })
                    }
                }}
            >
                {({
                    handleSubmit,
                    values,
                    validateForm,
                    setFieldValue,
                    ...rest
                }) => {
                    const changed = values?.['__changed__'];

                    return (
                        <Fragment>
                            <RouterPrompt
                                when={changed}
                                title={formatMessage({ defaultMessage: "Bạn đang cập nhật ảnh sản phẩm sàn. Mọi thông tin bạn nhập trước đó sẽ bị xoá nếu bạn thoát màn hình này. Bạn có chắc chắn muốn thoát?" })}
                                cancelText={formatMessage({ defaultMessage: "KHÔNG" })}
                                okText={formatMessage({ defaultMessage: "CÓ, THOÁT" })}
                                onOK={() => true}
                                onCancel={() => false}
                            />
                            <Card>
                                <CardBody>
                                    {/* <div className="row d-flex justify-content-end align-items-end mb-8">
                                        <div className="col-2">
                                            <button
                                                className="btn btn-primary"
                                                type="submit"
                                                style={{ width: '100%', height: 36 }}
                                                disabled={!values['prename-product']}
                                                onClick={async (e) => {
                                                    products.forEach(product => {
                                                        const productName = values?.[`product-${product?.id}-name`];
                                                        const productPreName = values?.[`prename-product`];
                                                        setFieldValue(`product-${product?.id}-prename`, productPreName);
                                                        
                                                        if (!values[`product-${product?.id}-prename`]) {
                                                            setFieldValue(`product-${product?.id}-name`, `${productPreName} ${productName}`);
                                                        } else {
                                                            setFieldValue(`product-${product?.id}-name`, productName?.replace(values[`product-${product?.id}-prename`], values?.[`prename-product`]));
                                                        }
                                                    })
                                                }}
                                            >
                                                {formatMessage({ defaultMessage: 'Áp dụng cho tất cả' })}
                                            </button>
                                        </div>
                                        <div className="col-3 d-flex flex-column">
                                            <div className="d-flex algin-items-center mb-1">
                                                <span>{formatMessage({ defaultMessage: 'Tiền tố sản phẩm' })}</span>
                                                <OverlayTrigger
                                                    overlay={<Tooltip>{formatMessage({ defaultMessage: 'Tiền tố sẽ được thêm vào trước tên sản phẩm' })}</Tooltip>}
                                                >
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg" width="14" height="14"
                                                        fill="currentColor" className="bi bi-info-circle cursor-pointer ml-2"
                                                        viewBox="0 0 16 16"
                                                    >
                                                        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
                                                        <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0" />
                                                    </svg>
                                                </OverlayTrigger>
                                            </div>
                                            <FastField
                                                name={`prename-product`}
                                                component={InputVertical}
                                                placeholder={formatMessage({ defaultMessage: "Nhập tiền tố tên sản phẩm" })}
                                                label={""}
                                                nameTxt={""}
                                                required
                                                absolute
                                                countChar
                                                maxChar={30}
                                                maxLength={30}
                                                customFeedbackLabel={' '}
                                                addOnRight={''}
                                            />
                                        </div>
                                    </div> */}
                                    <div
                                        style={{
                                            borderRadius: 6,
                                            minHeight: 220,

                                        }}
                                    >
                                        <table className="table table-borderless product-list table-vertical-center fixed">
                                            <thead style={{
                                                position: 'sticky', top: 42, background: '#F3F6F9', fontWeight: 'bold', fontSize: '14px', zIndex: 1
                                            }}>
                                                <tr className="font-size-lg" style={{ zIndex: 1, borderRadius: 6 }}>
                                                    <th style={{ fontSize: '14px' }} width="27%">
                                                        {formatMessage({ defaultMessage: 'Sản phẩm' })}
                                                    </th>
                                                    <th style={{ fontSize: '14px' }} width="10%">
                                                        {formatMessage({ defaultMessage: 'Gian hàng' })}
                                                    </th>
                                                    <th style={{ fontSize: '14px' }} width="55%">
                                                        {formatMessage({ defaultMessage: 'Ảnh sản phẩm' })}
                                                    </th>
                                                    <th className='text-center' style={{ fontSize: '14px' }} width="8%">
                                                        {formatMessage({ defaultMessage: 'Thao tác' })}
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {products.map((_product) => (
                                                    <ProductUpdateImageRow
                                                        key={`product-update-image-${_product?.id}`}
                                                        product={_product}
                                                        setDataCrop={setDataCrop}
                                                        setImageInvalid={setImageInvalid}
                                                        setProducts={setProducts}
                                                        errorMessage={errorMessage}
                                                        disabledAction={products?.length == 1}
                                                        onRemoveProduct={id => setProducts(prev => prev?.filter(item => item.id != id))}
                                                    />
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className='form-group d-flex justify-content-end mt-8 group-button-fixed-bottom pr-10'>
                                        <button
                                            className="btn btn-secondary mr-2"
                                            style={{ width: 150 }}
                                            onClick={e => {
                                                e.preventDefault()
                                                history.push(history?.location?.state?.from == 'draf' ? `/product-stores/draf?channel=${products?.[0]?.connector_channel_code}` : `/product-stores/list?channel=${products?.[0]?.connector_channel_code}`);
                                            }}
                                        >
                                            {formatMessage({ defaultMessage: 'Hủy bỏ' })}
                                        </button>
                                        <button
                                            className="btn btn-primary"
                                            type="submit"
                                            style={{ minWidth: 150 }}
                                            onClick={async (e) => {
                                                setFieldValue('__changed__', false)
                                                let res = await validateForm();

                                                if (Object.keys(res).length > 0) {
                                                    handleSubmit();
                                                    addToast(formatMessage({ defaultMessage: 'Vui lòng nhập đầy đủ các trường thông tin đã được khoanh đỏ' }), { appearance: 'error' });
                                                    return;
                                                }

                                                if (products?.some(_product => _product?.productFiles?.length == 0)) {
                                                    addToast(formatMessage({ defaultMessage: 'Hình ảnh sản phẩm yêu cầu tối thiểu 1 ảnh' }), { appearance: 'error' });
                                                    return;
                                                }

                                                handleSubmit()
                                            }}
                                        >
                                            {formatMessage({ defaultMessage: 'Cập nhật' })}
                                        </button>
                                    </div>
                                </CardBody>
                            </Card>
                        </Fragment>
                    )
                }}
            </Formik>

            <LoadingDialog show={loadingUpdateMultiProductImage} />

            <ProductImageEditDialog
                show={!!dataCrop}
                dataCrop={dataCrop}
                onHide={() => {
                    setDataCrop(null)
                }}
            />

            <Modal
                show={imageInvalid.length > 0}
                aria-labelledby="example-modal-sizes-title-lg"
                centered
                size='lg'
                onHide={() => setImageInvalid([])}
            >
                <Modal.Body className="overlay overlay-block cursor-default text-center">
                    <div className="mb-4 row" >
                        {
                            imageInvalid.map((_img, _index) => {
                                return (
                                    <div className='col-12' key={`_index-img-${_index}`} >
                                        <div style={{
                                            alignItems: 'center', display: 'flex',
                                            flexDirection: 'row', marginBottom: 16
                                        }}>
                                            <div style={{
                                                backgroundColor: '#F7F7FA',
                                                width: 50, height: 50,
                                                borderRadius: 8,
                                                overflow: 'hidden',
                                                minWidth: 50
                                            }} className='mr-6' >
                                                <ImageView file={_img.file} style={{ width: 50, height: 50, objectFit: 'contain' }} />
                                            </div>
                                            <p className='font-weight-normal mb-1' style={{ textAlign: 'left' }} >{_img.message}</p>
                                        </div>
                                    </div>
                                )
                            })
                        }
                    </div>

                    <div className="form-group mb-0">
                        <button
                            type="button"
                            className={`btn btn-primary font-weight-bold`}
                            style={{ width: 180 }}
                            onClick={async () => {
                                setImageInvalid([])
                            }}
                        >
                            <span className="font-weight-boldest">{formatMessage({ defaultMessage: 'Xác nhận' })}</span>
                        </button>
                    </div>
                </Modal.Body>
            </Modal >

            <div
                id="kt_scrolltop1"
                className="scrolltop"
                style={{ bottom: 80 }}
                onClick={() => {
                    window.scrollTo({
                        letf: 0,
                        top: document.body.scrollHeight,
                        behavior: 'smooth'
                    });
                }}
            >
                <span className="svg-icon">
                    <SVG src={toAbsoluteUrl("/media/svg/icons/Navigation/Down-2.svg")} title={' '}></SVG>
                </span>{" "}
            </div>
        </>
    )
};

export default memo(ProductUpdateImage);