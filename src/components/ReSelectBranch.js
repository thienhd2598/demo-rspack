
/*
 * Created by duydatpham@gmail.com on 21/07/2021
 * Copyright (c) 2021 duydatpham@gmail.com
 */
import React, { useMemo, useRef, useState } from "react";
import { useField, useFormikContext } from "formik";

import Select from 'react-select'
import { Button } from "react-bootstrap";
import { FieldFeedbackLabel } from "../_metronic/_partials/controls";

import AsyncPaginate from 'react-select-async-paginate';
import { createApolloClientSSR } from "../apollo";
import op_brands from "../graphql/op_brands";
import { useIntl } from "react-intl";
let client = createApolloClientSSR()

async function loadOptions(search, loadedOptions, { page }, { connector_channel_code, sc_category_id, }) {
    let { data } = await client.query({
        query: op_brands,
        variables: {
            q: search,
            page,
            connector_channel_code, sc_category_id
        }
    })    
    return {
        options: data?.sc_sale_channel_brands?.filter(_brand => loadedOptions.every(_op => _op.value != _brand.id)).map(_brand => {
            return {
                value: _brand.id,
                label: _brand.display_name,
                raw: _brand
            }
        }),
        hasMore: data?.sc_sale_channel_brands?.length == 20,
        additional: {
            page: page + 1,
        },
    };
}

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
const Dropdown = ({ children, isOpen, target, onClose }) => (
    <div style={{ position: 'relative' }}>
        {target}
        {isOpen ? <Menu>{children}</Menu> : null}
        {isOpen ? <Blanket onClick={onClose} /> : null}
    </div>
);
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
const selectStyles = {
    control: provided => ({ ...provided, minWidth: 240, margin: 8, borderColor: '#D9D9D9' }),
    menu: () => ({ boxShadow: 'inset 0 1px 0 rgba(0, 0, 0, 0.1)' }),
};

export function ReSelectBranch({
    field,
    form: { touched, errors, submitCount },
    label,
    withFeedbackLabel = true,
    type = "text",
    customFeedbackLabel,
    children,
    options = [],
    required = false,
    cols = ['col-3', 'col-9'],
    connector_channel_code,
    sc_category_id,
    onChange,
    ...props
}) {
    const [isOpen, setIsOpen] = useState(false)
    const _refSubmitCount = useRef(submitCount)
    const { setFieldValue, setFieldTouched } = useFormikContext();
    const {formatMessage} = useIntl()
    let isTouched = submitCount != _refSubmitCount.current || touched[field.name]
    let placeholders = useMemo(() => {
        if (!!label) {
            return {
                placeholder: `Chọn ${label.toLowerCase()}`
            }
        }
        return {}
    }, [label])

    const _toggleOpen = () => {
        setIsOpen(prev => !prev)
    };
    return (
        <div className="form-group row" style={{ zIndex: 99 }} >
            {label && <label className={`${cols[0]} col-form-label`}>{label}{!!required && <span className='text-danger' > *</span>}</label>}
            <div className={cols[1]}>
                <Dropdown
                    isOpen={isOpen}
                    onClose={_toggleOpen}
                    target={
                        <input type="text" className={`form-control `} placeholder={placeholders.placeholder}
                            // onClick={(e) => {
                            //     e.preventDefault();
                            //     onClick(e);
                            // }}
                            value={field?.value?.label || ''}
                            onFocus={_toggleOpen}
                            onChange={() => { }}
                            style={{ background: '#F7F7FA', border: errors[field.name] && isTouched ? '1px solid #F5222D' : 'none' }}
                            autoComplete='off'
                        />
                    }
                >
                    <AsyncPaginate
                        {...field}
                        {...props}
                        autoFocus
                        backspaceRemovesValue={false}
                        components={{ DropdownIndicator, IndicatorSeparator: null }}
                        controlShouldRenderValue={false}
                        hideSelectedOptions={false}
                        isClearable={false}
                        menuIsOpen={true}
                        styles={selectStyles}
                        tabSelectsValue={false}
                        onChange={value => {
                            _toggleOpen()
                            setFieldValue(field.name, value || undefined)
                            setFieldValue('__changed__', true)
                            !!onChange && onChange(value)
                        }}
                        loadOptions={async (inputValue, prevOptions, additional) => loadOptions(inputValue, prevOptions, additional, { connector_channel_code, sc_category_id, })}
                        // options={options}
                        // styles={{
                        //     control: (styles) => ({
                        //         ...styles,
                        //         ...(errors[field.name] && isTouched ? { borderColor: '#f14336' } : { border: 'none' }),
                        //         backgroundColor: '#F7F7FA'
                        //     })
                        // }}
                        onBlur={() => {
                            setFieldTouched(field.name, true)
                        }}
                        openMenuOnFocus
                        openMenuOnClick
                        // isClearable
                        placeholder={formatMessage({defaultMessage:'Nhập tên thương hiệu'})}
                        additional={{
                            page: 1,
                        }}
                        debounceTimeout={300}
                    />
                </Dropdown>
                {withFeedbackLabel && (
                    <FieldFeedbackLabel
                        error={errors[field.name]}
                        touched={isTouched}
                        label={label}
                        customFeedbackLabel={customFeedbackLabel}
                    />
                )}
            </div>
        </div>
    );
}
