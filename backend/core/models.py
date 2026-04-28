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


class Manutencao(models.Model):
    veiculo = models.ForeignKey(Veiculo, on_delete=models.CASCADE, related_name='manutencoes')
    data = models.DateTimeField(auto_now_add=True)
    tipo = models.CharField(max_length=50) # preventiva, corretiva
    custo = models.FloatField(null=True, blank=True)
    descricao = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"Manutenção {self.tipo} - {self.veiculo.placa}"

class Conta(models.Model):
    nome_cliente = models.CharField(max_length=255)
    documento = models.CharField(max_length=20, unique=True)
    email_contato = models.EmailField()
    telefone = models.CharField(max_length=20, null=True, blank=True)
    status = models.CharField(max_length=20, default='ativo') # ativo, inativo, pendente
    
    # Produtos/Módulos habilitados
    produto_manutencao = models.BooleanField(default=False)
    produto_financeiro = models.BooleanField(default=False)
    produto_ia_assistente = models.BooleanField(default=False)
    produto_roteirizacao = models.BooleanField(default=False)
    
    criado_em = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.nome_cliente
