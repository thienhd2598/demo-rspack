import React, { useMemo } from "react";
import { shallowEqual, useSelector } from "react-redux";
import { Redirect, Route } from "react-router-dom";
import { Content } from "./Content";

const ROLES_CONSTANTS = {
  PRODUCT: "product_manager",
  WAREHOUSE: "warehouse_manager",
  REPORT: "report_manager",
  ORDER: "order_manager"
};

export function ContentRoute({ children, component, roles = [], render, ...props }) {
  const user = useSelector((state) => state.auth.user, shallowEqual);   
  // const hasRole = !user?.is_subuser || user?.roles?.includes('only_view') || user?.roles?.some(_role => role?.includes(_role));  

  const hasRole = useMemo(() => {
    return !user?.is_subuser || roles?.some(role => user?.permissions?.includes(role))
  }, [user, roles]);

  return (
    <Route {...props}>
      {routeProps => {
        if (roles?.length && !hasRole) {
          return <Redirect to='/error/error-v1' />
        }

        if (typeof children === "function") {
          return <Content>{children(routeProps)}</Content>;
        }

        if (!routeProps.match) {
          return null;
        }

        if (children) {
          return <Content>{children}</Content>;
        }

        if (component) {
          return (
            <Content>{React.createElement(component, routeProps)}</Content>
          );
        }

        if (render) {
          return <Content>{render(routeProps)}</Content>;
        }

        return null;
      }}
    </Route>
  );
}
