"""Simula posições IoT usando o contrato e a autenticação da API Django."""
import json
import os
import random
import time
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / '.env')
API_URL = os.environ.get('API_URL', 'http://localhost:8000').rstrip('/')


def request_json(method, endpoint, token=None, payload=None):
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    request = Request(
        f'{API_URL}/{endpoint.strip("/")}/',
        data=json.dumps(payload).encode() if payload is not None else None,
        headers=headers,
        method=method,
    )
    with urlopen(request, timeout=10) as response:
        return json.load(response)


def authenticate():
    token = os.environ.get('API_TOKEN')
    if token:
        return token
    username = os.environ.get('SIMULATOR_USERNAME')
    password = os.environ.get('SIMULATOR_PASSWORD')
    if not username or not password:
        raise ValueError('Defina API_TOKEN ou SIMULATOR_USERNAME e SIMULATOR_PASSWORD no ambiente.')
    return request_json('POST', 'auth/login', payload={
        'username': username, 'password': password,
    })['access']


def simulate_cycle(token):
    vehicles = request_json('GET', 'veiculos', token)
    if not vehicles:
        print('Nenhum veículo encontrado. Aguardando...')
    for vehicle in vehicles:
        request_json('POST', 'posicoes', token, {
            'veiculo': vehicle['id'],
            'latitude': -23.5505 + random.uniform(-0.05, 0.05),
            'longitude': -46.6333 + random.uniform(-0.05, 0.05),
            'velocidade': random.uniform(0, 110),
            'consumo_combustivel': random.uniform(8.0, 15.0),
            'rpm': random.randint(800, 4500),
        })
        print(f"Telemetria enviada para {vehicle['placa']}")


def simulate():
    print('Iniciando simulador da FleetMonitor...')
    try:
        token = authenticate()
    except (ValueError, HTTPError, URLError, TimeoutError) as error:
        print(f'Não foi possível autenticar o simulador: {error}')
        return

    while True:
        try:
            simulate_cycle(token)
        except HTTPError as error:
            if error.code in (401, 403):
                print('Token expirado ou sem permissão. Atualize as credenciais e reinicie o simulador.')
                return
            print(f'API retornou HTTP {error.code}. Tentando novamente em 10 segundos...')
        except (URLError, TimeoutError):
            print('API indisponível. Tentando novamente em 10 segundos...')
        time.sleep(10)


if __name__ == '__main__':
    try:
        simulate()
    except KeyboardInterrupt:
        print('\nSimulador encerrado.')
