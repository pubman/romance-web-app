import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface SearchUser {
  user_id: string;
  display_name: string;
  avatar_url?: string;
}

interface UseUserSearchReturn {
  users: SearchUser[];
  loading: boolean;
  error: string | null;
  searchUsers: (query: string) => void;
  clearSearch: () => void;
}

export function useUserSearch(): UseUserSearchReturn {
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  const supabase = createClient();

  const searchUsers = useCallback(async (query: string) => {
    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Don't search if query is too short
    if (query.length < 2) {
      setUsers([]);
      setError(null);
      return;
    }

    // Debounce the search
    const timeout = setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to search users");
        }

        setUsers(data.users || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setUsers([]);
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce

    setSearchTimeout(timeout);
  }, [searchTimeout]);

  const clearSearch = useCallback(() => {
    setUsers([]);
    setError(null);
    setLoading(false);
    
    if (searchTimeout) {
      clearTimeout(searchTimeout);
      setSearchTimeout(null);
    }
  }, [searchTimeout]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  return {
    users,
    loading,
    error,
    searchUsers,
    clearSearch,
  };
}