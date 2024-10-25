import React, { memo, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Modal } from "react-bootstrap";
import { useMutation, useQuery } from "@apollo/client";
import { useToasts } from 'react-toast-notifications';
import query_sme_catalog_product_variant from '../../../../graphql/query_sme_catalog_product_variant';
import mutate_coLinkSmeProductOrder from '../../../../graphql/mutate_coLinkSmeProductOrder';
import Pagination from '../../../../components/PaginationModal';
import _ from 'lodash';
import { Formik } from 'formik';
import { toAbsoluteUrl } from '../../../../_metronic/_helpers';
import ModalCombo from '../../Products/products-list/dialog/ModalCombo';
import InfoProduct from '../../../../components/InfoProduct';
import { useIntl } from 'react-intl';
const OrderSelectProductVariant = memo(({
    show,
    onHide,
    scVariantSku,
    order_item_id,
    setOrderItemVariant,
    orderItemVariant,
    indexOrderItem
}) => {
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const { addToast } = useToasts();
    const [nameSearch, setNameSearch] = useState('');
    const refInput = useRef(null);
    const [dataCombo, setDataCombo] = useState(null);
    const { formatMessage } = useIntl()

    let limit = 25;

    const { data: dataProductVariant, loading: loadingProductVariant } = useQuery(query_sme_catalog_product_variant, {
        variables: {
            limit,
            offset: (page - 1) * limit,
            order_by: {
                updated_at: 'desc'
            },
            where: {
                _and: {
                    _or: [{ sme_catalog_product: { name: { _ilike: `%${nameSearch.trim()}%` } } }, { sku: { _ilike: `%${nameSearch.trim()}%` } }],
                },
                product_status_id: {_is_null: true}
            }
        },
        fetchPolicy: 'cache-and-network'
    });

    let totalRecord = dataProductVariant?.sme_catalog_product_variant_aggregate?.aggregate?.count || 0
    let totalPage = Math.ceil(totalRecord / limit)

    const _attributes = (item_attributes) => {

        let attributes = [];
        if (item_attributes && item_attributes.length > 0) {
            for (let index = 0; index < item_attributes.length; index++) {
                const element = item_attributes[index];
                attributes.push(`${element.sme_catalog_product_attribute_value?.name}`);

            }
            return attributes.join(' - ');
        }
        return null
    }

    useMemo(() => {
        if (!show) {
            setPage(1);
            setNameSearch('');
        }
    }, [show]);

    return (
        <Modal
            show={show}
            aria-labelledby="example-modal-sizes-title-sm"
            centered
            onHide={onHide}
            dialogClassName={'body-dialog-connect'}
        >
            <Modal.Body className="overlay overlay-block cursor-default" style={{ padding: 0 }}>

                <Formik
                    initialValues={{
                        status: "", // values => All=""/Selling=0/Sold=1
                        condition: "", // values => All=""/New=0/Used=1
                        searchText: "",
                    }}
                    onSubmit={(values) => {
                    }}
                >
                    {({
                        values,
                        handleSubmit,
                        handleBlur,
                        handleChange,
                        setFieldValue,
                    }) => (
                        <form onSubmit={handleSubmit} className="form form-label-right">
                            <div className="form-group mb-0">
                                <div className="text-center" style={{ fontSize: 18, fontWeight: 'bold', margin: '1rem 2rem 1rem 2rem' }}>
                                    {formatMessage({ defaultMessage: 'CHỌN HÀNG HÓA KHO' })}
                                </div>
                                <i
                                    className="ki ki-bold-close icon-md text-muted"
                                    style={{ position: 'absolute', top: 10, right: 10, cursor: 'pointer' }}
                                    onClick={e => {
                                        e.preventDefault();
                                        onHide();
                                    }}
                                ></i>
                                <div style={{ margin: '0rem 2rem 1rem 2rem' }}>
                                    <div className="input-icon">
                                        <input
                                            ref={refInput}
                                            type="text"
                                            style={{ paddingLeft: 'calc(1.5em + 1.3rem + 8px)' }}
                                            className="form-control"
                                            placeholder={formatMessage({ defaultMessage: "Tên sản phẩm/SKU" })}
                                            onBlur={(e) => {
                                                setNameSearch(e.target.value)
                                            }}
                                            defaultValue={nameSearch}
                                            onKeyDown={e => {
                                                if (e.keyCode == 13) {
                                                    setNameSearch(e.target.value)
                                                }
                                            }}
                                        />
                                        <span><i className="flaticon2-search-1 icon-md ml-6"></i></span>
                                    </div>
                                    <div className='d-flex mt-4'>
                                        <span className='mr-2' style={{ minWidth: 135 }}>{formatMessage({ defaultMessage: 'Tìm kiếm nhanh theo' })}:</span>
                                        <div className='d-flex flex-column text-primary cursor-pointer' style={{ fontSize: 14 }}>
                                            <span
                                                onClick={() => {
                                                    refInput.current.value = scVariantSku
                                                    setPage(1);
                                                    setNameSearch(scVariantSku)
                                                }}
                                            >
                                                {scVariantSku}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <span className='' style={{ margin: '0rem 2rem 1rem 2rem', fontSize: 14 }}>{formatMessage({ defaultMessage: 'Gợi ý hàng hóa kho' })}</span>
                                <div
                                    style={{
                                        maxHeight: 400, overflowY: 'auto',
                                        minHeight: loadingProductVariant ? 400 : 0,
                                        paddingTop: 20
                                    }}
                                >
                                    {
                                        loadingProductVariant && <div className='text-center w-100 mt-4' style={{ position: 'absolute' }} >
                                            <span className="ml-3 spinner spinner-primary"></span>
                                        </div>
                                    }
                                    {(dataProductVariant?.sme_catalog_product_variant || []).map(
                                        (_item, index) => {

                                            let __assets = _item.sme_catalog_product_variant_assets[0]

                                            return (
                                                <div
                                                    style={dataProductVariant?.sme_catalog_product_variant?.length - 1 == index ? { padding: '0rem 1rem 0rem 1rem' } : { padding: '0rem 1rem 1rem 1rem' }}
                                                    key={`choose-connect-${index}`}
                                                >
                                                    <div className='row' style={{ borderBottom: '1px solid #dbdbdb', padding: '6px 1rem 0px', alignItems: 'center' }}>
                                                        <div className='col-10'>
                                                            <div style={{ verticalAlign: 'top', display: 'flex', flexDirection: 'row', marginBottom: 16 }}>
                                                                <div style={{
                                                                    backgroundColor: '#F7F7FA',
                                                                    width: 60, height: 60,
                                                                    borderRadius: 2,
                                                                    overflow: 'hidden',
                                                                    border: 'none',
                                                                    minWidth: 60
                                                                }} className='mr-6' >
                                                                    {
                                                                        !!__assets ? <img src={__assets.asset_url}
                                                                            style={{ width: 50, height: 50, objectFit: 'contain' }} /> : null
                                                                    }
                                                                </div>
                                                                <div>
                                                                    <InfoProduct
                                                                        name={_item?.sme_catalog_product?.name}
                                                                        sku={_item?.sku}
                                                                        url={`/products/${_item?.sme_catalog_product?.is_combo == 1 ? 'edit-combo' : 'edit'}/${_item?.sme_catalog_product?.id}`}
                                                                        combo_items={_item.combo_items}
                                                                    />
                                                                    {_item?.attributes?.length > 0 && (
                                                                        <div className='d-flex align-items-center fs-12 text-secondary-custom'>
                                                                            {_attributes(_item?.attributes) || '--'}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                {/* <div className='d-flex flex-column'>
                                                                            <span className='font-weight-normal mb-1' style={{ fontSize: 14 }} >{_item?.sme_catalog_product?.name || ''}
                                                                                {
                                                                                    _item?.is_combo == 1 && (
                                                                                        <span onClick={() => setDataCombo(_item.combo_items)} className='text-primary cursor-pointer ml-2'>Combo</span>
                                                                                    )
                                                                                }
                                                                            </span>

                                                                            <span className='mb-1'>
                                                                                <img className='mr-2' src={toAbsoluteUrl('/media/ic_sku.svg')} />  <span>{_item?.sku || '--'}</span>
                                                                            </span>
                                                                            {_item?.attributes?.length > 0 && (
                                                                                <span className='d-flex align-items-center fs-12 text-secondary-custom'>
                                                                                    {_attributes(_item?.attributes) || '--'}
                                                                                </span>
                                                                            )}
                                                                        </div> */}
                                                            </div>
                                                        </div>
                                                        <div className="col-2 d-flex justify-content-end">
                                                            <span
                                                                className="text-primary font-weight-bold text-right"
                                                                style={{ cursor: 'pointer', paddingBottom: 10 }}
                                                                onClick={e => {
                                                                    e.preventDefault();
                                                                    setOrderItemVariant(prev => prev.concat([
                                                                        { ..._item, orderItemIdMapped: order_item_id }
                                                                    ]));
                                                                    onHide();
                                                                }}
                                                            >
                                                                {formatMessage({ defaultMessage: 'Chọn' })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        }
                                    )}
                                </div>
                                <div style={{ padding: '1rem 1rem 1rem 1rem', boxShadow: 'rgb(0 0 0 / 20%) 0px -2px 2px -2px' }}>
                                    <Pagination
                                        page={page}
                                        totalPage={totalPage}
                                        loading={loadingProductVariant}
                                        limit={limit}
                                        totalRecord={totalRecord}
                                        count={dataProductVariant?.sme_catalog_product_variant?.length}
                                        onPanigate={(page) => setPage(page)}
                                        // basePath={`/products/edit/${smeId}/affiliate`}
                                        emptyTitle={formatMessage({ defaultMessage: 'Chưa có sản phẩm nào' })}
                                    />
                                </div>
                            </div>
                        </form>
                    )}
                </Formik>
            </Modal.Body>

            <ModalCombo
                dataCombo={dataCombo}
                onHide={() => setDataCombo(null)}
            />
        </Modal >
    )
});

export default OrderSelectProductVariant;
