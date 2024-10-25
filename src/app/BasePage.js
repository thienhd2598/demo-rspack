import React, { Suspense, lazy, useEffect, useMemo } from "react";
import { shallowEqual, useSelector } from "react-redux";
import { Redirect, Switch, Route } from "react-router-dom";
import { LayoutSplashScreen, ContentRoute } from "../_metronic/layout";
import SettingsPage from "./modules/Settings";
import IdentifyPage from "./modules/Auth/pages/IdentifyPage";
import ModalExpired from "../components/ModalExpired";

const DashboardPage = lazy(() =>
  import("./modules/Dasboard/index")
);

const InventoriesPage = lazy(() =>
  import("./modules/inventories/InventoriesPage")
);

const WarehouseBillPage = lazy(() =>
  import("./modules/WarehouseBills/WarehouseBillsPage")
);

const ProductsPage = lazy(() =>
  import("./modules/Products/ProductsPage")
);
const ProductsStorePage = lazy(() =>
  import("./modules/ProductsStore/ProductsPage")
);

const FrameImagePage = lazy(() =>
  import("./modules/FrameImage/FrameImagePage")
);

const OrdersPage = lazy(() =>
  import("orders/Orders")
);

const OrderSalesPersonPage = lazy(() =>
  import("./modules/OrderSalesPerson/OrderSalesPersonPage")
);

const MarketingPage = lazy(() =>
  import("./modules/Marketing/MarketingPage")
);

const FinancePage = lazy(() =>
  import("./modules/Finance/FinancePage")
);

const CustomerServicePage = lazy(() =>
  import("./modules/CustomerService/CustomerServicePage")
);

const ReportPage = lazy(() =>
  import("./modules/Report/ReportPage")
);

const UserProfilepage = lazy(() =>
  import("./modules/UserProfile/UserProfilePage")
);

const SmartFulfillmentPage = lazy(() => 
  import("./modules/SmartFulfillment/SmartFulfillmentPage")
);

const AutoReconciliationPage = lazy(() =>
  import("./modules/AutoReconciliation/AutoReconciliationPage")
);

export default function BasePage() {
  const user = useSelector((state) => state.auth.user, shallowEqual);

  const pathToSubUser = useMemo(
    () => {
      if (!user?.is_subuser) return '';

      let path = "";
      const [hasRoleProduct, hasRoleWarehouse, hasRoleOrder, hasRoleReport, hasRoleFinace, hasRoleCustomer] = [
        user?.roles?.includes("product_manager"),
        user?.roles?.includes("warehouse_manager"),
        user?.roles?.includes("order_manager"),
        user?.roles?.includes("report_manager"),
        user?.roles?.includes("finance_manager"),
        user?.roles?.includes("customer_support"),
      ];

      if (hasRoleProduct) {
        path = "/product-stores/list";
      } else if (hasRoleWarehouse) {
        path = "/products/list";
      } else if (hasRoleOrder) {
        path = "/orders/list";
      } else if (hasRoleReport) {
        path = "/report/overview";
      } else if (hasRoleFinace) {
        path = "/finance/trading-report";
      } else if (hasRoleCustomer) {
        path = "/customer-service/manage-rating";
      }

      return path
    }, [user]
  );

  return (
    <Suspense fallback={<LayoutSplashScreen />}>
      <Switch>
        {user?.is_subuser ? (
          <Redirect exact from="/" to={user?.roles?.every(role => role == 'order_nvbh') ? "/order-sales-person/list-order" : "/dashboard"} />
          // <Redirect exact from="/" to={pathToSubUser} />
        ) : (
          (!user?.phone || !user?.business_model) && !localStorage?.getItem('fromAgency') ? (
            <Redirect exact from="/" to="/user-profile/update-information" />
          ) : (
            <Redirect exact from="/" to="/dashboard" />
          )
        )}
        <ContentRoute path="/dashboard" component={DashboardPage} />
        <ContentRoute path="/products/inventory" component={InventoriesPage} />
        <ContentRoute path="/products/warehouse-bill" component={WarehouseBillPage} />
        <ContentRoute path="/products" component={ProductsPage} />
        <ContentRoute path="/product-stores" component={ProductsStorePage} />
        <ContentRoute path="/frame-image" component={FrameImagePage} />
        <ContentRoute path="/orders" component={OrdersPage} />
        <ContentRoute path="/order-sales-person" component={OrderSalesPersonPage} />
        <ContentRoute path="/marketing" component={MarketingPage} />
        <ContentRoute path="/smart-ffm" component={SmartFulfillmentPage} />
        <ContentRoute path="/finance" component={FinancePage} />
        <ContentRoute path="/customer-service" component={CustomerServicePage} />
        <ContentRoute path="/report" component={ReportPage} />
        <ContentRoute path="/auto-reconciliation" component={AutoReconciliationPage} />
        <ContentRoute path="/setting" component={SettingsPage} />
        <Route path="/user-profile" component={UserProfilepage} />
        <Redirect to="error/error-v1" />
      </Switch>
    </Suspense>
  );
}
