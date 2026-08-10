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

export interface DsaProblem {
  id: number;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  section: string;
  subSection: string;
  pattern: string;
  description: string;
  naiveSolution: {
    explanation: string;
    timeComplexity: string;
    spaceComplexity: string;
    code: Record<string, string>;
  };
  optimizedSolution: {
    explanation: string;
    timeComplexity: string;
    spaceComplexity: string;
    code: Record<string, string>;
  };
}

export const getDsaProfile = () =>
  apiRequest<DsaPrepProfile>("/dsa-prep");

export const getDsaProblems = () =>
  apiRequest<DsaProblem[]>("/dsa-prep/problems");

export const getDsaProblemDetail = (id: number) =>
  apiRequest<DsaProblem>(`/dsa-prep/problems/${id}`);

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
