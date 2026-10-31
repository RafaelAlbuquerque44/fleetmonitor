import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import { getCurrentUser, type AuthenticatedUser } from "./api";

type CurrentUserState = {
  user: AuthenticatedUser | null;
  isLoading: boolean;
  error: string | null;
};

const CurrentUserContext = createContext<CurrentUserState | null>(null);

export function CurrentUserProvider({ children }: PropsWithChildren) {
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
          setError("Não foi possível validar sua sessão. Verifique se a API está disponível.");
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

  return createElement(
    CurrentUserContext.Provider,
    { value: { user, isLoading, error } },
    children,
  );
}

export function useCurrentUser() {
  const currentUser = useContext(CurrentUserContext);
  if (!currentUser) {
    throw new Error("useCurrentUser must be used within CurrentUserProvider.");
  }
  return currentUser;
}
