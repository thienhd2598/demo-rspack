import React, { memo, useLayoutEffect, useMemo, useState } from "react";
import { TooltipWrapper } from '../../../common/TooltipWrapper'
// import RowTable from "./RowTable";
import { useIntl } from "react-intl";
import { Checkbox } from "../../../../../../../_metronic/_partials/controls";
import DetailsOrderDialog from "../../../dialogs/DetailsOrderDialog";
import Table from 'rc-table';
import 'rc-table/assets/index.css';
import { formatNumberToCurrency } from "../../../../../../../utils";
import { toAbsoluteUrl } from "../../../../../../../_metronic/_helpers";
import dayjs from "dayjs";

const TableReconciliation = ({ platform,settlement_abnormal_status, tab_type, setIds, ids, refetch, loading, error, dataTable, stores, positionValue, summaryData }) => {  
  const { formatMessage } = useIntl()
  const [selectDetailsOrder, setSelectDetailsOrder] = useState()

  const isSelectAll = ids.length > 0 && ids.filter((x) => {
    return dataTable?.some((order) => order.id === x.id);
  })?.length == dataTable?.length;

  const detailOrder = (id) => {
    return window.open(
      `/orders/${id}` || "",
      "_blank"
    );
  }
  const selectStore = (id) => stores?.find((store => store.id == id))
  const checkNegativeNumber = (number) => {
    return formatNumberToCurrency(number) !== 0 ? formatNumberToCurrency(number * -1) : 0
  }
  const dataTableRc = useMemo(() => {
    return dataTable?.map(order => {
      return {
        order_id: order,
        store: order?.store_id,
        settlement_amount: order?.settlement_amount,
        settlement_amount_estimate: order?.settlement_amount_estimate,
        settlement_amount_adjustment: order,
        original_price: order?.original_price,
        seller_discount: order?.seller_discount,
        voucher_from_seller: order?.voucher_from_seller,
        seller_coin_cash_back: order?.seller_coin_cash_back,
        seller_shipping_discount: order?.seller_shipping_discount,
        transaction_fee: order?.transaction_fee,
        service_fee: order?.service_fee,
        other_fee: order?.other_fee,
        shipping_fee_adjustment: order?.shipping_fee_adjustment,
        other_fee_adjustment: order?.other_fee_adjustment,
        affiliate_commission: order?.affiliate_commission,
        seller_return_refund: order?.seller_return_refund,
        reverse_shipping_fee: order?.reverse_shipping_fee,
        gift_amount: order?.gift_amount,
        commission_fee: order?.commission_fee,
        payment_fee: order?.payment_fee,
        time: tab_type == 'PROCESSED' ? order?.payout_time : order?.completed_at
      }
    }
    )
  }, [dataTable])

  const coulumTable = [
    {
      title: <div className="d-flex">
        <Checkbox size="checkbox-md"
          inputProps={{
            "aria-label": "checkbox",
          }}
          isSelected={isSelectAll}
          onChange={(e) => {
            if (isSelectAll) {
              setIds(
                ids.filter((x) => {
                  return !dataTable?.some(
                    (order) => order.id === x.id
                  );
                })
              );
            } else {
              const tempArray = [...ids];
              (dataTable || []).forEach((_returnorder) => {
                if (
                  _returnorder &&
                  !ids.some((item) => item.id === _returnorder.id)
                ) {
                  tempArray.push(_returnorder);
                }
              });
              setIds(tempArray);
            }
          }}
        />
        {formatMessage({ defaultMessage: 'Mã đơn hàng' })}
      </div>,
      dataIndex: 'order_id',
      key: 'order_id',
      width: 120,
      render: (item) => {
        return (
          <div className='d-flex'>
            <Checkbox
              size="checkbox-md"
              inputProps={{
                "aria-label": "checkbox",
              }}
              isSelected={ids.some((_id) => _id.id == item.id)}
              onChange={(e) => {
                if (ids.some((_id) => _id.id == item.id)) {
                  setIds((prev) =>
                    prev.filter((_id) => _id.id != item.id)
                  );
                } else {
                  setIds((prev) => prev.concat([item]));
                }
              }}
            />
            <span style={{ cursor: 'pointer' }} onClick={() => detailOrder(item?.order_id)}>{item?.order_ref_id}</span>
          </div>
        )
      }
    },
    {
      title: formatMessage({ defaultMessage: 'Gian hàng' }),
      dataIndex: 'store',
      key: 'store',
      width: 120,
      align: 'right',
      render: (item) => {
        return (
          <div className='d-flex align-items-center'>
            <span><img style={{ width: '20px', height: '20px', marginRight: '4px' }} src={selectStore(item)?.url}></img></span>
            <span>{selectStore(item)?.name}</span>
          </div>
        )
      }
    },
    ((tab_type == 'PROCESSED') ? {
      title: <>
        {platform == 'ecommerce' ? formatMessage({ defaultMessage: 'Số tiền sàn quyết toán' }) : formatMessage({ defaultMessage: 'Số tiền đã quyết toán' }) }
        <TooltipWrapper note={platform == 'ecommerce' ? formatMessage({ defaultMessage: "Số tiền sàn đã quyết toán về ví." }) : formatMessage({ defaultMessage: "Số tiền đã quyết toán về ví." })}>
          <i className="fas fa-info-circle fs-14 ml-2"></i>
        </TooltipWrapper>
      </>,
      dataIndex: 'settlement_amount',
      key: 'settlement_amount',
      width: 120,
      align: 'right',
      render: (item) => {
        return (
          <div>
            {formatNumberToCurrency(item)}đ
          </div>
        )
      }
    } : null),
    {
      title: <>
        {formatMessage({ defaultMessage: 'Số tiền quyết toán ước tính' })}
        <TooltipWrapper note={formatMessage({ defaultMessage: "Số tiền thanh toán ước tính = Giá gốc + Trợ giá và giảm giá từ người bán - phí nền tảng - Chênh lệch - Hoa hồng liên kết - Hoàn tiền." })}>
          <i className="fas fa-info-circle fs-14 ml-2"></i>
        </TooltipWrapper>
      </>,
      dataIndex: 'settlement_amount_estimate',
      key: 'settlement_amount_estimate',
      width: 120,
      align: 'right',
      render: (item) => {
        return (
          <div>
            {formatNumberToCurrency(item)}đ
          </div>
        )
      }
    },
    ((tab_type == 'PROCESSED') ? {
      title: <>
        {formatMessage({ defaultMessage: 'Số tiền chênh lệch' })}
        <TooltipWrapper note={formatMessage({ defaultMessage: "Số tiền chênh lệch = Số tiền đã quyết toán - Số tiền quyết toán ước tính." })}>
          <i className="fas fa-info-circle fs-14 ml-2"></i>
        </TooltipWrapper>
      </>,
      dataIndex: 'settlement_amount_adjustment',
      key: 'settlement_amount_adjustment',
      width: 120,
      align: 'right',
      render: (item) => {
        return (
          <div className='d-flex align-items-center justify-content-center'>
            {formatNumberToCurrency(item?.settlement_amount_adjustment)}đ
            {(item?.status == 'PROCESSED' && (item?.settlement_type_selected == 1 || item?.settlement_type_selected == 2)) &&
              <TooltipWrapper note={formatMessage({ defaultMessage: "Chi tiết phiếu đã xử lý bất thường." })}>
                <img style={{ cursor: 'pointer' }} onClick={() => setSelectDetailsOrder(item)} className="ml-3" src={toAbsoluteUrl('/media/svg/tick.svg')} alt=""></img>
              </TooltipWrapper>}
          </div>
        )
      }
    } : null),
    {
      title: <>
        {formatMessage({ defaultMessage: 'Giá gốc' })}
        <TooltipWrapper note={formatMessage({ defaultMessage: "Giá đăng bán của sản phẩm." })}>
          <i className="fas fa-info-circle fs-14 ml-2"></i>
        </TooltipWrapper>
      </>,
      dataIndex: 'original_price',
      key: 'original_price',
      width: 120,
      align: 'right',
      render: (item) => {
        return (
          <div>
            {formatNumberToCurrency(item)}đ
          </div>
        )
      }
    },
    {
      title: formatMessage({ defaultMessage: 'Trợ phí và giảm giá từ người bán' }),
      align: 'center',
      children: [
        {
          title: <>
            {formatMessage({ defaultMessage: 'Trợ giá sản phẩm' })}
            <TooltipWrapper note={formatMessage({ defaultMessage: "Người bán trợ giá sản phẩm." })}>
              <i className="fas fa-info-circle fs-14 ml-2"></i>
            </TooltipWrapper>
          </>,
          dataIndex: 'seller_discount',
          key: 'seller_discount',
          width: 120,
          align: 'right',
          render(item) {
            return <div>
              {checkNegativeNumber(item)}đ
            </div>
          },
        },
        {
          title: <>
            {formatMessage({ defaultMessage: 'Chi phí quà tặng' })}
          </>,
          dataIndex: 'gift_amount',
          key: 'gift_amount',
          width: 120,
          align: 'right',
          render(item) {
            return <div>
              {checkNegativeNumber(item)}đ
            </div>
          },
        },
        {
          title: <>
            {formatMessage({ defaultMessage: 'Mã giảm giá' })}
            <TooltipWrapper note={formatMessage({ defaultMessage: "Giảm giá từ voucher người bán." })}>
              <i className="fas fa-info-circle fs-14 ml-2"></i>
            </TooltipWrapper>
          </>,
          dataIndex: 'voucher_from_seller',
          key: 'voucher_from_seller',
          align: 'right',
          width: 120,
          render: (item) => {
            return <div>
              {checkNegativeNumber(item)}đ
            </div>
          }
        },
        {
          title: <>
            {formatMessage({ defaultMessage: 'Người bán hoàn xu' })}
            <TooltipWrapper note={formatMessage({ defaultMessage: "Số tiền người bán chi trả để hoàn xu cho người mua." })}>
              <i className="fas fa-info-circle fs-14 ml-2"></i>
            </TooltipWrapper>
          </>,
          dataIndex: 'seller_coin_cash_back',
          key: 'seller_coin_cash_back',
          width: 120,
          align: 'right',
          render: (item) => {
            return (
              <div>
                {checkNegativeNumber(item)}đ
              </div>
            )
          }
        },
      ]
    },

    {
      title: 'Phí nền tảng',
      align: 'center',
      children: [
        {
          title: <>
            {formatMessage({ defaultMessage: 'Người bán hỗ trợ vận chuyển' })}
            <TooltipWrapper note={formatMessage({ defaultMessage: "Số tiền nhà bán trợ giá vận chuyển cho người mua." })}>
              <i className="fas fa-info-circle fs-14 ml-2"></i>
            </TooltipWrapper>
          </>,
          dataIndex: 'seller_shipping_discount',
          key: 'seller_shipping_discount',
          width: 120,
          align: 'right',
          render(item) {
            return <div>
              {checkNegativeNumber(item)}đ
            </div>
          },
        },
        {
          title: <>
            {formatMessage({ defaultMessage: 'Phí cố định' })}
          </>,
          dataIndex: 'commission_fee',
          key: 'commission_fee',
          align: 'right',
          width: 120,
          render: (item) => {
            return <div>
              {checkNegativeNumber(item)}đ
            </div>
          }
        },
        {
          title: <>
            {formatMessage({ defaultMessage: 'Phí thanh toán' })}
          </>,
          dataIndex: 'payment_fee',
          key: 'payment_fee',
          align: 'right',
          width: 120,
          render: (item) => {
            return <div>
              {checkNegativeNumber(item)}đ
            </div>
          }
        },
        {
          title: <>
            {formatMessage({ defaultMessage: 'Phí dịch vụ' })}
            <TooltipWrapper note={formatMessage({ defaultMessage: "Phí dịch vụ nền tảng thu của người bán." })}>
              <i className="fas fa-info-circle fs-14 ml-2"></i>
            </TooltipWrapper>
          </>,
          dataIndex: 'service_fee',
          key: 'service_fee',
          width: 120,
          align: 'right',
          render: (item) => {
            return (
              <div>
                {checkNegativeNumber(item)}đ
              </div>
            )
          }
        },
        {
          title: <>
            {formatMessage({ defaultMessage: 'Phí khác' })}
            <TooltipWrapper note={formatMessage({ defaultMessage: "Chi phí khác phát sinh từ nền tảng." })}>
              <i className="fas fa-info-circle fs-14 ml-2"></i>
            </TooltipWrapper>
          </>,
          dataIndex: 'other_fee',
          key: 'other_fee',
          width: 120,
          align: 'right',
          render: (item) => {
            return (
              <div>
                {checkNegativeNumber(item)}đ
              </div>
            )
          }
        },
      ]
    },


    {
      title: formatMessage({ defaultMessage: 'Chênh lệch' }),
      align: 'center',
      children: [
        {
          title: <>
            {formatMessage({ defaultMessage: 'Vận chuyển' })}
            <TooltipWrapper note={formatMessage({ defaultMessage: "Chênh lệch vận chuyển = Phí vận chuyển người mua trả - phí vận chuyển thực tế - Phí vận chuyển thực tế." })}>
              <i className="fas fa-info-circle fs-14 ml-2"></i>
            </TooltipWrapper>
          </>,
          dataIndex: 'shipping_fee_adjustment',
          key: 'shipping_fee_adjustment',
          width: 120,
          align: 'right',
          render(item) {
            return <div>
              {checkNegativeNumber(item)}đ
            </div>
          },
        },
        {
          title: <>
            {formatMessage({ defaultMessage: 'Khác' })}
            <TooltipWrapper note={formatMessage({ defaultMessage: "Các khoản chênh lệch khác phát sinh từ nền tảng." })}>
              <i className="fas fa-info-circle fs-14 ml-2"></i>
            </TooltipWrapper>
          </>,
          dataIndex: 'other_fee_adjustment',
          key: 'other_fee_adjustment',
          align: 'right',
          width: 120,
          render: (item) => {
            return <div>
              {checkNegativeNumber(item)}đ
            </div>
          }
        },
      ]
    },

    {
      title: <>
        {formatMessage({ defaultMessage: 'Hoa hồng liên kết' })}
        <TooltipWrapper note={formatMessage({ defaultMessage: "Khoản hoa hồng mà người bán cần trả cho đối tác tiếp thị liên kết." })}>
          <i className="fas fa-info-circle fs-14 ml-2"></i>
        </TooltipWrapper>
      </>,
      dataIndex: 'affiliate_commission',
      key: 'affiliate_commission',
      width: 120,
      align: 'right',
      render: (item) => {
        return (
          <div>
            {checkNegativeNumber(item)}đ
          </div>
        )
      }
    },

    {
      title: formatMessage({ defaultMessage: 'Hoàn tiền' }),
      key: 'store',
      align: 'center',
      children: [
        {
          title: <>
            {formatMessage({ defaultMessage: 'Hoàn tiền người mua' })}

            <TooltipWrapper note={formatMessage({ defaultMessage: "Người bán hoàn trả lại tiền = Tiền người bán hoàn trả lại cho người mua + Số tiền mà sàn trợ giá." })}>
              <i className="fas fa-info-circle fs-14 ml-2"></i>
            </TooltipWrapper>
          </>,
          dataIndex: 'seller_return_refund',
          key: 'seller_return_refund',
          width: 120,
          align: 'right',
          render(item) {
            return <div>
              {checkNegativeNumber(item)}đ
            </div>
          },
        },
        {
          title: <>
            {formatMessage({ defaultMessage: 'Phí trả hàng' })}
            <TooltipWrapper note={formatMessage({ defaultMessage: "Người bán hoàn trả lại tiền = Tiền người bán hoàn trả lại cho người mua + Số tiền mà sàn trợ giá." })}>
              <i className="fas fa-info-circle fs-14 ml-2"></i>
            </TooltipWrapper>
          </>,
          dataIndex: 'reverse_shipping_fee',
          key: 'reverse_shipping_fee',
          align: 'right',
          width: 120,
          render: (item) => {
            return <div>
              {checkNegativeNumber(item)}đ
            </div>
          }
        },
      ]
    },

    {
      title: <>
        {tab_type == 'PROCESSED' ? formatMessage({ defaultMessage: 'Thời gian quyết toán' }) : formatMessage({ defaultMessage: 'Thời gian đơn hàng hoàn thành' })}
        {tab_type == 'PROCESSED' ? <TooltipWrapper note={formatMessage({ defaultMessage: "Thời gian đơn hàng được quyết toán về ví." })}>
          <i className="fas fa-info-circle fs-14 ml-2"></i>
        </TooltipWrapper> : <TooltipWrapper note={formatMessage({ defaultMessage: "Thời gian đơn hàng được người mua xác nhận đã nhận được hàng." })}>
          <i className="fas fa-info-circle fs-14 ml-2"></i>
        </TooltipWrapper>}
      </>,
      dataIndex: 'time',
      key: 'time',
      width: 120,
      align: 'right',
      render: (item) => {
        return (
          <div>{!!item ? dayjs(item * 1000).format("DD/MM/YYYY[\n]HH:mm") : ''}</div>
        )
      }
    },
  ].filter(Boolean)

  const summary = () => {
    let totalSettlementAmount = summaryData?.sum_settlement_amount || 0;
    let totalSettlementAmountEstimate = summaryData?.sum_settlement_amount_estimate || 0;
    let totalSettlementAmountAdjustment = summaryData?.sum_settlement_amount_adjustment || 0;
    let totalOriginalPrice = summaryData?.sum_original_price || 0;
    let totalSellerDiscount = summaryData?.sum_seller_discount || 0;
    let totalGiftAmount = summaryData?.sum_gift_amount || 0;
    let totalVoucherFromSeller = summaryData?.sum_voucher_from_seller || 0;
    let totalSellerCoinCashBack = summaryData?.sum_seller_coin_cash_back || 0;
    let totalSellerShippingDiscount = summaryData?.sum_seller_shipping_discount || 0;
    let totalCommissionFee = summaryData?.sum_commission_fee || 0;
    let totalPaymentFee = summaryData?.sum_payment_fee || 0;
    let totalServiceFee = summaryData?.sum_service_fee || 0;
    let totalOtherFee = summaryData?.sum_other_fee || 0;
    let totalShippingFeeAdjustment = summaryData?.sum_shipping_fee_adjustment || 0;
    let totalOtherFeeAdjustment = summaryData?.sum_other_fee_adjustment || 0;
    let totalAffiliateCommission = summaryData?.sum_affiliate_commission || 0;
    let totalSellerReturnRefund = summaryData?.sum_seller_return_refund || 0;
    let totalReverseShippingFee = summaryData?.sum_reverse_shipping_fee || 0;



    return (
      <Table.Summary fixed="bottom">
        <Table.Summary.Row style={{textAlign: 'right'}}>
          <Table.Summary.Cell>{formatMessage({ defaultMessage: 'Tổng cộng' })}</Table.Summary.Cell>
          <Table.Summary.Cell></Table.Summary.Cell>
          {tab_type == 'PROCESSED' &&<Table.Summary.Cell>
            {formatNumberToCurrency(totalSettlementAmount)}đ
          </Table.Summary.Cell>}
          <Table.Summary.Cell>
            {formatNumberToCurrency(totalSettlementAmountEstimate)}đ
          </Table.Summary.Cell>
          {tab_type == 'PROCESSED' && 
            <Table.Summary.Cell>
              {formatNumberToCurrency(totalSettlementAmountAdjustment)}đ
            </Table.Summary.Cell>
          }
          <Table.Summary.Cell>
            {formatNumberToCurrency(totalOriginalPrice)}đ
          </Table.Summary.Cell>
          <Table.Summary.Cell>
            {formatNumberToCurrency(totalSellerDiscount)}đ
          </Table.Summary.Cell>
          <Table.Summary.Cell>
            {formatNumberToCurrency(totalGiftAmount)}đ
          </Table.Summary.Cell>
          <Table.Summary.Cell>
            {formatNumberToCurrency(totalVoucherFromSeller)}đ
          </Table.Summary.Cell>
          <Table.Summary.Cell>
            {formatNumberToCurrency(totalSellerCoinCashBack)}đ
          </Table.Summary.Cell>
          <Table.Summary.Cell>
            {formatNumberToCurrency(totalSellerShippingDiscount)}đ
          </Table.Summary.Cell>
          <Table.Summary.Cell>
            {formatNumberToCurrency(totalCommissionFee)}đ
          </Table.Summary.Cell>
          <Table.Summary.Cell>
            {formatNumberToCurrency(totalPaymentFee)}đ
          </Table.Summary.Cell>
          <Table.Summary.Cell>
            {formatNumberToCurrency(totalServiceFee)}đ
          </Table.Summary.Cell>
          <Table.Summary.Cell>
            {formatNumberToCurrency(totalOtherFee)}đ
          </Table.Summary.Cell>
          <Table.Summary.Cell>
            {formatNumberToCurrency(totalShippingFeeAdjustment)}đ
          </Table.Summary.Cell>
          <Table.Summary.Cell>
            {formatNumberToCurrency(totalOtherFeeAdjustment)}đ
          </Table.Summary.Cell>
          <Table.Summary.Cell>
            {formatNumberToCurrency(totalAffiliateCommission)}đ
          </Table.Summary.Cell>
          <Table.Summary.Cell>
            {formatNumberToCurrency(totalSellerReturnRefund)}đ
          </Table.Summary.Cell>
          <Table.Summary.Cell>
            {formatNumberToCurrency(totalReverseShippingFee)}đ
          </Table.Summary.Cell>
          <Table.Summary.Cell></Table.Summary.Cell>
        </Table.Summary.Row>
      </Table.Summary>
    );
  };

  return (
    <>
      {selectDetailsOrder && <DetailsOrderDialog onHide={() => setSelectDetailsOrder()} show={!!selectDetailsOrder} selectDetailsOrder={selectDetailsOrder} />}

      {loading && (
        <div
          className="text-center w-100 mt-4"
          style={{ position: "absolute" }}
        >
          <span className="ml-3 spinner spinner-primary"></span>
        </div>
      )}
      {(!!error && !loading) ? (
        <div
          className="w-100 text-center mt-8"
          style={{ position: "absolute" }}
        >
          <div className="d-flex flex-column justify-content-center align-items-center">
            <i
              className="far fa-times-circle text-danger"
              style={{ fontSize: 48, marginBottom: 8 }}
            ></i>
            <p className="mb-6">{formatMessage({ defaultMessage: 'Xảy ra lỗi trong quá trình tải dữ liệu' })}</p>
            <button
              className="btn btn-primary btn-elevate"
              style={{ width: 80 }}
              onClick={(e) => {
                e.preventDefault();
                refetch();
              }}
            >
              {formatMessage({ defaultMessage: 'Tải lại' })}
            </button>
          </div>
        </div>
      ) : (
        <Table
          style={(loading) ? { opacity: 0.4 } : {}}
          className="upbase-table"
          columns={coulumTable}
          data={dataTableRc || []}
          emptyText={<div className='d-flex flex-column align-items-center justify-content-center my-10'>
            <img src={toAbsoluteUrl("/media/empty.png")} alt="" width={80} />
            <span className='mt-4'>{formatMessage({ defaultMessage: 'Không có dữ liệu' })}</span>
          </div>}
          tableLayout="auto"
          sticky={{ offsetHeader: `${101 + positionValue}px` }}
          scroll={{ x: tab_type == 'PROCESSED' ? 2900 : 2700 }}
          summary={summary}
        />
      )}


    </>
  );
};

export default memo(TableReconciliation);
