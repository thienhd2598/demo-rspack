import React, {
  memo,
  useMemo,
  useEffect,
  useState,
} from "react";
import { useQuery } from "@apollo/client";
import Pagination from "../../../../components/Pagination";
import { useHistory, useLocation } from "react-router-dom";
import queryString from "querystring";
// import WarehouseBillHistoryRow from "./WarehouseBillHistoryRow";
import { ACTOR_HISTORY_TRANSACTION, TAB_HISTORY_STATUS, TYPE_HISTORY_TRANSACTION } from "../WarehouseBillsUIHelper";
import query_warehouse_inventory_transactions from "../../../../graphql/query_warehouse_inventory_transactions";
import ModalCombo from "../../Products/products-list/dialog/ModalCombo";
import WarehouseBillHistoryCount from "./WarehouseBillHistoryCount";
import _, { repeat } from "lodash";
import { useIntl } from "react-intl";
import query_warehouseInventoryHistories from '../../../../graphql/query_warehouseInventoryHistories'
import dayjs from "dayjs";
// import WareHouseInventoryHistoriesRow from "./WareHouseInventoryHistoriesRow";
import Table from 'rc-table';
import 'rc-table/assets/index.css';
import { Link } from 'react-router-dom'
import InfoProduct from "../../../../components/InfoProduct";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { formatNumberToCurrency } from "../../../../utils";
import { toAbsoluteUrl } from "../../../../_metronic/_helpers";

