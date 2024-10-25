import React from 'react'
import { TooltipWrapper } from '../../Finance/payment-reconciliation/common/TooltipWrapper'
import { useIntl } from 'react-intl'
import { formatNumberToCurrency } from '../../../../utils'
import { preallocateStatus, typesAction } from './constants'
import { useSelector } from 'react-redux'
import { useToasts } from 'react-toast-notifications'

const RowTable = ({ setDialogWh, mutateUpdateWarehouse, setDialogConfirm, warehouse, mutateEnableWarehouse }) => {
  const { formatMessage } = useIntl()
  const user = useSelector((state) => state.auth.user);
  const {addToast} = useToasts()
  return (
    <tr key={warehouse?.id}>
      <td>
        <div style={{display: 'flex', flexDirection: 'column'}}>
          {warehouse?.name}
          <div className='d-flex align-items-center'>
              <span style={{color: 'gray'}}>{formatMessage({defaultMessage: 'Mã kho'})}: </span>
              <span>{warehouse?.code}</span>
          </div>
        </div>
        
      </td>
      <td className='text-center'>{warehouse?.fulfillment_provider?.name || 'N/A'}</td>
      <td className='text-center'>{formatNumberToCurrency(warehouse?.total_variants)}</td>
      <td>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {!warehouse?.fulfillment_provider_connected_id && (
            <>
              <span className='mb-2'>Phiếu nhập: {warehouse?.inbound_prefix || '--'}</span>
             <span>Phiếu xuất: {warehouse?.outbound_prefix || '--'}</span>
            </>
          )}
          
        </div>
      </td>
      <td>{warehouse?.address || '--'}</td>
      <td>
        <div className='mb-2' style={{ display: 'grid', gridTemplateColumns: '40% auto', gap: '5px 5px', justifyContent: 'center' }}>
          <div className='d-flex align-items-center justify-content-end'>
            <span className='text-right'>{formatMessage({ defaultMessage: 'Kho mặc định' })}</span>
            <TooltipWrapper note={formatMessage({ defaultMessage: "Khi phát sinh đơn hàng, hệ thống sẽ thực hiện trừ tồn ở kho mặc định." })}>
              <i className="fas fa-info-circle fs-14 ml-2"></i>
            </TooltipWrapper>
          </div>
          <span className="switch" style={{ transform: 'scale(0.8)' }}>
            <label>
              <input
                type={'checkbox'}
                disabled={user?.is_subuser && !['warehouse_action']?.some(key => user?.permissions?.includes(key)) || warehouse?.status == 0}
                style={{ background: '#F7F7FA', border: 'none' }}
                checked={!!warehouse?.is_default}
                onChange={() => {
                  setDialogConfirm({
                    isOpen: true,
                    idWh: warehouse?.id,
                    title: formatMessage({ defaultMessage: 'Chú ý: Bạn chỉ có thể chọn một kho mặc định tại một thời điểm. Khi bạn chọn một kho mới, kho mặc định trước đó sẽ tự động bị tắt.' }),
                    typeAction: typesAction['SET_DEFAULT_WAREHOUSE']
                  })
                }}
              />
              <span></span>
            </label>
          </span>
        </div>
          {!warehouse?.fulfillment_provider_connected_id && (
            <div style={{ display: 'grid', gridTemplateColumns: '40% auto', gap: '5px 5px', justifyContent: 'center' }}>
            <div className='d-flex align-items-center justify-content-end'>
              <span className='text-right'>{formatMessage({ defaultMessage: 'Tồn âm' })}</span>
              <TooltipWrapper note={formatMessage({ defaultMessage: "Khi hàng hoá tạm thời không còn trong kho, đơn hàng vẫn sẽ được tiếp tục xử lý." })}>
                <i className="fas fa-info-circle fs-14 ml-2"></i>
              </TooltipWrapper>
            </div>
            <span className="switch" style={{ transform: 'scale(0.8)' }}>
              <label>
                <input
                  type={'checkbox'}
                  disabled={user?.is_subuser && !['warehouse_action']?.some(key => user?.permissions?.includes(key))}
                  onChange={async () => {
                    if (!!warehouse?.allow_preallocate) {
                      setDialogConfirm({
                        isOpen: true,
                        idWh: warehouse?.id,
                        title: formatMessage({ defaultMessage: 'Khi tắt tồn âm sẽ không thể tiếp tục xử lý các đơn hàng có hàng hoá không còn trong kho.' }),
                        typeAction: typesAction['UPDATE_PREALLOCATE'],
                        preallocateType: !!warehouse?.allow_preallocate ? preallocateStatus['NOT_ALLOW_PREALLOCATE'] : preallocateStatus['ALLOW_PREALLOCATE']
                      })
                      return
                    }
  
                    await mutateUpdateWarehouse({
                      variables: {
                        userUpdateWarehouseInput: {
                          id: warehouse?.id,
                          allow_preallocate: !!warehouse?.allow_preallocate ? preallocateStatus['NOT_ALLOW_PREALLOCATE'] : preallocateStatus['ALLOW_PREALLOCATE']
                        }
                      }
                    })
                  }}
                  style={{ background: '#F7F7FA', border: 'none' }}
                  checked={!!warehouse?.allow_preallocate}
                />
                <span></span>
              </label>
            </span>
          </div>
          )}  
        
      </td>
      <td>
        <div className='d-flex align-items-center justify-content-center'>
          <span className="switch" style={{ transform: 'scale(0.8)' }}>
              <label>
                <input
                  type={'checkbox'}
                  disabled={user?.is_subuser && !['warehouse_action']?.some(key => user?.permissions?.includes(key)) || (warehouse?.is_default &&  warehouse?.status == 10)}
                  style={{ background: '#F7F7FA', border: 'none' }}
                  checked={warehouse?.status == 10}
                  onChange={ async () => {
                    const {data} = await mutateEnableWarehouse({
                      variables : {
                        id: warehouse?.id,
                        isEnable: warehouse?.status == 10 ? false : true
                      }
                    })
                    if (!!data?.userEnableWarehouse?.success) {
                      addToast(formatMessage({defaultMessage: 'Cập nhật trạng thái kho thành công'}), { appearance: 'success' })
                    } else {
                      addToast(data?.userEnableWarehouse?.message, { appearance: 'error' })
                    }
                  }}
                />
                <span></span>
              </label>
            </span>
          </div>
      </td>
      <td className='text-center'>
        <button onClick={setDialogWh} className='btn btn-primary'>{formatMessage({ defaultMessage: 'Cập nhật' })}</button>
      </td>
    </tr>
  )
}

export default RowTable