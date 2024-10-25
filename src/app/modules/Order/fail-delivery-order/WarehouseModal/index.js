import React, { useEffect, useMemo } from "react";
import { useState } from "react";

import { useMutation, useQuery } from "@apollo/client";
import TableProductVariant from "./TableProductVariant";
import { useToasts } from 'react-toast-notifications';
import { Field, Formik } from 'formik';
import * as Yup from "yup";
import { mutateA_coImportReturnOrder } from "../../refund-order/utils/graphqls";
import client from "../../../../../apollo";
import query_sme_catalog_product_variant from "../../../../../graphql/query_sme_catalog_product_variant";
import query_sme_catalog_stores from "../../../../../graphql/query_sme_catalog_stores";
import { ReSelectVertical } from "../../../../../_metronic/_partials/controls/forms/ReSelectVertical";
import { RadioGroup } from "../../../../../_metronic/_partials/controls/forms/RadioGroup";
import { Input, TextArea } from "../../../../../_metronic/_partials/controls";
import { Modal } from "react-bootstrap";
import LoadingDialog from "../../../ProductsStore/product-new/LoadingDialog";
import query_sc_stores_basic from "../../../../../graphql/query_sc_stores_basic";
import { useIntl } from "react-intl";
import _ from "lodash";
import ImageUpload from "../../order-process-fail-delivery/components/ImageUpload";
import VideoUpload from '../VideoUpload'
import { InputNote } from "../../order-process-fail-delivery/components/InputNote";
import { randomString } from "../../../../../utils";
import ImageView from "../../../../../components/ImageView";
import { PATTERN_URL } from "../../OrderUIHelpers";
import AuthorizationWrapper from "../../../../../components/AuthorizationWrapper";

const queryGetProductVariants = async (ids) => {
  if (ids?.length == 0) return [];

  const { data } = await client.query({
    query: query_sme_catalog_product_variant,
    variables: {
      where: {
        id: { _in: ids },
        product_status_id: { _is_null: true }
      },
    },
    fetchPolicy: "network-only",
  });

  return data?.sme_catalog_product_variant || [];
}

