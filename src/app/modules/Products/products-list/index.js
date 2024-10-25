import React, { memo, useCallback, useMemo, useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  CardHeaderToolbar,
  Checkbox,
} from "../../../../_metronic/_partials/controls";
import { ProductsFilter } from "./filter/ProductsFilter";
import { ProductsTable } from "./ProductsTable";
import { useProductsUIContext } from "../ProductsUIContext";
import { FormattedMessage, useIntl } from "react-intl";
import { Dropdown, Modal } from "react-bootstrap";
import queryString from 'querystring';
import { useMutation, useQuery } from "@apollo/client";
import mutate_userHideProduct from "../../../../graphql/mutate_userHideProduct";
import mutate_userShowProduct from "../../../../graphql/mutate_userShowProduct";
import mutate_smeUpdateProductTagsMutil from "../../../../graphql/mutate_smeUpdateProductTagsMutil";
import { useToasts } from "react-toast-notifications";
import mutate_scHandleSmeProductDeleted from "../../../../graphql/mutate_scHandleSmeProductDeleted";
import query_sc_stores_basic from "../../../../graphql/query_sc_stores_basic";
import { Link, useHistory, useLocation } from "react-router-dom";
import _ from "lodash";
import Select from "react-select";
import CreatableSelect from 'react-select/creatable';
import LoadingDialog from "./dialog/LoadingDialog";
import DrawerModal from '../../../../components/DrawerModal';
import ProductFilterDrawer from "./filter/ProductFilterDrawer";
import { OPTIONS_CONNECTED, OPTIONS_ORIGIN_IMAGE, PRODUCT_TYPE } from '../ProductsUIHelpers';
import { toAbsoluteUrl } from "../../../../_metronic/_helpers";
import PopupAlertUpdate from "./dialog/PopupAlertUpdate";
import SVG from "react-inlinesvg";
import { Helmet } from 'react-helmet-async';
import AuthorizationWrapper from "../../../../components/AuthorizationWrapper";
import ExpireWarningDialog from "./dialog/ExpireWarningDialog";
import ModalResults from "./dialog/ResultDialog";
import ModalUploadProductFile from "./dialog/ModalUploadProductFile";
import ModalUpdateGTIN from "./dialog/ModalUpdateGTIN";
import { createApolloClientSSR } from '../../../../apollo';
import query_sme_catalog_product_notjoin_scproduct from "../../../../graphql/query_sme_catalog_product_notjoin_scproduct";
import ModalUpdateUnit from "./dialog/ModalUpdateUnit";

