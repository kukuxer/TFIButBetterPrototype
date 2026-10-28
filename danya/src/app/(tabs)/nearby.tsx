
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    Alert,
    ActivityIndicator,
    Pressable,
    Text,
    View,
} from "react-native";
import * as Location from "expo-location";
import MapView, {
    Marker,
    Polyline,
    type LatLng,
} from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/constants/style/ThemeContext";
import {
    BUS_CAPACITY,
    INITIAL_OCCUPANCY,
    INITIAL_REGION,
    STOPS,
    type BusStop,
    type Coordinate,
} from "@/constants/routes/route982";
import createNearbyStyles from "../../styles/nearby.styles";

type Selection =
    | { type: "stop"; stop: BusStop }
    | { type: "bus" }
    | null;

const OSRM_URL = "https://router.project-osrm.org/route/v1/driving/";

function distanceBetween(a: Coordinate, b: Coordinate) {
    const toRadians = (value: number) => (value * Math.PI) / 180;
    const earthRadius = 6371000;

    const dLat = toRadians(b.latitude - a.latitude);
    const dLon = toRadians(b.longitude - a.longitude);
    const lat1 = toRadians(a.latitude);
    const lat2 = toRadians(b.latitude);

    const h =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1) *
        Math.cos(lat2) *
        Math.sin(dLon / 2) ** 2;

    return 2 * earthRadius * Math.asin(Math.sqrt(h));
}

function getPointAlongRoute(
    coordinates: LatLng[],
    progress: number
): Coordinate {
    if (coordinates.length === 0) {
        return {
            latitude: STOPS[0].latitude,
            longitude: STOPS[0].longitude,
        };
    }

    if (coordinates.length === 1) {
        return coordinates[0];
    }

    const distances: number[] = [];
    let totalDistance = 0;

    for (let i = 1; i < coordinates.length; i++) {
        const distance = distanceBetween(
            coordinates[i - 1],
            coordinates[i]
        );
        distances.push(distance);
        totalDistance += distance;
    }

    if (totalDistance === 0) {
        return coordinates[0];
    }

    const targetDistance =
        Math.max(0, Math.min(1, progress)) * totalDistance;

    let travelled = 0;

    for (let i = 1; i < coordinates.length; i++) {
        const segmentDistance = distances[i - 1];

        if (travelled + segmentDistance >= targetDistance) {
            const segmentProgress =
                segmentDistance === 0
                    ? 0
                    : (targetDistance - travelled) / segmentDistance;

            return {
                latitude:
                    coordinates[i - 1].latitude +
                    (coordinates[i].latitude -
                        coordinates[i - 1].latitude) *
                    segmentProgress,
                longitude:
                    coordinates[i - 1].longitude +
                    (coordinates[i].longitude -
                        coordinates[i - 1].longitude) *
                    segmentProgress,
            };
        }

        travelled += segmentDistance;
    }

    return coordinates[coordinates.length - 1];
}

