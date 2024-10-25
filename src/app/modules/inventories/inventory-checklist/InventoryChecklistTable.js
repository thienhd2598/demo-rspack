import React, { memo, useMemo, useCallback, Fragment, useState } from 'react';
import { useMutation, useQuery } from "@apollo/client";
import Pagination from '../../../../components/Pagination';
import { useHistory, useLocation } from "react-router-dom";
import queryString from 'querystring';
import query_sme_inventory_checklists from '../../../../graphql/query_sme_inventory_checklists';
import InventoryChecklistRow from './InventoryChecklistRow';
import query_sme_catalog_stores from "../../../../graphql/query_sme_catalog_stores";
import { Modal } from 'react-bootstrap';
import mutate_inventoryChecklistDelete from '../../../../graphql/mutate_inventoryChecklistDelete';
import { useToasts } from 'react-toast-notifications';
import ModalUploadFileComplete from '../inventory-checklist-processing/ModalUploadFileComplete';
import ModalInventoryError from './ModalInventoryError';
import ModalFileUploadResults from './ModalFileUploadResults';
import InventoryCount from './InventoryCount';
import { useIntl } from "react-intl";
const InventtoryTabs = [
    {
        title: 'Tất cả',

    }
];



const InventoryChecklistTable = ({ whereCondition }) => {
    const {formatMessage} = useIntl()
    const STATUS = [
        {
            title: formatMessage({defaultMessage: 'Chờ kiểm kho'}),
            status: 'new'
        },
        {
            title: formatMessage({defaultMessage:'Đang kiểm kho'}),
            status: 'processing'
        },
        {
            title: formatMessage({defaultMessage:'Đã hoàn tất'}),
            status: 'complete'
        }
    ]
    
    const params = queryString.parse(useLocation().search.slice(1, 100000));
    const history = useHistory();
    const [showConfirm, setShowConfirm] = useState(false)
    const [checklistidComplete, setChecklistidComplete] = useState(null)
    const [uploadFile, setUploadFile] = useState(false)

    const [dataError, setDataError] = useState(null)
    const [dataResults, setDataResults] = useState(null)

    const { data: dataWarehouse } = useQuery(query_sme_catalog_stores)

    const [inventoryChecklistDelete] = useMutation(mutate_inventoryChecklistDelete, {
        awaitRefetchQueries: true,
        refetchQueries: ['sme_inventory_checklists']
    })
    const { addToast } = useToasts();

    console.log('dataWarehouse', dataWarehouse)


    const _deleteChecklist = async (id) => {

        setShowConfirm({
            message: formatMessage({defaultMessage:'Bạn có muốn xóa không ?'}),
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

    const { data, loading, error, refetch } = useQuery(query_sme_inventory_checklists, {
        variables: {
            limit,
            offset: (page - 1) * limit,
            where: whereCondition,
        },
        fetchPolicy: 'cache-and-network'
    });

    let totalRecord = data?.sme_inventory_checklists_aggregate?.aggregate?.count || 0;
    let totalPage = Math.ceil(totalRecord / limit);


    return (
        <div
            style={{
                // boxShadow: "inset -1px 0px 0px #D9D9D9, inset 1px 0px 0px #D9D9D9, inset 0px 1px 0px #D9D9D9, inset 0px -1px 0px #D9D9D9",
                borderBottomLeftRadius: 6, borderBottomRightRadius: 6, borderTopRightRadius: 6,
                minHeight: 300
            }}
        >
            <div className='d-flex w-100 mt-8' style={{ position: 'sticky', top: 45, background: '#fff' }}>
                <div style={{ flex: 1 }} >
                    <ul className="nav nav-tabs" id="myTab" role="tablist" style={{ borderBottom: 'none' }} >
                        {
                            STATUS.map((_tab, index) => {
                                const { title, status } = _tab;
                                const isActive = status == (params?.status || 'new')
                                return (
                                    <li
                                        key={`tab-order-${index}`}
                                        className={`nav-item ${isActive ? 'active' : ''} ${status == params.status ? 'active' : ''}`}
                                    >
                                        <a className={`nav-link font-weight-normal ${isActive ? 'active' : ''}`}
                                            style={{ fontSize: '13px' }}
                                            onClick={() => {
                                                history.push(`/products/inventory/list?${queryString.stringify({
                                                    ...params,
                                                    page: 1,
                                                    status: status
                                                })}`)
                                            }}
                                        >
                                            {title} ({
                                                <InventoryCount
                                                    whereCondition={{
                                                        ...whereCondition,
                                                        status: {_eq: status}
                                                    }}
                                                />
                                            })
                                        </a>
                                    </li>
                                )
                            })
                        }
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
                            <span className="font-weight-boldest">{formatMessage({defaultMessage:'Không'})}</span>
                        </button>
                        <button
                            className={`btn btn-primary font-weight-bold`}
                            style={{ width: 90 }}
                            onClick={async () => {
                                setShowConfirm(null)
                                if (showConfirm?.params.length == 0) {
                                    return;
                                }
                                let { data } = await inventoryChecklistDelete({
                                    variables: {
                                        checkListId: showConfirm.params
                                    }
                                })
                                if (data?.inventoryChecklistDelete?.success == 1) {
                                    addToast(formatMessage({defaultMessage:'Xóa phiếu kiểm kho thành công'}), { appearance: 'success' });

                                } else {
                                    addToast(data?.inventoryChecklistDelete?.message || formatMessage({defaultMessage:"Xóa phiếu kiểm kho không thành công"}), { appearance: 'error' });
                                }

                            }}
                        >
                            <span className="font-weight-boldest">{formatMessage({defaultMessage:'Có, Xóa'})}</span>
                        </button>
                    </div>
                </Modal.Body>
            </Modal >
            <table className="table product-list table-borderless product-list table-border table-vertical-center fixed">
                <thead
                    style={{
                        position: 'sticky', top: 83, background: '#F3F6F9', fontWeight: 'bold', fontSize: '14px', borderBottom: '1px solid gray',borderRight: '1px solid #d9d9d9',borderLeft: '1px solid #d9d9d9'
                    }}
                >
                    <tr className="font-size-lg">
                        <th style={{ fontSize: '14px' }} width="20%">{formatMessage({defaultMessage:'Mã kiểm kho'})}</th>
                        <th style={{ fontSize: '14px' }} width="20%">{formatMessage({defaultMessage:'Kho'})}</th>
                        <th style={{ fontSize: '14px' }} width="20%" className='text-center'>{params?.status == 'complete' ? formatMessage({defaultMessage:'Sản phẩm đã kiểm'}) : formatMessage({defaultMessage:'Sản phẩm cần kiểm'})}</th>
                        <th style={{ fontSize: '14px' }} width="20%">{formatMessage({defaultMessage:'Thời gian'})}</th>
                        <th style={{ fontSize: '14px' }} width="20%">{formatMessage({defaultMessage:'Thao tác'})}</th>
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
                                <p className="mb-6">{formatMessage({defaultMessage:'Xảy ra lỗi trong quá trình tải dữ liệu'})}</p>
                                <button
                                    className="btn btn-primary btn-elevate"
                                    style={{ width: 100 }}
                                    onClick={e => {
                                        e.preventDefault();
                                        refetch();
                                    }}
                                >
                                    {formatMessage({defaultMessage:'Tải lại'})}
                                </button>
                            </div>
                        </div>
                    )}
                    {
                        !error && data?.sme_inventory_checklists?.map(_inventory_sheet => {
                            return <InventoryChecklistRow key={`inventory-row-${_inventory_sheet.id}`}
                                inventory_sheet={_inventory_sheet}
                                deleteChecklist={_deleteChecklist}
                                selectToComplete={setChecklistidComplete}
                                setUploadFile={setUploadFile}
                                setDataError={setDataError}
                                setDataResults={setDataResults}
                                data_warehouse={dataWarehouse?.sme_warehouses || []}
                            />
                        })
                    }
                </tbody>
            </table>
            {!error && (
                <Pagination
                    page={page}
                    totalPage={totalPage}
                    loading={loading}
                    limit={limit}
                    totalRecord={totalRecord}
                    count={data?.sme_inventory_checklists?.length}
                    basePath={'/products/inventory/list'}
                    emptyTitle={formatMessage({defaultMessage:'Chưa có phiếu kiểm kho'})}
                />
            )}


            <ModalUploadFileComplete
                checklistid={checklistidComplete}
                uploadFile={uploadFile}
                onHide={() => {
                    setUploadFile(false)
                }}
                onShowModalFileUploadResults={(data) => setDataResults(data)}
                onUploadSuccess={(id) => {
                    history.push(`/products/inventory/processing/${id}`)
                }}
            />

            {
                <ModalInventoryError dataError={dataError} setDataError={() => setDataError(null)} />
            }

            {
                <ModalFileUploadResults dataResults={dataResults} onHide={() => {
                    setDataResults(null)
                    history.push(`/products/inventory/processing/${checklistidComplete}`)
                }} />
            }
        </div>
    )
};

export default memo(InventoryChecklistTable);