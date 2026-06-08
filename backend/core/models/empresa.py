from django.db import models

class Empresa(models.Model):
	nome = models.CharField(max_length=100)
	cnpj = models.CharField(max_length=18)
	cidade = models.CharField(max_length=100)
	estado = models.CharField(max_length=2)

	def __str__(self):
		return self.nome