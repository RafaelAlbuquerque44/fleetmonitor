from django.db import models
from .empresa import Empresa

class Veiculo(models.Model):
	empresa = models.ForeignKey(Empresa, on_delete=models.CASCADE)
	placa = models.CharField(max_length=10)
	marca = models.CharField(max_length=100)
	modelo = models.CharField(max_length=100)
	km_atual = models.IntegerField()
	ano = models.IntegerField()
	status = models.CharField(
		max_length=20, 
		choices=[
			('ativo', 'Ativo'),
			('manutencao', 'Em Manutenção'),
			('inativo', 'Inativo'),
		], 
		default='ativo'
	)

	def __str__(self):
		return self.placa