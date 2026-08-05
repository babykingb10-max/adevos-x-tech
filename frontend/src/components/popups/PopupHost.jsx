import { usePopup } from "../../context/PopupContext";
import UpdatesPopup from "./UpdatesPopup";
import TutorialsPopup from "./TutorialsPopup";
import FeedbackPopup from "./FeedbackPopup";
import PlanSelectPopup from "./PlanSelectPopup";

export default function PopupHost() {
  const { popup, close } = usePopup();
  if (!popup) return null;

  switch (popup.key) {
    case "updates":
      return <UpdatesPopup onClose={close} />;
    case "tutorials":
      return <TutorialsPopup onClose={close} />;
    case "feedback":
      return <FeedbackPopup onClose={close} defaultCategory={popup.payload?.category} />;
    case "plan_select":
      return <PlanSelectPopup onClose={close} />;
    default:
      // Falls back gracefully for any tutorial:xxx / unmapped key so a stray
      // destination string never crashes the UI — extend the switch as needed.
      return null;
  }
}
