import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface LoadingDialogProps {
  isOpen?: boolean;
  message?: string;
}

export default function LoadingDialog({ isOpen = true, message = "Loading..." }: LoadingDialogProps) {
  return (
    <div
      className="fixed inset-0 bg-slate-800/[.4] animate-fade-in flex items-center justify-center z-50"
      hidden={!isOpen}
    >
      <div className="w-[800px] h-[600px] flex flex-col justify-center items-center align-center text-white gap-4">
        <FontAwesomeIcon icon={faSpinner} spinPulse className="text-6xl" />
        <h3 className="text-lg font-semibold">{message}</h3>
      </div>
    </div>
  );
}
