// /*
//  * Created by duydatpham@gmail.com on 23/06/2021
//  * Copyright (c) 2021 duydatpham@gmail.com
//  */
// import { Divider } from '@material-ui/core'
// import React, { memo, useCallback, useMemo, useState } from 'react'
// import { toAbsoluteUrl } from '../../../../_metronic/_helpers'
// import { Checkbox } from '../../../../_metronic/_partials/controls'
// import _ from 'lodash'
// import { formatNumberToCurrency } from '../../../../utils'
// import dayjs from 'dayjs'
// import SVG from "react-inlinesvg";
// import { Link, useHistory, useLocation } from 'react-router-dom'
// import { OverlayTrigger, Tooltip } from 'react-bootstrap'
// import { FormattedMessage } from 'react-intl'
// import { Dropdown } from 'react-bootstrap'
// import { useMutation } from '@apollo/client'
// import mutate_scProductSyncUp from '../../../../graphql/mutate_scProductSyncUp'
// import { useToasts } from 'react-toast-notifications'
// import { useProductsUIContext } from '../ProductsUIContext'
// import InfoProduct from '../../../../components/InfoProduct';
// import { ChevronRightOutlined } from '@material-ui/icons';
// import { useIntl } from "react-intl";
// import queryString from 'querystring'

// export default ({ product, dataVariantLinked, setDataCombo, onShowProductConnectVariant }) => {
//     const { formatMessage } = useIntl()
//     const params = queryString.parse(useLocation().search.slice(1, 100000))
//     const { ids, setIds } = useProductsUIContext();
//     const imgAssets = useMemo(() => {
//         if (!!product?.variant?.sme_catalog_product_variant_assets[0] && product?.variant?.sme_catalog_product_variant_assets[0].asset_url) {
//             return product?.variant?.sme_catalog_product_variant_assets[0]
//         }
//         return null //product?.product?.sme_catalog_product_assets[0]
//     }, [product])

//     let hasAttribute = product?.variant?.attributes?.length > 0;// variants.length > 0 && variants[0].attributes.length > 0;
//     const isSelected = ids.some(_id => _id.variant_id == product.variant_id)

//     const _attributes = useMemo(() => {

//         let attributes = [];
//         if (product?.variant?.attributes && product?.variant?.attributes.length > 0) {
//             for (let index = 0; index < product?.variant?.attributes.length; index++) {
//                 const element = product?.variant?.attributes[index];
//                 attributes.push(`${element.sme_catalog_product_attribute_value?.name}`);

//             }
//             return attributes.join(' - ');
//         }
//         return null
//     }, [product])

//     const { addToast } = useToasts();

//     const [isCopied, setIsCopied] = useState(false);

//     const [isHovering, setIsHovering] = useState(false);

//     const handleMouseEnter = (id) => {
//         setIsHovering(id);
//     }

//     const handleMouseLeave = () => {
//         setIsHovering(false);
//     }


//     const onCopyToClipBoard = async (text) => {
//         await navigator.clipboard.writeText(text);
//         setIsCopied(true);
//         setTimeout(
//             () => {
//                 setIsCopied(false);
//             }, 1500
//         )
//     };


//     return <tr style={!hasAttribute ? {
//         borderBottom: '1px solid #F0F0F0',
//     } : {
//     }} >
//         <td width={300}>
//             <div className='d-flex align-items-center'>
//                 <Checkbox
//                     inputProps={{
//                         'aria-label': 'checkbox',
//                     }}
//                     isSelected={isSelected}
//                     onChange={(e) => {
//                         if (isSelected) {
//                             setIds(prev => prev.filter(_id => _id?.variant_id != product?.variant_id))
//                         } else {
//                             setIds(prev => prev.concat([product]))
//                         }
//                     }}
//                 />
//                 <div className='d-flex ml-2'>
//                     <div style={{ position: 'relative' }} onMouseEnter={() => handleMouseEnter('sku')} onMouseLeave={handleMouseLeave}>
//                         <div className='d-flex align-items-start'>
//                             <img style={{ position: 'relative', top: 6 }} src={toAbsoluteUrl('/media/ic_sku.svg')} />
//                             <Link style={{ color: 'black' }} to={`/products/${product?.variant?.is_combo == 1 ? 'edit-combo/' + product.product_id : product?.variant?.attributes?.length > 0 ? 'stocks/detail/' + product?.variant?.id : 'edit/' + product?.product_id}`} target="_blank" >
//                                 <span title={product?.variant?.sku || '--'} className={`fs-14 ml-2 line-clamp`}>
//                                     {product?.variant?.sku || '--'}
//                                 </span>
//                             </Link>
//                         </div>
//                         {isHovering == 'sku' && (
//                             <OverlayTrigger
//                                 overlay={
//                                     <Tooltip title='#1234443241434' style={{ color: 'red' }}>
//                                         <span>
//                                             {isCopied ? formatMessage({ defaultMessage: `Copy thành công` }) : `Copy to clipboard`}
//                                         </span>
//                                     </Tooltip>
//                                 }
//                             >
//                                 <div className="action-copy">
//                                     <i onClick={() => onCopyToClipBoard(product?.variant?.sku)} className="far fa-copy"></i>
//                                 </div>
//                             </OverlayTrigger>
//                         )}
//                     </div>

