from rest_framework import serializers
from .models import Scan, HostInfo, Port, Vulnerability, PermanentScan
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role']

class VulnerabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Vulnerability
        fields = [
            'id', 'title', 'description', 'severity', 'cvss_score',
            'cve_id', 'exploit_available', 'risk_score', 'remediation',
            'port_id', 'host_id', 'scan_id'
        ]

class PortSerializer(serializers.ModelSerializer):
    vulnerabilities = VulnerabilitySerializer(many=True, read_only=True)

    class Meta:
        model = Port
        fields = [
            'id', 'port_number', 'protocol', 'state', 'service',
            'version', 'is_web_service', 'is_potentially_risky',
            'banner', 'vulnerabilities'
        ]

class HostInfoSerializer(serializers.ModelSerializer):
    ports = PortSerializer(many=True, read_only=True)
    vulnerabilities = VulnerabilitySerializer(many=True, read_only=True)

    class Meta:
        model = HostInfo
        fields = [
            'id', 'ip_address', 'os', 'cpe', 'latency',
            'total_ports_scanned', 'closed_ports', 'filtered_ports',
            'open_ports', 'ports', 'vulnerabilities', 'business_criticality'
        ]


class ScanDetailSerializer(serializers.ModelSerializer):
    host_info = HostInfoSerializer(many=True,read_only=True)
    ports = PortSerializer(many=True,read_only=True)
    vulnerabilities = VulnerabilitySerializer(many=True,read_only=True)

    class Meta:
        model = Scan
        fields = [
            'scan_id', 'name', 'description', 'target', 'status',
            'begin_at', 'end_at', 'host_info', 'ports', 'vulnerabilities'
        ]



class PermanentScanSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = PermanentScan
        fields = [
            'id', 'name', 'target', 'scan_type', 'frequency_hours',
            'is_active', 'last_run', 'next_run', 'created_at', 'user'
        ]
        read_only_fields = ['id', 'last_run', 'next_run', 'created_at']



class ScanSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    permanent_scan = PermanentScanSerializer(read_only=True)
    vulnerabilities = VulnerabilitySerializer(many=True, read_only=True)

    class Meta:
        model = Scan
        fields = [
            'scan_id','permanent_scan', 'name', 'description', 'target',
            'status', 'begin_at', 'end_at', 'scan_type', 'user', 'vulnerabilities'
        ]
