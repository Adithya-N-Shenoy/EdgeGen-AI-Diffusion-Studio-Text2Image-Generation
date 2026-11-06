"""
Google Colab 1-Click Launch Entry Point
Calls the standalone edgegen_colab_gpu_server.py script.
"""

from edgegen_colab_gpu_server import start_server_and_tunnel
import time

if __name__ == "__main__":
    url = start_server_and_tunnel()
    while True:
        time.sleep(60)
