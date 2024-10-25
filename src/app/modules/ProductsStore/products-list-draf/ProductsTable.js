// React bootstrap table next =>
// DOCS: https://react-bootstrap-table.github.io/react-bootstrap-table2/docs/
// STORYBOOK: https://react-bootstrap-table.github.io/react-bootstrap-table2/storybook/index.html
import React, { useMemo, useState } from "react";
import * as uiHelpers from "../ProductsUIHelpers";
import {
  toAbsoluteUrl,
} from "../../../../_metronic/_helpers";
import { Checkbox } from "../../../../_metronic/_partials/controls";
import { useQuery } from "@apollo/client";
import query_ScGetSmeProducts from '../../../../graphql/query_ScGetSmeProducts'
import ProductRow from './ProductRow'
import Pagination from '../../../../components/Pagination'
import { useLocation, useHistory, Link } from "react-router-dom";
import queryString from 'querystring'
import SVG from "react-inlinesvg";
import { useProductsUIContext } from "../ProductsUIContext";
import { Modal } from "react-bootstrap";
import ProductConnectVariantDialog from "../products-list/dialog/ProductConnectVariantDialog";
import ProductConnectDialog from "../products-list/dialog/ProductConnectDialog";
import ModalProductConnect from "../products-list/dialog/ModalProductConnect";
import ModalProductVariantConnect from "../products-list/dialog/ModalProductVariantConnect";
import ModalCombo from "../products-list/dialog/ModalCombo";
import { useIntl } from "react-intl";
import ModalStockOnHand from "../products-list/dialog/ModalStockOnHand";


const changeSort = (type) => {
  if (!type) {
    return 'asc'
  }
  if (type == 'asc') {
    return 'desc'
  }
  if (type == 'desc') {
    return null
  }
}
const parseOrderToParams = (order) => {
  return Object.keys(order).map(key => !!order[key] ? `${key}:${order[key]}` : null).filter(_vv => !!_vv).join(';')
}


