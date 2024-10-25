import React, { Fragment, useRef, useState } from 'react';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { toAbsoluteUrl } from '../_metronic/_helpers';
import { useIntl } from 'react-intl'
export default function InfoProduct({
    name, sku, url, combo_items, setDataCombo, productOrder, gtin,
    isSingle = false, fitCombo = false
}) {
    const { formatMessage } = useIntl()
    const [isHovering, setIsHovering] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    const handleMouseEnter = (id) => {
        setIsHovering(id);
    }

    const handleMouseLeave = () => {
        setIsHovering(false);
    }

    const onCopyToClipBoard = async (text) => {
        await navigator.clipboard.writeText(text);
        setIsCopied(true);
        setTimeout(
            () => {
                setIsCopied(false);
            }, 1500
        )
    };

    return (
        <div className='w-100'>
            {name && <div className='d-flex align-items-center'>

                <div style={{ position: 'relative' }} onMouseEnter={() => handleMouseEnter('name')} onMouseLeave={handleMouseLeave} className="text-truncate-product">
                    {!productOrder && <Link to={url} target="_blank" >
                        <span style={{ color: 'black' }} title={name} className={`font-weight-normal fs-14 ${isSingle ? 'line-clamp-single' : 'line-clamp'}`}> {name}</span>
                    </Link>}
                    {productOrder && <> {url ? <div role='button' onClick={() => { url() }} >
                        <span style={{ color: 'black' }} title={name} className={`font-weight-normal fs-14 ${isSingle ? 'line-clamp-single' : 'line-clamp'}`}> {name}</span>
                    </div> : <span style={{ color: 'black' }} title={name} className={`font-weight-normal fs-14 ${isSingle ? 'line-clamp-single' : 'line-clamp'}`}> {name}</span>}</>
                    }
                    {isHovering == 'name' && (
                        <OverlayTrigger
                            overlay={
                                <Tooltip title='#1234443241434' style={{ color: 'red' }}>
                                    <span>
                                        {isCopied ? `${formatMessage({ defaultMessage: 'Copy thành công' })}` : `Copy to clipboard`}
                                    </span>
                                </Tooltip>
                            }
                        >
                            <div className="action-copy">
                                <i onClick={() => onCopyToClipBoard(name)} className="far fa-copy"></i>
                            </div>
                        </OverlayTrigger>
                    )}
                </div>
                {
                    combo_items?.length > 0 && (
                        <span onClick={() => setDataCombo(combo_items)} className='text-primary cursor-pointer ml-2' style={fitCombo ? { minWidth: 'fit-content' } : {}}>Combo</span>
                    )
                }
            </div>
            }

            {sku && <div className='d-flex'>
                <div style={{ position: 'relative' }} onMouseEnter={() => handleMouseEnter('sku')} onMouseLeave={handleMouseLeave} className={name ? 'mt-2' : ''}>

                    <div className='d-flex align-items-center'>
                        <img src={toAbsoluteUrl('/media/ic_sku.svg')} />
                        <span title={sku || '--'} className={`${name ? 'text-secondary-custom' : ''} fs-14 ml-2 ${isSingle ? 'line-clamp-single' : 'line-clamp'}`}>{sku || '--'}</span>
                    </div>
                    {isHovering == 'sku' && (
                        <OverlayTrigger
                            overlay={
                                <Tooltip title='#1234443241434' style={{ color: 'red' }}>
                                    <span>
                                        {isCopied ? `${formatMessage({ defaultMessage: 'Copy thành công' })}` : `Copy to clipboard`}
                                    </span>
                                </Tooltip>
                            }
                        >
                            <div className="action-copy">
                                <i onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onCopyToClipBoard(sku)
                                }} className="far fa-copy"></i>
                            </div>
                        </OverlayTrigger>
                    )}
                </div>

            </div>
            }

            {gtin && <div className='d-flex'>
                <div style={{ position: 'relative' }} onMouseEnter={() => handleMouseEnter('gtin')} onMouseLeave={handleMouseLeave} className={name ? 'mt-2' : ''}>

                    <div className='d-flex align-items-center'>
                        <img src={toAbsoluteUrl('/media/ic_gtin.svg')} />
                        <span title={gtin || '--'} className={`${name ? 'text-secondary-custom' : ''} fs-14 ml-2 ${isSingle ? 'line-clamp-single' : 'line-clamp'}`}>{gtin || '--'}</span>
                    </div>
                    {isHovering == 'gtin' && (
                        <OverlayTrigger
                            overlay={
                                <Tooltip title='#1234443241434' style={{ color: 'red' }}>
                                    <span>
                                        {isCopied ? `${formatMessage({ defaultMessage: 'Copy thành công' })}` : `Copy to clipboard`}
                                    </span>
                                </Tooltip>
                            }
                        >
                            <div className="action-copy">
                                <i onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onCopyToClipBoard(gtin)
                                }} className="far fa-copy"></i>
                            </div>
                        </OverlayTrigger>
                    )}
                </div>

            </div>
            }
        </div>
    )
};