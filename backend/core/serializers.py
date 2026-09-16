from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Veiculo, Motorista, Manutencao, Conta, RegistroTelemetria, AlertaPreditivo, OrdemServico, RegistroEmissaoESG

Usuario = get_user_model()

class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ('id', 'username', 'email', 'cargo', 'is_active', 'password')
        extra_kwargs = {'password': {'write_only': True}}
        
    def create(self, validated_data):
        user = Usuario.objects.create_user(**validated_data)
        return user

class VeiculoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Veiculo
        fields = '__all__'

class MotoristaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Motorista
        fields = '__all__'

class ManutencaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Manutencao
        fields = '__all__'

class ContaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Conta
        fields = '__all__'

class RegistroTelemetriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = RegistroTelemetria
        fields = '__all__'

class AlertaPreditivoSerializer(serializers.ModelSerializer):
    class Meta:
        model = AlertaPreditivo
        fields = '__all__'

class OrdemServicoSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrdemServico
        fields = '__all__'

class RegistroEmissaoESGSerializer(serializers.ModelSerializer):
    class Meta:
        model = RegistroEmissaoESG
        fields = '__all__'
