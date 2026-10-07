from math import asin, cos, radians, sin, sqrt

from fastapi import HTTPException
from ortools.constraint_solver import pywrapcp, routing_enums_pb2

from .models import (
    OptimizationMetrics,
    OptimizedRoute,
    OptimizeRouteRequest,
    OptimizeRouteResponse,
    RouteStop,
)


def haversine_meters(lat_a: float, lon_a: float, lat_b: float, lon_b: float) -> int:
    earth_radius_meters = 6_371_000
    delta_lat = radians(lat_b - lat_a)
    delta_lon = radians(lon_b - lon_a)
    a = (
        sin(delta_lat / 2) ** 2
        + cos(radians(lat_a)) * cos(radians(lat_b)) * sin(delta_lon / 2) ** 2
    )
    return round(2 * earth_radius_meters * asin(sqrt(a)))


def build_distance_matrix(request: OptimizeRouteRequest) -> list[list[int]]:
    coordinates = [request.depot, *request.stops]
    return [
        [
            haversine_meters(origin.latitude, origin.longitude, destination.latitude, destination.longitude)
            for destination in coordinates
        ]
        for origin in coordinates
    ]


def optimize_routes(request: OptimizeRouteRequest) -> OptimizeRouteResponse:
    distance_matrix = build_distance_matrix(request)
    manager = pywrapcp.RoutingIndexManager(
        len(distance_matrix),
        len(request.vehicles),
        0,
    )
    routing = pywrapcp.RoutingModel(manager)

    def distance_callback(from_index: int, to_index: int) -> int:
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        return distance_matrix[from_node][to_node]

    distance_callback_index = routing.RegisterTransitCallback(distance_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(distance_callback_index)

    demands = [0, *(stop.demand for stop in request.stops)]

    def demand_callback(from_index: int) -> int:
        return demands[manager.IndexToNode(from_index)]

    demand_callback_index = routing.RegisterUnaryTransitCallback(demand_callback)
    routing.AddDimensionWithVehicleCapacity(
        demand_callback_index,
        0,
        [vehicle.capacity for vehicle in request.vehicles],
        True,
        "Capacity",
    )

    search_parameters = pywrapcp.DefaultRoutingSearchParameters()
    search_parameters.first_solution_strategy = (
        routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    )
    search_parameters.local_search_metaheuristic = (
        routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
    )
    search_parameters.time_limit.seconds = 5

    solution = routing.SolveWithParameters(search_parameters)
    if solution is None:
        raise HTTPException(
            status_code=422,
            detail="No feasible route satisfies the vehicle capacities.",
        )

    optimized_routes: list[OptimizedRoute] = []
    assigned_stop_ids: set[str] = set()
    total_distance = 0

    for vehicle_index, vehicle in enumerate(request.vehicles):
        index = routing.Start(vehicle_index)
        route_stops: list[RouteStop] = []
        route_distance = 0
        route_demand = 0
        sequence = 1

        while not routing.IsEnd(index):
            next_index = solution.Value(routing.NextVar(index))
            next_node = manager.IndexToNode(next_index)
            arc_distance = routing.GetArcCostForVehicle(index, next_index, vehicle_index)
            route_distance += arc_distance

            if next_node != 0:
                stop = request.stops[next_node - 1]
                assigned_stop_ids.add(stop.id)
                route_demand += stop.demand
                route_stops.append(
                    RouteStop(
                        stop_id=stop.id,
                        sequence=sequence,
                        distance_from_previous_meters=arc_distance,
                    )
                )
                sequence += 1

            index = next_index

        if route_stops:
            total_distance += route_distance
            optimized_routes.append(
                OptimizedRoute(
                    vehicle_id=vehicle.id,
                    stops=route_stops,
                    total_distance_meters=route_distance,
                    total_demand=route_demand,
                )
            )

    unassigned = [stop.id for stop in request.stops if stop.id not in assigned_stop_ids]
    return OptimizeRouteResponse(
        routes=optimized_routes,
        unassigned_stop_ids=unassigned,
        metrics=OptimizationMetrics(
            total_distance_meters=total_distance,
            vehicles_used=len(optimized_routes),
        ),
    )
