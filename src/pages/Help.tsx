import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import userGuideMd from "../../docs/user_guide.md?raw";

/** After markdown paints, scroll to #hash (SPA deep links + TOC). */
function useScrollToHash() {
  const { hash } = useLocation();

  useEffect(() => {
    const raw = hash?.replace(/^#/, "") ?? "";
    if (!raw) return;

    const id = decodeURIComponent(raw);
    let frames = 0;
    const maxFrames = 30;

    const tick = () => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      if (frames++ < maxFrames) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [hash]);
}

/**
 * In-app user guide (renders docs/user_guide.md as styled HTML).
 */
export default function Help() {
  useScrollToHash();

  return (
    <div className="container container-app p-4">
      <h1 className="app-shell-page-title mb-4">Help</h1>
      <div className="help-page">
        <article className="help-markdown">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeSlug]}
          >
            {userGuideMd}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  );
}
