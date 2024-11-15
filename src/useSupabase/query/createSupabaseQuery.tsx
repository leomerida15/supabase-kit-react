import { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import { useInfiniteQuery, useQuery, UseQueryOptions } from '@tanstack/react-query';
import { useMemo } from 'react';
import { QueryBuilder } from './build';
import { DatabaseTemp, SupabaseQueryResult } from './types';
import { SupabaseInfoniteQueryConfig } from './types.infonite';
import { SupabaseQueryConfig } from './types.query';

export const createSupabaseQuery = <D extends DatabaseTemp>(client: SupabaseClient<D>) => {
    /**
     * Custom hook to execute a Supabase query with React Query.
     *
     * @template Rs - Optional type for the result set.
     * @template D - Database schema type.
     *
     * @param {Object} config - Configuration object for the query.
     * @param {string} config.table - The name of the table to query.
     * @param {string} [config.column='*'] - Columns to select from the table.
     * @param {'exact' | 'planned' | 'estimated'} [config.count] - Count type for the query.
     * @param {UseQueryOptions<SupabaseQueryResult<V>, PostgrestError>} [config.options={}] - Additional options for the query hook.
     * @param {boolean} [config.single] - Flag indicating if a single row should be returned.
     * @param {boolean} config.enabled - Flag to enable/disable the query execution.
     * @param {Object} config.configObj - Additional configuration for the query.
     *
     * @returns {UseQueryResult<SupabaseQueryResult<V>, PostgrestError>} - React Query result object containing data and status.
     */
    const useSupaQuery = <Rs = undefined | any,>({
        table,
        column = '*',
        count,
        options = {},
        single,
        enabled,
        ...configObj
    }: SupabaseQueryConfig<D>) => {
        type V = Rs extends undefined
            ? typeof single extends true
                ? (D['public']['Tables'] & D['public']['Views'])[typeof table] extends {
                      Row: infer R;
                  }
                    ? R
                    : never
                : (D['public']['Tables'] & D['public']['Views'])[typeof table] extends {
                      Row: infer R;
                  }
                ? R[]
                : never[]
            : Rs;

        const fetchData = async (signal: AbortSignal): Promise<SupabaseQueryResult<V>> => {
            const QueryBase = client.from(table).select(column, { count });

            const QueryFn = QueryBuilder<D>(configObj, QueryBase);

            const { data, error, count: rowCount } = await QueryFn.abortSignal(signal);

            if (error) throw error;

            return {
                count: rowCount ?? 0,
                payload: data as V,
            };
        };

        const initialData = useMemo(() => {
            if (single) return { payload: {}, count: 0 } as SupabaseQueryResult<V>;
            //
            return { payload: [], count: 0 } as SupabaseQueryResult<V>;
        }, [single]);

        const { queryKey = [], ...optionsHooks } = options;

        return useQuery<SupabaseQueryResult<V>, PostgrestError>({
            queryKey: [
                [table, ...queryKey].join('_'),
                configObj.where,
                configObj.limit,
                single,
                count,
            ],
            initialData,
            queryFn: ({ signal }) => fetchData(signal),
            enabled,
            ...(optionsHooks as Omit<
                UseQueryOptions<SupabaseQueryResult<V>, PostgrestError>,
                'queryKey' | 'queryFn'
            >),
        });
    };

    /**
     * React Query hook for fetching data from a Supabase table with infinite scroll.
     *
     * @param {string} table - The table to fetch data from.
     * @param {string} [column='*'] - The column(s) to fetch. Defaults to '*'.
     * @param {Object} [options={}] - Options for the hook. See {@link https://react-query.tanstack.com/docs/api#useinfinitequery}
     * @param {boolean} [enabled=true] - Whether the hook is enabled.
     * @param {'exact'|'planned'|'estimated'} [count='exact'] - The type of count to fetch. See {@link https://supabase.io/docs/reference/postgrest/count}
     * @param {Object} [configObj={}] - Additional configuration options for the query. See {@link https://supabase.io/docs/reference/postgrest/filters}
     * @returns {UseInfiniteQueryResult<SupabaseQueryResult<V>, PostgrestError>} - The result of the query.
     */
    const useSupaInfiniteQuery = ({
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
        const fetchData = async (signal: AbortSignal): Promise<SupabaseQueryResult<V>> => {
            const QueryBase = client.from(table).select(column, { count });

            const QueryFn = QueryBuilder<D>(configObj, QueryBase);

            const { data, error, count: rowCount } = await QueryFn.abortSignal(signal);

            if (error) throw error;

            return {
                count: rowCount ?? 0,
                payload: data as V,
            };
        };

        const { initialData: InitProp, ...optionsHook } = options;

        return useInfiniteQuery<SupabaseQueryResult<V>, PostgrestError>({
            queryKey: [table, configObj.where, configObj.limit],
            queryFn: ({ signal }) => fetchData(signal),
            enabled,
            ...optionsHook,
        });
    };

    return {
        useSupaInfiniteQuery,
        useSupaQuery,
        QueryBuilder,
    };
};
