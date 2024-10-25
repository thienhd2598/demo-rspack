import { Formik } from "formik";
import queryString from 'querystring';
import React, { useEffect, useMemo } from "react";
import { useIntl } from "react-intl";
import { useHistory, useLocation } from "react-router-dom";
import { useToasts } from "react-toast-notifications";

export function ProductsFilter({ onDelete, onHide, onShow, onCreateOnStore, onCreateMutilTag, onToggleDrawer, onUpdateProduct, nameSearch, setNameSearch }) {
  const location = useLocation()
  const history = useHistory()
  const { addToast } = useToasts();
  const { formatMessage } = useIntl()
  const params = queryString.parse(location.search.slice(1, 100000))

  const checkedFilterBoxProducts = useMemo(
    () => {
      const KEYS_IN_BOX_SEARCH = ['tags', 'has_product_connected', 'has_origin_image'];

      let checked = KEYS_IN_BOX_SEARCH?.some(
        _key => _key in params
      );

      return checked;
    }, [location.search]
  );

  return (
    <>

      <div className='d-flex w-100 mb-1 pt-2'>
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
                <div className="form-group row d-flex align-items-end" >
                  <div className="col-4 input-icon pr-1" >
                    <input type="text" className="form-control" placeholder={formatMessage({ defaultMessage: "Tên sản phẩm/SKU" })}
                      style={{ height: 40 }}
                      onBlur={(e) => {
                        history.push(`${location.pathname}?${queryString.stringify({
                          ...(params || {}),
                          page: 1
                        })}`)
                        !!setNameSearch && setNameSearch(e.target.value)
                      }}
                      defaultValue={nameSearch || ''}
                      onKeyDown={e => {
                        if (e.keyCode == 13) {
                          history.push(`${location.pathname}?${queryString.stringify({
                            ...(params || {}),
                            page: 1
                          })}`)
                          // e.target.blur();
                          !!setNameSearch && setNameSearch(e.target.value)
                        }
                      }}
                    />
                    <span><i className="flaticon2-search-1 icon-md ml-6"></i></span>
                  </div>

                  {/* Mock new filter */}
                  <div className="col-3 pl-1">
                    <div
                      className="d-flex align-items-center justify-content-between px-4 py-2"
                      style={{
                        color: checkedFilterBoxProducts ? '#ff6d49' : '',
                        border: `1px solid ${checkedFilterBoxProducts ? '#ff6d49' : '#ebecf3'}`,
                        borderRadius: 6, height: 40, cursor: 'pointer'
                      }}
                      onClick={onToggleDrawer}
                    >
                      <span>{formatMessage({ defaultMessage: 'Lọc sản phẩm' })}</span>
                      <span><i style={{ color: checkedFilterBoxProducts ? '#ff6d49' : '' }} className="fas fa-filter icon-md ml-6"></i></span>
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
