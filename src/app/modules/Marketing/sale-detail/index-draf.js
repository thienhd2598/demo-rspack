/* eslint-disable no-unused-expressions */
import React, { memo, useMemo, useEffect, Fragment, useState, useCallback } from 'react';
import { Card, CardBody } from '../../../../_metronic/_partials/controls';
import { useSubheader } from '../../../../_metronic/layout/_core/MetronicSubheader';
import { useMutation, useQuery } from '@apollo/client';
import { useParams } from 'react-router-dom';
import { queryGetScProductVariants } from '../../Order/OrderUIHelpers';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { Helmet } from 'react-helmet-async';
import query_mktFindCampaign from '../../../../graphql/query_mktFindCampaign';
import mutate_mktSaveCampaign from '../../../../graphql/mutate_mktSaveCampaign';
import Skeleton from 'react-loading-skeleton';
import { useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';
import { useLocation, useHistory } from 'react-router-dom';
import queryString from 'querystring';
import { Field, Formik, Form } from "formik";
import { InputVertical } from "../../../../_metronic/_partials/controls";
import { RadioGroup } from '../../../../_metronic/_partials/controls/forms/RadioGroup';
import * as Yup from "yup";
import Select from 'react-select';
import DateRangePicker from 'rsuite/DateRangePicker';
import ModalAddVariants from '../dialog/ModalAddVariants';
import Pagination from '../pagination'
import SVG from "react-inlinesvg";
import { toAbsoluteUrl, checkIsActive } from "../../../../_metronic/_helpers";
import { Checkbox } from "../../../../_metronic/_partials/controls";
import query_sc_stores_basic from "../../../../graphql/query_sc_stores_basic";
import mutate_retryCampaignItem from '../../../../graphql/mutate_retryCampaignItem';
import mutate_mktApprovedCampaign from '../../../../graphql/mutate_mktApprovedCampaign';
import { RouterPrompt } from '../../../../components/RouterPrompt';
import { Modal } from 'react-bootstrap';
import { Dropdown } from 'react-bootstrap';
import InfoProduct from '../../../../components/InfoProduct';
import HoverImage from '../../../../components/HoverImage';
import { Link } from 'react-router-dom/cjs/react-router-dom';
import { formatNumberToCurrency } from '../../../../utils';
import { TABS_DETAILS } from '../Constants';
import SupportFeature from '../campaign-create/SupportFeature';
import { APPLY_TYPE_FRAME, OPTIONS_FRAME } from '../../FrameImage/FrameImageHelper';
import client from '../../../../apollo';
import query_sme_catalog_photo_frames_by_pk from '../../../../graphql/query_sme_catalog_photo_frames_by_pk';
import AuthorizationWrapper from '../../../../components/AuthorizationWrapper';
import query_get_scheduled_asset_frame_detail from '../../../../graphql/query_get_scheduled_asset_frame_detail';
import mutate_scRemoveProductFrameImages from '../../../../graphql/mutate_scRemoveProductFrameImages';
import ModalProductCreateFrameImg from '../dialog/ModalProductCreateFrameImg';
import ModalLoadFrameImage from '../../ProductsStore/products-list/dialog/ModalLoadFrameImage';
import LoadingDialog from '../../ProductsStore/products-list-draf/dialog/LoadingDialog';
import ModalConfirmAddFrame from '../dialog/ModalConfirmAddFrame';
import { finished } from 'stream';
import { MarketingProvider } from '../contexts/MarketingContext';

const STATUS_SALE = {
  pending: {
    label: "Chờ duyệt",
    color: '#F80D0D'
  },
  coming_soon: {
    label: 'Sắp diễn ra',
    color: '#FF5629',
  },
  happening: {
    label: 'Đang diễn ra',
    color: '#3DA153',
  },
  finished: {
    label: 'Đã kết thúc',
    color: '#F80D0D',
  },
};

const criteria = {
  lazada: {
    firstCriteria: [`- Đánh giá sản phẩm (0.0-5.0): vô hạn`,
      `- Số lượng khuyến mãi: >=1`],
    secondCriteria: [`- Mức độ giảm giá: 1% ~ 90% `,
      `- Đơn hàng 30 ngày trước đó: >=1`]
  },
  shopee: {
    firstCriteria: [`- Số lượng khuyến mãi:1~1000`,
      `- Đánh giá sản phẩm: Không giới hạn`,
      `- Hàng đặt trước: Không chấp nhận hàng đặt trước`,
      `- Thời gian chuẩn bị hàng: Không giới hạn ngày`],
    secondCriteria: [`
    - Mức khuyến mãi: 5% ~ 90%`,
      `- Lượt thích sản phẩm: Không giới hạn`,
      `- Số lượng đơn hàng trong vòng 30 ngày qua: Không giới hạn`,
      `- Thời gian tham gia chương trình tiếp theo: Không giới hạn ngày`]
  },
  tiktok: {
    firstCriteria: [`- Giá thấp nhất trong 30 ngày (Giá ưu đãi chớp nhoáng cần phải thấp hơn giá thấp nhất sau khi sản phẩm của nhà bán hàng giảm giá trong 30 ngày qua. Nếu không có lịch sử đơn hàng nào trong 30 ngày qua, giá ưu đãi chớp nhoáng chỉ cần thấp hơn giá bán lẻ ban đầu.)`],
    secondCriteria: [`- Giá ưu đãi chớp nhoáng sẽ được ưu tiên áp dụng (Khi một sản phẩm được thêm vào cả khuyến mãi ưu đãi chớp nhoáng và khuyến mãi chiết khấu sản phẩm, chỉ có giá ưu đãi chớp nhoáng mới có hiệu lực. Tuy nhiên, khi một sản phẩm ưu đãi chớp nhoáng được đăng ký và phê duyệt cho chiến dịch TikTok, giá chiến dịch sẽ được ưu tiên áp dụng trong suốt chiến dịch, bất kể mức giá này có thấp hơn giá ưu đãi chớp nhoáng hay không.)
    `]
  }
}

const CampaignDetail = ({ }) => {
  const params = useParams();
  const { formatMessage } = useIntl();
  const location = useLocation();
  const history = useHistory();
  const paramsQuery = queryString.parse(location.search.slice(1, 100000));
  const { addToast } = useToasts();
  const { setBreadcrumbs } = useSubheader();
  const [loadingScVariant, setLoadingScVariant] = useState(false);
  const [scVariants, setSmeVariants] = useState(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [productsScheduled, setProductsScheduled] = useState([]);
  const [syncImg, setSyncImg] = useState(null);
  const [isShowCreateFrameImg, setIsShowCreateFrameImg] = useState(false);
  const [productNotImgOrigin, setProductNotImgOrigin] = useState([]);
  const [idsFrameImg, setIdsFrameImg] = useState([]);
  const [productSelect, setProductSelect] = useState([]);
  const action = paramsQuery?.action;
  const [showWarningPrompt, setShowWarningPrompt] = useState(false)
  const typeDiscount = [
    {
      value: 2,
      label: formatMessage({ defaultMessage: 'Theo phần trăm' })
    },
    {
      value: 1,
      label: formatMessage({ defaultMessage: 'Theo số tiền' })
    }
  ]
  const [retryCampaignItem] = useMutation(mutate_retryCampaignItem,
    {
      awaitRefetchQueries: true,
      refetchQueries: ['mktListCampaign', 'mktCampaignAggregate', 'mktFindCampaign']
    }
  )
  const [updateCampaign] = useMutation(mutate_mktSaveCampaign,
    {
      awaitRefetchQueries: true,
      refetchQueries: ['mktListCampaign', 'mktCampaignAggregate']
    }
  )
  const { data: saleDetail, loading: loadingDetail, refetch, error } = useQuery(
    query_mktFindCampaign,
    {
      variables: {
        id: Number(params.id) || Number(location?.state?.id),
      },
      fetchPolicy: 'cache-and-network',
      onCompleted: async (data) => {
        if (data?.mktFindCampaign) {
          setLoadingScVariant(true);
          const scVariants = await queryGetScProductVariants(
            data?.mktFindCampaign?.campaignItem?.filter(item => Boolean(item?.sc_variant_id))?.flatMap((item) => {
              return item?.sc_variant_id;
            })
          );

          setLoadingScVariant(false);
          let newSmeVariant = data?.mktFindCampaign?.campaignItem?.map(item => {
            let sameVariant = scVariants?.find(variant => variant?.id == item?.sc_variant_id)
            return {
              campaignInfo: item,
              scVariant: sameVariant || null
            }
          })
          console.log(newSmeVariant)
          setSmeVariants(newSmeVariant);
          setProductsScheduled(newSmeVariant)
        }
      },
    }
  );



  let _store = useMemo(() => {
    if (!saleDetail) return null;
    let { sc_stores, mktFindCampaign } = saleDetail;
    let _store = sc_stores.find((_st) => _st.id == mktFindCampaign?.store_id);

    return _store;
  }, [saleDetail]);

  let _channel = useMemo(() => {
    if (!saleDetail) return null;
    let { op_connector_channels, mktFindCampaign } = saleDetail;
    let _store = op_connector_channels.find(
      (_st) => _st.code == mktFindCampaign?.connector_channel_code
    );

    return _store;
  }, [saleDetail]);
  const { data: dataStore, loading: loadingStore } = useQuery(query_sc_stores_basic, {
    fetchPolicy: "cache-and-network",
  });

  useEffect(() => {
    setBreadcrumbs([
      {
        title: `${action == 'edit' ? 'Chỉnh sửa' : "Chi tiết"} chương trình khuyến mãi`,
      },
      {
        title:
          saleDetail?.mktFindCampaign?.type == 1
            ? 'Chiết khấu sản phẩm'
            : (saleDetail?.mktFindCampaign?.type == 2
              ? 'FlashSale'
              : 'Chương trình khác'),
      },
    ]);
  }, [saleDetail]);


  const page = useMemo(() => {
    try {
      let _page = Number(paramsQuery.page);
      if (!Number.isNaN(_page)) {
        return Math.max(1, _page)
      } else {
        return 1
      }
    } catch (error) {
      return 1;
    }
  }, [paramsQuery.page]);

  const limit = useMemo(() => {
    try {
      let _value = Number(paramsQuery.limit)
      if (!Number.isNaN(_value)) {
        return Math.max(25, _value)
      } else {
        return 25
      }
    } catch (error) {
      return 25
    }
  }, [paramsQuery.limit]);
  const saleStatus = useMemo(() => {
    const currentDate = new Date();
    if (saleDetail?.mktFindCampaign?.status == 1) {
      return 'pending'
    }
    else if (
      !!(
        new Date(saleDetail?.mktFindCampaign?.start_time * 1000) >= currentDate && saleDetail?.mktFindCampaign?.status == 2
      )
    ) {
      return 'coming_soon';
    } else if (
      !!(
        new Date(saleDetail?.mktFindCampaign?.start_time * 1000) <
        currentDate &&
        new Date(saleDetail?.mktFindCampaign?.end_time * 1000) > currentDate && saleDetail?.mktFindCampaign?.status == 2
      )
    ) {
      return 'happening';
    } else {
      return 'finished';
    }
  }, [saleDetail]);

  const typeCampaign = useMemo(() => {
    if (saleDetail?.mktFindCampaign?.type == 1) {
      return 'discount';
    } else if (saleDetail?.mktFindCampaign?.type == 2) {
      return 'flashsale';
    } else {
      return 'other';
    }
  });

  const [approvedCampaign, { loading: loadingApprovedCampaign }] = useMutation(mutate_mktApprovedCampaign, {
    awaitRefetchQueries: true,
    refetchQueries: ['mktListCampaign', 'mktCampaignAggregate']
  });

  const totalPage = Math.ceil((saleDetail?.mktFindCampaign?.status != 1 ? productsScheduled?.filter(product => {
    if (paramsQuery?.type == 2) {
      return !product?.campaignInfo?.sync_error_message && product?.campaignInfo?.sync_status == 2
    } else if (paramsQuery?.type == 3) {
      return product?.campaignInfo?.sync_status == 1
    } else {
      return !!product?.campaignInfo?.sync_error_message
    }
  }) : productsScheduled)?.length / limit)

  const { loading, data: dataFrameByPk } = useQuery(query_sme_catalog_photo_frames_by_pk, {
    variables: { id: saleDetail?.mktFindCampaign?.campaignScheduleFrame?.frame_id }
  });



  const initialValues = useMemo(() => {
    let _attributeValueForm = {};
    (saleDetail?.mktFindCampaign?.campaignItem || [])?.forEach(
      (campaignItem, index) => {
        const products = scVariants?.filter((item) => {
          return item?.campaignInfo?.sc_variant_id == campaignItem?.sc_variant_id;
        });
        const currentProduct = products?.length ? products[0] : {};
        let mktType = typeCampaign == 'discount' ? 'mktItemDiscount' : 'mktItemFlashSale'
        if (campaignItem?.sc_variant_id == null) {
          _attributeValueForm[`campaign-${campaignItem?.id}-discount-percent`] = Math.ceil(campaignItem[`${mktType}`]?.discount_percent)
          _attributeValueForm[`campaign-${campaignItem?.id}-promotion_price`] = Math.ceil(campaignItem[`${mktType}`]?.promotion_price)
          _attributeValueForm[`campaign-${campaignItem?.id}-purchase_limit`] =
            !campaignItem[`${mktType}`]?.promotion_stock ? { value: 1, label: "Không giới hạn" } : { value: 2, label: "Giới hạn" }

          _attributeValueForm[`campaign-${campaignItem?.id}-quantity_per_user`] = !campaignItem[`${mktType}`]?.purchase_limit ? { value: 1, label: "Không giới hạn" } : { value: 2, label: "Giới hạn" }

          _attributeValueForm[`campaign-${campaignItem?.id}-purchase_limit_number`] =
            !!campaignItem[`${mktType}`]?.promotion_stock ? campaignItem[`${mktType}`]?.promotion_stock : 1

          _attributeValueForm[`campaign-${currentProduct?.scVariant?.id}-quantity_per_user_number`] = !!campaignItem[`${mktType}`]?.purchase_limit ? campaignItem[`${mktType}`]?.purchase_limit : 1

        }
        _attributeValueForm[`campaign-${currentProduct?.scVariant?.id}-discount-value`] = campaignItem[`${mktType}`]?.promotion_price ? (currentProduct?.scVariant?.price - campaignItem[`${mktType}`]?.promotion_price) : Math.ceil(currentProduct?.scVariant?.price * (campaignItem[`${mktType}`]?.discount_percent / 100))

        _attributeValueForm[`campaign-${currentProduct?.scVariant?.id}-discount-percent`] = campaignItem[`${mktType}`]?.promotion_price ? Math.ceil((currentProduct?.scVariant?.price - campaignItem[`${mktType}`]?.promotion_price) / currentProduct?.scVariant?.price * 100) : Math.ceil(campaignItem[`${mktType}`]?.discount_percent)

        _attributeValueForm[`campaign-${currentProduct?.scVariant?.id}-promotion_price`] = campaignItem[`${mktType}`]?.promotion_price ? campaignItem[`${mktType}`]?.promotion_price : currentProduct?.scVariant?.price * (1 - campaignItem[`${mktType}`]?.discount_percent / 100)

        _attributeValueForm[`campaign-${currentProduct?.scVariant?.id}-purchase_limit`] =
          !campaignItem[`${mktType}`]?.promotion_stock ? { value: 1, label: "Không giới hạn" } : { value: 2, label: "Giới hạn" }

        _attributeValueForm[`campaign-${currentProduct?.scVariant?.id}-quantity_per_user`] = !campaignItem[`${mktType}`]?.purchase_limit ? { value: 1, label: "Không giới hạn" } : { value: 2, label: "Giới hạn" }

        _attributeValueForm[`campaign-${currentProduct?.scVariant?.id}-purchase_limit_number`] =
          !!campaignItem[`${mktType}`]?.promotion_stock ? campaignItem[`${mktType}`]?.promotion_stock : 1

        _attributeValueForm[`campaign-${currentProduct?.scVariant?.id}-quantity_per_user_number`] = !!campaignItem[`${mktType}`]?.purchase_limit ? campaignItem[`${mktType}`]?.purchase_limit : 1
      })

    const frameByPk = {
      id: dataFrameByPk?.sme_catalog_photo_frames_by_pk?.id,
      url: dataFrameByPk?.sme_catalog_photo_frames_by_pk?.asset_url,
      name: dataFrameByPk?.sme_catalog_photo_frames_by_pk?.name
    };
    const day = Math.floor(saleDetail?.mktFindCampaign?.campaignScheduleFrame?.apply_before_second / (3600 * 24))
    const hour = Math.floor(saleDetail?.mktFindCampaign?.campaignScheduleFrame?.apply_before_second % (3600 * 24) / 3600)
    const minute = Math.floor(saleDetail?.mktFindCampaign?.campaignScheduleFrame?.apply_before_second % 3600 / 60)
    const second = Math.floor(saleDetail?.mktFindCampaign?.campaignScheduleFrame?.apply_before_second % 60)
    return {
      'name': saleDetail?.mktFindCampaign?.name,
      other_type: 'Mặc định',
      store: _store?.id,
      quantity: { value: 1, label: "Không giới hạn" },
      quantity_per_user: { value: 1, label: "Không giới hạn" },
      quantity_per_user_number: 1,
      quantity_number: 1,
      discount_percent: null,
      typeDiscount: saleDetail?.mktFindCampaign?.discount_type == 1 ? 1 : 2,
      timeValue: [new Date(saleDetail?.mktFindCampaign?.start_time * 1000), new Date(saleDetail?.mktFindCampaign?.end_time * 1000)],
      on_create_schedule_frame: !!saleDetail?.mktFindCampaign?.on_create_schedule_frame,
      on_create_reserve_ticket: !!saleDetail?.mktFindCampaign?.on_create_reserve_ticket,
      apply_type: APPLY_TYPE_FRAME?.find(type => type?.value == saleDetail?.mktFindCampaign?.campaignScheduleFrame?.apply_type) || APPLY_TYPE_FRAME[0],
      option: OPTIONS_FRAME?.find(op => op?.value == saleDetail?.mktFindCampaign?.campaignScheduleFrame?.option) || OPTIONS_FRAME[1],
      frame: !!frameByPk ? frameByPk : null,
      day: day ? { value: day, label: day < 10 ? `0${day}` : day } : null,
      hour: hour ? { value: hour, label: hour < 10 ? `0${hour}` : hour } : null,
      minute: minute ? { value: minute, label: minute < 10 ? `0${minute}` : minute } : null,
      second: second ? { value: second, label: second < 10 ? `0${second}` : second } : null,
      ..._attributeValueForm
    }
  }, [saleDetail, dataFrameByPk, _store, scVariants])
  let [campaignSchema, setCampaignSchema] = useState({})
  let schema = useMemo(() => {
    let _schema = {
      name: Yup.string().required('Vui lòng nhập tên CTKM')
        .max(150, 'Tên chương trình khuyến mãi tối đa 150 ký tự.'),
      timeValue: Yup.array().required("Vui lòng chọn khoảng thời gian.").nullable(),
      store: Yup.string().required('Vui lòng chọn gian hàng'),
      discount_percent: Yup.number()
        .nullable()
        .min(1, 'Giảm giá phải lớn hơn 0%')
        .max(99, 'Giảm giá phải nhỏ hơn 100%'),
      discount_value: Yup.number()
        .nullable()
        .min(1, 'Giảm giá phải lớn hơn 0đ')
        .max(119999999, 'Giảm giá phải nhỏ hơn 120.000.000đ'),
      quantity_number: Yup.number()
        .required('Vui lòng số lượng sản phẩm')
        .min(1, 'Vui lòng cài đặt số lượng sản phẩm lớn hơn 0'),
      quantity_per_user_number: Yup.number()
        .required('Vui lòng nhập giới hạn mua')
        .min(1, 'Vui lòng cài đặt giới hạn mua hàng lớn hơn 0')
    }
    productsScheduled?.filter(item => Boolean(item?.scVariant?.id))?.forEach(product => {
      _schema[`campaign-${product?.scVariant?.id}-discount-percent`] = Yup.number()
        .required('Vui lòng nhập phần trăm giảm giá')
        .min(1, 'Giảm giá phải lớn hơn 0%')
        .max(99, 'Giảm giá phải nhỏ hơn 100%')
      _schema[`campaign-${product?.scVariant?.id}-discount-value`] = Yup.number()
        .required('Vui lòng nhập giá trị giảm giá')
        .min(1, 'Giảm giá phải lớn hơn 0đ')
        .max(product?.scVariant.price - 1, 'Giảm giá phải nhỏ hơn giá bán')
      _schema[`campaign-${product?.scVariant?.id}-quantity_per_user_number`] = Yup.number()
        .required('Vui lòng cài đặt số lượng sản phẩm khuyến mại')
        .min(1, 'Vui lòng cài đặt số lượng sản phẩm lớn hơn 0')
        .max(+product?.scVariant?.sellable_stock, 'Vui lòng nhập số lượng sản phẩm nhỏ hơn tồn kho')
      _schema[`campaign-${product?.scVariant?.id}-purchase_limit_number`] = Yup.number()
        .required('Vui lòng cài đặt giới hạn mua')
        .min(1, 'Vui lòng cài đặt số lượng sản phẩm lớn hơn 0')
      _schema[`campaign-${product?.scVariant?.id}-promotion_price`] = Yup.number()
        .required('Vui lòng cài đặt giá sau giảm')
        .min(1, 'Vui lòng cài đặt giá sau giảm sản phẩm lớn hơn 0')
        .max(product?.scVariant.price - 1, 'Vui lòng cài đặt giá sau giảm sản phẩm nhỏ hơn giá bán')
    })
    return _schema
  }, [productsScheduled])
  useMemo(() => {
    setCampaignSchema(schema)
  }, [schema])
  const isSelectedAll = useMemo(() => {
    if (productsScheduled?.filter(product => {
      if (paramsQuery?.type == 2) {
        return !product?.campaignInfo?.sync_error_message && product?.campaignInfo?.sync_status == 2
      } else if (paramsQuery?.type == 3) {
        return product?.campaignInfo?.sync_status == 1
      } else {
        return !!product?.campaignInfo?.sync_error_message
      }
    })?.slice((page - 1) * limit, page * limit)?.length == 0) return false;

    return productsScheduled?.filter(product => {
      if (paramsQuery?.type == 2) {
        return !product?.campaignInfo?.sync_error_message && product?.campaignInfo?.sync_status == 2
      } else if (paramsQuery?.type == 3) {
        return product?.campaignInfo?.sync_status == 1
      } else {
        return !!product?.campaignInfo?.sync_error_message
      }
    })?.slice((page - 1) * limit, page * limit)?.every(variant => productSelect?.some(item => item?.scVariant?.id ? item?.scVariant?.id == variant?.scVariant?.id : item?.campaignInfo?.id == variant?.campaignInfo?.id));
  }, [productSelect, paramsQuery, productsScheduled]);


  const handleSelectAll = useCallback(
    (e) => {
      if (isSelectedAll) {
        setProductSelect(prev => prev.filter(item => !productsScheduled?.filter(product => {
          if (paramsQuery?.type == 2) {
            return !product?.campaignInfo?.sync_error_message && product?.campaignInfo?.sync_status == 2
          } else if (paramsQuery?.type == 3) {
            return product?.campaignInfo?.sync_status == 1
          } else {
            return !!product?.campaignInfo?.sync_error_message
          }
        })?.slice((page - 1) * limit, page * limit).some(variant => variant?.scVariant?.id ? item?.scVariant?.id == variant?.scVariant?.id : item?.campaignInfo?.id == variant?.campaignInfo?.id)))
      } else {
        const data_filtered = productsScheduled?.filter(product => {
          if (paramsQuery?.type == 2) {
            return !product?.campaignInfo?.sync_error_message && product?.campaignInfo?.sync_status == 2
          } else if (paramsQuery?.type == 3) {
            return product?.campaignInfo?.sync_status == 1
          } else {
            return !!product?.campaignInfo?.sync_error_message
          }
        })?.slice((page - 1) * limit, page * limit)?.filter(
          _product => !productSelect?.some(__ => __?.scVariant?.id ? __?.scVariant?.id == _product?.scVariant?.id : __?.campaignInfo?.id == _product?.campaignInfo?.id)
        )
        setProductSelect(prev => [...prev, ...data_filtered]);
      }
    }, [productSelect, productsScheduled, limit, page, paramsQuery, isSelectedAll]
  );
  const validationSchema = useMemo(() => {
    return Yup.object(campaignSchema);
  }, [campaignSchema])
  const storeOptions = useMemo(() => {
    const channels = dataStore?.op_connector_channels
    const stores = dataStore?.sc_stores
    const channelsActive = channels?.filter(store => ({ channelsActive: stores?.some(sa => sa?.connector_channel_code === store?.code) }));
    let _optionsChannel = channelsActive?.map(_channel => ({
      label: _channel?.name,
      logo: _channel?.logo_asset_url,
      value: _channel?.code
    })) || [];

    let __optionsStores = stores?.flatMap(_store => {
      const channelParams = saleDetail?.mktFindCampaign?.connector_channel_code ? saleDetail?.mktFindCampaign?.connector_channel_code : null
      const channel = _optionsChannel?.find(cn => cn?.value == _store?.connector_channel_code)
      if (!channelParams) {
        return {
          label: _store.name,
          logo: channel?.logo,
          value: _store?.id,
          channel: channel?.value
        }
      }
      if (channelParams?.includes(_store?.connector_channel_code)) {
        return {
          label: _store.name,
          logo: channel?.logo,
          value: _store?.id,
          channel: channel?.value
        }
      }
      return []
    })
    return __optionsStores;
  }, [saleDetail, dataStore]);

  const [scRemoveProductFrameImg, { loading: loadingRemoveFrameImage }] = useMutation(mutate_scRemoveProductFrameImages, {
    awaitRefetchQueries: true,
    onCompleted: (data) => {
      setProductSelect([])
    }
  });
  console.log('productSelect', productSelect)
  const removeFrameImgBatch = async () => {
    let res = await scRemoveProductFrameImg({ variables: { products: productSelect?.map(item => item?.scVariant?.sc_product_id) } });

    if (!!res?.data?.scRemoveProductFrameImages?.success) {
      addToast(res?.data?.scRemoveProductFrameImages?.message || formatMessage({ defaultMessage: 'Xoá khung ảnh hàng loạt thành công' }), { appearance: 'success' });
    } else {
      addToast(res?.data?.scRemoveProductFrameImages?.message || formatMessage({ defaultMessage: 'Xoá khung ảnh hàng loạt thất bại' }), { appearance: 'error' });
    }
  }
  console.log('productSelect', productSelect)
  const createFrameImgBatch = () => {
    let productNotImgOrigin = productSelect.filter(item => !item?.scVariant?.product.productAssets.some(_asset => _asset.type === 4));

    setIdsFrameImg(productSelect?.map(item => item?.scVariant?.sc_product_id));
    if (productNotImgOrigin?.length > 0) {
      setProductNotImgOrigin(productNotImgOrigin?.map(item => item?.scVariant?.product?.name));
      return;
    }

    setIsShowCreateFrameImg(true);
  }


  return (
    <Fragment>
      <ModalProductCreateFrameImg
        setProductSelect={setProductSelect}
        show={isShowCreateFrameImg}
        ids={idsFrameImg}
        onHide={() => setIsShowCreateFrameImg(false)}
        setSyncImg={setSyncImg}
      />
      {!!syncImg && <ModalLoadFrameImage
        syncImg={syncImg}
        onHide={() => setSyncImg(null)}
      />}
      <LoadingDialog show={loadingRemoveFrameImage || loadingApprovedCampaign} />
      <ModalConfirmAddFrame setIsShowCreateFrameImg={setIsShowCreateFrameImg} productNotImgOrigin={productNotImgOrigin} setProductNotImgOrigin={setProductNotImgOrigin} />
      <Helmet
        titleTemplate={
          'UB - ' + `${saleDetail?.mktFindCampaign?.type == 1
            ? 'Chiết khấu sản phẩm'
            : (saleDetail?.mktFindCampaign?.type == 2
              ? 'FlashSale'
              : 'Chương trình khác')}`
        }
        defaultTitle={
          'UB - ' + `${saleDetail?.mktFindCampaign?.type == 1
            ? 'Chiết khấu sản phẩm'
            : (saleDetail?.mktFindCampaign?.type == 2
              ? 'FlashSale'
              : 'Chương trình khác')}`
        }
      >
        <meta
          name="description"
          content={
            'UB - ' + `${saleDetail?.mktFindCampaign?.type == 1
              ? 'Chiết khấu sản phẩm'
              : (saleDetail?.mktFindCampaign?.type == 2
                ? 'FlashSale'
                : 'Chương trình khác')}`
          }
        />
      </Helmet>
      <div>
        <Formik
          initialValues={initialValues}
          enableReinitialize
          validationSchema={validationSchema}
        >
          {({ values, touched, errors, setFieldValue, handleSubmit, validateForm, setValues }) => {
            console.log('values', values)
            const changed = values['__changed__'];
            return (

              <Form>
                <RouterPrompt
                  when={changed}
                  title={formatMessage({ defaultMessage: 'Bạn đang sửa chi tiết CTKM. Mọi thông tin bạn tạo trước đó sẽ bị xoá nếu bạn thoát màn hình này. Bạn có chắc chắn muốn thoát?' })}
                  cancelText={formatMessage({ defaultMessage: 'Không' })}
                  okText={formatMessage({ defaultMessage: 'Có, Thoát' })}
                  onOK={() => true}
                  onCancel={() => false}
                />
                <Modal
                  show={showWarningPrompt}
                  aria-labelledby="example-modal-sizes-title-lg"
                  centered
                  backdrop={'static'}
                >
                  <Modal.Body className="overlay overlay-block cursor-default text-center">
                    <div className="mb-4" >Việc thay đổi loại giảm giá sẽ làm xoá thông tin về giá của các hàng hoá đã chọn bên dưới. Bạn vẫn muốn tiếp tục?</div>

                    <div className="form-group mb-0">
                      <button
                        type="button"
                        className="btn btn-light btn-elevate mr-3"
                        style={{ minWidth: 100 }}
                        onClick={() => {
                          setShowWarningPrompt(false)
                        }}
                      >
                        <span className="font-weight-boldest">Đóng</span>
                      </button>
                      <button
                        type="button"
                        className={`btn btn-primary font-weight-bold`}
                        style={{ minWidth: 100 }}
                        onClick={() => {
                          console.log(productsScheduled)
                          productsScheduled?.forEach(product => {
                            setFieldValue(`campaign-${product?.scVariant?.id}-quantity_per_user_number`, 1)
                            setFieldValue(`campaign-${product?.scVariant?.id}-quantity_per_user`, { value: 1, label: 'Không giới hạn' })
                            setFieldValue(`campaign-${product?.scVariant?.id}-purchase_limit_number`, 1)
                            setFieldValue(`campaign-${product?.scVariant?.id}-purchase_limit`, { value: 1, label: "Không giới hạn" })
                            setFieldValue(`campaign-${product?.scVariant?.id}-discount-percent`, '')
                            setFieldValue(`campaign-${product?.scVariant?.id}-promotion_price`, '')
                            setFieldValue(`campaign-${product?.scVariant?.id}-discount-value`, '')
                          })
                          if (values[`typeDiscount`] == 1) {
                            setFieldValue('typeDiscount', 2)
                          } else {
                            setFieldValue('typeDiscount', 1)
                          }
                          setShowWarningPrompt(false)
                        }}
                      >
                        <span className="font-weight-boldest">Xác nhận</span>
                      </button>
                    </div>
                  </Modal.Body>
                </Modal >
                <Card>
                  <div className="d-flex flex-column pb-4 mt-4">
                    <strong
                      style={{ fontSize: 14, color: '#000', marginLeft: '12.5px' }}
                    >
                      {formatMessage({ defaultMessage: 'THÔNG TIN CƠ BẢN' })}
                    </strong>
                  </div>
                  {!saleDetail ? (
                    <div className="row pb-4">
                      <div className="col-5">
                        <Skeleton
                          style={{ width: 170, height: 30, borderRadius: 8 }}
                          count={1}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="row pb-4">
                      <div className="col-3">
                        <div className="d-flex">
                          <span className="ml-4">
                            {formatMessage({ defaultMessage: 'Sàn' })}
                          </span>
                          <span style={{ color: 'red' }}>*</span>
                        </div>
                      </div>
                      <div className='col-2'>
                        {!!_channel?.logo_asset_url && (
                          <img
                            src={_channel?.logo_asset_url}
                            className="mr-1  ml-4"
                            style={{ width: 15, height: 15, objectFit: 'contain' }}
                            alt=""
                          />
                        )}
                        <span>{_channel?.name}</span>
                      </div>
                    </div>
                  )}
                  {!saleDetail ? (
                    <div className="row pb-4">
                      <div className="col-4">
                        <Skeleton
                          style={{ width: 170, height: 30, borderRadius: 8 }}
                          count={1}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="row pb-4 align-items-center">

                      <div className="col-3">
                        <span className="ml-4">
                          {formatMessage({ defaultMessage: 'Gian hàng' })}
                        </span>
                        <span style={{ color: 'red' }}>*</span>
                      </div>
                      <div className='col-2'>
                        <Select
                          id="store"
                          options={storeOptions}
                          value={storeOptions?.find(option => option.value === values.store)}
                          onChange={option => setFieldValue('store', option.value)}
                          isDisabled={true}
                          formatOptionLabel={(option, labelMeta) => {
                            return (
                              <div>
                                {!!option.logo && (
                                  <img
                                    src={option.logo}
                                    style={{
                                      width: 15,
                                      height: 15,
                                      marginRight: 4,
                                    }}
                                  />
                                )}
                                {option.label}
                              </div>
                            );
                          }}
                        />
                        {errors.store && touched.store ? (
                          <div className="text-danger">{errors.store}</div>
                        ) : null}
                      </div>
                    </div>
                  )}
                  <div className="row  pb-4 align-items-center">
                    <div className="col-3">
                      <span className="ml-4">Tên chương trình khuyến mại</span>
                      <span style={{ color: 'red' }}>*</span>
                    </div>
                    <div className='col-5'>
                      <Field
                        name={`name`}
                        component={InputVertical}
                        placeholder="Nhập tên chương trình khuyến mại"
                        onChange={() => {
                        }}
                        required
                        countChar
                        maxChar={150}
                        value={values.name}
                        disabled={action != 'edit'}
                      />
                    </div>
                  </div>
                  <div className="row  pb-4 align-items-center">
                    <div className="col-3 ">
                      <span className="ml-4">Thời gian khuyến mại</span>
                      <span style={{ color: 'red' }}>*</span>
                    </div>
                    <div className='col-4' style={{ pointerEvents: `${action != 'edit' ? 'none' : ''}` }}>
                      <DateRangePicker
                        name="timeValue"
                        className="custome__style__input__date"
                        value={values.timeValue}
                        character={' - '}
                        format={'dd/MM/yyyy HH:mm'}
                        onChange={(value) => {
                          setFieldValue('timeValue', value)
                        }}
                        displayFormat="YYYY-MM-DD"
                        disabled={action != 'edit'}
                        onClean={() => {
                          if (action != 'edit') {
                            return
                          }
                        }}
                        locale={{
                          sunday: "CN",
                          monday: "T2",
                          tuesday: "T3",
                          wednesday: "T4",
                          thursday: "T5",
                          friday: "T6",
                          saturday: "T7",
                          ok: formatMessage({ defaultMessage: "Đồng ý" }),
                          today: formatMessage({ defaultMessage: "Hôm nay" }),
                          yesterday: formatMessage({ defaultMessage: "Hôm qua" }),
                          hours: formatMessage({ defaultMessage: "Giờ" }),
                          minutes: formatMessage({ defaultMessage: "Phút" }),
                          seconds: formatMessage({ defaultMessage: "Giây" }),
                          formattedMonthPattern: "MM/yyyy",
                          formattedDayPattern: "dd/MM/yyyy",
                          last7Days: formatMessage({ defaultMessage: "7 ngày qua" }),
                        }}
                      />
                      {errors.timeValue ? (
                        <div className="text-danger">{errors.timeValue}</div>
                      ) : null}
                    </div>
                  </div>
                  {!!(typeCampaign == 'other') && <div className="row  pb-4 align-items-center">
                    <div className="col-3 ">
                      <span className="ml-4">Loại chương trình</span>
                    </div>
                    <div className='col-4'>
                      <Field
                        name={'other_type'}
                        component={InputVertical}
                        disabled
                      />
                    </div>
                  </div>}
                  {typeCampaign != 'other' && <div className="row  pb-4">
                    <div className="col-3 ">
                      <span className="ml-4">Loại giảm giá</span>
                      <span style={{ color: 'red' }}>*</span>
                    </div>
                    <div className='col-4 '>
                      <Field
                        name="typeDiscount"
                        component={RadioGroup}
                        curr
                        customFeedbackLabel={' '}
                        options={typeDiscount}
                        onChangeOption={() => {
                          if (productsScheduled.length > 0) {
                            setShowWarningPrompt(true)
                          } else {
                            if (values[`typeDiscount`] == 1) {
                              setFieldValue('typeDiscount', 2)
                            } else {
                              setFieldValue('typeDiscount', 1)
                            }
                          }
                        }}
                        // disabled={paramsQuery?.channel == 'shopee'}
                        disabled={action != 'edit' || saleDetail?.mktFindCampaign?.connector_channel_code == 'shopee'}
                      />
                    </div>
                  </div>}

                  {saleDetail?.mktFindCampaign?.type == 2 && <div className="row  pb-4">
                    <div className="col-3 ">
                      <span className="ml-4">Tiêu chí sản phẩm</span>
                    </div>
                    <div className='col-6'>
                      <table class="w-100" style={{ border: '1px solid #ccc', borderRadius: '4px', padding: '10px' }}>
                        <tr>
                          <td style={{ border: 'none', padding: '10px' }}>
                            {criteria[_channel?.code]?.firstCriteria.map(criteria => {
                              return <p>{criteria}</p>
                            })}
                          </td>
                          <td style={{ border: 'none', padding: '10px' }}>
                            {criteria[_channel?.code]?.secondCriteria.map(criteria => {
                              return <p>{criteria}</p>
                            })}
                          </td>
                        </tr>
                      </table>
                    </div>
                  </div>}
                  {<div className="row  pb-4">
                    <div className="col-3">
                      <span className="ml-4">Trạng thái</span>
                    </div>
                    <div className='col-2'>
                      <span style={{ color: STATUS_SALE[saleStatus]?.color }}>
                        {STATUS_SALE[saleStatus]?.label}
                      </span>
                    </div>
                  </div>}
                </Card>
                <Card>
                  <div className="d-flex flex-column pb-4 mt-4">
                    <strong
                      style={{ fontSize: 14, color: '#000', marginLeft: '12.5px' }}
                    >
                      {formatMessage({ defaultMessage: 'CHI TIẾT' })}
                    </strong>
                  </div>
                  <div className="col-12 d-flex w-100 mb-4 mt-4" style={{ zIndex: 1 }}>
                    <div style={{ flex: 1 }}>
                      <ul className="nav nav-tabs">
                        {(saleDetail?.mktFindCampaign?.type == 10 ? TABS_DETAILS.slice(0, -1) : TABS_DETAILS).map((tab, index) => {
                          const isTabActive = (paramsQuery?.tab || 1) == tab?.status
                          return (
                            <li key={index} onClick={() => history.push(`${location.pathname}?${queryString.stringify({ ...paramsQuery, page: 1, tab: tab?.status })}`)}>
                              <a style={{ fontSize: "16px" }} className={`nav-link ${isTabActive ? "active" : ""}`}>{tab?.title}</a>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                  {paramsQuery?.tab != 2 ? (
                    <>
                      <div className="d-flex justify-content-between pb-4 mt-4 mb-8">
                        <div>
                          <strong
                            style={{ fontSize: 14, color: '#000', marginLeft: '12.5px' }}
                          >
                            {formatMessage({ defaultMessage: 'SẢN PHẨM KHUYẾN MẠI' })}
                          </strong>
                          {typeCampaign != 'other' && <p className='ml-4 mt-4'>Thêm sản phẩm vào chương trình khuyến mãi và thiết lập giá khuyến mãi</p>}
                        </div>
                        {typeCampaign != 'other' && <button
                          type="button"
                          disabled={action != 'edit'}
                          onClick={() => { setShowAddProduct(true) }}
                          className="btn btn mr-3"
                          style={{ border: "1px solid #ff5629", color: "#ff5629", height: '100%' }}
                        >
                          {formatMessage({ defaultMessage: '+ Thêm hàng hóa' })}
                        </button>}
                      </div>
                      {typeCampaign != 'other' && (<><div className='row align-items-end mb-8'>
                        <div className='col-2 d-dlex flex-row ml-4'>
                          <p className="text-muted ">Giảm giá</p>
                          {values?.typeDiscount == 2 && <Field
                            name={`discount_percent`}
                            type="number"
                            value={values.discount_percent}
                            component={InputVertical}
                            placeholder=""
                            addOnRight={'%'}
                            disabled={action != 'edit'}
                          />}
                          {values?.typeDiscount == 1 && <Field
                            value={values.discount_value}
                            name={`discount_value`}
                            type="number"
                            component={InputVertical}
                            placeholder=""
                            addOnRight={'đ'}
                            disabled={action != 'edit'}
                          />}
                        </div>
                        <div className='col-3 d-dlex flex-row'>
                          <p className="text-muted ml-4">Số lượng sản phẩm khuyến mại</p>
                          <div className='d-flex'>
                            <div style={{ width: '70%' }}>
                              <Select
                                id="quantity"
                                options={[{ value: 1, label: "Không giới hạn" }, { value: 2, label: 'Giới hạn' }]}
                                value={values?.quantity}
                                onChange={(value) => {
                                  setFieldValue('quantity', value)
                                }}
                                isDisabled={action != 'edit'}
                              />
                            </div>
                            {values.quantity.value == 2 &&
                              <div style={{ width: '30%' }}>
                                <Field
                                  type='number'
                                  name={'quantity_number'}
                                  component={InputVertical}
                                  placeholder=""
                                  value={values.quantity_number}
                                  disabled={action != 'edit'}
                                />
                              </div>
                            }
                          </div>
                        </div>
                        <div className='col-3 d-dlex flex-row'>
                          <p className="text-muted ml-4">Giới hạn mua</p>
                          <div className='d-flex'>
                            <div style={{ width: '70%' }}>
                              <Select
                                isDisabled={action != 'edit'}
                                id="quantity_per_user"
                                value={values?.quantity_per_user}
                                options={[{ value: 1, label: "Không giới hạn" }, { value: 2, label: 'Giới hạn' }]}
                                onChange={(value) => {
                                  setFieldValue('quantity_per_user', value)
                                }}
                              />
                            </div>
                            {values?.quantity_per_user?.value == 2 &&
                              <div style={{ width: '30%' }}>
                                <Field
                                  type='number'
                                  name={'quantity_per_user_number'}
                                  component={InputVertical}
                                  placeholder=""
                                  value={values?.quantity_per_user_number}
                                  disabled={action != 'edit'}
                                />
                              </div>}
                          </div>
                        </div>
                        <div className='col-3 d-dlex flex-row'>
                          <button
                            className="btn btn-primary btn-elevate"
                            style={{ padding: '10px 20px' }}
                            onClick={async (e) => {
                              e.preventDefault();
                              const totalError = await validateForm()
                              if (Object.keys(totalError)?.filter((item) => {
                                return ['quantity_per_user_number', 'quantity_number', 'discount_percent', 'discount_value'].includes(item)
                              })?.length > 0) {
                                handleSubmit();
                                return;
                              } else {
                                let formUpdate = { ...values };
                                (saleDetail?.mktFindCampaign?.status != 1 ? productsScheduled?.filter(product => {
                                  if (paramsQuery?.type == 2) {
                                    return !product?.campaignInfo?.sync_error_message && product?.campaignInfo?.sync_status == 2
                                  } else if (paramsQuery?.type == 3) {
                                    return product?.campaignInfo?.sync_status == 1
                                  } else {
                                    return !!product?.campaignInfo?.sync_error_message
                                  }
                                }) : productsScheduled)?.filter(item => item?.scVariant?.id)?.forEach(product => {
                                  if (values[`quantity_per_user`].value == 2) {
                                    formUpdate[`campaign-${product?.scVariant?.id}-quantity_per_user_number`] = +values[`quantity_per_user_number`]
                                    formUpdate[`campaign-${product?.scVariant?.id}-quantity_per_user`] = { value: 2, label: 'Giới hạn' }
                                  } else {
                                    formUpdate[`campaign-${product?.scVariant?.id}-quantity_per_user`] = { value: 1, label: "Không giới hạn" }
                                  }
                                  if (values[`quantity`].value == 2) {
                                    formUpdate[`campaign-${product?.scVariant?.id}-purchase_limit`] = { value: 2, label: 'Giới hạn' }
                                    formUpdate[`campaign-${product?.scVariant?.id}-purchase_limit_number`] = +values[`quantity_number`]
                                  } else {
                                    formUpdate[`campaign-${product?.scVariant?.id}-purchase_limit`] = { value: 1, label: "Không giới hạn" }
                                  }

                                  if (values[`discount_percent`] != null) {
                                    formUpdate[`campaign-${product?.scVariant?.id}-discount-percent`] = +values[`discount_percent`]

                                    formUpdate[`campaign-${product?.scVariant.id}-promotion_price`] = Math.ceil(product?.scVariant.price - values[`discount_percent`] / 100 * product?.scVariant.price)

                                    formUpdate[`campaign-${product?.scVariant?.id}-discount-value`] = +values[`discount_percent`] / 100 * product?.scVariant.price
                                  }
                                  if (values[`discount_value`] != null) {
                                    formUpdate[`campaign-${product?.scVariant?.id}-discount-value`] = +values[`discount_value`]
                                    formUpdate[`campaign-${product?.scVariant?.id}-discount-percent`] = Math.ceil((values[`discount_value`]) / product?.scVariant.price * 100)
                                    formUpdate[`campaign-${product?.scVariant.id}-promotion_price`] = product?.scVariant.price - values[`discount_value`]
                                  }
                                })
                                setValues(formUpdate)
                              }
                            }}
                            disabled={action != 'edit'}
                          >
                            {formatMessage({ defaultMessage: 'ÁP DỤNG CHO TẤT CẢ' })}
                          </button>
                        </div>
                      </div>
                        <div className='row mb-8 ml-4 d-dlex align-items-center'>
                          <span style={{ color: '#ff5629' }} className='mr-4'>Đã chọn {productSelect?.length}</span>
                          <Dropdown drop='down'>
                            <Dropdown.Toggle disabled={!productSelect.length} className={`${productSelect?.length ? 'btn-primary' : 'btn-darkk'} btn`} >
                              {formatMessage({ defaultMessage: "Thao tác" })}
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                              <>
                                <Dropdown.Item className="mb-1 d-flex"
                                  onClick={(e) => {
                                    let productSelectIds = productSelect?.map(item => item?.scVariant?.id || item?.campaignInfo?.id)
                                    let newProduct = productsScheduled?.filter(item => {
                                      return !productSelectIds.includes(item?.scVariant?.id || item?.campaignInfo?.id)
                                    })
                                    setProductsScheduled(newProduct)
                                    setProductSelect([])
                                  }}>
                                  {formatMessage({ defaultMessage: "Xóa hàng loạt" })}
                                </Dropdown.Item>
                                {saleStatus !== 'finished' && (
                                  <Dropdown.Item onClick={createFrameImgBatch} className="mb-1 d-flex">
                                    {formatMessage({ defaultMessage: "Thêm khung ảnh hàng loạt" })}
                                  </Dropdown.Item>
                                )}
                                <Dropdown.Item onClick={async () => await removeFrameImgBatch()} className="mb-1 d-flex">
                                  {formatMessage({ defaultMessage: "Xóa khung ảnh hàng loạt" })}
                                </Dropdown.Item>
                              </>
                            </Dropdown.Menu>
                          </Dropdown>

                        </div></>)}
                      {saleDetail?.mktFindCampaign?.status != 1 && <ul className="nav nav-tabs" id="myTab" role="tablist" style={{ borderBottom: 'none' }} >
                        <li className={`product-status-nav nav-item ${paramsQuery.type == 2 ? 'active' : ''}`}>
                          <a className={`nav-link font-weight-normal ${paramsQuery.type == 2 ? 'active' : ''}`}
                            style={{ fontSize: '13px', minWidth: 100, }}
                            onClick={e => {
                              history.push(`/marketing/sale/${saleDetail?.mktFindCampaign?.id}?${queryString.stringify({
                                type: 2,
                              })}&${queryString.stringify({
                                action: action
                              })}`, { action: action || '', id: location?.state?.id || params?.id })
                            }}
                          >{formatMessage({ defaultMessage: 'Đồng bộ thành công' })}
                            {` (${productsScheduled?.filter(item => !item.campaignInfo.sync_error_message && item.campaignInfo.sync_status == 2).length})`}</a>
                        </li>
                        <li className={`product-status-nav nav-item ${paramsQuery.type == 1 ? 'active' : ''}`}>
                          <a className={`nav-link font-weight-normal ${paramsQuery.type == 1 ? 'active' : ''}`}
                            style={{ fontSize: '13px', minWidth: 100, alignItems: 'center', justifyContent: 'center' }}
                            onClick={e => {
                              history.push(`/marketing/sale/${saleDetail?.mktFindCampaign?.id}?${queryString.stringify({
                                type: 1,
                              })}&${queryString.stringify({
                                action: action
                              })}`, { action: action || '', id: location?.state?.id || params.id })
                            }}
                          >
                            {formatMessage({ defaultMessage: 'Đồng bộ lỗi' })}
                            {` (${productsScheduled?.filter(item => item.campaignInfo.sync_error_message).length})`}
                          </a>
                        </li>
                        <li className={`product-status-nav nav-item ${paramsQuery.type == 3 ? 'active' : ''}`}>
                          <a className={`nav-link font-weight-normal ${paramsQuery.type == 3 ? 'active' : ''}`}
                            style={{ fontSize: '13px', minWidth: 100, alignItems: 'center', justifyContent: 'center' }}
                            onClick={e => {
                              history.push(`/marketing/sale/${saleDetail?.mktFindCampaign?.id}?${queryString.stringify({
                                type: 3,
                              })}&${queryString.stringify({
                                action: action
                              })}`, { action: action || '', id: location?.state?.id || params.id })
                            }}
                          >
                            {formatMessage({ defaultMessage: 'Chưa đồng bộ' })}
                            {` (${productsScheduled?.filter(item => item.campaignInfo.sync_status == 1).length})`}
                          </a>
                        </li>
                      </ul>}
                      <table className="table table-borderless product-list table-vertical-center fixed">
                        <thead
                          style={{
                            position: 'sticky',
                            top: `${44}px`,
                            zIndex: 1,
                            background: '#F3F6F9',
                            fontWeight: 'bold',
                            fontSize: '14px',
                            borderBottom: '1px solid gray',
                            borderLeft: '1px solid #d9d9d9',
                          }}
                        >
                          <tr className="font-size-lg">
                            <th style={{ fontSize: '14px' }}>
                              <Checkbox
                                inputProps={{
                                  'aria-label': 'checkbox',
                                }}
                                isSelected={isSelectedAll}
                                onChange={handleSelectAll}
                              />
                            </th>
                            <th
                              style={{ fontSize: '14px', textAlign: `${typeCampaign != 'other' ? 'center' : 'left'}` }}
                              width={`${typeCampaign != 'other' ? '16%' : '40%'}`}
                            >
                              <span className="mx-4">
                                {typeCampaign != 'other' ? formatMessage({ defaultMessage: 'Hàng hóa' }) : formatMessage({ defaultMessage: 'Tên sản phẩm' })}
                              </span>
                            </th>
                            <th
                              style={{ fontSize: '14px', textAlign: 'center' }}
                              width={`${typeCampaign != 'other' ? '10%' : '25%'}`}
                            >
                              {formatMessage({ defaultMessage: 'Giá bán' })}
                            </th>
                            {typeCampaign != 'other' && <th
                              style={{ fontSize: '14px', textAlign: 'center' }}
                              width="11%"
                            >
                              {formatMessage({ defaultMessage: 'Giảm giá' })}
                            </th>}
                            {typeCampaign != 'other' && <th
                              style={{ fontSize: '14px', textAlign: 'center' }}
                              width="12%"
                            >
                              {formatMessage({ defaultMessage: 'Giá sau giảm' })}
                            </th>}
                            <th
                              style={{ fontSize: '14px', textAlign: 'center' }}
                              width={`${typeCampaign != 'other' ? '12%' : '25%'}`}
                            >
                              {formatMessage({ defaultMessage: 'Có sẵn' })}
                            </th>
                            {typeCampaign != 'other' && <th
                              style={{ fontSize: '14px', textAlign: 'center' }}
                              width="17%"
                            >
                              {formatMessage({
                                defaultMessage: 'Số lượng sản phẩm khuyến mại',
                              })}
                              <OverlayTrigger
                                placement="left"
                                overlay={
                                  <Tooltip id="layout-tooltip">
                                    Tổng lượng hàng mà bạn sẽ bán với giá khuyến mãi. Nếu số
                                    lượng đã bán vượt con số này, giá của sản phẩm/SKU sẽ
                                    quay lại giá ban đầu.
                                  </Tooltip>
                                }
                              >
                                <i className="fs-14 mx-1 fas fa-info-circle"></i>
                              </OverlayTrigger>
                            </th>}
                            {typeCampaign != 'other' && <th
                              style={{ fontSize: '14px', textAlign: 'center' }}
                              width="16%"
                            >
                              {formatMessage({ defaultMessage: 'Giới hạn mua' })}
                              <OverlayTrigger
                                placement="left"
                                overlay={
                                  <Tooltip id="layout-tooltip">
                                    Giới hạn mua mỗi khách là số lượng hàng tối đa cho mỗi
                                    sản phẩm/SKU mà mỗi khách có thể mua với giá khuyến mãi.
                                  </Tooltip>
                                }
                              >
                                <i className="fs-14 mx-1 fas fa-info-circle"></i>
                              </OverlayTrigger>
                            </th>}
                            {typeCampaign != 'other' && <th
                              style={{ fontSize: '14px', textAlign: 'center' }}
                              width="10%"
                            >Thao tác</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {loadingDetail ||
                            (loadingScVariant && (
                              <div
                                className="text-center w-100 mt-4"
                                style={{ position: 'absolute' }}
                              >
                                <span className="ml-3 spinner spinner-primary"></span>
                              </div>
                            ))}
                          {!!error && !loadingDetail && !loadingScVariant && (
                            <div
                              className="w-100 text-center mt-8"
                              style={{ position: 'absolute' }}
                            >
                              <div className="d-flex flex-column justify-content-center align-items-center">
                                <i
                                  className="far fa-times-circle text-danger"
                                  style={{ fontSize: 48, marginBottom: 8 }}
                                ></i>
                                <p className="mb-6">
                                  {formatMessage({
                                    defaultMessage:
                                      'Xảy ra lỗi trong quá trình tải dữ liệu',
                                  })}
                                </p>
                                <button
                                  className="btn btn-primary btn-elevate"
                                  style={{ width: 100 }}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    refetch();
                                  }}
                                >
                                  {formatMessage({ defaultMessage: 'Tải lại' })}
                                </button>
                              </div>
                            </div>
                          )}
                          {!error &&
                            !loadingDetail &&
                            !loadingScVariant &&
                            (saleDetail?.mktFindCampaign?.status != 1 ? productsScheduled?.filter(product => {
                              if (paramsQuery?.type == 2) {
                                return !product?.campaignInfo?.sync_error_message && product?.campaignInfo?.sync_status == 2
                              } else if (paramsQuery?.type == 3) {
                                return product?.campaignInfo?.sync_status == 1
                              } else {
                                return !!product?.campaignInfo?.sync_error_message
                              }
                            }) : productsScheduled)?.slice((page - 1) * limit, page * limit)?.map(
                              (product, index) => {
                                const isSelected = productSelect?.map(_product => _product?.scVariant?.id || _product?.campaignInfo?.id).includes(product?.scVariant?.id || product?.campaignInfo?.id)
                                return (
                                  <>
                                    <tr style={{ position: 'relative' }}>
                                      <td>
                                        <Checkbox
                                          isSelected={isSelected}
                                          inputProps={{
                                            'aria-label': 'checkbox',
                                          }}
                                          onChange={(e) => {
                                            if (e.target.checked) {
                                              setProductSelect(prevState => ([...prevState, product]))
                                            } else {
                                              setProductSelect(prevState => prevState.filter(_state => _state?.scVariant?.id !== product?.scVariant?.id || _state?.campaignInfo?.id !== product?.campaignInfo?.id))
                                            }
                                          }}
                                          disabled={action != 'edit'}

                                        />
                                      </td>
                                      <td style={{ fontSize: '14px', textAlign: 'left' }}>
                                        {product?.scVariant?.id ? <div style={{ verticalAlign: 'top', display: 'flex', flexDirection: 'row' }}>

                                          <div style={{
                                            backgroundColor: '#F7F7FA',
                                            width: 68, height: 68,
                                            borderRadius: 8,
                                            overflow: 'hidden',
                                            minWidth: 68
                                          }} className='mr-6' >
                                            {
                                              !!product
                                                ?.scVariant?.product?.productAssets
                                                ?.length && <HoverImage placement="right" defaultSize={{ width: 68, height: 68 }} size={{ width: 320, height: 320 }} url={product
                                                  ?.scVariant?.product?.productAssets[0]
                                                  ?.origin_image_url} />
                                            }
                                          </div>
                                          <div className='w-100'>
                                            <InfoProduct
                                              name={product?.scVariant?.product?.name}
                                              short={true}
                                              sku={product?.scVariant.sku}
                                              url={`/product-stores/edit/${product?.scVariant.product.id}`}
                                            />
                                            <span className='font-weight-normal text-secondary-custom' >{product?.scVariant?.name?.replaceAll(' + ', ' - ')}</span>
                                          </div>
                                        </div> : <div>{formatMessage({ defaultMessage: 'Hàng hóa không tồn tại' })}</div>}
                                      </td>
                                      <td style={{ fontSize: '14px', textAlign: 'center' }}>
                                        {formatNumberToCurrency(product?.scVariant?.price) || ''}
                                        <span>đ</span>
                                      </td>
                                      {typeCampaign != 'other' && <td style={{ fontSize: '14px', textAlign: 'center' }}>
                                        {values?.typeDiscount == 1 && (product?.scVariant?.id ? <Field
                                          style={{ fontSize: '14px', textAlign: 'center' }}
                                          name={`campaign-${product?.scVariant?.id}-discount-value`}
                                          type='number'
                                          component={InputVertical}
                                          onFocusChangeValue={(value) => {
                                            setFieldValue(`campaign-${product?.scVariant?.id}-promotion_price`, product?.scVariant?.price - value)
                                            setFieldValue(`campaign-${product?.scVariant?.id}-discount-percent`, Math.ceil(value / product?.scVariant?.price * 100))
                                            if (value == '' || value < 1 || value >= product?.scVariant?.price) {
                                              setFieldValue(`campaign-${product?.scVariant?.id}-promotion_price`, '')
                                              setFieldValue(`campaign-${product?.scVariant?.id}-discoun-percent`, '')
                                            }
                                          }}
                                          placeholder=""
                                          required
                                          addOnRight={'đ'}
                                          disabled={action != 'edit'}
                                        /> : <Field
                                          name={`campaign-${product?.campaignInfo?.id}-discount-value`}
                                          style={{ fontSize: '14px', textAlign: 'center' }}
                                          component={InputVertical}
                                          placeholder=""
                                          value={''}
                                          addOnRight={'đ'}
                                          disabled={true}
                                        />)}
                                        {values?.typeDiscount == 2 && (product?.scVariant?.id ? <Field
                                          style={{ fontSize: '14px', textAlign: 'center' }}
                                          name={`campaign-${product?.scVariant?.id}-discount-percent`}
                                          type="number"
                                          onFocusChangeValue={(value) => {
                                            setFieldValue(`campaign-${product?.scVariant?.id}-promotion_price`, Math.ceil(product?.scVariant.price * (1 - +value / 100)))
                                            setFieldValue(`campaign-${product?.scVariant?.id}-discount-value`, product?.scVariant.price * value / 100)
                                            if (value == '' || value < 1 || value > 99) {
                                              setFieldValue(`campaign-${product?.scVariant?.id}-promotion_price`, '')
                                              setFieldValue(`campaign-${product?.scVariant?.id}-discount-value`, '')
                                            }
                                          }}
                                          component={InputVertical}
                                          placeholder=""
                                          required
                                          addOnRight={'%'}
                                          disabled={action != 'edit'}
                                        /> : <Field
                                          name={`campaign-${product?.campaignInfo?.id}-discount-percent`}
                                          style={{ fontSize: '14px', textAlign: 'center' }}
                                          component={InputVertical}
                                          placeholder=""
                                          value={1}
                                          addOnRight={'%'}
                                          disabled={true}
                                        />)}
                                        {(values[`campaign-${product?.scVariant?.id}-discount-percent`] > 20 && values[`campaign-${product?.scVariant?.id}-discount-percent`] <= 50) && <p style={{ color: '#9EA02D' }}>Mức khuyến mãi đang lớn hơn 20% so với giá bán</p>}
                                        {(values[`campaign-${product?.scVariant?.id}-discount-percent`] > 50 && values[`campaign-${product?.scVariant?.id}-discount-percent`] <= 80) && <p style={{ color: '#FE5629' }}>Mức khuyến mãi đang lớn hơn 50% so với giá bán</p>}
                                        {(values[`campaign-${product?.scVariant?.id}-discount-percent`] > 80 && values[`campaign-${product?.scVariant?.id}-discount-percent`] < 100) && <p style={{ color: '#F12020' }}>Mức khuyến mãi đang lớn hơn 80% so với giá bán</p>}
                                      </td>}
                                      {typeCampaign != 'other' && <td style={{ fontSize: '14px', textAlign: 'center' }}>
                                        {product?.scVariant?.id ? <Field
                                          style={{ fontSize: '14px', textAlign: 'center' }}
                                          name={`campaign-${product?.scVariant?.id}-promotion_price`}
                                          type='number'
                                          onFocusChangeValue={(value) => {
                                            setFieldValue(`campaign-${product?.scVariant.id}-discount-percent`, Math.ceil((product?.scVariant.price - value) / product?.scVariant.price * 100))
                                            setFieldValue(`campaign-${product?.scVariant?.id}-discount-value`, product?.scVariant.price - value)
                                            if (value == '' || value < 1 || value >= product?.scVariant.price) {
                                              setFieldValue(`campaign-${product?.scVariant.id}-discount-percent`, '')
                                              setFieldValue(`campaign-${product?.scVariant?.id}-discount-value`, '')
                                            }
                                          }}
                                          component={InputVertical}
                                          placeholder=""
                                          required
                                          addOnRight={'đ'}
                                          disabled={action != 'edit'}
                                        /> : <Field
                                          name={`campaign-${product?.campaignInfo?.id}-promotion_price`}
                                          style={{ fontSize: '14px', textAlign: 'center' }}
                                          component={InputVertical}
                                          placeholder=""
                                          addOnRight={'đ'}
                                          disabled={true}
                                        />}
                                      </td>}
                                      <td style={{ fontSize: '14px', textAlign: 'center' }}>
                                        <span>{product?.scVariant?.sellable_stock}</span>
                                      </td>
                                      {typeCampaign != 'other' && <td style={{ fontSize: '14px', textAlign: 'center' }}>
                                        <div className='d-flex'>
                                          <div style={{ width: '70%' }}>
                                            <Select
                                              id={`campaign-${product?.scVariant?.id}-purchase_limit`}
                                              options={[{ value: 1, label: "Không giới hạn" }, { value: 2, label: 'Giới hạn' }]}
                                              value={values[`campaign-${product?.scVariant?.id}-purchase_limit`]}
                                              onChange={(value) => {
                                                setFieldValue(`campaign-${product?.scVariant?.id}-purchase_limit`, value)
                                              }}
                                              isDisabled={action != 'edit'}
                                            />
                                          </div>
                                          {values[`campaign-${product?.scVariant?.id}-purchase_limit`]?.value == 2 &&
                                            <div style={{ width: '30%' }}>
                                              <Field
                                                name={`campaign-${product?.scVariant?.id}-purchase_limit_number`}
                                                component={InputVertical}
                                                placeholder=""
                                                onChange={() => {
                                                }}
                                                value={values[`campaign-${product?.scVariant?.id}-purchase_limit_number`]}
                                                disabled={action != 'edit'}
                                              />
                                            </div>
                                          }
                                        </div>
                                      </td>}
                                      {typeCampaign != 'other' && <td style={{ fontSize: '14px', textAlign: 'center' }}>
                                        <div className='d-flex'>
                                          <div style={{ width: '70%' }}>
                                            <Select
                                              id={`campaign-${product?.scVariant?.id}-quantity_per_user`}
                                              options={[{ value: 1, label: "Không giới hạn" }, { value: 2, label: 'Giới hạn' }]}
                                              value={values[`campaign-${product?.scVariant?.id}-quantity_per_user`]}
                                              onChange={(value) => {
                                                setFieldValue(`campaign-${product?.scVariant?.id}-quantity_per_user`, value)
                                              }}
                                              isDisabled={action != 'edit'}
                                            />
                                          </div>
                                          {values[`campaign-${product?.scVariant?.id}-quantity_per_user`]?.value == 2 &&
                                            <div style={{ width: '30%' }}>
                                              <Field
                                                name={`campaign-${product?.scVariant?.id}-quantity_per_user_number`}
                                                component={InputVertical}
                                                placeholder=""
                                                value={values[`campaign-${product?.scVariant?.id}-quantity_per_user_number`]}
                                                disabled={action != 'edit'}
                                              />
                                            </div>
                                          }
                                        </div>
                                      </td>}
                                      <td style={{ fontSize: '14px', textAlign: 'center' }}>
                                        {(typeCampaign != 'other' && saleDetail?.mktFindCampaign?.status != 1 && paramsQuery?.type == 1 && product?.scVariant?.id != null) && (
                                          <Dropdown drop='down'
                                            isDisabled={action != 'edit'}
                                          >
                                            <Dropdown.Toggle
                                              className='btn-outline-secondary'
                                              disabled={action != 'edit'}
                                              style={action != 'edit' ? { cursor: 'not-allowed', opacity: 0.4 } : {}}
                                            >
                                              {formatMessage({ defaultMessage: `Chọn` })}
                                            </Dropdown.Toggle>
                                            <Dropdown.Menu style={{ zIndex: 99 }}>
                                              <Dropdown.Item className="mb-1 d-flex" onClick={() => {
                                                let newProduct = productsScheduled?.filter(item => {
                                                  return item?.scVariant?.id != product?.scVariant.id
                                                })
                                                let newProductSelect = productSelect?.filter(item => {
                                                  return item?.scVariant?.id != product?.scVariant.id
                                                })
                                                setProductsScheduled(newProduct)
                                                setProductSelect(newProductSelect)
                                              }} >{formatMessage({ defaultMessage: `Xóa` })}</Dropdown.Item>
                                              <Dropdown.Item className="mb-1 d-flex" onClick={async () => {
                                                const { data } = await retryCampaignItem({
                                                  variables: {
                                                    campaign_id: saleDetail?.mktFindCampaign.id,
                                                    list_campaign_item_id: [+product?.campaignInfo?.id]
                                                  }
                                                })
                                                if (data?.mktRetryCampaignItem?.success) {
                                                  addToast(formatMessage({ defaultMessage: 'Đồng bộ hàng hóa thành công' }), { appearance: 'success' })
                                                } else {
                                                  addToast(data?.mktRetryCampaignItem?.message, { appearance: 'error' })
                                                }
                                              }} >{formatMessage({ defaultMessage: `Đồng bộ lại` })}</Dropdown.Item>
                                            </Dropdown.Menu>
                                          </Dropdown>
                                        )}
                                        {typeCampaign != 'other' && action == 'edit' && (saleDetail?.mktFindCampaign?.status == 1 || product?.scVariant?.id == null || (saleDetail?.mktFindCampaign?.status != 1 && (paramsQuery?.type == 2 || paramsQuery?.type == 3))) && <button disabled={action != 'edit'} style={{ backgroundColor: 'transparent' }}
                                          onClick={(e) => {
                                            e.preventDefault()
                                            console.log(product)
                                            console.log(productsScheduled)
                                            let newProduct = productsScheduled?.filter(item => {
                                              return item?.scVariant?.id != product?.scVariant?.id || item?.campaignInfo?.id != product?.campaignInfo?.id
                                            })
                                            let newProductSelect = productSelect?.filter(item => {
                                              return item?.scVariant?.id != product?.scVariant?.id || item?.campaignInfo?.id != product?.campaignInfo?.id
                                            })
                                            setProductsScheduled(newProduct)
                                            setProductSelect(newProductSelect)
                                          }}
                                        >
                                          <SVG style={{ width: '14px', height: '14px' }} src={toAbsoluteUrl("/media/icons/icon-trash.svg")} />
                                        </button>}
                                      </td>
                                    </tr>
                                    {product?.campaignInfo?.sync_error_message && <tr>
                                      <td colSpan={9} style={{ position: 'relative', padding: '10px', backgroundColor: 'rgba(254, 86, 41, 0.51)' }}>
                                        <div style={{
                                          paddingTop: 0, paddingBottom: 0, paddingLeft: 0, paddingRight: 0,
                                          display: 'flex',
                                          flexDirection: 'column',
                                          justifyContent: 'center'
                                        }} >
                                          <p className="mt-0 mb-0"><span>{product.campaignInfo.sync_error_message}</span></p>
                                        </div>

                                      </td>
                                    </tr>}
                                  </>
                                );
                              }
                            )}
                        </tbody>
                      </table>
                      <Pagination
                        page={page}
                        totalPage={totalPage}
                        limit={limit}
                        totalRecord={(saleDetail?.mktFindCampaign?.status != 1 ? productsScheduled?.filter(product => {
                          if (paramsQuery?.type == 2) {
                            return !product?.campaignInfo?.sync_error_message && product?.campaignInfo?.sync_status == 2
                          } else if (paramsQuery?.type == 3) {
                            return product?.campaignInfo?.sync_status == 1
                          } else {
                            return !!product?.campaignInfo?.sync_error_message
                          }
                        }) : productsScheduled)?.length}
                        count={page * limit >= (saleDetail?.mktFindCampaign?.status != 1 ? productsScheduled?.filter(product => {
                          if (paramsQuery?.type == 2) {
                            return !product?.campaignInfo?.sync_error_message && product?.campaignInfo?.sync_status == 2
                          } else if (paramsQuery?.type == 3) {
                            return product?.campaignInfo?.sync_status == 1
                          } else {
                            return !!product?.campaignInfo?.sync_error_message
                          }
                        }) : productsScheduled)?.length ? ((saleDetail?.mktFindCampaign?.status != 1 ? productsScheduled?.filter(product => {
                          if (paramsQuery?.type == 2) {
                            return !product?.campaignInfo?.sync_error_message && product?.campaignInfo?.sync_status == 2
                          } else if (paramsQuery?.type == 3) {
                            return product?.campaignInfo?.sync_status == 1
                          } else {
                            return !!product?.campaignInfo?.sync_error_message
                          }
                        }) : productsScheduled)?.length - (page - 1) * limit) : limit}
                        basePath={`/marketing/sale/${saleDetail?.mktFindCampaign?.id}`}
                        emptyTitle={formatMessage({ defaultMessage: 'Chưa có hàng hóa nào.' })}
                      />
                    </>
                  ) : (
                    <SupportFeature id={params.id}
                      isFrame={saleDetail?.mktFindCampaign?.on_create_schedule_frame}
                      capaign={saleDetail?.mktFindCampaign} />
                  )}

                </Card>
                {showAddProduct && <ModalAddVariants
                  show={showAddProduct}
                  currentStore={values?.store}
                  onHide={() => setShowAddProduct(false)}
                  productsScheduled={productsScheduled?.filter(item => item?.scVariant?.id)?.map(item => item?.scVariant)}
                  onAddProductsScheduled={products => {
                    const newProducts = products?.map(product => {
                      return {
                        campaignInfo: {
                          sync_status: 1
                        },
                        scVariant: product
                      }
                    })
                    setProductsScheduled(prev => prev.concat(newProducts))
                  }}
                  optionsStore={storeOptions?.map((store) => {
                    return {
                      value: store.value,
                      label: store.label,
                      logo: store.logo
                    }
                  })}
                />}
                <div className="row justify-content-end mr-0">
                  {action != 'edit' && typeCampaign != 'other' && <button
                    className="btn btn-primary btn-elevate"
                    style={{ padding: '10px 20px' }}
                    onClick={async (e) => {
                      e.preventDefault();
                      history.push(
                        `/marketing/sale-list`
                      );
                    }}
                  >
                    {formatMessage({ defaultMessage: 'Đóng' })}
                  </button>}
                  {typeCampaign == 'other' && <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      history.push(
                        `/marketing/sale-list`
                      );
                    }}
                    className="btn btn mr-3"
                    style={{ border: "1px solid #ff5629", color: "#ff5629", height: '100%' }}
                  >
                    {formatMessage({ defaultMessage: 'HỦY BỎ' })}
                  </button>}
                  {action == 'edit' && <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        history.push(
                          `/marketing/sale-list`
                        );
                      }}
                      className="btn btn mr-3"
                      style={{ border: "1px solid #ff5629", color: "#ff5629", height: '100%' }}
                    >
                      {formatMessage({ defaultMessage: 'HỦY BỎ' })}
                    </button>
                    <button
                      className="btn btn-primary btn-elevate"
                      style={{ padding: '10px 20px' }}
                      onClick={async (e) => {
                        e.preventDefault();
                        setFieldValue('__changed__', false)
                        const totalError = await validateForm()
                        console.log(totalError)
                        if (!values?.frame?.url && values['on_create_schedule_frame']) {
                          addToast(formatMessage({ defaultMessage: 'Vui lòng chọn khung ảnh mẫu' }), { appearance: 'error' })
                          return;
                        }
                        if (Object.keys(totalError)?.filter((item) => {
                          return !['quantity_per_user_number', 'quantity_number', 'discount_percent', 'discount_value'].includes(item)
                        })?.length > 0) {
                          handleSubmit()
                          return;
                        } else {
                          const { data } = await updateCampaign({
                            variables: {
                              is_sync: saleDetail?.mktFindCampaign?.status == 2 ? 1 : null,
                              campaign_info: {
                                id: +location?.state?.id || +params.id,
                                connector_channel_code: _channel.code,
                                discount_type: +values?.typeDiscount,
                                end_time: +(values?.timeValue[1]?.getTime() / 1000).toFixed(0),
                                name: values?.name,
                                source: 1,
                                item_type: 2,
                                start_time: +(values?.timeValue[0]?.getTime() / 1000).toFixed(0),
                                store_id: +values?.store,
                                type: typeCampaign == 'discount' ? 1 : 2
                              },
                              support_data: {
                                on_create_reserve_ticket: !!values['on_create_reserve_ticket'] ? 1 : 0,
                                on_create_schedule_frame: !!values['on_create_schedule_frame'] ? 1 : 0,
                                ...(values['on_create_schedule_frame'] ? {
                                  schedule_frame_info: {
                                    apply_before_second: (values['day']?.value || 0) * 86400 + (values['hour']?.value || 0) * 3600 + (values['minute']?.value || 0) * 60 + (values['second']?.value || 0),
                                    apply_type: values['apply_type']?.value,
                                    frame_id: values['frame']?.id,
                                    option: String(OPTIONS_FRAME?.find(op => op?.value == values['option']?.value)?.value)
                                  }
                                } : {})
                              },
                              campaign_items: productsScheduled.map((product) => {
                                return {
                                  discount_percent: Math.ceil(values[`campaign-${product?.scVariant?.id}-discount-percent`]),
                                  promotion_price: Math.ceil(values[`campaign-${product?.scVariant?.id}-promotion_price`]),
                                  promotion_stock: values[`campaign-${product?.scVariant?.id}-purchase_limit`].value == 2 ? +values[`campaign-${product?.scVariant?.id}-purchase_limit_number`] : null,
                                  purchase_limit: values[`campaign-${product?.scVariant?.id}-quantity_per_user`].value == 2 ? +values[`campaign-${product?.scVariant?.id}-quantity_per_user_number`] : null,
                                  sc_product_id: product?.campaignInfo?.sc_product_id || product?.scVariant?.product?.id || null,
                                  sc_variant_id: product?.campaignInfo?.sc_variant_id || product?.scVariant?.id || null,
                                  sc_variant_sku: product?.campaignInfo?.sc_variant_sku || product?.scVariant?.sku || '',
                                  ref_product_id: product?.campaignInfo?.ref_product_id || product?.scVariant?.ref_product_id || null,
                                  ref_variant_id: product?.campaignInfo?.ref_variant_id || product?.scVariant?.ref_id || null,
                                  sme_variant_id: '',
                                  sme_variant_sku: ''
                                }
                              })
                            }

                          })
                          if (data?.mktSaveCampaign?.success) {
                            addToast(formatMessage({ defaultMessage: 'Chỉnh sửa chương trình khuyến mại thành công' }), { appearance: 'success' })
                            history.push(
                              `/marketing/sale-list`
                            )
                          } else {
                            addToast(data?.mktSaveCampaign?.message || formatMessage({ defaultMessage: 'Có lỗi xảy ra! Xin vui lòng thử lại' }), { appearance: "error" })
                            history.push(
                              `/marketing/sale-list`
                            )
                          }
                        }
                      }}
                    >
                      {formatMessage({ defaultMessage: 'CẬP NHẬT' })}
                    </button>
                    <AuthorizationWrapper keys={['marketing_list_approved']}>
                      {saleStatus == 'pending' && <button
                        className="btn btn-primary btn-elevate ml-4"
                        style={{ padding: '10px 20px' }}
                        onClick={async (e) => {
                          setFieldValue('__changed__', false)
                          const totalError = await validateForm()
                          if (!values?.frame?.url && values['on_create_schedule_frame']) {
                            addToast(formatMessage({ defaultMessage: 'Vui lòng chọn khung ảnh mẫu' }), { appearance: 'error' })
                            return;
                          }
                          if (Object.keys(totalError)?.filter((item) => {
                            return !['quantity_per_user_number', 'quantity_number', 'discount_percent', 'discount_value'].includes(item)
                          })?.length > 0) {
                            handleSubmit()
                            return;
                          } else {
                            const { data: dataUpdate } = await updateCampaign({
                              variables: {
                                is_sync: saleDetail?.mktFindCampaign?.status == 2 ? 1 : null,
                                campaign_info: {
                                  id: +location?.state?.id || +params?.id,
                                  connector_channel_code: _channel.code,
                                  discount_type: +values?.typeDiscount,
                                  end_time: +(values?.timeValue[1]?.getTime() / 1000).toFixed(0),
                                  name: values?.name,
                                  source: 1,
                                  start_time: +(values?.timeValue[0]?.getTime() / 1000).toFixed(0),
                                  store_id: +values?.store,
                                  type: typeCampaign == 'discount' ? 1 : 2
                                },
                                support_data: {
                                  on_create_reserve_ticket: !!values['on_create_reserve_ticket'] ? 1 : 0,
                                  on_create_schedule_frame: !!values['on_create_schedule_frame'] ? 1 : 0,
                                  ...(values['on_create_schedule_frame'] ? {
                                    schedule_frame_info: {
                                      apply_before_second: (values['day']?.value || 0) * 86400 + (values['hour']?.value || 0) * 3600 + (values['minute']?.value || 0) * 60 + (values['second']?.value || 0),
                                      apply_type: values['apply_type']?.value,
                                      frame_id: values['frame']?.id,
                                      option: String(OPTIONS_FRAME?.find(op => op?.value == values['option']?.value)?.value)
                                    }
                                  } : {})
                                },
                                campaign_items: productsScheduled.map((product) => {
                                  return {
                                    discount_percent: Math.ceil(values[`campaign-${product?.scVariant?.id}-discount-percent`]),
                                    promotion_price: Math.ceil(values[`campaign-${product?.scVariant?.id}-promotion_price`]),
                                    promotion_stock: values[`campaign-${product?.scVariant?.id}-purchase_limit`].value == 2 ? +values[`campaign-${product?.scVariant?.id}-purchase_limit_number`] : null,
                                    purchase_limit: values[`campaign-${product?.scVariant?.id}-quantity_per_user`].value == 2 ? +values[`campaign-${product?.scVariant?.id}-quantity_per_user_number`] : null,
                                    sc_product_id: product?.campaignInfo?.sc_product_id || product?.scVariant?.product?.id || null,
                                    sc_variant_id: product?.campaignInfo?.sc_variant_id || product?.scVariant?.id || null,
                                    sc_variant_sku: product?.campaignInfo?.sc_variant_sku || product?.scVariant?.sku || '',
                                    ref_product_id: product?.campaignInfo?.ref_product_id || product?.scVariant?.ref_product_id || null,
                                    ref_variant_id: product?.campaignInfo?.ref_variant_id || product?.scVariant?.ref_id || null,
                                    sme_variant_id: '',
                                    sme_variant_sku: ''
                                  }
                                })
                              }
                            })

                            if (dataUpdate?.mktSaveCampaign?.success) {
                              const { data: dataSync } = await approvedCampaign({
                                variables: {
                                  list_campaign_id: [+location?.state?.id || +params.id]
                                }
                              })
                              if (dataSync?.mktApprovedCampaign?.success) {
                                addToast(formatMessage({ defaultMessage: "Duyệt chương trình khuyến mại thành công" }), { appearance: "success" })
                                history.push(
                                  `/marketing/sale-list`
                                )
                              } else {
                                addToast(dataSync?.mktApprovedCampaign?.message || formatMessage({ defaultMessage: 'Có lỗi xảy ra! Xin vui lòng thử lại' }), { appearance: "error" })
                                history.push(
                                  `/marketing/sale-list`
                                )
                              }
                            } else {
                              addToast(dataUpdate?.mktSaveCampaign?.message || formatMessage({ defaultMessage: 'Có lỗi xảy ra! Xin vui lòng thử lại' }), { appearance: "error" })
                              history.push(
                                `/marketing/sale-list`
                              )
                            }
                          }
                        }}
                      >
                        {formatMessage({ defaultMessage: 'DUYỆT' })}
                      </button>
                      }
                    </AuthorizationWrapper>
                  </>}
                </div>
              </Form>)
          }}
        </Formik>

      </div>
    </Fragment>
  );
};

const CampaignDetailWrapper = () => {
  return (
    <MarketingProvider>
      <CampaignDetail />
    </MarketingProvider>
  )
}

export default CampaignDetailWrapper;
