FROM python:3.12-slim
WORKDIR /app
RUN pip install uv
COPY pyproject.toml .
COPY mcp_servers/ mcp_servers/
COPY config.yaml .
RUN uv sync
CMD ["uv", "run", "kaboo-serve", "config.yaml", "--host", "0.0.0.0", "--port", "8080"]
