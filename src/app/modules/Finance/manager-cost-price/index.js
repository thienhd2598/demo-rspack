import { useMutation, useQuery } from "@apollo/client";
import _ from "lodash";
import queryString from 'querystring';
import React, { memo, useCallback, useLayoutEffect, useMemo, useState } from "react";
import { Dropdown, Modal } from "react-bootstrap";
import { Helmet } from 'react-helmet-async';
import SVG from "react-inlinesvg";
import { useIntl } from "react-intl";
import { Link, useHistory, useLocation } from "react-router-dom";
import Select from "react-select";
import CreatableSelect from 'react-select/creatable';
import { useToasts } from "react-toast-notifications";
import { toAbsoluteUrl } from "../../../../_metronic/_helpers";
import {
  Card,
  CardBody
} from "../../../../_metronic/_partials/controls";
import DrawerModal from '../../../../components/DrawerModal';
import mutate_scHandleSmeProductDeleted from "../../../../graphql/mutate_scHandleSmeProductDeleted";
import mutate_smeUpdateProductTagsMutil from "../../../../graphql/mutate_smeUpdateProductTagsMutil";
import mutate_userHideProduct from "../../../../graphql/mutate_userHideProduct";
import mutate_userShowProduct from "../../../../graphql/mutate_userShowProduct";
import query_sc_stores_basic from "../../../../graphql/query_sc_stores_basic";
import query_sme_catalog_product_tags from "../../../../graphql/query_sme_catalog_product_tags";
import { OPTIONS_CONNECTED, OPTIONS_ORIGIN_IMAGE, PRODUCT_TYPE } from "../../Products/ProductsUIHelpers";
import { ProductsTable } from "./ProductsTable";
import LoadingDialog from "./dialog/LoadingDialog";
import PopupAlertUpdate from "./dialog/PopupAlertUpdate";
import ProductFilterDrawer from "./filter/ProductFilterDrawer";
import { ProductsFilter } from "./filter/ProductsFilter";
import { useSubheader } from "../../../../_metronic/layout";
import AuthorizationWrapper from "../../../../components/AuthorizationWrapper";
import ModalUploadFileComplete from "./dialog/ModalUploadFileComplete";

