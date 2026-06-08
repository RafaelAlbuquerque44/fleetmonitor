from django.db import models
from .veiculo import Veiculo
from .motorista import Motorista

class SaidaVeiculo(models.Model):
	veiculo = models.ForeignKey(Veiculo, on_delete=models.CASCADE)
	motorista = models.ForeignKey(Motorista, on_delete=models.CASCADE)
	destino = models.CharField(max_length=100)
	data_saida = models.DateTimeField()
	data_retorno = models.DateTimeField(null=True, blank=True)
	km_saida = models.IntegerField()
	km_entrada = models.IntegerField(null=True, blank=True)
	
	def __str__(self):
		return f"{self.veiculo} - {self.destino}"