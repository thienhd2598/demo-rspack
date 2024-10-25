
import dayjs from 'dayjs'
import React from 'react'
import { Modal } from 'react-bootstrap'
import mutate_retryCheckStoreOrderDaily from '../../../../graphql/mutate_retryCheckStoreOrderDaily'
import { useIntl } from 'react-intl'
import { useMutation } from "@apollo/client";
import { useToasts } from 'react-toast-notifications'
import mutate_scOrderLoad from '../../../../graphql/mutate_scOrderLoad'

const RowStoreLack = ({ item }) => {
    const { formatMessage } = useIntl()

    const RETRY_SVG = <svg style={{cursor: 'pointer'}} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF0000" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-rotate-cw"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
    let rangeTimeConvert = [
        dayjs(new Date()).startOf('day').unix(),
        dayjs(new Date()).endOf('day').unix()
      ]?.map(
        _range => new Date(_range * 1000)
      );

    const { addToast } = useToasts()

    const [retryCheckStoreOrderDaily , { loading }] = useMutation(mutate_retryCheckStoreOrderDaily, {
        refetchQueries: ['listOrderCheckingQuantity']
    })

    const [mutateLoadOrder, { loading: loadingUpdate }] = useMutation(mutate_scOrderLoad, {
        refetchQueries: ['listOrderCheckingQuantity']
    })

    const viewAction = () => {
        if(item?.seller_quantity == item?.local_quantity) {
            return (
               <>
                {loadingUpdate ? <div><span className="spinner spinner-primary"></span></div> : (
                     <span onClick={async () => {
                        const {data} = await mutateLoadOrder({
                            variables: {
                                store_id: item.store_id,
                                ref_shop_id: item?.ref_shop_id,
                                connector_channel_code: item?.connector_channel_code,
                                time_range_field: 'order_at',
                                time_to: dayjs(rangeTimeConvert[1]).endOf('day').unix(),
                                time_from: dayjs(rangeTimeConvert[0]).startOf('day').unix()
                            }
                        })
                        if(!!data?.scOrderLoad?.success) {
                            addToast(formatMessage({defaultMessage: 'Cập nhật đơn hàng thành công'}), { appearance: 'success'})
                        } else {
                            addToast(formatMessage({defaultMessage: 'Cập nhật đơn hàng thất bại'}), { appearance: 'error'})
                        }
                    }} 
                        style={{cursor: 'pointer', color: `${item?.seller_quantity !== item?.local_quantity ? '#FF0000' : '#00DB6D'}`}}>
                    {formatMessage({defaultMessage: 'Cập nhật'})}
                    </span>
                )}
               </>
            )
        }
        return (
            <>
                 {loading ? <div><span className="spinner spinner-primary"></span></div> : <div>
                 <span onClick={async () => {
                    const {data} = await retryCheckStoreOrderDaily({
                        variables: {
                            store_id: item?.store_id
                        }
                    })
                    if(!!data?.retryCheckStoreOrderDaily?.success) {
                        addToast(formatMessage({defaultMessage: 'Cập nhật đơn hàng thành công'}), { appearance: 'success'})
                    } else {
                        addToast(formatMessage({defaultMessage: 'Cập nhật đơn hàng thất bại'}), { appearance: 'error'})
                    }
                }} style={{cursor: 'pointer', color: `${item?.seller_quantity !== item?.local_quantity ? '#FF0000' : '#00DB6D'}`}}>
                        {formatMessage({defaultMessage: 'Thiếu đơn'})}
                        {RETRY_SVG}
                    </span>
                    
                 </div>}
            </>
        )
    }
    return (
        <div className='mb-2' style={{borderBottom: '1px solid #d9d9d9', display: 'grid', gridTemplateColumns: '50% 50%', paddingBottom: '4px'}}>
            <div className='d-flex align-items-center mx-2'>
            <span className='mx-2'><img src={item?.img} height="20px" width="20px" alt=""/></span>
            {item?.name}
            </div>
            <div style={{display: 'grid', gridTemplateColumns: '45% 55%', justifyContent: 'flex-end'}}>
            <div className='mx-2 text-right'>
                <span>{item?.seller_quantity} /</span>
                <span style={{color: '#FF0000'}}>{item?.local_quantity}</span>
            </div>
            <div className='mx-2 d-flex align-items-center justify-content-start'>
                <div style={{width: '15px', height: '15px', background: `${item?.seller_quantity == item?.local_quantity ? '#00DB6D' : '#FF0000'}`, borderRadius: '50%'}} className='mx-2'></div>
                {viewAction(item)}
            </div>
        </div>
        </div>
    )
}

const StoreLackOrderDialog = ({listOrderCheckingQuantity, show , onHide}) => {
    const { formatMessage } = useIntl()
    return (
        <div>
        <Modal
            onHide={onHide}
            show={show}
            aria-labelledby="example-modal-sizes-title-lg"
            centered
        >
            <Modal.Body className="overlay overlay-block cursor-default text-center">
                <div>
                    <div style={{borderBottom: '1px solid #d9d9d9',display: 'flex', justifyContent: 'space-between', marginBottom: '6px',paddingBottom: '4px'}}>
                       <span> Ngày: {dayjs(listOrderCheckingQuantity?.at(0)?.created_at).format('DD/MM/YYYY')}</span>
                       <span style={{fontStyle: 'italic'}}> {formatMessage({defaultMessage: 'Cập nhật gần nhất lúc'})}: {dayjs(listOrderCheckingQuantity?.at(0)?.check_time).format('HH:mm DD/MM/YYYY')}</span>
                    </div>
                    {listOrderCheckingQuantity?.map(item => (
                         <RowStoreLack item={item}/>   
                    ))}
                   
                </div>
            </Modal.Body>
        </Modal>
        </div>
    )
}

export default StoreLackOrderDialog

