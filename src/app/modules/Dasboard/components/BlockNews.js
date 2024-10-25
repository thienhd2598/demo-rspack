import dayjs from "dayjs";
import React, { memo, useMemo, useCallback } from "react";

const BlockNew = ({ post }) => {
    const [postImgLink, postImgTitle, postImgAlt] = useMemo(
        () => {
            let imgLink = 'https://cl-wpml.s3.ap-southeast-1.amazonaws.com/cam-nang-viec-lam/wp-content/uploads/2023/06/07090433/lazada.jpg';
            let imgTitle = ''
            let imgAlt = '';

            if (!!post._embedded && !!post._embedded['wp:featuredmedia'] && post._embedded['wp:featuredmedia'].length > 0) {
                if (!!post._embedded['wp:featuredmedia'][0]['source_url'])
                    imgLink = post._embedded['wp:featuredmedia'][0]['source_url'];
                if (!!post._embedded['wp:featuredmedia'][0]['title'])
                    imgTitle = post._embedded['wp:featuredmedia'][0]['title']['rendered'] || ''
                imgAlt = post._embedded['wp:featuredmedia'][0]['alt_text'] || ''
            }

            return [imgLink, imgTitle, imgAlt]
        }, [post]
    );    

    return (
        <a
            className="news-wrapper cursor-pointer"
            href={post?.canonical_url}
            target="_blank"
        >
            <div
                className="text-truncate-new"
                dangerouslySetInnerHTML={{ __html: post?.title || '' }}
            />
            <div className="new-image-wrapper">
                <img
                    className="new-image"
                    src={post?.feature_image || 'https://cl-wpml.s3.ap-southeast-1.amazonaws.com/cam-nang-viec-lam/wp-content/uploads/2023/06/07090433/lazada.jpg'}
                    title={postImgTitle}
                    alt={postImgAlt}
                />
            </div>
            <div className="d-flex justify-content-end">
                <span className="text-secondary-custom fs-14">
                    {!!post?.updated_at ? dayjs(post?.updated_at).format('DD/MM/YYYY HH:mm') : ''}
                </span>
            </div>
        </a>
    )
};

export default memo(BlockNew);