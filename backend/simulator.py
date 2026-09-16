import requests
import time
import random

API_URL = "http://localhost:8000"

def simulate():
    print("Iniciando simulador da FleetMonitor...")
    
    # Check if there are vehicles. If not, wait.
    while True:
        try:
            response = requests.get(f"{API_URL}/vehicles")
            if response.status_code == 200:
                vehicles = response.json()
                if not vehicles:
                    print("Nenhum veículo encontrado. Aguardando...")
                else:
                    for vehicle in vehicles:
                        data = {
                            "vehicle_id": vehicle["id"],
                            "latitude": -23.5505 + random.uniform(-0.05, 0.05),
                            "longitude": -46.6333 + random.uniform(-0.05, 0.05),
                            "speed": random.uniform(0, 110),
                            "fuel_consumption": random.uniform(8.0, 15.0),
                            "rpm": int(random.uniform(800, 4500))
                        }
                        res = requests.post(f"{API_URL}/telemetry", json=data)
                        print(f"Telemetria enviada para {vehicle['plate']}: {res.status_code}")
            time.sleep(10) # Simulate every 10 seconds
        except requests.exceptions.ConnectionError:
            print("API indisponível. Tentando novamente em 5 segundos...")
            time.sleep(5)

if __name__ == "__main__":
    simulate()
