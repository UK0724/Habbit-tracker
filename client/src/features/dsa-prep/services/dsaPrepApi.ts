import { apiRequest } from "../../../services/api";

export interface SolvedProblem {
  problemId: number;
  language: string;
  solvedAt: string;
  notes?: string;
}

export interface DsaPrepProfile {
  solvedProblems: SolvedProblem[];
}

export const getDsaProfile = () =>
  apiRequest<DsaPrepProfile>("/dsa-prep");

export const markProblemSolved = (input: { problemId: number; language: string; notes?: string }) =>
  apiRequest<DsaPrepProfile>("/dsa-prep/solve", {
    method: "POST",
    body: JSON.stringify(input)
  });

export const unmarkProblemSolved = (input: { problemId: number }) =>
  apiRequest<DsaPrepProfile>("/dsa-prep/unsolve", {
    method: "POST",
    body: JSON.stringify(input)
  });
