import { useMutation, useQuery } from '@apollo/client';
import { Field, Formik } from 'formik';
import React, { Fragment, memo, useCallback, useMemo, useState } from 'react';
import { Modal } from 'react-bootstrap';
import { useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';
import * as Yup from "yup";
import makeAnimated from 'react-select/animated';
import { ReSelectVertical } from '../../../../../_metronic/_partials/controls/forms/ReSelectVertical';
import { InputVertical, TextArea } from '../../../../../_metronic/_partials/controls';
import { toAbsoluteUrl } from '../../../../../_metronic/_helpers';
import LoadingDialog from '../../../ProductsStore/product-new/LoadingDialog';
import mutate_crmUpdateCustomer from '../../../../../graphql/mutate_crmUpdateCustomer';
import mutate_crmUpdateCustomerRecipientAddress from '../../../../../graphql/mutate_crmUpdateCustomerRecipientAddress';
import { queryGetWards } from './CreateCustomerDialog'
import query_crmGetWards from '../../../../../graphql/query_crmGetWards';
import AuthorizationWrapper from '../../../../../components/AuthorizationWrapper';
const animatedComponents = makeAnimated();

const AddressDialog = ({ show, onHide, optionsProvince, optionsDistrict, data, id, type = 'customer' }) => {
    const { addToast, removeAllToasts } = useToasts();
    const { formatMessage } = useIntl();
    const [initialValues, setInitialValues] = useState({});
    console.log('data', data)
    const [crmUpdateCustomer, { loading: loadingCrmUpdateCustomer }] = useMutation(mutate_crmUpdateCustomer, {
        refetchQueries: ['crmFindCustomer']
    });

    const [crmUpdateCustomerRecipientAddress, { loading: loadingCrmUpdateCustomerRecipientAddress }] = useMutation(mutate_crmUpdateCustomerRecipientAddress, {
        awaitRefetchQueries: true,
        refetchQueries: ['crmRecipientAddressByCustomer', 'crmFindCustomer']
    });

    const [district_code] = useMemo(() => {
        if (!!data?.province_code) {
            const province = optionsProvince?.find(item => item?.value == data?.province_code);

            const district = !!data?.district_code
                ? optionsDistrict[data?.province_code]?.find(item => item?.value == data?.district_code)
                : undefined

            setInitialValues({ province, district, address: data?.address })
        } else {
            setInitialValues({
                address: data?.address
            })
        }
        return [optionsDistrict[data?.province_code]?.find(item => item?.value == data?.district_code)?.value]
    }, [data, optionsProvince, optionsDistrict]);

    const{ loading: loadingGetWard, data: dataWards} = useQuery(query_crmGetWards, {
        fetchPolicy: "cache-and-network",
        variables: {
            district_code: district_code
        },
        skip: !district_code,
    });

    useMemo(() => {
        const findWards = dataWards?.crmGetWards?.find(ward => ward?.code == data?.ward_code)
        setInitialValues(prev => ({
            ...prev, ward: findWards ? {label: findWards?.full_name, value: findWards?.code} : undefined, wards: (dataWards?.crmGetWards || [])?.map(ward => ({label: ward?.full_name, value: ward?.code}))
        }))
    }, [dataWards, data?.ward_code])

    const onUpdateCustomer = useCallback(async (values) => {
        try {
            if (type == 'customer') {
                const { data } = await crmUpdateCustomer({
                    variables: {
                        id,
                        province_code: values?.province?.value || "",
                        district_code: values?.district?.value || "",
                        address: values?.address,
                        ward_code: values?.ward?.value || "",
                    }
                });

                onHide();
                if (!!data?.crmUpdateCustomer?.success) {
                    addToast(formatMessage({ defaultMessage: 'Cập nhật địa chỉ thành công' }), { appearance: "success" });
                } else {
                    addToast(data?.crmUpdateCustomer?.message || formatMessage({ defaultMessage: 'Cập nhật địa chỉ thất bại' }), { appearance: "error" });
                }
            } else {
                const { data } = await crmUpdateCustomerRecipientAddress({
                    variables: {
                        id,
                        province_code: values?.province?.value || "",
                        district_code: values?.district?.value || "",
                        address: values?.address,
                        ward_code: values?.ward?.value || "",
                    }
                });

                onHide();
                if (!!data?.crmUpdateCustomerRecipientAddress?.success) {
                    addToast(formatMessage({ defaultMessage: 'Cập nhật địa chỉ thành công' }), { appearance: "success" });
                } else {
                    addToast(data?.crmUpdateCustomerRecipientAddress?.message || formatMessage({ defaultMessage: 'Cập nhật địa chỉ thất bại' }), { appearance: "error" });
                }
            }
        } catch (error) {
            addToast(formatMessage({ defaultMessage: 'Đã có lỗi xảy ra, xin vui lòng thử lại' }), { appearance: "error" });
        }
    }, [id]);

    return (
        <Formik
            initialValues={initialValues}
            validationSchema={null}
            enableReinitialize
        >
            {({
                handleSubmit,
                values,
                validateForm,
                setFieldValue,
                errors,
                resetForm,
                ...rest
            }) => {
                console.log('values', values)
                return (
                    <Fragment>
                        <LoadingDialog show={loadingCrmUpdateCustomer || loadingCrmUpdateCustomerRecipientAddress} />
                        {!loadingCrmUpdateCustomer && !loadingCrmUpdateCustomerRecipientAddress && <Modal
                            show={show}
                            size="md"
                            aria-labelledby="example-modal-sizes-title-sm"
                            dialogClassName="modal-actions-cost-income"
                            centered
                            onHide={() => { }}
                            backdrop={true}
                        >
                            <Modal.Header closeButton={true}>
                                <Modal.Title>
                                    {formatMessage({ defaultMessage: 'Cập nhật địa chỉ' })}
                                </Modal.Title>
                            </Modal.Header>
                            <Modal.Body className="overlay overlay-block cursor-default">
                                <div className='row'>
                                    <div className='col-3 text-right'>
                                        <span style={{ position: 'relative', top: 10 }}>
                                            <span>{formatMessage({ defaultMessage: 'Tỉnh/Thành phố' })}</span>
                                        </span>
                                    </div>
                                    <div className='col-9'>
                                        <Field
                                            name={`province`}
                                            component={ReSelectVertical}
                                            placeholder={formatMessage({ defaultMessage: 'Chọn Tỉnh/Thành phố' })}
                                            label={""}
                                            onChanged={() => {
                                                setFieldValue(`district`, undefined)
                                                setFieldValue(`ward`, undefined)
                                            }}
                                            customFeedbackLabel={' '}
                                            components={animatedComponents}
                                            options={optionsProvince}
                                            isClearable={true}
                                        />
                                    </div>
                                </div>
                                <div className='row'>
                                    <div className='col-3 text-right'>
                                        <span style={{ position: 'relative', top: 10 }}>
                                            <span>{formatMessage({ defaultMessage: 'Quận/Huyện' })}</span>
                                        </span>
                                    </div>
                                    <div className='col-9'>
                                        <Field
                                            name={`district`}
                                            component={ReSelectVertical}
                                            isDisabled={!values[`province`]}
                                            placeholder={formatMessage({ defaultMessage: 'Chọn Quận/Huyện' })}
                                            label={""}
                                            onChanged={async (data) => {
                                                const wards = await queryGetWards(data?.value)
                                                setFieldValue('wards', (wards || [])?.map(ward => ({label: ward?.full_name, value: ward?.code})))
                                                setFieldValue('ward', undefined)
                                            }}
                                            customFeedbackLabel={' '}
                                            components={animatedComponents}
                                            options={!!values[`province`] ? optionsDistrict[values[`province`]?.value] : []}
                                            isClearable={true}
                                        />
                                    </div>
                                </div>
                                <div className='row'>
                                    <div className='col-3 text-right'>
                                        <span style={{ position: 'relative', top: 10 }}>
                                            <span>{formatMessage({ defaultMessage: 'Phường/Xã' })}</span>
                                        </span>
                                    </div>
                                    <div className='col-9'>
                                        <Field
                                            name={`ward`}
                                            isLoading={loadingGetWard}
                                            component={ReSelectVertical}
                                            isDisabled={loadingGetWard}
                                            placeholder={formatMessage({ defaultMessage: 'Chọn Phường/Xã' })}
                                            label={""}
                                            customFeedbackLabel={' '}
                                            components={animatedComponents}
                                            options={!!values[`wards`] ? values[`wards`] : []}
                                            isClearable={true}
                                        />
                                    </div>
                                </div>
                                <div className='row'>
                                    <div className='col-3 text-right'>
                                        <span style={{ position: 'relative', top: 10 }}>
                                            <span>{formatMessage({ defaultMessage: 'Địa chỉ' })}</span>
                                            <span className='text-danger ml-1'>*</span>
                                        </span>
                                    </div>
                                    <div className='col-9'>
                                        <Field
                                            name={`address`}
                                            component={TextArea}
                                            rows={5}
                                            cols={['col-12', 'col-12']}
                                            countChar
                                            maxChar={550}
                                            maxLength={550}
                                            placeholder={formatMessage({ defaultMessage: 'Nhập địa chỉ của khách hàng' })}
                                            label={""}
                                            nameTxt={"--"}
                                            required
                                            customFeedbackLabel={' '}
                                        />
                                    </div>
                                </div>
                            </Modal.Body>
                            <Modal.Footer className="form" style={{ borderTop: '1px solid #dbdbdb', justifyContent: 'end', paddingTop: 10, paddingBottom: 10 }} >
                                <div className="form-group">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onHide();
                                            resetForm();
                                        }}
                                        className="btn btn-secondary mr-3"
                                        style={{ width: 120 }}
                                    >
                                        {formatMessage({ defaultMessage: 'Hủy' })}
                                    </button>
                                    <AuthorizationWrapper keys={['customer_service_customer_info_update']}>
                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            style={{ width: 120 }}
                                            disabled={!values['address']}
                                            onClick={async () => {
                                                let error = await validateForm();

                                                if (Object.keys(error).length > 0) {
                                                    handleSubmit();
                                                    return;
                                                } else {
                                                    onUpdateCustomer(values);
                                                    resetForm();
                                                }
                                            }}
                                        >
                                            {formatMessage({ defaultMessage: 'Cập nhật' })}
                                        </button>
                                    </AuthorizationWrapper>
                                </div>
                            </Modal.Footer>
                        </Modal>}
                    </Fragment>
                )
            }}
        </Formik>
    )
};

export default memo(AddressDialog);
