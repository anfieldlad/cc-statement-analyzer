import { AlertIcon } from "./icons";

interface ErrorMessageProps {
  children: React.ReactNode;
}

export function ErrorMessage({ children }: ErrorMessageProps) {
  return (
    <div className="error-message" role="alert">
      <AlertIcon width={16} height={16} />
      <span>{children}</span>
    </div>
  );
}
