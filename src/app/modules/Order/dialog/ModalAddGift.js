import 'rc-table/assets/index.css';
import React, { memo, useState, useCallback, useMemo, useEffect } from 'react';
import { Modal, Tooltip, OverlayTrigger } from 'react-bootstrap';
import { useIntl } from 'react-intl';
import { Checkbox } from '../../../../_metronic/_partials/controls';
import { toAbsoluteUrl } from '../../../../_metronic/_helpers';
import { useQuery, useMutation } from '@apollo/client';
import query_sme_catalog_inventory_items from '../../../../graphql/query_sme_catalog_inventory_items';
import mutate_coAddItemGiftOrder from '../../../../graphql/mutate_coAddItemGiftOrder';
import InfoProduct from '../../../../components/InfoProduct';
import Pagination from '../../../../components/PaginationModal';
import Table from 'rc-table';
import { InputVerticalWithIncrease } from '../../../../_metronic/_partials/controls';
import { Field, Formik } from 'formik';
import ModalCombo from '../../Products/products-list/dialog/ModalCombo';
import * as Yup from 'yup';
import { useToasts } from 'react-toast-notifications';

const LIMIT_ADD_VARIANT = 30;

const ModalAddVariants = ({ show, onHide, smeWarehouseOrder }) => {
  const { formatMessage } = useIntl();
  const [variantSelect, setVariantSelect] = useState([]);
  const [validateSchema, setValidateSchema] = useState({});
  const [dataCombo, setDataCombo] = useState(null);
  const [search, setSearch] = useState({
    searchText: null,
    searchType: '',
    page: 1,
    limit: 20,
  });

  const [step, setStep] = useState(1);
  const { addToast } = useToasts();
  const [updateOrder, { loading: loadingOrderUpdate }] = useMutation(
    mutate_coAddItemGiftOrder,
    {
      awaitRefetchQueries: true,
      refetchQueries: ['findOrderDetail']
    }
  );
  
  useMemo(() => {
    let schema = {};

    (variantSelect || []).forEach((variant) => {
      if (!smeWarehouseOrder) return;

      const smeWarehouse = variant?.variant?.inventories?.find(
        (wh) => wh?.sme_store_id == smeWarehouseOrder?.sme_warehouse_id
      );
      const isAllowPreallocate = variant?.sme_store?.allow_preallocate;      
      const isCheckStock = !isAllowPreallocate && smeWarehouse?.stock_available <= 999999;      

      console.log({ variant })

      schema[`${variant?.variant?.id}`] = Yup.number()
        .required(
          formatMessage({ defaultMessage: 'Vui lòng nhập số lượng hàng hóa' })
        )
        .moreThan(
          0,
          formatMessage({ defaultMessage: 'Số lượng hàng hóa phải lớn hơn 0' })
        )
        .max(
          isCheckStock ? variant?.stock_available : 999999,
          isCheckStock
            ? formatMessage({
              defaultMessage:
                'Số lượng phải nhỏ hơn hoặc bằng tồn sẵn sàng bán',
            })
            : formatMessage({
              defaultMessage:
                'Số lượng hàng hóa phải nhỏ hơn hoặc bằng 999.999',
            })
        );
    });
    setValidateSchema(Yup.object().shape(schema));
  }, [variantSelect]);

  const { data: data, loading } = useQuery(query_sme_catalog_inventory_items, {
    variables: {
      limit: search.limit,
      offset: (search.page - 1) * search.limit,
      where: {
        ...(!!search.searchText
          ? {
            _or: [
              {
                variant: {
                  sme_catalog_product: {
                    name: { _ilike: `%${search.searchText.trim()}%` },
                  },
                },
              },
              {
                variant: { sku: { _ilike: `%${search.searchText.trim()}%` } },
              },
            ],
          }
          : ''),
        sme_store_id: {
          _eq: smeWarehouseOrder?.sme_warehouse_id,
        },
        variant: { product_status_id: { _is_null: true } }
      },
      order_by: {
        updated_at: 'desc',
        variant_id: 'desc',
      },
    },
    fetchPolicy: 'cache-and-network',
  });

  const giftList = smeWarehouseOrder?.data?.filter(item => item?.is_gift)

  let totalRecord = data?.sme_catalog_inventory_items_aggregate?.aggregate?.count || 0;
  let totalPage = Math.ceil(totalRecord / search.limit);

  const resetData = useCallback(() => {
    setSearch({
      searchText: null,
      searchType: '',
      page: 1,
      limit: 20,
    });
    setVariantSelect([]);
    onHide();
  }, []);

  const addProductFromFilter = useCallback(
    async (values) => {
      let variantSubmit = variantSelect.map((item) => {
        const product = Object.keys(values).find((p) => p === item.variant_id);
        if (product) {
          return { ...item, quantity: values[product] };
        } else {
          return item;
        }
      });
      try {
        let res = await updateOrder({
          variables: {
            list_item_gift: variantSubmit.map((item) => ({
              sku: item?.variant?.sku,
              quantity_purchased: item?.quantity,
            })),
            package_id: smeWarehouseOrder?.package_id,
            sme_warehouse_id: smeWarehouseOrder?.sme_warehouse_id,
          },
        });
        let updateOrderStatus = res?.data?.coAddItemGiftOrder;
        if (updateOrderStatus?.success) {
          resetData();
        } else {
          addToast(updateOrderStatus?.message || formatMessage({ defaultMessage: 'Thêm gift thất bại' }), { appearance: 'error' })
        }
      } catch (error) {
        alert('Có lỗi xảy ra! Vui lòng thử lại.');
      }
    },
    [variantSelect]
  );
  const isSelectedAll = useMemo(() => {
    if (!data || data?.sme_catalog_inventory_items?.length == 0) return false;

    return data?.sme_catalog_inventory_items?.every(
      (variant) =>
        variantSelect?.some(
          (item) => item?.variant_id == variant?.variant_id
        ) ||
        variantSelect?.some((item) => item?.variant_id == variant?.variant_id)
    );
  }, [variantSelect, variantSelect, data]);

  const handleSelectAll = useCallback(
    (e) => {
      if (isSelectedAll) {
        setVariantSelect((prev) =>
          prev.filter(
            (item) =>
              !data?.sme_catalog_inventory_items?.some(
                (variant) => variant?.variant_id == item?.variant_id
              )
          )
        );
      } else {
        const currentTotal = variantSelect.length + smeWarehouseOrder?.data.length;
        const data_filtered = data?.sme_catalog_inventory_items?.filter(
          _variant => !variantSelect?.some(__ => __?.variant_id == _variant?.variant_id) && !giftList?.some(__ => __?.sme_variant_id == _variant?.variant_id)
        )?.slice(0, LIMIT_ADD_VARIANT - currentTotal);

        setVariantSelect(prevState => ([...prevState, ...data_filtered]));
      }
    },
    [data?.sme_catalog_inventory_items, variantSelect, isSelectedAll]
  );
  const dataTable =
    step == 1 ? data?.sme_catalog_inventory_items : variantSelect;

  return (
    <Formik initialValues={{}} validationSchema={validateSchema}>
      {({ handleSubmit, values, validateForm }) => (
        <>
          <ModalCombo dataCombo={dataCombo} onHide={() => setDataCombo(null)} />
          <Modal
            size="xl"
            show={show}
            aria-labelledby="example-modal-sizes-title-sm"
            dialogClassName="modal-show-connect-product"
            centered
            backdrop={true}
          >
            <Modal.Header closeButton={true}>
              <Modal.Title>
                {formatMessage({ defaultMessage: 'Thêm quà tặng' })}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body className="overlay overlay-block cursor-default pb-0">
              <div className="row mb-4">
                <div className="col-6 input-icon">
                  <input
                    type="text"
                    className="form-control"
                    placeholder={formatMessage({ defaultMessage: 'Tên/SKU' })}
                    style={{ height: 40 }}
                    onBlur={(e) => {
                      setSearch({
                        ...search,
                        searchText: e.target.value,
                        page: 1,
                      });
                    }}
                    onKeyDown={(e) => {
                      if (e.keyCode == 13) {
                        setSearch({
                          ...search,
                          searchText: e.target.value,
                          page: 1,
                        });
                      }
                    }}
                  />
                  <span>
                    <i
                      className="flaticon2-search-1 icon-md ml-6"
                      style={{ position: 'absolute', top: 20 }}
                    ></i>
                  </span>
                </div>
              </div>
              <div className="mb-4 d-flex align-items-center">
                <span>
                  {formatMessage(
                    { defaultMessage: 'Đã chọn: {count} / {max}' },
                    { count: giftList.length + variantSelect?.length, max: LIMIT_ADD_VARIANT }
                  )}
                </span>
                <OverlayTrigger
                  overlay={
                    <Tooltip>
                      {formatMessage({
                        defaultMessage: 'Số lượng hàng hoá đã chọn',
                      })}
                    </Tooltip>
                  }
                >
                  <span
                    className="ml-2"
                    style={{ position: 'relative', top: '-1px' }}
                  >
                    <svg
                      xmlns="http://www.w3.org/1800/svg"
                      width="14"
                      height="14"
                      fill="currentColor"
                      class="bi bi-info-circle"
                      viewBox="0 0 16 16"
                    >
                      <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                      <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
                    </svg>
                  </span>
                </OverlayTrigger>
              </div>
              <div>
                <div style={{ position: 'relative' }}>
                  {loading && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        zIndex: 99,
                      }}
                    >
                      <span className="spinner spinner-primary" />
                    </div>
                  )}
                  <Table
                    style={loading ? { opacity: 0.4 } : {}}
                    className="upbase-table"
                    columns={[
                      {
                        title: (
                          <div className="d-flex align-items-center">
                            {step == 1 && (
                              <Checkbox
                                size="checkbox-md"
                                inputProps={{
                                  'aria-label': 'checkbox',
                                }}
                                disabled={
                                  loading ||
                                  (variantSelect.length + smeWarehouseOrder?.data?.length) == LIMIT_ADD_VARIANT
                                }
                                isSelected={isSelectedAll}
                                onChange={handleSelectAll}
                              />
                            )}
                            <span className="ml-1">
                              {formatMessage({
                                defaultMessage: 'Tên hàng hóa',
                              })}
                            </span>
                          </div>
                        ),
                        dataIndex: 'name',
                        key: 'name',
                        align: 'left',
                        width: '30%',
                        render: (_item, record) => {
                          const [isSelected, isDisabled] = [
                            variantSelect?.map(_variant => _variant?.variant_id).includes(record?.variant_id) || giftList?.map(_variant => _variant?.sme_variant_id).includes(record?.variant_id),
                            giftList?.map(_variant => _variant?.sme_variant_id).includes(record?.variant_id)
                          ];

                          return (
                            <div className="d-flex align-items-center">
                              {step == 1 && (
                                <Checkbox
                                  size="checkbox-md"
                                  inputProps={{
                                    'aria-label': 'checkbox',
                                  }}
                                  isSelected={isSelected}
                                  disabled={isDisabled || loading}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      if ((variantSelect.length + smeWarehouseOrder?.data?.length) >= LIMIT_ADD_VARIANT
                                      )
                                        return;
                                      setVariantSelect((prevState) => [
                                        ...prevState,
                                        { ...record, is_gift: 1 },
                                      ]);
                                    } else {
                                      setVariantSelect((prevState) =>
                                        prevState.filter(
                                          (_state) =>
                                            _state.variant_id !==
                                            record?.variant_id
                                        )
                                      );
                                    }
                                  }}
                                />
                              )}
                              <div className="ml-1 d-flex flex-column">
                                <InfoProduct
                                  name={
                                    record?.variant?.sme_catalog_product?.name
                                  }
                                  isSingle
                                  productOrder={true}
                                  url={() => {
                                    let url = '';
                                    if (record?.variant?.is_combo) {
                                      url = `/products/edit-combo/${record?.variant?.sme_catalog_product?.id}`;
                                    } else if (
                                      record?.variant?.attributes?.length > 0
                                    ) {
                                      url = `/products/stocks/detail/${record?.variant?.id}`;
                                    } else {
                                      url = `/products/edit/${record?.variant?.sme_catalog_product?.id}`;
                                    }

                                    window.open(url, '_blank');
                                  }}
                                />
                                {!!record?.variant?.attributes?.length > 0 && (
                                  <p className="font-weight-normal mb-2 text-secondary-custom">
                                    {record?.variant?.name?.replaceAll(
                                      ' + ',
                                      ' - '
                                    )}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        },
                      },
                      {
                        title: 'SKU',
                        dataIndex: 'sku',
                        key: 'sku',
                        align: 'left',
                        width: '30%',
                        render: (_item, record) => {
                          return (
                            <div className="d-flex align-items-center">
                              <InfoProduct
                                sku={record?.variant?.sku}
                                isSingle
                              />
                              {record?.variant?.combo_items?.length > 0 && (
                                <span
                                  className="text-primary cursor-pointer ml-2"
                                  style={{ minWidth: 'fit-content' }}
                                  onClick={() =>
                                    setDataCombo(record?.variant?.combo_items)
                                  }
                                >
                                  Combo
                                </span>
                              )}
                            </div>
                          );
                        },
                      },
                      {
                        title: formatMessage({
                          defaultMessage: 'Tồn sẵn sàng bán',
                        }),
                        dataIndex: 'id',
                        key: 'id',
                        align: 'center',
                        width: '15%',
                        render: (_item, record) => {
                          const stockAvaiable = record?.variant?.inventories?.find(
                            (iv) =>
                              iv?.sme_store_id ==
                              smeWarehouseOrder?.sme_warehouse_id
                          )?.stock_available;

                          return <span>{stockAvaiable}</span>;
                        },
                      },
                      step == 2 && {
                        title: formatMessage({ defaultMessage: 'Số lượng' }),
                        dataIndex: 'variantUnit',
                        key: 'variantUnit',
                        align: 'center',
                        width: '20%',
                        render: (_item, record) => {
                          return (
                            <Field
                              component={InputVerticalWithIncrease}
                              name={`${record?.variant?.id}`}
                              label={''}
                              required={false}
                              customFeedbackLabel={' '}
                              cols={['', 'col-12']}
                              countChar
                              maxChar={'255'}
                              rows={4}
                            />
                          );
                        },
                      },
                    ]}
                    data={dataTable}
                    emptyText={
                      <div className="d-flex flex-column align-items-center justify-content-center my-10">
                        <img
                          src={toAbsoluteUrl('/media/empty.png')}
                          alt="image"
                          width={80}
                        />
                        <span className="mt-4">
                          {formatMessage({
                            defaultMessage: 'Chưa có sản phẩm nào',
                          })}
                        </span>
                      </div>
                    }
                    tableLayout="auto"
                    scroll={{ y: 350 }}
                    sticky={{ offsetHeader: 0 }}
                  />
                </div>
                {dataTable?.length > 0 && step == 1 && (
                  <div
                    style={{ marginLeft: '-0.75rem', marginRight: '-0.75rem' }}
                  >
                    <Pagination
                      page={search.page}
                      totalPage={totalPage}
                      loading={loading}
                      isAddOrder={true}
                      quickAdd={true}
                      limit={search.limit}
                      totalRecord={totalRecord}
                      count={dataTable.length}
                      onPanigate={(page) =>
                        setSearch({ ...search, page: page })
                      }
                      emptyTitle={formatMessage({
                        defaultMessage: 'Chưa có sản phẩm nào',
                      })}
                    />
                  </div>
                )}
              </div>
            </Modal.Body>
            <Modal.Footer
              className="form"
              style={{
                borderTop: '1px solid #dbdbdb',
                justifyContent: 'end',
                paddingTop: 10,
                paddingBottom: 10,
              }}
            >
              {step == 1 ? (
                <div className="form-group">
                  <button
                    type="button"
                    onClick={resetData}
                    className="btn btn-secondary mr-4"
                    style={{ width: 120 }}
                  >
                    {formatMessage({ defaultMessage: 'Hủy' })}
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setStep(2)}
                    style={{ width: 120 }}
                  >
                    {formatMessage({ defaultMessage: 'Tiếp tục' })}
                  </button>
                </div>
              ) : (
                <div className="form-group">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="btn btn-secondary mr-4"
                    style={{ width: 120 }}
                  >
                    {formatMessage({ defaultMessage: 'Quay lại' })}
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={async () => {
                      let error = await validateForm(values);
                      handleSubmit();
                      if (!Object.keys(error).length) {
                        addProductFromFilter(values);
                      }
                    }}
                    style={{ width: 120 }}
                    disabled={loadingOrderUpdate}
                  >
                    {formatMessage({ defaultMessage: 'Đồng ý' })}
                  </button>
                </div>
              )}
            </Modal.Footer>
          </Modal>
        </>
      )}
    </Formik>
  );
};

export default memo(ModalAddVariants);
