import { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { QueryBuilder } from './build';
import { DatabaseTemp, SupabaseQueryResult } from './types';
import { SupabaseInfoniteQueryConfig } from './types.infonite';
import { SupabaseQueryConfig } from './types.query';

export const createSupabaseQuery = <D extends DatabaseTemp>(client: SupabaseClient<D>) => {
    const useSupabaseQuery = ({
        table,
        column = '*',
        count,
        options = {},
        single,
        enabled,
        ...configObj
    }: SupabaseQueryConfig<D>) => {
        type V = typeof single extends true
            ? (D['public']['Tables'] & D['public']['Views'])[typeof table] extends {
                  Row: infer R;
              }
                ? R
                : never
            : (D['public']['Tables'] & D['public']['Views'])[typeof table] extends {
                  Row: infer R;
              }
            ? R[]
            : never[];
        const fetchData = async (): Promise<SupabaseQueryResult<V>> => {
            const QueryBase = client.from(table).select(column, { count });

            const QueryFn = QueryBuilder<D>(configObj, QueryBase);

            const { data, error, count: rowCount } = await QueryFn;

            if (error) throw error;

            return {
                count: rowCount ?? 0,
                payload: data as V,
            };
        };

        const { initialData: InitProp, ...optionsHook } = options;

        const initialData = useMemo(() => {
            if (single) return { payload: {}, count: 0 } as SupabaseQueryResult<V>;
            //
            return { payload: [], count: 0 } as SupabaseQueryResult<V>;
        }, [single]);

        return useQuery<SupabaseQueryResult<V>, PostgrestError>({
            queryKey: [table, configObj.where, configObj.limit, single, count],
            initialData,
            queryFn: fetchData,
            enabled,
            ...optionsHook,
        });
    };

    const useSupabaseInfiniteQuery = ({
        table,
        column = '*',
        options,
        enabled,
        count = 'exact',
        ...configObj
    }: SupabaseInfoniteQueryConfig<D>) => {
        type V = (D['public']['Tables'] & D['public']['Views'])[typeof table] extends {
            Row: infer R;
        }
            ? R[]
            : never[];
        const fetchData = async (): Promise<SupabaseQueryResult<V>> => {
            const QueryBase = client.from(table).select(column, { count });

            const QueryFn = QueryBuilder<D>(configObj, QueryBase);

            const { data, error, count: rowCount } = await QueryFn;

            if (error) throw error;

            return {
                count: rowCount ?? 0,
                payload: data as V,
            };
        };

        const { initialData: InitProp, ...optionsHook } = options;

        return useInfiniteQuery<SupabaseQueryResult<V>, PostgrestError>({
            queryKey: [table, configObj.where, configObj.limit],
            queryFn: fetchData,
            enabled,
            ...optionsHook,
        });
    };

    return {
        useSupabaseInfiniteQuery,
        useSupabaseQuery,
        QueryBuilder,
    };
};
