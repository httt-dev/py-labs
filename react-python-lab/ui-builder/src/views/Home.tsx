import { useNavigate } from "react-router";
import { 
  strictViewElements, 
  viewElements } from ".";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface HomeProps {
  onNavigate: any;
}

export function Home({ onNavigate }: HomeProps) {
  const navigate = useNavigate();
  return (
    <>
      <div className="flex flex-col w-full h-full items-center align-center justify-center gap-4 p-4 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold">{import.meta.env.VITE_APP_NAME}</h1>
        <div className="grid grid-cols-3 gap-4 w-full mb-4">
          {viewElements
            .filter((view) => !view.path)
            .map((view) => (
              <div
                className="flex flex-col items-center cursor-pointer hover:bg-gray-200 p-4 rounded-lg transition-colors duration-200"
                key={view.id}
                onClick={() => onNavigate(view.id)}
              >
                {view.icon && (
                  <div className="text-4xl mb-2">
                    <FontAwesomeIcon icon={view.icon} />
                  </div>
                )}
                <div className="text-center">{view.name}</div>
              </div>
            ))}
          {viewElements
            .filter((view) => view.path)
            .map((view) => (
              <div
                className="flex flex-col items-center cursor-pointer hover:bg-gray-200 p-4 rounded-lg transition-colors duration-200"
                key={view.id}
                onClick={() => navigate(view.path || "")}
              >
                {view.icon && (
                  <div className="text-4xl mb-2">
                    <FontAwesomeIcon icon={view.icon} />
                  </div>
                )}
                <div className="text-center">{view.name}</div>
              </div>
            ))}
        </div>
        <div className="grid grid-cols-3 gap-4 w-full" >
          <p className="text-red-700 col-span-3 text-center text-lg">
            <strong>On premise</strong> environment
          </p>
          {strictViewElements
            .map((view) => (
              <div
                className="flex flex-col items-center cursor-pointer hover:bg-gray-200 p-4 rounded-lg transition-colors duration-200"
                key={view.id}
                onClick={() => onNavigate(view.id)}
              >
                {view.icon && (
                  <div className="text-4xl mb-2">
                    <FontAwesomeIcon icon={view.icon} />
                  </div>
                )}
                <div className="text-center">{view.name}</div>
              </div>
            ))}
        </div>
      </div>
    </>
  );
}
