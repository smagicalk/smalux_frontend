import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AdminProfile {
  username: string;
  nickname: string;
  avatarUrl: string | null;
  role: string;
}

interface AdminProfileState extends AdminProfile {
  updateProfile: (updates: Partial<Omit<AdminProfile, "role">>) => void;
  setAvatarUrl: (url: string | null) => void;
  resetToDefault: () => void;
}

const DEFAULT_PROFILE: AdminProfile = {
  username: "admin",
  nickname: "主管理员",
  avatarUrl: null,
  role: "超级所有者 (Owner)"
};

export const useAdminProfileStore = create<AdminProfileState>()(
  persist(
    (set) => ({
      ...DEFAULT_PROFILE,
      updateProfile: (updates) =>
        set((state) => ({
          ...state,
          ...updates
        })),
      setAvatarUrl: (url) =>
        set((state) => ({
          ...state,
          avatarUrl: url
        })),
      resetToDefault: () => set(DEFAULT_PROFILE)
    }),
    {
      name: "smalux_admin_profile"
    }
  )
);
