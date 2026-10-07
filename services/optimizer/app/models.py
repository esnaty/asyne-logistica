from pydantic import BaseModel, ConfigDict, Field


class Coordinate(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)


class Stop(Coordinate):
    id: str = Field(min_length=1)
    demand: int = Field(default=1, ge=0)
    service_minutes: int = Field(default=5, ge=0, alias="serviceMinutes")
    model_config = ConfigDict(populate_by_name=True)


class Vehicle(BaseModel):
    id: str = Field(min_length=1)
    capacity: int = Field(gt=0)


class OptimizeRouteRequest(BaseModel):
    depot: Coordinate
    stops: list[Stop] = Field(min_length=1)
    vehicles: list[Vehicle] = Field(min_length=1)


class RouteStop(BaseModel):
    stop_id: str = Field(alias="stopId")
    sequence: int
    distance_from_previous_meters: int = Field(alias="distanceFromPreviousMeters")
    model_config = ConfigDict(populate_by_name=True)


class OptimizedRoute(BaseModel):
    vehicle_id: str = Field(alias="vehicleId")
    stops: list[RouteStop]
    total_distance_meters: int = Field(alias="totalDistanceMeters")
    total_demand: int = Field(alias="totalDemand")
    model_config = ConfigDict(populate_by_name=True)


class OptimizationMetrics(BaseModel):
    total_distance_meters: int = Field(alias="totalDistanceMeters")
    vehicles_used: int = Field(alias="vehiclesUsed")
    model_config = ConfigDict(populate_by_name=True)


class OptimizeRouteResponse(BaseModel):
    routes: list[OptimizedRoute]
    unassigned_stop_ids: list[str] = Field(alias="unassignedStopIds")
    metrics: OptimizationMetrics
    model_config = ConfigDict(populate_by_name=True)
