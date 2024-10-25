import React, { memo, useCallback, useMemo, useState, useEffect, Fragment, useLayoutEffect } from "react";
import {
    Card,
    CardBody,
    CardHeader
} from "../../../../_metronic/_partials/controls";
import { Modal } from "react-bootstrap";
import queryString from 'querystring';
import { useLocation } from 'react-router-dom';
import InventoryChecklistFilter from "./InventoryChecklistFilter";
import InventoryChecklistTable from "./InventoryChecklistTable";
import dayjs from "dayjs";
import { toAbsoluteUrl } from "../../../../_metronic/_helpers";
import { useSubheader } from "../../../../_metronic/layout";
import SVG from "react-inlinesvg";
import { Helmet } from 'react-helmet-async';
import { useIntl } from "react-intl";

const InventoryChecklist = () => {
    const {formatMessage} = useIntl()
    const location = useLocation()
    const params = queryString.parse(location.search.slice(1, 100000));
    const { setBreadcrumbs } = useSubheader()
    useLayoutEffect(() => {
        setBreadcrumbs([
            {
                title: formatMessage({defaultMessage: 'Kiểm kho'}),
            },
        ])
    }, []);


    const create_time = useMemo(
        () => {
            try {
                if (!params.gt || !params.lt) return {};
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
        }, [params?.gt, params?.lt]
    );

    const code = useMemo(
        () => {
            try {
                if (!params.code) return {};

                return {
                    code: {
                        _ilike: `%${params?.code?.trim()}%`
                    }
                }
            } catch (error) {
                return {}
            }
        }, [params?.code]
    );


    const tags = useMemo(
        () => {
            try {
                if (!params.tags) return {};
                let tags = params.tags.split(',').map(
                    tag => ({ sme_inventory_checklist_tag_id: { _eq: tag } })
                )
                return {
                    tags: {
                        _or: tags
                    }
                }
            } catch (error) {
                return {}
            }
        }, [params?.tags]
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


    let whereCondition = useMemo(
        () => {
            return {
                ...create_time,
                ...code,
                ...tags,
                ...status
            }
        }, [create_time, code, tags, status]
    );

    return (
        <Fragment>
            <Card>
                <Helmet
                    titleTemplate={formatMessage({defaultMessage:"Kiểm kho"}) + " - UpBase"}
                    defaultTitle={formatMessage({defaultMessage:"Kiểm kho"}) + " - UpBase"}
                >
                    <meta name="description" content={formatMessage({defaultMessage:"Kiểm kho"}) + " - UpBase"} />
                </Helmet>
                <CardBody>
                    <InventoryChecklistFilter whereCondition={whereCondition} />
                    <InventoryChecklistTable whereCondition={whereCondition} />
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

export default memo(InventoryChecklist);

export const actionKeys = {
    "product_inventory_view": {
        router: '/products/inventory/list',
        actions: [
            "sme_inventory_checklist_tags", 
            "sme_warehouses", 
            "sme_inventory_checklists", 
            "sme_inventory_checklists_aggregate"
        ],
        name: "Xem danh sách phiếu kiểm kho",
        group_code: 'product_inventory',
        group_name: 'Kiểm kho',
        cate_code: 'product_service',
        cate_name: 'Quản lý kho',
    },
    "product_inventory_action": {
        router: '',
        actions: [
            "inventoryChecklistDelete", 
            "sme_inventory_checklists", 
            "sme_inventory_checklist_tags", 
            "sme_warehouses", 
            "sme_inventory_checklist_tag_mapping", 
            "sme_inventory_checklists_by_pk",
            "sme_catalog_inventory_items", 
            "sme_catalog_inventory_items_aggregate", 
            "inventoryChecklistAddProductFromManual", 
            "inventoryChecklistAddProductFromFilter",
             "inventoryChecklistCreate",
            "sme_inventory_checklist_items",
            "inventoryChecklistGetTemplate",
        ],
        name: "Thao tác kiểm kho",
        group_code: 'product_inventory',
        group_name: 'Kiểm kho',
        cate_code: 'product_service',
        cate_name: 'Quản lý kho',
    },
    "product_inventory_detail": {
        router: '',
        actions: [
            "sme_catalog_inventory_items", 
            "sme_catalog_inventory_items_aggregate", 
            "inventoryChecklistGetTemplate",
            "sme_inventory_checklist_items_aggregate",
            "sme_inventory_checklist_items",
            "sme_inventory_checklists_by_pk", "sme_warehouses",
            "sme_inventory_checklist_tag_mapping",
            "sc_stores",
            "sme_inventory_checklists",
            "sme_inventory_checklist_tags"
        ],
        name: "Xem chi tiết phiếu kiếm kho",
        group_code: 'product_inventory',
        group_name: 'Kiểm kho',
        cate_code: 'product_service',
        cate_name: 'Quản lý kho',
    },
    "product_inventory_approve": {
        router: '',
        actions: [
            "inventoryChecklistUpdateStatus",
            "inventoryChecklistCompleteFromManual",
            'inventoryChecklistGetTemplate', 
            'sme_inventory_checklist_items'
        ],
        name: "Duyệt phiếu kiếm kho",
        group_code: 'product_inventory',
        group_name: 'Kiểm kho',
        cate_code: 'product_service',
        cate_name: 'Quản lý kho',
    },
};