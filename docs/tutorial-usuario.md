# Tutorial de uso do FleetMonitor

Este roteiro apresenta os fluxos principais usando a empresa e a conta de
demonstração disponibilizadas pelo responsável pela instalação. Os cadastros
pertencem à empresa da sessão autenticada.

## 1. Entrar no sistema

1. Abra o endereço do FleetMonitor no navegador.
2. Entre com o e-mail e a senha da conta fornecida pelo administrador.
3. Use **Sair** no menu da conta para encerrar a sessão.

## 2. Consultar os indicadores

1. Abra **Indicadores**.
2. Confira o total de veículos e motoristas e a distribuição por situação.
3. Selecione as abas **Abastecimentos e consumo**, **Registros de manutenção**
   e **Pneus e histórico** para consultar cada área.
4. No histórico de abastecimentos, use **Filtrar por veículo** para limitar os
   registros e os indicadores de consumo a um veículo.

O consumo é estimado pela distância entre quilometragens consecutivas dividida
pelos litros do abastecimento atual. Abastecimentos parciais podem distorcer a
estimativa; o sistema sinaliza quando ainda não há histórico suficiente.

## 3. Cadastrar veículos e motoristas

1. Em **Veículos**, escolha **Adicionar veículo** e informe placa, chassi
   (opcional), marca, modelo, ano e situação.
2. Em **Motoristas**, escolha **Adicionar motorista** e preencha os dados de
   identificação e da CNH.
3. Use a busca e os filtros de situação para localizar cadastros.
4. Confira os alertas de validade da CNH na tela de motoristas.

Abastecimentos exigem um veículo cadastrado e um motorista ativo. Contas somente
leitura podem consultar os cadastros, mas não podem criar, editar ou excluir
informações.

## 4. Registrar um abastecimento

1. Abra **Indicadores** e selecione **Abastecimentos e consumo**.
2. Preencha veículo, motorista, litros, valor, data, quilometragem e rota.
   O posto é opcional.
3. Salve o registro e confira o histórico e o consumo calculado.
4. Para revisar um único veículo, use **Filtrar por veículo**.
5. A tabela **Consumo médio por veículo** compara cada abastecimento com a média
   histórica do veículo; quedas de 15% ou mais são sinalizadas como **Desvio**.

A quilometragem deve ser maior que o último abastecimento do veículo e a data
não pode estar antes do último registro.

## 5. Acompanhar manutenção preventiva

1. Abra **Manutenção** no menu da frota e selecione o veículo.
2. Em **Alertas por quilometragem**, configure o intervalo e a quilometragem
   da última troca de óleo ou substituição das pastilhas de freio.
3. Em **Registrar quilometragem**, informe a leitura do hodômetro, motorista e
   data. A distância desde a leitura anterior é calculada automaticamente.
4. Confira os alertas **Em dia** ou **Vencida**. Eles usam a última
   quilometragem registrada para o veículo.
5. Em **Registrar serviço**, registre atividades como lavagem, troca de óleo
   ou pastilhas. O histórico apresenta os serviços por veículo.

O número de chassi é opcional e pode ser informado ao cadastrar ou editar um
veículo. A ação **Enviar à manutenção** continua disponível na lista de
veículos para alterar a situação operacional do veículo.

## 6. Acompanhar pneus e histórico

1. Em **Indicadores**, selecione **Pneus e histórico**.
2. Cadastre o pneu com veículo, posição, marca, data de instalação e
   quilometragem.
3. Use as ações de histórico para registrar inspeção, problema, rodízio ou
   substituição, informando data, descrição e quilometragem.
4. Consulte a quilometragem de uso e os eventos associados ao pneu.
5. Acompanhe a barra de vida útil (referência de 60.000 km): o sistema alerta
   pneus acima de 80% de uso, pneus com vida útil excedida e substituições
   antecipadas (antes de 70% da referência), além da média por marca.

## 7. Exportar dados

1. Abra **Exportação**.
2. Selecione os veículos ou motoristas e gere o arquivo disponível.
3. Confira o arquivo antes de compartilhá-lo; ele contém dados da empresa da
   sessão atual.

## 8. Usar o Assistente IA

1. O administrador deve iniciar o perfil `ai` do Docker Compose e baixar o
   modelo configurado. No primeiro uso, a instalação do modelo pode levar alguns
   minutos.
2. Abra **Assistente IA** e escreva uma pergunta. Pressione **Enter** para
   enviar ou use **Shift+Enter** para criar uma nova linha.
3. Use **Nova conversa** para começar outro assunto.
4. Selecione um item em **Histórico** para reabrir a conversa.
5. Use o ícone de lixeira ao lado da conversa e confirme para excluir a conversa
   e suas mensagens.

O assistente responde com o modelo local e não consulta automaticamente os
dados operacionais da empresa. Se a IA não responder, verifique se os
contêineres `ollama` e `api` estão ativos, se o modelo está baixado e se
`OLLAMA_BASE_URL` aponta para o endereço acessível pela API.

## 9. Dados para demonstração

Para uma demonstração acadêmica, peça ao administrador uma conta de demonstração
com veículos e motoristas de exemplo. Em um ambiente local de desenvolvimento,
execute `bun run db:seed:admin-demo` no diretório `api` para preparar a conta
`admin@fleetmonitor.com` (senha local `admin`) com 14 veículos em todas as
situações, 108 abastecimentos com desvios de consumo, 17 manutenções (abertas,
vencidas, aguardando peça/serviço e concluídas) e 37 pneus com substituições e
alertas de desgaste. O comando recria os registros de abastecimento, manutenção
e pneus da empresa dessa conta, só roda fora de produção e apenas em banco local.

Roteiro sugerido para apresentar:

1. **Indicadores**: disponibilidade (57%), veículos indisponíveis, tempo médio
   parado e composição da frota por situação.
2. **Abastecimentos e consumo**: tabela de consumo médio por veículo e os
   registros marcados como **Desvio** (DFM2B34, GHT4D56 e TRK1A03).
3. **Manutenções**: recomendações geradas pelo histórico (prazo vencido,
   aguardando peça, recorrência) e histórico por veículo.
4. **Pneus e histórico**: pneus com vida útil excedida, próximos do limite e
   substituições antecipadas.

Para um nome de empresa específico, defina `ADMIN_DEMO_EMAIL`, `ADMIN_DEMO_PASSWORD`
e `DEMO_COMPANY_NAME` antes de executar o comando.
