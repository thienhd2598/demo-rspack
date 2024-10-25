import { useMutation, useQuery } from "@apollo/client";
import { Field, Formik } from "formik";
import _ from "lodash";
import React, { memo, useMemo, useState } from "react";
import { Modal } from "react-bootstrap";
import { useIntl } from "react-intl";
import { useToasts } from "react-toast-notifications";
import * as Yup from "yup";
import { RadioGroup } from "../../../../../../_metronic/_partials/controls/forms/RadioGroup";
import { ReSelectVertical } from "../../../../../../_metronic/_partials/controls/forms/ReSelectVertical";
import client from "../../../../../../apollo";
import ImageView from "../../../../../../components/ImageView";
import query_sme_catalog_product_variant from "../../../../../../graphql/query_sme_catalog_product_variant";
import query_sme_catalog_stores from "../../../../../../graphql/query_sme_catalog_stores";
import { randomString } from "../../../../../../utils";
import LoadingDialog from "../../../../Products/product-new/LoadingDialog";
import ImageUpload from "../../../order-process-fail-delivery/components/ImageUpload";
import { InputNote } from "../../../order-process-fail-delivery/components/InputNote";
import { RETURN_PROCESS_RETURN_TYPE } from "../../utils/contants";
import { mutateA_coImportReturnOrder } from "../../utils/graphqls";
import "../../utils/index.scss";
import TableProductVariant from "./TableProductVariant";
import VideoUpload from "../../../fail-delivery-order/VideoUpload";
import { Input } from "../../../../../../_metronic/_partials/controls";
import { PATTERN_URL } from "../../../OrderUIHelpers";
import AuthorizationWrapper from "../../../../../../components/AuthorizationWrapper";

const queryGetProductVariants = async (ids) => {
  if (ids?.length == 0) return [];

  const { data } = await client.query({
    query: query_sme_catalog_product_variant,
    variables: {
      where: {
        id: { _in: ids },
      },
    },
    fetchPolicy: "network-only",
  });
  return data?.sme_catalog_product_variant || [];
}

