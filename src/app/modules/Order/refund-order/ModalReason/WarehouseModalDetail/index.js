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
import query_warehouse_inventory_transactions from "../../../../../../graphql/query_warehouse_inventory_transactions";
import query_warehouse_bills from "../../../../../../graphql/query_warehouse_bills";
import { randomString } from "../../../../../../utils";
import LoadingDialog from "../../../../Products/product-new/LoadingDialog";
import ImageUpload from "../../../order-process-fail-delivery/components/ImageUpload";
import { InputNote } from "../../../order-process-fail-delivery/components/InputNote";
import { mutation_coUpdateImportNote } from "../../../return-order/utils/graphqls";
import "../../utils/index.scss";
import TableProductVariant from "./TableProductVariant";
import VideoUpload from "../../../fail-delivery-order/VideoUpload";
import { PATTERN_URL } from "../../../OrderUIHelpers";
import { Input } from "../../../../../../_metronic/_partials/controls";
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
const WarehouseModalDetail = memo(
  ({ dataStore, refetch, orderProcess, openModal, setOpenModal }) => {
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

    const [initialForm, setInitialForm] = useState({});
    const [validateSchema, setValidateSchema] = useState(null);
    const [orderItemsRebuild, setOrderItemsRebuild] = useState([]);
    const [getProductVariant, setGetProductVariant] = useState([]);
    const [imgsNote, setImgsNote] = useState([]);
    const [imageInvalid, setImageInvalid] = useState([]);
    const [billFromImport, setBillFromImport] = useState(null);
    const [productVideFiles, setProductVideFiles] = useState([])
    const { addToast } = useToasts();
    const [loadingBuildForm, setLoadingBuildForm] = useState(false);

    const { data: dataWarehouse } = useQuery(query_sme_catalog_stores, {
      fetchPolicy: "cache-and-network",
    });
    const orderInreturnOrderItems = orderProcess?.returnOrderItems.map(
      (or) => or?.orderItem
    );

    const infoWarehouse = useMemo(() => {
      return dataWarehouse?.sme_warehouses?.find(wh => wh?.id == orderProcess?.returnWarehouseImport?.sme_warehouse_id)
    }, [dataWarehouse, orderProcess])

    useMemo(
      async () => {
        const checkedImport = (orderProcess?.returnWarehouseImport?.import_type == 2 || orderProcess?.returnWarehouseImport?.import_type == 3)
          && orderProcess?.returnWarehouseImport?.returnWarehouseImportItems?.some(item => item?.import_quantity > 0);

        if (!checkedImport) return;

        const { data } = await client.query({
          query: query_warehouse_bills,
          variables: {
            where: {
              order_id: { _eq: orderProcess?.order_id },
            },
          },
          fetchPolicy: "network-only",
        });

        if (data?.warehouse_bills?.length > 0) {
          let bill = data?.warehouse_bills?.[0];
          setBillFromImport({
            code: bill?.code,
            url: `/products/warehouse-bill/${bill?.type}/${bill?.id}`
          })
        }
      }, [orderProcess]
    );

    useMemo(
      () => {
        if (orderProcess?.returnWarehouseImport?.import_images?.length > 0) {
          setImgsNote(orderProcess?.returnWarehouseImport?.import_images?.map(img => ({
            id: randomString(),
            source: img
          })))
        }
        if (orderProcess?.returnWarehouseImport?.import_videos?.length > 0) {
          setProductVideFiles(orderProcess?.returnWarehouseImport?.import_videos?.map(video => ({
            id: randomString(),
            source: video
          })))
        }
      }, [orderProcess?.returnWarehouseImport?.import_images]
    );

    const [coUpdateImportNote, { loading }] = useMutation(
      mutation_coUpdateImportNote
    );

    function removeProductVariant(index) {
      const productVariantDeleted = getProductVariant.filter(
        (ob) => ob.keyVariant !== index
      );
      setGetProductVariant(productVariantDeleted);
    }
    useMemo(() => {

      setInitialForm((prev) => ({
        ...prev,
        warehouseId: {
          label: infoWarehouse?.name,
          value: infoWarehouse?.id,
        },
        creationMethod: (orderProcess?.returnWarehouseImport?.import_type != 1) ? 2 : 1,
        note: orderProcess?.returnWarehouseImport?.import_note || "",
        urlVideo: orderProcess?.returnWarehouseImport?.link_video || ''
      }));
    }, [dataWarehouse?.sme_warehouses, infoWarehouse]);

    const caculateImportQuantity = (id, order_item_id) => {
      if (!orderProcess?.returnWarehouseImport?.returnWarehouseImportItems) return 0;

      const findedImportItem = orderProcess?.returnWarehouseImport?.returnWarehouseImportItems?.find(item => item?.sme_variant_id === id && item?.returnOrderItem?.order_item_id === order_item_id);
      return findedImportItem?.import_quantity || 0
    };

    const caculateReturnQuantity = (id, order_item_id) => {
      if (!orderProcess?.returnWarehouseImport?.returnWarehouseImportItems) return 0;

      const findedImportItem = orderProcess?.returnWarehouseImport?.returnWarehouseImportItems?.find(item => item?.sme_variant_id === id && item?.returnOrderItem?.order_item_id === order_item_id);
      return findedImportItem?.return_quantity || 0
    };

    useMemo(async () => {
      let [schema, initValues] = [
        {note: Yup.string().notRequired().max(255, formatMessage({ defaultMessage: "Ghi chú tối đa 255 ký tự" })),
         urlVideo: Yup.string().notRequired()
        .matches(PATTERN_URL, 'Vui lòng nhập đúng định dạng')},{}
      ];

      setLoadingBuildForm(true);

      let idsVariant = orderInreturnOrderItems.reduce((result, value) => {
        let total;
        if (!!value?.is_combo) {
          total = [value?.sme_variant_id || "",...value?.comboItems?.map(item => item?.sme_variant_id)]
        } else {
          total = value?.sme_variant_id || ""
        }

        return result.concat(total)
      }, []);

      const returnImportIds = orderProcess?.returnWarehouseImport?.returnWarehouseImportItems?.map(_item => [_item?.sme_combo_variant_id, _item?.sme_variant_id]);
 
      const idsQuery = _.flatten(idsVariant.concat(returnImportIds))?.filter(id => !!id);

      const variants = await queryGetProductVariants(idsQuery);
      let totalParentVariants = []
      const totalparentVariantId = variants?.flatMap(item => item?.parent_variant_id)?.filter(Boolean)

      if(totalparentVariantId?.length) {
         totalParentVariants = await queryGetProductVariants(totalparentVariantId);
      }
      const totalVariants = [...variants, ...totalParentVariants]

      setLoadingBuildForm(false);
      const rebuild = orderInreturnOrderItems?.map((_item, index) => {
        let productVariant;
        const returnItem = orderProcess?.returnOrderItems?.find((_ro) => _ro?.order_item_id === _item?.id);
        const itemImported = orderProcess?.returnWarehouseImport?.returnWarehouseImportItems?.filter(item => item?.returnOrderItem?.order_item_id == _item?.id)
        const isComboImport = itemImported?.every(item => !!item?.sme_combo_variant_id);

        // Check hàng hóa import là liên kết hay chọn để xử lý nhập kho
        if (_item?.sme_variant_id) {
          const findedVariant = totalVariants?.find(variant => variant?.id === _item?.sme_variant_id);
          productVariant = {
            ...findedVariant,
            import_quantity: caculateImportQuantity(_item?.sme_variant_id, _item?.id),
            return_quantity: caculateReturnQuantity(_item?.sme_variant_id, _item?.id) || returnItem?.return_quantity,
            is_combo: _item?.is_combo,
            combo_items_origin: findedVariant?.combo_items,
            combo_items: _item?.comboItems?.map(_combo => {
              const smeVariant = totalVariants?.find(variant => variant?.id === _combo?.sme_variant_id);
              return {
                ..._combo,
                import_quantity: caculateImportQuantity(_combo?.sme_variant_id, _combo?.order_item_id),
                return_quantity: caculateReturnQuantity(_combo?.sme_variant_id, _combo?.order_item_id) || ((_combo?.purchased_quantity / _item?.quantity_purchased) * returnItem?.return_quantity),
                combo_item: smeVariant
              }
            })
          };
        } else {
          // Check hàng hóa import chọn là nhập kho hay ko nhập kho
          if (itemImported?.length > 0) {
            // Check hàng hóa import được chọn là combo || thường
            if (isComboImport) {
              const findedVariant = totalVariants?.find(variant => variant?.id === itemImported?.[0]?.sme_combo_variant_id)
              productVariant = {
                ...findedVariant,
                import_quantity: caculateImportQuantity(itemImported?.[0]?.sme_combo_variant_id, _item?.id),
                return_quantity: caculateReturnQuantity(itemImported?.[0]?.sme_combo_variant_id, _item?.id) || returnItem?.return_quantity,
                is_combo: true,
                combo_items_origin: findedVariant?.combo_items,
                combo_items: findedVariant?.combo_items?.map(_combo => {
                  const findedVariantCombo = itemImported?.find(item => item?.sme_variant_id == _combo?.combo_variant_id)
                  const smeVariant = totalVariants?.find(variant => variant?.id === _combo?.combo_variant_id);
                  return {
                    ..._combo,
                    import_quantity: findedVariantCombo?.import_quantity,
                    return_quantity: findedVariantCombo?.return_quantity,
                    combo_item: smeVariant,
                  }
                }),
                
              };
            } else {
              const findImported = itemImported?.find(item => item?.returnOrderItem?.order_item_id == _item?.id)
              let findedVariant = {}
              findedVariant = totalVariants?.find(variant => findImported?.sme_variant_id === variant?.id);

              if(findedVariant?.parent_variant_id) {
                findedVariant = totalVariants?.find(variant => findedVariant?.parent_variant_id === variant?.id);
              }
              productVariant = {
                ...findedVariant,
                is_combo: false,
                import_quantity: findImported?.import_quantity,
                return_quantity: findImported?.return_quantity,
              }
            }
          } else {
            productVariant = null;
          }
        }


        return {
          ..._item,
          productVariant,
          quantityReturn: returnItem?.return_quantity,
          returnItemId: returnItem?.id,
          index: index,
          returnOrder: returnItem
        };
      });
      setOrderItemsRebuild(rebuild);
      setValidateSchema(Yup.object().shape(schema));
      setInitialForm((prev) => ({
        ...prev,
        ...initValues,
      }));
    }, [orderProcess, getProductVariant]);

    return (
      <>
        <Formik
          initialValues={initialForm}
          validationSchema={validateSchema}
          enableReinitialize
          onSubmit={async (values) => {
            if (imgsNote.some(img => !!img?.isUploading)) {
              addToast(formatMessage({ defaultMessage: 'Hình ảnh đang tải lên. Xin vui lòng thử lại sau.' }), { appearance: 'error' });
              return;
            }

            const bodyUpdateImportNote = {
              return_obj_id: orderProcess?.id,
              import_images: imgsNote?.map(img => img?.source || ''),
              import_videos: productVideFiles?.map(video => video?.source || ''),
              type_return: orderProcess?.returnWarehouseImport?.type_return,
              import_note: values.note,
              link_video: values['urlVideo'] || ''
            };

            const { data } = await coUpdateImportNote({
              variables: bodyUpdateImportNote,
            });
            if (data.coUpdateImportNote) {
              if (!!data?.coUpdateImportNote?.success) {
                addToast(data?.coUpdateImportNote?.message, {
                  appearance: "success",
                });
                setOpenModal({ ...openModal, openWarehouseDetail: false });
                refetch();
              } else {
                addToast(data?.coUpdateImportNote?.message, {
                  appearance: "error",
                });
                setOpenModal({ ...openModal, openWarehouseDetail: false });
                refetch();
              }
            } else {
              addToast(formatMessage({ defaultMessage: 'Đã có lỗi xảy ra' }), {
                appearance: "error",
              });
              setOpenModal({ ...openModal, openWarehouseDetail: false });
              refetch();
            }
          }}
        >
          {({ values, handleSubmit, validateForm, setFieldValue }) => {
            return (
              <div>
                <LoadingDialog show={loading} />
                <div className="row d-flex justify-content-between">
                  <div className="col-custom" style={{ zIndex: 100, cursor: 'not-allowed' }}>
                    <Field
                      label={formatMessage({ defaultMessage: 'Kho nhận hàng' })}
                      name="warehouseId"
                      component={ReSelectVertical}
                      onChange={() => {
                        setFieldValue("__changed__", true);
                      }}
                      isDisabled={true}
                      required
                      placeholder=""
                      customFeedbackLabel={" "}
                      options={[{
                        label: infoWarehouse?.name,
                        value: infoWarehouse?.id,
                      }]}
                      isClearable={false}
                    />
                  </div>
                  <div className="col-custom">
                    <Field
                      name="creationMethod"
                      label={formatMessage({ defaultMessage: 'Hình thức nhập kho' })}
                      component={RadioGroup}
                      customFeedbackLabel={" "}
                      disabled={true}
                      options={creationMethod}
                    />
                  </div>
                </div>
                <div className="row mb-4">
                  <div className="col-6 d-flex align-items-center">
                        <label className={`mr-3`} style={{ flexShrink: 'inherit', color: '#000000' }}>{formatMessage({ defaultMessage: 'Hình ảnh' })}:</label>
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
                                  let mess = [
                                  ]
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
                            placeholder={formatMessage({defaultMessage: "https://"})}
                            label={""}
                            required={false}
                            customFeedbackLabel={" "}
                            cols={["col-0", "col-12"]}
                            rows={2}
                          />
                        </div>
                    </div>
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
                {!!billFromImport && (
                  <div className="row mb-6">
                    <div className="col-custom d-flex align-items-center">
                      <span style={{ color: '#000000' }}>{formatMessage({ defaultMessage: 'Phiếu nhập kho' })}:</span>
                      <span className="ml-2 text-primary cursor-pointer" onClick={() => window.open(billFromImport?.url, '_blank')}>
                        {billFromImport?.code}
                      </span>
                    </div>
                  </div>
                )}
                <TableProductVariant
                  getProductVariant={getProductVariant}
                  setGetProductVariant={setGetProductVariant}
                  returnOrder={orderProcess}
                  dataStore={dataStore}
                  loading={loadingBuildForm}
                  orderItems={orderItemsRebuild}
                  removeProductVariant={removeProductVariant}
                  lengthReturnItem={orderInreturnOrderItems?.length}
                />

                <div
                  className="form-group"
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    margin: "auto",
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-secondary mr-3"
                    style={{ width: 100 }}
                    onClick={() =>
                      setOpenModal({ ...openModal, openWarehouseDetail: false })
                    }
                  >
                    {formatMessage({ defaultMessage: 'Hủy' })}
                  </button>
                  <AuthorizationWrapper keys={['refund_order_import_warehouse']} >
                  <button
                    type="submit"
                    className="btn btn-primary btn-elevate mr-3"
                    style={{ width: 100 }}
                    disabled={loading || productVideFiles?.some(video => video?.isUploading)}
                    onClick={handleSubmit}
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
              {
                imageInvalid.map((_img, _index) => {
                  return (
                    <div className='col-12' key={`_index-img-${_index}`} >
                      <div style={{
                        alignItems: 'center', display: 'flex',
                        flexDirection: 'row', marginBottom: 16
                      }}>
                        <div style={{
                          backgroundColor: '#F7F7FA',
                          width: 50, height: 50,
                          borderRadius: 8,
                          overflow: 'hidden',
                          minWidth: 50
                        }} className='mr-6' >
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
              <button
                type="button"
                className={`btn btn-primary font-weight-bold`}
                style={{ width: 180 }}
                onClick={async () => {
                  setImageInvalid([])
                }}
              >
                <span className="font-weight-boldest">{formatMessage({ defaultMessage: 'Xác nhận' })}</span>
              </button>
            </div>
          </Modal.Body>
        </Modal >
      </>
    );
  }
);

export default WarehouseModalDetail;