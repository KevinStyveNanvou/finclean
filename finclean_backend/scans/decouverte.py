import netifaces
import ipaddress
import subprocess

def get_network():
    iface = netifaces.gateways()['default'][netifaces.AF_INET][1]
    addr = netifaces.ifaddresses(iface)[netifaces.AF_INET][0]
    ip = addr['addr']
    netmask = addr['netmask']

    network = ipaddress.IPv4Network(f"{ip}/{netmask}", strict=False)
    return str(network)

network = get_network()
subprocess.run(["nmap", "-sn", network])