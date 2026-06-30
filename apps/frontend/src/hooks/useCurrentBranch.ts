import { useParams } from "wouter";

/**
 * Extracts the branch code from the current URL path.
 * In a nested router, useParams() will contain the parameters from the parent route.
 */
export function useCurrentBranch(): string | null {
  const params = useParams();
  
  if (params && params.branchCode) {
    return params.branchCode;
  }
  
  return null;
}
