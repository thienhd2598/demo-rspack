import React, { useMemo, memo, Fragment, useState } from "react";
import { useIntl } from "react-intl";
import { Card, CardBody, CardHeader, InputVertical, TextArea } from "../../../../../../_metronic/_partials/controls";
import { Accordion, useAccordionToggle } from 'react-bootstrap';
import { Field, useFormikContext } from "formik";
import makeAnimated from 'react-select/animated';
import { ReSelectVertical } from "../../../../../../_metronic/_partials/controls/forms/ReSelectVertical";
import { useOrderManualContext } from "../../OrderManualContext";
import ModalReceiver from "../../dialogs/ModalReceiver";
import InputSearchSelect from "../../../../../../_metronic/_partials/controls/forms/InputSearchSelect";
import client from "../../../../../../apollo";
import query_crmSearchRecipientAddressByCustomer from "../../../../../../graphql/query_crmSearchRecipientAddressByCustomer";
import { InputNote } from "../../../order-process-fail-delivery/components/InputNote";
import { queryGetWards } from "../../../../CustomerService/customer-info/dialogs/CreateCustomerDialog";

const animatedComponents = makeAnimated();

const InfoReceiver = ({ loading = false }) => {
    const { formatMessage } = useIntl();
    const { values, setFieldValue } = useFormikContext();
    const { optionsProvince, optionsDistrict, infoReceiver, setInfoReceiver, infoCustomer } = useOrderManualContext();
    const [showAddReceiver, setShowAddReceiver] = useState(false);
    const queryGetRecipientByPhone = async (phone) => {

        const { data } = await client.query({
            query: query_crmSearchRecipientAddressByCustomer,
            variables: {
                search: {
                    ...(phone ? {search_phone: phone} : {}),
                    crm_customer_id: +infoCustomer?.id,
                },
                per_page: 50,
                page: 1,
            },
            fetchPolicy: "network-only",
        });

        return data?.crmSearchRecipientAddressByCustomer?.customer_address || [];
    }

    const selectReceiver = async (customer, province, district) => {
        setInfoReceiver(customer || null);
        setFieldValue(`name_receiver_step1`, customer?.name || null);
        setFieldValue(`phone_receiver_step1`, customer?.phone || null);
        setFieldValue(`province_step1`, province || null);
        setFieldValue(`district_step1`, district || null);
        setFieldValue(`address_step1`, customer?.address || null);
        const wards = await queryGetWards(district?.value)
        await setFieldValue('wards', (wards || [])?.map(ward => ({label: ward?.full_name, value: ward?.code})))
        await setFieldValue('ward', customer?.wards_name ? {label: customer?.wards_name, value: customer?.ward_code} : [])
    }
    

    return (
        <div style={{ position: 'relative', opacity: loading ? 0.4 : 1 }}>
            {showAddReceiver && <ModalReceiver
                show={showAddReceiver}
                onHide={() => setShowAddReceiver(false)}
                idCustomer={infoCustomer?.id}
                onSelectReceiver={(customer) => {
                    const province = optionsProvince?.find(pr => pr?.value == customer?.province_code) || undefined;
                    const district = optionsDistrict[customer?.province_code]?.find(dt => dt?.value == customer?.district_code) || undefined;
                    selectReceiver(customer, province, district)
                }}
            />}
            {loading && <div style={{ position: 'absolute', top: '50%', left: '50%', zIndex: 99 }}>
                <span className="spinner spinner-primary" />
            </div>}
            <div className="text-primary d-flex align-items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-person" viewBox="0 0 16 16">
                    <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4m-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10s-3.516.68-4.168 1.332c-.678.678-.83 1.418-.832 1.664z" />
                </svg>
                <span
                    className="ml-2"
                    style={{ cursor: !infoReceiver?.id ? 'pointer' : 'not-allowed' }}
                    onClick={() => {
                        if (!!infoReceiver?.id) return;
                        setShowAddReceiver(true);
                    }}
                >
                    {formatMessage({ defaultMessage: 'Chọn từ CRM' })}
                </span>
                {!!infoReceiver?.id && (
                    <div className='upbase-tag ml-8 d-flex align-items-center'>
                        <span className='mr-2'>
                            ID: {infoReceiver?.id}
                        </span>
                        <span role='button' onClick={() => selectReceiver(null)}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x" viewBox="0 0 16 16">
                                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708" />
                            </svg>
                        </span>
                    </div>
                )}
            </div>
            <div className="row mt-2">
            <div className="col-6">
                        <Field
                            name="phone_receiver_step1"
                            component={InputSearchSelect}
                            // required={true}
                            placeholder={formatMessage({ defaultMessage: 'Nhập số điện thoại' })}
                            label={formatMessage({ defaultMessage: 'Số điện thoại' })}
                            customFeedbackLabel={' '}
                            options={(values['options_customer_receiver'] || [])?.map(option => ({
                                label: (option?.address && option?.phone) ? `${option?.phone} - ${option?.address}` : (option?.phone || option?.address || '' ),
                                value: option
                            }))}
                            onClearReceiver={() => {
                                if(infoReceiver?.id) {
                                    setInfoReceiver(null)
                                }
                            }}
                            changed={(customer) => {
                                const province = optionsProvince?.find(pr => pr?.value == customer?.province_code) || undefined;
                                const district = optionsDistrict[customer?.province_code]?.find(dt => dt?.value == customer?.district_code) || undefined;

                                selectReceiver(customer, province, district)
                            }}
                            onIsChangeState={async (value) => {
                               
                                const data = await queryGetRecipientByPhone(value)
                                if(data?.length) {
                                    setFieldValue('options_customer_receiver', data?.map(ctm => ({ 
                                            id: ctm?.id,
                                            phone: ctm?.phone,
                                            name: ctm?.name,
                                            address: ctm?.address,
                                            province_code: ctm?.province_code,
                                            district_code: ctm?.district_code,
                                            sc_recipient_address_id: ctm?.sc_recipient_address_id,
                                            ward_code: ctm?.ward_code,
                                            wards_name: ctm?.wards_name
                                        })))
                                    
                                } else {
                                    setFieldValue('options_customer_receiver', [])
                                }
                            
                            }}
                        />
                </div>
                <div className="col-6">
                    <Field
                        name="name_receiver_step1"
                        component={InputVertical}
                        placeholder={formatMessage({ defaultMessage: 'Nhập tên người nhận' })}
                        label={formatMessage({ defaultMessage: 'Tên người nhận' })}
                        customFeedbackLabel={' '}
                        countChar
                        maxChar={35}
                        onChangeValue={() => {
                            if(infoReceiver?.id) {
                                setInfoReceiver(null)
                            }
                        }}
                        maxLength={35}
                        // required
                    />
                </div>

            </div>
            <div className="row mt-2">
                <div className="col-6">
                    <Field
                        name="province_step1"
                        component={ReSelectVertical}
                        style={{ marginBottom: 0 }}
                        placeholder={formatMessage({ defaultMessage: 'Chọn Tỉnh/Thành phố' })}
                        label={formatMessage({ defaultMessage: 'Tỉnh/Thành phố' })}
                        components={animatedComponents}
                        onChanged={() => {
                            setFieldValue(`district_step1`, undefined)
                            if(infoReceiver?.id) {
                                setInfoReceiver(null)
                                setFieldValue(`address_step1`, '')
                            }
                        }}
                        customFeedbackLabel={' '}
                        options={optionsProvince}
                        // required
                    />
                </div>
                <div className="col-6">
                    <Field
                        name="district_step1"
                        component={ReSelectVertical}
                        style={{ marginBottom: 0 }}
                        isDisabled={!values[`province_step1`]}
                        label={formatMessage({ defaultMessage: 'Quận/Huyện' })}
                        placeholder={formatMessage({ defaultMessage: 'Chọn Quận/Huyện' })}
                        components={animatedComponents}
                        onChanged={async (data) => {
                            setFieldValue(`ward`, undefined)
                            if(infoReceiver?.id) {
                                setInfoReceiver(null)
                                setFieldValue(`address_step1`, '')
                            }
                            const wards = await queryGetWards(data?.value)
                            setFieldValue('wards', (wards || [])?.map(ward => ({label: ward?.full_name, value: ward?.code})))
                            setFieldValue('ward', undefined)
                            
                        }}
                        options={!!values[`province_step1`] ? optionsDistrict[values[`province_step1`]?.value] : []}
                        customFeedbackLabel={' '}
                        // required
                    />
                </div>
            </div>
            <div className="row mt-2">
            <div className="col-6">
                    <Field
                        name="ward"
                        component={ReSelectVertical}
                        style={{ marginBottom: 0 }}
                        onChanged={() => {
                            if(infoReceiver?.id) {
                                setInfoReceiver(null)
                                setFieldValue(`address_step1`, '')
                            }
                        }}
                        isDisabled={!values[`province_step1`]}
                        label={formatMessage({ defaultMessage: 'Phường/Xã' })}
                        placeholder={formatMessage({ defaultMessage: 'Chọn Phường/Xã' })}
                        components={animatedComponents}
                        options={!!values[`wards`] ? values[`wards`] : []}
                        customFeedbackLabel={' '}
                        // required
                    />
                </div>
                <div className="col-6">
                    <Field
                        name="address_step1"
                        component={!!infoReceiver?.id ? InputNote : InputVertical}
                        rows={3}
                        isInput={true}
                        hasReceiverId={!!infoReceiver?.id}
                        cols={['col-12', 'col-12']}
                        onChanged={() => {
                            if(infoReceiver?.id) {
                                setInfoReceiver(null)
                            }
                        }}
                        maxLength={550}
                        label={formatMessage({ defaultMessage: 'Địa chỉ' })}
                        placeholder={formatMessage({ defaultMessage: 'Nhập địa chỉ' })}
                        nameTxt={"--"}
                        // required
                        customFeedbackLabel={' '}
                    />
                </div>
            </div>
        </div>
    )
};

export default memo(InfoReceiver);