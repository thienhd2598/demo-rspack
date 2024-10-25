// React bootstrap table next =>
// DOCS: https://react-bootstrap-table.github.io/react-bootstrap-table2/docs/
// STORYBOOK: https://react-bootstrap-table.github.io/react-bootstrap-table2/storybook/index.html
import React, { Fragment, useMemo, useState } from "react";
import * as uiHelpers from "../ProductsUIHelpers";
import {
  toAbsoluteUrl,
} from "../../../../_metronic/_helpers";
import { Checkbox } from "../../../../_metronic/_partials/controls";
import { useMutation, useQuery } from "@apollo/client";
import query_ScGetSmeProducts from '../../../../graphql/query_ScGetSmeProducts'
import ProductRow from './ProductRow'
import Pagination from '../../../../components/Pagination'
import { useLocation, useHistory, Link } from "react-router-dom";
import { useToasts } from 'react-toast-notifications'
import queryString from 'querystring'
import SVG from "react-inlinesvg";
import { useProductsUIContext } from "../ProductsUIContext";
import { Modal } from "react-bootstrap";
import ProductConnectDialog from "./dialog/ProductConnectDialog";
import ProductConnectVariantDialog from "./dialog/ProductConnectVariantDialog";
import LoadingDialog from "./dialog/LoadingDialog";
import mutate_scSettingLinkProduct from "../../../../graphql/mutate_scSettingLinkProduct";
import ModalProductConnect from "./dialog/ModalProductConnect";
import ModalProductVariantConnect from "./dialog/ModalProductVariantConnect";
import ModalCombo from "./dialog/ModalCombo";
import { useIntl } from "react-intl";
import ModalStockOnHand from "./dialog/ModalStockOnHand";
import { queryMktGetCampaignByVariant, queryGetSmeVariantsByIds } from "../ProductsUIHelpers";
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


