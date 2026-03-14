from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Standardise all DRF error responses to:
    { "error": "short label", "message": "human-readable detail", "code": "SNAKE_CASE_CODE" }
    """
    response = exception_handler(exc, context)

    if response is not None:
        # Map status codes to human-readable labels
        status_labels = {
            400: 'BAD_REQUEST',
            401: 'UNAUTHORIZED',
            403: 'FORBIDDEN',
            404: 'NOT_FOUND',
            405: 'METHOD_NOT_ALLOWED',
            429: 'RATE_LIMITED',
            500: 'SERVER_ERROR',
            503: 'SERVICE_UNAVAILABLE',
        }

        code = status_labels.get(response.status_code, 'ERROR')
        data = response.data

        # Handle both dict and list/string error formats
        if isinstance(data, dict):
            if 'detail' in data:
                message = str(data['detail'])
            elif 'error' in data:
                message = str(data['error'])
            else:
                # Flatten field errors into a single message
                messages = []
                for field, errs in data.items():
                    if isinstance(errs, list):
                        messages.append(f"{field}: {', '.join(str(e) for e in errs)}")
                    else:
                        messages.append(f"{field}: {errs}")
                message = ' | '.join(messages) if messages else 'An error occurred.'
        elif isinstance(data, list):
            message = ' | '.join(str(e) for e in data)
        else:
            message = str(data)

        # Extract existing code from data if present (e.g., from AllModelsFailedError)
        existing_code = data.get('code') if isinstance(data, dict) else None

        response.data = {
            'error': code,
            'message': message,
            'code': existing_code or code,
        }

    else:
        # Unhandled exception — log it and return 500
        logger.exception(f"Unhandled exception in {context.get('view', 'unknown view')}: {exc}")
        response = Response({
            'error': 'SERVER_ERROR',
            'message': 'An unexpected error occurred. Please try again.',
            'code': 'SERVER_ERROR',
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return response
