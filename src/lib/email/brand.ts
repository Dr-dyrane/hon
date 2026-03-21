import "server-only";

import { serverEnv } from "../config/server";

/**
 * Builds a refined email header using the brand mark and wordmark.
 * Uses images with public URLs for maximum email client compatibility.
 */
export function buildEmailBrandLockup() {
  const appUrl = serverEnv.public.appUrl.replace(/\/$/, "");
  const markUrl = `${appUrl}/images/hero/hop-mark.svg`;

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;border-collapse:collapse;">
      <tr>
        <td style="padding:0 12px 0 0;vertical-align:middle;">
          <img 
            src="${markUrl}" 
            alt="H" 
            width="32" 
            height="32" 
            style="display:block;width:32px;height:32px;" 
          />
        </td>
        <td style="vertical-align:middle;">
          <div style="font-size:10px;line-height:1;letter-spacing:0.25em;text-transform:uppercase;font-weight:700;color:#6b7280;margin-bottom:4px;">
            House of
          </div>
          <div style="font-size:20px;line-height:1;letter-spacing:0.2em;text-transform:uppercase;font-weight:900;color:#111827;">
            Prax
          </div>
        </td>
      </tr>
    </table>
  `;
}
