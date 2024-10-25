import { gql, useMutation, useQuery } from "@apollo/client";
import React, { memo, useMemo, useCallback, Fragment } from "react";
import mutate_coRetryWarehouse from "../../../../graphql/mutate_coRetryWarehouse";
import WarningTwoToneIcon from "@material-ui/icons/WarningTwoTone";
import CheckCircleOutlineTwoToneIcon from '@material-ui/icons/CheckCircleOutlineTwoTone';
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { useToasts } from "react-toast-notifications";
import InfoProduct from "../../../../components/InfoProduct";
import OrderComboVariant from "./OrderComboVariant";
import query_sme_catalog_product_variant_by_pk from "../../../../graphql/query_sme_catalog_product_variant_by_pk";
import mutate_coDeleteItemGiftOrder from "../../../../graphql/mutate_coDeleteItemGiftOrder";
import { useIntl } from 'react-intl';
import AuthorizationWrapper from "../../../../components/AuthorizationWrapper";
const query_sc_product_variant = gql`
  query sc_product_variant($ref_id: String, $ref_product_id: String) {
    sc_product_variant(ref_id: $ref_id, ref_product_id: $ref_product_id) {
      id
      name
      sku
      sc_product_attributes_value
      sme_product_variant_id
      product {
        id
        name
        store_id
        connector_channel_code
        variantAttributeValues {
          scVariantValueAssets {
            id
            sme_url
          }
          value
          id
          position
          sc_variant_attribute_id
          sme_variant_attribute_value_id
          ref_index
        }

        productAssets {
          position
          sme_url
        }

        productVariantAttributes {
          id
          name
          sme_variant_attribute_id
          values
          ref_index
          sc_attribute_id
          position
        }
      }
    }
  }
`;

const PACK_STATUS_DISABLE_DISCONNECT = [
  "packed",
  "packing",
  "shipping",
  "shipped",
  "completed",
  "cancelled",
  "other"
];

const [STEP_ALLOCATED, STEP_EXPORT_WAREHOUSE, STEP_NONE] = [1, 2, 8];

