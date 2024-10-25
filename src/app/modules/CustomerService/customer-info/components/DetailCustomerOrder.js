import React, { Fragment, useMemo, useState, memo } from 'react'
import { useIntl } from 'react-intl';
import { useHistory } from "react-router-dom";
import Table from 'rc-table';
import dayjs from 'dayjs';
import { formatNumberToCurrency } from '../../../../../utils';
import { toAbsoluteUrl } from '../../../../../_metronic/_helpers';
import DetailTabOrder from './DetailTabOrder';
import DetailTabReturnOrder from './DetailTabReturnOrder';
import clsx from 'clsx';

const DetailCustomerOrder = ({ optionsChannelCode, optionsStore }) => {
    const { formatMessage } = useIntl();
    const [currentTab, setCurrentTab] = useState(1);

    const tabOrder = [
        {
            id: 1,
            title: formatMessage({ defaultMessage: 'Đơn hàng' }),
            component: <DetailTabOrder optionsStore={optionsStore} />
        },
        {
            id: 2,
            title: formatMessage({ defaultMessage: 'Đơn hoàn' }),
            component: <DetailTabReturnOrder optionsStore={optionsStore} />
        },
    ]

    return (
        <Fragment>
            <div className="d-flex my-4" style={{ zIndex: 1 }}>
                <div style={{ flex: 1 }}>
                    <ul className="nav nav-tabs">
                        {tabOrder.map(tab => (
                            <li
                                key={`customer-order-tab-${tab.id}`}
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
            {tabOrder?.find(tab => tab.id == currentTab)['component']}
        </Fragment>
    )
};

export default memo(DetailCustomerOrder);