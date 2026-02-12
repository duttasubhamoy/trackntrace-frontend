import React, { useState, useEffect } from "react";
import { CgSpinner } from "react-icons/cg";
import { useNavigate } from "react-router-dom";
import axios from "../utils/axiosConfig";
import { useAuth } from "../context/AuthContext";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { scaleLinear } from "d3-scale";
import { geoCentroid, geoPath } from "d3-geo";

const INDIA_STATE_GEO_URL =
  "https://raw.githubusercontent.com/geohacker/india/master/state/india_state.geojson";

const INDIA_DISTRICT_GEO_URL =
  "https://raw.githubusercontent.com/geohacker/india/master/district/india_district.geojson";

// ✅ Hardcoded State Analytics (Replace later with API)
const stateValues = {
  "Maharashtra": { value: 120, sales: 120000, productsSold: 5000 },
  "Karnataka": { value: 80, sales: 80000, productsSold: 3000 },
  "West Bengal": { value: 200, sales: 150000, productsSold: 7000 },
  "Tamil Nadu": { value: 150, sales: 130000, productsSold: 6000 },
  "Gujarat": { value: 90, sales: 90000, productsSold: 3500 },
  "Uttar Pradesh": { value: 300, sales: 200000, productsSold: 10000 },
  "Rajasthan": { value: 75, sales: 70000, productsSold: 2800 },
  "Delhi": { value: 50, sales: 50000, productsSold: 2000 },
  "Madhya Pradesh": { value: 85, sales: 85000, productsSold: 3200 },
  "Kerala": { value: 95, sales: 95000, productsSold: 4000 },
  "Punjab": { value: 70, sales: 70000, productsSold: 2500 },
  "Haryana": { value: 65, sales: 65000, productsSold: 2200 },
  "Andhra Pradesh": { value: 110, sales: 110000, productsSold: 4500 }
};

// ✅ Hardcoded District Analytics
const districtValues = {
  "Pune": { value: 50, sales: 5000, productsSold: 1200 },
  "Bangalore": { value: 30, sales: 3000, productsSold: 800 },
  "Kolkata": { value: 80, sales: 10000, productsSold: 2000 },
  "Chennai": { value: 70, sales: 7000, productsSold: 1500 },
  "Mumbai": { value: 90, sales: 9000, productsSold: 2500 },
  "Hyderabad": { value: 60, sales: 6000, productsSold: 1800 },
  "Ahmedabad": { value: 45, sales: 4500, productsSold: 1000 },
};

const colorScale = scaleLinear().domain([0, 300]).range(["#E0ECF4", "#005824"]);

const normalizeName = (name) => {
  if (!name || typeof name !== "string") {
    return "";
  }
  return name
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase())
    .trim();
};

// Helper function to get bounding box of state districts
const getBbox = (features) => {
  if (!features || features.length === 0) return null;
  
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;

  features.forEach(feature => {
    const coords = feature.geometry.coordinates[0];
    coords.forEach(coord => {
      const [lng, lat] = coord;
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
    });
  });

  return {
    center: [(minLng + maxLng) / 2, (minLat + maxLat) / 2],
    scale: Math.min(
      800 / (maxLng - minLng) * 100,
      600 / (maxLat - minLat) * 100
    ),
  };
};

// New helper function to calculate bounding box and projection settings for district maps
const getBoundingBoxAndProjection = (features) => {
  if (!features || features.length === 0) return null;

  // Calculate the bounding box
  let minLng = Infinity;
  let maxLng = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;

  features.forEach(feature => {
    const coordinates = feature.geometry.coordinates[0];
    coordinates.forEach(coord => {
      minLng = Math.min(minLng, coord[0]);
      maxLng = Math.max(maxLng, coord[0]);
      minLat = Math.min(minLat, coord[1]);
      maxLat = Math.max(maxLat, coord[1]);
    });
  });

  // Calculate center point
  const centerLng = (minLng + maxLng) / 2;
  const centerLat = (minLat + maxLat) / 2;

  // Calculate appropriate scale
  const width = 800; // map width
  const height = 600; // map height
  const padding = 40; // padding around the state

  const dx = maxLng - minLng;
  const dy = maxLat - minLat;
  const scale = Math.min(
    (width - padding * 2) / dx,
    (height - padding * 2) / dy
  ) * 100; // Multiply by 100 as our base scale is different from pixel values

  return {
    center: [centerLng, centerLat],
    scale: scale
  };
};

