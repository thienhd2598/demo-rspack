import React, { useMemo, useCallback, useState, memo, Fragment } from 'react';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import Table from 'rc-table';
import 'rc-table/assets/index.css';
import query_getCostPeriodType from '../../../../graphql/query_getCostPeriodType';
import { useQuery } from '@apollo/client';
import { toAbsoluteUrl } from '../../../../_metronic/_helpers';
import { formatNumberToCurrency } from '../../../../utils';
import { useIntl } from 'react-intl';
import query_cfGetListSettingPercentVat from '../../../../graphql/query_cfGetListSettingPercentVat';
import query_sc_stores_basic from '../../../../graphql/query_sc_stores_basic';
import UpdateVatDialog from './dialogs/UpdateVatDialog';
import AuthorizationWrapper from '../../../../components/AuthorizationWrapper';

const SettingTradingReport = () => {    
    const { formatMessage } = useIntl();
    const [currentData, setCurrentData] = useState(null);

    const { data: dataCostPeriod } = useQuery(query_getCostPeriodType, {
        fetchPolicy: 'cache-and-network'
    });

    const { loading: loadingListSettingPercentVat, data: dataListSettingPercentVat } = useQuery(query_cfGetListSettingPercentVat, {
        fetchPolicy: 'cache-and-network'
    });    

    const {data: dataStore} = useQuery(query_sc_stores_basic, {
        fetchPolicy: 'cache-and-network'
    })

    console.log(dataStore)
    // const optionsStore = useMemo(() => {
    //     return dataStore?.sc_stores?.map(store => ({
    //         value: store?.id,
    //         label: store?.name,
    //         logo: dataStore?.op_connector_channels?.find(channel => channel?.code == store?.connector_channel_code)?.logo_asset_url,
    //         connector_channel_code: store?.connector_channel_code
    //     }));
    // }, [dataStore]);    

    const columns = [
        {
            title: formatMessage({ defaultMessage: 'Danh mục' }),
            dataIndex: 'store_id',
            key: 'store_id',
            width: '20%',
            fixed: 'left',
            align: 'left',
            render: (item, record) => {
                return <div className='d-flex align-items-center'>
                    <span>{record?.type || '--'}</span>
                </div>
            }
        },
        {
            title: <div className='d-flex align-items-center justify-content-center'>
                <img src={dataStore?.op_connector_channels?.find(item => item?.code == 'shopee')?.logo_asset_url} width={16} height={16} className='mr-2'/>
                {formatMessage({ defaultMessage: 'Shopee' })}
            </div>,
            dataIndex: 'store_id',
            key: 'store_id',
            width: '15%',
            fixed: 'center',
            align: 'center',
            render: (item, record) => {
                const vat = record?.setting_percent_vat?.find(_item => _item?.connector_channel_code == 'shopee');
                return <span>{!!vat?.percent || vat?.percent == 0 ? `${vat?.percent}%` : '--'}</span>
            }
        },
        {
            title: <div className='d-flex align-items-center justify-content-center'>
                <img src={dataStore?.op_connector_channels?.find(item => item?.code == 'lazada')?.logo_asset_url} width={16} height={16} className='mr-2'/>
                {formatMessage({ defaultMessage: 'Lazada' })}
            </div>,
            dataIndex: 'store_id',
            key: 'store_id',
            width: '15%',
            fixed: 'center',
            align: 'center',
            render: (item, record) => {
                const vat = record?.setting_percent_vat?.find(_item => _item?.connector_channel_code == 'lazada');
                return <span>{!!vat?.percent || vat?.percent == 0 ? `${vat?.percent}%` : '--'}</span>
            }
        },
        {
            title: <div className='d-flex align-items-center justify-content-center'>
                <img src={dataStore?.op_connector_channels?.find(item => item?.code == 'tiktok')?.logo_asset_url} width={16} height={16} className='mr-2'/>
                {formatMessage({ defaultMessage: 'TikTokShop' })}
            </div>,
            dataIndex: 'store_id',
            key: 'store_id',
            width: '20%',
            fixed: 'center',
            align: 'center',
            render: (item, record) => {
                const vat = record?.setting_percent_vat?.find(_item => _item?.connector_channel_code == 'tiktok');
                return <span>{!!vat?.percent || vat?.percent == 0 ? `${vat?.percent}%` : '--'}</span>
            }
        },
        {
            title: <div className='d-flex align-items-center justify-content-center'>
                <img src={dataStore?.op_connector_channels?.find(item => item?.code == 'other')?.logo_asset_url} width={16} height={16} className='mr-2'/>
                {formatMessage({ defaultMessage: 'Khác' })}
            </div>,
            dataIndex: 'store_id',
            key: 'store_id',
            width: '15%',
            fixed: 'center',
            align: 'center',
            render: (item, record) => {
                const vat = record?.setting_percent_vat?.find(_item => _item?.connector_channel_code == 'other');
                return <span>{!!vat?.percent || vat?.percent == 0 ? `${vat?.percent}%` : '--'}</span>
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Thao tác' }),
            dataIndex: 'store_id',
            key: 'store_id',
            width: '15%',
            fixed: 'center',
            align: 'center',
            render: (item, record) => {
                return <AuthorizationWrapper keys={['setting_finance_action']}>
                    <span
                        className='text-primary'
                        role="button"
                        onClick={() => setCurrentData(record)}
                    >
                        {formatMessage({ defaultMessage: 'Chỉnh sửa' })}
                    </span>
                </AuthorizationWrapper>
            }
        },
    ];

    return (
        <Fragment>
            <UpdateVatDialog
                // optionsStore={optionsStore}
                currentData={currentData}
                onHide={() => setCurrentData(null)}
            />
            <div className='mt-2 mb-4 d-flex align-items-center'>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="mr-2 text-info bi bi-info-circle" viewBox="0 0 18 18">
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
                    <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0" />
                </svg>
                <span className='text-info'>
                    {formatMessage({ defaultMessage: 'Cài đặt VAT hỗ trợ nhà bán tự động cập thêm VAT vào chi phí MKT và vận hành' })}
                </span>
            </div>
            <div style={{ position: 'relative' }}>
                {loadingListSettingPercentVat && (
                    <div style={{ position: 'absolute', top: '50%', left: '50%', zIndex: 99 }}>
                        <span className="spinner spinner-primary" />
                    </div>
                )}
                <Table
                    className="upbase-table"
                    style={loadingListSettingPercentVat ? { opacity: 0.4 } : {}}
                    columns={columns}
                    data={dataListSettingPercentVat?.cfGetListSettingPercentVat || []}
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