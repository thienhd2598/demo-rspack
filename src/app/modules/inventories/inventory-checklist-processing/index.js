/*
 * Created by duydatpham@gmail.com on 15/03/2023
 * Copyright (c) 2023 duydatpham@gmail.com
 */
import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet";
import { useSubheader } from "../../../../_metronic/layout";
import SVG from "react-inlinesvg";
import { toAbsoluteUrl } from "../../../../_metronic/_helpers";
import { useQuery, useMutation } from "@apollo/client";
import { Field, Formik, useFormikContext } from "formik";
import * as Yup from "yup";
import { useToasts } from "react-toast-notifications";
import { Card, CardBody, CardHeader, CardHeaderToolbar, InputVertical } from "../../../../_metronic/_partials/controls";
import { ReSelectVertical } from '../../../../_metronic/_partials/controls/forms/ReSelectVertical';
import { RadioGroup } from "../../../../_metronic/_partials/controls/forms/RadioGroup";
import query_sme_catalog_stores from "../../../../graphql/query_sme_catalog_stores";
import query_sme_inventory_checklist_tags from "../../../../graphql/query_sme_inventory_checklist_tags";
import mutate_inventoryChecklistCreate from "../../../../graphql/mutate_inventoryChecklistCreate";
import { useSelector, shallowEqual, connect, useDispatch } from "react-redux";

