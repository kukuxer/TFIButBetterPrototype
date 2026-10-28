import React, { useState } from "react";
import {
    Alert,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/constants/style/ThemeContext";
import spacing from "../constants/style/spacing";
import createJourneyResultsStyles from "../styles/journey-results.styles";

import {
    BUS_SERVICES,
    BUS_DEPARTURES,
} from "@/constants/transport";

export default function JourneyResultsScreen() {
    const { colors } = useTheme();
    const styles = createJourneyResultsStyles(colors);
    const insets = useSafeAreaInsets();

    const [expandedService, setExpandedService] = useState<string | null>(
        null
    );

    const params = useLocalSearchParams<{
        origin?: string | string[];
        destination?: string | string[];
    }>();

    const origin = Array.isArray(params.origin)
        ? params.origin[0]
        : params.origin;

    const destination = Array.isArray(params.destination)
        ? params.destination[0]
        : params.destination;

    const matchingDepartures = BUS_DEPARTURES.filter(
        (departure) =>
            departure.origin === origin &&
            departure.destination === destination
    ).sort((a, b) =>
        a.departureTime.localeCompare(b.departureTime)
    );

    const getDeparturesForService = (serviceNumber: string) =>
        matchingDepartures.filter(
            (departure) => departure.routeNumber === serviceNumber
        );

    const availableServices = BUS_SERVICES.filter(
        (service) => getDeparturesForService(service.number).length > 0
    );

    const handleBuyTicket = (
        departure: (typeof BUS_DEPARTURES)[number]
    ) => {
        router.push({
            pathname: "/tickets",
            params: {
                routeNumber: departure.routeNumber,
                origin: departure.origin,
                destination: departure.destination,
                departureTime: departure.departureTime,
                departureId: departure.id,
            },
        });
    };

    const handleShowLocation = (serviceName: string) => {
        Alert.alert(
            "Bus location",
            `Live GPS tracking for ${serviceName} is coming soon.`
        );
    };

    const toggleService = (serviceId: string) => {
        setExpandedService((current) =>
            current === serviceId ? null : serviceId
        );
    };

    const getOccupancyPercentage = (
        occupiedSeats: number,
        totalSeats: number
    ) => {
        if (totalSeats <= 0) return 0;

        return Math.min(
            100,
            Math.max(0, (occupiedSeats / totalSeats) * 100)
        );
    };

    return (
        <View style={[styles.screen, { paddingTop: insets.top }]}>
            {/* HEADER */}
            <View style={styles.header}>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Go back"
                    onPress={() => router.back()}
                    style={styles.backButton}
                >
                    <Ionicons
                        name="arrow-back"
                        size={21}
                        color={colors.text}
                    />
                </Pressable>

                <Text style={styles.headerTitle}>Bus routes</Text>

                <View style={styles.headerSpacer} />
            </View>

            <ScrollView
                contentContainerStyle={[
                    styles.content,
                    { paddingBottom: insets.bottom + spacing.xxxl },
                ]}
                showsVerticalScrollIndicator={false}
            >
                {/* SELECTED JOURNEY */}
                <View style={styles.routeCard}>
                    <Text style={styles.eyebrow}>YOUR JOURNEY</Text>

                    <View style={styles.routeRow}>
                        <View style={styles.routeMarkers}>
                            <View style={styles.originMarker} />
                            <View style={styles.routeLine} />
                            <View style={styles.destinationMarker} />
                        </View>

                        <View style={styles.routeLocations}>
                            <View style={styles.locationBlock}>
                                <Text style={styles.locationLabel}>FROM</Text>
                                <Text style={styles.locationName}>
                                    {origin || "Not selected"}
                                </Text>
                            </View>

                            <View style={styles.locationBlock}>
                                <Text style={styles.locationLabel}>TO</Text>
                                <Text style={styles.locationName}>
                                    {destination || "Not selected"}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.summaryDivider} />

                    <View style={styles.summaryRow}>
                        <View>
                            <Text style={styles.summaryNumber}>
                                {availableServices.length}
                            </Text>
                            <Text style={styles.summaryLabel}>
                                Bus services
                            </Text>
                        </View>

                        <View style={styles.summaryVerticalDivider} />

                        <View>
                            <Text style={styles.summaryNumber}>
                                {matchingDepartures.length}
                            </Text>
                            <Text style={styles.summaryLabel}>
                                Matching departures
                            </Text>
                        </View>
                    </View>
                </View>

                {/* AVAILABLE BUSES */}
                <View style={styles.sectionHeader}>
                    <View style={styles.sectionHeadingContainer}>
                        <Text style={styles.sectionTitle}>
                            Available buses
                        </Text>

                        <Text style={styles.sectionSubtitle}>
                            Select a bus to view its timetable
                        </Text>
                    </View>

                    <View style={styles.countBadge}>
                        <Text style={styles.countBadgeText}>
                            {availableServices.length}
                        </Text>
                    </View>
                </View>

                {/* EMPTY STATE */}
                {availableServices.length === 0 ? (
                    <View style={styles.emptyTimetable}>
                        <Ionicons
                            name="bus-outline"
                            size={32}
                            color={colors.textSecondary}
                        />

                        <Text style={styles.emptyTimetableTitle}>
                            No routes available
                        </Text>

                        <Text style={styles.emptyTimetableDescription}>
                            There are no scheduled departures for{" "}
                            {origin || "your selected origin"} to{" "}
                            {destination || "your selected destination"}.
                            Try selecting another journey.
                        </Text>
                    </View>
                ) : (
                    availableServices.map((service) => {
                        const isExpanded =
                            expandedService === service.id;

                        const departures = getDeparturesForService(
                            service.number
                        );

                        const occupancyPercentage =
                            getOccupancyPercentage(
                                service.occupiedSeats,
                                service.totalSeats
                            );

                        const availableSeats = Math.max(
                            0,
                            service.totalSeats - service.occupiedSeats
                        );

                        return (
                            <View
                                key={service.id}
                                style={[
                                    styles.serviceCard,
                                    isExpanded &&
                                    styles.serviceCardExpanded,
                                ]}
                            >
                                {/* BUS CARD HEADER */}
                                <Pressable
                                    accessibilityRole="button"
                                    accessibilityState={{
                                        expanded: isExpanded,
                                    }}
                                    accessibilityLabel={`${service.name}, route ${service.number}. ${
                                        isExpanded
                                            ? "Hide timetable"
                                            : "Show timetable"
                                    }`}
                                    onPress={() =>
                                        toggleService(service.id)
                                    }
                                    style={styles.servicePressable}
                                >
                                    <View style={styles.serviceHeader}>
                                        <View
                                            style={styles.busIconContainer}
                                        >
                                            <Ionicons
                                                name="bus-outline"
                                                size={25}
                                                color={colors.accent}
                                            />
                                        </View>

                                        <View style={styles.serviceInfo}>
                                            <Text
                                                style={styles.vehicleName}
                                            >
                                                {service.name}
                                            </Text>

                                            <Text
                                                style={
                                                    styles.vehicleDescription
                                                }
                                            >
                                                {service.description}
                                            </Text>
                                        </View>

                                        <View
                                            style={styles.routeNumberBadge}
                                        >
                                            <Text
                                                style={styles.routeNumberText}
                                            >
                                                {service.number}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.serviceFooter}>
                                        <View style={styles.departureCount}>
                                            <Ionicons
                                                name="time-outline"
                                                size={15}
                                                color={colors.textSecondary}
                                            />

                                            <Text
                                                style={
                                                    styles.departureCountText
                                                }
                                            >
                                                {departures.length}{" "}
                                                {departures.length === 1
                                                    ? "departure"
                                                    : "departures"}
                                            </Text>
                                        </View>

                                        <View
                                            style={
                                                styles.expandLabelContainer
                                            }
                                        >
                                            <Text
                                                style={styles.expandLabel}
                                            >
                                                {isExpanded
                                                    ? "Hide timetable"
                                                    : "View timetable"}
                                            </Text>

                                            <Ionicons
                                                name={
                                                    isExpanded
                                                        ? "chevron-up"
                                                        : "chevron-down"
                                                }
                                                size={18}
                                                color={colors.accent}
                                            />
                                        </View>
                                    </View>
                                </Pressable>

                                {/* EXPANDED BUS DETAILS */}
                                {isExpanded && (
                                    <View style={styles.expandedContent}>
                                        <View
                                            style={styles.expandedDivider}
                                        />

                                        {/* SEAT INFORMATION */}
                                        <Text style={styles.detailsHeading}>
                                            Seat information
                                        </Text>

                                        <View
                                            style={styles.occupancyHeader}
                                        >
                                            <Text
                                                style={styles.occupancyLabel}
                                            >
                                                Seat occupancy
                                            </Text>

                                            <Text
                                                style={styles.occupancyValue}
                                            >
                                                {service.occupiedSeats}/
                                                {service.totalSeats}
                                            </Text>
                                        </View>

                                        <View
                                            style={styles.progressTrack}
                                        >
                                            <View
                                                style={[
                                                    styles.progressFill,
                                                    {
                                                        width: `${occupancyPercentage}%`,
                                                    },
                                                ]}
                                            />
                                        </View>

                                        <View style={styles.seatInfoRow}>
                                            <Text style={styles.seatInfo}>
                                                {availableSeats} seats
                                                available
                                            </Text>

                                            {service.occupancyIsDemo && (
                                                <Text
                                                    style={styles.demoLabel}
                                                >
                                                    Sample data
                                                </Text>
                                            )}
                                        </View>

                                        {/* BUS LOCATION */}
                                        <Pressable
                                            accessibilityRole="button"
                                            style={styles.locationButton}
                                            onPress={() =>
                                                handleShowLocation(
                                                    service.name
                                                )
                                            }
                                        >
                                            <Ionicons
                                                name="navigate-outline"
                                                size={18}
                                                color={colors.accent}
                                            />

                                            <Text
                                                style={
                                                    styles.locationButtonLabel
                                                }
                                            >
                                                Show bus location
                                            </Text>

                                            <Text
                                                style={
                                                    styles.locationComingSoon
                                                }
                                            >
                                                Soon
                                            </Text>
                                        </Pressable>

                                        {/* TIMETABLE */}
                                        <View style={styles.timetableHeader}>
                                            <Text
                                                style={styles.detailsHeading}
                                            >
                                                Timetable
                                            </Text>

                                            <Text
                                                style={styles.timetableRoute}
                                            >
                                                {origin} → {destination}
                                            </Text>
                                        </View>

                                        {departures.map((departure) => (
                                            <View
                                                key={departure.id}
                                                style={styles.departureCard}
                                            >
                                                <View
                                                    style={
                                                        styles.departureTopRow
                                                    }
                                                >
                                                    {/* DEPARTURE TIME */}
                                                    <View
                                                        style={styles.timeColumn}
                                                    >
                                                        <Text
                                                            style={styles.timeLabel}
                                                        >
                                                            DEPARTURE
                                                        </Text>

                                                        <Text
                                                            style={styles.departureTime}
                                                        >
                                                            {departure.departureTime}
                                                        </Text>

                                                        <Text
                                                            style={styles.stationName}
                                                        >
                                                            {departure.origin}
                                                        </Text>
                                                    </View>

                                                    {/* JOURNEY DURATION */}
                                                    <View
                                                        style={styles.tripDuration}
                                                    >
                                                        <View
                                                            style={styles.durationLine}
                                                        />

                                                        <View
                                                            style={styles.durationInfo}
                                                        >
                                                            <Ionicons
                                                                name="bus-outline"
                                                                size={15}
                                                                color={colors.accent}
                                                            />

                                                            <Text
                                                                style={styles.durationText}
                                                            >
                                                                {departure.duration}
                                                            </Text>
                                                        </View>

                                                        <View
                                                            style={styles.durationLine}
                                                        />
                                                    </View>

                                                    {/* ARRIVAL TIME */}
                                                    <View
                                                        style={[
                                                            styles.timeColumn,
                                                            styles.arrivalColumn,
                                                        ]}
                                                    >
                                                        <Text
                                                            style={styles.timeLabel}
                                                        >
                                                            ARRIVAL
                                                        </Text>

                                                        <Text
                                                            style={styles.departureTime}
                                                        >
                                                            {departure.arrivalTime}
                                                        </Text>

                                                        <Text
                                                            style={styles.stationName}
                                                        >
                                                            {departure.destination}
                                                        </Text>
                                                    </View>
                                                </View>

                                                <View
                                                    style={styles.departureDivider}
                                                />

                                                {/* BUY TICKET */}
                                                <Pressable
                                                    accessibilityRole="button"
                                                    style={styles.buyButton}
                                                    onPress={() =>
                                                        handleBuyTicket(
                                                            departure
                                                        )
                                                    }
                                                >
                                                    <Text
                                                        style={styles.buyButtonText}
                                                    >
                                                        Buy ticket
                                                    </Text>

                                                    <Ionicons
                                                        name="arrow-forward"
                                                        size={18}
                                                        color={colors.surface}
                                                    />
                                                </Pressable>
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </View>
                        );
                    })
                )}

                {/* DATA DISCLAIMER */}
                <View style={styles.noticeCard}>
                    <Ionicons
                        name="information-circle-outline"
                        size={20}
                        color={colors.textSecondary}
                    />

                    <Text style={styles.footer}>
                        Timetable and seat occupancy may be sample data.
                        Please verify departure times with the operator.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}