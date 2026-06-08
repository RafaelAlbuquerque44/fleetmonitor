from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdminOrGestor(BasePermission):

    def has_permission(self, request, view):
        user = request.user

        if not user or not user.is_authenticated:
            return False


        if hasattr(user, "perfil") and user.perfil.tipo_usuario == "admin":
            return True

        if hasattr(user, "perfil") and user.perfil.tipo_usuario == "gestor":

            if request.method in SAFE_METHODS:
                return True

            if request.method in ["POST", "PUT", "PATCH"]:
                return True

            if request.method == "DELETE":
                return False

        return False
