import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import userGuideMd from "../../docs/user_guide.md?raw";

/**
 * In-app user guide (renders docs/user_guide.md as styled HTML).
 */
export default function Help() {
  return (
    <div className="container container-app p-4">
      <h1 className="app-shell-page-title mb-4">Help</h1>
      <div className="help-page">
        <article className="help-markdown">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{userGuideMd}</ReactMarkdown>
        </article>
      </div>
    </div>
  );
}
