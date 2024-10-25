// import React, { memo, useMemo } from "react";
// import { Dropdown } from "react-bootstrap";
// import dayjs from "dayjs";
// import _ from "lodash";
// import {
//   ACTOR_HISTORY_TRANSACTION,
//   PROTOCOL_IN,
//   PROTOCOL_OUT,
//   TAB_HISTORY_STATUS,
//   TYPE_HISTORY_TRANSACTION,
// } from "../WarehouseBillsUIHelper";
// import { Link } from "react-router-dom";
// import { toAbsoluteUrl } from "../../../../_metronic/_helpers";
// import InfoProduct from "../../../../components/InfoProduct";
// import { formatNumberToCurrency } from "../../../../utils";
// import { useIntl } from "react-intl";
// import { OverlayTrigger, Tooltip } from "react-bootstrap";
// const WarehouseBillHistoryRow = ({
//   key,
//   wareHouseBillHistory,
//   setDataCombo,
//   tabPage,
// }) => {
//   const { formatMessage } = useIntl();
//   const linkProduct = () => {
//     if (wareHouseBillHistory?.variant?.is_combo == 1) {
//       return `/products/edit-combo/${wareHouseBillHistory?.variant?.product_id}`;
//     }
//     if (wareHouseBillHistory?.variant?.attributes?.length > 0) {
//       return `/products/stocks/detail/${wareHouseBillHistory?.variant?.id}`;
//     } else {
//       return `/products/edit/${wareHouseBillHistory?.variant?.product_id}`;
//     }
//   };

//   const warehouse = wareHouseBillHistory?.warehouse.name;

//   const renderContent = (tab) => {
//     return (
//       <>
//         <td style={{ verticalAlign: "top" }}>
//           <div className="w-100">
//             <Link style={{ color: "black" }} to={linkProduct()} target="_blank">
//               <InfoProduct sku={wareHouseBillHistory?.variant?.sku} />
//             </Link>
//           </div>
//         </td>
//         <td style={{ verticalAlign: "top" }}>
//           <div className="d-flex">
//             <OverlayTrigger
//               overlay={
//                 <Tooltip title="#1234443241434">
//                   <div
//                     style={{
//                       backgroundColor: "#F7F7FA",
//                       width: 160,
//                       height: 160,
//                       borderRadius: 4,
//                       overflow: "hidden",
//                       minWidth: 160,
//                     }}
//                     className="mr-2"
//                   >
//                     {wareHouseBillHistory?.variant
//                       ?.sme_catalog_product_variant_assets[0]?.asset_url && (
//                       <img
//                         src={
//                           wareHouseBillHistory?.variant
//                             ?.sme_catalog_product_variant_assets[0]?.asset_url
//                         }
//                         style={{
//                           width: 160,
//                           height: 160,
//                           objectFit: "contain",
//                           cursor: "pointer",
//                         }}
//                       />
//                     )}
//                   </div>
//                 </Tooltip>
//               }
//             >
//               <Link to={linkProduct()} target="_blank">
//                 {wareHouseBillHistory?.variant
//                   ?.sme_catalog_product_variant_assets[0]?.asset_url && (
//                   <img
//                     src={
//                       wareHouseBillHistory?.variant
//                         ?.sme_catalog_product_variant_assets[0]?.asset_url
//                     }
//                     style={{ width: 20, height: 20, objectFit: "contain" }}
//                   />
//                 )}
//               </Link>
//             </OverlayTrigger>
//             <div className="ml-2">
//               <div className="d-flex">
//                 <InfoProduct
//                   name={
//                     wareHouseBillHistory?.variant?.sme_catalog_product?.name
//                   }
//                   isSingle
//                   url={linkProduct()}
//                   setDataCombo={setDataCombo}
//                   combo_items={wareHouseBillHistory?.variant?.combo_items}
//                 />
//               </div>
//               {!!wareHouseBillHistory?.variant?.attributes?.length > 0 && (
//                 <span className="text-secondary-custom mt-2">
//                   {wareHouseBillHistory?.variant?.name?.replaceAll(
//                     " + ",
//                     " - "
//                   )}
//                 </span>
//               )}
//             </div>
//           </div>
//         </td>
//         <td style={{ verticalAlign: "top", textAlign: "center" }}>
//           <span>
//             {_.find(
//               TAB_HISTORY_STATUS,
//               (_tab) => _tab?.status == wareHouseBillHistory?.target
//             )?.title || "--"}
//           </span>
//         </td>
//         <td style={{ verticalAlign: "top", textAlign: "center" }}>
//           <strong
//             className={
//               wareHouseBillHistory?.after - wareHouseBillHistory?.before >= 0
//                 ? "text-success"
//                 : "text-danger"
//             }
//           >
//             {wareHouseBillHistory?.after - wareHouseBillHistory?.before > 0 && (
//               <span>+</span>
//             )}
//             <span>{formatNumberToCurrency(wareHouseBillHistory?.amount)}</span>
//           </strong>
//         </td>

