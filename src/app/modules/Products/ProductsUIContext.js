import React, { createContext, useContext, useState, useCallback, useMemo, useRef } from "react";
import { isEqual, isFunction, values } from "lodash";
import { ATTRIBUTE_VALUE_TYPE, initialFilter } from "./ProductsUIHelpers";
import { randomString } from '../../../utils'
import * as Yup from "yup";
import _ from 'lodash'
import { useIntl } from "react-intl";
import op_categories from '../../../graphql/op_categories'
import op_catalog_product_attributes from '../../../graphql/op_catalog_product_attributes'
import { useQuery } from "@apollo/client";
import { useFormikContext } from "formik";
import query_sc_stores from "../../../graphql/query_sc_stores_raw";
import query_sme_catalog_product_tags from "../../../graphql/query_sme_catalog_product_tags";
import query_smeCatalogStores from "../../../graphql/query_smeCatalogStores";

const regex = new RegExp("[^\u0000-\u007F]+")
const ProductsUIContext = createContext();

export function useProductsUIContext() {
  return useContext(ProductsUIContext);
}

export const ProductsUIConsumer = ProductsUIContext.Consumer;

export function ProductsUIProvider({ productsUIEvents, children }) {
  const { formatMessage } = useIntl()
  const { data: dataStores, loading } = useQuery(query_sc_stores)
  const { data: dataProductTags } = useQuery(query_sme_catalog_product_tags, {
    fetchPolicy: 'cache-and-network'
  });
  const { data: dataCatalogStores, loading: loadingCatalogStores, refetch: refetchGetWarehouse } = useQuery(query_smeCatalogStores, {
    fetchPolicy: 'cache-and-network'
  });

  const _PRODUCT_CREATE_BASE_SCHEMA = useRef({
    name: Yup.string()
      .max(255, formatMessage({ defaultMessage: "{name} tối đa {length} ký tự" }, { length: 255, name: formatMessage({ defaultMessage: "Tên sản phẩm" }) }))
      .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: formatMessage({ defaultMessage: "Tên sản phẩm" }).toLowerCase() }))
      .test(
        'chua-ky-tu-space-o-dau-cuoi',
        formatMessage({ defaultMessage: 'Tên sản phẩm kho không được chứa dấu cách ở đầu và cuối' }),
        (value, context) => {
          if (!!value) {
            return value.length == value.trim().length;
          }
          return false;
        },
      )
      .test(
        'chua-ky-tu-2space',
        formatMessage({ defaultMessage: 'Tên sản phẩm kho không được chứa 2 dấu cách liên tiếp' }),
        (value, context) => {
          if (!!value) {
            return !(/\s\s+/g.test(value))
          }
          return false;
        },
      ),
    seoName: Yup.string().required('Vui lòng nhập tên sản phẩm chuẩn SEO.')
      .min(10, formatMessage({ defaultMessage: 'Tên sản phẩm chuẩn SEO tối thiểu 10 ký tự.' }))
      .max(120, formatMessage({ defaultMessage: 'Tên sản phẩm tối đa 120 ký tự.' }))
      .test(
        'chua-ky-tu-space-o-dau-cuoi',
        formatMessage({ defaultMessage: 'Tên sản phẩm chuẩn SEO không được chứa dấu cách ở đầu và cuối.' }),
        (value, context) => {
          if (!!value) {
            return value.length == value.trim().length;
          }
          return false;
        },
      )
      .test(
        'chua-ky-tu-2space',
        formatMessage({ defaultMessage: 'Tên sản phẩm chuẩn SEO không được chứa 2 dấu cách liên tiếp' }),
        (value, context) => {
          if (!!value) {
            return !(/\s\s+/g.test(value))
          }
          return false;
        },
      ).nullable()
    ,
    sku: Yup.string()
      .max(50, formatMessage({ defaultMessage: 'Mã SKU tối đa chỉ được {max} ký tự' }, { max: 50 }))
      .notRequired()
      // .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: 'mã SKU' }))
      .test(
        'chua-ky-tu-space-o-dau-cuoi',
        formatMessage({ defaultMessage: 'SKU không được chứa dấu cách ở đầu và cuối' }),
        (value, context) => {
          if (!!value) {
            return value.length == value.trim().length;
          }
          return true;
        },
      )
      .test(
        'chua-ky-tu-tieng-viet',
        formatMessage({ defaultMessage: 'Mã SKU không được chứa ký tự Tiếng Việt' }),
        (value, context) => {
          if (!!value) {
            return !regex.test(value);
          }
          return true;
        },
      )
      .test(
        'chua-ky-tu-2space',
        formatMessage({ defaultMessage: 'SKU không được chứa 2 dấu cách liên tiếp' }),
        (value, context) => {
          if (!!value) {
            return !(/\s\s+/g.test(value))
          }
          return true;
        },
      )
      .when(`variant-sku_boolean`, {
        is: values => {
          return !!values && !!values[`sku`];
        },
        then: Yup.string().oneOf([`sku`], formatMessage({ defaultMessage: 'Mã SKU này đã được dùng cho sản phẩm khác' }))
      }),
    origin_sku: Yup.string()
      .max(50, formatMessage({ defaultMessage: 'Mã SKU tối đa chỉ được {max} ký tự' }, { max: 50 }))
      .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: 'mã SKU' }))
      .test(
        'chua-ky-tu-space-o-dau-cuoi',
        formatMessage({ defaultMessage: 'SKU không được chứa dấu cách ở đầu và cuối' }),
        (value, context) => {
          if (!!value) {
            return value.length == value.trim().length;
          }
          return false;
        },
      )
      .test(
        'chua-ky-tu-tieng-viet',
        formatMessage({ defaultMessage: 'Mã SKU không được chứa ký tự Tiếng Việt' }),
        (value, context) => {
          if (!!value) {
            return !regex.test(value);
          }
          return true;
        },
      )
      .test(
        'chua-ky-tu-2space',
        formatMessage({ defaultMessage: 'SKU không được chứa 2 dấu cách liên tiếp' }),
        (value, context) => {
          if (!!value) {
            return !(/\s\s+/g.test(value))
          }
          return false;
        },
      )
      .when(`variant-origin-sku_boolean`, {
        is: values => {
          return !!values && !!values["origin_sku"];
        },
        then: Yup.string().oneOf(["origin_sku"], formatMessage({ defaultMessage: 'Mã SKU này đã được dùng cho sản phẩm khác' }))
      }),

    video_url: Yup.string()
      .notRequired()
      .test(
        'youtube-format',
        formatMessage({ defaultMessage: 'Đường dẫn không hợp lệ. Vui lòng chỉ sử dụng link Youtube.' }),
        (value, context) => {
          if ((value || '').length == 0) {
            return true
          }
          if (!!value) {
            return (value || '').toLowerCase().trim().startsWith('https://www.youtube.com') || (value || '').toLowerCase().trim().startsWith('https://youtube.com');
          }
          return false;
        },
      )
    ,
    // stockOnHand: Yup.number()
    //   .min(0, formatMessage({ defaultMessage: "Giá trị cần nhập {min}->{max}" }, { min: 0, max: '999.999' }))
    //   .max(999999, 'Số lượng sản phẩm phải nhỏ hơn 999.999')
    //   .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: 'số lượng sản phẩm' })),

    origin_price: Yup.number().notRequired()
      .min(1000, formatMessage({ defaultMessage: 'Giá tối thiểu là {min}đ' }, { min: '1.000' }))
      .max(120000000, formatMessage({ defaultMessage: 'Giá tối đa là {max}đ' }, { max: '120.000.000' }))
      .when(`origin_costPrice`, values => {
        if (values) {
          return Yup.number()
            .min(values, formatMessage({ defaultMessage: 'Giá bán phải lớn hơn hoặc bằng giá bán tối thiểu' }))
            .max(120000000, formatMessage({ defaultMessage: 'Giá tối đa là {max}đ' }, { max: '120.000.000' }));
        }
      }),
    variant_unit: Yup.string().notRequired().nullable()
      .max(120, formatMessage({ defaultMessage: 'Đơn vị tính tối đa 120 kí tự' })),
    expireTime: Yup.number().notRequired()
      .min(0, formatMessage({ defaultMessage: "Giá trị cần nhập {min}->{max}" }, { min: 0, max: '365' }))
      .max(365, formatMessage({ defaultMessage: 'Mốc cảnh báo tối đa là {max} ngày' }, { max: '365' }))
      .nullable(),
    stopSellingTime: Yup.number().notRequired()
      .min(0, formatMessage({ defaultMessage: "Giá trị cần nhập {min}->{max}" }, { min: 0, max: '365' }))
      .max(365, formatMessage({ defaultMessage: 'Mốc cảnh báo tối đa là {max} ngày' }, { max: '365' }))
      .nullable(),
    origin_costPrice: Yup.number().notRequired()
      .min(1000, formatMessage({ defaultMessage: 'Giá tối thiểu là {min}đ' }, { min: '1.000' }))
      .max(120000000, formatMessage({ defaultMessage: 'Giá tối đa là {max}đ' }, { max: '120.000.000' })),
    origin_stockOnHand: Yup.number()
      .min(0, formatMessage({ defaultMessage: "Giá trị cần nhập {min}->{max}" }, { min: 0, max: '999.999' }))
      .max(999999, formatMessage({ defaultMessage: 'Số lượng sản phẩm tối đa {max}' }, { max: '999.999' })),

    price: Yup.number().notRequired()
      .min(1000, formatMessage({ defaultMessage: 'Giá tối thiểu là {min}đ' }, { min: '1.000' }))
      .max(120000000, formatMessage({ defaultMessage: 'Giá tối đa là {max}đ' }, { max: '120.000.000' }))
      .nullable()
      .when(`priceMinimum`, values => {
        if (values) {
          return Yup.number()
            .min(values, 'Giá bán phải lớn hơn hoặc bằng giá bán tối thiểu')
            .max(120000000, formatMessage({ defaultMessage: 'Giá tối đa là {max}đ' }, { max: '120.000.000' }));
        }
      }),
    brand_name: Yup.string()
      .notRequired()
      .max(120, formatMessage({ defaultMessage: "{name} tối đa {length} ký tự" }, { length: 120, name: 'Thương hiệu' })),
    // costPrice: Yup.number().notRequired()
    //   .min(1000, formatMessage({ defaultMessage: 'Giá tối thiểu là {min}đ' }, { min: '1.000' }))
    //   .max(120000000, formatMessage({ defaultMessage: 'Giá tối đa là {max}đ' }, { max: '120.000.000' })),
    priceMinimum: Yup.number().notRequired()
      .min(1000, formatMessage({ defaultMessage: 'Giá tối thiểu là {min}đ' }, { min: '1.000' }))
      .max(120000000, formatMessage({ defaultMessage: 'Giá tối đa là {max}đ' }, { max: '120.000.000' })).nullable(),
    gtin: Yup.string()
      .test(
        'chua-ky-tu-tieng-viet',
        formatMessage({ defaultMessage: 'GTIN không được chứa ký tự Tiếng Việt' }),
        (value, context) => {
          if (!!value) {
            return !regex.test(value);
          }
          return true;
        },
      )
      .when(`variant-gtin_boolean`, {
        is: values => {
          return !!values && !!values[`gtin`];
        },
        then: Yup.string().oneOf([`gtin`], formatMessage({ defaultMessage: 'GTIN đã tồn tại' }))
      })
      .notRequired()
      .max(120, formatMessage({ defaultMessage: "{name} tối đa {length} ký tự" }, { length: 120, name: 'GTIN' })),
    stockWarning: Yup.number()
      .min(0, formatMessage({ defaultMessage: 'Cảnh báo tồn có thể nhập hợp lệ từ 0 đến 999,999' }))
      .max(999999, formatMessage({ defaultMessage: 'Số lượng sản phẩm tối đa {max}' }, { max: '999.999' }))
      .nullable(),
    unit: Yup.string().nullable()
      .max(120, formatMessage({ defaultMessage: 'Đơn vị tính tối đa {max} kí tự' }, { max: '120' })),
    description: Yup.string()
      .min(100, formatMessage({ defaultMessage: 'Mô tả sản phẩm của bạn quá ngắn. Vui lòng nhập ít nhất {min} kí tự' }, { min: 100 }))
      .max(5000, formatMessage({ defaultMessage: "{name} tối đa {length} ký tự" }, { length: 5000, name: formatMessage({ defaultMessage: 'Mô tả sản phẩm' }) })),
    description_extend_count: Yup.number()
      .notRequired()
      // .min(100, 'Mô tả hình ảnh của bạn quá ngắn. Vui lòng nhập ít nhất 100 kí tự')
      .max(5000, formatMessage({ defaultMessage: "{name} tối đa {length} ký tự" }, { length: 5000, name: formatMessage({ defaultMessage: 'Mô tả hình ảnh' }) }))
    // .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: 'Mô tả hình ảnh' }))
    , 'main-unit': Yup.string()
      .required(formatMessage({defaultMessage: 'Vui lòng nhập đơn vị tính chính'}))
      .max(120, formatMessage({ defaultMessage: 'Đơn vị tính chính tối đa 120 ký tự' }))
      .nullable(),
    weight: Yup.number()
      .notRequired()
      .nullable()
      .min(1, formatMessage({ defaultMessage: "Giá trị cần nhập {min}->{max}" }, { min: 1, max: '999.999' }))
      .max(999999, formatMessage({ defaultMessage: 'Cân nặng tối đa là {max} g' }, { max: '999.999' })),
    // .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: formatMessage({ id: 'PRODUCT_SHIPPING.WEIGHT' }).toLowerCase() })),
    width: Yup.number()
      .notRequired()
      .nullable()
      .min(1, formatMessage({ defaultMessage: "Giá trị cần nhập {min}->{max}" }, { min: 1, max: '1.000.000' }))
      .max(1000000, formatMessage({ defaultMessage: 'Kích thước tối đa là {max} cm' }, { max: '1.000.000' })),
    // .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: formatMessage({ id: 'PRODUCT_SHIPPING.WIDTH' }).toLowerCase() })),
    length: Yup.number()
      .notRequired()
      .nullable()
      .min(1, formatMessage({ defaultMessage: "Giá trị cần nhập {min}->{max}" }, { min: 1, max: '1.000.000' }))
      .max(1000000, formatMessage({ defaultMessage: 'Kích thước tối đa là {max} cm' }, { max: '1.000.000' })),
    // .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: formatMessage({ id: 'PRODUCT_SHIPPING.LENGHT' }).toLowerCase() })),
    height: Yup.number()
      .notRequired()
      .nullable()
      .min(1, formatMessage({ defaultMessage: "Giá trị cần nhập {min}->{max}" }, { min: 1, max: '1.000.000' }))
      .max(1000000, formatMessage({ defaultMessage: 'Kích thước tối đa là {max} cm' }, { max: '1.000.000' })),
    // .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: formatMessage({ id: 'PRODUCT_SHIPPING.HEIGHT' }).toLowerCase() })),
  })

  const [queryParams, setQueryParamsBase] = useState(initialFilter);
  const [isEditProduct, setIsEditProduct] = useState(false);
  const [channelsSelected, setChannelsSelected] = useState([]);
  const [ids, setIds] = useState([]);
  const [attributesSelected, setAttributesSelected] = useState([]);
  const [variants, setVariants] = useState([]);
  const [productEditSchema, setProductEditSchema] = useState({});
  const [variantsUnit, setVariantsUnit] = useState([{ id: randomString(8) }]);
  const [isUnit, setIsUnit] = useState(false);
  const [variantsCombo, setVariantsCombo] = useState([]);
  const [productComboSchema, setProductComboSchema] = useState({});
  const [productFiles, setProductFiles] = useState([])
  const [productSizeChart, setProductSizeChart] = useState()
  const [productImageOrigin, setProductImageOrigin] = useState()
  const [productVideFiles, setProductVideFiles] = useState([])
  const [productAttributeFiles, setProductAttributeFiles] = useState({})
  const [categorySelected, setCategorySelected] = useState()
  const [customAttributes, setCustomAttributes] = useState([])
  const [channelsAvailable, setChannelsAvailable] = useState({})
  const [optionsProductTag, setOptionsProductTag] = useState([]);
  const [smeCatalogStores, setSmeCatalogStores] = useState([]);
  const [currentProduct, setCurrentProduct] = useState()
  const [currentStep, setCurrentStep] = useState(1)
  const [openBlockImage, setOpenBlockImage] = useState(false);
  const [openBlockDescription, setOpenBlockDescription] = useState(false);
  const btnRefCollapseDescription = useRef();
  const btnRefCollapseImage = useRef();
  //
  const [channels, setChannels] = useState()
  const [logisticChannels, setLogisticChannels] = useState({});
  useMemo(
    () => {
      if (dataCatalogStores?.sme_warehouses?.length > 0);

      let optionsCatalogStores = dataCatalogStores?.sme_warehouses?.map(
        _store => ({
          value: _store?.id,
          label: _store?.name,
          isDefault: _store?.is_default
        })
      );

      setSmeCatalogStores(optionsCatalogStores || []);
    }, [dataCatalogStores]
  );

  useMemo(
    () => {
      if (!dataProductTags) return;

      let newOptionsProductTag = dataProductTags?.sme_catalog_product_tags?.map(
        _tag => ({
          value: _tag?.id,
          label: _tag.title
        })
      );

      setOptionsProductTag(newOptionsProductTag);
    }, [dataProductTags]
  )

  useMemo(() => {
    if (!!dataStores) {
      let _stores = _.groupBy(dataStores?.sc_stores, 'connector_channel_code')
      let _channels = {};
      let _channelsAvailable = {};
      (dataStores?.op_connector_channels || []).map(_channel => {
        if (!!_stores[_channel.code] && _stores[_channel.code].length > 0) {
          //filter lại những store đang kết nối
          let stores = _stores[_channel.code].filter(_store => !!_store.status).map(_store => ({ ..._store, isSelected: !!_store.status }));
          if (stores.length > 0) {
            _channels[_channel.code] = {
              channel: _channel,
              stores,
              isSelected: false,
              enable_logistic: _channel.enable_logistic
            }
            _channelsAvailable[_channel.code] = []
          }
        }
      });

      setChannelsAvailable(_channelsAvailable)

      setChannels(_channels)
      console.log('_channels', _channels)
    }
  }, [dataStores])

  const updateProductFiles = useCallback((index, file) => {
    if (!file) {
      let newproductFiles = [...productFiles]
      newproductFiles.splice(index, 1)
      setProductFiles(newproductFiles)
    } else {
      let newproductFiles = [...productFiles]
      newproductFiles[index] = file
      setProductFiles(newproductFiles)
    }
  }, [productFiles])

  //Attributes của upbase
  const { data: upBaseAttributes } = useQuery(op_catalog_product_attributes, {
    variables: {
      attribute_type: 1,
      category_id: categorySelected?.id || "",
      skip: !(categorySelected?.id || null)
    },
    fetchPolicy: 'cache-and-network'
  })
  //Warranty 
  const { data: warrantyData } = useQuery(op_catalog_product_attributes, {
    variables: {
      attribute_type: 2,
      category_id: categorySelected?.id || "",
      skip: !(categorySelected?.id || null)
    },
    fetchPolicy: 'cache-and-network'
  })

  const setQueryParams = useCallback((nextQueryParams) => {
    setQueryParamsBase((prevQueryParams) => {
      if (isFunction(nextQueryParams)) {
        nextQueryParams = nextQueryParams(prevQueryParams);
      }

      if (isEqual(prevQueryParams, nextQueryParams)) {
        return prevQueryParams;
      }

      return nextQueryParams;
    });
  }, []);

  const addVariantsUnit = useCallback(() => {
    setVariantsUnit(prev => prev.concat({ id: randomString(8), codes: [] }))
  }, []);

  const removeVariantsUnit = useCallback((id) => {
    setVariantsUnit(prev => prev.filter(unit => unit?.id != id))
  }, []);

  const addValueToAttributeSelected = useCallback((attribute_id, value) => {
    let newattributesSelected = attributesSelected.map(_att => {
      if (_att.id == attribute_id) {
        return {
          ..._att,
          values: (_att.values || []).concat([{ v: value, code: randomString(8) }])
        }
      }
      return _att;
    })

    setAttributesSelected(newattributesSelected)
  }, [attributesSelected])

  const updateValueToAttributeSelected = useCallback((attribute_id, value, code) => {
    let isExist = false;
    let newattributesSelected = attributesSelected.map(_att => {
      if (_att.id == attribute_id) {
        return {
          ..._att,
          values: (_att.values || []).map((_v, _i) => {
            if (_v.code == code) {
              return {
                ..._v,
                v: value
              }
            }
            if (_v.v == value) {
              isExist = true;
            }
            return _v
          })
        }
      }
      return _att;
    })
    setAttributesSelected(newattributesSelected)
    console.log('updateValueToAttributeSelected', isExist)
    return isExist;
  }, [attributesSelected])

  const removeValueToAttributeSelected = useCallback((attribute_id, code) => {
    let newattributesSelected = attributesSelected.map(_att => {
      if (_att.id == attribute_id) {

        let values = (_att.values || []).filter(_v => _v.code != code)
        return {
          ..._att,
          values
        }
      }
      return _att;
    })

    setAttributesSelected(newattributesSelected)
  }, [attributesSelected])

  //Update table variant
  useMemo(() => {
    let data = [];
    let _filterSelected = attributesSelected.filter(_att => !_att.isInactive)?.sort((a, b) => a.id - b.id)

    if (_filterSelected.length == 1) {
      (_filterSelected[0].values || []).forEach(_value => {
        data.push({
          attribute: `${_filterSelected[0].id}`,
          code: _value.code,
          rowSpans: 1,
          names: [_value.v],
          namesGenSku: [_value.v],
          attributes: [{
            attribute_value_ref_index: _value.code
          }],
          name: _value.v
        })
      })
    }
    if (_filterSelected.length == 2) {
      (_filterSelected[0].values || []).forEach(_value => {
        let sameRow = true;
        (_filterSelected[1].values || []).forEach(_value2 => {
          let names = !sameRow ? [_value2.v] : [_value.v, _value2.v]
          data.push({
            attribute: `${_filterSelected[0].id}-${_filterSelected[1].id}`,
            code: `${_value.code}-${_value2.code}`,
            rowSpans: [_filterSelected[1].values.length, 1],
            // rowSpan: sameRow ? _filterSelected[1].values.length : 1,
            names,
            namesGenSku: [_value.v, _value2.v],
            attributes: [
              {
                attribute_value_ref_index: _value.code
              },
              {
                attribute_value_ref_index: _value2.code
              },
            ],
            name: [_value.v, _value2.v].join(' + ')
          })
          sameRow = false;
        })
      })
    }


    if (_filterSelected.length == 3) {
      (_filterSelected[0].values || []).forEach(_value => {
        let sameRow = true;
        (_filterSelected[1].values || []).forEach(_value2 => {
          let sameRow2 = true;
          (_filterSelected[2].values || []).forEach(_value3 => {
            let names = !sameRow ? (!sameRow2 ? [null, null, _value3.v] : [null, _value2.v, _value3.v]) : [_value.v, _value2.v, _value3.v]
            data.push({
              attribute: `${_filterSelected[0].id}-${_filterSelected[1].id}-${_filterSelected[2].id}`,
              code: `${_value.code}-${_value2.code}-${_value3.code}`,
              // rowSpan: sameRow ? _filterSelected[1].values.length * _filterSelected[2].values.length : (sameRow2 ? _filterSelected[2].values.length : 1),
              rowSpans: [_filterSelected[1].values.length * _filterSelected[2].values.length, _filterSelected[2].values.length, 1],
              names: names,
              namesGenSku: [_value.v, _value2.v, _value3.v],
              attributes: [
                {
                  attribute_value_ref_index: _value.code
                },
                {
                  attribute_value_ref_index: _value2.code
                },
                {
                  attribute_value_ref_index: _value3.code
                },
              ],
              name: [_value.v, _value2.v, _value3.v].join(' + ')
            })
            sameRow2 = false;
            sameRow = false;
          })
        });
      });
    }

    setVariants(data);
  }, [attributesSelected])

  //Update schema
  useMemo(() => {
    let schema = {
      ..._PRODUCT_CREATE_BASE_SCHEMA.current
    };
    // validate SKU case co nhom pl + dvt
    (variants || []).forEach(variant => {
      console.log('variant.codes',variant, variantsUnit);
      (variantsUnit || []).filter(_unit => _unit.codes?.join('') == variant.code).forEach(unit => {
        schema[`unit_variant-${unit?.id}-${variant.code}-sku`] = Yup.string()
          .max(50, formatMessage({ defaultMessage: 'Mã SKU tối đa chỉ được 50 ký tự' }))
          .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: 'mã SKU' }))
          .test(
            'chua-ky-tu-space-o-dau-cuoi',
            formatMessage({ defaultMessage: 'SKU không được chứa dấu cách ở đầu và cuối' }),
            (value, context) => {
              if (!!value) {
                return value.length == value.trim().length;
              }
              return false;
            },
          )
          .test(
            'chua-ky-tu-tieng-viet',
            formatMessage({ defaultMessage: 'Mã SKU không được chứa ký tự Tiếng Việt' }),
            (value, context) => {
              if (!!value) {
                return !regex.test(value);
              }
              return true;
            },
          )
          .test('chua-ky-tu-2space', formatMessage({ defaultMessage: 'SKU không được chứa 2 dấu cách liên tiếp' }),
            (value, context) => {
              if (!!value) {
                return !(/\s\s+/g.test(value))
              }
              return false;
            }
          ).when('variant-sku_boolean', {
            is: values => {
              return !!values && !!values[`${unit?.id}-${variant.code}`];
            },
            then: Yup.string().oneOf([`${unit?.id}-${variant.code}`], formatMessage({ defaultMessage: 'Mã SKU này đã được dùng cho sản phẩm khác' }))
          })
      })
    })


    let hasVariant = false;
    let _filterSelected = attributesSelected.filter(_att => !_att.isInactive)
    schema[`main-unit`] = Yup.string().nullable()
      .max(120, formatMessage({ defaultMessage: "Đơn vị tính chính tối đa 120 ký tự" }, { price: '120' }))
      .when(`switch-unit`, {
        is: values => {
          return !!values
        },
        then: Yup.string().required(formatMessage({ defaultMessage: 'Vui lòng nhập đơn vị tính chính' }))
      })
      if(isUnit) {
        //Can check them khong co nhom phan loai thi tao loai nay
        _filterSelected.length == 0 && variantsUnit.forEach((_value, index) => {
          console.log('_value',_value)
          schema[`name-unit-${_value?.id}`] = Yup.string().required(formatMessage({ defaultMessage: 'Vui lòng nhập đơn vị chuyển đổi' })).nullable()
            .max(120, formatMessage({ defaultMessage: "Đơn vị tính chính tối đa 120 ký tự" }, { price: '120' }))
            .when(`variant-unit_boolean`, {
              is: values => {
                return !!values && !!values[`${_value?.id}`];
              },
              then: Yup.string().oneOf([`${_value?.id}`], formatMessage({ defaultMessage: 'Tên đơn vị tính đã tồn tại' }))
            }).when(`main-unit_boolean`, {
              is: values => {
                return !!values && !!values[`${_value?.id}`];
              },
              then: Yup.string().oneOf([`${_value?.id}`], formatMessage({ defaultMessage: 'Tên đơn vị tính đã tồn tại' }))
            })
    
          schema[`ratio-unit-${_value?.id}`] = Yup.number().required(formatMessage({ defaultMessage: 'Vui lòng nhập tỷ lệ chuyển đổi về ĐVT' })).min(1, (formatMessage({ defaultMessage: 'Tỷ lệ chuyển đổi về ĐVT phải lớn hơn 0.' })))
            .max(999999, formatMessage({ defaultMessage: "Tỷ lệ chuyển đổi về ĐVT phải nhỏ hơn hoặc bằng 999.999" }))
    
          schema[`attribute-unit-${_value?.id}`] = Yup.string().required(formatMessage({ defaultMessage: 'Vui lòng chọn phân loại' }))
    
          schema[`variant-${_value.id}-price`] = Yup.number()
            .transform((value) => Number.isNaN(value) ? null : value)
            .min(1000, formatMessage({ defaultMessage: "Giá tối thiểu {price}đ" }, { price: '1.000' }))
            .max(120000000, formatMessage({ defaultMessage: "Giá tối đa {price}đ" }, { price: '120.000.000' }))
            .when(`variant-${_value.id}-priceMinimum`, values => {
              if (values) {
                return Yup.number()
                  .min(values, formatMessage({ defaultMessage: 'Giá bán phải lớn hơn hoặc bằng giá bán tối thiểu' }))
                  .max(120000000, formatMessage({ defaultMessage: 'Giá tối đa là {max}đ' }, { max: '120.000.000' }))
                  .nullable();
              }
            }).nullable()
    
          // schema[`variant-${_value.id}-costPrice`] = Yup.number()
          //   .transform((value) => Number.isNaN(value) ? null : value)
          //   .min(1000, formatMessage({ defaultMessage: "Giá tối thiểu {price}đ" }, { price: '1.000' }))
          //   .max(120000000, formatMessage({ defaultMessage: "Giá tối đa {price}đ" }, { price: '120.000.000' }))
          //   .nullable()
    
          schema[`variant-${_value.id}-priceMinimum`] = Yup.number()
            .transform((value) => Number.isNaN(value) ? null : value)
            .min(1000, formatMessage({ defaultMessage: "Giá tối thiểu {price}đ" }, { price: '1.000' }))
            .max(120000000, formatMessage({ defaultMessage: "Giá tối đa {price}đ" }, { price: '120.000.000' }))
            .nullable()
    
    
          schema[`variant-sku_boolean`] = Yup.object().notRequired()
          schema[`variant-unit_boolean`] = Yup.object().notRequired()
          schema[`variant-gtin_boolean`] = Yup.object().notRequired()
    
    
          schema[`variant-${_value.id}-gtin`] = Yup.string()
            .test(
              'chua-ky-tu-tieng-viet',
              formatMessage({ defaultMessage: 'GTIN không được chứa ký tự Tiếng Việt' }),
              (value, context) => {
                if (!!value) {
                  return !regex.test(value);
                }
                return true;
              },
            )
            .when(`variant-gtin_boolean`, {
              is: values => {
                return !!values && !!values[_value.id];
              },
              then: Yup.string().oneOf([_value.id], formatMessage({ defaultMessage: 'GTIN đã tồn tại' }))
            })
            .max(120, formatMessage({ defaultMessage: "{name} tối đa {length} ký tự" }, { length: 120, name: 'GTIN' }))
            .nullable()
          schema[`unit_variant-${_value.id}-sku`] = Yup.string()
            .max(50, formatMessage({ defaultMessage: 'Mã SKU tối đa chỉ được 50 ký tự' }))
            .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: 'mã SKU' }))
            .test(
              'chua-ky-tu-space-o-dau-cuoi',
              formatMessage({ defaultMessage: 'SKU không được chứa dấu cách ở đầu và cuối' }),
              (value, context) => {
                if (!!value) {
                  return value.length == value.trim().length;
                }
                return false;
              },
            )
            .test(
              'chua-ky-tu-tieng-viet',
              formatMessage({ defaultMessage: 'Mã SKU không được chứa ký tự Tiếng Việt' }),
              (value, context) => {
                if (!!value) {
                  return !regex.test(value);
                }
                return true;
              },
            )
            .test('chua-ky-tu-2space', formatMessage({ defaultMessage: 'SKU không được chứa 2 dấu cách liên tiếp' }),
              (value, context) => {
                if (!!value) {
                  return !(/\s\s+/g.test(value))
                }
                return false;
              }
            ).when('variant-unit-sku-boolean', {
              is: values => {
                return !!values && !!values[`${_value?.id}`];
              },
              then: Yup.string().oneOf([`${_value?.id}`], formatMessage({ defaultMessage: 'Mã SKU này đã được dùng cho sản phẩm khác' }))
            })
    
        });
      }
    


      if (_filterSelected.length == 1) {      
      let values = (_filterSelected[0].values || []);
      values.forEach((_value, index) => {
        schema[`variant-${_value.code}-price`] = Yup.number()
          .min(1000, formatMessage({ defaultMessage: "Giá tối thiểu {price}đ" }, { price: '1.000' }))
          .max(120000000, formatMessage({ defaultMessage: "Giá tối đa {price}đ" }, { price: '120.000.000' }))
          .nullable()
          .when(`variant-${_value.code}-priceMinimum`, values => {
            if (values) {
              return Yup.number()
                .min(values, formatMessage({ defaultMessage: 'Giá bán phải lớn hơn hoặc bằng giá bán tối thiểu' }))
                .max(120000000, formatMessage({ defaultMessage: 'Giá tối đa là {max}đ' }, { max: '120.000.000' }))
                .nullable();
            }
          })
        // schema[`variant-${_value.code}-costPrice`] = Yup.number()
        //   .min(1000, formatMessage({ defaultMessage: "Giá tối thiểu {price}đ" }, { price: '1.000' }))
        //   .max(120000000, formatMessage({ defaultMessage: "Giá tối đa {price}đ" }, { price: '120.000.000' }))
        //   .nullable()
        schema[`variant-${_value.code}-priceMinimum`] = Yup.number()
          .min(1000, formatMessage({ defaultMessage: "Giá tối thiểu {price}đ" }, { price: '1.000' }))
          .max(120000000, formatMessage({ defaultMessage: "Giá tối đa {price}đ" }, { price: '120.000.000' }))
          .nullable()


        // schema[`variant-${_value.code}-stockOnHand`] = Yup.number()
        //   .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: 'tồn kho' }))
        //   .min(0, formatMessage({ defaultMessage: "Giá trị cần nhập {min}->{max}" }, { min: 0, max: '999.999' }))
        //   .max(999999, formatMessage({ defaultMessage: "Giá trị cần nhập {min}->{max}" }, { min: 0, max: '999.999' }))
        schema[`variant-sku_boolean`] = Yup.object().notRequired()
        schema[`variant-unit_boolean`] = Yup.object().notRequired()
        schema[`variant-gtin_boolean`] = Yup.object().notRequired()

        schema[`variant-${_value.code}-gtin`] = Yup.string()
          .test(
            'chua-ky-tu-tieng-viet',
            formatMessage({ defaultMessage: 'GTIN không được chứa ký tự Tiếng Việt' }),
            (value, context) => {
              if (!!value) {
                return !regex.test(value);
              }
              return true;
            },
          )
          .when(`variant-gtin_boolean`, {
            is: values => {
              return !!values && !!values[_value.code];
            },
            then: Yup.string().oneOf([_value.code], formatMessage({ defaultMessage: 'GTIN đã tồn tại' }))
          })
          .max(120, formatMessage({ defaultMessage: "{name} tối đa {length} ký tự" }, { length: 120, name: 'GTIN' }))
          .nullable()
        schema[`variant-${_value.code}-sku`] = Yup.string()
          .max(50, formatMessage({ defaultMessage: 'Mã SKU tối đa chỉ được 50 ký tự' }))
          .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: 'mã SKU' }))
          .test(
            'chua-ky-tu-space-o-dau-cuoi',
            formatMessage({ defaultMessage: 'SKU không được chứa dấu cách ở đầu và cuối' }),
            (value, context) => {
              if (!!value) {
                return value.length == value.trim().length;
              }
              return false;
            },
          )
          .test(
            'chua-ky-tu-tieng-viet',
            formatMessage({ defaultMessage: 'Mã SKU không được chứa ký tự Tiếng Việt' }),
            (value, context) => {
              if (!!value) {
                return !regex.test(value);
              }
              return true;
            },
          )
          .test(
            'chua-ky-tu-2space',
            formatMessage({ defaultMessage: 'SKU không được chứa 2 dấu cách liên tiếp' }),
            (value, context) => {
              if (!!value) {
                return !(/\s\s+/g.test(value))
              }
              return false;
            },
          )
          .when(`variant-sku_boolean`, {
            is: values => {
              return !!values && !!values[_value.code];
            },
            then: Yup.string().oneOf([_value.code], formatMessage({ defaultMessage: 'Mã SKU này đã được dùng cho sản phẩm khác' }))
          })

        schema[`variant-${_value.code}-unit`] = Yup.string().nullable()
          .max(120, formatMessage({ defaultMessage: 'Đơn vị tính tối đa chỉ được 120 ký tự' }))

        let _values = [...values];
        _values.splice(index, 1);
        schema[`att-${_filterSelected[0].id}-${_value.code}`] = Yup.string()
          .max(20, formatMessage({ defaultMessage: "{name} tối đa {length} ký tự" }, { length: 20, name: (_filterSelected[0].display_name || '').toLowerCase() }))
          .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: (_filterSelected[0].display_name || '').toLowerCase() }))
          .notOneOf(_values.map(_vvv => _vvv?.v), formatMessage({ defaultMessage: "Phân loại đã tồn tại" }))

        hasVariant = true;
      });
    }
    if (_filterSelected.length == 2) {
      let values = (_filterSelected[0].values || []);
      values.forEach((_value, index) => {
        let _values = [...values];
        _values.splice(index, 1);
        schema[`att-${_filterSelected[0].id}-${_value.code}`] = Yup.string()
          .max(20, formatMessage({ defaultMessage: "{name} tối đa {length} ký tự" }, { length: 20, name: (_filterSelected[0].display_name || '').toLowerCase() }))
          .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: (_filterSelected[0].display_name || '').toLowerCase() }))
          .notOneOf(_values.map(_vvv => _vvv.v), formatMessage({ defaultMessage: "Phân loại đã tồn tại" }))

        let valuesSub2 = (_filterSelected[1].values || []);

        valuesSub2.forEach((_value2, index2) => {
          schema[`variant-${_value.code}-${_value2.code}-price`] = Yup.number().min(1000, formatMessage({ defaultMessage: "Giá tối thiểu {price}đ" }, { price: '1.000' }))
            .max(120000000, formatMessage({ defaultMessage: "Giá tối đa {price}đ" }, { price: '120.000.000' }))
            .nullable()
            .when(`variant-${_value.code}-${_value2.code}-priceMinimum`, values => {
              if (values) {
                return Yup.number()
                  .min(values, formatMessage({ defaultMessage: 'Giá bán phải lớn hơn hoặc bằng giá bán tối thiểu' }))
                  .max(120000000, formatMessage({ defaultMessage: 'Giá tối đa là {max}đ' }, { max: '120.000.000' }))
                  .nullable();
              }
            })
          // schema[`variant-${_value.code}-${_value2.code}-costPrice`] = Yup.number().min(1000, formatMessage({ defaultMessage: "Giá tối thiểu {price}đ" }, { price: '1.000' }))
          //   .max(120000000, formatMessage({ defaultMessage: "Giá tối đa {price}đ" }, { price: '120.000.000' }))
          //   .nullable();
          schema[`variant-${_value.code}-${_value2.code}-priceMinimum`] = Yup.number().min(1000, formatMessage({ defaultMessage: "Giá tối thiểu {price}đ" }, { price: '1.000' }))
            .max(120000000, formatMessage({ defaultMessage: "Giá tối đa {price}đ" }, { price: '120.000.000' }))
            .nullable();
          schema[`variant-${_value.code}-${_value2.code}-vatRate`] = Yup.number()
            .min(0, formatMessage({ defaultMessage: "VAT tối thiểu 0%" }))
            .max(100, formatMessage({ defaultMessage: "VAT tối đa 100%" }))
            .nullable()
          schema[`variant-${_value.code}-${_value2.code}-gtin`] = Yup.string()
            .test(
              'chua-ky-tu-tieng-viet',
              formatMessage({ defaultMessage: 'GTIN không được chứa ký tự Tiếng Việt' }),
              (value, context) => {
                if (!!value) {
                  return !regex.test(value);
                }
                return true;
              },
            )
            .when(`variant-gtin_boolean`, {
              is: values => {
                return !!values && !!values[`${_value.code}-${_value2.code}`];
              },
              then: Yup.string().oneOf([`${_value.code}-${_value2.code}`], formatMessage({ defaultMessage: 'GTIN đã tồn tại' }))
            })
            .max(120, formatMessage({ defaultMessage: "{name} tối đa {length} ký tự" }, { length: 120, name: 'GTIN' }))
            .nullable();

          // schema[`variant-${_value.code}-${_value2.code}-stockOnHand`] = Yup.number()
          //   .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: 'tồn kho' }))
          //   .min(0, formatMessage({ defaultMessage: "Giá trị cần nhập {min}->{max}" }, { min: 0, max: '999.999' }))
          //   .max(999999, formatMessage({ defaultMessage: "Giá trị cần nhập {min}->{max}" }, { min: 0, max: '999.999' }))
          schema[`variant-gtin_boolean`] = Yup.object().notRequired()
          schema[`variant-sku_boolean`] = Yup.object().notRequired()
          schema[`variant-${_value.code}-${_value2.code}-sku`] = Yup.string().required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: 'SKU' }))
            .max(50, formatMessage({ defaultMessage: "{name} tối đa {length} ký tự" }, { length: 50, name: (_filterSelected[1].display_name || '').toLowerCase() }))
            .test(
              'chua-ky-tu-space-o-dau-cuoi',
              formatMessage({ defaultMessage: 'SKU không được chứa dấu cách ở đầu và cuối' }),
              (value, context) => {
                if (!!value) {
                  return value.length == value.trim().length;
                }
                return false;
              },
            )
            .test(
              'chua-ky-tu-tieng-viet',
              formatMessage({ defaultMessage: 'Mã SKU không được chứa ký tự Tiếng Việt' }),
              (value, context) => {
                if (!!value) {
                  return !regex.test(value);
                }
                return true;
              },
            )
            .test(
              'chua-ky-tu-2space',
              formatMessage({ defaultMessage: 'SKU không được chứa 2 dấu cách liên tiếp' }),
              (value, context) => {
                if (!!value) {
                  return !(/\s\s+/g.test(value))
                }
                return false;
              },
            )
            .when(`variant-sku_boolean`, {
              is: values => {                
                return !!values && !!values[`${_value.code}-${_value2.code}`];
              },
              then: Yup.string().oneOf([`${_value.code}-${_value2.code}`], formatMessage({ defaultMessage: 'Mã SKU này đã được dùng cho sản phẩm khác' }))
            })
          schema[`variant-${_value.code}-${_value2.code}-unit`] = Yup.string().nullable()
            .max(120, formatMessage({ defaultMessage: 'Đơn vị tính tối đa chỉ được 120 ký tự' }))
          if (index == 0) {
            let _valuesSub2 = [...valuesSub2];
            _valuesSub2.splice(index2, 1);
            schema[`att-${_filterSelected[1].id}-${_value2.code}`] = Yup.string()
              .max(20, formatMessage({ defaultMessage: "{name} tối đa {length} ký tự" }, { length: 20, name: (_filterSelected[1].display_name || '').toLowerCase() }))
              .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: (_filterSelected[1].display_name || '').toLowerCase() }))
              .notOneOf(_valuesSub2.map(_vvv => _vvv.v), formatMessage({ defaultMessage: "Phân loại đã tồn tại" }))
          }


          hasVariant = true;
        });
      });
    }

    if (currentStep == 2) {
      Object.keys(channelsAvailable).forEach(_code => {
        schema[`category-${_code}`] = Yup.array().when(`category-${_code}-selected`, {
          is: true,
          then: Yup.array().required(formatMessage({ defaultMessage: "Vui lòng chọn {name}" }, { name: 'ngành hàng' })),
          otherwise: Yup.array().notRequired()
        })
        schema[`brand-${_code}`] = Yup.object().when(`category-${_code}-selected`, {
          is: true,
          then: Yup.object().required(formatMessage({ defaultMessage: "Vui lòng chọn {name}" }, { name: formatMessage({ defaultMessage: "THÔNG TIN CƠ BẢN" }).toLowerCase() })),
          otherwise: Yup.object().notRequired()
        })


        channelsAvailable[_code].forEach(_property => {
          if (_property.unit_options?.length > 0) {
            schema[`${_code}-property-${_property.id}-unit`] = Yup.string().notRequired()
          }
          if (_property.is_mandatory) {
            if (_property.input_type == ATTRIBUTE_VALUE_TYPE.TEXT)
              schema[`${_code}-property-${_property.id}`] = Yup.string().when(`category-${_code}-selected`, {
                is: true,
                then: Yup.string().required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: (_property.display_name || '').toLowerCase() })),
                otherwise: Yup.string().notRequired()
              })
            if (_property.input_type == ATTRIBUTE_VALUE_TYPE.NUMERIC)
              schema[`${_code}-property-${_property.id}`] = Yup.number().when(`category-${_code}-selected`, {
                is: true,
                then: Yup.number().required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: (_property.display_name || '').toLowerCase() })),
                otherwise: Yup.number().notRequired()
              })
            if (_property.input_type == ATTRIBUTE_VALUE_TYPE.SINGLE_SELECT)
              schema[`${_code}-property-${_property.id}`] = Yup.object().when(`category-${_code}-selected`, {
                is: true,
                then: Yup.object().required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: (_property.display_name || '').toLowerCase() })),
                otherwise: Yup.object().notRequired()
              })
            if (_property.input_type == ATTRIBUTE_VALUE_TYPE.MULTIPLE_SELECT)
              schema[`${_code}-property-${_property.id}`] = Yup.array().when(`category-${_code}-selected`, {
                is: true,
                then: Yup.array().required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: (_property.display_name || '').toLowerCase() })),
                otherwise: Yup.array().notRequired()
              })
            if (_property.input_type == ATTRIBUTE_VALUE_TYPE.DATE)
              schema[`${_code}-property-${_property.id}`] = Yup.string().when(`category-${_code}-selected`, {
                is: true,
                then: Yup.string().required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: (_property.display_name || '').toLowerCase() })),
                otherwise: Yup.string().notRequired()
              })
          } else {
            if (_property.input_type == ATTRIBUTE_VALUE_TYPE.TEXT)
              schema[`${_code}-property-${_property.id}`] = Yup.string().notRequired()
            if (_property.input_type == ATTRIBUTE_VALUE_TYPE.NUMERIC)
              schema[`${_code}-property-${_property.id}`] = Yup.number().notRequired()
            if (_property.input_type == ATTRIBUTE_VALUE_TYPE.SINGLE_SELECT)
              schema[`${_code}-property-${_property.id}`] = Yup.object().notRequired()
            if (_property.input_type == ATTRIBUTE_VALUE_TYPE.MULTIPLE_SELECT)
              schema[`${_code}-property-${_property.id}`] = Yup.array().notRequired()
            if (_property.input_type == ATTRIBUTE_VALUE_TYPE.DATE)
              schema[`${_code}-property-${_property.id}`] = Yup.string().notRequired()
          }
        });
      });
    }

    console.log('schema',isUnit,schema)
    setProductEditSchema(schema)
  }, [isUnit, attributesSelected, variants, channelsAvailable, variantsUnit, currentStep]);

  useMemo(
    () => {
      let schema = {
        ..._PRODUCT_CREATE_BASE_SCHEMA.current,
        [`variant-total-ratio-boolean`]: Yup.object().notRequired()
      };

      for (let i = 0; i < variantsCombo.length; i++) {
        let variant = variantsCombo[i];
        schema[`variant-combo-${variant?.id}-quantity`] = Yup.number()
          .required(formatMessage({ defaultMessage: "Vui lòng nhập số lượng" }))
          .min(1, formatMessage({ defaultMessage: 'Giá trị cần nhập từ {min} → {max}' }, { min: '1', max: '999.999' }))
          .max(999999, formatMessage({ defaultMessage: 'Giá trị cần nhập từ {min} → {max}' }, { min: '1', max: '999.999' }))
        schema[`variant-combo-${variant?.id}-costRatioValue`] = Yup.number()
          .required(formatMessage({ defaultMessage: "Vui lòng nhập tỷ lệ phân bổ giá" }))
          .min(1, formatMessage({ defaultMessage: 'Giá trị cần nhập từ {min} → {max}' }, { min: '1', max: '100' }))
          .max(100, formatMessage({ defaultMessage: 'Giá trị cần nhập từ {min} → {max}' }, { min: '1', max: '100' }))
      }

      setProductComboSchema(schema);
    }, [variantsCombo]
  );


  const resetAll = useCallback(() => {
    setVariantsUnit([])
    setVariantsCombo([]);
    setProductComboSchema({});
    setChannelsSelected([])
    setAttributesSelected([])
    setVariants([])
    setProductEditSchema({})
    setProductFiles([])
    setProductVideFiles([])
    setProductAttributeFiles({})
    setCategorySelected(null)
    setCustomAttributes([])
    setIsEditProduct(false)
    setCurrentProduct()
    setLogisticChannels({})
    setProductSizeChart()
    setProductImageOrigin()
    setOpenBlockImage(false)
    setOpenBlockDescription(false)
    setIsUnit(false)
  }, [])

  const value = {
    queryParams,
    setQueryParamsBase,
    ids,
    setIds,
    productEditComboSchema: {
      ..._PRODUCT_CREATE_BASE_SCHEMA.current
    },
    variantsCombo,
    setVariantsCombo,
    productComboSchema,
    setProductComboSchema,
    setQueryParams,
    channelsSelected, setChannelsSelected,
    attributes: upBaseAttributes?.op_catalog_product_attributes || [], attributesSelected, setAttributesSelected,
    variantsUnit, addVariantsUnit, removeVariantsUnit, setVariantsUnit,
    addValueToAttributeSelected, removeValueToAttributeSelected, updateValueToAttributeSelected,
    variants, productEditSchema,
    productFiles, setProductFiles, updateProductFiles,
    productAttributeFiles, setProductAttributeFiles,
    productVideFiles, setProductVideFiles,
    categorySelected, setCategorySelected,
    customAttributes, setCustomAttributes,
    warrantiesList: warrantyData?.op_catalog_product_attributes || [],
    resetAll, isEditProduct, setIsEditProduct,
    channels, setChannels,
    setChannelsAvailable, channelsAvailable,
    currentProduct, setCurrentProduct,
    currentStep, setCurrentStep,
    optionsProductTag, smeCatalogStores,
    logisticChannels, setLogisticChannels,
    productSizeChart, setProductSizeChart,
    productImageOrigin, setProductImageOrigin,
    openBlockImage, setOpenBlockImage,
    openBlockDescription, setOpenBlockDescription,
    btnRefCollapseDescription, btnRefCollapseImage,
    refetchGetWarehouse,
    setIsUnit,
    isUnit
  };

  return (
    <ProductsUIContext.Provider value={value}>
      {children}
    </ProductsUIContext.Provider>
  );
}
