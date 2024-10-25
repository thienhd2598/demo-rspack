import React, { memo, useCallback, useMemo } from 'react';
import HoverImage from '../../../../components/HoverImage'
import InfoProduct from '../../../../components/InfoProduct'
import { useIntl } from 'react-intl'
import SVG from "react-inlinesvg";

export default memo(({
    isCombo, key, item, isBorder, id
}) => {
    const { formatMessage } = useIntl()
    const _attributes = useMemo(() => {

        let attributes = [];
        if (item?.attributes && item?.attributes.length > 0) {
            for (let index = 0; index < item?.attributes.length; index++) {
                const element = item?.attributes[index];
                attributes.push(`${element.sme_catalog_product_attribute_value?.name}`);

            }
            return attributes.join(' - ');
        }
        return null
    }, [item])
    return (
        <div key={key} className='d-flex row w-100 m-0 p-3' style={!!isBorder ? { borderBottom: '0.5px solid #cbced4' } : {}}>
            <div
                className="col-11"
                style={{ verticalAlign: 'top', display: 'flex', flexDirection: 'row' }}
            >
                <div
                    onClick={() => window.open(!!isCombo ? `/products/edit-combo/${item?.sme_catalog_product?.id}` : `/products/edit/${item?.sme_catalog_product?.id}`, '_blank')}
                    style={{
                        backgroundColor: '#F7F7FA',
                        width: 80, height: 80,
                        borderRadius: 8,
                        overflow: 'hidden',
                        minWidth: 80,
                        cursor: 'pointer'
                    }}
                    className='mr-6'
                >
                    {<HoverImage size={{ width: 320, height: 320 }} defaultSize={{ width: 80, height: 80 }} url={item?.sme_catalog_product_variant_assets?.[0]?.asset_url} />}
                </div>
                <div className='w-100'>
                    {!!item?.is_gift && (
                        <div style={{border: '1px solid #FF0000',width: 'max-content',marginBottom: '3px', padding: '5px', borderRadius: '3px'}}>
                        <span style={{color: '#FF0000'}}> {formatMessage({defaultMessage: 'Quà tặng'})}</span>
                     </div>
                    )}
                    
                    <InfoProduct
                        short={true}
                        name={item?.variant_full_name}
                        sku={item?.sku}
                        url={!!isCombo ? `/products/edit-combo/${item?.sme_catalog_product?.id}` : `/products/edit/${item?.sme_catalog_product?.id}`}
                    />

                    {!!_attributes && (
                        <div>
                            {_attributes || ''}
                        </div>
                    )}

                </div>
            </div>
            <div className='col-1 px-0'><span style={{ fontSize: 12 }} className="mr-1">x</span>{item?.quantity_purchased}</div>

        </div>
    )
})