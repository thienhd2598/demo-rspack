import { useMutation } from "@apollo/client";
import React, { Fragment, memo, useState } from "react";
import { useIntl } from "react-intl";
import { useToasts } from "react-toast-notifications";
import {
    Card,
    CardBody
} from "../../../../../_metronic/_partials/controls";
import mutate_getShipmentLabel from "../../../../../graphql/mutate_getShipmentLabel";
import LoadingDialog from "../../../ProductsStore/product-new/LoadingDialog";

const BlockLoadDocument = ({ ids, orderHandleBatch, setIds }) => {
    const { addToast } = useToasts();
    const { formatMessage } = useIntl()
    
    const [getShipmentLabel, { loading: loadingGetShipmentLabel }] = useMutation(mutate_getShipmentLabel, {
        awaitRefetchQueries: true,
        refetchQueries: ['scGetPackages', 'coGetSmeWarehousesFromListPackage', 'coGetShippingCarrierFromListPackage']
    });    

    const onGetShipmentLabel = async () => {
        let variables = {
            list_package_id: ids?.map(_id => _id?.id),
            connector_channel_code: orderHandleBatch?.connector_channel_code,
            store_id: orderHandleBatch?.store_id
        }

        let { data } = await getShipmentLabel({
            variables: variables
        });
           
        setIds([]);
        if (!!data?.getShipmentLabel?.success) {
            addToast(formatMessage({ defaultMessage: 'Hệ thống đang thực hiện lấy vận đơn từ sàn. Vui lòng chờ trong ít phút sau đó tải lại trang' }), { appearance: 'success' });
        } else {
            addToast(formatMessage({ defaultMessage: 'Xử lý hàng hàng loạt thất bại' }), { appearance: 'error' });
        }
    }

    return (
        <Fragment>
            <LoadingDialog show={loadingGetShipmentLabel} />
            <Card className="mb-1">
                <div style={{ padding: '0px', textAlign: 'center', fontSize: '15px', fontWeight: 'bold', display: 'flex', alignItems: 'center' }} className="card-header">
                    {formatMessage({ defaultMessage: 'Xử lý hàng hàng loạt' })}
                </div>
                <CardBody>
                    <div className="mb-6">
                        <span className="text-primary">
                            {formatMessage({ defaultMessage: 'Những đơn hàng không có vận đơn sẽ không thực hiện in vận đơn được' })}
                        </span>
                    </div>
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
                            {formatMessage({ defaultMessage: 'Tải vận đơn' })}
                        </button>
                    </div>
                </CardBody>
            </Card>
        </Fragment>
    )
};

export default memo(BlockLoadDocument);