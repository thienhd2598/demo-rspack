import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

function MyPDFViewer() {
    const [numPages, setNumPages] = useState(null);
    const [htmlContent, setHtmlContent] = useState('');

    useEffect(() => {
        // Gọi API để lấy nội dung HTML
        fetch('your-api-endpoint')
            .then(response => response.text())
            .then(html => setHtmlContent(html))
            .catch(error => console.error(error));
    }, []);

    const onDocumentLoadSuccess = ({ numPages }) => {
        setNumPages(numPages);
    };

    return (
        <div>
            {htmlContent && (
                <Document
                    file={{
                        data: `<html>
          <body>
          <p><span style="font-size:20pt"><span style="font-family:'Times New Roman'"><span style="color:#000000"><strong>Phiếu xuất kho&nbsp;</strong></span></span></span></p>
          
          <table border="0" cellpadding="1" cellspacing="1" style="width:100%; ">
              <tbody>
              <tr>
                  <td><span style="font-size:12pt"><span style="font-family:'Times New Roman'"><span style="color:#000000">M&atilde; phiếu:</span></span></span></td>
                  <td style="text-align:right"><span style="font-size:12pt"><span style="font-family:'Times New Roman'"><span style="color:#000000">Số lượng h&agrave;ng ho&aacute;: </span></span></span></td>
              </tr>
              <tr>
                  <td><span style="font-size:12pt"><span style="font-family:'Times New Roman'"><span style="color:#000000">Kho:&nbsp;</span></span></span></td>
                  <td style="text-align:right"><span style="font-size:12pt"><span style="font-family:'Times New Roman'"><span style="color:#000000">Tổng số lượng xuất kho: b</span></span></span></td>
              </tr>
              <tr>
                  <td><span style="font-size:12pt"><span style="font-family:'Times New Roman'"><span style="color:#000000">H&igrave;nh thức xuất kho:&nbsp;</span></span></span></td>
                  <td>&nbsp;</td>
              </tr>
              <tr>
                  <td><span style="font-size:12pt"><span style="font-family:'Times New Roman'"><span style="color:#000000">Ng&agrave;y in phiếu : dd/mm/yyyy hh:mm</span></span></span></td>
                  <td>&nbsp;</td>
              </tr>
              </tbody>
          </table>
          
          <p>&nbsp;</p>
          
          <table border="1" cellpadding="1" cellspacing="1" style="width:100%; border: 1px solid black;border-collapse: collapse;">
              <tbody>
              <tr>
                  <td><span style="font-size:12pt"><span style="font-family:'Times New Roman'"><span style="color:#000000"><strong>Th&ocirc;ng tin sản phẩm</strong></span></span></span></td>
                  <td><span style="font-size:12pt"><span style="font-family:'Times New Roman'"><span style="color:#000000"><strong>SKU h&agrave;ng ho&aacute;</strong></span></span></span></td>
                  <td><span style="font-size:12pt"><span style="font-family:'Times New Roman'"><span style="color:#000000"><strong>Số lượng</strong></span></span></span></td>
              </tr>
              <tr>
                  <td><span style="font-size:12pt"><span style="font-family:'Times New Roman'"><span style="color:#000000"><strong>ID: M&atilde; đơn h&agrave;ng &nbsp; &nbsp; &nbsp; </strong></span></span></span></td>
                  <td colspan="2"><span style="font-size:12pt"><span style="font-family:'Times New Roman'"><span style="color:#000000"><strong>T&ecirc;n ĐVVC (#M&atilde; vận đơn) </strong></span></span></span></td>
          
              </tr>
              <tr>
                  <td><span style="font-size:12pt"><span style="font-family:'Times New Roman'"><span style="color:#000000"><strong>H&igrave;nh ảnh sản phẩm + T&ecirc;n sản phẩm </strong></span></span></span></td>
                  <td><span style="font-size:12pt"><span style="font-family:'Times New Roman'"><span style="color:#000000"><strong>M&atilde; SKU h&agrave;ng ho&aacute; + Tổ hợp GTPL </strong></span></span></span></td>
                  <td><span style="font-size:12pt"><span style="font-family:'Times New Roman'"><span style="color:#000000"><strong>Số lượng (In đậm + khoanh tr&ograve;n &gt;1)</strong></span></span></span></td>
              </tr>
              </tbody>
          </table>
          
          <p style="text-align:right">Icon s&agrave;n + T&ecirc;n gian h&agrave;ng</p>
          
          <p>&nbsp;</p>
          
          <p><span style="font-size:12pt"><span style="font-family:'Times New Roman'"><span style="color:#000000"><strong>Ghi ch&uacute;: </strong></span></span></span><span style="font-size:12pt"><span style="font-family:'Times New Roman'"><span style="color:#000000">&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;.&hellip;.</span></span></span></p>
          
          </body>
          
          </html>
          ` }}
                    onLoadSuccess={onDocumentLoadSuccess}
                    options={{ workerSrc: '//cdnjs.cloudflare.com/ajax/libs/pdf.js/2.8.335/pdf.worker.js' }}
                    externalLinkTarget="_blank"
                >
                    {Array.from(
                        new Array(numPages),
                        (el, index) => (
                            <Page key={`page_${index + 1}`} pageNumber={index + 1} />
                        ),
                    )}
                </Document>
            )}
        </div>
    );
}

export default MyPDFViewer;