import React, { useMemo, memo, Fragment, useState } from "react";
import { useIntl } from "react-intl";
import { Card, CardBody, CardHeader, InputVertical, TextArea } from "../../../../../_metronic/_partials/controls";
import { Accordion, useAccordionToggle } from 'react-bootstrap';
import { Field, useFormikContext } from "formik";
import { ReSelectVertical } from "../../../../../_metronic/_partials/controls/forms/ReSelectVertical";
import InfoBuyer from "./SectionsStep1/InfoBuyer";
import InfoReceiver from "./SectionsStep1/InfoReceiver";
import InfoGeneral from "./SectionsStep1/InfoGeneral";
import InfoProduct from "./SectionsStep1/InfoProduct";
import { useOrderManualContext } from "../OrderManualContext";
import { pick } from 'lodash';
import { useHistory } from 'react-router-dom';
import { useToasts } from "react-toast-notifications";

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

const Step1 = ({ loading = false, orderDetail = null }) => {
    const { formatMessage } = useIntl();
    const { setStep, variantsOrder, isApproved, setIsApproved } = useOrderManualContext();
    const { validateForm, handleSubmit, values, setFieldValue } = useFormikContext();
    const { addToast } = useToasts();
    const history = useHistory();

    const STEP1_SECTIONS = [
        {
            id: 'info-buyer',
            title: formatMessage({ defaultMessage: 'Thông tin người mua' }),
            view: <InfoBuyer loading={loading} />
        },
        {
            id: 'info-receiver',
            title: formatMessage({ defaultMessage: 'Thông tin nhận hàng' }),
            view: <InfoReceiver loading={loading} />
        },
        {
            id: 'info-general',
            title: formatMessage({ defaultMessage: 'Thông tin chung' }),
            view: <InfoGeneral loading={loading} />
        },
        {
            id: 'info-product',
            title: formatMessage({ defaultMessage: 'Hàng hóa' }),
            view: <InfoProduct />
        },
    ];

    return (
        <Fragment>
            {STEP1_SECTIONS.map(item => (
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
                        history.push('/orders/list?list_source=manual');
                    }}
                >
                    {formatMessage({ defaultMessage: 'Hủy bỏ' })}
                </button>
                <button
                    className="btn btn-primary ml-4"
                    type="submit"
                    style={{ width: 150 }}
                    onClick={async () => {
                        const errors = await validateForm(values);
                        const errorsStep1 = pick(errors, Object.keys(errors)?.filter(key => key.endsWith('step1')));

                        if (!isApproved) {
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
                        }
                        setIsApproved(false)

                        const hasCaculateLogisticWeight = variantsOrder?.every(item => !!item?.variant?.sme_catalog_product?.sme_catalog_product_ship_package_infos?.[0]?.weight);
                        const sameVariantOrigin = !!orderDetail 
                            && orderDetail?.orderItems?.length == variantsOrder?.length
                            && orderDetail?.orderItems?.every(item => variantsOrder?.some(variant => 
                                variant?.variant?.id == item?.sme_variant_id 
                                && values[`variant_${variant?.variant?.id}_quantity_step1`] == item?.quantity_purchased
                                && !values[`__quantity_changed__`]
                            ));

                        if (!hasCaculateLogisticWeight && !sameVariantOrigin) setFieldValue("package_weight_step2", null);

                        if (hasCaculateLogisticWeight && !sameVariantOrigin) {
                            const totalVariantWeight = variantsOrder?.reduce((result, value) => {
                                const weightVariant = (value?.variant?.sme_catalog_product?.sme_catalog_product_ship_package_infos?.[0]?.weight / 1000) * values[`variant_${value?.variant?.id}_quantity_step1`];
                                result += weightVariant;
                                return result;
                            }, 0)                            
                            setFieldValue("package_weight_step2", Number(totalVariantWeight.toFixed(2)));
                        }

                        if (values?.typeDelivery == 2) {
                            setFieldValue('shipping_original_fee_logistic', 0);                        
                        }

                        setFieldValue('service_logistic', null);
                        setFieldValue('reCaculateFee', true);
                        setStep(2);
                    }}
                >
                    {formatMessage({ defaultMessage: 'Tiếp tục' })}
                </button>
            </div>
        </Fragment>
    )
};

export default memo(Step1);