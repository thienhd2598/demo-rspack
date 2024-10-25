import React, { useMemo } from "react";
import { useCallback } from "react";
import { useState } from "react";
import DrawerModal from "../../../../../../components/DrawerModal";
import { useDidUpdate } from "../../../../../../hooks/useDidUpdate";
import Select from "react-select";
import OrderReturnFilterDrawer from "../../OrderReturnFilterDrawer";
import { memo } from "react";
import { useIntl } from 'react-intl';
import queryString from 'querystring';
import { useHistory, useLocation } from "react-router-dom";
const FilterInput = memo(({
  dataWarehouse
}) => {
  const { formatMessage } = useIntl()
  const location = useLocation();
  const history = useHistory();
  const params = queryString.parse(location.search.slice(1, 100000));
  const [searchValue, setSearchValue] = useState(params?.q || '');

  useMemo(() => {
    setSearchValue(params?.q || '');
  }, [params?.q]);

  const optionsSearch = [
    {
      value: "ref_return_id",
      label: formatMessage({ defaultMessage: "Mã trả hàng" }),
    },
    {
      value: "ref_order_id",
      label: formatMessage({ defaultMessage: "Mã đơn hàng" }),
    },
    {
      value: "tracking_number",
      label: formatMessage({ defaultMessage: "Mã vận đơn trả hàng" }),
    },
    {
      value: "sku",
      label: formatMessage({ defaultMessage: "SKU hàng hoá sàn" }),
    },
    {
      value: "product_name",
      label: formatMessage({ defaultMessage: "Tên sản phẩm" }),
    },
    {
      value: "shipping_tracking_number",
      label: formatMessage({ defaultMessage: "Mã vận đơn - ĐVVC" }),
    },
  ];


  const [isOpenDrawer, setOpenDrawer] = useState(false);
  const [refType, setRefType] = useState("ref_return_id");
  const onToggleDrawer = useCallback(() => setOpenDrawer((prev) => !prev), [
    setOpenDrawer,
  ]);

  useDidUpdate(() => {
    if (searchValue) {
      history.push(`${location.pathname}?${queryString.stringify({ ...params, search_type: refType })}`);
    }
  }, [refType]);


  return (
    <>
      <DrawerModal
        open={isOpenDrawer}
        onClose={onToggleDrawer}
        direction="right"
        size={500}
        enableOverlay={true}
      >
        <OrderReturnFilterDrawer dataWarehouse={dataWarehouse} onToggleDrawer={onToggleDrawer} isOpenDrawer={isOpenDrawer}/>
      </DrawerModal>

      <div className="form-group row my-4">
        <div className="col-2 pr-0" style={{ zIndex: 90 }}>
          <Select
            options={optionsSearch}
            className="w-100 custom-select-order"
            style={{ borderRadius: 0 }}
            value={optionsSearch.find((_op) => _op.value == refType)}
            onChange={(value) => {
              setRefType(value.value);
              if (!!value) {
                setRefType(value.value);
              }
            }}
            formatOptionLabel={(option, labelMeta) => {
              return <div>{option.label}</div>;
            }}
          />
        </div>
        <div
          className="col-4 input-icon pl-0"
          style={{ height: "fit-content" }}
        >
          <input
            type="text"
            aria-label="Tìm kiếm"
            className="form-control"
            placeholder="Tìm đơn hàng"
            style={{ height: 37, borderRadius: 0, paddingLeft: "50px" }}
            value={searchValue}
            onBlur={(e) => {
              history.push(`${location.pathname}?${queryString.stringify({ ...params, q: searchValue, search_type: refType })}`);
            }}
            onKeyDown={(e) => {
              if (e.keyCode == 13) {
                history.push(`${location.pathname}?${queryString.stringify({ ...params, q: searchValue, search_type: refType })}`);
              }
            }}
            onChange={(e) => setSearchValue(e.target.value)}
          />
          <span>
            <i className="flaticon2-search-1 icon-md ml-6"></i>
          </span>
        </div>
        <div className="col-3"></div>
        <div className="col-3">
          <div className="d-flex align-items-center justify-content-between px-4 py-2"
            style={{ color: "#5e6278", border: "1px solid #d9d9d9", borderRadius: 6, height: 37,cursor: "pointer"}}
            onClick={onToggleDrawer}
          >
            <span>{formatMessage({ defaultMessage: "Lọc đơn hàng nâng cao" })}</span>
            <span>
              <i style={{ color: "#5e6278" }} className="fas fa-filter icon-md ml-6"></i>
            </span>
          </div>
        </div>
      </div>
    </>
  );
});

export default FilterInput;