import { useMutation } from '@apollo/client';
import { Field, Formik } from 'formik';
import React, { Fragment, memo, useCallback, useMemo, useState } from 'react';
import { Modal, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';
import * as Yup from "yup";
import _ from 'lodash';
import dayjs from 'dayjs';
import mutate_cfCreateCostPeriod from '../../../../../graphql/mutate_cfCreateCostPeriod';
import { InputVertical } from '../../../../../_metronic/_partials/controls';
import { ReSelectVertical } from '../../../../../_metronic/_partials/controls/forms/ReSelectVertical';
import DateRangePicker from "rsuite/DateRangePicker";
import makeAnimated from 'react-select/animated';
import { OPTIONS_COST_METHOD } from '../CostConstants';
import { toAbsoluteUrl } from '../../../../../_metronic/_helpers';
import { Checkbox } from "../../../../../_metronic/_partials/controls";
import LoadingDialog from '../../../ProductsStore/product-new/LoadingDialog';
import mutate_cfUpdateCostPeriod from '../../../../../graphql/mutate_cfUpdateCostPeriod';
import query_cfGetSettingPercentVat from '../../../../../graphql/query_cfGetSettingPercentVat';
import client from '../../../../../apollo';

const animatedComponents = makeAnimated();

const queryGetSettingPercentVat = async (type, channel) => {
    const { data } = await client.query({
        query: query_cfGetSettingPercentVat,
        variables: {
            connector_channel_code: channel,
            type: type
        },
        fetchPolicy: "network-only",
    });

    return data?.cfGetSettingPercentVat || [];
}

const ModalCostAction = memo(({
    show,
    onHide,
    currentCostUpdate,
    optionsStores,
    optionsChannels,
    dataCostPeriodType,
    type = "normal"
}) => {
    const { addToast, removeAllToasts } = useToasts();
    const { formatMessage } = useIntl();

    const [currentDateRangeTime, setCurrentDateRangeTime] = useState([]);
    const [includeVat, setIncludeVat] = useState(false);

    const disabledFutureDate = (date) => {
        const today = new Date();
        return date > today;
    };

    const [cfCreateCostPeriod, { loading: loadingCfCreateCostPeriod }] = useMutation(mutate_cfCreateCostPeriod, {
        awaitRefetchQueries: true,
        refetchQueries: ['list_cost_period']
    });

    const [cfUpdateCostPeriod, { loading: loadingCfUpdateCostPeriod }] = useMutation(mutate_cfUpdateCostPeriod, {
        awaitRefetchQueries: true,
        refetchQueries: ['list_cost_period']
    });

    const isActionUpdate = useMemo(() => !!currentCostUpdate && type != 'clone', [currentCostUpdate, type]);

    const optionsCostPeriodType = useMemo(() => {
        return dataCostPeriodType?.getCostPeriodType?.map(cost => ({
            value: cost?.type,
            label: cost?.label,
        })) || [];
    }, [dataCostPeriodType]);

    const optionStoresActive = useMemo(() => {
        return _.map(optionsStores, store => ({ value: store?.id, label: store?.name, channel: store?.connector_channel_code }))
    }, [optionsStores])

    const optionChannelActive = useMemo(() => {
        return _.map(optionsChannels, channel => ({ value: channel?.id, label: channel?.name, code: channel?.code}))
    }, [optionsChannels])

    
    const initialValue = useMemo(
        () => {
            if (!isActionUpdate && type != 'clone') {
                return {
                    type: _.find(optionsCostPeriodType, cost => cost?.value === 3),
                    cost_label: _.find(dataCostPeriodType?.getCostPeriodType, cost => cost?.type === 3)?.cost_items?.map(item => ({
                        value: item,
                        label: item,
                    }))[0],
                    method: OPTIONS_COST_METHOD[0],
                }
            };

            const { name, cost, cost_label, time_from, time_to, stores, method, type: typeCost, cost_before_vat, percent_vat,  } = currentCostUpdate || {};

            const [currMethod, currStores, currType, currChannel] = [
                _.find(OPTIONS_COST_METHOD, cost => cost?.value == method),
                _.filter(optionStoresActive, storeActive => stores?.some(store => store?.id === storeActive?.value)),
                _.find(optionsCostPeriodType, cost => cost?.value === typeCost),
                _.find(optionChannelActive, channel => stores?.some(store => store?.connector_channel_code === channel?.code))
            ];

            const currCostLabel = _.find(
                _.find(dataCostPeriodType?.getCostPeriodType, cost => cost?.type === currType?.value)?.cost_items?.map(item => ({ value: item, label: item })),
                item => item?.value === cost_label
            );

            let [timeFrom, timeTo] = [
                dayjs(time_from).startOf("day").unix(),
                dayjs(time_to).endOf("day").unix(),
            ];
            let rangeTimeConvert = [timeFrom, timeTo]?.map(
                (_range) => new Date(_range * 1000)
            );

            if (type != 'clone') {
                setCurrentDateRangeTime(rangeTimeConvert);
            }

            return {
                name: type == 'clone' ? `Sao chép ${name}` : name,
                ...(type == 'clone' ? {} : {
                    time_from, time_to
                }),
                cost: cost_before_vat,
                cost_after_vat: cost,
                vat: percent_vat,
                method: currMethod,
                stores: currStores,
                type: currType,
                cost_label: currCostLabel,
                channels: currChannel
            };
        }, [isActionUpdate, optionsCostPeriodType, dataCostPeriodType, currentCostUpdate, optionStoresActive, type]
    );

    const validationSchema = Yup.object().shape({
        name: Yup.string()
            .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: formatMessage({ defaultMessage: "Tên chi phí" }).toLowerCase() }))
            .max(125, formatMessage({ defaultMessage: "{name} tối đa {length} ký tự" }, { length: 125, name: formatMessage({ defaultMessage: "Tên chi phí" }) }))
            .test(
                'chua-ky-tu-space-o-dau-cuoi',
                formatMessage({ defaultMessage: 'Tên chi phí không được chứa dấu cách ở đầu và cuối' }),
                (value, context) => {
                    if (!!value) {
                        return value.length == value.trim().length;
                    }
                    return false;
                },
            )
            .test(
                'chua-ky-tu-2space',
                formatMessage({ defaultMessage: 'Tên chi phí không được chứa 2 dấu cách liên tiếp' }),
                (value, context) => {
                    if (!!value) {
                        return !(/\s\s+/g.test(value))
                    }
                    return false;
                },
            ),
        cost: Yup.string()
            .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: formatMessage({ defaultMessage: "Tổng chi phí" }).toLowerCase() }))
            .min(1, formatMessage({ defaultMessage: 'Tổng chi phí tối thiểu 1đ' }))
            .max(999999999999, formatMessage({ defaultMessage: 'Tổng chi phí phải nhỏ hơn 999.999.999.999đ' })),
        vat: Yup.string()
            .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: formatMessage({ defaultMessage: "VAT" }) }))
            .min(0, formatMessage({ defaultMessage: 'VAT tối thiểu 0%' }))
            .max(100, formatMessage({ defaultMessage: 'VAT tối đa 100%' })),
        stores: Yup.array()
            .nullable()
            .required(formatMessage({ defaultMessage: 'Vui lòng chọn gian hàng phân bổ' })),
        channels: Yup.object()
            .nullable()
            .required(formatMessage({ defaultMessage: 'Vui lòng chọn kênh bán' }))
    });

    const onSubmitCreateCostPeriod = useCallback(
        async (values) => {
            try {
                const {
                    cost, cost_label, time_from, time_to, method, type, name, stores, vat, cost_after_vat
                } = values || {};

                if (!!cost_label?.__isNew__ && cost_label?.label?.trim()?.length > 25) {
                    removeAllToasts();
                    addToast(formatMessage({ defaultMessage: 'Khoản mục chi phí tối đa chỉ được 25 ký tự' }), { appearance: 'error' });
                    return;
                }
                console.log(includeVat)
                console.log(cost_after_vat)
                const bodyActionCostPeriod = {
                    ...(isActionUpdate ? {
                        cost_period_id: currentCostUpdate?.id
                    } : {}),
                    cost: cost_after_vat, time_from, time_to, name,
                    cost_before_vat: cost,
                    percent_vat: Math.round(vat),
                    cost_label: cost_label?.label,
                    method: method?.value,
                    type: type?.value,
                    stores: stores?.map(store => ({
                        id: store?.value,
                        connector_channel_code: store?.channel
                    }))
                };

                if (isActionUpdate) {
                    const { data } = await cfUpdateCostPeriod({
                        variables: bodyActionCostPeriod
                    });

                    if (!!data?.cfUpdateCostPeriod?.success) {
                        addToast(formatMessage({ defaultMessage: 'Cập nhật chi phí thành công' }), { appearance: "success" });
                    } else {
                        addToast(formatMessage({ defaultMessage: 'Cập nhật chi phí thất bại' }), { appearance: "error" });
                    }
                } else {
                    const { data } = await cfCreateCostPeriod({
                        variables: bodyActionCostPeriod
                    });

                    if (!!data?.cfCreateCostPeriod?.success) {
                        addToast(formatMessage({ defaultMessage: 'Thêm chi phí thành công' }), { appearance: "success" });
                    } else {
                        addToast(formatMessage({ defaultMessage: 'Thêm chi phí thất bại' }), { appearance: "error" });
                    }
                }

                onHide();
            } catch (error) {
                addToast(formatMessage({ defaultMessage: 'Đã có lỗi xảy ra, xin vui lòng thử lại' }), { appearance: "error" });
                onHide();
            }
        }, [isActionUpdate, currentCostUpdate, type, includeVat]
    );

    return (
        <Formik
            initialValues={initialValue}
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
                const optionsCostPeriodTypeItem = _.find(dataCostPeriodType?.getCostPeriodType, cost => cost?.type === values['type']?.value)
                    ?.cost_items?.map(item => ({
                        value: item,
                        label: item,
                    }));
                return (
                    <Fragment>
                        <LoadingDialog show={loadingCfCreateCostPeriod || loadingCfUpdateCostPeriod} />
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
                                    {isActionUpdate ? formatMessage({ defaultMessage: 'Cập nhật chi phí' }) : (type == 'clone' ? formatMessage({ defaultMessage: 'Sao chép chi phí' }) : formatMessage({ defaultMessage: 'Thêm chi phí' }))}
                                </Modal.Title>
                            </Modal.Header>
                            <Modal.Body className="overlay overlay-block cursor-default">
                                <div className='row mb-6'>
                                    <div className='col-3 text-right'>
                                        <span style={{ position: 'relative', top: 10 }}>
                                            <span>{formatMessage({ defaultMessage: 'Tên' })}</span>
                                            <span className='text-danger ml-1'>*</span>
                                        </span>
                                    </div>
                                    <div className='col-9'>
                                        <Field
                                            name={`name`}
                                            component={InputVertical}
                                            placeholder={formatMessage({ defaultMessage: 'Nhập tên chi phí phát sinh' })}
                                            label={""}
                                            maxChar={125}
                                            nameTxt={"--"}
                                            countChar
                                            required
                                            customFeedbackLabel={' '}
                                        />
                                    </div>
                                </div>
                                <div className='row'>
                                    <div className='col-3 text-right'>
                                        <span style={{ position: 'relative', top: 10 }}>
                                            <span>{formatMessage({ defaultMessage: 'Nhóm chi phí' })}</span>
                                            <span className='text-danger ml-1'>*</span>
                                        </span>
                                    </div>
                                    <div className='col-9'>
                                        <Field
                                            name={`type`}
                                            component={ReSelectVertical}
                                            placeholder={formatMessage({ defaultMessage: 'Nhập nhóm chi phí' })}
                                            label={""}
                                            customFeedbackLabel={' '}
                                            onChanged={async({ value }) => {
                                                const findedCost = _.find(dataCostPeriodType?.getCostPeriodType, cost => cost?.type === value)?.cost_items?.map(item => ({
                                                    value: item,
                                                    label: item,
                                                }));
                                                console.log({ value, findedCost })
                                                if(values?.channels?.code) {
                                                    const dataVat = await queryGetSettingPercentVat(findedCost[0]?.value, values?.channels?.code )
                                                    setFieldValue('vat', dataVat?.percent)
                                                }
                                                setFieldValue('cost_label', findedCost[0]);
                                            }}
                                            options={optionsCostPeriodType}
                                            isClearable={false}
                                        />
                                    </div>
                                </div>
                                <div className='row'>
                                    <div className='col-3 text-right'>
                                        <span style={{ position: 'relative', top: 10 }}>
                                            <span>{formatMessage({ defaultMessage: 'Khoản mục chi phí' })}</span>
                                            <span className='text-danger ml-1'>*</span>
                                        </span>
                                    </div>
                                    <div className='col-9'>
                                        <Field
                                            name={`cost_label`}
                                            component={ReSelectVertical}
                                            placeholder={formatMessage({ defaultMessage: 'Nhập khoản mục chi phí' })}
                                            label={""}
                                            customFeedbackLabel={' '}
                                            options={optionsCostPeriodTypeItem}
                                            isCreatable
                                            onChanged={async (value) => {
                                                const dataVat = await queryGetSettingPercentVat(value?.value, values?.channels?.code )
                                                setFieldValue('vat', dataVat?.percent)
                                            }}
                                            isClearable={false}
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
                                            name={`channels`}
                                            component={ReSelectVertical}
                                            placeholder={formatMessage({ defaultMessage: 'Chọn kênh bán' })}
                                            label={""}
                                            isClearable={false}
                                            customFeedbackLabel={' '}
                                            components={animatedComponents}
                                            options={optionChannelActive}
                                            onChanged={async(value) => {
                                                setFieldValue('stores', null)
                                                const dataVat = await queryGetSettingPercentVat(values?.cost_label?.value, value?.code)
                                                console.log(dataVat)
                                                setFieldValue('vat', dataVat?.percent)
                                            }}
                                            formatOptionLabel={(option) => {
                                                return <div>
                                                    <img
                                                        src={toAbsoluteUrl(`/media/logo_${option?.code}.png`)}
                                                        className='mr-2'
                                                        style={{ width: 20, height: 20, objectFit: "contain" }}
                                                    />
                                                    {option.label}
                                                </div>
                                            }}
                                        />
                                    </div>
                                </div>
                                
                                <div className='row'>
                                    <div className='col-3 text-right'>
                                        <span style={{ position: 'relative', top: 10 }}>
                                            <span>{formatMessage({ defaultMessage: 'Gian hàng phân bổ' })}</span>
                                            <span className='text-danger ml-1'>*</span>
                                        </span>
                                    </div>
                                    <div className='col-9'>
                                        <Field
                                            name={`stores`}
                                            component={ReSelectVertical}
                                            placeholder={formatMessage({ defaultMessage: 'Chọn gian hàng' })}
                                            label={""}
                                            isMulti={true}
                                            customFeedbackLabel={' '}
                                            components={animatedComponents}
                                            options={optionStoresActive?.filter(store => values?.channels?.code == store?.channel)}
                                            isClearable={false}
                                            formatOptionLabel={(option) => {
                                                return <div>
                                                    <img
                                                        src={toAbsoluteUrl(`/media/logo_${option?.channel}.png`)}
                                                        className='mr-2'
                                                        style={{ width: 20, height: 20, objectFit: "contain" }}
                                                    />
                                                    {option.label}
                                                </div>
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className='row mb-6'>
                                    <div className='col-3 text-right'>
                                    </div>
                                    <div className='col-9'>
                                        <Checkbox
                                            size='checkbox-md'
                                            inputProps={{ 'aria-label': 'checkbox' }}
                                            isSelected={includeVat}
                                            onChange={(e) => {
                                                setFieldValue('cost', null)
                                                setFieldValue('cost_after_vat', null)
                                                setIncludeVat(pre => !pre)
                                            }}
                                            title={formatMessage({ defaultMessage: 'Đã bao gồm VAT' })}
                                        />
                                    </div>
                                </div>
                                <div className='row mb-6'>
                                    <div className='col-3 text-right'>
                                        <span style={{ position: 'relative', top: 10 }}>
                                            <span>{formatMessage({ defaultMessage: 'Chi phí trước thuế' })}</span>
                                            <span className='text-danger ml-1'>*</span>
                                        </span>
                                    </div>
                                    <div className='col-9'>
                                        <Field
                                            name={`cost`}
                                            component={InputVertical}
                                            type="number"
                                            placeholder={formatMessage({ defaultMessage: 'Nhập chi phí trước thuế' })}
                                            addOnRight={''}
                                            decimalScale={2}
                                            required
                                            disabled={includeVat}
                                            customFeedbackLabel={' '}
                                            onFocusChangeValue={(value) => {
                                                setFieldValue('cost_after_vat',(value === 0 || value) ? +value*(1 + values?.vat/100) : null)
                                            }}
                                        />
                                    </div>
                                </div>
                                
                                <div className='row  mb-6'>
                                    <div className='col-3 text-right'>
                                        <span style={{ position: 'relative', top: 10 }}>
                                            <span>{formatMessage({ defaultMessage: 'VAT' })}</span>
                                            <span className='text-danger ml-1'>*</span>
                                        </span>
                                    </div>
                                    <div className='col-9'>
                                        <Field
                                            name={`vat`}
                                            component={InputVertical}
                                            placeholder={formatMessage({ defaultMessage: 'Nhập VAT' })}
                                            type="number"
                                            label={""}
                                            isAllowed={(values) => {
                                                const { floatValue } = values;

                                                return !floatValue || (0 <= floatValue && floatValue <= 100);
                                            }}
                                            required
                                            customFeedbackLabel={' '}
                                            onChangeValue={(value) => {
                                                if(!includeVat && values?.cost) {
                                                        setFieldValue('cost_after_vat', (value === 0 || value) ? +values?.cost*(1 + value/100) : null)
                                                }
                                                if(includeVat && values?.cost_after_vat) {
                                                        setFieldValue('cost', (value === 0 || value) ? +values?.cost_after_vat/(1 + value/100): null)
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className='row  mb-6'>
                                    <div className='col-3 text-right'>
                                        <span style={{ position: 'relative', top: 10 }}>
                                            <span>{formatMessage({ defaultMessage: 'Chi phí sau thuế' })}</span>
                                            <span className='text-danger ml-1'>*</span>
                                        </span>
                                    </div>
                                    <div className='col-9'>
                                        <Field
                                            name={`cost_after_vat`}
                                            component={InputVertical}
                                            placeholder={formatMessage({ defaultMessage: 'Chi phí sau thuế' })}
                                            type="number"
                                            label={""}
                                            decimalScale={2}
                                            disabled={!includeVat}
                                            onFocusChangeValue={(value) => {
                                                setFieldValue('cost', (value === 0 || value) ? +value/(1+values?.vat/100) : null)
                                            }}
                                            customFeedbackLabel={' '}
                                        />
                                    </div>
                                </div>
                                <div className='row'>
                                    <div className='col-3 text-right'>
                                        <span style={{ position: 'relative', top: 10 }}>
                                            <span>{formatMessage({ defaultMessage: 'Cách phân bổ' })}</span>
                                            <OverlayTrigger
                                                overlay={
                                                    <Tooltip>
                                                        {formatMessage({ defaultMessage: 'Chọn cách thức phân bổ chi phí' })}
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
                                            name={`method`}
                                            component={ReSelectVertical}
                                            placeholder={formatMessage({ defaultMessage: 'Nhập khoản mục chi phí' })}
                                            label={""}
                                            customFeedbackLabel={' '}
                                            options={OPTIONS_COST_METHOD}
                                            isClearable={false}
                                        />
                                    </div>
                                </div>
                                <div className='row'>
                                    <div className='col-3 text-right'>
                                        <span style={{ position: 'relative', top: 10 }}>
                                            <span>{formatMessage({ defaultMessage: 'Thời gian phân bổ' })}</span>
                                            <OverlayTrigger
                                                overlay={
                                                    <Tooltip>
                                                        {formatMessage({ defaultMessage: 'Lựa chọn thời gian phát sinh chi phí' })}
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
                                        <DateRangePicker
                                            style={{ width: "100%" }}
                                            character={" - "}
                                            className='date-cost-options'
                                            disabledDate={disabledFutureDate}
                                            format={"dd/MM/yyyy"}
                                            value={currentDateRangeTime}
                                            placeholder={"dd/mm/yyyy - dd/mm/yyyy"}
                                            placement={"top"}
                                            onChange={(values) => {
                                                console.log({ values });
                                                if (!!values) {
                                                    let [timeFrom, timeTo] = [
                                                        dayjs(values[0]).startOf("day").unix(),
                                                        dayjs(values[1]).endOf("day").unix(),
                                                    ];
                                                    let rangeTimeConvert = [timeFrom, timeTo]?.map(
                                                        (_range) => new Date(_range * 1000)
                                                    );
                                                    setFieldValue('time_from', dayjs(values[0]).format('YYYY-MM-DD'));
                                                    setFieldValue('time_to', dayjs(values[1]).format('YYYY-MM-DD'));
                                                    setCurrentDateRangeTime(rangeTimeConvert);
                                                } else {
                                                    setFieldValue('time_from', undefined);
                                                    setFieldValue('time_to', undefined);
                                                    setCurrentDateRangeTime(undefined);
                                                }
                                                // setFieldTouched('time_from', true);
                                            }}
                                            locale={{
                                                sunday: "CN",
                                                monday: "T2",
                                                tuesday: "T3",
                                                wednesday: "T4",
                                                thursday: "T5",
                                                friday: "T6",
                                                saturday: "T7",
                                                ok: formatMessage({ defaultMessage: "Đồng ý" }),
                                                today: formatMessage({ defaultMessage: "Hôm nay" }),
                                                yesterday: formatMessage({ defaultMessage: "Hôm qua" }),
                                                hours: formatMessage({ defaultMessage: "Giờ" }),
                                                minutes: formatMessage({ defaultMessage: "Phút" }),
                                                seconds: formatMessage({ defaultMessage: "Giây" }),
                                                formattedMonthPattern: "MM/yyyy",
                                                formattedDayPattern: "dd/MM/yyyy",
                                                // for DateRangePicker
                                                last7Days: formatMessage({ defaultMessage: "7 ngày qua" }),
                                            }}
                                        />
                                    </div>
                                </div>
                            </Modal.Body>
                            <Modal.Footer className="form" style={{ borderTop: '1px solid #dbdbdb', justifyContent: 'end', paddingTop: 10, paddingBottom: 10 }} >
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
                                        disabled={!currentDateRangeTime || currentDateRangeTime?.length == 0}
                                        onClick={async () => {
                                            let error = await validateForm();

                                            if (Object.keys(error).length > 0) {
                                                handleSubmit();
                                                return;
                                            } else {
                                                onSubmitCreateCostPeriod(values);
                                            }
                                        }}
                                    >
                                        {isActionUpdate ? formatMessage({ defaultMessage: 'Cập nhật' }) : formatMessage({ defaultMessage: 'Thêm' })}
                                    </button>
                                </div>
                            </Modal.Footer>
                        </Modal>
                    </Fragment>
                )
            }}
        </Formik>
    )
});

export default memo(ModalCostAction);
