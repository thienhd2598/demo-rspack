import React, { memo, useState } from "react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { toAbsoluteUrl } from "../../../../../_metronic/_helpers";
import ModalCombo from "../../../Products/products-list/dialog/ModalCombo";
import OrderSelectProductVariant from "../../dialog/OrderSelectProductVariant";
import InformationLine from "./InformationLine";
import ProductVariantRow from "./ProductVariantRow";
import { useIntl } from "react-intl";
const TableProductVariant = ({ dataStore, orderItems, loading, order, setOrderItemVariant, orderItemVariant, dataChannels }) => {
  const [dataCombo, setDataCombo] = useState(null);
  const [scCurrentVariantSku, setScCurrentVariantSku] = useState(null);
  const [currentOrderItemId, setCurrentOrderItemId] = useState(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [indexOrderItem, setIndexOrderItem] = useState(false);
  const [smeVariantIdMapped, setSmeVariantIdMapped] = useState(null);

  const { formatMessage } = useIntl()
  return (
    <>
      <div className="warning__title mb-2 d-flex align-items-center">
        <img
          className="mr-2"
          src={toAbsoluteUrl("/media/war.png")}
        ></img>
        <span className="text-danger fs-14">
          {formatMessage({ defaultMessage: 'Chú ý: Khi đã xử lý nhập kho, thì không thể hủy nhập kho cho đơn hàng huỷ bất thường' })}
        </span>
      </div>
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
              background: 'rgb(243, 246, 249)',
              borderBottom: "1px solid gray",
            }}
          >
            <tr className="font-size-lg">
              {order?.source != 'manual' && <th className="fs-14" width="30%">
                {formatMessage({ defaultMessage: 'Hàng hóa sàn' })}
              </th>}
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
            {loading && <div className='text-center w-100 mt-10' style={{ position: 'absolute', minHeight: 100 }} >
              <span className="spinner spinner-primary"></span>
            </div>}
            {!loading && (
              <>
                <InformationLine
                  order={order}
                  dataStore={dataStore}
                  dataChannels={dataChannels}
                />
                {orderItems?.map((item, index) => <>
                  <ProductVariantRow
                    order={order}
                    orderItem={item}
                    indexOrderItem={index}
                    setDataCombo={setDataCombo}
                    onSetVariant={(sku, orderItemId) => {
                      setShowConnectModal(true)
                      setScCurrentVariantSku(sku)
                      setCurrentOrderItemId(orderItemId)
                    }}
                    setOrderItemVariant={setOrderItemVariant}
                    orderItemVariant={orderItemVariant}
                  />
                </>)}
              </>
            )}
          </tbody>

        </table>
      </div>
      <ModalCombo
        dataCombo={dataCombo}
        onHide={() => setDataCombo(null)}
      />
      <OrderSelectProductVariant
        show={showConnectModal}
        onHide={() => {
          setScCurrentVariantSku(null);
          setCurrentOrderItemId(null);
          setShowConnectModal(false);
        }}
        scVariantSku={scCurrentVariantSku}
        order_item_id={currentOrderItemId}
        setOrderItemVariant={setOrderItemVariant}
        orderItemVariant={orderItemVariant}
        indexOrderItem={indexOrderItem}
      />
    </>
  );
}

export default memo(TableProductVariant);