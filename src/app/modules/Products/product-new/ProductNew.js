/* eslint-disable no-script-url,jsx-a11y/anchor-is-valid,jsx-a11y/role-supports-aria-props */
import { Formik } from "formik";
import React, { useState, useEffect, useMemo } from "react";
import { useProductsUIContext } from "../ProductsUIContext";
import { useSubheader } from "../../../../_metronic/layout/_core/MetronicSubheader";
import { ProductNewInfo } from "./ProductNewInfo";
import * as Yup from "yup";
import { useQuery } from "@apollo/client";
import query_sme_catalog_product_by_pk from "../../../../graphql/query_sme_catalog_product_by_pk";
import useUnsavedChangesWarning from "../../../../hooks/useUnsavedChangesWarning";
import { RouterPrompt } from "../../../../components/RouterPrompt";
import { Helmet } from 'react-helmet-async';
import { useIntl } from "react-intl";
import { randomString } from "../../../../utils";
import { NON_SERIAL } from "../ProductsUIHelpers";


export function ProductNew({
  history,
}) {
  const [step, setStep] = useState(0)
  const [Prompt, setDirty] = useUnsavedChangesWarning()
  const {
    categorySelected,
    resetAll,
    productEditSchema,
    smeCatalogStores,
    setVariantsUnit,
    setCurrentProduct,
  } = useProductsUIContext();
  const [waittingInit, setWaittingInit] = useState(!!categorySelected)
  const { setBreadcrumbs } = useSubheader()
  // const { data: productCreated, loading } = useQuery(query_sme_catalog_product_by_pk, {
  //   variables: {
  //     id: idProductCreated,
  //     skip: !idProductCreated
  //   }
  // })
  
  const { formatMessage } = useIntl()
  useEffect(() => {
    const listener = (e) => {
      if (e.keyCode === 13 || e.which === 13) {
        if ((e.target.nodeName == 'INPUT' && e.target.type == 'text')) {
          e.preventDefault();
          return false;
        }
      }
    }
    document.addEventListener('keypress', listener);
    return () => {
      document.removeEventListener('keypress', listener)
    }
  }, [])



  useEffect(() => {
    resetAll()
    setWaittingInit(true)
    setBreadcrumbs([
      {
        title: formatMessage({ defaultMessage: 'Thêm sản phẩm thường' }),
        pathname: '/products/new'
      }
    ])
    return () => resetAll()
  }, [history.location.state])

  const initialValues = useMemo(
    () => {
      const defaultStock = smeCatalogStores
        ?.filter(_store => !!_store?.isDefault)
        ?.map(_store => ({
          value: _store?.value,
          label: _store?.label
        }))?.[0];

      return {
        [`origin_stock`]: defaultStock || undefined,
        [`serial_type`]: NON_SERIAL,
        stockOnHand: 0,
        expireTime: 0,
        stopSellingTime: 0,
        outboundType: 'FIFO'
      }
    }, [smeCatalogStores]
  );

  useMemo(() => {
    // setDirty(true)
    if (waittingInit) {
      setTimeout(() => {
        setWaittingInit(false)
      }, 100);
    }
  }, [waittingInit])

  if (waittingInit) {
    return (
      <div className="row" data-sticky-container style={{ justifyContent: 'center', alignItems: 'center' }} >
        <span className="spinner spinner-primary" style={{ marginTop: 20 }} ></span>
      </div>
    )
  }

  return (
    <>
      <Helmet
        titleTemplate={formatMessage({ defaultMessage: "Thêm sản phẩm kho" }) + "- UpBase"}
        defaultTitle={formatMessage({ defaultMessage: "Thêm sản phẩm kho" }) + "- UpBase"}
      >
        <meta name="description" content={formatMessage({ defaultMessage: "Thêm sản phẩm kho" }) + "- UpBase"} />
      </Helmet>
      <Formik
        initialValues={initialValues}
        enableReinitialize={true}
        validationSchema={Yup.object().shape(productEditSchema)}
      >
        {
          (formikProps) => {
            const changed = formikProps.values['__changed__']
            return <>
              <RouterPrompt
                when={changed}
                title={formatMessage({ defaultMessage: "Bạn đang tạo sản phẩm. Mọi thông tin bạn nhập trước đó sẽ bị xoá nếu bạn thoát màn hình này. Bạn có chắc chắn muốn thoát?" })}
                cancelText={formatMessage({ defaultMessage: "KHÔNG" })}
                okText={formatMessage({ defaultMessage: "CÓ, THOÁT" })}
                onOK={() => true}
                onCancel={() => false}
              />
              <ProductNewInfo history={history}
                setStep={setStep}
                formikProps={formikProps}
              />
            </>
          }
        }
      </Formik>
    </>
  );
}
