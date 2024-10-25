// React bootstrap table next =>
// DOCS: https://react-bootstrap-table.github.io/react-bootstrap-table2/docs/
// STORYBOOK: https://react-bootstrap-table.github.io/react-bootstrap-table2/storybook/index.html
import { useQuery } from "@apollo/client";
import _ from 'lodash';
import queryString from 'querystring';
import React, { useCallback, useMemo, useRef, useState } from "react";
import { Modal } from "react-bootstrap";
import { useIntl } from "react-intl";
import { Link, useHistory, useLocation } from "react-router-dom";
import { Checkbox } from "../../../../_metronic/_partials/controls";
import { createApolloClientSSR } from "../../../../apollo";
import Pagination from '../../../../components/Pagination';
import query_sc_stores_basic from "../../../../graphql/query_sc_stores_basic";
import query_sme_catalog_product_notjoin_scproduct from "../../../../graphql/query_sme_catalog_product_notjoin_scproduct";
import ChooseStoreDialog from "../../Products/product-new/ChooseStoreDialog";
import ProductRow from './ProductRow';
import ModalCombo from "./dialog/ModalCombo";
import ModalProductConnect from "./dialog/ModalProductConnect";
import ModalProductConnectVariant from "./dialog/ModalProductConnectVariant";
import { getQueryByType } from "../../Products/ProductsUIHelpers";

