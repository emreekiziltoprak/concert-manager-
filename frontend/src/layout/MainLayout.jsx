import { Outlet } from "react-router-dom";
import Header from "../page/Header";

const MainLayout = () => {
  return (
    <>
      <Header />
      <main className="page">
        <Outlet />
      </main>
    </>
  );
};

export default MainLayout;