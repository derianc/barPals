import { create } from "zustand";

type OfferAudience = {
  recentVisitDays?: number;
  minSpend?: number;
  withinKm?: number;
};

type OfferFormState = {
  title: string;
  description: string;
  imageUrl?: string;
  validFrom?: Date;
  validUntil?: Date;
  audience: OfferAudience;
  setField: (key: keyof OfferFormState, value: any) => void;
  resetForm: () => void;
};

export const useOfferForm = create<OfferFormState>((set) => ({
  title: "",
  description: "",
  imageUrl: undefined,
  validFrom: undefined,
  validUntil: undefined,
  audience: {},
  setField: (key, value) => set({ [key]: value }),
  resetForm: () =>
    set({
      title: "",
      description: "",
      imageUrl: undefined,
      validFrom: undefined,
      validUntil: undefined,
      audience: {},
    }),
}));
