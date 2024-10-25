import { useMutation, useQuery } from "@apollo/client";
import _ from 'lodash';
import queryString from 'querystring';
import React, { useMemo, useState } from "react";
import { Dropdown } from "react-bootstrap";
import { useIntl } from "react-intl";
import { useHistory, useLocation } from "react-router-dom";
import Select from "react-select";
import { useToasts } from "react-toast-notifications";
import AuthorizationWrapper from "../../../../../components/AuthorizationWrapper";
import mutate_scProductSyncUp from "../../../../../graphql/mutate_scProductSyncUp";
import op_connector_channels from "../../../../../graphql/op_connector_channels";
import op_sale_channel_categories from "../../../../../graphql/op_sale_channel_categories";
import query_sc_stores_basic from "../../../../../graphql/query_sc_stores_basic";
import query_scStatisticScProducts from "../../../../../graphql/query_scStatisticScProducts";
import { useProductsUIContext } from "../../ProductsUIContext";
import { OPTIONS_ORIGIN_IMAGE, TYPE_COUNT } from "../../ProductsUIHelpers";
import ProductCount from "./ProductCount";
import query_scListPrefixName from "../../../../../graphql/query_scListPrefixName";
import TreePicker from "rsuite/TreePicker";

export function ProductsFilter({ onDelete, onHide, categorySelected, onSelect, onCreateBatch, onCreateFrameImgBatch, onRemoveFrameImgBatch, onCreateMutilTag,
  onToggleDrawer, onUnlinkProduct, onCloneStoreProduct, onUpdateProduct, onReload,
  onAutoLinkProduct, onAutoLinkProductInfo }) {
  const { formatMessage } = useIntl();
  const location = useLocation()
  const history = useHistory()
  const { addToast } = useToasts();
  const [currentCategory, setCurrentCategory] = useState([]);

  const { data: dataStore, loading } = useQuery(query_sc_stores_basic, {
    fetchPolicy: 'cache-and-network'
  });

  const { data } = useQuery(op_connector_channels, {
    variables: {
      context: 'product'
    },
    fetchPolicy: 'cache-and-network'
  })

  const { data: dataListPrefixName } = useQuery(query_scListPrefixName, {
    fetchPolicy: 'cache-and-network'
  });

  const params = queryString.parse(location.search.slice(1, 100000))

  let currentChannel = params?.channel || 'shopee';

  const OPTIONS_CONNECTED = [
    { value: '', label: formatMessage({ defaultMessage: 'Tất cả' }) },
    { value: 1, label: formatMessage({ defaultMessage: 'Đã liên kết' }) },
    { value: 0, label: formatMessage({ defaultMessage: 'Chưa liên kết' }) }
  ];

  // Products UI Context
  const { ids, setIds, optionsProductTag } = useProductsUIContext();
  const [scProductSyncUp] = useMutation(mutate_scProductSyncUp, {
    refetchQueries: ['sme_catalog_product']
  });

  const { data: dataCategories } = useQuery(op_sale_channel_categories, {
    variables: {
      connector_channel_code: currentChannel
    },
    // fetchPolicy: 'cache-and-network'
  });

  // const [options,] = useMemo(() => {
  //   let _options = dataStore?.sc_stores?.filter(_store => _store.status == 1).map(_store => {
  //     let _channel = dataStore?.op_connector_channels?.find(_ccc => _ccc.code == _store.connector_channel_code)
  //     return {
  //       label: _store.name,
  //       value: _store.id,
  //       logo: _channel?.logo_asset_url,
  //       connector_channel_code: _store.connector_channel_code,
  //       connector_channel_name: _channel.name
  //     }
  //   }) || [];

  //   return [_options];
  // }, [dataStore]);

  useMemo(
    () => {
      if (!params?.categoryId || !dataCategories?.sc_sale_channel_categories) {
        setCurrentCategory([]);
        return;
      };

      let currentSelected = dataCategories?.sc_sale_channel_categories?.find(_cate => _cate.id === Number(params?.categoryId));

      let categoryParamsSelected = [...dataCategories?.sc_sale_channel_categories]
        ?.sort((a, b) => b.id - a.id)
        ?.reduce(
          (prev, value) => {
            let { parent_id } = prev[prev?.length - 1];

            if (!!parent_id && parent_id === value?.id) {
              return prev.concat(value);
            }

            return prev;
          }, [currentSelected]
        )
        ?.reverse();

      setCurrentCategory(categoryParamsSelected);
    }, [dataCategories, params?.categoryId]
  );



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

  const currentTags = useMemo(
    () => {
      let parseParamsTags = params?.tags?.split(',');
      let _current = optionsProductTag?.filter(
        _option => parseParamsTags?.some(param => param == _option?.label)
      );

      return _current || []
    }, [params, optionsProductTag]
  );

  const optionsFilterPrefix = useMemo(() => {
    return [
      { value: 1, label: formatMessage({ defaultMessage: 'Sản phẩm chưa có tiền tố tên' }), children: [] },
      {
        value: 2,
        label: formatMessage({ defaultMessage: 'Sản phẩm đã có tiền tố tên' }),
        children: dataListPrefixName?.scListPrefixName?.data?.map(item => ({
          value: item,
          label: item,
          parent_value: 2
        }))
      },
    ]
  }, [dataListPrefixName]);

  const currentTreePicker = useMemo(() => {
    if (params?.prefix_type == 1) return 1;
    if (!!params?.prefix_name) return params?.prefix_name;

    return null
  }, [params?.prefix_type, params?.prefix_name]);

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
  }, [params?.filter_map_sme]);

  let has_origin_img = useMemo(() => {
    let has_origin_img = Number(params?.has_origin_img);
    if (!isNaN(has_origin_img)) {
      return has_origin_img
    }
    return null
  }, [params?.has_origin_img])

  const prefix_name = useMemo(() => {
    if (params?.prefix_type) {
      return {
        prefix_name: params?.prefix_name
      }
    }
    return {}
  }, [params?.prefix_type, params?.prefix_name]);

  const { data: dataStatis, error, loading: loadingStatics } = useQuery(query_scStatisticScProducts, {
    fetchPolicy: 'cache-and-network',
    variables: {
      store_id: store_id,
      sc_category_id: categoryId,
      q: !!params.name ? params.name : '',
      tag_name: !!params.tags ? params.tags : '',
      filter_map_sme,
      has_origin_img,
      is_draft: 2,
      ...prefix_name
    }
  });

  const groupStatics = useMemo(() => {
    let inactive = 0;
    let incoming_out_stock = 0;
    let out_stock = 0;
    let active = 0;
    let total_not_syncup = 0;
    let not_map_sme = 0;
    let banned = 0;
    let virtual = 0;
    (dataStatis?.scStatisticScProducts || []).filter(_static => !currentChannel || _static.connector_channel_code == currentChannel).forEach(_static => {
      inactive += _static.group.inactive;
      incoming_out_stock += _static.group.incoming_out_stock;
      out_stock += _static.group.out_stock;
      active += _static.group.active;
      total_not_syncup += _static.group.total_not_syncup;
      not_map_sme += _static.group.not_map_sme;
      banned += _static.group.banned;
      virtual += _static.group.virtual;
    });
    return { active, incoming_out_stock, out_stock, inactive, total_not_syncup, not_map_sme, banned, virtual }
  }, [dataStatis, currentChannel]);

  const checkedFilterBoxProducts = useMemo(
    () => {
      const KEYS_IN_BOX_SEARCH = ['tags', 'has_origin_img', 'filter_map_sme', 'categoryId', 'store'];

      let checked = KEYS_IN_BOX_SEARCH?.some(
        _key => _key in params
      );

      return checked;
    }, [location.search]
  );

  const [current, options] = useMemo(() => {
    let _options = dataStore?.sc_stores?.filter(_store => !currentChannel || _store.connector_channel_code == currentChannel)
      .map(_store => {
        let _channel = dataStore?.op_connector_channels?.find(_ccc => _ccc.code == _store.connector_channel_code)
        return { label: _store.name, value: _store.id, logo: _channel?.logo_asset_url }
      }) || [];

    let _current = _options.find(_store => _store.value == params?.store)

    return [_current, _options]
  }, [dataStore, params]);

  const filterBlock = useMemo(
    () => {
      let blockOriginImage = OPTIONS_ORIGIN_IMAGE?.find(_option => _option.value === Number(params?.has_origin_img)) || undefined;
      let blockProductConnected = OPTIONS_CONNECTED?.find(_option => _option.value === Number(params?.filter_map_sme)) || undefined;
      let blockStore = options?.find(_option => _option?.value === Number(params?.store)) || undefined;
      let blockTags = optionsProductTag?.filter(
        _option => params?.tags?.split(',')?.some(_tag => _tag == _option?.label)
      ) || [];

      return (
        <div className="d-flex flex-wrap mb-4" style={{ gap: 10 }}>
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
              <span className="d-flex align-items-center">{formatMessage({ defaultMessage: `Gian hàng` })}: <span className="ml-2"><img src={blockStore.logo} style={{ width: 20, height: 20, marginRight: 4 }} /> {blockStore.label}</span></span>
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
          {currentCategory?.length > 0 && (
            <span
              className="mb-4 py-2 px-4 d-flex justify-content-between align-items-center"
              style={{ border: '1px solid #ff6d49', borderRadius: 20, background: 'rgba(255,109,73, .1)' }}
            >
              <span>{`${formatMessage({ defaultMessage: 'Ngành hàng' })}: ${_.map(currentCategory, 'display_name')?.join(' > ')}`}</span>
              <i
                className="fas fa-times icon-md ml-4"
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  history.push(`${location.pathname}?${queryString.stringify({
                    ..._.omit(params, 'categoryId')
                  })}`.replaceAll('%2C', '\,'));
                }}
              />
            </span>
          )}
        </div>
      )
    }, [location?.search, options, optionsProductTag, currentCategory]
  );

  return (
    <>
      <div className="row mb-4">
        <div className="col-4 d-flex align-items-center" style={{ zIndex: 95 }}>
          {/* <p className="mb-2 font-weight-bold" style={{ width: 120 }}>Tag sản phẩm</p> */}
          <Select
            className="w-100"
            placeholder={formatMessage({ defaultMessage: "Nhập tags" })}
            isMulti
            isClearable
            value={currentTags}
            onChange={values => {
              let paramsTag = values?.length > 0
                ? _.map(values, 'label')?.join(',')
                : undefined;

              history.push(`/product-stores/list?${queryString.stringify({
                ...params,
                page: 1,
                tags: paramsTag
              })}`)
            }}
            options={optionsProductTag}
          />

        </div>
        <div className="col-4 d-flex align-items-center" style={{ zIndex: 96 }}>
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

              history.push(`/product-stores/list?${queryString.stringify({
                ...params,
                page: 1,
                has_origin_img: valueChecked
              })}`)
            }}
            formatOptionLabel={(option, labelMeta) => {
              return <div>{formatMessage(option.name)}</div>;
            }}
          />
        </div>
        <div className="col-4 d-flex align-items-center" style={{ zIndex: 96 }}>
          <div className="mr-2" style={{ minWidth: 'fit-content' }}>
            <span>{formatMessage({ defaultMessage: 'Tiền tố tên' })}</span>
          </div>
          <TreePicker
            className="upbase-picker-tree"
            searchable={false}
            data={optionsFilterPrefix}
            style={{ width: '85%', height: 40 }}
            showIndentLine
            placement="bottomEnd"
            defaultExpandAll
            menuStyle={{ marginTop: 6 }}
            value={currentTreePicker}
            placeholder={formatMessage({ defaultMessage: 'Tất cả' })}
            onChange={(value) => {
              if (!value) {
                history.push(`/product-stores/list?${queryString.stringify(_.omit({ ...params, page: 1, }, ['prefix_name', 'prefix_type']))}`);
              }
            }}
            renderTreeIcon={(nodeData, expanded) => {
              if (nodeData?.value == 1) return <></>

              if (nodeData?.expand) {
                return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-caret-down-fill" viewBox="0 0 16 16">
                  <path d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z" />
                </svg>
              } else {
                return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-caret-right-fill" viewBox="0 0 16 16">
                  <path d="m12.14 8.753-5.482 4.796c-.646.566-1.658.106-1.658-.753V3.204a1 1 0 0 1 1.659-.753l5.48 4.796a1 1 0 0 1 0 1.506z" />
                </svg>
              }
            }}
            onSelect={(value) => {
              let queryBuilder;
              if (value?.children?.length > 0) {
                return;
              } else {
                if (value?.children?.length == 0) {
                  queryBuilder = {
                    ...params,
                    page: 1,
                    prefix_type: 1,
                    prefix_name: ''
                  }
                } else {
                  queryBuilder = {
                    ...params,
                    page: 1,
                    prefix_type: 2,
                    prefix_name: value?.value
                  }
                }
              }

              history.push(`/product-stores/list?${queryString.stringify(queryBuilder)}`)
            }}
            renderTreeNode={nodeData => {
              if (nodeData?.value == 1) return <span style={!!nodeData?.children ? { pointerEvents: 'none' } : {}}>{nodeData.label}</span>

              return (
                <span
                  className="d-flex align-items-center"
                  style={!!nodeData?.children ? { cursor: 'not-allowed' } : {}}
                  onClick={e => {
                    if (!!nodeData?.children) { e.stopPropagation() }
                  }}
                >
                  <span style={!!nodeData?.children ? { pointerEvents: 'none' } : {}}>{nodeData.label}</span>
                </span>
              );
            }}
            renderValue={(value, selectedItems, selectedElement) => {
              let labels = [selectedElement];
              if (!!selectedItems?.parent) {
                labels = [selectedItems?.parent?.label].concat(labels)
              }              

              return <div className="d-flex align-items-center">
                {!!labels[selectedItems?.value == 1 ? 0 : 1] && <span>{labels[selectedItems?.value == 1 ? 0 : 1]}</span>}
              </div>
            }}
          />
        </div>
      </div>
      {!!data && (
        <div
          className={`d-flex align-items-center flex-wrap`}
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
                    history.push(`/product-stores/list?${queryString.stringify(_.omit({
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
                          ...prefix_name,
                          has_origin_img,
                          is_draft: 2
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
      <div className="form-group row d-flex align-items-center mb-4 mt-6">
        <div className="col-4 input-icon " style={{ height: 'fit-content' }} >
          <input type="text" className="form-control" placeholder={formatMessage({ defaultMessage: "Tên sản phẩm/SKU" })}
            onBlur={(e) => {
              history.push(`/product-stores/list?${queryString.stringify({
                ...params,
                page: 1,
                name: e.target.value
              })}`)
            }}
            defaultValue={params.name || ''}
            onKeyDown={e => {
              if (e.keyCode == 13) {
                history.push(`/product-stores/list?${queryString.stringify({
                  ...params,
                  page: 1,
                  name: e.target.value
                })}`)
              }
            }}
          />
          <span><i className="flaticon2-search-1 icon-md ml-6"></i></span>
        </div>

        <div className="col-4 d-flex align-items-center" style={{ zIndex: 95 }}>
          <span style={{ width: 100 }}>{formatMessage({ defaultMessage: 'Gian hàng' })}</span>
          <Select
            value={current || null}
            options={options}
            className='w-100'
            placeholder={formatMessage({ defaultMessage: 'Chọn gian hàng' })}
            isClearable
            isLoading={loading}
            onChange={value => {
              history.push(`/product-stores/list?${queryString.stringify({
                ...params,
                page: 1,
                store: value?.value || undefined
              })}`)
            }}
            formatOptionLabel={(option, labelMeta) => {
              return <div> <img src={option.logo} style={{ width: 20, height: 20, marginRight: 8 }} /> {option.label}</div>
            }}
          />
        </div>

        <div className="col-4 d-flex align-items-center" style={{ zIndex: 95 }}>
          <span style={{ width: 100 }}>{formatMessage({ defaultMessage: 'Liên kết' })}</span>
          <Select
            value={_.find(OPTIONS_CONNECTED, option => String(params?.filter_map_sme) === String(option.value)) || OPTIONS_CONNECTED[0]}
            options={OPTIONS_CONNECTED}
            className='w-100'
            placeholder={formatMessage({ defaultMessage: 'Chọn liên kêt' })}
            onChange={value => {
              history.push(`/product-stores/list?${queryString.stringify(_.omit({
                ...params,
                page: 1,
                filter_map_sme: String(value?.value)
              }, String(value?.value)?.length > 0 ? [] : ['filter_map_sme']))}`)
            }}
          />
        </div>
      </div>

      {/* {filterBlock} */}

      <div className='d-flex flex-column' style={{ position: 'sticky', top: 45, background: '#fff', zIndex: 90 }}>
        <div className="row">
          <div className="d-flex align-items-center mb-3 col-12">
            {params?.type !== TYPE_COUNT.HANG_HOA_AO && <div className="text-primary mr-3" style={{ fontSize: 14 }}>
              {formatMessage({ defaultMessage: `Đã chọn: {count} sản phẩm` }, { count: ids?.length ?? 0 })}
            </div>}
            {params?.type !== TYPE_COUNT.HANG_HOA_AO &&
              <Dropdown drop='down'>
                <Dropdown.Toggle disabled={!ids.length} className={`btn ${ids.length ? 'btn-primary' : 'btn-darkk'}`}>
                  {formatMessage({ defaultMessage: 'Thao tác hàng loạt' })}
                </Dropdown.Toggle>

                <Dropdown.Menu>
                  <AuthorizationWrapper keys={['product_store_action']}>

                    <Dropdown.Item className="mb-1 d-flex" onClick={async e => {
                      let productNotImgOrigin = ids.filter(img => !img.productAssets.some(_asset => _asset.type === 4));
                      onCreateFrameImgBatch({
                        list_product_id: ids.map(_idsss => _idsss.id),
                        list_product: ids,
                        product_not_img_origin: productNotImgOrigin?.map(_product => _product.name)
                      })
                    }}>
                      {formatMessage({ defaultMessage: 'Thêm tiền tố tên & khung ảnh' })}
                    </Dropdown.Item>
                    <Dropdown.Item className="mb-1 d-flex" onClick={async e => {
                      e.preventDefault();
                      onRemoveFrameImgBatch({
                        list_product_id: ids.map(_idsss => _idsss.id)
                      })
                    }}>
                      {formatMessage({ defaultMessage: 'Xoá tiền tố và khung ảnh' })}
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
                      {formatMessage({ defaultMessage: 'Sửa thông tin sản phẩm' })}
                    </Dropdown.Item>
                    <Dropdown.Item className="mb-1 d-flex" onClick={async e => {
                      e.preventDefault();

                      let productHasTemplateImgOrigin = ids.filter(img => img.productAssets.some(_asset => _asset.type === 4 && !!_asset.template_image_url));
                      onUpdateProduct({
                        product_has_template_origin: productHasTemplateImgOrigin?.map(_product => _product.name),
                        list_product: ids,
                        urlTo: '/product-stores/update-tag-origin-image',
                      })
                    }}>
                      {formatMessage({ defaultMessage: 'Sửa ảnh gốc & tag' })}
                    </Dropdown.Item>
                    <Dropdown.Item className="mb-1 d-flex" onClick={async e => onReload(ids)}>
                      {formatMessage({ defaultMessage: 'Tải lại sản phẩm' })}
                    </Dropdown.Item>
                    <Dropdown.Item className="mb-1 d-flex" onClick={async e => {
                      const isProductHide = ids.find(_idsss => _idsss.status == 4);
                      onHide({
                        action_type: 2,
                        list_product_id: ids.map(_idsss => _idsss.id),
                        is_product_hide: isProductHide,
                      })
                    }} >
                      {formatMessage({ defaultMessage: 'Ẩn sản phẩm' })}
                    </Dropdown.Item>
                  </AuthorizationWrapper>
                  {/* <Dropdown.Item className="mb-1 d-flex" onClick={async e => {
                      onHide({
                        action_type: 1,
                        list_product_id: ids.map(_idsss => _idsss.id)
                      })
                    }} >
                      {formatMessage({ defaultMessage: 'Xoá sản phẩm' })}
                    </Dropdown.Item> */}
                  <AuthorizationWrapper keys={['product_store_create_sme_product']}>
                    <Dropdown.Item
                      className="mb-1 d-flex"
                      onClick={async e => {
                        onCreateBatch({
                          store_id: ids.length > 0 ? ids[0].store_id : null,
                          products: ids,
                          isPass: ids?.every(ii => !ii?.sme_product_id) && ids?.every(ii => ii?.productVariants?.every(_variant => !_variant?.sme_product_variant_id))
                        })
                      }}
                    >
                      {formatMessage({ defaultMessage: 'Tạo sản phẩm kho từ sản phẩm sàn' })}
                    </Dropdown.Item>
                  </AuthorizationWrapper>
                  {/* <Dropdown.Item className="mb-1 d-flex" onClick={async e => {
                  if (ids.length == 0) {
                    addToast('Vui lòng chọn sản phẩm', { appearance: 'warning' });
                    return;
                  }

                  onCreateMutilTag(ids);
                  return
                }} >Thêm tag sản phẩm</Dropdown.Item> */}

                  {/* {
                  process.env.REACT_APP_MODE == 'STAG' && <Dropdown.Item className="mb-1 d-flex" onClick={async e => {
                    e.preventDefault();
                    onUpdateProduct({
                      list_product: ids,
                      urlTo: '/product-stores/update-sell-info'
                    })
                  }}>
                    Sửa ảnh sản phẩm
                  </Dropdown.Item>
                } */}


                  {/* <Dropdown.Item className="mb-1 d-flex" onClick={async e => {
                    e.preventDefault();
                    console.log(`id`, ids)
                    onUnlinkProduct({
                      list_product_id: ids.map(_idsss => _idsss.id)
                    });
                  }}>
                    Huỷ liên kết
                  </Dropdown.Item> */}
                </Dropdown.Menu>
              </Dropdown>
            }
            <div style={{ marginLeft: 'auto' }} className='text-right '>
              <AuthorizationWrapper keys={['product_store_clone']}>
                {
                  <button
                    className="btn mr-4"
                    style={{ color: '#ff5629', borderColor: '#ff5629', background: '#ffffff' }}
                    type="submit"
                    onClick={async (e) => {
                      e.preventDefault();
                      onCloneStoreProduct();
                    }}>
                    {formatMessage({ defaultMessage: 'Sao chép sản phẩm' })}
                  </button>
                }
              </AuthorizationWrapper>
              {/* <ButtonAutoLink onAutoLinkProduct={onAutoLinkProduct} onAutoLinkProductInfo={onAutoLinkProductInfo} /> */}
              <AuthorizationWrapper keys={['product_store_create']}>
                <button
                  className="btn btn-primary"
                  type="submit"
                  onClick={async (e) => {
                    e.preventDefault();
                    history.push('/product-stores/new')
                  }} >
                  {formatMessage({ defaultMessage: 'Thêm sản phẩm' })}
                </button>
              </AuthorizationWrapper>
            </div>
          </div>
        </div>

        <div className="d-flex w-100">
          <div style={{ flex: 1 }} >
            <ul style={{ borderBottom: 'none' }} className="nav nav-tabs" id="myTab" role="tablist" >
              <li style={{ background: '#ffffff' }} className={`${!params.type ? 'active' : ''} nav-item `}>
                <a className={`nav-link font-weight-normal ${!params.type ? 'active' : ''}`}
                  style={{ fontSize: '13px' }}
                  onClick={e => {
                    history.push(`/product-stores/list?${queryString.stringify({
                      ...params,
                      page: 1,
                      type: ''
                    })}`)
                  }}
                >{formatMessage({ defaultMessage: 'Tất cả' })}</a>
              </li>
              <li className={` ${params.type == TYPE_COUNT.DANG_HOAT_DONG ? 'active' : ''} nav-item`}>
                <a className={`nav-link font-weight-normal ${params.type == TYPE_COUNT.DANG_HOAT_DONG ? 'active' : ''}`}
                  style={{ fontSize: '13px', minWidth: 200, alignItems: 'center', justifyContent: 'center' }}
                  onClick={e => {
                    history.push(`/product-stores/list?${queryString.stringify({
                      ...params,
                      page: 1,
                      type: TYPE_COUNT.DANG_HOAT_DONG
                    })}`)
                  }}
                >
                  {formatMessage({ defaultMessage: `Đang hoạt động` })} {!loadingStatics ? `(${groupStatics.active})` : `( -- )`}
                </a>
              </li>
              <li className={`nav-item ${params.type == TYPE_COUNT.SAP_HET_HANG ? 'active' : ''}`}>
                <a className={`nav-link font-weight-normal ${params.type == TYPE_COUNT.SAP_HET_HANG ? 'active' : ''}`}
                  style={{ fontSize: '13px', minWidth: 200, alignItems: 'center', justifyContent: 'center' }}
                  onClick={e => {
                    history.push(`/product-stores/list?${queryString.stringify({
                      ...params,
                      page: 1,
                      type: TYPE_COUNT.SAP_HET_HANG
                    })}`)
                  }} >
                  {formatMessage({ defaultMessage: 'Sắp hết hàng' })} {!loadingStatics ? `(${groupStatics.incoming_out_stock})` : `( -- )`}
                </a>
              </li>
              <li className={`nav-item ${params.type == TYPE_COUNT.HET_HANG ? 'active' : ''}`}>
                <a className={`nav-link font-weight-normal ${params.type == TYPE_COUNT.HET_HANG ? 'active' : ''}`}
                  style={{ fontSize: '13px', minWidth: 140, alignItems: 'center', justifyContent: 'center' }}
                  onClick={e => {
                    history.push(`/product-stores/list?${queryString.stringify({
                      ...params,
                      page: 1,
                      type: TYPE_COUNT.HET_HANG
                    })}`)
                  }}
                >
                  {formatMessage({ defaultMessage: 'Hết hàng' })} {!loadingStatics ? `(${groupStatics.out_stock})` : `( -- )`}
                </a>
              </li>
              <li className={`nav-item ${params.type == TYPE_COUNT.DA_AN ? 'active' : ''}`}>
                <a className={`nav-link font-weight-normal ${params.type == TYPE_COUNT.DA_AN ? 'active' : ''}`}
                  style={{ fontSize: '13px', minWidth: 120, alignItems: 'center', justifyContent: 'center' }}
                  onClick={e => {
                    history.push(`/product-stores/list?${queryString.stringify({
                      ...params,
                      page: 1,
                      type: TYPE_COUNT.DA_AN
                    })}`)
                  }}
                >
                  {formatMessage({ defaultMessage: 'Đã ẩn' })} {!loadingStatics ? `(${groupStatics.inactive})` : `( -- )`}
                </a>
              </li>
              <li className={`nav-item ${params.type == TYPE_COUNT.KHAC ? 'active' : ''}`}>
                <a className={`nav-link font-weight-normal ${params.type == TYPE_COUNT.KHAC ? 'active' : ''}`}
                  style={{ fontSize: '13px', minWidth: 120, alignItems: 'center', justifyContent: 'center' }}
                  onClick={e => {
                    history.push(`/product-stores/list?${queryString.stringify({
                      ...params,
                      page: 1,
                      type: TYPE_COUNT.KHAC
                    })}`)
                  }}
                >
                  {formatMessage({ defaultMessage: 'Vi phạm' })} {!loadingStatics ? `(${groupStatics.banned})` : `( -- )`}
                </a>
              </li>
              <li className={`nav-item ${params.type == TYPE_COUNT.HANG_HOA_AO ? 'active' : ''}`}>
                <a className={`nav-link font-weight-normal ${params.type == TYPE_COUNT.HANG_HOA_AO ? 'active' : ''}`}
                  style={{ fontSize: '13px', minWidth: 120, alignItems: 'center', justifyContent: 'center' }}
                  onClick={e => {
                    history.push(`/product-stores/list?${queryString.stringify({
                      ...params,
                      page: 1,
                      type: TYPE_COUNT.HANG_HOA_AO
                    })}`)
                  }}
                >
                  {formatMessage({ defaultMessage: 'Hàng hóa ảo' })} {!loadingStatics ? `(${groupStatics.virtual})` : `( -- )`}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
