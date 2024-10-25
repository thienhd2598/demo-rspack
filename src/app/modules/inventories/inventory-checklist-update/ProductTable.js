import React, { memo, useMemo, useCallback, Fragment, useState } from 'react';
import { useMutation, useQuery } from "@apollo/client";
import Pagination from '../../../../components/PaginationModal';
import { useHistory, useLocation, useParams } from "react-router-dom";
import queryString from 'querystring';
import ProductRow from './ProductRow';
import { Modal } from 'react-bootstrap';
import { useToasts } from 'react-toast-notifications';
import query_sme_inventory_checklist_items from '../../../../graphql/query_sme_inventory_checklist_items';
import mutate_delete_sme_inventory_checklist_items_by_pk from '../../../../graphql/mutate_delete_sme_inventory_checklist_items_by_pk';
import mutate_inventoryChecklistUpdateStatus from '../../../../graphql/mutate_inventoryChecklistUpdateStatus';
import ModalQuicklyAddProducts from './ModalQuicklyAddProducts';
import ModalUploadFile from './ModalUploadFile';
import { toAbsoluteUrl } from '../../../../_metronic/_helpers';
import SVG from "react-inlinesvg";
import LoadingDialog from '../../ProductsStore/product-new/LoadingDialog';
import ModalFileUploadResults from '../inventory-checklist/ModalFileUploadResults';
import ModalInventoryError from '../inventory-checklist/ModalInventoryError';
import { useIntl } from 'react-intl';
import AuthorizationWrapper from '../../../../components/AuthorizationWrapper';



