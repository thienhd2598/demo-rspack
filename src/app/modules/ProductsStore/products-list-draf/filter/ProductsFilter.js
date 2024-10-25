import React, { useEffect, useMemo, useState } from "react";
import { Formik } from "formik";
import { isEqual } from "lodash";
import { useProductsUIContext } from "../../ProductsUIContext";
import { FormattedMessage, useIntl } from "react-intl";
import { Link, useHistory, useLocation } from "react-router-dom";
import queryString from 'querystring'
import { useMutation, useQuery } from "@apollo/client";
import Select from "react-select";
import ProductCount from "./ProductCount";
import { TYPE_COUNT } from "../../ProductsUIHelpers";
import mutate_scProductSyncUp from "../../../../../graphql/mutate_scProductSyncUp";
import op_connector_channels from "../../../../../graphql/op_connector_channels";
import query_scStatisticScProducts from "../../../../../graphql/query_scStatisticScProducts";
import { formatNumberToCurrency } from '../../../../../utils'
import query_sc_stores_basic from "../../../../../graphql/query_sc_stores_basic";
import { Dropdown } from "react-bootstrap";
import CategorySelect from "../../../../../components/CategorySelect";
import * as Yup from "yup";
import op_sale_channel_categories from "../../../../../graphql/op_sale_channel_categories";
import _ from 'lodash';
import { useToasts } from "react-toast-notifications";
import { OPTIONS_CONNECTED, OPTIONS_ORIGIN_IMAGE } from '../../ProductsUIHelpers';
import AuthorizationWrapper from "../../../../../components/AuthorizationWrapper";

