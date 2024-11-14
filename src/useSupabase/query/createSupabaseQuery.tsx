import { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import {
  useInfiniteQuery,
  useQuery,
  UseQueryOptions,
} from "@tanstack/react-query";
import { useMemo } from "react";
import { QueryBuilder } from "./build";
import { DatabaseTemp, SupabaseQueryResult } from "./types";
import { SupabaseInfoniteQueryConfig } from "./types.infonite";
import { SupabaseQueryConfig } from "./types.query";

export const createSupabaseQuery = <D extends DatabaseTemp>(
  client: SupabaseClient<D>
) => {
  const useSupaQuery = <Rs = undefined | any,>({
    table,
    column = "*",
    count,
    options = {},
    single,
    enabled,
    ...configObj
  }: SupabaseQueryConfig<D>) => {
    type V = Rs extends undefined
      ? typeof single extends true
        ? (D["public"]["Tables"] & D["public"]["Views"])[typeof table] extends {
            Row: infer R;
          }
          ? R
          : never
        : (D["public"]["Tables"] & D["public"]["Views"])[typeof table] extends {
            Row: infer R;
          }
        ? R[]
        : never[]
      : Rs;

    const fetchData = async (
      signal: AbortSignal
    ): Promise<SupabaseQueryResult<V>> => {
      const QueryBase = client.from(table).select(column, { count });

      const QueryFn = QueryBuilder<D>(configObj, QueryBase);

      const {
        data,
        error,
        count: rowCount,
      } = await QueryFn.abortSignal(signal);

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
        [table, ...queryKey].join("_"),
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
        "queryKey" | "queryFn"
      >),
    });
  };

  const useSupaInfiniteQuery = ({
    table,
    column = "*",
    options,
    enabled,
    count = "exact",
    ...configObj
  }: SupabaseInfoniteQueryConfig<D>) => {
    type V = (D["public"]["Tables"] &
      D["public"]["Views"])[typeof table] extends {
      Row: infer R;
    }
      ? R[]
      : never[];
    const fetchData = async (
      signal: AbortSignal
    ): Promise<SupabaseQueryResult<V>> => {
      const QueryBase = client.from(table).select(column, { count });

      const QueryFn = QueryBuilder<D>(configObj, QueryBase);

      const {
        data,
        error,
        count: rowCount,
      } = await QueryFn.abortSignal(signal);

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
