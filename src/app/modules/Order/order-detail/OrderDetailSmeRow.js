import React, { memo, useMemo, useCallback, useState, Fragment } from "react";
import { toAbsoluteUrl } from "../../../../_metronic/_helpers";
import { formatNumberToCurrency } from '../../../../utils';
import _ from 'lodash';
import { useQuery } from "@apollo/client";
import query_sc_product_by_ref_id from '../../../../graphql/query_get_product_by_ref_id';
import InfoProduct from "../../../../components/InfoProduct";
import { useIntl } from 'react-intl';
import ModalCombo from "../../Products/products-list/dialog/ModalCombo";
import Skeleton from "react-loading-skeleton";
import 'react-loading-skeleton/dist/skeleton.css'
import HoverImage from "../../../../components/HoverImage";

const OrderDetailSmeRow = memo(({
    key, order, index, loadingSmeVariant, smeVariants, smeWarehouseOrder
}) => {
    const smeVariant = smeVariants?.find(variant => variant?.id == order?.sme_variant_id);
    const [dataCombo, setDataCombo] = useState(null);    

    const [imgVariant, linkVariant] = useMemo(() => {
        let imgAssets = null;
        if (smeVariant?.sme_catalog_product_variant_assets?.[0]?.asset_url) {
            imgAssets = smeVariant?.sme_catalog_product_variant_assets[0]
        }

        let url = "";
        if (smeVariant?.is_combo) {
            url = `/products/edit-combo/${smeVariant?.sme_catalog_product?.id}`;
        } else if (smeVariant?.attributes?.length > 0) {
            url = `/products/stocks/detail/${smeVariant?.id}`;
        } else {
            url = `/products/edit/${smeVariant?.sme_catalog_product?.id}`;
        }

        return [imgAssets, url]
    }, [smeVariant]);

    const smeWarehouseInventory = useMemo(() => {
        return smeVariant?.inventories?.find(iv => iv?.sme_store_id == smeWarehouseOrder?.id)
    }, [smeWarehouseOrder, smeVariant]);

    const { formatMessage } = useIntl();

    return (
        <Fragment>
            {!!dataCombo && <ModalCombo
                dataCombo={dataCombo}
                onHide={() => setDataCombo(null)}
            />}            
            <tr key={key} style={{ borderBottom: '1px solid #D9D9D9', }}>
                <td className='pt-2 pb-1' style={{ verticalAlign: 'top' }}>
                    <div style={{ verticalAlign: 'top', display: 'flex', flexDirection: 'row', marginBottom: 16 }}>
                        {loadingSmeVariant && (
                            <Skeleton
                                style={{
                                    width: 60, height: 60, marginRight: 4,
                                    borderRadius: 4, minWidth: 60
                                }}
                                count={1}
                            />
                        )}
                        {!loadingSmeVariant && <div
                            style={{
                                backgroundColor: '#F7F7FA',
                                width: 60, height: 60,
                                borderRadius: 4,
                                overflow: 'hidden',
                                minWidth: 60,
                                cursor: 'pointer'
                            }}
                            onClick={e => {
                                e.preventDefault();
                            }}
                            className='mr-6'
                        >
                            <HoverImage size={{ width: 320, height: 320 }} defaultSize={{ width: 60, height: 60 }} url={imgVariant?.asset_url} />
                        </div>}
                        <div className="w-100 d-flex flex-column">
                            {!!order?.is_gift && (
                                <div style={{ border: '1px solid #FF0000', width: 'max-content', marginBottom: '2px 4px', padding: '5px', borderRadius: '3px' }}>
                                    <span style={{ color: '#FF0000' }}> {formatMessage({ defaultMessage: 'Quà tặng' })}</span>
                                </div>
                            )}
                            <div className="d-flex align-items-start">
                                <InfoProduct
                                    name={smeVariant?.sme_catalog_product?.name}
                                    sku={smeVariant?.sku}
                                    url={linkVariant}
                                    productOrder={false}
                                />
                                {!!smeVariant?.is_combo && <span
                                    style={{ cursor: "pointer" }}
                                    onClick={() => setDataCombo(smeVariant?.combo_items)}
                                    className="ml-4 text-primary"
                                >
                                    Combo
                                </span>}
                            </div>
                            {smeVariant?.attributes?.length > 0 && (
                                <span className="font-weight-normal my-1 text-secondary-custom fs-12">
                                    {smeVariant?.name?.replaceAll(" + ", " - ")}
                                </span>
                            )}
                            <span className="font-weight-normal mb-1 text-secondary-custom fs-12">
                                {formatMessage({ defaultMessage: 'Sẵn sàng bán' })}:{" "}
                                {(smeWarehouseInventory?.stock_available) || 0}
                            </span>
                        </div>
                    </div>
                </td>
                <td style={{ verticalAlign: 'top' }} className='pt-2 pb-1 text-center'>
                    {smeVariant?.unit || '--'}
                </td>
                <td style={{ verticalAlign: 'top' }} className='pt-2 pb-1'>
                    {formatNumberToCurrency(Math.round(order?.original_price / order?.quantity_purchased))}đ
                </td>
                <td style={{ verticalAlign: 'top' }} className='pt-2 pb-1 text-center'>
                    {order?.quantity_purchased || 0}

                </td>
                <td style={{ verticalAlign: 'top' }} className='pt-2 pb-1 text-right'>
                    {formatNumberToCurrency(order?.original_price)}đ
                </td>
            </tr>
        </Fragment>
    )
});

export default OrderDetailSmeRow;