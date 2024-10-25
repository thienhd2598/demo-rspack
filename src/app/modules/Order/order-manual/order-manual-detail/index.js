import React, { Fragment, useState, memo, useCallback, useLayoutEffect, useMemo } from 'react';
import { OrderManualProvider, useOrderManualContext } from '../OrderManualContext';
import { useIntl } from 'react-intl';
import { Helmet } from 'react-helmet-async';
import { useSubheader } from '../../../../../_metronic/layout';
import { toAbsoluteUrl } from '../../../../../_metronic/_helpers';
import CostSection from '../components/CostSection';
import Step1 from '../components/Step1';
import Step2 from '../components/Step2';
import { Formik } from 'formik';
import 'rc-table/assets/index.css';
import { OPTIONS_CHANNEL, OPTIONS_LOGISTIC_PICKUP, OPTIONS_PAYMENT_METHOD, OPTIONS_UNIT } from '../OrderManualHelper';
import { useToasts } from 'react-toast-notifications';
import { useParams, useLocation } from 'react-router-dom';
import { pick } from 'lodash';
import dayjs from 'dayjs';
import { useQuery } from '@apollo/client';
import query_scGetOrder from '../../../../../graphql/query_scGetOrder';
import client from '../../../../../apollo';
import query_sme_catalog_product_variant from '../../../../../graphql/query_sme_catalog_product_variant';
import query_crmFindCrmCustomerRecipientAddress from '../../../../../graphql/query_crmFindCrmCustomerRecipientAddress';
import query_crmFindCustomer from '../../../../../graphql/query_crmFindCustomer';
import query_sme_catalog_inventory_items from '../../../../../graphql/query_sme_catalog_inventory_items';
import { RouterPrompt } from '../../../../../components/RouterPrompt';
import RelatedOrder from '../components/RelatedOrder';
import { queryGetWards } from '../../../CustomerService/customer-info/dialogs/CreateCustomerDialog';

export const queryGetSmeInventoryItems = async (ids, sme_store_id) => {
    if (ids?.length == 0) return [];

    const { data } = await client.query({
        query: query_sme_catalog_inventory_items,
        variables: {
            where: {
                variant_id: { _in: ids?.filter(Boolean) },
                sme_store_id: {
                    _eq: sme_store_id
                }
            },
        },
        fetchPolicy: "network-only",
    });

    return data?.sme_catalog_inventory_items || [];
}

const queryCrmCustomerRecipientAddress = async (sc_recipient_address_id) => {
    if (!sc_recipient_address_id) return null;

    const { data } = await client.query({
        query: query_crmFindCrmCustomerRecipientAddress,
        variables: {
            sc_recipient_address_id: sc_recipient_address_id
        },
        fetchPolicy: "network-only",
    });

    return data?.crmFindCrmCustomerRecipientAddress
}

const queryCrmCustomer = async (sc_customer_id) => {
    if (!sc_customer_id) return null;

    const { data } = await client.query({
        query: query_crmFindCustomer,
        variables: {
            sc_customer_id: sc_customer_id
        },
        fetchPolicy: "network-only",
    });

    return data?.crmFindCustomer
}