const InventoryChecklistTable = ({ whereCondition, warehouseId }) => {
    const params = queryString.parse(useLocation().search.slice(1, 100000));
    const location = useLocation()
    const [checkListId, setCheckListId] = useState(null);
    const [uploadFile, setUploadFile] = useState(false);
    const [dataResults, setDataResults] = useState(null)
    const [dataError, setDataError] = useState(null)
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


    const _deleteProduct = (id) => {
        setShowConfirm({
            message: formatMessage({ defaultMessage: 'Bạn muốn bỏ sản phẩm này ra khỏi phiếu kiểm kho?' }),
            params: id,
        })

    }

    const comeBackPage = () => {
        // setShowConfirm({
        //     message: 'Bạn đang chỉnh sửa phiếu kiểm kho. Mọi thông tin bạn nhập trước đó sẽ bị xoá nếu bạn quay lại màn Kiểm kho. Bạn có chắc chắn muốn quay lại ?',
        //     button_confirm: 'Quay lại',
        // })

        history.push(`/products/inventory/list?${queryString.stringify({
            ...params,
            page: 1,
        })}`)

    }

    const [search, setSearch] = useState({
        searchText: null,
        page: 1,
        limit: 25,
    });

    const { data, loading, error, refetch } = useQuery(query_sme_inventory_checklist_items, {
        variables: {
            limit: search.limit,
            offset: (search.page - 1) * search.limit,
            where: {
                sme_inventory_checklist_id: { _eq: Number(paramsLink.id) },
                ...(!!search.searchText ? {
                    _or: [
                        { variant: { sme_catalog_product: { name: { _ilike: `%${search.searchText.trim()}%` } } } },
                        { variant: { sku: { _ilike: `%${search.searchText.trim()}%` } } },
                    ],
                } : ""),
            }
        },
        fetchPolicy: 'cache-and-network'
    });

    let totalRecord = data?.sme_inventory_checklist_items_aggregate?.aggregate?.count || 0;
    let totalPage = Math.ceil(totalRecord / search.limit);

    const { data: sme_inventory_checklist_items } = useQuery(query_sme_inventory_checklist_items, {
        variables: {
            where: {
                sme_inventory_checklist_id: { _eq: Number(paramsLink.id) }
            }
        },
    });
    let totalSelectd = sme_inventory_checklist_items?.sme_inventory_checklist_items_aggregate?.aggregate?.count || 0;

    const [inventoryChecklistUpdateStatus] = useMutation(mutate_inventoryChecklistUpdateStatus, {
    })

    const updateChecklistStatus = async (status) => {
        setLoadingSubmit(true)
        let { data } = await inventoryChecklistUpdateStatus({
            variables: {
                checkListId: Number(paramsLink.id),
                status: status
            }
        })
        setLoadingSubmit(false)
        if (data?.inventoryChecklistUpdateStatus?.success == 1) {
            addToast(formatMessage({ defaultMessage: 'Chuyển trạng thái phiếu kiểm kho thành công' }), { appearance: 'success' });
            history.push(`/products/inventory/processing/${Number(paramsLink.id)}`)
        } else {
            if (data?.inventoryChecklistUpdateStatus?.error_items?.length > 0) {
                setDataError(data?.inventoryChecklistUpdateStatus)
            }
            addToast(data?.inventoryChecklistUpdateStatus?.message || formatMessage({ defaultMessage: "Chuyển trạng thái phiếu kiểm kho không thành công" }), { appearance: 'error' });
        }
    }


    return (
        <>
            {
                <LoadingDialog show={loadingSubmit} />
            }
            <ModalQuicklyAddProducts
                totalSelectd={totalSelectd}
                checklistid={checkListId}
                warehouseId={warehouseId}
                onHide={() => (setCheckListId(null))}
            />

            <ModalUploadFile
                checklistid={Number(paramsLink.id)}
                uploadFile={uploadFile}
                onShowModalFileUploadResults={(data) => setDataResults(data)}
                onHide={() => (
                    setUploadFile(false)
                )}
            />

            {
                <ModalFileUploadResults dataResults={dataResults} onHide={() => {
                    setDataResults(null)
                }} />
            }

            <div
                style={{
                    boxShadow: "inset -1px 0px 0px #D9D9D9, inset 1px 0px 0px #D9D9D9, inset 0px 1px 0px #D9D9D9, inset 0px -1px 0px #D9D9D9",
                    borderBottomLeftRadius: 6, borderBottomRightRadius: 6, borderTopRightRadius: 6,
                    minHeight: 300
                }}
            >
                <div className='d-flex w-100 mt-8 pb-5' style={{ position: 'sticky', top: 45, background: '#fff', zIndex: 77 }}>
                    <div style={{ flex: 1 }} className="row">
                        <div className="col-4 input-icon pr-1" >
                            <input type="text" className="form-control" placeholder={formatMessage({ defaultMessage: "Tên sản phẩm/SKU" })}
                                style={{ height: 40 }}
                                onBlur={(e) => {
                                    setSearch({ ...search, searchText: e.target.value })
                                }}
                                defaultValue={params.name || ''}
                                onKeyDown={e => {
                                    if (e.keyCode == 13) {

                                        setSearch({ ...search, searchText: e.target.value })
                                        // e.target.blur();
                                    }
                                }}
                            />
                            <span><i className="flaticon2-search-1 icon-md ml-6"></i></span>
                        </div>
                        <AuthorizationWrapper keys={['product_inventory_action']}>
                        <div className='col-8 d-flex justify-content-end'>
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
                                {formatMessage({ defaultMessage: "Tải file" })}
                            </button>
                            <button
                                onClick={
                                    () => {
                                        setCheckListId(Number(paramsLink.id))
                                    }
                                }
                                className="btn btn-primary btn-elevate"
                                style={{ width: 200 }}
                            >
                                {formatMessage({ defaultMessage: "Thêm nhanh sản phẩm" })}
                            </button>
                        </div>
                        </AuthorizationWrapper>
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
                                <span className="font-weight-boldest">{formatMessage({ defaultMessage: "Không" })}</span>
                            </button>
                            <button
                                className={`btn btn-primary font-weight-bold`}
                                style={{ width: 90 }}
                                onClick={async () => {
                                    setShowConfirm(null)
                                    if (showConfirm?.params) {
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
                                    } else {
                                        history.push('/products/inventory/list')
                                    }

                                }}
                            >
                                <span className="font-weight-boldest">{showConfirm?.button_confirm || formatMessage({ defaultMessage: 'Có, Xóa' })}</span>
                            </button>
                        </div>
                    </Modal.Body>
                </Modal >
                <table className="table product-list table-border table-borderless table-vertical-center fixed">
                    <thead
                        style={{
                            position: 'sticky', top: 85, background: "#F3F6F9",
                            fontWeight: "bold",
                            fontSize: "14px",
                            borderRight: '1px solid #d9d9d9',
                            borderLeft: '1px solid #d9d9d9'
                        }}
                    >
                        <tr className="font-size-lg">
                            <th style={{ fontSize: '14px' }} width="35%">{formatMessage({ defaultMessage: 'Sản phẩm' })}</th>
                            <th style={{ fontSize: '14px' }} className='text-center' width="20%">{formatMessage({ defaultMessage: 'Đơn vị tính' })}</th>
                            <th style={{ fontSize: '14px' }} className='text-center'>{formatMessage({ defaultMessage: 'Tồn thực tế' })}</th>
                            <th style={{ fontSize: '14px' }} className='text-center'> {formatMessage({ defaultMessage: 'Thao tác' })}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && <div className='text-center w-100 mt-4' style={{ position: 'absolute' }} >
                            <span className="ml-3 spinner spinner-primary"></span>
                        </div>
                        }
                        {!!error && !loading && (
                            <div className="w-100 text-center mt-8" >
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
                        <AuthorizationWrapper keys={['product_inventory_action']}>
                        {!error && data?.sme_inventory_checklist_items.length == 0 && (
                            <div className="w-100 text-center mt-8" style={{ position: 'absolute' }} >
                                <div className="d-flex flex-column justify-content-center align-items-center">
                                    <p className="mb-6">{formatMessage({ defaultMessage: 'Chưa có sản phẩm nào trong phiếu kiểm kho' })}</p>
                                    {totalSelectd == 0 && <button
                                        className="btn btn-primary btn-elevate"
                                        style={{ width: 200 }}
                                        onClick={e => {
                                            setCheckListId(Number(paramsLink.id))
                                        }}
                                    >
                                        {formatMessage({ defaultMessage: 'Thêm nhanh sản phẩm' })}
                                    </button>}
                                </div>
                            </div>
                        )}
                        </AuthorizationWrapper>
                    </tbody>
                </table>
                {!error && (
                    <Pagination
                        page={search.page}
                        totalPage={totalPage}
                        loading={loading}
                        limit={search.limit}
                        totalRecord={totalRecord}
                        count={data?.sme_inventory_checklist_items?.length}
                        basePath={`/products/inventory/update/${Number(paramsLink.id)}`}
                        emptyTitle=''
                        onPanigate={(page) => setSearch({ ...search, page: page })}
                        onSizePage={(limit) => setSearch({ ...search, limit: Number(limit), page: 1 })}

                    />
                )}
            </div>

            <div className='d-flex justify-content-end  mt-10' >
                <button className="btn btn-secondary mr-2" style={{ width: 150 }} onClick={e => {
                    e.preventDefault()
                    comeBackPage()
                }} >{formatMessage({ defaultMessage: 'Quay lại' })}</button>
                <AuthorizationWrapper keys={['product_inventory_action']}>
                    <button className="btn btn-primary" disabled={!error && totalSelectd == 0} style={{ width: 150 }}
                        onClick={e => {
                            updateChecklistStatus('processing')
                        }}
                        type="submit">{formatMessage({ defaultMessage: 'Bắt đầu kiểm kho' })}</button>
                </AuthorizationWrapper>
            </div>

            {
                <ModalInventoryError dataError={dataError} setDataError={() => setDataError(null)} />
            }
        </>
    )
};

export default memo(InventoryChecklistTable);