import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useField, useFormikContext } from "formik";
import { FieldFeedbackLabel } from "./FieldFeedbackLabel";
import NumberFormat from 'react-number-format';
import Select, { components } from 'react-select'
import CreatableSelect from 'react-select/creatable';
import { useIntl } from "react-intl";

const Menu = props => {
    const shadow = 'hsla(218, 50%, 10%, 0.1)';
    return (
        <div
            style={{
                backgroundColor: 'white',
                borderRadius: 4,
                boxShadow: `0 0 0 1px ${shadow}, 0 4px 11px ${shadow}`,
                marginTop: 8,
                position: 'absolute',
                zIndex: 2,
                width: '100%'
            }}
            {...props}
        />
    );
};

const Svg = p => (
    <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        focusable="false"
        role="presentation"
        {...p}
    />
);

const DropdownIndicator = () => (
    <div style={{ color: '#2684FF', height: 24, width: 32 }}>
        <Svg>
            <path
                d="M16.436 15.085l3.94 4.01a1 1 0 0 1-1.425 1.402l-3.938-4.006a7.5 7.5 0 1 1 1.423-1.406zM10.5 16a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11z"
                fill="currentColor"
                fillRule="evenodd"
            />
        </Svg>
    </div>
);

const Blanket = props => (
    <div
        style={{
            bottom: 0,
            left: 0,
            top: 0,
            right: 0,
            position: 'fixed',
            zIndex: 1,
        }}
        {...props}
    />
);

const Dropdown = ({ children, isOpen, target, onClose }) => {
    return (
        <div style={{ position: 'relative' }}>
            {target}
            {isOpen ? <Menu>{children}</Menu> : null}
            {isOpen ? <Blanket onClick={onClose} /> : null}
        </div>
    )
};

