import React, { memo, useMemo, useCallback, Fragment, useState, useEffect, useRef } from 'react';
import { useMutation, useQuery } from "@apollo/client";
import Pagination from '../../../../components/Pagination';
import { useHistory, useLocation, useParams } from "react-router-dom";
import queryString from 'querystring';
import ProductRow from './ProductRow';
import { Modal } from 'react-bootstrap';
import { useToasts } from 'react-toast-notifications';
import query_sme_inventory_checklist_items from '../../../../graphql/query_sme_inventory_checklist_items';
import mutate_delete_sme_inventory_checklist_items_by_pk from '../../../../graphql/mutate_delete_sme_inventory_checklist_items_by_pk';
import mutate_inventoryChecklistCompleteFromManual from '../../../../graphql/mutate_inventoryChecklistCompleteFromManual';
import mutate_inventoryChecklistUpdateStatus from '../../../../graphql/mutate_inventoryChecklistUpdateStatus';
import ModalQuicklyAddProducts from './ModalQuicklyAddProducts';
import ModalUploadFileComplete from './ModalUploadFileComplete';
import { toAbsoluteUrl } from '../../../../_metronic/_helpers';
import SVG from "react-inlinesvg";
import LoadingDialog from '../../ProductsStore/product-new/LoadingDialog';
import { useInventoryUIContext } from '../InventoriesUIContext';
import * as Yup from "yup";
import InventoryCountStatus from '../inventory-checklist-completed/InventoryCountStatus';
import ModalFileUploadResults from '../inventory-checklist/ModalFileUploadResults';
import { RouterPrompt } from '../../../../components/RouterPrompt';
import { useIntl } from "react-intl";
import AuthorizationWrapper from '../../../../components/AuthorizationWrapper';


