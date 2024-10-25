import { useMutation } from "@apollo/client";
import React, { Fragment, memo, useCallback, useState } from "react";
import { useIntl } from "react-intl";
import { useToasts } from "react-toast-notifications";
import mutate_SfDeleteReceivedPackage from "../../../../../graphql/mutate_sfDeleteReceivedPackage";
import LoadingDialog from "../../../FrameImage/LoadingDialog";
import ModalConfirmCancel from "../../dialog/ModalConfirmCancel";
import TableReceivedPackages from "../components/TableReceivedPackages";
import { useOrderSessionReceivedDetailContext } from "../context/OrderSesionReceivedDetailContext";
import ModalSelectPackage from "../components/ModalSelectPackage";
import mutate_sfChangeReceivedPackage from "../../../../../graphql/mutate_sfChangeReceivedPackage";

const SectionPackages = ({ detailSessionHandover, loadingDetail }) => {
    const { optionsStore } = useOrderSessionReceivedDetailContext()
    const { formatMessage } = useIntl();
    const { addToast } = useToasts();
    const [currentPackageId, setCurrentPackageId] = useState(null);
    const [currentPackageIdChanged, setCurrentPackageIdChanged] = useState(null);
    const [showModalPackages, setShowModalPackages] = useState(false);
    const [currentCode, setCurrentCode] = useState(null);
    const packagesSession = (detailSessionHandover?.receivedPackage || []).map((item) => {
        return {
            code: item?.input_search,
            data: !!item?.object_id ? {
                "has_import_history": item?.has_import_history,
                "keyword": item?.input_search,
                "object_id": item?.object_id,
                "object_ref_id": item?.object_ref_id,
                "object_tracking_number": item?.object_tracking_number,
                "object_type": item?.object_type,
                "package_id": item?.package_id,
                "sf_received_code": null,
                "sf_received_id": item?.sf_received_id,
                "store_id": item?.store_id,
            } : null,
            isManual: item?.input_type == 2,
            id: item?.id
        }
    })
    const [deleteSessionReceived, { loading }] = useMutation(mutate_SfDeleteReceivedPackage, {
        awaitRefetchQueries: true,
        refetchQueries: ['findSessionReceivedDetail']
    });

    const [changeReceivedPackage, { loadingChange }] = useMutation(mutate_sfChangeReceivedPackage, {
        awaitRefetchQueries: true,
        refetchQueries: ['findSessionReceivedDetail']
    })
    const onDeleteSessionHandover = useCallback(async () => {
        const { data } = await deleteSessionReceived({
            variables: {
                received_package_id: currentPackageId
            }
        });

        setCurrentPackageId(null);
        if (!!data?.sfDeleteReceivedPackage?.success) {
            addToast(formatMessage({ defaultMessage: 'Xóa kiện hàng thành công' }), { appearance: "success" });
        } else {
            addToast(data?.sfDeleteReceivedPackage?.message || formatMessage({ defaultMessage: 'Xóa kiện hàng thất bại' }), { appearance: "error" });
        }
    }, [detailSessionHandover, currentPackageId]);

    const onSelectedPackage = async (pack) => {
        let pkg = {
            input_search: currentCode,
            input_type: pack?.isManual ? 2 : 1,
            object_id: pack?.data?.object_id,
            object_ref_id: pack?.data?.object_ref_id,
            object_tracking_number: pack?.data?.object_tracking_number,
            object_type: pack?.data?.object_type,
            package_id: pack?.data?.package_id,
            store_id: pack?.data?.store_id,
        }
        const { data } = await changeReceivedPackage({
            variables: {
                received_package_id: currentPackageIdChanged,
                received_package: pkg
            }
        })
        if (!!data?.sfChangeReceivedPackage?.success) {
            addToast(formatMessage({ defaultMessage: 'Chọn kiện hàng thành công' }), { appearance: "success" });
        } else {
            addToast(data?.sfChangeReceivedPackage?.message || formatMessage({ defaultMessage: 'Chọn kiện hàng thất bại' }), { appearance: "error" });
        }
        setCurrentPackageIdChanged(null)
    }
    return (
        <Fragment>
            <LoadingDialog show={loading || loadingChange} />
            <ModalConfirmCancel
                title={formatMessage({ defaultMessage: 'Bạn có chắc chắn muốn xoá kiện hàng khỏi phiên nhận?' })}
                titleSuccess={formatMessage({ defaultMessage: 'Có, Xóa' })}
                show={!!currentPackageId}
                onHide={() => setCurrentPackageId(null)}
                onConfirm={onDeleteSessionHandover}
            />

            {showModalPackages && <ModalSelectPackage
                show={showModalPackages}
                packages={packagesSession}
                stores={optionsStore}
                onHide={() => {
                    setShowModalPackages(false)
                    setCurrentCode(null);
                    setCurrentPackageIdChanged(null)
                }}
                onSelectPackage={onSelectedPackage}
            />}

            <div className="mt-4" style={{ position: 'relative' }}>
                <TableReceivedPackages
                    status={detailSessionHandover?.status === 2 ?
                        "cancel" :
                        detailSessionHandover?.status == 1 ?
                            "new" :
                            detailSessionHandover?.status == 3 ?
                                "complete" : ""}
                    loading={loadingDetail}
                    onRemovePackage={(item) => { if (packagesSession.length > 1) setCurrentPackageId(item.id) }}
                    onSelectPackage={(item) => {
                        setCurrentCode(item?.code);
                        setShowModalPackages(true)
                        setCurrentPackageIdChanged(item?.id)
                    }}
                    packages={packagesSession}
                    stores={optionsStore}
                    shippingCarrier={detailSessionHandover?.shipping_carrier}
                />
            </div>
        </Fragment>
    )
}

export default memo(SectionPackages);