import nodemailer from "nodemailer-v10";
import type { SentMessageInfo, Transporter } from "nodemailer-v10";
import type { AlertCondition } from "@/types";

interface MailConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  from: string;
}

export interface AlertEmailPayload {
  recipientEmail: string;
  cryptoName: string;
  cryptoSymbol: string;
  currentPrice: number;
  targetPrice: number;
  condition: AlertCondition;
  triggeredAt: Date;
}

export interface SendAlertEmailResult {
  messageId: string;
}

let cachedTransporter: Transporter<SentMessageInfo> | null = null;

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "medium",
});

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const getRequiredEnv = (key: string): string => {
  const value = process.env[key]?.trim();

  if (!value) {
    throw new Error(`${key} is required to send alert emails.`);
  }

  return value;
};

const getMailConfig = (): MailConfig => {
  const port = Number(getRequiredEnv("EMAIL_SERVER_PORT"));

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error("EMAIL_SERVER_PORT must be a valid port number.");
  }

  return {
    host: getRequiredEnv("EMAIL_SERVER_HOST"),
    port,
    user: getRequiredEnv("EMAIL_SERVER_USER"),
    password: getRequiredEnv("EMAIL_SERVER_PASSWORD"),
    from: getRequiredEnv("EMAIL_FROM"),
  };
};

const getTransporter = (): Transporter<SentMessageInfo> => {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  const config = getMailConfig();

  cachedTransporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: {
      user: config.user,
      pass: config.password,
    },
  });

  return cachedTransporter;
};

const getConditionText = (condition: AlertCondition): string =>
  condition === "above" ? "above" : "below";

export const createAlertEmailHtml = (payload: AlertEmailPayload): string => {
  const cryptoLabel = `${payload.cryptoName} (${payload.cryptoSymbol.toUpperCase()})`;
  const condition = getConditionText(payload.condition);
  const currentPrice = currencyFormatter.format(payload.currentPrice);
  const targetPrice = currencyFormatter.format(payload.targetPrice);
  const timestamp = dateFormatter.format(payload.triggeredAt);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>CryptoWatch price alert</title>
  </head>
  <body style="margin:0;background:#f4f4f5;color:#18181b;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f5;padding:28px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #e4e4e7;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:24px 24px 16px;border-bottom:1px solid #e4e4e7;">
                <p style="margin:0 0 8px;color:#047857;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">CryptoWatch Alert</p>
                <h1 style="margin:0;color:#18181b;font-size:24px;line-height:1.25;">${escapeHtml(
                  cryptoLabel,
                )} moved ${escapeHtml(condition)} your target</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:24px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="padding:12px 0;color:#71717a;font-size:14px;">Current price</td>
                    <td align="right" style="padding:12px 0;color:#18181b;font-size:16px;font-weight:700;">${escapeHtml(
                      currentPrice,
                    )}</td>
                  </tr>
                  <tr>
                    <td style="padding:12px 0;color:#71717a;font-size:14px;border-top:1px solid #f4f4f5;">Target price</td>
                    <td align="right" style="padding:12px 0;color:#18181b;font-size:16px;font-weight:700;border-top:1px solid #f4f4f5;">${escapeHtml(
                      targetPrice,
                    )}</td>
                  </tr>
                  <tr>
                    <td style="padding:12px 0;color:#71717a;font-size:14px;border-top:1px solid #f4f4f5;">Condition</td>
                    <td align="right" style="padding:12px 0;color:#18181b;font-size:16px;font-weight:700;border-top:1px solid #f4f4f5;text-transform:capitalize;">${escapeHtml(
                      condition,
                    )}</td>
                  </tr>
                  <tr>
                    <td style="padding:12px 0;color:#71717a;font-size:14px;border-top:1px solid #f4f4f5;">Timestamp</td>
                    <td align="right" style="padding:12px 0;color:#18181b;font-size:16px;font-weight:700;border-top:1px solid #f4f4f5;">${escapeHtml(
                      timestamp,
                    )}</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};

export const createAlertEmailText = (payload: AlertEmailPayload): string => {
  const condition = getConditionText(payload.condition);

  return [
    "CryptoWatch price alert",
    `${payload.cryptoName} (${payload.cryptoSymbol.toUpperCase()}) is ${condition} your target.`,
    `Current price: ${currencyFormatter.format(payload.currentPrice)}`,
    `Target price: ${currencyFormatter.format(payload.targetPrice)}`,
    `Condition: ${condition}`,
    `Timestamp: ${dateFormatter.format(payload.triggeredAt)}`,
  ].join("\n");
};

export const sendAlertEmail = async (
  payload: AlertEmailPayload,
): Promise<SendAlertEmailResult> => {
  const config = getMailConfig();
  const transporter = getTransporter();
  const subject = `CryptoWatch alert: ${payload.cryptoName} is ${getConditionText(
    payload.condition,
  )} ${currencyFormatter.format(payload.targetPrice)}`;
  const info = await transporter.sendMail({
    from: config.from,
    to: payload.recipientEmail,
    subject,
    text: createAlertEmailText(payload),
    html: createAlertEmailHtml(payload),
  });

  return {
    messageId: info.messageId,
  };
};
