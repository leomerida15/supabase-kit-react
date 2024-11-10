import { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import { UseQueryOptions } from '@tanstack/react-query';
import { Where } from './types';

export type DatabaseTemp = {
    public: {
        Tables: {
            Row: Record<string, any>;
        };
        Views: {
            Row: Record<string, any>;
        };
    };
};

// Tipos de filtro para configuraciones avanzadas
export type OrWhere = string[];
export type EqWhere<T> = Partial<
    Record<T extends Array<any> ? keyof T[0] : keyof T, string | number | boolean>
>;
export type InWhere<T> = Partial<
    Record<T extends Array<any> ? keyof T[0] : keyof T, (string | number)[]>
>;
export type FilterWhere<T> = Record<
    T extends Array<any> ? keyof T[0] : keyof T,
    [operator: `${'' | 'not.'}${FilterOperator}`, value: string]
>;

export type gtWhere<T> = Partial<Record<T extends Array<any> ? keyof T[0] : keyof T, T[keyof T]>>;
export type isWhere<T> = Partial<Record<T extends Array<any> ? keyof T[0] : keyof T, T[keyof T]>>;
export type matchWhere<T> = Partial<T>;

export type FilterOperator =
    | 'eq'
    | 'neq'
    | 'gt'
    | 'gte'
    | 'lt'
    | 'lte'
    | 'like'
    | 'ilike'
    | 'is'
    | 'in'
    | 'cs'
    | 'cd'
    | 'sl'
    | 'sr'
    | 'nxl'
    | 'nxr'
    | 'adj'
    | 'ov'
    | 'fts'
    | 'plfts'
    | 'phfts'
    | 'wfts';

type PublicSchema<D extends DatabaseTemp> = D[Extract<keyof D, 'public'>] & any;

export type PublicSchemaKeys<D extends DatabaseTemp> =
    | keyof (PublicSchema<D>['Tables'] & PublicSchema<D>['Views'])
    | { schema: keyof D };

export type TableName<
    D extends DatabaseTemp,
    P extends PublicSchemaKeys<D>,
    T extends P extends { schema: keyof D }
        ? keyof (D['public']['Tables'] & D['public']['Views'])
        : never = never,
> = T;

export type Tables<
    D extends DatabaseTemp,
    P extends PublicSchemaKeys<D>,
    T extends TableName<D, P>,
> = (D['public']['Tables'] & D['public']['Views'])[T] extends {
    Row: infer R;
}
    ? R
    : never;

// Configuración del hook
export interface SupabaseQueryConfig<
    D extends DatabaseTemp,
    K extends keyof (D['public']['Tables'] & D['public']['Views']) = keyof (D['public']['Tables'] &
        D['public']['Views']) &
        Parameters<SupabaseClient<D>['from']>['0'],
    S extends boolean = false,
    V = S extends true
        ? (D['public']['Tables'] & D['public']['Views'])[K] extends {
              Row: infer R;
          }
            ? R
            : never
        : (D['public']['Tables'] & D['public']['Views'])[K] extends {
              Row: infer R;
          }
        ? R[]
        : never[],
> {
    table: K;
    column?: string;
    where?: Where<V>;
    single?: S;
    limit?: number;
    count?: 'exact' | 'planned' | 'estimated';
    enabled?: boolean;
    options?: Omit<UseQueryOptions<SupabaseQueryResult<V>, PostgrestError>, 'queryKey' | 'queryFn'>;
}

// Resultado del query
export type SupabaseQueryResult<T> = {
    payload: T;
    count: number;
};
