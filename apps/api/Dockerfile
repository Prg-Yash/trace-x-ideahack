FROM python:3.11-slim

WORKDIR /app

# Copy the shared schemas package
COPY packages/py-schemas /app/packages/py-schemas

# Copy the API requirements
COPY apps/api/requirements.txt /app/apps/api/
WORKDIR /app/apps/api

# Install dependencies without cache
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY apps/api /app/apps/api

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
