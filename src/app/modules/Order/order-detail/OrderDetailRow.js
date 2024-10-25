import React, { memo, useMemo, useCallback } from "react";
import { toAbsoluteUrl } from "../../../../_metronic/_helpers";
import { formatNumberToCurrency } from '../../../../utils';
import _ from 'lodash';
import { useQuery } from "@apollo/client";
import query_sc_product_by_ref_id from '../../../../graphql/query_get_product_by_ref_id';
import InfoProduct from "../../../../components/InfoProduct";
import { useIntl } from 'react-intl';

const OrderDetailRow = memo(({key, order, index}) => {
    const { data: dataProductByPk } = useQuery(query_sc_product_by_ref_id, {
        variables: {
            ref_id: order?.ref_product_id,
        },
        fetchPolicy: 'network-only'
    });
    const {formatMessage} = useIntl()


    return (
        <tr key={key} style={{ borderBottom: '1px solid #D9D9D9', }}>
            <td className='pt-2 pb-1' style={{ verticalAlign: 'top' }}>
                <div style={{ verticalAlign: 'top', display: 'flex', flexDirection: 'row', marginBottom: 16 }}>
                    <div style={{backgroundColor: '#F7F7FA', width: 64, height: 64, borderRadius: 8, overflow: 'hidden', minWidth: 64,  cursor: 'pointer'}}
                        onClick={e => {
                            e.preventDefault();
                        }}
                        className='mr-6'
                    >
                        {<img src={order?.variant_image || ''} style={{ width: 64, height: 64, objectFit: 'contain' }}/>}
                    </div>
                    <div className="w-100">
                    {!!order?.is_gift && (
                        <div style={{border: '1px solid #FF0000',width: 'max-content',marginBottom: '3px', padding: '5px', borderRadius: '3px'}}>
                        <span style={{color: '#FF0000'}}> {formatMessage({defaultMessage: 'Quà tặng'})}</span>
                     </div>
                    )}
                        <InfoProduct
                            name={order?.product_name}
                            sku={order?.variant_sku}
                            url={() => window.open(dataProductByPk?.scGetProduct?.ref_url || '', '_blank')}
                            productOrder={true}
                        />
                        {!!order?.variant_name && (
                            <div>
                                {formatMessage({defaultMessage: 'Phân loại'})}: {order?.variant_name || ''}
                            </div>
                        )}
                    </div>
                </div>
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
    )
});

export default OrderDetailRow;