const OrderManualCreateLayout = memo(() => {
    const { formatMessage } = useIntl();
    const params = useParams();
    const location = useLocation()
    const { step, stepPassed, deliverys, setStep, optionsRuleCheck, optionsTypeOrderSale, validateSchema, variantsOrder, setSmeWarehouseSelected } = useOrderManualContext();
    const { setInfoCustomer, opsParse, optionsFeeBearer, setInfoReceiver, optionsStore, optionsSmeWarehouse, optionsShippingUnit, setVariantsOrder, setLoadingProduct, loadingProduct } = useOrderManualContext();
    const { addToast } = useToasts();
    const [initialValues, setIntitalValues] = useState({});
    const { data: orderDetail, loading: loadingDetail } = useQuery(query_scGetOrder, {
        variables: {
            id: Number(params?.id)
        },
        fetchPolicy: 'cache-and-network'
    });
    console.log('orderDetail?.findOrderDetail', orderDetail?.findOrderDetail)
    useMemo(async () => {
        if (!orderDetail?.findOrderDetail) return;

        const crmCustomer = await queryCrmCustomer(orderDetail?.findOrderDetail?.customer?.id);
        if (!!crmCustomer) {
            setInfoCustomer(prev => ({ ...prev, id: crmCustomer?.id }));
        }

        const crmReceiver = await queryCrmCustomerRecipientAddress(orderDetail?.findOrderDetail?.customerRecipientAddress?.id);
        if (!!crmReceiver) {
            setInfoReceiver(prev => ({ ...prev, id: crmReceiver?.id }));
        }
    }, [orderDetail]);    

    useMemo(async () => {
        try {
            setLoadingProduct(true);
            let inits = {
                payment_method_step2: OPTIONS_PAYMENT_METHOD[0],
                shipping_original_fee_step2: 0,
                promotion_seller_amount_step2: 0,
                shipping_discount_seller_fee_step2: 0,
                order_at_step1: dayjs().unix()
            }

            if (orderDetail?.findOrderDetail) {
                setInfoCustomer(prev => ({
                    ...prev,
                    sc_customer_id: orderDetail?.findOrderDetail?.customer?.id,
                }));

                setInfoReceiver(prev => ({
                    ...prev,
                    sc_recipient_address_id: orderDetail?.findOrderDetail?.customerRecipientAddress?.id,
                }));

                const smeVariants = await queryGetSmeInventoryItems(
                    orderDetail?.findOrderDetail?.orderItems?.map(item => item?.sme_variant_id),
                    orderDetail?.findOrderDetail?.logisticsPackages?.[0]?.sme_warehouse_id
                );
                const newSmeVariants = smeVariants.map(variant => {
                    if (orderDetail?.findOrderDetail?.orderItems?.filter(item => item?.sme_variant_id == variant?.variant_id)?.length) {
                        return {
                            ...variant,
                            is_gift: orderDetail?.findOrderDetail?.orderItems?.filter(item => item?.sme_variant_id == variant?.variant_id)[0]?.is_gift
                        }
                    }
                    return variant
                })
                setLoadingProduct(false);

                setVariantsOrder(newSmeVariants);

                const smeWarehouse = optionsSmeWarehouse?.find(wh => wh?.value == orderDetail?.findOrderDetail?.logisticsPackages?.[0]?.sme_warehouse_id);
                setSmeWarehouseSelected(smeWarehouse);

                const orderItems = orderDetail?.findOrderDetail?.orderItems?.reduce((result, value) => {
                    result[`variant_${value?.sme_variant_id}_order_item_id`] = value?.id;
                    result[`variant_${value?.sme_variant_id}_price_step1`] = (!location?.state?.isSale && !!value?.original_price) ? (value?.original_price / value?.quantity_purchased) : 0;
                    result[`variant_${value?.sme_variant_id}_quantity_step1`] = value?.quantity_purchased;
                    result[`variant_${value?.sme_variant_id}_discount_step1`] = (!location?.state?.isSale && !!value?.discount_seller_amount) ? (value?.discount_seller_amount / value?.quantity_purchased) : 0;
                    result[`variant_${value?.sme_variant_id}_unit_step1`] = location?.state?.isSale ? null : OPTIONS_UNIT[0];


                    return result;
                }, {})

                const wards = await queryGetWards(orderDetail?.findOrderDetail?.customerRecipientAddress?.district_code)

                inits = {
                    ...inits,
                    ...orderItems,
                    order_id: orderDetail?.findOrderDetail?.id,
                    wards: (wards || [])?.map(ward => ({ label: ward?.full_name, value: ward?.code })),
                    related_order_id: orderDetail?.findOrderDetail?.related_order_id,
                    package_id: orderDetail?.findOrderDetail?.logisticsPackages?.[0]?.id,
                    name_customer_step1: orderDetail?.findOrderDetail?.customer?.full_name,
                    phone_customer_step1: orderDetail?.findOrderDetail?.customer?.phone,
                    name_receiver_step1: orderDetail?.findOrderDetail?.customerRecipientAddress?.full_name,
                    phone_receiver_step1: orderDetail?.findOrderDetail?.customerRecipientAddress?.phone,
                    type_order_sale: optionsTypeOrderSale?.find(option => option?.value == orderDetail?.findOrderDetail?.after_sale_type),
                    district_step1: opsParse?.find(district => orderDetail?.findOrderDetail?.customerRecipientAddress?.district_code == district?.value) || null,
                    province_step1: orderDetail?.findOrderDetail?.customerRecipientAddress?.state_code ? {
                        value: orderDetail?.findOrderDetail?.customerRecipientAddress?.state_code,
                        label: orderDetail?.findOrderDetail?.customerRecipientAddress?.state,
                    } : null,
                    ward: orderDetail?.findOrderDetail?.customerRecipientAddress?.ward_code ? {
                        value: orderDetail?.findOrderDetail?.customerRecipientAddress?.ward_code,
                        label: orderDetail?.findOrderDetail?.customerRecipientAddress?.ward,
                    } : null,
                    shipping_rule_check: location?.state?.isSale ? '' : optionsRuleCheck?.find(option => option?.value == orderDetail?.findOrderDetail?.logisticsPackages?.[0]?.shipping_rule_check),
                    note_step1: orderDetail?.findOrderDetail?.note,
                    fee_bearer: location?.state?.isSale ? '' : optionsFeeBearer?.find(option => option?.value == orderDetail?.findOrderDetail?.shipping_fee_by),
                    address_step1: orderDetail?.findOrderDetail?.customerRecipientAddress?.full_address,
                    channel_step1: OPTIONS_CHANNEL?.find(channel => channel?.value == orderDetail?.findOrderDetail?.connector_channel_code),
                    store_step1: optionsStore?.find(store => store?.value == orderDetail?.findOrderDetail?.store_id),
                    person_charge_step1: orderDetail?.findOrderDetail?.person_in_charge,
                    order_code_step1: location?.state?.isSale ? '' : orderDetail?.findOrderDetail?.ref_id,
                    order_at_step1: location?.state?.isSale ? Math.floor(Date.now()) / 1000 : orderDetail?.findOrderDetail?.order_at,
                    sme_warehouse_step1: smeWarehouse,
                    payment_transaction_code_step2: orderDetail?.findOrderDetail?.payment_transaction_code,
                    payment_method_step2: OPTIONS_PAYMENT_METHOD?.find(item => item?.value == orderDetail?.findOrderDetail?.payment_method),
                    shipping_discount_seller_fee_step2: location?.state?.isSale ? 0 : (orderDetail?.findOrderDetail?.shipping_discount_seller_fee || 0),                                        
                    shipping_original_fee_step2: location?.state?.isSale ? 0 : (orderDetail?.findOrderDetail?.logisticsPackages?.[0]?.shipping_type != 2 ? orderDetail?.findOrderDetail?.shipping_original_fee : 0),
                    shipping_original_fee_logistic: location?.state?.isSale ? 0 : (orderDetail?.findOrderDetail?.logisticsPackages?.[0]?.shipping_type == 2 ? orderDetail?.findOrderDetail?.shipping_original_fee : 0),
                    promotion_seller_amount_step2: location?.state?.isSale ? 0 : (orderDetail?.findOrderDetail?.promotion_seller_amount || 0),
                    paid_at_step2: orderDetail?.findOrderDetail?.paid_at,
                    s3_document_step2: location?.state?.isSale ? '' : orderDetail?.findOrderDetail?.logisticsPackages?.[0]?.s3_document,
                    package_weight_step2: location?.state?.isSale ? null : orderDetail?.findOrderDetail?.logisticsPackages?.[0]?.package_weight,
                    debounce_weight: location?.state?.isSale ? null : orderDetail?.findOrderDetail?.logisticsPackages?.[0]?.package_weight,
                    typeDelivery: orderDetail?.findOrderDetail?.logisticsPackages?.[0]?.shipping_type,
                    p_delivery_method: location?.state?.isSale ? '' : OPTIONS_LOGISTIC_PICKUP?.find(option => option?.value == orderDetail?.findOrderDetail?.p_delivery_method),
                    // service_logistic: { code: orderDetail?.findOrderDetail?.logisticsPackages?.[0]?.shipping_service, logisticId: orderDetail?.findOrderDetail?.logisticsPackages?.[0]?.logistic_provider_connected_id },
                    package_length_step2: location?.state?.isSale ? null : orderDetail?.findOrderDetail?.logisticsPackages?.[0]?.package_length,
                    package_width_step2: location?.state?.isSale ? null : orderDetail?.findOrderDetail?.logisticsPackages?.[0]?.package_width,
                    package_height_step2: location?.state?.isSale ? null : orderDetail?.findOrderDetail?.logisticsPackages?.[0]?.package_height,
                    tracking_number_step2: location?.state?.isSale ? '' : orderDetail?.findOrderDetail?.logisticsPackages?.[0]?.tracking_number,
                    shipping_carrier_step2: location?.state?.isSale ? '' : optionsShippingUnit?.find(item => item?.value == orderDetail?.findOrderDetail?.logisticsPackages?.[0]?.shipping_carrier),
                    ship_expired_at_step2: location?.state?.isSale ? '' : orderDetail?.findOrderDetail?.ship_expired_at,
                }
            }            

            setIntitalValues(inits);
        } catch (error) {
            console.log(`LOI XAY RA ROI: `, error);
        }
    }, [orderDetail, optionsStore, opsParse, optionsSmeWarehouse, optionsShippingUnit]);

    const getStyle = useCallback((curr) => {
        if (curr == step) {
            return { fontWeight: 'bold', fontSize: 14, color: '#FE5629', cursor: 'pointer' }
        }
        return { fontWeight: 'normal', fontSize: 14, cursor: 'pointer', opacity: stepPassed[`step${curr}`] ? 1 : 0.3 }
    }, [step, stepPassed]);

    return (
        <Formik
            initialValues={initialValues}
            validationSchema={validateSchema}
            enableReinitialize
        >
            {({
                submitForm,
                handleSubmit,
                values,
                setFieldValue,
                validateForm
            }) => {
                const changed = values['__changed__'];

                return <Fragment>
                    <RouterPrompt
                        when={changed}
                        title={formatMessage({ defaultMessage: 'Bạn đang sửa đơn hàng. Mọi thông tin bạn tạo trước đó sẽ bị xoá nếu bạn thoát màn hình này. Bạn có chắc chắn muốn thoát?' })}
                        cancelText={formatMessage({ defaultMessage: 'Không' })}
                        okText={formatMessage({ defaultMessage: 'Có, Thoát' })}
                        onOK={() => true}
                        onCancel={() => false}
                    />
                    <div className='row' data-sticky-container>
                        <div className='col-order-manual-left'>
                            <div className='d-flex justify-content-center align-items-center mb-6'>
                                <span style={getStyle(1)} onClick={e => {
                                    // stepPassed?.step0 && step != 0 && setStep(1)
                                    setStep(1)
                                }} >1. {formatMessage({ defaultMessage: "Thông tin đơn hàng" })}</span>
                                <img src={toAbsoluteUrl('/media/line.svg')} className='mx-6' />
                                <span style={getStyle(2)} onClick={async e => {
                                    const errors = await validateForm(values);
                                    const errorsStep1 = pick(errors, Object.keys(errors)?.filter(key => key.endsWith('step1')));

                                    if (Object.values(errorsStep1).length > 0) {
                                        handleSubmit();
                                        addToast(formatMessage({ defaultMessage: 'Vui lòng nhập đầy đủ các trường thông tin đã được khoanh đỏ' }), { appearance: 'error' })
                                        return;
                                    }

                                    if (!values?.[`order_at_step1`]) {
                                        addToast(formatMessage({ defaultMessage: 'Vui lòng chọn ngày đặt hàng' }), { appearance: 'error' })
                                        return;
                                    }

                                    if (variantsOrder?.length == 0) {
                                        addToast(formatMessage({ defaultMessage: 'Vui lòng thêm ít nhất 1 hàng hóa' }), { appearance: 'error' })
                                        return;
                                    }

                                    setStep(2);
                                }} >2. {formatMessage({ defaultMessage: "Thông tin thanh toán" })}</span>
                            </div>
                            {step == 1 && <Step1 loading={loadingDetail || loadingProduct} orderDetail={orderDetail?.findOrderDetail} />}
                            {step == 2 && <Step2 />}
                        </div>
                        <div className='col-order-manual-right mt-12'>
                            <CostSection loading={loadingDetail || loadingProduct} />
                            {(location?.state?.isSale || values['related_order_id']) && (
                                <RelatedOrder isSale={location?.state?.isSale} loading={loadingDetail || loadingProduct} orders={orderDetail?.findOrderDetail} />
                            )}
                        </div>
                    </div>
                </Fragment>
            }}
        </Formik>
    )
})

export default memo(() => {
    const { setBreadcrumbs } = useSubheader()
    const { formatMessage } = useIntl()
    const location = useLocation()
    const titleCrumb = location?.state?.isSale ? formatMessage({ defaultMessage: 'Tạo đơn thủ công' }) : formatMessage({ defaultMessage: 'Sửa đơn thủ công' })
    useLayoutEffect(() => {
        setBreadcrumbs([
            {
                title: titleCrumb,
                pathname: `/orders/manual`
            }
        ])
    }, [])

    return <OrderManualProvider type='edit'>
        <Helmet
            titleTemplate={titleCrumb + "- UpBase"}
            defaultTitle={titleCrumb + "- UpBase"}
        >
            <meta name="description" content={titleCrumb + "- UpBase"} />
        </Helmet>
        <OrderManualCreateLayout />
    </OrderManualProvider>
});