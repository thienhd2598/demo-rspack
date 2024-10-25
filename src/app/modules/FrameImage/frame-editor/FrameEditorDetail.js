import React, { Fragment, memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Card, CardBody, InputVertical } from "../../../../_metronic/_partials/controls";
import { Layer, Rect, Stage, Text, Transformer } from "react-konva";
import { useSubheader } from "../../../../_metronic/layout";
import { useIntl } from "react-intl";
import Konva from 'konva';
import { FrameEditorProvider, useFrameEditorContext } from "./FrameEditorContext";
import { Helmet } from "react-helmet-async";
import useTransformer from "./hooks/useTransformer";
import useSelection from "./hooks/useSelection";
import FrameItem from "./components/FrameItem";
import ImageItem from "./components/ImageItem";
import TextItem from "./components/TextItem";
import ShapeItem from "./components/ShapeItem";
import IconItem from "./components/IconItem";
import LineItem from "./components/LineItem";
import View from "./ViewFrameEditor";
import useStage from "./hooks/useStage";
import TextWidget from "./widgets/TextWidget";
import { Formik, Field } from "formik";
import { RouterPrompt } from "../../../../components/RouterPrompt";
import * as Yup from "yup";
import { useToasts } from "react-toast-notifications";
import clsx from "clsx";
import { FRAME_TABS, FRAME_WAREHOUSE } from "./FrameEditorHelper";
import axios from "axios";
import Widgets from "./widgets";
import { ORIGIN_WIDTH_FRAME, convertDataUriToFile } from "./utils";
import { useSelector } from "react-redux";
import { useHistory } from 'react-router-dom';
import ToolWidget from "./widgets/ToolWidget";
import { useMutation, useQuery } from "@apollo/client";
import mutate_insertFrameImage from "../../../../graphql/mutate_insertFrameImage";
import LoadingDialog from "../LoadingDialog";
import { useRouteMatch } from "react-router-dom";
import query_sme_catalog_photo_frames_by_pk from "../../../../graphql/query_sme_catalog_photo_frames_by_pk";
import { initialStageDataList } from "./utils/initilaStageDataList";
import mutate_update_sme_catalog_photo_frames_by_pk from "../../../../graphql/mutate_update_sme_catalog_photo_frames_by_pk";
import { useClickOutside } from "../../../../hooks/useClickOutside";
import { randomString } from "../../../../utils";
import useWorkHistory from "./hooks/useWorkHistory";

