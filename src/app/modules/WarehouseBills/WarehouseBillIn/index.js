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
import TableWarehouseBillIn from '../components/TableWarehouseBillIn';
import { RouterPrompt } from '../../../../components/RouterPrompt';
import { useIntl } from 'react-intl';
import TableWarehouseBillInExpire from '../components/TableWarehouseBillInExpire';
import TableWarehouseWaitingIn from '../components/TableWarehouseWaitingIn';
import TableWarehouseWaitingInExpire from '../components/TableWarehouseWaitingInExpire';

const WarehouseBillIn = ({ }) => {
    const { formatMessage } = useIntl();
    const params = useParams();
    const { setBreadcrumbs } = useSubheader();
    const [expense, setExpense] = useState([]);
    const [warehouseBillSchema, setWarehouseBillSchema] = useState(null);

    
    const { data, loading, error, refetch } = useQuery(query_warehouse_bills_by_pk, {
        variables: {
            id: Number(params.id)
        },
        fetchPolicy: 'cache-and-network'
    });
    
    const title = useMemo(() => {
        return data?.warehouse_bills_by_pk?.status == 'waiting' ? formatMessage({ defaultMessage: 'Cập nhật phiếu chờ nhập kho' }) : formatMessage({ defaultMessage: 'Cập nhật phiếu nhập kho' })
    }, [data?.warehouse_bills_by_pk?.status])
    useMemo(
        () => {
            setBreadcrumbs([
                {
                    title: formatMessage({ defaultMessage: 'Xuất nhập kho' }),
                },
                {
                    title: title,
                }
            ])
        }, [title]
    );
    console.log('dataPk', data);

    const initialValues = useMemo(
        () => {
            if (!data?.warehouse_bills_by_pk) return {};
            let initial = {};

            initial[`code`] = data?.warehouse_bills_by_pk?.code || "";
            initial[`warehouseId`] = { value: data?.warehouse_bills_by_pk?.warehouse?.id, label: data?.warehouse_bills_by_pk?.warehouse?.name }
            initial['productType'] =  data?.warehouse_bills_by_pk?.product_type !=2 ? PRODUCT_TYPE_OPTIONS.find(option => option.value == data?.warehouse_bills_by_pk?.product_type) : {
                value: 2,
                label: 'Loại hỗn hợp'
            }
            initial['expectReceiveTime'] = data?.warehouse_bills_by_pk?.estimated_delivery_at || null

            const findedProtocol = _.find(
                data?.warehouse_bills_by_pk?.type == 'in' ? PROTOCOL_IN : PROTOCOL_OUT,
                _bill => _bill?.value == data?.warehouse_bills_by_pk?.protocol
            );

            initial[`protocol`] = findedProtocol;
            initial[`total-price`] = (data?.warehouse_bills_by_pk?.total_price - data?.warehouse_bills_by_pk?.total_discount) || 0;
            initial[`total-discount`] = data?.warehouse_bills_by_pk?.total_discount || 0;
            initial[`total-bill`] = data?.warehouse_bills_by_pk?.total_quantity || 0;
            initial[`note`] = data?.warehouse_bills_by_pk?.note || '';
            initial[`bill-vat`] = data?.warehouse_bills_by_pk?.vat || 0;

            if (data?.warehouse_bills_by_pk?.fee_items?.length > 0) {
                setExpense(
                    data?.warehouse_bills_by_pk?.fee_items?.map((_fee) => ({
                        id: _fee?.id,
                        type: 'increase'
                    }))
                );
                data.warehouse_bills_by_pk.fee_items.forEach(_fee => {
                    initial[`bill-expense-${_fee?.id}-title`] = _fee?.title;
                    initial[`bill-expense-${_fee?.id}-value`] = _fee?.value;
                });
            } else {
                setExpense([]);
            }

            return initial;
        }, [data?.warehouse_bills_by_pk]
    );    

    return (
        <Fragment>
            <Helmet
                titleTemplate={`${title} - UpBase`}
                defaultTitle={`${title} - UpBase`}
            >
                <meta name="description" content={`${title} - UpBase`} />
            </Helmet>
            {loading && <div className='ml-6 w-100 mt-18' style={{ position: 'absolute' }} >
                <span className="spinner spinner-primary"></span>
            </div>}
            {!loading && (
                <Formik
                    initialValues={initialValues}
                    validationSchema={warehouseBillSchema}
                    enableReinitialize
                >
                    {({
                        values,
                        handleSubmit,
                        validateForm,
                        setFieldValue
                    }) => {
                        const changed = values['__changed__'];

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
                                    product_type={data?.warehouse_bills_by_pk?.product_type}
                                />
                               {values['productType']?.value == 0 && data?.warehouse_bills_by_pk?.status != 'waiting' && <TableWarehouseBillIn
                                    status={data?.warehouse_bills_by_pk?.status}
                                    warehouse={data?.warehouse_bills_by_pk?.warehouse}
                                    onSetSchema={schema => setWarehouseBillSchema(schema)}
                                    expense={expense}
                                    setExpense={setExpense}
                                    generalData={data?.warehouse_bills_by_pk}
                                />}
                                {!!values['productType']?.value && data?.warehouse_bills_by_pk?.status != 'waiting' && <TableWarehouseBillInExpire 
                                    status={data?.warehouse_bills_by_pk?.status}
                                    warehouse={data?.warehouse_bills_by_pk?.warehouse}
                                    onSetSchema={schema => setWarehouseBillSchema(schema)}
                                    expense={expense}
                                    setExpense={setExpense}
                                    generalData={data?.warehouse_bills_by_pk}
                                />}
                                {data?.warehouse_bills_by_pk?.product_type == 0 && data?.warehouse_bills_by_pk?.status == 'waiting'&& <TableWarehouseWaitingIn
                                    status={data?.warehouse_bills_by_pk?.status}
                                    onSetSchema={schema => setWarehouseBillSchema(schema)}
                                />}
                                {!!data?.warehouse_bills_by_pk?.product_type && data?.warehouse_bills_by_pk?.status == 'waiting' && <TableWarehouseWaitingInExpire
                                    status={data?.warehouse_bills_by_pk?.status}
                                    onSetSchema={schema => setWarehouseBillSchema(schema)}
                                />}

                            </Fragment>
                        )
                    }}
                </Formik>
            )}
        </Fragment>
    );
};

export default memo(WarehouseBillIn);
