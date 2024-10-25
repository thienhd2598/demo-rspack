import React, { memo, useMemo } from 'react'
import { formatNumberToCurrency } from '../../../../../../../utils'
import dayjs from 'dayjs'
import { Checkbox } from '../../../../../../../_metronic/_partials/controls'
import { toAbsoluteUrl } from '../../../../../../../_metronic/_helpers'
import { TooltipWrapper } from '../../../common/TooltipWrapper'
import { useIntl } from 'react-intl'

export const detailOrder = (id) => {
  return window.open(
 `/orders/${id}` || "",
 "_blank"
);
}

const RowTable = ({ setSelectDetailsOrder, settlement_abnormal_status, tab_type, isSelected, setIds, ids, order, stores }) => {
  const { formatMessage } = useIntl()

  const selectStore = useMemo(() => 
       stores?.find((store => store.id == order?.store_id)),
   [stores, order])

   const checkNegativeNumber = (number) => {
      return formatNumberToCurrency(number) !== 0 ? formatNumberToCurrency(number * -1) : 0
   }

  return (
    <>
      <tr>
        <td className='text-center'>
            <div className='d-flex'>
            <Checkbox
              size="checkbox-md"
              inputProps={{
                "aria-label": "checkbox",
              }}
              isSelected={isSelected}
              onChange={(e) => {
                if (isSelected) {
                  setIds((prev) =>
                    prev.filter((_id) => _id.id != order.id)
                  );
                } else {
                  setIds((prev) => prev.concat([order]));
                }
              }}
            />
            <span style={{cursor: 'pointer'}} onClick={() => detailOrder(order?.order_id)}>{order?.order_ref_id}</span>
            </div>
        </td>
        <td className='text-center'>
          <div className='d-flex align-items-center justify-content-center'>
            <span><img style={{width: '20px', height: '20px', marginRight: '4px'}} src={selectStore?.url}></img></span>
            <span>{selectStore?.name}</span>
          </div>
        </td>
        {tab_type == 'PROCESSED' &&  <td className='text-center'>
            {formatNumberToCurrency(order?.settlement_amount)}đ
          </td>}
        <td className='text-center'>
          {formatNumberToCurrency(order?.settlement_amount_estimate)}đ
        </td>
        {tab_type == 'PROCESSED' &&  <td className='text-center'>
          <div className='d-flex align-items-center justify-content-center'>
          {formatNumberToCurrency(order?.settlement_amount_adjustment)}đ
          {(order?.status == 'PROCESSED' && (order?.settlement_type_selected == 1 || order?.settlement_type_selected == 2)) && 
            <TooltipWrapper note={formatMessage({defaultMessage:"Chi tiết phiếu đã xử lý bất thường."})}>
               <img style={{cursor: 'pointer'}} onClick={() => setSelectDetailsOrder(order)} className="ml-3" src={toAbsoluteUrl('/media/svg/tick.svg')} alt=""></img>
            </TooltipWrapper>}
          </div>
        </td>}
        <td className='text-center'>{formatNumberToCurrency(order?.original_price)}đ</td>
        <td className='text-center'>{checkNegativeNumber(order?.seller_discount)}đ</td>
        <td className='text-center'>{checkNegativeNumber(order?.voucher_from_seller)}đ</td>
        <td className='text-center'>{checkNegativeNumber(order?.seller_coin_cash_back)}đ</td>
        <td className='text-center'>{checkNegativeNumber(order?.seller_shipping_discount)}đ</td>
        <td className='text-center'>{checkNegativeNumber(order?.transaction_fee)}đ</td>
        <td className='text-center'>{checkNegativeNumber(order?.service_fee)}đ</td>
        <td className='text-center'>{checkNegativeNumber(order?.other_fee)}đ</td>
        <td className='text-center'>{checkNegativeNumber(order?.shipping_fee_adjustment)}đ</td>
        <td className='text-center'>{checkNegativeNumber(order?.other_fee_adjustment)}đ</td>
        <td className='text-center'>{checkNegativeNumber(order?.affiliate_commission)}đ</td>
        <td className='text-center'>{checkNegativeNumber(order?.seller_return_refund)}đ</td>
        <td className='text-center'>{checkNegativeNumber(order?.reverse_shipping_fee)}đ</td>
        <td className='text-center'>
          {tab_type == 'PROCESSED' ? dayjs(order?.payout_time * 1000).format("DD/MM/YYYY[\n]HH:mm") : dayjs(order?.completed_at * 1000).format("DD/MM/YYYY[\n]HH:mm")}</td>
      </tr>
    </>
  )
}

export default memo(RowTable)