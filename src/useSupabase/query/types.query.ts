import { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import { UseQueryOptions } from '@tanstack/react-query';
import { DatabaseTemp, SupabaseQueryResult, Where } from './types';

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
