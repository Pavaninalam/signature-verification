"""
admins/views.py
Admin API endpoints (DRF) + template-based views.
"""
import jwt
from datetime import datetime, timedelta

from django.shortcuts import render, redirect
from django.contrib import messages
from django.conf import settings

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny

from users.models import UserRegistrationModel
from users.serializers import UserAdminSerializer
from .serializers import AdminLoginSerializer

# ---------------------------------------------------------------------------
# JWT helpers (admin-specific token with role claim)
# ---------------------------------------------------------------------------
SECRET_KEY = settings.SECRET_KEY
ADMIN_JWT_EXPIRY_HOURS = 8


def generate_admin_token():
    """Create a JWT token for the admin session."""
    payload = {
        'role': 'admin',
        'loginid': 'admin',
        'exp': datetime.utcnow() + timedelta(hours=ADMIN_JWT_EXPIRY_HOURS),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')


def decode_admin_token(token):
    """Decode admin JWT. Returns payload or None."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        if payload.get('role') != 'admin':
            return None
        return payload
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None


def admin_required(request):
    """Helper: extract and validate admin token from Authorization header."""
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return None
    return decode_admin_token(auth_header.split(' ')[1])


# ---------------------------------------------------------------------------
# Views
# ---------------------------------------------------------------------------

class AdminLoginView(APIView):
    """
    POST /api/admin/login/
    Authenticate admin with hardcoded credentials and return a JWT.
    Credentials are read from environment / settings (not hardcoded in code).
    """
    permission_classes = [AllowAny]

    # Default credentials — override via environment variables in production
    ADMIN_ID = getattr(settings, 'ADMIN_LOGIN_ID', 'admin')
    ADMIN_PW = getattr(settings, 'ADMIN_PASSWORD', 'admin')

    def post(self, request):
        serializer = AdminLoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        loginid = serializer.validated_data['loginid']
        password = serializer.validated_data['password']

        if loginid == self.ADMIN_ID and password == self.ADMIN_PW:
            token = generate_admin_token()
            return Response({'token': token}, status=status.HTTP_200_OK)

        return Response(
            {'error': 'Invalid admin credentials.'},
            status=status.HTTP_401_UNAUTHORIZED
        )


class RegisteredUsersView(APIView):
    """
    GET /api/admin/users/
    Return a list of all registered users.
    Requires admin JWT.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        if admin_required(request) is None:
            return Response({'error': 'Admin authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)

        users = UserRegistrationModel.objects.all()
        serializer = UserAdminSerializer(users, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ActivateUserView(APIView):
    """
    PATCH /api/admin/users/<user_id>/activate/
    Change a user's status from 'waiting' to 'activated'.
    Requires admin JWT.
    """
    permission_classes = [AllowAny]

    def patch(self, request, user_id):
        if admin_required(request) is None:
            return Response({'error': 'Admin authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            user = UserRegistrationModel.objects.get(id=user_id)
        except UserRegistrationModel.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        user.status = 'activated'
        user.save()
        return Response(
            {'message': f'User "{user.loginid}" has been activated.'},
            status=status.HTTP_200_OK
        )


class DeleteUserView(APIView):
    """
    DELETE /api/admin/users/<user_id>/delete/
    Permanently delete a user record.
    Requires admin JWT.
    """
    permission_classes = [AllowAny]

    def delete(self, request, user_id):
        if admin_required(request) is None:
            return Response({'error': 'Admin authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            user = UserRegistrationModel.objects.get(id=user_id)
        except UserRegistrationModel.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        loginid = user.loginid
        user.delete()
        return Response(
            {'message': f'User "{loginid}" has been deleted.'},
            status=status.HTTP_200_OK
        )


# ── Template-based admin views ────────────────────────────────────────────────

ADMIN_ID = getattr(settings, 'ADMIN_LOGIN_ID', 'admin')
ADMIN_PW = getattr(settings, 'ADMIN_PASSWORD', 'admin')


def admin_login_view(request):
    if request.method == 'POST':
        loginid = request.POST.get('loginid', '')
        password = request.POST.get('pswd', '')
        if loginid == ADMIN_ID and password == ADMIN_PW:
            request.session['admin'] = True
            return redirect('AdminHome')
        messages.error(request, 'Invalid admin credentials.')
    return render(request, 'AdminLogin.html')


def admin_home_view(request):
    if not request.session.get('admin'):
        return redirect('AdminLogin')
    users = UserRegistrationModel.objects.all()
    return render(request, 'admins/AdminHome.html', {'users': users})


def view_users(request):
    if not request.session.get('admin'):
        return redirect('AdminLogin')
    users = UserRegistrationModel.objects.all()
    return render(request, 'admins/viewregisterusers.html', {'users': users})


def activate_user(request, user_id):
    if not request.session.get('admin'):
        return redirect('AdminLogin')
    try:
        user = UserRegistrationModel.objects.get(id=user_id)
        user.status = 'activated'
        user.save()
        messages.success(request, f'User {user.loginid} activated.')
    except UserRegistrationModel.DoesNotExist:
        messages.error(request, 'User not found.')
    return redirect('viewUsers')


def delete_user(request, user_id):
    if not request.session.get('admin'):
        return redirect('AdminLogin')
    try:
        user = UserRegistrationModel.objects.get(id=user_id)
        user.delete()
        messages.success(request, 'User deleted.')
    except UserRegistrationModel.DoesNotExist:
        messages.error(request, 'User not found.')
    return redirect('viewUsers')
