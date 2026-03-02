import { Request, Response, NextFunction } from 'express';
import { ParamsDictionary, Query } from 'express-serve-static-core';
import { UserType } from './auth';

// Extend Express Request interface to include optional user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        userType: UserType;
        role?: string;
        subscription?: string;
        emailVerified: boolean;
        tenantId?: string;
      };
    }
  }
}

// Generic typed request interface for validated requests
export interface TypedRequest<
    TBody = any, 
    TQuery extends Query = Query, 
    TParams extends ParamsDictionary = ParamsDictionary
> extends Request<TParams, any, TBody, TQuery> {
    body: TBody;
    query: TQuery;
    params: TParams;
}

// Response type helper for APIs
export type TypedResponse<TData = any> = Response<TData>;

// Handler type for typed routes
export type TypedRequestHandler<
    TBody = any, 
    TQuery extends Query = Query, 
    TParams extends ParamsDictionary = ParamsDictionary, 
    TResponse = any
> = (
    req: TypedRequest<TBody, TQuery, TParams>,
    res: TypedResponse<TResponse>,
    next: NextFunction
) => void | Promise<void>;

// Auth middleware types
export interface AuthenticatedRequest<
    TBody = any, 
    TQuery extends Query = Query, 
    TParams extends ParamsDictionary = ParamsDictionary
> extends TypedRequest<TBody, TQuery, TParams> {
    user: {
        id: string;
        email: string;
        userType: UserType;
        emailVerified: boolean;
    };
}

export type AuthenticatedRequestHandler<
    TBody = any, 
    TQuery extends Query = Query, 
    TParams extends ParamsDictionary = ParamsDictionary, 
    TResponse = any
> = (
    req: AuthenticatedRequest<TBody, TQuery, TParams>,
    res: TypedResponse<TResponse>,
    next: NextFunction
) => void | Promise<void>;

// Middleware type
export type Middleware<TRequest extends Request = Request> = (
    req: TRequest,
    res: Response,
    next: NextFunction
) => void | Promise<void>;

// Common parameter types
export interface IdParams extends ParamsDictionary {
    id: string;
}

export interface UserIdParams extends ParamsDictionary {
    userId: string;
}

export interface JobIdParams extends ParamsDictionary {
    jobId: string;
}

export interface CompanyIdParams extends ParamsDictionary {
    companyId: string;
}

// Pagination query parameters  
export interface PaginationQuery extends Query {
    page?: string;
    limit?: string;
}