import { useQuery } from "@apollo/client";
import _ from 'lodash';
import React, { memo, useCallback, useMemo, useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { toAbsoluteUrl } from '../../../../../_metronic/_helpers';

import query_sme_catalog_product_by_pk from "../../../../../graphql/query_sme_catalog_product_by_pk";
import DeleteProductConnectDialog from "./DeleteProductConnectDialog";
import InfoProduct from "../../../../../components/InfoProduct";
import { useIntl } from "react-intl";
import AuthorizationWrapper from "../../../../../components/AuthorizationWrapper";

const ModalProductConnect = ({
    smeProductId,
    productId,
    onHide,
    setDataCombo
}) => {
    const { formatMessage } = useIntl();
    const [smeCatalogProductByPk, setSmeCatalogProductByPk] = useState(null);

    const { data, loading } = useQuery(query_sme_catalog_product_by_pk, {
        variables: {
            id: smeProductId
        }
    });

    useEffect(() => {

        if (data?.sme_catalog_product_by_pk) {
            setSmeCatalogProductByPk(data);
        } else {
            setSmeCatalogProductByPk(null);
        }

    }, [data]);

    const [isRemoveConnect, setRemoveConnect] = useState(false);
    const imgAssets = useMemo(() => {
        return _.minBy(smeCatalogProductByPk?.sme_catalog_product_by_pk?.sme_catalog_product_assets?.filter(_asset => !_asset.is_video).map(__vv => ({ ...__vv, position: __vv.position_show || 0 })), 'position')
    }, [smeCatalogProductByPk?.sme_catalog_product_by_pk?.sme_catalog_product_assets])

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
                setSmeCatalogProductByPk={(data) => setSmeCatalogProductByPk(data)}
                sme_product_id={selectedValue.sme_product_id}
                sc_product_id={selectedValue.sc_product_id}
                sc_variant_id={selectedValue.sc_variant_id}
                action={selectedValue.action}
            />
            <Modal
                show={!!smeProductId}
                aria-labelledby="example-modal-sizes-title-sm"
                dialogClassName="modal-show-connect-product"
                centered
                onHide={onHide}
                backdrop={true}
            >
                <Modal.Header closeButton={true}>
                    <Modal.Title>
                        {formatMessage({ defaultMessage: 'Sản phẩm'})}
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
                        <div
                            style={{ padding: '0rem 1rem' }}
                        >
                            <div className='row' style={{ borderBottom: '1px solid #dbdbdb', padding: '6px 1rem', alignItems: 'center' }}>
                                <div className='col-12'>

                                    {smeCatalogProductByPk && (
                                        <div style={{ verticalAlign: 'top', display: 'flex', flexDirection: 'row' }}>
                                            <div style={{
                                                backgroundColor: '#F7F7FA',
                                                width: 60, height: 60,
                                                borderRadius: 2,
                                                overflow: 'hidden',
                                                border: 'none',
                                                minWidth: 60
                                            }} className='mr-6' >
                                                <img
                                                    src={imgAssets?.asset_url}
                                                    className={'cursor-pointer'}
                                                    style={{ width: 60, height: 60, objectFit: 'contain' }}
                                                    onClick={e => {
                                                        e.preventDefault();
                                                        window.open(`/products/${smeCatalogProductByPk?.sme_catalog_product_by_pk?.is_combo == 1 ? 'edit-combo' : 'edit'}/${smeCatalogProductByPk?.sme_catalog_product_by_pk?.id}`, '_blank');
                                                    }}
                                                />
                                            </div>
                                            <div>

                                            <InfoProduct
                                                name={smeCatalogProductByPk?.sme_catalog_product_by_pk?.name}
                                                sku={smeCatalogProductByPk?.sme_catalog_product_by_pk?.sku}
                                                url={`/products/${smeCatalogProductByPk?.sme_catalog_product_by_pk?.is_combo == 1 ? 'edit-combo' : 'edit'}/${smeCatalogProductByPk?.sme_catalog_product_by_pk?.id}`}
                                                setDataCombo={setDataCombo}
                                                combo_items={smeCatalogProductByPk?.sme_catalog_product_by_pk?.combo_items}
                                            />
                                                {/* <div>
                                                    <span
                                                        className='font-weight-bold mb-1 '
                                                        style={{ fontSize: 16,  cursor: 'pointer'  }}
                                                        onClick={e => {
                                                            e.preventDefault();
                                                            window.open(`/products/${smeCatalogProductByPk?.sme_catalog_product_by_pk?.is_combo == 1 ? 'edit-combo' : 'edit'}/${smeCatalogProductByPk?.sme_catalog_product_by_pk?.id}`, '_blank');
                                                        }}
                                                    >
                                                        {smeCatalogProductByPk?.sme_catalog_product_by_pk?.name || ''}

                                                    </span>
                                                    {
                                                        smeCatalogProductByPk?.sme_catalog_product_by_pk?.is_combo == 1 && (
                                                            <span onClick={() => setDataCombo(smeCatalogProductByPk?.sme_catalog_product_by_pk?.combo_items)} className='text-primary cursor-pointer ml-2'>Combo</span>
                                                        )
                                                    }
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center' }} >
                                                    <p style={{ fontSize: 12 }} className="text-secondary-custom">
                                                        <img className='mr-2' src={toAbsoluteUrl('/media/ic_sku.svg')} />
                                                        <span>{smeCatalogProductByPk?.sme_catalog_product_by_pk?.sku || '--'}</span>
                                                    </p>
                                                </div> */}

                                                <AuthorizationWrapper keys={['product_store_connect']}>
                                                    <div
                                                        style={{ cursor: 'pointer', color: '#f94e30' }}
                                                        onClick={e => {
                                                            e.preventDefault();
                                                            onShowRemoveConnect();
                                                            setSelectedValue(prevState => ({
                                                                ...prevState,
                                                                sme_product_id: smeCatalogProductByPk?.sme_catalog_product_by_pk?.id,
                                                                sc_product_id: productId,
                                                                action: 'unlink_product'
                                                            }))
                                                        }}
                                                    >
                                                        {formatMessage({ defaultMessage: 'Hủy liên kết'})}
                                                    </div>
                                                </AuthorizationWrapper>
                                            </div>
                                        </div>
                                    )}

                                    {!smeCatalogProductByPk && (
                                        <p className="text-center p-5">{formatMessage({ defaultMessage: 'Chưa có sản phẩm'})}</p>

                                    )}

                                </div>
                            </div>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer className="form" style={{ borderTop: '1px solid #dbdbdb', justifyContent: 'end', paddingTop: 10, paddingBottom: 10 }} >
                    {/* <div className="form-group">
                        <button
                            type="button"
                            onClick={onHide}
                            className="btn btn-primary btn-elevate mr-3"
                            style={{ width: 100 }}
                        >
                            OK
                        </button>
                    </div> */}
                </Modal.Footer>
            </Modal>
        </>
    )
};

export default memo(ModalProductConnect);