/*
 * Created by duydatpham@gmail.com on 09/06/2021
 * Copyright (c) 2021 duydatpham@gmail.com
 */
import { useQuery } from '@apollo/client';
import { Field, useFormikContext } from 'formik';
import React, { memo, useMemo, useState } from 'react'
import { Accordion, useAccordionToggle } from 'react-bootstrap'
import { FormattedMessage } from 'react-intl';
import { CardBody, DatePickerField, Input } from '../../../../_metronic/_partials/controls'
import { InputDate } from '../../../../_metronic/_partials/controls/forms/InputDate';
import { ReSelect } from '../../../../_metronic/_partials/controls/forms/ReSelect';
import { ReSelectVertical } from '../../../../_metronic/_partials/controls/forms/ReSelectVertical';
import { ATTRIBUTE_VALUE_TYPE } from '../ProductsUIHelpers'
import { useIntl } from "react-intl";
function CustomToggle({ children, eventKey }) {
    const [isOpen, setIsOpen] = useState(false)
    const decoratedOnClick = useAccordionToggle(eventKey, () => {
        setIsOpen(!isOpen)
    });
   
    return (
        <a className="btn btn-link-success font-weight-bold"
            style={{ color: '#000000D9' }}
            onClick={decoratedOnClick}
        >{children} <i className={isOpen ? 'fas fa-angle-down ml-2' : 'fas fa-angle-right ml-2'} style={{ color: '#000000D9' }} > </i></a>
    );
}

