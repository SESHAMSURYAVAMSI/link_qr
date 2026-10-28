
import QRCode from "qrcode";

export async function generateQRCode(
  value: string,
  color: string = "#241000",
  backgroundColor: string = "#FFFFFF",
  size: number = 512,
): Promise<string> {
  if (!value.trim()) {
    throw new Error("Please enter some text or a URL.");
  }

  return QRCode.toDataURL(value.trim(), {
    width: size,
    margin: 3,
    errorCorrectionLevel: "H",
    color: {
      dark: color,
      light: backgroundColor,
    },
  });
}

export function downloadQRCode(
  dataUrl: string,
  filename: string = "qr-studio.png",
): void {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
