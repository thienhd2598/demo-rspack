const ORIGIN_WIDTH_FRAME = 1200;
const ORIGIN_HEIGHT_FRAME = 1200;

const convertDataUriToFile = (dataUri, fileName) => {
    const byteString = atob(dataUri.split(',')[1]);
    const mimeString = dataUri.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: mimeString });    
    const file = new File([blob], fileName, { type: mimeString });

    return file;
};

export { convertDataUriToFile, ORIGIN_HEIGHT_FRAME, ORIGIN_WIDTH_FRAME };