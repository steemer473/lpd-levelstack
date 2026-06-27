/** Hardcoded hub asset URLs for email HTML — never use getAppUrl() for images in email. */
export const EMAIL_LOGO = {
  url: "https://levelplaydigital.com/images/logo.png",
  width: 280,
  height: 73,
  alt: "Level Play Digital",
} as const

/** Matches logo.png black background for seamless header rendering in email clients. */
export const EMAIL_HEADER_BG = "#000000"
