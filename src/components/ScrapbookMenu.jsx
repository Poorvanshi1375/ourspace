//ScarpbookMenu.jsx
import { useNavigate } from "react-router-dom";

export default function ScrapbookMenu({
  open,
  onClose,
  onChat,
  onAddText,
  onAddPhoto,
  onAddVideo,
  onAddLetter,
  onAddDocument,
}) {
  const navigate = useNavigate();

  if (!open) return null;

  return (
    <>
      <div className="scrapbook-menu-backdrop" onClick={onClose} />

      <div className="scrapbook-menu">
        {/* HEADER */}
        <div className="menu-header">
          <span className="menu-title">Menu</span>
          <button className="menu-close" onClick={onClose}>✕</button>
        </div>

        {/* MENU LIST */}
        <div className="menu-list">

          <div
            className="menu-row"
            onClick={() => {
              onClose();
              navigate("/dashboard");
            }}
          >
            ← Back to Dashboard
          </div>

          <div className="menu-row" onClick={onChat}>
            Chat
          </div>

          <div className="menu-row" onClick={onAddText}>
            Add text memory
          </div>

          <div className="menu-row" onClick={onAddPhoto}>
            Upload photo
          </div>

          <div className="menu-row" onClick={onAddVideo}>
            Upload video
          </div>

          <div className="menu-row" onClick={onAddDocument}>
            Upload document
          </div>

          <div className="menu-row" onClick={onAddLetter}>
            Write letter
          </div>

        </div>

      </div>
    </>
  );
}
