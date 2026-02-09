import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UserDetails {
  id: number | null;
  firstName: string | null;
  lastName: string | null;
  login: string | null;
  email: string | null;
  pinfl: string | null;
  profilePhoto: string | null;
  permissions: number[];
}

interface GeneralState {
  data: Record<string, any>;
  userDetails: UserDetails;
  navbarTitle: string;
}

const initialState: GeneralState = {
  data: {},
  userDetails: {
    id: null,
    pinfl: null,
    firstName: null,
    lastName: null,
    login: null,
    email: null,
    profilePhoto: null,
    permissions: [],
  },
  navbarTitle: "",
};

const generalSlice = createSlice({
  name: "general",
  initialState,
  reducers: {
    changeState: (
      state,
      action: PayloadAction<{ name: keyof GeneralState; value: any }>
    ) => {
      (state[action.payload.name] as any) = action.payload.value;
    },
    setUserDetails: (state, action: PayloadAction<UserDetails>) => {
      state.userDetails = action.payload;
    },
  },
});

export const { changeState, setUserDetails } = generalSlice.actions;
export default generalSlice.reducer;