const WarehouseBillHistoryTable = ({ defaultWarehouse, tabPage, whereCondition }) => {
  const { formatMessage } = useIntl();
  const params = queryString.parse(useLocation().search.slice(1, 100000));
  const history = useHistory();
  const [dataCombo, setDataCombo] = useState(null);

  const page = useMemo(() => {
    try {
      let _page = Number(params.page);
      if (!Number.isNaN(_page)) {
        return Math.max(1, _page);
      } else {
        return 1;
      }
    } catch (error) {
      return 1;
    }
  }, [params.page]);

  const limit = useMemo(() => {
    try {
      let _value = Number(params.limit);
      if (!Number.isNaN(_value)) {
        return Math.max(25, _value);
      } else {
        return 25;
      }
    } catch (error) {
      return 25;
    }
  }, [params.limit]);

  const { data, loading, error, refetch } = useQuery(
    query_warehouse_inventory_transactions,
    {
      variables: {
        limit,
        offset: (page - 1) * limit,
        where: whereCondition,
      },
      skip: tabPage !== 'actions',
      fetchPolicy: "cache-and-network",
    }
  );

  let [ltCreateTime, gtCreateTime] = [
    dayjs().startOf('day').subtract(7, 'day').unix(),
    dayjs().endOf('day').subtract(1, 'day').unix(),
  ];

  const q = useMemo(
    () => {
      try {
        if (!params?.q) return ''

        return params?.q
      } catch (error) {
        return {}
      }
    }, [params?.q]
  );
  const type = useMemo(
    () => {
      try {
        if (!params?.q) return ''
        if (!params?.search_type) return 'sku'

        return params?.search_type
      } catch (error) {
        return {}
      }
    }, [params?.search_type]
  );
  const warehouse = useMemo(
    () => {
      try {
        if (!params?.warehouseId) return defaultWarehouse?.id;

        return params?.warehouseId
      } catch (error) {
        return {}
      }
    }, [params?.warehouseId]
  );
  let whereCondition_tab_goods = useMemo(
    () => {
      return {
        from: +params?.gt || ltCreateTime,
        to: +params?.lt || gtCreateTime,
        page: page,
        pageSize: limit,
        searchText: q,
        searchType: type,
        smeWarehouseId: +warehouse
      }
    }, [q, page, limit, type, warehouse, params?.gt, params?.lt]
  );
  const { data: data2, loading: loadingGoods, error: errorGoods, refetch: refetchGoods } = useQuery(
    query_warehouseInventoryHistories,
    {
      variables: {
        inputWarehouseInventoryHistories: {
          ...whereCondition_tab_goods
        }
      },
      skip: tabPage !== 'goods',
      fetchPolicy: "cache-and-network",
    }
  );

  const totolRecordTabGoods = data2?.warehouseInventoryHistories?.data?.pagination.total
  const totalPageTabGoods = data2?.warehouseInventoryHistories?.data?.pagination.totalPage
  const pageSize = data2?.warehouseInventoryHistories?.data?.pagination.pageSize
  let totalRecord =
    data?.warehouse_inventory_transactions_aggregate?.aggregate?.count || 0;
  let totalPage = Math.ceil(totalRecord / limit);

  const linkProduct = (item) => {
    if (item?.variantName) {
      return `/products/stocks/detail/${item?.variantId}`;
    } else {
      return `/products/edit/${item?.productId}`;
    }
  };

  const linkProductTabAction = (item) => {
    if (item?.is_combo == 1) {
      return `/products/edit-combo/${item?.product_id}`;
    }
    if (item?.attributes?.length > 0) {
      return `/products/stocks/detail/${item?.id}`;
    } else {
      return `/products/edit/${item?.product_id}`;
    }
  };

  const dataTableTabGoods = useMemo(() => {
    return data2?.warehouseInventoryHistories?.data?.items?.map(item => {

      return {
        sku_product: {
          sku: item?.sku,
          variantId: item?.variantId,
          productId: item?.productId,
          variantName: item?.variantName,
        },
        product: {
          logo: item?.logo,
          variantId: item?.variantId,
          productId: item?.productId,
          variantName: item?.variantName,
          name: item?.name,
        },
        before_actual: item?.before,
        before_preallocate: item?.beforePreallocate,
        amountIn: item?.amountIn,
        amountOut: item?.amountOut,
        after_actual: item?.after,
        after_preallocate: item?.afterPreallocate,
        warehouse: item?.warehouseName,
        variantUnit: item?.unit,
      }
    })
  }, [data2])

  const coulumTableGoods = [
    {
      title: formatMessage({ defaultMessage: 'SKU hàng hóa' }),
      dataIndex: 'sku_product',
      key: 'sku_product',
      width: 190,
      fixed: 'left',
      render: (item) => {
        return (
          <div>
            <Link style={{ color: 'black' }} to={() => linkProduct(item)} target="_blank">
              <InfoProduct sku={item?.sku} />
            </Link>
          </div>
        )
      }
    },
    {
      title: formatMessage({ defaultMessage: 'Tên hàng hóa' }),
      dataIndex: 'product',
      key: 'product',
      width: 190,
      fixed: 'left',
      render: (item) => {
        return (
          <div className="d-flex">
            <OverlayTrigger
              overlay={
                <Tooltip title="#1234443241434">
                  <div
                    style={{
                      backgroundColor: "#F7F7FA",
                      width: 160,
                      height: 160,
                      borderRadius: 4,
                      overflow: "hidden",
                      minWidth: 160,
                    }}
                    className="mr-2"
                  >
                    <Link style={{ color: 'black' }} to={() => linkProduct(item)} target="_blank">
                      {item?.logo && (
                        <img
                          src={item?.logo}
                          style={{
                            width: 160,
                            height: 160,
                            objectFit: "contain",
                            cursor: "pointer",
                          }}
                        />
                      )}
                    </Link>
                  </div>
                </Tooltip>
              }
            >
              <Link style={{ color: 'black' }} to={() => linkProduct(item)} target="_blank">
                {item?.logo && (
                  <img
                    src={item?.logo}
                    style={{ width: 20, height: 20, objectFit: "contain" }}
                  />
                )}
              </Link>
            </OverlayTrigger>
            <div className="ml-2">
              <div className="d-flex">
                <InfoProduct
                  isSingle
                  name={item?.name}
                  url={() => linkProduct(item)}
                />
              </div>
              {!!item?.variantName && (
                <span className="text-secondary-custom mt-2">
                  {item?.variantName}
                </span>
              )}
            </div>
          </div>
        )
      }
    },
    {
      title: formatMessage({ defaultMessage: 'ĐVT' }),
      dataIndex: 'variantUnit',
      key: 'variantUnit',
      align: 'center',
      width: 120,
      render: (item) => {
        return (
          <span>
            {item || '--'}
          </span>
        )
      }
    },
    {
      title: formatMessage({ defaultMessage: 'Đầu kỳ' }),
      key: 'before',
      align: 'center',
      children: [
        {
          title: formatMessage({ defaultMessage: 'Tồn thực tế' }),
          dataIndex: 'before_actual',
          key: 'before_actual',
          width: 90,
          align: 'center',
          render(item) {
            return <strong className="my-0 ml-2">
              {formatNumberToCurrency(item)}
            </strong>
          },
        },
        {
          title: formatMessage({ defaultMessage: 'Tạm ứng' }),
          dataIndex: 'before_preallocate',
          key: 'before_preallocate',
          align: 'center',
          width: 90,
          render: (item) => {
            return (
              <strong className="my-0 ml-2">
                {formatNumberToCurrency(item)}
              </strong>
            )
          }
        },]
    },
    {
      title: formatMessage({ defaultMessage: 'Nhập' }),
      dataIndex: 'amountIn',
      key: 'amountIn',
      align: 'center',
      width: 90,
      render: (item) => {
        return (
          <strong className="my-0 ml-2">
            {formatNumberToCurrency(item)}
          </strong>
        )
      }
    },
    {
      title: formatMessage({ defaultMessage: 'Xuất' }),
      dataIndex: 'amountOut',
      key: 'amountOut',
      align: 'center',
      width: 90,
      render: (item) => {
        return (
          <strong className="my-0 ml-2">
            {formatNumberToCurrency(item)}
          </strong>
        )
      }
    },
    {
      title: formatMessage({ defaultMessage: 'Cuối kỳ' }),
      key: 'after',
      align: 'center',
      children: [
        {
          title: formatMessage({ defaultMessage: 'Tồn thực tế' }),
          dataIndex: 'after_actual',
          key: 'after_actual',
          width: 90,
          align: 'center',
          render(item) {
            return <strong className="my-0 ml-2">
              {formatNumberToCurrency(item)}
            </strong>
          },
        },
        {
          title: formatMessage({ defaultMessage: 'Tạm ứng' }),
          dataIndex: 'after_preallocate',
          key: 'after_preallocate',
          align: 'center',
          width: 100,
          render: (item) => {
            return (
              <strong className="my-0 ml-2">
                {formatNumberToCurrency(item)}
              </strong>
            )
          }
        },]
    },
    {
      title: formatMessage({ defaultMessage: 'Kho' }),
      dataIndex: 'warehouse',
      key: 'warehouse',
      align: 'center',
      width: 100,
      render: (item) => {
        return (
          <div>{item}</div>
        )
      }
    },
  ]

  console.log('data', data)
  const dataTableTabActions = useMemo(() => {
    return data?.warehouse_inventory_transactions?.map(item => {
      return {
        sku_product: item?.variant,
        product: item?.variant,
        type: item?.target,
        amountChange: {
          after: item?.after,
          before: item?.before,
          amount: item?.amount,
        },
        before: item?.before,
        after: item?.after,
        warehouse: item?.warehouse.name,
        type_product: item?.type,
        actor: item?.actor,
        code: item?.actor_ref_code,
        info_product: {
          order_code: item?.order_code,
          bill_order_code: item?.warehouseBill?.order_code,
          actor_ref: item?.actor_ref,
          shipping_code: item?.warehouseBill?.shipping_code,
          order_tracking_number: item?.order_tracking_number
        },
        time: item?.created_at,
        variantUnit: item?.variant?.unit
      }
    })
  }, [data])

  const coulumTableActions = [
    {
      title: formatMessage({ defaultMessage: 'SKU hàng hóa' }),
      dataIndex: 'sku_product',
      key: 'sku_product',
      width: 230,
      fixed: 'left',
      render: (item) => {
        return (
          <div style={{ verticalAlign: 'top' }}>
            <Link style={{ color: "black" }} to={() => linkProductTabAction(item)} target="_blank">
              <InfoProduct sku={item?.sku} />
            </Link>
          </div>
        )
      }
    },
    {
      title: formatMessage({ defaultMessage: 'Tên hàng hóa' }),
      dataIndex: 'product',
      key: 'product',
      width: 230,
      fixed: 'left',
      render: (item) => {
        return (
          <div className="d-flex">
            <OverlayTrigger
              overlay={
                <Tooltip title="#1234443241434">
                  <div
                    style={{
                      backgroundColor: "#F7F7FA",
                      width: 160,
                      height: 160,
                      borderRadius: 4,
                      overflow: "hidden",
                      minWidth: 160,
                    }}
                    className="mr-2"
                  >
                    {item?.sme_catalog_product_variant_assets[0]?.asset_url && (
                      <img
                        src={
                          item?.sme_catalog_product_variant_assets[0]?.asset_url
                        }
                        style={{
                          width: 160,
                          height: 160,
                          objectFit: "contain",
                          cursor: "pointer",
                        }}
                        alt=""
                      />
                    )}
                  </div>
                </Tooltip>
              }
            >
              <Link to={() => linkProductTabAction(item)} target="_blank">
                {item?.sme_catalog_product_variant_assets[0]?.asset_url && (
                  <img
                    src={
                      item?.sme_catalog_product_variant_assets[0]?.asset_url
                    }
                    style={{ width: 20, height: 20, objectFit: "contain" }}
                  />
                )}
              </Link>
            </OverlayTrigger>
            <div className="ml-2">
              <div className="d-flex">
                <InfoProduct
                  name={
                    item?.sme_catalog_product?.name
                  }
                  isSingle
                  url={() => linkProductTabAction(item)}
                  setDataCombo={setDataCombo}
                  combo_items={item?.combo_items}
                />
              </div>
              {!!item?.attributes?.length > 0 && (
                <span className="text-secondary-custom mt-2">
                  {item?.name?.replaceAll(
                    " + ",
                    " - "
                  )}
                </span>
              )}
            </div>
          </div>
        )
      }
    },
    {
      title: formatMessage({ defaultMessage: 'ĐVT' }),
      dataIndex: 'variantUnit',
      key: 'variantUnit',
      align: 'center',
      width: 120,
      render: (item) => {
        return (
          <span>
            {item || '--'}
          </span>
        )
      }
    },
    {
      title: formatMessage({ defaultMessage: 'Loại tồn' }),
      dataIndex: 'type',
      key: 'type',
      align: 'center',
      width: 120,
      render: (item) => {
        return (
          <span>
            {_.find(
              TAB_HISTORY_STATUS,
              (_tab) => _tab?.status == item
            )?.title || "--"}
          </span>
        )
      }
    },
    {
      title: formatMessage({ defaultMessage: 'Thay đổi' }),
      dataIndex: 'amountChange',
      key: 'amountChange',
      align: 'center',
      width: 100,
      render: (item) => {
        return (
          <div>
            <strong
              className={
                item?.after - item?.before >= 0
                  ? "text-success"
                  : "text-danger"
              }
            >
              {item?.after - item?.before > 0 && (
                <span>+</span>
              )}
              <span>{formatNumberToCurrency(item?.amount)}</span>
            </strong>
          </div>
        )
      }
    },
    {
      title: formatMessage({ defaultMessage: 'Trước' }),
      dataIndex: 'before',
      key: 'before',
      align: 'center',
      width: 100,
      render: (item) => {
        return (
          <strong className="my-0 ml-2">
            {formatNumberToCurrency(item)}
          </strong>
        )
      }
    },
    {
      title: formatMessage({ defaultMessage: 'Sau' }),
      dataIndex: 'after',
      key: 'after',
      align: 'center',
      width: 100,
      render: (item) => {
        return (
          <strong className="my-0 ml-2">
            {formatNumberToCurrency(item)}
          </strong>
        )
      }
    },
    {
      title: formatMessage({ defaultMessage: 'Kho' }),
      dataIndex: 'warehouse',
      key: 'warehouse',
      align: 'center',
      width: 120,
      render: (item) => {
        return (
          <div>{item}</div>
        )
      }
    },
    {
      title: formatMessage({ defaultMessage: 'Loại' }),
      dataIndex: 'type_product',
      key: 'type_product',
      align: 'center',
      width: 120,
      render: (item) => {
        return (
          <span className="my-0">
            {_.find(
              TYPE_HISTORY_TRANSACTION,
              (_type) => _type?.value === item
            )?.label || "--"}
          </span>
        )
      }
    },
    {
      title: formatMessage({ defaultMessage: 'Phát sinh từ	' }),
      dataIndex: 'actor',
      key: 'actor',
      align: 'center',
      width: 100,
      render: (item) => {
        return (
          <span className="my-0">
            {_.find(
              ACTOR_HISTORY_TRANSACTION,
              (_actor) => _actor?.value === item
            )?.label || "--"}
          </span>
        )
      }
    },
    {
      title: formatMessage({ defaultMessage: 'Mã phiếu' }),
      dataIndex: 'code',
      key: 'code',
      width: 120,
      render: (item) => {
        return (
          <span className="my-0">
            {item || '--'}
          </span>
        )
      }
    },
    {
      title: formatMessage({ defaultMessage: 'Thông tin' }),
      dataIndex: 'info_product',
      key: 'info_product',
      width: 150,
      render: (item) => {
        return (
          <div className="d-flex flex-column">
            {(!!item?.bill_order_code ||
              !!item?.order_code) && (
                <>
                  <span className="text-secondary-custom">
                    {formatMessage({ defaultMessage: "Mã đơn hàng" })}:
                  </span>
                  <Link to={`/orders/${item.actor_ref}`} target="_blank">
                    <span style={{ color: '#FF5629' }} className="my-0">
                      {item?.bill_order_code ||
                        item?.order_code}
                    </span>
                  </Link>

                </>
              )}
            {(!!item?.shipping_code ||
              !!item?.order_tracking_number) && (
                <>
                  <span className="text-secondary-custom mt-2">
                    {formatMessage({ defaultMessage: "Mã vận đơn" })}:
                  </span>
                  <Link to={`/orders/${item.actor_ref}`} target="_blank">
                    <span style={{ color: '#FF5629' }} className="my-0">
                      {item?.shipping_code ||
                        item?.order_tracking_number}
                    </span>
                  </Link>
                </>
              )}
          </div>
        )
      }
    },
    {
      title: formatMessage({ defaultMessage: 'Thời gian' }),
      dataIndex: 'time',
      key: 'time',
      width: 120,
      render: (item) => {
        return (
          <div
            className="d-flex flex-column"
            style={{ whiteSpace: "pre-wrap", verticalAlign: 'top' }}
          >
            {dayjs(item).format(
              "DD/MM/YYYY[\n]HH:mm"
            )}
          </div>
        )
      }
    },
  ]


  return (
    <>

      {tabPage == "actions" && (
        <div
          className="d-flex w-100 mt-8"
          style={{ background: "#fff", zIndex: 1, borderBottom: 'none' }}
        >
          <div style={{ flex: 1 }}>
            <ul className="nav nav-tabs" id="myTab" role="tablist">
              {TAB_HISTORY_STATUS.map((_tab, index) => {
                const { title, status } = _tab;
                const isActive = status == (params?.status || "");
                return (
                  <li
                    key={`tab-order-${index}`}
                    className={`nav-item ${isActive ? "active" : ""}`}
                  >
                    <a
                      className={`nav-link font-weight-normal ${isActive ? "active" : ""
                        }`}
                      style={{ fontSize: "13px" }}
                      onClick={() => {
                        history.push(
                          `/products/warehouse-bill/history?${queryString.stringify(
                            {
                              ...params,
                              page: 1,
                              status: status,
                            }
                          )}`
                        );
                      }}
                    >
                      {title} (
                      <WarehouseBillHistoryCount
                        whereCondition={_.omit({
                          ...whereCondition,
                          ...(status
                            ? {
                              target: {
                                _eq: status,
                              },
                            }
                            : {
                              target: {},
                            }),
                        })}
                      />
                      )
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
      {(loading || loadingGoods) && (
        <div
          className="text-center w-100 mt-10"
          style={{ position: "absolute" }}
        >
          <span className="spinner spinner-primary"></span>
        </div>
      )}
      {(!!error || !!errorGoods) && (!loading || !loadingGoods) ? (
        <div
          className="w-100 text-center mt-8"
          style={{ position: "absolute" }}
        >
          <div className="d-flex flex-column justify-content-center align-items-center">
            <i
              className="far fa-times-circle text-danger"
              style={{ fontSize: 48, marginBottom: 8 }}
            ></i>
            <p className="mb-6">
              {formatMessage({
                defaultMessage: "Xảy ra lỗi trong quá trình tải dữ liệu",
              })}
            </p>
            <button
              className="btn btn-primary btn-elevate"
              style={{ width: 100 }}
              onClick={(e) => {
                e.preventDefault();

                if (tabPage === 'goods') {
                  refetchGoods();
                } else {
                  refetch();
                }
              }}
            >
              {formatMessage({ defaultMessage: "Tải lại" })}
            </button>
          </div>
        </div>
      ) : (
        <Table
          style={(loadingGoods || loading) ? { opacity: 0.4 } : {}}
          className="upbase-table"
          columns={tabPage == 'goods' ? coulumTableGoods : coulumTableActions}
          data={tabPage == 'goods' ? dataTableTabGoods : dataTableTabActions}
          emptyText={<div className='d-flex flex-column align-items-center justify-content-center my-10'>
            <img src={toAbsoluteUrl("/media/empty.png")} alt="" width={80} />
            <span className='mt-4'>{formatMessage({ defaultMessage: 'Chưa có lịch sử thay đổi tồn' })}</span>
          </div>}
          tableLayout="auto"
          sticky={{ offsetHeader: 44 }}
          scroll={{ x: tabPage == 'goods' ? 1600 : 2000 }}
        />
      )}


      {!error && !loading && tabPage == 'actions' && (
        <Pagination
          page={page}
          totalPage={totalPage}
          loading={loading}
          limit={limit}
          totalRecord={totalRecord}
          count={data?.warehouse_inventory_transactions?.length}
          basePath={`/products/warehouse-bill/history`}
          emptyTitle=''
        />
      )}
      {!errorGoods && !loadingGoods && tabPage == 'goods' && (
        <Pagination
          page={page}
          totalPage={totalPageTabGoods}
          loading={loadingGoods}
          limit={limit}
          totalRecord={totolRecordTabGoods}
          count={data2?.warehouseInventoryHistories?.data
            ?.items?.length}
          basePath={"/products/warehouse-bill/history"}
          emptyTitle=''
        />
      )}
      <ModalCombo dataCombo={dataCombo} onHide={() => setDataCombo(null)} />

    </>
  );
};

export default memo(WarehouseBillHistoryTable);
