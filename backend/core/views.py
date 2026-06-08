from django.contrib.auth.models import User
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from .models import (
    Empresa, Veiculo, Motorista,
    SaidaVeiculo, ParametroManutencao,
    Manutencao, Perfil
)

from .serializer import (
    EmpresaSerializer, VeiculoSerializer, MotoristaSerializer,
    SaidaVeiculoSerializer, ParametroManutencaoSerializer,
    ManutencaoSerializer, PerfilSerializer,
    ResetPasswordSerializer
)

from .permissions import IsAdminOrGestor


class IsAuthenticatedCustom(permissions.IsAuthenticated):
    pass


class EmpresaViewSet(viewsets.ModelViewSet):
    serializer_class = EmpresaSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrGestor]

    def get_queryset(self):
        user = self.request.user

        if not hasattr(user, "perfil") or not user.perfil.empresa:
            return Empresa.objects.none()

        return Empresa.objects.filter(id=user.perfil.empresa.id)


class VeiculoViewSet(viewsets.ModelViewSet):
    serializer_class = VeiculoSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrGestor]

    def get_queryset(self):
        return Veiculo.objects.filter(
            empresa=self.request.user.perfil.empresa
        )

    def perform_create(self, serializer):
        serializer.save(
            empresa=self.request.user.perfil.empresa
        )


class MotoristaViewSet(viewsets.ModelViewSet):
    serializer_class = MotoristaSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrGestor]

    def get_queryset(self):
        return Motorista.objects.filter(
            empresa=self.request.user.perfil.empresa
        )

    def perform_create(self, serializer):
        serializer.save(
            empresa=self.request.user.perfil.empresa
        )


class SaidaVeiculoViewSet(viewsets.ModelViewSet):
    serializer_class = SaidaVeiculoSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrGestor]

    def get_queryset(self):
        return SaidaVeiculo.objects.filter(
            veiculo__empresa=self.request.user.perfil.empresa
        )


class ParametroManutencaoViewSet(viewsets.ModelViewSet):
    serializer_class = ParametroManutencaoSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrGestor]

    def get_queryset(self):
        return ParametroManutencao.objects.filter(
            veiculo__empresa=self.request.user.perfil.empresa
        )


class ManutencaoViewSet(viewsets.ModelViewSet):
    serializer_class = ManutencaoSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrGestor]

    def get_queryset(self):
        return Manutencao.objects.filter(
            veiculo__empresa=self.request.user.perfil.empresa
        )


class PerfilViewSet(viewsets.ModelViewSet):
    serializer_class = PerfilSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Perfil.objects.filter(
            user=self.request.user
        )



@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register(request):
    username = request.data.get("username")
    password = request.data.get("password")

    if not username or not password:
        return Response(
            {"error": "username e password são obrigatórios"},
            status=status.HTTP_400_BAD_REQUEST
        )

    if User.objects.filter(username=username).exists():
        return Response(
            {"error": "Usuário já existe"},
            status=status.HTTP_400_BAD_REQUEST
        )

    user = User.objects.create_user(
        username=username,
        password=password
    )

    return Response(
        {"message": "Usuário criado com sucesso"},
        status=status.HTTP_201_CREATED
    )



@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def reset_password(request):
    serializer = ResetPasswordSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    username = serializer.validated_data['username']
    new_password = serializer.validated_data['new_password']

    try:
        user = User.objects.get(username=username)
        user.set_password(new_password)
        user.save()

        return Response(
            {"message": "Senha redefinida com sucesso"},
            status=status.HTTP_200_OK
        )

    except User.DoesNotExist:
        return Response(
            {"error": "Usuário não encontrado"},
            status=status.HTTP_404_NOT_FOUND
        )