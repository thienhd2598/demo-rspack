/* eslint-disable jsx-a11y/role-supports-aria-props */
/* eslint-disable no-script-url,jsx-a11y/anchor-is-valid */
import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router";
import { NavLink } from "react-router-dom";
import SVG from "react-inlinesvg";
import { toAbsoluteUrl, checkIsActive } from "../../../../_helpers";
import dayjs from "dayjs";
import { useSelector } from "react-redux";
import { useIntl } from "react-intl";
import getCustomToken from "../../../../../utils/getCustomToken";
import AuthorizationWrapper from "../../../../../components/AuthorizationWrapper";
const ROLES_CONSTANTS = {
  PRODUCT: "product_manager",
  WAREHOUSE: "warehouse_manager",
  REPORT: "report_manager",
  ORDER: "order_manager",
  FINANCE: "finance_manager",
  SALE_RECON: "sale_recon",
  CUSTOMER: "customer_support",
  ORDER_NVBH: "order_nvbh",
  ONLY_VIEW: "only_view",
};

export function AsideMenuList({ layoutProps }) {
  const user = useSelector((state) => state.auth.user);
  const location = useLocation();
  const getMenuItemActive = (url, hasSubmenu = false) => {
    return checkIsActive(location, url)
      ? ` ${!hasSubmenu &&
      "menu-item-active"} menu-item-open menu-item-not-hightlighted`
      : "";
  };
  const { formatMessage } = useIntl()

  const getMenuActive = (lstUrl) => {
    return lstUrl.some(url => getMenuItemActive(url)) ? 'menu-item-open active-menu' : '';
  };

  const rolesUser = useMemo(
    () => {
      const mainUser = !user?.is_subuser;

      return {
        product: mainUser || user?.permissions?.includes(ROLES_CONSTANTS['PRODUCT']),
        wraehouse: mainUser || user?.permissions?.includes(ROLES_CONSTANTS['WAREHOUSE']),
        report: mainUser || user?.permissions?.includes(ROLES_CONSTANTS['REPORT']),
        order: mainUser || user?.permissions?.includes(ROLES_CONSTANTS['ORDER']),
        finance: mainUser || user?.permissions?.includes(ROLES_CONSTANTS['FINANCE']),
        saleRecon: mainUser || user?.permissions?.includes(ROLES_CONSTANTS['SALE_RECON']),
        customer: mainUser || user?.permissions?.includes(ROLES_CONSTANTS['CUSTOMER']),
        order_nvbh: mainUser || user?.permissions?.includes(ROLES_CONSTANTS['ORDER_NVBH']),
      }
    }, [user]
  );
  console.log('rolesUser,', rolesUser)
  return (
    <>
      <ul className={`menu-nav ${layoutProps.ulClasses}`}>
        {/* Product Manager */}
        <AuthorizationWrapper
          keys={['product_store_create', 'product_store_list_draft_view', 'product_store_view', 'product_store_connect_view', 'product_store_sync_view', 'product_store_stock_view']}
          className={`menu-item show-submenu ${getMenuActive(['/product-stores/list-stock-tracking', '/product-stores/edit/', '/product-stores/new', '/product-stores/list', '/product-stores/draf', '/product-stores/syncs', '/product-stores/connect'])}`}
          isMenu
        >
          <NavLink style={{ padding: '15px' }} className="menu-link menu-toggle" to="#">
            <span style={{ marginRight: '10px', padding: 0 }} className="svg-icon menu-icon">
              <SVG style={{ width: '14px', height: '14px' }} src={toAbsoluteUrl("/media/menu/ic_sp_san.svg")} />
            </span>
            <span style={{ fontSize: '14px', color: "#888484", fontWeight: 700 }} className="menu-text">{formatMessage({ defaultMessage: 'Quản lý sản phẩm sàn' })}</span>
            <i style={{ flex: 'initial', fontSize: 12 }} className="fas fa-chevron-down menu-icon menu-icon-arrow"></i>
          </NavLink>

          <div className="menu-submenu">
            <i className="menu-arrow" />
            <ul className="menu-subnav">
              <AuthorizationWrapper
                keys={['product_store_create']}
                className={`menu-item ${getMenuItemActive(
                  "/product-stores/new"
                )}`}
                isMenu
              >
                <NavLink className="menu-link" to={{
                  pathname: "/product-stores/new",
                  state: Date.now()
                }}>
                  <span style={{ fontSize: '13px' }} className="menu-text">{formatMessage({ defaultMessage: 'Thêm sản phẩm sàn' })}</span>
                </NavLink>
              </AuthorizationWrapper>
              <AuthorizationWrapper
                keys={['product_store_list_draft_view']}
                className={`menu-item ${getMenuItemActive(
                  "/product-stores/draf"
                )}`}
                isMenu
              >
                <NavLink className="menu-link" to={{
                  pathname: "/product-stores/draf",
                  state: Date.now()
                }} >
                  <span style={{ fontSize: '13px' }} className="menu-text">{formatMessage({ defaultMessage: 'Lưu nháp trên UpBase' })}</span>
                </NavLink>
              </AuthorizationWrapper>
              <AuthorizationWrapper
                keys={['product_store_view']}
                className={`menu-item ${getMenuItemActive(
                  "/product-stores/list"
                )}`}
                isMenu
              >
                <NavLink className="menu-link" to={{
                  pathname: "/product-stores/list",
                  state: Date.now()
                }} >
                  <span style={{ fontSize: '13px' }} className="menu-text">{formatMessage({ defaultMessage: 'Danh sách sản phẩm sàn' })}</span>
                </NavLink>
              </AuthorizationWrapper>
              <AuthorizationWrapper
                keys={['product_store_connect_view']}
                className={`menu-item ${getMenuItemActive(
                  "/product-stores/connect",
                )}`}
                isMenu
              >
                <NavLink className="menu-link" to='/product-stores/connect'>
                  <span style={{ fontSize: '13px' }} className="menu-text">{formatMessage({ defaultMessage: 'Liên kết' })}</span>
                </NavLink>
              </AuthorizationWrapper>
              <AuthorizationWrapper
                keys={['product_store_sync_view']}
                className={`menu-item ${getMenuItemActive(
                  "/product-stores/syncs"
                )}`}
                isMenu
              >
                <NavLink className="menu-link" to='/product-stores/syncs'>
                  <span style={{ fontSize: '13px' }} className="menu-text">{formatMessage({ defaultMessage: 'Quản lý đồng bộ' })}</span>
                </NavLink>
              </AuthorizationWrapper>
              <AuthorizationWrapper
                keys={['product_store_stock_view']}
                className={`menu-item ${getMenuItemActive(
                  "/product-stores/list-stock-tracking",
                )}`}
                isMenu
              >
                <NavLink className="menu-link" to='/product-stores/list-stock-tracking/'>
                  <span style={{ fontSize: '13px' }} className="menu-text">{formatMessage({ defaultMessage: 'Lịch sử đẩy tồn' })}</span>
                </NavLink>
              </AuthorizationWrapper>
            </ul>
          </div>
        </AuthorizationWrapper>

        {/* Warehouse Manager */}
        <AuthorizationWrapper
          keys={['product_list_view', 'warehouse_category_view', 'product_stock_view', 'product_inventory_view', 'product_reserve_view', 'warehouse_bill_view', 'warehouse_view', 'warehouse_bill_history_view', 'warehouse_expire']}
          className={`menu-item show-submenu ${getMenuActive([
            '/products/list', '/products/new',
            '/products/warehouselist',
            '/products/reserve', '/products/reserve-create', '/products/reserve/:id',
            "/products/inventory-export-history",
            "/products/history-export-tab-goods",
            "/products/update-tag-origin-image", "/products/edit/:id",
            "/products/stocks", "/products/stocks/detail/:id",
            "/products/inventory/list", 
            "/products/inventory/list/:id", 
            "/products/warehouse-bill/list", 
            "/products/warehouse-bill/history", 
            "/products/warehouse-bill/product-categories",
            "/products/expiration-manage"
          ])}`}
          isMenu
        >
          <NavLink style={{ padding: '15px' }} className="menu-link menu-toggle" to="#">
            <span className="svg-icon menu-icon">
              <SVG style={{ marginRight: '10px', width: '14px', height: '14px' }} src={toAbsoluteUrl("/media/menu/ic_sp_kho.svg")} />
            </span>
            <span style={{ fontSize: '14px', color: "#888484", fontWeight: 700 }} className="menu-text">{formatMessage({ defaultMessage: 'Quản lý kho' })}</span>
            <i style={{ flex: 'initial', fontSize: 12 }} className="fas fa-chevron-down menu-icon menu-icon-arrow"></i>
          </NavLink>

          <div className="menu-submenu sub-menu">
            <i className="menu-arrow" />
            <ul className="menu-subnav sub-menu">
              <AuthorizationWrapper
                keys={['product_list_view']}
                className={`menu-item ${getMenuItemActive(
                  "/products/list"
                )}`}
                isMenu
              >
                <NavLink className="menu-link" to={{
                  pathname: "/products/list",
                  state: Date.now()
                }}>
                  <span style={{ fontSize: '13px' }} className="menu-text">{formatMessage({ defaultMessage: 'Sản phẩm kho' })}</span>
                </NavLink>
              </AuthorizationWrapper>
              <AuthorizationWrapper
                keys={['warehouse_category_view']}
                className={`menu-item ${getMenuItemActive(
                  "/products/warehouse-bill/product-categories"
                )}`}
                isMenu
              >
                <NavLink className="menu-link" to={{
                  pathname: "/products/warehouse-bill/product-categories",
                  state: Date.now()
                }}>
                  <span style={{ fontSize: '13px' }} className="menu-text">{formatMessage({ defaultMessage: 'Danh mục sản phẩm' })}</span>
                </NavLink>
              </AuthorizationWrapper>
              <AuthorizationWrapper
                keys={['product_stock_view']}
                className={`menu-item ${getMenuActive(
                  ["/products/stocks", "/products/stocks/detail/:id"]
                )}`}
                isMenu
              >
                <NavLink className="menu-link" to={{
                  pathname: "/products/stocks",
                  state: Date.now()
                }} >
                  <span style={{ fontSize: '13px' }} className="menu-text">{formatMessage({ defaultMessage: 'Tồn kho' })}</span>
                </NavLink>
              </AuthorizationWrapper>
              <AuthorizationWrapper
                keys={['product_inventory_view']}
                className={`menu-item ${getMenuActive(
                  [
                    '/products/inventory/list']
                )}`}
                isMenu
              >
                <NavLink className="menu-link" to={{
                  pathname: "/products/inventory/list",
                  state: Date.now()
                }} >
                  <span style={{ fontSize: '13px' }} className="menu-text">{formatMessage({ defaultMessage: 'Kiểm kho' })}</span>
                </NavLink>
              </AuthorizationWrapper>
              <AuthorizationWrapper
                keys={['product_reserve_view']}
                className={`menu-item ${getMenuActive(
                  [
                    '/products/reserve']
                )}`}
                isMenu
              >
                <NavLink className="menu-link" to={{
                  pathname: "/products/reserve",
                  state: Date.now()
                }} >
                  <span style={{ fontSize: '13px' }} className="menu-text">{formatMessage({ defaultMessage: 'Dự trữ' })}</span>
                </NavLink>
              </AuthorizationWrapper>
              <AuthorizationWrapper
                keys={['warehouse_bill_view']}
                className={`menu-item ${getMenuActive(
                  ["/products/warehouse-bill/list"]
                )}`}
                isMenu
              >
                <NavLink className="menu-link" to={{
                  pathname: "/products/warehouse-bill/list",
                  state: Date.now()
                }} >
                  <span style={{ fontSize: '13px' }} className="menu-text">{formatMessage({ defaultMessage: 'Xuất nhập kho' })}</span>
                </NavLink>
              </AuthorizationWrapper>
              <AuthorizationWrapper
                keys={['warehouse_view']}
                className={`menu-item ${getMenuActive(
                  ["/products/warehouselist"]
                )}`}
                isMenu
              >
                <NavLink className="menu-link" to={{
                  pathname: "/products/warehouselist",
                  state: Date.now()
                }} >
                  <span style={{ fontSize: '13px' }} className="menu-text">{formatMessage({ defaultMessage: 'Danh sách kho' })}</span>
                </NavLink>
              </AuthorizationWrapper>
              <AuthorizationWrapper
                keys={['warehouse_bill_history_view']}
                className={`menu-item ${getMenuActive(
                  ["/products/warehouse-bill/history"]
                )}`}
                isMenu
              >
                <NavLink className="menu-link" to={'/products/warehouse-bill/history'} >
                  <span style={{ fontSize: '13px' }} className="menu-text">{formatMessage({ defaultMessage: 'Lịch sử thay đổi tồn' })}</span>
                </NavLink>
              </AuthorizationWrapper>
              <AuthorizationWrapper
                keys={['warehouse_expire']}
                className={`menu-item ${getMenuActive(
                  ["/products/expiration-manage"]
                )}`}
                isMenu
              >
                <NavLink className="menu-link" to={{
                  pathname: "/products/expiration-manage",
                  state: Date.now()
                }} >
                  <span style={{ fontSize: '13px' }} className="menu-text">{formatMessage({ defaultMessage: 'Quản lý hạn sử dụng' })}</span>
                </NavLink>
              </AuthorizationWrapper>
            </ul>
          </div>
        </AuthorizationWrapper>

        {/* Product Manager */}
        <AuthorizationWrapper
          keys={['frame_image_view', 'frame_schedule_view']}
          className={`menu-item menu-item show-submenu ${getMenuActive([
            "/frame-image/list",
            "/frame-image/scheduled-frame",
            "/frame-image/scheduled-frame-create"
          ])}`}
          isMenu
        >
          <NavLink style={{ padding: '15px' }} className="menu-link menu-toggle" to="#">
            <span className="svg-icon menu-icon">
              <SVG style={{ marginRight: '10px', width: '14px', height: '14px', color: "#888484" }} src={toAbsoluteUrl("/media/menu/ic_khung_anh.svg")} />
            </span>
            <span style={{ fontSize: '14px', color: "#888484", fontWeight: 700 }} className="menu-text">{formatMessage({ defaultMessage: 'Quản lý khung ảnh mẫu' })}</span>
            <i style={{ flex: 'initial', fontSize: 12 }} className="fas fa-chevron-down menu-icon menu-icon-arrow"></i>
          </NavLink>

          <div className="menu-submenu">
            <i className="menu-arrow" />
            <ul className="menu-subnav">
              <AuthorizationWrapper
                keys={['frame_image_view']}
                className={`menu-item ${getMenuActive([
                  "/frame-image/list"
                ])}`}
                isMenu
              >
                <NavLink className="menu-link" to={`/frame-image/list`}>
                  <span style={{ fontSize: '13px' }} className="menu-text">{formatMessage({ defaultMessage: 'Danh sách khung ảnh' })}</span>
                </NavLink>
              </AuthorizationWrapper>
              <AuthorizationWrapper
                keys={['frame_schedule_view']}
                className={`menu-item ${getMenuActive([
                  "/frame-image/scheduled-frame"
                ])}`}
                isMenu
              >
                <NavLink className="menu-link" to={`/frame-image/scheduled-frame`}>
                  <span style={{ fontSize: '13px' }} className="menu-text">{formatMessage({ defaultMessage: 'Lập lịch áp khung' })}</span>
                </NavLink>
              </AuthorizationWrapper>
            </ul>
          </div>
        </AuthorizationWrapper>

        {/* Order Manager */}
        <AuthorizationWrapper
          keys={['order_list_view_reload', 'order_list_batch_view', 'refund_order_list_view', 'order_return_list_view', 'order_list_history_view', 'order_session_pickup_view', 'order_session_handover_view']}
          className={`menu-item show-submenu ${getMenuActive([
            '/orders/list', '/orders/list-batch', '/orders/process-return-order-fail',
            '/trahang', '/orders', '/orders/return-order', '/orders/fail-delivery-order',
            '/orders/return-export-histories', '/orders/export-histories', "/orders/process-return-order",
            "/orders/refund-order", '/orders/list-history', '/orders/fulfillment/list', "/orders/session-delivery/list"
          ])}`}
          isMenu
        >
          <NavLink style={{ padding: '15px' }} className="menu-link menu-toggle" to="#">
            <span className="svg-icon menu-icon">
              <SVG style={{ marginRight: '10px', width: '14px', height: '14px' }} src={toAbsoluteUrl("/media/menu/ic_don_hang.svg")} />
            </span>
            <span style={{ fontSize: '14px', color: "#888484", fontWeight: 700 }} className="menu-text">{formatMessage({ defaultMessage: 'Quản lý đơn hàng' })}</span>
            <i style={{ flex: 'initial', fontSize: 12 }} className="fas fa-chevron-down menu-icon menu-icon-arrow"></i>
          </NavLink>

          <div className="menu-submenu">
            <i className="menu-arrow" />
            <ul className="menu-subnav">
              <AuthorizationWrapper
                keys={['order_list_view_reload']}
                className={`menu-item ${getMenuActive(["/orders/list"])}`}
                isMenu
              >
                <NavLink className="menu-link" to={`/orders/list?gt=${dayjs().subtract(29, "day").startOf("day").unix()}&lt=${dayjs().endOf("day").unix()}`}>
                  <span style={{ fontSize: '13px' }} className="menu-text">{formatMessage({ defaultMessage: 'Tất cả' })}</span>
                </NavLink>
              </AuthorizationWrapper>
              <AuthorizationWrapper
                keys={['order_list_batch_view']}
                className={`menu-item ${getMenuActive(["/orders/list-batch"])}`}
                isMenu
              >
                <NavLink className="menu-link" to={`/orders/list-batch`} >
                  <span style={{ fontSize: '13px' }} className="menu-text">{formatMessage({ defaultMessage: 'Xử lý hàng loạt' })}</span>
                </NavLink>
              </AuthorizationWrapper>
              <AuthorizationWrapper
                keys={['order_session_pickup_view']}
                className={`menu-item ${getMenuActive(["/orders/fulfillment/list"])}`}
                isMenu
              >
                <NavLink className="menu-link" to={`/orders/fulfillment/list`} >
                  <span style={{ fontSize: '13px' }} className="menu-text">{formatMessage({ defaultMessage: 'Xử lý theo danh sách' })}</span>
                </NavLink>
              </AuthorizationWrapper>
              <AuthorizationWrapper
                keys={["order_session_handover_view"]}
                className={`menu-item ${getMenuActive(["/orders/session-delivery/list"])}`}
                isMenu
              >
                <NavLink className="menu-link" to={`/orders/session-delivery/list`} >
                  <span style={{ fontSize: '13px' }} className="menu-text">{formatMessage({ defaultMessage: 'Phiên bàn giao' })}</span>
                </NavLink>
              </AuthorizationWrapper>
              <AuthorizationWrapper
                keys={['refund_order_list_view']}
                className={`menu-item ${getMenuActive(["/orders/refund-order", "/orders/process-return-order-fail", "/orders/fail-delivery-order", "/orders/process-return-order"])}`}
                isMenu
              >
                <NavLink className="menu-link" to={`/orders/refund-order`} >
                  <span style={{ fontSize: '13px' }} className="menu-text">{formatMessage({ defaultMessage: 'Xử lý trả hàng' })}</span>
                </NavLink>
              </AuthorizationWrapper>

              <AuthorizationWrapper
                keys={['order_return_list_view']}
                className={`menu-item ${getMenuActive(["/orders/return-order"])}`}
                isMenu
              >
                <NavLink className="menu-link" to={`/orders/return-order`} >
                  <span style={{ fontSize: '13px' }} className="menu-text">{formatMessage({ defaultMessage: 'Trả hàng/Hoàn tiền' })}</span>
                </NavLink>
              </AuthorizationWrapper>
              <AuthorizationWrapper
                keys={['order_list_history_view']}
                className={`menu-item ${getMenuActive(["/orders/list-history"])}`}
                isMenu
              >
                <NavLink className="menu-link" to={`/orders/list-history`} >
                  <span style={{ fontSize: '13px' }} className="menu-text">{formatMessage({ defaultMessage: 'Lịch sử' })}</span>
                </NavLink>
              </AuthorizationWrapper>
            </ul>
          </div>
        </AuthorizationWrapper>

        <AuthorizationWrapper
          keys={['order_sales_person_list_view', 'order_approved', 'order_pos']}
          className={`menu-item show-submenu ${getMenuActive([
            '/order-sales-person/manual',
            '/order-sales-person/history-export-file-approved-order',
            '/order-sales-person/history-export-file-sales-person-order',
            '/order-sales-person/create-manual', '/order-sales-person/approved-order', '/order-sales-person/list-order',
            '/order-sales-person/create-pos'
          ])}`}
          isMenu
        >
          <NavLink style={{ padding: '15px' }} className="menu-link menu-toggle" to="#">
            <span className="svg-icon menu-icon">
              <SVG style={{ marginRight: '10px', width: '14px', height: '14px' }} src={toAbsoluteUrl("/media/menu/ic_don_hang.svg")} />
            </span>
            <span style={{ fontSize: '14px', color: "#888484", fontWeight: 700 }} className="menu-text">{formatMessage({ defaultMessage: 'Quản lý đơn hàng - NVBH' })}</span>
            <i style={{ flex: 'initial', fontSize: 12 }} className="fas fa-chevron-down menu-icon menu-icon-arrow"></i>
          </NavLink>

          <div className="menu-submenu">
            <i className="menu-arrow" />
            <ul className="menu-subnav">
              <AuthorizationWrapper
                keys={['order_sales_person_list_view']}
                className={`menu-item ${getMenuActive(["/order-sales-person/list-order"])}`}
                isMenu
              >
                <NavLink className="menu-link" to={`/order-sales-person/list-order`}>
                  <span style={{ fontSize: '13px' }} className="menu-text">{formatMessage({ defaultMessage: 'Đơn của tôi' })}</span>
                </NavLink>
              </AuthorizationWrapper>
              <AuthorizationWrapper
                keys={['order_approved']}
                className={`menu-item ${getMenuActive(["/order-sales-person/approved-order"])}`}
                isMenu
              >
                <NavLink className="menu-link" to={`/order-sales-person/approved-order`}>
                  <span style={{ fontSize: '13px' }} className="menu-text">{formatMessage({ defaultMessage: 'Duyệt đơn' })}</span>
                </NavLink>
              </AuthorizationWrapper>
              <AuthorizationWrapper
                keys={['order_pos']}
                className={`menu-item ${getMenuActive(["/order-sales-person/create-pos"])}`}
                isMenu
              >
                <NavLink className="menu-link" to={`/order-sales-person/create-pos`}>
                  <span style={{ fontSize: '13px' }} className="menu-text">{formatMessage({ defaultMessage: 'Bán tại điểm' })}</span>
                </NavLink>
              </AuthorizationWrapper>
            </ul>
          </div>
        </AuthorizationWrapper>

        <AuthorizationWrapper
          keys={['marketing_list_view']}
          className={`menu-item show-submenu ${getMenuActive([
            '/marketing/sale-list'
          ])}`}
          isMenu
        >
          <NavLink style={{ padding: '15px' }} className="menu-link menu-toggle" to="#">
            <span className="svg-icon menu-icon">
              <SVG style={{ marginRight: '10px', width: '14px', height: '14px' }} src={toAbsoluteUrl("/media/menu/ic_maketing.svg")} />
            </span>
            <span style={{ fontSize: '14px', color: "#888484", fontWeight: 700 }} className="menu-text">{formatMessage({ defaultMessage: 'Quản lý marketing' })}</span>
            <i style={{ flex: 'initial', fontSize: 12 }} className="fas fa-chevron-down menu-icon menu-icon-arrow"></i>
          </NavLink>

          <div className="menu-submenu">
            <i className="menu-arrow" />
            <ul className="menu-subnav">
              <AuthorizationWrapper
                keys={['marketing_list_view']}
                className={`menu-item ${getMenuActive(["/marketing/sale-list"])}`}
                isMenu
              >
                <NavLink className="menu-link" to={`/marketing/sale-list`}>
                  <span style={{ fontSize: '13px' }} className="menu-text">{formatMessage({ defaultMessage: 'Chương trình khuyến mãi' })}</span>
                </NavLink>
              </AuthorizationWrapper>
            </ul>
          </div>
        </AuthorizationWrapper >

        {/* Report Manager */}
        < AuthorizationWrapper
          keys={['report']}
          className={`menu-item ${getMenuActive(["/report/overview", "/report/user", "/report/product", "/report/effective-business"])}`}
          isMenu
        >
          <NavLink style={{ padding: '15px' }} className="menu-link" to="/report/overview">
            <span className="svg-icon menu-icon">
              <SVG style={{ width: '14px', height: '14px', marginRight: '10px' }} src={toAbsoluteUrl("/media/menu/ic_bao_cao.svg")} />
            </span>

            <span style={{ fontSize: '14px', color: !!getMenuActive(["/report/overview", "/report/user", "/report/product", "/report/effective-business"]) ? "#ff5629" : "#888484", fontWeight: 700 }} className="menu-text">{formatMessage({ defaultMessage: 'Phân tích' })}</span>
          </NavLink>
        </AuthorizationWrapper >

        {/* Customer manager */}
        < AuthorizationWrapper
          keys={['customer_service_rating_view', 'customer_service_auto_reply_rating_setting', 'customer_service_customer_info_view', 'customer_service_chat']}
          isMenu
          className={`menu-item show-submenu ${getMenuActive([
            "/customer-service/manage-rating",
            "/customer-service/auto-reply-rating",
            "/customer-service/customer-info"
          ])}`}
        >
          <NavLink style={{ padding: '15px' }} className="menu-link menu-toggle" to="#">
            <span className="svg-icon svg-icon-md svg-icon-control menu-icon">
              <SVG style={{ width: '14px', height: '14px', marginRight: '10px' }} src={toAbsoluteUrl("/media/menu/headphone.svg")} />
            </span>
            <span style={{ fontSize: '14px', color: "#888484", fontWeight: 700 }} className="menu-text">{formatMessage({ defaultMessage: 'Chăm sóc khách hàng' })}</span>
            <i style={{ flex: 'initial', fontSize: 12 }} className="fas fa-chevron-down menu-icon menu-icon-arrow"></i>
          </NavLink>

          <div className="menu-submenu">
            <i className="menu-arrow" />
            <ul className="menu-subnav">
              <AuthorizationWrapper
                keys={['customer_service_rating_view']}
                className={`menu-item ${getMenuActive(
                  ['/customer-service/manage-rating']
                )}`}
                isMenu
              >
                <NavLink className="menu-link" to={{
                  pathname: "/customer-service/manage-rating",
                  state: Date.now()
                }} >
                  <span style={{ fontSize: '13px' }} className="menu-text">{formatMessage({ defaultMessage: 'Quản lý đánh giá' })}</span>
                </NavLink>
              </AuthorizationWrapper>
              <AuthorizationWrapper
                keys={['customer_service_auto_reply_rating_setting']}
                className={`menu-item ${getMenuActive(
                  ['/customer-service/auto-reply-rating']
                )}`}
                isMenu
              >
                <NavLink className="menu-link" to={{
                  pathname: "/customer-service/auto-reply-rating",
                  state: Date.now()
                }} >
                  <span style={{ fontSize: '13px' }} className="menu-text">{formatMessage({ defaultMessage: 'Tự động trả lời đánh giá' })}</span>
                </NavLink>
              </AuthorizationWrapper>
              <AuthorizationWrapper
                keys={['customer_service_customer_info_view']}
                className={`menu-item ${getMenuActive(
                  ['/customer-service/customer-info']
                )}`}
                isMenu
              >
                <NavLink className="menu-link" to={{
                  pathname: "/customer-service/customer-info",
                  state: Date.now()
                }} >
                  <span style={{ fontSize: '13px' }} className="menu-text">{formatMessage({ defaultMessage: 'Thông tin khách hàng' })}</span>
                </NavLink>
              </AuthorizationWrapper>
              <AuthorizationWrapper
                keys={['customer_service_chat']}
                isMenu
                className={`menu-item ${getMenuActive(
                  ['/customer-service/customer-chat']
                )}`}
              >
                <div className="menu-link" onClick={async e => {
                  e.stopPropagation();
                  const jwt = localStorage.getItem('jwt');
                  const refreshToken = localStorage.getItem('refresh_token') || '';

                  getCustomToken(token => {
                    if (!!token) {
                      window.location.replace(`${process.env.REACT_APP_CHAT_ENDPOINT}/verify-token?uid=${user?.id}&token=${jwt}&isSubUser=${!!user?.is_subuser}&refreshToken=${refreshToken}&customToken=${token}`);
                    } else {
                      window.location.replace(`${process.env.REACT_APP_CHAT_ENDPOINT}/verify-token?uid=${user?.id}&token=${jwt}&isSubUser=${!!user?.is_subuser}&refreshToken=${refreshToken}`);
                    }
                  });
                }}>
                  <span style={{ fontSize: '13px' }} className="menu-text">{formatMessage({ defaultMessage: 'Trò chuyện' })}</span>
                </div>
              </AuthorizationWrapper>
            </ul>
          </div>
        </AuthorizationWrapper >

        {/* Finance manager */}
        < AuthorizationWrapper
          keys={['finance_settlement_order_view', 'finance_order_manage_view', 'finance_cost_price_manage_view', 'finance_trading_report_view', 'finance_cost_period_view']}
          className={`menu-item show-submenu ${getMenuActive([
            "/finance/payment-reconciliation",
            "/finance/exportfile-settlement-pending",
            "/finance/exportfile-settlement-processed",
            "/finance/trading-report",
            "/finance/cost",
            "/finance/manage-finance-order",
            "/finance/exportfile-finance-order",
            "/finance/manage-cost-price"
          ])}`}
          isMenu
        >
          <NavLink style={{ padding: '15px' }} className="menu-link menu-toggle" to="#">
            <span className="svg-icon svg-icon-md svg-icon-control menu-icon">
              <SVG style={{ width: '14px', height: '14px', marginRight: '10px' }} src={toAbsoluteUrl("/media/coin.svg")} />
            </span>
            <span style={{ fontSize: '14px', color: "#888484", fontWeight: 700 }} className="menu-text">{formatMessage({ defaultMessage: 'Tài chính' })}</span>
            <i style={{ flex: 'initial', fontSize: 12 }} className="fas fa-chevron-down menu-icon menu-icon-arrow"></i>
          </NavLink>

          <div className="menu-submenu">
            <i className="menu-arrow" />
            <ul className="menu-subnav">
              <AuthorizationWrapper
                keys={['finance_settlement_order_view']}
                className={`menu-item ${getMenuActive(
                  ['/finance/payment-reconciliation']
                )}`}
                isMenu
              >
                <NavLink className="menu-link" to={{
                  pathname: "/finance/payment-reconciliation",
                  state: Date.now()
                }} >
                  <span style={{ fontSize: '13px' }} className="menu-text">{formatMessage({ defaultMessage: 'Đối soát' })}</span>
                </NavLink>
              </AuthorizationWrapper>
              <AuthorizationWrapper
                keys={['finance_order_manage_view']}
                className={`menu-item ${getMenuActive(
                  ['/finance/manage-finance-order']
                )}`}
                isMenu
              >
                <NavLink className="menu-link" to={{
                  pathname: "/finance/manage-finance-order",
                  state: Date.now()
                }} >
                  <span style={{ fontSize: '13px' }} className="menu-text">{formatMessage({ defaultMessage: 'Bán hàng' })}</span>
                </NavLink>
              </AuthorizationWrapper>
              <AuthorizationWrapper
                keys={['finance_cost_period_view']}
                className={`menu-item ${getMenuActive(
                  ['/finance/cost']
                )}`}
                isMenu
              >
                <NavLink className="menu-link" to={{
                  pathname: "/finance/cost",
                  state: Date.now()
                }} >
                  <span style={{ fontSize: '13px' }} className="menu-text">{formatMessage({ defaultMessage: 'Chi phí' })}</span>
                </NavLink>
              </AuthorizationWrapper>
              <AuthorizationWrapper
                keys={['finance_cost_price_manage_view']}
                isMenu
                className={`menu-item ${getMenuActive(
                  ['/finance/manage-cost-price']
                )}`}
              >
                <NavLink className="menu-link" to={{
                  pathname: "/finance/manage-cost-price",
                  state: Date.now()
                }} >
                  <span style={{ fontSize: '13px' }} className="menu-text">{formatMessage({ defaultMessage: 'Giá vốn và VAT' })}</span>
                </NavLink>
              </AuthorizationWrapper>
              <AuthorizationWrapper
                keys={['finance_trading_report_view']}
                className={`menu-item ${getMenuActive(
                  ['/finance/trading-report']
                )}`}
                isMenu
              >
                <NavLink className="menu-link" to={{
                  pathname: "/finance/trading-report",
                  state: Date.now()
                }} >
                  <span style={{ fontSize: '13px' }} className="menu-text">{formatMessage({ defaultMessage: 'Báo cáo kinh doanh' })}</span>
                </NavLink>
              </AuthorizationWrapper>
            </ul>
          </div>
        </AuthorizationWrapper >

        <AuthorizationWrapper
          keys={['setting_channel_view', 
            'setting_sync_warehouse_view', 
            'setting_third_party_view', 
            'setting_finance_view', 
            'setting_product_status_view']}
          isMenu
          className={`menu-item show-submenu ${getMenuActive([
            "/setting/users", 
            "/setting/channels", 
            '/setting/sync-warehouse', 
            "/setting/setting-finance",
            "/setting/third-party-connection",
            "/setting/setting-product-status"
          ])}`}
        >
          <NavLink style={{ padding: '15px' }} className="menu-link menu-toggle" to="#">
            <span className="svg-icon  svg-icon-md svg-icon-control menu-icon">
              <SVG style={{ width: '14px', height: '14px', marginRight: '10px' }} src={toAbsoluteUrl("/media/setting.svg")} />
            </span>
            <span style={{ fontSize: '14px', color: "#888484", fontWeight: 700 }} className="menu-text">{formatMessage({ defaultMessage: 'Cài đặt' })}</span>
            <i style={{ flex: 'initial', fontSize: 12 }} className="fas fa-chevron-down menu-icon menu-icon-arrow"></i>
          </NavLink>

          <div className="menu-submenu">
            <i className="menu-arrow" />
            <ul className="menu-subnav">
              {!user?.is_subuser && (
                <li
                  className={`menu-item ${getMenuItemActive(
                    "/setting/users"
                  )}`}
                  aria-haspopup="true"
                >
                  <NavLink className="menu-link" to={{
                    pathname: "/setting/users",
                    state: Date.now()
                  }}>
                    <span style={{ fontSize: '13px' }} className="menu-text">{formatMessage({ defaultMessage: 'Tài khoản' })}</span>
                  </NavLink>
                </li>

              )}
              <AuthorizationWrapper
                keys={['setting_channel_view']}
                className={`menu-item ${getMenuActive(
                  ["/setting/channels"]
                )}`}
                isMenu
              >
                <NavLink className="menu-link" to={{
                  pathname: "/setting/channels",
                  state: Date.now()
                }} >
                  <span style={{ fontSize: '13px' }} className="menu-text">{formatMessage({ defaultMessage: 'Quản lý gian hàng' })}</span>
                </NavLink>
              </AuthorizationWrapper>
              <AuthorizationWrapper
                keys={['setting_sync_warehouse_view']}
                className={`menu-item ${getMenuActive(
                  ['/setting/sync-warehouse']
                )}`}
                isMenu
              >
                <NavLink className="menu-link" to={{
                  pathname: "/setting/sync-warehouse",
                  state: Date.now()
                }} >
                  <span style={{ fontSize: '13px' }} className="menu-text">{formatMessage({ defaultMessage: 'Xử lý tồn đa kênh' })}</span>
                </NavLink>
              </AuthorizationWrapper>
              <AuthorizationWrapper
                keys={['setting_third_party_view']}
                className={`menu-item ${getMenuActive(
                  ['/setting/third-party-connection']
                )}`}
                isMenu
              >
                <NavLink className="menu-link" to={{
                  pathname: "/setting/third-party-connection",
                  state: Date.now()
                }} >
                  <span style={{ fontSize: '13px' }} className="menu-text">{formatMessage({ defaultMessage: 'Kết nối mở rộng' })}</span>
                </NavLink>
              </AuthorizationWrapper>
              <AuthorizationWrapper
                keys={['setting_finance_view']}
                className={`menu-item ${getMenuActive(
                  ['/setting/setting-finance']
                )}`}
                isMenu
              >
                <NavLink className="menu-link" to={{
                  pathname: "/setting/setting-finance",
                  state: Date.now()
                }} >
                  <span style={{ fontSize: '13px' }} className="menu-text">{formatMessage({ defaultMessage: 'Cài đặt tài chính' })}</span>
                </NavLink>
              </AuthorizationWrapper>
              <AuthorizationWrapper
                keys={['setting_product_status_view']}
                className={`menu-item ${getMenuActive(
                  ['/setting/setting-product-status']
                )}`}
                isMenu
              >
                <NavLink className="menu-link" to={{
                  pathname: "/setting/setting-product-status",
                  state: Date.now()
                }} >
                  <span style={{ fontSize: '13px' }} className="menu-text">{formatMessage({ defaultMessage: 'Cấu hình trạng thái HH' })}</span>
                </NavLink>
              </AuthorizationWrapper>
            </ul>
          </div>
        </AuthorizationWrapper>
        <AuthorizationWrapper
          keys={['auto_reconciliation_view']}
          isMenu
          className={`menu-item show-submenu ${getMenuActive(["/auto-reconciliation"])}`}
        >
          <NavLink style={{ padding: '15px' }} className="menu-link" to="/auto-reconciliation">
            <span className="svg-icon menu-icon">
              <svg style={{ marginRight: '10px' }} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bot"><path d="M12 8V4H8" /><rect width="16" height="12" x="4" y="8" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" /></svg>
            </span>

            <span style={{ fontSize: '14px', color: !!getMenuActive(["/auto-reconciliation"]) ? "#ff5629" : "#888484", fontWeight: 700 }} className="menu-text">{formatMessage({ defaultMessage: 'Đối soát dữ liệu tự động' })}</span>
          </NavLink>
        </AuthorizationWrapper>
      </ul >
      {/* <span style={{ position: 'fixed', bottom: 10, left: 24 }} >Phiên bản: <strong>{version.version}</strong></span> */}

      {/* end::Menu Nav */}
    </>
  );
}
