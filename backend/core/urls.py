from django.urls import path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import (
    register,
    reset_password,
    EmpresaViewSet, VeiculoViewSet, MotoristaViewSet,
    SaidaVeiculoViewSet, ParametroManutencaoViewSet,
    ManutencaoViewSet, PerfilViewSet
)

router = DefaultRouter()

router.register(r'empresas', EmpresaViewSet, basename='empresa')
router.register(r'veiculos', VeiculoViewSet, basename='veiculo')
router.register(r'motoristas', MotoristaViewSet, basename='motorista')
router.register(r'saidas', SaidaVeiculoViewSet, basename='saida-veiculo')
router.register(r'parametros', ParametroManutencaoViewSet, basename='parametro-manutencao')
router.register(r'manutencoes', ManutencaoViewSet, basename='manutencao')
router.register(r'perfis', PerfilViewSet, basename='perfil')

urlpatterns = [
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    path('register/', register, name='register'),
    path('reset-password/', reset_password, name='reset_password'),
]

urlpatterns += router.urls