export function ProductsTable({ onDelete, onHide, onConfirmSyncDown, categorySelected, syncImg, onReload, onProductSyncUp }) {
  const history = useHistory()
  const params = queryString.parse(useLocation().search.slice(1, 100000))
  const [storeDisconnect, setStoreDisconnect] = useState([])
  let currentChannel = params?.channel || 'shopee'
  const { ids, setIds } = useProductsUIContext();
  const [scVariantId, setScVariantId] = useState();
  const [scId, setScId] = useState();
  const [currentSmeProductId, setCurrentSmeProductId] = useState(null);
  const [currentProductId, setCurrentProductId] = useState(null);
  const [currentSmeProductVariantId, setCurrentSmeProductVariantId] = useState(null);
  const [currentProductVariantId, setCurrentProductVariantId] = useState(null);
  const [dataCombo, setDataCombo] = useState(null);
  const [currentVariantInventory, setCurrentVariantInventory] = useState(null);

  const { formatMessage } = useIntl()
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
  }, [params.limit])
  let orderBy = useMemo(() => {

    if (!params.order) {
      return {
        column: 'created_at',
        direction: 'desc'
      }
    }

    let _orders = {}
    try {
      params.order.split(';').forEach(element => {
        let _elementSplit = element.split(':')
        if (_elementSplit.length == 2) {
          if (_elementSplit[1].trim() == 'asc' || _elementSplit[1].trim() == 'desc') {
            _orders = {
              column: _elementSplit[0].trim(),
              direction: _elementSplit[1].trim()
            }
          }
        }
      });
      if (Object.keys(_orders).length == 0) {
        return null
      }
      return _orders
    } catch (error) {
      return null
    }
  }, [params.order])

  let store_id = useMemo(() => {
    try {
      let store = !!params?.store ? parseInt(params?.store) : null
      if (!store || Number.isNaN(store)) {
        return null
      }
      return store
    } catch (error) {
      return null
    }
  }, [params.store]);

  let tag_name = useMemo(
    () => {
      if (!params?.tags) return null;

      return params?.tags;
    }, [params?.tags]
  );

  let filter_map_sme = useMemo(() => {
    let filter_map_sme = Number(params?.filter_map_sme);
    if (!isNaN(filter_map_sme)) {
      return filter_map_sme
    }
    return null
  }, [params?.filter_map_sme])

  let has_origin_img = useMemo(() => {
    let has_origin_img = Number(params?.has_origin_img);
    if (!isNaN(has_origin_img)) {
      return has_origin_img
    }
    return null
  }, [params?.has_origin_img])

  let categoryId = useMemo(
    () => {
      if (!params?.categoryId) return null;

      return Number(params?.categoryId);
    }, [params?.categoryId]
  );

  let whereCondition = useMemo(
    () => {
      setIds([])
      return {
        q: !!params.name ? params.name : '',
        order_by: orderBy,
        connector_channel_code: currentChannel,
        store_id: store_id,
        stock: null,
        status: null,
        sc_category_id: categoryId,
        tag_name,
        filter_map_sme,
        has_origin_img,
        filter_ref_id: 2,
        is_draft: 1
      }
    }, [params.name, orderBy, currentChannel, store_id, categoryId, tag_name, filter_map_sme, has_origin_img]
  );

  const { data, loading, refetch } = useQuery(query_ScGetSmeProducts, {
    variables: { ...whereCondition, per_page: limit, page: page },
    fetchPolicy: 'cache-and-network',
  });

  let totalRecord = data?.ScGetSmeProducts?.total || 0
  let totalPage = Math.ceil(totalRecord / limit);

  // const isSelectAll = ids.length > 0 && ids.length == data?.ScGetSmeProducts?.products?.length;
  const isSelectAll = ids.length > 0 && ids.filter(x => {
    return data?.ScGetSmeProducts?.products?.some(pro => pro.id === x.id);
  })?.length == data?.ScGetSmeProducts?.products?.length;

  useMemo(
    () => {
      if (!syncImg) refetch();
    }, [syncImg]
  )

  return (
    <div style={{
      boxShadow: "inset -1px 0px 0px #D9D9D9, inset 1px 0px 0px #D9D9D9, inset 0px 1px 0px #D9D9D9, inset 0px -1px 0px #D9D9D9",
      minHeight: 300,
      borderBottomLeftRadius: 6, borderBottomRightRadius: 6, borderTopRightRadius: 6
    }} >
      <table className="table table-borderless product-list table-vertical-center fixed">
        <thead style={{
          position: 'sticky', top: ids.length > 0 ? '98px' : '98px', background: '#F3F6F9', fontWeight: '500', fontSize: '14px',
          borderLeft: '1px solid #d9d9d9'
        }}>
          <tr className="font-size-lg">
            <th style={{ fontSize: '14px' }}>
              <Checkbox
                inputProps={{
                  'aria-label': 'checkbox',
                }}
                isSelected={isSelectAll}
                // onChange={(e) => {
                //   if (isSelectAll) {
                //     setIds([])
                //   } else {
                //     setIds((data?.ScGetSmeProducts?.products || []).map(_product => {
                //       return _product
                //     }).filter(_pro => !!_pro && _pro?.status != 3))
                //   }
                // }}

                onChange={(e) => {
                  if (isSelectAll) {
                    setIds(ids.filter(x => {
                      return !data?.ScGetSmeProducts?.products.some(order => order.id === x.id);
                    }))
                  } else {
                    const tempArray = [...ids].filter(_pro => !!_pro && _pro?.status != 3);
                    (data?.ScGetSmeProducts?.products || []).forEach(_pro => {
                      if (_pro && !ids.some(item => item.id === _pro.id)) {
                        tempArray.push(_pro);
                      }
                    })
                    setIds(tempArray)
                  }
                }}
              />
            </th>
            <th style={{ fontSize: '14px' }} width="34%">
              {formatMessage({ defaultMessage: 'Sản phẩm' })}
            </th>
            <th style={{ fontSize: '14px' }} width="23%">
              {formatMessage({ defaultMessage: 'Hàng hóa' })}
            </th>
            <th style={{ fontSize: '14px' }} width='11%' className="text-center" >
              {formatMessage({ defaultMessage: 'Giá niêm yết' })}
            </th>
            <th style={{ fontSize: '14px' }} width='11%' className="text-center" >
              {formatMessage({ defaultMessage: 'Tồn kho' })}
              {/* <span className="svg-icon svg-icon-md svg-icon-control">
                    <SVG src={orderBy?.column != 'stock' ? toAbsoluteUrl("/media/svg/ic_sort_.svg") : toAbsoluteUrl(`/media/svg/ic_${orderBy.direction}_.svg`)} />
                  </span> */}
            </th>
            <th style={{ fontSize: '14px', borderRight: '1px solid #d9d9d9' }} width='13%'>
              {formatMessage({ defaultMessage: 'Thời gian' })}
            </th>
            {/* <th width='80'>
                Đồng bộ
              </th> */}
            <th style={{ fontSize: '14px', borderRight: '1px solid #d9d9d9' }} width='11%' className="text-center" >
              {formatMessage({ defaultMessage: 'Thao tác' })}
            </th>
          </tr>
        </thead>
        <tbody>
          {
            loading && <div className='text-center w-100 mt-4' style={{ position: 'absolute' }} >
              <span className="ml-3 spinner spinner-primary"></span>
            </div>
          }
          {
            data?.ScGetSmeProducts?.products?.map(_product => {
              return <ProductRow key={`product-row-${_product.id}`} product={_product}
                op_connector_channels={data?.op_connector_channels || []}
                sc_stores={data?.sc_stores || []}
                onDelete={onDelete}
                onReload={onReload}
                onHide={onHide}
                onProductSyncUp={onProductSyncUp}
                onConfirmSyncDown={onConfirmSyncDown}
                onShowInventory={(variant) => setCurrentVariantInventory(variant)}
                setStoreDisconnect={setStoreDisconnect}
                onLinkVariant={(id) => setScVariantId(id)}
                onLink={(id) => setScId(id)}
                onShowProductConnect={(id) => {
                  setCurrentSmeProductId(id)
                  setCurrentProductId(_product.id)
                }
                }
                onShowProductVariantConnect={(id, variant_id) => {
                  setCurrentSmeProductVariantId(id);
                  setCurrentProductVariantId(variant_id)
                  // setTargetConnect(target);
                }}
              />
            })
          }
        </tbody>
      </table>
      <Pagination
        page={page}
        totalPage={totalPage}
        options={[
          { label: 25, value: 25 },
          { label: 50, value: 50 }
        ]}
        loading={loading}
        limit={limit}
        totalRecord={totalRecord}
        count={data?.ScGetSmeProducts?.products?.length}
        basePath={'/product-stores/draf'}
        emptyTitle={formatMessage({ defaultMessage: 'Chưa có sản phẩm nào' })}
      />

      {!!currentVariantInventory && (
        <ModalStockOnHand
          variables={{ ...whereCondition, per_page: limit, page: page }}
          variant={currentVariantInventory}
          onHide={() => setCurrentVariantInventory(null)}
        />
      )}

      <Modal
        show={storeDisconnect?.length != 0}
        aria-labelledby="example-modal-sizes-title-lg"
        centered
        onHide={() => setStoreDisconnect([])}
      >
        <Modal.Body className="overlay overlay-block cursor-default text-center">
          <div className="mb-4" >{formatMessage({ defaultMessage: 'Kết nối đến gian hàng' })} {storeDisconnect?.join(', ')} {formatMessage({ defaultMessage: 'không khả dụng. Vui lòng kết nối lại để thực hiện thao tác này' })}.</div>

          <div className="form-group mb-0">
            <button
              type="button"
              className="btn btn-light btn-elevate mr-3"
              style={{ width: 150 }}
              onClick={() => setStoreDisconnect([])}
            >
              <span className="font-weight-boldest">{formatMessage({ defaultMessage: 'Bỏ qua' })}</span>
            </button>
            <Link
              type="button"
              to='/setting/channels'
              className={`btn btn-primary font-weight-bold`}
              style={{ width: 150 }}
            >
              <span className="font-weight-boldest">{formatMessage({ defaultMessage: 'Kết nối lại' })}</span>
            </Link>
          </div>
        </Modal.Body>
      </Modal >

      <ProductConnectVariantDialog
        show={!!scVariantId}
        onHide={() => setScVariantId()}
        scVariantId={scVariantId}
      />
      <ProductConnectDialog
        show={!!scId}
        scId={scId}
        onHide={() => setScId()}
      />


      <ModalProductConnect
        smeProductId={currentSmeProductId}
        productId={currentProductId}
        onHide={() => {
          setCurrentSmeProductId(null)
          setCurrentProductId(null)
        }}
        setDataCombo={setDataCombo}
      />

      <ModalProductVariantConnect
        smeProductVariantId={currentSmeProductVariantId}
        productVariantId={currentProductVariantId}
        targetConnect={"variant"}
        onHide={() => {
          setCurrentSmeProductVariantId(null)
          setCurrentProductVariantId(null)
        }}
        setDataCombo={setDataCombo}
      />

      <ModalCombo
        dataCombo={dataCombo}
        onHide={() => setDataCombo(null)}
      />

    </div>
  );
}
