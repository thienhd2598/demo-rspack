import React, { Fragment, memo, useCallback, useEffect, useMemo, useState } from "react";
import { Accordion, OverlayTrigger, Tooltip, useAccordionToggle } from "react-bootstrap";
import { SketchPicker } from "react-color";
import CopyToClipboard from "react-copy-to-clipboard";
import { useIntl } from "react-intl";
import { toAbsoluteUrl } from "../../../../../_metronic/_helpers";
import { useToasts } from "react-toast-notifications";
import { debounce, range } from "lodash";
import Select from 'react-select';

const CustomToggle = ({ children, eventKey }) => {
    const [show, setShow] = useState(false);

    const decoratedOnClick = useAccordionToggle(eventKey, () => {
        setShow(prev => !prev);
    });

    return (
        <div onClick={decoratedOnClick}>
            {children}
        </div>
    );
};

const ToolTextWidget = ({ itemSelected, updateCurrentStageData }) => {
    const { formatMessage } = useIntl();
    const [fonts, setFonts] = useState([]);    

    const optionsFontSize = Array.from({ length: 143 }).map((_size, index) => ({
        value: index + 1,
        label: `${index + 1}px`
    }));

    const optionsFontStyle = ['normal', 'italic', 'bold', 'italic bold'].map(item => ({
        value: item, label: item
    }));

    const optionsFontFamily = [
        "'Montserrat', sans-serif",        
        "'Roboto Slab', serif",
        "'Roboto Mono', monospace",
        "'Open Sans', sans-serif",
        "'Nunito', sans-serif",
        "'Noto Serif', serif",
        "'Playfair Display', serif",
        "'Lobster', cursive",
        "'Dancing Script', cursive",
        "'Patrick Hand', cursive",
        "'Itim', cursive",
        "'Saira', sans-serif",
        "SVN-Gotham",
        "ShopeeDisplay-Black",
        "ShopeeDisplay-ExtraBold",
        "ShopeeDisplay-Light",
        "ShopeeDisplay-Bold",
        "ShopeeDisplay-Medium",
        "ShopeeDisplay-Regular",
        "SF-Pro Medium",
        "SF-Pro Black",
        "SF-Pro Bold",
        "SF-Pro Heavy",
        "SF-Pro Regular",
        "SF-Pro Thin",
        "SF-Pro Ultralight",
        "Montserrat-Black",
        "Montserrat-Bold",
        "Montserrat-Thin",
        "Montserrat-Medium",
        "Montserrat-Regular",
        "Montserrat-BoldItalic",
        "Montserrat-SemiBoldItalic",
        "Montserrat-ExtraLightItalic",
    ].map(item => ({
        value: item, label: item
    }));

    const currentFontSize = useMemo(() => {
        const findedFontSize = optionsFontSize?.find(item => item?.value == Number(itemSelected?.attrs?.fontSize))
        return findedFontSize;
    }, [optionsFontSize, itemSelected?.attrs?.fontSize]);

    const currentFontStyle = useMemo(() => {
        const findedFontStyle = optionsFontStyle?.find(item => item?.value == itemSelected?.attrs?.fontStyle) || optionsFontStyle[0]
        return findedFontStyle;
    }, [optionsFontStyle, itemSelected?.attrs?.fontStyle]);

    const currentFontFamily = useMemo(() => {
        const findedFontFamily = optionsFontFamily?.find(item => item?.value == itemSelected?.attrs?.fontFamily) || optionsFontFamily[0]
        return findedFontFamily;
    }, [optionsFontFamily, itemSelected?.attrs?.fontFamily]);

    return (
        <Fragment>            
            <div className='row mb-4'>
                <div className='col-3 text-right d-flex align-items-center justify-content-end'>
                    <span>{formatMessage({ defaultMessage: 'Căn ngang' })}</span>
                </div>
                <div className='d-flex align-items-center ml-4'>
                    <OverlayTrigger
                        overlay={
                            <Tooltip>
                                {formatMessage({ defaultMessage: 'Căn trái' })}
                            </Tooltip>
                        }
                    >
                        <div
                            className='p-4 cursor-pointer'
                            style={{ background: '#edeef7', border: '1px solid #e9e9e9', borderRadius: 8 }}
                            onClick={() => {
                                updateCurrentStageData(itemSelected?.id, {
                                    align: 'left',
                                    updated_at: Date.now()
                                })
                            }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-text-left" viewBox="0 0 16 16">
                                <path fill-rule="evenodd" d="M2 12.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5m0-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5m0-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5m0-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5" />
                            </svg>
                        </div>
                    </OverlayTrigger>
                    <OverlayTrigger
                        overlay={
                            <Tooltip>
                                {formatMessage({ defaultMessage: 'Căn giữa' })}
                            </Tooltip>
                        }
                    >
                        <div
                            className='p-4 ml-4 cursor-pointer'
                            style={{ background: '#edeef7', border: '1px solid #e9e9e9', borderRadius: 8 }}
                            onClick={() => {
                                updateCurrentStageData(itemSelected?.id, {
                                    align: 'center',
                                    updated_at: Date.now()
                                })
                            }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-text-center" viewBox="0 0 16 16">
                                <path fill-rule="evenodd" d="M4 12.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5m-2-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5m2-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5m-2-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5" />
                            </svg>
                        </div>
                    </OverlayTrigger>
                    <OverlayTrigger
                        overlay={
                            <Tooltip>
                                {formatMessage({ defaultMessage: 'Căn phải' })}
                            </Tooltip>
                        }
                    >
                        <div
                            className='p-4 ml-4 cursor-pointer'
                            style={{ background: '#edeef7', border: '1px solid #e9e9e9', borderRadius: 8 }}
                            onClick={() => {
                                updateCurrentStageData(itemSelected?.id, {
                                    align: 'right',
                                    updated_at: Date.now()
                                })
                            }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-text-right" viewBox="0 0 16 16">
                                <path fill-rule="evenodd" d="M6 12.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5m-4-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5m4-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5m-4-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5" />
                            </svg>
                        </div>
                    </OverlayTrigger>
                </div>
            </div>
            <div className="row mb-4">
                <div className='col-3 text-right'>
                    <span>{formatMessage({ defaultMessage: 'Stroke' })}</span>
                </div>
                <div className="col-9">
                    <Accordion key="text-tool-widget">
                        <div className="d-flex flex-column">
                            <div className="d-flex align-items-center mb-4">
                                <CustomToggle eventKey="text-tool-widget">
                                    <OverlayTrigger
                                        overlay={
                                            <Tooltip>
                                                Mã màu: {itemSelected?.attrs?.stroke || 'Transparent'}
                                            </Tooltip>
                                        }
                                    >
                                        <div
                                            className="mr-4 cursor-pointer"
                                            style={{ backgroundColor: itemSelected?.attrs?.stroke, width: 40, height: 40, border: '1px solid #e9e9e9', borderRadius: 8 }}
                                        />
                                    </OverlayTrigger>
                                </CustomToggle>
                                <OverlayTrigger
                                    overlay={
                                        <Tooltip>
                                            {formatMessage({ defaultMessage: 'Xóa nền' })}
                                        </Tooltip>
                                    }
                                >
                                    <svg
                                        className="text-danger cursor-pointer bi bi-trash"
                                        style={{ fontSize: 20 }}
                                        width="16" height="16" fill="currentColor"
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 16 16"
                                        onClick={(color) => {
                                            updateCurrentStageData(itemSelected?.id, {
                                                stroke: 'transparent'
                                            })
                                        }}
                                    >
                                        <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z" />
                                        <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z" />
                                    </svg>
                                </OverlayTrigger>
                            </div>
                            <Accordion.Collapse eventKey="text-tool-widget">
                                <SketchPicker
                                    className="sketch-color"
                                    color={itemSelected?.attrs?.stroke}
                                    onChange={(color) => {
                                        updateCurrentStageData(itemSelected?.id, {
                                            stroke: color.hex
                                        })
                                    }}
                                />
                            </Accordion.Collapse>
                        </div>
                    </Accordion>
                </div>
            </div>
            <div className="row mb-4">
                <div className="col-3 text-right d-flex align-items-center justify-content-end">
                    Font family
                </div>
                <div className="col-6">
                    <Select
                        className="w-100 select-report-custom"
                        options={optionsFontFamily}
                        value={currentFontFamily}
                        styles={{
                            container: (styles) => ({
                                ...styles,
                                zIndex: 99
                            }),
                        }}
                        onChange={({ value }) => {
                            updateCurrentStageData(itemSelected?.id, {
                                fontFamily: value
                            })
                        }}
                    />
                </div>
            </div>
            <div className="row mb-4">
                <div className="col-3 text-right d-flex align-items-center justify-content-end">
                    Font size
                </div>
                <div className="col-6">
                    <Select
                        className="w-100 select-report-custom"
                        options={optionsFontSize}
                        value={currentFontSize}
                        styles={{
                            container: (styles) => ({
                                ...styles,
                                zIndex: 98
                            }),
                        }}
                        onChange={({ value }) => {
                            updateCurrentStageData(itemSelected?.id, {
                                fontSize: value
                            })
                        }}
                    />
                </div>
            </div>
            <div className="row mb-4">
                <div className="col-3 text-right d-flex align-items-center justify-content-end">
                    Font style
                </div>
                <div className="col-6">
                    <Select
                        className="w-100 select-report-custom"
                        options={optionsFontStyle}
                        value={currentFontStyle}
                        onChange={({ value }) => {
                            updateCurrentStageData(itemSelected?.id, {
                                fontStyle: value
                            })
                        }}
                    />
                </div>
            </div>
        </Fragment>
    )
}

export default memo(ToolTextWidget);