import React, { memo,useState, Fragment } from "react";
import {
    Card,
    CardBody,
    CardHeader
} from "../../../../../_metronic/_partials/controls";
import _ from "lodash";
import ModalResultHandlingInventory from "../dialog/ModalResultHandlingInventory";
import LoadingDialog from "../../../ProductsStore/product-new/LoadingDialog";
import mutate_coRetryWarehouseActionMultiPackage from '../../../../../graphql/mutate_coRetryWarehouseActionMultiPackage';
import { useToasts } from "react-toast-notifications";
import { useMutation } from "@apollo/client";
import mutate_coRetryWarehousePackageViaFilter from "../../../../../graphql/mutate_coRetryWarehousePackageViaFilter";
import { useIntl } from "react-intl";
import AuthorizationWrapper from "../../../../../components/AuthorizationWrapper";
const HandlingInventory = ({ ids, total, whereCondition, status, setIds }) => {
    const [dataResults, setDataResults] = useState(null);
    const [totalOrder, setTotalOrder] = useState(0);
    const { addToast } = useToasts();
    const {formatMessage} = useIntl()

    const [retryWarehousePackageViaFilter, { loading }] = useMutation(mutate_coRetryWarehousePackageViaFilter, {
        awaitRefetchQueries: true,
        refetchQueries:['scGetPackages', 'coGetSmeWarehousesFromListPackage', 'coGetShippingCarrierFromListPackage']
    });
    
    const [retryWarehouseActionMultiPackage, { loading: loadingActionMultiPackage }] = useMutation(mutate_coRetryWarehouseActionMultiPackage, {
        awaitRefetchQueries: true,
        refetchQueries: ['scGetPackages', 'coGetSmeWarehousesFromListPackage', 'coGetShippingCarrierFromListPackage']
    });

    const coRetryWarehouseActionMultiPackage = async () => {
        let variables = {
            list_package_id: ids?.map(_id => _id?.id )
        }

        let { data } = await retryWarehouseActionMultiPackage({
            variables: variables
        });
        
        setIds([]);
        if (data?.coRetryWarehouseActionMultiPackage?.success == 0) {
            addToast(data?.coRetryWarehouseActionMultiPackage?.message, { appearance: 'error' });
            return
        }

        if (!!data?.coRetryWarehouseActionMultiPackage) {
            setDataResults(data?.coRetryWarehouseActionMultiPackage);
        } else {
            addToast(formatMessage({defaultMessage: 'Xử lý hàng hàng loạt thất bại'}), { appearance: 'error' });
        }
    }

    const coRetryWarehousePackageViaFilter = async () => {
        let variables = {
            search: whereCondition
        }

        let { data } = await retryWarehousePackageViaFilter({ variables });

        setIds([]);
        if (data?.coRetryWarehousePackageViaFilter?.success == 0) {
            addToast(data?.coRetryWarehousePackageViaFilter?.message, { appearance: 'error' });
            return
        }

        if (data?.coRetryWarehousePackageViaFilter) {
            setDataResults(data?.coRetryWarehousePackageViaFilter);            
        } else {
            addToast(formatMessage({defaultMessage: 'Xử lý hàng hàng loạt thất bại'}), { appearance: 'error' });
        }        
    }

    return (
        <Fragment>
            <LoadingDialog show={loadingActionMultiPackage} />
            <ModalResultHandlingInventory
                totalOrder={totalOrder}
                dataResults={dataResults}
                onHide={() => setDataResults(null)}
            />
            <Card className="mb-1">
                <div style={{padding: '0px', textAlign: 'center', fontSize: '15px', fontWeight: 'bold', display: 'flex', alignItems: 'center' }} className="card-header">
                {formatMessage({defaultMessage: 'Xử lý hàng hàng loạt'})}
                </div>
                <CardBody>
                    <div className="mb-2">
                        <span style={{ color: '#FF5629', fontSize: '11px' }}>{formatMessage({defaultMessage: 'Với những sản phẩm thiếu hàng sẽ cần thực hiện nhập kho để đảm bảo đủ tồn cho đơn hàng'})}</span>
                    </div>
                    <AuthorizationWrapper keys={['order_list_batch_retry_package_multiple']}>
                        <div className="d-flex flex-column mb-3">
                            <span className="mb-2">{formatMessage({defaultMessage: 'Kiện hàng đã chọn'})}: {ids?.length}</span>
                            <button
                                type="button"
                                className="media-q btn btn-primary btn-elevate w-80 mt-2 mb-2"
                                disabled={ids?.length == 0}
                                onClick={(e) => { 
                                    e.preventDefault();
                                    coRetryWarehouseActionMultiPackage();
                                    setTotalOrder(ids?.length);
                                }}
                            >
                                {formatMessage({defaultMessage: 'Xử lý tồn'})}
                            </button>
                        </div>
                        <div className="d-flex flex-column">
                            <span className="mb-2">{formatMessage({defaultMessage: 'Số kiện theo bộ lọc'})}: {total}</span>
                            <button
                                type="button"
                                className="media-q btn btn-outline-primary btn-elevate w-80 mt-2 mb-2"
                                disabled={total == 0}
                                onClick={(e) => {
                                    e.preventDefault();
                                    setTotalOrder(total);
                                    coRetryWarehousePackageViaFilter();
                                }}
                            >
                                {formatMessage({defaultMessage: 'Xử lý tồn theo bộ lọc'})}
                            </button>
                        </div>
                    </AuthorizationWrapper>
                </CardBody>
            </Card>
        </Fragment>
    )
};

export default memo(HandlingInventory);