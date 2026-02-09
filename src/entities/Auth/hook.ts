import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setUserDetails } from "../../redux/slices/generelSlice";
import { useMeMutation } from "./api";

export const useAuth = () => {
  const token = sessionStorage.getItem("token");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { mutateAsync, isLoading, isError, error } = useMeMutation();
  console.log("useAuth -> shouldFetch", Boolean(token));

  useEffect(() => {
    if (!Boolean(token)) return;
    if (!token) navigate("/");

    const getMe = async () => {
      try {
        await mutateAsync(undefined, {
          onSuccess: (data) => {
            dispatch(
              setUserDetails({
                id: data.id,
                pinfl: data.pinfl,
                firstName: data.firstName,
                lastName: data.lastName,
                login: data.login,
                email: data.email,
                profilePhoto: data.profilePhoto,
                permissions: data.permissions || [],
              })
            );
            setIsAuthenticated(true);
          },
        });
      } catch (e: any) {
        if (e.status == "401" || e.status == "403") {
          // message.error('Please login again.');
          navigate("/");
        }
      }
    };

    getMe();
  }, [token]);

  return { isLoading, isError, error, isAuthenticated };
};
