import QRCode from "qrcode";
export async function makeQrDataUrl(text) {
  return QRCode.toDataURL(text, { margin: 1, width: 256 });
}
