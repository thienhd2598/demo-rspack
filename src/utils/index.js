/*
 * Created by duydatpham@gmail.com on 09/06/2021
 * Copyright (c) 2021 duydatpham@gmail.com
 */
import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';
import { ATTRIBUTE_VALUE_TYPE, getImageOriginSanValidate } from '../constants';
import _ from 'lodash'
import htmlToDraft from 'html-to-draftjs';
import { EditorState, convertToRaw, convertFromRaw, ContentState } from 'draft-js';
const slugify = require('slugify');

export const getMaxLengthSKU = (channel) => {
    if (channel == 'lazada') {
        return 200
    }
    if (channel == 'shopee') {
        return 100
    }
    if (channel == 'tiktok') {
        return 50
    }
    return 50
}

export const abbrNum = (number, decPlaces = 2) => {
    decPlaces = Math.pow(10, decPlaces);
    let abbrev = ["K", "M", "B", "T"];

    for (let i = abbrev.length - 1; i >= 0; i--) {

        let size = Math.pow(10, (i + 1) * 3);

        if (size <= number) {
            number = Math.round(number * decPlaces / size) / decPlaces;
            if ((number == 1000) && (i < abbrev.length - 1)) {
                number = 1;
                i++;
            }
            number += abbrev[i];
            break;
        }
    }

    return number;
}

export const hasPermissionAction = (keys = [], permissions = []) => {
    return true
}

export const abbreviateNumber = (value) => {
    let newValue = value;
    if (value >= 1000) {
        let suffixes = ["", "K", "M", "B", "T"];
        let suffixNum = Math.floor(("" + value).length / 3);
        let shortValue = '';
        for (let precision = 2; precision >= 1; precision--) {
            shortValue = parseFloat((suffixNum != 0 ? (value / Math.pow(1000, suffixNum)) : value).toPrecision(precision));

            let dotLessShortValue = (shortValue + '').replace(/[^a-zA-Z 0-9]+/g, '');
            if (dotLessShortValue.length <= 2) { break; }
        }

        if (shortValue % 1 != 0) shortValue = shortValue.toFixed(2);
        newValue = shortValue + suffixes[suffixNum];
    }
    return newValue;
}

export const abbreviateNumberBar = (value) => {
    let newValue = value;
    if (value >= 1000) {
        let suffixes = ["", "K", "M", "B", "T"];
        let suffixNum = Math.floor(("" + value).length / 3);
        let shortValue = '';
        for (let precision = 2; precision >= 1; precision--) {
            shortValue = (suffixNum != 0 ? (value / Math.pow(1000, suffixNum)) : value).toFixed(2);
        }
        newValue = shortValue + suffixes[suffixNum];
    }
    return newValue;
}

export const processDescriptionTiktok = async (des) => {
    try {
        const blocksFromHtml = htmlToDraft(des || ``);
        const { contentBlocks, entityMap } = blocksFromHtml;
        let _srcsmap = {}        
        entityMap.forEach((value, key, map) => {
            if (value.type == "IMAGE") {
                _srcsmap[value.data.src] = true
            }
        });
        let srcs = Object.keys(_srcsmap)
        
        let i = 0;
        while (i < srcs.length) {
            let { width, height } = await loadSizeImageFromPath(srcs[i])
            let idx = des.indexOf(`"${srcs[i]}"`, idx + 1)            
            if (idx >= 0) {
                let _idxEnd = des.indexOf(`/>`, idx)                
                des = `${des.substring(0, idx)}"${srcs[i]}" width="${width}" height="${height}" /> ${des.substring(_idxEnd + 2, des.length)}`
            }
            // while (idx >= 0) {
            //     idx = des.indexOf(`"${srcs[i]}"`, idx + 1)
            //     console.log('idx', idx)
            //     if (idx >= 0) {
            //         let _idxEnd = des.indexOf(`/>`, idx)
            //         des = `${des.substring(0, idx)}"${srcs[i]}" width="${width}" height="${height}" /> ${des.substring(_idxEnd + 2, des.length)}`
            //     }
            // }

            i++;
        }

    } catch (error) {
        console.log('error', error)
    }
    console.log('desdesdes', des)
    return des
}