const FrameEditorDetail = () => {
    const { addToast } = useToasts();
    const history = useHistory();
    const { formatMessage } = useIntl();
    const user = useSelector((state) => state.auth.user);
    const stage = useStage();
    const refWrapperEditor = useRef();
    const transformer = useTransformer();
    const route = useRouteMatch();
    const { selectedItems, onSelectItem, setSelectedItems, clearSelection } = useSelection(transformer);
    const { currentStageData, addCurrentStageData, updateCurrentStageData, deleteCurrentStageData, setCurrentStageData } = useFrameEditorContext();
    const [loadingFile, setLoadingFile] = useState(false);
    const [initialValues, setInitialValues] = useState({ tab: 1, type: 1 });
    const refFocusSection = useRef('outside-editor');
    const refEditor = useClickOutside(() => {
        refFocusSection.current = 'outside-editor'
    });

    const [past, setPast] = useState([]);
    const [future, setFuture] = useState([]);
    const { goToFuture, goToPast, recordPast, clearHistory } = useWorkHistory(
        past,
        future,
        setPast,
        setFuture,
        setCurrentStageData
    );

    const [editFrameImage, { loading: loadingEditFrameImage }] = useMutation(mutate_update_sme_catalog_photo_frames_by_pk);

    const { data: dataDetail, loading } = useQuery(query_sme_catalog_photo_frames_by_pk, {
        variables: {
            id: Number(route?.params?.id)
        },
        fetchPolicy: 'network-only',
        onCompleted: (data) => {
            setInitialValues(prev => ({
                ...prev,
                name: data?.sme_catalog_photo_frames_by_pk?.name
            }));

            const dataStageConfigDetail = data?.sme_catalog_photo_frames_by_pk?.config
                ? JSON.parse(data?.sme_catalog_photo_frames_by_pk?.config) : []
            const dataStageShapeDetail = data?.sme_catalog_photo_frames_by_pk?.shape
                ? JSON.parse(data?.sme_catalog_photo_frames_by_pk?.shape) : {}

            const dataStageDetail = [
                ...dataStageConfigDetail,
                {
                    id: initialStageDataList[1].id,
                    attrs: {
                        ...initialStageDataList[1].attrs,
                        x: +(dataStageShapeDetail?.x).toFixed(),
                        y: +(dataStageShapeDetail?.y).toFixed(),
                        width: +(dataStageShapeDetail?.width).toFixed(),
                        height: +(dataStageShapeDetail?.height).toFixed(),
                    }
                }
            ];

            setCurrentStageData(dataStageDetail);
        }
    });

    const sortedStageData = useMemo(
        () =>
            currentStageData.sort((a, b) => {
                if (a.attrs.zIndex === b.attrs.zIndex) {
                    if (a.attrs.zIndex < 0) {
                        return b.attrs.updatedAt - a.attrs.updatedAt;
                    }
                    return a.attrs.updatedAt - b.attrs.updatedAt;
                }
                return a.attrs.zIndex - b.attrs.zIndex;
            }),
        [currentStageData],
    );

    useEffect(() => {
        recordPast(currentStageData);
    }, [currentStageData]);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.code === 'Backspace' && Boolean(selectedItems.length) && refFocusSection?.current == 'editor') {
                event.preventDefault();
                if (selectedItems[0]?.id() == 'ub-frame-shape') {
                    setSelectedItems([]);
                    transformer.transformerRef.current.nodes([]);
                    return;
                };

                setSelectedItems([]);
                transformer.transformerRef.current.nodes([]);
                deleteCurrentStageData(selectedItems?.map(item => item.id()));
            }

            if (event.code == 'KeyZ') {
                goToPast();
            }

            if (event.code == 'KeyZ' && event.shiftKey) {
                goToFuture();
            }

            if (event.ctrlKey && event.keyCode === 89) {
                const itemSelected = currentStageData?.find(item => item?.id == selectedItems[0]?.id());
                if (itemSelected?.['data-item-type'] == 'frame' || itemSelected?.['data-item-type'] == 'shape') return;
                const newItem = {
                    ...itemSelected,
                    id: randomString(),
                    attrs: {
                        ...itemSelected?.attrs,
                        x: itemSelected?.attrs.x + 20,
                        y: itemSelected?.attrs.y + 20,
                    }
                };
                setCurrentStageData(prev => prev.concat(newItem));
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [selectedItems, transformer.transformerRef.current, refFocusSection?.current, currentStageData]);

    useEffect(() => {
        window.addEventListener("beforeunload", (e) => {
            e.preventDefault();
            e.returnValue = "";
        });

        document.addEventListener('visibilitychange', function () {
            if (document.visibilityState === 'visible') {
                stage.stageRef.current.batchDraw();
            }
        });
        // stage.stageRef.current.setPosition({
        //     x: Math.max(Math.ceil(stage.stageRef.current.width() - 1280) / 2, 0),
        //     y: Math.max(Math.ceil(stage.stageRef.current.height() - 760) / 2, 0),
        // });
        // stage.stageRef.current.batchDraw();
    }, []);

    const renderObject = (item, width) => {
        switch (item.attrs["data-item-type"]) {
            case "frame":
                return (
                    <FrameItem
                        key={`frame-${item.id}`}
                        data={item}
                        frameWidth={width}
                        onSelect={onSelectItem}
                        addCurrentStageData={addCurrentStageData}
                        updateCurrentStageData={updateCurrentStageData}
                    />
                );
            case "image":
                return (
                    <ImageItem
                        key={`image-${item.id}`}
                        data={item}
                        onSelect={onSelectItem}
                        addCurrentStageData={addCurrentStageData}
                        updateCurrentStageData={updateCurrentStageData}
                    />
                );
            case "text":
                return (
                    <TextItem
                        key={`image-${item.id}`}
                        data={item}
                        currentStageData={currentStageData}
                        updateCurrentStageData={updateCurrentStageData}
                        transformer={transformer}
                        onSelect={onSelectItem}
                    />
                );
            case "shape":
                return (
                    <ShapeItem
                        key={`shape-${item.id}`}
                        data={item}
                        transformer={transformer}
                        onSelect={onSelectItem}
                    />
                );
            case "icon":
                return (
                    <IconItem
                        key={`icon-${item.id}`}
                        data={item}
                        currentStageData={currentStageData}
                        updateCurrentStageData={updateCurrentStageData}
                        transformer={transformer}
                        onSelect={onSelectItem}
                    />
                );
            case "line":
                return (
                    <LineItem
                        key={`line-${item.id}`}
                        data={item}
                        transformer={transformer}
                        onSelect={onSelectItem}
                    />
                );
            default:
                return null;
        }
    };

    const validateSchema = Yup.object().shape({
        name: Yup.string()
            .required(formatMessage({ defaultMessage: 'Vui lòng nhập tên mẫu khung ảnh' }))
            .min(5, formatMessage({ defaultMessage: 'Vui lòng điền ít nhất 5 kí tự' }))
            .max(120, formatMessage({ defaultMessage: 'Tên mẫu tối đa 120 ký tự' }))
            .test(
                'chua-ky-tu-space-o-dau-cuoi',
                formatMessage({ defaultMessage: 'Mẫu khung ảnh không được chứa dấu cách ở đầu và cuối' }),
                (value, context) => {
                    if (!!value) {
                        return value.length == value.trim().length;
                    }
                    return false;
                },
            )
            .test(
                'chua-ky-tu-2space',
                formatMessage({ defaultMessage: 'Mẫu khung ảnh không được chứa 2 dấu cách liên tiếp' }),
                (value, context) => {
                    if (!!value) {
                        return !(/\s\s+/g.test(value))
                    }
                    return false;
                },
            )
            .when(`name_boolean`, {
                is: values => {
                    return !!values && !!values[`name`];
                },
                then: Yup.string().oneOf([`name`], formatMessage({ defaultMessage: 'Tên khung ảnh mẫu đã tồn tại' }))
            }),
        name_boolean: Yup.object().notRequired(),
    });

    // useMemo(() => {
    //     if (!!refWrapperEditor?.current?.clientWidth) {
    //         const frameItem = currentStageData[0];

    //         if (frameItem?.attrs?.width == refWrapperEditor?.current?.clientWidth) return;
    //         updateCurrentStageData(frameItem?.id, {
    //             width: refWrapperEditor?.current?.clientWidth,
    //             height: refWrapperEditor?.current?.clientWidth,
    //         })
    //     }
    // }, [refWrapperEditor?.current?.clientWidth, currentStageData[0]]);

    return (
        <Formik
            initialValues={initialValues}
            validationSchema={validateSchema}
            enableReinitialize
        >
            {({
                submitForm,
                handleSubmit,
                setValues,
                values,
                setFieldValue,
                validateForm
            }) => {
                const changed = values['__changed__'];

                return (
                    <Fragment>
                        <RouterPrompt
                            when={changed}
                            title={formatMessage({ defaultMessage: 'Bạn đang tạo khung ảnh mẫu. Mọi thông tin bạn tạo trước đó sẽ bị xoá nếu bạn thoát màn hình này. Bạn có chắc chắn muốn thoát?' })}
                            cancelText={formatMessage({ defaultMessage: 'Không' })}
                            okText={formatMessage({ defaultMessage: 'Có, Thoát' })}
                            onOK={() => true}
                            onCancel={() => false}
                        />
                        <LoadingDialog show={loadingFile || loadingEditFrameImage} />
                        <div className="row d-flex justify-content-center">
                            <div className="col-4">
                                <Widgets />
                            </div>
                            <div
                                className="col-5"
                                ref={refEditor}
                                onClick={() => refFocusSection.current = 'editor'}
                            // style={{ position: 'sticky', top: 45, }}
                            >
                                <Card ref={refWrapperEditor}>
                                    {loading && <div className='text-center w-100 mt-4' style={{ position: 'absolute' }} >
                                        <span className="ml-3 spinner spinner-primary"></span>
                                    </div>}
                                    {!loading && <div style={{ height: refWrapperEditor?.current?.clientWidth }}>
                                        <View
                                            width={refWrapperEditor?.current?.clientWidth}
                                            height={refWrapperEditor?.current?.clientWidth}
                                            onSelect={onSelectItem}
                                            stage={stage}
                                        >
                                            {currentStageData.length ? sortedStageData.map((item) => renderObject(item, refWrapperEditor?.current?.clientWidth)) : null}
                                            <Transformer
                                                ref={transformer.transformerRef}
                                                keepRatio
                                                shouldOverdrawWholeArea
                                                flipEnabled={false}
                                                boundBoxFunc={(_, newBox) => newBox}
                                                onTransformEnd={transformer.onTransformEnd}
                                            />
                                        </View>
                                    </div>}
                                </Card>
                            </div>
                            <div className="col-3">
                                <ToolWidget
                                    frameWidth={refWrapperEditor?.current?.clientWidth}
                                    selectedItems={selectedItems?.[0] || null}
                                />
                            </div>
                        </div>
                        <div className='form-group d-flex justify-content-end mt-8 group-button-fixed-bottom pr-10' style={{ zIndex: 9 }}>
                            <button
                                id="btn-print"
                                className='btn btn-secondary'
                                role="button"
                                type="submit"
                                style={{ width: 150 }}
                                onClick={() => {
                                    history.push('/frame-image/list?type=0');
                                }}
                            >
                                {formatMessage({ defaultMessage: 'Hủy' })}
                            </button>
                            <button
                                id="btn-save"
                                className='btn ml-4 btn-primary'
                                type="submit"
                                style={{ width: 150 }}
                                onClick={async () => {
                                    try {
                                        const errors = await validateForm(values);

                                        if (Object.keys(errors)?.length > 0) {
                                            handleSubmit();
                                            addToast(formatMessage({ defaultMessage: 'Vui lòng nhập đầy đủ các trường thông tin đã được khoanh đỏ' }), { appearance: 'error' })
                                            return;
                                        }

                                        const [filteredStageData, shapeStage, frameStage] = [
                                            currentStageData?.filter(stage => stage?.attrs?.[`type-ub`] != 'shape'),
                                            currentStageData?.find(stage => stage?.attrs?.[`type-ub`] == 'shape'),
                                            currentStageData?.find(stage => stage?.attrs?.[`data-item-type`] == 'frame'),
                                        ];

                                        setFieldValue('__changed__', false);                                        
                                        clearSelection();

                                        const frame = stage.stageRef.current
                                            .getChildren()[0]
                                            .getChildren((item) => item.attrs.name === "label-group")[0];

                                        const layerFrame = frame.getLayer();

                                        layerFrame.children = layerFrame.children?.filter(
                                            (item) => {
                                                const isShape = item?.id() == shapeStage?.id;
                                                return !isShape
                                            },
                                        );

                                        const stageExport = layerFrame.getStage();
                                        const uri = stageExport.toDataURL({
                                            x: frame.getClientRect().x,
                                            y: frame.getClientRect().y,
                                            width: ORIGIN_WIDTH_FRAME * stageExport.scaleX(),
                                            height: ORIGIN_WIDTH_FRAME * stageExport.scaleY(),
                                            pixelRatio: ORIGIN_WIDTH_FRAME / refWrapperEditor?.current?.clientWidth,
                                        });

                                        const fileExportFrame = convertDataUriToFile(uri);

                                        setLoadingFile(true);
                                        let formData = new FormData();
                                        formData.append('type', 'file')
                                        formData.append('file', fileExportFrame, fileExportFrame?.name || 'file.jpg')
                                        let res = await axios.post(process.env.REACT_APP_URL_FILE_UPLOAD, formData, {
                                            isSubUser: user?.is_subuser,
                                        });

                                        const requestEditFrame = {
                                            asset_id: res?.data?.data?.id,
                                            asset_url: res?.data?.data?.source,
                                            name: values?.name,
                                            config: JSON.stringify(filteredStageData),
                                            shape: JSON.stringify({
                                                x: Math.abs(shapeStage?.attrs?.x?.toFixed()),
                                                y: Math.abs(shapeStage?.attrs?.y?.toFixed()),
                                                width: Math.abs((shapeStage?.attrs?.width * shapeStage?.attrs?.scaleX).toFixed()),
                                                height: Math.abs((shapeStage?.attrs?.height * shapeStage?.attrs?.scaleY).toFixed()),
                                            }),
                                        };

                                        console.log({ requestEditFrame })

                                        setLoadingFile(false);
                                        const { data } = await editFrameImage({
                                            variables: {
                                                id: Number(route?.params?.id),
                                                _set: {
                                                    ...requestEditFrame
                                                }
                                            }
                                        });


                                        if (data?.update_sme_catalog_photo_frames_by_pk) {
                                            history.push('/frame-image/list?type=0');
                                            addToast(formatMessage({ defaultMessage: 'Cập nhật khung ảnh mẫu thành công' }), { appearance: 'success' });
                                        } else {
                                            addToast(formatMessage({ defaultMessage: 'Cập nhật khung ảnh mẫu thất bại' }), { appearance: 'error' });
                                        }
                                    } catch (error) {
                                        console.log({ error })
                                        setLoadingFile(false);
                                        addToast(formatMessage({ defaultMessage: 'Đã có lỗi xảy ra, xin vui lòng thử lại' }), { appearance: 'error' })
                                    }
                                }}
                            >
                                {formatMessage({ defaultMessage: 'Lưu lại' })}
                            </button>
                        </div>
                    </Fragment>
                )
            }}
        </Formik>
    )
};

