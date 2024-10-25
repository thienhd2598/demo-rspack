import React, { memo, useMemo, useState } from "react";
import { Card, CardBody, CardHeader, InputVertical, TextArea } from "../../../../_metronic/_partials/controls";
import { useIntl } from "react-intl";
import { Accordion, OverlayTrigger, Tooltip, useAccordionToggle } from "react-bootstrap";
import { formatNumberToCurrency } from "../../../../utils";
import { InputSelectAddons } from "../../../../_metronic/_partials/controls/forms/InputSelectAddons";
import { Field, useFormik, useFormikContext } from 'formik';
import { useOrderPosContext } from "../OrderPosContext";
import { ReSelectVertical } from "../../../../_metronic/_partials/controls/forms/ReSelectVertical";
import ModalReceiver from "./modals/ModalReceiver";
import dayjs from "dayjs";
import clsx from "clsx";

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
                    <span className="text-primary cursor-pointer">Thu gọn</span>
                ) : (
                    <span className="text-primary cursor-pointer">Mở rộng</span>
                )}
            </div>
        </CardHeader >
    );
};

const InfoCustomer = () => {
    const { formatMessage } = useIntl();
    const { setFieldValue, values, setValues } = useFormikContext();
    const { optionsProvince, optionsDistrict, personCharge, orderCode, currentOrderPos, orderPos } = useOrderPosContext();
    const [showAddReceiver, setShowAddReceiver] = useState(false);

    const isCompleteOrder = useMemo(() => {
        const currentPos = orderPos?.find(item => item?.code == currentOrderPos);
        return !!currentPos?.isComplete
    }, [orderPos, currentOrderPos]);

    const [totalPrice, totalPaid, totalFinal] = useMemo(() => {
        const currentPos = orderPos?.find(order => order?.code == currentOrderPos);
        const total = currentPos?.variants?.reduce((result, variant) => {
            if (!!values[`variant_${variant?.variant?.id}_gift_${currentOrderPos}`]) {
                result += 0;
            } else {
                result += (values[`variant_${variant?.variant?.id}_price_${currentOrderPos}`] || 0) * (values[`variant_${variant?.variant?.id}_quantity_${currentOrderPos}`] || 0)
            }
            return result;
        }, 0);

        const paid = total - (values[`promotion_seller_amount_${currentOrderPos}`] || 0);
        const final = (values[`paid_${currentOrderPos}`] || 0) - paid

        return [total, paid, final];
    }, [values, currentOrderPos, orderPos]);

    return (
        <div className="d-flex flex-column">
            {showAddReceiver && <ModalReceiver
                show={showAddReceiver}
                onHide={() => setShowAddReceiver(false)}
                idCustomer={null}
                onSelectReceiver={(customer) => {
                    const province = optionsProvince?.find(pr => pr?.value == customer?.province_code) || undefined;
                    const district = optionsDistrict[customer?.province_code]?.find(dt => dt?.value == customer?.district_code) || undefined;

                    console.log({ customer, province, district, currentOrderPos });
                    setValues({
                        ...values,
                        [`province_${currentOrderPos}`]: province,
                        [`district_${currentOrderPos}`]: district,
                        [`name_customer_${currentOrderPos}`]: customer?.name,
                        [`phone_customer_${currentOrderPos}`]: customer?.phone,
                        [`address_${currentOrderPos}`]: customer?.address,
                    });
                    // selectReceiver(customer, province, district)
                }}
            />}
            <Card className="card-pos">
                <CardHeader title={formatMessage({ defaultMessage: 'Thanh toán' })} />
                <CardBody className="px-4 py-4">
                    <div className="row">
                        <div className="col-6">
                            <span>{formatMessage({ defaultMessage: 'Tổng giá trị hóa đơn' })}:</span>
                        </div>
                        <div className="col-6">
                            <span style={{ wordBreak: 'break-all' }} className="float-right">{formatNumberToCurrency(totalPrice)}đ</span>
                        </div>
                    </div>
                    <div className="row mt-4 d-flex align-items-center">
                        <div className="col-4">
                            <span>{formatMessage({ defaultMessage: 'Giảm giá (F5)' })}:</span>
                        </div>
                        <div className="col-8">
                            <span className="w-100 float-right">
                                <Field
                                    id="discount"
                                    inputId="input-search"
                                    name={`promotion_seller_amount_${currentOrderPos}`}
                                    component={InputSelectAddons}
                                    addOnRight="đ"
                                    disabled={isCompleteOrder}
                                    unitOptions={[]}
                                    label={''}
                                    required={false}
                                    customFeedbackLabel={' '}
                                />
                            </span>
                        </div>
                    </div>
                    <div className="row mt-4">
                        <div className="col-6">
                            <strong>{formatMessage({ defaultMessage: 'Tổng tiền thanh toán' })}:</strong>
                        </div>
                        <div className="col-6">
                            <strong style={{ wordBreak: 'break-all' }} className="float-right text-primary">
                                {formatNumberToCurrency(totalPaid)}đ
                            </strong>
                        </div>
                    </div>
                    <div className="row mt-4 d-flex align-items-center">
                        <div className="col-6">
                            <span>{formatMessage({ defaultMessage: 'Tổng tiền khách trả (F6)' })}:</span>
                        </div>
                        <div className="col-6">
                            <span className="w-100 float-right">
                                <Field
                                    id="paid"
                                    name={`paid_${currentOrderPos}`}
                                    component={InputSelectAddons}
                                    disabled={isCompleteOrder}
                                    addOnRight="đ"
                                    unitOptions={[]}
                                    label={''}
                                    required={false}
                                    customFeedbackLabel={' '}
                                />
                            </span>
                        </div>
                    </div>
                    <div className="row mt-4">
                        <div className="col-6">
                            <span>{formatMessage({ defaultMessage: 'Tổng tiền trả lại' })}:</span>
                        </div>
                        <div className="col-6">
                            <span style={{ wordBreak: 'break-all' }} className={clsx("float-right", totalFinal < 0 && 'text-danger')}>
                                {formatNumberToCurrency(totalFinal)}đ
                            </span>
                        </div>
                    </div>
                </CardBody>
            </Card>
            <Card className="card-pos">
                <CardHeader title="Thông tin khách hàng">
                    <span
                        className={clsx("text-primary d-flex align-items-center", !isCompleteOrder && "cursor-pointer")}
                        onClick={() => {
                            if (isCompleteOrder) return;
                            setShowAddReceiver(true)
                        }}
                    >
                        {formatMessage({ defaultMessage: 'Lấy từ CRM' })}
                    </span>
                </CardHeader>
                <CardBody className="px-4 py-4">
                    <div className="row d-flex align-items-center">
                        <div className="col-6">
                            <span className="w-100 float-right">
                                <Field
                                    id="name-customer"
                                    name={`name_customer_${currentOrderPos}`}
                                    component={InputVertical}
                                    placeholder={formatMessage({ defaultMessage: 'Nhập tên khách hàng' })}
                                    label={formatMessage({ defaultMessage: 'Tên khách hàng' })}
                                    customFeedbackLabel={' '}
                                    countChar
                                    disabled={isCompleteOrder}
                                    maxChar={35}
                                    maxLength={35}
                                    required
                                />
                            </span>
                        </div>
                        <div className="col-6">
                            <span className="w-100 float-right">
                                <Field
                                    id="phone-customer"
                                    name={`phone_customer_${currentOrderPos}`}
                                    component={InputVertical}
                                    type="number"
                                    isPhone={true}
                                    disabled={isCompleteOrder}
                                    thousandSeparator={false}
                                    allowLeadingZeros={true}
                                    placeholder={formatMessage({ defaultMessage: 'Nhập số điện thoại' })}
                                    label={formatMessage({ defaultMessage: 'Số điện thoại' })}
                                    customFeedbackLabel={' '}
                                />
                            </span>
                        </div>
                        <div className="col-6">
                            <Field
                                inputId="province"
                                name={`province_${currentOrderPos}`}
                                component={ReSelectVertical}
                                style={{ marginBottom: 0 }}
                                isDisabled={isCompleteOrder}
                                placeholder={formatMessage({ defaultMessage: 'Chọn Tỉnh/Thành phố' })}
                                label={formatMessage({ defaultMessage: 'Tỉnh/Thành phố' })}
                                onChanged={() => setFieldValue(`district_${currentOrderPos}`, undefined)}
                                customFeedbackLabel={' '}
                                options={optionsProvince}
                                required
                            />
                        </div>
                        <div className="col-6">
                            <Field
                                inputId="district"
                                name={`district_${currentOrderPos}`}
                                component={ReSelectVertical}
                                style={{ marginBottom: 0 }}
                                isDisabled={!values[`province_${currentOrderPos}`] || isCompleteOrder}
                                label={formatMessage({ defaultMessage: 'Quận/Huyện' })}
                                placeholder={formatMessage({ defaultMessage: 'Chọn Quận/Huyện' })}
                                options={!!values[`province_${currentOrderPos}`] ? optionsDistrict[values[`province_${currentOrderPos}`]?.value] : []}
                                customFeedbackLabel={' '}
                                required
                            />
                        </div>
                        <div className="col-12">
                            <Field
                                id="address"
                                name={`address_${currentOrderPos}`}
                                component={TextArea}
                                rows={3}
                                disabled={isCompleteOrder}
                                cols={['col-12', 'col-12']}
                                countChar
                                maxChar={500}
                                maxLength={500}
                                label={formatMessage({ defaultMessage: 'Địa chỉ' })}
                                placeholder={formatMessage({ defaultMessage: 'Nhập địa chỉ' })}
                                nameTxt={"--"}
                                required
                                customFeedbackLabel={' '}
                            />
                        </div>
                    </div>
                </CardBody>
            </Card>
            <Accordion key={`other-pos-card`}>
                <Card id={`other-pos`} className="mb-4" style={{ overflow: 'unset' }}>
                    <CustomToggle
                        eventKey={`other-pos`}
                        title={formatMessage({ defaultMessage: 'Thông tin khác' })}
                    />
                    <Accordion.Collapse eventKey={`other-pos`}>
                        <CardBody className="px-4 py-4">
                            {!!values[`ref_id_${currentOrderPos}`] && <div className="row">
                                <div className="col-6">
                                    <span>{formatMessage({ defaultMessage: 'Số hoá đơn' })}:</span>
                                </div>
                                <div className="col-6">
                                    <span style={{ wordBreak: 'break-all' }} className="float-right">
                                        {values[`ref_id_${currentOrderPos}`] || '--'}
                                    </span>
                                </div>
                            </div>}
                            {!!values[`order_at_${currentOrderPos}`] && <div className="row mt-4">
                                <div className="col-6">
                                    <span>{formatMessage({ defaultMessage: 'Ngày bán' })}:</span>
                                </div>
                                <div className="col-6">
                                    <span style={{ wordBreak: 'break-all' }} className="float-right">
                                        {dayjs.unix(+values[`order_at_${currentOrderPos}`]).format('HH:mm DD/MM/YYYY')}
                                    </span>
                                </div>
                            </div>}
                            <div className="row mt-4">
                                <div className="col-6">
                                    <span className="mr-2">{formatMessage({ defaultMessage: 'Nhân viên phụ trách' })}:</span>
                                </div>
                                <div className="col-6">
                                    <span style={{ wordBreak: 'break-all' }} className="float-right">
                                        {personCharge}
                                    </span>
                                </div>
                            </div>
                            <div className="row mt-4 d-flex">
                                <div className="col-3">
                                    <span>{formatMessage({ defaultMessage: 'Ghi chú' })}:</span>
                                </div>
                                <div className="col-9">
                                    <span className="w-100 float-right">
                                        <Field
                                            id="note"
                                            name={`note_${currentOrderPos}`}
                                            component={TextArea}
                                            rows={3}
                                            cols={['col-12', 'col-12']}
                                            disabled={isCompleteOrder}
                                            countChar
                                            maxChar={500}
                                            maxLength={500}
                                            label={''}
                                            placeholder={formatMessage({ defaultMessage: 'Nhập ghi chú' })}
                                            nameTxt={"--"}
                                            customFeedbackLabel={' '}
                                        />
                                    </span>
                                </div>
                            </div>
                        </CardBody>
                    </Accordion.Collapse>
                </Card>
            </Accordion>
        </div>
    )
};

export default memo(InfoCustomer);