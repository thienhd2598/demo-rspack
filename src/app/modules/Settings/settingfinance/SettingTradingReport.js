import React, { useMemo, useCallback, useState, memo, Fragment } from 'react';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import Table from 'rc-table';
import 'rc-table/assets/index.css';
import query_sc_stores_basic from '../../../../graphql/query_sc_stores_basic';
import { useQuery } from '@apollo/client';
import { toAbsoluteUrl } from '../../../../_metronic/_helpers';
import { formatNumberToCurrency } from '../../../../utils';
import { useIntl } from 'react-intl';
import query_cfGetListSettingPercentFee from '../../../../graphql/query_cfGetListSettingPercentFee';
import UpdateRatioDialog from './dialogs/UpdateRatioDialog';

const SettingTradingReport = () => {    
    const { formatMessage } = useIntl();
    const [currentData, setCurrentData] = useState(null);

    const { data: dataStore } = useQuery(query_sc_stores_basic, {
        fetchPolicy: 'cache-and-network'
    });

    const { loading: loadingListSettingPercentFee, data: dataListSettingPercentFee } = useQuery(query_cfGetListSettingPercentFee, {
        fetchPolicy: 'cache-and-network'
    });    

    const optionsStore = useMemo(() => {
        return dataStore?.sc_stores?.map(store => ({
            value: store?.id,
            label: store?.name,
            logo: dataStore?.op_connector_channels?.find(channel => channel?.code == store?.connector_channel_code)?.logo_asset_url,
            connector_channel_code: store?.connector_channel_code
        }));
    }, [dataStore]);    

    const columns = [
        {
            title: formatMessage({ defaultMessage: 'Tên gian hàng' }),
            dataIndex: 'store_id',
            key: 'store_id',
            width: '20%',
            fixed: 'left',
            align: 'left',
            render: (item, record) => {
                const store = optionsStore?.find(st => st?.value == record?.store_id);

                if (!store) return <span>{formatMessage({ defaultMessage: 'Gian đã ngắt kết nối' })}</span>

                return <div className='d-flex align-items-center'>
                    <img
                        style={{ width: 15, height: 15 }}
                        src={store?.logo}
                        className="mr-2"
                    />
                    <span>{store?.label}</span>
                </div>
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Phí cố định (%)' }),
            dataIndex: 'store_id',
            key: 'store_id',
            width: '20%',
            fixed: 'center',
            align: 'center',
            render: (item, record) => {
                const fee = record?.setting_percent_fee?.find(_item => _item?.key == 'commission_fee');

                return <span>{typeof fee?.percent == 'number' ? `${fee?.percent?.toFixed(2)}%` : '--'}</span>
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Phí thanh toán (%)' }),
            dataIndex: 'store_id',
            key: 'store_id',
            width: '20%',
            fixed: 'center',
            align: 'center',
            render: (item, record) => {
                const fee = record?.setting_percent_fee?.find(_item => _item?.key == 'payment_fee');

                return <span>{typeof fee?.percent == 'number' ? `${fee?.percent?.toFixed(2)}%` : '--'}</span>
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Phí dịch vụ (%)' }),
            dataIndex: 'store_id',
            key: 'store_id',
            width: '20%',
            fixed: 'center',
            align: 'center',
            render: (item, record) => {
                const fee = record?.setting_percent_fee?.find(_item => _item?.key == 'service_fee');

                return <span>{typeof fee?.percent == 'number' ? `${fee?.percent?.toFixed(2)}%` : '--'}</span>
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Thao tác' }),
            dataIndex: 'store_id',
            key: 'store_id',
            width: '20%',
            fixed: 'center',
            align: 'center',
            render: (item, record) => {
                return <span
                    className='text-primary'
                    role="button"
                    onClick={() => setCurrentData(record)}
                >
                    {formatMessage({ defaultMessage: 'Chỉnh sửa' })}
                </span>
            }
        },
    ];

    return (
        <Fragment>
            <UpdateRatioDialog
                optionsStore={optionsStore}
                currentData={currentData}
                onHide={() => setCurrentData(null)}
            />
            <div className='mt-2 mb-4 d-flex align-items-center'>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="mr-2 text-info bi bi-info-circle" viewBox="0 0 18 18">
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
                    <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0" />
                </svg>
                <span className='text-info'>
                    {formatMessage({ defaultMessage: 'Cài đặt báo cáo kinh doanh nhằm hỗ trợ nhà bán tính toán chi phí nội sàn khi đơn ở trạng thái Đang giao hàng' })}
                </span>
            </div>
            <div style={{ position: 'relative' }}>
                {loadingListSettingPercentFee && (
                    <div style={{ position: 'absolute', top: '50%', left: '50%', zIndex: 99 }}>
                        <span className="spinner spinner-primary" />
                    </div>
                )}
                <Table
                    className="upbase-table"
                    style={loadingListSettingPercentFee ? { opacity: 0.4 } : {}}
                    columns={columns}
                    data={!loadingListSettingPercentFee ? (dataListSettingPercentFee?.cfGetListSettingPercentFee || []) : []}
                    emptyText={<div className='d-flex flex-column align-items-center justify-content-center my-10'>
                        <img src={toAbsoluteUrl("/media/empty.png")} alt="image" width={80} />
                        <span className='mt-4'>{formatMessage({ defaultMessage: 'Chưa có dữ liệu' })}</span>
                    </div>}
                    tableLayout="auto"
                    sticky={{ offsetHeader: 45 }}
                />
            </div>
        </Fragment>
    )
};

export default memo(SettingTradingReport);