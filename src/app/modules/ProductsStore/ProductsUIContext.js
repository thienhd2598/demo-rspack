import React, { createContext, useContext, useState, useCallback, useMemo, useRef } from "react";
import { isEqual, isFunction } from "lodash";
import { ATTRIBUTE_VALUE_TYPE, initialFilter } from "./ProductsUIHelpers";
import { getMaxLengthSKU, randomString } from '../../../utils'
import * as Yup from "yup";
import _ from 'lodash'
import { useIntl } from "react-intl";
import op_categories from '../../../graphql/op_categories'
import op_catalog_product_attributes from '../../../graphql/op_catalog_product_attributes'
import { useQuery } from "@apollo/client";
import { useFormikContext } from "formik";
import query_sc_stores from "../../../graphql/query_sc_stores_raw";
import query_scTags from "../../../graphql/query_scTags";
import query_smeCatalogStores from "../../../graphql/query_smeCatalogStores";
import query_scGetWarehouses from "../../../graphql/query_scGetWarehouses";

const regex = new RegExp("[^\u0000-\u007F]+")

const ProductsUIContext = createContext();

export function useProductsUIContext() {
  return useContext(ProductsUIContext);
}

export const ProductsUIConsumer = ProductsUIContext.Consumer;

export function ProductsUIProvider({ productsUIEvents, children }) {

  const { formatMessage } = useIntl()

  const { data: dataProductTags } = useQuery(query_scTags, {
    fetchPolicy: 'cache-and-network'
  });
  const { data: dataCatalogStores, loading: loadingCatalogStores, refetch: refetchGetWarehouse } = useQuery(query_smeCatalogStores, {
    fetchPolicy: 'cache-and-network'
  });


  const _PRODUCT_CREATE_BASE_SCHEMA = useRef({
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
    description_extend_count: Yup.number()
      .notRequired()
      // .min(100, 'Mô tả hình ảnh của bạn quá ngắn. Vui lòng nhập ít nhất 100 kí tự')
      .max(5000, formatMessage({ defaultMessage: "{name} tối đa {length} ký tự" }, { length: 5000, name: formatMessage({ defaultMessage: 'Mô tả hình ảnh' }) }))
    // .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: 'Mô tả hình ảnh' }))
    ,
    description: Yup.string()
      .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: formatMessage({ defaultMessage: 'mô tả sản phẩm' }) }))
      .min(100, formatMessage({ defaultMessage: "{name} phải có tối thiểu {length} ký tự" }, { length: 100, name: formatMessage({ defaultMessage: 'Mô tả sản phẩm' }) }))
      .max(5000, formatMessage({ defaultMessage: "{name} tối đa {length} ký tự" }, { length: 5000, name: formatMessage({ defaultMessage: 'Mô tả sản phẩm' }) })),
    // .when(`channel_code`, {
    //   is: values => {
    //     return values == 'shopee';
    //   },
    //   then: Yup.string().required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: formatMessage({ defaultMessage: 'mô tả sản phẩm'}) }))
    // }),

    // weight: Yup.number()
    //   .min(1, formatMessage({ defaultMessage: "Giá trị cần nhập {min}->{max}" }, { min: 1, max: '999.999' }))
    //   .max(999999, 'Cân nặng phải nhỏ hơn 999.999 g')
    //   .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: formatMessage({ id: 'PRODUCT_SHIPPING.WEIGHT' }).toLowerCase() })),
  })
  const [attributesSelected, setAttributesSelected] = useState([]);
  const [variants, setVariants] = useState([]);
  const [productEditSchema, setProductEditSchema] = useState({});
  const [productFiles, setProductFiles] = useState([])
  const [productVideFiles, setProductVideFiles] = useState([])
  const [productAttributeFiles, setProductAttributeFiles] = useState({})
  const [categorySelected, setCategorySelected] = useState()
  const [customAttributes, setCustomAttributes] = useState([])
  const [properties, setProperties] = useState([]);
  const [smeProduct, setSmeProduct] = useState()
  const [productEditing, setProductEditing] = useState()
  const [currentChannel, setCurrentChannel] = useState()
  const [productSizeChart, setProductSizeChart] = useState()
  const [productImageOrigin, setProductImageOrigin] = useState()
  const [special_type, setspecial_type] = useState(0)
  const [optionsProductTag, setOptionsProductTag] = useState([]);
  const [logisticChannels, setLogisticChannels] = useState({})
  const [ids, setIds] = useState([]);
  const [isCheckMapAttribute, setCheckMapAttribute] = useState(false);
  const [openBlockImage, setOpenBlockImage] = useState(false);
  const [currentFrameProduct, setCurrentFrameProduct] = useState(null);
  const [openBlockDescription, setOpenBlockDescription] = useState(false);
  const [smeCatalogStores, setSmeCatalogStores] = useState([]);
  const [scWarehouses, setScWarehouses] = useState([]);

  const [creationMethod, setCreationMethod] = useState(0)

  const btnRefCollapseDescription = useRef();
  const btnRefCollapseImage = useRef();

  useMemo(
    () => {
      if (!dataProductTags) return;

      let newOptionsProductTag = dataProductTags?.ScTags?.map(
        _tag => ({
          value: _tag?.id,
          label: _tag?.tag_name,
        })
      );

      setOptionsProductTag(newOptionsProductTag);
    }, [dataProductTags]
  );
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

  const { data: dataScWareHouse } = useQuery(query_scGetWarehouses, {
    variables: {
      store_id: currentChannel?.value
    },
    skip: !currentChannel,
    fetchPolicy: 'cache-and-network',
  });

  useMemo(() => {
    const scWarehouses = dataScWareHouse?.scGetWarehouses
      ?.filter(wh => wh?.warehouse_type == 1)
      ?.map(wh => ({
        value: wh?.id,
        label: wh?.warehouse_name,
        isDefault: wh?.is_default
      }));

    setScWarehouses(scWarehouses || []);
  }, [dataScWareHouse]);

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

  const addValueToAttributeSelected = useCallback((attribute_id, value) => {
    console.log('addValueToAttributeSelected', attributesSelected)
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

  const updateValueToAttributeSelected = useCallback((attribute_id, value, code, isShopee = false) => {
    let isExist = false;
    let newattributesSelected = attributesSelected.map(_att => {
      if (_att.id == attribute_id) {
        return {
          ..._att,
          values: (_att.values || []).map((_v, _i) => {
            if (_v.code == code) {
              return {
                ..._v,
                ...(isShopee ? {
                  sc_attribute_group_id: value?.sc_attribute_group_id,
                  sc_option_id: value?.id,
                  v: value?.label,
                } : {
                  v: value
                })
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
    let _filterSelected = attributesSelected.filter(_att => !_att?.isInactive).sort((a, b) => a.position - b.position); //fix UPBASE-2753
    console.log('attributesSelected', _filterSelected, _filterSelected.length)
    if (_filterSelected.length == 1) {
      (_filterSelected[0].values || []).forEach(_value => {
        data.push({
          attribute: `${_filterSelected[0].id}`,
          code: _value.code,
          rowSpan: 1,
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
            rowSpan: sameRow ? _filterSelected[1].values.length : 1,
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
      ..._PRODUCT_CREATE_BASE_SCHEMA.current,
      sku: Yup.string()
        .max(getMaxLengthSKU(currentChannel?.connector_channel_code), formatMessage({ defaultMessage: `Mã SKU tối đa chỉ được {count} ký tự` }, { count: getMaxLengthSKU(currentChannel?.connector_channel_code) }))
        .notRequired()
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
        .max(getMaxLengthSKU(currentChannel?.connector_channel_code), formatMessage({ defaultMessage: `Mã SKU tối đa chỉ được {count} ký tự` }, { count: getMaxLengthSKU(currentChannel?.connector_channel_code) }))
        .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: formatMessage({ defaultMessage: 'mã SKU' }) }))
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
        ),
      name: Yup.string()
        .min(currentChannel?.connector_channel_code == 'tiktok' ? 25 : 10, formatMessage({ defaultMessage: "{name} phải có tối thiểu {length} ký tự" }, { length: currentChannel?.connector_channel_code == 'tiktok' ? 25 : 10, name: formatMessage({ defaultMessage: "Tên sản phẩm" }) }))
        .max(currentChannel?.connector_channel_code == 'shopee' ? 120 : 255, formatMessage({ defaultMessage: "{name} tối đa {length} ký tự" }, { length: currentChannel?.connector_channel_code == 'shopee' ? 120 : 255, name: formatMessage({ defaultMessage: "Tên sản phẩm" }) }))
        .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: formatMessage({ defaultMessage: "Tên sản phẩm" }).toLowerCase() }))
        .test(
          'chua-ky-tu-space-o-dau-cuoi',
          formatMessage({ defaultMessage: 'Tên sản phẩm sàn không được chứa dấu cách ở đầu và cuối' }),
          (value, context) => {
            if (!!value) {
              return value.length == value.trim().length;
            }
            return false;
          },
        )
        .test(
          'chua-ky-tu-2space',
          formatMessage({ defaultMessage: 'Tên sản phẩm sàn không được chứa 2 dấu cách liên tiếp' }),
          (value, context) => {
            if (!!value) {
              return !(/\s\s+/g.test(value))
            }
            return false;
          },
        )
    };

    let hasVariant = false;
    let _filterSelected = attributesSelected.filter(_att => !_att.isInactive).sort((a, b) => a.position - b.position)

    let validatesAttributeValues = []

    if (_filterSelected.length == 1) {
      let values = (_filterSelected[0].values || []);
      values.forEach((_value, index) => {
        schema[`variant-${_value.code}-price`] = Yup.number().min(1000, formatMessage({ defaultMessage: "Giá tối thiểu {price}đ" }, { price: '1.000' }))
          .max(120000000, formatMessage({ defaultMessage: "Giá tối đa {price}đ" }, { price: '120.000.000' }))
          .nullable()
          .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: formatMessage({ defaultMessage: 'Giá bán' }).toLowerCase() }))
          .when(`variant-${_value.code}-priceMinimum`, values => {
            if (values) {
              return Yup.number()
                .min(values, 'Giá niêm yết phải lớn hơn hoặc bằng giá bán tối thiểu')
                .max(120000000, formatMessage({ defaultMessage: 'Giá tối đa là {max}đ' }, { max: '120.000.000' }));
            }
          })

        schema[`variant-${_value.code}-priceMinimum`] = Yup.number().min(1000, formatMessage({ defaultMessage: "Giá tối thiểu {price}đ" }, { price: '1.000' }))
          .max(120000000, formatMessage({ defaultMessage: "Giá tối đa {price}đ" }, { price: '120.000.000' }))
          .nullable()
          .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: formatMessage({ defaultMessage: 'Giá tối thiểu' }).toLowerCase() }))

        if (!currentChannel?.enable_multi_warehouse) {
          schema[`variant-${_value.code}-stockOnHand`] = Yup.number()
            .min(0, formatMessage({ defaultMessage: "Giá trị cần nhập {min}->{max}" }, { min: 0, max: '999.999' }))
            .max(999999, formatMessage({ defaultMessage: "Giá trị cần nhập {min}->{max}" }, { min: 0, max: '999.999' }))
            .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: formatMessage({ defaultMessage: 'Có sẵn' }) }))
        }

        schema[`variant-sku_boolean`] = Yup.object().notRequired()
        schema[`variant-${_value.code}-sku`] = Yup.string()
          .max(getMaxLengthSKU(currentChannel?.connector_channel_code), formatMessage({ defaultMessage: `Mã SKU tối đa chỉ được {count} ký tự` }, { count: getMaxLengthSKU(currentChannel?.connector_channel_code) }))
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

        let _values = [...values];
        _values.splice(index, 1);
        // schema[`att-${_filterSelected[0].id}-${_value.code}`] = Yup.string()
        //   .max(currentChannel?.connector_channel_code == 'tiktok' ? 50 : 20, formatMessage({ defaultMessage: "{name} tối đa {length} ký tự" }, { length: currentChannel?.connector_channel_code == 'tiktok' ? 50 : 20, name: (_filterSelected[0].display_name || '').toLowerCase() }))
        //   .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: (_filterSelected[0].display_name || '').toLowerCase() }))
        //   .notOneOf(_values.map(_vvv => _vvv.v), formatMessage({ defaultMessage: "Phân loại đã tồn tại" }))

        validatesAttributeValues.push({
          key: `att-${_filterSelected[0].id}-${_value.code}`,
          maxTitle: formatMessage({ defaultMessage: "{name} tối đa {length} ký tự" }, { length: currentChannel?.connector_channel_code == 'tiktok' ? 50 : 20, name: (_filterSelected[0].display_name || '').toLowerCase() }),
          requiredTitle: formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: (_filterSelected[0].display_name || '').toLowerCase() }),
          notOneOf: _values.map(_vvv => _vvv.v)
        })
        hasVariant = true;
      });
    }
    if (_filterSelected.length == 2) {
      let values = (_filterSelected[0].values || []);
      values.forEach((_value, index) => {
        let valuesSub2 = (_filterSelected[1].values || []);
        let _values = [...values];
        _values.splice(index, 1);
        // schema[`att-${_filterSelected[0].id}-${_value.code}`] = Yup.string()
        //   .max(currentChannel?.connector_channel_code == 'tiktok' ? 50 : 20, formatMessage({ defaultMessage: "{name} tối đa {length} ký tự" }, { length: currentChannel?.connector_channel_code == 'tiktok' ? 50 : 20, name: (_filterSelected[0].display_name || '').toLowerCase() }))
        //   .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: (_filterSelected[0].display_name || '').toLowerCase() }))
        //   .notOneOf(_values.map(_vvv => _vvv.v), formatMessage({ defaultMessage: "Phân loại đã tồn tại" }))


        validatesAttributeValues.push({
          key: `att-${_filterSelected[0].id}-${_value.code}`,
          maxTitle: formatMessage({ defaultMessage: "{name} tối đa {length} ký tự" }, { length: currentChannel?.connector_channel_code == 'tiktok' ? 50 : 20, name: (_filterSelected[0].display_name || '').toLowerCase() }),
          requiredTitle: formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: (_filterSelected[0].display_name || '').toLowerCase() }),
          notOneOf: currentChannel?.connector_channel_code == 'tiktok' ? _values.map(_vvv => _vvv.v).concat(valuesSub2.map(_vvv => _vvv.v)) : _values.map(_vvv => _vvv.v)
        })

        valuesSub2.forEach((_value2, index2) => {
          schema[`variant-${_value.code}-${_value2.code}-price`] = Yup.number().min(1000, formatMessage({ defaultMessage: "Giá tối thiểu {price}đ" }, { price: '1.000' }))
            .max(120000000, formatMessage({ defaultMessage: "Giá tối đa {price}đ" }, { price: '120.000.000' }))
            .nullable()
            .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: formatMessage({ defaultMessage: 'Giá bán' }).toLowerCase() }))
            .when(`variant-${_value.code}-${_value2.code}-priceMinimum`, values => {
              if (values) {
                return Yup.number()
                  .min(values, 'Giá niêm yết phải lớn hơn hoặc bằng giá bán tối thiểu')
                  .max(120000000, formatMessage({ defaultMessage: 'Giá tối đa là {max}đ' }, { max: '120.000.000' }));
              }
            })

          schema[`variant-${_value.code}-${_value2.code}-priceMinimum`] = Yup.number().min(1000, formatMessage({ defaultMessage: "Giá tối thiểu {price}đ" }, { price: '1.000' }))
            .max(120000000, formatMessage({ defaultMessage: "Giá tối đa {price}đ" }, { price: '120.000.000' }))
            .nullable()
            .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: formatMessage({ defaultMessage: 'Giá tối thiểu' }).toLowerCase() }))

          if (!currentChannel?.enable_multi_warehouse) {
            schema[`variant-${_value.code}-${_value2.code}-stockOnHand`] = Yup.number()
              .min(0, formatMessage({ defaultMessage: "Giá trị cần nhập {min}->{max}" }, { min: 0, max: '999.999' }))
              .max(999999, formatMessage({ defaultMessage: "Giá trị cần nhập {min}->{max}" }, { min: 0, max: '999.999' }))
              .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: formatMessage({ defaultMessage: 'Có sẵn' }) }))
          }

          schema[`variant-sku_boolean`] = Yup.object().notRequired()
          schema[`variant-${_value.code}-${_value2.code}-sku`] = Yup.string().required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: 'SKU' }))
            .max(getMaxLengthSKU(currentChannel?.connector_channel_code), formatMessage({ defaultMessage: `Mã SKU tối đa chỉ được {count} ký tự` }, { count: getMaxLengthSKU(currentChannel?.connector_channel_code) }))
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

          if (index == 0) {
            let _valuesSub2 = [...valuesSub2];
            _valuesSub2.splice(index2, 1);
            // schema[`att-${_filterSelected[1].id}-${_value2.code}`] = Yup.string()
            //   .max(currentChannel?.connector_channel_code == 'tiktok' ? 50 : 20, formatMessage({ defaultMessage: "{name} tối đa {length} ký tự" }, { length: currentChannel?.connector_channel_code == 'tiktok' ? 50 : 20, name: (_filterSelected[1].display_name || '').toLowerCase() }))
            //   .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: (_filterSelected[1].display_name || '').toLowerCase() }))
            //   .notOneOf(_valuesSub2.map(_vvv => _vvv.v), formatMessage({ defaultMessage: "Phân loại đã tồn tại" }))


            validatesAttributeValues.push({
              key: `att-${_filterSelected[1].id}-${_value2.code}`,
              maxTitle: formatMessage({ defaultMessage: "{name} tối đa {length} ký tự" }, { length: currentChannel?.connector_channel_code == 'tiktok' ? 50 : 20, name: (_filterSelected[1].display_name || '').toLowerCase() }),
              requiredTitle: formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: (_filterSelected[1].display_name || '').toLowerCase() }),
              notOneOf: currentChannel?.connector_channel_code == 'tiktok' ? _valuesSub2.map(_vvv => _vvv.v).concat(values.map(_vvv => _vvv.v)) : _valuesSub2.map(_vvv => _vvv.v)
            })
          }


          hasVariant = true;
        });
      });
    }
    if (_filterSelected.length == 3) {
      let values = (_filterSelected[0].values || []);
      let valuesSub2 = (_filterSelected[1].values || []);
      let valuesSub3 = (_filterSelected[2].values || []);
      values.forEach((_value, index) => {
        let _values = [...values];
        _values.splice(index, 1);
        // schema[`att-${_filterSelected[0].id}-${_value.code}`] = Yup.string()
        //   .max(currentChannel?.connector_channel_code == 'tiktok' ? 50 : 20, formatMessage({ defaultMessage: "{name} tối đa {length} ký tự" }, { length: currentChannel?.connector_channel_code == 'tiktok' ? 50 : 20, name: (_filterSelected[0].display_name || '').toLowerCase() }))
        //   .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: (_filterSelected[0].display_name || '').toLowerCase() }))
        //   .notOneOf(_values.map(_vvv => _vvv.v), formatMessage({ defaultMessage: "Phân loại đã tồn tại" }))

        validatesAttributeValues.push({
          key: `att-${_filterSelected[0].id}-${_value.code}`,
          maxTitle: formatMessage({ defaultMessage: "{name} tối đa {length} ký tự" }, { length: currentChannel?.connector_channel_code == 'tiktok' ? 50 : 20, name: (_filterSelected[0].display_name || '').toLowerCase() }),
          requiredTitle: formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: (_filterSelected[0].display_name || '').toLowerCase() }),
          notOneOf: currentChannel?.connector_channel_code == 'tiktok' ? _values.map(_vvv => _vvv.v).concat(valuesSub2.map(_vvv => _vvv.v)).concat(valuesSub3.map(_vvv => _vvv.v)) : _values.map(_vvv => _vvv.v)
        })


        valuesSub2.forEach((_value2, index2) => {
          valuesSub3.forEach((_value3, index3) => {
            schema[`variant-${_value.code}-${_value2.code}-${_value3.code}-price`] = Yup.number().min(1000, formatMessage({ defaultMessage: "Giá tối thiểu {price}đ" }, { price: '1.000' }))
              .max(120000000, formatMessage({ defaultMessage: "Giá tối đa {price}đ" }, { price: '120.000.000' }))
              .nullable()
              .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: formatMessage({ defaultMessage: 'Giá bán' }).toLowerCase() }))
              .when(`variant-${_value.code}-${_value2.code}-${_value3.code}-priceMinimum`, values => {
                if (values) {
                  return Yup.number()
                    .min(values, 'Giá niêm yết phải lớn hơn hoặc bằng giá bán tối thiểu')
                    .max(120000000, formatMessage({ defaultMessage: 'Giá tối đa là {max}đ' }, { max: '120.000.000' }));
                }
              })

            schema[`variant-${_value.code}-${_value2.code}-${_value3.code}-priceMinimum`] = Yup.number().min(1000, formatMessage({ defaultMessage: "Giá tối thiểu {price}đ" }, { price: '1.000' }))
              .max(120000000, formatMessage({ defaultMessage: "Giá tối đa {price}đ" }, { price: '120.000.000' }))
              .nullable()
              .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: formatMessage({ defaultMessage: 'Giá tối thiểu' }).toLowerCase() }))

            if (!currentChannel?.enable_multi_warehouse) {
              schema[`variant-${_value.code}-${_value2.code}-${_value3.code}-stockOnHand`] = Yup.number()
                .min(0, formatMessage({ defaultMessage: "Giá trị cần nhập {min}->{max}" }, { min: 0, max: '999.999' }))
                .max(999999, formatMessage({ defaultMessage: "Giá trị cần nhập {min}->{max}" }, { min: 0, max: '999.999' }))
                .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: formatMessage({ defaultMessage: 'Có sẵn' }) }))
            }

            schema[`variant-sku_boolean`] = Yup.object().notRequired()
            schema[`variant-${_value.code}-${_value2.code}-${_value3.code}-sku`] = Yup.string().required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: 'SKU' }))
              .max(getMaxLengthSKU(currentChannel?.connector_channel_code), formatMessage({ defaultMessage: `Mã SKU tối đa chỉ được {count} ký tự` }, { count: getMaxLengthSKU(currentChannel?.connector_channel_code) }))
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
                  return !!values && !!values[`${_value.code}-${_value2.code}-${_value3.code}`];
                },
                then: Yup.string().oneOf([`${_value.code}-${_value2.code}-${_value3.code}`], formatMessage({ defaultMessage: 'Mã SKU này đã được dùng cho sản phẩm khác' }))
              })

            if (index2 == 0) {
              let _valuesSub3 = [...valuesSub3];
              _valuesSub3.splice(index3, 1);
              // schema[`att-${_filterSelected[2].id}-${_value3.code}`] = Yup.string()
              //   .max(currentChannel?.connector_channel_code == 'tiktok' ? 50 : 20, formatMessage({ defaultMessage: "{name} tối đa {length} ký tự" }, { length: currentChannel?.connector_channel_code == 'tiktok' ? 50 : 20, name: (_filterSelected[2].display_name || '').toLowerCase() }))
              //   .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: (_filterSelected[2].display_name || '').toLowerCase() }))
              //   .notOneOf(_valuesSub3.map(_vvv => _vvv.v), formatMessage({ defaultMessage: "Phân loại đã tồn tại" }))

              validatesAttributeValues.push({
                key: `att-${_filterSelected[2].id}-${_value3.code}`,
                maxTitle: formatMessage({ defaultMessage: "{name} tối đa {length} ký tự" }, { length: currentChannel?.connector_channel_code == 'tiktok' ? 50 : 20, name: (_filterSelected[2].display_name || '').toLowerCase() }),
                requiredTitle: formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: (_filterSelected[2].display_name || '').toLowerCase() }),
                notOneOf: currentChannel?.connector_channel_code == 'tiktok' ? _valuesSub3.map(_vvv => _vvv.v).concat(valuesSub2.map(_vvv => _vvv.v)).concat(values.map(_vvv => _vvv.v)) : _valuesSub3.map(_vvv => _vvv.v)
              })

            }


            hasVariant = true;
          });

          if (index == 0) {
            let _valuesSub2 = [...valuesSub2];
            _valuesSub2.splice(index2, 1);
            // schema[`att-${_filterSelected[1].id}-${_value2.code}`] = Yup.string()
            //   .max(currentChannel?.connector_channel_code == 'tiktok' ? 50 : 20, formatMessage({ defaultMessage: "{name} tối đa {length} ký tự" }, { length: currentChannel?.connector_channel_code == 'tiktok' ? 50 : 20, name: (_filterSelected[1].display_name || '').toLowerCase() }))
            //   .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: (_filterSelected[1].display_name || '').toLowerCase() }))
            //   .notOneOf(_valuesSub2.map(_vvv => _vvv.v), formatMessage({ defaultMessage: "Phân loại đã tồn tại" }))


            validatesAttributeValues.push({
              key: `att-${_filterSelected[1].id}-${_value2.code}`,
              maxTitle: formatMessage({ defaultMessage: "{name} tối đa {length} ký tự" }, { length: currentChannel?.connector_channel_code == 'tiktok' ? 50 : 20, name: (_filterSelected[1].display_name || '').toLowerCase() }),
              requiredTitle: formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: (_filterSelected[1].display_name || '').toLowerCase() }),
              notOneOf: currentChannel?.connector_channel_code == 'tiktok' ? _valuesSub2.map(_vvv => _vvv.v).concat(valuesSub3.map(_vvv => _vvv.v)).concat(values.map(_vvv => _vvv.v)) : _valuesSub2.map(_vvv => _vvv.v)
            })

          }


          hasVariant = true;
        });
      });
    }

    validatesAttributeValues.forEach(_element => {
      schema[_element.key] = Yup.string()
        .max(currentChannel?.connector_channel_code == 'tiktok' ? 50 : 20, _element.maxTitle)
        .required(_element.requiredTitle)
        .notOneOf(_element.notOneOf, formatMessage({ defaultMessage: "Phân loại đã tồn tại" }))
        .test(
          'chua-ky-tu-space-o-dau-cuoi',
          formatMessage({ defaultMessage: 'Tên phân loại không được chứa dấu cách ở đầu và cuối' }),
          (value, context) => {
            if (!!value) {
              return value.length == value.trim().length;
            }
            return false;
          },
        )
        .test(
          'chua-ky-tu-2space',
          formatMessage({ defaultMessage: 'Tên phân loại không được chứa 2 dấu cách liên tiếp' }),
          (value, context) => {
            if (!!value) {
              return !(/\s\s+/g.test(value))
            }
            return false;
          },
        )
    });


    schema[`category`] = Yup.array().required(formatMessage({ defaultMessage: 'Vui lòng chọn {name}' }, { name: formatMessage({ defaultMessage: 'ngành hàng' }) }))
    schema[`brand`] = Yup.object().required(formatMessage({ defaultMessage: 'Vui lòng chọn {name}' }, { name: formatMessage({ defaultMessage: "Thương hiệu" }).toLowerCase() }))

    console.log({ properties });

    properties.forEach(_property => {
      if (_property.unit_options?.length > 0 &&
        _property.input_type != ATTRIBUTE_VALUE_TYPE.SINGLE_SELECT_CUSTOM_VALUE &&
        _property.input_type != ATTRIBUTE_VALUE_TYPE.MULTIPLE_SELECT_CUSTOM_VALUE) {
        schema[`property-${_property.id}-unit`] = Yup.string().notRequired()
          .when(`property-${_property.id}`, {
            is: values => {
              return !!values || values === 0 || values === '0' || (values || '').length > 0;
            },
            then: Yup.string().required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: formatMessage({ defaultMessage: 'đơn vị' }) }))
          })
      }
      if (_property.is_mandatory) {
        if (_property.input_type == ATTRIBUTE_VALUE_TYPE.TEXT)
          schema[`property-${_property.id}`] = Yup.string().required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: (_property.display_name || '').toLowerCase() }))
        if (_property.input_type == ATTRIBUTE_VALUE_TYPE.NUMERIC || _property.input_type == ATTRIBUTE_VALUE_TYPE.NUMERIC_INT || _property.input_type == ATTRIBUTE_VALUE_TYPE.NUMERIC_FLOAT)
          schema[`property-${_property.id}`] = Yup.number().required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: (_property.display_name || '').toLowerCase() }))
        if (_property.input_type == ATTRIBUTE_VALUE_TYPE.SINGLE_SELECT || _property.input_type == ATTRIBUTE_VALUE_TYPE.SINGLE_SELECT_CUSTOM_VALUE)
          schema[`property-${_property.id}`] = Yup.object().required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: (_property.display_name || '').toLowerCase() }))
        if (_property.input_type == ATTRIBUTE_VALUE_TYPE.MULTIPLE_SELECT || _property.input_type == ATTRIBUTE_VALUE_TYPE.MULTIPLE_SELECT_CUSTOM_VALUE)
          schema[`property-${_property.id}`] = Yup.array().required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: (_property.display_name || '').toLowerCase() }))
        if (_property.input_type == ATTRIBUTE_VALUE_TYPE.DATE || _property.input_type == ATTRIBUTE_VALUE_TYPE.DATE_MONTH || _property.input_type == ATTRIBUTE_VALUE_TYPE.TIMESTAMP)
          schema[`property-${_property.id}`] = Yup.string().required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: (_property.display_name || '').toLowerCase() }))
      } else {
        if (_property.name == 'warranty_policy') {
          schema[`property-${_property.id}`] = Yup.string()
            .max(99, formatMessage({ defaultMessage: "{name} tối đa {length} ký tự" }, { length: 99, name: formatMessage({ defaultMessage: 'Chính sách bảo hành' }) }))
            .notRequired()

        }
        if (_property.input_type == ATTRIBUTE_VALUE_TYPE.TEXT)
          schema[`property-${_property.id}`] = Yup.string().notRequired()
        // .when(`property-${_property.id}-unit`, {
        //   is: values => {
        //     return !!values;
        //   },
        //   then: Yup.string().required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: (_property.display_name || '').toLowerCase() }))
        // })
        if (_property.input_type == ATTRIBUTE_VALUE_TYPE.NUMERIC || _property.input_type == ATTRIBUTE_VALUE_TYPE.NUMERIC_INT || _property.input_type == ATTRIBUTE_VALUE_TYPE.NUMERIC_FLOAT)
          schema[`property-${_property.id}`] = Yup.number().notRequired()
        // .when(`property-${_property.id}-unit`, {
        //   is: values => {
        //     return !!values;
        //   },
        //   then: Yup.string().required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: (_property.display_name || '').toLowerCase() }))
        // })
        if (_property.input_type == ATTRIBUTE_VALUE_TYPE.SINGLE_SELECT)
          schema[`property-${_property.id}`] = Yup.object().notRequired()
        if (_property.input_type == ATTRIBUTE_VALUE_TYPE.MULTIPLE_SELECT)
          schema[`property-${_property.id}`] = Yup.array().notRequired()
        if (_property.input_type == ATTRIBUTE_VALUE_TYPE.DATE || _property.input_type == ATTRIBUTE_VALUE_TYPE.DATE_MONTH || _property.input_type == ATTRIBUTE_VALUE_TYPE.TIMESTAMP)
          schema[`property-${_property.id}`] = Yup.string().notRequired()
      }
    });

    // schema[`property-395779`] = Yup.string()
    // .max(99, formatMessage({ defaultMessage: "{name} tối đa {length} ký tự" }, { length: 99, name: 'Chính sách bảo hành' }))
    // .notRequired()

    schema['stockOnHand'] = Yup.number()
      .min(0, formatMessage({ defaultMessage: "Giá trị cần nhập {min}->{max}" }, { min: 0, max: '999.999' }))
      .max(999999, formatMessage({ defaultMessage: 'Số lượng sản phẩm phải nhỏ hơn 999.999' }))
      .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: formatMessage({ defaultMessage: 'số lượng sản phẩm' }) }));
    schema['price'] = Yup.number()
      .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: formatMessage({ defaultMessage: 'giá niêm yết' }) }))
      .min(1000, formatMessage({ defaultMessage: 'Giá tối thiểu là 1.000đ' }))
      .max(120000000, formatMessage({ defaultMessage: 'Giá tối đa là 120.000.000đ' }))
      .when(`price_minimum`, values => {
        if (values) {
          return Yup.number()
            .min(values, 'Giá niêm yết phải lớn hơn hoặc bằng giá bán tối thiểu')
            .max(120000000, formatMessage({ defaultMessage: 'Giá tối đa là {max}đ' }, { max: '120.000.000' }));
        }
      })
    schema['price_minimum'] = Yup.number()
      .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: formatMessage({ defaultMessage: 'giá tối thiểu' }) }))
      .nullable()
      .min(1000, formatMessage({ defaultMessage: 'Giá tối thiểu là 1.000đ' }))
      .max(120000000, formatMessage({ defaultMessage: 'Giá tối đa là 120.000.000đ' }))
    // if (_filterSelected.length == 0) {
    // }

    if (currentChannel?.connector_channel_code == 'lazada') {
      delete schema.description
      schema['width'] = Yup.number()
        .notRequired()
        // .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: 'chiều rộng' }))
        .min(1, formatMessage({ defaultMessage: "Giá trị cần nhập {min}->{max}" }, { min: 1, max: '300' }))
        .max(300, formatMessage({ defaultMessage: 'Kích thước tối đa là 300 cm' }));
      schema['length'] = Yup.number()
        .notRequired()
        // .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: 'chiều dài' }))
        .min(1, formatMessage({ defaultMessage: "Giá trị cần nhập {min}->{max}" }, { min: 1, max: '300' }))
        .max(300, formatMessage({ defaultMessage: 'Kích thước tối đa là 300 cm' }));
      schema['height'] = Yup.number()
        .notRequired()
        // .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: 'chiều cao' }))
        .min(1, formatMessage({ defaultMessage: "Giá trị cần nhập {min}->{max}" }, { min: 1, max: '300' }))
        .max(300, formatMessage({ defaultMessage: 'Kích thước tối đa là 300 cm' }))
      schema['weight'] = Yup.number()
        .min(1, formatMessage({ defaultMessage: "Giá trị cần nhập {min}->{max}" }, { min: 1, max: '300.000' }))
        .max(300000, formatMessage({ defaultMessage: 'Cân nặng tối đa là 300.000 g' }))
        .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: formatMessage({ defaultMessage: 'Cân nặng' }).toLowerCase() }))
    }

    if (currentChannel?.connector_channel_code == 'tiktok') {
      delete schema.description
      // schema['warranty_policy'] = Yup.string()
      //   .min(currentChannel?.connector_channel_code == 'tiktok' ? 25 : 10, formatMessage({ defaultMessage: "{name} phải có tối thiểu {length} ký tự" }, { length: currentChannel?.connector_channel_code == 'tiktok' ? 25 : 10, name: formatMessage({ defaultMessage: "Tên sản phẩm" }) }))
      //   .max(currentChannel?.connector_channel_code == 'shopee' ? 120 : 255, formatMessage({ defaultMessage: "{name} tối đa {length} ký tự" }, { length: currentChannel?.connector_channel_code == 'shopee' ? 120 : 255, name: formatMessage({ defaultMessage: "Tên sản phẩm" }) }))
      //   .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: formatMessage({ defaultMessage: "Tên sản phẩm" }).toLowerCase() }))
      // .matches(/.{5,}/, {
      //   excludeEmptyString: true,
      //   message: 'Must be 5 characters',
      //   message: formatMessage({ defaultMessage: "{name} tối đa {length} ký tự" }, { length: 99, name: 'Chính sách bảo hành' }),
      // });
      // .max(99, formatMessage({ defaultMessage: "{name} tối đa {length} ký tự" }, { length: 99, name: 'Chính sách bảo hành' }))
      schema['width'] = Yup.number()
        .notRequired()
        // .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: 'chiều rộng' }))
        // .min(1, formatMessage({ defaultMessage: "Giá trị cần nhập {min}->{max}" }, { min: 1, max: '180' }))
        .test('len', formatMessage({ defaultMessage: 'Kích thước tối đa là 180 cm' }), val => !val || val <= 180)
        .when(['length', 'height'], (length, height, schema) => {
          let maxValueWidth = ((80 * 6000) / ((length * height) + 1)).toFixed();
          const minSchemaWidth = (!height && !length) ? 0 : 1;

          if (minSchemaWidth) {
            return schema
              .min(minSchemaWidth, formatMessage({ defaultMessage: "Giá trị cần nhập {min}->{max}" }, { min: minSchemaWidth, max: '180' }))
              .max(maxValueWidth, formatMessage({ defaultMessage: 'Trọng lượng thể tích phải nhỏ hơn 80.00kg. Trọng lượng thể tích = chiều dài*chiều rộng*chiều cao/6000.' }))
          }

          return schema
            .min(minSchemaWidth, formatMessage({ defaultMessage: "Giá trị cần nhập {min}->{max}" }, { min: minSchemaWidth, max: '180' }))
            .max(180, formatMessage({ defaultMessage: 'Kích thước tối đa là 180 cm' }));
        });

      schema['description_html'] = Yup.string()
        .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: formatMessage({ defaultMessage: 'mô tả sản phẩm' }) }))
        .min(56, formatMessage({ defaultMessage: 'Mô tả sản phẩm phải có tối thiểu 56 ký tự hoặc có tối thiểu 1 ảnh' }))
        .max(10000, formatMessage({ defaultMessage: "{name} tối đa {length} ký tự" }, { length: 10000, name: formatMessage({ defaultMessage: 'Mô tả sản phẩm' }) }));
      schema['length'] = Yup.number()
        .notRequired()
        // .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: 'chiều dài' }))
        // .min(1, formatMessage({ defaultMessage: "Giá trị cần nhập {min}->{max}" }, { min: 1, max: '180' }))
        .test('len', formatMessage({ defaultMessage: 'Kích thước tối đa là 180 cm' }), val => !val || val <= 180)
        .when(['width', 'height'], (width, height, schema) => {
          let maxValueLength = ((80 * 6000) / ((width * height) + 1)).toFixed();
          const minSchemaLength = (!height && !width) ? 0 : 1;

          if (minSchemaLength) {
            return schema
              .min(minSchemaLength, formatMessage({ defaultMessage: "Giá trị cần nhập {min}->{max}" }, { min: minSchemaLength, max: '180' }))
              .max(maxValueLength, formatMessage({ defaultMessage: 'Trọng lượng thể tích phải nhỏ hơn 80.00kg. Trọng lượng thể tích = chiều dài*chiều rộng*chiều cao/6000.' }))
          }

          return schema
            .min(minSchemaLength, formatMessage({ defaultMessage: "Giá trị cần nhập {min}->{max}" }, { min: minSchemaLength, max: '180' }))
            .max(180, formatMessage({ defaultMessage: 'Kích thước tối đa là 180 cm' }));
        });
      schema['height'] = Yup.number()
        .notRequired()
        // .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: 'chiều cao' }))
        // .min(1, formatMessage({ defaultMessage: "Giá trị cần nhập {min}->{max}" }, { min: 1, max: '180' }))
        .test('len', formatMessage({ defaultMessage: 'Kích thước tối đa là 180 cm' }), val => !val || val <= 180)
        .when(['width', 'length'], (width, length, schema) => {
          let maxValueHeight = ((80 * 6000) / ((width * length) + 1)).toFixed();
          const minSchemaHeight = (!length && !width) ? 0 : 1;

          if (minSchemaHeight) {
            return schema
              .min(minSchemaHeight, formatMessage({ defaultMessage: "Giá trị cần nhập {min}->{max}" }, { min: minSchemaHeight, max: '180' }))
              .max(maxValueHeight, formatMessage({ defaultMessage: 'Trọng lượng thể tích phải nhỏ hơn 80.00kg. Trọng lượng thể tích = chiều dài*chiều rộng*chiều cao/6000.' }))
          }

          return schema
            .min(minSchemaHeight, formatMessage({ defaultMessage: "Giá trị cần nhập {min}->{max}" }, { min: minSchemaHeight, max: '180' }))
            .max(180, formatMessage({ defaultMessage: 'Kích thước tối đa là 180 cm' }));
        });
      schema['weight'] = Yup.number()
        .min(1, formatMessage({ defaultMessage: "Giá trị cần nhập {min}->{max}" }, { min: 1, max: '70.000' }))
        .max(70000, formatMessage({ defaultMessage: 'Cân nặng tối đa là 70.000 g' }))
        .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: formatMessage({ defaultMessage: 'Cân nặng' }).toLowerCase() }))
    }

    if (currentChannel?.connector_channel_code == 'shopee') {
      schema['width'] = Yup.number()
        .notRequired()
        .max(1000000, formatMessage({ defaultMessage: 'Kích thước tối đa là 1.000.000 cm' }))
        .when(['height', 'length'], (height, length, schema) => {
          const minSchemaWidth = (!height && !length) ? 0 : 1;
          return schema.min(minSchemaWidth, formatMessage({ defaultMessage: "Giá trị cần nhập {min}->{max}" }, { min: minSchemaWidth, max: '1.000.000' }))
        });
      schema['length'] = Yup.number()
        .notRequired()
        // .min(1, formatMessage({ defaultMessage: "Giá trị cần nhập {min}->{max}" }, { min: 1, max: '1.000.000' }))
        .max(1000000, formatMessage({ defaultMessage: 'Kích thước tối đa là 1.000.000 cm' }))
        .when(['height', 'width'], (height, width, schema) => {
          const minSchemaLength = (!height && !width) ? 0 : 1;
          return schema.min(minSchemaLength, formatMessage({ defaultMessage: "Giá trị cần nhập {min}->{max}" }, { min: minSchemaLength, max: '1.000.000' }))
        });
      schema['height'] = Yup.number()
        .notRequired()
        // .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: 'chiều rộng' }))
        // .min(1, formatMessage({ defaultMessage: "Giá trị cần nhập {min}->{max}" }, { min: 1, max: '1.000.000' }))
        .max(1000000, formatMessage({ defaultMessage: 'Kích thước tối đa là 1.000.000 cm' }))
        .when(['length', 'width'], (length, width, schema) => {
          const minSchemaHeight = (!length && !width) ? 0 : 1;
          return schema.min(minSchemaHeight, formatMessage({ defaultMessage: "Giá trị cần nhập {min}->{max}" }, { min: minSchemaHeight, max: '1.000.000' }))
        });
      schema['weight'] = Yup.number()
        .min(1, formatMessage({ defaultMessage: "Giá trị cần nhập {min}->{max}" }, { min: 1, max: '999.999' }))
        .max(999999, formatMessage({ defaultMessage: 'Cân nặng tối đa là 999.999 g' }))
        .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: formatMessage({ defaultMessage: 'Cân nặng' }).toLowerCase() }))


      if (special_type == 1) {
        delete schema.description
      }
    }

    if (variants?.length > 0 && currentChannel?.connector_channel_code == 'lazada') {
      schema['sku'] = Yup.string()
        .max(getMaxLengthSKU(currentChannel?.connector_channel_code), formatMessage({ defaultMessage: `Mã SKU tối đa chỉ được {count} ký tự` }, { count: getMaxLengthSKU(currentChannel?.connector_channel_code) }))
        .notRequired()
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
        })
    }

    console.log({ schema })

    setProductEditSchema(schema)
  }, [attributesSelected, properties, currentChannel, special_type, productEditing, variants])

  const resetAll = useCallback(() => {
    setAttributesSelected([])
    setVariants([])
    setProductEditSchema({})
    setProductFiles([])
    setProductVideFiles([])
    setProductAttributeFiles({})
    setCategorySelected(null)
    setCustomAttributes([])
    setLogisticChannels({})
    setSmeProduct()
    setCurrentChannel()
    setIds([])
    setProductEditing(null)
    setProductSizeChart()
    setProductImageOrigin()
    setspecial_type(0)
    setCheckMapAttribute(false)
    setOpenBlockImage(false)
    setOpenBlockDescription(false)
    setCreationMethod(0)
  }, [])

  const value = {
    // attributes: upBaseAttributes?.op_catalog_product_attributes || [], 
    attributesSelected, setAttributesSelected,
    addValueToAttributeSelected, removeValueToAttributeSelected, updateValueToAttributeSelected,
    variants, productEditSchema,
    scWarehouses,
    productFiles, setProductFiles, updateProductFiles,
    productAttributeFiles, setProductAttributeFiles,
    productVideFiles, setProductVideFiles,
    categorySelected, setCategorySelected,
    customAttributes, setCustomAttributes,
    // warrantiesList: warrantyData?.op_catalog_product_attributes || [],
    resetAll,
    optionsProductTag,
    logisticChannels, setLogisticChannels,
    smeProduct, setSmeProduct,
    currentChannel, setCurrentChannel,
    properties, setProperties,
    ids, setIds,
    productEditing, setProductEditing,
    productSizeChart, setProductSizeChart,
    productImageOrigin, setProductImageOrigin,
    special_type, setspecial_type,
    isCheckMapAttribute, setCheckMapAttribute,
    openBlockImage, setOpenBlockImage,
    openBlockDescription, setOpenBlockDescription,
    btnRefCollapseDescription, btnRefCollapseImage,
    creationMethod, setCreationMethod,
    smeCatalogStores, currentFrameProduct, setCurrentFrameProduct
  };

  return (
    <ProductsUIContext.Provider value={value}>
      {children}
    </ProductsUIContext.Provider>
  );
}
