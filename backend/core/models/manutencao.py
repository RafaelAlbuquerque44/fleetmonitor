from django.db import models
from .veiculo import Veiculo

class Manutencao(models.Model):
	veiculo = models.ForeignKey(Veiculo, on_delete=models.CASCADE)

	tipo = models.CharField(max_length=50)
	descricao = models.TextField()

	data_abertura = models.DateField()
	data_execucao = models.DateField(null=True, blank=True)

	custo = models.DecimalField(max_digits=10, decimal_places=2)

	status = models.CharField(
		max_length=20, 
		choices=[
			('pendente', 'Pendente'),
			('concluida', 'Concluida'),
		], 
		default='pendente'
	)

	def __str__(self):
		return f"{self.tipo} - {self.veiculo}"