export const loadSizeImage = async (file) => {
    return new Promise((resolve) => {
        let reader = new FileReader();
        let url = reader.readAsDataURL(file);

        reader.onloadend = function (e) {
            let img = new Image()
            img.onload = function (imageEvent) {
                resolve({ width: img.width, height: img.height, size: file.size })
            }
            img.src = e.target.result;
        }
    })
}
export const loadSizeImageFromPath = async (file) => {
    return new Promise((resolve) => {
        let img = new Image()
        img.onload = function (imageEvent) {
            resolve({ width: img.width, height: img.height })
        }
        img.src = file;

    })
}

export const randomString = (string_length = 8) => {
    // let chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
    // let randomstring = '';
    // for (let i = 0; i < string_length; i++) {
    //     let rnum = Math.floor(Math.random() * chars.length);
    //     randomstring += chars.substring(rnum, rnum + 1);
    // }
    return uuidv4();
}

export const formatNumberToCurrency = (n = 0, toFixed = 2, noReplace = false) => {
    if (!n) {
        return 0;
    }
    let reg = /(\d)(?=(\d{3})+(?:\.\d+)?$)/g

    let number = parseFloat(n).toFixed(toFixed)
    if (parseInt(n) - number == 0) {
        number = parseInt(n)
    }
    if (noReplace) {
        return number.toString()
    }

    return number.toString().replace(reg, '$&,');
}



const UNITS = [
    {
        unit: "months",
        title: "Tháng",
        sortTitle: "t",
    },
    {
        unit: "weeks",
        title: "Tuần",
        sortTitle: "t"
    },
    {
        unit: "days",
        title: "Ngày",
        sortTitle: "n"
    },
    {
        unit: "hours",
        title: "Giờ",
        sortTitle: "g"
    },
    {
        unit: "minutes",
        title: "phút",
        sortTitle: "p"
    }]
export const getDeltaDateString = (createdAt, expiresAt, index = 0) => {
    let unit = UNITS[index]
    const validForUnit = expiresAt.diff(createdAt, unit.unit);
    // you could adjust the if to your needs 
    if (unit.unit === "minutes") {
        if (validForUnit == 0) {
            return []
        }
        return [validForUnit, unit.title];
    }
    if (validForUnit >= 1) {
        return [validForUnit, unit.title, ...getDeltaDateString(createdAt, dayjs(expiresAt).add(-validForUnit, unit.unit), index + 1)];
    }

    return getDeltaDateString(createdAt, expiresAt, index + 1);
}
export const getDeltaDateStringSort = (createdAt, expiresAt, index = 0) => {
    let unit = UNITS[index]
    const validForUnit = expiresAt.diff(createdAt, unit.unit);
    // you could adjust the if to your needs 
    if (unit.unit === "minutes") {
        if (validForUnit == 0) {
            return []
        }
        return [validForUnit, unit.sortTitle];
    }
    if (validForUnit >= 1) {
        return [validForUnit, unit.sortTitle, ...getDeltaDateStringSort(createdAt, dayjs(expiresAt).add(-validForUnit, unit.unit), index + 1)];
    }

    return getDeltaDateStringSort(createdAt, expiresAt, index + 1);
}

export const calcKLLogistic = (w, l, h) => {
    return ((w || 0) * (l || 0) * (h || 0)) / 6000
}



export const validateImageFile = ({ width, height, size, channel = 'shopee', config }) => {
    if (!config)
        config = getImageOriginSanValidate(channel)

    if (channel != 'shopee' && (width < config.minWidth || width > config.maxWidth || height < config.minHeight || height > config.maxHeight)) {
        return `Kích thước ảnh chưa đạt yêu cầu. Vui lòng chọn ảnh kích thước tối thiểu ${config.minWidth}x${config.minHeight}, tối đa ${config.maxWidth}x${config.maxHeight}`;
    }

    if (size > config.maxSize * 1024 * 1024) {
        return `Dung lượng ảnh lớn hơn ${config.maxSize}Mb`;
    }
    return null;
}


