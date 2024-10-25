import * as utils from "./LocalStorageHelpers";

const localStorageLastLocationKey = "metronic-lastLocation";

function acceptLocation(lastLocation) {
  if (
    lastLocation &&
    lastLocation.pathname &&
    lastLocation.pathname !== "/" &&
    lastLocation.pathname.indexOf("auth") === -1 &&
    lastLocation.pathname !== "/logout"
  ) {
    return true;
  }

  return false;
}

export function saveLastLocation(lastLocation) {
  if (acceptLocation(lastLocation)) {
    utils.setStorage(
      localStorageLastLocationKey,
      JSON.stringify(lastLocation),
      120
    );
  }
}

export function forgotLastLocation() {
  utils.removeStorage(localStorageLastLocationKey);
}

export function getLastLocation() {
  const defaultLocation = { pathname: "/", title: "Dashboard" };
  const localStorateLocations = utils.getStorage(localStorageLastLocationKey);
  if (!localStorateLocations) {
    return { pathname: "/", title: "Dashboard" };
  }

  try {
    const result = JSON.parse(localStorateLocations);
    return result;
  } catch (error) {
    return defaultLocation;
  }
}

export function getCurrentUrl(location) {
  return location.pathname;
}

export function checkIsActive(location, url) {
  const current = getCurrentUrl(location);
  if (
    (url.startsWith("/product-stores/edit/") &&
      current.startsWith("/product-stores/edit/")) ||
    (url.startsWith("/products/edit/") &&
      current.startsWith("/products/edit/")) ||
    (url.startsWith("/products/stocks/detail/") &&
      current.startsWith("/products/stocks/detail/")) ||
    (url.startsWith("/products/inventory/list") &&
      current.startsWith("/products/inventory/list")) ||
    (url.startsWith("/products/inventory/completed") &&
      current.startsWith("/products/inventory/completed")) ||
    (url.startsWith("/products/inventory/update") &&
      current.startsWith("/products/inventory/update")) ||
    (url.startsWith("/products/inventory/processing") &&
      current.startsWith("/products/inventory/processing")) ||
    (url.startsWith("/products/warehouse-bill/list") &&
      current.startsWith("/products/warehouse-bill/list")) ||
    (url.startsWith("/products/warehouse-bill/history") &&
      current.startsWith("/products/warehouse-bill/history")) ||
    (url.startsWith("/product-stores/list-stock-tracking") &&
      current.startsWith("/product-stores/list-stock-tracking"))
  ) {
    return true;
  }

  if (
    !url.startsWith("/orders/return-export-histories") &&
    !url.startsWith("/orders/process-return-order-fail") &&
    !url.startsWith("/orders/return-order") &&
    !url.startsWith("/orders/fail-delivery-order") &&
    !url.startsWith("/orders/list-batch") &&
    !url.startsWith("/orders/export-histories") &&
    !url.startsWith("/orders/process-return-order") &&
    !url.startsWith("/orders/list") &&
    !url.startsWith("/orders/fulfillment/list") &&
    !url.startsWith("/orders/session-delivery/list") &&
    !url.startsWith("/orders/refund-order") &&
    !current.startsWith("/orders/list-batch") &&
    !current.startsWith("/orders/process-return-order-fail") &&
    !current.startsWith("/orders/fail-delivery-order") &&
    !current.startsWith("/orders/return-order") &&
    !current.startsWith("/orders/export-histories") &&
    !current.startsWith("/orders/process-return-order") &&
    !current.startsWith("/orders/return-export-histories") &&
    !current.startsWith("/orders/list") &&
    !current.startsWith("/orders/fulfillment/list") &&
    !current.startsWith("/orders/session-delivery/list") &&
    !current.startsWith("/orders/refund-order") &&
    url.startsWith("/orders") &&
    current.startsWith("/orders") &&
    typeof +current.split("/")[2] == "number"
  ) {
    return true;
  }

  if( url.startsWith("/order-sales-person/manual") &&
  current.startsWith("/order-sales-person/manual")) {
    return true
  }
  if (!current || !url) {
    return false;
  }

  if (current === url) {
    return true;
  }

  // if (current.indexOf(url) > -1) {
  //     return true;
  // }

  return false;
}
