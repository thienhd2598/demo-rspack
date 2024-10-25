import { useQuery } from "@apollo/client";
import clsx from 'clsx';
import React, { memo, useCallback, useMemo, useRef, useState } from 'react';
import { Modal } from 'react-bootstrap';
import { useIntl } from 'react-intl';
import query_sfGetListPackageReceive from '../../../../../graphql/query_sfGetListPackageReceive';
import Select from 'react-select';
import Pagination from "../../../../../components/PaginationModal";
import { OPTIONS_SEARCH_SELECT_RECEIVED } from "../OrderFulfillmentHelper";
import { toAbsoluteUrl } from "../../../../../_metronic/_helpers";

const LIMIT_PACKAGES = 10;
const INITIAL_SEARCH = { value: '', type: 'tracking_number' };

const ModalSelectPackage = ({
    show,
    onHide,
    onSelectPackage,
    packages,
    stores
}) => {
    const { formatMessage } = useIntl();
    const [page, setPage] = useState(1);
    const refInput = useRef(null);
    const [search, setSearch] = useState(INITIAL_SEARCH);

    const { data, loading } = useQuery(query_sfGetListPackageReceive, {
        variables: {
            keyword: search?.value,
            type_keyword: search?.type,
            page,
            per_page: LIMIT_PACKAGES,
        },
        fetchPolicy: 'cache-and-network'
    });

    let totalRecord = data?.sfGetListPackageReceive?.total || 0;
    let totalPage = Math.ceil(totalRecord / LIMIT_PACKAGES);

    const onResetModal = useCallback(
        () => {
            setSearch(INITIAL_SEARCH);
            setPage(1);
        }, []
    );

    useMemo(
        () => !show && onResetModal(),
        [show]
    );

    const placeholderSelect = useMemo(
        () => {
            if (search?.type == 'tracking_number') {
                return formatMessage({ defaultMessage: 'Nhập mã vận đơn' })
            }
            if (search?.type == 'ref_order_id') {
                return formatMessage({ defaultMessage: 'Nhập mã đơn hàng' })
            }
            if (search?.type == 'ref_return_id') {
                return formatMessage({ defaultMessage: 'Nhập mã trả hàng' })
            }
            if (search?.type == 'return_tracking_number') {
                return formatMessage({ defaultMessage: 'Nhập mã vận đơn trả hàng' })
            }
        }, [search?.type]
    );

    const onCheckErrorPackage = useCallback(
        (item) => {
            // Case 1: Exist in session packages            
            const isExistPackage = packages?.some(pck => {
                if (pck?.isManual) {
                    if (!!pck?.data) {
                        return pck?.code == search || (pck?.data?.object_id == item?.object_id && pck?.data?.object_type == item?.object_type)
                    }

                    return pck?.code == search
                }

                return pck?.data?.object_id == item?.object_id && pck?.data?.object_type == item?.object_type
            });
            if (isExistPackage) {
                return formatMessage({ defaultMessage: "Kiện hàng đã được quét" })
            }

            // Case 2: Exist in session received
            if (!!item?.sf_received_code) {
                return formatMessage({ defaultMessage: "Kiện hàng được thêm vào phiên nhận “{code}”", }, { code: item?.sf_received_code });
            }

            // Case 3: Has import
            if (!!item?.has_import_history) {
                return formatMessage({ defaultMessage: 'Kiện hàng đã được xử lý trả hàng' });
            }

            return null;
        }, [packages]
    );

    return (
        <Modal
            show={show}
            aria-labelledby="example-modal-sizes-title-sm"
            centered
            onHide={onHide}
            backdrop={true}
            dialogClassName={'body-dialog-connect'}
        >
            <Modal.Body className="overlay overlay-block cursor-default" style={{ padding: 0 }}>
                <div className="form-group mb-0">
                    <div className="text-center" style={{ fontWeight: 'bold', fontSize: 16, margin: '1rem 2rem 1rem 2rem' }}>
                        {formatMessage({ defaultMessage: 'Chọn kiện' })}
                    </div>
                    <svg
                        className="bi bi-x-lg cursor-pointer" viewBox="0 0 18 18"
                        xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor"
                        style={{ position: 'absolute', top: 15, right: 15 }}
                        onClick={onHide}
                    >
                        <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z" />
                    </svg>
                    <div style={{ margin: '0rem 2rem 1rem 2rem' }}>
                        <div className="row w-100">
                            <div className="col-4 pr-0">
                                <Select
                                    className="w-100 custom-select-order flex-4"
                                    options={OPTIONS_SEARCH_SELECT_RECEIVED}
                                    style={{ borderRadius: 0 }}
                                    value={OPTIONS_SEARCH_SELECT_RECEIVED?.find(op => op?.value == search?.type)}
                                    onChange={(value) => {
                                        setSearch(prev => ({ ...prev, type: value?.value }));
                                    }}
                                    formatOptionLabel={(option, labelMeta) => {
                                        return <div>{option.label}</div>;
                                    }}
                                />
                            </div>
                            <div className="col-8 px-0">
                                <div className="input-icon pl-0 flex-6">
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder={placeholderSelect}
                                        style={{ height: 37, borderRadius: 0, paddingLeft: "50px", fontSize: "15px" }}
                                        onKeyDown={(e) => {
                                            if (e.keyCode == 13) {
                                                const valueSearch = e.target.value;
                                                setPage(1);
                                                setSearch(prev => ({ ...prev, value: valueSearch }));
                                            }
                                        }}
                                    />
                                    <span><i className="flaticon2-search-1 icon-md ml-6"></i></span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div
                        className='pt-3'
                        style={{ height: 400, overflowY: 'auto' }}
                    >
                        {loading && <div className='text-center w-100 mt-4' style={{ position: 'absolute' }} >
                            <span className="ml-3 spinner spinner-primary"></span>
                        </div>}
                        {(!data?.sfGetListPackageReceive?.list_record || data?.sfGetListPackageReceive?.list_record?.length == 0) && <div className="d-flex justify-content-center align-items-center" style={{ marginTop: '15%' }}>
                            <div className='d-flex flex-column align-items-center justify-content-center'>
                                <img src={toAbsoluteUrl("/media/empty.png")} alt="image" width={80} />
                                <span className='mt-4'>{formatMessage({ defaultMessage: 'Chưa có kiện hàng nào' })}</span>
                            </div></div>}
                        {data?.sfGetListPackageReceive?.list_record?.map((item, index) => {
                            const store = stores?.find(st => st?.value == item?.store_id);
                            const errorPackage = onCheckErrorPackage(item);

                            return (
                                <div
                                    style={data?.sfGetListPackageReceive?.length - 1 == index ? { padding: '0rem 1rem 0.5rem 1rem' } : { padding: '0rem 1rem 0.5rem 1rem' }}
                                    key={`choose-package-${index}`}
                                >
                                    <div className='row' style={{ margin: '0rem 0.5rem', borderBottom: '1px solid #dbdbdb', alignItems: 'center' }}>
                                        <div className='col-10 d-flex flex-column'>
                                            <div className='mb-1 d-flex align-items-center'>
                                                <img
                                                    style={{ width: 16, height: 16 }}
                                                    src={store?.logo}
                                                    className="mr-2"
                                                />
                                                <span>{store?.label}</span>
                                            </div>
                                            <span className="mb-1">
                                                {formatMessage({ defaultMessage: `{name}: {code}` }, {
                                                    name: item?.object_type == 3 ? 'Mã trả hàng' : 'Mã đơn hàng',
                                                    code: item?.object_ref_id
                                                })}
                                            </span>
                                            <span className={clsx(!!errorPackage && "mb-1", !errorPackage && "mb-2")}>
                                                {formatMessage({ defaultMessage: `{name}: {code}` }, {
                                                    name: item?.object_type == 3 ? 'Mã vận đơn trả hàng' : 'Mã vận đơn',
                                                    code: item?.object_tracking_number
                                                })}
                                            </span>
                                            {!!errorPackage && <span className="mb-2 text-danger">{errorPackage}</span>}
                                        </div>
                                        <div className="col-2 d-flex justify-content-end">
                                            <span
                                                className={clsx("text-right",
                                                    !errorPackage && "text-primary cursor-pointer",
                                                    !!errorPackage && "text-secondary-custom cursor-not-allowed"
                                                )}
                                                onClick={e => {
                                                    e.preventDefault();
                                                    if (!!errorPackage) return;
                                                    onSelectPackage({
                                                        code: item?.keyword,
                                                        isManual: true,
                                                        data: item
                                                    });
                                                    onHide();
                                                }}
                                            >
                                                {formatMessage({ defaultMessage: 'Chọn kiện' })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                    <div className='m-2'>
                        <Pagination
                            page={page}
                            totalPage={totalPage}
                            loading={loading}
                            limit={LIMIT_PACKAGES}
                            totalRecord={totalRecord}
                            count={data?.sfGetListPackageReceive?.list_record?.length}
                            onPanigate={(page) => setPage(page)}
                            isShowEmpty={false}
                            emptyTitle={formatMessage({ defaultMessage: 'Chưa có kiện hàng nào' })}
                        />
                    </div>
                </div>
            </Modal.Body>
        </Modal>
    )
}

export default memo(ModalSelectPackage);