export const validateImageFileKho = ({ width, height, size }) => {
    if (width < 500 || width > 5000 || height < 500 || height > 5000) {
        return 'Kích thước không hợp lệ';
    }
    if (size > 3 * 1024 * 1024) {
        return 'Dung lượng ảnh lớn hơn 3Mb';
    }
    return null;
}

export const validateImageOrigin = ({ width, height, size, channel = 'shopee', config }) => {
    if (!config)
        config = getImageOriginSanValidate(channel)
    if (width != height) {
        return 'Vui lòng nhập ảnh tỉ lệ 1:1';
    }
    if (channel != 'shopee' && (width < config.minWidth || width > config.maxWidth || height < config.minHeight || height > config.maxHeight)) {
        return `Kích thước ảnh chưa đạt yêu cầu. Vui lòng chọn ảnh kích thước tối thiểu ${config.minWidth}x${config.minHeight}, tối đa ${config.maxWidth}x${config.maxHeight}`;
    }
    if (size > config.maxSize * 1024 * 1024) {
        return `Dung lượng ảnh chưa đạt yêu cầu. Dung lượng ảnh tối đa ${config.maxSize}MB.`;
    }
    return null;
}

export const validateImageSizeChart = ({ width, height, size, channel }) => {
    if (width != height) {
        return 'Vui lòng nhập ảnh tỉ lệ 1:1';
    }
    if (width < 500 || height < 500) {
        return 'Kích thước ảnh chưa đạt yêu cầu. Vui lòng chọn ảnh kích thước tối thiểu 500x500';
    }
    if (channel === 'tiktok') {
        if (width > 5000 || height > 5000) {
            return 'Kích thước ảnh chưa đạt yêu cầu. Vui lòng chọn ảnh kích thước tối đa 5000x5000';
        }

        if (size > 5 * 1024 * 1024) {
            return 'Dung lượng ảnh chưa đạt yêu cầu. Dung lượng ảnh tối đa 5MB.';
        }
    } else if (channel != 'tiktok') {
        if (width > 2048 || height > 2048) {
            return 'Kích thước ảnh chưa đạt yêu cầu. Vui lòng chọn ảnh kích thước tối đa 2048x2048';
        }

        if (size > 500 * 1024) {
            return 'Kích thước ảnh chưa đạt yêu cầu. Kích thước ảnh phải < 500kB.';
        }
    }

    return null;
}

export const validateVideoFile = ({ width, height, size, duration, channel }) => {
    if (channel == 'tiktok') {
        // if (duration > 60) {
        //     return 'Độ dài video chưa đúng. Độ dài không quá 60s';
        // }
        if (size > 20 * 1024 * 1024) {
            return 'Dung lượng video chưa đúng, dung lượng tối đa là 20Mb';
        }
        let ratio = width / height
        if (ratio < 9 / 16 || ratio > 16 / 9) {
            return 'Tỷ lệ khung hình của video phải từ 9:16 đến 16:9';
        }
        return null
    }

    if (channel == 'lazada' && size > 100 * 1024 * 1024) {
        return 'Dung lượng video chưa đúng, dung lượng tối đa là 100Mb';
        // if (Number(duration.toFixed()) > 300) {
        //     return 'Độ dài video chưa đúng. Độ dài không quá 300s';
        // }
    }

    if (channel == 'shopee' && size > 30 * 1024 * 1024) {
        return 'Dung lượng video chưa đúng, dung lượng tối đa là 30Mb';
    }

    if (!channel) {
        if ((width > 1280 || height > 1280)) {
            return 'Độ phân giải không vượt quá 1280x1280px';
        }

        if (width < 480 || height < 480) {
            return 'Độ phân giải tối thiểu 480x480px';
        }

        if (duration > 60 || duration < 10) {
            return 'Độ dài video chưa đúng. Độ dài cho phép từ 10 - 60s”';
        }

        if (size > 20 * 1024 * 1024) {
            return 'Dung lượng video chưa đúng, dung lượng tối đa là 20Mb';
        }
    }

    return null;
}

