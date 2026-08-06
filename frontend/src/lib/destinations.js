// Every valid internal destination in the app, used to populate Admin
// dropdown pickers (Hero Slider action, InTouch card action, Menu item
// destination) so an admin can never save a typo'd/broken destination.
export const INTERNAL_ROUTES = [
  { value: "/", label: "Homepage" },
  { value: "/av-coins", label: "AV Coins page" },
  { value: "/bots?plan=user", label: "Available bots (User plan)" },
  { value: "/bots?plan=deployer", label: "Available bots (Deployer plan)" },
  { value: "/bot-management", label: "Bot management page" },
  { value: "/payment?plan=user", label: "Payment page (User plan)" },
  { value: "/payment?plan=deployer", label: "Payment page (Deployer plan)" },
  { value: "/sign-in", label: "Sign in page" },
  { value: "#support", label: "Support section (homepage anchor)" },
];

export const POPUP_DESTINATIONS = [
  { value: "popup:updates", label: "Popup: Updates" },
  { value: "popup:tutorials", label: "Popup: Tutorials" },
  { value: "popup:feedback", label: "Popup: Feedback" },
  { value: "popup:plan_select", label: "Popup: Choose a plan" },
  { value: "popup:account", label: "Popup: My Account" },
  { value: "popup:my_payments", label: "Popup: My Payments" },
  { value: "smart:deploy", label: "Smart action: Deploy bot (routes based on user's plan)" },
];

export const ALL_DESTINATIONS = [...INTERNAL_ROUTES, ...POPUP_DESTINATIONS];
