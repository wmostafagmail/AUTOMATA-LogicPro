export type ResolutionMode = "compatibility" | "strict";
export type ResolutionStatus = "resolved" | "unresolved" | "invalid";
export interface ResolvedValue { value: string | number | boolean; source: "explicit"|"sweep-preset"|"profile"|"system-derived"|"project-policy"|"block-default"|"facade-constant"; sourceReference: string; }
export interface ResolvedConnection { kind: "signal"|"constant"|"open"|"facade-internal"|"unresolved"; expression?: string; semanticMeaning?: string; }
export interface ResolvedBlockContract { instanceId:string; requestedCapability:string; selectedImplementation:{blockId:string;entityName:string;sourcePath:string;verificationStatus:string}; selectedFacade:{facadeId:string;entityName:string;version:string}; generics:Record<string,ResolvedValue>; ports:Record<string,ResolvedConnection>; behavioralContractIds:string[]; configurationId:string; resolutionStatus:ResolutionStatus; diagnostics:string[]; }
