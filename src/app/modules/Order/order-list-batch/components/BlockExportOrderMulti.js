import { useMutation } from "@apollo/client";
import React, { Fragment, memo, useCallback, useState } from "react";
import { useIntl } from "react-intl";
import {
    Card,
    CardBody,
    CardHeader
} from "../../../../../_metronic/_partials/controls";
import coExportPackageViaFilter from "../../../../../graphql/mutate_coExportPackageViaFilter";
import LoadingDialog from "../../../ProductsStore/product-new/LoadingDialog";
import { useToasts } from "react-toast-notifications";
import _ from "lodash";
import AuthorizationWrapper from "../../../../../components/AuthorizationWrapper";

const BlockExportOrderMulti = ({ ids,setIds, total, whereCondition }) => {
    const { addToast } = useToasts();
    const { formatMessage } = useIntl();

    const [mutate, { loading: loadingCoExportPackageViaFilter, data: dataCoExportPackageViaFilter }] = useMutation(coExportPackageViaFilter, {
        awaitRefetchQueries: true,
        refetchQueries: ['scGetPackages']
    });

    const handleExportPackageViaFilter = async (type = 'single') => {
        let variables = {
            list_id: ids.map(_ord => _ord.id),
            search: {...whereCondition}
        }

        const {data} = await mutate({variables: {...(type == 'single' ? {..._.omit(variables, ['search'])} : {..._.omit(variables, ['list_id'])})}})
        if(data?.coExportPackageViaFilter?.success) {
            fetch(data?.coExportPackageViaFilter?.url).then((response) => {
                response.blob().then((blob) => {
                    const fileURL = window.URL.createObjectURL(blob) 
                    let alink = document.createElement("a");
                    alink.href = fileURL;
                    alink.download = data?.coExportPackageViaFilter?.file_name;
                    alink.click();
                });
            });
            setIds([])
        } else {
            addToast('Thất bại', { appearance: 'error' });
            setIds([])
        }
    }

    return (
        <Fragment>
        <LoadingDialog show={loadingCoExportPackageViaFilter} />

            <Card className="mb-4">
                <CardHeader title={formatMessage({ defaultMessage: "Xuất kiện hàng hàng loạt" })} />
                <CardBody>
                    <AuthorizationWrapper keys={['order_list_batch_export_package_multiple']}>
                    <div className="d-flex flex-column mb-8">
                        <span className="mb-2">{formatMessage({ defaultMessage: "Kiện hàng đã chọn" })}: {ids?.length}</span>
                        <button
                            type="button"
                            className="btn btn-primary"
                            disabled={ids?.length == 0}
                            onClick={async () => await handleExportPackageViaFilter()}
                        >
                            {formatMessage({ defaultMessage: "Xuất kiện hàng" })}
                        </button>
                    </div>
                    <div className="d-flex flex-column">
                        <span className="mb-2">{formatMessage({ defaultMessage: "Kiện hàng theo bộ lọc" })}: {total}</span>
                        <button
                            type="button"
                            className="btn btn-outline-primary btn-elevate"
                            disabled={total == 0}
                            onClick={async () => await handleExportPackageViaFilter('multi')}
                        >
                            {formatMessage({ defaultMessage: "Xuất kiện hàng theo bộ lọc" })}
                        </button>
                    </div>
                    </AuthorizationWrapper>
                </CardBody>
            </Card>
        </Fragment>
    );
};

export default memo(BlockExportOrderMulti);