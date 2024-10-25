import React, { useMemo, memo, Fragment, useState } from "react";
import { useIntl } from "react-intl";
import { Card, CardBody, CardHeader, InputVertical, TextArea } from "../../../../../../_metronic/_partials/controls";
import { Accordion, useAccordionToggle } from 'react-bootstrap';
import { Field, useFormikContext } from "formik";
import { ReSelectVertical } from "../../../../../../_metronic/_partials/controls/forms/ReSelectVertical";
import ModalCustomer from "../../dialogs/ModalCustomer";
import { useOrderManualContext } from "../../OrderManualContext";
import InputSearchSelect from "../../../../../../_metronic/_partials/controls/forms/InputSearchSelect";
import client from "../../../../../../apollo";
import query_crmGetCustomers from "../../../../../../graphql/query_crmGetCustomers";

const InfoBuyer = ({ loading = false }) => {
    const { formatMessage } = useIntl();
    const { infoCustomer, setInfoCustomer, infoReceiver,setInfoReceiver } = useOrderManualContext();
    const { setFieldValue, values } = useFormikContext();
    const [showAddCustomer, setShowAddCustomer] = useState(false);  
    const queryGetCustomerByPhone = async (phone) => {
        
        const { data } = await client.query({
            query: query_crmGetCustomers,
            variables: {
                page: 1,
                per_page: 50,
                search: {
                    ...(!!phone ? {
                        search_phone: phone
                    } : {})
                }
            },
            fetchPolicy: "network-only",
        });

        return data?.crmGetCustomers?.customers || [];
    }
    
    const handleSelectCustomer = (customer) => {
        setFieldValue(`name_customer_step1`, customer?.name || null);
        setFieldValue(`phone_customer_step1`, customer?.phone || null);                    
        setInfoCustomer(customer || null)
    }

    return (
        <div style={{ position: 'relative', opacity: loading ? 0.4 : 1 }}>
            {showAddCustomer && <ModalCustomer
                show={showAddCustomer}
                onHide={() => setShowAddCustomer(false)}
                onSelectCustomer={(customer) => handleSelectCustomer(customer)}
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
                    style={{ cursor: !infoCustomer?.id ? 'pointer' : 'not-allowed' }}
                    onClick={() => {
                        if (!!infoCustomer?.id) return;
                        setShowAddCustomer(true);
                    }}
                >
                    {formatMessage({ defaultMessage: 'Chọn từ CRM' })}
                </span>
                {!!infoCustomer?.id && (
                    <div className='upbase-tag ml-8 d-flex align-items-center'>
                        <span className='mr-2'>
                            ID: {infoCustomer?.id}
                        </span>
                        <span role='button' onClick={() => {
                            if (!!infoReceiver) {
                                setInfoReceiver(null);
                                setFieldValue(`name_receiver_step1`, null);
                                setFieldValue(`phone_receiver_step1`, null);
                                setFieldValue(`province_step1`, null);
                                setFieldValue(`district_step1`, null);
                                setFieldValue(`address_step1`, null);
                            }
                            handleSelectCustomer(null)
                        }}>
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
                            name="phone_customer_step1"
                            component={InputSearchSelect}
                            placeholder={formatMessage({ defaultMessage: 'Nhập số điện thoại' })}
                            label={formatMessage({ defaultMessage: 'Số điện thoại' })}
                            customFeedbackLabel={' '}
                            options={(values['options_customer'] || [])?.map(option => ({label: `${option?.phone} - ${option?.name}`, value: option}))}
                            changed={(customer) => {
                                if (!!infoReceiver) {
                                    setInfoReceiver(null);
                                    setFieldValue(`name_receiver_step1`, null);
                                    setFieldValue(`phone_receiver_step1`, null);
                                    setFieldValue(`province_step1`, null);
                                    setFieldValue(`district_step1`, null);
                                    setFieldValue(`address_step1`, null);
                                }
                                handleSelectCustomer(customer)
                            }}
                            onIsChangeState={async (value) => {
                                const data = await queryGetCustomerByPhone(value)
                                if(data?.length) {
                                    setFieldValue('options_customer', data?.map(ctm => ({
                                        id: ctm?.id,
                                        name: ctm?.name,
                                        phone: ctm?.phone,
                                        sc_customer_id: ctm?.sc_customer_id
                                    })))
                                    return
                                } else {
                                    setFieldValue('options_customer', [])
                                }

                            }}
                        />
                </div>
                <div className="col-6">
                    <Field
                        name="name_customer_step1"
                        component={InputVertical}
                        placeholder={formatMessage({ defaultMessage: 'Nhập tên người mua' })}
                        label={formatMessage({ defaultMessage: 'Tên người mua' })}
                        customFeedbackLabel={' '}
                        countChar
                        maxChar={35}
                        maxLength={35}
                        required
                    />
                </div>
            
            </div>
        </div>
    )
};

export default memo(InfoBuyer);