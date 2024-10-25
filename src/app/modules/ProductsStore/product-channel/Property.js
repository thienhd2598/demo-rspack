/*
 * Created by duydatpham@gmail.com on 10/11/2021
 * Copyright (c) 2021 duydatpham@gmail.com
 */

import { Field } from "formik";
import React, { memo } from "react";
import { Input } from "../../../../_metronic/_partials/controls";
import { InputDate } from "../../../../_metronic/_partials/controls/forms/InputDate";
import { ReSelect } from "../../../../_metronic/_partials/controls/forms/ReSelect";
import { ReSelectUnit } from "../../../../_metronic/_partials/controls/forms/ReSelectUnit";
import { ReSelectVertical } from "../../../../_metronic/_partials/controls/forms/ReSelectVertical";
import { ATTRIBUTE_VALUE_TYPE } from "../ProductsUIHelpers";
import { useProductsUIContext } from '../ProductsUIContext';

export default memo(({ property, name, onChanged, connectorChannelCode }) => {
    const { currentChannel } = useProductsUIContext() || {};      
    
    if (property.input_type == ATTRIBUTE_VALUE_TYPE.SINGLE_SELECT_CUSTOM_VALUE && property.unit_options?.length > 0) {
        return <div className='col-6' >
            <div className='row' >
                <div className={'col-12'} >
                    <Field
                        key={name}
                        name={name}
                        component={ReSelectUnit}
                        placeholder=""
                        label={property.display_name}
                        required={property.is_mandatory == 1}
                        customFeedbackLabel={' '}
                        unitOptions={property.unit_options?.map(_op => {
                            return {
                                label: _op,
                                value: _op,
                            }
                        })}
                        options={property.options?.map(_op => {
                            return {
                                label: _op.display_name,
                                value: !_op.id ? _op.display_name : String(_op.id),
                                __isNew__: !_op.id
                            }
                        })}
                        cols={property.unit_options?.length > 0 ? ['col-4', 'col-8'] : ['col-3', 'col-9']}
                        onChanged={onChanged}
                    />
                </div>
            </div>
        </div>
    }
    if (property.input_type == ATTRIBUTE_VALUE_TYPE.MULTIPLE_SELECT_CUSTOM_VALUE && property.unit_options?.length > 0) {
        return <div className='col-6' >
            <div className='row' >
                <div className={'col-12'} >
                    <Field
                        key={name}
                        name={name}
                        component={ReSelectUnit}
                        placeholder=""
                        label={property.display_name}
                        isRequiredMaxOptions={(currentChannel?.connector_channel_code || connectorChannelCode) === 'tiktok'}
                        required={property.is_mandatory == 1}
                        customFeedbackLabel={' '}
                        isMulti={true}
                        unitOptions={property.unit_options?.map(_op => {
                            return {
                                label: _op,
                                value: _op,
                            }
                        })}
                        options={property.options?.map(_op => {
                            return {
                                label: _op.display_name,
                                value: !_op.id ? _op.display_name : String(_op.id),
                                __isNew__: !_op.id
                            }
                        })}
                        cols={property.unit_options?.length > 0 ? ['col-4', 'col-8'] : ['col-3', 'col-9']}
                        onChanged={onChanged}
                    />
                </div>
            </div>
        </div>
    }

    if (property.input_type == ATTRIBUTE_VALUE_TYPE.SINGLE_SELECT) {
        return <div className='col-6' >
            <div className='row' >
                <div className={property.unit_options?.length > 0 ? 'col-9' : 'col-12'} >
                    <Field
                        key={name}
                        name={name}
                        component={ReSelectVertical}
                        placeholder=""
                        label={property.display_name}
                        required={property.is_mandatory == 1}
                        customFeedbackLabel={' '}
                        options={property.options?.map(_op => {
                            return {
                                label: _op.display_name,
                                value: String(_op.id),
                            }
                        })}
                        cols={property.unit_options?.length > 0 ? ['col-4', 'col-8'] : ['col-3', 'col-9']}
                        onChanged={onChanged}
                    />
                </div>
                {
                    property.unit_options?.length > 0 && <div className='col-3' >
                        <Field
                            name={`${name}-unit`}
                            component={ReSelectVertical}
                            placeholder=""
                            label={'ĐV'}
                            required={true}
                            customFeedbackLabel={' '}
                            options={property.unit_options?.map(_op => {
                                return {
                                    label: _op,
                                    value: _op,
                                }
                            })}
                            isClearable={false}
                            onChanged={onChanged}
                        />
                    </div>
                }
            </div>
        </div>
    }
    if (property.input_type == ATTRIBUTE_VALUE_TYPE.MULTIPLE_SELECT)
        return <div className='col-6' >
            <div className='row' >
                <div className={property.unit_options?.length > 0 ? 'col-9' : 'col-12'} >
                    <Field
                        key={name}
                        name={name}
                        component={ReSelectVertical}
                        placeholder=""
                        label={property.display_name}
                        required={property.is_mandatory == 1}
                        isMulti={true}
                        isRequiredMaxOptions={currentChannel?.connector_channel_code === 'tiktok'}
                        customFeedbackLabel={' '}
                        options={property.options?.map(_op => {
                            return {
                                label: _op.display_name,
                                value: String(_op.id),
                            }
                        })}
                        cols={['col-12', 'col-12']}
                        onChanged={onChanged}
                    />
                </div>
                {
                    property.unit_options?.length > 0 && <div className='col-3' >
                        <Field
                            name={`${name}-unit`}
                            component={ReSelectVertical}
                            placeholder=""
                            isRequiredMaxOptions={currentChannel?.connector_channel_code === 'tiktok'}
                            label={'ĐV'}
                            required={true}
                            customFeedbackLabel={' '}
                            options={property.unit_options?.map(_op => {
                                return {
                                    label: _op,
                                    value: _op,
                                }
                            })}
                            isClearable={false}
                            onChanged={onChanged}
                        />
                    </div>
                }
            </div>
        </div>
    if (property.input_type == ATTRIBUTE_VALUE_TYPE.SINGLE_SELECT_CUSTOM_VALUE)
        return <div className='col-6' >
            <div className='row' >
                <div className={property.unit_options?.length > 0 ? 'col-9' : 'col-12'} >
                    <Field
                        key={name}
                        name={name}
                        component={ReSelectVertical}
                        placeholder=""
                        label={property.display_name}
                        required={property.is_mandatory == 1}
                        customFeedbackLabel={' '}
                        options={property.options?.map(_op => {
                            return {
                                label: _op.display_name,
                                value: !_op.id ? _op.display_name : String(_op.id),
                                __isNew__: !_op.id
                            }
                        })}
                        isCreatable={true}
                        cols={['col-12', 'col-12']}
                        onChanged={onChanged}
                    />
                </div>
                {
                    property.unit_options?.length > 0 && <div className='col-3' >
                        <Field
                            name={`${name}-unit`}
                            component={ReSelectVertical}
                            placeholder=""
                            label={'ĐV'}
                            required={true}
                            customFeedbackLabel={' '}
                            options={property.unit_options?.map(_op => {
                                return {
                                    label: _op,
                                    value: _op,
                                }
                            })}
                            isClearable={false}
                            onChanged={onChanged}
                        />
                    </div>
                }
            </div>
        </div>
    if (property.input_type == ATTRIBUTE_VALUE_TYPE.MULTIPLE_SELECT_CUSTOM_VALUE)
        return <div className='col-6' >
            <div className='row' >
                <div className={property.unit_options?.length > 0 ? 'col-9' : 'col-12'} >
                    <Field
                        key={name}
                        name={name}
                        component={ReSelectVertical}
                        placeholder=""
                        label={property.display_name}
                        required={property.is_mandatory == 1}
                        isMulti={true}
                        isRequiredMaxOptions={currentChannel?.connector_channel_code === 'tiktok'}
                        customFeedbackLabel={' '}
                        options={property.options?.map(_op => {
                            return {
                                label: _op.display_name,
                                value: !_op.id ? _op.display_name : String(_op.id),
                                __isNew__: !_op.id
                            }
                        })}
                        isCreatable={true}
                        cols={['col-12', 'col-12']}
                        onChanged={onChanged}
                    />
                </div>
                {
                    property.unit_options?.length > 0 && <div className='col-3' >
                        <Field
                            name={`${name}-unit`}
                            component={ReSelectVertical}
                            placeholder=""
                            label={'ĐV'}
                            isRequiredMaxOptions={currentChannel?.connector_channel_code === 'tiktok'}
                            required={true}
                            customFeedbackLabel={' '}
                            options={property.unit_options?.map(_op => {
                                return {
                                    label: _op,
                                    value: _op,
                                }
                            })}
                            isClearable={false}
                            onChanged={onChanged}
                        />
                    </div>
                }
            </div>
        </div>
    if (property.input_type == ATTRIBUTE_VALUE_TYPE.TEXT)
        return <div className='col-6' >
            <div className='row' >
                <div className={property.unit_options?.length > 0 ? 'col-6' : 'col-12'} >
                    <Field
                        key={name}
                        name={name}
                        component={Input}
                        placeholder=""
                        label={property.display_name}
                        required={property.is_mandatory == 1}
                        customFeedbackLabel={' '}
                        onChanged={onChanged}

                        cols={['col-12', 'col-12']}
                    />
                </div>
                {
                    property.unit_options?.length > 0 && <div className='col-6' >
                        <Field
                            name={`${name}-unit`}
                            component={ReSelectVertical}
                            placeholder=""
                            label={'ĐV'}
                            required={true}
                            customFeedbackLabel={' '}
                            options={property.unit_options?.map(_op => {
                                return {
                                    label: _op,
                                    value: _op,
                                }
                            })}
                            isClearable={false}
                            onChanged={onChanged}
                        />
                    </div>
                }
            </div>
        </div>
    if (property.input_type == ATTRIBUTE_VALUE_TYPE.NUMERIC)
        return <div className='col-6' >
            <div className='row' >
                <div className={property.unit_options?.length > 0 ? 'col-6' : 'col-12'} >
                    <Field
                        key={name}
                        name={name}
                        component={Input}
                        placeholder=""
                        label={property.display_name}
                        required={property.is_mandatory == 1}
                        customFeedbackLabel={' '}
                        type='number'
                        onChanged={onChanged}
                        cols={['col-12', 'col-12']}
                    />
                </div>
                {
                    property.unit_options?.length > 0 && <div className='col-6' >
                        <Field
                            name={`${name}-unit`}
                            component={ReSelectVertical}
                            placeholder=""
                            label={'ĐV'}
                            required={true}
                            customFeedbackLabel={' '}
                            options={property.unit_options?.map(_op => {
                                return {
                                    label: _op,
                                    value: _op,
                                }
                            })}
                            isClearable={false}
                            onChanged={onChanged}
                        />
                    </div>
                }
            </div>
        </div>
    if (property.input_type == ATTRIBUTE_VALUE_TYPE.NUMERIC_FLOAT)
        return <div className='col-6' >
            <div className='row' >
                <div className={property.unit_options?.length > 0 ? 'col-6' : 'col-12'} >
                    <Field
                        key={name}
                        name={name}
                        component={Input}
                        placeholder=""
                        label={property.display_name}
                        required={property.is_mandatory == 1}
                        customFeedbackLabel={' '}
                        type='number'
                        decimalScale={2}
                        cols={['col-12', 'col-12']}
                        onChanged={onChanged}
                    />
                </div>
                {
                    property.unit_options?.length > 0 && <div className='col-6' >
                        <Field
                            name={`${name}-unit`}
                            component={ReSelectVertical}
                            placeholder=""
                            label={'ĐV'}
                            required={true}
                            customFeedbackLabel={' '}
                            options={property.unit_options?.map(_op => {
                                return {
                                    label: _op,
                                    value: _op,
                                }
                            })}
                            onChanged={onChanged}
                            isClearable={false}
                        />
                    </div>
                }
            </div>
        </div>
    if (property.input_type == ATTRIBUTE_VALUE_TYPE.NUMERIC_INT)
        return <div className='col-6' >
            <div className='row' >
                <div className={property.unit_options?.length > 0 ? 'col-6' : 'col-12'} >
                    <Field
                        key={name}
                        name={name}
                        component={Input}
                        placeholder=""
                        label={property.display_name}
                        required={property.is_mandatory == 1}
                        customFeedbackLabel={' '}
                        type='number'
                        decimalScale={0}
                        cols={['col-12', 'col-12']}
                        onChanged={onChanged}
                    />
                </div>
                {
                    property.unit_options?.length > 0 && <div className='col-6' >
                        <Field
                            name={`${name}-unit`}
                            component={ReSelectVertical}
                            placeholder=""
                            label={'ĐV'}
                            required={true}
                            customFeedbackLabel={' '}
                            options={property.unit_options?.map(_op => {
                                return {
                                    label: _op,
                                    value: _op,
                                }
                            })}
                            isClearable={false}
                            onChanged={onChanged}
                        />
                    </div>
                }
            </div>
        </div>
    if (property.input_type == ATTRIBUTE_VALUE_TYPE.DATE)
        return <div className='col-6' >
            <div className='row' >
                <div className={property.unit_options?.length > 0 ? 'col-9' : 'col-12'} >
                    <Field
                        key={name}
                        name={name}
                        component={InputDate}
                        placeholder=""
                        label={property.display_name}
                        required={property.is_mandatory == 1}
                        customFeedbackLabel={' '}
                        cols={['col-12', 'col-12']}
                        onChanged={onChanged}
                    />
                </div>
                {
                    property.unit_options?.length > 0 && <div className='col-3' >
                        <Field
                            name={`${name}-unit`}
                            component={ReSelectVertical}
                            placeholder=""
                            label={'ĐV'}
                            required={true}
                            customFeedbackLabel={' '}
                            options={property.unit_options?.map(_op => {
                                return {
                                    label: _op,
                                    value: _op,
                                }
                            })}
                            isClearable={false}
                            onChanged={onChanged}
                        />
                    </div>
                }
            </div>
        </div>
    if (property.input_type == ATTRIBUTE_VALUE_TYPE.DATE_MONTH)
        return <div className='col-6' >
            <div className='row' >
                <div className={property.unit_options?.length > 0 ? 'col-9' : 'col-12'} >
                    <Field
                        key={name}
                        name={name}
                        component={InputDate}
                        placeholder=""
                        label={property.display_name}
                        required={property.is_mandatory == 1}
                        customFeedbackLabel={' '}
                        cols={['col-12', 'col-12']}
                        dateFormat="MM/yyyy"
                        onChanged={onChanged}
                    />
                </div>
                {
                    property.unit_options?.length > 0 && <div className='col-3' >
                        <Field
                            name={`${name}-unit`}
                            component={ReSelectVertical}
                            placeholder=""
                            label={'ĐV'}
                            required={true}
                            customFeedbackLabel={' '}
                            options={property.unit_options?.map(_op => {
                                return {
                                    label: _op,
                                    value: _op,
                                }
                            })}
                            isClearable={false}
                            onChanged={onChanged}
                        />
                    </div>
                }
            </div>
        </div>
    if (property.input_type == ATTRIBUTE_VALUE_TYPE.TIMESTAMP)
        return <div className='col-6' >
            <div className='row' >
                <div className={property.unit_options?.length > 0 ? 'col-9' : 'col-12'} >
                    <Field
                        key={name}
                        name={name}
                        component={InputDate}
                        placeholder=""
                        label={property.display_name}
                        required={property.is_mandatory == 1}
                        customFeedbackLabel={' '}
                        cols={['col-12', 'col-12']}
                        dateFormat="hh:mm:ss dd/MM/yyyy"
                        showTimeSelect
                        onChanged={onChanged}
                    />
                </div>
                {
                    property.unit_options?.length > 0 && <div className='col-3' >
                        <Field
                            name={`${name}-unit`}
                            component={ReSelectVertical}
                            placeholder=""
                            label={'ĐV'}
                            required={true}
                            customFeedbackLabel={' '}
                            options={property.unit_options?.map(_op => {
                                return {
                                    label: _op,
                                    value: _op,
                                }
                            })}
                            isClearable={false}
                            onChanged={onChanged}
                        />
                    </div>
                }
            </div>
        </div>

})