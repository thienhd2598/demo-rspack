import { Fragment, useLayoutEffect } from 'react';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import { Helmet } from "react-helmet-async";
import { Card, CardBody } from "../../../../../_metronic/_partials/controls";
import OrderSessionReceivedList from '../OrderSessionReceivedList';
import { useIntl } from 'react-intl';
import OrderSessionDeliveryList from '../OrderSessionDeliveryList';
import { OrderSessionHandoverProvider, useOrderSessionHandoverContext } from '../context/OrderSessionHandoverContext';
import { useSubheader } from '../../../../../_metronic/layout';

const OrderSessionHandover = () => {
    const { tab, setTab } = useOrderSessionHandoverContext();

    return (
        <Card>
            <CardBody>
                <Tabs
                    defaultActiveKey={"delivery"}
                    className="mb-3"
                    activeKey={tab}
                    onSelect={(t) => {
                        setTab(t);
                    }}
                >
                    <Tab eventKey="delivery" title="Phiên giao">
                        {tab === "delivery" && <OrderSessionDeliveryList />}
                    </Tab>
                    <Tab eventKey="receive" title="Phiên nhận">
                        {tab === "receive" && <OrderSessionReceivedList />}
                    </Tab>
                </Tabs>
            </CardBody>
        </Card>

    )
}


const OrderSessionHandoverWrapper = () => {
    const { formatMessage } = useIntl();
    const { setBreadcrumbs } = useSubheader();

    useLayoutEffect(() => {
        setBreadcrumbs([
            { title: formatMessage({ defaultMessage: 'Danh sách phiên giao' }) }
        ])
    }, []);

    return <Fragment>
        <Helmet
            titleTemplate={formatMessage({ defaultMessage: 'Danh sách phiên giao - UpBase' })}
            defaultTitle={formatMessage({ defaultMessage: 'Danh sách phiên giao - UpBase' })}
        >
            <meta
                name="description"
                content={formatMessage({ defaultMessage: 'Danh sách phiên giao - UpBase' })}
            />
        </Helmet><OrderSessionHandoverProvider>
            <OrderSessionHandover />
        </OrderSessionHandoverProvider> </Fragment>
}
export default OrderSessionHandoverWrapper