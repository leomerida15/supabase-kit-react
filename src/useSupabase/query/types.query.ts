import { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import { UseQueryOptions } from '@tanstack/react-query';
import { baseRangeWhere, DatabaseTemp, orderWhere, SupabaseQueryResult, Where } from './types';

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
    maybeSingle?: S;
    limit?: number;
    count?: 'exact' | 'planned' | 'estimated';
    enabled?: boolean;
    order?: orderWhere<V>;
    range?: baseRangeWhere | baseRangeWhere[];
    csv?: boolean;
    explain?: {
        analyze?: boolean;
        verbose?: boolean;
        settings?: boolean;
        buffers?: boolean;
        wal?: boolean;
        format?: 'json' | 'text';
    };
    options?: Omit<
        UseQueryOptions<SupabaseQueryResult<V>, PostgrestError>,
        'queryKey' | 'queryFn' | 'initialData'
    > & {
        queryKey?: string[];
    };
}
