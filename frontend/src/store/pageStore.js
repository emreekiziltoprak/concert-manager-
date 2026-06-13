import { create } from "zustand";

export const pages = {
    EVENTS: "EVENTS",
    USERS: "USERS",
    CATEGORIES: "CATEGORIES"
};

export const usePageStore = create((set) => ({
  activePage: pages.EVENTS,

  setPage: (page) => set({ activePage: page }),
}))