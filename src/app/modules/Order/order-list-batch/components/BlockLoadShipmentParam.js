import { useMutation } from "@apollo/client";
import React, { Fragment, memo } from "react";
import { useIntl } from "react-intl";
import { useToasts } from "react-toast-notifications";
import {
    Card,
    CardBody
} from "../../../../../_metronic/_partials/controls";
import mutate_coReloadOrderShipmentParam from "../../../../../graphql/mutate_coReloadOrderShipmentParam";
import LoadingDialog from "../../../ProductsStore/product-new/LoadingDialog";
import AuthorizationWrapper from "../../../../../components/AuthorizationWrapper";

const BlockLoadShipmentParam = ({ ids, orderHandleBatch, setIds }) => {
    const { addToast } = useToasts();
    const { formatMessage } = useIntl()

    const [coReloadOrderShipmentParam, { loading: loadingReloadOrderShipmentParam }] = useMutation(mutate_coReloadOrderShipmentParam, {
        awaitRefetchQueries: true,
        refetchQueries: ['scGetPackages', 'coGetSmeWarehousesFromListPackage', 'coGetShippingCarrierFromListPackage']
    });

    const onGetShipmentLabel = async () => {
        let variables = {
            list_sc_order_id: ids?.map(item => item?.order?.id),
        }

        let { data } = await coReloadOrderShipmentParam({
            variables: variables
        });

        setIds([]);
        if (!!data?.coReloadOrderShipmentParam?.success) {
            addToast(formatMessage({ defaultMessage: 'Hệ thống đang thực hiện lấy thông tin lấy hàng từ sàn. Vui lòng chờ trong ít phút sau đó tải lại trang' }), { appearance: 'success' });
        } else {
            addToast(formatMessage({ defaultMessage: 'Xử lý hàng hàng loạt thất bại' }), { appearance: 'error' });
        }
    }

    return (
        <Fragment>
            <LoadingDialog show={loadingReloadOrderShipmentParam} />
            <Card className="mb-1">
                <div style={{ padding: '0px', textAlign: 'center', fontSize: '15px', fontWeight: 'bold', display: 'flex', alignItems: 'center' }} className="card-header">
                    {formatMessage({ defaultMessage: 'Xử lý hàng hàng loạt' })}
                </div>
                <CardBody>
                    <div className="mb-6">
                        <span className="text-primary">
                            {formatMessage({ defaultMessage: 'Những kiện hàng chưa được phân bổ ĐVVC sẽ không có thông tin lấy hàng' })}
                        </span>
                    </div>
                    <AuthorizationWrapper keys={['order_list_batch_reload_shipment']}>
                        <div className="d-flex flex-column">
                            <span className="mb-2">{formatMessage({ defaultMessage: 'Kiện hàng đã chọn' })}: {ids?.length}</span>
                            <button
                                type="button"
                                className="btn btn-primary btn-elevate w-100 mb-2"
                                disabled={ids?.length == 0}
                                onClick={(e) => {
                                    e.preventDefault();
                                    onGetShipmentLabel();
                                }}
                            >
                                {formatMessage({ defaultMessage: 'Tải thông tin lấy hàng' })}
                            </button>
                        </div>
                    </AuthorizationWrapper>
                </CardBody>
            </Card>
        </Fragment>
    )
};

export default memo(BlockLoadShipmentParam);