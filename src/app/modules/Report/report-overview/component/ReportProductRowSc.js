import React, { useCallback, useMemo } from 'react'
import { toAbsoluteUrl } from '../../../../../_metronic/_helpers';
import InfoProduct from '../../../../../components/InfoProduct';
import { formatNumberToCurrency } from '../../../../../utils';
import { STATUS_TAB } from '../constants';

const ReportProductRowSc = ({ status_tab, key_row, item }) => {
    const redirectToProductStores = useCallback((id) => {
        window.open(`/product-stores/edit/${id}`, '_blank')
    }, [item])

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
                        {<img src={item?.imgProduct} onClick={() => redirectToProductStores(item?.id)} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <InfoProduct
                            url={() => redirectToProductStores(item?.id)}
                            short={true}
                            name={item?.name}
                            sku={item?.sku}
                            productOrder={true}
                        />
                        <div>
                            {item?.variantName || ''}
                        </div>
                    </div>

                </div>
            </td>
            <td className='text-center'>
                <div className='d-flex align-items-center justify-content-center'>
                    {!!item?.storeProduct ? <>
                        <span><img style={{ width: '20px', height: '20px', marginRight: '4px' }} src={item?.storeProduct?.logo}></img></span>
                        <span>{item?.storeProduct?.name}</span>
                    </> : '--'}

                </div>
            </td>
            <td className='text-center'>
                {formatNumberToCurrency(item?.value)}
                {STATUS_TAB['GMV'] == status_tab && 'đ'}
            </td>
        </tr>
    )
}

export default ReportProductRowSc