const FrameEditorWrapperContext = () => {
    const { setBreadcrumbs } = useSubheader();
    const { formatMessage } = useIntl();

    useLayoutEffect(() => {
        setBreadcrumbs([
            {
                title: formatMessage({ defaultMessage: 'Chỉnh sửa khung ảnh sản phẩm' }),
                pathname: '/frame-image/create-editor'
            }
        ])
    }, []);

    return (
        <FrameEditorProvider>
            <Helmet
                titleTemplate={formatMessage({ defaultMessage: "Chỉnh sửa khung ảnh sản phẩm" }) + "- UpBase"}
                defaultTitle={formatMessage({ defaultMessage: "Chỉnh sửa khung ảnh sản phẩm" }) + "- UpBase"}
            >
                <meta name="description" content={formatMessage({ defaultMessage: "Chỉnh sửa khung ảnh sản phẩm" }) + "- UpBase"} />
            </Helmet>
            <FrameEditorDetail />
        </FrameEditorProvider>
    )
}

export default memo(FrameEditorWrapperContext);

export const actionKeys = {
    "frame_image_edit": {
        router: '/frame-image/editor/:id',
        actions: [
            "sme_catalog_photo_frames_by_pk", "update_sme_catalog_photo_frames_by_pk", "sme_catalog_photo_library", "sme_catalog_photo_library_aggregate",
            "sme_catalog_photo_library_category", "insert_sme_catalog_photo_library", "delete_sme_catalog_photo_library_by_pk"
        ],
        name: "Chỉnh sửa khung ảnh sản phẩm",
        group_code: 'frame_image',
        group_name: 'Quản lý khung ảnh sản phẩm',
        cate_code: 'frame_image__service',
        cate_name: 'Quản lý khung ảnh mẫu',
    },
};