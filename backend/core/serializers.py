from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import Veiculo, Motorista, Manutencao, Conta, Telemetria, RegistroTelemetria, AlertaPreditivo, OrdemServico, RegistroEmissaoESG

Usuario = get_user_model()

class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ('id', 'username', 'email', 'cargo', 'is_active', 'password')
        read_only_fields = ('id', 'cargo', 'is_active')
        extra_kwargs = {
            'password': {'write_only': True, 'required': True, 'trim_whitespace': False},
            'email': {'required': True, 'allow_blank': False},
        }

    def validate(self, attrs):
        user = Usuario(username=attrs.get('username', ''), email=attrs.get('email', ''))
        validate_password(attrs['password'], user=user)
        return attrs
        
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


class TelemetriaSerializer(serializers.ModelSerializer):
    latitude = serializers.FloatField(min_value=-90, max_value=90)
    longitude = serializers.FloatField(min_value=-180, max_value=180)
    velocidade = serializers.FloatField(min_value=0, required=False, allow_null=True)
    consumo_combustivel = serializers.FloatField(min_value=0, required=False, allow_null=True)
    rpm = serializers.IntegerField(min_value=0, required=False, allow_null=True)

    class Meta:
        model = Telemetria
        fields = '__all__'
        read_only_fields = ('id', 'data_hora')

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
