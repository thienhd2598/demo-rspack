import React, { Fragment, memo, useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useSubheader } from "../../../../_metronic/layout";
import { useIntl } from "react-intl";
import { Helmet } from "react-helmet-async";
import { OrderPostProvider, useOrderPosContext } from "../OrderPosContext";
import { useHistory } from 'react-router-dom';
import { Formik } from 'formik';
import { RouterPrompt } from "../../../../components/RouterPrompt";
import 'rc-table/assets/index.css';
import ModalConfig from "./modals/ModalConfig";
import clsx from "clsx";
import { randomString } from "../../../../utils";
import InfoVariant from "./InfoVariant";
import InfoCustomer from "./InfoCustomer";
import ModalConfirm from "./modals/ModalConfirm";
import { findIndex } from 'lodash';
import { useSelector } from "react-redux";
import mutate_savePosOrder from "../../../../graphql/mutate_savePosOrder";
import { useToasts } from "react-toast-notifications";
import { useMutation } from "@apollo/client";
import { pick } from 'lodash';
import LoadingDialog from "../../ProductsStore/product-new/LoadingDialog";
import HtmlPrint from "../../Order/HtmlPrint";
import mutate_coPrintInvoice from "../../../../graphql/mutate_coPrintInvoice";

const OrderPostLayout = memo(() => {
    const { formatMessage } = useIntl();
    const history = useHistory();
    const { addToast } = useToasts();
    const {
        validateSchema, orderPos, currentOrderPos, setOrderPos, setCurrentOrderPos, currentScanBy, addressSelected,
        personCharge, warehouseSelected, storeSelected, setCountTab, countTab, provinceSelected, districtSelected
    } = useOrderPosContext();
    const [currentTabDelete, setCurrentTabDelete] = useState(null);
    const [html, setHtml] = useState(false);
    const [namePrint, setNamePrint] = useState('');

    const [mutateSavePosOrder, { loading: loadingSavePosOrder }] = useMutation(mutate_savePosOrder);
    const [mutatePrintInvoice, { loading: loadingCoPrintInvoice }] = useMutation(mutate_coPrintInvoice);

    // Check press keydown
    useEffect(() => {
        const currentPos = orderPos?.find(order => order?.code == currentOrderPos);
        const inputVariantIds = currentPos?.variants?.flatMap(item =>
            [`variant-price-${item?.variant?.id}`, `variant-quantity-${item?.variant?.id}`]
        ) || [];

        const handleKeyDown = (event) => {
            if (event.key === 'Tab') {
                event.preventDefault();
                const activeElementId = document.activeElement.id;
                const nextElementId = getNextElementId(activeElementId);
                const nextElement = document.getElementById(nextElementId);
                if (nextElement) {
                    nextElement.focus();
                }
            }

            if (event.key === 'F1') {
                event.preventDefault();
                const inputSearchElement = document.getElementById('btn-new');
                inputSearchElement.click();
            }

            if (event.key === 'F2') {
                event.preventDefault();
                const inputSearchElement = document.getElementById('input-search');
                inputSearchElement.focus();
            }

            if (event.key === 'F3') {
                event.preventDefault();
                const inputSearchElement = document.getElementById('btn-print');
                inputSearchElement.click();
            }

            if (event.key === 'F4') {
                event.preventDefault();
                const inputSearchElement = document.getElementById('btn-save');
                inputSearchElement.click();
            }

            if (event.key === 'F5') {
                event.preventDefault();
                const inputSearchElement = document.getElementById('discount');
                inputSearchElement.click();
            }

            if (event.key === 'F6') {
                event.preventDefault();
                const inputSearchElement = document.getElementById('paid');
                inputSearchElement.click();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [orderPos, currentOrderPos]);

    const isCompleteOrder = useMemo(() => {
        const currentPos = orderPos?.find(item => item?.code == currentOrderPos);
        return !!currentPos?.isComplete
    }, [orderPos, currentOrderPos]);

    const getNextElementId = useCallback((currentElementId) => {
        const currentPos = orderPos?.find(order => order?.code == currentOrderPos);

        const inputSearchIds = ['scan-by', 'input-search'];
        const inputVariantIds = currentPos?.variants?.flatMap(item =>
            [`variant-price-${item?.variant?.id}`, `variant-quantity-${item?.variant?.id}`]
        ) || [];
        const inputCustomerIds = ['discount', 'paid', 'name-customer', 'phone-customer', 'province', 'district', 'address', 'note'];

        const inputIds = [...inputSearchIds, ...inputVariantIds, ...inputCustomerIds];
        console.log({ inputIds });
        const currentIndex = inputIds.indexOf(currentElementId);
        if (currentIndex !== -1) {
            const nextIndex = (currentIndex + 1) % inputIds.length;
            return inputIds[nextIndex];
        }
        return inputIds[0];
    }, [orderPos, currentOrderPos]);

    const onPrintShipmentPackage = useCallback(async (order_id) => {
        try {
            const { data } = await mutatePrintInvoice({
                variables: {
                    list_order_id: [order_id]
                }
            });

            if (data?.coPrintInvoice?.success) {
                setHtml(data?.coPrintInvoice?.html_hd);
                setNamePrint(formatMessage({ defaultMessage: 'Hóa_đơn_bán_hàng' }));
            } else {
                addToast(data?.coPrintInvoice?.message || 'In hóa đơn thất bại', { appearance: 'error' });
            }
        } catch (error) {
            addToast(formatMessage({ defaultMessage: 'Đã có lỗi xảy ra, xin vui lòng thử lại' }), { appearance: 'error' });
        }
    }, []);

    const onSavePosOrder = useCallback(async (values, currentPos, onUpdateAfterSave) => {        
        const total = currentPos?.variants?.reduce((result, variant) => {
            if (!!values[`variant_${variant?.variant?.id}_gift_${currentOrderPos}`]) {
                result += 0;
            } else {
                result += (values[`variant_${variant?.variant?.id}_price_${currentOrderPos}`] || 0) * (values[`variant_${variant?.variant?.id}_quantity_${currentOrderPos}`] || 0)
            }
            return result;
        }, 0);

        const paid = total - (values[`promotion_seller_amount_${currentOrderPos}`] || 0);
        const final = (values[`paid_${currentOrderPos}`] || 0) - paid;

        if (final < 0) {
            addToast(formatMessage({ defaultMessage: 'Tổng tiền khách trả phải lớn hơn tổng tiền thanh toán' }), { appearance: "error" });
            return;
        }

        const bodyRequest = {
            customer_info: {
                name: values[`name_customer_${currentOrderPos}`] || '',
                phone: values[`phone_customer_${currentOrderPos}`] || '',
            },
            received_address: {
                name: values[`name_customer_${currentOrderPos}`] || '',
                phone: values[`phone_customer_${currentOrderPos}`] || '',
                district_code: values[`district_${currentOrderPos}`]?.value,
                district_name: values[`district_${currentOrderPos}`]?.label,
                state_code: values[`province_${currentOrderPos}`]?.value,
                state_name: values[`province_${currentOrderPos}`]?.label,
                full_address: values[`address_${currentOrderPos}`],
            },
            order_info: {
                note: values[`note_${currentOrderPos}`] || '',
                ref_shop_id: storeSelected?.ref_shop_id,
                store_id: storeSelected?.value,
                connector_channel_code: storeSelected?.connector_channel_code,
                person_in_charge: personCharge,
                sme_warehouse_id: warehouseSelected?.value,
                ...(warehouseSelected?.fulfillment_provider_connected_id ? {
                    fulfillment_provider_connected_id: warehouseSelected?.fulfillment_provider_connected_id,
                } : {}),
                fulfillment_provider_type: warehouseSelected?.fulfillment_by,
                payment_method: 'Thanh toán ngay - tiền mặt',
                order_at: Math.floor(Date.now() / 1000),
                promotion_seller_amount: values[`promotion_seller_amount_${currentOrderPos}`] || 0
            },
            order_items: currentPos?.variants?.map(variant => {
                return {
                    sme_product_id: variant?.variant?.sme_catalog_product?.id,
                    sme_product_name: variant?.variant?.sme_catalog_product?.name,
                    sme_product_sku: variant?.variant?.sme_catalog_product?.sku,
                    sme_variant_id: variant?.variant?.id,
                    sme_variant_name: variant?.variant?.attributes?.length > 0 ? variant?.variant?.name : null,
                    sme_variant_sku: variant?.variant?.sku,
                    sme_variant_full_name: variant?.variant?.variant_full_name,
                    quantity_purchased: values[`variant_${variant?.variant?.id}_quantity_${currentOrderPos}`],
                    original_price: !!values[`variant_${variant?.variant?.id}_gift_${currentOrderPos}`]
                        ? 0
                        : values[`variant_${variant?.variant?.id}_price_${currentOrderPos}`],
                    discount_seller_amount: 0,
                    sme_warehouse_id: String(warehouseSelected?.value),
                    unit: variant?.variant?.unit,
                    is_combo: variant?.variant?.is_combo,
                    is_gift: values[`variant_${variant?.variant?.id}_gift_${currentOrderPos}`] || 0,
                    combo_item: variant?.variant?.combo_items?.map(item => ({
                        sme_variant_id: item?.combo_variant_id,
                        quantity_in_combo: item?.quantity,
                        sme_variant_sku: item?.combo_item.sku
                    }))
                }
            })
        };

        console.log({ bodyRequest });

        const { data } = await mutateSavePosOrder({
            variables: bodyRequest
        });

        if (data?.savePosOrder?.success) {
            addToast(formatMessage({ defaultMessage: 'Thanh toán đơn hàng thành công' }), { appearance: "success" });

            onUpdateAfterSave({
                ref_id: data?.savePosOrder?.ref_id,
                order_id: data?.savePosOrder?.order_id,
                order_at: data?.savePosOrder?.order_at
            });
            setOrderPos(prev => prev.map(order => {
                if (order?.code == currentOrderPos) {
                    return {
                        ...order,
                        title: data?.savePosOrder?.ref_id,
                        isComplete: true
                    }
                }

                return order
            }));

            onPrintShipmentPackage(data?.savePosOrder?.order_id);
        } else {
            addToast(formatMessage({ defaultMessage: 'Thanh toán đơn hàng thất bại' }), { appearance: "error" });
        }
    }, [personCharge, orderPos, warehouseSelected, storeSelected, currentOrderPos]);

    const onRemoveTab = useCallback((codeTabDelete) => {
        if (orderPos.length == 1) {
            history.push('/order-sales-person/list-order');
            return;
        }

        if (currentOrderPos == codeTabDelete) {
            const indexOrderPos = findIndex(orderPos, item => item?.code == codeTabDelete);
            setCurrentOrderPos(indexOrderPos == orderPos?.length - 1
                ? orderPos[indexOrderPos - 1]?.code
                : orderPos[indexOrderPos + 1]?.code
            );
        }

        setOrderPos(prev => prev.filter(item => item?.code != codeTabDelete));
        setCurrentTabDelete(null);
    }, [orderPos, currentOrderPos]);

    return (
        <Formik
            initialValues={{ variant_gift_price: 0 }}
            validationSchema={validateSchema}
            enableReinitialize
        >
            {({
                submitForm,
                handleSubmit,
                setValues,
                values,
                setFieldValue,
                validateForm
            }) => {
                const changed = values['__changed__'];

                return <Fragment>
                    <RouterPrompt
                        when={changed}
                        title={formatMessage({ defaultMessage: 'Bạn đang tạo đơn bán hàng POS. Mọi thông tin bạn tạo trước đó sẽ bị xoá nếu bạn thoát màn hình này. Bạn có chắc chắn muốn thoát?' })}
                        cancelText={formatMessage({ defaultMessage: 'Không' })}
                        okText={formatMessage({ defaultMessage: 'Có, Thoát' })}
                        onOK={() => true}
                        onCancel={() => false}
                    />
                    <LoadingDialog show={loadingSavePosOrder || loadingCoPrintInvoice} />
                    {html && namePrint && <HtmlPrint
                        setNamePrint={setNamePrint}
                        html={html}
                        setHtml={setHtml}
                        namePrint={namePrint}
                        pageStyle={`
                            @page {
                                margin: auto;
                                size: A8 landscape;
                            }
                        `}
                    />}
                    <ModalConfig
                        show={orderPos.length == 0}
                        onHide={() => history.push('/order-sales-person/list-order')}
                        onAddValues={({ province, district, scan, address, code }) => {
                            setValues({
                                ...values,
                                [`name_customer_${code}`]: 'Khách lẻ',
                                [`scan_by_${code}`]: scan,
                                [`paid_${code}`]: 0,
                                [`promotion_seller_amount_${code}`]: 0,
                                [`address_${code}`]: address,
                                [`province_${code}`]: province,
                                [`district_${code}`]: district
                            })
                        }}
                    />
                    <ModalConfirm
                        show={!!currentTabDelete}
                        onHide={() => setCurrentTabDelete(null)}
                        title={formatMessage({ defaultMessage: 'Hệ thống sẽ không lưu hoá đơn này vì chưa được thanh toán, bạn có đồng ý tiếp tục ?' })}
                        onConfirm={() => onRemoveTab(currentTabDelete)}
                    />
                    {orderPos.length > 0 && <Fragment>
                        <div className="d-flex w-100" style={{ zIndex: 1 }}>
                            <div style={{ flex: 1 }}>
                                <ul className="nav nav-tabs d-flex align-items-center nav-tab-pos">
                                    {orderPos?.map(order => {
                                        const isTabActive = order?.code == currentOrderPos;
                                        return (
                                            <li
                                                key={`tab-pos-${order?.code}`}
                                                className="cursor-pointer"
                                                onClick={() => {
                                                    setCurrentOrderPos(order?.code);
                                                }}
                                            >
                                                <div
                                                    className={clsx(`nav-link fs-14 d-flex align-items-center px-4`, isTabActive && 'active')}
                                                    style={{ border: 'none' }}
                                                >
                                                    <span className="mr-2">{order?.title}</span>
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        width="16" height="16"
                                                        fill="currentColor"
                                                        class="bi bi-x"
                                                        viewBox="0 0 16 16"
                                                        onClick={e => {
                                                            e.preventDefault();
                                                            e.stopPropagation();

                                                            if (isCompleteOrder) {
                                                                onRemoveTab(order?.code)
                                                            } else {
                                                                setCurrentTabDelete(order?.code);
                                                            }
                                                        }}
                                                    >
                                                        <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708" />
                                                    </svg>
                                                </div>
                                            </li>
                                        )
                                    })}
                                    <button
                                        id="btn-new"
                                        className="ml-4 btn btn-primary"
                                        onClick={() => {
                                            const orderCode = randomString();
                                            setOrderPos(prev => prev.concat([{
                                                code: orderCode,
                                                title: `Hóa đơn ${countTab + 1}`,
                                                variants: []
                                            }]));
                                            setValues({
                                                ...values,
                                                [`name_customer_${orderCode}`]: 'Khách lẻ',
                                                [`scan_by_${orderCode}`]: currentScanBy,
                                                [`address_${orderCode}`]: addressSelected,
                                                [`province_${orderCode}`]: provinceSelected,
                                                [`district_${orderCode}`]: districtSelected,
                                                [`promotion_seller_amount_${orderCode}`]: 0,
                                                [`paid_${orderCode}`]: 0,
                                            })
                                            setCurrentOrderPos(orderCode);
                                            setCountTab(prev => prev + 1);
                                        }}
                                    >
                                        {formatMessage({ defaultMessage: 'Thêm mới (F1)' })}
                                    </button>
                                </ul>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-8">
                                <InfoVariant />
                            </div>
                            <div className="col-4">
                                <InfoCustomer />
                            </div>
                        </div>
                    </Fragment>}
                    <div className='form-group d-flex justify-content-end mt-8 group-button-fixed-bottom pr-10' style={{ zIndex: 9 }}>
                        <button
                            id="btn-print"
                            className={clsx('btn', isCompleteOrder ? 'btn-primary' : 'btn-secondary')}
                            role="button"
                            type="submit"
                            disabled={!isCompleteOrder}
                            style={{ width: 150 }}
                            onClick={() => onPrintShipmentPackage(values[`order_id_${currentOrderPos}`])}
                        >
                            {formatMessage({ defaultMessage: 'In(F3)' })}
                        </button>
                        <button
                            id="btn-save"
                            className={clsx('btn ml-4', isCompleteOrder ? 'btn-secondary' : 'btn-primary')}
                            type="submit"
                            style={{ width: 150 }}
                            disabled={isCompleteOrder}
                            onClick={async () => {
                                const currentPos = orderPos?.find(item => item?.code == currentOrderPos);
                                const valuesCurrentPos = pick(values, Object.keys(values)?.filter(key => key.endsWith(currentOrderPos)));
                                const errors = await validateForm(valuesCurrentPos);
                                const errorsCurrentPos = pick(errors, Object.keys(errors)?.filter(key => key.endsWith(currentOrderPos)));

                                if (Object.keys(errorsCurrentPos)?.length > 0) {
                                    handleSubmit();
                                    addToast(formatMessage({ defaultMessage: 'Vui lòng nhập đầy đủ các trường thông tin đã được khoanh đỏ' }), { appearance: 'error' })
                                    return;
                                }

                                if (currentPos?.variants?.length == 0) {
                                    addToast(formatMessage({ defaultMessage: 'Vui lòng thêm ít nhất 1 hàng hóa' }), { appearance: 'error' })
                                    return;
                                }

                                onSavePosOrder(values, currentPos, ({ ref_id, order_at, order_id }) => {
                                    setFieldValue(`ref_id_${currentOrderPos}`, ref_id);
                                    setFieldValue(`order_at_${currentOrderPos}`, order_at);
                                    setFieldValue(`order_id_${currentOrderPos}`, order_id);
                                });
                            }}
                        >
                            {formatMessage({ defaultMessage: 'Thanh toán(F4)' })}
                        </button>
                    </div>
                </Fragment>
            }}
        </Formik>
    )
});

const OrderPos = () => {
    const { setBreadcrumbs } = useSubheader();
    const { formatMessage } = useIntl();

    useLayoutEffect(() => {
        setBreadcrumbs([
            {
                title: formatMessage({ defaultMessage: 'Bán tại điểm' }),
                pathname: '/order-sales-person/create-pos'
            }
        ])
    }, []);

    return (
        <OrderPostProvider>
            <Helmet
                titleTemplate={formatMessage({ defaultMessage: "Bán tại điểm" }) + "- UpBase"}
                defaultTitle={formatMessage({ defaultMessage: "Bán tại điểm" }) + "- UpBase"}
            >
                <meta name="description" content={formatMessage({ defaultMessage: "Bán tại điểm" }) + "- UpBase"} />
            </Helmet>
            <OrderPostLayout />
        </OrderPostProvider>
    )
};

export default OrderPos;

export const actionKeys = {
    "order_pos": {
        router: '/order-sales-person/create-pos',
        actions: ['crmGetProvince', 'crmGetDistrict', 'sme_warehouses', 'sc_stores', 'op_connector_channels', "sme_catalog_inventory_items", "sme_catalog_inventory_items_aggregate", "crmSearchRecipientAddressByCustomer"],
        name: 'Bán tại điểm ',
        group_code: 'order_pos',
        group_name: 'Bán tại điểm',
        cate_code: 'order_pos',
        cate_name: 'Bán tại điểm',
    }
};