export const getVideoDuration = async (f) => {
    const fileCallbackToPromise = (fileObj) => {
        return Promise.race([
            new Promise((resolve) => {
                if (fileObj instanceof HTMLImageElement) fileObj.onload = resolve;
                else fileObj.onloadedmetadata = resolve;
            }),
            new Promise((_, reject) => {
                setTimeout(reject, 1000);
            }),
        ]);
    };

    const objectUrl = URL.createObjectURL(f);
    // const isVideo = type.startsWith('video/');
    const video = document.createElement("video");
    video.src = objectUrl;
    await fileCallbackToPromise(video);
    return {
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
    };
}

const getFirstLetterName = (name) => {
    let slug = slugify((name || '').replace(/[\d+*+~.()'"!:@~!@#$%^&*()_+-=`{}\\|;<>,./?]/g, ''), {
        locale: 'vi',       // language code of the locale to use
        remove: /[^a-zA-Z0-9 ]/g,
        // remove: /[\d+*+~.()'"!:@~!@#$%^&*()_+-=`{}\\|;<>,./?]/g,
    })
    return slug.split('-').map(__ => !!__[0] && /^[a-zA-Z]+$/.test(__[0]) ? __[0].toUpperCase() : '').filter(__ => __.length > 0).slice(0, 8).join('')
}


export const createSKUProduct = (smeId, name, index = 0) => {
    if (!name) {
        return ""
    }
    return `${`0000000000${smeId}`.slice(-6)}${getFirstLetterName(name)}-${Math.floor((Date.now() + index * 1000)/ 1000)}`
}


export const createSKUVariant = (smeId, name, prefix, attributes = [], index = 0) => {
    if (!!prefix && prefix.trim().length > 0) {
        let slug = slugify((prefix || '').replace(/[\d+*+~.()'"!:@~!@#$%^&*()_+-=`{}\\|;<>,./?]/g, ''), {
            locale: 'vi',       // language code of the locale to use
            remove: /[^a-zA-Z0-9 ]/g,
            // remove: /[\d+*+~.()'"!:@~!@#$%^&*()_+-=`{}\\|;<>,./?]/g,
        })
        console.log(`CHECK SLUG: `, slug)
        return `${`0000000000${smeId}`.slice(-6)}${slug.split('-').join('').replace(/[0-9]/g, '').substring(0, 8)}-${attributes.map(__ => {
            let slug = slugify(__.replace(/[\d+*+~.()'"!:@~!@#$%^&*()_+-=`{}\\|;<>,./?]/g, ''), {
                locale: 'vi',       // language code of the locale to use
                remove: /[^a-zA-Z0-9 ]/g,
                // remove: /[\d+*+~.()'"!:@~!@#$%^&*()_+-=`{}\\|;<>,./?]/g,
            })
            console.log(`CHECK SLUG: `, slug)
            return slug.split("-").join("").replace(/[0-9]/g, '').substring(0, 2)
        }).join('')}-${Math.floor(Date.now() / 1000) + index}`.toUpperCase()
    }
    if (!!name && name.trim().length > 0)
        return `${`0000000000${smeId}`.slice(-6)}${getFirstLetterName(name)}-${attributes.map(__ => {
            let slug = slugify(__.replace(/[\*+~.()'"!:@~!@#$%^&*()_+=`{}\\|;<>,./?]/g, ''), {
                locale: 'vi',       // language code of the locale to use
                remove: /[^a-zA-Z0-9 ]/g,
                // remove: /[\d+*+~.()'"!:@~!@#$%^&*()_+-=`{}\\|;<>,./?]/g,
            })
            return slug.split("-").join("").substring(0, 2)
        }).join('')}-${Math.floor(Date.now() / 1000) + index}`.toUpperCase()
}

export const validateOriginVideo = async (source, channel) => {
    return new Promise((resolve) => {
        fetch(source)
            .then((result) => {
                return result.blob();
            })
            .then(async data => {
                if (!!data) {
                    let { width, height, duration } = await getVideoDuration(data);

                    let error = validateVideoFile({ width, height, duration, size: data.size, channel });

                    if (!!error) {
                        resolve({ error: true })
                    }

                    resolve({ error: false })
                }
            })
            .catch(() => resolve({ error: false }))
    })
}

export const parseSchemaProductConnectorFromProduct = (smeProduct, currentChannel) => {
    console.log({ smeProduct })
    let logistics = !!smeProduct?.sme_catalog_product_ship_package_infos ? smeProduct?.sme_catalog_product_ship_package_infos[0] : null;
    let properties = {};
    let productFiles = _.sortBy((smeProduct?.sme_catalog_product_assets || []).filter(_asset => _asset.is_video == 0), 'position_show').map(_asset => {
        return {
            id: _asset.id,
            source: _asset.asset_url,
        }
    });
    let productVideFiles = _.sortBy((smeProduct?.sme_catalog_product_assets || []).filter(_asset => _asset.is_video == 1), 'position_show').map(_asset => {
        return {
            id: _asset.asset_id,
            source: _asset.asset_url
        }
    });

    let sizeCharts = (smeProduct?.sme_catalog_product_assets || []).filter(_asset => _asset.is_video == 2).map(_asset => {
        return {
            id: _asset.asset_id,
            source: _asset.asset_url,
            sme_id: _asset.id
        }
    })
    let imageOrigins = (smeProduct?.sme_catalog_product_assets || []).filter(_asset => _asset.is_video == 3).map(_asset => {
        return {
            id: _asset.asset_id,
            source: _asset.asset_url,
            sme_id: _asset.id
        }
    })

    let _customAttributes = (smeProduct?.sme_catalog_product_attributes_custom || []).map(_attribute => {
        return {
            ..._attribute,
            input_type: ATTRIBUTE_VALUE_TYPE.TEXT,
            isCustom: true,
        }
    });
    let _attributeSelected = [];
    let _attributeValueForm = {};
    let _productAttributeFiles = {};
    let _disableFields = {
        ['disable-edit-attribute']: true
    };


    (smeProduct?.sme_catalog_product_variants?.filter(item => !item?.variant_unit && !item?.product_status_id) || []).forEach(_variant => {
        let codes = [];
        console.log({ _variant });
        _.sortBy((_variant.attributes || []), ___atttibute => (___atttibute?.id || 0)).forEach((_attribute, ___index) => {
            codes.push(_attribute.sme_catalog_product_attribute_value.ref_index);

            _attributeValueForm = {
                ..._attributeValueForm,
                [`att-${_attribute.sme_catalog_product_attribute_value.product_attribute_custom_id || _attribute.sme_catalog_product_attribute_value.product_attribute_id}-${_attribute.sme_catalog_product_attribute_value.ref_index}`]: _attribute.sme_catalog_product_attribute_value.name,
                [`att-${_attribute.sme_catalog_product_attribute_value.product_attribute_custom_id || _attribute.sme_catalog_product_attribute_value.product_attribute_id}-${_attribute.sme_catalog_product_attribute_value.ref_index}-editing`]: true, //field dung de disable khong cho xoá khi sửa sp
            }

            if (!_productAttributeFiles[_attribute.sme_catalog_product_attribute_value.ref_index]) {
                _productAttributeFiles = {
                    ..._productAttributeFiles,
                    [_attribute.sme_catalog_product_attribute_value.ref_index]: {
                        files: _.sortBy((_attribute.sme_catalog_product_attribute_value.assets || []), 'position_show').map(_asset => {
                            return {
                                id: _asset.asset_id,
                                source: _asset.asset_url
                            }
                        }),
                        attribute_value: _attribute.sme_catalog_product_attribute_value.name,
                        attribute_id: _attribute.sme_catalog_product_attribute_value.product_attribute_custom_id || _attribute.sme_catalog_product_attribute_value.product_attribute_id,
                        isCustom: false
                    }
                }
            }

            let hasNew = true;
            _attributeSelected = _attributeSelected.map(_att => {
                if (!!_attribute.sme_catalog_product_attribute_value.sme_catalog_product_custom_attribute) {
                    if (_att.isCustom && _att.id == _attribute.sme_catalog_product_attribute_value.sme_catalog_product_custom_attribute.id) {
                        hasNew = false;
                        return {
                            ..._att,
                            sme_variant_attribute_id: _att.id,
                            sme_variant_attribute_name: _att.display_name,
                            values: (_att.values.some(_vvv => _vvv.code == _attribute.sme_catalog_product_attribute_value.ref_index) ? _att.values : _att.values.concat([{
                                v: _attribute.sme_catalog_product_attribute_value.name,
                                id: _attribute.sme_catalog_product_attribute_value.id,
                                code: _attribute.sme_catalog_product_attribute_value.ref_index,
                                position: _attribute.sme_catalog_product_attribute_value.position || 0,
                            }])).map(_vvv => {
                                return {
                                    ..._vvv,
                                    sme_variant_attribute_value_id: !!_vvv.id ? String(_vvv.id) : null,
                                    sme_variant_attribute_value_name: _vvv.v,
                                }
                            })
                        }
                    }
                    return _att;
                }
                if (!_att.isCustom && _att.id == _attribute.sme_catalog_product_attribute_value.op_catalog_product_attribute.id) {
                    hasNew = false;
                    return {
                        ..._att,
                        values: (_att.values.some(_vvv => _vvv.code == _attribute.sme_catalog_product_attribute_value.ref_index) ? _att.values : _att.values.concat([{
                            id: _attribute.sme_catalog_product_attribute_value.id,
                            v: _attribute.sme_catalog_product_attribute_value.name,
                            code: _attribute.sme_catalog_product_attribute_value.ref_index,
                            position: _attribute.sme_catalog_product_attribute_value.position || 0,
                        }])).map(_vvv => {
                            return {
                                ..._vvv,
                                sme_variant_attribute_value_id: !!_vvv.id ? String(_vvv.id) : null,
                                sme_variant_attribute_value_name: _vvv.v,
                            }
                        })
                    }
                }
                return _att;
            })

            if (hasNew) {
                if (!!_attribute.sme_catalog_product_attribute_value.op_catalog_product_attribute) {
                    _attributeSelected.push({
                        ..._attribute.sme_catalog_product_attribute_value.op_catalog_product_attribute,
                        sme_variant_attribute_id: _attribute.sme_catalog_product_attribute_value.op_catalog_product_attribute.id,
                        sme_variant_attribute_name: _attribute.sme_catalog_product_attribute_value.op_catalog_product_attribute.display_name,
                        values: [{
                            v: _attribute.sme_catalog_product_attribute_value.name,
                            id: _attribute.sme_catalog_product_attribute_value.id,
                            code: _attribute.sme_catalog_product_attribute_value.ref_index,
                            position: _attribute.sme_catalog_product_attribute_value.position || 0,
                        }].map(_vvv => {
                            return {
                                ..._vvv,
                                sme_variant_attribute_value_id: !!_vvv.id ? String(_vvv.id) : null,
                                sme_variant_attribute_value_name: _vvv.v,
                            }
                        })
                    })

                }
                if (!!_attribute.sme_catalog_product_attribute_value.sme_catalog_product_custom_attribute) {
                    _attributeSelected.push({
                        ..._attribute.sme_catalog_product_attribute_value.sme_catalog_product_custom_attribute,
                        sme_variant_attribute_id: _attribute.sme_catalog_product_attribute_value.sme_catalog_product_custom_attribute.id,
                        sme_variant_attribute_name: _attribute.sme_catalog_product_attribute_value.sme_catalog_product_custom_attribute.display_name,
                        input_type: ATTRIBUTE_VALUE_TYPE.TEXT,
                        isCustom: true,
                        values: [{
                            v: _attribute.sme_catalog_product_attribute_value.name,
                            id: _attribute.sme_catalog_product_attribute_value.id,
                            code: _attribute.sme_catalog_product_attribute_value.ref_index,
                            position: _attribute.sme_catalog_product_attribute_value.position || 0,
                        }].map(_vvv => {
                            return {
                                ..._vvv,
                                sme_variant_attribute_value_id: !!_vvv.id ? String(_vvv.id) : null,
                                sme_variant_attribute_value_name: _vvv.v,
                            }
                        })
                    })
                }

            }
        });


        //sort lại values trong attribute
        // _attributeSelected = _attributeSelected.map(_att => {
        //   let newValues = [...(_att.values || [])];
        //   newValues.sort((_v1, _v2) => _v1.position - _v2.position)
        //   return {
        //     ..._att,
        //     values: newValues
        //   }
        // });


        codes = codes.join('-')

        if (codes?.length === 0) {
            _attributeValueForm = {
                ..._attributeValueForm,                
                [`variant-noattribute-sme_product_variant_id`]: codes.length == 0 ? _variant.id : undefined,
            }
        }
        
        if (codes?.length > 0) {
            _attributeValueForm = {
                ..._attributeValueForm,
                [`variant-${codes}-price`]: typeof _variant?.price == 'number' ? _variant?.price : undefined,
                [`variant-${codes}-sku`]: _variant?.sku || undefined,
                [`variant-${codes}-stockOnHand`]: typeof _variant?.stock_on_hand == 'number' ? _.find(_variant?.inventories, iv => iv?.sme_store?.is_default)?.stock_actual : undefined,
                [`variant-${codes}-visible`]: (_variant.status == 10),
                [`variant-${codes}-sme_product_variant_id`]: _variant.id,
                [`variant-noattribute-sme_product_variant_id`]: codes.length == 0 ? _variant.id : undefined,
            }
        }

        _disableFields = {
            ..._disableFields,
            [`disable-sku-${codes}`]: true
        }

    });

    _customAttributes = _customAttributes.map(_att => {
        if (Object.values(_productAttributeFiles).some(_file => _file.attribute_id == _att.id && _file.files?.length > 0)) {
            return {
                ..._att,
                has_asset: true
            }
        }
        return _att
    })
    if (_customAttributes.length > 0) {
        if (!_customAttributes.some(_att => !!_att.has_asset)) {
            _customAttributes[0].has_asset = true;
        }
    }

    _attributeSelected = _attributeSelected.map(_att => {
        _att.values.forEach(_value => {
            _disableFields = {
                ..._disableFields,
                [`disable-att-value-${_att.id}-${_value.code}`]: true,
                [`disable-att-value-${_att.id}`]: true
            }
        });

        if (Object.values(_productAttributeFiles).some(_file => _file.attribute_id == _att.id && _file.files?.length > 0)) {
            return {
                ..._att,
                has_asset: true
            }
        }
        return _att
    })

    if (_attributeSelected.length > 0) {
        if (!_attributeSelected.some(_att => !!_att.has_asset)) {
            _attributeSelected[0].has_asset = true;
        }
    }



    if (_attributeSelected.length == 0) {
        _attributeValueForm = {
            ..._attributeValueForm,
            origin_price: smeProduct?.price,
            origin_stockOnHand: _.find(smeProduct?.sme_catalog_product_variants[0]?.inventories, iv => iv?.sme_store?.is_default)?.stock_actual,
            origin_sku: String(smeProduct?.sku),
        }
    }


    let variants = [];
    let _filterSelected = _attributeSelected.filter(_att => !_att.isInactive).sort((a, b) => a.position - b.position)
    console.log('attributesSelected', _filterSelected)
    if (_filterSelected.length == 1) {
        (_filterSelected[0].values || []).forEach(_value => {
            variants.push({
                attribute: `${_filterSelected[0].id}`,
                code: _value.code,
                rowSpan: 1,
                names: [_value.v],
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
                variants.push({
                    attribute: `${_filterSelected[0].id}-${_filterSelected[1].id}`,
                    code: `${_value.code}-${_value2.code}`,
                    rowSpan: sameRow ? _filterSelected[1].values.length : 1,
                    names,
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
                    variants.push({
                        attribute: `${_filterSelected[0].id}-${_filterSelected[1].id}-${_filterSelected[2].id}`,
                        code: `${_value.code}-${_value2.code}-${_value3.code}`,
                        // rowSpan: sameRow ? _filterSelected[1].values.length * _filterSelected[2].values.length : (sameRow2 ? _filterSelected[2].values.length : 1),
                        rowSpans: [_filterSelected[1].values.length * _filterSelected[2].values.length, _filterSelected[2].values.length, 1],
                        names: names,
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

    let descriptionObj = {
        description: (currentChannel?.connector_channel_code == 'shopee' ? smeProduct?.description : smeProduct?.description_short) || '',
        description_html: smeProduct?.description_html || '',
        description_html_init: smeProduct?.description_html || '',
        description_short: smeProduct?.description_short || '',
        description_short_init: smeProduct?.description_short || '',
    }

    let description_extend = EditorState.createEmpty()
    if (smeProduct?.description_extend) {
        try {
            let needConcat = !!JSON.parse(smeProduct?.description_extend)[0].image_info
            // const blocksFromHtml = htmlToDraft((needConcat ? ["<p></p>"] : []).concat(JSON.parse(smeProduct?.description_extend)?.map(__ => {
            //     if (__.field_type == 'text') {
            //         return `<p>${__.text}</p>`
            //     }
            //     if (!!__.image_info) {
            //         return `<img src="${__.image_info.sme_url || __.image_info.image_url}" alt="${__.image_info.sme_url || __.image_info.image_url}" style="height: auto;width: 100%"/><p></p>`
            //     }
            //     return null
            // }).filter(__ => !!__)).join(''));
            let hasItem = false;
            const blocksFromHtml = htmlToDraft(_.flatten(JSON.parse(smeProduct?.description_extend).map(__ => {
                if (__.field_type == 'text') {
                    hasItem = true;
                    return (__.text || '').split('\n').map(__ => `<p>${__}</p>`)
                }
                if (!!__.image_info) {
                    return [`${!!hasItem ? '' : '<p></p>'}<img src="${__.image_info.sme_url || __.image_info.image_url}" alt="${__.image_info.sme_url || __.image_info.image_url}" style="height: auto;width: 100%"/><p></p>`]
                }
                return null
            })).filter(__ => !!__).join(''));
            const contentState = ContentState.createFromBlockArray(blocksFromHtml.contentBlocks, blocksFromHtml.entityMap);
            description_extend = EditorState.createWithContent(contentState)
        } catch (error) {

        }
    } else {
        try {
            const blocksFromHtml = htmlToDraft(`<p>${smeProduct.description || ""}</p>`);
            const contentState = ContentState.createFromBlockArray(blocksFromHtml.contentBlocks, blocksFromHtml.entityMap);
            description_extend = EditorState.createWithContent(contentState)
        } catch (error) {

        }
    }


    return {
        form: {
            channel_code: currentChannel?.connector_channel_code,
            name: smeProduct?.name_seo,
            sku: smeProduct?.sku || '',
            stockOnHand: _.find(smeProduct?.sme_catalog_product_variants[0]?.inventories, iv => iv?.sme_store?.is_default)?.stock_actual,
            price: smeProduct?.price || '',
            video_url: smeProduct?.video_url || '',
            ...(currentChannel?.connector_channel_code === 'lazada' ? {
                type_video: (productVideFiles?.length > 0 || !smeProduct?.video_url) ? 'video' : 'url',
            } : {}),
            ...descriptionObj,
            description_extend,
            is_cod_open: true,
            height: currentChannel?.connector_channel_code != 'lazada' ? Math.round(logistics?.size_height || 0) : (logistics?.size_height || 0),
            length: currentChannel?.connector_channel_code != 'lazada' ? Math.round(logistics?.size_length || 0) : (logistics?.size_length || 0),
            width: currentChannel?.connector_channel_code != 'lazada' ? Math.round(logistics?.size_width || 0) : (logistics?.size_width || 0),
            weight: currentChannel?.connector_channel_code != 'lazada' ? Math.round(logistics?.weight || 0) : (logistics?.weight || 0),
            ...properties,
            ..._attributeValueForm,
            ..._disableFields
        },
        productFiles,
        productVideFiles,
        customAttributes: _customAttributes,
        productAttributeFiles: _productAttributeFiles,
        attributesSelected: _attributeSelected,
        productSizeChart: sizeCharts[0],
        productImageOrigin: imageOrigins[0],
        variants
    }
}
