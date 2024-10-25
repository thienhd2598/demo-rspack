import { useMutation } from "@apollo/client";
import axios from "axios";
import { Formik } from "formik";
import React, { Fragment, memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useIntl } from "react-intl";
import { Transformer } from "react-konva";
import { useSelector } from "react-redux";
import { useHistory } from 'react-router-dom';
import { useToasts } from "react-toast-notifications";
import * as Yup from "yup";
import { Card } from "../../../../_metronic/_partials/controls";
import { useSubheader } from "../../../../_metronic/layout";
import { RouterPrompt } from "../../../../components/RouterPrompt";
import mutate_insertFrameImage from "../../../../graphql/mutate_insertFrameImage";
import LoadingDialog from "../LoadingDialog";
import { FrameEditorProvider, useFrameEditorContext } from "./FrameEditorContext";
import View from "./ViewFrameEditor";
import FrameItem from "./components/FrameItem";
import IconItem from "./components/IconItem";
import ImageItem from "./components/ImageItem";
import LineItem from "./components/LineItem";
import ShapeItem from "./components/ShapeItem";
import TextItem from "./components/TextItem";
import useSelection from "./hooks/useSelection";
import useStage from "./hooks/useStage";
import useTransformer from "./hooks/useTransformer";
import { ORIGIN_WIDTH_FRAME, convertDataUriToFile } from "./utils";
import Widgets from "./widgets";
import ToolWidget from "./widgets/ToolWidget";
import { useClickOutside } from "../../../../hooks/useClickOutside";
import { initialStageDataList } from "./utils/initilaStageDataList";
import useWorkHistory from "./hooks/useWorkHistory";
import AuthorizationWrapper from "../../../../components/AuthorizationWrapper";
import { randomString } from "../../../../utils";

