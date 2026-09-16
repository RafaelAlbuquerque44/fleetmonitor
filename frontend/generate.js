const fs = require('fs');

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn2:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="fleet-complex" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn2:collaboration id="Collab_Fleet">
    <bpmn2:participant id="Pool_Cadastro" name="Gestão e Cadastros (BackOffice)" processRef="Process_C" />
    <bpmn2:participant id="Pool_Operacao" name="Telemetria e Manutenção IA (Operação)" processRef="Process_O" />
    <bpmn2:participant id="Pool_Analitico" name="Financeiro e Relatórios ESG (C-Level)" processRef="Process_A" />
    <bpmn2:messageFlow id="MsgFlow_1" sourceRef="T3" targetRef="S2" />
    <bpmn2:messageFlow id="MsgFlow_2" sourceRef="E3" targetRef="S3" />
  </bpmn2:collaboration>

  <bpmn2:process id="Process_C" isExecutable="false">
    <bpmn2:startEvent id="S1" name="Nova OS"><bpmn2:outgoing>Fc1</bpmn2:outgoing></bpmn2:startEvent>
    <bpmn2:task id="T1" name="Validar Motoristas"><bpmn2:incoming>Fc1</bpmn2:incoming><bpmn2:outgoing>Fc2</bpmn2:outgoing></bpmn2:task>
    <bpmn2:task id="T2" name="Inspeção de Veículos"><bpmn2:incoming>Fc2</bpmn2:incoming><bpmn2:outgoing>Fc3</bpmn2:outgoing></bpmn2:task>
    <bpmn2:task id="T3" name="Alocar Ativos para Viagem"><bpmn2:incoming>Fc3</bpmn2:incoming><bpmn2:outgoing>Fc4</bpmn2:outgoing></bpmn2:task>
    <bpmn2:endEvent id="E1" name="Pronto"><bpmn2:incoming>Fc4</bpmn2:incoming></bpmn2:endEvent>
    <bpmn2:sequenceFlow id="Fc1" sourceRef="S1" targetRef="T1" />
    <bpmn2:sequenceFlow id="Fc2" sourceRef="T1" targetRef="T2" />
    <bpmn2:sequenceFlow id="Fc3" sourceRef="T2" targetRef="T3" />
    <bpmn2:sequenceFlow id="Fc4" sourceRef="T3" targetRef="E1" />
  </bpmn2:process>

  <bpmn2:process id="Process_O" isExecutable="false">
    <bpmn2:startEvent id="S2" name="Ordem Liberada"><bpmn2:outgoing>Fo1</bpmn2:outgoing></bpmn2:startEvent>
    <bpmn2:task id="T4" name="Rastreamento em Tempo Real"><bpmn2:incoming>Fo1</bpmn2:incoming><bpmn2:incoming>FoLoop</bpmn2:incoming><bpmn2:outgoing>Fo2</bpmn2:outgoing></bpmn2:task>
    <bpmn2:exclusiveGateway id="G1" name="Alerta Crítico?"><bpmn2:incoming>Fo2</bpmn2:incoming><bpmn2:outgoing>Fo3_Sim</bpmn2:outgoing><bpmn2:outgoing>Fo3_Nao</bpmn2:outgoing></bpmn2:exclusiveGateway>
    <bpmn2:task id="T5" name="FleetAI: Diagnóstico Motores"><bpmn2:incoming>Fo3_Sim</bpmn2:incoming><bpmn2:outgoing>Fo4</bpmn2:outgoing></bpmn2:task>
    <bpmn2:exclusiveGateway id="G2" name="Acionar Oficina?"><bpmn2:incoming>Fo4</bpmn2:incoming><bpmn2:outgoing>Fo5_Sim</bpmn2:outgoing><bpmn2:outgoing>FoLoop</bpmn2:outgoing></bpmn2:exclusiveGateway>
    <bpmn2:endEvent id="E2" name="Parada Oficina"><bpmn2:incoming>Fo5_Sim</bpmn2:incoming></bpmn2:endEvent>
    <bpmn2:intermediateThrowEvent id="E3" name="Rota Finalizada"><bpmn2:incoming>Fo3_Nao</bpmn2:incoming></bpmn2:intermediateThrowEvent>
    <bpmn2:sequenceFlow id="Fo1" sourceRef="S2" targetRef="T4" />
    <bpmn2:sequenceFlow id="Fo2" sourceRef="T4" targetRef="G1" />
    <bpmn2:sequenceFlow id="Fo3_Sim" name="Sim" sourceRef="G1" targetRef="T5" />
    <bpmn2:sequenceFlow id="Fo3_Nao" name="Não" sourceRef="G1" targetRef="E3" />
    <bpmn2:sequenceFlow id="Fo4" sourceRef="T5" targetRef="G2" />
    <bpmn2:sequenceFlow id="Fo5_Sim" name="Oficina" sourceRef="G2" targetRef="E2" />
    <bpmn2:sequenceFlow id="FoLoop" name="Prosseguir" sourceRef="G2" targetRef="T4" />
  </bpmn2:process>

  <bpmn2:process id="Process_A" isExecutable="false">
    <bpmn2:startEvent id="S3" name="Fim de Rota"><bpmn2:outgoing>Fa1</bpmn2:outgoing></bpmn2:startEvent>
    <bpmn2:parallelGateway id="G3"><bpmn2:incoming>Fa1</bpmn2:incoming><bpmn2:outgoing>Fa2</bpmn2:outgoing><bpmn2:outgoing>Fa3</bpmn2:outgoing></bpmn2:parallelGateway>
    <bpmn2:task id="T6" name="Apuração Financeira e Custos"><bpmn2:incoming>Fa2</bpmn2:incoming><bpmn2:outgoing>Fa4</bpmn2:outgoing></bpmn2:task>
    <bpmn2:task id="T7" name="Relatório de CO2 (ESG)"><bpmn2:incoming>Fa3</bpmn2:incoming><bpmn2:outgoing>Fa5</bpmn2:outgoing></bpmn2:task>
    <bpmn2:parallelGateway id="G4"><bpmn2:incoming>Fa4</bpmn2:incoming><bpmn2:incoming>Fa5</bpmn2:incoming><bpmn2:outgoing>Fa6</bpmn2:outgoing></bpmn2:parallelGateway>
    <bpmn2:task id="T8" name="Atualizar Dashboards C-Level"><bpmn2:incoming>Fa6</bpmn2:incoming><bpmn2:outgoing>Fa7</bpmn2:outgoing></bpmn2:task>
    <bpmn2:endEvent id="E4" name="Ciclo 360 OK"><bpmn2:incoming>Fa7</bpmn2:incoming></bpmn2:endEvent>
    
    <bpmn2:sequenceFlow id="Fa1" sourceRef="S3" targetRef="G3" />
    <bpmn2:sequenceFlow id="Fa2" sourceRef="G3" targetRef="T6" />
    <bpmn2:sequenceFlow id="Fa3" sourceRef="G3" targetRef="T7" />
    <bpmn2:sequenceFlow id="Fa4" sourceRef="T6" targetRef="G4" />
    <bpmn2:sequenceFlow id="Fa5" sourceRef="T7" targetRef="G4" />
    <bpmn2:sequenceFlow id="Fa6" sourceRef="G4" targetRef="T8" />
    <bpmn2:sequenceFlow id="Fa7" sourceRef="T8" targetRef="E4" />
  </bpmn2:process>

  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Collab_Fleet">
      <!-- Pool 1 -->
      <bpmndi:BPMNShape id="Pool_Cadastro_di" bpmnElement="Pool_Cadastro" isHorizontal="true">
        <dc:Bounds x="50" y="50" width="800" height="150" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="S1_di" bpmnElement="S1"><dc:Bounds x="100" y="107" width="36" height="36" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="T1_di" bpmnElement="T1"><dc:Bounds x="180" y="85" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="T2_di" bpmnElement="T2"><dc:Bounds x="320" y="85" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="T3_di" bpmnElement="T3"><dc:Bounds x="460" y="85" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="E1_di" bpmnElement="E1"><dc:Bounds x="610" y="107" width="36" height="36" /></bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="Fc1_di" bpmnElement="Fc1">
        <di:waypoint x="136" y="125" /><di:waypoint x="180" y="125" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Fc2_di" bpmnElement="Fc2">
        <di:waypoint x="280" y="125" /><di:waypoint x="320" y="125" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Fc3_di" bpmnElement="Fc3">
        <di:waypoint x="420" y="125" /><di:waypoint x="460" y="125" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Fc4_di" bpmnElement="Fc4">
        <di:waypoint x="560" y="125" /><di:waypoint x="610" y="125" />
      </bpmndi:BPMNEdge>

      <!-- Pool 2 -->
      <bpmndi:BPMNShape id="Pool_Operacao_di" bpmnElement="Pool_Operacao" isHorizontal="true">
        <dc:Bounds x="50" y="250" width="800" height="250" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="S2_di" bpmnElement="S2"><dc:Bounds x="100" y="322" width="36" height="36" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="T4_di" bpmnElement="T4"><dc:Bounds x="180" y="300" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="G1_di" bpmnElement="G1" isMarkerVisible="true"><dc:Bounds x="330" y="315" width="50" height="50" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="T5_di" bpmnElement="T5"><dc:Bounds x="410" y="400" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="G2_di" bpmnElement="G2" isMarkerVisible="true"><dc:Bounds x="560" y="415" width="50" height="50" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="E2_di" bpmnElement="E2"><dc:Bounds x="650" y="422" width="36" height="36" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="E3_di" bpmnElement="E3"><dc:Bounds x="442" y="322" width="36" height="36" /></bpmndi:BPMNShape>
      
      <bpmndi:BPMNEdge id="Fo1_di" bpmnElement="Fo1">
        <di:waypoint x="136" y="340" /><di:waypoint x="180" y="340" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Fo2_di" bpmnElement="Fo2">
        <di:waypoint x="280" y="340" /><di:waypoint x="330" y="340" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Fo3_Sim_di" bpmnElement="Fo3_Sim">
        <di:waypoint x="355" y="365" /><di:waypoint x="355" y="440" /><di:waypoint x="410" y="440" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Fo3_Nao_di" bpmnElement="Fo3_Nao">
        <di:waypoint x="380" y="340" /><di:waypoint x="442" y="340" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Fo4_di" bpmnElement="Fo4">
        <di:waypoint x="510" y="440" /><di:waypoint x="560" y="440" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Fo5_Sim_di" bpmnElement="Fo5_Sim">
        <di:waypoint x="610" y="440" /><di:waypoint x="650" y="440" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="FoLoop_di" bpmnElement="FoLoop">
        <di:waypoint x="585" y="465" /><di:waypoint x="585" y="490" /><di:waypoint x="230" y="490" /><di:waypoint x="230" y="380" />
      </bpmndi:BPMNEdge>

      <!-- Pool 3 -->
      <bpmndi:BPMNShape id="Pool_Analitico_di" bpmnElement="Pool_Analitico" isHorizontal="true">
        <dc:Bounds x="50" y="550" width="800" height="200" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="S3_di" bpmnElement="S3"><dc:Bounds x="100" y="607" width="36" height="36" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="G3_di" bpmnElement="G3"><dc:Bounds x="180" y="600" width="50" height="50" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="T6_di" bpmnElement="T6"><dc:Bounds x="260" y="560" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="T7_di" bpmnElement="T7"><dc:Bounds x="260" y="660" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="G4_di" bpmnElement="G4"><dc:Bounds x="400" y="600" width="50" height="50" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="T8_di" bpmnElement="T8"><dc:Bounds x="480" y="585" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="E4_di" bpmnElement="E4"><dc:Bounds x="630" y="607" width="36" height="36" /></bpmndi:BPMNShape>
      
      <bpmndi:BPMNEdge id="Fa1_di" bpmnElement="Fa1">
        <di:waypoint x="136" y="625" /><di:waypoint x="180" y="625" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Fa2_di" bpmnElement="Fa2">
        <di:waypoint x="205" y="600" /><di:waypoint x="205" y="600" /><di:waypoint x="260" y="600" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Fa3_di" bpmnElement="Fa3">
        <di:waypoint x="205" y="650" /><di:waypoint x="205" y="700" /><di:waypoint x="260" y="700" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Fa4_di" bpmnElement="Fa4">
        <di:waypoint x="360" y="600" /><di:waypoint x="400" y="600" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Fa5_di" bpmnElement="Fa5">
        <di:waypoint x="360" y="700" /><di:waypoint x="425" y="700" /><di:waypoint x="425" y="650" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Fa6_di" bpmnElement="Fa6">
        <di:waypoint x="450" y="625" /><di:waypoint x="480" y="625" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Fa7_di" bpmnElement="Fa7">
        <di:waypoint x="580" y="625" /><di:waypoint x="630" y="625" />
      </bpmndi:BPMNEdge>

      <!-- Messages -->
      <bpmndi:BPMNEdge id="MsgFlow_1_di" bpmnElement="MsgFlow_1">
        <di:waypoint x="510" y="165" /><di:waypoint x="510" y="240" /><di:waypoint x="118" y="240" /><di:waypoint x="118" y="322" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="MsgFlow_2_di" bpmnElement="MsgFlow_2">
        <di:waypoint x="460" y="358" /><di:waypoint x="460" y="500" /><di:waypoint x="118" y="500" /><di:waypoint x="118" y="607" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn2:definitions>`;

const targetFile = 'd:/Programação/Projeto Faculdade/FleetMonitor/frontend/src/pages/Processes/index.tsx';
let content = fs.readFileSync(targetFile, 'utf8');
const regex = /const emptyBpmn = \`[\s\S]*?\`;/;
content = content.replace(regex, "const emptyBpmn = \`" + xml + "\`;");
fs.writeFileSync(targetFile, content);
console.log('BPMN Injected Successfully!');