export function ProductsTable({ onDelete, onHide, onShow, onCreateMutilTag, nameSearch, setIds, ids }) {
  const client = createApolloClientSSR();
  const history = useHistory()
  const params = queryString.parse(useLocation().search.slice(1, 100000))
  const [storeDisconnect, setStoreDisconnect] = useState([])
  const [showChooseStore, setShowChooseStore] = useState(false)
  const [idsProductsConnected, setIdsProductsConnected] = useState([]);
  const [smeProductIdSelect, setSmeProductIdSelect] = useState(0);
  const [currentProductVariantLinked, setCurrentProductVariantLinked] = useState(null);
  const [productHasAttribute, setProductHasAttribute] = useState(false);
  const [dataCombo, setDataCombo] = useState(null);
  const { formatMessage } = useIntl()
  const _refProductId = useRef(null)

  const { data: dataStore } = useQuery(query_sc_stores_basic, {
    fetchPolicy: 'cache-and-network'
  })

  const [optionsStore] = useMemo(() => {
    let _options = dataStore?.sc_stores?.filter(_store => _store.status == 1).map(_store => {
      let _channel = dataStore?.op_connector_channels?.find(_ccc => _ccc.code == _store.connector_channel_code)
      return {
        label: _store.name,
        value: _store.id,
        logo: _channel?.logo_asset_url,
        connector_channel_code: _store.connector_channel_code,
        special_type: _store.special_type
      }
    }) || [];
    return [_options]
  }, [dataStore])

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

  let tags = useMemo(
    () => {
      try {
        let parseTags = _.filter(
          _.map(params?.tags?.split(','), value => Number(value)),
          value => !!value
        );

        if (parseTags?.length > 0) {
          return {
            tags: {
              tag: { id: { _in: parseTags } }
            }
          }
        } else {
          return {}
        }
      } catch (error) {
        return {}
      }
    }, [params?.tags]
  );

  let has_origin_image = useMemo(
    () => {
      try {
        let has_origin_image = Number(params.has_origin_image || undefined)
        if (!isNaN(has_origin_image)) {
          return {
            has_origin_image: {
              _eq: has_origin_image
            }
          }
        } else {
          return {}
        }
      } catch (error) {
        return {}
      }
    }, [params?.has_origin_image]
  );

  let is_combo = useMemo(
    () => {
      try {
        let is_combo = Number(params.is_combo || undefined)
        if (!isNaN(is_combo)) {
          return {
            is_combo: {
              _eq: is_combo
            }
          }
        } else {
          return {}
        }
      } catch (error) {
        return {}
      }
    }, [params?.is_combo]
  );

  let scProductMapping = useMemo(
    () => {
      try {
        let store_id = Number(params?.store || undefined);
        let has_sc_product_linking = Number(params.has_sc_product_linking || undefined);

        if (!isNaN(has_sc_product_linking) && isNaN(store_id)) {
          return {
            has_sc_product_linking: {
              _eq: has_sc_product_linking
            }
          }
        }

        if (!isNaN(has_sc_product_linking) && !isNaN(store_id)) {
          return {
            ...(has_sc_product_linking != 0 ? {
              has_sc_product_linking: {
                _eq: has_sc_product_linking
              },
              scProductMapping: {
                store_id: {
                  _eq: store_id
                }
              }
            } : {
              _and: { _not: { scProductMapping: { store_id: { _in: [store_id] } } } }
              // scProductMapping: {
              //   store_id: {
              //     _nin: [store_id]
              //   }
              // }
            })
          }
        }

        return {}
      } catch (error) {
        return {}
      }
    }, [params?.store, params?.has_sc_product_linking]
  );

  // let has_sc_product_linking = useMemo(
  //   () => {
  //     try {
  //       let has_sc_product_linking = Number(params.has_sc_product_linking || undefined)
  //       if (!isNaN(has_sc_product_linking)) {
  //         return {
  //           has_sc_product_linking: {
  //             _eq: has_sc_product_linking
  //           }
  //         }
  //       } else {
  //         return {}
  //       }
  //     } catch (error) {
  //       return {}
  //     }
  //   }, [params?.has_sc_product_linking]
  // );

  let orderBy = useMemo(() => {

    if (!params.order) {
      return { updated_at: 'desc_nulls_last' }
    }

    let _orders = {}
    try {
      params.order.split(';').forEach(element => {
        let _elementSplit = element.split(':')
        if (_elementSplit.length == 2) {
          if (_elementSplit[1].trim().includes('asc') || _elementSplit[1].trim().includes('desc')) {
            _orders = {
              ..._orders,
              [_elementSplit[0].trim()]: _elementSplit[1].trim().includes('asc') ? 'asc_nulls_first' : 'desc_nulls_last'
            }
          }
        }
      });
      if (Object.keys(_orders).length == 0) {
        return { updated_at: 'desc_nulls_last' }
      }
      return { ..._orders }
    } catch (error) {
      return { updated_at: 'desc_nulls_last' }
    }
  }, [params.order])
  let type = useMemo(() => {
    if (!params.type) {
      return {}
    }
    return getQueryByType(params.type)
  }, [params.type]);

  let isUpdatedCostPriceAndVAT = useMemo(() => {
    if (!params?.updateCostPrice || params?.updateCostPrice?.split(',')?.length > 1) {
      return {}
    }
    return {
      ...(params?.updateCostPrice == 1 ? {
        _and: [
          { sme_catalog_product_variants: { cost_price: { _gt: 0 }}}, 
          { sme_catalog_product_variants: {vat_rate: { _gt: 0}}}]    
      } : {
        _or: [
          { sme_catalog_product_variants: { _or: [{cost_price: { _is_null: true }}, {cost_price: { _eq: 0 }}]}}, 
          { sme_catalog_product_variants: { _or: [{vat_rate: { _is_null: true }}, {vat_rate: { _eq: 0 }}]}}, 
      ]    
      })
     
    }
  }, [params.updateCostPrice]);


  let whereCondition = useMemo(
    () => {
      setIds([])
      return {
        ...(!!nameSearch ? {
          ...type,
          _or: [{ name: { _ilike: `%${nameSearch.trim()}%` } },
          { sku: { _ilike: `%${nameSearch.trim()}%` } },
          { sme_catalog_product_variants: { sku: { _ilike: `%${nameSearch.trim()}%` } } }],
        } : type),
        ...has_origin_image,
        ...is_combo,
        // ...has_sc_product_linking,
        ...tags,
        ...scProductMapping,
        ...isUpdatedCostPriceAndVAT
      }
    }, [nameSearch, type, isUpdatedCostPriceAndVAT, has_origin_image, is_combo, tags, scProductMapping]
  );

  const { data, loading, error, refetch } = useQuery(query_sme_catalog_product_notjoin_scproduct, {
    variables: {
      limit,
      offset: (page - 1) * limit,
      where: whereCondition,
      order_by: orderBy
    },
    fetchPolicy: 'cache-and-network'
  });

  console.log(`THIEN CHECKED: `, data);

  const _onCopyToStore = useCallback((_product) => {
    _refProductId.current = _product
    setShowChooseStore(true)
  }, [])

  let totalRecord = data?.sme_catalog_product_aggregate?.aggregate?.count || 0
  let totalPage = Math.ceil(totalRecord / limit)

  const isSelectAll = ids.length > 0 && ids.filter(x => {
    return data?.sme_catalog_product?.some(pro => pro.id === x.id);
  })?.length == data?.sme_catalog_product?.length;

  return (
    <div>
      <table className="table table-borderless product-list table-vertical-center fixed"  >
        <thead style={{
          position: 'sticky', top: ids.length > 0 ? '81px' : '82px', background: '#F3F6F9', fontWeight: 'bold', fontSize: '14px',
          borderLeft: '1px solid #d9d99d', borderRight: '1px solid #d9d99d',
        }}>
          <tr className="font-size-lg">
            <th style={{ fontSize: '14px' }} width="3%">
              <Checkbox
                inputProps={{
                  'aria-label': 'checkbox',
                }}
                isSelected={isSelectAll}
                onChange={(e) => {
                  if (isSelectAll) {
                    setIds(ids.filter(x => {
                      return !data?.sme_catalog_product.some(order => order.id === x.id);
                    }))
                  } else {
                    const tempArray = [...ids].filter(_pro => !!_pro && _pro?.status != 3);
                    (data?.sme_catalog_product || []).forEach(_pro => {
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
            <th style={{ fontSize: '14px' }} width="24%">
              {formatMessage({ defaultMessage: 'Hàng hóa' })}
            </th>
            <th className="text-center" style={{ fontSize: '14px' }} width="12%">
              {formatMessage({ defaultMessage: 'Giá vốn' })}
            </th>
            <th className="text-center" style={{ fontSize: '14px' }} width="11%">
              {formatMessage({ defaultMessage: 'VAT' })}
            </th>
          </tr>
        </thead>
        <tbody style={{ borderRight: '1px solid #d9d9d9' }}>
          {
            loading && <div className='text-center w-100 mt-4' style={{ position: 'absolute' }} >
              <span className="ml-3 spinner spinner-primary"></span>
            </div>
          }
          {!!error && !loading && (
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
          )}
          {
            !loading && data?.sme_catalog_product?.map(_product => {
              return <ProductRow key={`product-row-${_product.id}`} product={_product}
                op_connector_channels={data?.op_connector_channels || []}
                sc_stores={data?.sc_stores || []}
                onDelete={onDelete}
                ids={ids}
                setIds={setIds}
                onHide={onHide}
                onShow={onShow}
                onShowProductConnect={(ids, hasAttribute, sme_product_id) => {
                  setIdsProductsConnected(ids)
                  setProductHasAttribute(hasAttribute);
                  setSmeProductIdSelect(sme_product_id)
                }}
                onShowProductConnectVariant={(variant) => setCurrentProductVariantLinked(variant)}
                onCreateMutilTag={onCreateMutilTag}
                setStoreDisconnect={setStoreDisconnect}
                onCopyToStore={_onCopyToStore}
                setDataCombo={setDataCombo}
              />
            })
          }
        </tbody>
      </table>
      {!error && (
        <Pagination
          page={page}
          totalPage={totalPage}
          loading={loading}
          limit={limit}
          totalRecord={totalRecord}
          count={data?.sme_catalog_product?.length}
          basePath={'/finance/manage-cost-price'}
          emptyTitle={formatMessage({ defaultMessage: 'Chưa có sản phẩm nào' })}
        />
      )}



      <ModalProductConnect
        scProductIds={idsProductsConnected}
        hasAttribute={productHasAttribute}
        smeProductIdSelect={smeProductIdSelect}
        onHide={() => setIdsProductsConnected([])}
      />

      <ModalProductConnectVariant
        refetch={refetch}
        variantId={currentProductVariantLinked}
        onHide={() => setCurrentProductVariantLinked(null)}
      />

      <Modal
        show={storeDisconnect?.length != 0}
        aria-labelledby="example-modal-sizes-title-lg"
        centered
        onHide={() => setStoreDisconnect([])}
      >
        <Modal.Body className="overlay overlay-block cursor-default text-center">
          <div className="mb-4" >{formatMessage({ defaultMessage: 'Kết nối đến gian hàng' })} {storeDisconnect?.join(', ')} {formatMessage({ defaultMessage: 'không khả dụng. Vui lòng kết nối lại để thực hiện thao tác này.' })}</div>

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

      <ModalCombo
        dataCombo={dataCombo}
        onHide={() => setDataCombo(null)}
      />

      <ChooseStoreDialog show={showChooseStore}
        onHide={() => setShowChooseStore(false)}
        options={optionsStore.filter(_option => !_refProductId.current?.scProductMapping?.some(_scPro => _scPro.store_id == _option.value && _scPro.connector_channel_code === 'lazada'))}
        idProductCreated={'idProductCreated'}
        onChoosed={_channel => {
          history.push({
            pathname: '/product-stores/new',
            state: {
              channel: _channel,
              idProductCreated: _refProductId.current?.id
            }
          })
        }}
      />
    </div>
  );
}
