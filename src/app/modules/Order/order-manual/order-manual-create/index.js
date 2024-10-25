import React, { Fragment, memo, useCallback, useLayoutEffect, useMemo, useState } from 'react';
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
import { OPTIONS_PAYMENT_METHOD } from '../OrderManualHelper';
import { useToasts } from 'react-toast-notifications';
import { pick } from 'lodash';
import dayjs from 'dayjs';
import { RouterPrompt } from '../../../../../components/RouterPrompt';
import { useSelector } from 'react-redux';
import RelatedOrder from '../components/RelatedOrder';

const OrderManualCreateLayout = memo(() => {
    const { formatMessage } = useIntl();
    const user = useSelector((state) => state.auth.user);
    const { step, stepPassed, optionsFeeBearer, setStep, validateSchema, variantsOrder, optionsSmeWarehouse } = useOrderManualContext();
    const { addToast } = useToasts();
    const [initialValues, setInitialvalues] = useState({
        fee_bearer: optionsFeeBearer[0],
        payment_method_step2: OPTIONS_PAYMENT_METHOD[0],
        shipping_original_fee_step2: 0,
        promotion_seller_amount_step2: 0,
        shipping_discount_seller_fee_step2: 0,
        order_at_step1: dayjs().unix(),
        person_charge_step1: user?.email,
        refetchCheckFreeLogistic: true 
    });

    useMemo(() => {
        setInitialvalues(prev => ({
            ...prev,
            sme_warehouse_step1: optionsSmeWarehouse?.find(wh => wh?.isDefault),
            typeDelivery: 2
        }))
    }, [optionsSmeWarehouse]);

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
                        title={formatMessage({ defaultMessage: 'Bạn đang tạo đơn hàng. Mọi thông tin bạn tạo trước đó sẽ bị xoá nếu bạn thoát màn hình này. Bạn có chắc chắn muốn thoát?' })}
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
                            {step == 1 && <Step1 />}
                            {step == 2 && <Step2 />}
                        </div>
                        <div className='col-order-manual-right mt-12'>
                            <CostSection />
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
    useLayoutEffect(() => {
        setBreadcrumbs([
            {
                title: formatMessage({ defaultMessage: 'Tạo đơn thủ công' }),
                pathname: '/orders/create-manual'
            }
        ])
    }, [])

    return <OrderManualProvider>
        <Helmet
            titleTemplate={formatMessage({ defaultMessage: "Tạo đơn thủ công" }) + "- UpBase"}
            defaultTitle={formatMessage({ defaultMessage: "Tạo đơn thủ công" }) + "- UpBase"}
        >
            <meta name="description" content={formatMessage({ defaultMessage: "Tạo đơn thủ công" }) + "- UpBase"} />
        </Helmet>
        <OrderManualCreateLayout />
    </OrderManualProvider>
});