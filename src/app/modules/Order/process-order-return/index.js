import React, {
  useCallback,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { useSubheader } from "../../../../_metronic/layout";
import { useIntl } from "react-intl";
import { Helmet } from "react-helmet";
import { useQuery, useMutation } from "@apollo/client";
import { toAbsoluteUrl } from "../../../../_metronic/_helpers";
import SVG from "react-inlinesvg";
import ModalNote from "./dialogs/ModalNote";
import query_coGetReturnOrder from "../../../../graphql/query_coGetReturnOrder";
import query_sme_catalog_product_variant from "../../../../graphql/query_sme_catalog_product_variant";
import client from "../../../../apollo";
import { Formik } from "formik";
import ModalUploadFile from "./dialogs/ModalUploadFile";
import {
  ModalFileUploadResults,
  ModalImportResult,
} from "./dialogs/ModalResults";
import InfoProcess from "./components/InfoProcess";
import OrderListProcess from "./components/OrderListProcess";
import { Card } from "../../../../_metronic/_partials/controls";
import * as Yup from "yup";
import { useToasts } from "react-toast-notifications";
import { useOnKeyPress } from "../../../../hooks/useOnKeyPress";
import { RouterPrompt } from "../../../../components/RouterPrompt";
import ModalEditNote from "./dialogs/ModalEditNote";
import { TYPE_RETURN } from "./constants";
import mutate_coMultipleImportWarehouse from "../../../../graphql/mutate_coMultipleImportWarehouse";
import LoadingDialog from "../../ProductsStore/product-new/LoadingDialog";
import {
  ModalConfirmDeleteOrder,
  ModalConfirmImport,
  ModalConfirmReset,
  ModalDetailCombo,
  ModalNotification,
} from "./dialogs/ModalConfirm";
import query_sme_catalog_stores from "../../../../graphql/query_sme_catalog_stores";
import _ from "lodash";

const ProcessOrderReturn = () => {
  const { formatMessage } = useIntl();
  const { addToast } = useToasts();
  const { setBreadcrumbs } = useSubheader();
  const inputRefScan = useRef();
  const inputRefSearch = useRef();
  const clearAllInputValue = () => {
    inputRefScan.current.clearValue();
    inputRefSearch.current.clearValue();
  };

  useLayoutEffect(() => {
    setBreadcrumbs([{ title: formatMessage({ defaultMessage: "Xử lý đơn trả hàng" })}, {title: formatMessage({ defaultMessage: "Xử lý đơn hoàn" })}]);
  }, []);

  const { data: dataWarehouse } = useQuery(query_sme_catalog_stores, {
    fetchPolicy: "cache-and-network",
  });

  const [validateSchema, setValidateSchema] = useState(null);
  const [values, setValues] = useState(null);
  const [state, updateState] = useReducer((prev, next) => {
      return { ...prev, ...next };
    },
    {
      warehouse: null,
      typeOptionScan: "tracking_number",
      typeOptionSearch: "tracking_number",
      scanInputValue: "",
      modalUpload: false,
      modalNote: false,
      modalConfirm: false,
      modalEditNote: false,
      modalConfirmDelete: false,
      modalConfirmImport: false,
      modalNotification: false,
      dataScaned: [],
      resultUploadFile: null,
      key: null,
      dataNote: [],
      dataCombo: null,
      resultImportWarehouse: null,
    }
  );
  console.log('statestate', state?.dataScaned)

  useMemo(() => {
    const idDefault = dataWarehouse?.sme_warehouses?.find(wh => wh?.is_default)?.id;

    updateState({ warehouse: idDefault });
  }, [dataWarehouse]);

  const [initialForm, setInitialForm] = useState({import_form_type: 2,});

  const {data: dataScan,loading: loadingScan, refetch: refetchScan} = useQuery(query_coGetReturnOrder, {
    fetchPolicy: "cache-and-network",
    variables: {
      q: state.scanInputValue,
      search_type: state.typeOptionScan,
      context: "warehouse_import",
    },
    skip: !state.scanInputValue || !state.typeOptionScan,
  });

  const queryGetProductVariant = async (ids) => {
    if (!ids) return null;

    const { data } = await client.query({
      query: query_sme_catalog_product_variant,
      variables: {
        where: {
          id: { _in: ids },
        },
      },
      fetchPolicy: "network-only",
    });
    return data?.sme_catalog_product_variant || null;
  };

  const returnOrder = dataScan?.coGetReturnOrder?.data;

  const isSuccess = dataScan?.coGetReturnOrder?.success
  const orderItemsReturn = returnOrder?.returnOrderItems;

  const totalVariants = orderItemsReturn?.map((_item) => {
    let ids = [];
    if (_item?.orderItem?.is_combo) {
      const sme_variant_id_combo = _item?.orderItem.comboItems?.map(
        (combo) => combo.sme_variant_id
      );
      sme_variant_id_combo.push(_item?.orderItem.sme_variant_id);
      ids = [...ids, ...sme_variant_id_combo];
    } else {
      ids = [...ids, _item?.orderItem.sme_variant_id];
    }
    return ids;
  });
  let listPass = state.resultUploadFile?.coValidateExcelImportWarehouse?.list_pass;
  let returnOrderUpload = listPass?.map((list) => list.returnOrder);

  const idItemOrder = returnOrderUpload?.map((it) => {
      return it?.returnOrderItems?.map((_item_return) => {
        let ids = [];
        if (_item_return?.orderItem?.is_combo) {
          const sme_variant_id_combo = _item_return?.orderItem.comboItems?.map((combo) => combo.sme_variant_id);

          sme_variant_id_combo.push(_item_return?.orderItem.sme_variant_id);
          ids = [...ids, ...sme_variant_id_combo];
        } else {
          ids = [...ids, _item_return?.orderItem.sme_variant_id];
        }
        return ids;
      });
    }).flat(2);

  const [queries, setQueries] = useState([]);

  useMemo(async () => {
    const getProduct = await queryGetProductVariant(idItemOrder || "");
    setQueries(getProduct);
  }, [idItemOrder]);

  const addOrderFromFileToList = useCallback(() => {
    try {
      if (queries) {
        const dataUpload = returnOrderUpload?.map((_item, i) => {
          const products = _item?.returnOrderItems.map((__item) => {
            let sme_variant;
            const existQuery = queries?.find((q) => q.id == __item.orderItem.sme_variant_id);
            const { combo_items, ...rest } = existQuery;

            if (!!__item?.orderItem?.is_combo) {
              sme_variant = {
                sme_combo_variant_id: __item.orderItem.sme_variant_id,
                data_combo: combo_items,
                ...rest,
                combo_items: __item?.orderItem?.comboItems?.map((combo) => {
                  const findedComboItem = queries.find((q) => q.id == combo.sme_variant_id);
                  return {
                    ...combo,
                    ...findedComboItem,
                  };
                }),
              };
            } else {
              sme_variant = { ...existQuery };
            }

            return {
              sme_variant_product: sme_variant,
              sc_variant_product: __item,
            };
          });
          const groupData = {
            other: {
              id: _item?.id,
              tracking_number: _item?.tracking_number,
              ref_return_id: _item?.ref_return_id,
              order_id: _item?.order_id,
              return_type: _item?.return_type,
              store_id: _item?.store_id,
              ref_id: _item?.order?.ref_id,
              ref_store_id: _item?.order.ref_store_id,
              fulfillment_provider_type: _item?.order.fulfillment_provider_type,
              connector_channel_code: _item?.connector_channel_code,
            },
            products: products,
          };
          return groupData;
        });
        updateState({ dataScaned: [...dataUpload] });
      }
    } catch (err) { }
  }, [queries, returnOrderUpload]);

  useMemo(async () => {
    try {
      if (returnOrder && !!isSuccess) {
        const checkDataexist = state.dataScaned.find((item) => item.other.id == returnOrder?.id);
        if (checkDataexist) {
          updateState({ scanInputValue: "" });
          addToast(formatMessage({ defaultMessage: "Đơn hoàn đã có trong bảng" }),{ appearance: "error" });
          return;
        }
        const queriesGetProductVariant = await queryGetProductVariant(totalVariants?.flat() || "");
        const products = orderItemsReturn.map((__item, index_order) => {
          let sme_variant;
          const existQuery = queriesGetProductVariant.find((q) => q.id == __item.orderItem.sme_variant_id);
          const { combo_items, ...rest } = existQuery;
          if (!!__item?.orderItem?.is_combo) {
            sme_variant = {
              sme_combo_variant_id: __item?.orderItem?.sme_variant_id,
              data_combo: combo_items,
              ...rest,
              combo_items: __item?.orderItem?.comboItems?.map((combo) => {const findedComboItem = queriesGetProductVariant.find((q) => q.id == combo.sme_variant_id);
                return {
                  ...combo,
                  ...findedComboItem,
                };
              }),
            };
          } else {
            sme_variant = { ...existQuery };
          }
          return {
            sme_variant_product: sme_variant,
            sc_variant_product: __item,
          };
        });
        const groupData = {
          other: {
            id: returnOrder.id,
            tracking_number: returnOrder?.tracking_number,
            ref_return_id: returnOrder?.ref_return_id,
            return_type: returnOrder?.return_type,
            store_id: returnOrder?.store_id,
            order_id: returnOrder?.order_id,
            ref_id: returnOrder?.order.ref_id,
            ref_store_id: returnOrder?.order.ref_store_id,
            fulfillment_provider_type: returnOrder?.order.fulfillment_provider_type,
            connector_channel_code: returnOrder?.connector_channel_code,
          },
          products: products,
        };
        updateState({
          scanInputValue: "",
          dataScaned: [groupData, ...state.dataScaned],
        });
        
        addToast(formatMessage({ defaultMessage: "Thêm vào bảng thành công" }),{ appearance: "success" });
      } else {
        if (!returnOrder && !loadingScan && state.scanInputValue) {
          updateState({ scanInputValue: "" });
          addToast(dataScan?.coGetReturnOrder?.message || "", {appearance: "error"});
        }
      }
    } catch (err) { 

    }
  }, [returnOrder, values,loadingScan]);
  
  useMemo(() => {
    let schema = [];
    let initValues = [];
    (state?.dataScaned || []).forEach(state => {
      (state?.products || []).forEach((item, index) => {
        if (!!item?.sc_variant_product.orderItem.is_combo) {
          (item?.sme_variant_product?.combo_items || []).forEach((_combo, indexCombo) => {

          const comboQuantity = (item?.sc_variant_product?.orderItem.comboItems[indexCombo]?.purchased_quantity / item?.sc_variant_product?.orderItem.quantity_purchased) * item?.sc_variant_product?.return_quantity;

          const listVarianCombotStatus = [{..._combo, product_status_name: "Mới"}, ..._combo?.status_variants]
          initValues[`${state?.other?.id}-variant-${_combo?.id}-combo-quantity-${indexCombo}-${index}`] = comboQuantity
          initValues[`${item?.sme_variant_product.id}-variant-combo-${_combo?.id}-${state?.other?.id}-isMulti`] = false
          if(values[`${item?.sme_variant_product.id}-variant-combo-${_combo?.id}-${state?.other?.id}-isMulti`] === false) {
           
            initValues[`${state?.other?.id}-variant-${_combo?.id}-combo-listStatus-${indexCombo}-${index}`] = listVarianCombotStatus?.filter(item => !!item?.status)
            initValues[`${state?.other?.id}-variant-${_combo?.id}-combo-status-${indexCombo}-${index}`] = listVarianCombotStatus?.filter(item => !!item?.status)?.length > 0
            if(values['import_form_type'] == 2) {
              schema[`${state?.other?.id}-variant-${_combo?.id}-combo-quantity-${indexCombo}-${index}`] = Yup.number()
              .typeError(formatMessage({ defaultMessage: "Vui lòng nhập số lượng nhập kho" }))
              .max(999999, formatMessage({ defaultMessage: "Số lượng sản phẩm phải nhỏ hơn 999.999" }))
              .lessThan(comboQuantity + 1, formatMessage({ defaultMessage: "Đã nhập quá số lượng cần nhập" }));
            }
            
          } else {
            (listVarianCombotStatus?.filter(item => !!item?.status) || []).forEach(status => {
              initValues[`${state?.other?.id}-variant-${_combo?.id}-combo-quantity-${status?.id}-${indexCombo}-${index}`] = 0
            })
            const amountImportCombo = _.sum(listVarianCombotStatus?.filter(item => !!item?.status)?.map(item => values[`${state?.other?.id}-variant-${_combo?.id}-combo-quantity-${item?.id}-${indexCombo}-${index}`] || 0))
            if(values['import_form_type'] == 2) {
              schema[`${state?.other?.id}-variant-multi-combo-${item?.sme_variant_product.id}-${_combo?.id}-quantity-import`] = Yup.number()
            .typeError(formatMessage({ defaultMessage: "Vui lòng nhập số lượng nhập kho" }))
            .test("amountFull1",formatMessage({defaultMessage: "Đã nhập quá số lượng cần nhập"}),(value, context) => amountImportCombo <= comboQuantity)                
            }
            
            }
          }
          );
        } else {
            const listVariantStatus = [{...item?.sme_variant_product, product_status_name: 'Mới'}, ...item?.sme_variant_product?.status_variants?.filter(item => !!item?.status)]
            initValues[`${state?.other?.id}-variant-${item?.sme_variant_product.id}-${index}-isMulti`] = false
            initValues[`${state?.other?.id}-variant-${item?.sme_variant_product.id}-${index}-list-status`] = listVariantStatus;
            initValues[`${state?.other?.id}-variant-${item?.sme_variant_product.id}-${index}-stautus`] = listVariantStatus?.length > 0;
          if(values[`${state?.other?.id}-variant-${item?.sme_variant_product.id}-${index}-isMulti`] === false) {
            initValues[`${state?.other?.id}-variant-${item?.sme_variant_product.id}-${index}-quantity`] = item.sc_variant_product.return_quantity;
            if(values['import_form_type'] == 2) {
              schema[`${state?.other?.id}-variant-${item?.sme_variant_product.id}-${index}-quantity`] = Yup.number()
              .typeError(formatMessage({ defaultMessage: "Vui lòng nhập số lượng nhập kho" }))
              .max(999999, formatMessage({ defaultMessage: "Số lượng sản phẩm phải nhỏ hơn 999.999" }))
              .lessThan(item.sc_variant_product.return_quantity + 1,formatMessage({ defaultMessage: "Đã nhập quá số lượng cần nhập" }));
            }
            
          } else {
              (listVariantStatus || []).forEach(statusVariant => {
                initValues[`${state?.other?.id}-variant-${item?.sme_variant_product.id}-${statusVariant?.id}-${index}-status-quantity`] = 0;
              })
            
              const amount = _.sum((listVariantStatus || []).map(statusVariant => values[`${state?.other?.id}-variant-${item?.sme_variant_product.id}-${statusVariant?.id}-${index}-status-quantity`]))
              if(values['import_form_type'] == 2) {
                schema[`${state?.other?.id}-variant-multi-${item?.sme_variant_product.id}-import-quantity`] = Yup.number()
                .typeError(formatMessage({ defaultMessage: "Vui lòng nhập số lượng nhập kho" }))
                .test("amountFull1",formatMessage({defaultMessage: "Đã nhập quá số lượng cần nhập"}),(value, context) => amount <= item.sc_variant_product.return_quantity)            
              }
              
              
          }
        }
      });
    })
    setValidateSchema(Yup.object().shape(schema));
    setInitialForm((prev) => ({
      ...prev,
      ...initValues,
      ...values
    }));
  }, [state.dataScaned.length, values])

  const clearForm = () => {
    if (!state.modalConfirmImport && !state.modalNotification) {
      updateState({ modalConfirm: true });
    }
  };
  const bulkImportWarehouse = () => {
    if (!state.dataScaned.length && !state.modalConfirm && !state.modalConfirmImport) {
      updateState({ modalNotification: true });
      return;
    }
    if (!state.modalConfirm) {
      updateState({ modalConfirmImport: true });
    }
  };
  useOnKeyPress(clearForm, "F3");
  useOnKeyPress(bulkImportWarehouse, "F1");
  const [coMultipleImportWarehouse, { loading: loadingImport }] = useMutation(mutate_coMultipleImportWarehouse, {awaitRefetchQueries: true});
  const [typeImport, setTypeImport] = useState(null);
  useMemo(() => {
    if (typeImport) {
      let initValues = [];
      if (state?.dataScaned) {
        state.dataScaned.forEach((__item) => {
          const returnItem = __item?.products;
          returnItem.forEach((product, indexVariant) => {
            const isCombo = product.sc_variant_product.orderItem.is_combo;
            const comboItems = product.sme_variant_product.combo_items;
            if (!!isCombo) {
              comboItems.forEach((__comboItem, indexCombo) => {
                initValues[`${__item.other.id}-variant-${__comboItem?.id}-combo-quantity-${indexCombo}-${indexVariant}`] = typeImport == 1
                    ? 0 : (product?.sc_variant_product?.orderItem.comboItems[indexCombo]?.purchased_quantity / product?.sc_variant_product?.orderItem.quantity_purchased) *product?.sc_variant_product?.return_quantity;
              });
            } else {
              initValues[`${__item.other.id}-variant-${product.sme_variant_product.id}-${indexVariant}-quantity`] = typeImport == 1 ? 0 : product.sc_variant_product.return_quantity;
            }
          });
        });
        setInitialForm((prev) => ({
          ...prev,
          import_form_type: typeImport,
          ...initValues,
        }));
      }
    }
  }, [typeImport]);

  return (
    <>
      <Helmet
        titleTemplate={formatMessage({ defaultMessage: `Xử lý hàng loạt đơn hoàn {key}` }, { key: " - UpBase" })}
        defaultTitle={formatMessage({ defaultMessage: `Xử lý hàng loạt đơn hoàn {key}` },{ key: " - UpBase" })}
      >
        <meta name="description" content={formatMessage({ defaultMessage: `Xử lý hàng loạt đơn hoàn {key}` },{ key: " - UpBase" })}/>
      </Helmet>

      <div>
        <Formik
          initialValues={initialForm}
          onSubmit={async (values) => {
            const listObjImport = state.dataScaned?.map((__data, index) => {
              let list = {
                return_obj_id: __data.other.id,
                obj_tracking_number: __data.other.tracking_number,
              };
              const findDataNote = state?.dataNote?.find((__note) => __note.key == __data.other.id);
              list["import_note"] = findDataNote?.note || "";
              list["import_images"] = findDataNote?.links?.map(link => link?.source) || [];

              list["import_videos"] = findDataNote?.videosLink?.map(link => link?.source) || [];
              list["link_video"] = findDataNote?.urlVideo
              const importItems = __data?.products.map(
                (product, indexVariant) => {

                  const isCombo = product.sc_variant_product.orderItem.is_combo;
                  const comboItems = product.sme_variant_product.combo_items;
                  if (!!isCombo) {
                    const comboVariants = comboItems.map((__comboItem, indexCombo) => {
                      const isMultiStatusCombo = values[`${product?.sme_variant_product.id}-variant-combo-${__comboItem?.id}-${__data?.other?.id}-isMulti`]
    
                      const listStatusCombo = values[`${__data?.other?.id}-variant-${__comboItem?.id}-combo-listStatus-${indexCombo}-${indexVariant}`]
                      if(isMultiStatusCombo && listStatusCombo?.length) { 
                        const status_lon_hon_0 = listStatusCombo?.filter(status => !!values[`${__data?.other?.id}-variant-${__comboItem?.id}-combo-quantity-${status?.id}-${indexCombo}-${indexVariant}`])
     
                        return status_lon_hon_0?.map(item => ({
                          sme_combo_variant_id: product?.sme_variant_product?.sme_combo_variant_id,
                          import_quantity: values[`${__data?.other?.id}-variant-${__comboItem?.id}-combo-quantity-${item?.id}-${indexCombo}-${indexVariant}`],
                          return_item_id: product.sc_variant_product.id,
                          sme_variant_id: item?.id,
                          order_item_transaction_id: __comboItem?.order_item_transaction_id,
                          sc_variant_id: product.sc_variant_product.orderItem.sc_variant_id,
                          return_quantity: (product?.sc_variant_product?.orderItem.comboItems[indexCombo]?.purchased_quantity /product?.sc_variant_product?.orderItem.quantity_purchased) * product?.sc_variant_product?.return_quantity,
                        }))
                      } else {
                        return {
                          sme_combo_variant_id: product?.sme_variant_product?.sme_combo_variant_id,
                          import_quantity: values[`${__data.other.id}-variant-${__comboItem?.id}-combo-quantity-${indexCombo}-${indexVariant}`],
                          return_item_id: product.sc_variant_product.id,
                          order_item_transaction_id: __comboItem?.order_item_transaction_id,
                          sme_variant_id: values[`current-combo-${__data.other.id}-variant-status-${__comboItem?.id}`] || __comboItem?.id,
                          sc_variant_id: product.sc_variant_product.orderItem.sc_variant_id,
                          return_quantity: (product?.sc_variant_product?.orderItem.comboItems[indexCombo]?.purchased_quantity /product?.sc_variant_product?.orderItem.quantity_purchased) * product?.sc_variant_product?.return_quantity,
                        };
                      }
                      
                    });
                    return _.flatten(comboVariants)
                  } else {
                    const isMultiStatus = values[`${__data?.other?.id}-variant-${product?.sme_variant_product.id}-${indexVariant}-isMulti`]
                    const listStatus = values[`${__data?.other?.id}-variant-${product?.sme_variant_product.id}-${indexVariant}-list-status`]
                    let itemNotCombo = {}
                    if(isMultiStatus && listStatus?.length) {
                      const variant_greater_than_0 =  listStatus?.filter(item => !!values[`${__data?.other?.id}-variant-${product?.sme_variant_product.id}-${item?.id}-${indexVariant}-status-quantity`])
                      return variant_greater_than_0?.map(status => ({
                        import_quantity:values[`${__data?.other?.id}-variant-${product?.sme_variant_product?.id}-${status?.id}-${indexVariant}-status-quantity`],
                        return_item_id: product.sc_variant_product.id,
                        sme_variant_id: status?.id,
                        sc_variant_id: product.sc_variant_product.orderItem.sc_variant_id,
                        order_item_transaction_id: product?.sc_variant_product?.orderItem?.order_item_transaction_id,
                        return_quantity: product.sc_variant_product.return_quantity,
                      }))
                    } else {
                      itemNotCombo = {
                        import_quantity:values[`${__data.other.id}-variant-${product.sme_variant_product.id}-${indexVariant}-quantity`],
                        return_item_id: product.sc_variant_product.id,
                        order_item_transaction_id: product?.sc_variant_product?.orderItem?.order_item_transaction_id,
                        sme_variant_id: values[`${__data.other.id}-current-variant-status-${product?.sme_variant_product?.id}`] || product.sc_variant_product.orderItem.sme_variant_id,
                        sc_variant_id: product.sc_variant_product.orderItem.sc_variant_id,
                        return_quantity: product.sc_variant_product.return_quantity,
                      };
                    }
                    return itemNotCombo
                  }
                }
              );
              list["import_items"] = [...importItems].flat();
              return list;
            });
            const dataImportWarehouse = {
              import_type: +values.import_form_type,
              sme_warehouse_id: state?.warehouse,
              type_return: TYPE_RETURN,
              list_obj_import: [...listObjImport],
            };
   
            let { data } = await coMultipleImportWarehouse({variables: dataImportWarehouse,});

            if (!!data?.coMultipleImportWarehouse.success) {
              updateState({ resultImportWarehouse: data, dataScaned: [] });
            } else {
              addToast(formatMessage({ defaultMessage: "Có lỗi xảy ra, xin vui lòng thử lại" }), { appearance: "error" });
              return;
            }
          }}
          enableReinitialize
          validationSchema={validateSchema}
        >
          {({ values, errors, setFieldValue, handleSubmit }) => {
            setTypeImport(values.import_form_type);
            setValues(values);
            return (
              <>
                <LoadingDialog show={loadingImport} />
                <ModalDetailCombo dataCombo={state.dataCombo} onHide={() => updateState({ dataCombo: null })}/>
                <ModalNotification show={state.modalNotification} updateState={updateState}/>
                <ModalConfirmDeleteOrder state={state} setInitialForm={setInitialForm} updateState={updateState} show={state.modalConfirmDelete}/>
                <ModalUploadFile showModal={state.modalUpload} setResultUploadFile={updateState} onHide={() => updateState({ modalUpload: false })}/>
                {!!state.modalNote && (
                  <ModalNote state={state} updateState={updateState} show={state.modalNote}/>
                )}
                {!!state.modalEditNote && (
                  <ModalEditNote updateState={updateState} state={state} />
                )}
                <ModalConfirmReset 
                  clearAllInputValue={clearAllInputValue} values={values} 
                  setFieldValue={setFieldValue} setValidateSchema={setValidateSchema}
                  updateState={updateState} show={state.modalConfirm}
                />
                <ModalConfirmImport handleSubmit={handleSubmit} updateState={updateState} show={state.modalConfirmImport}/>
                {!!state.resultUploadFile && (
                  <ModalFileUploadResults addOrderFromFileToList={addOrderFromFileToList} onHide={() => updateState({ resultUploadFile: null })} resultUploadFile={state.resultUploadFile}/>
                )}
                <RouterPrompt
                  when={state.dataScaned.length}
                  title={formatMessage({defaultMessage:"Mọi thông tin của bạn trước đó sẽ bị xoá nếu bạn thoát màn hình này. Bạn có chắc chắn muốn thoát?",})}
                  cancelText={formatMessage({ defaultMessage: "KHÔNG" })}
                  okText={formatMessage({ defaultMessage: "CÓ, THOÁT" })}
                  onOK={() => true}
                  onCancel={() => false}
                />
                {state.resultImportWarehouse && (
                  <ModalImportResult onHide={() => updateState({ resultImportWarehouse: null })} resultImportWarehouse={state.resultImportWarehouse}/>
                )}

                <InfoProcess
                  ref={inputRefScan}
                  dataWarehouse={dataWarehouse}
                  loadingScan={loadingScan}
                  values={values}
                  state={state}
                  refetchScan={refetchScan}
                  updateState={updateState}
                />
                <OrderListProcess
                  values={values}
                  ref={inputRefSearch}
                  state={state}
                  loadingScan={loadingScan}
                  updateState={updateState}
                />

                <div className="d-flex justify-content-end position-fixed bottom-0 right-0 w-100 bg-white" style={{zIndex: 99999999, boxShadow: "rgba(100, 100, 111, 0.2) 0px 7px 29px 0px", padding: "15px",}}>
                  <div className="d-flex align-items-center">
                    <button 
                    type="button" className="btn btn-secondary mr-6" 
                    style={{background: "#6C757D", border: "#6C757D", fontWeight: "bold", width: "max-content", color: "white",}} 
                    onClick={clearForm}
                    >
                      {formatMessage({defaultMessage: "XOÁ VÀ QUÉT TIẾP (F3)",})}
                    </button>
                    <button
                      type="submit"
                      className="text-white btn btn-primary btn-elevate mr-6"
                      style={{width: "max-content", fontWeight: "bold",}}
                      onClick={bulkImportWarehouse}
                      disabled={!state.dataScaned.length}
                    >
                      {formatMessage({ defaultMessage: "XÁC NHẬN (F1)" })}
                    </button>
                  </div>
                </div>
              </>
            );
          }}
        </Formik>
      </div>
      <Card>
        <div
          id="kt_scrolltop1"
          className="scrolltop"
          style={{ bottom: 80 }}
          onClick={() => {
            window.scrollTo({
              letf: 0,
              top: document.body.scrollHeight,
              behavior: "smooth",
            });
          }}
        >
          <span className="svg-icon">
            <SVG
              src={toAbsoluteUrl("/media/svg/icons/Navigation/Down-2.svg")}
              title={" "}
            ></SVG>
          </span>{" "}
        </div>
      </Card>
    </>
  );
};

export default ProcessOrderReturn;
