import React, { memo } from "react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { toAbsoluteUrl } from "../../../../../_metronic/_helpers";
import InformationLine from "./InformationLine";
import ProductVariantRow from "./ProductVariantRow";
// import "../../utils/index.scss";
import { useIntl } from "react-intl";
const TableProductVariant = ({
  getProductVariant,
  setGetProductVariant,
  dataStore,
  dataChannels,
  orderItems,
  loading,
  returnOrder,
  removeProductVariant,
}) => {
  const { formatMessage } = useIntl()
  return (
    <div style={{ display: 'block', maxHeight: '420px', overflowY: 'auto' }} className="scrollbar">
      <table
        style={{ border: "1px solid #d9d9d9", width: '100%' }}
        className=" w-100 table table-borderless table-vertical-center fixed"
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
           {returnOrder?.source != 'manual' && <th className="fs-14" width="30%">
                {formatMessage({ defaultMessage: 'Hàng hóa sàn' })}
              </th>}
            <th className="fs-14" width="30%">
              {formatMessage({ defaultMessage: 'Hàng hóa kho' })}
            </th>
            <th className="fs-14 text-center" width="15">
              {formatMessage({ defaultMessage: 'ĐVT' })}
            </th>
            <th className="fs-14 text-center" width="15%">{formatMessage({ defaultMessage: 'Trạng thái' })}</th>
            <th className="fs-14 text-center" width="10%">
              {formatMessage({ defaultMessage: 'Số lượng nhập kho' })}
            </th>
          </tr>
        </thead>
        <tbody>
          {loading && <div className='text-center w-100 mt-10' style={{ position: 'absolute', minHeight: 100 }} >
            <span className="spinner spinner-primary"></span>
          </div>}
          {!loading && (
            <>
              <InformationLine
                dataStore={dataStore}
                dataChannels={dataChannels}
                returnOrder={returnOrder}
              />
              {orderItems?.map((item, index) => (
                <>
                  <ProductVariantRow
                    getProductVariant={getProductVariant}
                    setGetProductVariant={setGetProductVariant}
                    keyVariant={index}
                    order={item}
                    returnOrder={returnOrder}
                    removeProductVariant={removeProductVariant}
                  />
                </>
              ))}
            </>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default memo(TableProductVariant);