export function ReSelectUnit({
    field,
    form: { touched, errors, submitCount },
    label,
    withFeedbackLabel = true,
    type = "text",
    customFeedbackLabel,
    unitOptions,
    children,
    options = [],
    required = false,
    cols = ['col-3', 'col-9'],
    isClearable = true,
    isCreatable = false,
    onChanged = null,
    ...props
}) {
    const [isOpen, setIsOpen] = useState(false)
    const [valueCreate, setValueCreate] = useState({});
    const {formatMessage} = useIntl()
    const _toggleOpen = () => {
        setIsOpen(prev => !prev)

        setValueCreate({})
    };

    const _refSubmitCount = useRef(submitCount)
    const { setFieldValue, setFieldTouched, values } = useFormikContext();

    // let isTouched = submitCount != _refSubmitCount.current || touched[field.name]
    let placeholders = useMemo(() => {
        if (!!label) {
            return {
                placeholder: `${formatMessage({defaultMessage:'Chọn'})} ${label.toLowerCase()}`
            }
        }
        return {}
    }, [label])

    useEffect(() => {
        if (isOpen) {
            setValueCreate({})
        }
    }, [isOpen])

    const Container = isCreatable ? CreatableSelect : Select;

    return (
        <div className="form-group">
            {label && <label className={`col-form-label`}>{label}{!!required && <span className='text-danger' > *</span>}</label>}
            <Dropdown
                isOpen={isOpen}
                onClose={_toggleOpen}
                target={
                    <div className="input-icon input-icon-right" style={{
                        height: 36, cursor: 'pointer',
                        background: 'rgb(247, 247, 250)',
                        borderRadius: 4,
                        display: 'flex',
                        flexDirection: 'row'
                    }}>
                        {
                            props.isMulti && field?.value?.map((_vv, _idx) => {
                                return <div key={`_idx_idx-${_idx}`} class="css-1rhbuit-multiValue" style={{ margin: 4, alignItems: 'center' }} >
                                    <div class="css-12jo7m5">{_vv.label}</div>
                                    <div class="css-xb97g8" onClick={e => {
                                        let newValues = [...field?.value]
                                        newValues.splice(_idx, 1)
                                        setFieldValue(field.name, newValues || undefined);
                                        setValueCreate({});
                                        !!onChanged && onChanged(newValues || undefined)
                                    }} >
                                        <svg height="14" width="14" viewBox="0 0 20 20" aria-hidden="true" focusable="false" class="css-6q0nyr-Svg"><path d="M14.348 14.849c-0.469 0.469-1.229 0.469-1.697 0l-2.651-3.030-2.651 3.029c-0.469 0.469-1.229 0.469-1.697 0-0.469-0.469-0.469-1.229 0-1.697l2.758-3.15-2.759-3.152c-0.469-0.469-0.469-1.228 0-1.697s1.228-0.469 1.697 0l2.652 3.031 2.651-3.031c0.469-0.469 1.228-0.469 1.697 0s0.469 1.229 0 1.697l-2.758 3.152 2.758 3.15c0.469 0.469 0.469 1.229 0 1.698z"></path></svg>
                                    </div>
                                </div>
                            })
                        }
                        <input
                            type="text"
                            className={`form-control`}
                            placeholder={placeholders?.placeholder || ''}
                            style={{
                                background: 'transparent', border: 'none', cursor: 'pointer',
                                flex: 1
                            }}
                            value={`${field?.value?.label || ''}`}
                            onFocus={_toggleOpen}
                            onChange={() => { }}
                            // style={{ background: '#F7F7FA', border: errors[field.name] && isTouched ? '1px solid #F5222D' : 'none' }}
                            autoComplete='off'
                        />
                        <span><i class="fas fa-angle-down icon-md"></i></span>
                    </div>
                }
            >
                <Container
                    options={options}
                    components={{
                        DropdownIndicator,
                        // Menu: MenuCustom,
                        IndicatorSeparator: null
                    }}
                    isFocused={false}
                    controlShouldRenderValue={false}
                    hideSelectedOptions={false}
                    backspaceRemovesValue={false}
                    menuIsOpen={true}
                    openMenuOnFocus={false}
                    openMenuOnClick
                    {...field}
                    {...props}
                    onChange={value => {
                        _toggleOpen();
                        setFieldValue(field.name, value || undefined);
                        setValueCreate({});
                        !!onChanged && onChanged(value || undefined)
                    }}
                    styles={{
                        control: provided => ({ ...provided, minWidth: 240, margin: 8, borderColor: '#D9D9D9' }),
                        menu: () => ({ boxShadow: 'inset 0 1px 0 rgba(0, 0, 0, 0.1)' }),
                    }}
                    onBlur={() => {
                        setFieldTouched(field.name, true)
                    }}
                    isClearable={isClearable}
                    {...placeholders}
                    formatCreateLabel={(inputValue) => `${formatMessage({defaultMessage:'Tạo mới'})}: "${inputValue}"`}
                />
                <div
                    className="d-flex px-2 py-4 align-items-center justify-content-between"
                    style={{ border: '1px solid rgba(0, 0, 0, 0.1)' }}
                >
                    <div
                        style={{ width: '45%' }}
                    >
                        <NumberFormat
                            className={`form-control `}
                            placeholder={formatMessage({defaultMessage:'Tạo mới thuộc tính'})}
                            value={valueCreate?.name}
                            thousandSeparator={true}
                            decimalScale={2}
                            allowNegative={false}
                            onChange={e => { }}
                            onValueChange={value => {
                                setValueCreate(prev => ({
                                    ...prev,
                                    name: value?.value
                                }))
                            }}
                        />
                        {/* <input
                            type="text"
                            className={`form-control `}
                            placeholder={'Tạo mới thuộc tính'}
                            value={valueCreate?.name}
                            onChange={(e) => {
                                let value = e?.target?.value;
                                setValueCreate(prev => ({
                                    ...prev,
                                    name: value
                                }))
                            }}
                        /> */}
                    </div>
                    <div style={{ width: '30%' }}>
                        <Select
                            placeholder={formatMessage({defaultMessage:"Đơn vị"})}
                            value={valueCreate?.unit || undefined}
                            onChange={(value) => {
                                setValueCreate(prev => ({
                                    ...prev,
                                    unit: value
                                }))
                            }}
                            options={unitOptions}
                        />
                    </div>
                    <i
                        class="fas fa-check"
                        style={{ color: (valueCreate?.name == undefined || valueCreate?.name == null || valueCreate?.name?.trim().length == 0 || !valueCreate?.unit) ? 'gray' : '#59b92e', cursor: 'pointer' }}
                        onClick={() => {
                            if (valueCreate?.name == undefined || valueCreate?.name == null || valueCreate?.name?.trim().length == 0 || !valueCreate?.unit) {
                                return
                            }
                            _toggleOpen();
                            let _new = `${valueCreate?.name || ''}${valueCreate?.unit?.label}`
                            let parseValue = null;

                            if (props.isMulti) {
                                parseValue = (field?.value || []).concat([{
                                    __isNew__: true,
                                    value: _new,
                                    label: _new,
                                    raw_v: valueCreate?.name,
                                    raw_u: valueCreate?.unit?.label
                                }])
                            } else {
                                parseValue = {
                                    __isNew__: true,
                                    value: _new,
                                    label: _new,
                                    raw_v: valueCreate?.name,
                                    raw_u: valueCreate?.unit?.label
                                }
                            }

                            setValueCreate({})
                            setFieldValue(field.name, parseValue || undefined)
                        }}
                    />
                    <i
                        class="fas fa-times"
                        style={{ color: '#db2d2d', cursor: 'pointer' }}
                        onClick={() => {
                            console.log(`CHECK VALUE CREATE::::::`, valueCreate);
                            _toggleOpen();
                            setValueCreate({})
                        }}
                    />
                </div>
            </Dropdown>
        </div>
    );
}
