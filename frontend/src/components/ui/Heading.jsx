// Every Heading, the site Brand name, and every page/section Title MUST go through
// this component. It's the single place that owns "font + color for headings" —
// change it here and it changes everywhere, and no other component should
// hand-roll heading styles or mix colors within one heading string.
export default function Heading({ as: Tag = "h2", className = "", children, ...props }) {
  return (
    <Tag className={`heading ${className}`} {...props}>
      {children}
    </Tag>
  );
}
