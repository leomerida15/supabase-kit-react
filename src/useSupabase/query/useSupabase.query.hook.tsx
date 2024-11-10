import { PostgrestError } from "@supabase/supabase-js";
import {
    InitialDataFunction,
    useQuery,
    UseQueryOptions,
    UseQueryResult,
} from "@tanstack/react-query";
import { useSupabase } from "..";
import { SupabaseQueryConfig } from "./types";
 
// Implementación del hook
export function useSupabaseQuery<T = any>({
    table,
    column = "*",
    where = {},
    single = false,
    limit,
    count,
    enabled = true,
    options = {},
}: SupabaseQueryConfig<T>) {
    const supabase = useSupabase();

    const fetchData = async () => {
        let query = supabase.from(table).select(column, { count });

        // Aplicar filtros

        if (where.eq) for (const [k, v] of Object.entries<any>(where.eq)) query = query.eq(k, v);

        if (where.neq) for (const [k, v] of Object.entries<any>(where.neq)) query = query.neq(k, v);

        if (where.or) for (const or of where.or) query = query.or(or);

        if (where.in) for (const [k, v] of Object.entries<any>(where.in)) query = query.in(k, v);

        if (where.is) for (const [k, v] of Object.entries<any>(where.is)) query = query.is(k, v);

        if (where.match) query = query.match(where.match as any);

        if (where.lt) for (const [k, v] of Object.entries(where.lt)) query = query.lt(k, v);

        if (where.lte) for (const [k, v] of Object.entries(where.lte)) query = query.lte(k, v);

        if (where.gt) for (const [k, v] of Object.entries(where.gt)) query = query.gt(k, v);

        if (where.gte) for (const [k, v] of Object.entries(where.gte)) query = query.gte(k, v);

        if (where.filter)
            for (const [k, v] of Object.entries<[any, any]>(where.filter)) query.filter(k, ...v);

        if (limit) query = query.limit(limit);

        if (single) query = query.single() as typeof query;

        const { data, error, count: rowCount } = await query;

        if (error) throw error;

        return {
            count: rowCount || 0,
            payload: data as T,
        };
    };

    const { initialData: InitProp, ...optionsHook } = options;

    const initialData: InitialDataFunction<SupabaseQueryResult<T>> = () => {
        let resp = {};

        if (InitProp) resp = InitProp;
        //
        else if (single) resp = { payload: {}, count: 0 };
        //
        else resp = { payload: [], count: 0 };

        return resp as SupabaseQueryResult<T>;
    };

    return useQuery<SupabaseQueryResult<T>, PostgrestError>({
        queryKey: [table, where, single, limit, count],
        initialData,
        queryFn: fetchData,
        enabled,
        ...optionsHook,
    }) as Omit<UseQueryResult<SupabaseQueryResult<T>, PostgrestError>, "data"> & {
        data: SupabaseQueryResult<T>;
    };
}
