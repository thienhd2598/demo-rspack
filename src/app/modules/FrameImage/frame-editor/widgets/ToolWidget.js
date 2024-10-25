import { Slider } from '@material-ui/core';
import clsx from "clsx";
import React, { memo, useCallback, useMemo, useState } from "react";
import { Accordion, OverlayTrigger, Tooltip, useAccordionToggle } from "react-bootstrap";
import { SketchPicker } from "react-color";
import { useIntl } from "react-intl";
import { Card, CardBody } from "../../../../../_metronic/_partials/controls";
import { useFrameEditorContext } from "../FrameEditorContext";
import ColorPicker, { useColorPicker } from 'react-best-gradient-color-picker'
import ToolTextWidget from './ToolTextWidget';
import { debounce } from 'lodash';

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

const ToolWidget = ({ selectedItems, frameWidth }) => {
    const { currentStageData, updateCurrentStageData } = useFrameEditorContext();
    const { formatMessage } = useIntl();
    const [valueOpacity, setValueOpacity] = useState(100);
    const [currentTabIdxElm, setCurrentTabIdxElm] = useState(0);
    const [color, setColor] = useState('linear-gradient(90deg, rgba(96,93,93,1) 0%, rgba(255,255,255,1) 100%)');
    const { setR, setG, setB, setA, rgbaArr } = useColorPicker(color, setColor);
    const [text, setText] = useState('');

    const itemSelected = useMemo(() => {
        const findedStageFrame = currentStageData?.find(item => item?.attrs?.['data-item-type'] == 'frame');
        if (!selectedItems) return findedStageFrame;

        const idItemSelected = selectedItems?.id();
        const findedCurrentStage = currentStageData?.find(item => item?.id == idItemSelected);

        return findedCurrentStage;
    }, [selectedItems, currentStageData]);

    useMemo(() => {
        setText(itemSelected?.attrs?.text || '')
    }, [itemSelected?.attrs?.text]);

    const debounceChangeText = useCallback(debounce((value) => {
        updateCurrentStageData(itemSelected?.id, {
            text: value
        })
    }, 300), [itemSelected]);

    useMemo(() => {
        if (itemSelected?.attrs?.[`data-item-type`] != 'icon') setCurrentTabIdxElm(0);
        setValueOpacity(itemSelected?.attrs?.opacity ? itemSelected?.attrs?.opacity * 100 : 100);
    }, [itemSelected]);

    const allColors = useMemo(() => {
        if (!itemSelected?.attrs?.src || itemSelected?.attrs?.[`data-item-type`] != 'icon') return [];

        const parser = new DOMParser();
        const doc = parser.parseFromString(itemSelected?.attrs?.src, 'image/svg+xml');
        const elements = [
            ...doc.querySelectorAll('rect'),
            ...doc.querySelectorAll('circle'),
            ...doc.querySelectorAll('ellipse'),
            ...doc.querySelectorAll('line'),
            ...doc.querySelectorAll('polyline'),
            ...doc.querySelectorAll('polygon'),
            ...doc.querySelectorAll('path'),
        ];

        const uniqueColors = [];
        elements.forEach(rect => {
            const fill = rect.getAttribute('fill');
            if (fill) {
                uniqueColors.push(fill);
            }
        });

        return uniqueColors
    }, [itemSelected?.attrs?.src]);


    console.log(`CHECK COLOR: `, color, itemSelected?.attrs?.fill);

    return (
        <Card>
            <CardBody>
                {itemSelected?.attrs?.[`data-item-type`] == 'text' && <div className="row mb-4">
                    <div className='col-3 text-right'>
                        <span>{formatMessage({ defaultMessage: 'Nội dung' })}</span>
                    </div>
                    <div className="col-9 form-group">
                        <div className='w-100' style={{ position: 'relative' }}>
                            <textarea
                                className="form-control"
                                rows={3}
                                value={text}
                                onChange={e => {
                                    setText(e.target.value);
                                    debounceChangeText(e.target.value);
                                }}
                                style={{ background: '#F7F7FA', borderRadius: 6 }}
                            />
                            <span className="" style={{ position: 'absolute', right: 0, bottom: -22, color: 'rgba(0,0,0, 0.45)' }}>
                                {`${(itemSelected?.attrs?.text || '').length}/${100}`}
                            </span>
                        </div>
                    </div>
                </div>}
                {(itemSelected?.attrs?.[`data-item-type`] != 'icon' || allColors?.length == 0) && <div className='row mb-4'>
                    <div className='col-3 text-right'>
                        <span>{formatMessage({ defaultMessage: 'Màu sắc' })}</span>
                    </div>
                    <div className="col-9">
                        <Accordion key="tool-widget">
                            <div className="d-flex flex-column">
                                <div className="d-flex align-items-center mb-4">
                                    <CustomToggle eventKey="tool-widget">
                                        <OverlayTrigger
                                            overlay={
                                                <Tooltip>
                                                    Mã màu: {itemSelected?.attrs?.fill || 'Transparent'}
                                                </Tooltip>
                                            }
                                        >
                                            <div
                                                className="mr-4 cursor-pointer"
                                                style={{ backgroundColor: itemSelected?.attrs?.fill, width: 40, height: 40, border: '1px solid #e9e9e9', borderRadius: 8 }}
                                            />
                                        </OverlayTrigger>
                                    </CustomToggle>
                                    <OverlayTrigger
                                        overlay={
                                            <Tooltip>
                                                {formatMessage({ defaultMessage: 'Xóa ảnh nền' })}
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
                                                    fill: 'transparent'
                                                })
                                            }}
                                        >
                                            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z" />
                                            <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z" />
                                        </svg>
                                    </OverlayTrigger>
                                </div>
                                <Accordion.Collapse eventKey="tool-widget">
                                    <ColorPicker
                                        className="w-100"
                                        value={(itemSelected?.attrs?.fill == 'transparent' || !itemSelected?.attrs?.fill) ? 'rgb(255, 255, 255)' : itemSelected?.attrs?.fill}
                                        hideColorTypeBtns
                                        onChange={(color) => {
                                            console.log(`THIEN CHECK: `, color)
                                            updateCurrentStageData(itemSelected?.id, {
                                                fill: color
                                            })
                                        }}
                                        hideAdvancedSliders={true}
                                    />
                                    {/* <SketchPicker
                                        className="sketch-color"
                                        color={itemSelected?.attrs?.fill}
                                        onChange={(color) => {
                                            updateCurrentStageData(itemSelected?.id, {
                                                fill: color.hex
                                            })
                                        }}
                                    /> */}
                                </Accordion.Collapse>
                            </div>
                        </Accordion>
                    </div>
                </div>}

                {itemSelected?.attrs?.[`data-item-type`] == 'icon' && allColors?.length > 0 && <div className='row mb-4'>
                    <div className='col-3 text-right'>
                        <span>{formatMessage({ defaultMessage: 'Màu sắc' })}</span>
                    </div>
                    <div className="col-9">
                        <div className="d-flex flex-column">
                            <ul className="nav nav-tabs-custom nav-tabs-line mb-4 fs-6 w-100">
                                {allColors?.map((tab, index) => (
                                    <li
                                        className="nav-item"
                                        key={`icon-tab-${tab?.index}`}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setCurrentTabIdxElm(index);
                                        }}
                                    >
                                        <a
                                            className={clsx('nav-link', { active: currentTabIdxElm === index })}
                                            data-bs-toggle="tab"
                                            href=""
                                        >
                                            {`Thành phần ${index + 1}`}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                            <div className="d-flex flex-column">
                                <div className="d-flex align-items-center mb-4">
                                    <OverlayTrigger
                                        overlay={
                                            <Tooltip>
                                                Mã màu: {allColors[currentTabIdxElm] || 'Transparent'}
                                            </Tooltip>
                                        }
                                    >
                                        <div
                                            className="mr-4"
                                            style={{ backgroundColor: allColors[currentTabIdxElm], width: 40, height: 40, border: '1px solid #e9e9e9', borderRadius: 8 }}
                                        />
                                    </OverlayTrigger>
                                    <OverlayTrigger
                                        overlay={
                                            <Tooltip>
                                                {formatMessage({ defaultMessage: 'Xóa ảnh nền' })}
                                            </Tooltip>
                                        }
                                    >
                                        <svg
                                            className="text-danger cursor-pointer bi bi-trash"
                                            style={{ fontSize: 20 }}
                                            width="16" height="16" fill="currentColor"
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 16 16"
                                            onClick={() => {
                                                const newSvgCode = itemSelected?.attrs?.src?.replaceAll(
                                                    allColors[currentTabIdxElm],
                                                    `transparent`
                                                );
                                                updateCurrentStageData(itemSelected?.id, {
                                                    src: newSvgCode,
                                                    // fill: 'transparent'
                                                })
                                            }}
                                        >
                                            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z" />
                                            <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z" />
                                        </svg>
                                    </OverlayTrigger>
                                </div>
                                <SketchPicker
                                    className="sketch-color"
                                    color={allColors[currentTabIdxElm]}
                                    onChange={(color) => {                                        
                                        const newSvgCode = itemSelected?.attrs?.src?.replaceAll(
                                            allColors[currentTabIdxElm],
                                            `${color?.hex}`
                                        );

                                        updateCurrentStageData(itemSelected?.id, {
                                            src: newSvgCode,
                                            // fill: color.hex
                                        })
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>}

                {/* <div className='row mb-4'>
                    <div className='col-3 text-right'>
                        <span>{formatMessage({ defaultMessage: 'RGBA' })}</span>
                    </div>
                    <div className="col-9">
                        <ColorPicker
                            className="w-100"
                            value={color}
                            onChange={setColor}
                            hideAdvancedSliders={true}
                        />
                    </div>
                </div> */}


                <div className='row mb-4'>
                    <div className='col-3 text-right'>
                        <span>{formatMessage({ defaultMessage: 'Độ mờ' })}</span>
                    </div>
                    <div className="col-9">
                        <Slider
                            value={valueOpacity}
                            aria-label="custom thumb label"
                            valueLabelDisplay="auto"
                            color="primary"
                            onChange={(e, value) => {
                                setValueOpacity(value);
                            }}
                            onChangeCommitted={(e, value) => {
                                updateCurrentStageData(itemSelected?.id, {
                                    opacity: Number(value / 100)
                                })
                            }}
                        />
                    </div>
                </div>

                {itemSelected?.attrs?.[`data-item-type`] != 'frame' && <div className='row mb-4 d-flex align-items-center'>
                    <div className='col-3 text-right'>
                        <span>{formatMessage({ defaultMessage: 'Di chuyển' })}</span>
                    </div>
                    <div className='d-flex align-items-center ml-4'>
                        <OverlayTrigger
                            overlay={
                                <Tooltip>
                                    {formatMessage({ defaultMessage: 'Căn giữa khung ảnh' })}
                                </Tooltip>
                            }
                        >
                            <div
                                className='p-4 cursor-pointer'
                                style={{ background: '#edeef7', border: '1px solid #e9e9e9', borderRadius: 8 }}
                                onClick={() => {
                                    updateCurrentStageData(itemSelected?.id, {
                                        x: (frameWidth / 2) - ((itemSelected?.attrs?.width * (itemSelected?.attrs?.scaleX || 1)) / 2) - (frameWidth * 20 / 100)
                                    });
                                }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-align-center" viewBox="0 0 16 16">
                                    <path d="M8 1a.5.5 0 0 1 .5.5V6h-1V1.5A.5.5 0 0 1 8 1m0 14a.5.5 0 0 1-.5-.5V10h1v4.5a.5.5 0 0 1-.5.5M2 7a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z" />
                                </svg>
                            </div>
                        </OverlayTrigger>
                    </div>
                </div>}

                {itemSelected?.attrs?.[`data-item-type`] != 'frame' && itemSelected?.id != 'ub-frame-shape' && (
                    <div className='row mb-4'>
                        <div className='col-3 text-right d-flex align-items-center justify-content-end'>
                            <span>{formatMessage({ defaultMessage: 'Vị trí' })}</span>
                        </div>
                        <div className='d-flex align-items-center ml-4'>
                            <OverlayTrigger
                                overlay={
                                    <Tooltip>
                                        {formatMessage({ defaultMessage: 'Đè lên' })}
                                    </Tooltip>
                                }
                            >
                                <div
                                    className='p-4 cursor-pointer'
                                    style={{ background: '#edeef7', border: '1px solid #e9e9e9', borderRadius: 8 }}
                                    onClick={() => {
                                        updateCurrentStageData(itemSelected?.id, {
                                            zIndex: 1,
                                            updated_at: Date.now()
                                        })
                                    }}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-front" viewBox="0 0 16 16">
                                        <path d="M0 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2H2a2 2 0 0 1-2-2zm5 10v2a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-2v5a2 2 0 0 1-2 2z" />
                                    </svg>
                                </div>
                            </OverlayTrigger>
                            <OverlayTrigger
                                overlay={
                                    <Tooltip>
                                        {formatMessage({ defaultMessage: 'Đè xuống' })}
                                    </Tooltip>
                                }
                            >
                                <div
                                    className='p-4 ml-4 cursor-pointer'
                                    style={{ background: '#edeef7', border: '1px solid #e9e9e9', borderRadius: 8 }}
                                    onClick={() => {
                                        updateCurrentStageData(itemSelected?.id, {
                                            zIndex: -1,
                                            updated_at: Date.now()
                                        })
                                    }}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-subtract" viewBox="0 0 16 16">
                                        <path d="M0 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2H2a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1z" />
                                    </svg>
                                </div>
                            </OverlayTrigger>
                        </div>
                    </div>
                )}

                {itemSelected?.attrs?.[`data-item-type`] != 'frame' && itemSelected?.id != 'ub-frame-shape' && (
                    <div className='row mb-4'>
                        <div className='col-3 text-right d-flex align-items-center justify-content-end'>
                            <span>{formatMessage({ defaultMessage: 'Xoay' })}</span>
                        </div>
                        <div className='d-flex align-items-center ml-4'>
                            <OverlayTrigger
                                overlay={
                                    <Tooltip>
                                        {formatMessage({ defaultMessage: 'Xoay ngang' })}
                                    </Tooltip>
                                }
                            >
                                <div
                                    className='p-4 cursor-pointer'
                                    style={{ background: '#edeef7', border: '1px solid #e9e9e9', borderRadius: 8 }}
                                    onClick={() => {
                                        updateCurrentStageData(itemSelected?.id, {
                                            scaleX: -1 * itemSelected?.attrs?.scaleX,
                                            updated_at: Date.now()
                                        })
                                    }}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-left-right" viewBox="0 0 16 16">
                                        <path fill-rule="evenodd" d="M1 11.5a.5.5 0 0 0 .5.5h11.793l-3.147 3.146a.5.5 0 0 0 .708.708l4-4a.5.5 0 0 0 0-.708l-4-4a.5.5 0 0 0-.708.708L13.293 11H1.5a.5.5 0 0 0-.5.5m14-7a.5.5 0 0 1-.5.5H2.707l3.147 3.146a.5.5 0 1 1-.708.708l-4-4a.5.5 0 0 1 0-.708l4-4a.5.5 0 1 1 .708.708L2.707 4H14.5a.5.5 0 0 1 .5.5" />
                                    </svg>
                                </div>
                            </OverlayTrigger>
                            <OverlayTrigger
                                overlay={
                                    <Tooltip>
                                        {formatMessage({ defaultMessage: 'Xoay dọc' })}
                                    </Tooltip>
                                }
                            >
                                <div
                                    className='p-4 ml-4 cursor-pointer'
                                    style={{ background: '#edeef7', border: '1px solid #e9e9e9', borderRadius: 8 }}
                                    onClick={() => {
                                        updateCurrentStageData(itemSelected?.id, {
                                            scaleY: -1 * itemSelected?.attrs?.scaleY,
                                            updated_at: Date.now()
                                        })
                                    }}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-down-up" viewBox="0 0 16 16">
                                        <path fill-rule="evenodd" d="M11.5 15a.5.5 0 0 0 .5-.5V2.707l3.146 3.147a.5.5 0 0 0 .708-.708l-4-4a.5.5 0 0 0-.708 0l-4 4a.5.5 0 1 0 .708.708L11 2.707V14.5a.5.5 0 0 0 .5.5m-7-14a.5.5 0 0 1 .5.5v11.793l3.146-3.147a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 .708-.708L4 13.293V1.5a.5.5 0 0 1 .5-.5" />
                                    </svg>
                                </div>
                            </OverlayTrigger>
                        </div>
                    </div>
                )}

                {itemSelected?.attrs?.[`data-item-type`] == 'text' && <ToolTextWidget
                    itemSelected={itemSelected}
                    updateCurrentStageData={updateCurrentStageData}
                />}
            </CardBody>
        </Card>
    )
};

export default memo(ToolWidget);