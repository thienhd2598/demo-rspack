import React, { memo, useMemo, useState, useEffect, useLayoutEffect, Fragment } from "react";
import { Card, CardBody } from "../../../../../_metronic/_partials/controls";

import queryString from 'querystring';
import { useHistory, useLocation } from 'react-router-dom';
import SVG from "react-inlinesvg";
import { Helmet } from 'react-helmet-async';
import { useSubheader } from "../../../../../_metronic/layout";
import { useToasts } from "react-toast-notifications";
import { useMutation, useQuery } from "@apollo/client";
import LoadingDialog from "../../../ProductsStore/product-new/LoadingDialog";
import { toAbsoluteUrl } from "../../../../../_metronic/_helpers";
import ScanFilter from "./ScanFilter";
import ScanTable from "./ScanTable";
import query_coGetPackage from "../../../../../graphql/query_coGetPackage";
import query_sme_catalog_inventories from "../../../../../graphql/query_sme_catalog_inventories";
import mutate_coReadyToShipPackage from "../../../../../graphql/mutate_coReadyToShipPackage";
import { STATUS_ORDER_DETAIL } from "../../OrderUIHelpers";
import { defineMessages, useIntl } from "react-intl";
import { PackStatusName } from "../../OrderStatusName";
import query_sme_catalog_stores from "../../../../../graphql/query_sme_catalog_stores";

