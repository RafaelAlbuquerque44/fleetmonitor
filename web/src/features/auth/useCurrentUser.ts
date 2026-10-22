import { useEffect, useState } from "react";
import { getCurrentUser, type AuthenticatedUser } from "./api";

export function useCurrentUser() {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const currentUser = await getCurrentUser();
        if (active) {
          setUser(currentUser);
        }
      } catch {
        if (active) {
          setError("Não foi possível carregar a frota. Verifique se a API está disponível.");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  return { user, isLoading, error };
}
