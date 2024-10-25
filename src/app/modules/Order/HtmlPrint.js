import dayjs from 'dayjs';
import React, { useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';

const HtmlPrint = ({ setNamePrint, html, setHtml, namePrint, pageStyle = `` }) => {
    const componentRef = React.useRef();
    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
        documentTitle: `${namePrint}_${dayjs().format('DDMMYYYY')}_${dayjs().format('HHmm')}`,
        pageStyle,
    });

    useEffect(() => {
        if (html) {
            handlePrint()
            setHtml('')
            setNamePrint('')
        }
        return () => {
            //remove khi component unmounted
            setNamePrint('')
            setHtml('')
            componentRef.current = null
        }
    }, [html]);
    return (
        <>
            <div>
                <div style={{ display: 'none' }}>
                    <div className='print-upbase' ref={componentRef} dangerouslySetInnerHTML={{ __html: html }} />
                </div>
            </div>
        </>
    );
};

export default HtmlPrint;