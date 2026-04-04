import QRCode from 'qrcode';

const generateUPIQR = async (upiId, amount, orderNumber) => {
  const upiString = `upi://pay?pa=${upiId}&pn=OdooCafe&am=${amount}&tn=${orderNumber}&cu=INR`;
  const qrDataURL = await QRCode.toDataURL(upiString, { width: 300, margin: 2 });
  return qrDataURL;
};

export default generateUPIQR;
