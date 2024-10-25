import React, { useMemo, memo, Fragment, useState, useCallback } from "react";
import { useIntl } from "react-intl";
import { Card, CardBody, CardHeader, InputVertical, TextArea } from "../../../../../_metronic/_partials/controls";
import { Accordion, useAccordionToggle } from 'react-bootstrap';
import { Field, useFormikContext } from "formik";
import { ReSelectVertical } from "../../../../../_metronic/_partials/controls/forms/ReSelectVertical";
import { useOrderManualContext } from "../OrderManualContext";
import InfoTransport from "./SectionsStep2/InfoTransport";
import InfoPayment from "./SectionsStep2/InfoPayment";
import { useToasts } from "react-toast-notifications";
import { useMutation } from "@apollo/client";
import mutate_saveManualOrder from "../../../../../graphql/mutate_saveManualOrder";
import LoadingDialog from "../../../Products/product-new/LoadingDialog";
import { useHistory } from 'react-router-dom';
import mutate_approveManualOrder from "../../../../../graphql/mutate_approveManualOrder";
import { OPTIONS_PAYMENT_METHOD } from "../OrderManualHelper";
import { useLocation } from "react-router-dom";
import queryString from 'querystring';
import _ from "lodash";
import AuthorizationWrapper from "../../../../../components/AuthorizationWrapper";

const CustomToggle = ({ children, eventKey, title }) => {
    const [show, setShow] = useState(false);

    const decoratedOnClick = useAccordionToggle(eventKey, () => {

        setShow(prev => !prev);
    });

    return (
        <CardHeader title={title} className="cursor-pointer" onClick={decoratedOnClick}>
            <div className="d-flex justify-content-between align-items-center" >
                {children}
                {show ? (
                    <svg
                        className={`cursor-pointer bi bi-chevron-down`}
                        xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"
                    >
                        <path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708" />
                    </svg>
                ) : (
                    <svg
                        className={"cursor-pointer bi bi-chevron-up"}
                        xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"
                    >
                        <path fill-rule="evenodd" d="M7.646 4.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1-.708.708L8 5.707l-5.646 5.647a.5.5 0 0 1-.708-.708z" />
                    </svg>
                )}
            </div>
        </CardHeader >
    );
};

