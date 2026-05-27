import crypto from "crypto";

const MERCHANT_CODE = process.env.FAWRY_MERCHANT_CODE!;
const SECURITY_KEY  = process.env.FAWRY_SECURITY_KEY!;
const API_URL       = process.env.FAWRY_API_URL!;

// ─── Build Fawry signature ────────────────────────────
function buildSignature(params: Record<string, string>): string {
  const raw = Object.values(params).join("") + SECURITY_KEY;
  return crypto.createHash("sha256").update(raw).digest("hex");
}

// ─── Initiate Fawry charge ────────────────────────────
export async function initiateFawryCharge(params: {
  userId:    string;
  amount:    number;
  phone:     string;
  txId:      string;
}) {
  const merchantRefNum = `NJR-${params.txId}-${Date.now()}`;
  const chargeItems = [{
    itemId:      "WALLET_TOPUP",
    description: "شحن محفظة النجار",
    price:       params.amount.toFixed(2),
    quantity:    "1",
  }];

  const signatureParams = {
    merchantCode:   MERCHANT_CODE,
    merchantRefNum: merchantRefNum,
    customerMobile: params.phone,
    paymentMethod:  "PAYATFAWRY",
    amount:         params.amount.toFixed(2),
    itemId:         "WALLET_TOPUP",
    price:          params.amount.toFixed(2),
    quantity:       "1",
  };

  const signature = buildSignature(signatureParams);

  const body = {
    merchantCode,
    merchantRefNum,
    customerMobile: params.phone,
    paymentMethod:  "PAYATFAWRY",
    amount:         params.amount,
    currencyCode:   "EGP",
    description:    "شحن محفظة منصة النجار",
    chargeItems,
    signature,
  };

  const res = await fetch(`${API_URL}/charge/request`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  });

  if (!res.ok) throw new Error("فشل الاتصال بفوري");

  const data = await res.json();
  return {
    referenceNumber: data.referenceNumber as string,
    merchantRefNum:  merchantRefNum,
    expiryDate:      data.paymentExpiryDate as string,
    amount:          params.amount,
  };
}

// ─── Check Fawry payment status ───────────────────────
export async function checkFawryStatus(merchantRefNum: string) {
  const signature = buildSignature({
    merchantCode:   MERCHANT_CODE,
    merchantRefNum: merchantRefNum,
  });

  const url = `${API_URL}/charge/status?merchantCode=${MERCHANT_CODE}&merchantRefNum=${merchantRefNum}&signature=${signature}`;
  const res = await fetch(url);

  if (!res.ok) throw new Error("فشل الاستعلام عن حالة الدفع");

  const data = await res.json();
  return {
    status:        data.paymentStatus as string,   // PAID | UNPAID | EXPIRED
    referenceNum:  data.referenceNumber as string,
    amount:        data.paymentAmount as number,
  };
}
