import re
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import (
    Empresa, Veiculo, Motorista,
    SaidaVeiculo, ParametroManutencao,
    Manutencao, Perfil
)


class EmpresaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Empresa
        fields = '__all__'


class VeiculoSerializer(serializers.ModelSerializer):
    empresa_nome = serializers.CharField(source='empresa.nome', read_only=True)

    class Meta:
        model = Veiculo
        fields = '__all__'
        read_only_fields = ['empresa']


class MotoristaSerializer(serializers.ModelSerializer):
    empresa_nome = serializers.CharField(source='empresa.nome', read_only=True)

    class Meta:
        model = Motorista
        fields = '__all__'
        read_only_fields = ['empresa']


class SaidaVeiculoSerializer(serializers.ModelSerializer):
    veiculo_placa = serializers.CharField(source='veiculo.placa', read_only=True)
    motorista_nome = serializers.CharField(source='motorista.nome', read_only=True)

    class Meta:
        model = SaidaVeiculo
        fields = '__all__'


class ParametroManutencaoSerializer(serializers.ModelSerializer):
    veiculo_placa = serializers.CharField(source='veiculo.placa', read_only=True)

    class Meta:
        model = ParametroManutencao
        fields = '__all__'


class ManutencaoSerializer(serializers.ModelSerializer):
    veiculo_placa = serializers.CharField(source='veiculo.placa', read_only=True)

    class Meta:
        model = Manutencao
        fields = '__all__'


class PerfilSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    empresa_nome = serializers.CharField(source='empresa.nome', read_only=True)

    class Meta:
        model = Perfil
        fields = '__all__'
        read_only_fields = ['user']


class RegisterSerializer(serializers.ModelSerializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True, required=True)
    empresa_id = serializers.IntegerField()
    tipo_usuario = serializers.CharField()

    class Meta:
        model = User
        fields = ['username', 'password', 'empresa_id', 'tipo_usuario']


    def validate_password(self, value):
        validate_password(value)  # validação padrão Django

        if len(value) < 8:
            raise serializers.ValidationError("Mínimo 8 caracteres")

        if not re.search(r'[A-Z]', value):
            raise serializers.ValidationError("Precisa de letra maiúscula")

        if not re.search(r'\d', value):
            raise serializers.ValidationError("Precisa de número")

        if not re.search(r'[!@#$%^&*(),.?\":{}|<>]', value):
            raise serializers.ValidationError("Precisa de caractere especial")

        return value

    def validate(self, data):
        if not Empresa.objects.filter(id=data['empresa_id']).exists():
            raise serializers.ValidationError("Empresa não encontrada")

        return data


    def create(self, validated_data):
        empresa = Empresa.objects.get(id=validated_data['empresa_id'])

        user = User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password']
        )

        Perfil.objects.create(
            user=user,
            empresa=empresa,
            tipo_usuario=validated_data['tipo_usuario']
        )

        return user


class ResetPasswordSerializer(serializers.Serializer):
    username = serializers.CharField()
    new_password = serializers.CharField(write_only=True)

    def validate_new_password(self, value):
        validate_password(value)

        if len(value) < 8:
            raise serializers.ValidationError("Mínimo 8 caracteres")

        if not re.search(r'[A-Z]', value):
            raise serializers.ValidationError("Precisa de letra maiúscula")

        if not re.search(r'\d', value):
            raise serializers.ValidationError("Precisa de número")

        if not re.search(r'[!@#$%^&*(),.?\":{}|<>]', value):
            raise serializers.ValidationError("Precisa de caractere especial")

        return value