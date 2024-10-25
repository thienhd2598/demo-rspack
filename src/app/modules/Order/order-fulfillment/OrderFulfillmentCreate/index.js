import React, { memo, useCallback, useState, useMemo, Fragment, useLayoutEffect } from "react";
import { OrderFulfillmentProvider, useOrderFulfillmentContext } from "../context/OrderFulfillmentContext";
import { useSubheader } from "../../../../../_metronic/layout";
import { useIntl } from "react-intl";
import { Helmet } from "react-helmet-async";
import LoadingDialog from "../../../FrameImage/LoadingDialog";
import { RouterPrompt } from "../../../../../components/RouterPrompt";
import { Form, Formik } from "formik";
import { Card } from "../../../../../_metronic/_partials/controls";
import SectionActions from "./SectionActions";
import SectionFilter from "./SectionFilter";
import SectionTable from "./SectionTable";
import { useToasts } from "react-toast-notifications";
import { useMutation } from "@apollo/client";
import { useHistory } from 'react-router-dom';
import mutate_sfCreateSessionPickup from "../../../../../graphql/mutate_sfCreateSessionPickup";
import ModalResultCreatePickup from "../components/ModalResultCreatePickup";
import ModalConfigWarehouse from "../components/ModalConfigWarehouse";

const OrderFulfillmentCreate = () => {
    const { formatMessage } = useIntl();
    const { initialValues, validateSchema, ids, isInitLoadPackages, searchParams, optionsSmeWarehouse } = useOrderFulfillmentContext();
    const { addToast } = useToasts();
    const history = useHistory();
    const [dataResults, setDataResults] = useState(null);
    const [configWarehouse, setConfigWarehouse] = useState(null);

    const [mutateCreatePickup, { loading }] = useMutation(mutate_sfCreateSessionPickup);

    const onCreateOrderFulfillment = useCallback(async (values, total, isCreateFilter, cb, isCheckConfig = true) => {
        try {
            const warehouse = optionsSmeWarehouse?.find(wh => wh?.value == values?.smeWarehouse);

            if (isCheckConfig && (!warehouse?.max_mio || !warehouse?.max_sio)) {
                setConfigWarehouse({ values, total, isCreateFilter, cb, isCheckConfig: false })
                return;
            }

            const { data } = await mutateCreatePickup({
                variables: {
                    ...(isCreateFilter ? {} : {
                        list_package_id: ids?.map(item => item?.id)
                    }),
                    session_pickup_type: values?.session_pickup_type == 'grp'
                        ? values?.session_sub_pickup_type
                        : [values?.session_pickup_type],
                    session_pickup_note: values?.session_pickup_note,
                    search: {
                        is_connected: 1,
                        is_smart_fulfillment: 1,
                        ...searchParams,
                    }
                }
            })

            if (data?.sfCreateSessionPickup) {
                cb();
                setDataResults(data?.sfCreateSessionPickup)
            } else {
                addToast(formatMessage({ defaultMessage: 'Tạo danh sách xử lý đơn thất bại' }), { appearance: 'error' })
            }


        } catch (error) {
            addToast(formatMessage({ defaultMessage: 'Có lỗi xảy ra, xin vui lòng thử lại' }), { appearance: 'error' })
        }
    }, [ids, searchParams, optionsSmeWarehouse]);

    return <Fragment>
        <LoadingDialog />
        <Formik
            initialValues={initialValues}
            enableReinitialize
            validationSchema={validateSchema}
        >
            {({ values }) => {
                const changed = values['__changed__'];

                const warehouseSelected = optionsSmeWarehouse?.find(wh => wh?.value == values?.smeWarehouse);

                return (
                    <Form>
                        <RouterPrompt
                            when={changed}
                            title={formatMessage({ defaultMessage: 'Bạn đang tạo danh sách xử lý. Mọi thông tin bạn tạo trước đó sẽ bị xoá nếu bạn thoát màn hình này. Bạn có chắc chắn muốn thoát?' })}
                            cancelText={formatMessage({ defaultMessage: 'Không' })}
                            okText={formatMessage({ defaultMessage: 'Có, Thoát' })}
                            onOK={() => true}
                            onCancel={() => false}
                        />
                        <LoadingDialog show={loading} />
                        <ModalConfigWarehouse
                            show={!!configWarehouse}
                            onHide={() => setConfigWarehouse(null)}
                            onConfirm={() => onCreateOrderFulfillment(configWarehouse?.values, configWarehouse?.total, configWarehouse?.isCreateFilter, configWarehouse?.cb, configWarehouse?.isCheckConfig)}
                            warehouse={warehouseSelected}
                        />
                        <ModalResultCreatePickup
                            result={dataResults}
                            onHide={() => {
                                setDataResults(null);
                                history.push('/orders/fulfillment/list');
                            }}
                        />
                        <div className="row">
                            <div className="col-9">
                                <Card>
                                    <SectionFilter />
                                    {!isInitLoadPackages && <Fragment>
                                        <div className="w-100" style={{ height: 1, background: '#ebedf3' }} />
                                        <SectionTable />
                                    </Fragment>}
                                </Card>
                            </div>
                            <div className="col-3">
                                <SectionActions
                                    onCreateOrderFulfillment={onCreateOrderFulfillment}
                                />
                            </div>
                        </div>
                    </Form>
                )
            }}
        </Formik>
    </Fragment>
}

const OrderFulfillmentCreateWrapper = () => {
    const { formatMessage } = useIntl();
    const { setBreadcrumbs } = useSubheader();

    useLayoutEffect(() => {
        setBreadcrumbs([
            { title: formatMessage({ defaultMessage: 'Tạo danh sách xử lý' }) }
        ])
    }, []);

    return <Fragment>
        <Helmet
            titleTemplate={formatMessage({ defaultMessage: 'Tạo danh sách xử lý' })}
            defaultTitle={formatMessage({ defaultMessage: 'Tạo danh sách xử lý' })}
        >
            <meta
                name="description"
                content={formatMessage({ defaultMessage: 'Tạo danh sách xử lý' })}
            />
        </Helmet>
        <OrderFulfillmentProvider>
            <OrderFulfillmentCreate />
        </OrderFulfillmentProvider>
    </Fragment>
}

export default OrderFulfillmentCreateWrapper;