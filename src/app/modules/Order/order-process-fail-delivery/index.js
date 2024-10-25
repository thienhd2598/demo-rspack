import React, { Fragment, memo, useEffect } from 'react';
import { OrderProcessProvider } from './context';
import { useIntl } from 'react-intl';
import ScrollTop from './components/ScrollTop';
import { Helmet } from 'react-helmet-async';
import OrderProcessPage from './OrderProcessPage';
import { useSubheader } from '../../../../_metronic/layout';

const OrderProcessFailDelivery = () => {
    const { setBreadcrumbs } = useSubheader()
    const { formatMessage } = useIntl();

    const title = `${formatMessage({ defaultMessage: 'Xử lý hàng loạt đơn huỷ bất thường' })} - Upbase`

    useEffect(() => {
        setBreadcrumbs([
            {
                title: formatMessage({ defaultMessage: 'Xử lý đơn trả hàng' }),
                pathname: '/orders/fail-delivery-order'
            },
            {
                title: formatMessage({ defaultMessage: 'Xử lý đơn hủy bất thường hàng loạt' }),
                pathname: '/orders/fail-delivery-order-process'
            }
        ])
    }, []);

    return (
        <Fragment>
            <Helmet
                titleTemplate={title}
                defaultTitle={title}
            >
                <meta name="description" content={title} />
            </Helmet>
            <OrderProcessProvider>
                <OrderProcessPage />
            </OrderProcessProvider>
            <ScrollTop />
        </Fragment>
    )
};

export default memo(OrderProcessFailDelivery);