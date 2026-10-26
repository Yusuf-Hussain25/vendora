"use client";

import { createContext, useContext } from "react";

const UserContext = createContext(null);

// A small, serialisable summary of the signed-in user (or null), provided by the root layout
export const useUser = () => useContext(UserContext);

export default function UserProvider({ user, children }) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}
