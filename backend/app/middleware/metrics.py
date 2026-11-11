import time
import math
from typing import List
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

class LatencyTracker:
    def __init__(self, max_history: int = 1000):
        self.latencies: List[float] = []
        self.max_history = max_history

    def record(self, latency_ms: float):
        self.latencies.append(latency_ms)
        if len(self.latencies) > self.max_history:
            self.latencies.pop(0)

    def get_percentiles(self):
        if not self.latencies:
            return {
                "total_requests": 0,
                "p50_latency_ms": 0.0,
                "p90_latency_ms": 0.0,
                "p95_latency_ms": 0.0,
                "avg_latency_ms": 0.0,
                "target_met_p95_under_500ms": True
            }

        sorted_latencies = sorted(self.latencies)
        n = len(sorted_latencies)

        def percentile(p: float) -> float:
            idx = int(math.ceil((p / 100.0) * n)) - 1
            idx = max(0, min(idx, n - 1))
            return round(sorted_latencies[idx], 2)

        p50 = percentile(50)
        p90 = percentile(90)
        p95 = percentile(95)
        avg = round(sum(sorted_latencies) / n, 2)

        return {
            "total_requests": n,
            "p50_latency_ms": p50,
            "p90_latency_ms": p90,
            "p95_latency_ms": p95,
            "avg_latency_ms": avg,
            "target_met_p95_under_500ms": p95 < 500.0
        }

metrics_tracker = LatencyTracker()

class LatencyMetricsMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.perf_counter()
        response: Response = await call_next(request)
        latency_ms = (time.perf_counter() - start_time) * 1000.0
        
        # Record non-LLM or overall API latency
        if not request.url.path.startswith("/docs") and not request.url.path.startswith("/openapi.json"):
            metrics_tracker.record(latency_ms)
            
        response.headers["X-Response-Time-Ms"] = f"{latency_ms:.2f}"
        return response

