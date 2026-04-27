import socket, ipaddress

host_ip = socket.gethostbyname("host.docker.internal")  # Windows & Mac
network = str(ipaddress.ip_network(host_ip + '/24', strict=False))
print(network)  # => 192.168.2.0/24