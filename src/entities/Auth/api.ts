import request from "@/services";
import { useMutation, useQuery } from "react-query";
import type { LoginResponse } from "@/lib/authStorage";

export const loginApi = async (credentials: {
  login: string;
  password: string;
}): Promise<LoginResponse> => {
  const response = await request.post<LoginResponse>("/auth/login", credentials);
  return response.data;
};

export const useLoginMutation = () => {
  return useMutation(loginApi, {
    onError: (error: any) => {},
  });
};

export const getMe = async () => {
  try {
    const response = await request.get("/auth/me");

    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const useGetMe = () => {
  return useQuery(["me"], getMe);
};

export const useMeMutation = () => {
  return useMutation({
    mutationFn: getMe,
  });
};
