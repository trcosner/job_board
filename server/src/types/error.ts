export type SerializedError = {
    message: string
    field?: string
    // Rate limiting specific fields
    retryAfter?: number
    limit?: number
    remaining?: number
    // Database error fields
    operation?: string
    constraint?: string
    // Service error fields
    service?: string
    // Timeout error fields
    timeout?: number
}
