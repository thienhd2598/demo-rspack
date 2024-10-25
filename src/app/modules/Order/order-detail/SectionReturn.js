import React, { useMemo, useRef, useState } from 'react'
import { Card, CardBody } from '../../../../_metronic/_partials/controls'
import { BANKNOTE_SVG, HOME_SVG, IMPORTED, IMPORTED_ALL, MESSAGE_SVG} from './Constant'
import { useIntl } from 'react-intl'
import ImportWarehouseDialog from './ImportWarehouseDialog'
import HoverImage from '../../../../components/HoverImage'
import { formatNumberToCurrency } from '../../../../utils';
import { toAbsoluteUrl } from '../../../../_metronic/_helpers'
import WarehouseImportDelivery from "../fail-delivery-order/WarehouseModal";
import AuthorizationWrapper from '../../../../components/AuthorizationWrapper'
const SectionReturn = ({
    orderDetail,
    currentStatus,
    smeWarehouses,
    warehouseBillInfo,
    refetch
}) => {
    const { formatMessage} = useIntl()
    const [isPause, setIsPause] = useState(true)
    const vidref = useRef(null)
    const [importWarehouseDialog, setImportWarehouseDialog] = useState(false)

    const toggleFullScreenMode = () => {
        if (!document.fullscreenElement) {
            setIsPause(false)
            vidref.current.requestFullscreen()
            vidref.current.play()
        } else {
            document.exitFullscreen()
            setIsPause(true)
        }
    }

    const { ref_id, returnOrder } = orderDetail || {}

    const returnWarehouseImported = useMemo(() => {
        if(currentStatus == 'return') return orderDetail?.returnOrder?.returnWarehouseImport
        if(currentStatus == 'faildelivery') return orderDetail?.returnWarehouseImport
        return {}
    }, [orderDetail, currentStatus])

    const images = useMemo(()=>{
        try {
          return returnOrder?.images ? JSON.parse(returnOrder?.images) : {}
        } catch (error) {
          return null
        }
      }, [orderDetail])

      const videos = useMemo(()=>{
        try {
          return returnOrder?.buyer_videos ? JSON.parse(returnOrder?.buyer_videos) : {}
        } catch (error) {
          return null
        }
      }, [orderDetail])

    const importOrder = useMemo(() => {
        return orderDetail?.returnOrder?.returnOrderItems?.flatMap(returnOrder => {
            const orderItem = orderDetail?.orderItems?.find(order => order?.id == returnOrder?.order_item_id)
            
            return {
                ...returnOrder,
                orderItem
            }
        })
       
    }, [orderDetail])
    
    const nameWarehouseImport = useMemo(() => {
        return smeWarehouses?.find(wh => wh?.id == returnWarehouseImported?.sme_warehouse_id)?.name || '--'
      }, [smeWarehouses, returnWarehouseImported]);  
  return (
    <div>
        {(importWarehouseDialog && currentStatus == 'faildelivery') && (
            <WarehouseImportDelivery dataOrder={{...orderDetail,fulfillment_provider_type: orderDetail?.logisticsPackages[0]?.fulfillment_provider_type}} refetchDetail={refetch} onHide={() => {
                setImportWarehouseDialog(false)
            }}/>
        )}
        {(importWarehouseDialog && currentStatus == 'return') && 
        <ImportWarehouseDialog
         show={importWarehouseDialog} 
         refetchDetail={refetch}
        onHide={() => {
            setImportWarehouseDialog(false)
            refetch()
        }} 
        order={{order: {fulfillment_provider_type: orderDetail?.logisticsPackages[0]?.fulfillment_provider_type},...orderDetail?.returnOrder,returnOrderItems: importOrder }}
        />}
        {currentStatus == 'return' && (
        <div>
            <div className='row mb-4'>
                <div className='col-6'>
                    {formatMessage({defaultMessage: 'Mã đơn hoàn: {ref_id}'}, {ref_id: returnOrder?.ref_return_id || '--'})}
                </div>
                <div className='col-6'>
                {formatMessage({defaultMessage: 'Mã vận đơn trả hàng: {tracking_number}'}, {tracking_number: returnOrder?.tracking_number || '--'})}
                </div>
            </div>
        </div>
        )}
        
        <div style={{background: '#D9D9D980', padding: '5px'}} className='mb-2'>
            <div className='d-flex mb-4 align-items-center'>
                {MESSAGE_SVG}
                <strong className='mx-2'>{formatMessage({defaultMessage: 'Nguyên nhân trả hàng'})}: </strong>
                <strong>{returnOrder?.return_reason || orderDetail?.cancel_reason || '--'}</strong>
            </div>
            {currentStatus == 'return' && (
                <div className='ml-1 row col-12 mb-4'>
                 <span className='col-12'>{formatMessage({defaultMessage: 'Chi tiết: {return_reason_text}'}, {return_reason_text: returnOrder?.return_reason_text || '--'})}</span>
                </div>
            )}
            {currentStatus == 'return' && (
                  <div className='ml-1 row col-12'>
                  <div className='col-6 d-flex align-items-center'>
                      <span>{formatMessage({defaultMessage: 'Hình ảnh'})}: </span>
                      <div style={{display: 'flex', alignItems: 'center', flexWrap: 'wrap'}}>
                          {images?.length ? (images || [])?.map((img, index) => (
                              <HoverImage
                                  styles={{ borderRadius: '4px', border: '1px solid #d9d9d9', cursor: 'pointer', marginRight: 10 }}
                                  size={{ width: 320, height: 320 }}
                                  defaultSize={{ width: 50, height: 50 }}
                                  url={img || ''}
                              />
                          )) : '--'}
                      </div>
                  </div>
                  <div className='col-6 d-flex align-items-center'>
                      <span>Video: </span>
                      <div style={{display: 'flex', alignItems: 'center', flexWrap: 'wrap'}}>
                          {videos?.length ? (videos || [])?.map((videoUrl, index) => (
                             <div onClick={toggleFullScreenMode} style={{ position: 'relative', cursor: 'pointer' }}>
                                  {isPause && <img src={toAbsoluteUrl("/media/play-circle.svg")} alt='' style={{ zIndex: '66', width: '23px', position: 'absolute', left: '50%', top: '50%', transform: "translate(-50%, -50%)" }} />}
                                  <video autoplay={false} style={{ borderRadius: '4px', border: '1px solid #d9d9d9', height: '50px', width: '50px' }} ref={vidref}>
                                      <source src={videoUrl} type="video/mp4" />
                                  </video>
                               </div>
                          )) : '--'}
                      </div>
                  </div>
              </div>
            )}
          
        </div>
        {currentStatus == 'return' && (
          <div className='d-flex justify-content-center'>
              <div style={{background: '#FE56294F',alignItems: 'center',padding: '7px 7px'}} className='row col-12 mb-2'>
            {BANKNOTE_SVG}
            <span className='mx-2'>{formatMessage({defaultMessage: 'Tổng tiền hoàn cho đơn này là'})} </span>
            <span className='text-primary'>{formatNumberToCurrency(orderDetail?.returnOrder?.refund_total)} đ</span>
        </div>
          </div>
        )}
        
        {((currentStatus == 'return' && returnOrder?.tracking_number) || currentStatus == 'faildelivery') && (
            <div style={{background: '#D9D9D980', padding: '5px'}}>
            <div className='d-flex mt-4 align-items-center justify-content-between'>
                <div className='d-flex align-items-center'>
                    {HOME_SVG}
                    <strong className='mx-2'>{formatMessage({defaultMessage: 'Thông tin trả hàng: {status}'}, { status: (orderDetail?.returnOrder?.returnWarehouseImport || orderDetail?.returnWarehouseImport) ? 'Đã nhập kho' : 'Chưa nhập kho'})}</strong>
                </div>
                {((currentStatus == 'return' && !orderDetail?.returnOrder?.returnWarehouseImport) || (currentStatus == 'faildelivery' && !orderDetail?.returnWarehouseImport)) && (
                    <div>
                        <AuthorizationWrapper keys={['refund_order_import_warehouse']}>
                            <button className='btn btn-primary' onClick={() => setImportWarehouseDialog(true)} style={{color: 'white'}}>{formatMessage({defaultMessage: 'Xử lý trả hàng'})}</button>
                        </AuthorizationWrapper>
                    </div>
                )}
             </div>
            {((currentStatus == 'return' && orderDetail?.returnOrder?.returnWarehouseImport) || (currentStatus == 'faildelivery' && orderDetail?.returnWarehouseImport)) && (<>
                <div className='row mb-4 col-12 ml-1 mt-4'>
                <div className='col-6 d-flex'>
                {formatMessage({defaultMessage: 'Kho nhận hàng'})}: <p className='ml-1'>{nameWarehouseImport || '--'}</p>
                </div>
                <div className='col-6 d-flex'>
                {formatMessage({defaultMessage: 'Hình thức'})}: <p className='ml-1'>{[IMPORTED_ALL, IMPORTED]?.includes(returnWarehouseImported?.import_type) ? 'Nhập kho' : 'Không nhập kho'}</p>
                </div>
            </div>
            <div className='row mb-4 col-12 ml-1'>
                <div className='d-flex col-6 align-items-center'>
                    {formatMessage({defaultMessage: 'Hình ảnh'})}: 
                    <div style={{display: 'flex', alignItems: 'center', flexWrap: 'wrap'}}>
                        {(returnWarehouseImported?.import_images || [])?.map((img, index) => (
                            <HoverImage
                                styles={{ borderRadius: '4px', border: '1px solid #d9d9d9', cursor: 'pointer', marginRight: 10 }}
                                size={{ width: 320, height: 320 }}
                                defaultSize={{ width: 50, height: 50 }}
                                url={img || ''}
                            />
                        ))}
                    </div>
                </div>
                <div className='col-6 d-flex align-items-center'>
                    
                    <div className='d-flex col-3 align-items-center'>
                        {formatMessage({defaultMessage: 'Videos'})}: 
                        <div style={{display: 'flex', alignItems: 'center', flexWrap: 'wrap'}}>
                          {returnWarehouseImported?.import_videos?.length ? (returnWarehouseImported?.import_videos || [])?.map((videoUrl, index) => (
                             <div onClick={toggleFullScreenMode} style={{ position: 'relative', cursor: 'pointer' }}>
                                  {isPause && <img src={toAbsoluteUrl("/media/play-circle.svg")} alt='' style={{ zIndex: '66', width: '23px', position: 'absolute', left: '50%', top: '50%', transform: "translate(-50%, -50%)" }} />}
                                  <video autoplay={false} style={{ borderRadius: '4px', border: '1px solid #d9d9d9', height: '50px', width: '50px' }} ref={vidref}>
                                      <source src={videoUrl} type="video/mp4" />
                                  </video>
                               </div>
                          )) : '--'}
                      </div>
                    </div>
                    <div className='d-flex align-items-center'>
                        <div>{formatMessage({defaultMessage: 'Đường dẫn'})}: </div>
                        <input style={{ background: 'white', border: 'none', cursor: 'not-allowed', width: '240px', pointerEvents: 'none' }} value={returnWarehouseImported?.link_video || '--'} className={"form-control"}/>
                    </div>
                </div>
                    
            </div>
            <div className="row mb-4 col-12 ml-1">
                <div style={{wordBreak: 'break-all'}} className='col-6 d-flex align-items-center'>
                    {formatMessage({defaultMessage: 'Ghi chú'})}: {returnWarehouseImported?.import_note || '--'}
                    </div>
                </div>
                <div>
                
            </div>
            <div className='row mb-4 col-12 ml-1'>
                <div className='col-12 d-flex align-items-center'>
                    <span>{formatMessage({defaultMessage: 'Phiếu nhập kho'})}: </span>
                    {warehouseBillInfo?.code && [IMPORTED_ALL, IMPORTED]?.includes(returnWarehouseImported?.import_type) && (
                         <span className="ml-2 text-primary cursor-pointer" onClick={() => window.open(warehouseBillInfo?.url, '_blank')}>
                         {warehouseBillInfo?.code}
                     </span>
                    )}
                   
                </div>
            </div>
            </>)}
        </div>
    
        )}

    </div>
  )
}

export default SectionReturn