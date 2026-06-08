from django.db import models
from .veiculo import Veiculo

class ParametroManutencao(models.Model):
	veiculo = models.ForeignKey(Veiculo, on_delete=models.CASCADE)
	tipo = models.CharField(max_length=50)
	recorrencia_km = models.IntegerField()
	recorrencia_dias = models.IntegerField()

	def __str__(self):
		return f"{self.tipo} - {self.veiculo}"