import { Outlet } from "react-router-dom";
import { Toaster } from "@client/src/components/ui/sonner";

const Layout = () => {
  return (
    <div className="w-screen h-screen">
      <Outlet />
      <Toaster />
    </div>
  );
};

export default Layout;