//         <td style={{ verticalAlign: "top", textAlign: "center" }}>
//           <strong className="my-0 ml-2">
//             {formatNumberToCurrency(wareHouseBillHistory?.before)}
//           </strong>
//         </td>
//         <td style={{ verticalAlign: "top", textAlign: "center" }}>
//           <strong className="my-0 ml-2">
//             {formatNumberToCurrency(wareHouseBillHistory?.after)}
//           </strong>
//         </td>
//         <td style={{ verticalAlign: "top", textAlign: "center" }}>
//           {warehouse}
//         </td>
//         <td style={{ verticalAlign: "top", textAlign: "center" }}>
//           <span className="my-0">
//             {_.find(
//               TYPE_HISTORY_TRANSACTION,
//               (_type) => _type?.value === wareHouseBillHistory?.type
//             )?.label || "--"}
//           </span>
//         </td>
//         <td style={{ verticalAlign: "top", textAlign: "center" }}>
//           <span className="my-0">
//             {_.find(
//               ACTOR_HISTORY_TRANSACTION,
//               (_actor) => _actor?.value === wareHouseBillHistory?.actor
//             )?.label || "--"}
//           </span>
//         </td>
//         <td style={{ verticalAlign: "top" }}>
        
//           <span className="my-0">
//             {wareHouseBillHistory?.actor_ref_code ? <Link style={{color: 'black'}}
//              to={`/products/warehouse-bill/${wareHouseBillHistory.type == 
//              'xuat_kho' ? 'out' : 
//              'in'}/${wareHouseBillHistory?.actor_ref_code?.split('-').slice(-1)}`}
//               target="_blank">{wareHouseBillHistory?.actor_ref_code}</Link> : "--"}
//           </span>
//         </td>
//         <td style={{ verticalAlign: "top" }}>
//           <div className="d-flex flex-column">
//             {(!!wareHouseBillHistory?.warehouseBill?.order_code ||
//               !!wareHouseBillHistory?.order_code) && (
//               <>
//                 <span className="text-secondary-custom">
//                   {formatMessage({ defaultMessage: "Mã đơn hàng" })}:
//                 </span>
//                 <Link to={`/orders/${wareHouseBillHistory.actor_ref}`} target="_blank">
//                 <span style={{color: '#FF5629'}} className="my-0">
//                   {wareHouseBillHistory?.warehouseBill?.order_code ||
//                     wareHouseBillHistory?.order_code}
//                 </span>
//                 </Link>
               
//               </>
//             )}
//             {(!!wareHouseBillHistory?.warehouseBill?.shipping_code ||
//               !!wareHouseBillHistory?.order_tracking_number) && (
//               <>
//                 <span className="text-secondary-custom mt-2">
//                   {formatMessage({ defaultMessage: "Mã vận đơn" })}:
//                 </span>
//                 <Link to={`/orders/${wareHouseBillHistory.actor_ref}`} target="_blank">
//                 <span style={{color: '#FF5629'}} className="my-0">
//                   {wareHouseBillHistory?.warehouseBill?.shipping_code ||
//                     wareHouseBillHistory?.order_tracking_number}
//                 </span>
//                 </Link>
//               </>
//             )}
//           </div>
//         </td>
//         <td style={{ verticalAlign: "top" }}>
//           <div
//             className="d-flex flex-column"
//             style={{ whiteSpace: "pre-wrap" }}
//           >
//             {dayjs(wareHouseBillHistory?.created_at).format(
//               "DD/MM/YYYY[\n]HH:mm"
//             )}
//           </div>
//         </td>
//       </>
//     );
//   };
//   return (
//     <tr style={{ borderBottom: "1px solid #D9D9D9" }}>
//       {renderContent(tabPage)}
//     </tr>
//     // <tr key={key} style={{ borderBottom: '1px solid #D9D9D9' }}>
//     //     <td style={{ verticalAlign: 'top' }}>
//     //         {!!wareHouseBillHistory?.variant ? (
//     //             <div style={{ verticalAlign: 'top', display: 'flex', flexDirection: 'row', marginBottom: 16 }}>
//     //                 <Link to={linkProduct()} target="_blank">
//     //                     <div style={{
//     //                         backgroundColor: '#F7F7FA',
//     //                         width: 80, height: 80,
//     //                         borderRadius: 8,
//     //                         overflow: 'hidden',
//     //                         minWidth: 80
//     //                     }} className='mr-6' >
//     //                         {
//     //                             !!wareHouseBillHistory?.variant?.sme_catalog_product_variant_assets[0]?.asset_url && <img src={wareHouseBillHistory?.variant?.sme_catalog_product_variant_assets[0]?.asset_url}
//     //                                 style={{ width: 80, height: 80, objectFit: 'contain' }} />
//     //                         }
//     //                     </div>
//     //                 </Link>
//     //                 <div className="w-100">
//     //                     <InfoProduct
//     //                         name={wareHouseBillHistory?.variant?.sme_catalog_product?.name}
//     //                         sku={wareHouseBillHistory?.variant?.sku}
//     //                         url={linkProduct()}
//     //                         setDataCombo={setDataCombo}
//     //                         combo_items={wareHouseBillHistory?.variant?.combo_items}
//     //                     />

