// React bootstrap table next =>
// DOCS: https://react-bootstrap-table.github.io/react-bootstrap-table2/docs/
// STORYBOOK: https://react-bootstrap-table.github.io/react-bootstrap-table2/storybook/index.html
import React, { useEffect, useMemo, useRef, useState } from "react";
import * as uiHelpers from "../ProductsUIHelpers";
import { Checkbox } from "../../../../_metronic/_partials/controls";
import { useMutation, useQuery } from "@apollo/client";
import ProductRow from './ProductRow'
import Pagination from '../../../../components/Pagination'
import ModalInventoryExport from './components/ModalInventoryExport'
import { useHistory, useLocation } from "react-router-dom";
import queryString from 'querystring'
import { useProductsUIContext } from "../ProductsUIContext";
import { Dropdown, OverlayTrigger, Tooltip } from "react-bootstrap";
import query_sc_stores_basic from "../../../../graphql/query_sc_stores_basic";
import { useCallback } from "react";
import { sum, uniqWith } from 'lodash';
import query_sme_catalog_inventories from "../../../../graphql/query_sme_catalog_inventories";
import SVG from "react-inlinesvg";
import query_sme_catalog_inventory_items from "../../../../graphql/query_sme_catalog_inventory_items";
import { formatNumberToCurrency } from "../../../../utils";
import query_sme_catalog_inventories_count from "../../../../graphql/query_sme_catalog_inventories_count";
import query_sme_catalog_inventories_count2 from "../../../../graphql/query_sme_catalog_inventories_count2";
import query_sme_catalog_product_variant_aggregate_sum from "../../../../graphql/query_sme_catalog_product_variant_aggregate_sum";
import query_sme_catalog_inventory_items_aggregate from "../../../../graphql/query_sme_catalog_inventory_items_aggregate";
import query_sme_catalog_inventory_items_aggregate2 from "../../../../graphql/query_sme_catalog_inventory_items_aggregate2";
import query_sme_catalog_inventories_sum_value from "../../../../graphql/query_sme_catalog_inventories_sum_value";
import query_getScProductVariantLinked from "../../../../graphql/query_getScProductVariantLinked";
import mutate_ScUpdateManualProductVariantInventory from "../../../../graphql/mutate_ScUpdateManualProductVariantInventory";
import client from "../../../../apollo";
import ModalCombo from "../products-list/dialog/ModalCombo";
import ModalProductConnectVariant from "../products-list/dialog/ModalProductConnectVariant";
import Select from "react-select";
import { useToasts } from "react-toast-notifications";
import { HomeOutlined, AddShoppingCartOutlined, AssignmentTurnedInOutlined, LocalShippingOutlined, WarningTwoTone, HistoryRounded, ChevronRightOutlined, LayersOutlined } from "@material-ui/icons";
import { useIntl } from "react-intl";
import Table from 'rc-table';
import 'rc-table/assets/index.css'
import { toAbsoluteUrl } from "../../../../_metronic/_helpers";
import { Link } from 'react-router-dom'
import InfoProduct from "../../../../components/InfoProduct";
import InfoTicketDialog from "./dialog/InfoTicketDialog";
import DetailsVariantUnit from "./dialog/DetailsVariantUnit";
import LoadingDialog from "../../ProductsStore/product-new/LoadingDialog";
import AuthorizationWrapper from "../../../../components/AuthorizationWrapper";
export function ProductsTable({ showUpdatePrice, showUpdateStockWarning, onDelete, onHide, onShow, onCreateMutilTag }) {
  const params = queryString.parse(useLocation().search.slice(1, 100000))
  const { ids, setIds } = useProductsUIContext();
  const history = useHistory()
  const [count, setCount] = useState(null)
  const [dataCombo, setDataCombo] = useState(null);
  const [currentProductVariantLinked, setCurrentProductVariantLinked] = useState(null);
  const [sort, setSort] = useState('desc_nulls_last');
  const [openModalInventory, setOpenModalInventory] = useState(false)
  const { addToast } = useToasts();
  const [currentSku, setCurrentSku] = useState(null);
  const [currentSmeWarehouse, setCurrentSmeWarehouse] = useState(null);
  const [openDetailVariantUnit, setOpenDetailVariantUnit] = useState(false);
  const [variblesGetUnit, setVariblesGetUnit] = useState({});
  const [totalCount, setTotalCount] = useState([]);
  const { formatMessage } = useIntl()
  console.log({ids})
  useMemo(
    () => {
      setSort(params?.sort ?? 'desc_nulls_last')
    }, [params?.sort]
  );

  let page = useMemo(() => {
    try {
      let _page = Number(params.page)
      if (!Number.isNaN(_page)) {
        return Math.max(1, _page)
      } else {
        return 1
      }
    } catch (error) {
      return 1
    }
  }, [params.page])
  let limit = useMemo(() => {
    try {
      let _value = Number(params.limit)
      if (!Number.isNaN(_value)) {
        return Math.max(25, _value)
      } else {
        return 25
      }
    } catch (error) {
      return 25
    }
  }, [params.limit]);
  let type = useMemo(() => {
    if (!params.type) {
      return {}
    }
    if (params.type == 'near_out_stock') {
      return { is_near_out_stock: { _eq: 1 } }
    }
    if (params.type == 'out_stock') {
      return { is_out_stock: { _eq: 1 } }
    }
    if (params.type == 'stocking') {
      return { is_out_stock: { _eq: 0 } }
    }
    if (params.type == 'stock_preallocate') {
      return { stock_preallocate: { _gt: 0 } }
    }
    return {}
  }, [params.type]);

  let type_stock_actual_sum = useMemo(() => {
    if (!params.type) {
      return {}
    }
    if (params.type == 'near_out_stock') {
      return 'near_out_stock'
    }
    if (params.type == 'out_stock') {
      return 'out_stock'
    }
    if (params.type == 'stocking') {
      return 'stocking'
    }
    if (params.type == 'stock_preallocate') {
      return 'preallocate'
    }
    return {}
  }, [params.type]);

  const optionOrderBy = [
    {
      value: 'stock_actual',
      label: formatMessage({ defaultMessage: 'Tồn thực tế' })
    }
  ]

  const [orderBy, setOrderBy] = useState(optionOrderBy[0]);

  useMemo(
    () => {
      setOrderBy(optionOrderBy.find(element => element.value == params?.order_by) ?? optionOrderBy[0])
    }, [params?.order_by]
  );

  const typeProduct = useMemo(() => {
    if (!!params?.typeProduct) {
      if (['is_multi_unit', 'manual'].includes(params?.typeProduct)) {
        return { variant: { is_combo: { _eq: 0 }, is_multi_unit: { _eq: params?.typeProduct == 'is_multi_unit' ? 1 : 0 } } }
      } else {
        return { variant: { is_combo: { _eq: params?.typeProduct == 'combo' ? 1 : 0 } } }
      }
    }
  }, [params?.typeProduct])

  const whereCondition = useMemo(() => {
    setIds([])
    return {
      ...(!!params.name ? {
        ...type,
        _or: [
          { variant: { sme_catalog_product: { name: { _ilike: `%${params.name.trim()}%` } } } },
          { variant: { sku: { _ilike: `%${params.name.trim()}%` } } },          
          // { sme_catalog_product_variants: { sku_clear_text: { _iregex: encodeURI(params.name.trim()).replace(/%/g, '') } } }
        ],
      } : type),
      ...{...typeProduct,
        variant: {
          ...typeProduct?.variant,
          product_status_id: { 
            _is_null: !params?.status
          },
          ...((!!params?.status && !!params?.products_status) ? {  product_status_id: { _eq: params.products_status  } }  : {})
        }},
    }
  }, [params?.name, type, typeProduct, params?.page, params?.status, params?.products_status])

  let whereConditionInventoryItems = useMemo(() => {
      setIds([])
      return {
        ...whereCondition,
        ...(!!params?.warehouseid ? {
          sme_store_id: { _eq: +params?.warehouseid }
        } : {}),
      }
    }, [whereCondition, params?.warehouseid]
  );

  let orderByInventories = useMemo(() => {
    return {
      stock_actual: sort,
      variant_id: sort
    }
  }, [sort])

  const { data: itemInventory, loading, error, refetch } = useQuery(query_sme_catalog_inventory_items, {
    variables: {
      limit,
      offset: (page - 1) * limit,
      where: whereConditionInventoryItems,
      order_by: orderByInventories
    },
    fetchPolicy: 'no-cache',
  });

  const querySum = useMemo(() => {
    return {
      sumInventory: query_sme_catalog_inventory_items_aggregate,
      sumInventory_stock_actual: query_sme_catalog_inventory_items_aggregate2
    }
  }, [params?.warehouseid])


  // const { data: dataLinked } = useQuery(query_getScProductVariantLinked, {
  //   variables: {
  //     list_sme_variant_id: itemInventory?.sme_catalog_inventory_items?.map(__ => __.variant_id)
  //   },
  //   fetchPolicy: 'network-only',
  //   skip: !itemInventory || !itemInventory?.sme_catalog_inventory_item || itemInventory?.sme_catalog_inventory_items?.length == 0
  // })

  const { data: dataSumprice, loading: loadingSumprice } = useQuery(query_sme_catalog_product_variant_aggregate_sum, {
    variables: {
      where: {
        ...(!!params.name ? {
          ...type,
          _or: [
            { sme_catalog_product: { name_clear_text: { _iregex: encodeURI(params.name.trim()).replace(/%/g, '') } } },
            { sku_clear_text: { _iregex: encodeURI(params.name.trim()).replace(/%/g, '') } },
          ],
        } : type),
        // ...has_sc_product_linking,
      },
    }
  })



  useEffect(() => {
    try {
      Promise.all([
        client.query({
          query: querySum.sumInventory,
          fetchPolicy: 'network-only',
          variables: {
            "where": {
              ...(!!params.name ? {
                variant: { product_status_id: { 
                  _is_null: !params?.status ? true : false,
                } } ,
                _or: [
                  { variant: { sme_catalog_product: { name: { _ilike: `%${params.name.trim()}%` } } } },
                  { variant: { sku: { _ilike: `%${params.name.trim()}%` } } },
                  // { sme_catalog_product_variants: { sku_clear_text: { _iregex: encodeURI(params.name.trim()).replace(/%/g, '') } } }
                ],
              } : {} ),
              ...{...typeProduct,
                variant: {
                  ...typeProduct?.variant,
                  product_status_id: { 
                    _is_null: !params?.status
                  },
                  ...((!!params?.status && !!params?.products_status) ? {  product_status_id: { _eq: params.products_status  } }  : {})
                }},
              ...(!!params?.warehouseid ? {
                sme_store_id: { _eq: +params?.warehouseid }
              } : {}),
            }
          }
        }),
        client.query({
          query: querySum.sumInventory,
          fetchPolicy: 'network-only',
          variables: {
            "where": {
              ...(!!params.name ? {
                ...{ is_near_out_stock: { _eq: 1 } },
                variant: { product_status_id: { 
                  _is_null: !params?.status ? true : false,
                } },
                _or: [
                  { variant: { sme_catalog_product: { name: { _ilike: `%${params.name.trim()}%` } } } },
                  { variant: { sku: { _ilike: `%${params.name.trim()}%` } } },
                  // { sme_catalog_product_variants: { sku_clear_text: { _iregex: encodeURI(params.name.trim()).replace(/%/g, '') } } }
                ],
              } : { ...{is_near_out_stock: { _eq: 1 } }
            }),
            ...{...typeProduct,
              variant: {
                ...typeProduct?.variant,
                product_status_id: { 
                  _is_null: !params?.status
                },
                ...((!!params?.status && !!params?.products_status) ? {  product_status_id: { _eq: params.products_status  } }  : {})
              }},
              ...(!!params?.warehouseid ? {
                sme_store_id: { _eq: +params?.warehouseid }
              } : {}),
            }
          }
        }),
        client.query({
          query: querySum.sumInventory,
          fetchPolicy: 'network-only',
          variables: {
            "where": {
              ...(!!params.name ? {
                ...{ is_out_stock: { _eq: 1 } },
                variant: { product_status_id: { 
                  _is_null: !params?.status ? true : false,
                } },
                _or: [
                  { variant: { sme_catalog_product: { name: { _ilike: `%${params.name.trim()}%` } } } },
                  { variant: { sku: { _ilike: `%${params.name.trim()}%` } } },
                  // { sme_catalog_product_variants: { sku_clear_text: { _iregex: encodeURI(params.name.trim()).replace(/%/g, '') } } }
                ],
              } : { ...{is_out_stock: { _eq: 1 }},}),
              ...{...typeProduct,
                variant: {
                  ...typeProduct?.variant,
                  product_status_id: { 
                    _is_null: !params?.status
                  },
                  ...((!!params?.status && !!params?.products_status) ? {  product_status_id: { _eq: params.products_status  } }  : {})
                }},
              ...(!!params?.warehouseid ? {
                sme_store_id: { _eq: +params?.warehouseid }
              } : {}),
            }
          }
        }),
        client.query({
          query: querySum.sumInventory_stock_actual,
          fetchPolicy: 'network-only',
          variables: {
            "where": {
              ...(!!params.name ? {
                ...type,
                variant: { product_status_id: { 
                  _is_null: !params?.status ? true : false,
                } },
                _or: [
                  { variant: { sme_catalog_product: { name: { _ilike: `%${params.name.trim()}%` } } } },
                  { variant: { sku: { _ilike: `%${params.name.trim()}%` } } },
                  // { sme_catalog_product_variants: { sku_clear_text: { _iregex: encodeURI(params.name.trim()).replace(/%/g, '') } } }
                ],
              } : type
              ),
              ...{...typeProduct,
                variant: {
                  ...typeProduct?.variant,
                  product_status_id: { 
                    _is_null: !params?.status
                  },
                  ...((!!params?.status && !!params?.products_status) ? {  product_status_id: { _eq: params.products_status  } }  : {})
                }},
              ...(!!params?.warehouseid ? {
                sme_store_id: { _eq: +params?.warehouseid }
              } : {}),
            },
          }
        }),
        client.query({
          query: query_sme_catalog_inventories_sum_value,
          fetchPolicy: 'network-only',
          variables: {
            ...(!!params?.warehouseid ? {
              wareshouseId: +params?.warehouseid
            } : {}),
            ...(!!params?.name ? {
              searchText: encodeURI(params.name.trim()).replace(/%/g, ''),
            } : {}),
            ...(!!params?.type ? {
              status: type_stock_actual_sum
            } : {}),
            ...(!!params?.status ? {
              is_product_status: 1
            } : {}),
            ...(!!params?.products_status ? {
              product_status_id: +params?.products_status
            } : {}),
            ...(!!params?.typeProduct ? {
              type: params?.typeProduct == 'manual' ? 'normal' : (params?.typeProduct == 'is_multi_unit' ? 'multi_unit' : params?.typeProduct)
            } : {}),
          }
        }),

        client.query({
          query: query_sme_catalog_inventories_sum_value,
          fetchPolicy: 'network-only',
          variables: {
            ...(!!params?.warehouseid ? {
              wareshouseId: +params?.warehouseid
            } : {}),
            ...(!!params?.name ? {
              searchText: encodeURI(params.name.trim()).replace(/%/g, ''),
            } : {}),
            ...(!!params?.type ? {
              status: type_stock_actual_sum
            } : {}),
            ...(!!params?.products_status ? {
              product_status_id: +params?.products_status
            } : {}),
            ...(!!params?.status ? {
              is_product_status: 1
            } : {}),
            ...(!!params?.typeProduct ? {
              type: params?.typeProduct == 'manual' ? 'normal' : (params?.typeProduct == 'is_multi_unit' ? 'multi_unit' : params?.typeProduct)
            } : {}),
          }
        }),

        client.query({
          query: querySum.sumInventory,
          fetchPolicy: 'network-only',
          variables: {
            "where": {
              ...(!!params.name ? {
                ...{ stock_preallocate: { _gt: 0 } },
                variant: { product_status_id: { 
                  _is_null: !params?.status ? true : false,
                } },
                _or: [
                  { variant: { sme_catalog_product: { name: { _ilike: `%${params.name.trim()}%` } } } },
                  { variant: { sku: { _ilike: `%${params.name.trim()}%` } } },

                  // { sme_catalog_product_variants: { sku_clear_text: { _iregex: encodeURI(params.name.trim()).replace(/%/g, '') } } }
                ],
              } : { ...{stock_preallocate: { _gt: 0 }}}),
              ...{...typeProduct,
                variant: {
                  ...typeProduct?.variant,
                  product_status_id: { 
                    _is_null: !params?.status
                  },
                  ...((!!params?.status && !!params?.products_status) ? {  product_status_id: { _eq: params.products_status  } }  : {})
                }},
              ...(!!params?.warehouseid ? {
                sme_store_id: { _eq: +params?.warehouseid }
              } : {}),
            }
          }
        }),
      ]).then(res => {
        setCount({
          all: res[0].data?.sme_catalog_inventory_items_aggregate?.aggregate?.count,
          nearOutStock: res[1].data?.sme_catalog_inventory_items_aggregate?.aggregate?.count,
          outStock: res[2].data?.sme_catalog_inventory_items_aggregate?.aggregate?.count,
          total: res[3].data?.sme_catalog_inventory_items_aggregate?.aggregate,
          sumAvailable: res[4].data.inventorySumValuActual?.sum_price,
          sumSum: res[5].data.inventorySumValuActual?.sum_stock,
          countStockPreallocate: res[6].data?.sme_catalog_inventory_items_aggregate?.aggregate?.count,
        })
      })
    } catch (error) {
   
    }
  }, [params?.warehouseid, params.name, type, params.type, params?.typeProduct, params?.status, params?.products_status])

  let totalRecord = (count?.total?.count || 0) 
  let totalPage = Math.ceil(totalRecord / limit)
  // const isSelectAll = ids.length > 0 && ids.length == data?.sme_catalog_inventories?.length;

  const isSelectAll = ids.length > 0 && ids.filter(x => {
    return itemInventory?.sme_catalog_inventory_items?.filter(id => id?.sme_store_id == x.sme_store_id)?.some(pro => pro?.variant?.id === x?.variant?.id);
  })?.length == itemInventory?.sme_catalog_inventory_items?.length;

  const _attributes = (product) => {

    let attributes = [];
    if (product?.variant?.attributes && product?.variant?.attributes.length > 0) {
      for (let index = 0; index < product?.variant?.attributes.length; index++) {
        const element = product?.variant?.attributes[index];
        attributes.push(`${element.sme_catalog_product_attribute_value?.name}`);

      }
      return attributes.join(' - ');
    }
    return null
  }

  const columns = [
    {
      title: <div className="d-flex align-items-center">
        <Checkbox
          inputProps={{
            'aria-label': 'checkbox',
          }}
          isSelected={isSelectAll}
          onChange={(e) => {
            if (isSelectAll) {
              setIds(ids.filter(x => {
                return !itemInventory?.sme_catalog_inventory_items?.filter(id => id?.sme_store_id == x.sme_store_id).some(pro => pro?.variant?.id === x?.variant?.id);
              }))
            } else {
              const tempArray = [...ids];
              (itemInventory?.sme_catalog_inventory_items || []).forEach(_pro => {
                if (_pro && !ids.filter(id => id?.sme_store_id == _pro.sme_store_id).some(item => item?.variant?.id === _pro?.variant?.id)) {
                  tempArray.push(_pro);
                }
              })
              setIds(tempArray)
            }
          }}
        />
        <span className="ml-2">SKU</span>
      </div>,
      dataIndex: 'sku',
      key: 'sku',
      align: 'left',
      width: 280,
      fixed: 'left',
      render: (item) => {
        return (
          <div className='d-flex align-items-center'>
            <Checkbox
              inputProps={{
                'aria-label': 'checkbox',
              }}
              isSelected={ids?.filter(id => id?.sme_store_id == item.sme_store_id)?.some(_id => _id.variant_id == item.variant_id)}
              onChange={(e) => {
                if (ids?.filter(id => id?.sme_store_id == item.sme_store_id)?.some(_id => _id.variant_id == item.variant_id)) {
                  setIds(prev => prev.filter(_id => {
                    if (_id?.sme_store_id == item.sme_store_id) {
                      return _id?.variant_id != item?.variant_id
                    }
                    return _id
                  }))
                } else {
                  setIds(prev => prev.concat([item]))
                }
              }}
            />
            <div className='d-flex ml-2'>
              <Link style={{ color: 'black' }} to={`/products/${item?.variant?.is_combo == 1 ? 'edit-combo/' + item.product_id : item?.variant?.attributes?.length > 0 ? 'stocks/detail/' + item?.variant?.id : 'edit/' + item?.product_id}`} target="_blank" >
                <InfoProduct
                  sku={item?.variant?.sku}
                // isSingle
                />
              </Link>

            </div>
          </div>
        )
      }
    },
    {
      title: formatMessage({ defaultMessage: 'Hàng hóa' }),
      dataIndex: 'product',
      key: 'product',
      align: 'left',
      width: 250,
      render: (item) => {
        return (
          <>
            <div className='d-flex align-items-center'>
              <OverlayTrigger
                overlay={
                  <Tooltip title='#1234443241434'>
                    <div style={{
                      backgroundColor: '#F7F7FA',
                      width: 160, height: 160,
                      borderRadius: 4,
                      overflow: 'hidden',
                      minWidth: 160
                    }} className='mr-2' >
                      {
                        !!item?.asset_url && <img src={item?.asset_url}
                          style={{ width: 160, height: 160, objectFit: 'contain' }} />
                      }
                    </div>
                  </Tooltip>
                }
              >
                <Link to={!item?.variant?.attributes?.length > 0 ? `/products/${item?.variant?.is_combo == 1 ? 'edit-combo' : 'edit'}/${item?.product_id}` : `/products/stocks/detail/${item?.variant?.id}`} target="_blank">
                  <div style={{
                    backgroundColor: '#F7F7FA',
                    width: 20, height: 20,
                    borderRadius: 4,
                    overflow: 'hidden',
                    minWidth: 20
                  }} className='mr-2' >
                    {
                      !!item?.asset_url && <img src={item?.asset_url}
                        style={{ width: 20, height: 20, objectFit: 'contain' }} />
                    }
                  </div>
                </Link>
              </OverlayTrigger>
              <div>
                <div className='d-flex'>
                  <InfoProduct
                    name={item?.variant?.sme_catalog_product?.name}
                    isSingle
                    url={!item?.variant?.attributes?.length ? `/products/${item?.is_combo == 1 ? 'edit-combo' : 'edit'}/${item.product_id}` : `/products/stocks/detail/${item?.variant?.id}`}
                  />
                </div>
              </div>
            </div>
            {!!_attributes(item) && <div className='mt-2'><span className='text-secondary-custom font-weight-normal fs-12'>{_attributes(item)}</span></div>}
          </>
        )
      }
    },
    {
      title: formatMessage({ defaultMessage: 'ĐVT' }),
      dataIndex: 'variant_unit',
      key: 'variant_unit',
      align: 'center',
      width: 100,
      render: (item) => {
        return (
          <div>{item || '--'}</div>
        )
      }
    },
    {
      title: formatMessage({ defaultMessage: 'Trạng thái' }),
      dataIndex: 'variant_status',
      key: 'variant_status',
      align: 'center',
      width: 100,
      render: (record) => {
        let typeProducts = "";
        if(params?.status) {
          let words = record?.split(" ")

          for (let i = 0; i < words?.length; i++) {
              typeProducts += words[i][0].toUpperCase();
          }
        }
        return (
          <>
          {!params?.status && <div>Mới</div>}
          {!!params?.status && <div>{typeProducts}</div>}
          </>
        )
      }
    },
    {
      title: formatMessage({ defaultMessage: 'Loại' }),
      dataIndex: 'type',
      key: 'type',
      align: 'center',
      width: 100,
      render: (item, record) => {
        return (
          <div>{!!item?.is_multi_unit ?
            <span onClick={() => {
              setVariblesGetUnit({id: record?.sme_catalog_product_id, name: record?.attributes[0]?.sme_catalog_product_attribute_value?.name})
              setOpenDetailVariantUnit(true)
            }} style={{ cursor: 'pointer', color: "#1F59AF" }}>Nhiều ĐVT</span> :
            item?.is_combo ? <span style={{ color: "#FE5629", cursor: 'pointer'}} onClick={() => setDataCombo(record?.product?.variant?.combo_items)}
            >Combo</span> :
              formatMessage({ defaultMessage: "Thường" })}</div>
        )
      }
    },
    {
      title: <OverlayTrigger
        overlay={
          <Tooltip title='#1234443241434'>
            {formatMessage({ defaultMessage: 'Tồn kho thực tế' })}
          </Tooltip>
        }
      >
        <HomeOutlined />
      </OverlayTrigger>,
      dataIndex: 'stock_actual',
      key: 'stock_actual',
      width: 100,
      align: 'center',
      render: (item) => {
        return <b>{formatNumberToCurrency(item)}</b>
      }
    },
    {
      title: <OverlayTrigger
        overlay={
          <Tooltip title='#1234443241434'>
            {formatMessage({ defaultMessage: 'Tồn kho tạm giữ' })}
          </Tooltip>
        }
      >
        <AddShoppingCartOutlined />
      </OverlayTrigger>,
      dataIndex: 'stock_allocated',
      key: 'stock_allocated',
      width: 100,
      align: 'center',
      render: (item) => {
        return <b>{formatNumberToCurrency(item)}</b>
      }
    },
    {
      title: <OverlayTrigger
        overlay={
          <Tooltip title='#1234443241434'>
            {formatMessage({ defaultMessage: 'Tồn dự trữ' })}
          </Tooltip>
        }
      >
        <SVG style={{ width: 16, height: 16 }} src={toAbsoluteUrl("/media/menu/ic_sp_kho.svg")} />
      </OverlayTrigger>,
      dataIndex: 'stock_reserve',
      key: 'stock_reserve',
      width: 100,
      align: 'center',
      render: (item, record) => {
        return <div className="d-flex align-items-center justify-content-center">
          <b className="mr-2">{formatNumberToCurrency(item)}</b>
          <svg
            onClick={() => {
              setCurrentSku(record?.product?.variant?.sku);
              setCurrentSmeWarehouse({
                name: record?.sku?.sme_store?.name,
                sme_store_id: record?.sku?.sme_store_id
              });
            }}
            xmlns="http://www.w3.org/2000/svg" color="#ff5629" width="18" height="18" fill="currentColor" className="cursor-pointer bi bi-file-earmark-text" viewBox="0 0 16 16"
          >
            <path d="M5.5 7a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5zM5 9.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5z" />
            <path d="M9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.5L9.5 0zm0 1v2A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5z" />
          </svg>
        </div>
      }
    },
    {
      title: <OverlayTrigger
        overlay={
          <Tooltip title='#1234443241434'>
            {formatMessage({ defaultMessage: 'Tồn kho sẵn sàng bán' })}
          </Tooltip>
        }
      >
        <AssignmentTurnedInOutlined />
      </OverlayTrigger>,
      dataIndex: 'stock_available',
      key: 'stock_available',
      width: 100,
      align: 'center',
      render: (item) => {
        return <b>{formatNumberToCurrency(item)}</b>
      }
    },
    {
      title: <OverlayTrigger
        overlay={
          <Tooltip title='#1234443241434'>
            {formatMessage({ defaultMessage: 'Tồn kho đang vận chuyển' })}
          </Tooltip>
        }
      >
        <LocalShippingOutlined />
      </OverlayTrigger>,
      dataIndex: 'stock_shipping',
      key: 'stock_shipping',
      width: 100,
      align: 'center',
      render: (item) => {
        return <b>{formatNumberToCurrency(item)}</b>
      }
    },
    {
      title: <OverlayTrigger
        overlay={
          <Tooltip title='#1234443241434'>
            {formatMessage({ defaultMessage: 'Cảnh báo tồn hàng hóa' })}
          </Tooltip>
        }
      >
        <WarningTwoTone style={{ color: "#ff5629" }} />
      </OverlayTrigger>,
      dataIndex: 'stock_warning',
      key: 'stock_warning',
      width: 100,
      align: 'center',
      render: (item) => {
        return <b>{typeof item == 'number' ? formatNumberToCurrency(item) : '--'}</b>
      }
    },
    {
      title: <div>
        {formatMessage({ defaultMessage: 'Tạm ứng' })}
        <OverlayTrigger
          overlay={
            <Tooltip title='#1234443241434'>
              {formatMessage({ defaultMessage: 'Số lượng tồn kho tạm ứng được sử dụng để đảm bảo có thể xử lý đơn hàng khi tồn thực tế không đủ trong kho' })}
            </Tooltip>
          }
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="ml-2 bi bi-info-circle" viewBox="0 0 16 16">
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
            <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0" />
          </svg>
        </OverlayTrigger>
      </div>,
      dataIndex: 'stock_preallocate',
      key: 'stock_preallocate',
      width: 100,
      align: 'center',
      render: (item) => {
        return <b>{formatNumberToCurrency(item)}</b>
      }
    },
    {
      title: formatMessage({ defaultMessage: 'Giá bán' }),
      dataIndex: 'cost',
      key: 'cost',
      width: 120,
      align: 'center',
      render: (item) => {
        return (
          <OverlayTrigger
            overlay={
              <Tooltip title=''>
                <div className='d-flex flex-column align-items-start'>
                  <p style={{ marginBottom: 1, marginTop: 2 }} ><b> {formatMessage({ defaultMessage: 'Giá bán' })}: {typeof item?.price == 'number' ? formatNumberToCurrency(item?.price) + ' đ' : '--'}</b></p>
                  <p style={{ marginBottom: 1, marginTop: 2 }} >{formatMessage({ defaultMessage: 'Giá bán tối thiểu' })}: {typeof item?.price_minimum == 'number' ? formatNumberToCurrency(item?.price_minimum) + ' đ' : '--'}</p>
                </div>
              </Tooltip>
            }
          >
            <div className='d-flex align-items-center justify-content-center cursor-pointer'>
              <span>{typeof item?.price == 'number' ? formatNumberToCurrency(item?.price) + ' đ' : '--'}</span>
              <ChevronRightOutlined className='ml-2' />
            </div>
          </OverlayTrigger>
        )
      }
    },
    {
      title: formatMessage({ defaultMessage: 'Kho' }),
      dataIndex: 'warehouse',
      key: 'warehouse',
      width: 130,
      align: 'center',
      render: (item) => {
        return item;
      }
    },
  ];

  const dataTable = useMemo(() => {
    return itemInventory?.sme_catalog_inventory_items?.map(product => {
     
      return {
        attributes: product?.variant?.attributes,
        sku: product,
        sme_store_id: product?.sme_store_id,
        main_variant_id: product?.variant?.variant_unit?.main_variant_id,
        product: {
          is_combo: product?.variant?.is_combo,
          asset_url: product?.variant?.sme_catalog_product_variant_assets[0]?.asset_url || '',
          product_id: product?.product_id,
          variant: product?.variant,
          name: product?.variant?.sme_catalog_product?.name,
          comboItem: product?.variant?.combo_items,
        },
        type: {
          is_multi_unit: !!product?.variant?.is_multi_unit,
          is_combo: !!product?.variant?.is_combo
        },
        stock_actual: product?.stock_actual,
        stock_allocated: product?.stock_allocated,
        stock_reserve: product?.stock_reserve,
        sme_catalog_product_id: product?.variant?.sme_catalog_product?.id,
        stock_available: product?.stock_available,
        stock_shipping: product?.stock_shipping,
        stock_warning: product?.variant?.stock_warning,
        stock_preallocate: product?.stock_preallocate,
        cost: product?.variant,
        warehouse: product?.sme_store?.name,
        variant_id: product?.variant_id,
        product_id: product?.product_id,
        variant_unit: product?.variant?.unit,
        variant_status: product?.variant?.product_status_name
      }
    })

  }, [itemInventory])

  const [updateManualProduct, {loading: loadingUpdateManualProduct}] = useMutation(mutate_ScUpdateManualProductVariantInventory, {
    refetchQueries: ['sme_catalog_inventory_items'],
    onCompleted: () => {
      setIds([])
    }
  })

  return (
    <>
      <LoadingDialog show={loadingUpdateManualProduct} />
      {openDetailVariantUnit && <DetailsVariantUnit
        data={variblesGetUnit}
        show={openDetailVariantUnit} onHide={() => setOpenDetailVariantUnit(false)} />}
      {!!currentSku && <InfoTicketDialog
        skuVariant={currentSku}
        currentSmeWarehouse={currentSmeWarehouse}
        onHide={() => {
          setCurrentSku(null)
          setCurrentSmeWarehouse(null);
        }}
      />}
      <ModalProductConnectVariant
        variantId={currentProductVariantLinked}
        onHide={() => setCurrentProductVariantLinked(null)}
      />
      {openModalInventory && <ModalInventoryExport openModal={setOpenModalInventory} />}
      <p className="mb-1" style={{ background: '#fff', zIndex: 1, fontSize: 14, paddingTop: 10 }}>
        {formatMessage({ defaultMessage: 'Tổng hàng tồn kho hiện có' })}<OverlayTrigger
          overlay={
            <Tooltip>
              {formatMessage({ defaultMessage: 'Tổng hàng tồn kho hiện có được tính bằng tổng tồn thực tế của những sản phẩm trong kho ngoại trừ sản phẩm combo.' })}
            </Tooltip>
          }
        >
          <i className="far fa-question-circle ml-1"></i>
        </OverlayTrigger>: <b>{!!loading ? "-" : formatNumberToCurrency(count?.sumSum || 0)}</b>
      </p>
      <div className="row">
        <div className='d-flex flex-column col-12' style={{ background: '#fff', paddingTop: 10 }}>
          <div className="d-flex mb-3 align-items-center">
            {<div className="mr-3 text-primary" >{formatMessage({ defaultMessage: 'Đã chọn' })}: {ids?.length ?? 0} {formatMessage({ defaultMessage: 'sản phẩm' })}</div>}
            {
              <Dropdown drop='down' onSelect={() => {

              }} >
                <Dropdown.Toggle disabled={!ids.length} className={` btn ${ids.length ? 'btn-primary' : 'btn-darkk'}`} >
                  {formatMessage({ defaultMessage: 'Thao tác hàng loạt' })}
                </Dropdown.Toggle>

                <Dropdown.Menu>
                  <AuthorizationWrapper keys={['product_stock_warning_update']}>
                    <Dropdown.Item className="mb-1 d-flex" onClick={async e => {
                      if (ids.length == 0) {
                        addToast(formatMessage({ defaultMessage: 'Vui lòng chọn sản phẩm' }), { appearance: 'warning' });
                        return;
                      }
                      showUpdateStockWarning(true)
                      return
                    }} >{formatMessage({ defaultMessage: 'Cập nhật cảnh báo tồn' })}</Dropdown.Item>
                  </AuthorizationWrapper>
                  <AuthorizationWrapper keys={['product_stock_price_update']}>
                    {!params?.status && <Dropdown.Item className="mb-1 d-flex" onClick={async e => {
                      if (ids.length == 0) {
                        addToast(formatMessage({ defaultMessage: 'Vui lòng chọn sản phẩm' }), { appearance: 'warning' });
                        return;
                      }
                      showUpdatePrice(true)
                      return
                    }} >{formatMessage({ defaultMessage: 'Cập nhật giá' })}</Dropdown.Item>}
                  </AuthorizationWrapper>
                  <AuthorizationWrapper keys={['product_print_barcode']}>
                    <Dropdown.Item
                      className="d-flex"
                      onClick={async e => {
                        if (ids.length == 0) {
                          addToast(formatMessage({ defaultMessage: 'Vui lòng chọn sản phẩm' }), { appearance: 'warning' });
                          return;
                        }

                        history.push(`/products/print-barcode`, {
                          products: ids
                        })
                        return
                      }}
                    >
                      {formatMessage({ defaultMessage: 'In mã vạch' })}
                    </Dropdown.Item>
                  </AuthorizationWrapper>
                  <AuthorizationWrapper keys={['product_stock_inventory_update']}>
                   <Dropdown.Item
                   className="d-flex"
                   onClick={async e => {
                     if (ids.length == 0) {
                       addToast(formatMessage({ defaultMessage: 'Vui lòng chọn sản phẩm' }), { appearance: 'warning' });
                       return;
                     }
                     const {data} = await updateManualProduct({
                       variables: {
                         products: ids?.map(product => ({
                           sme_product_id: product?.product_id,
                           sme_variant_id: product?.variant_id,
                           sme_warehouse_id: product?.sme_store_id,
                           stock: product?.stock_available
                         }))
                       }
                     })
                     if(data?.scUpdateManualProductVariantInventory?.success) {
                       addToast(formatMessage({defaultMessage: 'Đẩy tồn thành công.'}), {appearance: 'success'})
                       history.push('/product-stores/list-stock-tracking/')
                     } else {
                       addToast(formatMessage({defaultMessage: 'Đẩy tồn thất bại.'}))
                     }
                   }}
                 >
                   {formatMessage({ defaultMessage: 'Đẩy tồn' })}
                 </Dropdown.Item>
                </AuthorizationWrapper>
                </Dropdown.Menu>
              </Dropdown>
            }
            <div style={{ marginLeft: 'auto' }}>
              <AuthorizationWrapper keys={['product_inventory_view']}>
                <a
                  className=" btn btn-primary px-6 mr-2 ml-3"
                  href="/products/inventory/list"
                  style={{ marginLeft: 'auto' }}
                >
                  {formatMessage({ defaultMessage: 'Kiểm kho' })}
                </a>
              </AuthorizationWrapper>
              <AuthorizationWrapper keys={['product_stock_export']}>
                <button
                  onClick={() => setOpenModalInventory(true)}
                  type="submit"
                  className="btn btn-primary btn-elevate"
                >
                  {formatMessage({ defaultMessage: 'Xuất file' })}
                </button>
                <button
                  className="btn btn-secondary btn-elevate ml-1"
                  onClick={(e) => {
                    e.preventDefault();
                    history.push("/products/inventory-export-history");
                  }}

                >
                  <HistoryRounded />
                </button>
              </AuthorizationWrapper>
            </div>
          </div>
          {!params?.status && <div className="d-flex w-100" >
            <div style={{ position: 'sticky', top: 100, background: '#fff', zIndex: 10, fontSize: 14, paddingTop: 10, flex: 1 }}>
              <ul className="nav nav-tabs" id="myTab" role="tablist" style={{ borderBottom: 'none' }} >
                <li className={`nav-item ${!params.type ? 'active' : ''} ${!params.type == undefined ? 'active' : ''}`}>
                  <a className={`nav-link font-weight-normal ${!params.type ? 'active' : ''}`}
                    style={{ fontSize: '13px', minWidth: 100, }}
                    onClick={e => {
                      history.push(`/products/stocks?${queryString.stringify({
                        ...params,
                        page: 1,
                        type: undefined,
                      })}`)
                    }}
                  >{formatMessage({ defaultMessage: 'Tất cả' })} ({!count ? "-" : formatNumberToCurrency(count?.all)})</a>
                </li>
                <li className={`nav-item ${params.type == 'stocking' ? 'active' : ''}`}>
                  <a className={`nav-link font-weight-normal ${params.type == "stocking" ? 'active' : ''}`}
                    style={{ fontSize: '13px', minWidth: 100, alignItems: 'center', justifyContent: 'center' }}
                    onClick={e => {
                      history.push(`/products/stocks?${queryString.stringify({
                        ...params,
                        page: 1,
                        type: 'stocking'
                      })}`)
                    }}
                  >
                    {formatMessage({ defaultMessage: 'Còn hàng' })} ({!count ? "-" : formatNumberToCurrency(count?.all - count?.outStock)})
                  </a>
                </li>
                <li className={`nav-item ${params.type == 'near_out_stock' ? 'active' : ''}`}>
                  <a className={`nav-link font-weight-normal ${params.type == "near_out_stock" ? 'active' : ''}`}
                    style={{ fontSize: '13px', minWidth: 140, alignItems: 'center', justifyContent: 'center' }}
                    onClick={e => {
                      history.push(`/products/stocks?${queryString.stringify({
                        ...params,
                        page: 1,
                        type: 'near_out_stock'
                      })}`)
                    }}
                  >
                    {formatMessage({ defaultMessage: 'Sắp hết hàng' })} ({!count ? "-" : formatNumberToCurrency(count?.nearOutStock)})
                  </a>
                </li>
                <li className={`nav-item ${params.type == 'out_stock' ? 'active' : ''}`}>
                  <a className={`nav-link font-weight-normal ${params.type == "out_stock" ? 'active' : ''}`}
                    style={{ fontSize: '13px', minWidth: 100, alignItems: 'center', justifyContent: 'center' }}
                    onClick={e => {
                      history.push(`/products/stocks?${queryString.stringify({
                        ...params,
                        page: 1,
                        type: 'out_stock'
                      })}`)
                    }}
                  >
                    {formatMessage({ defaultMessage: 'Hết hàng' })} ({!count ? "-" : formatNumberToCurrency(count?.outStock)})
                  </a>
                </li>

                <li className={`nav-item ${params.type == 'stock_preallocate' ? 'active' : ''}`}>
                  <a className={`nav-link font-weight-normal ${params.type == "stock_preallocate" ? 'active' : ''}`}
                    style={{ fontSize: '13px', minWidth: 100, alignItems: 'center', justifyContent: 'center' }}
                    onClick={e => {
                      history.push(`/products/stocks?${queryString.stringify({
                        ...params,
                        page: 1,
                        type: 'stock_preallocate'
                      })}`)
                    }}
                  >
                    {formatMessage({ defaultMessage: 'Tạm ứng' })} ({!count ? "-" : formatNumberToCurrency(count?.countStockPreallocate)})
                  </a>
                </li>
                <div className="d-flex justify-content-end align-items-center" style={{ marginLeft: 'auto' }}>
                  <div className='d-flex justify-content-end align-items-center'>
                    <div className='mr-8'>
                      {formatMessage({ defaultMessage: 'Sắp xếp theo' })}:
                    </div>
                    <div style={{ width: '230px', zIndex: 99 }} className="mr-3">
                      <Select
                        className="w-100 custom-select-warehouse"
                        value={orderBy}
                        options={optionOrderBy}
                        onChange={values => {
                          history.push(`/products/stocks?${queryString.stringify({
                            ...params,
                            page: 1,
                            order_by: values.value
                          })}`)

                        }}
                      />
                    </div>

                    <div onClick={() => {
                      history.push(`/products/stocks?${queryString.stringify({
                        ...params,
                        page: 1,
                        sort: 'desc_nulls_last'
                      })}`)
                    }} style={{ height: '38px', width: '38px', cursor: 'pointer', border: sort == 'desc_nulls_last' ? '1px solid #FE5629' : '1px solid #D9D9D9' }} className="justify-content-center d-flex align-items-center mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-sort-down" viewBox="0 0 16 16">
                        <path d="M3.5 2.5a.5.5 0 0 0-1 0v8.793l-1.146-1.147a.5.5 0 0 0-.708.708l2 1.999.007.007a.497.497 0 0 0 .7-.006l2-2a.5.5 0 0 0-.707-.708L3.5 11.293V2.5zm3.5 1a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zM7.5 6a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5zm0 3a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1h-3zm0 3a.5.5 0 0 0 0 1h1a.5.5 0 0 0 0-1h-1z" />
                      </svg>
                    </div>

                    <div onClick={() => {

                      history.push(`/products/stocks?${queryString.stringify({
                        ...params,
                        page: 1,
                        sort: 'asc_nulls_last'
                      })}`)
                    }} style={{ height: '38px', width: '38px', cursor: 'pointer', border: sort == 'asc_nulls_last' ? '1px solid #FE5629' : '1px solid #D9D9D9' }} className="justify-content-center d-flex align-items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-sort-up" viewBox="0 0 16 16">
                        <path d="M3.5 12.5a.5.5 0 0 1-1 0V3.707L1.354 4.854a.5.5 0 1 1-.708-.708l2-1.999.007-.007a.498.498 0 0 1 .7.006l2 2a.5.5 0 1 1-.707.708L3.5 3.707V12.5zm3.5-9a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zM7.5 6a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5zm0 3a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1h-3zm0 3a.5.5 0 0 0 0 1h1a.5.5 0 0 0 0-1h-1z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </ul>
            </div>
          </div>}
        </div>

      </div>

      <div>
        {loading && <div className='text-center w-100 mt-4' style={{ position: 'absolute' }} ><span className="ml-3 spinner spinner-primary"></span></div>}
        {(!!error && !loading) ? (
          <div className="w-100 text-center mt-10" style={{ position: 'absolute' }} >
            <div className="d-flex flex-column justify-content-center align-items-center">
              <i className='far fa-times-circle text-danger' style={{ fontSize: 48, marginBottom: 8 }}></i>
              <p className="mb-6">{formatMessage({ defaultMessage: 'Xảy ra lỗi trong quá trình tải dữ liệu' })}</p>
              <button
                className="btn btn-primary btn-elevate"
                style={{ width: 100 }}
                onClick={e => {
                  e.preventDefault();
                  refetch();
                }}
              >
                {formatMessage({ defaultMessage: 'Tải lại' })}
              </button>
            </div>
          </div>
        ) : (
          <Table
            style={loading ? { opacity: 0.4 } : {}}
            className="upbase-table"
            columns={columns}
            data={dataTable || []}
            emptyText={<div className='d-flex flex-column align-items-center justify-content-center my-10'>
              <img src={toAbsoluteUrl("/media/empty.png")} alt="" width={80} />
              <span className='mt-4'>{formatMessage({ defaultMessage: 'Chưa có sản phẩm nào' })}</span>
            </div>}
            tableLayout="auto"
            sticky={{ offsetHeader: 43 }}
            scroll={{ x: 1800 }}
          />
        )}
        {!!dataTable?.length && (
          <Pagination
            page={page}
            totalPage={totalPage}
            loading={loading}
            limit={limit}
            totalRecord={totalRecord}
            count={itemInventory?.sme_catalog_inventory_items?.length}
            basePath={'/products/stocks'}
            emptyTitle=''
            style={{ zIndex: 1000 }}
          />
        )}
      </div>

      <ModalCombo
        dataCombo={dataCombo}
        onHide={() => setDataCombo(null)}
      />
    </>
  );
}
