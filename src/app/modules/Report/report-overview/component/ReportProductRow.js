import React, { useCallback, useMemo } from 'react'
import { toAbsoluteUrl } from '../../../../../_metronic/_helpers';
import InfoProduct from '../../../../../components/InfoProduct';
import {formatNumberToCurrency} from '../../../../../utils';
import { STATUS_TAB } from '../constants';

const ReportProductRow = ({ status_tab, key_row, item}) => {
    const redirectToProductStores = useCallback((id) => {
        window.open(`/product-stores/edit/${id}`, '_blank')
    }, [item])
    // const selectedStore = useMemo(() => {
    //     return stores?.find(st => st.id == item?.storeId)
    // }, [stores])

    const _attributes = (item_attributes) => {
        let attributes = [];
        if (item_attributes && item_attributes.length > 0) {
          for (let index = 0; index < item_attributes.length; index++) {
            const element = item_attributes[index];
            attributes.push(`${element.sme_catalog_product_attribute_value?.name}`);
          }
          return attributes.join(" - ");
        }
        return null;
      };
    
      const redirect = (item_attributes, id) => {
        return item_attributes.length > 0 ? 
        window.open(`/products/stocks/detail/${id}` || "", "_blank") : window.open(`/products/edit/${id}` || "", "_blank")
      }
    return (
        <tr key={key_row}>
            <td style={{ verticalAlign: 'center' }} className='text-center'>
                {key_row + 1}
            </td>
            <td className='pt-2 pb-1'>
                <div style={{ verticalAlign: 'center', display: 'flex', flexDirection: 'row' }}>
                    <div style={{
                            backgroundColor: '#F7F7FA',
                            width: 80, height: 80,
                            borderRadius: 8,
                            overflow: 'hidden',
                            minWidth: 80,
                            cursor: 'pointer'
                        }}
                        onClick={e => {
                            e.preventDefault();
                        }}
                        className='mr-6'
                    >
                        {<img src={item?.sme_catalog_product_variant_assets?.length && item?.sme_catalog_product_variant_assets[0]?.asset_url} onClick={() => redirect(item?.attributes, item?.id)} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />}
                    </div>
                    <div style={{display: 'flex', flexDirection: 'column'}}>
                        <InfoProduct
                            url={() => redirect(item?.attributes, item?.id)}
                            short={true}
                            name={item?.sme_catalog_product?.name}
                            sku={item?.sku}
                            productOrder={true}
                        />
                        <div style={{ width: "max-content" }}>
                            {_attributes(item?.attributes) || ''}
                        </div>
                    </div>
                    
                </div>
            </td>
           {/* <td className='text-center'>
                <div className='d-flex align-items-center justify-content-center'>
                    {!!selectedStore ? <>
                        <span><img style={{width: '20px', height: '20px', marginRight: '4px'}} src={selectedStore?.logo}></img></span>
                        <span>{selectedStore?.name}</span>
                    </> : '--'}
                    
                </div>
            </td> */}
            <td className='text-center'>
                {formatNumberToCurrency(item?.value)}
                {STATUS_TAB['GMV'] == status_tab && 'đ'}
            </td>
        </tr>
    )
}

export default ReportProductRow