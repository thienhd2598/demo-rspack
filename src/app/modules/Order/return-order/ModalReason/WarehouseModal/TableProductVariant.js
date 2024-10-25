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
  method,
  orderItems,
  loading,
  returnOrder,
  removeProductVariant,
  lengthReturnItem
}) => {
  const {formatMessage} = useIntl()
  return (
    
    <>
      <div className="warning__title mb-2 d-flex align-items-center">
        <img className="mr-2" src={toAbsoluteUrl("/media/war.png")}></img>
        <span className="text-danger fs-14">
          {formatMessage({defaultMessage: 'Chú ý: Khi đã xử lý nhập kho, thì không thể hủy nhập kho cho đơn hàng hoàn.'})}
        </span>
      </div>
      {loading ? (
        <div
          className="skeleton-box col-12 mb-2"
          style={{
            borderRadius: 4,
            padding: 10,
            cursor: "pointer",
            fontSize: "14px",
            height: lengthReturnItem == 1 ? "180px" : "300px",
          }}
        ></div>
      ) : (
        <table
          style={{
            display: "block",
            height: orderItems?.length == 1 ? "max-content" : "400px",
            overflowY: "auto",
            border: "1px solid #d9d9d9",
            width: "100%",
          }}
          className={`${orderItems?.length > 1 && 'scrollbar'} w-100 table table-borderless table-vertical-center fixed`}
        >
          <thead
            style={{
              position: "sticky",
              zIndex: 75,
              top: 0,
              fontWeight: "bold",
              fontSize: "13px",
              background: "rgb(243, 246, 249)",
              width: "100%",
              borderBottom: "1px solid gray",
            }}
          >
            <tr className="font-size-lg">
              <th className="fs-14" width="35%">
              {formatMessage({defaultMessage: 'Hàng hóa sàn'})}
              </th>
              <th className="fs-14" width="25%">
              {formatMessage({defaultMessage: 'Hàng hóa kho'})}
              </th>
              <th className="fs-14 text-center" width="20%">
              {formatMessage({defaultMessage: 'Số lượng'})}{" "}
                <span className="ml-1">
                  <OverlayTrigger
                    overlay={
                      <Tooltip>
                        {formatMessage({defaultMessage: 'Số lượng hàng hoá kho đã liên kết đơn với hàng hoá sàn của đơn hoàn đó'})}
                      </Tooltip>
                    }
                  >
                    <i className="fas fa-info-circle fs-14"></i>
                  </OverlayTrigger>
                </span>
              </th>
              <th className="fs-14 text-center" width="20%">
              {formatMessage({defaultMessage: 'Số lượng nhập kho'})}
              </th>
            </tr>
          </thead>
          <tbody>
            <>
              <InformationLine
                dataStore={dataStore}
                returnOrder={returnOrder}
              />
              {orderItems?.map((item, index) => (
                <>
                  <ProductVariantRow
                    getProductVariant={getProductVariant}
                    method={method}
                    setGetProductVariant={setGetProductVariant}
                    keyVariant={index}
                    order={item}
                    returnOrder={returnOrder}
                    removeProductVariant={removeProductVariant}
                  />
                </>
              ))}
            </>
          </tbody>
        </table>
      )}
    </>
  );
};

export default memo(TableProductVariant);