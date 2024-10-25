import React, { memo, useMemo, useState } from "react";
import { CardBody, Checkbox } from "../../../../../_metronic/_partials/controls";
import clsx from "clsx";
import { useIntl } from "react-intl";
import Select from 'react-select';
import { usePickupGoodsContext } from "../../context/PickupGoodsContext";
import query_scGetPackages from "../../../../../graphql/query_scGetPackages";
import { useQuery } from "@apollo/client";
import query_scGetPackagesSmartFFM from "../../../../../graphql/query_scGetPackagesFFM";
import { OPTIONS_ORDER_BY } from "../../SmartFulfillmentHelper";
import PackageRow from "./PackageRow";
import { queryGetSmeProductVariants } from "../../../Order/OrderUIHelpers";
import AddSmeNoteOrderDialog from "../../../Order/order-list/AddSmeNoteOrderDialog";
import PaginationModal from "../../../../../components/PaginationModal";
import dayjs from "dayjs";
import { useFormikContext } from "formik";

const SectionTable = () => {
    const { formatMessage } = useIntl();
    const { filtersPackage, ids, setIds, isLoadPackages, setIsLoadPackages, dataScWareHouse, optionsChannel, optionsStore, optionsSmeWarehouse } = usePickupGoodsContext();
    const { values } = useFormikContext();
    const [dataSmeNote, setDataSmeNote] = useState(null);
    const [openModal, setOpenModal] = useState(null);
    const [filtersTable, setFiltersTable] = useState({
        page: 1,
        limit: 25,
        sort: 'desc',
        order_by: 'order_at'
    });
    const [smeVariants, setSmeVariants] = useState([]);
    const [searchParams, setSearchParams] = useState([]);
    const [loadingSmeVariant, setLoadingSmeVariant] = useState(false);

    useMemo(() => {
        if (!isLoadPackages) return;
        let search = {};

        if (!!values?.smeWarehouse) {
            search = { ...search, warehouse_id: values?.smeWarehouse }
        }

        (filtersPackage || []).forEach(pk => {
            if (!pk?.valueActive) return;
            if (pk?.type == 'range_time') {
                search = {
                    ...search,
                    range_time: pk?.valueActive?.map(item => dayjs(item).unix())
                }
            }

            if (pk?.type == 'shipping_unit') {
                search = {
                    ...search,
                    shipping_unit: pk?.valueActive?.map(item => item?.value)
                }
            }

            if (pk?.type == 'channel') {
                search = {
                    ...search,
                    connector_channel_code: pk?.valueActive?.map(item => item?.value)
                }
            }

            if (pk?.type == 'store') {
                search = {
                    ...search,
                    list_store: pk?.valueActive?.map(item => item?.value)
                }
            }

            if (pk?.type == 'ref_order_id') {
                search = {
                    ...search,                    
                    ref_order_id: pk?.valueActive
                }
            }

            if (pk?.type == 'tracking_number') {
                search = {
                    ...search,                    
                    tracking_number: pk?.valueActive
                }
            }

            if (pk?.type == 'processing_deadline') {
                search = {
                    ...search,                    
                    processing_deadline: pk?.valueActive?.value
                }
            }

            if (pk?.type == 'type_parcel') {
                search = {
                    ...search,                    
                    type_parcel: [pk?.valueActive?.value]
                }
            }
        });

        setSearchParams(search)
    }, [filtersPackage, values?.sme_warehouse, isLoadPackages]);    

    const { data, loading, error, refetch } = useQuery(query_scGetPackagesSmartFFM, {
        variables: {
            page: +filtersTable?.page,
            per_page: +filtersTable?.limit,
            order_by: filtersTable?.order_by,
            order_by_type: filtersTable?.sort,
            search: {
                is_connected: 1,
                is_smart_fulfillment: 1,
                warehouse_filer: 2,
                ...searchParams
            }
        },
        fetchPolicy: "cache-and-network",
        onCompleted: async (data) => {
            setIsLoadPackages(false);
            setLoadingSmeVariant(true);
            const smeVariants = await queryGetSmeProductVariants(data?.scGetPackages?.flatMap(order => order?.orderItems?.map(item => item?.sme_variant_id)));

            setLoadingSmeVariant(false);
            setSmeVariants(smeVariants);
        }
    });

    useMemo(() => refetch(), [isLoadPackages]);    

    const isSelectAll = ids?.length > 0 &&
        ids?.filter((x) => data?.scGetPackages?.some((order) => order.id === x.id))?.length == data?.scGetPackages?.length;

    return (
        <CardBody>
            <AddSmeNoteOrderDialog
                dataSmeNote={dataSmeNote}
                onHide={() => setDataSmeNote()}
            />
            <div className='row d-flex align-items-center py-4 mb-5' style={{ position: 'sticky', top: 45, background: '#fff', zIndex: 2 }}>
                <div className="col-4 d-flex align-items-center">
                    <div className="mr-4 text-primary">
                        {formatMessage({ defaultMessage: 'Đã chọn: {count} kiện hàng' }, { count: ids?.length })}
                    </div>
                </div>
                <div className="col-8 d-flex justify-content-end align-items-center">
                    <div className='mr-3' style={{ width: '130px', textAlign: 'right' }}>
                        {formatMessage({ defaultMessage: 'Sắp xếp theo' })}:
                    </div>
                    <div style={{ width: '250px' }} className="mr-3">
                        <Select
                            className="w-100"
                            value={OPTIONS_ORDER_BY?.find(item => item?.value == filtersTable?.order_by)}
                            options={OPTIONS_ORDER_BY}
                            onChange={value => {
                                setFiltersTable(prev => ({
                                    ...prev,
                                    order_by: value?.value
                                }));
                            }}
                        />
                    </div>
                    <div
                        className="justify-content-center d-flex align-items-center mr-3"
                        onClick={() => {
                            setFiltersTable(prev => ({
                                ...prev, sort: 'desc'
                            }))
                        }}
                        style={{ height: '38px', width: '38px', cursor: 'pointer', border: filtersTable?.sort == 'desc' ? '1px solid #FE5629' : '1px solid #D9D9D9' }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-sort-down" viewBox="0 0 16 16">
                            <path d="M3.5 2.5a.5.5 0 0 0-1 0v8.793l-1.146-1.147a.5.5 0 0 0-.708.708l2 1.999.007.007a.497.497 0 0 0 .7-.006l2-2a.5.5 0 0 0-.707-.708L3.5 11.293V2.5zm3.5 1a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zM7.5 6a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5zm0 3a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1h-3zm0 3a.5.5 0 0 0 0 1h1a.5.5 0 0 0 0-1h-1z" />
                        </svg>
                    </div>

                    <div
                        className="justify-content-center d-flex align-items-center"
                        onClick={() => {
                            setFiltersTable(prev => ({
                                ...prev, sort: 'asc'
                            }))
                        }}
                        style={{ height: '38px', width: '38px', cursor: 'pointer', border: filtersTable?.sort == 'asc' ? '1px solid #FE5629' : '1px solid #D9D9D9' }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-sort-up" viewBox="0 0 16 16">
                            <path d="M3.5 12.5a.5.5 0 0 1-1 0V3.707L1.354 4.854a.5.5 0 1 1-.708-.708l2-1.999.007-.007a.498.498 0 0 1 .7.006l2 2a.5.5 0 1 1-.707.708L3.5 3.707V12.5zm3.5-9a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zM7.5 6a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5zm0 3a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1h-3zm0 3a.5.5 0 0 0 0 1h1a.5.5 0 0 0 0-1h-1z" />
                        </svg>
                    </div>
                </div>
            </div>

            <div
                style={{
                    boxShadow: "inset -1px 0px 0px #D9D9D9, inset 1px 0px 0px #D9D9D9, inset 0px 1px 0px #D9D9D9, inset 0px -1px 0px #D9D9D9",
                    borderBottomLeftRadius: 6,
                    borderBottomRightRadius: 6,
                    borderTopRightRadius: 6,
                    minHeight: 300,
                }}
            >
                <table className="table table-borderless product-list table-vertical-center fixed mb-0">
                    <thead
                        style={{ position: "sticky", top: 106, background: "#F3F6F9", fontWeight: "bold", fontSize: "14px", borderBottom: "1px solid gray", borderLeft: "1px solid #d9d9d9", borderRight: "1px solid #d9d9d9" }}
                    >
                        <tr className="font-size-lg">
                            <th style={{ fontSize: "14px" }}>
                                <div className="d-flex">
                                    <Checkbox
                                        size="checkbox-md"
                                        inputProps={{ "aria-label": "checkbox", }}
                                        isSelected={isSelectAll}
                                        onChange={(e) => {
                                            if (isSelectAll) {
                                                setIds(ids.filter((x) => !data?.scGetPackages.some((order) => order.id === x.id)));
                                            } else {
                                                const tempArray = [...ids];
                                                (data?.scGetPackages || []).forEach((_order) => {
                                                    if (_order && !ids.some((item) => item.id === _order.id)) {
                                                        tempArray.push(_order);
                                                    }
                                                });
                                                setIds(tempArray);
                                            }
                                        }}
                                    />
                                    <span className="mx-4">{formatMessage({ defaultMessage: 'Thông tin sản phẩm' })}</span>
                                </div>
                            </th>
                            <th style={{ fontSize: "14px", width: 150 }}>{formatMessage({ defaultMessage: 'Kho xử lý' })}</th>
                            <th style={{ fontSize: "14px", width: 160 }}>{formatMessage({ defaultMessage: 'Xử lý' })}</th>
                            <th style={{ fontSize: "14px", width: 140 }}>{formatMessage({ defaultMessage: 'Vận chuyển' })}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && <div className="text-center w-100 mt-20" style={{ position: "absolute" }}>
                            <span className="ml-3 spinner spinner-primary"></span>
                        </div>}
                        {!!error && !loading && <div className="w-100 text-center mt-8" style={{ position: "absolute" }}>
                            <div className="d-flex flex-column justify-content-center align-items-center">
                                <i className="far fa-times-circle text-danger" style={{ fontSize: 48, marginBottom: 8 }}></i>
                                <p className="mb-6">{formatMessage({ defaultMessage: 'Xảy ra lỗi trong quá trình tải dữ liệu' })}</p>
                                <button className="btn btn-primary btn-elevate" style={{ width: 100 }}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        refetch();
                                    }}
                                >
                                    {formatMessage({ defaultMessage: 'Tải lại' })}
                                </button>
                            </div>
                        </div>}
                        {!loading && !error && data?.scGetPackages?.map((orderPack, index) => (
                            <PackageRow
                                key={`order-${index}`}
                                ids={ids}
                                order={orderPack}
                                optionsChannel={optionsChannel}
                                optionsStore={optionsStore}
                                setIds={setIds}
                                onSetSmeNote={(edit = false, isView = false) => setDataSmeNote({
                                    id: orderPack?.order?.id,
                                    smeNote: orderPack?.order?.sme_note,
                                    edit,
                                    isView
                                })}
                                smeVariants={smeVariants}
                                loadingSmeVariant={loadingSmeVariant}
                                dataSmeWarehouse={optionsSmeWarehouse}
                                dataScWareHouse={dataScWareHouse}
                                isSelected={ids?.some((_id) => _id.id == orderPack.id)}
                            />
                        ))}
                    </tbody>
                </table>
                <div className="ml-4">
                {!error && !loading && <PaginationModal
                    page={filtersTable?.page}
                    limit={filtersTable?.limit}
                    onPanigate={(page) => setFiltersTable(prev => ({ ...prev, page }))}
                    onSizePage={(limit) => setFiltersTable(prev => ({ ...prev, page: 1, limit }))}
                    totalPage={Math.ceil(data?.scPackageAggregate?.count / filtersTable?.limit)}
                    totalRecord={data?.scPackageAggregate?.count || 0}
                    count={data?.scGetPackages?.length}
                    emptyTitle={formatMessage({ defaultMessage: 'Chưa có dữ liệu kiện hàng' })}
                />}
                </div>
            </div>
        </CardBody>
    )
}

export default memo(SectionTable);