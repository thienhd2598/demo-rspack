import React, { memo, useCallback, useMemo, useState } from 'react';
import { useQuery } from "@apollo/client";
import query_sc_product_by_ref_id from '../../../../graphql/query_get_product_by_ref_id';
import { toAbsoluteUrl } from '../../../../_metronic/_helpers'
import { useIntl } from 'react-intl'
import SVG from "react-inlinesvg";
import InfoProduct from '../../../../components/InfoProduct';
import HoverImage from '../../../../components/HoverImage';
import ModalCombo from '../../Products/products-list/dialog/ModalCombo';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css'

export default memo(({
    errOrder, smeVariant, loadingSmeVariant, isGift, key, quantity_purchased, isBorder
}) => {
    const { formatMessage } = useIntl();
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

    return (
        <div key={key} className='d-flex row w-100 m-0 p-2' style={!!isBorder ? { borderBottom: '0.5px solid #cbced4' } : {}}>
            {!!dataCombo && <ModalCombo
                dataCombo={dataCombo}
                onHide={() => setDataCombo(null)}
            />}
            <div
                className="col-11"
                style={{ verticalAlign: 'top', display: 'flex', flexDirection: 'row' }}
            >
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
                    {
                        <HoverImage size={{ width: 320, height: 320 }} defaultSize={{ width: 60, height: 60 }} url={imgVariant?.asset_url} />
                    }
                </div>}
                <div style={{ flex: 1 }}>
                    {!!isGift && (
                        <div style={{ border: '1px solid #FF0000', width: 'max-content', marginBottom: '3px', padding: '2px 4px', borderRadius: '3px' }}>
                            <span style={{ color: '#FF0000' }}> {formatMessage({ defaultMessage: 'Quà tặng' })}</span>
                        </div>
                    )}
                    <div className='d-flex w-100'>
                        {!loadingSmeVariant && (
                            <div className='d-flex flex-column'>
                                <InfoProduct
                                    short={true}
                                    sku={smeVariant?.sku}
                                    name={smeVariant?.sme_catalog_product?.name}
                                    url={linkVariant}
                                    productOrder={false}
                                />
                                {!!smeVariant?.attributes?.length > 0 && <span className='font-weight-normal text-secondary-custom' >{smeVariant?.name?.replaceAll(' + ', ' - ')}</span>}
                            </div>
                        )}
                        {loadingSmeVariant && (
                            <div className='d-flex flex-column' style={{ flex: 1 }}>
                                <Skeleton style={{ height: 15 }} count={2} />
                            </div>
                        )}
                        {smeVariant?.combo_items?.length > 0 && (
                            <span
                                className='text-primary cursor-pointer ml-2'
                                style={{ minWidth: 'fit-content' }}
                                onClick={() => setDataCombo(smeVariant?.combo_items)}
                            >
                                Combo
                            </span>)}
                    </div>
                </div>
            </div>
            <div className='col-1 px-0'><span style={{ fontSize: 12 }} className="mr-1">x</span>{quantity_purchased || 0}</div>
            {errOrder ?
                <tr className='col-12 mt-1' style={{ background: 'rgba(254, 86, 41, 0.31)' }}>
                    <td className='remove_border_color py-2' colSpan={12}>
                        <div className='d-flex'>
                            <SVG src={toAbsoluteUrl("/media/svg/ic-warning.svg")} /> <span style={{ color: '#F80D0D', wordBreak: 'break-word' }} className='ml-4'>{formatMessage({ defaultMessage: 'Lỗi' })}: {errOrder}</span>
                        </div>

                    </td>
                </tr> : null}
        </div>
    )
})