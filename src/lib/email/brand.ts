import "server-only";

function buildBrandMarkSvg() {
  return `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width="28"
      height="28"
      role="img"
      aria-label="House of Prax"
      style="display:block;width:28px;height:28px;color:#111827;"
    >
      <g
        fill="none"
        stroke="currentColor"
        stroke-width="5"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M50 10 L85 30 V55 C85 75 70 90 50 95 C30 90 15 75 15 55 V30 Z" />
        <path d="M50 25 V75" />
        <path d="M50 45 C40 40 35 35 30 30" />
        <path d="M50 55 C60 50 65 45 70 40" />
      </g>
    </svg>
  `;
}

export function buildEmailBrandLockup() {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:22px;border-collapse:collapse;">
      <tr>
        <td style="padding:0 12px 0 0;vertical-align:middle;">
          ${buildBrandMarkSvg()}
        </td>
        <td style="vertical-align:middle;">
          <div style="font-size:11px;line-height:1;letter-spacing:0.2em;text-transform:uppercase;font-weight:800;color:#111827;">
            House of
          </div>
          <div style="margin-top:5px;font-size:16px;line-height:1;letter-spacing:0.24em;text-transform:uppercase;font-weight:900;color:#111827;">
            Prax
          </div>
        </td>
      </tr>
    </table>
  `;
}
