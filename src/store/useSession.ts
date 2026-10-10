import { create } from "zustand";
import { cloud } from "../lib/cloud";
export type SessionProfile = {
  id: string;
  alias: string;
  role: "PARENT" | "STUDENT" | "PLATFORM_ADMIN";
  language: "uz" | "ru";
  status: string;
};
export type Membership = {
  organization_id: string;
  role: string;
  organizations: { id: string; name: string; status: string };
};
type State = {
  loaded: boolean;
  configured: boolean;
  profile: SessionProfile | null;
  memberships: Membership[];
  organization: string;
  error: string;
  refresh: () => Promise<void>;
  selectOrganization: (id: string) => void;
};
export const useSession = create<State>((set) => ({
  loaded: false,
  configured: false,
  profile: null,
  memberships: [],
  organization: "",
  error: "",
  async refresh() {
    try {
      const result = await cloud<{
        configured: boolean;
        profile: SessionProfile | null;
        memberships?: Membership[];
      }>("/api/auth");
      set({
        loaded: true,
        configured: result.configured,
        profile: result.profile,
        memberships: result.memberships || [],
        error: "",
      });
    } catch (error) {
      set({
        loaded: true,
        error: error instanceof Error ? error.message : "server_error",
        profile: null,
        memberships: [],
      });
    }
  },
  selectOrganization: (organization) => set({ organization }),
}));