export default memo(() => {
    const params = queryString.parse(useLocation().search.slice(1, 100000));
    const { setBreadcrumbs } = useSubheader()
    const { addToast } = useToasts();
    const [packageInfo, setPackageInfo] = useState();
    const { formatMessage } = useIntl()
    const [searchPrdouct, setSearchProduct] = useState(0);
    const [typeProduct, setTypeProduct] = useState({
        value: 'sku',
        label: 'SKU'
    });
    const [warehouse, setWarehouse] = useState({})
    const [loading, setLoading] = useState(false)
    const [infoOrder, setInfoOrder] = useState([]);
    const [checkReloadOrder, setCheckReloadOrder] = useState(false);
    const history = useHistory();

    useLayoutEffect(() => {
        setBreadcrumbs([
            {
                title: formatMessage({ defaultMessage: 'Quét đóng gói' }),
            },
        ])
    }, []);

    const q = useMemo(() => {
        return params.q
    }, [params.q]);

    let whereCondition = useMemo(() => {
        return {
            search_type: params.search_type ?? 'tracking_number',
            q: q,
        }
    }, [q, params.search_type]);

    let variablesProduct = useMemo(() => {
        if (!searchPrdouct) {
            return null;
        }
        if (typeProduct.value == 'gtin') {
            return {
                gtin: { _ilike: searchPrdouct }
            }
        }
        return {
            sku: { _ilike: searchPrdouct }
        }
    }, [searchPrdouct, checkReloadOrder]);
    const { data: dataPackage, loading: loadingOrder, refetch: refetchLoadOrder } = useQuery(query_coGetPackage, {
        variables: {
            q: whereCondition?.q,
            search_type: whereCondition?.search_type,
            sme_warehouse_id: warehouse?.id
        },
        fetchPolicy: 'cache-and-network',
        skip: whereCondition?.q === undefined || whereCondition?.q === '' || whereCondition?.q === null
    });

    const { data: dataSmeWarehouse } = useQuery(query_sme_catalog_stores, {
        fetchPolicy: 'cache-and-network',
        onCompleted: (data) => {
            const warehouseDefault = data?.sme_warehouses?.map(wh => {
                return {
                  ...wh,
                  value: wh?.id
                }
              })?.find(wh => wh?.is_default)
              setWarehouse(warehouseDefault)
        }
      });

    let { data: dataProduct, loading: loadProduct, refetch: refetchLoadProd } = useQuery(query_sme_catalog_inventories, {
        variables: {
            where: { variant: variablesProduct }
        },
        fetchPolicy: 'cache-and-network',
        skip: variablesProduct === null
    });

    const { status, pack_status } = useMemo(() => {
        let logisticsPackage = dataPackage?.coGetPackage?.data;
        let { status, pack_status } = PackStatusName(
            logisticsPackage?.pack_status,
            logisticsPackage?.order?.status,
        )

        return { status, pack_status };
    }, [dataPackage])
    const isValidOrder = useMemo(() => {
        if (dataPackage && !loadingOrder) {
            let order = dataPackage?.coGetPackage?.data?.order;
            const hasMissingLink = !dataPackage?.coGetPackage?.data?.orderItems?.every(element => element.sme_variant_id);

            if (!order && whereCondition?.q !== undefined) {
                addToast(formatMessage({ defaultMessage: 'Kiện không tồn tại' }), { appearance: 'error' });
                return false
            }

            if (whereCondition?.q !== undefined && hasMissingLink) {
                addToast(formatMessage({ defaultMessage: 'Kiện hàng chưa liên kết sản phẩm kho' }), { appearance: 'error' });
                return false
            }

            if (pack_status == 'packing') {
                setPackageInfo(dataPackage?.coGetPackage?.data)
                return true;
            } else {
                if (whereCondition?.q) {
                    addToast(formatMessage({ defaultMessage: 'Kiện hàng đang ở trạng thái' }) + ' ' + formatMessage(status) + ' ' + formatMessage({ defaultMessage: 'nên không hợp lệ. Tính năng này chỉ hỗ trợ những đơn hàng đang ở trạng thái "Đang đóng gói"' }), { appearance: 'error' });
                    return false
                }
            }

        }
        return false;
    }, [dataPackage, whereCondition?.q, loadingOrder]);

    let isValidProduct = useMemo(() => {
        if (dataProduct?.sme_catalog_inventories?.length == 0 && !loadProduct) {
            addToast(formatMessage({ defaultMessage: 'Sản phẩm kho không tồn tại trên hệ thống' }), { appearance: 'error' });
            return false
        }
        if (infoOrder && dataProduct?.sme_catalog_inventories?.length > 0 && !loadProduct) {
            let prod = false
            let check_amount_up = false
            infoOrder.some((item, indexInfo) => {
                item.some((element, index) => {
                    if (element?.product?.variant?.id == dataProduct?.sme_catalog_inventories?.[0]?.variant?.id) {
                        prod = infoOrder[indexInfo][index]
                        if (prod.amount_product_add == prod.quantity_purchased) {
                            check_amount_up = true;
                        } else {
                            check_amount_up = false;
                        }
                        if (!check_amount_up) {
                            infoOrder[indexInfo][index].amount_product_add += 1
                            return true
                        }
                    }
                });
                if (prod && !check_amount_up) {
                    return true
                }
            });
            if (check_amount_up) {
                addToast(`${formatMessage({ defaultMessage: 'Quá số lượng đặt trong kiện, xin vui lòng không thêm sản phẩm này vào kiện' })}`, { appearance: 'error' });
                return false

            }
            if (prod) {
                setInfoOrder([...infoOrder])
                addToast(`${formatMessage({ defaultMessage: 'Thêm sản phẩm thành công' })}`, { appearance: 'success' });
                return true
            }
            if (searchPrdouct) {
                addToast(`${formatMessage({ defaultMessage: 'Sản phẩm với mã' })} ${typeProduct.value == 'sku' ? 'SKU' : 'GTIN'} ${searchPrdouct} ${formatMessage({ defaultMessage: 'này không thuộc đơn hàng này' })}`, { appearance: 'error' });

            }
            return false
        }
        return false;
    }, [dataProduct, loadProduct]
    );

    const resetValue = () => {
        setInfoOrder([])
        setPackageInfo()
        setSearchProduct('')
        setTypeProduct({
            value: 'sku',
            label: 'SKU'
        })
        history.push('/orders/scan-order-packing')
    }

    const sumAmountOrder = useMemo(() => {
        let sumAmount = 0;
        infoOrder.forEach(items => {
            items.forEach((item) => {
                sumAmount += item?.quantity_purchased
            })
        });
        return sumAmount
    }, [infoOrder])

    const sumAmountAddProduct = useMemo(() => {
        let sumAmount = 0;
        infoOrder.forEach(items => {
            items.forEach((item) => {
                sumAmount += item?.amount_product_add
            })
        });
        return sumAmount
    }, [infoOrder])

    const isReadyDeliver = useMemo(() => {        
        if (warehouse?.fulfillment_scan_pack_mode != 1) {
            return !packageInfo
        }

        if (sumAmountOrder && sumAmountAddProduct) {
            return sumAmountOrder != sumAmountAddProduct;
        }
        return true;
    }, [sumAmountOrder, sumAmountAddProduct, packageInfo, warehouse]);

    const [mutate] = useMutation(mutate_coReadyToShipPackage, {
        awaitRefetchQueries: true,
    })


    let variablesProductOrder = useMemo(
        () => {
            if (packageInfo) {
                let sme_variant_ids = [];
                let orderItems = packageInfo?.orderItems;
                orderItems.forEach((element) => {
                    if (element.is_combo) {
                        element.comboItems.forEach((comboItem) => {
                            sme_variant_ids.push(comboItem.sme_variant_id)
                        })
                    } else {
                        sme_variant_ids.push(element.sme_variant_id)
                    }
                });
                return {
                    id: { _in: sme_variant_ids }
                }
            }
            return null;
        }, [packageInfo]
    );

    let { data: dataProductOrder, loading: loadProductOrder } = useQuery(query_sme_catalog_inventories, {
        variables: {
            where: { variant: variablesProductOrder }
        },
        fetchPolicy: 'cache-and-network',
        skip: variablesProductOrder === null
    });

    // Xử lý lấy thông tin kho từ thông tin order

    useEffect(() => {
        let dataProducts = [];
        if (dataProductOrder?.sme_catalog_inventories && packageInfo) {
            let orderItems = packageInfo?.orderItems;

            orderItems.forEach(orderItem => {

                if (orderItem.is_combo == 1) {
                    let dataProductCombo = []
                    orderItem.comboItems.forEach((comboItem) => {
                        dataProductOrder.sme_catalog_inventories.forEach(prod => {
                            if (comboItem.sme_variant_id == prod.variant.id) {
                                let dataProduct = {
                                    product: prod,
                                    quantity_purchased: comboItem?.purchased_quantity,
                                    amount_product_add: 0,
                                    orderItem: orderItem
                                }
                                dataProductCombo.push(dataProduct)
                            }
                        })
                    })
                    dataProducts.push(dataProductCombo)
                } else {
                    dataProductOrder.sme_catalog_inventories.forEach(prod => {
                        if (orderItem.sme_variant_id == prod.variant.id) {
                            let dataProduct = {
                                product: prod,
                                quantity_purchased: orderItem.quantity_purchased,
                                amount_product_add: 0,
                                unit: prod?.variant?.unit
                            }
                            dataProducts.push([dataProduct])
                        }
                    })
                }



            })

            setInfoOrder(dataProducts)
        }
    }, [dataProductOrder])


    const variables = useMemo(() => {
        if (packageInfo) {
            return { list_package: [{ package_id: packageInfo?.id }], need_check_shipping_carrier: 0 }
        }
    }, [packageInfo])

    const handleReadyToShipPackage = async () => {
        setLoading(true)

        let { data } = await mutate({
            variables: variables
        })
        setLoading(false)
        if (data?.coReadyToShipPackage?.success == 0) {
            addToast(data?.coReadyToShipPackage?.message || formatMessage({ defaultMessage: 'Sẵn sàng giao thất bại' }), { appearance: 'error' });
            return;
        }
        if (data?.coReadyToShipPackage?.data?.list_package_fail?.length == 0) {
            addToast(formatMessage({ defaultMessage: 'Sẵn sàng giao thành công' }), { appearance: 'success' });
            resetValue()
        } else {
            addToast(data?.coReadyToShipPackage?.data?.list_package_fail[0]?.error_message || formatMessage({ defaultMessage: 'Sẵn sàng giao thất bại' }), { appearance: 'error' });
        }
    }

    return (
        <Fragment>
            <Helmet
                titleTemplate={formatMessage({ defaultMessage: "Quét đóng gói" }) + " - UpBase"}
                defaultTitle={formatMessage({ defaultMessage: "Quét đóng gói" }) + " - UpBase"}
            >
                <meta name="description" content={formatMessage({ defaultMessage: "Quét đóng gói" }) + " - UpBase"} />
            </Helmet>

            <LoadingDialog show={loading} />
            <ScanFilter                
                isValidOrder={isValidOrder}
                handleReadyToShipPackage={handleReadyToShipPackage}
                resetValue={resetValue}
                infoOrder={infoOrder}
                warehouse={warehouse}
                isReadyDeliver={isReadyDeliver}
                refetchLoadOrder={refetchLoadOrder}                
                loadingOrder={loadingOrder}                
                setWarehouse={setWarehouse}
                optionWarehouses={dataSmeWarehouse?.sme_warehouses?.map(wh => {
                    return {
                      ...wh,
                      value: wh?.id
                    }
                  })}
            />
            <ScanTable
                packageInfo={packageInfo}
                isValidProduct={isValidProduct}
                searchPrdouct={searchPrdouct}
                infoOrder={infoOrder}
                typeProduct={typeProduct}
                setTypeProduct={setTypeProduct}
                setCheckReloadOrder={setCheckReloadOrder}
                refetchLoadProd={refetchLoadProd}
                setSearchProduct={setSearchProduct}
                warehouse={warehouse}
                loading={loading || loadingOrder || (loadProduct && variablesProduct)}
                dataProduct={dataProduct}
                isValidOrder={isValidOrder}
                sumAmountOrder={sumAmountOrder}
                sumAmountAddProduct={sumAmountAddProduct}
            />
            <div
                id="kt_scrolltop1"
                className="scrolltop"
                style={{ bottom: 80 }}
                onClick={() => {
                    window.scrollTo({
                        letf: 0,
                        top: document.body.scrollHeight,
                        behavior: 'smooth'
                    });
                }}
            >
                <span className="svg-icon">
                    <SVG src={toAbsoluteUrl("/media/svg/icons/Navigation/Down-2.svg")} title={' '}></SVG>
                </span>{" "}
            </div>
        </Fragment>
    )
});

export const actionKeys = {
    "order_scan_packing_view": {
        router: '/orders/scan-order-packing',
        actions: [
            "coGetPackage", "sme_catalog_inventories", "sme_catalog_product_variant_by_pk", "coReadyToShipPackage"
        ],
        name: 'Quét đóng gói',
        group_code: 'order_scan',
        group_name: 'Quét đơn hàng',
        cate_code: 'order_service',
        cate_name: 'Quản lý đơn hàng',
    },
};
