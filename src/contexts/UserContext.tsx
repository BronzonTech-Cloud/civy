"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/lib/profile/actions";

type UserContextValue = {
  user: User | null;
  profile: Profile | null;
  isPremium: boolean;
};

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({
  user,
  profile,
  children,
}: {
  user: User | null;
  profile: Profile | null;
  children: ReactNode;
}) {
  const isPremium = profile?.is_premium ?? false;

  return (
    <UserContext.Provider value={{ user, profile, isPremium }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
