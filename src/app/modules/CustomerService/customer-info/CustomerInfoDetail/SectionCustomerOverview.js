import clsx from 'clsx';
import React, { Fragment, memo, useMemo, useState } from 'react';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useIntl } from 'react-intl';
import DetailCustomerService from '../components/DetailCustomerService';
import DetailCustomerReceive from '../components/DetailCustomerReceive';
import DetailCustomerOrder from '../components/DetailCustomerOrder';
import DetailCustomerProduct from '../components/DetailCustomerProduct';
import DetailCustomerRating from '../components/DetailCustomerRating';
import { formatNumberToCurrency } from '../../../../../utils';

const SectionCustomerOverview = ({ loading, data, optionsProvince, optionsDistrict, optionsChannelCode, optionsStore }) => {
    const { formatMessage } = useIntl();
    const [currentTab, setCurrentTab] = useState(1);

    const tabOverview = [
        {
            id: 1,
            title: formatMessage({ defaultMessage: 'Hoạt động CSKH' }),
            component: <DetailCustomerService />
        },
        {
            id: 2,
            title: formatMessage({ defaultMessage: 'Thông tin nhận hàng' }),
            component: <DetailCustomerReceive optionsProvince={optionsProvince} optionsDistrict={optionsDistrict} />
        },
        {
            id: 3,
            title: formatMessage({ defaultMessage: 'Đơn hàng' }),
            component: <DetailCustomerOrder optionsChannelCode={optionsChannelCode} optionsStore={optionsStore} />
        },
        {
            id: 4,
            title: formatMessage({ defaultMessage: 'Sản phẩm' }),
            component: <DetailCustomerProduct />
        },
        {
            id: 5,
            title: formatMessage({ defaultMessage: 'Đánh giá' }),
            component: <DetailCustomerRating optionsStore={optionsStore} />
        },
    ];

    const dataOverview = useMemo(() => {
        return [
            {
                id: 1,
                title: formatMessage({ defaultMessage: "Đơn hàng hiệu quả" }),
                tooltip: formatMessage({ defaultMessage: "Đơn hàng hiệu quả tương ứng với khách hàng không bao gồm đơn hoàn và đơn huỷ" }),
                count: !!data ? formatNumberToCurrency(data?.count_order) : '--',
            },
            {
                id: 2,
                title: formatMessage({ defaultMessage: 'Tổng tiền hiệu quả' }),
                tooltip: formatMessage({ defaultMessage: "Tổng tiền hiệu quả tương ứng với khách hàng không bao gồm tiền hoàn và tiền huỷ" }),
                count: !!data ? formatNumberToCurrency(data?.total_paid) : '--',
            },
            {
                id: 3,
                title: formatMessage({ defaultMessage: 'Số sản phẩm' }),
                tooltip: formatMessage({ defaultMessage: "Số sản phẩm khách hàng đã mua" }),
                count: !!data ? formatNumberToCurrency(data?.count_product) : '--',
            },
            {
                id: 4,
                title: formatMessage({ defaultMessage: 'Đánh giá' }),
                count: !!data ? formatNumberToCurrency(data?.total_rating) : '--',
            }
        ]
    }, [data]);

    return (
        <div className='customer-overview-wrapper'>
            <h3 className="txt-title mb-4">{formatMessage({ defaultMessage: "Tổng quan" })}</h3>
            <div className="row section-top p-4">
                {dataOverview?.map((_operate, index) => {
                    return (
                        <div
                            key={`operate-${index}`}
                            className={`box-vh col-3 d-flex flex-column align-items-center justify-content-center ${index != 0 ? 'divider-db' : ''} py-2`}
                        >
                            {loading ? <div className='mb-8'>
                                <span className='spinner spinner-primary' />
                            </div> : <span className="txt-vh-title mb-2">{_operate?.count}{_operate?.id == 2 ? 'đ' : ''}</span>}
                            <div className="d-flex align-items-center">
                                <span className="txt-vh-des fs-14">{_operate?.title}</span>
                                {_operate?.tooltip && (
                                    <OverlayTrigger
                                        overlay={
                                            <Tooltip>{_operate?.tooltip}</Tooltip>
                                        }
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="ml-2 bi bi-info-circle" viewBox="0 0 16 16">
                                            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
                                            <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0" />
                                        </svg>
                                    </OverlayTrigger>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
            <div className="d-flex mt-8 mb-4" style={{ zIndex: 1 }}>
                <div style={{ flex: 1 }}>
                    <ul className="nav nav-tabs">
                        {tabOverview.map(tab => (
                            <li
                                key={`sc-report-product-tab-${tab.id}`}
                                className="nav-item"
                                onClick={() => setCurrentTab(tab?.id)}
                            >
                                <a
                                    className={clsx('nav-link fs-14', { active: currentTab == tab.id })}
                                >
                                    <span>{tab?.title}</span>
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            {tabOverview?.find(tab => tab.id == currentTab)['component']}
        </div>
    )
};

export default memo(SectionCustomerOverview);