import { Redirect, useParams } from "react-router-dom";
import query_sme_inventory_checklists_by_pk from "../../../../graphql/query_sme_inventory_checklists_by_pk";
import CreatableSelect from 'react-select/creatable';
import query_sme_inventory_checklist_tag_mapping from "../../../../graphql/query_sme_inventory_checklist_tag_mapping";
import mutate_delete_sme_inventory_checklist_tag_mapping_by_pk from "../../../../graphql/mutate_delete_sme_inventory_checklist_tag_mapping_by_pk";
import mutate_inventoryChecklistAddTag from "../../../../graphql/mutate_inventoryChecklistAddTag";
import ProductTable from './ProductTable';
import mutate_inventoryChecklistUpdateStatus from "../../../../graphql/mutate_inventoryChecklistUpdateStatus";
import queryString from 'querystring';
import { useInventoryUIContext } from "../InventoriesUIContext";
import Select, { components } from 'react-select'
import { RouterPrompt } from "../../../../components/RouterPrompt";
import { useIntl } from "react-intl";
export default memo(({
    history,
}) => {
    const { productEditSchema } = useInventoryUIContext()
    const { addToast } = useToasts();
    const params = useParams();
    const { setBreadcrumbs } = useSubheader()
    const user = useSelector((state) => state.auth.user, shallowEqual);
    const { formatMessage } = useIntl()
    const { data, loading, error, refetch } = useQuery(query_sme_inventory_checklists_by_pk, {
        variables: {
            id: Number(params.id)
        },
        fetchPolicy: 'cache-and-network'
    });

    const { data: dataSmeInventoriesTags } = useQuery(query_sme_inventory_checklist_tags, {
        fetchPolicy: 'cache-and-network'
    });



    const [inventoryChecklistAddTag] = useMutation(mutate_inventoryChecklistAddTag, {
        awaitRefetchQueries: true,
        refetchQueries: ['sme_inventory_checklist_tag_mapping']
    })

    const [delete_sme_inventory_checklist_tag_mapping_by_pk] = useMutation(mutate_delete_sme_inventory_checklist_tag_mapping_by_pk, {
        awaitRefetchQueries: true,
        refetchQueries: ['sme_inventory_checklist_tag_mapping']
    })

    useEffect(() => {
        setBreadcrumbs([
            {
                title: formatMessage({ defaultMessage: 'Kiểm kho' }),
            },
            {
                title: data?.sme_inventory_checklists_by_pk?.code || '',
            }
        ])
    }, [data?.sme_inventory_checklists_by_pk])

    const { data: dataWarehouse } = useQuery(query_sme_catalog_stores, {
        fetchPolicy: 'cache-and-network'
    })

    const { data: getTagsInInventories } = useQuery(query_sme_inventory_checklist_tag_mapping, {
        variables: {
            where: {
                sme_inventory_checklist_id: { _eq: params.id }
            }
        },
        fetchPolicy: 'cache-and-network'
    });
    console.log('data', data)

    const warehouseId = useMemo(() => {
        let sme_warehouses = dataWarehouse?.sme_warehouses || []
        const sme_inventory_checklists = data?.sme_inventory_checklists_by_pk?.sme_warehouse_id
        let warehouse = {}
        if (sme_warehouses.length > 0) {
            warehouse = sme_warehouses.find((element) => sme_inventory_checklists == element?.id)
            return ({
                label: warehouse?.name,
                value: warehouse?.id
            })
        }
        return null
    }, [dataWarehouse, data])
    console.log('warehouseIxxd', warehouseId)
    let getTags = useMemo(() => {
        return getTagsInInventories?.sme_inventory_checklist_tag_mapping?.map(
            e => ({ 'label': e.tag.title, 'value': e.tag.id })
        )
    }, [getTagsInInventories])


    const addTag = async (tag) => {
        await inventoryChecklistAddTag({
            variables: {
                tag: tag,
                checkListId: Number(params.id)
            }
        })
    }

    const deleteTag = async (label) => {
        let tag_delete = getTagsInInventories?.sme_inventory_checklist_tag_mapping?.find(
            e => e.tag.title == label
        )
        await delete_sme_inventory_checklist_tag_mapping_by_pk({
            variables: {
                id: tag_delete.id,
            }
        })
    }

    return <>
        <Helmet
            titleTemplate={`${formatMessage({ defaultMessage: 'Thông tin phiếu' })} - ${data?.sme_inventory_checklists_by_pk?.code} - UpBase`}
            defaultTitle={`${formatMessage({ defaultMessage: 'Thông tin phiếu' })} - ${data?.sme_inventory_checklists_by_pk?.code} - UpBase`}
        >
            <meta name="description" content={`${formatMessage({ defaultMessage: 'Thông tin phiếu' })} - ${data?.sme_inventory_checklists_by_pk?.code} - UpBase`} />
        </Helmet>
        <Card>

            <CardHeader title={<span>{formatMessage({ defaultMessage: 'THÔNG TIN PHIẾU' })}&ensp;&ensp;<span style={{ color: '#ff5629', fontWeight: 'bold', fontSize: 10 }} >{formatMessage({ defaultMessage: 'Đang kiểm kho' })}</span></span>}>
                <CardHeaderToolbar>
                </CardHeaderToolbar>
            </CardHeader>
            <CardBody className='px-15 py-5'>
                <div className='row d-flex justify-content-between'>
                    <div className={`col-md-5`} >
                        <div className="form-group">
                            <label className={`col-form-label`}>{formatMessage({ defaultMessage: 'Kho thực hiện kiểm kho' })}</label>
                            <Select value={warehouseId} options={[warehouseId]} isDisabled={true} />
                        </div>
                    </div>
                    <div className={`col-md-5`} >
                        <div className="form-group">
                            <label className={`col-form-label`}>{formatMessage({ defaultMessage: 'Mã kiểm kho' })}</label>
                            <div className="input-group" style={{ position: 'relative', width: '100%' }} >
                                <div className={`input-group`} >
                                    <input
                                        className={"form-control"}
                                        disabled={true}
                                        value={data?.sme_inventory_checklists_by_pk?.code || ""}
                                        style={{ background: '#F7F7FA', border: 'none', color: '#00000073' }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className='row d-flex justify-content-between'>
                    <div className={`col-md-5`} >
                        <div className="form-group">
                            <label className={`col-form-label`}>{formatMessage({ defaultMessage: 'Loại kiểm kho' })}</label>
                            <div className="radio-inline"
                            >
                                {
                                    [
                                        {
                                            value: 'sku',
                                            label: formatMessage({ defaultMessage: 'Theo SKU Hàng hóa' })
                                        },
                                        {
                                            value: "all",
                                            label: formatMessage({ defaultMessage: 'Toàn bộ kho' })
                                        },
                                    ].map(_op => {
                                        return (
                                            <label key={`op-${_op.value}`} className="radio">
                                                <input type="radio" disabled={true} value={_op.value} checked={data?.sme_inventory_checklists_by_pk?.type == _op.value} />
                                                <span></span>
                                                {_op.label}
                                            </label>
                                        )
                                    })
                                }
                            </div>
                        </div>
                    </div>
                    <div className={`col-md-5`} style={{ zIndex: 99 }} >
                        <label className="col-form-label">Tag</label>
                        <CreatableSelect
                            name="tags"
                            value={getTags || []}
                            component={ReSelectVertical}
                            placeholder={formatMessage({ defaultMessage: "Nhập tags" })}
                            isDisabled={user?.is_subuser && !['product_inventory_action']?.some(key => user?.permissions?.includes(key))}
                            label={"Tag"}
                            onChange={(value, { action, removedValue }) => {
                                console.log(action)
                                switch (action) {
                                    case "select-option":
                                        addTag(
                                            {
                                                id: [...value].pop()['value']
                                                , title: [...value].pop()['label']
                                            })

                                        break;
                                    case "create-option":

                                        if (value?.length > 0 && value?.some(_value => _value?.label?.trim()?.length > 16)) {
                                            addToast(formatMessage({ defaultMessage: 'Tag phiếu tối đa chỉ được 16 ký tự' }), { appearance: 'error' });
                                            return;
                                        }
                                        addTag({
                                            title: [...value].pop()['label']
                                        })
                                        break;

                                    case "remove-value":
                                        console.log(removedValue, 2)
                                        deleteTag(removedValue.label)
                                        break;
                                }

                            }}
                            options={dataSmeInventoriesTags?.sme_inventory_checklist_tags?.map(__ => {
                                return {
                                    label: __.title,
                                    value: __.id
                                }
                            })}
                            customFeedbackLabel={' '}
                            isCreatable={true}
                            isMulti={true}
                            formatCreateLabel={(inputValue) => `${formatMessage({ defaultMessage: 'Tạo mới' })}: "${inputValue}"`}
                        />
                    </div>
                </div>
            </CardBody>
        </Card>
        <Card>
            <CardHeader title={formatMessage({ defaultMessage: "Sản phẩm kiểm kho" })}>
                <CardHeaderToolbar>
                </CardHeaderToolbar>
            </CardHeader>
            <CardBody className='px-15 py-5'>
                <Formik
                    initialValues={{}}
                    validationSchema={productEditSchema}
                    enableReinitialize={true}
                >
                    {
                        (formikProps) => {
                            return <>
                                <ProductTable warehouseId={warehouseId} formikProps={formikProps} />
                            </>
                        }}
                </Formik>

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
    </>
})