const WarehouseModal = memo(
  ({ refetchDetail, dataStore, refetch, orderProcess, openModal, setOpenModal }) => {
    const { formatMessage } = useIntl();
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
    const [orderItemsRebuild, setOrderItemsRebuild] = useState([]);
    const [getProductVariant, setGetProductVariant] = useState([]);
    const [imgsNote, setImgsNote] = useState([]);
    const [imageInvalid, setImageInvalid] = useState([])
    const [productVideFiles, setProductVideFiles] = useState([])
    const [values, setValues] = useState([])
    const { addToast } = useToasts();
    const { data: dataWarehouse } = useQuery(query_sme_catalog_stores, { 
      fetchPolicy: "cache-and-network", 
    });
    const orderReturnOrderItems = orderProcess?.returnOrderItems?.map((or) => or?.orderItem);

    const checkIsNull = orderReturnOrderItems?.every((or) => !or?.sme_variant_id);

    const [importReturnOrder, { loading }] = useMutation(mutateA_coImportReturnOrder);
    function removeProductVariant(index) {
      const productVariantDeleted = getProductVariant.filter((ob) => ob.keyVariant !== index);
      setGetProductVariant(productVariantDeleted);
    }

    const defaultWarehouse = dataWarehouse?.sme_warehouses?.find((element) => element.is_default == 1) || null;

    useMemo(() => {
      setInitialForm((prev) => ({
        ...prev,
        creationMethod: checkIsNull ? 1 : 2,
        note: "",
        warehouseId: {
          label: defaultWarehouse?.name,
          value: defaultWarehouse?.id,
        },
        urlVideo: ''
      }));
    }, [checkIsNull, defaultWarehouse]);

    useMemo(async () => {
      let [schema, initValues] = [{
        note: Yup.string().notRequired().max(255, formatMessage({ defaultMessage: "Ghi chú tối đa 255 ký tự" })),
        urlVideo: Yup.string().notRequired()
          .matches(PATTERN_URL, 'Vui lòng nhập đúng định dạng')
      }, {},];

      setInitialForm(prev => ({
        ...prev,
        creationMethod: (getProductVariant?.length == 0 && checkIsNull) ? 1 : 2
      }));

      const idsVariant = orderReturnOrderItems.reduce((result, value) => {
        let total;
        if (!!value?.is_combo) {
          total = [value?.sme_variant_id || "", ...value?.comboItems?.map(item => item?.sme_variant_id),]
        } else {
          total = value?.sme_variant_id || ""
        }

        return result.concat(total)
      }, []);

      const idsQuery = _.flatten(idsVariant)?.filter(id => !!id);

      const totalVariants = await queryGetProductVariants(idsQuery);

      const rebuild = orderReturnOrderItems?.map((_item, index) => {
        const findedVariant = totalVariants?.find(variant => variant?.id === _item?.sme_variant_id);
        let productVariant = {
          ...findedVariant,
          is_combo: _item?.is_combo,
          combo_items_origin: findedVariant?.combo_items,
          combo_items: _item?.comboItems?.map(_combo => {
            const smeVariant = totalVariants?.find(variant => variant?.id === _combo?.sme_variant_id);
            return {
              ..._combo,
              quantity: _combo?.purchased_quantity,
              combo_item: smeVariant
            }
          })
        };

        const returnItem = orderProcess?.returnOrderItems?.find((_ro) => _ro?.order_item_id === _item?.id);
        const getProductVariantByIndex = getProductVariant.find((ob) => ob.keyVariant == index);

        console.log({ findedVariant });

        if (!!findedVariant) {
          if (!!productVariant?.is_combo) {
            productVariant.combo_items.forEach((_combo, i) => {
              const listVariantsStatusCombo = [{ ..._combo?.combo_item, product_status_name: "Mới" }, ...(_combo?.combo_item?.status_variants || [])]
              initValues[`variant-${_combo?.combo_item?.id}-${productVariant.id}-${index}-${i}-isMultiStatus`] = false
              if (values[`variant-${_combo?.combo_item?.id}-${productVariant.id}-${index}-${i}-isMultiStatus`] === false) {
                initValues[`variant-${_combo?.combo_item?.id}-${productVariant.id}-${index}-${i}-quantity`] = 0;
                initValues[`variant-${_combo?.combo_item?.id}-${productVariant.id}-${index}-${i}-list_status`] = listVariantsStatusCombo?.filter(item => !!item?.status) || [];
                initValues[`variant-${_combo?.combo_item?.id}-${productVariant.id}-${index}-${i}-status`] = listVariantsStatusCombo?.filter(item => !!item?.status && item?.id != _combo?.combo_item?.id)?.length > 0
                schema[`variant-${_combo?.combo_item?.id}-${productVariant.id}-${index}-${i}-quantity`] = Yup.number()
                  .typeError(formatMessage({ defaultMessage: "Vui lòng nhập số lượng nhập kho" }))
                  .max(999999, formatMessage({ defaultMessage: "Số lượng sản phẩm phải nhỏ hơn 999.999" }))
                  .lessThan((_combo?.purchased_quantity / _item?.quantity_purchased) * returnItem?.return_quantity + 1, formatMessage({ defaultMessage: "Đã nhập quá số lượng cần nhập" }));
              } else {

                (listVariantsStatusCombo || []).forEach(statusVariant => {
                  initValues[`variant-${_combo?.combo_item?.id}-${statusVariant?.id}-${productVariant.id}-${index}-${i}-status-quantity`] = 0;

                })
                const amountImportCombo = _.sum(listVariantsStatusCombo?.filter(item => !!item?.status)?.map((item) => values[`variant-${_combo?.combo_item?.id}-${item?.id}-${productVariant.id}-${index}-${i}-status-quantity`] || 0))
                schema[`variant-multi-combo-${productVariant.id}-${_combo?.combo_item?.id}-import-quantity`] = Yup.number()
                  .typeError(formatMessage({ defaultMessage: "Vui lòng nhập số lượng nhập kho" }))
                  .test("amountFull1", formatMessage({ defaultMessage: "Đã nhập quá số lượng cần nhập" }), (value, context) => amountImportCombo <= (_combo?.purchased_quantity / _item?.quantity_purchased) * returnItem?.return_quantity)
              }
            });
          } else {
            const listVariantStatus = [{ ...findedVariant, product_status_name: 'Mới' }, ...findedVariant?.status_variants]
            initValues[`variant-${productVariant.id}-${index}-isMultiStatus`] = false
            if (values[`variant-${productVariant.id}-${index}-isMultiStatus`] === false) {
              initValues[`variant-${productVariant.id}-${index}-quantity`] = 0;
              initValues[`variant-${productVariant.id}-${index}-list_status`] = listVariantStatus?.filter(item => !!item?.status) || [];
              initValues[`variant-${productVariant.id}-${index}-status`] = listVariantStatus?.filter(item => !!item?.status && item?.id != findedVariant?.id)?.length > 0
              schema[`variant-${productVariant?.id}-${index}-quantity`] = Yup.number()
                .typeError(formatMessage({ defaultMessage: "Vui lòng nhập số lượng nhập kho" }))
                .max(999999, formatMessage({ defaultMessage: "Số lượng sản phẩm phải nhỏ hơn 999.999" }))
                .lessThan(returnItem?.return_quantity + 1, formatMessage({ defaultMessage: "Đã nhập quá số lượng cần nhập" }));
            } else {
              (listVariantStatus?.filter(item => !!item?.status) || []).forEach(statusVariant => {
                initValues[`variant-${statusVariant?.id}-${index}-status-quantity`] = 0;
              })
              const amount = _.sum((listVariantStatus?.filter(item => !!item?.status) || []).map(item => values[`variant-${item?.id}-${index}-status-quantity`]))
              schema[`variant-multi-${productVariant?.id}-import-quantity`] = Yup.number()
                .typeError(formatMessage({ defaultMessage: "Vui lòng nhập số lượng nhập kho" }))
                .test("amountFull1", formatMessage({ defaultMessage: "Đã nhập quá số lượng cần nhập" }), (value, context) => amount <= returnItem?.return_quantity)
            }
          }
        }
        if (!findedVariant && getProductVariantByIndex) {
          if (!!getProductVariantByIndex._item?.is_combo) {
            getProductVariantByIndex._item.combo_items.forEach((_combo, i) => {
              const listVariantStatusCombo = [{ ..._combo?.combo_item, product_status_name: "Mới" }, ..._combo?.combo_item?.status_variants]
              initValues[`variant-${_combo?.combo_item?.id}-${getProductVariantByIndex.keyVariant}-${index}-${i}-isMultiStatus`] = false;
              if (values[`variant-${_combo?.combo_item?.id}-${getProductVariantByIndex.keyVariant}-${index}-${i}-isMultiStatus`] === false) {
                initValues[`variant-${_combo?.combo_item?.id}-${getProductVariantByIndex.keyVariant}-${index}-${i}-quantity`] = 0;
                initValues[`variant-${_combo?.combo_item?.id}-${getProductVariantByIndex.keyVariant}-${index}-${i}-list_status`] = listVariantStatusCombo?.filter(item => !!item?.status) || [];
                initValues[`variant-${_combo?.combo_item?.id}-${getProductVariantByIndex.keyVariant}-${index}-${i}-status`] = listVariantStatusCombo?.filter(item => !!item?.status && item?.id != _combo?.combo_item?.id)?.length > 0
                schema[`variant-${_combo?.combo_item?.id}-${getProductVariantByIndex.keyVariant}-${index}-${i}-quantity`] = Yup.number()
                  .typeError(formatMessage({ defaultMessage: "Vui lòng nhập số lượng nhập kho" }))
                  .max(999999, formatMessage({ defaultMessage: "Số lượng sản phẩm phải nhỏ hơn 999.999" }))
                  .lessThan(_combo?.quantity * returnItem?.return_quantity + 1, formatMessage({ defaultMessage: "Đã nhập quá số lượng cần nhập" }));
              } else {
                (listVariantStatusCombo?.filter(item => !!item?.status) || []).forEach(statusVariant => {
                  initValues[`variant-${_combo?.combo_item?.id}-${statusVariant?.id}-${getProductVariantByIndex.keyVariant}-${index}-${i}-status-quantity`] = 0;

                })
                const amountImportCombo = _.sum(listVariantStatusCombo?.filter(item => !!item?.status)?.map((item) => values[`variant-${_combo?.combo_item?.id}-${item?.id}-${getProductVariantByIndex.keyVariant}-${index}-${i}-status-quantity`] || 0))

                schema[`variant-multi-combo-${getProductVariantByIndex.keyVariant}-${_combo?.combo_item?.id}-import-quantity`] = Yup.number()
                  .typeError(formatMessage({ defaultMessage: "Vui lòng nhập số lượng nhập kho" }))
                  .test("amountFull1", formatMessage({ defaultMessage: "Đã nhập quá số lượng cần nhập" }), (value, context) => amountImportCombo <= _combo?.quantity * returnItem?.return_quantity)
                  .test("amountFull2", formatMessage({ defaultMessage: "Vui lòng nhập đủ số lượng nhập kho", }), (value, context) => amountImportCombo == _combo?.quantity * returnItem?.return_quantity)
              }
            }
            );
          } else {
            initValues[`variant-${getProductVariantByIndex._item.id}-${getProductVariantByIndex.keyVariant}-isMultiStatus`] = false
            const listVariantStatus = [{ ...getProductVariantByIndex?._item, product_status_name: 'Mới' }, ...getProductVariantByIndex?._item?.status_variants]
            if (values[`variant-${getProductVariantByIndex._item.id}-${getProductVariantByIndex.keyVariant}-isMultiStatus`] === false) {
              initValues[`variant-${getProductVariantByIndex._item.id}-${getProductVariantByIndex.keyVariant}-quantity`] = 0;
              initValues[`variant-${getProductVariantByIndex._item.id}-${getProductVariantByIndex.keyVariant}-list_status`] = listVariantStatus?.filter(item => !!item?.status) || [];
              initValues[`variant-${getProductVariantByIndex._item.id}-${getProductVariantByIndex.keyVariant}-status`] = listVariantStatus?.filter(item => !!item?.status && item?.id != getProductVariantByIndex?._item?.id)?.length > 0
              schema[`variant-${getProductVariantByIndex._item.id}-${getProductVariantByIndex.keyVariant}-quantity`] = Yup.number()
                .typeError(formatMessage({ defaultMessage: "Vui lòng nhập số lượng nhập kho" }))
                .max(999999, formatMessage({ defaultMessage: "Số lượng sản phẩm phải nhỏ hơn 999.999" }))
                .lessThan(returnItem?.return_quantity + 1, formatMessage({ defaultMessage: "Đã nhập quá số lượng cần nhập" }));
            } else {
              (listVariantStatus?.filter(item => !!item?.status) || []).forEach(statusVariant => {
                initValues[`variant-${statusVariant?.id}-${getProductVariantByIndex.keyVariant}-status-quantity`] = 0;

              })
              const amount = _.sum((listVariantStatus?.filter(item => !!item?.status) || []).map(item => values[`variant-${item?.id}-${getProductVariantByIndex?.keyVariant}-status-quantity`]))

              schema[`variant-multi-${getProductVariantByIndex.keyVariant}-import-quantity`] = Yup.number()
                .typeError(formatMessage({ defaultMessage: "Vui lòng nhập số lượng nhập kho" }))
                .test("amountFull1", formatMessage({ defaultMessage: "Đã nhập quá số lượng cần nhập" }), (value, context) => amount <= returnItem?.return_quantity)
                .test("amountFull2", formatMessage({ defaultMessage: "Vui lòng nhập đủ số lượng nhập kho", }), (value, context) => amount == returnItem?.return_quantity)
            }
          }
        }

        return {
          ..._item,
          productVariant,
          getProductVariantByIndex: getProductVariantByIndex,
          quantityReturn: returnItem?.return_quantity,
          returnItemId: returnItem?.id,
          index: index
        };
      });

      setOrderItemsRebuild(rebuild);
      setValidateSchema(Yup.object().shape(schema));

      setInitialForm((prev) => ({
        ...prev,
        ...initValues,
      }));
    }, [orderProcess, values, getProductVariant]);

    return (
      <>
        <LoadingDialog show={loading} />
        <Formik initialValues={{ ...initialForm, ...(_.omit(values, ['creationMethod'])) }} validationSchema={validateSchema} enableReinitialize>
          {({ values, setFieldValue, handleSubmit, validateForm }) => {
            setValues(values)
            return (
              <div>
                <div className="row d-flex justify-content-between">
                  <div className="col-custom" style={{ zIndex: 100 }}>
                    <Field
                      label={formatMessage({ defaultMessage: 'Kho nhận hàng' })}
                      name="warehouseId"
                      component={ReSelectVertical}
                      onChange={() => {
                        setFieldValue("__changed__", true);
                      }}
                      required
                      placeholder=""
                      customFeedbackLabel={" "}
                      options={dataWarehouse?.sme_warehouses?.filter(wh => wh?.fulfillment_by !== PROVIDER_WH)?.map((__) => {
                        return {
                          label: __.name,
                          value: __.id,
                        };
                      })}
                      isClearable={false}
                    />
                  </div>
                  <div className="col-custom">
                    <Field
                      name="creationMethod"
                      label={formatMessage({ defaultMessage: 'Hình thức nhập kho' })}
                      component={RadioGroup}
                      customFeedbackLabel={" "}
                      disabled={orderItemsRebuild?.every(or => !or.sme_variant_id) && !orderItemsRebuild?.some(or => or.getProductVariantByIndex)}
                      options={creationMethod}
                    />
                  </div>
                </div>
                <div className="row mb-4">
                  <div className="col-6 d-flex align-items-center">
                    <label className={`mr-3`} style={{ flexShrink: 'inherit' }}>{formatMessage({ defaultMessage: 'Hình ảnh' })}:</label>
                    <div className="d-flex flex-wrap align-items-center">
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
                              console.log({ dataAsset, id, imgsNote });
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
                            console.log({ files })
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

                    {orderProcess?.order?.fulfillment_provider_type == 1 && (
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
                    <span className="mr-3" style={{ flexShrink: 'inherit', color: '#000000' }}>{formatMessage({ defaultMessage: 'Ghi chú' })}:</span>
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
                  getProductVariant={getProductVariant}
                  setGetProductVariant={setGetProductVariant}
                  returnOrder={orderProcess}
                  dataStore={dataStore}
                  orderItems={orderItemsRebuild}
                  removeProductVariant={removeProductVariant}
                  lengthReturnItem={orderReturnOrderItems?.length}
                />

                <div className="form-group" style={{ display: "flex", justifyContent: "center", margin: "auto" }}>
                  <button type="button" className="btn btn-secondary mr-3" style={{ width: 100 }} onClick={() => setOpenModal({ ...openModal, openWarehouse: false })}>
                    {formatMessage({ defaultMessage: 'Hủy' })}
                  </button>
                  <AuthorizationWrapper keys={['refund_order_import_warehouse']} >
                    <button type="submit" className="btn btn-primary btn-elevate mr-3" style={{ width: 100 }} disabled={loading || productVideFiles?.some(video => video?.isUploading)}
                      onClick={async () => {
                        let error = await validateForm(values)
                        console.log('error', error)
                        if (Object.values(error).length != 0 && values['creationMethod'] == 2) {
                          handleSubmit();
                          return;
                        };

                        if (imgsNote.some(img => !!img?.isUploading)) {
                          addToast(formatMessage({ defaultMessage: 'Hình ảnh đang tải lên. Xin vui lòng thử lại sau.' }), { appearance: 'error' });
                          return;
                        }

                        const bodyImportReturnOrder = {
                          order_id: orderProcess?.order_id,
                          import_type: +values.creationMethod,
                          sme_warehouse_id: values?.warehouseId?.value,
                          import_images: imgsNote?.map(img => img?.source || '')?.filter(img => !!img),
                          import_videos: productVideFiles?.map(video => video?.source || '')?.filter(Boolean),
                          link_video: values['urlVideo'] || '',
                          import_note: values.note,
                          import_items: orderItemsRebuild?.reduce((result, order, indexOrder) => {

                            if (!!order?.productVariant?.is_combo) {
                              const itemCombo = order?.productVariant?.combo_items?.map((_combo, index) => {
                                const isMultiStatus = values[`variant-${_combo?.combo_item?.id}-${order?.productVariant.id}-${indexOrder}-${index}-isMultiStatus`];
                                const listStatus = values[`variant-${_combo?.combo_item?.id}-${order?.productVariant.id}-${indexOrder}-${index}-list_status`]
                                if (isMultiStatus && listStatus?.length) {
                                  return (listStatus?.filter(status => !!values[`variant-${_combo?.combo_item?.id}-${status?.id}-${order?.productVariant.id}-${indexOrder}-${index}-status-quantity`]))?.map(item => ({
                                    sme_combo_variant_id: order?.productVariant?.id,
                                    sme_variant_id: item?.id,
                                    sc_variant_id: order?.sc_variant_id,
                                    return_item_id: order?.returnItemId,
                                    order_item_transaction_id: _combo?.order_item_transaction_id,
                                    return_quantity: (_combo?.quantity / order?.quantity_purchased) * order?.quantityReturn,
                                    import_quantity: values[`variant-${_combo?.combo_item?.id}-${item?.id}-${order?.productVariant.id}-${indexOrder}-${index}-status-quantity`],
                                  }))
                                } else {
                                  return {
                                    sme_combo_variant_id: order?.productVariant?.id,
                                    sme_variant_id: values[`current-${order?.id}-combo-variant-status-${_combo?.combo_item?.id}`] || _combo?.combo_item?.id,
                                    sc_variant_id: order?.sc_variant_id,
                                    return_item_id: order?.returnItemId,
                                    order_item_transaction_id: _combo?.order_item_transaction_id,
                                    return_quantity: (_combo?.quantity / order?.quantity_purchased) * order?.quantityReturn,
                                    import_quantity: values[`variant-${_combo?.combo_item?.id}-${order.productVariant.id}-${indexOrder}-${index}-quantity`],
                                  }
                                }

                              });

                              result = result.concat(_.flatten(itemCombo));
                              return result;
                            }

                            if (!!order?.getProductVariantByIndex?._item.is_combo) {

                              const itemCombo = order?.getProductVariantByIndex?._item?.combo_items?.map((_combo, index) => {
                                const isMultiStatus = values[`variant-${_combo?.combo_item?.id}-${order?.getProductVariantByIndex.keyVariant}-${indexOrder}-${index}-isMultiStatus`];
                                const listStatus = values[`variant-${_combo?.combo_item?.id}-${order?.getProductVariantByIndex.keyVariant}-${indexOrder}-${index}-list_status`]

                                if (isMultiStatus && listStatus?.length) {
                                  return (listStatus?.filter(status => !!values[`variant-${_combo?.combo_item?.id}-${status?.id}-${order?.getProductVariantByIndex.keyVariant}-${indexOrder}-${index}-status-quantity`]))?.map(item => ({
                                    sme_combo_variant_id: order?.getProductVariantByIndex?._item.id,
                                    sme_variant_id: item?.id,
                                    sc_variant_id: order?.sc_variant_id,
                                    return_item_id: order?.returnItemId,
                                    order_item_transaction_id: _combo?.order_item_transaction_id,
                                    return_quantity: _combo?.quantity * order?.quantityReturn,
                                    import_quantity: values[`variant-${_combo?.combo_item?.id}-${item?.id}-${order?.getProductVariantByIndex.keyVariant}-${indexOrder}-${index}-status-quantity`],
                                  }))
                                } else {
                                  return {
                                    sme_combo_variant_id: order?.getProductVariantByIndex?._item.id,
                                    sme_variant_id: values[`current-${order?.od}-combo-variant-status-${_combo?.combo_item?.id}`] || _combo?.combo_item?.id,
                                    sc_variant_id: order?.sc_variant_id,
                                    return_item_id: order?.returnItemId,
                                    order_item_transaction_id: _combo?.order_item_transaction_id,
                                    return_quantity: _combo?.quantity * order?.quantityReturn,
                                    import_quantity: values[`variant-${_combo?.combo_item?.id}-${order.getProductVariantByIndex.keyVariant}-${indexOrder}-${index}-quantity`],
                                  }
                                }

                              });

                              result = result.concat(_?.flatten(itemCombo));
                              return result;
                            }

                            if (order?.sme_variant_id) {
                              let itemNotCombo = {}

                              const listStatus = values[`variant-${order?.productVariant.id}-${indexOrder}-list_status`]
                              const isMultiStatus = values[`variant-${order?.productVariant.id}-${indexOrder}-isMultiStatus`];

                              if (isMultiStatus && listStatus?.length) {
                                itemNotCombo = (listStatus?.filter(status => !!values[`variant-${status?.id}-${order?.index}-status-quantity`])).map(statusVariant => {
                                  return {
                                    sme_variant_id: statusVariant?.id,
                                    sc_variant_id: order?.sc_variant_id,
                                    return_item_id: order?.returnItemId,
                                    order_item_transaction_id: order?.order_item_transaction_id,
                                    return_quantity: order?.quantityReturn,
                                    import_quantity: values[`variant-${statusVariant?.id}-${order?.index}-status-quantity`],
                                  }
                                })
                              } else {

                                itemNotCombo = {
                                  sme_variant_id: values[`current-${order.index}-status-variant-${order?.productVariant?.id}`] || order?.sme_variant_id,
                                  sc_variant_id: order?.sc_variant_id,
                                  return_item_id: order?.returnItemId,
                                  order_item_transaction_id: order?.order_item_transaction_id,
                                  return_quantity: order?.quantityReturn,
                                  import_quantity: values[`variant-${order?.productVariant?.id}-${order.index}-quantity`],
                                };
                              }


                              result = result.concat(itemNotCombo);
                            }
                            if (order?.getProductVariantByIndex?._item.id) {
                              let itemNotCombo = {}
                              const listStatus = values[`variant-${order?.getProductVariantByIndex?._item.id}-${order?.getProductVariantByIndex.keyVariant}-list_status`]
                              const isMultiStatus = values[`variant-${order?.getProductVariantByIndex?._item.id}-${order?.getProductVariantByIndex.keyVariant}-isMultiStatus`]
                              if (isMultiStatus && listStatus?.length) {
                                itemNotCombo = (listStatus?.filter(status => !!values[`variant-${status?.id}-${order?.getProductVariantByIndex.keyVariant}-status-quantity`]))?.map(item => ({
                                  sme_variant_id: item?.id,
                                  sc_variant_id: order?.sc_variant_id,
                                  return_item_id: order?.returnItemId,
                                  order_item_transaction_id: order?.order_item_transaction_id,
                                  return_quantity: order?.quantityReturn,
                                  import_quantity: values[`variant-${item?.id}-${order?.getProductVariantByIndex.keyVariant}-status-quantity`],
                                }))

                              } else {
                                itemNotCombo = {
                                  sme_variant_id: values[`current-status-${order.getProductVariantByIndex.keyVariant}-variant-${order?.getProductVariantByIndex?._item.id}`] || order?.getProductVariantByIndex?._item.id,
                                  sc_variant_id: order?.sc_variant_id,
                                  return_item_id: order?.returnItemId,
                                  order_item_transaction_id: order?.order_item_transaction_id,
                                  return_quantity: order?.quantityReturn,
                                  import_quantity: values[`variant-${order?.getProductVariantByIndex?._item.id}-${order.getProductVariantByIndex.keyVariant}-quantity`],
                                };
                              }

                              result = result.concat(itemNotCombo);
                            }
                            return result;
                          }, []),
                        };

                        const { data } = await importReturnOrder({
                          variables: bodyImportReturnOrder,
                        });

                        if (data?.coImportWarehouse) {
                          if (data?.coImportWarehouse?.success) {
                            addToast(data?.coImportWarehouse?.message, { appearance: "success" });
                            setOpenModal({ ...openModal, openWarehouse: false });
                            refetch();
                            !!refetchDetail && refetchDetail()
                          } else {
                            addToast(data?.coImportWarehouse?.message, {
                              appearance: "error",
                            });
                            setOpenModal({ ...openModal, openWarehouse: false });
                            refetch();
                          }
                        } else {
                          addToast('Có lỗi xảy ra, xin vui lòng thử lại', {
                            appearance: "error",
                          });
                          setOpenModal({ ...openModal, openWarehouse: false });
                          refetch();
                        }
                      }}
                    >
                      {formatMessage({ defaultMessage: 'Xác nhận' })}
                    </button>
                  </AuthorizationWrapper>
                </div>
              </div>
            );
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
      </>
    );
  }
);

export default WarehouseModal;