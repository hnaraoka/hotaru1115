export function FieldErrorText({ messages }: { messages: string[] }) {
  if (messages.length === 0) return null;
  return <span className="field-error-text">{messages.join(" / ")}</span>;
}

export function ReferenceField({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string | undefined;
  onCopy: () => void;
}) {
  if (!value) return null;
  return (
    <details className="reference-panel">
      <summary>{label}を見る（参考）</summary>
      <div className="reference-panel-body">
        <pre className="reference-panel-text">{value}</pre>
        <button type="button" className="btn btn-secondary" onClick={onCopy}>
          この内容をコピー
        </button>
      </div>
    </details>
  );
}
