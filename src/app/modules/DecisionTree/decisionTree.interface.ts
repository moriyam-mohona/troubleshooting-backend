import { RouteOption, RouteType } from "@prisma/client";

export interface IDiagnosisPayload {
  whatsHappening: string;
  recommendedFix: string;
}

export interface ITreeNodePayload {
  id?: string;
  questionText: string;
  selectedOption?: "Yes" | "No";
  yesBranch: {
    hasDiagnosis: boolean;
    diagnosis?: IDiagnosisPayload | null;
    childQuestions?: ITreeNodePayload[];
  };
  noBranch: {
    hasDiagnosis: boolean;
    diagnosis?: IDiagnosisPayload | null;
    childQuestions?: ITreeNodePayload[];
  };
}

export interface ISaveDecisionTreeInput {
  subcategoryId: string;
  isDraft?: boolean;
  treeNodes: ITreeNodePayload[];
}

export interface ITraverseInput {
  subcategoryId: string;
  questionId: string;
  option: RouteOption;
}
