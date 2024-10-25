import React, { createContext, useContext, useMemo, useRef, useState } from "react";
import { useIntl } from "react-intl";
import { groupBy } from 'lodash';
import * as Yup from "yup";
import { useQuery } from "@apollo/client";
import query_smeCatalogStores from "../../../graphql/query_smeCatalogStores";
import query_sc_stores_basic from "../../../graphql/query_sc_stores_basic";
import { randomString } from "../../../utils";
import { useSelector } from "react-redux";
import dayjs from "dayjs";
import query_crmGetProvince from "../../../graphql/query_crmGetProvince";
import query_crmGetDistrict from "../../../graphql/query_crmGetDistrict";

const OrderPosContext = createContext();

export function useOrderPosContext() {
    return useContext(OrderPosContext);
};

export function OrderPostProvider({ children }) {
    const user = useSelector((state) => state.auth.user);
    const { formatMessage } = useIntl();
    const [validateSchema, setValidateSchema] = useState({});
    const [storeSelected, setStoreSelected] = useState(null);
    const [warehouseSelected, setWarehouseSelected] = useState(null);
    const [currentOrderPos, setCurrentOrderPos] = useState(null);
    const [currentScanBy, setCurrentScanBy] = useState(null);
    const [provinceSelected, setProvinceSelected] = useState(null);
    const [districtSelected, setDistrictSelected] = useState(null);
    const [addressSelected, setAddressSelected] = useState(null);
    const [countTab, setCountTab] = useState(1);
    const [orderPos, setOrderPos] = useState([]);

    const personCharge = useMemo(() => {
        return user?.email || ''
    }, [user]);

    const { data: dataCrmGetProvince } = useQuery(query_crmGetProvince, {
        fetchPolicy: "cache-and-network",
    });

    const { data: dataCrmGetDistrict } = useQuery(query_crmGetDistrict, {
        fetchPolicy: "cache-and-network",
    });

    const { data: dataStore } = useQuery(query_sc_stores_basic, {
        variables: { context: 'order' },
        fetchPolicy: 'cache-and-network'
    });

    const { data: dataCatalogStores } = useQuery(query_smeCatalogStores, {
        variables: {
            where: {
                fulfillment_by: { _eq: 1 },
                status: {_eq: 10}
            }
        },
        fetchPolicy: 'cache-and-network'
    });

    const optionsProvince = useMemo(() => {
        return dataCrmGetProvince?.crmGetProvince?.map(province => ({
            value: province?.code,
            label: province?.name
        }));
    }, [dataCrmGetProvince]);

    const optionsDistrict = useMemo(() => {
        const opsParse = dataCrmGetDistrict?.crmGetDistrict?.map(district => ({
            value: district?.code,
            label: district?.full_name,
            province_code: district?.province_code,
        }));

        return groupBy(opsParse, 'province_code')
    }, [dataCrmGetDistrict]);

    const optionsStore = useMemo(() => {
        return dataStore?.sc_stores
            ?.filter(store => store?.connector_channel_code == 'other')
            ?.map(store => ({
                value: store?.id,
                label: store?.name,
                logo: dataStore?.op_connector_channels?.find(channel => channel?.code == store?.connector_channel_code)?.logo_asset_url,
                ...store
            }));
    }, [dataStore]);

    const optionsSmeWarehouse = useMemo(() => {
        const optionsCatalogStores = dataCatalogStores?.sme_warehouses?.map(
            _store => ({
                value: _store?.id,
                label: _store?.name,
                isDefault: _store?.is_default,
                ..._store
            })
        );

        return optionsCatalogStores
    }, [dataCatalogStores]);

    const orderCode = useMemo(() => {
        return ['POS', storeSelected?.value || '', dayjs().unix()].join('')
    }, [storeSelected]);

    useMemo(() => {
        let schema = {};

        orderPos.forEach(order => {
            schema[`name_customer_${order?.code}`] = Yup.string()
                .nullable()
                .max(35, formatMessage({ defaultMessage: "{name} tối đa {length} ký tự" }, { length: 35, name: formatMessage({ defaultMessage: "Tên người mua" }) }))
                .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: formatMessage({ defaultMessage: "Tên người mua" }).toLowerCase() }))
                .test(
                    'chua-ky-tu-space-o-dau-cuoi',
                    formatMessage({ defaultMessage: 'Tên người mua không được chứa dấu cách ở đầu và cuối' }),
                    (value, context) => {
                        if (!!value) {
                            return value.length == value.trim().length;
                        }
                        return false;
                    },
                )
                .test(
                    'chua-ky-tu-2space',
                    formatMessage({ defaultMessage: 'Tên người mua không được chứa 2 dấu cách liên tiếp' }),
                    (value, context) => {
                        if (!!value) {
                            return !(/\s\s+/g.test(value))
                        }
                        return false;
                    },
                );
            schema[`phone_customer_${order?.code}`] = Yup.string()
                .nullable()
                .length(10, formatMessage({ defaultMessage: "Độ dài số điện thoại người mua phải {number} số" }, { number: 10 }))
                .test(
                    'sai-dinh-dang-phone',
                    'Số điện thoại người mua không hợp lệ',
                    (value, context) => {
                        if (!!value) {
                            return (/^0[0-9]\d{8}$/g.test(value))
                        }
                        return true;
                    },
                );
            schema[`province_${order?.code}`] = Yup.object()
                .nullable()
                .required(formatMessage({ defaultMessage: "Vui lòng chọn {name}" }, { name: formatMessage({ defaultMessage: "Tỉnh/thành phố" }).toLowerCase() }));
            schema[`district_${order?.code}`] = Yup.object()
                .nullable()
                .required(formatMessage({ defaultMessage: "Vui lòng chọn {name}" }, { name: formatMessage({ defaultMessage: "Quận/huyện" }).toLowerCase() }));
            schema[`address_${order?.code}`] = Yup.string()
                .nullable()
                .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: formatMessage({ defaultMessage: "Địa chỉ khách hàng" }).toLowerCase() }))
            schema[`promotion_seller_amount_${order?.code}`] = Yup.number()
                .max(120000000, formatMessage({ defaultMessage: "{name} tối đa {max}đ" }, { max: '120,000,000', name: formatMessage({ defaultMessage: "Mã giảm giá" }) }));

            (order?.variants || []).forEach(variant => {
                if (!warehouseSelected) return;

                const smeWarehouse = variant?.variant?.inventories?.find(wh => wh?.sme_store_id == warehouseSelected?.value);
                const isCheckStock = !warehouseSelected?.allow_preallocate && smeWarehouse?.stock_available <= 999999;

                schema[`variant_${variant?.variant?.id}_discount_${order?.code}`] = Yup.number()
                    .notRequired()
                    .when(`variant_${variant?.variant?.id}_price_${order?.code}`, values => {
                        if (typeof values == 'number') {
                            return Yup.number()
                                .max(values, formatMessage({ defaultMessage: 'Chiết khấu không được vượt quá đơn giá của hàng hóa' }))
                        }
                    })
                    .when(`variant_${variant?.variant?.id}_unit_${order?.code}`, values => {
                        if (!!values?.value) {
                            return Yup.number()
                                .max(100, formatMessage({ defaultMessage: 'Chiết khấu tối đa 100%' }))
                        }
                    })
                schema[`variant_${variant?.variant?.id}_price_${order?.code}`] = Yup.number()
                    .required(formatMessage({ defaultMessage: 'Vui lòng nhập đơn giá' }))
                    .max(120000000, formatMessage({ defaultMessage: 'Đơn giá tối đa 120.000.000đ' }))
                schema[`variant_${variant?.variant?.id}_quantity_${order?.code}`] = Yup.number()
                    .required(formatMessage({ defaultMessage: 'Vui lòng nhập số lượng hàng hóa' }))
                    .moreThan(0, formatMessage({ defaultMessage: 'Số lượng hàng hóa phải lớn hơn 0' }))
                    .max(
                        isCheckStock ? smeWarehouse?.stock_available : 999999,
                        isCheckStock ? formatMessage({ defaultMessage: 'Số lượng phải nhỏ hơn hoặc bằng tồn sẵn sàng bán' }) : formatMessage({ defaultMessage: 'Số lượng hàng hóa phải nhỏ hơn hoặc bằng 999.999' })
                    )
            })
        });

        setValidateSchema(Yup.object().shape(schema));
    }, [orderPos, warehouseSelected]);

    const value = useMemo(() => {
        return {
            validateSchema, optionsSmeWarehouse, optionsStore, orderPos, currentOrderPos,
            setStoreSelected, setWarehouseSelected, setCurrentOrderPos, setOrderPos, setCurrentScanBy,
            currentScanBy, warehouseSelected, storeSelected, personCharge, orderCode,
            optionsDistrict, optionsProvince, countTab, setCountTab, addressSelected, setAddressSelected,
            provinceSelected, setProvinceSelected, districtSelected, setDistrictSelected
        }
    }, [
        validateSchema, optionsSmeWarehouse, optionsStore, orderPos, currentOrderPos,
        currentScanBy, warehouseSelected, storeSelected, personCharge, orderCode, addressSelected,
        optionsDistrict, optionsProvince, countTab, provinceSelected, districtSelected
    ]);

    return (
        <OrderPosContext.Provider value={value}>
            {children}
        </OrderPosContext.Provider>
    )
}