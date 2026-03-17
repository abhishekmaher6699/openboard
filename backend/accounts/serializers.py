from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.validators import RegexValidator
from rest_framework import serializers

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    username = serializers.CharField(
        max_length=150,
        validators=[
            RegexValidator(
                regex=r'^[A-Za-z][\w.@+-]*$',
                message="Username must start with a letter and contain only letters, digits and @/./+/-/_"
            )
        ]
    )

    class Meta:
        model = User
        fields = ("username", "email", "password")

    def validate_email(self, value):
        value = value.lower()
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Email already exists")
        return value


    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("Username already exists")
        return value


    def validate_password(self, value):
        validate_password(value)  
        return value


    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user