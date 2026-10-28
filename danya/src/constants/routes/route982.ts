import type { Region } from "react-native-maps";

export type Coordinate = {
    latitude: number;
    longitude: number;
};

export type BusStop = Coordinate & {
    id: string;
    stopCode: string;
    name: string;
    subtitle: string;
    gettingOff: number;
    boarding: number;
};

export const BUS_CAPACITY = 35;
export const INITIAL_OCCUPANCY = 22;

export const INITIAL_REGION: Region = {
    latitude: 54.385,
    longitude: -8.405,
    latitudeDelta: 0.48,
    longitudeDelta: 0.48,
};

/**
 * Route 982: Sligo Bus Station -> Ballyshannon.
 *
 * Stop names and stop codes are taken from the published PúcaBus Route 982
 * listing. IMPORTANT: the coordinates below are retained from the original
 * project data and have NOT been verified against the official NTA GTFS
 * stops.txt file. Do not treat these coordinates as corrected/authoritative.
 *
 * The route listing confirms the stops and their order, but does not publish
 * their latitude/longitude values in its readable page content.
 */
export const STOPS: BusStop[] = [
    {
        id: "sligo",
        stopCode: "555081",
        name: "Sligo Bus Stn",
        subtitle: "Sligo",
        latitude: 54.2715,
        longitude: -8.48184,
        gettingOff: 5,
        boarding: 3,
    },
    {
        id: "markievicz",
        stopCode: "12901",
        name: "Sligo Markievicz",
        subtitle: "Markievicz Road, Sligo",
        latitude: 54.27261,
        longitude: -8.47412,
        gettingOff: 2,
        boarding: 4,
    },
    {
        id: "hospital",
        stopCode: "555291",
        name: "Sligo Hospital",
        subtitle: "Sligo University Hospital, The Mall",
        latitude: 54.2772,
        longitude: -8.4763,
        gettingOff: 4,
        boarding: 3,
    },
    {
        id: "atu",
        stopCode: "524901",
        name: "ATU Sligo",
        subtitle: "Campus bus stop, Sligo",
        latitude: 54.2821,
        longitude: -8.4687,
        gettingOff: 3,
        boarding: 5,
    },
    {
        id: "rathcormack",
        stopCode: "559231",
        name: "Rathcormack",
        subtitle: "County Sligo",
        latitude: 54.3188,
        longitude: -8.48112,
        gettingOff: 2,
        boarding: 1,
    },
    {
        id: "drumcliff",
        stopCode: "555092",
        name: "Drumcliff",
        subtitle: "County Sligo",
        latitude: 54.3263,
        longitude: -8.4949,
        gettingOff: 1,
        boarding: 2,
    },
    {
        id: "carney",
        stopCode: "11460",
        name: "Carney",
        subtitle: "County Sligo",
        latitude: 54.347,
        longitude: -8.536,
        gettingOff: 2,
        boarding: 1,
    },
    {
        id: "lissadill",
        stopCode: "557641",
        name: "Lissadill",
        subtitle: "County Sligo",
        latitude: 54.368,
        longitude: -8.57,
        gettingOff: 3,
        boarding: 1,
    },
    {
        id: "ballyconnell",
        stopCode: "10774",
        name: "Ballyconnell",
        subtitle: "County Sligo",
        latitude: 54.3831,
        longitude: -8.5522,
        gettingOff: 1,
        boarding: 2,
    },
    {
        id: "streedagh",
        stopCode: "10775",
        name: "Streedagh",
        subtitle: "County Sligo",
        latitude: 54.39139,
        longitude: -8.5439,
        gettingOff: 2,
        boarding: 1,
    },
    {
        id: "grange",
        stopCode: "555131",
        name: "Grange",
        subtitle: "County Sligo",
        latitude: 54.3932,
        longitude: -8.522,
        gettingOff: 3,
        boarding: 4,
    },
    {
        id: "cliffony",
        stopCode: "140891",
        name: "Cliffony",
        subtitle: "County Sligo",
        latitude: 54.430,
        longitude: -8.455,
        gettingOff: 2,
        boarding: 2,
    },
    {
        id: "mullaghmore",
        stopCode: "10770",
        name: "Mullaghmore",
        subtitle: "County Sligo",
        latitude: 54.467,
        longitude: -8.451,
        gettingOff: 4,
        boarding: 3,
    },
    {
        id: "tullaghan",
        stopCode: "11464",
        name: "Tullaghan Centre",
        subtitle: "County Leitrim",
        latitude: 54.47,
        longitude: -8.33,
        gettingOff: 2,
        boarding: 2,
    },
    {
        id: "bundoran-west",
        stopCode: "635811",
        name: "Bundoran West",
        subtitle: "Bundoran, County Donegal",
        latitude: 54.4764537,
        longitude: -8.2894765,
        gettingOff: 2,
        boarding: 2,
    },
    {
        id: "bundoran",
        stopCode: "11219",
        name: "Bundoran Centre",
        subtitle: "Bundoran, County Donegal",
        latitude: 54.48093,
        longitude: -8.27237,
        gettingOff: 5,
        boarding: 6,
    },
    {
        id: "bundoran-east",
        stopCode: "635801",
        name: "Bundoran East",
        subtitle: "Bundoran, County Donegal",
        latitude: 54.483,
        longitude: -8.257,
        gettingOff: 2,
        boarding: 3,
    },
    {
        id: "finner",
        stopCode: "140091",
        name: "Finner",
        subtitle: "County Donegal",
        latitude: 54.49,
        longitude: -8.22,
        gettingOff: 2,
        boarding: 1,
    },
    {
        id: "ballyshannon",
        stopCode: "132481",
        name: "Ballyshannon",
        subtitle: "County Donegal",
        latitude: 54.5012,
        longitude: -8.178,
        gettingOff: 6,
        boarding: 0,
    },
];
