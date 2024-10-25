import React, { useEffect, useMemo, useState } from "react";
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
import { HistoryRounded } from "@material-ui/icons";
import ModalInventoryExport from "../dialog/ModalInventoryExport";

export function ProductsFilter() {
  const location = useLocation()
  const history = useHistory()
  const { addToast } = useToasts();
  const { formatMessage } = useIntl()
  const params = queryString.parse(location.search.slice(1, 100000))
  const [valueInput, setValueInput] = useState(params?.name || '')
  const [openModalInventory, setOpenModalInventory] = useState(false)
  // Products UI Context
  const { ids, setIds, optionsProductTag } = useProductsUIContext();
  
  const OPTIONS_TYPE_SEARCH = [
    { value: 'variant_name', label: formatMessage({ defaultMessage: 'Tên hàng hóa' }), placeholder: formatMessage({defaultMessage: 'Tên hàng hóa'}) },
    { value: 'sku', label: formatMessage({ defaultMessage: 'SKU' }), placeholder: formatMessage({defaultMessage: 'Mã SKU'}) },
    { value: 'lot_serial', label: formatMessage({ defaultMessage: 'Mã lô' }), placeholder: formatMessage({defaultMessage: 'Mã lô'}) },
  ];

  useEffect(() => {
    // return () => { setIds([]) }
  }, [location.search])
  const { loading, data } = useQuery(query_sme_catalog_stores)

  const {data: statusData} = useQuery(query_sme_product_status)
  const activeStatus = statusData?.sme_product_status?.filter((status) => status?.status)

  const placeholder = useMemo(() => {
    if(!!params?.typeSearch) {
      const searchOption = OPTIONS_TYPE_SEARCH?.find(option => option?.value == params?.typeSearch)
      return searchOption?.placeholder
    }
    return OPTIONS_TYPE_SEARCH[0]?.placeholder
  }, [params?.typeSearch]) 

  const currentSmeWarehouse = useMemo(() => {
    let parseSmeWarehouse = params?.warehouseid?.split(',')
    let optionWh = data?.sme_warehouses?.map(wh => {
        return { label: wh?.name, value: wh?.id }
    })
    let currentSmeWarehouse = optionWh?.filter(_option => parseSmeWarehouse?.some(param => param == _option?.value));
    return currentSmeWarehouse
}, [data?.sme_warehouses, params?.warehouseid])
  return (
    <>
      {openModalInventory && <ModalInventoryExport openModal={setOpenModalInventory} />}
      <div className='d-flex w-100 mb-1 pt-2' style={{ background: '#fff', zIndex: 3 }} >
        <div style={{ flex: 1 }} >
          <Formik
            initialValues={{
              status: "", // values => All=""/Selling=0/Sold=1
              condition: "", // values => All=""/New=0/Used=1
              searchText: "",
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
                <div className="form-group row d-flex align-items-center" style={{ marginBottom: 8 }} >
                  <div className="col-2 ml-0 h-100 pr-0">
                    <Select
                          options={OPTIONS_TYPE_SEARCH}
                          value={_.find(OPTIONS_TYPE_SEARCH, _item => _item?.value == params?.typeSearch) || OPTIONS_TYPE_SEARCH[0]}
                          onChange={values => {
                            history.push(`/products/expiration-manage?${queryString.stringify({
                              ...params,
                              page: 1,
                              typeSearch: values.value
                            })}`)
                          }}
                          className='w-100 custom-select-order'
                          styles={{
                            container: (styles) => ({
                              ...styles, 
                              zIndex: 100
                            })
                          }}
                        />
                  </div>
                  <div className="col-3 input-icon input-icon-right pl-0" >
                    <input type="text" className="form-control" placeholder={placeholder}
                      style={{ height: 37, borderRadius: 0 }}
                      onBlur={(e) => {
                        history.push(`/products/expiration-manage?${queryString.stringify({
                          ...params,
                          page: 1,
                          name: valueInput
                        })}`)
                      }}
                      value={valueInput}
                      onChange={(e) => setValueInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.keyCode == 13) {
                          e.preventDefault()
                          history.push(`/products/expiration-manage?${queryString.stringify({
                            ...params,
                            page: 1,
                            name: valueInput
                          })}`)
                          // e.target.blur();
                        }
                      }}
                    />
                    <span><i className="flaticon2-search-1 icon-md mr-6"></i></span>
                  </div>

                  <div className="col-3" style={{ display: 'flex', alignItems: 'center' }} >
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
                        value={currentSmeWarehouse}
                        isMulti
                        onChange={values => {
                          let paramsSmeWarehouse = values?.length > 0
                                    ? _.map(values, 'value')?.join(',')
                                    : undefined;
                          if (!values) {
                            history.push(`/products/expiration-manage?${queryString.stringify(
                              _.omit({
                                ...params,
                              }, ['warehouseid'])
                            )}`)
                            return
                          }
                          history.push(`/products/expiration-manage?${queryString.stringify({
                            ...params,
                            page: 1,
                            warehouseid: paramsSmeWarehouse
                          })}`.replaceAll('%2C', '\,'))
                        }}
                      />
                    </div>
                  </div>
                  <div className='d-flex flex-column col-4' style={{ background: '#fff', paddingTop: 10 }}>
                    <div className="d-flex mb-3 align-items-center justify-content-end">
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              setOpenModalInventory(true)
                            }}
                            className="btn btn-primary btn-elevate"
                          >
                            {formatMessage({ defaultMessage: 'Xuất file' })}
                          </button>
                          <button
                            className="btn btn-secondary btn-elevate ml-1"
                            onClick={(e) => {
                              e.preventDefault();
                              history.push("/products/expired-inventory-export-history");
                            }}
                          >
                            <HistoryRounded />
                          </button>
                      </div>
                    </div>
                </div>
              </form>
            )}
          </Formik>
        </div>
      </div>
    </>
  );
}
