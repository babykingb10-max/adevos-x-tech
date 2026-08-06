import {
  FaCode, FaWhatsapp, FaTelegram, FaRocket, FaBrain, FaShieldAlt,
  FaCoins, FaMoneyBillWave, FaCreditCard, FaPaypal, FaTwitter, FaFacebook,
  FaInstagram, FaYoutube, FaTiktok, FaUsers, FaGift, FaKey, FaGraduationCap,
  FaEnvelope, FaGlobe, FaGithub, FaHeadset, FaStar, FaBell, FaHome,
  FaCloudUploadAlt, FaUserCircle, FaCommentDots, FaBolt, FaTachometerAlt,
  FaNewspaper, FaCog, FaRobot, FaPaperPlane,
} from "react-icons/fa";

// key -> { label, Icon } — the single source of truth for every icon used
// across the public site AND the Admin App's icon pickers. Add new icons
// here once and they become selectable everywhere a field type is "icon".
export const ICON_REGISTRY = {
  code: { label: "Code / Web Dev", Icon: FaCode },
  whatsapp: { label: "WhatsApp", Icon: FaWhatsapp },
  telegram: { label: "Telegram", Icon: FaTelegram },
  rocket: { label: "Rocket / Deployment", Icon: FaRocket },
  brain: { label: "Brain / AI", Icon: FaBrain },
  shield: { label: "Shield / Security", Icon: FaShieldAlt },
  coin: { label: "Coin", Icon: FaCoins },
  banknote: { label: "Banknote / Manual pay", Icon: FaMoneyBillWave },
  "credit-card": { label: "Credit card", Icon: FaCreditCard },
  paypal: { label: "PayPal", Icon: FaPaypal },
  twitter: { label: "Twitter / X", Icon: FaTwitter },
  facebook: { label: "Facebook", Icon: FaFacebook },
  instagram: { label: "Instagram", Icon: FaInstagram },
  youtube: { label: "YouTube", Icon: FaYoutube },
  tiktok: { label: "TikTok", Icon: FaTiktok },
  community: { label: "Community", Icon: FaUsers },
  gift: { label: "Gift / Free", Icon: FaGift },
  key: { label: "Key", Icon: FaKey },
  "graduation-cap": { label: "Graduation cap", Icon: FaGraduationCap },
  email: { label: "Email", Icon: FaEnvelope },
  website: { label: "Website / Globe", Icon: FaGlobe },
  github: { label: "GitHub", Icon: FaGithub },
  support: { label: "Headset / Support", Icon: FaHeadset },
  star: { label: "Star", Icon: FaStar },
  bell: { label: "Bell / Updates", Icon: FaBell },
  home: { label: "Home", Icon: FaHome },
  "cloud-upload": { label: "Cloud upload / Deployment", Icon: FaCloudUploadAlt },
  "user-circle": { label: "User circle / Account", Icon: FaUserCircle },
  "message-square": { label: "Message / Feedback", Icon: FaCommentDots },
  bolt: { label: "Bolt / Action", Icon: FaBolt },
  dashboard: { label: "Dashboard", Icon: FaTachometerAlt },
  newspaper: { label: "Newspaper / News", Icon: FaNewspaper },
  settings: { label: "Settings / Manage", Icon: FaCog },
  bot: { label: "Bot", Icon: FaRobot },
  send: { label: "Send / Paper plane", Icon: FaPaperPlane },
};

// Safe getter — falls back to a generic bolt icon so an unknown/blank key
// never crashes rendering (e.g. an old seed value that predates a new icon).
export function getIcon(key) {
  return ICON_REGISTRY[key]?.Icon || FaBolt;
}

export function IconByKey({ name, ...props }) {
  const Icon = getIcon(name);
  return <Icon {...props} />;
}

// For Admin <select> pickers: [{ value, label }]
export const ICON_OPTIONS = Object.entries(ICON_REGISTRY).map(([value, { label }]) => ({
  value,
  label,
}));