const InventoryChecklistTable = ({ formikProps, warehouseId, confirm }) => {
    const params = queryString.parse(useLocation().search.slice(1, 100000));
    const location = useLocation()
    const [checkListId, setCheckListId] = useState(null);
    const [uploadFile, setUploadFile] = useState(false);
    const { setProductEditSchema } = useInventoryUIContext()
    const [dataResults, setDataResults] = useState(null)
    const [completeToRedirect, setCompleteToRedirect] = useState(false)
    const [changed, setChanged] = useState(true);
    const { formatMessage } = useIntl()

    const paramsLink = useParams();

    const history = useHistory();
    const [showConfirm, setShowConfirm] = useState(false)
    const [loadingSubmit, setLoadingSubmit] = useState(false)

    const [delete_sme_inventory_checklist_items_by_pk] = useMutation(mutate_delete_sme_inventory_checklist_items_by_pk, {
        awaitRefetchQueries: true,
        refetchQueries: ['sme_inventory_checklist_items']
    })
    const { addToast } = useToasts();


    const [inventoryChecklistUpdateStatus] = useMutation(mutate_inventoryChecklistUpdateStatus, {
    })
    const _deleteProduct = (id) => {
        setShowConfirm({
            message: formatMessage({ defaultMessage: 'Bạn muốn bỏ sản phẩm này ra khỏi phiếu kiểm kho?' }),
            params: id,
        })

    }


    const page = useMemo(
        () => {
            try {
                let _page = Number(params.page);
                if (!Number.isNaN(_page)) {
                    return Math.max(1, _page)
                } else {
                    return 1
                }
            } catch (error) {
                return 1;
            }
        }, [params.page]
    );

    const limit = useMemo(
        () => {
            try {
                let _value = Number(params.limit)
                if (!Number.isNaN(_value)) {
                    return Math.max(25, _value)
                } else {
                    return 25
                }
            } catch (error) {
                return 25
            }
        }, [params.limit]
    );

    const statusWhere = useMemo(() => {
        if (params?.status == 'notyet') {
            return { stock_draft: { _is_null: true } }
        }
        if (params?.status == 'lech') {
            return {
                stock_draft: { _is_null: false },
                is_khop: { _eq: 0 }
            }
        }
        if (params?.status == 'khop') {
            return {
                stock_draft: { _is_null: false },
                is_khop: { _eq: 1 }
            }
        }
        return {}
    }, [params?.status])


    const countStatusWhere = (status) => {
        if (status == 'notyet') {
            return { stock_draft: { _is_null: true } }
        }
        if (status == 'lech') {
            return {
                stock_draft: { _is_null: false },
                is_khop: { _eq: 0 }
            }
        }
        if (status == 'khop') {
            return {
                stock_draft: { _is_null: false },
                is_khop: { _eq: 1 }
            }
        }
        return {}
    }

    const { data, loading, error, refetch } = useQuery(query_sme_inventory_checklist_items, {
        variables: {
            limit,
            offset: (page - 1) * limit,
            where: {
                sme_inventory_checklist_id: { _eq: Number(paramsLink.id) },
                ...(!!params.name ? {
                    _or: [
                        { variant: { sme_catalog_product: { name: { _ilike: `%${params.name.trim()}%` } } } },
                        { variant: { sku: { _ilike: `%${params.name.trim()}%` } } },
                        // { sme_catalog_product_variants: { sku_clear_text: { _iregex: encodeURI(params.name.trim()).replace(/%/g, '') } } }
                    ],
                } : ""),
                ...statusWhere
            }
        },
        fetchPolicy: 'cache-and-network'
    });

    let totalRecord = data?.sme_inventory_checklist_items_aggregate?.aggregate?.count || 0;
    let totalPage = Math.ceil(totalRecord / limit);

    const [inventoryChecklistCompleteFromManual, { loading: loadingCompleteManual }] = useMutation(mutate_inventoryChecklistCompleteFromManual, {
    })

    const updateChecklistStatus = useCallback(async (status) => {
        setLoadingSubmit(true)
        let { data } = await inventoryChecklistUpdateStatus({
            variables: {
                checkListId: Number(paramsLink.id),
                status: status
            }
        })
        setLoadingSubmit(false)
        if (data?.inventoryChecklistUpdateStatus?.success == 1) {
            formikProps.setFieldValue('__changed__', false)
            setCompleteToRedirect(true)
            setChanged(false)
            addToast(formatMessage({ defaultMessage: 'Kết thúc kiểm kho thành công' }), { appearance: 'success' });
            setTimeout(() => {
                history.push(`/products/inventory/completed/${Number(paramsLink.id)}`)
            }, 1000);
        } else {
            addToast(data?.inventoryChecklistUpdateStatus?.message || formatMessage({ defaultMessage: "Kết thúc kiểm kho không thành công" }), { appearance: 'error' });
        }
    }, [data?.sme_inventory_checklist_items])

    const filterData = useMemo(() => {
        return (
            [
                {
                    title: formatMessage({ defaultMessage: 'Tất cả' }),
                    status: 'all'
                },
                {
                    title: formatMessage({ defaultMessage: 'Chưa kiểm' }),
                    status: 'notyet'
                },
                {
                    title: formatMessage({ defaultMessage: 'Khớp' }),
                    status: 'khop'
                },
                {
                    title: formatMessage({ defaultMessage: 'Lệch' }),
                    status: 'lech'
                }

            ].map((_tab, index) => {
                const isActive = _tab.status == (params.status || 'all')
                return (
                    <li
                        key={`tab-order-${index}`}
                        className="nav-item"
                    >
                        <a className={`nav-link font-weight-normal ${isActive ? 'active' : ''}`}
                            style={{ fontSize: '13px' }}
                            onClick={() => {
                                history.push(`/products/inventory/processing/${Number(paramsLink.id)}?${queryString.stringify({
                                    ...params,
                                    page: 1,
                                    status: _tab.status
                                })}`)
                            }}
                        >
                            {_tab.title} ({
                                <InventoryCountStatus
                                    sme_inventory_checklist_items={data?.sme_inventory_checklist_items}
                                    whereCondition={{

                                        sme_inventory_checklist_id: { _eq: Number(paramsLink.id) },
                                        ...(!!params.name ? {
                                            _or: [
                                                { variant: { sme_catalog_product: { name: { _ilike: `%${params.name.trim()}%` } } } },
                                                { variant: { sku: { _ilike: `%${params.name.trim()}%` } } },
                                                // { sme_catalog_product_variants: { sku_clear_text: { _iregex: encodeURI(params.name.trim()).replace(/%/g, '') } } }
                                            ],
                                        } : ""),
                                        ...countStatusWhere(_tab.status)
                                    }}
                                />
                            })
                        </a>
                    </li>
                )
            })
        )
    }, [data?.sme_inventory_checklist_items])

    useEffect(() => {
        if (!!data?.sme_inventory_checklist_items) {
            let validateSchema = {}
            let values = { '__changed__': false };
            for (let i = 0; i < data?.sme_inventory_checklist_items.length; i++) {
                let product = data?.sme_inventory_checklist_items[i]
                values[`stock-${product.id}-qty`] = product.stock_draft == null || product.stock_draft == undefined ? undefined : product.stock_draft
                values[`stock-${product.id}-note`] = product.note || undefined

                validateSchema[`stock-${product.id}-qty`] = Yup.number()
                    .required(formatMessage({ defaultMessage: "Vui lòng nhập số lượng thực tế" }))
                    .min(0, formatMessage({ defaultMessage: 'Số lượng sản phẩm tối thiểu 0' }))
                    .max(999999, formatMessage({ defaultMessage: 'Số lượng sản phẩm phải nhỏ hơn 999.999' }))
                validateSchema[`stock-${product.id}-note`] = Yup.string()
                    .max(255, formatMessage({ defaultMessage: 'Ghi chú tối đa 255 ký tự' }))
                    .notRequired()

            }
            formikProps.setValues(values)
            setTimeout(() => {
                formikProps.setFieldValue('__changed__', false)
            }, 100);


            setProductEditSchema(Yup.object().shape(validateSchema))

        }
    }, [data?.sme_inventory_checklist_items])

    return (
        <>
            <RouterPrompt
                when={changed}
                forkWhen={formikProps.values['__changed__']}
                title={formatMessage({ defaultMessage: "Lưu ý mọi thông tin bạn nhập trước đó sẽ không được lưu lại?" })}
                cancelText={formatMessage({ defaultMessage: "Quay lại" })}
                okText={formatMessage({ defaultMessage: "Tiếp tục" })}
                onOK={() => true}
                onCancel={() => false}
            />
            {
                <LoadingDialog show={loadingCompleteManual || loadingSubmit} />
            }
            <ModalQuicklyAddProducts
                checklistid={checkListId}
                warehouseId={warehouseId}
                onHide={() => (setCheckListId(null))}
            />

            <ModalUploadFileComplete
                checklistid={Number(paramsLink.id)}
                uploadFile={uploadFile}
                onHide={() => {
                    setUploadFile(false)
                }}
                onUploadSuccess={() => {
                    window.location.reload()
                }}
                onShowModalFileUploadResults={(data) => setDataResults(data)}

            />

            {
                <ModalFileUploadResults dataResults={dataResults} onHide={() => {
                    setDataResults(null)
                    window.location.reload()
                }} />
            }
            <div
                style={{
                    boxShadow: "inset -1px 0px 0px #D9D9D9, inset 1px 0px 0px #D9D9D9, inset 0px 1px 0px #D9D9D9, inset 0px -1px 0px #D9D9D9",
                    borderBottomLeftRadius: 6, borderBottomRightRadius: 6, borderTopRightRadius: 6,
                    minHeight: 300
                }}
            >
                <div className='d-flex w-100 mt-8' style={{ position: 'sticky', top: 45, background: '#fff', zIndex: 10 }}>
                    <div style={{ flex: 1, flexDirection: 'column' }}>
                        <div style={{ flex: 1 }} className="row">
                            <div className="col-4 input-icon pr-1" >
                                <input type="text" className="form-control" placeholder="Tên sản phẩm/SKU"
                                    style={{ height: 40 }}
                                    onBlur={(e) => {
                                        history.push(`${location.pathname}?name=${e.target.value}`)
                                    }}
                                    defaultValue={params.name || ''}
                                    onKeyDown={e => {
                                        if (e.keyCode == 13) {
                                            history.push(`${location.pathname}?name=${e.target.value}`)
                                            // e.target.blur();
                                        }
                                    }}
                                />
                                <span><i className="flaticon2-search-1 icon-md ml-6"></i></span>
                            </div>

                            <div className='col-8 d-flex justify-content-end'>
                                <AuthorizationWrapper keys={['product_inventory_action']}>
                                <button
                                    className="btn mr-4"
                                    style={{ color: '#ff5629', borderColor: '#ff5629', background: '#ffffff', width: 100 }}
                                    type="submit"
                                    onClick={async (e) => {
                                        setUploadFile(true)
                                    }}>
                                    <SVG
                                        src={toAbsoluteUrl("/media/svg/iconupload.svg")}
                                        className="h-75 align-self-end mr-3"
                                    ></SVG>
                                    {formatMessage({ defaultMessage: 'Tải file' })}
                                </button>
                                </AuthorizationWrapper>
                            </div>
                        </div>
                        <ul className="nav nav-tabs" id="myTab" role="tablist" style={{ borderBottom: 'none', marginTop: 8 }} >
                            {filterData}
                        </ul>
                    </div>
                </div>
                <Modal
                    show={!!showConfirm}
                    aria-labelledby="example-modal-sizes-title-lg"
                    centered
                    onHide={() => setShowConfirm(null)}
                >
                    <Modal.Body className="overlay overlay-block cursor-default text-center">
                        <div className="mb-4" >{showConfirm?.message}</div>

                        <div className="form-group mb-0">
                            <button
                                className="btn btn-light btn-elevate mr-3"
                                style={{ width: 90 }}
                                onClick={() => setShowConfirm(null)}
                            >
                                <span className="font-weight-boldest">{formatMessage({ defaultMessage: 'Không' })}</span>
                            </button>
                            <button
                                className={`btn btn-primary font-weight-bold`}
                                style={{ width: 90 }}
                                onClick={async () => {
                                    setShowConfirm(null)
                                    if (showConfirm?.params.length == 0) {
                                        return;
                                    }
                                    let { data } = await delete_sme_inventory_checklist_items_by_pk({
                                        variables: {
                                            id: showConfirm.params
                                        }
                                    })
                                    if (data?.delete_sme_inventory_checklist_items_by_pk?.id) {
                                        addToast(formatMessage({ defaultMessage: 'Xóa sản phẩm trong phiếu thành công' }), { appearance: 'success' });

                                    } else {
                                        addToast(data?.delete_sme_inventory_checklist_items_by_pk?.message || formatMessage({ defaultMessage: "Xóa sản phẩm trong phiếu không thành công" }), { appearance: 'error' });
                                    }

                                }}
                            >
                                <span className="font-weight-boldest">{formatMessage({ defaultMessage: 'Có, Xóa' })}</span>
                            </button>
                        </div>
                    </Modal.Body>
                </Modal >
                <table className="table table-border product-list table-borderless table-vertical-center fixed">
                    <thead
                        style={{
                            position: 'sticky', top: 140, background: "#F3F6F9",
                            fontWeight: "bold",
                            fontSize: "14px",
                            borderRight: '1px solid #d9d9d9',
                            borderLeft: '1px solid #d9d9d9'
                        }}
                    >
                        <tr className="font-size-lg">
                            <th style={{ fontSize: '14px' }} width="30%">{formatMessage({ defaultMessage: 'Sản phẩm' })}</th>
                            <th className='text-center' style={{ fontSize: '14px' }} width="10%">{formatMessage({ defaultMessage: 'ĐVT' })}</th>
                            <th className='text-center' style={{ fontSize: '14px', maxWidth: 100, width: 100, minWidth: 100 }}>{formatMessage({ defaultMessage: 'Tồn thực tế' })}</th>
                            <th className='text-center' style={{ fontSize: '14px', maxWidth: 200, width: 200, minWidth: 200 }} >{formatMessage({ defaultMessage: 'Số lượng thực tế' })}</th>
                            <th className='text-center' style={{ fontSize: '14px', maxWidth: 100, width: 100, minWidth: 100 }} >{formatMessage({ defaultMessage: 'Lệch' })}</th>
                            <th style={{ fontSize: '14px' }} className='text-center'>{formatMessage({ defaultMessage: 'Ghi chú' })}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && <div className='text-center w-100 mt-4' style={{ position: 'absolute' }} >
                            <span className="ml-3 spinner spinner-primary"></span>
                        </div>
                        }
                        {!!error && !loading && (
                            <div className="w-100 text-center mt-8" style={{ position: 'absolute' }} >
                                <div className="d-flex flex-column justify-content-center align-items-center">
                                    <i className='far fa-times-circle text-danger' style={{ fontSize: 48, marginBottom: 8 }}></i>
                                    <p className="mb-6">{formatMessage({ defaultMessage: 'Xảy ra lỗi trong quá trình tải dữ liệu' })}</p>
                                    <button
                                        className="btn btn-primary btn-elevate"
                                        style={{ width: 100 }}
                                        onClick={e => {
                                            e.preventDefault();
                                            refetch();
                                        }}
                                    >
                                        {formatMessage({ defaultMessage: 'Tải lại' })}
                                    </button>
                                </div>
                            </div>
                        )}
                        {
                            !error && data?.sme_inventory_checklist_items?.map(product => {
                                return <ProductRow key={`product-row-${product.id}`}
                                    product={product}
                                    deleteProduct={_deleteProduct}
                                />
                            })
                        }
                        {!error && data?.sme_inventory_checklist_items.length == 0 && (
                            <div className="w-100 text-center mt-8" style={{ position: 'absolute' }} >
                                <div className="d-flex flex-column justify-content-center align-items-center">
                                    <p className="mb-6">{formatMessage({ defaultMessage: 'Chưa có sản phẩm nào' })}</p>
                                </div>
                            </div>
                        )}

                    </tbody>
                </table>
                {!error && (
                    <Pagination
                        page={page}
                        totalPage={totalPage}
                        loading={loading}
                        limit={limit}
                        totalRecord={totalRecord}
                        count={data?.sme_inventory_checklist_items?.length}
                        basePath={`/products/inventory/processing/${Number(paramsLink.id)}`}
                        emptyTitle=''
                    />
                )}
            </div>
            < div className='d-flex justify-content-end  mt-10' >
                <button className="btn btn-secondary mr-2" style={{ width: 150 }} onClick={e => {
                    e.preventDefault()
                    formikProps.setFieldValue('__changed__', false)
                    history.push('/products/inventory/list?status=processing')
                }} >{formatMessage({ defaultMessage: 'Quay lại' })}</button>
                <AuthorizationWrapper keys={['product_inventory_action']}>
                    <button className="btn btn-primary mr-2" disabled={!error && data?.sme_inventory_checklist_items.length == 0} style={{ color: '#ff5629', borderColor: '#ff5629', background: '#ffffff', width: 150, }}
                        onClick={async e => {
                            let error = await formikProps.validateForm(formikProps.values);
                            console.log('errorerrorerrorerror', error, formikProps.values)
                            if (Object.values(error).length != 0) {
                                formikProps.handleSubmit()
                                addToast(formatMessage({ defaultMessage: 'Vui lòng nhập đầy đủ các trường thông tin đã được khoanh đỏ' }), { appearance: 'error' });
                                return;
                            } else {
                                let stockInput = {}

                                let keys = Object.keys(formikProps.values).filter(__ => __.startsWith("stock-"));
                                keys.forEach(_key => {
                                    let id = _key.split('-')[1]
                                    if (!!id) {
                                        stockInput[id] = {
                                            id: Number(id),
                                            quantity: formikProps.values[`stock-${id}-qty`],
                                            note: formikProps.values[`stock-${id}-note`],
                                        }
                                    }
                                });

                                let { data } = await inventoryChecklistCompleteFromManual({
                                    variables: {
                                        checkListId: Number(paramsLink.id),
                                        stockInput: Object.values(stockInput)
                                    },
                                    refetchQueries: ['inventoryChecklistGetTemplate', 'sme_inventory_checklist_items']
                                })
                                if (data?.inventoryChecklistCompleteFromManual?.success) {
                                    formikProps.setFieldValue('__changed__', false)
                                    setCompleteToRedirect(true)
                                    addToast(formatMessage({ defaultMessage: 'Lưu kiểm kho thành công' }), { appearance: 'success' });
                                } else {
                                    addToast(data?.inventoryChecklistCompleteFromManual?.message || formatMessage({ defaultMessage: "Lưu kiểm kho không thành công" }), { appearance: 'error' });
                                }
                            }
                        }}
                        type="submit">{formatMessage({ defaultMessage: 'Lưu lại' })}</button>
                </AuthorizationWrapper>
                <AuthorizationWrapper keys={['product_inventory_approve']}>
                <button className="btn btn-primary" disabled={!error && data?.sme_inventory_checklist_items.length == 0} style={{ width: 150 }}
                    onClick={async e => {

                        let error = await formikProps.validateForm(formikProps.values);
                        console.log('errorerrorerrorerror', error, formikProps.values)
                        if (Object.values(error).length != 0) {
                            formikProps.handleSubmit()
                            addToast(formatMessage({ defaultMessage: 'Vui lòng nhập đầy đủ các trường thông tin đã được khoanh đỏ' }), { appearance: 'error' });
                            return;
                        } else {
                            let stockInput = {}

                            let keys = Object.keys(formikProps.values).filter(__ => __.startsWith("stock-"));
                            keys.forEach(_key => {
                                let id = _key.split('-')[1]
                                if (!!id) {
                                    stockInput[id] = {
                                        id: Number(id),
                                        quantity: formikProps.values[`stock-${id}-qty`],
                                        note: formikProps.values[`stock-${id}-note`],
                                    }
                                }
                            });

                            let { data } = await inventoryChecklistCompleteFromManual({
                                variables: {
                                    checkListId: Number(paramsLink.id),
                                    stockInput: Object.values(stockInput)
                                },
                                refetchQueries: ['inventoryChecklistGetTemplate', 'sme_inventory_checklist_items']
                            })
                            if (data?.inventoryChecklistCompleteFromManual?.success) {
                                updateChecklistStatus('complete')
                            } else {
                                addToast(data?.inventoryChecklistCompleteFromManual?.message || formatMessage({ defaultMessage: "Lưu kiểm kho không thành công" }), { appearance: 'error' });
                            }
                        }

                    }}
                    type="submit">{formatMessage({ defaultMessage: 'Kết thúc kiểm kho' })}</button>
                    </AuthorizationWrapper>
            </div>
        </>
    )
};

export default memo(InventoryChecklistTable);