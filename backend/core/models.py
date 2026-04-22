from django.db import models
from django.contrib.auth.models import AbstractUser

class Usuario(AbstractUser):
    cargo = models.CharField(max_length=20, default="usuario") # admin, gerente, usuario
    
    def __str__(self):
        return self.username

class Motorista(models.Model):
    nome = models.CharField(max_length=255)
    cnh = models.CharField(max_length=50, unique=True, db_index=True)
    categoria_cnh = models.CharField(max_length=10, null=True, blank=True)
    status = models.CharField(max_length=20, default='active') # active, vacation, inactive
    classificacao = models.CharField(max_length=20, default='Bronze') # Gold, Silver, Bronze, Atenção
    pontuacao = models.FloatField(default=100.0)
    telefone = models.CharField(max_length=20, null=True, blank=True)

    def __str__(self):
        return self.nome

class Veiculo(models.Model):
    placa = models.CharField(max_length=20, unique=True, db_index=True)
    modelo = models.CharField(max_length=100)
    ano = models.IntegerField(null=True, blank=True)
    status = models.CharField(max_length=20, default="ativo") # ativo, manutencao
    
    # Novos campos adicionados para sincronia com o Frontend
    cidade = models.CharField(max_length=100, null=True, blank=True)
    uf = models.CharField(max_length=2, null=True, blank=True)
    lat = models.FloatField(null=True, blank=True)
    lng = models.FloatField(null=True, blank=True)
    motorista = models.ForeignKey(Motorista, null=True, blank=True, on_delete=models.SET_NULL, related_name='veiculos')
    
    nivel_combustivel = models.FloatField(null=True, blank=True)
    saude_pneus = models.FloatField(null=True, blank=True)
    sketchfab_id = models.CharField(max_length=100, null=True, blank=True)
    detalhes_manutencao = models.TextField(null=True, blank=True)
    
    # Dados Financeiros
    preco_compra = models.FloatField(null=True, blank=True)
    receita_mensal = models.FloatField(null=True, blank=True, default=0)
    manutencao_mensal = models.FloatField(null=True, blank=True, default=0)
    combustivel_mensal = models.FloatField(null=True, blank=True, default=0)

    def __str__(self):
        return f"{self.modelo} - {self.placa}"

class Telemetria(models.Model):
    veiculo = models.ForeignKey(Veiculo, on_delete=models.CASCADE, related_name='telemetria')
    data_hora = models.DateTimeField(auto_now_add=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    velocidade = models.FloatField(null=True, blank=True)
    consumo_combustivel = models.FloatField(null=True, blank=True)
    rpm = models.IntegerField(null=True, blank=True)

    def __str__(self):
        return f"Telemetria {self.id} - {self.veiculo.placa}"

class Manutencao(models.Model):
    veiculo = models.ForeignKey(Veiculo, on_delete=models.CASCADE, related_name='manutencoes')
    data = models.DateTimeField(auto_now_add=True)
    tipo = models.CharField(max_length=50) # preventiva, corretiva
    custo = models.FloatField(null=True, blank=True)
    descricao = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"Manutenção {self.tipo} - {self.veiculo.placa}"
