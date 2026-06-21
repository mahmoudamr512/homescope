"use client";

import dynamic from "next/dynamic";

const MapView = dynamic(() => import("./map-view.client"), { ssr: false });

export default MapView;
