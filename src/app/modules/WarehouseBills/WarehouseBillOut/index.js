import React, { memo, useState, useEffect, useMemo, useLayoutEffect, Fragment } from 'react';
import { useParams } from 'react-router-dom';
import { useSubheader } from '../../../../_metronic/layout';
import { useQuery } from '@apollo/client';
import query_warehouse_bills_by_pk from '../../../../graphql/query_warehouse_bills_by_pk';
import { Formik } from 'formik';
import WarehouseBillInfo from '../components/WarehouseBillInfo';
import { Helmet } from 'react-helmet-async';
import _ from 'lodash';
import { PRODUCT_TYPE_OPTIONS, PROTOCOL_IN, PROTOCOL_OUT } from '../WarehouseBillsUIHelper';
import TableWarehouseBillOut from '../components/TableWarehouseBillOut';
import { RouterPrompt } from '../../../../components/RouterPrompt';
import { useIntl } from 'react-intl';
import TableWarehouseBillOutExpire from '../components/TableWarehouseBillOutExpire';

const WarehouseBillOut = ({ }) => {
    const { formatMessage } = useIntl();
    const params = useParams();
    const { setBreadcrumbs } = useSubheader();
    const [warehouseBillSchema, setWarehouseBillSchema] = useState(null);

    useLayoutEffect(
        () => {
            setBreadcrumbs([
                {
                    title: formatMessage({ defaultMessage: 'Xuất nhập kho' }),
                },
                {
                    title: formatMessage({ defaultMessage: 'Cập nhật phiếu xuất kho' }),
                }
            ])
        }, []
    );

    const { data, loading, error, refetch } = useQuery(query_warehouse_bills_by_pk, {
        variables: {
            id: Number(params.id)
        },
        fetchPolicy: 'cache-and-network'
    });

    const initialValues = useMemo(
        () => {
            if (!data?.warehouse_bills_by_pk) return {};
            let initial = {};

            initial[`code`] = data?.warehouse_bills_by_pk?.code || "";
            initial[`warehouseId`] = { value: data?.warehouse_bills_by_pk?.warehouse?.id, label: data?.warehouse_bills_by_pk?.warehouse?.name }
            initial['productType'] = data?.warehouse_bills_by_pk?.product_type !=2 ? PRODUCT_TYPE_OPTIONS.find(option => option.value == data?.warehouse_bills_by_pk?.product_type) : {
                value: 2,
                label: 'Loại hỗn hợp'
            }
            initial['expectReceiveTime'] = data?.warehouse_bills_by_pk?.estimated_delivery_at || null

            const findedProtocol = _.find(
                data?.warehouse_bills_by_pk?.type == 'in' ? PROTOCOL_IN : PROTOCOL_OUT,
                _bill => _bill?.value == data?.warehouse_bills_by_pk?.protocol
            );

            initial[`protocol`] = findedProtocol;
            initial[`note`] = data?.warehouse_bills_by_pk?.note || '';

            return initial;
        }, [data?.warehouse_bills_by_pk]
    );

    const onUpdateWarehouseBill = async (values) => {
        console.log({ values });
    };

    return (
        <Fragment>
            <Helmet
                titleTemplate={`${formatMessage({ defaultMessage: 'Cập nhật phiếu xuất kho' })} - UpBase`}
                defaultTitle={`${formatMessage({ defaultMessage: 'Cập nhật phiếu xuất kho' })} - UpBase`}
            >
                <meta name="description" content={`${formatMessage({ defaultMessage: 'Cập nhật phiếu xuất kho' })} - UpBase`} />
            </Helmet>
            {loading && <div className='ml-6 w-100 mt-18' style={{ position: 'absolute' }} >
                <span className="spinner spinner-primary"></span>
            </div>}
            {!loading && (
                <Formik
                    initialValues={initialValues}
                    validationSchema={warehouseBillSchema}
                    enableReinitialize
                    onSubmit={onUpdateWarehouseBill}
                >
                    {({
                        values,
                        handleSubmit,
                        validateForm,
                        setFieldValue
                    }) => {
                        const changed = values['__changed__'];
                        console.log(values['productType'])
                        return (
                            <Fragment>
                                <RouterPrompt
                                    forkWhen={changed}
                                    when={changed}
                                    title={formatMessage({ defaultMessage: 'Lưu ý mọi thông tin bạn nhập trước đó sẽ không được lưu lại?' })}
                                    cancelText={formatMessage({ defaultMessage: 'Quay lại' })}
                                    okText={formatMessage({ defaultMessage: 'Tiếp tục' })}
                                    onOK={() => true}
                                    onCancel={() => false}
                                />
                                <WarehouseBillInfo
                                    type={data?.warehouse_bills_by_pk?.type}
                                    status={data?.warehouse_bills_by_pk?.status}
                                    order_code={data?.warehouse_bills_by_pk?.order_code}
                                    order_id={data?.warehouse_bills_by_pk?.order_id}
                                />
                                {values['productType']?.value == 0 && <TableWarehouseBillOut
                                    status={data?.warehouse_bills_by_pk?.status}
                                    warehouse={data?.warehouse_bills_by_pk?.warehouse}
                                    onSetSchema={schema => setWarehouseBillSchema(schema)}
                                    order_id={data?.warehouse_bills_by_pk?.order_id}
                                />}
                                {!!values['productType']?.value && <TableWarehouseBillOutExpire
                                    status={data?.warehouse_bills_by_pk?.status}
                                    warehouse={data?.warehouse_bills_by_pk?.warehouse}
                                    onSetSchema={schema => setWarehouseBillSchema(schema)}
                                    order_id={data?.warehouse_bills_by_pk?.order_id}
                                />}

                            </Fragment>
                        )
                    }}
                </Formik>
            )}
        </Fragment>
    );
};

export default memo(WarehouseBillOut);