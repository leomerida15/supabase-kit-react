import { SupabaseClient } from "@supabase/supabase-js";
import { useMemo } from "react";

export const createSupabaseTools = <D = any>(client: SupabaseClient<D>) => {
    
    const useSupabase = () => useMemo(() => client, [client]);

    

    return {
        useSupabase
    }
}   