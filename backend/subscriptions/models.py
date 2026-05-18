import uuid
from datetime import timedelta
from django.db import models
from django.utils import timezone
from salons.models import Salon

PLAN_CHOICES = [
    ('free_trial',    'Free Trial'),
    ('starter',       'Starter'),
    ('professional',  'Professional'),
    ('premium',       'Premium'),
]

STATUS_CHOICES = [
    ('active',    'Active'),
    ('expired',   'Expired'),
    ('cancelled', 'Cancelled'),
]

PLANS = {
    'free_trial': {
        'name': 'Free Trial',
        'tagline': 'Get started at no cost',
        'price': 0,
        'duration_days': 30,
        'color': '#6B7280',
        'features': {
            'max_services': 5,
            'max_staff': 1,
            'max_bookings_per_month': 50,
            'max_gallery_photos': 5,
            'max_products': 0,
            'cosmetics': False,
            'home_visit': False,
            'promotions': False,
            'advanced_analytics': False,
            'inventory_reports': False,
            'featured_listing': False,
            'priority_support': False,
        },
        'bullets': [
            '5 services',
            '1 staff member',
            '50 bookings / month',
            '5 gallery photos',
            'Basic booking management',
            'Email support',
        ],
        'not_included': [
            'Cosmetics store',
            'Home visit bookings',
            'Promotions & offers',
            'Analytics',
            'Inventory management',
            'Featured listing',
        ],
    },
    'starter': {
        'name': 'Starter',
        'tagline': 'Everything you need to grow',
        'price': 2999,
        'duration_days': 30,
        'color': '#2563EB',
        'features': {
            'max_services': 15,
            'max_staff': 3,
            'max_bookings_per_month': 200,
            'max_gallery_photos': 20,
            'max_products': 0,
            'cosmetics': False,
            'home_visit': True,
            'promotions': True,
            'advanced_analytics': False,
            'inventory_reports': False,
            'featured_listing': False,
            'priority_support': False,
        },
        'bullets': [
            '15 services',
            '3 staff members',
            '200 bookings / month',
            '20 gallery photos',
            'Home visit bookings',
            'Promotions & offers',
            'Basic analytics',
            'Email + chat support',
        ],
        'not_included': [
            'Cosmetics store',
            'Inventory management',
            'Advanced analytics',
            'Featured listing',
        ],
    },
    'professional': {
        'name': 'Professional',
        'tagline': 'Sell, grow, and stand out',
        'price': 5999,
        'duration_days': 30,
        'color': '#7C3AED',
        'popular': True,
        'features': {
            'max_services': -1,
            'max_staff': 10,
            'max_bookings_per_month': -1,
            'max_gallery_photos': -1,
            'max_products': 100,
            'cosmetics': True,
            'home_visit': True,
            'promotions': True,
            'advanced_analytics': True,
            'inventory_reports': True,
            'featured_listing': False,
            'priority_support': True,
        },
        'bullets': [
            'Unlimited services',
            '10 staff members',
            'Unlimited bookings',
            'Unlimited gallery photos',
            'Cosmetics store (up to 100 products)',
            'Full inventory management',
            'GRN, sales & stock reports',
            'Advanced analytics & insights',
            'Home visits + promotions',
            'Priority email support',
        ],
        'not_included': [
            'Featured listing',
            'Unlimited products',
            'Dedicated account manager',
        ],
    },
    'premium': {
        'name': 'Premium',
        'tagline': 'The complete salon ecosystem',
        'price': 11999,
        'duration_days': 30,
        'color': '#D97706',
        'features': {
            'max_services': -1,
            'max_staff': -1,
            'max_bookings_per_month': -1,
            'max_gallery_photos': -1,
            'max_products': -1,
            'cosmetics': True,
            'home_visit': True,
            'promotions': True,
            'advanced_analytics': True,
            'inventory_reports': True,
            'featured_listing': True,
            'priority_support': True,
        },
        'bullets': [
            'Everything in Professional',
            'Unlimited staff members',
            'Unlimited cosmetics products',
            'Featured listing in search',
            'Top placement in discovery',
            'Dedicated account manager',
            'Custom branding options',
            'Full inventory suite',
            'Priority + phone support',
        ],
        'not_included': [],
    },
}


class Subscription(models.Model):
    salon           = models.OneToOneField(Salon, on_delete=models.CASCADE, related_name='subscription')
    plan            = models.CharField(max_length=20, choices=PLAN_CHOICES, default='free_trial')
    status          = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    started_at      = models.DateTimeField(auto_now_add=True)
    expires_at      = models.DateTimeField(null=True, blank=True)
    billing_name    = models.CharField(max_length=255, blank=True)
    billing_email   = models.EmailField(blank=True)
    card_last4      = models.CharField(max_length=4, blank=True)
    amount_paid     = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    transaction_ref = models.CharField(max_length=100, blank=True)

    def save(self, *args, **kwargs):
        if not self.transaction_ref and self.plan != 'free_trial':
            self.transaction_ref = f'TXN-{uuid.uuid4().hex[:12].upper()}'
        if not self.expires_at:
            days = PLANS[self.plan]['duration_days']
            self.expires_at = timezone.now() + timedelta(days=days)
        super().save(*args, **kwargs)

    @property
    def is_active(self):
        if self.status != 'active':
            return False
        if self.expires_at and timezone.now() > self.expires_at:
            return False
        return True

    @property
    def days_remaining(self):
        if not self.expires_at:
            return None
        diff = self.expires_at - timezone.now()
        return max(0, diff.days)

    @property
    def plan_features(self):
        return PLANS.get(self.plan, {}).get('features', {})

    @property
    def can_use_cosmetics(self):
        return self.is_active and self.plan_features.get('cosmetics', False)

    def __str__(self):
        return f"{self.salon.name} — {self.plan} ({self.status})"
