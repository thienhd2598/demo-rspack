import React, { memo, useCallback, useState, useMemo, Fragment, useLayoutEffect } from "react";
import { PickupGoodsProvider, usePickupGoodsContext } from "../../context/PickupGoodsContext";
import { useSubheader } from "../../../../../_metronic/layout";
import { useIntl } from "react-intl";
import { Helmet } from "react-helmet-async";
import LoadingDialog from "../../../FrameImage/LoadingDialog";
import { RouterPrompt } from "../../../../../components/RouterPrompt";
import { Form, Formik } from "formik";
import { Card } from "../../../../../_metronic/_partials/controls";
import SectionActions from "./SectionActions";
import SectionFilter from "./SectionFilter";
import SectionTable from "./SectionTable";
import { useToasts } from "react-toast-notifications";
import { useMutation } from "@apollo/client";
import { useHistory } from 'react-router-dom';
import mutate_sfCreateSessionPickup from "../../../../../graphql/mutate_sfCreateSessionPickup";
import ModalResultCreatePickup from "../../components/ModalResultCreatePickup";

const PickupGoodsCreate = () => {
    const { formatMessage } = useIntl();
    const { initialValues, validateSchema, ids, isInitLoadPackages } = usePickupGoodsContext();
    const { addToast } = useToasts();
    const history = useHistory();
    const [dataResults, setDataResults] = useState(null);

    const [mutateCreatePickup, { loading }] = useMutation(mutate_sfCreateSessionPickup);

    const onCreatePickupGoods = useCallback(async (values, total, isCreateFilter, cb) => {
        try {            
            const { data } = await mutateCreatePickup({
                variables: {
                    ...(isCreateFilter ? {} : {
                        list_package_id: ids?.map(item => item?.id)
                    }),
                    session_pickup_note: values?.session_pickup_note,
                    session_pickup_type: values?.session_pickup_type,
                    session_pickup_type: values?.session_pickup_type,
                    search: {
                        warehouse_filer: 2,
                        warehouse_id: values?.smeWarehouse
                    }
                }
            })

            if (data?.sfCreateSessionPickup) {
                cb();
                setDataResults(data?.sfCreateSessionPickup)
            } else {
                addToast(formatMessage({ defaultMessage: 'Tạo phiếu nhặt hàng thất bại' }), { appearance: 'error' })
            }


        } catch (error) {
            addToast(formatMessage({ defaultMessage: 'Có lỗi xảy ra, xin vui lòng thử lại' }), { appearance: 'error' })
        }
    }, [ids]);

    return <Fragment>
        <LoadingDialog />
        <Formik
            initialValues={initialValues}
            enableReinitialize
            validationSchema={validateSchema}
        >
            {({ values, touched, errors, setFieldValue, validateForm, setErrors, handleSubmit, setValues }) => {
                const changed = values['__changed__'];

                return (
                    <Form>
                        <RouterPrompt
                            when={changed}
                            title={formatMessage({ defaultMessage: 'Bạn đang tạo phiếu nhặt hàng. Mọi thông tin bạn tạo trước đó sẽ bị xoá nếu bạn thoát màn hình này. Bạn có chắc chắn muốn thoát?' })}
                            cancelText={formatMessage({ defaultMessage: 'Không' })}
                            okText={formatMessage({ defaultMessage: 'Có, Thoát' })}
                            onOK={() => true}
                            onCancel={() => false}
                        />
                        <LoadingDialog show={loading} />
                        <ModalResultCreatePickup
                            result={dataResults}
                            onHide={() => {                                
                                setDataResults(null);
                                history.push('/smart-ffm/pickup-goods/list');
                            }}
                        />
                        <div className="row">
                            <div className="col-9">
                                <Card>
                                    <SectionFilter />
                                    {!isInitLoadPackages && <Fragment>
                                        <div className="w-100" style={{ height: 1, background: '#ebedf3' }} />
                                        <SectionTable />
                                    </Fragment>}
                                </Card>
                            </div>
                            <div className="col-3">
                                <SectionActions
                                    onCreatePickupGoods={onCreatePickupGoods}
                                />
                            </div>
                        </div>
                    </Form>
                )
            }}
        </Formik>
    </Fragment>
}

const PickupGoodsCreateWrapper = () => {
    const { formatMessage } = useIntl();
    const { setBreadcrumbs } = useSubheader();

    useLayoutEffect(() => {
        setBreadcrumbs([
            { title: formatMessage({ defaultMessage: 'Tạo phiếu nhặt hàng' }) }
        ])
    }, []);

    return <Fragment>
        <Helmet
            titleTemplate={formatMessage({ defaultMessage: 'Tạo phiếu nhặt hàng' })}
            defaultTitle={formatMessage({ defaultMessage: 'Tạo phiếu nhặt hàng' })}
        >
            <meta
                name="description"
                content={formatMessage({ defaultMessage: 'Tạo phiếu nhặt hàng' })}
            />
        </Helmet>
        <PickupGoodsProvider>
            <PickupGoodsCreate />
        </PickupGoodsProvider>
    </Fragment>
}

export default PickupGoodsCreateWrapper;