import json
from unittest.mock import patch

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Conta, Telemetria, Veiculo
from simulator import simulate_cycle


class APIArchitectureTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username='operador', password='SenhaValida#85207', email='operador@example.com',
        )

    def authenticate(self):
        response = self.client.post('/auth/login/', {
            'username': 'operador', 'password': 'SenhaValida#85207',
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")

    def test_all_domain_endpoints_require_authentication(self):
        for endpoint in ('veiculos', 'motoristas', 'contas', 'manutencoes', 'telemetria',
                         'posicoes', 'alertas-preditivos', 'ordens-servico', 'emissoes-esg'):
            with self.subTest(endpoint=endpoint):
                self.assertEqual(self.client.get(f'/{endpoint}/').status_code, status.HTTP_401_UNAUTHORIZED)

    def test_registration_validates_password_and_cannot_escalate_role(self):
        response = self.client.post('/auth/registrar/', {
            'username': 'novo', 'email': 'novo@example.com', 'password': '123',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        response = self.client.post('/auth/registrar/', {
            'username': 'novo', 'email': 'novo@example.com', 'password': 'NovaSenha#85207',
            'cargo': 'admin', 'is_active': False,
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['user']['cargo'], 'usuario')
        self.assertTrue(response.data['user']['is_active'])
        self.assertNotIn('password', response.data['user'])

    def test_migrated_endpoints_and_account_products_exist(self):
        self.authenticate()
        for endpoint in ('telemetria', 'alertas-preditivos', 'ordens-servico', 'emissoes-esg'):
            with self.subTest(endpoint=endpoint):
                self.assertEqual(self.client.get(f'/{endpoint}/').status_code, status.HTTP_200_OK)
        conta = Conta.objects.create(
            nome_cliente='Cliente', documento='123', email_contato='cliente@example.com',
            produto_telemetria=True, produto_ia_assistente=True,
        )
        response = self.client.get(f'/contas/{conta.pk}/')
        self.assertTrue(response.data['produto_telemetria'])
        self.assertTrue(response.data['produto_ia_assistente'])

    def test_simulator_payload_is_accepted_and_invalid_coordinates_are_rejected(self):
        self.authenticate()
        Veiculo.objects.create(placa='ABC-1234', modelo='Caminhão', ano=2024)

        def request_via_test_client(method, endpoint, token=None, payload=None):
            if method == 'GET':
                response = self.client.get(f'/{endpoint}/')
            else:
                response = self.client.post(f'/{endpoint}/', payload, format='json')
            self.assertIn(response.status_code, (status.HTTP_200_OK, status.HTTP_201_CREATED))
            return response.data

        with patch('simulator.request_json', side_effect=request_via_test_client):
            simulate_cycle('test-token')
        self.assertEqual(Telemetria.objects.count(), 1)
        payload = {
            'veiculo': Veiculo.objects.get().pk,
            'latitude': 91, 'longitude': -46, 'rpm': -1,
        }
        response = self.client.post('/posicoes/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('latitude', response.data)
        self.assertIn('rpm', response.data)

    def test_daily_telemetry_contract_remains_available(self):
        self.authenticate()
        vehicle = Veiculo.objects.create(placa='DEF-5678', modelo='Caminhão')
        response = self.client.post('/telemetria/', {
            'veiculo': vehicle.pk, 'data': '2026-10-08',
            'combustivel_gasto': 10, 'distancia_percorrida': 100, 'velocidade_media': 60,
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(json.loads(response.content)['distancia_percorrida'], 100)
