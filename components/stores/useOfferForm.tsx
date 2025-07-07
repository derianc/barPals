// useOfferForm.ts
import { create } from 'zustand';

type OfferFormState = {
  title: string;
  description: string;
  validFrom: Date | null;
  validUntil: Date | null;
  isSubmitting: boolean;
  setField: (key: keyof Omit<OfferFormState, 'setField' | 'submitOffer'>, value: any) => void;
  submitOffer: () => Promise<void>;
};

export const useOfferForm = create<OfferFormState>((set, get) => ({
  title: '',
  description: '',
  validFrom: null,
  validUntil: null,
  isSubmitting: false,
  setField: (key, value) => set({ [key]: value }),
  submitOffer: async () => {
    set({ isSubmitting: true });
    try {
      const { title, description, validFrom, validUntil } = get();
      // 🔧 TODO: Add your actual offer saving logic (e.g. Supabase insert)
      console.log("Submitting offer:", { title, description, validFrom, validUntil });
      // await saveOfferToSupabase(...)
    } catch (error) {
      console.error("❌ Failed to submit offer:", error);
    } finally {
      set({ isSubmitting: false });
    }
  },
}));