const Step2 = () => {
    const location = useLocation()
    const { formatMessage } = useIntl();
    const { addToast } = useToasts();
    const history = useHistory();
    const { validateForm, setFieldError, handleSubmit, values, setFieldValue } = useFormikContext();
    const { setStep, deliverys, setIsApproved, infoCustomer, infoReceiver, variantsOrder, type, loadingUploadFile } = useOrderManualContext();
    const params = queryString.parse(useLocation().search.slice(1, 100000));

    const STEP2_SECTIONS = [
        {
            id: 'info-transport',
            title: formatMessage({ defaultMessage: 'Thông tin vận chuyển' }),
            view: <InfoTransport />
        },
        {
            id: 'info-payment',
            title: formatMessage({ defaultMessage: 'Thông tin thanh toán' }),
            view: <InfoPayment />
        },
    ];

    const [mutateSaveManualOrder, { loading: loadingSaveManualOrder }] = useMutation(mutate_saveManualOrder);

    const onSaveOrderManual = useCallback(async (isApproved = false) => {
        setIsApproved(isApproved)
        try {
            setFieldValue('__changed__', false)
            const errors = await validateForm(values);
            console.log({ errors })
            if (Object.values(errors).length > 0) {
                handleSubmit();
                addToast(formatMessage({ defaultMessage: 'Vui lòng nhập đầy đủ các trường thông tin đã được khoanh đỏ' }), { appearance: 'error' })
                return;
            }

            if (!values?.[`order_at_step1`]) {
                addToast(formatMessage({ defaultMessage: 'Vui lòng chọn ngày đặt hàng' }), { appearance: 'error' })
                return;
            }

            if (!values?.[`ship_expired_at_step2`]) {
                addToast(formatMessage({ defaultMessage: 'Vui lòng chọn ngày dự kiến lấy hàng' }), { appearance: 'error' })
                return;
            }

            if (!values?.[`service_logistic`] && values['typeDelivery'] == 2) {
                addToast(formatMessage({ defaultMessage: 'Bạn cần chọn 1 dịch vụ vận chuyển trước khi lưu' }), { appearance: 'error' })
                return;
            }

            if (isApproved) {
                const errorKeyStep1 = ['phone_receiver_step1', 'name_receiver_step1', 'province_step1', 'district_step1', 'address_step1']
                if (!values['phone_receiver_step1']) {
                    addToast(formatMessage({ defaultMessage: 'Vui lòng nhập số điện thoại người nhận' }), { appearance: 'error' })
                }
                if (!values['name_receiver_step1']) {
                    addToast(formatMessage({ defaultMessage: 'Vui lòng nhập tên người nhận' }), { appearance: 'error' })
                }
                if (!values['province_step1']?.value) {
                    addToast(formatMessage({ defaultMessage: 'Vui lòng chọn Tỉnh/thành phố' }), { appearance: 'error' })
                }
                if (!values['district_step1']?.value) {
                    addToast(formatMessage({ defaultMessage: 'Vui lòng chọn Quận/huyện' }), { appearance: 'error' })
                }
                if (!values['address_step1']) {
                    addToast(formatMessage({ defaultMessage: 'Vui lòng nhập địa chỉ người nhận' }), { appearance: 'error' })
                }
                if (errorKeyStep1?.some(key => !values[key])) {
                    setStep(1)
                    handleSubmit()
                    return
                }


                if (!values?.[`ship_expired_at_step2`]) {
                    addToast(formatMessage({ defaultMessage: 'Vui lòng chọn thời gian dự kiến giao hàng' }), { appearance: 'error' })
                    return;
                }

                if (values[`payment_method_step2`]?.value != OPTIONS_PAYMENT_METHOD[0].value && !values?.[`paid_at_step2`]) {
                    addToast(formatMessage({ defaultMessage: 'Vui lòng chọn thời gian thanh toán' }), { appearance: 'error' })
                    return;
                }
            }

            if (loadingUploadFile) {
                addToast(formatMessage({ defaultMessage: 'Phiếu vận đơn đang tải lên. Xin vui lòng thử lại sau.' }), { appearance: 'error' })
                return;
            }

            // if (values[`check-free-${values['service_logistic']?.logisticId}-service-${values['service_logistic']?.code}-fail`]) {
            //     addToast(formatMessage({ defaultMessage: 'Lỗi ĐVVC tính phí vận chuyển, bạn vui lòng chọn dịch vụ vận chuyển khác hoặc tạo đơn sau.' }), { appearance: 'error' })
            //     return;
            // }

            const generateFullAddress = [values[`address_step1`], values[`ward`]?.label, values[`district_step1`]?.label, values[`province_step1`]?.label]
                .filter(item => Boolean(item))
                .join(' ,');

            console.log({ generateFullAddress });

            const bodyCreateOrderManual = {
                ...(isApproved ? {
                    need_approved: 1
                } : {}),
                customer_info: {
                    crm_customer_id: infoCustomer?.id,
                    sc_customer_id: infoCustomer?.sc_customer_id,
                    name: values[`name_customer_step1`],
                    phone: values[`phone_customer_step1`],
                },
                received_address: {
                    crm_address_id: infoReceiver?.id,
                    sc_recipient_address_id: infoReceiver?.sc_recipient_address_id,
                    name: values[`name_receiver_step1`],
                    phone: values[`phone_receiver_step1`],
                    district_code: values[`district_step1`]?.value,
                    district_name: values[`district_step1`]?.label,
                    state_code: values[`province_step1`]?.value,
                    state_name: values[`province_step1`]?.label,
                    full_address: infoReceiver?.sc_recipient_address_id ? values[`address_step1`] : generateFullAddress,
                    short_address: values[`address_step1`],
                    ward_code: values['ward']?.value,
                    ward_name: values['ward']?.label
                },
                package_data: {
                    ...((type == 'edit' && !location?.state?.isSale) ? {
                        id: values?.package_id
                    } : {}),
                    package_weight: values[`package_weight_step2`],
                    package_length: values[`package_length_step2`],
                    package_width: values[`package_width_step2`],
                    package_height: values[`package_height_step2`],
                    shipping_rule_check: values['shipping_rule_check']?.value || null, //1
                    shipping_type: +values['typeDelivery'], //1
                    shipping_service: values['service_logistic']?.code,
                    shipping_carrier: values['typeDelivery'] == 1 ? values[`shipping_carrier_step2`]?.value : `${values[`service_logistic`]?.name} ${values['service_logistic']?.serviceName}`,
                    tracking_number: values['typeDelivery'] == 1 ? values[`tracking_number_step2`] : null,
                    s3_document: values['typeDelivery'] == 1 ? values[`s3_document_step2`] : null,
                },
                order_info: {
                    ...((type == 'edit' && !location?.state?.isSale) ? {
                        id: values?.order_id
                    } : {}),
                    ...((location?.state?.isSale || (values['related_order_id'] && type == 'edit')) ? {
                        related_order_id: location?.state?.isSale ? values?.order_id : values['related_order_id']
                    } : {}),
                    ...((location?.state?.isSale || values['related_order_id']) ? {
                        after_sale_type: values['type_order_sale']?.value,
                    } : {}),
                    shipping_fee_by: +values['fee_bearer']?.value,
                    sc_warehouse_id: null,
                    note: values[`note_step1`],
                    ref_id: values[`order_code_step1`],
                    ref_shop_id: values[`store_step1`]?.ref_shop_id,
                    store_id: values[`store_step1`]?.value,
                    connector_channel_code: values[`channel_step1`]?.value,
                    logistic_provider_connected_id: values['typeDelivery'] == 2 ? values['service_logistic']?.logisticId : null,
                    p_delivery_method: +values['p_delivery_method']?.value,
                    person_in_charge: values[`person_charge_step1`],
                    sme_warehouse_id: values[`sme_warehouse_step1`]?.value,
                    fulfillment_provider_connected_id: values[`sme_warehouse_step1`]?.fulfillment_provider_connected_id,
                    fulfillment_provider_type: values[`sme_warehouse_step1`]?.fulfillment_by,
                    fulfillment_provider_wh_code: values[`sme_warehouse_step1`]?.fulfillment_provider_wms_code,
                    payment_method: values[`payment_method_step2`]?.value,
                    order_at: location?.state?.isSale ? Math.floor(Date.now() / 1000) : values[`order_at_step1`],
                    paid_at: values[`paid_at_step2`],
                    ship_expired_at: !!values[`ship_expired_at_step2`] ? Number(values[`ship_expired_at_step2`]) : null,
                    payment_transaction_code: values[`payment_transaction_code_step2`],
                    shipping_discount_seller_fee: values[`shipping_discount_seller_fee_step2`],
                    shipping_original_fee: values['typeDelivery'] == 2 ? values['shipping_original_fee_logistic'] : values[`shipping_original_fee_step2`],
                    promotion_seller_amount: values[`promotion_seller_amount_step2`],
                },
                order_items: variantsOrder?.map(variant => {
                    const [variantDiscountUnit, variantPrice, variantQuantity, variantDiscount] = [
                        values[`variant_${variant?.variant?.id}_unit_step1`],
                        values[`variant_${variant?.variant?.id}_price_step1`],
                        values[`variant_${variant?.variant?.id}_quantity_step1`],
                        values[`variant_${variant?.variant?.id}_discount_step1`],
                    ]
                    let discountSellerAmount;
                    if (variantDiscountUnit?.value) {
                        discountSellerAmount = Math.round((variantDiscount * variantPrice) / 100)
                    } else {
                        discountSellerAmount = variantDiscount
                    }

                    return {
                        ...((type == 'edit' && !location?.state?.isSale) ? {
                            id: values[`variant_${variant?.variant?.id}_order_item_id`]
                        } : {}),
                        sme_product_id: variant?.variant?.sme_catalog_product?.id,
                        sme_product_name: variant?.variant?.sme_catalog_product?.name,
                        sme_product_sku: variant?.variant?.sme_catalog_product?.sku,
                        sme_variant_id: variant?.variant?.id,
                        sme_variant_name: variant?.variant?.attributes?.length > 0 ? variant?.variant?.name : null,
                        sme_variant_sku: variant?.variant?.sku,
                        sme_variant_full_name: variant?.variant?.variant_full_name,
                        quantity_purchased: values[`variant_${variant?.variant?.id}_quantity_step1`],
                        original_price: values[`variant_${variant?.variant?.id}_price_step1`],
                        discount_seller_amount: discountSellerAmount,
                        sme_warehouse_id: String(values[`sme_warehouse_step1`]?.value),
                        unit: variant?.variant?.unit,
                        is_combo: variant?.variant?.is_combo,
                        is_gift: (variant?.is_gift || variantPrice == 0) ? 1 : 0,
                        combo_item: variant?.variant?.combo_items?.map(item => ({
                            sme_variant_id: item?.combo_variant_id,
                            quantity_in_combo: item?.quantity,
                            sme_variant_sku: item?.combo_item.sku
                        }))
                    }
                })
            };

            const { data } = await mutateSaveManualOrder({
                variables: bodyCreateOrderManual
            });

            if (data?.saveManualOrder?.success) {
                let url = '/orders/list?list_source=manual'
                if (location.state?.urlRedirect || params?.urlRedirect) {
                    url = location.state?.urlRedirect || params?.urlRedirect
                }
                history.push(url);

                if (isApproved) {
                    addToast(formatMessage({ defaultMessage: 'Duyệt đơn thành công' }), { appearance: "success" });
                } else {
                    addToast((type == 'create' || location?.state?.isSale) ? formatMessage({ defaultMessage: 'Tạo đơn thủ công thành công' }) : formatMessage({ defaultMessage: 'Sửa đơn thủ công thành công' }), { appearance: "success" });
                }
            } else {
                if (isApproved) {
                    addToast(formatMessage({ defaultMessage: 'Duyệt đơn thất bại' }), { appearance: "error" });
                } else {
                    addToast((type == 'create' || location?.state?.isSale) ? formatMessage({ defaultMessage: 'Tạo đơn thủ công thất bại' }) : formatMessage({ defaultMessage: 'Sửa đơn thủ công thất bại' }), { appearance: "error" });
                }
            }
        } catch (error) {
            if (isApproved) {
                addToast(formatMessage({ defaultMessage: 'Duyệt đơn thất bại' }), { appearance: "error" });
            } else {
                addToast((type == 'create' || location?.state?.isSale) ? formatMessage({ defaultMessage: 'Tạo đơn thủ công thất bại' }) : formatMessage({ defaultMessage: 'Sửa đơn thủ công thất bại' }), { appearance: "error" });
            }
        }
    }, [values, variantsOrder, type, loadingUploadFile, location?.state?.isSale]);

    return (
        <Fragment>
            <LoadingDialog show={loadingSaveManualOrder} />
            {STEP2_SECTIONS.map(item => (
                <Accordion key={`step1-${item.id}`} defaultActiveKey={item.id}>
                    <Card id={item.id} className="mb-4" style={{ overflow: 'unset' }}>
                        <CustomToggle
                            eventKey={item.id}
                            title={item.title}
                        />
                        <Accordion.Collapse eventKey={item.id}>
                            <CardBody className="px-4 py-4">
                                {item.view}
                            </CardBody>
                        </Accordion.Collapse>
                    </Card>
                </Accordion>
            ))}
            <div className='form-group d-flex justify-content-end mt-8 group-button-fixed-bottom pr-10' style={{ zIndex: 9 }}>
                <button
                    className="btn btn-secondary"
                    role="button"
                    type="submit"
                    style={{ width: 150 }}
                    onClick={() => {
                        setStep(1);
                    }}
                >
                    {formatMessage({ defaultMessage: 'Quay lại' })}
                </button>
                <button
                    className="btn btn-secondary ml-4"
                    role="button"
                    type="submit"
                    style={{ width: 150 }}
                    onClick={() => history.push('/orders/list?list_source=manual')}
                >
                    {formatMessage({ defaultMessage: 'Hủy bỏ' })}
                </button>
                <AuthorizationWrapper keys={['order_sales_person_create_manual']}>
                    <button
                        className="btn btn-primary ml-4"
                        role="button"
                        type="submit"
                        style={{ width: 150 }}
                        onClick={() => onSaveOrderManual(false)}
                    >
                        {formatMessage({ defaultMessage: 'Lưu lại' })}
                    </button>
                </AuthorizationWrapper>
                <AuthorizationWrapper keys={['order_approved']}>
                    {type == 'edit' && !location?.state?.isSale && <button
                        className="btn btn-primary ml-4"
                        role="button"
                        type="submit"
                        style={{ width: 150 }}
                        onClick={() => onSaveOrderManual(true)}
                    >
                        {formatMessage({ defaultMessage: 'Duyệt' })}
                    </button>}
                </AuthorizationWrapper>
            </div>
        </Fragment>
    )
};

export default memo(Step2);