export default memo(() => {
  const history = useHistory();
  const location = useLocation();
  const { formatMessage } = useIntl()
  const params = queryString.parse(location.search.slice(1, 100000));
  const { setIds, ids, optionsProductTag } = useProductsUIContext();
  const [showConfirm, setShowConfirm] = useState(false)
  const [showConfirmCreateMulti, setConfirmCreateMulti] = useState(false)
  const [channelSelected, setChannelSelected] = useState(null)
  const [showCreateTag, setShowCreateTag] = useState(null);
  const [nameSearch, setNameSearch] = useState("");
  const [dataTags, setTags] = useState([]);
  const [dataProducts, setDataProducts] = useState([]);
  const [dataResults, setDataResults] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [showUploadFile, setShowUploadFile] = useState(false)
  const [showUpdateFile, setShowUpdateFile] = useState(false)
  const [showUpdateUnitFile, setShowUpdateUnitFile] = useState(false)
  const [isOpenDrawer, setOpenDrawer] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dataUpdateProduct, setDataUpdateProduct] = useState(null);
  let client = createApolloClientSSR()

  const { addToast, removeAllToasts } = useToasts();
  const [hideProduct, { loading: loadingHideProduct }] = useMutation(mutate_userHideProduct, {
    refetchQueries: ['sme_catalog_product', 'sme_catalog_product_aggregate'],
    onCompleted: (data) => {
      setIds([])
    }
  })
  const [scHandleSmeProductDeleted] = useMutation(mutate_scHandleSmeProductDeleted)

  const [userShowProduct] = useMutation(mutate_userShowProduct, {
    refetchQueries: ['sme_catalog_product', 'sme_catalog_product_aggregate'],
    onCompleted: (data) => {
      setIds([])
    }
  })
  const [createMutilTag, { loading: loadingCreateMutilTag }] = useMutation(mutate_smeUpdateProductTagsMutil, {
    refetchQueries: ['sme_catalog_product', 'sme_catalog_product_aggregate', 'sme_catalog_product_tags'],
    onCompleted: (data) => {
      setIds([])
    }
  })

  const { data: dataStore } = useQuery(query_sc_stores_basic, {
    fetchPolicy: 'cache-and-network'
  })

  const _deleteProduct = useCallback((ids) => {
    let paramsUnlinks = {
      list_sme_product_id: [],
      list_sme_variant_id: [],
    };
    ids.forEach(_pro => {
      paramsUnlinks.list_sme_product_id.push(_pro.id)
      paramsUnlinks.list_sme_variant_id = paramsUnlinks.list_sme_variant_id.concat(_pro.sme_catalog_product_variants.map(_variant => _variant.id))
    })
    setShowConfirm({
      message: formatMessage({ defaultMessage: 'Toàn bộ liên kết của sản phẩm này với sản phẩm trên sàn sẽ bị xóa khi bạn xóa sản phẩm kho. Bạn có chắc chắn muốn xóa?' }),
      action: 'delete',
      params: ids.map(_pro => _pro.id),
      paramsUnlinks
    })
  }, [])
  const _onCreateOnStore = useCallback(() => {
    history.push({
      pathname: '/products/create-onstore',
      state: {
        channels: [channelSelected],
        products: ids
      }
    })
  }, [channelSelected, ids])

  const _onCreateMutilTag = useCallback(
    (ids) => {
      setShowCreateTag({
        products: ids
      })
    }, []
  );

  const _hideProduct = useCallback(async (ids) => {
    setShowConfirm({
      message: ids.length > 1 ? formatMessage({ defaultMessage: 'Bạn có chắc chắn muốn ẩn những sản phẩm này?' }) : formatMessage({ defaultMessage: 'Bạn có chắc chắn muốn ẩn sản phẩm này?' }),
      action: 'hide',
      params: ids.filter(_pro => _pro.status == 10).map(_pro => _pro.id)
    })
  }, [])

  const _showProduct = useCallback(async (ids) => {
    setShowConfirm({
      message: ids.length > 1 ? formatMessage({ defaultMessage: 'Bạn có chắc chắn muốn hiện những sản phẩm này?' }) : formatMessage({ defaultMessage: 'Bạn có chắc chắn muốn hiện sản phẩm này?' }),
      action: 'show',
      params: ids.filter(_pro => _pro.status == 0).map(_pro => _pro.id)
    })
  }, []);

  const _onUpdateProduct = useCallback(
    ({ list_product, urlTo }) => {
      if (!list_product || list_product.length == 0) {
        removeAllToasts();
        addToast(formatMessage({ defaultMessage: 'Vui lòng chọn sản phẩm để thao tác' }), { appearance: 'warning' });
        return
      }

      setDataUpdateProduct({ urlTo, list_product });
    }, []
  );

  const [options,] = useMemo(() => {
    console.log({ dataStore })
    let _options = dataStore?.sc_stores?.filter(_store => _store.status == 1).map(_store => {
      let _channel = dataStore?.op_connector_channels?.find(_ccc => _ccc.code == _store.connector_channel_code)
      return {
        label: _store.name,
        value: _store.id,
        special_type: _store.special_type,
        logo: _channel?.logo_asset_url,
        connector_channel_code: _store.connector_channel_code,
        connector_channel_name: _channel.name
      }
    }) || []

    if (_options.length > 0) {
      setChannelSelected(_options[0])
    } else {
      setChannelSelected()
    }

    return [_options, `col-${12 / (_options.length || 1)}`]
  }, [dataStore]);

  const onToggleDrawer = useCallback(() => setOpenDrawer(prev => !prev), [setOpenDrawer]);

  const filterBlock = useMemo(
    () => {
      let blockOriginImage = OPTIONS_ORIGIN_IMAGE?.find(_option => _option.value === Number(params?.has_origin_image)) || undefined;
      let blockProductConnected = OPTIONS_CONNECTED?.find(_option => _option.value === Number(params?.has_sc_product_linking)) || undefined;
      let blockTypeProduct = PRODUCT_TYPE?.find(_option => _option.value === Number(params?.is_combo)) || undefined;

      let blockTags = optionsProductTag?.filter(
        _option => params?.tags?.split(',')?.map(Number)?.some(_tag => _tag == _option?.value)
      ) || [];
      let blockStore = options?.find(_option => _option?.value === Number(params?.store)) || undefined;

      let isShowBlockStore = blockStore && (blockOriginImage || blockProductConnected || blockTags?.length > 0);

      return (
        <div className="d-flex flex-wrap" style={{ gap: 10 }}>
          {blockOriginImage && (
            <span
              className="mb-4 py-2 px-4 d-flex justify-content-between align-items-center"
              style={{ border: '1px solid #ff6d49', borderRadius: 20, background: 'rgba(255,109,73, .1)' }}
            >
              <span>{formatMessage(blockOriginImage?.name)}</span>
              <i
                className="fas fa-times icon-md ml-4"
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  history.push(`${location.pathname}?${queryString.stringify({
                    ..._.omit(params, ['has_origin_image'])
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
              <span>{formatMessage(blockProductConnected?.name)}</span>
              <i
                className="fas fa-times icon-md ml-4"
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  history.push(`${location.pathname}?${queryString.stringify({
                    ..._.omit(params, ['has_sc_product_linking', 'store'])
                  })}`.replaceAll('%2C', '\,'));
                }}
              />
            </span>
          )}
          {isShowBlockStore && (
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
                    ..._.omit(params, ['store'])
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
                    ..._.omit(params, ['tags'])
                  })}`.replaceAll('%2C', '\,'));
                }}
              />
            </span>
          )}

          {blockTypeProduct && (
            <span
              className="mb-4 py-2 px-4 d-flex justify-content-between align-items-center"
              style={{ border: '1px solid #ff6d49', borderRadius: 20, background: 'rgba(255,109,73, .1)' }}
            >
              <span>{formatMessage(blockTypeProduct?.name)}</span>
              <i
                className="fas fa-times icon-md ml-4"
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  history.push(`${location.pathname}?${queryString.stringify({
                    ..._.omit(params, ['is_combo'])
                  })}`.replaceAll('%2C', '\,'));
                }}
              />
            </span>
          )}
        </div>
      )
    }, [location?.search, optionsProductTag, options]
  );

  return (
    <>
      <Helmet
        titleTemplate={formatMessage({ defaultMessage: "Quản lý sản phẩm kho" }) + "- UpBase"}
        defaultTitle={formatMessage({ defaultMessage: "Quản lý sản phẩm kho" }) + "- UpBase"}
      >
        <meta name="description" content={formatMessage({ defaultMessage: "Quản lý sản phẩm kho" }) + "- UpBase"} />
      </Helmet>
      <DrawerModal
        open={isOpenDrawer}
        onClose={onToggleDrawer}
        direction="right"
        size={500}
        enableOverlay={true}
      >
        <ProductFilterDrawer
          isOpenDrawer={isOpenDrawer}
          onToggleDrawer={onToggleDrawer}
        />
      </DrawerModal>
      <ModalUploadProductFile 
        show={showUploadFile}
        onHide={() => setShowUploadFile(false)}
      />

      <ModalUpdateGTIN 
        show={showUpdateFile}
        onHide={() => setShowUpdateFile(false)}
      />

      <ModalUpdateUnit 
        show={showUpdateUnitFile}
        onHide={() => setShowUpdateUnitFile(false)}
      />

      <PopupAlertUpdate
        data={dataUpdateProduct}
        onHide={() => setDataUpdateProduct(null)}
      />
      <Card>
        <CardBody>
          <ProductsFilter
            onDelete={_deleteProduct}
            onCreateMutilTag={_onCreateMutilTag}
            onToggleDrawer={onToggleDrawer}
            onUpdateProduct={_onUpdateProduct}
            onCreateOnStore={() => {
              setConfirmCreateMulti(true)
            }}
            nameSearch={nameSearch}
            setNameSearch={setNameSearch}
          />
          {filterBlock}
          <div className="d-flex align-items-center mb-8 mt-4 pt-1 pb-1" style={{ position: 'sticky', top: 45, background: '#fff', zIndex: 2, fontSize: 14 }}>
            {
              <span className="text-primary mr-3" >{formatMessage({ defaultMessage: "Đã chọn" })}: {ids?.length ?? 0} {formatMessage({ defaultMessage: "sản phẩm" })}</span>
            }
            {
              <Dropdown drop='down' onSelect={() => {

              }} >
                <Dropdown.Toggle disabled={!ids.length} className={`${ids?.length ? 'btn-primary' : 'btn-darkk'} btn`} >
                  {formatMessage({ defaultMessage: "Thao tác hàng loạt" })}
                </Dropdown.Toggle>

                <Dropdown.Menu>
                  <AuthorizationWrapper keys={['product_create_store_product']}>
                    <Dropdown.Item className="mb-1 d-flex" onClick={async e => {
                      if (ids.length == 0) {
                        addToast(formatMessage({ defaultMessage: 'Vui lòng chọn sản phẩm' }), { appearance: 'warning' });
                        return;
                      }
                      setLoading(true)
                      const { data } = await client.query({
                        query: query_sme_catalog_product_notjoin_scproduct,
                        fetchPolicy: 'network-only',
                        variables: {
                          limit: ids?.length,
                          where: {
                            id: {_in: ids?.map(id => id?.id)}
                          }
                        }
                      })
                    setConfirmCreateMulti(data?.sme_catalog_product)
                    setIds(data?.sme_catalog_product)
                    setLoading(false)
                    }} >{formatMessage({ defaultMessage: "Tạo sản phẩm sàn từ sản phẩm kho" })}</Dropdown.Item>
                    </AuthorizationWrapper>
                  <AuthorizationWrapper keys={['product_action']}>
                    <Dropdown.Item className="mb-1 d-flex" onClick={async e => {
                      e.preventDefault();
                      setLoading(true)
                      const { data } = await client.query({
                        query: query_sme_catalog_product_notjoin_scproduct,
                        fetchPolicy: 'network-only',
                        variables: {
                          limit: ids?.length,
                          where: {
                            id: {_in: ids?.map(id => id?.id)}
                          }
                        }
                      })
                      _onUpdateProduct({
                        list_product: data?.sme_catalog_product,
                        urlTo: '/products/update-tag-origin-image'
                      })
                      setIds(data?.sme_catalog_product)
                      setLoading(false)
                    }}>
                      {formatMessage({ defaultMessage: "Sửa ảnh gốc & tag" })}
                    </Dropdown.Item>
                    <Dropdown.Item className="mb-1 d-flex" onClick={async e => {
                      if (ids.length == 0) {
                        addToast(formatMessage({ defaultMessage: 'Vui lòng chọn sản phẩm' }), { appearance: 'warning' });
                        return;
                      }
                      setLoading(true)
                      const { data } = await client.query({
                        query: query_sme_catalog_product_notjoin_scproduct,
                        fetchPolicy: 'network-only',
                        variables: {
                          limit: ids?.length,
                          where: {
                            id: {_in: ids?.map(id => id?.id)}
                          }
                        }
                      })
                      setDataProducts(data?.sme_catalog_product)
                      setIds(data?.sme_catalog_product)
                      setShowDialog(true)
                      setLoading(false)
                    }} >{formatMessage({ defaultMessage: "Cài đặt cảnh báo hạn" })}</Dropdown.Item>
                    <Dropdown.Item className="mb-1 d-flex" onClick={async e => {
                      e.preventDefault();
                      setLoading(true)
                      const { data } = await client.query({
                        query: query_sme_catalog_product_notjoin_scproduct,
                        fetchPolicy: 'network-only',
                        variables: {
                          limit: ids?.length,
                          where: {
                            id: {_in: ids?.map(id => id?.id)}
                          }
                        }
                      })
                      history.push({
                        pathname: '/products/update-price-vat',
                        state: {
                          list_product: data?.sme_catalog_product?.map(product => {
                            let newVariantList = product?.sme_catalog_product_variants?.filter(variant => variant?.product_status_id == null)
                            return {
                              ...product,
                              sme_catalog_product_variants: newVariantList
                            }
                          })
                        }
                      })
                      setIds(data?.sme_catalog_product)
                      setLoading(false)
                    }}>
                      {formatMessage({ defaultMessage: "Sửa giá sản phẩm kho" })}
                    </Dropdown.Item>
                  </AuthorizationWrapper>
                  <AuthorizationWrapper keys={['product_action']}>
                    <Dropdown.Item className="mb-1 d-flex" onClick={async e => {
                      e.preventDefault();
                      setLoading(true)
                      const { data } = await client.query({
                        query: query_sme_catalog_product_notjoin_scproduct,
                        fetchPolicy: 'network-only',
                        variables: {
                          limit: ids?.length,
                          where: {
                            id: {_in: ids?.map(id => id?.id)}
                          }
                        }
                      })
                      history.push({
                        pathname: '/products/update-category',
                        state: {
                          list_product: data?.sme_catalog_product?.map(product => {
                            let newVariantList = product?.sme_catalog_product_variants?.filter(variant => variant?.product_status_id == null)
                            return {
                              ...product,
                              sme_catalog_product_variants: newVariantList
                            }
                          })
                        }
                      })
                      setIds(data?.sme_catalog_product)
                      setLoading(false)
                    }}>
                      {formatMessage({ defaultMessage: "Cập nhật Tên sản phẩm kho và Danh mục" })}
                    </Dropdown.Item>
                  </AuthorizationWrapper>
                </Dropdown.Menu>
              </Dropdown>
            }
              <div className="text-right d-flex" style={{ marginLeft: 'auto' }}>
                {<Dropdown drop='down' onSelect={() => {
                }} >
                  <Dropdown.Toggle 
                    className="btn mr-4 custom-dropdown"
                    style={{ color: '#ff5629', borderColor: '#ff5629', background: '#ffffff' }} 
                  >
                    {formatMessage({ defaultMessage: "Công cụ xử lý hàng loạt" })}
                  </Dropdown.Toggle>

                  <Dropdown.Menu>
                      <AuthorizationWrapper keys={['product_new']}>
                        <Dropdown.Item className="mb-1 d-flex" onClick={async e => {
                          setShowUploadFile(true)
                        }} >{formatMessage({ defaultMessage: "Đăng hàng loạt theo file" })}</Dropdown.Item>
                      </AuthorizationWrapper>
                      <AuthorizationWrapper keys={['product_edit']}>
                        <Dropdown.Item className="mb-1 d-flex" onClick={async e => {
                          setShowUpdateFile(true)
                        }} >{formatMessage({ defaultMessage: "Cập nhật GTIN" })}</Dropdown.Item>
                      </AuthorizationWrapper>
                      <AuthorizationWrapper keys={['product_edit']}>
                        <Dropdown.Item className="mb-1 d-flex" onClick={async e => {
                          setShowUpdateUnitFile(true)
                        }} >{formatMessage({ defaultMessage: "Cập nhật đơn vị tính" })}</Dropdown.Item>
                      </AuthorizationWrapper>
                  </Dropdown.Menu>
                </Dropdown>
                }
            <AuthorizationWrapper keys={['product_new']}>
                <Dropdown drop='down' >
                  <Dropdown.Toggle className='btn-primary' >
                    {formatMessage({ defaultMessage: "Thêm sản phẩm" })}
                  </Dropdown.Toggle>

                  <Dropdown.Menu>
                    <Dropdown.Item className="mb-1 d-flex" onClick={async e => {
                      e.preventDefault();
                      history.push('/products/new')
                    }}
                    >
                      {formatMessage({ defaultMessage: "Sản phẩm thường" })}
                    </Dropdown.Item>
                    <Dropdown.Item className="mb-1 d-flex" onClick={async e => {
                      e.preventDefault();
                      history.push('/products/new-combo')
                    }}
                    >
                      {formatMessage({ defaultMessage: "Sản phẩm combo" })}
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </AuthorizationWrapper>
                {/* <a
                        className="btn btn-outline-secondary btn btn-primary px-6 mr-2"
                        href="/products/inventory/list"
                      >
                        Kiểm kho 
                      </a> */}
              </div>
          </div>
          <ProductsTable
            onDelete={_deleteProduct}
            onHide={_hideProduct}
            onShow={_showProduct}
            onCreateMutilTag={_onCreateMutilTag}
            nameSearch={nameSearch}
          />
        </CardBody>

        <div
          id="kt_scrolltop1"
          className="scrolltop"
          style={{ bottom: 80 }}
          onClick={() => {
            window.scrollTo({
              letf: 0,
              top: document.body.scrollHeight,
              behavior: 'smooth'
            });
          }}
        >
          <span className="svg-icon">
            <SVG src={toAbsoluteUrl("/media/svg/icons/Navigation/Down-2.svg")} title={' '}></SVG>
          </span>{" "}
        </div>

        <LoadingDialog show={loadingCreateMutilTag || loadingHideProduct || loading} />

        <Modal
          show={!!showCreateTag}
          aria-labelledby="example-modal-sizes-title-lg"
          centered
          onHide={() => setShowCreateTag(null)}
        >
          <Modal.Header style={{ justifyContent: 'center', border: 'none', paddingBottom: 0 }} >
            <Modal.Title>{formatMessage({ defaultMessage: "Thêm tag sản phẩm" })}</Modal.Title>
          </Modal.Header>
          <Modal.Body className="overlay overlay-block cursor-default">
            <div className="mb-8">
              <CreatableSelect
                placeholder={formatMessage({ defaultMessage: "Nhập tag sản phẩm" })}
                isMulti
                isClearable
                onChange={value => {
                  if (value?.length > 0 && value?.some(_value => _value?.label?.trim()?.length > 255)) {
                    removeAllToasts();
                    addToast(formatMessage({ defaultMessage: 'Tag sản phẩm tối đa chỉ được 255 ký tự' }), { appearance: 'error' });
                    return;
                  }
                  setTags(value)
                }}
                options={optionsProductTag}
                formatCreateLabel={(inputValue) => `${formatMessage({ defaultMessage: 'Tạo mới' })}: "${inputValue}"`}
              />
            </div>
            <div className="form-group mb-0 d-flex justify-content-between">
              <button
                className="btn btn-light btn-elevate mr-6"
                style={{ width: '47%' }}
                onClick={() => setShowCreateTag(null)}
              >
                <span className="font-weight-boldest">{formatMessage({ defaultMessage: "HUỶ" })}</span>
              </button>
              <button
                className={`btn btn-primary font-weight-bold`}
                style={{ width: '47%' }}
                onClick={async () => {
                  let body = {
                    products: showCreateTag?.products?.map(
                      _product => {
                        let currentTags = _product?.tags?.map(_tag => ({
                          value: _tag?.tag?.id,
                          label: _tag?.tag?.title
                        }));
                        return {
                          productId: _product?.id,
                          tags: dataTags?.concat(currentTags)?.map(
                            _tag => {
                              let { value, label } = _tag;
                              if (_tag?.__isNew__) {
                                return {
                                  title: label
                                }
                              }
                              return {
                                id: value,
                                title: label
                              }
                            }
                          ) || []
                        }
                      }
                    )
                  };

                  console.log({ body });

                  setShowCreateTag(null);
                  let res = await createMutilTag({
                    variables: body
                  });

                  if (res?.data?.updateProductTagMulti?.success) {
                    addToast(formatMessage({ defaultMessage: 'Đã thêm tag cho các sản phẩm được chọn' }), { appearance: 'success' })
                  } else {
                    addToast(res?.data?.updateProductTagMulti?.message, { appearance: 'error' })
                  }
                  setTags([]);
                  setIds([]);
                }}
                disabled={false}
              >
                <span className="font-weight-boldest">{formatMessage({ defaultMessage: "THÊM TAG" })}</span>
              </button>
            </div>
          </Modal.Body>
        </Modal>

        <Modal
          show={!!showConfirm}
          aria-labelledby="example-modal-sizes-title-lg"
          centered
          onHide={() => setShowConfirm(null)}
        >
          <Modal.Body className="overlay overlay-block cursor-default text-center">
            <div className="mb-4" >{showConfirm?.message}</div>

            <div className="form-group mb-0">
              <button
                className="btn btn-light btn-elevate mr-3"
                style={{ width: 90 }}
                onClick={() => setShowConfirm(null)}
              >
                <span className="font-weight-boldest">{formatMessage({ defaultMessage: "Không" })}</span>
              </button>
              <button
                className={`btn btn-primary font-weight-bold`}
                style={{ width: 90 }}
                onClick={async () => {
                  let action = showConfirm?.action
                  setShowConfirm(null)
                  setIds([])
                  if (showConfirm?.params.length == 0) {
                    return;
                  }
                  if (action == 'delete') {
                    let { data: datUserHideProduct } =  await hideProduct({
                      variables: {
                        id: showConfirm.params,
                        is_delete: true
                      }
                    })

                    if (datUserHideProduct?.userHideProduct?.success) {
                      if (datUserHideProduct?.userHideProduct?.errors?.length > 0) {
                        addToast(
                          <div>
                            <span>{formatMessage({ defaultMessage: "Hiện tại không xoá được sản phẩm này" })}.</span> <br /> <span>{formatMessage({ defaultMessage: "Lý do" })}: {datUserHideProduct?.userHideProduct?.errors[0]?.message}.</span>
                          </div>, {
                          appearance: 'error'
                        });
                      } else {
                        const {data: dataDeleteSmeProduct} = await scHandleSmeProductDeleted({
                          variables: showConfirm?.paramsUnlinks
                        })
                        if (dataDeleteSmeProduct?.scHandleSmeProductDeleted?.success) {
                          addToast(formatMessage({ defaultMessage: 'Xoá sản phẩm thành công' }), { appearance: 'success' });
                        } else {
                          addToast(dataDeleteSmeProduct?.scHandleSmeProductDeleted?.message || "Có lỗi xảy ra! Vui lòng thử lại", { appearance: 'error' });
                        }
                      }
                    } else {
                      addToast(datUserHideProduct?.userHideProduct?.message || "Có lỗi xảy ra! Vui lòng thử lại", { appearance: 'error' });
                    }
                  }
                  if (action == 'hide') {
                    let res = await hideProduct({
                      variables: {
                        id: showConfirm.params,
                        is_delete: false
                      }
                    })
                    if (res.data?.userHideProduct?.success) {
                      addToast(formatMessage({ defaultMessage: 'Ẩn sản phẩm thành công' }), { appearance: 'success' });
                    } else {
                      addToast(res.data?.userHideProduct?.message || res.errors[0].message, { appearance: 'error' });
                    }
                  }
                  if (action == 'show') {
                    let res = await userShowProduct({
                      variables: {
                        ids: showConfirm.params,
                      }
                    })
                    if (res.data?.userShowProduct?.success) {
                      addToast(formatMessage({ defaultMessage: 'Hiện sản phẩm thành công' }), { appearance: 'success' });
                    } else {
                      addToast(res.data?.userShowProduct?.message || res.errors[0].message, { appearance: 'error' });
                    }
                  }


                }}
              >
                <span className="font-weight-boldest">{
                  showConfirm?.action == 'delete' ? formatMessage({ defaultMessage: 'Có, xóa' }) : formatMessage({ defaultMessage: 'Đồng ý' })
                }</span>
              </button>
            </div>
          </Modal.Body>
        </Modal >

        <Modal
          show={showConfirmCreateMulti}
          aria-labelledby="example-modal-sizes-title-lg"
          centered
          onHide={() => setConfirmCreateMulti(false)}
        >
          <Modal.Header style={{ justifyContent: 'center', border: 'none', paddingBottom: 0 }} >
            <Modal.Title>{formatMessage({ defaultMessage: "Chọn gian hàng" })}</Modal.Title>
          </Modal.Header>
          <Modal.Body className="overlay overlay-block cursor-default text-center">
            {options.length == 0 && <div className="mb-4" >{formatMessage({ defaultMessage: "Bạn chưa liên kết với gian hàng nào. Vui lòng liên kết gian hàng trước khi thực hiện tính năng này." })}</div>}
            {
              options.length != 0 && <div class=" mb-4">
                <Select options={options}
                  className='w-100'
                  placeholder={formatMessage({ defaultMessage: 'Gian hàng' })}
                  isClearable
                  // isLoading={loading}
                  value={channelSelected}
                  onChange={setChannelSelected}
                  formatOptionLabel={(option, labelMeta) => {
                    return <div style={{ display: 'flex' }} >
                      <img src={option.logo} style={{ width: 20, height: 20, marginRight: 8 }} /> {option.label}
                    </div>
                  }}
                />
              </div>
            }

            <div className="form-group mb-0">
              <button
                className="btn btn-light btn-elevate mr-3"
                style={{ width: 160 }}
                onClick={() => setConfirmCreateMulti(false)}
              >
                <span className="font-weight-boldest">{formatMessage({ defaultMessage: 'ĐÓNG' })}</span>
              </button>
              {
                options.length == 0 ? <Link
                  className={`btn btn-primary font-weight-bold`}
                  style={{ width: 160 }}
                  to='/setting/channels'
                >
                  <span className="font-weight-boldest">{formatMessage({ defaultMessage: 'LIÊN KẾT NGAY' })}</span>
                </Link> : <button
                  className={`btn btn-primary font-weight-bold`}
                  style={{ width: 160 }}
                  onClick={_onCreateOnStore}
                  disabled={!channelSelected}
                >
                  <span className="font-weight-boldest">{formatMessage({ defaultMessage: 'XÁC NHẬN' })}</span>
                </button>
              }
            </div>
          </Modal.Body>
        </Modal >
        <ExpireWarningDialog showDialog={showDialog} dataProducts={dataProducts} setDataResults={setDataResults} onHide={() => setShowDialog(false)} />
        <ModalResults dataResults={dataResults} onHide={() => {setDataResults(null)}} />
      </Card>
    </>
  );
})

