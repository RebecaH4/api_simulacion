from django.urls import path
from . import views

urlpatterns = [
    path('load',views.main,name='load')
]