const OrderDetailConnectRow = memo(
  ({
    infoStatusOr,
    provider,
    key,
    order,
    isOrderManual,
    onSetVariant,
    onUnLink,
    onSetCombo,
    status,
    refetch,
    smeWarehouseOrder
  }) => {
    const { formatMessage } = useIntl()
    const { addToast } = useToasts();
    const { loading: loadingScProductVariant, data: dataScProductVariant } = useQuery(query_sc_product_variant, {
      variables: {
        ref_id: order?.ref_variant_id,
        ref_product_id: order?.ref_product_id,
      },
      fetchPolicy: "network-only",
    });

    const { loading: loadingSmeProductVariant, data: dataSmeProductVariant, } = useQuery(query_sme_catalog_product_variant_by_pk, {
      variables: { id: order?.sme_variant_id },
      fetchPolicy: "network-only",
      skip: !order?.sme_variant_id
    });

    const [deleteOrder, { loading: loadingDeleteOrder }] = useMutation(
      mutate_coDeleteItemGiftOrder,
      {
        awaitRefetchQueries: true,
        refetchQueries: ['findOrderDetail']
      }
    );

    const selectInventoryData = useMemo(() => {
      return dataSmeProductVariant?.sme_catalog_product_variant_by_pk?.inventories?.find(iv => iv?.sme_store_id == smeWarehouseOrder?.id)
    }, [dataSmeProductVariant, smeWarehouseOrder])

    const linkProduct = useMemo(
      () => {
        if (dataSmeProductVariant?.sme_catalog_product_variant_by_pk?.sme_catalog_product?.is_combo == 1) {
          return `/products/edit-combo/${dataSmeProductVariant?.sme_catalog_product_variant_by_pk?.sme_catalog_product?.id}`
        }
        if (dataSmeProductVariant?.sme_catalog_product_variant_by_pk?.attributes?.length > 0) {
          return `/products/stocks/detail/${dataSmeProductVariant?.sme_catalog_product_variant_by_pk?.id}`
        } else {
          return `/products/edit/${dataSmeProductVariant?.sme_catalog_product_variant_by_pk?.sme_catalog_product?.id}`
        }
      }, [dataSmeProductVariant]
    );

    const disabledAction = useMemo(() => {
      return PACK_STATUS_DISABLE_DISCONNECT.includes(status) || order?.is_old_order || (infoStatusOr?.status && infoStatusOr?.status != 'error') || (!order?.pack_status && !!order?.provider_or_id);
    }, [status, order?.is_old_order, isOrderManual]);

    const orderSteps = useMemo(
      () => {
        if (!order) return [];
        const stepOrder = Number(order?.warehouse_step);
        // Case none
        if (stepOrder == STEP_NONE) {
          return []
        }

        // Step 1
        if (stepOrder == STEP_ALLOCATED) {
          if (order?.warehouse_error_code === "E000") {
            return [{
              id: 1,
              name: formatMessage({ defaultMessage: 'Tạm giữ' }),
              isError: false,
              mssError: null
            }];
          } else {
            return [{
              id: 1,
              name: formatMessage({ defaultMessage: 'Tạm giữ' }),
              isError: true,
              mssError: order?.warehouse_error_message
            }];
          }
        }

        // Step 2
        if (stepOrder == STEP_EXPORT_WAREHOUSE) {
          if (order?.warehouse_error_code === "E000") {
            return [
              { id: 1, name: formatMessage({ defaultMessage: 'Tạm giữ' }), isError: false, mssError: null },
              { id: 2, name: formatMessage({ defaultMessage: 'Xuất kho' }), isError: false, mssError: null },
            ];
          } else {
            return [
              { id: 1, name: formatMessage({ defaultMessage: 'Tạm giữ' }), isError: false, mssError: null },
              { id: 2, name: formatMessage({ defaultMessage: 'Xuất kho' }), isError: true, mssError: order?.warehouse_error_message },
            ];
          }
        }

        if (!!stepOrder && stepOrder != STEP_EXPORT_WAREHOUSE && stepOrder != STEP_ALLOCATED) {
          return [
            { id: 1, name: 'Tạm giữ', isError: false, mssError: null },
            { id: 2, name: 'Xuất kho', isError: false, mssError: null },
          ];
        }


      }, [order?.warehouse_error_code, order?.warehouse_error_message, order?.warehouse_step, STEP_ALLOCATED, STEP_EXPORT_WAREHOUSE]
    );

    const [retryWarehouse, { loading: loadingRetryWarehouse }] = useMutation(mutate_coRetryWarehouse, {
      awaitRefetchQueries: true,
      refetchQueries: ['findOrderDetail']
    });

    const onRetryWarehouse = useCallback(
      async () => {
        try {
          const { data } = await retryWarehouse({
            variables: {
              order_item_id: order?.id,
            }
          });

          if (!!data?.coRetryWarehouseAction.success) {
            addToast(formatMessage({ defaultMessage: "Load lại dữ liệu thành công" }), { appearance: "success" });
          } else {
            addToast(`${data?.coRetryWarehouseAction?.message || formatMessage({ defaultMessage: 'Load lại dữ liệu thất bại' })}`, { appearance: "error" });
          }
        } catch (err) {
          addToast(formatMessage({ defaultMessage: "Load lại dữ liệu thất bại" }), { appearance: "error" });
        }
      }, [order?.id]
    );
    console.log()
    const buildVariantCombo = useMemo(() => {
      return (
        <>
          <tr>
            <td
              className={isOrderManual ? "d-flex flex-column" : ""}
              style={{ verticalAlign: "top", border: 'none', alignItems: 'flex-start' }}
            >
              {!!order?.is_gift && <span style={{ display: 'inline-block', width: 'auto', padding: '4px', border: '1px solid #FF0000', borderRadius: '4px', color: '#FF0000' }}>Quà tặng</span>}
              {isOrderManual && <div className="mb-2">
                <InfoProduct
                  name={dataSmeProductVariant?.sme_catalog_product_variant_by_pk?.sme_catalog_product?.name}
                  isSingle={true}
                  url={linkProduct}
                  productOrder={false}
                />
              </div>}
              <div className="d-flex align-items-center">
                <div onClick={() => {
                  window.open(linkProduct, "_blank");
                }}>
                  <InfoProduct
                    name={''}
                    sku={dataSmeProductVariant?.sme_catalog_product_variant_by_pk?.sku}
                  />
                </div>
                <span
                  style={{ cursor: "pointer" }}
                  onClick={() => onSetCombo(dataSmeProductVariant?.sme_catalog_product_variant_by_pk?.sme_catalog_product?.combo_items)}
                  className="ml-4 text-primary"
                >
                  Combo
                </span>
              </div>
            </td>
            <td style={{ borderBottom: 'none' }} />
            <td style={{ borderBottom: 'none' }} />
            {!provider && <td style={{ borderBottom: 'none' }} />}
            {/* ref_product_id null thì sẽ là hàng hóa sàn */}
            <AuthorizationWrapper keys={['order_detail_product_connect_to_order']}>
              {!order?.is_old_order && !!order?.show_unlink && (
                <td className="text-center" style={{ borderBottom: 'none' }}>
                  <a style={{ fontSize: 14, color: "#ff5629", cursor: "pointer", }}
                    onClick={(e) => {
                      e.preventDefault();
                      onUnLink(order?.id);
                    }}
                  >
                    Ngắt liên kết đơn
                  </a>
                </td>
              )}
            </AuthorizationWrapper>
            {/* Quà tặng từ kho thì mới hiển thị button xóa order?.is_gift && order?.ref_product_id == null*/}
            {!order?.is_old_order && !!order?.show_remove_gift && (
              <td className="text-center" style={{ borderBottom: 'none' }}>
                <a style={{ fontSize: 14, color: "#ff5629", cursor: "pointer", }}
                  onClick={async (e) => {
                    e.preventDefault();                    
                    try {
                      let res = await deleteOrder({
                        variables: {
                          list_item_id: [order?.id],
                          order_id: order?.order_id
                        },
                      });
                      let deleteOrderStatus = res?.data?.coDeleteItemGiftOrder;
                      if (deleteOrderStatus?.success) {
                        addToast(formatMessage({ defaultMessage: 'Xóa quà tặng thành công' }), { appearance: 'success' })
                      } else {
                        addToast(deleteOrderStatus?.message || formatMessage({ defaultMessage: 'Xóa quà tặng thất bại' }), { appearance: 'error' })
                      }
                    } catch (error) {
                      alert('Có lỗi xảy ra! Vui lòng thử lại.');
                    }
                  }}
                >
                  Xóa
                </a>
              </td>
            )}
          </tr>
          {order?.comboItems?.map((_combo, index) => {
            return <OrderComboVariant
              key={`combo-order-item-${index}`}
              disabledAction={disabledAction}
              combo={_combo}
              isOldOrder={order?.is_old_order}
              isOrderManual={isOrderManual}
              provider={provider}
              order_item_id={order?.id}
              order={order}
              status={status}
              infoStatusOr={infoStatusOr}
              deleteOrder={deleteOrder}
              sme_variant_id={_combo?.sme_variant_id}
              smeWarehouseOrder={smeWarehouseOrder}
              onChangeConnect={(sku, combo_item_id) => {
                const lstExist = order?.comboItems
                  ?.filter(item => item?.id != _combo?.id)
                  ?.map(item => item?.sme_variant_id);

                onSetVariant(sku, combo_item_id, _combo?.id, lstExist)
              }}
              is_gift={order?.is_gift && order?.ref_product_id == null}
            />;
          })}
        </>
      )
    }, [order, dataSmeProductVariant, disabledAction, linkProduct, status, infoStatusOr]
    );

    const linkVariant = useMemo(() => {
      let url = "";
      if (dataSmeProductVariant?.sme_catalog_product_variant_by_pk?.is_combo) {
        url = `/products/edit-combo/${dataSmeProductVariant?.sme_catalog_product_variant_by_pk?.sme_catalog_product?.id}`;
      } else if (dataSmeProductVariant?.sme_catalog_product_variant_by_pk?.attributes?.length > 0) {
        url = `/products/stocks/detail/${dataSmeProductVariant?.sme_catalog_product_variant_by_pk?.id}`;
      } else {
        url = `/products/edit/${dataSmeProductVariant?.sme_catalog_product_variant_by_pk?.sme_catalog_product?.id}`;
      }

      return url
    }, [dataSmeProductVariant]);

    return (
      <>
        <tr key={key} style={{ borderBottom: "1px solid #D9D9D9" }}>
          {!isOrderManual && <td
            rowSpan={!loadingSmeProductVariant && !loadingScProductVariant && order?.is_combo ? order?.comboItems?.length + 2 : 1}
            className="pt-2 pb-1"
            style={{ verticalAlign: "top", borderBottom: 'none', borderLeft: 'none' }}
          >
            {!(order?.is_gift && order?.ref_product_id == null) && <div style={{ verticalAlign: "top", display: "flex", flexDirection: "row", marginBottom: 16, }}>
              <div style={{ backgroundColor: "#F7F7FA", width: 64, height: 64, borderRadius: 8, overflow: "hidden", minWidth: 64, cursor: "pointer" }}
                onClick={(e) => {
                  e.preventDefault();
                }}
                className="mr-6"
              >
                {<img src={order?.variant_image || ""} style={{ width: 64, height: 64, objectFit: "contain" }} />}
              </div>
              <div className="w-100">
                <InfoProduct
                  name={order?.product_name}
                  sku={order?.variant_sku}
                  url={`/product-stores/edit/${order?.sc_product_id}`}
                />
                {!!order?.variant_name && <div>{order?.variant_name || ""}</div>}
              </div>
            </div>}
          </td>}
          {loadingScProductVariant || loadingSmeProductVariant ? (
            <td colSpan={5}>
              <div style={{ minHeight: 50 }}>
                <span className="spinner spinner-primary" />
              </div>
            </td>
          ) : (
            <>
              {order?.sme_variant_id ? (
                <Fragment>
                  {!order?.is_combo ? (
                    <>
                      <td style={{ verticalAlign: "top" }} className="pt-2 pb-1">
                        <div style={{ verticalAlign: "top", display: "flex", flexDirection: "row" }} className="mb-4">
                          <div
                            style={{ backgroundColor: "#F7F7FA", width: 64, height: 64, borderRadius: 8, overflow: "hidden", minWidth: 64, cursor: "pointer", }}
                            onClick={(e) => {
                              e.preventDefault();
                              window.open(linkProduct, "_blank");
                            }}
                            className="mr-6"
                          >
                            {!!dataSmeProductVariant?.sme_catalog_product_variant_by_pk?.sme_catalog_product_variant_assets?.[0]?.asset_url ? (
                              <img
                                src={dataSmeProductVariant?.sme_catalog_product_variant_by_pk?.sme_catalog_product_variant_assets?.[0]?.asset_url}
                                style={{ width: 64, height: 64, objectFit: "contain" }}
                              />
                            ) : null}
                          </div>
                          <div>
                            <div className="d-flex" style={{ flexDirection: 'column', alignItems: 'baseline' }}>
                              {!!order?.is_gift && <span style={{ display: 'inline-block', width: 'auto', padding: '4px', border: '1px solid #FF0000', borderRadius: '4px', color: '#FF0000' }}>Quà tặng</span>}
                              <InfoProduct
                                name={isOrderManual ? dataSmeProductVariant?.sme_catalog_product_variant_by_pk?.sme_catalog_product?.name : ''}
                                url={linkVariant}
                                sku={dataSmeProductVariant?.sme_catalog_product_variant_by_pk?.sku}
                                productOrder={false}
                              />
                              {dataSmeProductVariant?.sme_catalog_product_variant_by_pk?.sme_catalog_product?.is_combo == 1 && (
                                <span
                                  className="text-primary cursor-pointer ml-2"
                                  onClick={() => onSetCombo(dataSmeProductVariant?.sme_catalog_product_variant_by_pk?.sme_catalog_product?.combo_items)}
                                >
                                  Combo
                                </span>
                              )}
                            </div>
                            {dataSmeProductVariant?.sme_catalog_product_variant_by_pk?.attributes?.length > 0 && (
                              <p className="font-weight-normal my-1 text-secondary-custom fs-12">
                                {dataSmeProductVariant?.sme_catalog_product_variant_by_pk?.name?.replaceAll(" + ", " - ")}
                              </p>
                            )}
                            <p className="font-weight-normal mb-1 text-secondary-custom fs-12">
                              {formatMessage({ defaultMessage: 'Sẵn sàng bán' })}:{" "}
                              {(selectInventoryData?.stock_available) || 0}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td
                        style={{ verticalAlign: "top" }}
                        className="pt-2 pb-1 text-center"
                      >
                        {dataSmeProductVariant?.sme_catalog_product_variant_by_pk?.unit || '--'}
                      </td>
                      <td
                        style={{ verticalAlign: "top" }}
                        className="pt-2 pb-1 text-center"
                      >
                        {order?.quantity_purchased || 0}
                      </td>
                      {!provider && (
                        <td style={{ verticalAlign: "top" }} className="pt-2 pb-1">
                          <div className="d-flex flex-column align-items-center">
                            <ul className='order-step-wrapper'>
                              {orderSteps?.map(_order => {
                                const isActivePoint = _order?.id == 2 || (_order?.id == 1 && _order?.isError)
                                return (
                                  <li className={`order-step ${isActivePoint ? 'active' : ''}`} key={`order-step-${_order?.id}`}>
                                    <div className='order-step-block d-flex flex-column gap-4'>
                                      <div className="d-flex align-items-center">
                                        <span className='order-step-title'>{`${_order?.name}: ${_order?.isError ? 0 : order?.quantity_purchased}`}</span>
                                        {_order?.isError ? <OverlayTrigger
                                          overlay={
                                            <Tooltip>
                                              <span>{_order?.mssError}</span>
                                            </Tooltip>
                                          }
                                        >
                                          <WarningTwoToneIcon
                                            className="ml-2"
                                            style={{ color: "#ff5629" }}
                                          />
                                        </OverlayTrigger> : <CheckCircleOutlineTwoToneIcon
                                          className="ml-2"
                                          style={{ color: "#00e676" }}
                                        />}
                                      </div>
                                      {/* {!!_order?.isError && (
                                      <>
                                        {loadingRetryWarehouse && <span className="spinner spinner-primary mt-4" />}
                                        {!loadingRetryWarehouse && (
                                          <span
                                            className="text-primary mt-2"
                                            onClick={onRetryWarehouse}
                                            style={{
                                              cursor: "pointer",
                                              display: "flex",
                                              flexDirection: "column",
                                            }}
                                          >
                                            {formatMessage({ defaultMessage: 'Thử lại' })}
                                          </span>
                                        )}
                                      </>
                                    )} */}
                                    </div>
                                  </li>
                                )
                              })}
                            </ul>
                          </div>
                        </td>
                      )}
                      <AuthorizationWrapper keys={['order_detail_product_connect_to_order']}>
                        {!order?.is_old_order && !!order?.show_unlink &&
                          <td bstyle={{ verticalAlign: "top" }} className="pt-2 pb-1 text-center">
                            <a style={{ fontSize: 14, color: "#ff5629", cursor: "pointer" }}
                              onClick={(e) => {
                                e.preventDefault();
                                onUnLink(order?.id);
                              }}
                            >
                              {formatMessage({ defaultMessage: 'Ngắt liên kết đơn' })}
                            </a>
                          </td>}
                      </AuthorizationWrapper>
                      <AuthorizationWrapper keys={['order_detail_add_gift']}>
                        {!order?.is_old_order && !!order?.show_remove_gift &&
                          <td bstyle={{ verticalAlign: "top" }} className="pt-2 pb-1 text-center">
                            <a style={{ fontSize: 14, color: "#ff5629", cursor: "pointer", }}
                              onClick={async (e) => {
                                e.preventDefault();
                                try {
                                  let res = await deleteOrder({
                                    variables: {
                                      list_item_id: [order?.id],
                                      order_id: order?.order_id
                                    },
                                  });
                                  let deleteOrderStatus = res?.data?.coDeleteItemGiftOrder;
                                  if (deleteOrderStatus?.success) {
                                    addToast(formatMessage({ defaultMessage: 'Xóa quà tặng thành công' }), { appearance: 'success' })
                                  } else {
                                    addToast(deleteOrderStatus?.message || formatMessage({ defaultMessage: 'Xóa quà tặng thất bại' }), { appearance: 'error' })
                                  }
                                } catch (error) {
                                  alert('Có lỗi xảy ra! Vui lòng thử lại.');
                                }
                              }}
                            >
                              {formatMessage({ defaultMessage: 'Xóa' })}
                            </a>
                          </td>}
                      </AuthorizationWrapper>
                    </>
                  ) : <></>}
                </Fragment>
              ) : (
                <>
                  {!order?.is_old_order && !!order?.show_link && <AuthorizationWrapper keys={['order_detail_product_connect_to_order']}>
                    <td colSpan={5}>
                      <a style={{ fontSize: 14, color: "#ff5629", cursor: "pointer" }}
                        onClick={(e) => {
                          e.preventDefault();
                          onSetVariant(order?.variant_sku, order?.id);
                        }}
                      >
                        {formatMessage({ defaultMessage: 'Liên kết đơn' })}
                      </a>
                    </td>
                  </AuthorizationWrapper>}
                  {/* <td></td>
                <td></td>
                <td></td> */}
                </>
              )}
            </>
          )
          }
        </tr >
        {!loadingSmeProductVariant && !loadingScProductVariant && order?.sme_variant_id && !!order?.is_combo ? (
          <>
            {buildVariantCombo}
          </>
        ) : <></>}
      </>
    );
  }
);

export default OrderDetailConnectRow;
