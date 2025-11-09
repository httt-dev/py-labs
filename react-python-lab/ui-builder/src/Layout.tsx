import {
  Outlet,
} from "react-router";

export const Layout = () => {
  return (
    <main className="w-full h-screen overflow-hidden animate-fade-in">
      <div className="flex flex-col w-full h-full gap-1">
        {/* <div className="flex flex-row w-full h-fit justify-between grow-0 items-center gap-2 mb-4 px-4">
          <div className="flex flex-row gap-4 items-center align-center grow-0">
            <button onClick={() => setIsOpenMenu(!isOpenMenu)} className="border-none w-fit h-fit text-xl">
              <FontAwesomeIcon icon={faBars} />
            </button>
            <p className="text-lg md:text-2xl font-medium">{ctx?.title}</p>
          </div>
          <Link
              className="flex items-center justify-start w-fit h-fit gap-3"
              to="/"
              hidden={location.pathname == "/"}
            >
              <FontAwesomeIcon icon={faHouse} />
            </Link>
        </div> */}
        <div className="flex flex-col w-full h-full overflow-hidden">
          <Outlet />
        </div>
        {/* <div className="flex w-full justify-end h-fit text-xs text-gray-400 px-4">
          <p className="p-0">Version: {import.meta.env.VITE_APP_VERSION}</p>
        </div> */}
      </div>
    </main>
  );
};
