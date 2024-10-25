import { useMutation, useQuery } from "@apollo/client";
import React, { Fragment, useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useIntl } from "react-intl";
import { useSelector } from "react-redux";
import { useHistory } from 'react-router-dom';
import { useToasts } from "react-toast-notifications";
import { toAbsoluteUrl } from "../../../../../_metronic/_helpers";
import { useSubheader } from "../../../../../_metronic/layout";
import mutate_sfCreateSessionHandover from "../../../../../graphql/mutate_sfCreateSessionHandover";
import query_coGetPackage from "../../../../../graphql/query_coGetPackage";
import LoadingDialog from "../../../FrameImage/LoadingDialog";
import { PackStatusName } from "../../OrderStatusName";
import ModalResultCreateHandover from "../components/ModalResultCreateHandover";
import { OrderSessionDeliveryProvider, useOrderSessionDeliveryContext } from "../context/OrderSessionDeliveryContext";
import SectionPackages from "./SectionPackages";
import SectionScan from "./SectionScan";

const OrderSessionDeliveryCreate = () => {
    const { formatMessage } = useIntl();
    const { addToast } = useToasts();
    const history = useHistory();
    const [dataResults, setDataResults] = useState(null);
    const user = useSelector((state) => state.auth.user);
    const _refSoundSuccess = useRef(new Audio(toAbsoluteUrl("/audio/success.mp3")))
    const _refSoundError = useRef(new Audio(toAbsoluteUrl("/audio/error.mp3")))

    const [mutateCreateSessionHandover, { loading }] = useMutation(mutate_sfCreateSessionHandover);
    const { isLoadPackages, setIsLoadPackages, inputRefOrder, searchParams, setSearchParams, optionsStore, packagesSession, setPackagesSession, optionsSmeWarehouse, ids } = useOrderSessionDeliveryContext();

    useLayoutEffect(() => {
        inputRefOrder.current.focus();
    }, []);

    const { data: dataPackages, loading: loadingPackages, refetch: refetchPackages } = useQuery(query_coGetPackage, {
        variables: {
            q: searchParams?.search,
            search_type: searchParams?.search_type,
            sme_warehouse_id: searchParams?.warehouseId
        },
        onCompleted: (data) => {
            setIsLoadPackages(false);
            inputRefOrder.current.value = '';            
            if (!!data?.coGetPackage?.data) {
                const isExistPackage = packagesSession?.some(item => item?.id == data?.coGetPackage?.data?.id);
                const isDiffShippingCarrier = packagesSession?.length > 0 && packagesSession?.some(item => item?.shipping_carrier != data?.coGetPackage?.data?.shipping_carrier);
                const isDiffWarehouse = packagesSession?.length > 0 && packagesSession?.some(item => item?.sme_warehouse_id != data?.coGetPackage?.data?.sme_warehouse_id);
                const isDiffStatus = data?.coGetPackage?.data?.pack_status != 'packed';

                if (isDiffStatus) {
                    const { status } = PackStatusName(data?.coGetPackage?.data?.pack_status, data?.coGetPackage?.data?.order?.status);
                    _refSoundError.current.play();
                    addToast(formatMessage({ defaultMessage: "Kiện hàng đang ở trạng thái “{status}” không hợp lệ .Tính năng này chỉ hỗ trợ những đơn hàng đang ở trạng thái “Chờ lấy hàng”" }, { status: formatMessage(status) }), { appearance: "error" });
                    return;
                }

                if (isExistPackage) {
                    _refSoundError.current.play();
                    addToast(formatMessage({ defaultMessage: "Kiện hàng đã quét rồi" }), { appearance: "error" });
                    return;
                }

                if (isDiffWarehouse) {
                    const warehousePackage = optionsSmeWarehouse?.find(wh => wh?.value == data?.coGetPackage?.data?.sme_warehouse_id)
                    _refSoundError.current.play();
                    addToast(formatMessage({ defaultMessage: `Kiện hàng được xử lý ở kho "{warehouse}" khác với kho đã chọn`}, { warehouse: warehousePackage?.name }), { appearance: 'error' });
                    return;
                }

                if (isDiffShippingCarrier) {
                    _refSoundError.current.play();
                    addToast(formatMessage({ defaultMessage: "Kiện hàng được vận chuyển bởi “{shipping_carrier}” khác với ĐVVC của danh sách hiện tại", }, { shipping_carrier: data?.coGetPackage?.data?.shipping_carrier }), { appearance: 'error' });
                    return;
                }
                

                _refSoundSuccess.current.play();
                setPackagesSession(prev => prev.concat([data?.coGetPackage?.data]));
            } else {
                _refSoundError.current.play();
                addToast(formatMessage({ defaultMessage: "Kiện không tồn tại" }), { appearance: "error" });
            }
        },
        skip: !isLoadPackages,
        fetchPolicy: 'cache-and-network',
    });    

    const defaultWarehouse = useMemo(() => {
        const warehouseDefault = optionsSmeWarehouse?.find(wh => wh?.isDefault);
        return warehouseDefault
    }, [optionsSmeWarehouse]);    

    const onCleanScanPackages = useCallback(() => {
        setPackagesSession([]);
        inputRefOrder.current.value = '';
        setSearchParams(prev => ({
            ...prev,
            search: '',
            search_type: 'tracking_number',
            warehouseId: defaultWarehouse?.value,
        }));
    }, [defaultWarehouse]);

    const onCreateOrderSessionDelivery = useCallback(async () => {
        try {
            if (packagesSession?.length == 0) return;            

            const infoUser = JSON.stringify({
                id: user?.id,
                name: !user?.is_subuser ? user?.email : user?.full_name
            });

            const { data } = await mutateCreateSessionHandover({
                variables: {
                    list_package_id: packagesSession?.map(item => item?.id),
                    sme_warehouse_id: searchParams?.warehouseId,  
                    created_by_obj: infoUser
                }
            })

            if (data?.sfCreateSessionHandover) {                
                setDataResults(data?.sfCreateSessionHandover);
            } else {
                addToast(formatMessage({ defaultMessage: 'Tạo phiên giao thất bại' }), { appearance: 'error' })
            }


        } catch (error) {
            addToast(formatMessage({ defaultMessage: 'Có lỗi xảy ra, xin vui lòng thử lại' }), { appearance: 'error' })
        }
    }, [ids, searchParams, packagesSession, user]);

    return <Fragment>
        <LoadingDialog show={loading} />
        <ModalResultCreateHandover
            result={dataResults}
            onHide={() => {
                history.push(`/orders/session-delivery/${dataResults?.id}`);
                setDataResults(null);
            }}
        />
        <SectionScan
            onCreateOrderSessionDelivery={onCreateOrderSessionDelivery}
            onCleanScanPackages={onCleanScanPackages}
            refetchPackages={refetchPackages}
        />
        <SectionPackages
            loading={loadingPackages}
        />
    </Fragment>
}

const OrderSessionDeliveryCreateWrapper = () => {
    const { formatMessage } = useIntl();
    const { setBreadcrumbs } = useSubheader();

    useLayoutEffect(() => {
        setBreadcrumbs([
            { title: formatMessage({ defaultMessage: 'Tạo phiên giao' }) }
        ])
    }, []);

    return <Fragment>
        <Helmet
            titleTemplate={formatMessage({ defaultMessage: 'Tạo phiên giao - UpBase' })}
            defaultTitle={formatMessage({ defaultMessage: 'Tạo phiên giao - UpBase' })}
        >
            <meta
                name="description"
                content={formatMessage({ defaultMessage: 'Tạo phiên giao - UpBase' })}
            />
        </Helmet>
        <OrderSessionDeliveryProvider>
            <OrderSessionDeliveryCreate />
        </OrderSessionDeliveryProvider>
    </Fragment>
}

export default OrderSessionDeliveryCreateWrapper;