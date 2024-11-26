import { SupabaseClient } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { DatabaseTemp } from "./query";
import { createSupabaseQuery } from "./query/createSupabaseQuery";
import { createSupabaseSubscription } from "./subscription/createSupabaseSubscription";

export const createSupabaseTools = <D extends DatabaseTemp = any>(
  client: SupabaseClient<D>
) => {
  const useSupabase = () => useMemo(() => client, []);

  /**
   * Hook to get the user session.
   * @returns The user session.
   *
   * The query key is `['session', client]`.
   * The query function is `async () => client.auth.getSession()`.
   * The initial data is `null`.
   */
  const useSupaSession = () => {
    return useQuery({
      queryKey: ["session", client],
      initialData: null,
      queryFn: async () => {
        const { data, error } = await client.auth.getSession();
        if (error) throw error;
        return data.session;
      },
    });
  };

  const SupabaseQuery = createSupabaseQuery(client);

  const SupabaseSubscription = createSupabaseSubscription(
    client,
    SupabaseQuery.useSupaQuery
  );

  return {
    useSupabase,
    useSupaSession,
    ...SupabaseQuery,
    ...SupabaseSubscription,
  };
};