export function ProductsTable({ onDelete, onHide, onConfirmSyncDown, isReloadDone, syncImg, onReload, onCreateMutilTag, onCreateBatch, setOpenModalCampaign, setCampaignList }) {
  const history = useHistory()
  const { formatMessage } = useIntl();
  const params = queryString.parse(useLocation().search.slice(1, 100000))
  const { addToast } = useToasts();
  const [storeDisconnect, setStoreDisconnect] = useState([])
  let currentChannel = params?.channel || 'shopee'
  const { ids, setIds } = useProductsUIContext();
  const [loadingCheck, setLoadingCheck] = useState(false);
  const [scId, setScId] = useState();
  const [scVariantId, setScVariantId] = useState();
  const [currentProductSync, setCurrentProductSync] = useState({});
  const [currentSmeProductId, setCurrentSmeProductId] = useState(null);
  const [currentProductId, setCurrentProductId] = useState(null);
  const [currentSmeProductVariantId, setCurrentSmeProductVariantId] = useState(null);
  const [currentProductVariantId, setCurrentProductVariantId] = useState(null);
  const [targetConnect, setTargetConnect] = useState('variant');
  const [dataCombo, setDataCombo] = useState(null);
  const [campaignVariant, setCampaignVariant] = useState(null);
  const [currentVariantInventory, setCurrentVariantInventory] = useState(null);

  const [scSettingLinkProduct, { loading: loadingScSettingLinkProduct }] = useMutation(mutate_scSettingLinkProduct, {
    awaitRefetchQueries: true,
    refetchQueries: ['ScGetSmeProducts']
  });

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

  let tag_name = useMemo(
    () => {
      if (!params?.tags) return null;

      return params?.tags;
    }, [params?.tags]
  );

  const prefix_name = useMemo(() => {
    if (params?.prefix_type) {
      return {
        prefix_name: params?.prefix_name
      }      
    } 
    return {}
  }, [params?.prefix_type, params?.prefix_name]);

  let orderBy = useMemo(() => {

    if (!params.order) {
      return null
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
  let stock = useMemo(() => {
    if (params.type == uiHelpers.TYPE_COUNT.SAP_HET_HANG) {
      return 1
    }
    if (params.type == uiHelpers.TYPE_COUNT.HET_HANG) {
      return 2
    }
    return null
  }, [params.type])
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
  }, [params.store])
  let status = useMemo(() => {
    if (params.type == uiHelpers.TYPE_COUNT.DANG_HOAT_DONG) {
      return 10
    }
    if (params.type == uiHelpers.TYPE_COUNT.DA_AN) {
      return 0
    }
    if (params.type == uiHelpers.TYPE_COUNT.KHAC) {
      return 4
    }
    return null
  }, [params.type])
  let is_virtual = useMemo(() => {
    if (params.type == uiHelpers.TYPE_COUNT.HANG_HOA_AO) {
      return 1;
    }
    
    return null;
  }, [params.type]);
  let filter_ref_id = useMemo(() => {
    if (params.type == uiHelpers.TYPE_COUNT.LUU_NHAP) {
      return 2
    }
    return null
  }, [params.type])
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
        stock: stock,
        status: status,
        tag_name,
        sc_category_id: categoryId,
        filter_ref_id,
        filter_map_sme,
        has_origin_img,
        is_draft: 2,
        is_virtual,
        ...prefix_name
      }
    }, [params.name, orderBy, currentChannel, store_id, stock, categoryId, tag_name, filter_map_sme, has_origin_img, status, is_virtual, prefix_name]
  );

  const { data, loading, error, refetch } = useQuery(query_ScGetSmeProducts, {
    variables: { ...whereCondition, per_page: limit, page: page },
    fetchPolicy: 'network-only',
    onCompleted: async (data) => {
      const allVariants = data?.ScGetSmeProducts?.products?.flatMap(product => product?.productVariants);
      const variantIds = allVariants?.map(variant => variant.id);
      const [variantCampaign] = await Promise.all([queryMktGetCampaignByVariant(variantIds)]);
      setCampaignVariant(variantCampaign)
    }
  });
  let totalRecord = data?.ScGetSmeProducts?.total || 0
  let totalPage = Math.ceil(totalRecord / limit)

  const isSelectAll = ids.length > 0 && ids.filter(x => {
    return data?.ScGetSmeProducts?.products?.some(pro => pro.id === x.id);
  })?.length == data?.ScGetSmeProducts?.products?.length;

  useMemo(
    () => {
      if (!syncImg) refetch();
    }, [syncImg]
  );

  useMemo(() => !!isReloadDone && refetch(), [isReloadDone]);

  return (
    <Fragment>
      <LoadingDialog show={loadingScSettingLinkProduct || loadingCheck} />
      {!!scId && <ProductConnectDialog
        show={!!scId}
        scId={scId}
        onHide={() => setScId()}
      />}

      {!!scVariantId && <ProductConnectVariantDialog
        show={!!scVariantId}
        onHide={() => setScVariantId()}
        scVariantId={scVariantId}
      />}
      <div>
        <table className="table table-borderless product-list table-vertical-center fixed"  >
          <thead style={{
            position: 'sticky', top: ids.length > 0 ? '132px' : '132px', background: '#F3F6F9', fontWeight: '500', borderLeft: '1px solid #d9d9d9', borderRight: '1px solid #d9d9d9'
          }}>
            <tr className="font-size-lg">
              {params?.type !== uiHelpers.TYPE_COUNT.HANG_HOA_AO && <th style={{ fontSize: '14px' }}>
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
              </th>}
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
                {formatMessage({ defaultMessage: 'Tồn kho                ' })}
              </th>
              <th style={{ fontSize: '14px' }} width='13%'>
                {formatMessage({ defaultMessage: 'Thời gian' })}
              </th>
              {params.type != uiHelpers.TYPE_COUNT.HANG_HOA_AO && <th style={{ fontSize: '14px' }} width='11%' className="text-center" >
                {formatMessage({ defaultMessage: 'Thao tác' })}
              </th>}
            </tr>
          </thead>
          <tbody>
            {
              loading && <div className='text-center w-100 mt-4' style={{ position: 'absolute' }} >
                <span className="ml-3 spinner spinner-primary"></span>
              </div>
            }
            {!!error && !loading && (
              <div className="w-100 text-center mt-8" style={{ position: 'absolute' }} >
                <div className="d-flex flex-column justify-content-center align-items-center">
                  <i className='far fa-times-circle text-danger' style={{ fontSize: 48, marginBottom: 8 }}></i>
                  <p className="mb-6">{formatMessage({ defaultMessage: `Xảy ra lỗi trong quá trình tải dữ liệu` })}</p>
                  <button
                    className="btn btn-primary btn-elevate"
                    style={{ width: 100 }}
                    onClick={e => {
                      e.preventDefault();
                      refetch();
                    }}
                  >
                    {formatMessage({ defaultMessage: `Tải lại` })}
                  </button>
                </div>
              </div>
            )}
            {
              !error && data?.ScGetSmeProducts?.products?.map(_product => {
                return <ProductRow
                  dataCampaign={campaignVariant}
                  onCreateBatch={onCreateBatch}
                  setOpenModalCampaign={setOpenModalCampaign}
                  setCampaignList={setCampaignList}
                  onShowInventory={(variant) => setCurrentVariantInventory(variant)}
                  key={`product-row-${_product.id}`}
                  product={_product}
                  onLink={(id) => setScId(id)}
                  onCheckExistSku={setLoadingCheck}
                  onLinkVariant={(id) => setScVariantId(id)}
                  onSyncProduct={async (body, type) => {
                    let mess = type === 'stock' ? 'tồn kho' : 'giá bán';
                    let res = await scSettingLinkProduct({
                      variables: body
                    });
                    if (res?.data?.scSettingLinkProduct?.success) {
                      setCurrentProductSync({});
                      addToast(formatMessage({ defaultMessage: `Đồng bộ {mess} sản phẩm thành công` }, { mess: mess }), { appearance: 'success' });
                    } else {
                      addToast(res.errors[0].message, { appearance: 'error' });
                    }
                  }}
                  op_connector_channels={data?.op_connector_channels || []}
                  sc_stores={data?.sc_stores || []}
                  currentProductSync={currentProductSync}
                  onSetCurrentProductSync={(productSync) => setCurrentProductSync(productSync)}
                  onDelete={onDelete}
                  onReload={onReload}
                  onHide={onHide}
                  onConfirmSyncDown={onConfirmSyncDown}
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
                  onCreateMutilTag={onCreateMutilTag}
                  setStoreDisconnect={setStoreDisconnect}
                />
              })
            }
          </tbody>
        </table>
        {!error && (
          <Pagination
            page={page}
            options={[
              { label: 25, value: 25 },
              { label: 50, value: 50 }
            ]}
            totalPage={totalPage}
            loading={loading}
            limit={limit}
            totalRecord={totalRecord}
            count={data?.ScGetSmeProducts?.products?.length}
            basePath={'/product-stores/list'}
            emptyTitle={formatMessage({ defaultMessage: 'Chưa có sản phẩm nào' })}
          />
        )}

        {!!currentVariantInventory && (
          <ModalStockOnHand
            variables={{ ...whereCondition, per_page: limit, page: page }}
            variant={currentVariantInventory}
            onHide={() => setCurrentVariantInventory(null)}
          />
        )}

        <ModalProductConnect
          smeProductId={currentSmeProductId}
          productId={currentProductId}
          onHide={() => {
            setCurrentSmeProductId(null)
            setCurrentProductId(null)
          }}
          setDataCombo={setDataCombo}
        />

        <ModalCombo
          dataCombo={dataCombo}
          onHide={() => setDataCombo(null)}
        />

        <ModalProductVariantConnect
          smeProductVariantId={currentSmeProductVariantId}
          productVariantId={currentProductVariantId}
          targetConnect={targetConnect}
          onHide={() => {
            setCurrentSmeProductVariantId(null)
            setCurrentProductVariantId(null)
          }}
          setDataCombo={setDataCombo}
        />

        <Modal
          show={storeDisconnect?.length != 0}
          aria-labelledby="example-modal-sizes-title-lg"
          centered
          onHide={() => setStoreDisconnect([])}
        >
          <Modal.Body className="overlay overlay-block cursor-default text-center">
            <div className="mb-4" >
              {formatMessage({ defaultMessage: `Kết nối đến gian hàng {store} không khả dụng. Vui lòng kết nối lại để thực hiện thao tác này.` }, { store: storeDisconnect?.join(', ') })}
            </div>

            <div className="form-group mb-0">
              <button
                type="button"
                className="btn btn-light btn-elevate mr-3"
                style={{ width: 150 }}
                onClick={() => setStoreDisconnect([])}
              >
                <span className="font-weight-boldest">{formatMessage({ defaultMessage: `Bỏ qua` })}</span>
              </button>
              <Link
                type="button"
                to='/setting/channels'
                className={`btn btn-primary font-weight-bold`}
                style={{ width: 150 }}
              >
                <span className="font-weight-boldest">{formatMessage({ defaultMessage: `Kết nối lại` })}</span>
              </Link>
            </div>
          </Modal.Body>
        </Modal >
      </div>
    </Fragment>
  );
}
