from fastapi import FastAPI

from .models import OptimizeRouteRequest, OptimizeRouteResponse
from .routing import optimize_routes

app = FastAPI(
    title="Asyne Route Optimizer",
    version="0.1.0",
    docs_url="/docs",
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/v1/routes/optimize", response_model=OptimizeRouteResponse)
def optimize_route(request: OptimizeRouteRequest) -> OptimizeRouteResponse:
    return optimize_routes(request)
