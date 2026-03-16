import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { useSettingsStore } from "../../stores/settingsStore";
import { usePRDetailStore } from "../../stores/prDetailStore";
import { useIssueDetailStore } from "../../stores/issueDetailStore";
import { parseGitHubUrl } from "../../lib/githubUrl";

interface MarkdownBodyProps {
  content: string;
  className?: string;
}

/**
 * Renders GitHub-flavored markdown with proper styling.
 * Supports tables, task lists, strikethrough, autolinks, and raw HTML.
 * Intercepts GitHub PR/issue links when the setting is enabled.
 */
export function MarkdownBody({ content, className = "" }: MarkdownBodyProps) {
  const interceptLinks = useSettingsStore((s) => s.interceptGitHubLinks);
  const inlinePRView = useSettingsStore((s) => s.inlinePRView);
  const openPR = usePRDetailStore((s) => s.openPR);
  const openIssue = useIssueDetailStore((s) => s.openIssue);

  if (!content) return null;

  const handleLinkClick = (href: string) => {
    if ((interceptLinks || inlinePRView) && href) {
      const parsed = parseGitHubUrl(href);
      if (parsed) {
        const fullRepo = `${parsed.owner}/${parsed.repo}`;
        if (parsed.type === "pull") {
          openPR(fullRepo, parsed.number);
          return;
        }
        if (parsed.type === "issues") {
          openIssue(fullRepo, parsed.number);
          return;
        }
      }
    }
    if (href) window.api.openExternal(href);
  };

  return (
    <div className={`prose-triage ${className}`}>
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          a: ({ children, href, ...props }) => (
            <a
              {...props}
              href={href}
              onClick={(e) => {
                e.preventDefault();
                if (href) handleLinkClick(href);
              }}
              className="text-[var(--color-blue)] hover:underline cursor-pointer"
            >
              {children}
            </a>
          ),
          code: ({ children, className: codeClass, ...props }) => {
            const isInline = !codeClass;
            if (isInline) {
              return (
                <code
                  {...props}
                  className="rounded bg-[var(--color-bg-overlay)] px-1 py-0.5 text-[12px] font-mono text-[var(--color-fg-secondary)]"
                >
                  {children}
                </code>
              );
            }
            return (
              <code {...props} className={`block text-[12px] font-mono ${codeClass || ""}`}>
                {children}
              </code>
            );
          },
          pre: ({ children, ...props }) => (
            <pre
              {...props}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-inset)] p-3 overflow-x-auto text-[12px] leading-relaxed"
            >
              {children}
            </pre>
          ),
          img: ({ src, alt, ...props }) => (
            <img
              {...props}
              src={src}
              alt={alt}
              className="max-w-full rounded-lg border border-[var(--color-border)]"
              loading="lazy"
            />
          ),
          table: ({ children, ...props }) => (
            <div className="overflow-x-auto">
              <table
                {...props}
                className="w-full text-[12px] border-collapse border border-[var(--color-border)]"
              >
                {children}
              </table>
            </div>
          ),
          th: ({ children, ...props }) => (
            <th
              {...props}
              className="border border-[var(--color-border)] bg-[var(--color-bg-inset)] px-3 py-1.5 text-left text-[11px] font-semibold text-[var(--color-fg-secondary)]"
            >
              {children}
            </th>
          ),
          td: ({ children, ...props }) => (
            <td {...props} className="border border-[var(--color-border)] px-3 py-1.5 text-[12px]">
              {children}
            </td>
          ),
          input: ({ type, checked, ...props }) => {
            if (type === "checkbox") {
              return (
                <input
                  {...props}
                  type="checkbox"
                  checked={checked}
                  disabled
                  className="mr-1.5 accent-[var(--color-blue)]"
                />
              );
            }
            return <input {...props} type={type} />;
          },
          blockquote: ({ children, ...props }) => (
            <blockquote
              {...props}
              className="border-l-2 border-[var(--color-border-strong)] pl-3 text-[var(--color-fg-muted)] italic"
            >
              {children}
            </blockquote>
          ),
          hr: (props) => <hr {...props} className="border-t border-[var(--color-border)] my-4" />,
        }}
      >
        {content}
      </Markdown>
    </div>
  );
}