export default memo(({ properties, brand, loading, isShowAll }) => {
    const { values, } = useFormikContext()
    const {formatMessage} = useIntl()
    const propertiesRequires = useMemo(() => {
        if (isShowAll)
            return properties
        return properties.filter(_property => _property.is_mandatory) || [];
    }, [properties, isShowAll])
    const propertiesNotRequires = useMemo(() => {
        if (isShowAll) return []
        return properties.filter(_property => !_property.is_mandatory) || [];
    }, [properties, isShowAll])

    if (loading) {
        return <div className="row" data-sticky-container style={{ justifyContent: 'center', alignItems: 'center' }} >
            <span className="spinner spinner-primary" style={{ marginTop: 20 }} ></span>
        </div>
    }

    return <>
        {
            propertiesRequires.map((_property, index) => {
                let name = `${brand}-property-${_property.id}`

                if (_property.input_type == ATTRIBUTE_VALUE_TYPE.SINGLE_SELECT) {
                    return <div key={name} className='row' >
                        <div className={_property.unit_options?.length > 0 ? 'col-9' : 'col-12'} >
                            <Field
                                key={name}
                                name={name}
                                component={ReSelect}
                                placeholder=""
                                label={_property.display_name}
                                required={_property.is_mandatory == 1}
                                customFeedbackLabel={' '}
                                options={_property.options?.map(_op => {
                                    return {
                                        label: _op.display_name,
                                        value: String(_op.id),
                                    }
                                })}
                                cols={_property.unit_options?.length > 0 ? ['col-4', 'col-8'] : ['col-3', 'col-9']}
                            />
                        </div>
                        {
                            _property.unit_options?.length > 0 && <div className='col-3' >
                                <Field
                                    name={`${name}-unit`}
                                    component={ReSelectVertical}
                                    placeholder=""
                                    label={''}
                                    required={true}
                                    customFeedbackLabel={' '}
                                    options={_property.unit_options?.map(_op => {
                                        return {
                                            label: _op,
                                            value: _op,
                                        }
                                    })}
                                    isClearable={false}
                                />
                            </div>
                        }
                    </div>
                }
                if (_property.input_type == ATTRIBUTE_VALUE_TYPE.MULTIPLE_SELECT)
                    return <div key={name} className='row' >
                        <div className={_property.unit_options?.length > 0 ? 'col-9' : 'col-12'} >
                            <Field
                                key={name}
                                name={name}
                                component={ReSelect}
                                placeholder=""
                                label={_property.display_name}
                                required={_property.is_mandatory == 1}
                                isMulti={true}
                                customFeedbackLabel={' '}
                                options={_property.options?.map(_op => {
                                    return {
                                        label: _op.display_name,
                                        value: String(_op.id),
                                    }
                                })}

                                cols={_property.unit_options?.length > 0 ? ['col-4', 'col-8'] : ['col-3', 'col-9']}
                            />
                        </div>
                        {
                            _property.unit_options?.length > 0 && <div className='col-3' >
                                <Field
                                    name={`${name}-unit`}
                                    component={ReSelectVertical}
                                    placeholder=""
                                    label={''}
                                    required={true}
                                    customFeedbackLabel={' '}
                                    options={_property.unit_options?.map(_op => {
                                        return {
                                            label: _op,
                                            value: _op,
                                        }
                                    })}
                                    isClearable={false}
                                />
                            </div>
                        }
                    </div>
                if (_property.input_type == ATTRIBUTE_VALUE_TYPE.TEXT)
                    return <div key={name} className='row' >
                        <div className={_property.unit_options?.length > 0 ? 'col-9' : 'col-12'} >
                            <Field
                                key={name}
                                name={name}
                                component={Input}
                                placeholder=""
                                label={_property.display_name}
                                required={_property.is_mandatory == 1}
                                customFeedbackLabel={' '}

                                cols={_property.unit_options?.length > 0 ? ['col-4', 'col-8'] : ['col-3', 'col-9']}
                            />
                        </div>
                        {
                            _property.unit_options?.length > 0 && <div className='col-3' >
                                <Field
                                    name={`${name}-unit`}
                                    component={ReSelectVertical}
                                    placeholder=""
                                    label={''}
                                    required={true}
                                    customFeedbackLabel={' '}
                                    options={_property.unit_options?.map(_op => {
                                        return {
                                            label: _op,
                                            value: _op,
                                        }
                                    })}
                                    isClearable={false}
                                />
                            </div>
                        }
                    </div>
                if (_property.input_type == ATTRIBUTE_VALUE_TYPE.NUMERIC)
                    return <div key={name} className='row' >
                        <div className={_property.unit_options?.length > 0 ? 'col-9' : 'col-12'} >
                            <Field
                                key={name}
                                name={name}
                                component={Input}
                                placeholder=""
                                label={_property.display_name}
                                required={_property.is_mandatory == 1}
                                customFeedbackLabel={' '}
                                type='number'

                                cols={_property.unit_options?.length > 0 ? ['col-4', 'col-8'] : ['col-3', 'col-9']}
                            />
                        </div>
                        {
                            _property.unit_options?.length > 0 && <div className='col-3' >
                                <Field
                                    name={`${name}-unit`}
                                    component={ReSelectVertical}
                                    placeholder=""
                                    label={''}
                                    required={true}
                                    customFeedbackLabel={' '}
                                    options={_property.unit_options?.map(_op => {
                                        return {
                                            label: _op,
                                            value: _op,
                                        }
                                    })}
                                    isClearable={false}
                                />
                            </div>
                        }
                    </div>
                if (_property.input_type == ATTRIBUTE_VALUE_TYPE.DATE)
                    return <div key={name} className='row' >
                        <div className={_property.unit_options?.length > 0 ? 'col-9' : 'col-12'} >
                            <Field
                                key={name}
                                name={name}
                                component={InputDate}
                                placeholder=""
                                label={_property.display_name}
                                required={_property.is_mandatory == 1}
                                customFeedbackLabel={' '}

                                cols={_property.unit_options?.length > 0 ? ['col-4', 'col-8'] : ['col-3', 'col-9']}
                            />
                        </div>
                        {
                            _property.unit_options?.length > 0 && <div className='col-3' >
                                <Field
                                    name={`${name}-unit`}
                                    component={ReSelectVertical}
                                    placeholder=""
                                    label={''}
                                    required={true}
                                    customFeedbackLabel={' '}
                                    options={_property.unit_options?.map(_op => {
                                        return {
                                            label: _op,
                                            value: _op,
                                        }
                                    })}
                                    isClearable={false}
                                />
                            </div>
                        }
                    </div>
            })
        }
        {
            propertiesNotRequires.length > 0 && <Accordion >
                <CustomToggle eventKey="0">
                    {formatMessage({defaultMessage:'Thuộc tính mở rộng'})}
                </CustomToggle>
                <Accordion.Collapse eventKey="0">
                    <div className="mt-6" >
                        {
                            propertiesNotRequires.map((_property, index) => {
                                let name = `${brand}-property-${_property.id}`
                                if (_property.input_type == ATTRIBUTE_VALUE_TYPE.SINGLE_SELECT)
                                    return <div key={name} className='row' >
                                        <div className={_property.unit_options?.length > 0 ? 'col-9' : 'col-12'} >
                                            <Field
                                                name={name}
                                                component={ReSelect}
                                                placeholder=""
                                                label={_property.display_name}
                                                required={false}
                                                customFeedbackLabel={' '}
                                                options={_property.options?.map(_op => {
                                                    return {
                                                        label: _op.display_name,
                                                        value: String(_op.id),
                                                    }
                                                })}
                                                cols={_property.unit_options?.length > 0 ? ['col-4', 'col-8'] : ['col-3', 'col-9']}
                                            />
                                        </div>
                                        {
                                            _property.unit_options?.length > 0 && <div className='col-3' >
                                                <Field
                                                    name={`${name}-unit`}
                                                    component={ReSelectVertical}
                                                    placeholder=""
                                                    label={''}
                                                    required={true}
                                                    customFeedbackLabel={' '}
                                                    options={_property.unit_options?.map(_op => {
                                                        return {
                                                            label: _op,
                                                            value: _op,
                                                        }
                                                    })}
                                                    isClearable={false}
                                                />
                                            </div>
                                        }
                                    </div>
                                if (_property.input_type == ATTRIBUTE_VALUE_TYPE.MULTIPLE_SELECT)
                                    return <div key={name} className='row' >
                                        <div className={_property.unit_options?.length > 0 ? 'col-9' : 'col-12'} >
                                            <Field
                                                key={name}
                                                name={name}
                                                component={ReSelect}
                                                placeholder=""
                                                label={_property.display_name}
                                                required={false}
                                                isMulti={true}
                                                customFeedbackLabel={' '}
                                                options={_property.options?.map(_op => {
                                                    return {
                                                        label: _op.display_name,
                                                        value: String(_op.id),
                                                    }
                                                })}

                                                cols={_property.unit_options?.length > 0 ? ['col-4', 'col-8'] : ['col-3', 'col-9']}
                                            />
                                        </div>
                                        {
                                            _property.unit_options?.length > 0 && <div className='col-3' >
                                                <Field
                                                    name={`${name}-unit`}
                                                    component={ReSelectVertical}
                                                    placeholder=""
                                                    label={''}
                                                    required={true}
                                                    customFeedbackLabel={' '}
                                                    options={_property.unit_options?.map(_op => {
                                                        return {
                                                            label: _op,
                                                            value: _op,
                                                        }
                                                    })}
                                                    isClearable={false}
                                                />
                                            </div>
                                        }
                                    </div>
                                if (_property.input_type == ATTRIBUTE_VALUE_TYPE.TEXT)
                                    return <div key={name} className='row' >
                                        <div className={_property.unit_options?.length > 0 ? 'col-9' : 'col-12'} >
                                            <Field
                                                name={name}
                                                component={Input}
                                                placeholder=""
                                                label={_property.display_name}
                                                required={false}
                                                customFeedbackLabel={' '}

                                                cols={_property.unit_options?.length > 0 ? ['col-4', 'col-8'] : ['col-3', 'col-9']}
                                            />
                                        </div>
                                        {
                                            _property.unit_options?.length > 0 && <div className='col-3' >
                                                <Field
                                                    name={`${name}-unit`}
                                                    component={ReSelectVertical}
                                                    placeholder=""
                                                    label={''}
                                                    required={true}
                                                    customFeedbackLabel={' '}
                                                    options={_property.unit_options?.map(_op => {
                                                        return {
                                                            label: _op,
                                                            value: _op,
                                                        }
                                                    })}
                                                    isClearable={false}
                                                />
                                            </div>
                                        }
                                    </div>
                                if (_property.input_type == ATTRIBUTE_VALUE_TYPE.NUMERIC)
                                    return <div key={name} className='row' >
                                        <div className={_property.unit_options?.length > 0 ? 'col-9' : 'col-12'} >
                                            <Field
                                                name={name}
                                                component={Input}
                                                placeholder=""
                                                label={_property.display_name}
                                                required={false}
                                                customFeedbackLabel={' '}
                                                type='number'

                                                cols={_property.unit_options?.length > 0 ? ['col-4', 'col-8'] : ['col-3', 'col-9']}
                                            />
                                        </div>
                                        {
                                            _property.unit_options?.length > 0 && <div className='col-3' >
                                                <Field
                                                    name={`${name}-unit`}
                                                    component={ReSelectVertical}
                                                    placeholder=""
                                                    label={''}
                                                    required={true}
                                                    customFeedbackLabel={' '}
                                                    options={_property.unit_options?.map(_op => {
                                                        return {
                                                            label: _op,
                                                            value: _op,
                                                        }
                                                    })}
                                                    isClearable={false}
                                                />
                                            </div>
                                        }
                                    </div>
                                if (_property.input_type == ATTRIBUTE_VALUE_TYPE.DATE)
                                    return <div key={name} className='row' >
                                        <div className={_property.unit_options?.length > 0 ? 'col-9' : 'col-12'} >
                                            <Field
                                                name={name}
                                                component={Input}
                                                placeholder=""
                                                label={_property.display_name}
                                                required={false}
                                                customFeedbackLabel={' '}
                                                type='date'

                                                cols={_property.unit_options?.length > 0 ? ['col-4', 'col-8'] : ['col-3', 'col-9']}
                                            />
                                        </div>
                                        {
                                            _property.unit_options?.length > 0 && <div className='col-3' >
                                                <Field
                                                    name={`${name}-unit`}
                                                    component={ReSelectVertical}
                                                    placeholder=""
                                                    label={''}
                                                    required={true}
                                                    customFeedbackLabel={' '}
                                                    options={_property.unit_options?.map(_op => {
                                                        return {
                                                            label: _op,
                                                            value: _op,
                                                        }
                                                    })}
                                                    isClearable={false}
                                                />
                                            </div>
                                        }
                                    </div>
                            })
                        }
                    </div>
                </Accordion.Collapse>
            </Accordion>
        }
    </>
})