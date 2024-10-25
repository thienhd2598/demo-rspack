import { useMutation, useQuery } from "@apollo/client";
import queryString from 'querystring';
import React, { Fragment, memo, useCallback, useLayoutEffect, useMemo, useState } from "react";
import { Helmet } from 'react-helmet-async';
import SVG from "react-inlinesvg";
import { useHistory, useLocation } from 'react-router-dom';
import { useToasts } from "react-toast-notifications";
import { toAbsoluteUrl } from "../../../../_metronic/_helpers";
import {
    Card,
    CardBody
} from "../../../../_metronic/_partials/controls";
import { useSubheader } from "../../../../_metronic/layout";
import mutate_warehouseConfirmBill from "../../../../graphql/mutate_warehouseConfirmBill";
import mutate_warehouseApproveBill from "../../../../graphql/mutate_warehouseApproveBill";
import mutate_warehousePrint from "../../../../graphql/mutate_warehousePrint";
import mutate_warehouseInboundBillPrint from "../../../../graphql/mutate_warehouseInboundBillPrint";
import query_sme_catalog_stores from "../../../../graphql/query_sme_catalog_stores";
import HtmlPrint from "../../Order/HtmlPrint";
import LoadingDialog from "../../Products/product-new/LoadingDialog";
import ModalDeleteWarehouseBill from "../dialogs/ModalDeleteWarehouseBill";
import ModalUploadFile from "../dialogs/ModalUploadFile";
import WarehouseBillFilter from "./WarehouseBillFilter";
import WarehouseBillTable from "./WarehouseBillTable";
import mutate_warehouseUserCancelBill from "../../../../graphql/mutate_warehouseUserCancelBill";
import { useIntl } from 'react-intl';

