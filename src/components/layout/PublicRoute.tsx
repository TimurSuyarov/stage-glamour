// src/app/routes/PublicRoute.tsx
import React from "react";
import { Navigate, Outlet } from "react-router-dom";

type Props = {
  children?: React.ReactNode;
};

const PublicRoute: React.FC<Props> = ({ children }) => {
  const token = sessionStorage.getItem("token");

  if (token) {
    return <Navigate to="/" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default PublicRoute;
