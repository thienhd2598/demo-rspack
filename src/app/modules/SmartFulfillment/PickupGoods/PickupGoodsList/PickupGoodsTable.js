import clsx from "clsx";
import React, { memo } from "react";
import { useIntl } from "react-intl";
import Table from 'rc-table';
import 'rc-table/assets/index.css';
import { toAbsoluteUrl } from "../../../../../_metronic/_helpers";
import { Checkbox } from "../../../../../_metronic/_partials/controls";
import Pagination from "../../../../../components/Pagination";
import dayjs from "dayjs";
import { STATUS_PICKUP } from "../../SmartFulfillmentHelper";

const PickupGoodsTable = ({ ids, setIds, loading, data, limit, page, error }) => {
    const { formatMessage } = useIntl();

    const columns = [
        {
            title: <div className="d-flex align-items-center">
                <div className="mr-2">
                    <Checkbox
                        size="checkbox-md"
                        inputProps={{
                            'aria-label': 'checkbox',
                        }}
                        // isSelected={isSelectAll}
                        onChange={e => {
                            // if (isSelectAll) {
                            //     setIds(ids.filter(x => {
                            //         return ![...productsScheduled]?.filter(item => !!item?.error_msg)?.some(ticket => ticket.id === x.id);
                            //     }))
                            // } else {
                            //     const tempArray = [...ids];
                            //     ([...productsScheduled]?.filter(item => !!item?.error_msg) || []).forEach(ticket => {
                            //         if (ticket && !ids.some(item => item.id === ticket.id)) {
                            //             tempArray.push(ticket);
                            //         }
                            //     })
                            //     setIds(tempArray)
                            // }
                        }}
                    />
                </div>
                <span>{formatMessage({ defaultMessage: 'Mã phiếu' })}</span>
            </div>,
            dataIndex: 'name',
            key: 'name',
            align: 'left',
            width: '15%',
            render: (_item, record) => {
                return <div className="d-flex align-items-center">
                    <Checkbox
                        size='checkbox-md'
                        inputProps={{
                            'aria-label': 'checkbox',
                        }}
                        // isSelected={isSelectAll}
                        onChange={(e) => {
                            // if (isSelectAll) {
                            //     setIds(ids.filter(x => {
                            //         return !dataTemplate.some(campaign => campaign.id === x.id);
                            //     }))
                            // } else {
                            //     const tempArray = [...ids];
                            //     (dataTemplate || []).forEach(campaign => {
                            //         if (campaign && !ids.some(item => item.id === campaign.id)) {
                            //             tempArray.push(campaign);
                            //         }
                            //     })
                            //     setIds(tempArray)
                            // }
                        }}
                    />
                    <span className="ml-2">{record?.code}</span>
                </div>
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Số lượng kiện hàng' }),
            dataIndex: 'sku',
            key: 'sku',
            align: 'center',
            width: '10%',
            render: (_item, record) => {
                return <span>{record?.count_package}</span>
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Số lượng hàng hóa' }),
            dataIndex: 'sku',
            key: 'sku',
            align: 'center',
            width: '10%',
            render: (_item, record) => {
                return <span>{record?.count_product}</span>
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Loại danh sách' }),
            dataIndex: 'sku',
            key: 'sku',
            align: 'center',
            width: '10%',
            render: (_item, record) => {
                return <span style={{ textTransform: 'uppercase' }}>{record?.type}</span>
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Trạng thái' }),
            dataIndex: 'sku',
            key: 'sku',
            align: 'center',
            width: '10%',
            render: (_item, record) => {
                return <span>{STATUS_PICKUP?.[record?.status]}</span>
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Nhân viên phụ trách' }),
            dataIndex: 'sku',
            key: 'sku',
            align: 'center',
            width: '10%',
            render: (_item, record) => {
                return <span>{record?.pic_id || ''}</span>
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Thời gian tạo' }),
            dataIndex: 'sku',
            key: 'sku',
            align: 'center',
            width: '10%',
            render: (_item, record) => {
                return <span>{dayjs(record?.created_at).format('DD/MM/YYYY HH:mm')}</span>
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Thao tác' }),
            dataIndex: 'sku',
            key: 'sku',
            align: 'center',
            width: '8%',
            render: (_item, record) => {
                return <></>
            }
        },
    ];

    return <div className="mt-8">
        <div className='d-flex align-items-center mb-4' style={{ position: 'sticky', top: 45, background: '#fff', zIndex: 2 }}>
            <div className="mr-4 text-primary">
                {formatMessage({ defaultMessage: 'Đã chọn: {count} phiếu nhặt hàng' }, { count: ids?.length })}
            </div>
            <button
                disabled={ids?.length == 0}
                className={clsx("btn mr-4 px-8", {
                    'btn-primary': ids?.length > 0,
                    'btn-darkk': ids?.length == 0
                })}
                style={{ color: '#fff', cursor: ids?.length > 0 ? 'pointer' : 'not-allowed' }}
            >
                {formatMessage({ defaultMessage: 'Thao tác hàng loạt' })}
            </button>
        </div>
        <div style={{ position: 'relative' }}>
            {loading && (
                <div style={{ position: 'absolute', top: '50%', left: '50%', zIndex: 99 }}>
                    <span className="spinner spinner-primary" />
                </div>
            )}
            <Table
                style={(loading) ? { opacity: 0.4 } : {}}
                className="upbase-table mb-4"
                columns={columns}
                data={data?.list_record || []}
                emptyText={<div className='d-flex flex-column align-items-center justify-content-center my-10'>
                    <img src={toAbsoluteUrl("/media/empty.png")} alt="image" width={80} />
                    <span className='mt-4'>{formatMessage({ defaultMessage: 'Chưa có phiếu nhặt hàng' })}</span>
                </div>}
                tableLayout="auto"
                sticky={{ offsetHeader: 85 }}
            />
            {!error && <Pagination
                page={page}
                totalPage={Math.ceil(data?.total / limit)}
                loading={loading}
                limit={limit}
                totalRecord={data?.total}
                count={data?.list_record?.length}
                basePath={'/smart-ffm/pickup-goods/list'}
                isShowEmpty={false}
            />}
        </div>
    </div>
}

export default memo(PickupGoodsTable);