export const actionKeys = {
  "product_list_view": {
    router: '/products/list',
    actions: [
      "sc_stores", 
      "op_connector_channels", 
      "sme_warehouses", 
      "sme_catalog_product_tags",
      "sme_catalog_product_aggregate", 
      "sme_catalog_product"
    ],
    name: "Xem danh sách sản phẩm kho",
    group_code: 'product_list',
    group_name: 'Danh sách sản phẩm kho',
    cate_code: 'product_service',
    cate_name: 'Quản lý kho',
  },
  "product_create_store_product": {
    router: '/product-stores/new',
    actions: [
      "sc_stores", 
      "op_connector_channels", 
      "sme_catalog_product_by_pk", 
      "ScTags", 
      "sme_warehouses", 
      "sc_sale_channel_categories", 
      "sc_product", 
      "scGetWarehouses", 
      "sme_catalog_photo_frames",
      "scGetCategorySuggestion", 
      "scCreateProduct", 
      "scProductSyncUpOnly",
      "scStatisticScProducts", 
      "ScGetSmeProducts",
      "ScCreateMultipleProduct",
      "scGetLogisticChannel"
    ],
    name: "Tạo sản phẩm sàn từ sản phẩm kho",
    group_code: 'product_list',
    group_name: 'Danh sách sản phẩm kho',
    cate_code: 'product_service',
    cate_name: 'Quản lý kho',
  },
  "product_action": {
    router: '/products/list',
    actions: [
      'sme_catalog_product', 
      'sme_catalog_product_aggregate', 
      'sme_catalog_product_tags',
      "updateProductTagMulti",
      "scUpdateMultiProductOriginImageTag",
      "productUpdateOriginImageTags",
      "userUpdateProductPrice",
      "userHideProduct",
      "scHandleSmeProductDeleted",
      "userUpdateProductInfoMulti"
    ],
    name: "Các thao tác sản phẩm kho",
    group_code: 'product_list',
    group_name: 'Danh sách sản phẩm kho',
    cate_code: 'product_service',
    cate_name: 'Quản lý kho',
  },
  "product_detail": {
    router: '/products/edit/:id',
    actions: [
      "sc_stores", 
      "op_connector_channels", 
      "sme_warehouses", 
      "sme_catalog_product_tags", 
      "scGetAttributeByCategory", 
      "sme_catalog_inventories", 
      "sme_product_status", 
      "sme_catalog_product_aggregate",
      "sme_catalog_product_by_pk", 
      "sc_sale_channel_categories", 
      "scGetLogisticChannel", 
      "sme_catalog_category", 
      "sme_catalog_category_aggregate", 
      "sme_catalog_product_variant_aggregate", 
      "sme_catalog_product"
    ],
    name: "Xem chi tiết sản phẩm kho",
    group_code: 'product_detail',
    group_name: 'Chi tiết sản phẩm kho',
    cate_code: 'product_service',
    cate_name: 'Quản lý kho',
  },
  "product_new": {
    router: '/products/new',
    actions: [
      "sc_stores", 
      "op_connector_channels", 
      "sme_warehouses", 
      "sme_catalog_product_tags", 
      "scGetAttributeByCategory", 
      "sme_catalog_inventories",
      "sme_product_status", 
      "sme_catalog_product_aggregate", 
      "sme_catalog_product",
      "sc_sale_channel_categories", 
      "scGetLogisticChannel", 
      "sme_catalog_category", 
      "sme_catalog_category_aggregate", 
      "sme_catalog_product_variant_aggregate", 
      "productComboCreate",
      'sme_catalog_product_variant',
      "productCreate",
      "userImportSmeProductFromFile"
    ],
    name: "Thêm sản phẩm kho",
    group_code: 'product_list',
    group_name: 'Danh sách sản phẩm kho',
    cate_code: 'product_service',
    cate_name: 'Quản lý kho',
  },
  "product_edit": {
    router: '',
    actions: [
      "productUpdate", 'sme_catalog_product', 'sme_catalog_product_by_pk', "userUpdateGtinFromFile", "userUpdateProductUnitFromFile"
    ],
    name: "Cập nhật sản phẩm kho",
    group_code: 'product_list',
    group_name: 'Danh sách sản phẩm kho',
    cate_code: 'product_service',
    cate_name: 'Quản lý kho',
  },
};