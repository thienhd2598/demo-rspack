import React, { useState } from "react";
import { Switch } from "react-router-dom";
import FrameImageList from './frame-image-list/index';
import FrameImageNew from './frame-image-new/index';
import FrameImageEdit from './frame-image-edit/index';
import { ContentRoute, useSubheader } from "../../../_metronic/layout";
import ScheduledFrameCreate from "./scheduled-frame-create";
import ScheduledFrameList from "./scheduled-frame-list";
import ScheduledFrameDetail from "./scheduled-frame-detail";
import FrameEditor from "./frame-editor";
import FrameEditorDetail from "./frame-editor/FrameEditorDetail";

export default function ProductsPage({ history }) {
    const suhbeader = useSubheader();
    suhbeader.setTitle('Quản lý khung ảnh mẫu');

    return (
        <Switch>
            <ContentRoute path="/frame-image/list" component={FrameImageList} roles={["frame_image_view"]} />
            <ContentRoute path="/frame-image/new" component={FrameImageNew} roles={["frame_image_action"]} />
            <ContentRoute path="/frame-image/editor/:id" component={FrameEditorDetail} roles={["frame_image_edit"]} />            
            <ContentRoute path="/frame-image/create-editor" component={FrameEditor} roles={["frame_image_action"]} />
            <ContentRoute path="/frame-image/scheduled-frame-create" component={ScheduledFrameCreate} roles={["frame_schedule_create", 'frame_schedule_action']} />
            <ContentRoute path="/frame-image/scheduled-frame/:id" component={ScheduledFrameDetail} roles={["frame_schedule_action"]} />
            <ContentRoute path="/frame-image/scheduled-frame" component={ScheduledFrameList} roles={["frame_schedule_view"]} />
        </Switch>
    );
}
