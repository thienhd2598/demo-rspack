import React, { memo } from "react";
import { Modal } from 'react-bootstrap';
import { useIntl } from 'react-intl';
import * as Yup from "yup";
import { Field, Formik } from 'formik';
import { ReSelectVertical } from "../../../../../_metronic/_partials/controls/forms/ReSelectVertical";
import { useOrderPosContext } from "../../OrderPosContext";
import { OPTIONS_SCAN } from "../../OrderSalesPersonHelper";
import { randomString } from "../../../../../utils";

const ModalConfig = ({
    show, onHide, onAddValues
}) => {
    const { formatMessage } = useIntl();
    const { 
        optionsSmeWarehouse, optionsStore, setStoreSelected, setWarehouseSelected, setCurrentOrderPos, setOrderPos, 
        setCurrentScanBy, optionsProvince, optionsDistrict, setProvinceSelected, setDistrictSelected, setAddressSelected
    } = useOrderPosContext();

    const validationSchema = Yup.object().shape({
        store: Yup.object().required(formatMessage({ defaultMessage: 'Vui lòng chọn gian hàng' })),
        smeWarehouse: Yup.object().required(formatMessage({ defaultMessage: 'Vui lòng chọn kho' })),
        province: Yup.object()
            .nullable()
            .required(formatMessage({ defaultMessage: "Vui lòng chọn {name}" }, { name: formatMessage({ defaultMessage: "Tỉnh/thành phố" }).toLowerCase() })),
        district: Yup.object()
            .nullable()
            .required(formatMessage({ defaultMessage: "Vui lòng chọn {name}" }, { name: formatMessage({ defaultMessage: "Quận/huyện" }).toLowerCase() }))
    })

    return (
        <Formik
            initialValues={{ scan: OPTIONS_SCAN[0] }}
            validationSchema={validationSchema}
            enableReinitialize
        >
            {({
                handleSubmit,
                values,
                validateForm,
                setFieldValue,
                errors,
                touched,
                setFieldTouched,
                ...rest
            }) => {
                return (
                    <Modal
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
                                {formatMessage({ defaultMessage: 'Cấu hình cửa hàng và kho' })}
                            </Modal.Title>
                        </Modal.Header>
                        <Modal.Body className="overlay overlay-block cursor-default">
                            <div className='row'>
                                <div className='col-3 text-right'>
                                    <span style={{ position: 'relative', top: 10 }}>
                                        <span>{formatMessage({ defaultMessage: 'Gian hàng' })}</span>
                                        <span className='text-danger ml-1'>*</span>
                                    </span>
                                </div>
                                <div className='col-9'>
                                    <Field
                                        name={`store`}
                                        component={ReSelectVertical}
                                        placeholder={formatMessage({ defaultMessage: 'Chọn gian hàng' })}
                                        label={""}
                                        customFeedbackLabel={' '}
                                        options={optionsStore}
                                    />
                                </div>
                            </div>
                            <div className='row'>
                                <div className='col-3 text-right'>
                                    <span style={{ position: 'relative', top: 10 }}>
                                        <span>{formatMessage({ defaultMessage: 'Kho riêng' })}</span>
                                        <span className='text-danger ml-1'>*</span>
                                    </span>
                                </div>
                                <div className='col-9'>
                                    <Field
                                        name={`smeWarehouse`}
                                        component={ReSelectVertical}
                                        placeholder={formatMessage({ defaultMessage: 'Chọn kho' })}
                                        label={""}
                                        customFeedbackLabel={' '}
                                        options={optionsSmeWarehouse}
                                    />
                                </div>
                            </div>
                            <div className='row'>
                                <div className='col-3 text-right'>
                                    <span style={{ position: 'relative', top: 10 }}>
                                        <span>{formatMessage({ defaultMessage: 'Scan theo' })}</span>
                                        <span className='text-danger ml-1'>*</span>
                                    </span>
                                </div>
                                <div className='col-9'>
                                    <Field
                                        name={`scan`}
                                        component={ReSelectVertical}
                                        label={""}
                                        customFeedbackLabel={' '}
                                        options={OPTIONS_SCAN}
                                        isClearable={false}
                                    />
                                </div>
                            </div>
                            <div className='row'>
                                <div className='col-3 text-right'>
                                    <span style={{ position: 'relative', top: 10 }}>
                                        <span>{formatMessage({ defaultMessage: 'Tỉnh/Thành phố' })}</span>
                                        <span className='text-danger ml-1'>*</span>
                                    </span>
                                </div>
                                <div className='col-9'>
                                    <Field
                                        name={`province`}
                                        component={ReSelectVertical}
                                        placeholder={formatMessage({ defaultMessage: 'Chọn Tỉnh/Thành phố' })}
                                        label={''}
                                        onChanged={() => setFieldValue(`district`, undefined)}
                                        customFeedbackLabel={' '}
                                        options={optionsProvince}
                                        required
                                    />
                                </div>
                            </div>
                            <div className='row'>
                                <div className='col-3 text-right'>
                                    <span style={{ position: 'relative', top: 10 }}>
                                        <span>{formatMessage({ defaultMessage: 'Quận/Huyện' })}</span>
                                        <span className='text-danger ml-1'>*</span>
                                    </span>
                                </div>
                                <div className='col-9'>
                                    <Field
                                        name={`district`}
                                        component={ReSelectVertical}
                                        isDisabled={!values[`province`]}
                                        label={''}
                                        placeholder={formatMessage({ defaultMessage: 'Chọn Quận/Huyện' })}
                                        options={!!values[`province`] ? optionsDistrict[values[`province`]?.value] : []}
                                        customFeedbackLabel={' '}
                                        required
                                    />
                                </div>
                            </div>
                        </Modal.Body>
                        <Modal.Footer className="form justify-content-end py-4" style={{ borderTop: '1px solid #dbdbdb' }}>
                            <div className="form-group">
                                <button
                                    type="button"
                                    onClick={onHide}
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
                                            const { scan, store, smeWarehouse, province, district } = values || {};
                                            const randomCode = randomString();

                                            setWarehouseSelected(smeWarehouse);
                                            setStoreSelected(store);
                                            setCurrentScanBy(scan);
                                            setCurrentOrderPos(randomCode);
                                            setProvinceSelected(province);
                                            setDistrictSelected(district);
                                            setAddressSelected(smeWarehouse?.address || '');
                                            setOrderPos([{
                                                code: randomCode,
                                                title: 'Hóa đơn 1',
                                                variants: []
                                            }]);
                                            onAddValues({ 
                                                province, 
                                                district, 
                                                scan, 
                                                address: smeWarehouse?.address || '', 
                                                code: randomCode 
                                            });
                                        }
                                    }}
                                >
                                    {formatMessage({ defaultMessage: 'Chọn' })}
                                </button>
                            </div>
                        </Modal.Footer>
                    </Modal>
                )
            }}
        </Formik>
    )
};

export default memo(ModalConfig)