const FrameEditor = () => {
    const { addToast } = useToasts();
    const history = useHistory();
    const { formatMessage } = useIntl();
    const user = useSelector((state) => state.auth.user);
    const stage = useStage();
    const refWrapperEditor = useRef();
    const transformer = useTransformer();
    const { selectedItems, onSelectItem, setSelectedItems, clearSelection } = useSelection(transformer);
    const { currentStageData, setCurrentStageData, addCurrentStageData, updateCurrentStageData, deleteCurrentStageData } = useFrameEditorContext();
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

    const [createFrameImage, { loading: loadingInsertFrameImage }] = useMutation(mutate_insertFrameImage);

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
    console.log(history?.location?.state?.frame)
    useMemo(() => {
        if (!history?.location?.state?.frame) return;

        setInitialValues(prev => ({
            ...prev,
            name: `Sao chép ${history?.location?.state?.frame?.name}`
        }));

        const dataStageConfigDetail = history?.location?.state?.frame?.config
            ? JSON.parse(history?.location?.state?.frame?.config) : []
        const dataStageShapeDetail = history?.location?.state?.frame?.shape
            ? JSON.parse(history?.location?.state?.frame?.shape) : {}

        const dataStageDetail = [
            ...dataStageConfigDetail,
            {
                id: initialStageDataList[1].id,
                attrs: {
                    ...initialStageDataList[1].attrs,
                    x: +(dataStageShapeDetail?.x / 2).toFixed(),
                    y: +(dataStageShapeDetail?.y / 2).toFixed(),
                    width: +(dataStageShapeDetail?.width / 2).toFixed(),
                    height: +(dataStageShapeDetail?.height / 2).toFixed(),
                }
            }
        ];

        setCurrentStageData(dataStageDetail);
    }, [history?.location?.state?.frame]);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.code === 'Backspace' && Boolean(selectedItems.length) && refFocusSection.current == 'editor') {
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
                const itemsSelected = currentStageData?.filter(item => (item?.['data-item-type'] != 'frame' || item?.['data-item-type'] != 'shape') && selectedItems?.some(si => si?.id() == item?.id));

                if (itemsSelected?.length == 0) return;                

                const newItem = itemsSelected?.map(item => ({
                    ...item,
                    id: randomString(),
                    attrs: {
                        ...item?.attrs,
                        x: item?.attrs.x + 20,
                        y: item?.attrs.y + 20,
                    }
                }));
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
                        key={`image-${item.id}`}
                        data={item}
                        onSelect={onSelectItem}
                        addCurrentStageData={addCurrentStageData}
                        updateCurrentStageData={updateCurrentStageData}
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
    //         console.log(`THIEN NGUYEN KHANH`)
    //         stage.stageRef.current.batchDraw();
    //     }
    // }, [refWrapperEditor?.current?.clientWidth]);

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
                        <LoadingDialog show={loadingFile || loadingInsertFrameImage} />
                        <div className="row d-flex justify-content-center">
                            <div className="col-4">
                                <Widgets />
                            </div>
                            <div className="col-5" ref={refEditor} onClick={() => refFocusSection.current = 'editor'}>
                                <Card ref={refWrapperEditor}>
                                    <div className="d-flex justify-content-center" style={{ height: refWrapperEditor?.current?.clientWidth }}>
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
                                    </div>
                                </Card>
                            </div>
                            <div className="col-3" style={{ maxHeight: '85vh', overflowY: 'auto' }}>
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
                            <AuthorizationWrapper keys={['frame_schedule_create']}>
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

                                            const [filteredStageData, shapeStage] = [
                                                currentStageData?.filter(stage => stage?.attrs?.[`type-ub`] != 'shape'),
                                                currentStageData?.find(stage => stage?.attrs?.[`type-ub`] == 'shape')
                                            ];

                                            setFieldValue('__changed__', false);
                                            const frame = stage.stageRef.current
                                                .getChildren()[0]
                                                .getChildren((item) => {
                                                    return item.attrs.name === "label-group"
                                                })[0];
                                            const layerFrame = frame.getLayer();

                                            layerFrame.children = layerFrame.children?.filter(
                                                (item) => {
                                                    const isShape = item?.id() == shapeStage?.id;
                                                    return !isShape
                                                },
                                            );

                                            const stageExport = layerFrame.getStage();
                                            clearSelection();
                                            const uri = stageExport.toDataURL({
                                                x: frame.getClientRect().x,
                                                y: frame.getClientRect().y,
                                                width: ORIGIN_WIDTH_FRAME * stageExport.scaleX(),
                                                height: ORIGIN_WIDTH_FRAME * stageExport.scaleY(),
                                                pixelRatio: ORIGIN_WIDTH_FRAME / refWrapperEditor?.current?.clientWidth,
                                            });

                                            console.log({ uri })
                                            const fileExportFrame = convertDataUriToFile(uri);
                                            console.log({ uri, fileExportFrame, stageExport });

                                            setLoadingFile(true);
                                            let formData = new FormData();
                                            formData.append('type', 'file')
                                            formData.append('file', fileExportFrame, fileExportFrame?.name || 'file.jpg')
                                            let res = await axios.post(process.env.REACT_APP_URL_FILE_UPLOAD, formData, {
                                                isSubUser: user?.is_subuser,
                                            });

                                            const requestCreateFrame = {
                                                asset_id: res?.data?.data?.id,
                                                asset_url: res?.data?.data?.source,
                                                name: values?.name,
                                                is_static: 0,
                                                config: JSON.stringify(filteredStageData),
                                                shape: JSON.stringify({
                                                    x: Math.abs(shapeStage?.attrs?.x?.toFixed()),
                                                    y: Math.abs(shapeStage?.attrs?.y?.toFixed()),
                                                    width: Math.abs((shapeStage?.attrs?.width * shapeStage?.attrs?.scaleX).toFixed()),
                                                    height: Math.abs((shapeStage?.attrs?.height * shapeStage?.attrs?.scaleY).toFixed()),
                                                }),
                                            };

                                            console.log({ requestCreateFrame, filteredStageData, shapeStage });

                                            setLoadingFile(false);
                                            const { data } = await createFrameImage({
                                                variables: requestCreateFrame
                                            });

                                            if (data?.insert_sme_catalog_photo_frames?.affected_rows) {
                                                history.push('/frame-image/list?type=0');
                                                addToast(formatMessage({ defaultMessage: 'Thêm mới khung ảnh mẫu thành công' }), { appearance: 'success' });
                                            } else {
                                                addToast(formatMessage({ defaultMessage: 'Thêm mới khung ảnh mẫu thất bại' }), { appearance: 'error' });
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
                            </AuthorizationWrapper>
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
                title: formatMessage({ defaultMessage: 'Thêm khung ảnh sản phẩm' }),
                pathname: '/frame-image/create-editor'
            }
        ])
    }, []);

    return (
        <FrameEditorProvider>
            <Helmet
                titleTemplate={formatMessage({ defaultMessage: "Thêm khung ảnh sản phẩm" }) + "- UpBase"}
                defaultTitle={formatMessage({ defaultMessage: "Thêm khung ảnh sản phẩm" }) + "- UpBase"}
            >
                <meta name="description" content={formatMessage({ defaultMessage: "Thêm khung ảnh sản phẩm" }) + "- UpBase"} />
            </Helmet>
            <FrameEditor />
        </FrameEditorProvider>
    )
}

export default memo(FrameEditorWrapperContext);