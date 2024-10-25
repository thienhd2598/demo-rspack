import { useMutation } from "@apollo/client";
import React, { Fragment, useCallback, useLayoutEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useIntl } from "react-intl";
import { useSelector } from "react-redux";
import { useHistory } from 'react-router-dom';
import { useToasts } from "react-toast-notifications";
import { useSubheader } from "../../../../../_metronic/layout";
import mutate_sfCreateSessionReceived from "../../../../../graphql/mutate_sfCreateSessionReceived";
import LoadingDialog from "../../../FrameImage/LoadingDialog";
import ModalResultCreateHandover from "../components/ModalResultCreateHandover";
import { OrderSessionReceivedProvider, useOrderSessionReceivedContext } from "../context/OrderSessionReceivedContext";
import { useSearchSessionReceived } from "../hooks";
import SectionPackages from "./SectionPackages";
import SectionScan from "./SectionScan";

const OrderSessionReceivedCreate = () => {
    const { formatMessage } = useIntl();
    const { addToast } = useToasts();
    const history = useHistory();
    const user = useSelector((state) => state.auth.user);
    const [dataResults, setDataResults] = useState(null);

    const [mutateCreateSessionReceived, { loading }] = useMutation(mutate_sfCreateSessionReceived);
    const { isLoadPackages, setIsLoadPackages, inputRefOrder, searchParams, setSearchParams, packagesSession, setPackagesSession, optionsSmeWarehouse, ids, warehouseSelected, shippingCarrier } = useOrderSessionReceivedContext();

    useLayoutEffect(() => inputRefOrder.current.focus(), []);

    const { loading: loadingPackages, refetch: refetchPackages } = useSearchSessionReceived({
        search: searchParams?.search,
        packages: packagesSession,
        isLoad: isLoadPackages,
        onComplete: (item) => {
            setPackagesSession(prev => prev.concat([item]))
        },
        onReset: () => {
            setIsLoadPackages(false);
            inputRefOrder.current.value = '';
        }
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
        }));
    }, [defaultWarehouse]);

    const onCreateOrderSessionReceived = useCallback(async () => {
        try {
            if (!shippingCarrier) {
                addToast(formatMessage({ defaultMessage: 'Vui lòng chọn đơn vị vận chuyển' }), { appearance: 'error' })
                return;
            }
            
            if (!warehouseSelected) {
                addToast(formatMessage({ defaultMessage: 'Vui lòng chọn kho trả hàng' }), { appearance: 'error' })
                return;
            }

            if (packagesSession?.length == 0) {
                addToast(formatMessage({ defaultMessage: 'Danh sách kiện hàng rỗng, xin vui lòng scan kiện' }), { appearance: 'error' })
                return;
            };


            const infoUser = JSON.stringify({
                id: user?.id,
                name: !user?.is_subuser ? user?.email : user?.full_name
            });

            const { data } = await mutateCreateSessionReceived({
                variables: {
                    sme_warehouse_id: warehouseSelected,
                    created_by_obj: infoUser,
                    shipping_carrier: shippingCarrier,
                    received_packages: packagesSession?.map(item => {
                        return {
                            input_search: item?.code,
                            input_type: item?.isManual ? 2 : 1,
                            object_id: item?.data?.object_id,
                            object_ref_id: item?.data?.object_ref_id,
                            object_tracking_number: item?.data?.object_tracking_number,
                            object_type: item?.data?.object_type,
                            package_id: item?.data?.package_id,
                            store_id: item?.data?.store_id,
                        }
                    }),
                }
            });

            if (data?.sfCreateSessionReceived) {
                setDataResults({
                    type: 'received',
                    ...data?.sfCreateSessionReceived
                });
            } else {
                addToast(formatMessage({ defaultMessage: 'Tạo phiên nhận thất bại' }), { appearance: 'error' })
            }


        } catch (error) {
            addToast(formatMessage({ defaultMessage: 'Có lỗi xảy ra, xin vui lòng thử lại' }), { appearance: 'error' })
        }
    }, [ids, searchParams, packagesSession, warehouseSelected, user, shippingCarrier]);

    return <Fragment>
        <LoadingDialog show={loading} />
        <ModalResultCreateHandover
            result={dataResults}
            onHide={() => {
                history.push(`/orders/session-received/${dataResults?.id}`);
                setDataResults(null);
            }}
        />
        <SectionScan
            onCreateOrderSessionReceived={onCreateOrderSessionReceived}
            onCleanScanPackages={onCleanScanPackages}
            refetchPackages={refetchPackages}
        />
        <SectionPackages
            loading={loadingPackages}
        />
    </Fragment>
}

const OrderSessionReceivedCreateWrapper = () => {
    const { formatMessage } = useIntl();
    const { setBreadcrumbs } = useSubheader();

    useLayoutEffect(() => {
        setBreadcrumbs([
            { title: formatMessage({ defaultMessage: 'Tạo phiên nhận' }) }
        ])
    }, []);

    return <Fragment>
        <Helmet
            titleTemplate={formatMessage({ defaultMessage: 'Tạo phiên nhận - UpBase' })}
            defaultTitle={formatMessage({ defaultMessage: 'Tạo phiên nhận - UpBase' })}
        >
            <meta
                name="description"
                content={formatMessage({ defaultMessage: 'Tạo phiên nhận - UpBase' })}
            />
        </Helmet>
        <OrderSessionReceivedProvider>
            <OrderSessionReceivedCreate />
        </OrderSessionReceivedProvider>
    </Fragment>
}

export default OrderSessionReceivedCreateWrapper;