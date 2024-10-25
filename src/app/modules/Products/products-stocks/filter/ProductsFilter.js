import React, { useEffect, useState } from "react";
import { Formik } from "formik";
import _ from "lodash";
import { useProductsUIContext } from "../../ProductsUIContext";
import { useHistory, useLocation } from "react-router-dom";
import queryString from 'querystring'
import { useQuery } from "@apollo/client";
import Select from "react-select";
import query_sme_catalog_stores from "../../../../../graphql/query_sme_catalog_stores";
import query_sme_product_status from "../../../../../graphql/query_sme_product_status";
import { Dropdown } from "react-bootstrap";
import { useToasts } from "react-toast-notifications";
import { useIntl } from "react-intl";

export function ProductsFilter() {
  const location = useLocation()
  const history = useHistory()
  const { addToast } = useToasts();
  const { formatMessage } = useIntl()
  const params = queryString.parse(location.search.slice(1, 100000))
  const [valueInput, setValueInput] = useState(params?.name || '')
  // Products UI Context
  const { ids, setIds, optionsProductTag } = useProductsUIContext();

  const OPTIONS_TYPE_PRODUCT = [
    { value: 'manual', label: formatMessage({ defaultMessage: 'Thường' }) },
    { value: 'combo', label: formatMessage({ defaultMessage: 'Combo' }) },
    { value: 'is_multi_unit', label: formatMessage({ defaultMessage: 'Nhiều ĐVT' }) },
  ];

  useEffect(() => {
    // return () => { setIds([]) }
  }, [location.search])
  const { loading, data } = useQuery(query_sme_catalog_stores)

  const {data: statusData} = useQuery(query_sme_product_status)
  const activeStatus = statusData?.sme_product_status?.filter((status) => status?.status)
  return (
    <>

      <div className='d-flex w-100 mb-1 pt-2' style={{ background: '#fff', zIndex: 3 }} >
        <div style={{ flex: 1 }} >
          <Formik
            initialValues={{
              status: "", // values => All=""/Selling=0/Sold=1
              condition: "", // values => All=""/New=0/Used=1
              searchText: "",
            }}
            onSubmit={(values) => {
            }}
          >
            {({
              values,
              handleSubmit,
              handleBlur,
              handleChange,
              setFieldValue,
            }) => (
              <form onSubmit={handleSubmit} className="form form-label-right" style={{ marginBottom: 0 }}>
                <div className="form-group row d-flex align-items-end" style={{ marginBottom: 8 }} >
                  <div className="col-4 input-icon" >
                    <input type="text" className="form-control" placeholder={formatMessage({ defaultMessage: "Tên sản phẩm/SKU" })}
                      style={{ height: 40 }}
                      onBlur={(e) => {
                        history.push(`/products/stocks?${queryString.stringify({
                          ...params,
                          page: 1,
                          name: valueInput
                        })}`)
                      }}
                      value={valueInput}
                      onChange={(e) => setValueInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.keyCode == 13) {
                          history.push(`/products/stocks?${queryString.stringify({
                            ...params,
                            page: 1,
                            name: valueInput
                          })}`)
                          // e.target.blur();
                        }
                      }}
                    />
                    <span><i className="flaticon2-search-1 icon-md ml-6"></i></span>
                  </div>

                  <div className="col-4" style={{ display: 'flex', alignItems: 'center' }} >
                    {formatMessage({ defaultMessage: "Kho" })}
                    <div style={{ flex: 1, marginLeft: 12, zIndex: 100 }} >
                      <Select
                        placeholder={formatMessage({ defaultMessage: "Tất cả" })}
                        isClearable
                        options={data?.sme_warehouses?.map(__ => {
                          return {
                            label: __.name,
                            value: __.id
                          }
                        })}
                        value={
                          _.find(
                            _.map(data?.sme_warehouses, (_item) => ({
                              value: _item?.id,
                              label: _item?.name,
                            })),
                            (_item) => _item?.value == params?.warehouseid
                          ) || null
                        }
                        onChange={values => {
                          if (!values) {
                            history.push(`/products/stocks?${queryString.stringify(
                              _.omit({
                                ...params,
                              }, ['warehouseid'])
                            )}`)
                            return
                          }
                          history.push(`/products/stocks?${queryString.stringify({
                            ...params,
                            page: 1,
                            warehouseid: values.value
                          })}`)
                        }}
                      />
                    </div>
                  </div>

                  {params?.status != 'defective' && <div className="col-4" style={{ display: 'flex', alignItems: 'center', zIndex: 96 }} >
                    {formatMessage({ defaultMessage: "Loại sản phẩm" })}
                    <div style={{ flex: 1, marginLeft: 12 }} >
                      <Select
                        placeholder={formatMessage({ defaultMessage: "Tất cả" })}
                        isClearable
                        options={OPTIONS_TYPE_PRODUCT}
                        value={_.find(OPTIONS_TYPE_PRODUCT, _item => _item?.value == params?.typeProduct) || null}
                        onChange={values => {
                          if (!values) {
                            history.push(`/products/stocks?${queryString.stringify(
                              _.omit({
                                ...params,
                              }, ['typeProduct'])
                            )}`)
                            return
                          }
                          history.push(`/products/stocks?${queryString.stringify({
                            ...params,
                            page: 1,
                            typeProduct: values.value
                          })}`)
                        }}
                      />
                    </div>
                  </div>}

                  {params?.status == 'defective' && <div className="col-4" style={{ display: 'flex', alignItems: 'center', zIndex: 96 }} >
                    {formatMessage({ defaultMessage: "Trạng thái sản phẩm" })}
                    <div style={{ flex: 1, marginLeft: 12 }} >
                      <Select
                        placeholder={formatMessage({ defaultMessage: "Tất cả" })}
                        isClearable
                        options={activeStatus?.map(__ => {
                          return {
                            label: __.name,
                            value: __.id
                          }
                        })}
                        value={_.find(
                          _.map(activeStatus, (_item) => ({
                            value: _item?.id,
                            label: _item?.name,
                          })),
                          (_item) => _item?.value == params?.products_status
                        ) || null}
                        onChange={values => {
                          if (!values) {
                            history.push(`/products/stocks?${queryString.stringify(
                              _.omit({
                                ...params,
                              }, ['products_status'])
                            )}`)
                            return
                          }
                          history.push(`/products/stocks?${queryString.stringify({
                            ...params,
                            page: 1,
                            products_status: values.value
                          })}`)
                        }}
                      />
                    </div>
                  </div>}
                </div>
              </form>
            )}
          </Formik>
        </div>
      </div>
    </>
  );
}
