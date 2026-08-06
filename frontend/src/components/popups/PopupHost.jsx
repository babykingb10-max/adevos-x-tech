import { usePopup } from "../../context/PopupContext";
import UpdatesPopup from "./UpdatesPopup";
import TutorialsPopup from "./TutorialsPopup";
import FeedbackPopup from "./FeedbackPopup";
import PlanSelectPopup from "./PlanSelectPopup";
import AccountPopup from "./AccountPopup";
import MyPaymentsPopup from "./MyPaymentsPopup";

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
    case "account":
      return <AccountPopup onClose={close} />;
    case "my_payments":
      return <MyPaymentsPopup onClose={close} />;
    default:
      return null;
  }
}
