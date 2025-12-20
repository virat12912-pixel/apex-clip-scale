/**
 * Security utility to map technical errors to user-friendly messages.
 * This prevents information disclosure through error messages.
 */

export function mapErrorToUserMessage(error: unknown): string {
  if (!error) {
    return "An unexpected error occurred. Please try again.";
  }

  const errorObj = error as { code?: string; message?: string };
  const code = errorObj.code;
  const message = errorObj.message?.toLowerCase() || "";

  // Database constraint violations
  if (code === "23505") {
    return "This record already exists.";
  }
  
  if (code === "23503") {
    return "This operation references data that doesn't exist.";
  }

  if (code === "23502") {
    return "Required information is missing.";
  }

  // Permission errors
  if (code === "42501" || message.includes("permission denied")) {
    return "You don't have permission to perform this action.";
  }

  // RLS policy violations
  if (
    message.includes("rls") ||
    message.includes("row-level security") ||
    message.includes("policy")
  ) {
    return "You don't have permission to perform this action.";
  }

  // Authentication errors
  if (message.includes("not authenticated") || message.includes("unauthenticated")) {
    return "Please sign in to continue.";
  }

  if (message.includes("invalid login") || message.includes("invalid password")) {
    return "Invalid email or password.";
  }

  if (message.includes("email already") || message.includes("user already")) {
    return "An account with this email already exists.";
  }

  // Rate limiting
  if (message.includes("rate limit") || message.includes("too many")) {
    return "Too many requests. Please try again later.";
  }

  // Network errors
  if (message.includes("network") || message.includes("fetch")) {
    return "Network error. Please check your connection.";
  }

  // Validation errors (keep these somewhat specific but safe)
  if (message.includes("invalid") && message.includes("email")) {
    return "Please enter a valid email address.";
  }

  if (message.includes("invalid") && message.includes("url")) {
    return "Please enter a valid URL.";
  }

  // Generic fallback - never expose technical details
  return "An error occurred. Please try again.";
}

/**
 * Log error details for debugging (only in development)
 */
export function logError(context: string, error: unknown): void {
  if (import.meta.env.DEV) {
    console.error(`[${context}]`, error);
  }
}