export function ProductsFilter({ onDelete, onHide, categorySelected, onSelect, onCreateBatch, onCreateFrameImgBatch, onRemoveFrameImgBatch, onProductSyncUp, onToggleDrawer, onUpdateProduct }) {
  const location = useLocation()
  const history = useHistory()
  const [categories, setCategories] = useState({})
  const { formatMessage } = useIntl()
  const { data: dataStore, loading } = useQuery(query_sc_stores_basic, {
    fetchPolicy: 'cache-and-network'
  })
  const { data } = useQuery(op_connector_channels, {
    variables: {
      context: 'product'
    },
    fetchPolicy: 'cache-and-network'
  })

  const params = queryString.parse(location.search.slice(1, 100000))

  let currentChannel = params?.channel || 'shopee'

  // Products UI Context
  const { ids, optionsProductTag } = useProductsUIContext();
  const [scProductSyncUp] = useMutation(mutate_scProductSyncUp, {
    refetchQueries: ['sme_catalog_product']
  });


  const { data: dataCategories } = useQuery(op_sale_channel_categories, {
    variables: {
      connector_channel_code: currentChannel
    },
    // fetchPolicy: 'cache-and-network'
  })


  useMemo(() => {
    let _categories = _.groupBy(dataCategories?.sc_sale_channel_categories, _cate => _cate.parent_id || 'root');
    setCategories(_categories)
  }, [dataCategories])


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

  let categoryId = useMemo(
    () => {
      if (!params?.categoryId) return null;

      return Number(params?.categoryId);
    }, [params?.categoryId]
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

  let whereCondition = useMemo(
    () => {
      return {
        store_id: store_id,
        sc_category_id: categoryId,
        q: !!params.name ? params.name : '',
        tag_name: !!params.tags ? params.tags : '',
        filter_map_sme,
        has_origin_img,
        is_draft: 1
      }
    }, [store_id, categoryId, params, filter_map_sme, has_origin_img]
  );

  const { data: dataStatis, error, loading: loadingStatics } = useQuery(query_scStatisticScProducts, {
    fetchPolicy: 'cache-and-network',
    variables: {
      ...whereCondition
    }
  })

  const groupStatics = useMemo(() => {
    let inactive = 0;
    let incoming_out_stock = 0;
    let out_stock = 0;
    let active = 0;
    let total_not_syncup = 0;
    let not_map_sme = 0;
    let banned = 0;
    (dataStatis?.scStatisticScProducts || []).filter(_static => !currentChannel || _static.connector_channel_code == currentChannel).forEach(_static => {
      inactive += _static.group.inactive;
      incoming_out_stock += _static.group.incoming_out_stock;
      out_stock += _static.group.out_stock;
      active += _static.group.active;
      total_not_syncup += _static.group.total_not_syncup;
      not_map_sme += _static.group.not_map_sme;
      banned += _static.group.banned;
    });
    return { active, incoming_out_stock, out_stock, inactive, total_not_syncup, not_map_sme, banned }
  }, [dataStatis, currentChannel]);

  const [current, options] = useMemo(() => {
    let _options = dataStore?.sc_stores?.filter(_store => !currentChannel || _store.connector_channel_code == currentChannel)
      .map(_store => {
        let _channel = dataStore?.op_connector_channels?.find(_ccc => _ccc.code == _store.connector_channel_code)
        return { label: _store.name, value: _store.id, logo: _channel?.logo_asset_url }
      }) || [];

    let _current = _options.find(_store => _store.value == params?.store)
    return [_current, _options]
  }, [dataStore, params]);

  const checkedFilterBoxProducts = useMemo(
    () => {
      const KEYS_IN_BOX_SEARCH = ['tags', 'has_origin_img', 'filter_map_sme', 'categoryId', 'store'];

      let checked = KEYS_IN_BOX_SEARCH?.some(
        _key => _key in params
      );

      return checked;
    }, [location.search]
  );

  const currentTags = useMemo(
    () => {
      let parseParamsTags = params?.tags?.split(',');
      let _current = optionsProductTag?.filter(
        _option => parseParamsTags?.some(param => param == _option?.label)
      );

      return _current || []
    }, [params, optionsProductTag]
  );
  const currentTagsImg = useMemo(
    () => {
      let parseParamsTags = params?.has_origin_img?.split(',');
      let _current = OPTIONS_ORIGIN_IMAGE?.filter(
        _option => parseParamsTags?.some(param => param == _option?.value)
      );

      return _current || []
    }, [params, OPTIONS_ORIGIN_IMAGE]
  );
  console.log('tagg', currentTagsImg)
  const filterBlock = useMemo(
    () => {
      let blockOriginImage = OPTIONS_ORIGIN_IMAGE?.find(_option => _option.value === Number(params?.has_origin_img)) || undefined;
      let blockProductConnected = OPTIONS_CONNECTED?.find(_option => _option.value === Number(params?.filter_map_sme)) || undefined;
      let blockStore = options?.find(_option => _option?.value === Number(params?.store)) || undefined;
      let blockTags = optionsProductTag?.filter(
        _option => params?.tags?.split(',')?.some(_tag => _tag == _option?.label)
      ) || [];

      return (
        <div className="d-flex flex-wrap mt-4" style={{ gap: 10 }}>
          {blockOriginImage && (
            <span
              className="mb-4 py-2 px-4 d-flex justify-content-between align-items-center"
              style={{ border: '1px solid #ff6d49', borderRadius: 20, background: 'rgba(255,109,73, .1)' }}
            >
              <span>{blockOriginImage?.name}</span>
              <i
                className="fas fa-times icon-md ml-4"
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  history.push(`${location.pathname}?${queryString.stringify({
                    ..._.omit(params, 'has_origin_img')
                  })}`.replaceAll('%2C', '\,'));
                }}
              />
            </span>
          )}
          {blockProductConnected && (
            <span
              className="mb-4 py-2 px-4 d-flex justify-content-between align-items-center"
              style={{ border: '1px solid #ff6d49', borderRadius: 20, background: 'rgba(255,109,73, .1)' }}
            >
              <span>{blockProductConnected?.name}</span>
              <i
                className="fas fa-times icon-md ml-4"
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  history.push(`${location.pathname}?${queryString.stringify({
                    ..._.omit(params, 'filter_map_sme')
                  })}`.replaceAll('%2C', '\,'));
                }}
              />
            </span>
          )}
          {blockStore && (
            <span
              className="mb-4 py-2 px-4 d-flex justify-content-between align-items-center"
              style={{ border: '1px solid #ff6d49', borderRadius: 20, background: 'rgba(255,109,73, .1)' }}
            >
              <span className="d-flex align-items-center">{formatMessage({ defaultMessage: 'Gian hàng' })}: <span className="ml-2"><img src={blockStore.logo} style={{ width: 20, height: 20, marginRight: 4 }} /> {blockStore.label}</span></span>
              <i
                className="fas fa-times icon-md ml-4"
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  history.push(`${location.pathname}?${queryString.stringify({
                    ..._.omit(params, 'store')
                  })}`.replaceAll('%2C', '\,'));
                }}
              />
            </span>
          )}
          {blockTags?.length > 0 && (
            <span
              className="mb-4 py-2 px-4 d-flex justify-content-between align-items-center"
              style={{ border: '1px solid #ff6d49', borderRadius: 20, background: 'rgba(255,109,73, .1)' }}
            >
              <span>{`Tag: ${_.map(blockTags, 'label')?.join(', ')}`}</span>
              <i
                className="fas fa-times icon-md ml-4"
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  history.push(`${location.pathname}?${queryString.stringify({
                    ..._.omit(params, 'tags')
                  })}`.replaceAll('%2C', '\,'));
                }}
              />
            </span>
          )}
        </div>
      )
    }, [location?.search, options, optionsProductTag]
  );

  // function handleSearchTags(events) {
  //   const value = events.target.value
  //   if(value) {
  //     history.push(`/product-stores/draf?${queryString.stringify({
  //       ...params,
  //       page: 1,
  //       tags: value || ''
  //     })}`)
  //   }
  // }

  return (
    <>
      <div className="row mb-4">
        <div className="col-3 d-flex align-items-center mr-4" style={{ zIndex: 99 }}>
          {/* <input type="text" className="form-control" placeholder="Nhập tag"
              style={{ height: 40 }}
              onBlur={handleSearchTags}
              defaultValue={params.name || ''}
              onKeyDown={e => {
                if (e.keyCode == 13) {
                  history.push(`/product-stores/draf?${queryString.stringify({
                    ...params,
                    page: 1,
                    tags: e.target.value || ''
                  })}`)
                }
              }}
              /> */}
          <Select
            className="w-100"
            placeholder={formatMessage({ defaultMessage: "Nhập tags" })}
            isMulti
            isClearable
            isSearchable={false}
            value={currentTags}
            onChange={values => {
              let paramsTag = values?.length > 0
                ? _.map(values, 'label')?.join(',')
                : undefined;

              history.push(`/product-stores/draf?${queryString.stringify({
                ...params,
                page: 1,
                tags: paramsTag
              })}`)
            }}
            options={optionsProductTag}
          />
        </div>
        <div className="col-3 d-flex align-items-center" style={{ zIndex: 99 }}>
          <span style={{ width: 75 }}>{formatMessage({ defaultMessage: 'Ảnh gốc' })}</span>
          <Select
            options={OPTIONS_ORIGIN_IMAGE}
            className="w-100 custom-select-order"
            style={{ borderRadius: 0 }}
            value={('has_origin_img' in params && Number(params?.has_origin_img)) ?
              OPTIONS_ORIGIN_IMAGE.find((_op) => _op.value == params?.has_origin_img)
              : Number(params?.has_origin_img)
                ? OPTIONS_ORIGIN_IMAGE[0]
                : OPTIONS_ORIGIN_IMAGE[0]}
            onChange={value => {
              let valueChecked = value.value;
              if (
                'has_origin_img' in params
                && Number(params?.has_origin_img) == value.value
              ) valueChecked = undefined;

              history.push(`/product-stores/draf?${queryString.stringify({
                ...params,
                page: 1,
                has_origin_img: valueChecked
              })}`)
            }}
            formatOptionLabel={(option, labelMeta) => {
              return <div>{formatMessage(option.name)}</div>;
            }}
          />
          {/* <select
            style={{ fontSize: '13px', color: '#5e6278', borde: '1px solid #D9D9D9' }}
            onChange={e => {
              let valueChecked = e.target.value;
              if (
                'has_origin_img' in params
                && Number(params?.has_origin_img) == e.target.value
              ) valueChecked = undefined;

              history.push(`/product-stores/draf?${queryString.stringify({
                ...params,
                page: 1,
                has_origin_img: valueChecked
              })}`)
            }}
            className="form-control">
            {OPTIONS_ORIGIN_IMAGE?.map(__option => <option value={__option.value}>{__option.name}</option>)}
          </select> */}
          {/* <div
            className="d-flex"
            onChange={e => {
              let valueChecked = e.target.value;
              if (
                'has_origin_img' in params
                && Number(params?.has_origin_img) == e.target.value
              ) valueChecked = undefined;

              history.push(`/product-stores/draf?${queryString.stringify({
                ...params,
                page: 1,
                has_origin_img: valueChecked
              })}`)
            }}
          >
            {OPTIONS_ORIGIN_IMAGE?.map(_option => (
              <label
                key={`option-origin-image-${_option.value}`}
                className="radio mr-4"
              >
                <input
                  type="checkbox"
                  value={_option.value}
                  checked={_option.value === Number(params?.has_origin_img || 3)}
                />
                <span></span>
                <p className="mb-0 ml-2">{_option.name}</p>
              </label>
            ))}
          </div> */}
        </div>
      </div>
      {!!data && (
        <div
          className={`d-flex align-items-center flex-wrap `}
        >
          {
            data?.op_connector_channels.map(_channel => {
              let statics = dataStatis?.scStatisticScProducts?.find(_static => _static.connector_channel_code == _channel.code)
              return (
                <div className="d-flex align-items-center justify-content-between col-2 mr-12" key={`_channel-${_channel.code}`} style={{
                  border: currentChannel == _channel.code ? '1px solid #FE5629' : '1px solid #D9D9D9',
                  borderRadius: 4, padding: 10, flex: 1, cursor: 'pointer'
                }}
                  onClick={e => {
                    e.preventDefault()
                    history.push(`/product-stores/draf?${queryString.stringify(_.omit({
                      ...params,
                      page: 1,
                      channel: _channel.code,
                    }, 'store'))}`)
                  }} >
                  <span> <img src={_channel.logo_asset_url} style={{ width: 30, height: 30 }} /> {_channel.name}</span>
                  <span style={{ fontSize: 18 }}>
                    <ProductCount
                      whereCondition={
                        {
                          connector_channel_code: _channel.code,
                          tag_name: !!params.tags ? params.tags : '',
                          has_origin_img,
                          status: 2
                        }
                      }
                    />
                  </span>
                </div>
              )
            })
          }
        </div>
      )}
      <div className="form-group row d-flex align-items-center  mb-0 mt-6">
        <div className="col-3 input-icon " style={{ height: 'fit-content' }} >
          <input type="text" className="form-control" placeholder={formatMessage({ defaultMessage: "Tên sản phẩm/SKU" })}
            onBlur={(e) => {
              history.push(`/product-stores/draf?${queryString.stringify({
                ...params,
                page: 1,
                name: e.target.value
              })}`)
            }}
            defaultValue={params.name || ''}
            onKeyDown={e => {
              if (e.keyCode == 13) {
                history.push(`/product-stores/draf?${queryString.stringify({
                  ...params,
                  page: 1,
                  name: e.target.value
                })}`)
              }
            }}
          />
          <span><i className="flaticon2-search-1 icon-md ml-6"></i></span>
        </div>

        <div className="col-3 d-flex align-items-center" style={{ zIndex: 22 }}>
          <span style={{ width: 100 }}>{formatMessage({ defaultMessage: 'Gian hàng' })}</span>
          <Select
            value={current || null}
            options={options}
            className='w-100'
            placeholder={formatMessage({ defaultMessage: 'Chọn gian hàng' })}
            isClearable
            isLoading={loading}
            onChange={value => {
              history.push(`/product-stores/draf?${queryString.stringify({
                ...params,
                page: 1,
                store: value?.value || undefined
              })}`)
              // onUpdateFilterParams('store', value?.value || undefined);
              // onUpdateFilterParams('page', 1);
            }}
            formatOptionLabel={(option, labelMeta) => {
              return <div> <img src={option.logo} style={{ width: 20, height: 20, marginRight: 8 }} /> {option.label}</div>
            }}
          />
        </div>


      </div>

      <div className='d-flex mb-4 w-100 justify-content-between align-items-center' style={{ position: 'sticky', top: 44, background: '#fff', zIndex: 2 }}>
        <div className="d-flex align-items-center col-12 mt-3 mb-3">
          {<div className="text-primary mr-3" style={{ fontSize: 14 }}>{formatMessage({ defaultMessage: 'Đã chọn' })}: {ids?.length ?? 0} {formatMessage({ defaultMessage: 'sản phẩm' })}</div>}
          {
            <AuthorizationWrapper keys={['product_store_list_draft_action']}> 
              <Dropdown drop='down'>
                <Dropdown.Toggle disabled={!ids.length} className={`btn ${ids.length ? 'btn-primary' : 'btn-darkk'}`}>
                  {formatMessage({ defaultMessage: 'Thao tác hàng loạt' })}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item className="mb-1 d-flex" onClick={async e => {
                    onProductSyncUp({
                      list_product_id: ids.map(_idsss => _idsss.id)
                    })
                  }} >
                    {formatMessage({ defaultMessage: 'Đăng bán sản phẩm' })}
                  </Dropdown.Item>
                  <Dropdown.Item className="mb-1 d-flex" onClick={async e => {
                    e.preventDefault();
                    onUpdateProduct({
                      list_product: ids,
                      urlTo: '/product-stores/update-sell-info'
                    })
                  }}>
                    {formatMessage({ defaultMessage: 'Sửa giá & tồn kho' })}
                  </Dropdown.Item>
                  <Dropdown.Item className="mb-1 d-flex" onClick={async e => {
                    e.preventDefault();
                    onUpdateProduct({
                      list_product: ids,
                      urlTo: '/product-stores/update-images'
                    })
                  }}>
                    {formatMessage({ defaultMessage: 'Sửa ảnh sản phẩm' })}
                  </Dropdown.Item>
                  <Dropdown.Item className="mb-1 d-flex" onClick={async e => {
                    e.preventDefault();

                    let productHasTemplateImgOrigin = ids.filter(img => img.productAssets.some(_asset => _asset.type === 4 && !!_asset.template_image_url));
                    onUpdateProduct({
                      product_has_template_origin: productHasTemplateImgOrigin?.map(_product => _product.name),
                      list_product: ids,
                      urlTo: '/product-stores/update-tag-origin-image-draf',
                    })
                  }}>
                    {formatMessage({ defaultMessage: 'Sửa ảnh gốc & tag' })}
                  </Dropdown.Item>
                  <Dropdown.Item className="mb-1 d-flex" onClick={async e => {
                    onHide({
                      action_type: 1,
                      list_product_id: ids.map(_idsss => _idsss.id)
                    })
                  }} >{formatMessage({ defaultMessage: 'Xoá sản phẩm' })}</Dropdown.Item>


                  {/* {
                process.env.REACT_APP_MODE == 'STAG' && <Dropdown.Item className="mb-1 d-flex" onClick={async e => {
                  e.preventDefault();
                  onUpdateProduct({
                    list_product: ids,
                    urlTo: '/product-stores/update-sell-info-draf'
                  })
                }}>
                  Sửa ảnh sản phẩm
                </Dropdown.Item>
              } */}

                </Dropdown.Menu>
              </Dropdown>
            </AuthorizationWrapper>
          }
          <div className='col-6 text-right' style={{ marginLeft: 'auto' }}>
            <AuthorizationWrapper keys={['product_store_create']}>
              <button
                className="btn btn-primary"
                type="submit"
                onClick={async (e) => {
                  e.preventDefault();
                  history.push('/product-stores/new')
                }} >{formatMessage({ defaultMessage: 'Thêm sản phẩm' })}</button>
              </AuthorizationWrapper>
          </div>
        </div>
      </div>
    </>
  );
}
