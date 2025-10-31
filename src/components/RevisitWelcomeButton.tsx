import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser } from "../services/api";

export default function RevisitWelcomeButton() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    (async () => {
      try {
        const me = await getCurrentUser(token);
        setUserId(me.id);
      } catch {
        // silently fail — not critical
      }
    })();
  }, []);

  const handleRevisit = () => {
    const key = userId ? `has_seen_welcome:${userId}` : "has_seen_welcome";
    localStorage.removeItem(key);
    navigate("/welcome");
  };

  return (
    <button className="dropdown-item" type="button" onClick={handleRevisit}>
      🧭 Revisit Welcome Page
    </button>
  );
}