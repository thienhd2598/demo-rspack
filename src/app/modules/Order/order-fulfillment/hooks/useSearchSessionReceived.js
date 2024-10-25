import { useQuery } from "@apollo/client";
import { useIntl } from "react-intl";
import { useToasts } from "react-toast-notifications";
import query_sfFindPackageReceive from "../../../../../graphql/query_sfFindPackageReceive";
import { useRef } from "react";
import { toAbsoluteUrl } from "../../../../../_metronic/_helpers";

const useSearchSessionReceived = ({
    search,
    packages,
    onComplete,
    isLoad = false,
    onReset,
}) => {
    const { formatMessage } = useIntl();
    const { addToast } = useToasts();
    const _refSoundSuccess = useRef(new Audio(toAbsoluteUrl("/audio/success.mp3")))
    const _refSoundError = useRef(new Audio(toAbsoluteUrl("/audio/error.mp3")))

    const { loading, refetch } = useQuery(query_sfFindPackageReceive, {
        variables: {
            keyword: search
        },
        onCompleted: (data) => {                  
            !!onReset && onReset();
            if (!search?.trim()) {
                addToast(formatMessage({ defaultMessage: "Kiện hàng không tồn tại" }), { appearance: "error" });
                return;
            }            

            if (!!data?.sfFindPackageReceive?.object_id) {
                const isExistPackage = packages?.some(item => {
                    if (item?.isManual) {
                        if (!!item?.data) {
                            return item?.code == search || (item?.data?.object_id == data?.sfFindPackageReceive?.object_id && item?.data?.object_type == data?.sfFindPackageReceive?.object_type)
                        }

                        return item?.code == search
                    }

                    return item?.data?.object_id == data?.sfFindPackageReceive?.object_id && item?.data?.object_type == data?.sfFindPackageReceive?.object_type
                });
                if (isExistPackage) {
                    _refSoundError.current.play();
                    addToast(formatMessage({ defaultMessage: "Kiện hàng đã được quét" }), { appearance: "error" });
                    return;
                }

                if (!!data?.sfFindPackageReceive?.sf_received_code) {
                    _refSoundError.current.play();
                    addToast(formatMessage({ defaultMessage: "Kiện hàng được thêm vào phiên nhận “{code}”", }, { code: data?.sfFindPackageReceive?.sf_received_code }), { appearance: 'error' });
                    return;
                }
                
                if (!!data?.sfFindPackageReceive?.has_import_history) {
                    _refSoundError.current.play();
                    addToast(formatMessage({ defaultMessage: 'Kiện hàng đã được xử lý trả hàng' }), { appearance: 'error' });
                    return;
                }

                _refSoundSuccess.current.play();
                onComplete({
                    code: data?.sfFindPackageReceive?.keyword,
                    isManual: false,
                    data: { ...data?.sfFindPackageReceive }
                });
            } else {
                const isExistPackage = packages?.some(item => item?.code == search);
                if (isExistPackage) {
                    _refSoundError.current.play();
                    addToast(formatMessage({ defaultMessage: "Kiện hàng đã được quét" }), { appearance: "error" });
                    return;
                }

                if (!!data?.sfFindPackageReceive?.sf_received_code) {
                    _refSoundError.current.play();
                    addToast(formatMessage({ defaultMessage: "Kiện hàng được thêm vào phiên nhận “{code}”", }, { code: data?.sfFindPackageReceive?.sf_received_code }), { appearance: 'error' });
                    return;
                }

                _refSoundSuccess.current.play();
                onComplete({
                    code: search,
                    isManual: true,
                    data: null
                });
            }
        },
        skip: !isLoad,
        fetchPolicy: 'cache-and-network',
    });



    return { loading, refetch };
}

export default useSearchSessionReceived;