export default memo(() => {
  const history = useHistory();
  const location = useLocation();
  const { addToast, removeAllToasts } = useToasts();
  const { formatMessage } = useIntl()
  const params = queryString.parse(location.search.slice(1, 100000));
  const [ids, setIds] = useState([]);
  const [showConfirm, setShowConfirm] = useState(false)
  const [showConfirmCreateMulti, setConfirmCreateMulti] = useState(false)
  const [channelSelected, setChannelSelected] = useState(null)
  const [showCreateTag, setShowCreateTag] = useState(null);
  const [nameSearch, setNameSearch] = useState("");
  const [dataTags, setTags] = useState([]);
  const [isOpenDrawer, setOpenDrawer] = useState(false);
  const [dataUpdateProduct, setDataUpdateProduct] = useState(null);
  const { setBreadcrumbs } = useSubheader();
  const [uploadFile, setUploadFile] = useState(false)

  useLayoutEffect(() => {
    setBreadcrumbs([{ title: formatMessage({ defaultMessage: 'Giá vốn và VAT' }) }])
  }, []);

  const { data: dataProductTags } = useQuery(query_sme_catalog_product_tags, {
    fetchPolicy: 'cache-and-network'
  });

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

  const optionsProductTag = useMemo(
    () => {
      if (!dataProductTags) return [];

      let newOptionsProductTag = dataProductTags?.sme_catalog_product_tags?.map(
        _tag => ({
          value: _tag?.id,
          label: _tag.title
        })
      );

      return newOptionsProductTag;
    }, [dataProductTags]
  )

  const STATUS_UPDATE_COSTPRICE = [
    {value: 1, label: formatMessage({defaultMessage: 'Đã cập nhật giá vốn và VAT'})},
    {value: 2, label: formatMessage({defaultMessage: 'Chưa cập nhật giá vốn hoặc VAT'})},
  ]

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

      let blockStatusCosprice = STATUS_UPDATE_COSTPRICE?.filter(
        _option => params?.updateCostPrice?.split(',')?.map(Number)?.some(status => status == _option?.value)
      ) || [];
      let blockStore = options?.find(_option => _option?.value === Number(params?.store)) || undefined;

      let isShowBlockStore = blockStore && (blockOriginImage || blockProductConnected || blockTags?.length > 0 || blockStatusCosprice?.length > 0);

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

          {blockStatusCosprice?.length > 0 && (
            <span
              className="mb-4 py-2 px-4 d-flex justify-content-between align-items-center"
              style={{ border: '1px solid #ff6d49', borderRadius: 20, background: 'rgba(255,109,73, .1)' }}
            >
              <span>{`${_.map(blockStatusCosprice, 'label')?.join(', ')}`}</span>
              <i
                className="fas fa-times icon-md ml-4"
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  history.push(`${location.pathname}?${queryString.stringify({
                    ..._.omit(params, ['updateCostPrice'])
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
        titleTemplate={formatMessage({ defaultMessage: "Giá vốn và VAT" }) + "- UpBase"}
        defaultTitle={formatMessage({ defaultMessage: "Giá vốn và VAT" }) + "- UpBase"}
      >
        <meta name="description" content={formatMessage({ defaultMessage: "Giá vốn và VAT" }) + "- UpBase"} />
      </Helmet>
      <ModalUploadFileComplete
          uploadFile={uploadFile}
          onHide={() => {
              setUploadFile(false)
          }}
          // onShowModalFileUploadResults={(data) => setDataResults(data)}
          // onUploadSuccess={(id) => {
          //     history.push(`/products/inventory/processing/${id}`)
          // }}
      />
      <DrawerModal
        open={isOpenDrawer}
        onClose={onToggleDrawer}
        direction="right"
        size={500}
        enableOverlay={true}
      >
        <ProductFilterDrawer
          optionsProductTag={optionsProductTag}
          statusUpdateCostprice={STATUS_UPDATE_COSTPRICE}
          isOpenDrawer={isOpenDrawer}
          onToggleDrawer={onToggleDrawer}
        />
      </DrawerModal>
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
          <div className="d-flex justify-content-between">

          <div className="d-flex align-items-center mb-8 mt-4 pt-1 pb-1" style={{ position: 'sticky', top: 45, background: '#fff', zIndex: 2, fontSize: 14 }}>
            <span className="text-primary mr-3" >{formatMessage({ defaultMessage: "Đã chọn" })}: {ids?.length ?? 0} {formatMessage({ defaultMessage: "sản phẩm" })}</span>
            <AuthorizationWrapper keys={['finance_update_price_vat']}>
              <button
                className={`${ids?.length ? 'btn-primary' : 'btn-darkk'} btn`}
                disabled={ids?.length == 0}
                onClick={async e => {
                  e.preventDefault();
                  history.push({
                    pathname: '/finance/update-cost-price-vat',
                    state: {
                      list_product: ids?.map(product => {
                        let newVariantList = product?.sme_catalog_product_variants?.filter(variant => variant?.product_status_id == null)
                        return {
                          ...product,
                          sme_catalog_product_variants: newVariantList
                        }
                      })
                    }
                  })
                }}
              >
                <span style={ids?.length == 0 ? { color: '#fff' } : {}}>{formatMessage({ defaultMessage: "Sửa giá và VAT" })}</span>
              </button>
            </AuthorizationWrapper>
          </div>
          <div>
            <button
                className="btn mr-4"
                style={{ color: '#ff5629', borderColor: '#ff5629', background: '#ffffff' }}
                onClick={() => setUploadFile(true)}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="mr-2 bi bi-cloud-upload" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M4.406 1.342A5.53 5.53 0 0 1 8 0c2.69 0 4.923 2 5.166 4.579C14.758 4.804 16 6.137 16 7.773 16 9.569 14.502 11 12.687 11H10a.5.5 0 0 1 0-1h2.688C13.979 10 15 8.988 15 7.773c0-1.216-1.02-2.228-2.313-2.228h-.5v-.5C12.188 2.825 10.328 1 8 1a4.53 4.53 0 0 0-2.941 1.1c-.757.652-1.153 1.438-1.153 2.055v.448l-.445.049C2.064 4.805 1 5.952 1 7.318 1 8.785 2.23 10 3.781 10H6a.5.5 0 0 1 0 1H3.781C1.708 11 0 9.366 0 7.318c0-1.763 1.266-3.223 2.942-3.593.143-.863.698-1.723 1.464-2.383z" />
                    <path fill-rule="evenodd" d="M7.646 4.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 5.707V14.5a.5.5 0 0 1-1 0V5.707L5.354 7.854a.5.5 0 1 1-.708-.708z" />
                </svg>
                {formatMessage({ defaultMessage: 'Thêm file' })}
            </button>
          </div>
          </div>
          <ProductsTable
            ids={ids}
            setIds={setIds}
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

        <LoadingDialog show={loadingCreateMutilTag || loadingHideProduct} />

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
                    let [res] = await Promise.all([
                      hideProduct({
                        variables: {
                          id: showConfirm.params,
                          is_delete: true
                        }
                      })
                    ].concat([scHandleSmeProductDeleted({
                      variables: showConfirm?.paramsUnlinks
                    })])
                    )

                    if (res.data?.userHideProduct?.success) {
                      if (res.data?.userHideProduct?.errors?.length > 0) {
                        addToast(
                          <div>
                            <span>{formatMessage({ defaultMessage: "Hiện tại không xoá được sản phẩm này" })}.</span> <br /> <span>{formatMessage({ defaultMessage: "Lý do" })}: {res.data?.userHideProduct?.errors[0]?.message}.</span>
                          </div>, {
                          appearance: 'error'
                        });
                      } else {
                        addToast(formatMessage({ defaultMessage: 'Xoá sản phẩm thành công' }), { appearance: 'success' });
                      }
                    } else {
                      addToast(res.data?.userHideProduct?.message || res.errors[0].message, { appearance: 'error' });
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
      </Card>
    </>
  );
})

export const actionKeys = {
  "finance_cost_price_manage_view": {
      router: '/finance/manage-cost-price',
      actions: ["scHandleSmeProductDeleted","scGetProductVariantLinked", "sc_product", "sc_stores", "op_connector_channels", "sme_catalog_product_tags", "sme_catalog_product", "sme_catalog_product_aggregate"],
      name: 'Xem danh sách Giá vốn',
      group_code: 'finance_cost_vat',
      group_name: 'Giá vốn và VAT',
      cate_code: 'finance_service',
      cate_name: 'Tài chính'
  },
  "finance_update_price_vat": {
    router: '/finance/update-cost-price-vat',
    actions: ["userUpdateProductPrice", "sme_catalog_product", "sme_catalog_product_aggregate"],
    name: 'Sửa giá và VAT',
    group_code: 'finance_cost_vat',
    group_name: 'Giá vốn và VAT',
    cate_code: 'finance_service',
    cate_name: 'Tài chính'
  }
};