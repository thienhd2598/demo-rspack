import React, { useCallback, useMemo, useState } from 'react'
import { useIntl } from 'react-intl';
import InfoProduct from '../../../../components/InfoProduct';
import HoverImage from '../../../../components/HoverImage';
import { formatNumberToCurrency } from '../../../../utils';
import { ModalDetailCombo } from '../../Order/process-order-return/dialogs/ModalConfirm';
import RcTable from 'rc-table';
import { toAbsoluteUrl } from '../../../../_metronic/_helpers';
import clsx from 'clsx';

const Table = ({ loading, data, detailOrder }) => {
    const { formatMessage } = useIntl()
    const [dataCombo, setDataCombo] = useState();    

    const columns = [
        {
            title: formatMessage({ defaultMessage: 'Hàng hóa kho' }),
            align: 'left',
            width: 350,
            className: 'p-0 clearBorderBottom',
            render: (record, item) => {
                return (
                    <div className={clsx({ borderBottomNone: !item?.borderBottomNone })} style={{ padding: '5px' }}>
                        {!!item?.is_combo && item?.firstItem && (
                            <div className="d-flex align-items-center mb-2" style={{ verticalAlign: "top" }}>
                                <div>
                                    <InfoProduct isSingle sku={item?.skuOrderCombo} productOrder={true} />
                                </div>
                                <span style={{ cursor: "pointer" }} className="ml-4 text-primary" onClick={() => setDataCombo(item?.combo_items_info)}>
                                    Combo
                                </span>
                            </div>
                        )}
                        <div className="col-12" style={{ verticalAlign: "top", display: "flex", flexDirection: "row" }}>
                            <div style={{ backgroundColor: "#F7F7FA", width: 70, height: 70, borderRadius: 8, overflow: "hidden", minWidth: 70, cursor: "pointer", }}
                                onClick={(e) => {
                                    window.open(!!item.isComboItem ? `/products/edit-combo/${item.id}` : `/products/edit/${item.id}`, "_blank")
                                }} className="mr-6">
                                {!!item?.img && <HoverImage size={{ width: 320, height: 320 }} defaultSize={{ width: 70, height: 70 }} url={item?.img} />}
                            </div>
                            <div>
                                {!!item?.is_gift && (
                                    <div style={{border: '1px solid #FF0000',width: 'max-content',marginBottom: '3px', padding: '5px', borderRadius: '3px'}}>
                                    <span style={{color: '#FF0000'}}> {formatMessage({defaultMessage: 'Quà tặng'})}</span>
                                 </div>
                                )}
                                <div><InfoProduct short={true} sku={item?.sku} name={item?.variant_full_name} url={!!item.isComboItem ? `/products/edit-combo/${item.id}` : `/products/edit/${item.id}`} /> </div>
                                <span className="text-secondary-custom fs-12">
                                    {item?.attributes?.replaceAll(' + ', ' - ')}
                                </span>
                            </div>
                        </div>
                    </div>
                )
            }
        },
        {
            title: formatMessage({ defaultMessage: 'ĐVT	' }),
            align: 'center',
            width: 100,
            render: (record, item) => {
                return (
                    <div>
                        {item?.unit || '--'}
                    </div>
                )
            }
        },
         {
            title: formatMessage({ defaultMessage: 'Giá vốn	' }),
            align: 'right',
            width: 140,
            render: (record, item) => {
                return (
                    <div>
                        {formatNumberToCurrency(item?.cost_price)}đ
                    </div>
                )
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Đơn giá' }),
            align: 'right',
            width: 140,
            render: (record, item) => {
                return (
                    <div>
                        {formatNumberToCurrency(item?.inc_vat_original_price)}đ
                    </div>
                )
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Số lượng' }),
            align: 'center',
            width: 130,
            render: (record, item) => {
                return (
                    <div>
                        {item?.quantity_purchased || '--'}
                    </div>
                )
            }
        },
        detailOrder?.object_type == 2 ? {
            title: formatMessage({ defaultMessage: 'Nhập kho' }),
            align: 'center',
            width: 130,
            render: (record, item) => {
                return (
                    <div>
                        {item?.import_quantity || '--'}
                    </div>
                )
            }
        } : null,
        {
            title: formatMessage({ defaultMessage: 'Thành tiền' }),
            align: 'right',
            width: 140,
            render: (record, item) => {
                return (
                    <div>
                        {formatNumberToCurrency(item?.inc_vat_sum_original_price)}đ
                    </div>
                )
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Chiết khấu' }),
            align: 'right',
            width: 140,
            render: (record, item) => {
                return (
                    <div>
                        {formatNumberToCurrency(item?.inc_vat_sum_discount)}đ
                    </div>
                )
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Tiền hàng' }),
            align: 'right',
            width: 140,
            render: (record, item) => {
                return (
                    <div>
                        {formatNumberToCurrency(item?.goods_money_amount)}đ
                    </div>
                )
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Thuế suất' }),
            align: 'right',
            width: 140,
            render: (record, item) => {
                return (
                    <div>
                        {formatNumberToCurrency(item?.vat_rate)}%
                    </div>
                )
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Thuế GTGT' }),
            align: 'right',
            width: 140,
            render: (record, item) => {
                return (
                    <div>
                        {formatNumberToCurrency(item?.vat_amount)}đ
                    </div>
                )
            }
        },
    ].filter(Boolean);

    if (loading) {
        return (
            <div className='text-center col-12 mt-4' style={{ position: 'absolute' }} ><span className="spinner spinner-primary"></span></div>
        )
    }

    return (
        <>
            <ModalDetailCombo
                dataCombo={dataCombo}
                onHide={() => setDataCombo()}
            />

            <RcTable
                style={loading ? { opacity: 0.4 } : {}}
                className="upbase-table"
                columns={columns}
                data={data || []}
                emptyText={<div className='d-flex flex-column align-items-center justify-content-center my-10'>
                    <img src={toAbsoluteUrl("/media/empty.png")} alt="" width={80} />
                    <span className='mt-4'>{formatMessage({ defaultMessage: 'Không có dữ liệu' })}</span>
                </div>}
                tableLayout="auto"
                sticky={{ offsetHeader: 43 }}
                scroll={{ x: 1600 }}
            />

            <div className='mt-4 d-flex justify-content-end'>
                <div style={{ display: 'flex', marginTop: '5px', flexDirection: 'column' }}>
                    <div style={{ width: '300px', display: 'grid', gridTemplateColumns: '60% 40%', marginBottom: '5px' }}>
                        <strong className='text-right'>{formatMessage({ defaultMessage: 'Tổng giá vốn' })}:</strong>
                        <strong className='text-right'>{formatNumberToCurrency(detailOrder?.sum_cost_price)}đ</strong>
                    </div>
                    <div style={{ width: '300px', display: 'grid', gridTemplateColumns: '60% 40%', marginBottom: '10px' }}>
                        <span className='text-right'>Tổng tiền hàng:</span>
                        <span className='text-right'>{formatNumberToCurrency(detailOrder?.inc_vat_sum_original_price - detailOrder?.inc_vat_sum_discount)}đ</span>
                    </div>
                    <div style={{ width: '300px', display: 'grid', gridTemplateColumns: '60% 40%', marginBottom: '10px' }}>
                        <span className='text-right'>{formatMessage({ defaultMessage: 'Tổng tiền thuế GTGT' })}:</span>
                        <span className='text-right'>{formatNumberToCurrency(detailOrder?.vat_amount)}đ</span>
                    </div>
                    <div style={{ width: '300px', display: 'grid', gridTemplateColumns: '60% 40%', marginBottom: '10px' }}>
                        <strong className='text-right'>{formatMessage({ defaultMessage: 'Tổng tiền thanh toán' })}:</strong>
                        <strong className='text-right'>{formatNumberToCurrency(detailOrder?.inc_vat_sum_amount)}đ</strong>
                    </div>

                </div>
            </div>
        </>
    )
}

export default Table