//     //                     {
//     //                         !!wareHouseBillHistory?.variant?.attributes?.length > 0 && <p className='text-secondary-custom mt-2'>
//     //                             {wareHouseBillHistory?.variant?.name?.replaceAll(' + ', ' - ')}
//     //                         </p>
//     //                     }
//     //                 </div>
//     //             </div>
//     //         ) : (
//     //             <span>{formatMessage({ defaultMessage: 'Chưa có sản phẩm' })}</span>
//     //         )}
//     //     </td>
//     //     <td style={{ verticalAlign: 'top' }}>
//     //         <div className="d-flex flex-column">
//     //             <div className="d-flex align-items-center">
//     //                 <span>{formatMessage({ defaultMessage: 'Thay đổi' })}:</span>
//     //                 <span className='my-0 ml-2'>
//     //                     <strong
//     //                         className={(wareHouseBillHistory?.after - wareHouseBillHistory?.before) >= 0 ? 'text-success' : 'text-danger'}
//     //                     >
//     //                         {(wareHouseBillHistory?.after - wareHouseBillHistory?.before) > 0 && <span>+</span>}
//     //                         <span>{formatNumberToCurrency(wareHouseBillHistory?.amount)}</span>
//     //                     </strong>
//     //                 </span>
//     //             </div>
//     //             <div className="mt-2">
//     //                 {_.find(TAB_HISTORY_STATUS, _tab => _tab?.status == wareHouseBillHistory?.target)?.title || '--'}
//     //             </div>
//     //             <div className="d-flex align-items-center text-secondary-custom mt-2">
//     //                 <span>{formatMessage({ defaultMessage: 'Tồn trước' })}:</span>
//     //                 <span className='my-0 ml-2'>{wareHouseBillHistory?.before || 0}</span>
//     //             </div>
//     //             <div className="d-flex align-items-center text-secondary-custom mt-2">
//     //                 <span>{formatMessage({ defaultMessage: 'Tồn sau' })}:</span>
//     //                 <span className='my-0 ml-2'>{wareHouseBillHistory?.after || 0}</span>
//     //             </div>
//     //         </div>
//     //     </td>
//     //     <td style={{ verticalAlign: 'top' }}>
//     //         {wareHouseBillHistory?.warehouse?.name || '--'}
//     //     </td>
//     //     <td style={{ verticalAlign: 'top' }}>
//     //         <div className="d-flex flex-column">
//     //             <span className='text-secondary-custom'>{formatMessage({ defaultMessage: 'Loại' })}:</span>
//     //             <span className='my-0'>
//     //                 {_.find(TYPE_HISTORY_TRANSACTION, _type => _type?.value === wareHouseBillHistory?.type)?.label || '--'}
//     //             </span>
//     //             <span className='text-secondary-custom mt-2'>{formatMessage({ defaultMessage: 'Phát sinh từ' })}:</span>
//     //             <span className='my-0'>
//     //                 {_.find(ACTOR_HISTORY_TRANSACTION, _actor => _actor?.value === wareHouseBillHistory?.actor)?.label || '--'}
//     //             </span>
//     //         </div>
//     //     </td>
//     //     <td style={{ verticalAlign: 'top' }}>
//     //         <div className="d-flex flex-column">
//     //             <span className='my-0' style={{ whiteSpace: 'pre-wrap' }}>{dayjs(wareHouseBillHistory?.created_at).format('DD/MM/YYYY[\n]HH:mm')}</span>
//     //         </div>
//     //     </td>
//     //     <td style={{ verticalAlign: 'top' }}>
//     //         <div className="d-flex flex-column">
//     //             <span className='text-secondary-custom'>{formatMessage({ defaultMessage: 'Mã phiếu' })}:</span>
//     //             <span className='my-0'>{wareHouseBillHistory?.actor_ref_code || '--'}</span>
//     //             {wareHouseBillHistory?.actor == 'order' && (
//     //                 <>
//     //                     <span className='text-secondary-custom mt-2'>{formatMessage({ defaultMessage: 'Mã vận đơn' })}:</span>
//     //                     <span className='my-0'>{wareHouseBillHistory?.warehouseBill?.shipping_code || '--'}</span>
//     //                 </>
//     //             )}
//     //         </div>
//     //     </td>
//     // </tr>
//   );
// };

// export default memo(WarehouseBillHistoryRow);
