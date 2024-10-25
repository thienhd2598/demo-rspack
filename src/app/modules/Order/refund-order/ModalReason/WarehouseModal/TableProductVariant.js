import React, { memo } from "react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { toAbsoluteUrl } from "../../../../../../_metronic/_helpers";
import InformationLine from "./InformationLine";
import ProductVariantRow from "./ProductVariantRow";
import "../../utils/index.scss";
import { useIntl } from "react-intl";

const TableProductVariant = ({
  getProductVariant,
  setGetProductVariant,
  dataStore,
  orderItems,
  returnOrder,
  removeProductVariant,
}) => {
  const { formatMessage } = useIntl()
  console.log('dataStore', dataStore)
  return (
    <>
      <div className="warning__title mb-2 d-flex align-items-center">
        <img className="mr-2" src={toAbsoluteUrl("/media/war.png")} alt=""></img>
        <span className="text-danger fs-14">
          {formatMessage({ defaultMessage: 'Chú ý: Khi đã xử lý nhập kho, thì không thể hủy nhập kho cho đơn hàng hoàn.' })}
        </span>
      </div>
        <table style={{ maxHeight: orderItems?.length == 1 ? "max-content" : "420px", overflowY: "auto",border: "1px solid #d9d9d9",width: "100%",}} className={`${orderItems?.length > 1 && 'scrollbar'} w-100 table table-borderless table-vertical-center fixed`}>
          <thead style={{background: 'white', position: "sticky", zIndex: 75, top: 0,fontWeight: "bold", fontSize: "13px", width: "100%", borderBottom: "1px solid gray"}}>
            <tr className="font-size-lg">
              <th className="fs-14" width="25%">{formatMessage({ defaultMessage: 'Hàng hóa sàn' })}</th>
              <th className="fs-14" width="25%">{formatMessage({ defaultMessage: 'Hàng hóa kho' })}</th>
              <th className="fs-14 text-center" width="10%">{formatMessage({ defaultMessage: 'ĐVT' })}</th>
              <th className="fs-14 text-center" width="10%">{formatMessage({ defaultMessage: 'Trạng thái' })}</th>
              <th className="fs-14 text-center" width="15%">
                {formatMessage({ defaultMessage: 'Số lượng nhập kho' })}{" "}
                <span className="ml-1">
                  <OverlayTrigger overlay={<Tooltip>{formatMessage({ defaultMessage: 'Số lượng hàng hoá kho đã liên kết đơn với hàng hoá sàn của đơn hoàn đó' })}</Tooltip>}>
                    <i className="fas fa-info-circle fs-14"></i>
                  </OverlayTrigger>
                </span>
              </th>
              <th className="fs-14 text-center" width="15%">{formatMessage({ defaultMessage: 'Thao tác' })}</th>
            </tr>
          </thead>
          <tbody>
            <>
              <InformationLine dataStore={dataStore} returnOrder={returnOrder}/>
              {orderItems?.map((item, index) => (
                <>
                  <ProductVariantRow
                    getProductVariant={getProductVariant}
                    setGetProductVariant={setGetProductVariant}
                    keyVariant={index}
                    order={item}
                    removeProductVariant={removeProductVariant}
                  />
                </>
              ))}
            </>
          </tbody>
        </table>
    </>
  );
};

export default memo(TableProductVariant);