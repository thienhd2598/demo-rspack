import { Formik } from 'formik';
import React, { useState, useCallback, useMemo, memo, Fragment, useEffect } from 'react';
import * as Yup from 'yup';
import { useQuery } from '@apollo/client';
import _ from 'lodash';
import { formatNumberToCurrency } from '../../../../utils';
import { toAbsoluteUrl } from '../../../../_metronic/_helpers';
import { Modal, OverlayTrigger, Tooltip } from "react-bootstrap";
import {
    Card,
    CardBody,
    CardHeader
} from "../../../../_metronic/_partials/controls";
import SVG from "react-inlinesvg";
import { useProductsUIContext } from "../ProductsUIContext";
import ProductConnectDialog from "./ProductConnectDialog";
import { useLazyQuery } from "@apollo/client";
import query_sc_products from "../../../../graphql/query_sc_products_from_sme";
import ProductConnectTable from './ProductConnectTable';
import { useLocation, useHistory } from 'react-router-dom';
import { useToasts } from "react-toast-notifications";
import queryString from 'querystring';
import DeleteProductConnectDialog from './DeleteProductConnectDialog';
import ProductConnectClassify from './ProductConnectClassify';
import ProductConnectGroupClassify from './ProductConnectGroupClassify';
import { useIntl } from 'react-intl';
const ProductAffiliate = memo(({

}) => {
    const history = useHistory();
    const location = useLocation();
    const {formatMessage} = useIntl()
    const { addToast } = useToasts();
    const params = queryString.parse(useLocation().search.slice(1, 100000));
    const { currentProduct } = useProductsUIContext();


    const [isShowAffiliateFail, setShowAffiliateFail] = useState(false);
    const [isShowClassify, setShowClassify] = useState(false);
    const [isShowGrpClassify, setShowGrpClassify] = useState(false);
    const [isShowChooseProduct, setShowChooseProduct] = useState(false);
    const [isRemoveConnect, setRemoveConnect] = useState(false);

    const [dataAttributeSme, setDataAttributeSme] = useState([]);
    const [dataAttribute, setDataAttribute] = useState({
        smeAttr: [],
        scAttr: []
    });
    const [selectedValue, setSelectedValue] = useState({
        variant_attributes: [],
        sme_product_id: '',
        sc_product_id: null,
        sc_variant_id: null,
        sme_variant_id: '',
        action: '',
    });

    let page = useMemo(() => {
        try {
            let _page = Number(params.page)
            if (!Number.isNaN(_page)) {
                return Math.max(1, _page)
            } else {
                return 1
            }
        } catch (error) {
            return 1
        }
    }, [params.page]);

    let limit = useMemo(() => {
        try {
            let _value = Number(params.limit)
            if (!Number.isNaN(_value)) {
                return Math.max(25, _value)
            } else {
                return 25
            }
        } catch (error) {
            return 25
        }
    }, [params.limit]);

    const [fetch, { data, loading, refetch, called }] = useLazyQuery(query_sc_products, {
        variables: {
            first: 100,
            limit,
            offset: (page - 1) * limit,
            sme_product_id: currentProduct?.id || 1,
            page: page,
        },
        fetchPolicy: 'cache-and-network',
    });

    let totalRecord = data?.sc_products?.paginatorInfo?.count || 0;
    let totalPage = Math.ceil(totalRecord / limit);

    useEffect(
        () => {
            fetch();
        }, []
    );

    console.log({ productSme: currentProduct })

    const smeProductData = useMemo(
        () => {
            let {
                id, name, price, stock_on_hand, sku,
                sme_catalog_product_attributes_custom,
                sme_catalog_product_variants
            } = currentProduct || {};

            sme_catalog_product_attributes_custom = (sme_catalog_product_attributes_custom || []).map(
                _item => ({
                    value: _item.id,
                    label: _item.display_name
                })
            );

            sme_catalog_product_variants = (sme_catalog_product_variants || []).map(
                _item => ({
                    id: _item.id,
                    name: _item.name,
                    sku: _item.sku,
                    price: _item.price,
                    stock_on_hand: _item.stock_on_hand
                })
            );

            setDataAttribute({
                ...dataAttribute,
                smeAttr: sme_catalog_product_attributes_custom || []
            });
            setSelectedValue({
                ...selectedValue,
                sme_product_id: id
            })

            return {
                sme_id: id,
                sme_name: name,
                sme_sku: sku,
                sme_price: price,
                sme_stock_on_hand: stock_on_hand,
                sme_attributes: sme_catalog_product_attributes_custom,
                sme_variants: sme_catalog_product_variants
            }
        }, [currentProduct, setDataAttribute]
    );

    const scProductsData = useMemo(
        () => {
            if (!data || !data.sc_products || data.sc_products.data.length == 0)
                return [];

            let newScProductsData = data?.sc_products?.data?.map(
                _sc => ({
                    sc_id: _sc.id,
                    sc_name: _sc.name,
                    sc_sku: _sc.sku,
                    sc_price: _sc.price,
                    sc_stock_on_hand: _sc.stock_on_hand,
                    sc_store: data?.sc_stores?.find(
                        _store => _store.id == _sc.store_id
                    ),
                    sc_channel: data?.op_connector_channels?.find(
                        _channel => _channel.code == _sc.connector_channel_code
                    ),
                    sc_product_variants: (_sc.productVariants || []).map(
                        _variant => ({
                            id: _variant.id,
                            name: _variant.name,
                            price: _variant.price,
                            sku: _variant.sku,
                            stock_on_hand: _variant.stock_on_hand,
                            sme_product_variant_id: _variant.sme_product_variant_id
                        })
                    ),
                    sc_variants_attribute: (_sc.productVariantAttributes || []).map(
                        _attr => ({
                            id: _attr.id,
                            name: _attr.name
                        })
                    )
                })
            );

            return newScProductsData
        }, [data]
    )

    const dataTable = useMemo(
        () => {
            let { sme_name, sme_sku, sme_price, sme_stock_on_hand, sme_variants, sme_attributes } = smeProductData;

            const dataMapScToSme = scProductsData.map(
                _sc => {
                    return {
                        sc_id: _sc.sc_id,
                        sc_name: _sc.sc_name,
                        sc_sku: _sc.sc_sku,
                        sc_price: _sc.sc_price,
                        sc_stock_on_hand: _sc.sc_stock_on_hand,
                        sc_store: _sc.sc_store,
                        sc_channel: _sc.sc_channel,
                        sc_variants_attribute: _sc.sc_variants_attribute,
                        sme_name,
                        sme_price,
                        sme_sku,
                        sme_stock_on_hand,
                        sme_attributes,
                        variants: sme_variants.map(
                            (_variant) => {
                                let { id, name, sku, price, stock_on_hand } = _variant;
                                let findedVariantScFromSme = _sc.sc_product_variants.find(ii => ii.sme_product_variant_id == id);

                                return {
                                    sme_variant_id: id,
                                    sme_variant_name: name,
                                    sme_variant_sku: sku,
                                    sme_variant_price: price,
                                    sme_variant_stock_on_hand: stock_on_hand,
                                    ...(findedVariantScFromSme ? {
                                        sc_variant_id: findedVariantScFromSme.id,
                                        sc_variant_name: findedVariantScFromSme.name,
                                        sc_variant_sku: findedVariantScFromSme.sku,
                                        sc_variant_price: findedVariantScFromSme.price,
                                        sc_variant_stock_on_hand: findedVariantScFromSme.stock_on_hand,
                                    } : {
                                        sc_variant_id: null,
                                        sc_variant_name: null,
                                        sc_variant_sku: null,
                                        sc_variant_price: null,
                                        sc_variant_stock_on_hand: null,
                                    })
                                }
                            }
                        )
                    }
                }
            );

            return dataMapScToSme
        }, [smeProductData, scProductsData]
    );

    // Remove connect
    const onShowRemoveConnect = useCallback(
        () => {
            setRemoveConnect(true);
        }, [isRemoveConnect, setRemoveConnect]
    );

    // Connect grp classify
    const onShowConnectGrpClassify = useCallback(
        () => {
            setShowGrpClassify(true);
        }, [isShowGrpClassify, setShowGrpClassify]
    );

    // Connect classify
    const onShowConnectClassify = useCallback(
        () => {
            setShowClassify(true);
        }, [isShowClassify, setShowClassify]
    );

    return (
        <Fragment>
            <Card>
                <CardHeader title={formatMessage({defaultMessage:'Danh sách sản phẩm liên kết'})}>
                </CardHeader>
                <CardBody>
                    <div className='col-12 text-right'>
                        <button
                            className="btn btn-primary"
                            type="submit"
                            onClick={e => {
                                e.preventDefault();
                                setShowChooseProduct(true)
                            }}
                        >
                            {formatMessage({defaultMessage:'Thêm sản phẩm liên kết'})}
                        </button>
                    </div>
                    <ProductConnectTable
                        smeId={smeProductData.sme_id}
                        loading={loading}
                        data={dataTable}
                        limit={limit}
                        page={page}
                        totalPage={totalPage}
                        totalRecord={totalRecord}
                        onShowRemoveConnect={onShowRemoveConnect}
                        onShowConnectClassify={onShowConnectClassify}
                        setSelectedValue={setSelectedValue}
                    />
                    {/* Modal Remove Connect */}
                    <DeleteProductConnectDialog
                        show={isRemoveConnect}
                        onHide={() => setRemoveConnect(false)}
                        sme_product_id={selectedValue.sme_product_id}
                        sc_product_id={selectedValue.sc_product_id}
                        sc_variant_id={selectedValue.sc_variant_id}
                        action={selectedValue.action}
                    />

                    <ProductConnectClassify
                        show={isShowClassify}
                        onHide={() => setShowClassify(false)}
                        sc_variant_id={selectedValue.sc_variant_id}
                        sme_variant_id={selectedValue.sme_variant_id}
                        sc_id={selectedValue.sc_product_id}
                        sme_id={selectedValue.sme_product_id}
                        smeProductData={smeProductData}
                        scProductsData={scProductsData}
                        setSelectedValue={setSelectedValue}
                    />

                    {/* Modal choose product */}
                    <ProductConnectDialog
                        show={isShowChooseProduct}
                        onHide={() => setShowChooseProduct(false)}
                        smeId={smeProductData.sme_id}
                        smeVariantId={
                            currentProduct?.sme_catalog_product_variants?.length == 1 && currentProduct?.sme_catalog_product_variants?.[0]?.attributes?.length == 0
                                ? currentProduct?.sme_catalog_product_variants?.[0]?.id
                                : null
                        }                    
                    />

                    <ProductConnectGroupClassify
                        show={isShowGrpClassify}
                        onHide={() => setShowGrpClassify(false)}
                        sc_product_id={selectedValue.sc_product_id}
                        sme_product_id={selectedValue.sme_product_id}
                        variant_attributes={selectedValue.variant_attributes}
                        dataAttribute={dataAttribute}
                        setSelectedValue={setSelectedValue}
                    />

                    {/* Modal choose group classify */}
                    {/* <ModalGroupClassify 
                        show={isShowGrpClassify}
                        onHide={() => setShowGrpClassify(false)}
                        onSuccess={}
                    /> */}
                    {/* <Modal
                        show={isShowGrpClassify}
                        aria-labelledby="example-modal-sizes-title-sm"
                        centered
                    >
                        <Modal.Body className="overlay overlay-block cursor-default" >
                            <div className="text-center bold" style={{ fontSize: 16, fontWeight: 500, marginBottom: '2rem' }}>
                                Chọn nhóm phân loại để liên kết
                            </div>
                            <div>
                                <p style={{ marginBottom: 10 }}>Nhóm phân loại trên sàn</p>
                                <div
                                    className="radio-list"
                                    style={{ display: 'flex', flexDirection: 'row' }}
                                    onChange={e => {
                                        // setCurrent(e.target.value)
                                    }}
                                >
                                    {
                                        ['Màu sắc', 'Kích cỡ']
                                            .map(_option => {
                                                return <label key={`_option--${_option}`} className="radio" style={{ marginBottom: '2rem', paddingRight: '4rem' }}>
                                                    <input type="radio" name="radios1" value={_option} />
                                                    <span></span>
                                                    {_option}
                                                </label>
                                            })
                                    }
                                </div>
                            </div>
                            <div>
                                <p style={{ marginBottom: 10 }}>Nhóm phân loại kho</p>
                                <div
                                    style={{ display: 'flex', flexDirection: 'row' }}
                                    className="radio-list" onChange={e => {
                                        // setCurrent(e.target.value)
                                    }}
                                >
                                    {
                                        ['Màu sắc', 'Kích cỡ']
                                            .map(_option => {
                                                return <label key={`_option--${_option}`} className="radio" style={{ marginBottom: '2rem', paddingRight: '4rem' }}>
                                                    <input type="radio" name="radios1" value={_option} />
                                                    <span></span>
                                                    {_option}
                                                </label>
                                            })
                                    }
                                </div>
                            </div>
                        </Modal.Body>
                        <Modal.Footer className="form" style={{ borderTop: 'none', justifyContent: 'center', paddingTop: 0 }} >
                            <div className="form-group">
                                <button
                                    type="button"
                                    onClick={() => setShowGrpClassify(false)}
                                    className="btn btn-light btn-elevate mr-3"
                                    style={{ width: 100 }}
                                >
                                    Huỷ
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary btn-elevate"
                                    style={{ width: 100 }}
                                    // disabled={!current}
                                    onClick={e => {
                                        e.preventDefault()
                                        setShowGrpClassify(false)
                                    }}
                                >
                                    XÁC NHẬN
                                </button>
                            </div>
                        </Modal.Footer>
                    </Modal > */}
                </CardBody>
            </Card>
        </Fragment>
    )
});

export default ProductAffiliate;