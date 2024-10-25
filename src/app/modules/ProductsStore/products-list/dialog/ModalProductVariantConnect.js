import { useQuery } from "@apollo/client";
import _ from 'lodash';
import React, { memo, useMemo, useState, useCallback, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { toAbsoluteUrl } from '../../../../../_metronic/_helpers';
import query_SmeCatalogInventories from "../../../../../graphql/query_ smeCatalogInventories";
import query_getSmeCatalogProductVariantByPk from "../../../../../graphql/query_getSmeCatalogProductVariantByPk";
import query_sme_catalog_product_by_pk from "../../../../../graphql/query_sme_catalog_product_by_pk";
import { formatNumberToCurrency } from "../../../../../utils";
import DeleteProductConnectDialog from "./DeleteProductConnectDialog";
import InfoProduct from "../../../../../components/InfoProduct";
import { useIntl } from "react-intl";
import AuthorizationWrapper from "../../../../../components/AuthorizationWrapper";


const ModalProductVariantConnect = ({
    smeProductVariantId,
    productVariantId,
    targetConnect = 'variant',
    onHide,
    setDataCombo
}) => {
    const { formatMessage } = useIntl();
    const [isRemoveConnect, setRemoveConnect] = useState(false);
    const [inventories, setDataInventories] = useState(null);
    const [smeCatalogProductVariantByPk, setSmeCatalogProductVariantByPk] = useState(null);

    const { data: dataInventories, loading: loadingInventories } = useQuery(query_SmeCatalogInventories, {
        variables: {
            _eq: smeProductVariantId
        }
    });
    const { data, loading } = useQuery(query_getSmeCatalogProductVariantByPk, {
        variables: {
            id: smeProductVariantId
        }
    });

    useEffect(() => {
        if (dataInventories?.sme_catalog_inventories[0]) {
            setDataInventories(dataInventories);
        } else {
            setDataInventories(null);
        }

        if (data?.sme_catalog_product_variant_by_pk) {
            setSmeCatalogProductVariantByPk(data);
        } else {
            setSmeCatalogProductVariantByPk(null);
        }


    }, [dataInventories, data]);

    const assetUrl = useMemo(
        () => {
            if (!smeCatalogProductVariantByPk?.sme_catalog_product_variant_by_pk) return '';

            return smeCatalogProductVariantByPk?.sme_catalog_product_variant_by_pk?.sme_catalog_product_variant_assets[0]?.asset_url
        }, [smeCatalogProductVariantByPk?.sme_catalog_product_variant_by_pk, smeProductVariantId]
    );    

    const _attributes = (data) => {
        const item_attributes = data?.sme_catalog_product?.sme_catalog_product_variants.find(element => element.id == data.id)?.attributes;
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

    const imgAssets = useMemo(() => {
        return _.minBy(smeCatalogProductVariantByPk?.sme_catalog_product_variant_by_pk?.sme_catalog_product?.sme_catalog_product_assets?.filter(_asset => !_asset.is_video).map(__vv => ({ ...__vv, position: __vv.position_show || 0 })), 'position')
    }, [smeCatalogProductVariantByPk?.sme_catalog_product_variant_by_pk?.sme_catalog_product?.sme_catalog_product_assets])


    const onShowRemoveConnect = useCallback(
        () => {
            setRemoveConnect(true);
        }, [isRemoveConnect, setRemoveConnect]
    );

    const [selectedValue, setSelectedValue] = useState({
        variant_attributes: [],
        sme_product_id: '',
        sc_product_id: null,
        sc_variant_id: null,
        sme_variant_id: '',
        action: '',
    });


    return (
        <>
            <DeleteProductConnectDialog
                show={isRemoveConnect}
                onHide={() => setRemoveConnect(false)}
                onHideModal={() => onHide()}
                setDataInventories={(data) => setDataInventories(data)}
                setSmeCatalogProductVariantByPk={(data) => setSmeCatalogProductVariantByPk(data)}
                sme_product_id={selectedValue.sme_product_id}
                sc_product_id={selectedValue.sc_product_id}
                sc_variant_id={selectedValue.sc_variant_id}
                action={selectedValue.action}
            />
            <Modal
                show={!!smeProductVariantId}
                aria-labelledby="example-modal-sizes-title-sm"
                dialogClassName="modal-show-connect-product"
                centered
                onHide={onHide}
                backdrop={true}
            >
                <Modal.Header closeButton={true}>
                    <Modal.Title>
                        {targetConnect == 'product' ? formatMessage({ defaultMessage: 'Sản phẩm' }) : formatMessage({ defaultMessage: 'Hàng hóa' })}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="overlay overlay-block cursor-default" style={{ padding: 0 }}>
                    <i
                        className="fas fa-times"
                        onClick={onHide}
                        style={{ position: 'absolute', top: -45, right: 20, fontSize: 20, cursor: 'pointer' }}
                    />
                    {loading && (
                        <div className='text-center'>
                            <div className="my-8" style={{ paddingRight: 15, paddingTop: 10 }}><span className="spinner spinner-primary mb-8"></span></div>
                        </div>
                    )}
                    {!loading && (
                        <div style={{ padding: '0rem 1rem' }}>
                            <div className='row d-flex flex-column' style={{ borderBottom: '1px solid #dbdbdb', padding: '6px 1rem' }}>
                                {inventories && smeCatalogProductVariantByPk && (<> <div className='col-12' style={{ border: '1px solid #dbdbdb', padding: '8px', borderRadius: 4 }}>
                                    <div style={{ verticalAlign: 'top', display: 'flex', flexDirection: 'row' }}>
                                        <div style={{
                                            backgroundColor: '#F7F7FA',
                                            width: 60, height: 60,
                                            borderRadius: 2,
                                            overflow: 'hidden',
                                            border: 'none',
                                            minWidth: 60
                                        }} className='mr-6' >
                                            {!!(targetConnect == 'product' ? imgAssets?.asset_url : assetUrl) ? (
                                                <img
                                                    src={targetConnect == 'product' ? imgAssets?.asset_url : assetUrl}
                                                    style={{ width: 60, height: 60, objectFit: 'contain' }}
                                                    className={'cursor-pointer'}
                                                    onClick={e => {
                                                        e.preventDefault();
                                                        window.open(`/products/${smeCatalogProductVariantByPk?.sme_catalog_product_variant_by_pk?.is_combo == 1 ? 'edit-combo' : 'edit'}/${smeCatalogProductVariantByPk?.sme_catalog_product_variant_by_pk?.sme_catalog_product?.id}`, '_blank');
                                                    }}
                                                />
                                            ) : null}
                                        </div>
                                        <div>
                                            <InfoProduct
                                                name={smeCatalogProductVariantByPk?.sme_catalog_product_variant_by_pk?.sme_catalog_product?.name}
                                                sku={smeCatalogProductVariantByPk?.sme_catalog_product_variant_by_pk?.sku}
                                                url={`/products/${smeCatalogProductVariantByPk?.sme_catalog_product_variant_by_pk?.is_combo == 1 ? 'edit-combo' : 'edit'}/${smeCatalogProductVariantByPk?.sme_catalog_product_variant_by_pk?.sme_catalog_product?.id}`}
                                                setDataCombo={setDataCombo}
                                                combo_items={smeCatalogProductVariantByPk?.sme_catalog_product_variant_by_pk?.combo_items}
                                            />
                                            {targetConnect != 'product' && (
                                                <>
                                                    {smeCatalogProductVariantByPk?.sme_catalog_product_variant_by_pk?.sme_catalog_product?.sme_catalog_product_variants?.[0]?.attributes?.length > 0 &&
                                                        <p className="mb-1 text-secondary-custom">{_attributes(smeCatalogProductVariantByPk?.sme_catalog_product_variant_by_pk) || ''}</p>
                                                    }
                                                </>
                                            )}
                                            <AuthorizationWrapper keys={['product_store_variant_connect']}>
                                                <div
                                                    style={{ cursor: 'pointer', color: '#f94e30' }}
                                                    onClick={e => {
                                                        e.preventDefault();
                                                        onShowRemoveConnect();
                                                        setSelectedValue(prevState => ({
                                                            ...prevState,
                                                            sc_variant_id: productVariantId,
                                                            action: 'unlink_product_variant'
                                                        }))
                                                    }}
                                                >
                                                    {formatMessage({ defaultMessage: 'Hủy liên kết' })}
                                                </div>
                                            </AuthorizationWrapper>
                                        </div>

                                    </div>
                                </div>
                                </>)}
                                {!inventories && !smeCatalogProductVariantByPk && (<>
                                    <p className="text-center p-5">{formatMessage({ defaultMessage: 'Chưa có hàng hóa' })}</p>
                                </>)}
                                {inventories && smeCatalogProductVariantByPk && (
                                    <>
                                        <div className='col-12 d-flex align-items-center mt-3 p-0'>
                                            <span className='mr-6 text-weight-bold' style={{ fontWeight: 'bold' }}>{formatMessage({ defaultMessage: 'Tồn thực tế' })}: {formatNumberToCurrency(inventories?.sme_catalog_inventories[0]?.stock_actual || 0)}</span>
                                            <span className='mr-6'>{formatMessage({ defaultMessage: 'Tạm giữ' })}: {formatNumberToCurrency(inventories?.sme_catalog_inventories[0]?.stock_allocated || 0)}</span>
                                            <span>{formatMessage({ defaultMessage: 'Sẵn sàng bán' })}: {formatNumberToCurrency((inventories?.sme_catalog_inventories[0]?.stock_available) || 0)}</span>
                                        </div>
                                        <div className='col-12 d-flex align-items-center mt-2 mb-4 p-0'>
                                            <span className='mr-6 text-weight-bold' style={{ fontWeight: 'bold' }}>{formatMessage({ defaultMessage: 'Giá bán' })}: {formatNumberToCurrency(smeCatalogProductVariantByPk?.sme_catalog_product_variant_by_pk?.price || 0)}đ</span>
                                            <span>{formatMessage({ defaultMessage: 'Giá vốn' })}: {formatNumberToCurrency(smeCatalogProductVariantByPk?.sme_catalog_product_variant_by_pk?.cost_price || 0)}đ</span>
                                        </div>
                                    </>
                                )}

                            </div>
                        </div>
                    )}
                </Modal.Body>
            </Modal>
        </>
    )
};

export default memo(ModalProductVariantConnect);