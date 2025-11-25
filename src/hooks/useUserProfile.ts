import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  user_name: string;
  user_handle: string;
  avatar_url: string | null;
  is_verified: boolean;
}

export const useUserProfile = () => {
  return useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      return profile as Profile | null;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
};
