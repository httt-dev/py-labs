import { faClose } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
// import { routes } from "../Routes";
// import { Link} from "react-router";

interface SidebarMenuProps {
  onClose: () => void;
}

export default function SidebarMenu({ onClose }: SidebarMenuProps) {
  const [isClosing, setIsClosing] = useState(false);
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 100);
  };

  return (
    <div
      className={`fixed z-50 flex flex-row w-screen h-screen transition-all bg-slate-800/[.4] ${
        isClosing ? "animate-fade-out" : "animate-fade-in"
      }`}
    >
      <div className="relative shrink-0 flex flex-col w-64 h-full bg-white p-4 shadow-lg">
        <div className="flex justify-between w-full items-center align-center">
          <p className="text-xl font-medium">{import.meta.env.VITE_APP_NAME}</p>
          <button onClick={handleClose} className="border-none text-gray-700">
            <FontAwesomeIcon icon={faClose} />
          </button>
        </div>
        <div className="h-10" />
        <div className="flex flex-col gap-4 w-full">
          {/* {routes.map((route) => (
            <Link className="text-sm font-medium" to={route.path} onClick={onClose}>
              {route.name}
            </Link>
          ))} */}
        </div>
      </div>
      <div className="w-full h-full" onClick={handleClose} />
    </div>
  );
}
