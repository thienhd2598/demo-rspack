import { useMutation } from '@apollo/client';
import { Field, Formik } from 'formik';
import React, { Fragment, memo, useCallback, useMemo, useState } from 'react';
import { Modal, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';
import * as Yup from "yup";
import makeAnimated from 'react-select/animated';
import { ReSelectVertical } from '../../../../../_metronic/_partials/controls/forms/ReSelectVertical';
import { InputVertical, TextArea } from '../../../../../_metronic/_partials/controls';
import { toAbsoluteUrl } from '../../../../../_metronic/_helpers';
import LoadingDialog from '../../../ProductsStore/product-new/LoadingDialog';
import mutate_crmCreateCustomer from '../../../../../graphql/mutate_crmCreateCustomer';
import client from '../../../../../apollo';
import query_crmGetWards from '../../../../../graphql/query_crmGetWards';

const animatedComponents = makeAnimated();


export const queryGetWards = async (code) => {
    if (!code) return [];
    
    const { data } = await client.query({
        query: query_crmGetWards,
        variables: {
            district_code: code,
        },
        fetchPolicy: "network-only",
    });

    return data?.crmGetWards || []
}


const CreateCustomerDialog = ({ show, onHide, optionsProvince, optionsDistrict, optionsChannelCode, loadingCrmGetProvince, loadingCrmGetDistrict, optionsStore }) => {
    const { addToast } = useToasts();
    const { formatMessage } = useIntl();

    const [crmCreateCustomer, { loading: loadingCrmCreateCustomer }] = useMutation(mutate_crmCreateCustomer, {
        awaitRefetchQueries: true,
        refetchQueries: ['crmGetCustomers']
    });

    const validationSchema = Yup.object().shape({
        seller_username: Yup.string()
            .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: formatMessage({ defaultMessage: "Tên tài khoản" }).toLowerCase() })),
        channel: Yup.object().required(formatMessage({ defaultMessage: 'Vui lòng chọn kênh bán' })),        
        name: Yup.string()
            .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: formatMessage({ defaultMessage: "Tên khách hàng" }).toLowerCase() }))
            .max(35, formatMessage({ defaultMessage: "{name} tối đa {length} ký tự" }, { length: 35, name: formatMessage({ defaultMessage: "Tên khách hàng" }) }))
            .test(
                'chua-ky-tu-space-o-dau-cuoi',
                formatMessage({ defaultMessage: 'Tên khách hàng không được chứa dấu cách ở đầu và cuối' }),
                (value, context) => {
                    if (!!value) {
                        return value.length == value.trim().length;
                    }
                    return false;
                },
            )
            .test(
                'chua-ky-tu-2space',
                formatMessage({ defaultMessage: 'Tên khách hàng không được chứa 2 dấu cách liên tiếp' }),
                (value, context) => {
                    if (!!value) {
                        return !(/\s\s+/g.test(value))
                    }
                    return false;
                },
            ),
        email: Yup.string()
            .email(formatMessage({ defaultMessage: "Email khách hàng không hợp lệ" })),
        phone: Yup.string()
            .length(10, formatMessage({ defaultMessage: "Độ dài số điện thoại khách hàng phải {number} số" }, { number: 10 }))
            .test(
                'sai-dinh-dang-phone',
                'Số điện thoại khách hàng không hợp lệ',
                (value, context) => {
                    if (!!value) {
                        return (/^0[0-9]\d{8}$/g.test(value))
                    }
                    return true;
                },
            ),
    });

    const onCreateCustomer = useCallback(async (values, cb) => {
        try {            
            const body = {
                seller_username: values?.seller_username,
                name: values?.name,
                address: values?.address,
                connector_channel_code: values?.channel?.value,
                list_store_id: !!values?.list_store_id ? values?.list_store_id?.map(store => store?.value) : [null],
                province_code: values?.province?.value,
                district_code: values?.district?.value,
                email: values?.email,
                phone: values?.phone,
                ward_code: values?.ward?.value,
            };

            const { data } = await crmCreateCustomer({
                variables: body
            });

            if (!!data?.crmCreateCustomer?.success) {
                onHide();
                cb();
                addToast(formatMessage({ defaultMessage: 'Thêm khách hàng thành công' }), { appearance: "success" });
            } else {
                addToast(data?.crmCreateCustomer?.message || formatMessage({ defaultMessage: 'Thêm khách hàng thất bại' }), { appearance: "error" });
            }
        } catch (error) {
            addToast(formatMessage({ defaultMessage: 'Đã có lỗi xảy ra, xin vui lòng thử lại' }), { appearance: "error" });            
        }
    }, []);

    return (
        <Formik
            initialValues={{}}
            validationSchema={validationSchema}
            enableReinitialize
        >
            {({
                handleSubmit,
                values,
                validateForm,
                setFieldValue,
                resetForm,
                errors,
                ...rest
            }) => {
                console.log('district',values)
                return (
                    <Fragment>
                        <LoadingDialog show={loadingCrmCreateCustomer} />
                        {!loadingCrmCreateCustomer && <Modal
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
                                    {formatMessage({ defaultMessage: 'Thêm thông tin khách hàng' })}
                                </Modal.Title>
                            </Modal.Header>
                            <Modal.Body className="overlay overlay-block cursor-default">
                                <div className='row mb-6'>
                                    <div className='col-3 text-right'>
                                        <span style={{ position: 'relative', top: 10 }}>
                                            <span>{formatMessage({ defaultMessage: 'Tên tài khoản' })}</span>
                                            <OverlayTrigger
                                                overlay={
                                                    <Tooltip>
                                                        {formatMessage({ defaultMessage: 'Nhập tên tài khoản khách hàng, nếu khách hàng không có tài khoản thì điền theo mã số để dàng phân biệt hoặc điền theo tên khách hàng' })}
                                                    </Tooltip>
                                                }
                                            >
                                                <span className="ml-1" style={{ position: 'relative', top: '-1px' }}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" class="bi bi-info-circle" viewBox="0 0 16 16">
                                                        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                                                        <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
                                                    </svg>
                                                </span>
                                            </OverlayTrigger>
                                            <span className='text-danger ml-1'>*</span>
                                        </span>
                                    </div>
                                    <div className='col-9'>
                                        <Field
                                            name={`seller_username`}
                                            component={InputVertical}
                                            placeholder={formatMessage({ defaultMessage: 'Nhập tên tài khoản' })}
                                            label={""}
                                            maxChar={35}
                                            maxLength={35}
                                            nameTxt={"--"}
                                            countChar
                                            required
                                            customFeedbackLabel={' '}
                                        />
                                    </div>
                                </div>
                                <div className='row mb-6'>
                                    <div className='col-3 text-right'>
                                        <span style={{ position: 'relative', top: 10 }}>
                                            <span>{formatMessage({ defaultMessage: 'Tên khách hàng' })}</span>
                                            <span className='text-danger ml-1'>*</span>
                                        </span>
                                    </div>
                                    <div className='col-9'>
                                        <Field
                                            name={`name`}
                                            component={InputVertical}
                                            placeholder={formatMessage({ defaultMessage: 'Nhập tên khách hàng' })}
                                            label={""}
                                            maxChar={35}
                                            maxLength={35}
                                            nameTxt={"--"}
                                            countChar
                                            required
                                            customFeedbackLabel={' '}
                                        />
                                    </div>
                                </div>
                                <div className='row mb-6'>
                                    <div className='col-3 text-right'>
                                        <span style={{ position: 'relative', top: 10 }}>
                                            <span>{formatMessage({ defaultMessage: 'Email' })}</span>
                                        </span>
                                    </div>
                                    <div className='col-9'>
                                        <Field
                                            name={`email`}
                                            component={InputVertical}
                                            placeholder={formatMessage({ defaultMessage: 'Nhập email khách hàng' })}
                                            label={""}
                                            nameTxt={"--"}
                                            customFeedbackLabel={' '}
                                        />
                                    </div>
                                </div>
                                <div className='row mb-6'>
                                    <div className='col-3 text-right'>
                                        <span style={{ position: 'relative', top: 10 }}>
                                            <span>{formatMessage({ defaultMessage: 'Số điện thoại' })}</span>
                                        </span>
                                    </div>
                                    <div className='col-9'>
                                        <Field
                                            name={`phone`}
                                            component={InputVertical}
                                            placeholder={formatMessage({ defaultMessage: 'Nhập số điện thoại khách hàng' })}
                                            label={""}
                                            nameTxt={"--"}
                                            customFeedbackLabel={' '}
                                        />
                                    </div>
                                </div>
                                <div className='row'>
                                    <div className='col-3 text-right'>
                                        <span style={{ position: 'relative', top: 10 }}>
                                            <span>{formatMessage({ defaultMessage: 'Kênh bán' })}</span>
                                            <span className='text-danger ml-1'>*</span>
                                        </span>
                                    </div>
                                    <div className='col-9'>
                                        <Field
                                            name={`channel`}
                                            component={ReSelectVertical}
                                            placeholder={formatMessage({ defaultMessage: 'Chọn kênh bán' })}
                                            label={""}
                                            customFeedbackLabel={' '}
                                            onChanged={() => setFieldValue('list_store_id', undefined)}
                                            components={animatedComponents}
                                            options={optionsChannelCode}
                                            isClearable={true}
                                            formatOptionLabel={(option, labelMeta) => {
                                                return <div className='d-flex align-items-center'>
                                                    {!!option.logo && <img src={option.logo} style={{ width: 15, height: 15, marginRight: 8 }} />}
                                                    <span>{option.label}</span>
                                                </div>
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className='row'>
                                    <div className='col-3 text-right'>
                                        <span style={{ position: 'relative', top: 10 }}>
                                            <span>{formatMessage({ defaultMessage: 'Gian hàng' })}</span>
                                        </span>
                                    </div>
                                    <div className='col-9'>
                                        <Field
                                            name={`list_store_id`}
                                            component={ReSelectVertical}
                                            placeholder={formatMessage({ defaultMessage: 'Chọn gian hàng' })}
                                            label={""}
                                            isDisabled={!values['channel']}
                                            isMulti={true}
                                            customFeedbackLabel={' '}
                                            components={animatedComponents}
                                            options={optionsStore?.filter(store => store?.connector_channel_code == values?.channel?.value)}
                                            isClearable={true}
                                            formatOptionLabel={(option, labelMeta) => {
                                                return <div className='d-flex align-items-center'>
                                                    {!!option.logo && <img src={option.logo} style={{ width: 15, height: 15, marginRight: 8 }} />}
                                                    <span>{option.label}</span>
                                                </div>
                                            }}
                                        />
                                    </div>
                                </div>
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
                                            loading={loadingCrmGetProvince}
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
                                            onChanged={async (data) => {
                                                const wards = await queryGetWards(data?.value)
                                                setFieldValue('wards', (wards || [])?.map(ward => ({label: ward?.full_name, value: ward?.code})))
                                                setFieldValue('ward', undefined)
                                            }}
                                            loading={loadingCrmGetDistrict}
                                            isDisabled={!values[`province`]}
                                            placeholder={formatMessage({ defaultMessage: 'Chọn Quận/Huyện' })}
                                            label={""}
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
                                            component={ReSelectVertical}
                                            loading={loadingCrmGetDistrict}
                                            isDisabled={!values[`wards`]}
                                            placeholder={formatMessage({ defaultMessage: 'Chọn Phường/Xã' })}
                                            label={""}
                                            customFeedbackLabel={' '}
                                            components={animatedComponents}
                                            options={!!values[`wards`] ? values['wards'] : []}
                                            isClearable={true}
                                        />
                                    </div>
                                </div>
                                <div className='row'>
                                    <div className='col-3 text-right'>
                                        <span style={{ position: 'relative', top: 10 }}>
                                            <span>{formatMessage({ defaultMessage: 'Địa chỉ' })}</span>                                            
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
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        style={{ width: 120 }}
                                        onClick={async () => {
                                            let error = await validateForm();

                                            if (Object.keys(error).length > 0) {
                                                handleSubmit();
                                                return;
                                            } else {
                                                onCreateCustomer(values, () => resetForm());
                                            }
                                        }}
                                    >
                                        {formatMessage({ defaultMessage: 'Tạo' })}
                                    </button>
                                </div>
                            </Modal.Footer>
                        </Modal>}
                    </Fragment>
                )
            }}
        </Formik>
    )
};

export default memo(CreateCustomerDialog);
