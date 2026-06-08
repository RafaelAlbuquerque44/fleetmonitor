from django.db import models
from .empresa import Empresa

class Motorista(models.Model):
	empresa = models.ForeignKey(Empresa, on_delete=models.CASCADE)
	nome = models.CharField(max_length=100)
	cnh = models.CharField(max_length=20)
	tipo_cnh = models.CharField(max_length=20)
	status = models.CharField(max_length=20, choices=[
		('ativo', 'Ativo'),
		('desativado', 'Desativado')
	])

	def __str__(self):
		return self.nome