const WarehouseModal = ({ refetchDetail, dataOrder, onHide }) => {
  const { formatMessage } = useIntl()
  const creationMethod = [
    {
      value: 1,
      label: formatMessage({ defaultMessage: "Không nhập kho" }),
    },
    {
      value: 2,
      label: formatMessage({ defaultMessage: "Nhập kho" }),
    },
  ];
  const PROVIDER_WH = 2
  const [initialForm, setInitialForm] = useState({});
  const [validateSchema, setValidateSchema] = useState(null);
  const [method, setMethod] = useState(dataOrder?.logistic_fail == 'delivery_packing_cancel' ? 1 : 2);
  const [productLink, setProductLink] = useState(true);
  const { addToast } = useToasts();
  const [orderItemsRebuild, setOrderItemsRebuild] = useState();
  const [loadingBuildForm, setLoadingBuildForm] = useState(false);
  const [imgsNote, setImgsNote] = useState([]);
  const [productVideFiles, setProductVideFiles] = useState([])
  const [imageInvalid, setImageInvalid] = useState([]);
  const [orderItemVariant, setOrderItemVariant] = useState([]);

  const [values, setValues] = useState([])
  console.log('dataOrder', dataOrder)

  const { data: dataWarehouse } = useQuery(query_sme_catalog_stores, {
    fetchPolicy: 'cache-and-network' 
  });
  const { data: dataStore, loading: loadingStore } = useQuery(query_sc_stores_basic, { fetchPolicy: "cache-and-network", variables: 'context' });

  const dataOrderItems = dataOrder?.orderItems;
  useMemo(async () => {
    setLoadingBuildForm(true);
    const idsVariant = dataOrderItems.reduce((result, value) => {
      let total;
      if (!!value?.is_combo) {
        total = [value?.sme_variant_id || "", ...value?.comboItems?.map(item => item?.sme_variant_id)]
      } else {
        total = value?.sme_variant_id || ""
      }

      return result.concat(total)
    }, []);
    const idsQuery = _.flatten(idsVariant)?.filter(id => !!id);

    try {

      const totalVariants = await queryGetProductVariants(idsQuery);

      setLoadingBuildForm(false);

      setOrderItemVariant(totalVariants)
    } catch (err) {
      setLoadingBuildForm(false);
      setOrderItemVariant(idsQuery?.map(id => ({ id })));
    }
  }, [dataOrderItems]);

  const [importReturnOrder, { loading }] = useMutation(mutateA_coImportReturnOrder, {
    awaitRefetchQueries: true,
    refetchQueries: ['scGetFailDeliveryOrders'],
  });

  const defaultWarehouse = dataWarehouse?.sme_warehouses?.find((element) => element.is_default == 1) || null;

  useMemo(() => {
    setInitialForm(prev => ({
      ...prev,
      creationMethod: method,
      note: '',
      warehouseId: {
        label: defaultWarehouse?.name,
        value: defaultWarehouse?.id,
      },
      urlVideo: ''
    }));
  }, [dataWarehouse?.sme_warehouses, defaultWarehouse]);

  const refeshData = async (values, setFieldValue) => {
    if (values?.creationMethod == 1) {
      const rebuild = dataOrderItems?.map((_item, index) => {
        const findedVariant = orderItemVariant?.find(variant => variant?.id === _item?.sme_variant_id);
        let productVariant = {
          ...findedVariant,
          is_combo: _item?.is_combo,
          combo_items_origin: findedVariant?.combo_items,
          combo_items: _item?.comboItems?.map(_combo => {
            const smeVariant = orderItemVariant?.find(variant => variant?.id === _combo?.sme_variant_id);
            return {
              ..._combo,
              quantity: _combo?.purchased_quantity,
              combo_item: smeVariant
            }
          })
        };

        if (!!productVariant) {
          if (!!productVariant?.is_combo) {
            productVariant.combo_items.forEach(_combo => {
              setFieldValue(`variant-${_combo?.combo_item?.id}-${_item.id}-quantity`, 0, true);
            })
          } else {
            setFieldValue(`variant-${productVariant?.id}-${_item.id}-quantity`, 0, true);
          }
        }
      }
      );
    }

  }

  useMemo(async () => {
    let [schema, initValues] = [{
      note: Yup.string().notRequired().max(255, formatMessage({ defaultMessage: 'Ghi chú tối đa 255 ký tự' })),
      urlVideo: Yup.string().notRequired()
        .matches(PATTERN_URL, 'Vui lòng nhập đúng định dạng')
    }, {}];

    setProductLink(orderItemVariant.filter(x => x != null).length == 0 ? false : true)

    if (dataOrder?.logistic_fail != 'delivery_packing_cancel') {
      setMethod(orderItemVariant.filter(x => x != null).length == 0 ? 1 : 2)
    }

    setInitialForm(prev => ({
      ...prev,
      creationMethod: (dataOrder?.logistic_fail == 'delivery_packing_cancel' || orderItemVariant.filter(x => x != null).length == 0) ? 1 : 2
    }));


    const rebuild = dataOrderItems?.map((_item, index) => {
      let productVariant;
      const findedVariant = orderItemVariant?.find(variant => variant?.id === _item?.sme_variant_id || variant?.orderItemIdMapped === _item?.id);

      const isMappedVariant = orderItemVariant?.some(variant => variant?.orderItemIdMapped === _item?.id);

      if (!!findedVariant) {
        if (isMappedVariant) {
          productVariant = {
            ...findedVariant,
            is_combo: findedVariant?.is_combo,
            combo_items_origin: findedVariant?.combo_items,
            combo_items: findedVariant?.combo_items?.map(_combo => {
              return {
                ..._combo,                
                quantity: _combo?.quantity * _item?.quantity_purchased
              }
            }),
          };
        } else {
          productVariant = {
            ...findedVariant,
            is_combo: _item?.is_combo,
            combo_items_origin: findedVariant?.combo_items,
            combo_items: _item?.comboItems?.map(_combo => {
              const smeVariant = orderItemVariant?.find(variant => variant?.id === _combo?.sme_variant_id);
              return {
                ..._combo,                
                quantity: _combo?.purchased_quantity,
                combo_item: smeVariant
              }
            })
          };
        }
      } else {
        productVariant = null;
      }


      if (!!productVariant && dataOrder?.logistic_fail != 'delivery_packing_cancel') {
        if (!!productVariant?.is_combo) {
          productVariant.combo_items.forEach(_combo => {
            const listVarianCombotStatus = [{ ..._combo?.combo_item, product_status_name: "Mới" }, ..._combo?.combo_item?.status_variants]
            initValues[`variant-${_combo?.combo_item?.id}-${_item.id}-isMulti`] = false
            if (values[`variant-${_combo?.combo_item?.id}-${_item.id}-isMulti`] === false) {
              initValues[`variant-${_combo?.combo_item?.id}-${_item.id}-list-status`] = listVarianCombotStatus?.filter(item => !!item?.status)
              initValues[`variant-${_combo?.combo_item?.id}-${_item.id}-quantity`] = 0
              initValues[`variant-${_combo?.combo_item?.id}-${_item.id}-status`] = listVarianCombotStatus?.filter(item => !!item?.status && item?.id != _combo?.combo_item?.id)?.length > 0
              if (values['creationMethod'] == 2) {
                schema[`variant-${_combo?.combo_item?.id}-${_item.id}-quantity`] = Yup.number()
                  .required(formatMessage({ defaultMessage: "Vui lòng nhập số lượng nhập kho" }))
                  .max(_combo?.quantity, formatMessage({ defaultMessage: "Đã nhập quá số lượng cần nhập" }))
              }

            } else {
              (listVarianCombotStatus?.filter(item => !!item?.status) || []).forEach(item => {
                initValues[`variant-${item?.id}-${_item.id}-quantity-status`] = 0
              })
              const amountImportCombo = _.sum(listVarianCombotStatus?.filter(item => !!item?.status)?.map((item) => values[`variant-${item?.id}-${_item.id}-quantity-status`] || 0))
              if (values['creationMethod'] == 2) {
                schema[`variant-multi-combo-${_item.id}-${_combo?.combo_item?.id}-quantity-import`] = Yup.number()
                  .test("amountFull1", formatMessage({ defaultMessage: "Đã nhập quá số lượng cần nhập" }), (value, context) => amountImportCombo <= _combo?.quantity)
              }

            }

          })
        } else {
          initValues[`variant-${productVariant?.id}-${_item.id}-isMulti`] = false
          const listVariantStatus = [{ ...productVariant, product_status_name: 'Mới' }, ...productVariant?.status_variants]
          if (values[`variant-${productVariant?.id}-${_item.id}-isMulti`] === false) {
            initValues[`variant-${productVariant?.id}-${_item.id}-quantity`] = 0
            initValues[`variant-${productVariant?.id}-${_item.id}-list-status`] = listVariantStatus.filter(item => !!item?.status)
            initValues[`variant-${productVariant?.id}-${_item.id}-status`] = listVariantStatus.filter(item => !!item?.status && item?.id != productVariant.id)?.length > 0
            if (values['creationMethod'] == 2) {
              schema[`variant-${productVariant?.id}-${_item.id}-quantity`] = Yup.number()
                .required(formatMessage({ defaultMessage: "Vui lòng nhập số lượng nhập kho" }))
                .max(_item.quantity_purchased, formatMessage({ defaultMessage: "Đã nhập quá số lượng cần nhập" }))
            }

          } else {
            (listVariantStatus?.filter(item => !!item?.status) || []).forEach(status => {
              initValues[`variant-${status?.id}-${_item.id}-quantity-status`] = 0
            })
            const amount = _.sum((listVariantStatus?.filter(item => !!item?.status) || []).map(item => values[`variant-${item?.id}-${_item.id}-quantity-status`]))
            if (values['creationMethod'] == 2) {
              schema[`variant-multi-${_item.id}-quantity-import`] = Yup.number()
                .test("amountFull1", formatMessage({ defaultMessage: "Đã nhập quá số lượng cần nhập" }), (value, context) => amount <= _item.quantity_purchased)
            }

          }
        }
      }

      return {
        ..._item,
        productVariant,
        returnItemId: _item?.id
      }
    }
    );
    setOrderItemsRebuild(rebuild);
    setValidateSchema(schema);
    setInitialForm(prev => ({
      ...prev,
      ...initValues,
      ...(_.omit(values, ['creationMethod'])),
    }));
  }, [orderItemVariant, values, dataOrderItems, dataOrder.logistic_fail]);
  
  return (
    <Modal
      show={dataOrder}
      aria-labelledby="example-modal-sizes-title-sm "
      centered
      size="xl"
      onHide={onHide}
      backdrop={true}
      className="overwriteModal"
      dialogClassName={'body-dialog-connect'}
    >
      <Modal.Header>
        <Modal.Title>
          {formatMessage({ defaultMessage: 'Xử lý trả hàng' })}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="cursor-default">
        <Formik
          initialValues={{ ...initialForm }}
          validationSchema={Yup.object().shape(validateSchema)}
          enableReinitialize
          onSubmit={async (values) => {
            if (imgsNote.some(img => !!img?.isUploading)) {
              addToast(formatMessage({ defaultMessage: 'Hình ảnh đang tải lên. Xin vui lòng thử lại sau.' }), { appearance: 'error' });
              return;
            }

            const bodyImportReturnOrder = {
              order_id: dataOrder?.id,
              import_type: Number(values?.creationMethod),
              sme_warehouse_id: values?.warehouseId?.value,
              import_images: imgsNote?.map(img => img?.source || ''),
              import_videos: productVideFiles?.map(video => video?.source || ''),
              link_video: values['urlVideo'] || '',
              import_note: values.note,
              import_items: orderItemsRebuild?.filter(order => !!order?.productVariant)?.flatMap((orderItem) => {
                if (!!orderItem?.productVariant?.is_combo) {

                  const itemCombo = orderItem?.productVariant?.combo_items?.map(_combo => {
                    const isMultiStatus = values[`variant-${_combo?.combo_item?.id}-${orderItem.id}-isMulti`]
                    const listStatus = values[`variant-${_combo?.combo_item?.id}-${orderItem.id}-list-status`]
                    if (isMultiStatus && listStatus?.length) {
                      return (listStatus?.filter(status => !!values[`variant-${status?.id}-${orderItem.id}-quantity-status`]))?.map(item => ({
                        sme_combo_variant_id: orderItem?.productVariant?.id,
                        sme_variant_id: item?.id,
                        sc_variant_id: orderItem?.sc_variant_id,
                        return_item_id: orderItem?.returnItemId,
                        return_quantity: _combo?.quantity,
                        order_item_transaction_id: _combo?.order_item_transaction_id,
                        import_quantity: values[`variant-${item?.id}-${orderItem.id}-quantity-status`] || 0,
                      }))
                    } else {
                      return {
                        sme_combo_variant_id: orderItem?.productVariant?.id,
                        sme_variant_id: values[`inIsMulti-${orderItem?.id}-combo-current-status-${_combo?.combo_item?.id}`] || _combo?.combo_item?.id,
                        sc_variant_id: orderItem?.sc_variant_id,
                        return_item_id: orderItem?.returnItemId,
                        return_quantity: _combo?.quantity,
                        order_item_transaction_id: _combo?.order_item_transaction_id,
                        import_quantity: values[`variant-${_combo?.combo_item?.id}-${orderItem.id}-quantity`] || 0,
                      }
                    }

                  })

                  return _.flatten(itemCombo)
                } else {
                  const isMultiStatus = values[`variant-${orderItem?.productVariant?.id}-${orderItem.id}-isMulti`]
                  const listStatus = values[`variant-${orderItem?.productVariant?.id}-${orderItem.id}-list-status`]
                  let itemNotCombo = {}
                  if (isMultiStatus && listStatus?.length) {
                    return (listStatus?.filter(status => !!values[`variant-${status?.id}-${orderItem.id}-quantity-status`]))?.map(item => ({
                      sme_variant_id: item?.id,
                      sc_variant_id: orderItem?.sc_variant_id,
                      return_item_id: orderItem?.returnItemId,
                      return_quantity: orderItem?.quantity_purchased,
                      order_item_transaction_id: orderItem?.order_item_transaction_id,
                      import_quantity: values[`variant-${item?.id}-${orderItem.id}-quantity-status`] || 0,
                    }))
                  } else {
                    itemNotCombo = {
                      sme_variant_id: values[`inIsMulti-${orderItem?.id}-current-status-${orderItem?.productVariant?.id}`] || orderItem?.productVariant?.id,
                      sc_variant_id: orderItem?.sc_variant_id,
                      return_item_id: orderItem?.returnItemId,
                      return_quantity: orderItem?.quantity_purchased,
                      order_item_transaction_id: orderItem?.order_item_transaction_id,
                      import_quantity: values[`variant-${orderItem?.productVariant?.id}-${orderItem.id}-quantity`] || 0,
                    }
                  }
                  return itemNotCombo
                }
              }, [])
            }

            const { data } = await importReturnOrder({ variables: bodyImportReturnOrder });
            if (data?.coImportWarehouse) {
              if (data?.coImportWarehouse?.success) {
                addToast(data?.coImportWarehouse?.message, { appearance: 'success' })
                !!refetchDetail && refetchDetail()
                onHide()
              } else {
                addToast(data?.coImportWarehouse?.message, { appearance: 'error' })
                onHide()
              }
            } else {
              addToast('Có lỗi xảy ra, xin vui lòng thử lại', { appearance: "error" });
              onHide();
            }
          }}
        >
          {({ values, handleSubmit, validateForm, errors, setFieldValue }) => {
            if (dataOrder?.logistic_fail != 'delivery_packing_cancel') setMethod(values?.creationMethod);
            setValues(values)
            return (
              <div>
                {<LoadingDialog show={loading} />}
                <div className="row mb-2 d-flex justify-content-between">
                  <div style={{ zIndex: 100 }} className="col-custom">
                    <Field
                      name="warehouseId"
                      label={formatMessage({ defaultMessage: 'Kho nhận hàng' })}
                      component={ReSelectVertical}
                      onChange={() => {
                        setFieldValue('__changed__', true)
                      }}
                      required
                      placeholder=""
                      customFeedbackLabel={' '}
                      options={dataWarehouse?.sme_warehouses?.filter(wh => wh?.fulfillment_by !== PROVIDER_WH)?.map(__ => {
                        return {
                          label: __.name,
                          value: __.id,
                        }
                      })}
                      isClearable={false}
                    />
                  </div>
                  <div className="col-custom">
                    <Field
                      name="creationMethod"
                      label={formatMessage({ defaultMessage: 'Hình thức nhập kho' })}
                      onChange={() => {
                        if (method == 1) {
                          refeshData(values, setFieldValue)
                        }
                      }}
                      component={RadioGroup}
                      curr
                      value={method}
                      customFeedbackLabel={" "}
                      options={creationMethod}
                      disabled={dataOrder?.logistic_fail == 'delivery_packing_cancel' || !productLink}
                    ></Field>
                  </div>
                </div>
                <div className="row mb-4">
                  <div className="d-flex col-6 align-items-center">
                    <label className={`mr-3`} style={{ flexShrink: 'inherit' }}>{formatMessage({ defaultMessage: 'Hình ảnh' })}:</label>
                    <div className="d-flex align-items-center flex-wrap">
                      {imgsNote?.map((file, index) => (
                        <div className="itemsort" style={{ position: 'relative' }}>
                          <ImageUpload
                            key={`refund-order-note-${index}`}
                            data={file}
                            accept={".png, .jpg, .jpeg"}
                            allowDowload
                            allowRemove
                            isSmall
                            onRemove={() => {
                              setImgsNote(prev => {
                                let newImgs = [...prev];
                                newImgs.splice(index, 1);
                                return newImgs;
                              });
                            }}
                            onUploading={(isUploading) => {
                              setImgsNote(prev => prev.map(_ff => {
                                if (_ff.id != file.id) {
                                  return _ff
                                }
                                return {
                                  ..._ff,
                                  isUploading
                                }
                              }))
                            }}
                            onUploadSuccess={(dataAsset, id) => {
                              setImgsNote(prev => prev.map(_ff => {
                                if (_ff.id == id) {
                                  return dataAsset
                                }
                                return _ff
                              }))
                            }}
                          />
                        </div>
                      ))}
                      {imgsNote?.length < 5 && (
                        <ImageUpload
                          accept={".png, .jpg, .jpeg"}
                          multiple={true}
                          required={false}
                          isSmall
                          onChooseFile={files => {
                            let errorDuplicate = [];
                            let filesAccept = files.filter(_file => _file.size <= 3 * 1024 * 1024)

                            setImageInvalid(files.map((_file, _index) => {
                              let mess = []
                              if (_file.size > 3 * 1024 * 1024) {
                                mess.push(formatMessage({ defaultMessage: `Dung lượng tối đa 3MB` }))
                              }

                              if (mess.length > 0)
                                return {
                                  file: _file,
                                  message: mess.join('. ')
                                }
                              return null
                            }).filter(_error => !!_error))

                            setImgsNote(prev => prev.concat(
                              filesAccept.map(_file => ({
                                id: randomString(12),
                                file: _file,
                                refFile: _file,
                              }))
                            ).slice(0, 5))
                            if (errorDuplicate.length > 0) {
                              addToast(formatMessage({ defaultMessage: 'Vui lòng không chọn hình ảnh trùng nhau' }), { appearance: 'error' });
                            }
                          }}
                        />
                      )}
                    </div>
                  </div>
                  <div className="ml-20 col-5 d-flex align-items-center">

                    {dataOrder?.fulfillment_provider_type == 1 && (
                      <>
                        <div className="d-flex align-items-center">
                          <label className={`mr-3`} style={{ flexShrink: 'inherit' }}>{formatMessage({ defaultMessage: 'Videos' })}:</label>
                          <div className="d-flex align-items-center flex-wrap">
                            {
                              productVideFiles.map((_file, index) => {
                                return <VideoUpload
                                  isSingle={false}
                                  setErrorVideo={mess => {
                                    setProductVideFiles(prev => prev.map(_ff => {
                                      return {
                                        ..._ff,
                                        hasError: true
                                      }
                                    }))
                                  }}
                                  data={_file} key={`file-pro-${_file.id}`} accept={".mp4"} allowRemove
                                  onUploadError={(isUploadError) => {
                                    setProductVideFiles(prev => prev.map(_ff => {
                                      if (_ff.id != _file.id) {
                                        return _ff
                                      }
                                      return {
                                        ..._ff,
                                        isUploadError
                                      }
                                    }))
                                  }}
                                  onRemove={() => {
                                    setProductVideFiles(prev => prev.filter(_ff => _ff.id != _file.id))
                                  }}
                                  onUploading={(isUploading) => {
                                    setProductVideFiles(prev => prev.map(_ff => {
                                      if (_ff.id != _file.id) {
                                        return _ff
                                      }
                                      return {
                                        ..._ff,
                                        isUploading
                                      }
                                    }))
                                  }}
                                  onUploadSuccess={(dataAsset) => {
                                    setFieldValue('__changed__', true)
                                    setProductVideFiles(prev => prev.map(_ff => {
                                      if (_ff.id == _file.id) {
                                        return dataAsset
                                      }
                                      return _ff
                                    }))
                                  }}
                                />
                              })
                            }
                            {
                              productVideFiles.length < 1 && <VideoUpload accept={".mp4"}
                                onChooseFile={async files => {
                                  setProductVideFiles(prev => prev.concat(files.map(_file => ({
                                    id: randomString(12),
                                    file: _file
                                  }))).slice(0, 8))
                                }}
                              />
                            }
                          </div>
                        </div>
                        <div className="d-flex align-items-center">
                          <label className={`mr-3`} style={{ flexShrink: 'inherit' }}>{formatMessage({ defaultMessage: 'Đường dẫn' })}:</label>
                          <div className="mt-4">
                            <Field
                              name={`urlVideo`}
                              component={Input}
                              placeholder={formatMessage({ defaultMessage: "https://" })}
                              label={""}
                              required={false}
                              customFeedbackLabel={" "}
                              cols={["col-0", "col-12"]}
                              rows={2}
                            />
                          </div>
                        </div>
                      </>

                    )}

                  </div>
                </div>
                <div className="row mb-4">
                  <div className="col-6 d-flex ">
                    <span className="mr-3" style={{ flexShrink: 'inherit', color: '#000000' }}>
                      {formatMessage({ defaultMessage: 'Ghi chú' })}:
                    </span>
                    <div style={{ flex: 1 }}>
                      <Field
                        name="note"
                        component={InputNote}
                        placeholder={formatMessage({ defaultMessage: "Nhập ghi chú" })}
                        onBlurChange={value => setInitialForm(prev => ({ ...prev, ...values, note: value }))}
                        label={""}
                        required={false}
                        customFeedbackLabel={" "}
                        cols={["col-0", "col-12"]}
                        countChar
                        rows={4}
                        maxChar={"255"}
                      />
                    </div>
                  </div>
                </div>
                <TableProductVariant
                  order={dataOrder}
                  loading={loadingBuildForm}
                  orderItems={orderItemsRebuild}
                  setOrderItemVariant={setOrderItemVariant}
                  orderItemVariant={orderItemVariant}
                  dataStore={dataStore}
                  dataChannels={dataStore?.op_connector_channels}
                />
                <div className="form-group mt-8" style={{ display: "flex", justifyContent: "center", margin: "auto" }}>
                  <button type="button" className="btn btn-primary btn-secondary  mr-3" style={{ width: 100 }} onClick={() => onHide()}>
                    {formatMessage({ defaultMessage: 'Hủy' })}
                  </button>
                  <AuthorizationWrapper keys={['refund_order_import_warehouse']} >
                    <button type="submit" className="btn btn-primary btn-elevate" style={{ width: 100 }} disabled={loading || productVideFiles?.some(video => video?.isUploading)} onClick={handleSubmit}>
                      {formatMessage({ defaultMessage: 'Xác nhận' })}
                    </button>
                  </AuthorizationWrapper>
                </div>
              </div>
            )
          }}
        </Formik>
        <Modal
          show={imageInvalid.length > 0}
          aria-labelledby="example-modal-sizes-title-lg"
          centered
          size='lg'
          onHide={() => setImageInvalid([])}
        >
          <Modal.Body className="overlay overlay-block cursor-default text-center">
            <div className="mb-4 row" >
              {imageInvalid.map((_img, _index) => {
                return (
                  <div className='col-12' key={`_index-img-${_index}`} >
                    <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'row', marginBottom: 16 }}>
                      <div style={{ backgroundColor: '#F7F7FA', width: 50, height: 50, borderRadius: 8, overflow: 'hidden', minWidth: 50 }} className='mr-6' >
                        <ImageView file={_img.file} style={{ width: 50, height: 50, objectFit: 'contain' }} />
                      </div>
                      <p className='font-weight-normal mb-1' style={{ textAlign: 'left' }} >{_img.message}</p>
                    </div>
                  </div>
                )
              })
              }
            </div>

            <div className="form-group mb-0">
              <button type="button" className={`btn btn-primary font-weight-bold`} style={{ width: 180 }} onClick={async () => setImageInvalid([])}>
                <span className="font-weight-boldest">{formatMessage({ defaultMessage: 'Xác nhận' })}</span>
              </button>
            </div>
          </Modal.Body>
        </Modal >
      </Modal.Body>
    </Modal>
  );
};

export default WarehouseModal;
