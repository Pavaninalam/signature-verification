"""
Management command: python manage.py seed_users
Creates default demo users if they don't already exist.
Run automatically in build.sh after migrate.
"""
from django.core.management.base import BaseCommand
from users.models import UserRegistrationModel


DEMO_USERS = [
    {
        'name':     'Demo User',
        'loginid':  '123',
        'password': 'Pavani@15',
        'mobile':   '9999999999',
        'email':    'demo@sigverify.com',
        'locality': 'Demo',
        'address':  'Demo Address',
        'city':     'Hyderabad',
        'state':    'Telangana',
        'status':   'activated',
    },
    {
        'name':     'Alex User',
        'loginid':  'alex',
        'password': 'Alex@141',
        'mobile':   '8888888888',
        'email':    'alex@sigverify.com',
        'locality': 'Alex',
        'address':  'Alex Address',
        'city':     'Hyderabad',
        'state':    'Telangana',
        'status':   'activated',
    },
    {
        'name':     'Test User',
        'loginid':  'testuser',
        'password': 'Test@1234',
        'mobile':   '7777777777',
        'email':    'test@sigverify.com',
        'locality': 'Test',
        'address':  'Test Address',
        'city':     'Hyderabad',
        'state':    'Telangana',
        'status':   'activated',
    },
]


class Command(BaseCommand):
    help = 'Seed demo users for production deployment'

    def handle(self, *args, **kwargs):
        created = 0
        for u in DEMO_USERS:
            obj, was_created = UserRegistrationModel.objects.get_or_create(
                loginid=u['loginid'],
                defaults=u,
            )
            if was_created:
                created += 1
                self.stdout.write(f"  Created user: {u['loginid']}")
            else:
                # Ensure existing user is activated
                if obj.status != 'activated':
                    obj.status = 'activated'
                    obj.save()
                    self.stdout.write(f"  Activated user: {u['loginid']}")
                else:
                    self.stdout.write(f"  Already exists: {u['loginid']}")

        self.stdout.write(self.style.SUCCESS(f'Seed complete. {created} new users created.'))
