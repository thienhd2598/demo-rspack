import React, { memo, useCallback, useMemo, useState, useEffect, Fragment, useRef } from "react";
import {
    Card,
    CardBody,
    CardHeader
} from "../../../../../_metronic/_partials/controls";
import ModalResult from "../dialog/ModalResult";
import mutate_coActionPackageViaFilter from "../../../../../graphql/mutate_coActionPackageViaFilter";
import LoadingDialog from "../../../ProductsStore/product-new/LoadingDialog";
import mutate_coReadyToShipPackage from '../../../../../graphql/mutate_coReadyToShipPackage';
import { useToasts } from "react-toast-notifications";
import { useMutation } from "@apollo/client";
import { useIntl } from "react-intl";
import { Modal, ProgressBar } from "react-bootstrap";
import AuthorizationWrapper from "../../../../../components/AuthorizationWrapper";

const BlockReadyToDeliver = ({ ids, setIds, total, whereCondition, refetch }) => {
    const [dataResults, setDataResults] = useState(null);

    const [totalOrder, setTotalOrder] = useState(0);

    const [totalOrderSuccess, setTotalOrderSuccess] = useState(0);

    const [totalOrderError, setTotalOrderError] = useState(0);

    const [totalInprogress, setTotalInprogress] = useState(0);

    const [loadingInprogress, setLoadingInprogress] = useState(false);

    const { addToast } = useToasts();
    const { formatMessage } = useIntl()

    const [mutate, { loading }] = useMutation(mutate_coReadyToShipPackage, {
        awaitRefetchQueries: true,
        refetchQueries: ['scGetPackages', 'coGetSmeWarehousesFromListPackage', 'coGetShippingCarrierFromListPackage', 'sme_warehouses']
    });

    const [coActionPackageViaFilter, { loading: loadingViaFilter }] = useMutation(mutate_coActionPackageViaFilter, {
        awaitRefetchQueries: true,
        // refetchQueries: ['scGetOrders'],
    });

    const coReadyToShipOrder = async () => {
        let variables = {
            list_package: ids?.map(_id => ({ package_id: _id?.id }))
        }

        let { data } = await mutate({
            variables: variables
        });
        if (data?.coReadyToShipPackage?.success == 0) {
            addToast(data?.coReadyToShipPackage?.message, { appearance: 'error' });
            return
        }

        if (!!data?.coReadyToShipPackage?.data) {
            setDataResults(data?.coReadyToShipPackage?.data);
            setIds([])
        } else {
            addToast(formatMessage({ defaultMessage: 'Sẵn sàng giao hàng loạt thất bại' }), { appearance: 'error' });
        }
    }

    const packageViaFilter = async (count, totalSuccess = 0, totalFail = 0, listFail = []) => {
        setTotalInprogress(count);
        setLoadingInprogress(true);

        if (count == 0) {
            refetch();
            setTotalInprogress(0);
            setLoadingInprogress(false);
            setTotalOrderSuccess(0);
            setTotalOrderError(0);
            setDataResults({
                total_success: totalSuccess,
                total_fail: totalFail,
                list_package_fail: listFail
            });
            return
        };

        const { data } = await coActionPackageViaFilter({
            variables: {
                action_type: 3,
                search: {
                    ...whereCondition,
                    exclude_package_ids: listFail?.map(item => item?.package_id)
                },
            }
        });

        if (!data?.coActionPackageViaFilter?.success) {
            refetch();
            setTotalInprogress(0);
            setLoadingInprogress(false);
            setTotalOrderSuccess(0);
            setTotalOrderError(0);
            setDataResults({
                total_success: totalSuccess,
                total_fail: totalFail,
                list_package_fail: listFail
            });
            return
        }

        if (data?.coActionPackageViaFilter) {
            totalSuccess += data?.coActionPackageViaFilter?.data?.total_success;
            totalFail += data?.coActionPackageViaFilter?.data?.total_fail;
            listFail = listFail?.concat(data?.coActionPackageViaFilter?.data?.list_package_fail);
            setTotalOrderSuccess(totalSuccess);
            setTotalOrderError(totalFail);

            packageViaFilter(
                data?.coActionPackageViaFilter?.total_remaining,
                totalSuccess,
                totalFail,
                listFail
            );
        } else {
            refetch();
            setTotalInprogress(0);
            setLoadingInprogress(false);
            setTotalOrderSuccess(0);
            setTotalOrderError(0);
            setDataResults({
                total_success: totalSuccess,
                total_fail: totalFail,
                list_package_fail: listFail
            });
        }
    };

    return (
        <Fragment>
            <LoadingDialog show={loading} />
            <Modal
                style={{ zIndex: 9999 }}
                show={loadingInprogress}
                aria-labelledby="example-modal-sizes-title-lg"
                centered
                backdrop={'true'}
                dialogClassName='width-fit-content'
            >
                <Modal.Header>
                    <Modal.Title>
                        {formatMessage({ defaultMessage: 'Sẵn sàng giao hàng loạt' })}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="overlay overlay-block cursor-default" style={{ width: 500, zIndex: 9999 }} >
                    <div className="mb-2">
                        <span>{formatMessage({ defaultMessage: 'Tổng số kiện cần xử lý: {count}' }, { count: total ?? 0 })}</span>
                    </div>
                    <div className="mb-2">
                        <span>{formatMessage({ defaultMessage: 'Tổng số kiện xử lý thành công:' })}</span>
                        <span className="ml-1 text-success">{totalOrderSuccess ?? 0}</span>
                    </div>
                    <div className="mb-4">
                        <span>{formatMessage({ defaultMessage: 'Tổng số kiện xử lý thất bại:' })}</span>
                        <span className="ml-1 text-danger">{totalOrderError ?? 0}</span>
                    </div>                    
                    <ProgressBar
                        style={{ height: 20 }}
                        className='fs-14 mb-6'
                        now={(((total - totalInprogress) / total) * 100).toFixed()}
                        label={`${(((total - totalInprogress) / total) * 100).toFixed()}%`}
                    />
                </Modal.Body>
            </Modal>
            <ModalResult
                totalOrder={totalOrder}
                dataResults={dataResults}
                type={'ready-to-deliver'}
                onHide={() => setDataResults(null)}
            />
            <Card className="mb-1 mt-4">
                <div style={{ padding: '0px', textAlign: 'center', fontSize: '15px', fontWeight: 'bold', display: 'flex', alignItems: 'center' }} className="card-header">
                    {formatMessage({ defaultMessage: 'Sẵn sàng giao hàng loạt' })}
                </div>
                <CardBody>
                    <div className="mb-2">
                        <span style={{ color: '#09dc72', fontSize: '11px' }}>{formatMessage({ defaultMessage: 'Hệ thống sẽ thực hiện tạo phiếu xuất kho và khấu trừ tồn kho khi thực hiện sẵn sàng giao' })}</span>
                    </div>
                    <AuthorizationWrapper keys={['order_list_batch_ready_to_ship_multiple']}>
                        <div className="d-flex flex-column mb-3">
                            <span className="mb-2">{formatMessage({ defaultMessage: 'Kiện hàng đã chọn' })}: {ids?.length}</span>
                            <button
                                type="button"
                                className="media-q btn btn-primary btn-elevate w-80 mt-2 mb-2"
                                disabled={ids?.length == 0}
                                onClick={(e) => {
                                    e.preventDefault();
                                    coReadyToShipOrder();
                                    setTotalOrder(ids?.length);
                                }}
                            >
                                {formatMessage({ defaultMessage: 'Sẵn sàng giao' })}
                            </button>
                        </div>
                        <div className="d-flex flex-column">
                            <span className="mb-2">{formatMessage({ defaultMessage: 'Số kiện theo bộ lọc' })}: {total}</span>
                            <button
                                type="button"
                                className="media-q btn btn-outline-primary btn-elevate w-80 mt-2 mb-2"
                                disabled={total == 0}
                                onClick={(e) => {
                                    e.preventDefault();
                                    setTotalOrder(total);
                                    packageViaFilter(total);
                                }}
                            >
                                {formatMessage({ defaultMessage: 'Sẵn sàng giao theo bộ lọc' })}
                            </button>
                        </div>
                    </AuthorizationWrapper>
                </CardBody>
            </Card>
        </Fragment>
    )
};

export default memo(BlockReadyToDeliver);