import { DsaPrepProfileModel, DsaProblemModel } from "./dsaPrep.model.js";

export const dsaPrepService = {
  getAllProblems: async () => {
    return DsaProblemModel.find().sort({ id: 1 });
  },

  getProblemById: async (id: number) => {
    return DsaProblemModel.findOne({ id });
  },

  getProfileByUserId: async (userId: string) => {
    let profile = await DsaPrepProfileModel.findOne({ userId });
    if (!profile) {
      profile = await DsaPrepProfileModel.create({
        userId,
        solvedProblems: []
      });
    }
    return profile;
  },

  markSolved: async (userId: string, problemId: number, language: string, notes?: string) => {
    let profile = await DsaPrepProfileModel.findOne({ userId });
    if (!profile) {
      profile = await DsaPrepProfileModel.create({
        userId,
        solvedProblems: []
      });
    }

    if (!profile.solvedProblems) {
      profile.solvedProblems = [];
    }

    const solvedIndex = profile.solvedProblems.findIndex((p) => p.problemId === problemId);
    if (solvedIndex > -1) {
      const existing = profile.solvedProblems[solvedIndex];
      if (existing) {
        existing.language = language;
        existing.solvedAt = new Date();
        if (notes !== undefined) {
          existing.notes = notes;
        }
      }
    } else {
      profile.solvedProblems.push({
        problemId,
        language,
        solvedAt: new Date(),
        notes: notes || ""
      });
    }

    await profile.save();
    return profile;
  },

  unmarkSolved: async (userId: string, problemId: number) => {
    let profile = await DsaPrepProfileModel.findOne({ userId });
    if (profile) {
      if (!profile.solvedProblems) {
        profile.solvedProblems = [];
      }
      profile.solvedProblems = profile.solvedProblems.filter(
        (p) => p.problemId !== problemId
      );
      await profile.save();
    }
    return profile;
  }
};
