import SyntaxHighlighter from 'react-syntax-highlighter';
import { a11yDark } from 'react-syntax-highlighter/dist/cjs/styles/hljs';

export default function Code({ children, codeClass, className }) {
  if (className) {
    return (
      <SyntaxHighlighter
        language={className.slice(9)}
        children={children}
        className={codeClass}
        style={a11yDark}
      ></SyntaxHighlighter>
    );
  }
  return <code children={children} className={codeClass} style={{ 'background-color': '#2B2B2B' }}></code>;
}
