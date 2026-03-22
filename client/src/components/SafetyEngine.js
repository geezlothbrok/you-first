import { useEffect } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "../redux/slices/authSlice";
import { useSOSTrigger } from "../hooks/useSosTrigger";
import { useInactivityDetector, registerNotificationCategories } from "../hooks/useInactivityDetector";
import { useFallDetector, registerFallNotificationCategory } from "../hooks/useFallDetector";
import { requestCriticalPermissions } from "../hooks/useSosTrigger";

export default function SafetyEngine({ enabled = true }) {
  const user = useSelector(selectUser);
  const userName = user?.fullName || "VitaTrack User";
  const { triggerSOS } = useSOSTrigger();

  // Request critical alert permissions + register notification categories
  // This must happen once when the safety engine mounts
  useEffect(() => {
    const setup = async () => {
      await requestCriticalPermissions();
      await registerNotificationCategories();
      await registerFallNotificationCategory();
    };
    setup();
  }, []);

  // Inactivity detection
  const { recordActivity } = useInactivityDetector({
    onSOSTrigger: triggerSOS,
    userName,
    enabled,
  });

  // Fall detection
  const { fallDetected } = useFallDetector({
    onFallDetected: () => console.log("[SafetyEngine] Fall detected"),
    onSOSTrigger: triggerSOS,
    userName,
    enabled,
  });

  return null;
}