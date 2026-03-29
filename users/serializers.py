"""
users/serializers.py
Serializers convert Django model instances to/from JSON for the REST API.
"""
from rest_framework import serializers
from .models import UserRegistrationModel, Signature


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Used for creating a new user (registration).
    Password is write-only so it never appears in API responses.
    """
    password = serializers.CharField(write_only=True, min_length=4)

    class Meta:
        model = UserRegistrationModel
        fields = [
            'id', 'name', 'loginid', 'password',
            'mobile', 'email', 'locality',
            'address', 'city', 'state', 'status'
        ]
        read_only_fields = ['id', 'status']  # status is set by admin, not user

    def create(self, validated_data):
        # Status defaults to 'waiting' until admin activates
        validated_data['status'] = 'waiting'
        return super().create(validated_data)


class UserLoginSerializer(serializers.Serializer):
    """Used to validate login credentials."""
    loginid = serializers.CharField()
    password = serializers.CharField(write_only=True)


class ForgotPasswordSerializer(serializers.Serializer):
    """Accepts an email address to trigger OTP sending."""
    email = serializers.EmailField()


class VerifyOTPSerializer(serializers.Serializer):
    """Accepts the OTP entered by the user."""
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)


class ResetPasswordSerializer(serializers.Serializer):
    """Accepts new password along with the verified email."""
    email = serializers.EmailField()
    new_password = serializers.CharField(write_only=True, min_length=4)


class SignatureSerializer(serializers.Serializer):
    """
    Accepts two uploaded image files for signature verification.
    Uses FileField (not ImageField) so mobile browsers can upload
    camera photos that have no file extension in the filename.
    OpenCV handles format validation during preprocessing.
    """
    image1 = serializers.FileField()
    image2 = serializers.FileField()


class UserAdminSerializer(serializers.ModelSerializer):
    """
    Used by admin to list users and update their status.
    Password is excluded from admin view for security.
    """
    class Meta:
        model = UserRegistrationModel
        fields = [
            'id', 'name', 'loginid',
            'mobile', 'email', 'locality',
            'address', 'city', 'state', 'status'
        ]
        read_only_fields = ['id']
