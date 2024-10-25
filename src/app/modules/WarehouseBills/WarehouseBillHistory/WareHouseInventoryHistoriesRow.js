// import React from "react";
// import InfoProduct from "../../../../components/InfoProduct";
// import { OverlayTrigger, Tooltip } from "react-bootstrap";
// import { Link } from "react-router-dom";
// import { formatNumberToCurrency } from "../../../../utils";
// const WareHouseInventoryHistoriesRow = ({ wareHouseInventoryHistories }) => {
//   const linkProduct = () => {
//     if (wareHouseInventoryHistories?.variantName) {
//       return `/products/stocks/detail/${wareHouseInventoryHistories?.variantId}`;
//     } else {
//       return `/products/edit/${wareHouseInventoryHistories?.productId}`;
//     }
//   };

//   return (
//     <tr>
//       <td style={{ verticalAlign: "top" }}>
//         <Link style={{color: 'black'}} to={linkProduct()} target="_blank">
//           <InfoProduct sku={wareHouseInventoryHistories?.sku} />
//         </Link>
//       </td>
//       <td style={{ verticalAlign: "top" }}>
//         <div className="d-flex">
//           <OverlayTrigger
//             overlay={
//               <Tooltip title="#1234443241434">
//                 <div
//                   style={{
//                     backgroundColor: "#F7F7FA",
//                     width: 160,
//                     height: 160,
//                     borderRadius: 4,
//                     overflow: "hidden",
//                     minWidth: 160,
//                   }}
//                   className="mr-2"
//                 >
//                   <Link style={{color: 'black'}} to={linkProduct()} target="_blank">
//                   {wareHouseInventoryHistories?.logo && (
//                     <img
//                       src={wareHouseInventoryHistories?.logo}
//                       style={{
//                         width: 160,
//                         height: 160,
//                         objectFit: "contain",
//                         cursor: "pointer",
//                       }}
//                     />
//                   )}
//                   </Link>
//                 </div>
//               </Tooltip>
//             }
//           >
//             <Link style={{color: 'black'}} to={linkProduct()} target="_blank">
//             {wareHouseInventoryHistories?.logo && (
//               <img
//                 src={wareHouseInventoryHistories?.logo}
//                 style={{ width: 20, height: 20, objectFit: "contain" }}
//               />
//             )}
//             </Link>
//           </OverlayTrigger>
//           <div className="ml-2">
//             <div className="d-flex">
//               <InfoProduct
//               isSingle
//                 name={wareHouseInventoryHistories?.name}
//                 url={linkProduct()}
//               />
//             </div>
//             {!!wareHouseInventoryHistories?.variantName > 0 && (
//               <span className="text-secondary-custom mt-2">
//                 {wareHouseInventoryHistories?.variantName}
//               </span>
//             )}
//           </div>
//         </div>
//       </td>
//       <td style={{ verticalAlign: "top", textAlign: "center" }}>
//         <strong className="my-0 ml-2">
//           {formatNumberToCurrency(wareHouseInventoryHistories?.before)}
//         </strong>
//       </td>
//       <td style={{ verticalAlign: "top", textAlign: "center" }}>
//         <strong className="my-0 ml-2">
//         {formatNumberToCurrency(wareHouseInventoryHistories?.beforePreallocate)}
//         </strong>
//       </td>
//       <td style={{ verticalAlign: "top", textAlign: "center" }}>
//         <strong className="my-0 ml-2">
//           {formatNumberToCurrency(wareHouseInventoryHistories?.amountIn)}
//         </strong>
//       </td>
//       <td style={{ verticalAlign: "top", textAlign: "center" }}>
//         <strong className="my-0 ml-2">
//           {formatNumberToCurrency(wareHouseInventoryHistories?.amountOut)}
//         </strong>
//       </td>
//       <td style={{ verticalAlign: "top", textAlign: "center" }}>
//         <strong className="my-0 ml-2">
//           {formatNumberToCurrency(wareHouseInventoryHistories?.after)}
//         </strong>
//       </td>
//       <td style={{ verticalAlign: "top", textAlign: "center" }}>
//         <strong className="my-0 ml-2">
//         {formatNumberToCurrency(wareHouseInventoryHistories?.afterPreallocate)}
//         </strong>
//       </td>
//       <td style={{ verticalAlign: "top", textAlign: "center" }}>
//         {wareHouseInventoryHistories?.warehouseName}
//       </td>
//     </tr>
//   );
// };

// export default WareHouseInventoryHistoriesRow;
