FROM python:3.12-slim
WORKDIR /app
COPY model/requirements.lock.txt ./requirements.lock.txt
RUN pip install --no-cache-dir -r requirements.lock.txt
COPY model ./model
CMD ["python", "-m", "model.cli", "--help"]
