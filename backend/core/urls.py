from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VeiculoViewSet, MotoristaViewSet, ManutencaoViewSet, ContaViewSet, register
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

router = DefaultRouter()
router.register(r'veiculos', VeiculoViewSet)
router.register(r'motoristas', MotoristaViewSet)
router.register(r'manutencoes', ManutencaoViewSet)
router.register(r'contas', ContaViewSet)

urlpatterns = [
    # Auth endpoints
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/registrar/', register, name='register'),

    # Automatically includes matching routes
    path('', include(router.urls)),
]
