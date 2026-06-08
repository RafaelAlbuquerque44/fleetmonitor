from django.db import models
from django.contrib.auth.models import User
from .empresa import Empresa

class Perfil(models.Model):
	user = models.OneToOneField(User, on_delete=models.CASCADE)
	empresa = models.ForeignKey(Empresa, on_delete=models.CASCADE)
	tipo_usuario = models.CharField(
		max_length=20, 
		choices=[
			('admin', 'Administrador'),
			('gestor', 'Gestor'),
		]
	)

	def __str__(self):
		return self.user.username
