"use client";

import { api } from "../../convex/_generated/api";
import { useConvexAuth, useQuery } from "convex/react";
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { UserType } from "@/types/userType";
import { Id } from "../../convex/_generated/dataModel";

export type View =
  | "home"
  | "sign-in"
  | "sign-up"
  | "profile"
  | "learn-more"
  | "terms"
  | "privacy"
  | "complete-profile"
  | "chat";

interface AppContextType {
  currentView: View;
  setView: (view: View) => void;
  isAuthenticated: boolean;
  userType: "patient" | "doctor" | null;
  userData: UserType;
  activeChatId?: Id<"consultations">;
  setActiveChatId: (id: Id<"consultations"> | undefined) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentView, setCurrentView] = useState<View>("home");
  const [activeChatId, setActiveChatId] = useState<
    Id<"consultations"> | undefined
  >(undefined);
  const { isAuthenticated } = useConvexAuth();
  const userData = useQuery(api.api.profiles.userProfiles.getUserProfile);

  const setView = useCallback((view: View) => {
    setCurrentView(view);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      if (userData === null) {
        setView("complete-profile");
      } else {
        setView("home");
      }
    }
  }, [isAuthenticated, userData, setView]);

  return (
    <AppContext.Provider
      value={{
        currentView,
        setView,
        isAuthenticated,
        userType: userData?.role as AppContextType["userType"],
        userData: userData as UserType,
        activeChatId,
        setActiveChatId,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
