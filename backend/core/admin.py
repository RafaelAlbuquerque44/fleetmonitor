from django.contrib import admin
from .models import (
    Usuario, Motorista, Veiculo, Manutencao, Conta,
    RegistroTelemetria, AlertaPreditivo, OrdemServico, RegistroEmissaoESG
)

admin.site.register(Usuario)
admin.site.register(Motorista)
admin.site.register(Veiculo)
admin.site.register(Manutencao)
admin.site.register(Conta)
admin.site.register(RegistroTelemetria)
admin.site.register(AlertaPreditivo)
admin.site.register(OrdemServico)
admin.site.register(RegistroEmissaoESG)