//                 </div>
//             </div>
//         </td>
//         <td width={300}>
//             <div className='d-flex align-items-center'>
//                 <OverlayTrigger
//                     overlay={
//                         <Tooltip title='#1234443241434'>
//                             <div style={{
//                                 backgroundColor: '#F7F7FA',
//                                 width: 160, height: 160,
//                                 borderRadius: 4,
//                                 overflow: 'hidden',
//                                 minWidth: 160
//                             }} className='mr-2' >
//                                 {
//                                     !!imgAssets && <img src={imgAssets?.asset_url}
//                                         style={{ width: 160, height: 160, objectFit: 'contain' }} />
//                                 }
//                             </div>
//                         </Tooltip>
//                     }
//                 >
//                     <Link to={!hasAttribute ? `/products/${product?.variant?.is_combo == 1 ? 'edit-combo' : 'edit'}/${product?.product_id}` : `/products/stocks/detail/${product?.variant_id}`} target="_blank">
//                         <div style={{
//                             backgroundColor: '#F7F7FA',
//                             width: 20, height: 20,
//                             borderRadius: 4,
//                             overflow: 'hidden',
//                             minWidth: 20
//                         }} className='mr-2' >
//                             {
//                                 !!imgAssets && <img src={imgAssets?.asset_url}
//                                     style={{ width: 20, height: 20, objectFit: 'contain' }} />
//                             }
//                         </div>
//                     </Link>
//                 </OverlayTrigger>
//                 <div>
//                     <div className='d-flex'>
//                         <InfoProduct
//                             name={product?.variant?.sme_catalog_product?.name}
//                             isSingle
//                             setDataCombo={setDataCombo}
//                             combo_items={product?.variant?.combo_items}
//                             url={!hasAttribute ? `/products/${product?.variant?.is_combo == 1 ? 'edit-combo' : 'edit'}/${product.product_id}` : `/products/stocks/detail/${product.variant_id}`}
//                         />
//                     </div>
//                 </div>
//             </div>
//             {!!_attributes && <div className='mt-2'><span className='text-secondary-custom font-weight-normal fs-12'>{_attributes}</span></div>}
//         </td>
//         <td className='text-center' width={100}>
//             {product?.variant?.is_combo ? "Combo" : formatMessage({ defaultMessage: "Thường" })}
//         </td>
//         <td className='text-center' width={100}>
//             <b>{formatNumberToCurrency(product?.stock_actual)}</b>
//         </td>
//         <td className='text-center' width={100}>
//             <b>{formatNumberToCurrency(product?.stock_allocated)}</b>
//         </td>
//         <td className='text-center' width={100}>
//             <b>{formatNumberToCurrency(product?.stock_actual - product?.stock_allocated)}</b>
//         </td>
//         <td className='text-center' width={100}>
//             <b>{formatNumberToCurrency(product?.stock_shipping)}</b>
//         </td>
//         <td className='text-center' width={100}>
//             <b>{typeof product?.variant?.stock_warning == 'number' ? formatNumberToCurrency(product?.variant?.stock_warning) : '--'}</b>
//         </td>
//         <td className='text-center' width={100}>
//             <b>{formatNumberToCurrency(product.stock_preallocate)}</b>
//         </td>
//         <td className='text-center' width={150}>
//             <OverlayTrigger
//                 overlay={
//                     <Tooltip title=''>
//                         <div className='d-flex flex-column align-items-start'>
//                             <p style={{ marginBottom: 1, marginTop: 2 }} ><b> {formatMessage({ defaultMessage: 'Gá bán' })}: {typeof product?.variant?.price == 'number' ? formatNumberToCurrency(product?.variant?.price) + ' đ' : '--'}</b></p>
//                             <p style={{ marginBottom: 1, marginTop: 2 }} >{formatMessage({ defaultMessage: 'Giá vốn' })}: {typeof product?.variant?.cost_price == 'number' ? formatNumberToCurrency(product?.variant?.cost_price) + ' đ' : '--'}</p>
//                             <p style={{ marginBottom: 1, marginTop: 2 }} >{formatMessage({ defaultMessage: 'Giá bán tối thiểu' })}: {typeof product?.variant?.price_minimum == 'number' ? formatNumberToCurrency(product?.variant?.price_minimum) + ' đ' : '--'}</p>
//                         </div>
//                     </Tooltip>
//                 }
//             >
//                 <div className='d-flex align-items-center justify-content-center cursor-pointer'>
//                     <span>{typeof product?.variant?.cost_price == 'number' ? formatNumberToCurrency(product?.variant?.cost_price) + ' đ' : '--'}</span>
//                     <ChevronRightOutlined className='ml-2' />
//                 </div>
//             </OverlayTrigger>
//         </td>
//         <td className='text-center' width={150}>
//             {product?.sme_store?.name}
//         </td>
//         {/* <td style={{ verticalAlign: 'top', whiteSpace: 'pre-wrap' }} width={300}>
//             {
//                 dayjs(product.updated_at).format('DD/MM/YYYY[\n]HH:mm')
//             }
//         </td> */}
//     </tr>
// }