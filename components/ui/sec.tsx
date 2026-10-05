export function Sec({ title, action, href }: { title: string; action?: string; href?: string }) {
  return (
    <div className="sec">
      <h2>{title}</h2>
      {action && href && (
        <a className="more" href={href}>{action}</a>
      )}
    </div>
  );
}
