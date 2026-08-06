import api from "../api/client";

// Decides where "Deploy bot" should send the user:
//   - not signed in            -> /sign-in
//   - no active plan/package   -> plan_select popup (then payment)
//   - active User plan         -> Available bots (user), or Bot management
//                                  if they already have an active deployment
//   - active Deployer plan     -> Available bots (deployer) — always allowed
//                                  to deploy more
export async function resolveSmartDeploy({ user, navigate, openPopup }) {
  if (!user) {
    navigate("/sign-in");
    return;
  }

  const hasValidPackage =
    user.activePackage?.expiresAt && new Date(user.activePackage.expiresAt) > new Date();

  if (!hasValidPackage || user.plan === "not_configured") {
    openPopup("plan_select");
    return;
  }

  if (user.plan === "deployer") {
    navigate("/bots?plan=deployer");
    return;
  }

  // User plan: check whether they already have an active deployment
  try {
    const { data } = await api.get("/deployment/mine");
    const active = data.find((d) => ["queued", "building", "active"].includes(d.status));
    if (active) {
      navigate("/bot-management");
    } else {
      navigate("/bots?plan=user");
    }
  } catch {
    navigate("/bots?plan=user");
  }
}
