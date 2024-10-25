import React, { memo, Fragment, useLayoutEffect, useMemo, useState, useCallback } from 'react';
import { Card, CardBody } from "../../../../_metronic/_partials/controls";
import queryString from 'querystring';
import { useLocation, useHistory } from 'react-router-dom';
import SVG from "react-inlinesvg";
import { Helmet } from 'react-helmet-async';
import { useIntl } from 'react-intl';
import { toAbsoluteUrl } from '../../../../_metronic/_helpers';
import { useSubheader } from '../../../../_metronic/layout';
import CostFilter from './CostFilter';
import CostTable from './CostTable';
import { useMutation, useQuery } from '@apollo/client';
import query_getCostPeriodType from '../../../../graphql/query_getCostPeriodType';
import ModalCostAction from './dialog/ModalCostAction';
import query_sc_stores_basic from '../../../../graphql/query_sc_stores_basic';
import ModalConfirm from './dialog/ModalConfirm';
import mutate_cfDeleteCostPeriod from '../../../../graphql/mutate_cfDeleteCostPeriod';
import LoadingDialog from '../../Products/product-new/LoadingDialog';
import { useToasts } from 'react-toast-notifications';
import dayjs from 'dayjs';

const Cost = () => {
    const history = useHistory();
    const location = useLocation();
    const { setBreadcrumbs } = useSubheader();
    const { formatMessage } = useIntl();
    const { addToast } = useToasts();
    const params = queryString.parse(location.search.slice(1, 100000));

    const [showModalAction, setShowModalAction] = useState(false);
    const [currentCostUpdate, setCurrentCostUpdate] = useState(null);
    const [currentCostIdDelete, setCurrentCostIdDelete] = useState(null);
    const [typeAction, setTypeAction] = useState(null);
    const [currentDateRangeTime, setCurrentDateRangeTime] = useState([
        new Date(dayjs().subtract(30, "day").startOf("day")),
        new Date(dayjs().startOf("day")),
    ]);

    useLayoutEffect(() => {
        setBreadcrumbs([{ title: formatMessage({ defaultMessage: 'Chi phí' }) }])
    }, []);

    const { loading: loadingCostPeriodType, data: dataCostPeriodType } = useQuery(query_getCostPeriodType, {
        fetchPolicy: "cache-and-network",
    });

    const { loading: loadingStores, data: dataStores } = useQuery(query_sc_stores_basic, {
        variables: {
            context: 'order'
        },
        fetchPolicy: "cache-and-network",
    });

    const [cfDeleteCostPeriod, { loading: loadingCfDeleteCostPeriod }] = useMutation(mutate_cfDeleteCostPeriod, {
        awaitRefetchQueries: true,
        refetchQueries: ['list_cost_period']
    });

    const [currentChannel, channelsActive, optionsStores, optionsChannels] = useMemo(
        () => {
            const channelsActive = dataStores?.op_connector_channels?.filter(store => {
                return dataStores?.sc_stores?.some(sa => sa?.connector_channel_code === store?.code)
            });
            let _optionsChannel = channelsActive?.map(_channel => ({
                label: _channel?.name,
                logo: _channel?.logo_asset_url,
                value: _channel?.code
            })) || [];

            let _currentChannel = !!params?.channels
                ? _optionsChannel?.filter(
                    _channel => !!_channel?.value && params?.channels?.split(',').some(_param => _param == _channel.value)
                )
                : undefined;

            return [_currentChannel, _optionsChannel, dataStores?.sc_stores, dataStores?.op_connector_channels];
        }, [dataStores, params]
    );

    const onDeleteCost = useCallback(
        async () => {
            try {
                const { data } = await cfDeleteCostPeriod({
                    variables: {
                        cost_period_id: currentCostIdDelete
                    }
                });

                setCurrentCostIdDelete(null);
                if (!!data?.cfDeleteCostPeriod?.success) {
                    addToast(formatMessage({ defaultMessage: 'Xoá chi phí thành công' }), { appearance: "success" });
                } else {
                    addToast(formatMessage({ defaultMessage: 'Xoá chi phí thất bại' }), { appearance: "error" });
                }
            } catch (_err) {
                setCurrentCostIdDelete(null);
                addToast(formatMessage({ defaultMessage: 'Xoá chi phí thất bại' }), { appearance: "error" });
            }
        }, [currentCostIdDelete]
    );

    return (
        <Fragment>
            <Helmet
                titleTemplate={formatMessage({ defaultMessage: "Chi phí" }) + " - UpBase"}
                defaultTitle={formatMessage({ defaultMessage: "Chi phí" }) + " - UpBase"}
            >
                <meta name="description" content={formatMessage({ defaultMessage: "Chi phí" }) + " - UpBase"} />
            </Helmet>
            <Card>
                <CardBody>
                    <CostFilter
                        dataCostPeriodType={dataCostPeriodType}
                        currentDateRangeTime={currentDateRangeTime}
                        setCurrentDateRangeTime={setCurrentDateRangeTime}
                        onShowCreateModal={() => setShowModalAction(true)}
                    />
                    <CostTable
                        dataCostPeriodType={dataCostPeriodType}
                        optionsStores={optionsStores}
                        currentDateRangeTime={currentDateRangeTime}
                        onShowUpdateCost={(cost, type) => {
                            setCurrentCostUpdate(cost);
                            setShowModalAction(true);
                            !!type && setTypeAction(type);
                        }}
                        onConfirmDelete={id => setCurrentCostIdDelete(id)}
                    />
                </CardBody>
            </Card>

            <LoadingDialog show={loadingCfDeleteCostPeriod} />

            {showModalAction && <ModalCostAction
                show={showModalAction}
                onHide={() => {
                    setShowModalAction(false);
                    setCurrentCostUpdate(null);
                    setTypeAction(null);
                }}
                currentCostUpdate={currentCostUpdate}
                dataCostPeriodType={dataCostPeriodType}
                optionsStores={optionsStores}
                optionsChannels={optionsChannels}
                type={typeAction}
            />}

            {!!currentCostIdDelete && <ModalConfirm
                show={!!currentCostIdDelete && !loadingCfDeleteCostPeriod}
                onHide={() => setCurrentCostIdDelete(null)}
                onConfirm={onDeleteCost}
            />}

            <div
                id="kt_scrolltop1"
                className="scrolltop"
                style={{ bottom: 80 }}
                onClick={() => {
                    window.scrollTo({
                        letf: 0,
                        top: document.body.scrollHeight,
                        behavior: 'smooth'
                    });
                }}
            >
                <span className="svg-icon">
                    <SVG src={toAbsoluteUrl("/media/svg/icons/Navigation/Down-2.svg")} title={' '}></SVG>
                </span>{" "}
            </div>
        </Fragment>
    )
};

export default memo(Cost);

export const actionKeys = {
    "finance_cost_period_view": {
        router: '/finance/cost',
        actions: ["getCostPeriodType", "op_connector_channels", "sc_stores", "list_cost_period"],
        name: 'Xem danh sách chi phí',
        group_code: 'finance_cost',
        group_name: 'Chi phí',
        cate_code: 'finance_service',
        cate_name: 'Tài chính'
    },
    "finance_cost_period_crud": {
        router: '/finance/cost',
        actions: ["cfDeleteCostPeriod", "list_cost_period", "cfCreateCostPeriod", "cfUpdateCostPeriod"],
        name: 'Thêm /Cập nhật/Sao chép chi phí',
        group_code: 'finance_cost',
        group_name: 'Chi phí',
        cate_code: 'finance_service',
        cate_name: 'Tài chính'
    }
  };
