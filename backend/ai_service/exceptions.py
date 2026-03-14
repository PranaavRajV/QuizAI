class AIServiceException(Exception):
    """Custom exception for AI service related errors."""
    pass

class RateLimitError(AIServiceException):
    """Raised when the AI service returns a 429 status code."""
    pass

class InvalidResponseError(AIServiceException):
    """Raised when the AI service returns an invalid or unexpected response."""
    pass

class AllModelsFailedError(AIServiceException):
    """Raised when all models in the chain have failed."""
    pass
