FROM python:3.9-slim

WORKDIR /app

# Install Python dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend code into the container
COPY backend/ ./

EXPOSE 5000

CMD ["python", "app.py"]

