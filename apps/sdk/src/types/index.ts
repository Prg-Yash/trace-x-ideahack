export interface AuthCredentials {
    username: string;
    password: string; // Required for G-TEN password auth
    baseUrl?: string;
}

export interface AuthResult {
    username: string;
    role: string;
    authenticated: boolean;
}

// Re-export the useful models generated from OpenAPI
export type { Account } from "../generated/src/models/Account";
export type { AlertStatusUpdate } from "../generated/src/models/AlertStatusUpdate";
export type { AssignRequest } from "../generated/src/models/AssignRequest";
export type { BranchCreate } from "../generated/src/models/BranchCreate";
export type { BranchUpdate } from "../generated/src/models/BranchUpdate";
export type { ChatRequest } from "../generated/src/models/ChatRequest";
export type { ChatResponse } from "../generated/src/models/ChatResponse";
export type { HistoryTurn } from "../generated/src/models/HistoryTurn";
export type { Transaction } from "../generated/src/models/Transaction";
export type { UserCreate } from "../generated/src/models/UserCreate";
export type { UserOut } from "../generated/src/models/UserOut";
export type { ValidationError } from "../generated/src/models/ValidationError";
