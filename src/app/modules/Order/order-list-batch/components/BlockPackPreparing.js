import { useMutation } from "@apollo/client";
import React, { Fragment, memo, useCallback, useState } from "react";
import { useIntl } from "react-intl";
import {
    Card,
    CardBody,
    CardHeader
} from "../../../../../_metronic/_partials/controls";
import mutate_coActionPackageViaFilter from "../../../../../graphql/mutate_coActionPackageViaFilter";
import ModalInprogress from "../dialog/ModalInprogress";
import ModalPackPreparingBatch from "../dialog/ModalPackPreparingBatch";
import ModalResult from "../dialog/ModalResult";
import AuthorizationWrapper from "../../../../../components/AuthorizationWrapper";

const BlockPackPreparing = ({ ids, total, whereCondition, orderHandleBatch, refetch }) => {
    const [action, setAction] = useState('');
    const [dataResults, setDataResults] = useState(null);
    const [totalOrder, setTotalOrder] = useState(0);
    const [totalOrderSuccess, setTotalOrderSuccess] = useState(0);
    const [totalOrderError, setTotalOrderError] = useState(0);
    const [totalInprogress, setTotalInprogress] = useState(0);
    const [loadingInprogress, setLoadingInprogress] = useState(false);
    const { formatMessage } = useIntl();
    console.log('orderHandleBatch', orderHandleBatch)
    const [coActionPackageViaFilter] = useMutation(mutate_coActionPackageViaFilter, {
        awaitRefetchQueries: true,
    });

    const onSetDataResult = useCallback((result) => {
        refetch();
        setTotalInprogress(0);
        setLoadingInprogress(false);
        setTotalOrderSuccess(0);
        setTotalOrderError(0);
        setDataResults(result);
    }, []);

    const onActionPackageViaFilter = async (variables, count, totalSuccess = 0, totalFail = 0, listFail = []) => {
        const result = {
            total_success: totalSuccess,
            total_fail: totalFail,
            list_package_fail: listFail
        };
        try {
            setTotalInprogress(count);
            setLoadingInprogress(true);

            if (count == 0) {
                onSetDataResult(result);
                return
            };

            const { data } = await coActionPackageViaFilter({
                variables: {
                    ...variables,
                    search: {
                        ...variables?.search,
                        exclude_package_ids: listFail?.map(item => item?.package_id)
                    }
                }
            });
            if (!data?.coActionPackageViaFilter?.success) {
                onSetDataResult(result);
                return
            }

            if (data?.coActionPackageViaFilter) {
                totalSuccess += data?.coActionPackageViaFilter?.data?.total_success;
                totalFail += data?.coActionPackageViaFilter?.data?.total_fail;
                listFail = listFail?.concat(data?.coActionPackageViaFilter?.data?.list_package_fail);
                setTotalOrderSuccess(totalSuccess);
                setTotalOrderError(totalFail);

                onActionPackageViaFilter(
                    variables,
                    data?.coActionPackageViaFilter?.total_remaining,
                    totalSuccess,
                    totalFail,
                    listFail
                );
            } else {
                onSetDataResult(result);
            }
        } catch (error) {
            onSetDataResult(result);
        }
    };

    return (
        <Fragment>
            <ModalPackPreparingBatch
                action={action}
                ids={ids}
                dataOrder={{}}
                total={total}
                orderHandleBatch={orderHandleBatch}
                whereCondition={whereCondition}
                onActionPackageViaFilter={variables => onActionPackageViaFilter(variables, total)}
                onHide={() => setAction('')}
            />

            <ModalInprogress
                type="pack-prepare"
                show={loadingInprogress}
                total={total}
                totalInprogress={totalInprogress}
                totalOrderError={totalOrderError}
                totalOrderSuccess={totalOrderSuccess}
            />            

            <ModalResult
                totalOrder={totalOrder}
                dataResults={dataResults}
                type={'pack-prepare'}
                onHide={() => setDataResults(null)}
            />

            <Card className="mb-4">
                <CardHeader title={formatMessage({ defaultMessage: "Chuẩn bị hàng hàng loạt" })} />
                <CardBody>
                    <AuthorizationWrapper keys={['order_list_batch_order_prepare_multiple']}>
                        <div className="d-flex flex-column mb-8">
                            <span className="mb-2">{formatMessage({ defaultMessage: "Kiện hàng đã chọn" })}: {ids?.length}</span>
                            <button
                                type="button"
                                className="btn btn-primary"
                                disabled={ids?.length == 0}
                                onClick={() => {
                                    setAction('mutiple');
                                }}
                            >
                                {formatMessage({ defaultMessage: "Chuẩn bị hàng" })}
                            </button>
                        </div>
                        <div className="d-flex flex-column">
                            <span className="mb-2">{formatMessage({ defaultMessage: "Số kiện theo bộ lọc" })}: {total}</span>
                            <button
                                type="button"
                                className="btn btn-outline-primary btn-elevate"
                                disabled={total == 0}
                                onClick={() => {
                                    setAction('mutipleViaFilter');
                                }}
                            >
                                {formatMessage({ defaultMessage: "Chuẩn bị hàng theo bộ lọc" })}
                            </button>
                        </div>
                    </AuthorizationWrapper>
                </CardBody>
            </Card>
        </Fragment>
    );
};

export default memo(BlockPackPreparing);