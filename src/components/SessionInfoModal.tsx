import useSessionTimeLeft from "../hooks/useSessionTimeLeft";

export default function SessionInfoModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { mmss, expiresAt, expired, pct } = useSessionTimeLeft();

  if (!open) return null;

  return (
    <div
      className="modal fade show"
      style={{ display: "block", background: "rgba(0,0,0,0.35)" }}
      aria-modal="true"
      role="dialog"
    >
      <div className="modal-dialog modal-sm modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h6 className="modal-title mb-0">Session info</h6>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>

          <div className="modal-body">
            <div className="mb-2 small text-muted">Time remaining</div>
            <div className={`fs-4 ${expired ? "text-danger" : ""}`}>
              {expired ? "Expired" : mmss || "—"}
            </div>

            <div className="progress my-3" style={{ height: 8 }}>
              <div
                className="progress-bar"
                role="progressbar"
                style={{ width: `${pct}%` }}
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>

            <div className="small">
              <div className="text-muted">Expires at</div>
              <div>{expiresAt || "—"}</div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}