const WarehouseBillList = () => {
    const { formatMessage } = useIntl();
    const location = useLocation();
    const history = useHistory();
    const { addToast } = useToasts();
    const params = queryString.parse(location.search.slice(1, 100000));
    const { setBreadcrumbs } = useSubheader()
    useLayoutEffect(() => {
        setBreadcrumbs([
            {
                title: formatMessage({ defaultMessage: 'Xuất nhập kho' }),
            },
        ])
    }, []);

    const [dataResultUpload, setDataResultUpload] = useState(null);
    const [showUploadFile, setShowUploadFile] = useState(false);
    const [currentIdDelete, setCurrentIdDelete] = useState(null);
    const [html, setHtml] = useState(false);
    const [namePrint, setNamePrint] = useState('');

    const typeWarehouseBill = params?.type || 'in';

    const [confirmWarehouseBill, { loading: loadingWarehouseConfirmBill }] = useMutation(mutate_warehouseConfirmBill, {
        awaitRefetchQueries: true,
        refetchQueries: ['warehouse_bills']
    });

    const [approveWarehouseBill, { loading: loadingWarehouseApproveBill }] = useMutation(mutate_warehouseApproveBill, {
        awaitRefetchQueries: true,
        refetchQueries: ['warehouse_bills']
    });

    const [mutateCancel, {loading: loadingCancelBill}] = useMutation(mutate_warehouseUserCancelBill,
        {
            awaitRefetchQueries: true,
            refetchQueries: ['warehouse_bills']
        }
    )

    const [printWarehouseBill, { loading: loadingWarehousePrintBill }] = useMutation(mutate_warehousePrint, {
        awaitRefetchQueries: true,
        refetchQueries: ['warehouse_bills']
    });

    const [printInboundWarehouseBill, {loading: loadingPrintInboundBill}] = useMutation(mutate_warehouseInboundBillPrint)

    const { data: dataWarehouse } = useQuery(query_sme_catalog_stores, {
        fetchPolicy: 'cache-and-network',
        variables: {
            where: {
                fulfillment_by: {
                    _eq: 1
                },
                status: {_eq: 10}
            }
        }
    });

    const create_time = useMemo(
        () => {
            try {
                if (!params.gt || !params.lt) return {};
                if (params?.type == 'out' && params?.date_search_type == 'printed_date') {
                    return {
                        printed_date: {
                            _gt: params?.gt,
                            _lt: params?.lt
                        }
                    }
                }

                let rangeTimeConvert = [params?.gt, params?.lt]?.map(
                    _range => (new Date(_range * 1000)).toISOString()
                );
                return {
                    created_at: {
                        _gt: rangeTimeConvert[0],
                        _lt: rangeTimeConvert[1]
                    }
                }
            } catch (error) {
                return {}
            }
        }, [params?.gt, params?.lt, params?.date_search_type, params?.type, params?.status]
    );

    const type = useMemo(
        () => {
            try {
                return {
                    type: { _eq: params?.type || 'in' }
                }
            } catch (error) {
                return {}
            }
        }, [params?.type]
    );

    const search = useMemo(
        () => {
            try {
                if (!params?.q) return {}

                return {
                    [params?.search_type || 'code']: {
                        _ilike: `%${params?.q?.trim()}%`
                    }
                }
            } catch (err) {
                return {}
            }
        }, [params?.q, params?.search_type]
    );

    const protocol = useMemo(
        () => {
            try {
                if (!params?.protocol) return {}

                return {
                    protocol: {
                        _eq: params?.protocol
                    }
                }
            } catch (error) {
                return {}
            }
        }, [params?.protocol]
    );

    const warehouse = useMemo(
        () => {
            try {
                if (!params?.warehouseId) return;

                return {
                    sme_warehouse_id: {
                        _eq: params?.warehouseId
                    }
                }
            } catch (error) {
                return {}
            }
        }, [params?.warehouseId]
    );

    const status = useMemo(
        () => {
            try {
                if (!params.status) return {
                    status: {
                        _eq: 'new'
                    }
                };
                return {
                    status: {
                        _eq: params.status
                    }
                }
            } catch (error) {
                return {}
            }
        }, [params?.status]
    );

    const store_id = useMemo(
        () => {
            try {
                if (!params.store) return {
                };
                return {
                    store_id: {
                        _eq: params.store
                    }
                }
            } catch (error) {
                return {}
            }
        }, [params?.store]
    );


    let whereCondition = useMemo(
        () => {
            return {
                ...create_time,
                ...status,
                ...type,
                ...protocol,
                ...warehouse,
                ...store_id,
                ...search
            }
        }, [create_time, type, status, warehouse, protocol, search, store_id]
    );

    const onWarehouseConfirmBill = useCallback(
        async (id) => {
            if (typeWarehouseBill === 'in') {
                let { data } = await approveWarehouseBill({
                    variables: { id }
                });
                if (data?.warehouseApproveBill?.success) {
                    addToast(formatMessage({ defaultMessage: `Duyệt phiếu nhập kho thành công` }), { appearance: 'success' });
                    history.push(`/products/warehouse-bill/in/${id}`);
                } else {
                    addToast(data?.warehouseApproveBill?.message || formatMessage({ defaultMessage: `Duyệt phiếu nhập kho thất bại` }), { appearance: 'error' });
                }
            } else {
                let { data } = await confirmWarehouseBill({
                    variables: { id }
                });
                if (data?.warehouseConfirmBill?.success) {
                    addToast(formatMessage({ defaultMessage: `Duyệt phiếu xuất kho thành công` }), { appearance: 'success' });
                    history.push(`/products/warehouse-bill/${typeWarehouseBill}/${id}`);
                } else {
                    addToast(data?.warehouseConfirmBill?.message || formatMessage({ defaultMessage: `Duyệt phiếu xuất kho thất bại` }), { appearance: 'error' });
                }
            }
        }, [typeWarehouseBill]
    );

    const onWarehouseCancelBill = async (id) => {
            let { data } = await mutateCancel({
                variables: { id }
            });

            if (data?.warehouseUserCancelBill?.success) {
                addToast(formatMessage({ defaultMessage: `Hủy phiếu xuất kho thành công` }), { appearance: 'success' });
                history.push(`/products/warehouse-bill/${typeWarehouseBill}/${id}`);
            } else {
                addToast(
                    data?.warehouseConfirmBill?.message || formatMessage({ defaultMessage: `Hủy phiếu xuất kho thất bại` }),{ appearance: 'error' });
            }
        }

    const onWarehousePrintBill = useCallback(
        async (id) => {
            if(typeWarehouseBill == 'in') {
                let { data } = await printInboundWarehouseBill({
                    variables: { id }
                });
    
                if (data?.warehouseInboundBillPrint?.success) {
                    setHtml(data?.warehouseInboundBillPrint?.data);
                    setNamePrint(`${formatMessage({ defaultMessage: 'Phiêu_nhập_kho' })}`);
                } else {
                    addToast(formatMessage({ defaultMessage: `In phiếu nhập kho thất bại` }), { appearance: 'error' });
                }
            } else {
                let { data } = await printWarehouseBill({
                    variables: { id }
                });
    
                if (data?.warehousePrint?.success) {
                    setHtml(data?.warehousePrint?.data);
                    setNamePrint(typeWarehouseBill == 'in' ? `${formatMessage({ defaultMessage: 'Phiêu_nhập_kho' })}` : `${formatMessage({ defaultMessage: 'Phiêu_xuất_kho' })}`);
                } else {
                    addToast(
                        typeWarehouseBill == 'in' ? formatMessage({ defaultMessage: `In phiếu nhập kho thất bại` }) : formatMessage({ defaultMessage: `In phiếu xuất kho thất bại` }),
                        { appearance: 'error' }
                    );
                }
            }
        }, [typeWarehouseBill]
    );

    return (
        <Fragment>
            <Card>
                <Helmet
                    titleTemplate={`${formatMessage({ defaultMessage: 'Xuất nhập kho' })} - Upbase`}
                    defaultTitle={`${formatMessage({ defaultMessage: 'Xuất nhập kho' })} - UpBase`}
                >
                    <meta name="description" content={`${formatMessage({ defaultMessage: 'Xuất nhập kho' })} - UpBase`} />
                </Helmet>

                <LoadingDialog show={loadingWarehouseConfirmBill || loadingWarehousePrintBill || loadingCancelBill || loadingWarehouseApproveBill} />

                {
                    (html && namePrint) && <HtmlPrint setNamePrint={setNamePrint} html={html} setHtml={setHtml} namePrint={namePrint} />
                }

                <ModalUploadFile
                    type={typeWarehouseBill}
                    dataWarehouse={dataWarehouse}
                    show={showUploadFile}
                    onHide={() => setShowUploadFile(false)}
                />

                <ModalDeleteWarehouseBill
                    id={currentIdDelete}
                    type={typeWarehouseBill}
                    onHide={() => setCurrentIdDelete(null)}

                />

                {/* <ModalFileUploadResults
                    dataResults={dataResultUpload}
                    onHide={() => setDataResultUpload(null)}
                /> */}

                <CardBody>
                    <WarehouseBillFilter
                        onShowUploadFile={() => setShowUploadFile(true)}
                        dataWarehouse={dataWarehouse}
                        whereCondition={whereCondition}
                    />
                    <WarehouseBillTable
                        whereCondition={whereCondition}
                        onDelete={id => setCurrentIdDelete(id)}
                        onConfirm={id => onWarehouseConfirmBill(id)}
                        onPrint={id => onWarehousePrintBill(id)}
                        onCancel={id => onWarehouseCancelBill(id)}
                        type={params?.type || 'in'}
                    />
                </CardBody>
            </Card>
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
};

export default memo(WarehouseBillList);

export const actionKeys = {
    "warehouse_bill_view": {
        router: '',
        actions: [
            "sc_stores", 
            "op_connector_channels", 
            "sme_warehouses", 
            "warehouse_bills", 
            "warehouse_bills_aggregate",
            "warehouse_bills_by_pk", 
            "sme_catalog_inventory_items", 
            "sme_catalog_inventory_items_aggregate", 
            "warehouse_bill_items", 
            "warehouse_bill_items_aggregate"
        ],
        name: "Xem phiếu xuất nhập kho",
        group_code: 'warehouse_bill',
        group_name: 'Xuất nhập kho',
        cate_code: 'product_service',
        cate_name: 'Quản lý kho',
    },
    "warehouse_bill_out_action": {
        router: '',
        actions: [
            "warehouseUserCreateBill",
            "sc_stores", 
            "op_connector_channels", 
            "sme_warehouses", 
            "warehouse_bills", 
            "warehouse_bills_aggregate",
            'warehouse_bill_items', 
            'sme_catalog_inventory_items',
            "warehouseUserAddProduct",
            "warehouseConfirmBill",
            "warehousePrint",
            'delete_warehouse_bills_by_pk',
            "warehouseUserUpdateBill",
            'warehouse_bills_by_pk',
            "warehouseUserDeleteBill",
            "warehouseUserCancelBill",
            "warehouseUserPreviewFileExport",
            "warehousePrint",
        ],
        name: "Thao tác với phiếu xuất kho",
        group_code: 'warehouse_bill',
        group_name: 'Xuất nhập kho',
        cate_code: 'product_service',
        cate_name: 'Quản lý kho',
    },
    "warehouse_bill_in_create": {
        router: '',
        actions: [
            "warehouseUserCreateBill",
            "sc_stores", 
            "op_connector_channels", 
            "sme_warehouses", 
            "warehouse_bills", 
            "warehouse_bills_aggregate",
            'warehouse_bill_items', 
            'sme_catalog_inventory_items',
            "warehouseUserAddProduct",
            'warehouse_bills_by_pk',
            "warehouseUserPreviewFileExport",
        ],
        name: "Tạo phiếu nhập kho",
        group_code: 'warehouse_bill',
        group_name: 'Xuất nhập kho',
        cate_code: 'product_service',
        cate_name: 'Quản lý kho',
    },
    "warehouse_bill_in_action": {
        router: '',
        actions: [
            "sc_stores", 
            "op_connector_channels", 
            "sme_warehouses", 
            "warehouse_bills", 
            "warehouse_bills_aggregate",
            'warehouse_bill_items', 
            'sme_catalog_inventory_items',
            "warehousePrint",
            'delete_warehouse_bills_by_pk',
            "warehouseUserUpdateBill",
            'warehouse_bills_by_pk',
            "warehouseUserDeleteBill",
            "warehousePrint",
            "warehouseInboundBillPrint"
        ],
        name: "Các thao tác phiếu nhập kho",
        group_code: 'warehouse_bill',
        group_name: 'Xuất nhập kho',
        cate_code: 'product_service',
        cate_name: 'Quản lý kho',
    },
    "warehouse_bill_in_approve": {
        router: '',
        actions: [
            "sc_stores", 
            "op_connector_channels", 
            "sme_warehouses", 
            "warehouse_bills", 
            "warehouse_bills_aggregate",
            'warehouse_bill_items', 
            'sme_catalog_inventory_items',
            'delete_warehouse_bills_by_pk',
            'warehouse_bills_by_pk',
            "warehouseApproveBill"
        ],
        name: "Duyệt phiếu nhập kho",
        group_code: 'warehouse_bill',
        group_name: 'Xuất nhập kho',
        cate_code: 'product_service',
        cate_name: 'Quản lý kho',
    },
    "warehouse_bill_in_cancel": {
        router: '',
        actions: [
            "warehouse_bills", 
            "warehouse_bills_aggregate",
            "warehouseUserCancelWaitingBillInbound"
        ],
        name: "Hoãn nhập kho",
        group_code: 'warehouse_bill',
        group_name: 'Xuất nhập kho',
        cate_code: 'product_service',
        cate_name: 'Quản lý kho',
    },
    "warehouse_bill_in_confirm": {
        router: '',
        actions: [
            "warehouse_bill_items", 
            "warehouse_bill_items_aggregate",
            "warehouseUserUpdateBillInbound",
            "warehouseConfirmBill",
            "warehouse_bills_by_pk",
            "warehouseUpdateQuantityBillFromFile"
        ],
        name: "Nhập kho",
        group_code: 'warehouse_bill',
        group_name: 'Xuất nhập kho',
        cate_code: 'product_service',
        cate_name: 'Quản lý kho',
    },
};