export default function NearbyScreen() {
    const insets = useSafeAreaInsets();
    const { colors } = useTheme();
    const styles = useMemo(() => createNearbyStyles(colors), [colors]);

    const mapRef = useRef<MapView | null>(null);

    const [selection, setSelection] = useState<Selection>(null);
    const [routeCoordinates, setRouteCoordinates] = useState<LatLng[]>([]);
    const [busProgress, setBusProgress] = useState(0.12);
    const [isPaused, setIsPaused] = useState(false);
    const [passengers, setPassengers] = useState(INITIAL_OCCUPANCY);

    const [hasLocationPermission, setHasLocationPermission] =
        useState(false);
    const [locating, setLocating] = useState(false);

    const [routeLoading, setRouteLoading] = useState(true);

    const busPosition = useMemo(
        () => getPointAlongRoute(routeCoordinates, busProgress),
        [routeCoordinates, busProgress]
    );

    const currentStopIndex = Math.min(
        STOPS.length - 1,
        Math.floor(busProgress * STOPS.length)
    );

    const nextStopIndex = Math.min(
        STOPS.length - 1,
        currentStopIndex + 1
    );

    const nextStop = STOPS[nextStopIndex];

    useEffect(() => {
        let cancelled = false;

        async function loadRoadRoute() {
            try {
                const chunks: LatLng[] = [];

                // Request road geometry in manageable chunks.
                for (let start = 0; start < STOPS.length - 1; start += 4) {
                    const end = Math.min(start + 4, STOPS.length - 1);
                    const stopChunk = STOPS.slice(start, end + 1);

                    const coordinates = stopChunk
                        .map(
                            (stop) =>
                                `${stop.longitude},${stop.latitude}`
                        )
                        .join(";");

                    const response = await fetch(
                        `${OSRM_URL}${coordinates}?overview=full&geometries=geojson&steps=false`
                    );

                    if (!response.ok) {
                        throw new Error(
                            `Routing server returned ${response.status}`
                        );
                    }

                    const data = await response.json();

                    if (
                        data.code !== "Ok" ||
                        !Array.isArray(data.routes?.[0]?.geometry?.coordinates)
                    ) {
                        throw new Error(
                            data.message || "No road route was returned"
                        );
                    }

                    const geometry = data.routes[0].geometry.coordinates;

                    const converted: LatLng[] = geometry.map(
                        (point: [number, number]) => ({
                            latitude: point[1],
                            longitude: point[0],
                        })
                    );

                    if (converted.length < 2) {
                        throw new Error("The road route is incomplete");
                    }

                    chunks.push(
                        ...(chunks.length > 0
                            ? converted.slice(1)
                            : converted)
                    );
                }

                if (!cancelled) {
                    if (chunks.length < 2) {
                        throw new Error("No complete road route was returned");
                    }

                    setRouteCoordinates(chunks);
                }
            } catch (error) {
                if (!cancelled) {
                    setRouteCoordinates([]);

                    Alert.alert(
                        "Road route unavailable",
                        "The routing service couldn't calculate the route right now. Please try again later."
                    );
                }
            } finally {
                if (!cancelled) {
                    setRouteLoading(false);
                }
            }
        }

        loadRoadRoute();

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (isPaused) {
            return;
        }

        const interval = setInterval(() => {
            setBusProgress((previous) =>
                previous >= 0.995 ? 0 : previous + 0.0015
            );
        }, 1000);

        return () => clearInterval(interval);
    }, [isPaused]);

    const centerOnMyLocation = async () => {
        if (locating) {
            return;
        }

        setLocating(true);

        try {
            const permission =
                await Location.requestForegroundPermissionsAsync();

            if (permission.status !== "granted") {
                Alert.alert(
                    "Location permission needed",
                    "Allow location access to see your position on the map. You can enable it in your iPhone Settings."
                );
                return;
            }

            setHasLocationPermission(true);

            const position = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });

            mapRef.current?.animateToRegion(
                {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    latitudeDelta: 0.025,
                    longitudeDelta: 0.025,
                },
                700
            );
        } catch {
            Alert.alert(
                "Couldn't get your location",
                "Check that Location Services are enabled and try again."
            );
        } finally {
            setLocating(false);
        }
    };

    const getStopEta = (stop: BusStop) => {
        const stopIndex = STOPS.findIndex((item) => item.id === stop.id);
        const remainingStops = Math.max(
            0,
            stopIndex - currentStopIndex
        );

        // Prototype estimate, not a live timetable prediction.
        return remainingStops === 0
            ? "Arriving"
            : `~${remainingStops * 5} min`;
    };

    const getSeatsAfterStop = (stop: BusStop) => {
        const remaining = Math.max(
            0,
            Math.min(
                BUS_CAPACITY,
                passengers - stop.gettingOff + stop.boarding
            )
        );

        return Math.max(0, BUS_CAPACITY - remaining);
    };

    const clearSelection = () => {
        setSelection(null);
    };

    const testOccupancy = () => {
        setPassengers((previous) =>
            previous >= BUS_CAPACITY ? 8 : Math.min(BUS_CAPACITY, previous + 3)
        );
    };

    const occupancyPercentage = Math.min(
        100,
        (passengers / BUS_CAPACITY) * 100
    );

    const mapControlsBottom = insets.bottom + 140;

    return (
        <View style={styles.screen}>
            <MapView
                ref={mapRef}
                style={styles.map}
                initialRegion={INITIAL_REGION}
                showsUserLocation={hasLocationPermission}
                showsMyLocationButton={false}
                showsCompass
                toolbarEnabled={false}
                mapPadding={{
                    top: insets.top + 72,
                    right: 12,
                    bottom: selection ? 300 : 28,
                    left: 12,
                }}
            >
                {routeCoordinates.length > 1 && (
                    <Polyline
                        coordinates={routeCoordinates}
                        strokeColor={colors.accent}
                        strokeWidth={4}
                    />
                )}

                {STOPS.map((stop, index) => {
                    const isSelected =
                        selection?.type === "stop" &&
                        selection.stop.id === stop.id;

                    return (
                        <Marker
                            key={stop.id}
                            coordinate={{
                                latitude: stop.latitude,
                                longitude: stop.longitude,
                            }}
                            title={stop.name}
                            description={stop.subtitle}
                            onPress={() =>
                                setSelection({ type: "stop", stop })
                            }
                            tracksViewChanges={false}
                        >
                            <View
                                style={[
                                    styles.stopMarker,
                                    isSelected && styles.stopMarkerSelected,
                                ]}
                            >
                                <Text style={styles.stopMarkerText}>
                                    {index + 1}
                                </Text>
                            </View>
                        </Marker>
                    );
                })}

                {routeCoordinates.length > 1 && (
                    <Marker
                        coordinate={busPosition}
                        title="Route 982 bus"
                        description="Tap for bus details"
                        onPress={() => setSelection({ type: "bus" })}
                        tracksViewChanges={false}
                    >
                        <View style={styles.busMarker}>
                            <Ionicons
                                name="bus"
                                size={25}
                                color={colors.surface}
                            />
                        </View>
                    </Marker>
                )}
            </MapView>

            <View
                pointerEvents="box-none"
                style={[
                    {
                        position: "absolute",
                        top: insets.top + 12,
                        left: 16,
                        right: 16,
                    },
                ]}
            >
                <View
                    style={{
                        backgroundColor: colors.surface,
                        borderRadius: 16,
                        borderWidth: 1,
                        borderColor: colors.border,
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                    }}
                >
                    <View
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: 12,
                            backgroundColor: colors.accentLight,
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <Ionicons
                            name="navigate"
                            size={22}
                            color={colors.accent}
                        />
                    </View>

                    <View style={{ flex: 1 }}>
                        <Text
                            style={{
                                color: colors.text,
                                fontSize: 16,
                                fontWeight: "700",
                            }}
                        >
                            Nearby
                        </Text>
                        <Text
                            style={{
                                color: colors.textSecondary,
                                fontSize: 12,
                                marginTop: 2,
                            }}
                        >
                            Route 982 · Sligo to Ballyshannon
                        </Text>
                    </View>

                    {routeLoading && (
                        <ActivityIndicator color={colors.accent} size="small" />
                    )}
                </View>
            </View>

            <View
                style={[
                    styles.mapControls,
                    { top: mapControlsBottom },
                ]}
            >
                <Pressable
                    style={styles.mapControlButton}
                    onPress={centerOnMyLocation}
                    disabled={locating}
                    accessibilityLabel="Show my location"
                >
                    {locating ? (
                        <ActivityIndicator
                            size="small"
                            color={colors.accent}
                        />
                    ) : (
                        <Ionicons
                            name="locate"
                            size={22}
                            color={colors.accent}
                        />
                    )}
                </Pressable>

                <Pressable
                    style={styles.mapControlButton}
                    onPress={() =>
                        mapRef.current?.animateToRegion(INITIAL_REGION, 700)
                    }
                    accessibilityLabel="Show the full route"
                >
                    <Ionicons
                        name="map-outline"
                        size={22}
                        color={colors.accent}
                    />
                </Pressable>

            </View>


            {selection && (
                <View
                    style={[
                        styles.bottomSheet,
                        {
                            paddingBottom: Math.max(insets.bottom, 16),
                            maxHeight: "65%",
                        },
                    ]}
                >
                    <View style={styles.sheetHandle} />

                    <View style={styles.sheetHeader}>
                        <View style={styles.sheetTitleGroup}>
                            <Text style={styles.sheetEyebrow}>
                                {selection.type === "stop"
                                    ? "ROUTE 982 · BUS STOP"
                                    : "ROUTE 982 · LIVE PREVIEW"}
                            </Text>

                            <Text style={styles.sheetTitle}>
                                {selection.type === "stop"
                                    ? selection.stop.name
                                    : "Bus details"}
                            </Text>

                            <Text style={styles.sheetSubtitle}>
                                {selection.type === "stop"
                                    ? selection.stop.subtitle
                                    : "Sligo to Ballyshannon"}
                            </Text>
                        </View>

                        <Pressable
                            onPress={clearSelection}
                            style={styles.closeButton}
                            accessibilityLabel="Close details"
                        >
                            <Ionicons
                                name="close"
                                size={22}
                                color={colors.text}
                            />
                        </Pressable>
                    </View>

                    {selection.type === "stop" ? (
                        <>
                            <View style={styles.etaCard}>
                                <View style={styles.etaIcon}>
                                    <Ionicons
                                        name="time-outline"
                                        size={22}
                                        color={colors.accent}
                                    />
                                </View>

                                <View style={styles.etaText}>
                                    <Text style={styles.etaLabel}>
                                        Estimated bus arrival
                                    </Text>
                                    <Text style={styles.etaValue}>
                                        {getStopEta(selection.stop)}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.statsRow}>
                                <View style={styles.statCard}>
                                    <Text style={styles.statValue}>
                                        {selection.stop.gettingOff}
                                    </Text>
                                    <Text style={styles.statLabel}>
                                        Getting off
                                    </Text>
                                </View>

                                <View style={styles.statCard}>
                                    <Text style={styles.statValue}>
                                        {selection.stop.boarding}
                                    </Text>
                                    <Text style={styles.statLabel}>
                                        Boarding
                                    </Text>
                                </View>

                                <View style={styles.statCard}>
                                    <Text style={styles.statValue}>
                                        {getSeatsAfterStop(selection.stop)}
                                    </Text>
                                    <Text style={styles.statLabel}>
                                        Seats after stop
                                    </Text>
                                </View>
                            </View>

                            <Text style={styles.sheetFootnote}>
                                Arrival times and passenger numbers are
                                simulated estimates for this prototype.
                            </Text>

                            <Pressable
                                style={styles.primaryButton}
                                onPress={() => setSelection({ type: "bus" })}
                            >
                                <Text style={styles.primaryButtonText}>
                                    View bus details
                                </Text>
                                <Ionicons
                                    name="arrow-forward"
                                    size={18}
                                    color={colors.surface}
                                />
                            </Pressable>
                        </>
                    ) : (
                        <>
                            <View style={styles.busOccupancyCard}>
                                <View style={styles.busOccupancyTop}>
                                    <View>
                                        <Text style={styles.etaLabel}>
                                            Passenger occupancy
                                        </Text>
                                        <Text style={styles.etaValue}>
                                            {passengers} / {BUS_CAPACITY}
                                        </Text>
                                    </View>

                                    <View style={styles.busDetailsIcon}>
                                        <Ionicons
                                            name="people-outline"
                                            size={23}
                                            color={colors.accent}
                                        />
                                    </View>
                                </View>

                                <View style={styles.progressTrack}>
                                    <View
                                        style={[
                                            styles.progressFill,
                                            {
                                                width: `${occupancyPercentage}%`,
                                            },
                                        ]}
                                    />
                                </View>

                                <Text
                                    style={[
                                        styles.sheetFootnote,
                                        { marginTop: 8 },
                                    ]}
                                >
                                    {Math.max(0, BUS_CAPACITY - passengers)}{" "}
                                    seats available (simulated)
                                </Text>
                            </View>

                            <View style={styles.nextStopCard}>
                                <Ionicons
                                    name="location-outline"
                                    size={22}
                                    color={colors.accent}
                                />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.nextStopText}>
                                        Next stop
                                    </Text>
                                    <Text style={styles.nextStopName}>
                                        {nextStop.name}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.busActions}>
                                <Pressable
                                    style={styles.secondaryButton}
                                    onPress={testOccupancy}
                                >
                                    <Ionicons
                                        name="people"
                                        size={17}
                                        color={colors.accent}
                                    />
                                    <Text style={styles.secondaryButtonText}>
                                        Test occupancy
                                    </Text>
                                </Pressable>

                                <Pressable
                                    style={styles.primaryButton}
                                    onPress={() => setIsPaused((previous) => !previous)}
                                >
                                    <Ionicons
                                        name={isPaused ? "play" : "pause"}
                                        size={17}
                                        color={colors.surface}
                                    />
                                    <Text style={styles.primaryButtonText}>
                                        {isPaused ? "Resume bus" : "Pause bus"}
                                    </Text>
                                </Pressable>
                            </View>

                            <Text style={styles.sheetFootnote}>
                                This is a demonstration bus. Its position and
                                occupancy are not connected to live operator
                                data.
                            </Text>
                        </>
                    )}
                </View>
            )}
        </View>
    );
}