const AnalyticsPage = () => {
  const { userData } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const [selectedState, setSelectedState] = useState(null);
  const [selectedStateAnalytics, setSelectedStateAnalytics] = useState(null);
  const [districtGeo, setDistrictGeo] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);

  // ✅ Tooltip State
  const [tooltip, setTooltip] = useState({
    visible: false,
    x: 0,
    y: 0,
    content: "",
  });

  useEffect(() => {
    if (userData) {
      setIsLoading(false);
    }
  }, [userData]);

  // ✅ Load districts for a state when clicked
  const loadDistrictsForState = async (stateName) => {
    try {
      console.log("Raw state name:", stateName);
      const res = await fetch(INDIA_DISTRICT_GEO_URL);
      const geojson = await res.json();
      
      // Make sure we're getting valid state name data
      if (!stateName) {
        console.error("State name is undefined or null");
        return;
      }

      const normalizedStateName = normalizeName(stateName);
      console.log("Loading districts for state:", normalizedStateName);
      console.log("Available states:", Object.keys(stateValues));
      
      // Set state analytics first
      const stateAnalytics = stateValues[normalizedStateName];
      if (stateAnalytics) {
        setSelectedStateAnalytics({
          name: normalizedStateName,
          ...stateAnalytics
        });
      }

      // Debug the first feature to understand the structure
      if (geojson.features.length > 0) {
        console.log("First feature properties:", geojson.features[0].properties);
      }

      const filteredDistricts = {
        ...geojson,
        features: geojson.features.filter((f) => {
          const stateProp = f.properties.NAME_1 || f.properties.ST_NAME;
          return stateProp && normalizeName(stateProp) === normalizedStateName;
        }),
      };

      // Calculate the bounding box for the districts
      const bbox = getBoundingBoxAndProjection(filteredDistricts.features);
      if (bbox) {
        filteredDistricts.projectionConfig = {
          center: bbox.center,
          scale: bbox.scale
        };
      }

      setDistrictGeo(filteredDistricts);
      setSelectedState(normalizedStateName);
      setSelectedDistrict(null);
    } catch (error) {
      console.error("Error loading districts:", error);
    }
  };

  const goBackToStates = () => {
    setSelectedState(null);
    setDistrictGeo(null);
    setSelectedDistrict(null);
    setSelectedStateAnalytics(null);  // Clear analytics when going back
  };

  return (
    <>
      {isLoading ? (
        <div className="flex justify-center items-center h-full">
          <CgSpinner className="animate-spin text-4xl" />
        </div>
      ) : (
        <div className="p-6 relative">
              <h2 className="text-2xl font-bold mb-4">
                Analytics Dashboard - {selectedState || "India"}
              </h2>
              {selectedState && (
                <button
                  onClick={goBackToStates}
                  className="mb-4 px-4 py-2 bg-blue-500 text-white rounded"
                >
                  ← Back to India Map
                </button>
              )}
              <div className="flex">
                <div className="w-full max-w-4xl relative">
                  <div className="map-container" style={{ width: "800px", height: "600px" }}>
                    <ComposableMap
                      projection="geoMercator"
                      projectionConfig={
                        selectedState && districtGeo?.features
                          ? getBoundingBoxAndProjection(
                              districtGeo.features.filter(
                                (f) => normalizeName(f.properties.NAME_1) === selectedState
                              )
                            ) || { center: [78.9629, 22.5937], scale: 1000 }
                          : { center: [78.9629, 22.5937], scale: 1000 }
                      }
                      width={800}
                      height={600}
                    >
                      <Geographies
                        geography={selectedState && districtGeo ? districtGeo : INDIA_STATE_GEO_URL}
                      >
                        {({ geographies }) =>
                          geographies.map((geo) => {
                            // Skip invalid geometries
                            if (!geo.properties) {
                              console.log("Invalid geometry:", geo);
                              return null;
                            }

                            // Debug the properties structure
                            console.log("Properties:", geo.properties);
                            
                            // Handle different property structures for states and districts
                            const rawName = selectedState
                              ? geo.properties.NAME_2 || geo.properties.DISTRICT || geo.properties.name
                              : geo.properties.NAME_1;
                            
                            // Skip if no valid name
                            if (!rawName) {
                              console.log("Properties structure:", geo.properties);
                              return null;
                            }
                            
                            const name = normalizeName(rawName);
                            
                            // Skip normalization if name is invalid
                            if (!name) {
                              return null;
                            }

                            // Only show districts of selected state - check both NAME_1 and ST_NAME if available
                            if (
                              selectedState &&
                              normalizeName(geo.properties.NAME_1 || geo.properties.ST_NAME) !== selectedState
                            ) {
                              return null;
                            }
                            
                            const data = selectedState 
                              ? districtValues[name]
                              : stateValues[name];
                            const value = data?.value || 0;

                            return (
                              <Geography
                                key={geo.rsmKey}
                                geography={geo}
                                onMouseMove={(e) => {
                                  const tooltipContent = `${name}${data ? `: ${value}` : ''}`;
                                  setTooltip({
                                    visible: true,
                                    x: e.clientX + 10,
                                    y: e.clientY + 10,
                                    content: tooltipContent,
                                  });
                                }}
                                onMouseLeave={() =>
                                  setTooltip({ ...tooltip, visible: false })
                                }
                                onClick={() => {
                                  if (!selectedState) {
                                    loadDistrictsForState(name);
                                  } else {
                                    const districtData = districtValues[name];
                                    if (districtData) {
                                      setSelectedDistrict({
                                        name,
                                        ...districtData,
                                      });
                                    }
                                  }
                                }}
                                style={{
                                  default: {
                                    fill: data ? colorScale(value) : "#D6D6DA",
                                    outline: "none",
                                  },
                                  hover: {
                                    fill: "#FFA500",
                                    outline: "none",
                                    cursor: "pointer"
                                  },
                                  pressed: {
                                    fill: "#FF5722",
                                    outline: "none",
                                  },
                                }}
                              />
                            );
                          })
                        }
                      </Geographies>
                    </ComposableMap>
                  </div>
                  {/* ✅ Floating Tooltip */}
                  {tooltip.visible && (
                    <div
                      className="absolute bg-white shadow-md rounded px-3 py-1 text-sm border border-gray-300"
                      style={{
                        top: tooltip.y,
                        left: tooltip.x,
                        pointerEvents: "none",
                      }}
                    >
                      {tooltip.content}
                    </div>
                  )}
                </div>
                {/* Analytics Panel: show for state or district */}
                {(selectedDistrict || selectedStateAnalytics) && (
                  <div className="ml-6 p-4 bg-white rounded shadow w-72">
                    <h3 className="text-lg font-bold mb-2">
                      {selectedDistrict
                        ? `${selectedDistrict.name} Analytics`
                        : `${selectedStateAnalytics?.name || selectedState} Analytics`}
                    </h3>
                    <p>
                      <strong>Value:</strong>{" "}
                      {selectedDistrict
                        ? selectedDistrict.value
                        : selectedStateAnalytics?.value}
                    </p>
                    <p>
                      <strong>Total Sales:</strong> ₹
                      {(selectedDistrict
                        ? selectedDistrict.sales
                        : selectedStateAnalytics?.sales
                      )?.toLocaleString()}
                    </p>
                    <p>
                      <strong>Products Sold:</strong>{" "}
                      {selectedDistrict
                        ? selectedDistrict.productsSold
                        : selectedStateAnalytics?.productsSold}
                    </p>
                  </div>
                )}
              </div>
            </div>

      )}
    </>
  );
};

export default AnalyticsPage;
