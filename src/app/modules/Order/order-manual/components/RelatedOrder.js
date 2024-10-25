import React, { useEffect, useMemo, useState } from 'react'
import { useIntl } from 'react-intl';
import { Card, CardBody, CardHeader } from '../../../../../_metronic/_partials/controls';
import { formatNumberToCurrency } from '../../../../../utils';
import InfoProduct from '../../../../../components/InfoProduct';
import { useFormikContext } from 'formik';
import { useQuery } from '@apollo/client';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css'
import query_scGetOrder from '../../../../../graphql/query_scGetOrder';
import { queryGetSmeProductVariants } from '../../OrderUIHelpers';

const RelatedOrder = ({ isSale, loading, orders }) => {
    const { formatMessage } = useIntl();
    const { values } = useFormikContext()
    const [variantsOrder, setVariantsOrder] = useState([])
    const [loadingVariant, setLoadingVariant] = useState(false)

    const { data: orderDetail, loading: loadingDetail } = useQuery(query_scGetOrder, {
        variables: {
            id: isSale ? Number(orders?.id) : Number(orders?.related_order_id)
        },
        fetchPolicy: 'cache-and-network',
        onCompleted: async (data) => {
            setLoadingVariant(true)
            const smeVariants = await queryGetSmeProductVariants(data?.findOrderDetail?.orderItems?.flatMap(item => item?.sme_variant_id));
            setLoadingVariant(false)
            setVariantsOrder(smeVariants);
            
        }
    });

    const relatedOrder = useMemo(() => {
        return isSale ? orders : orderDetail?.findOrderDetail
    }, [orderDetail, orders, isSale])
    
  return (
    <Card>
            {loading && <div style={{ position: 'absolute', top: '50%', left: '50%', zIndex: 99 }}>
                <span className="spinner spinner-primary" />
            </div>}
            <CardHeader
                className="ml-auto"
                title={formatMessage({ defaultMessage: 'Đơn hàng liên quan' })}
            />
            <CardBody className="px-4 py-4">
                

            <div className="col-12">
                <div className="d-flex justify-content-end mb-2">
                    <div className="d-flex align-items-center">
                        <span>{formatMessage({ defaultMessage: 'Mã đơn hàng' })}:</span>
                        {loadingDetail ? <Skeleton style={{ width: 160, height: 30, marginRight: 4,borderRadius: 8}} count={1}/> : 
                            <span onClick={() => {
                                if (relatedOrder?.status == 'PENDING' && relatedOrder?.source == 'manual') return;
                                window.open(`/orders/${relatedOrder?.id}`, "_blank")
                            }} className='cursor-pointer ml-2 text-primary'>{relatedOrder?.ref_id}</span>}
                    </div>
                </div>
                {(loadingDetail || loadingVariant) ? (
                     <Skeleton style={{ width: 300, height: 190,borderRadius: 8}} count={1}/>
                ) : (
                    <table className="table product-list table-border table-borderless table-vertical-center fixed">
                    <thead style={{ borderRight: "1px solid #d9d9d9",borderLeft: "1px solid #d9d9d9"}}>
                        <tr className="font-size-lg">
                        <th style={{ fontSize: "14px" }} width="70%">
                            {formatMessage({ defaultMessage: "Hàng hóa kho" })}
                        </th>
                        <th style={{ fontSize: "14px" }}>
                            {formatMessage({ defaultMessage: "Số lượng" })}
                        </th>
                        </tr>
                    </thead>
                    <tbody>
                        {variantsOrder?.map(order => {
                            const orderItem = relatedOrder?.orderItems?.find(item => item?.sme_variant_id == order?.id)
                             return (
                                <tr>
                                <td>
                                <div>
                                <InfoProduct
                                    name={order?.sme_catalog_product?.name}
                                    isSingle
                                    productOrder={true}
                                    sku={order?.sku}
                                    combo_items={order?.combo_items}
                                />
                                <span>{order?.attributes?.length ? order?.name : ''}</span>
                                </div>
                                </td>
                                <td className='text-center'>{orderItem?.quantity_purchased}</td>
                            </tr>
                             )
                        })}
                       
                    </tbody>
                    </table>
                )}
              
            </div>

                
                <div className="row mt-5">
                    <div className="col-7">
                        <span className="float-right">{formatMessage({ defaultMessage: 'Tổng tiền đơn hàng' })}:</span>
                    </div>
                    {loadingDetail ? (
                        <Skeleton style={{ width: 120, height: 30,borderRadius: 8}} count={1}/>
                    ) : (
                        <div className="col-5">
                            <span style={{wordBreak: 'break-all'}} className="float-right">
                            {formatNumberToCurrency(relatedOrder?.paid_price)}đ
                        </span>
                    </div>
                    )}
                  
                </div>
                <div className="my-4" style={{ height: 1, border: '1px solid #ebedf3' }}></div>
                <div className='row mt-5 d-flex'>
                    <span className='text-primary'>*</span>
                    <span style={{fontStyle: 'italic'}}>{formatMessage({ defaultMessage: 'Ghi chú người bán: '})} {values['note_step1']}</span>
                </div>
            </CardBody>
        </Card>
  )
}

export default RelatedOrder