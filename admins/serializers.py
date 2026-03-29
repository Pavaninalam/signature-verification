"""
admins/serializers.py
Serializers for admin authentication.
"""
from rest_framework import serializers


class AdminLoginSerializer(serializers.Serializer):
    """Validates admin login credentials."""
    loginid = serializers.CharField()
    password = serializers.CharField(write_only=True)
