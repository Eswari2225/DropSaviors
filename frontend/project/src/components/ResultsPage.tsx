import React from "react";
import { DISTRICTS } from "../types";

interface TankOption {
  count: number;
  label: string;
  per_unit_volume_l: number;
  suggested_shape: string;
  suggested_dimensions?: any;
}

interface RechargeOption {
  count: number;
  label: string;
  per_unit_volume_l: number;
  suggested_shape: string;
  suggested_dimensions?: any;
}

interface Breakdown {
  summary: Record<string, number>;
}

interface Recommendation {
  type: string;
  required_storage_l?: number;
  required_recharge_l?: number;
  chosen_tanks?: TankOption[];
  chosen_recharge?: RechargeOption[];
  breakdown: Breakdown;
}

interface Comparison {
  user_total: number;
  recommended_total: number;
  difference: number;
  user_option: {
    type: string;
    units_needed: number;
    breakdown: Breakdown;
  };
  svg: string;
}

interface Results {
  username: string;
  district: string;
  subdistrict: string;
  roof_type: string;
  roof_area: number;
  runoff_coeff: number;
  rainfall_series: Record<string, number>;
  max_year: string;
  max_rain_mm: number;
  harvested_liters: number;
  groundwater_category?: string;
  groundwater_category_percent?: number;
  recharge_fraction?: number;
  estimated_recharge_to_ground_liters?: number;
  recommendation: Recommendation;
  comparison?: Comparison;
}

interface ResultsPageProps {
  results: Results | null;
  error?: string;
  onBack: () => void;
}

// ✅ helper to map backend district id → display name
const getDistrictName = (idOrName: string | undefined) => {
  if (!idOrName) return "-";
  const found = DISTRICTS.find(
    (d) => d.id.toLowerCase() === idOrName.toLowerCase()
  );
  if (found) return found.name;
  return idOrName; // fallback if backend already sends proper name
};

const ResultsPage: React.FC<ResultsPageProps> = ({ results, error, onBack }) => {

  if (!results) return null;
  // Safe check for recommendation
  if (!results.recommendation) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-red-100 text-red-700 p-4 rounded">
          Error: No recommendation data received from backend. Please check your input or try again.
        </div>
        <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded" onClick={onBack}>
          Go Back
        </button>
      </div>
    );
  }
  const rec = results.recommendation;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="bg-white shadow rounded-xl p-6">
        <h2 className="text-2xl font-bold text-blue-600 mb-4">
          🌧 Assessment Results
        </h2>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>
        )}

        {/* User Info */}
        <div className="grid md:grid-cols-2 gap-4 mb-6 text-gray-800">
          <div>
            <p>
              <strong>User:</strong> {results.username}
            </p>
            <p>
              <strong>District:</strong> {getDistrictName(results.district)}
            </p>
            <p>
              <strong>Subdivision:</strong> {results.subdistrict || "-"}
            </p>
          </div>
          <div>
            <p>
              <strong>Roof Type:</strong> {results.roof_type}
            </p>
            <p>
              <strong>Roof Area:</strong> {results.roof_area} m²
            </p>
            <p>
              <strong>Runoff Coeff:</strong> {results.runoff_coeff}
            </p>
          </div>
        </div>

        {/* Rainfall Predictions */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h5 className="font-semibold">
            📊 Predicted Annual Rainfall (2025–2036)
          </h5>
          <div className="overflow-x-auto mt-3">
            <table className="w-full border text-sm">
              <thead className="bg-blue-100">
                <tr>
                  <th className="p-2 text-left">Year</th>
                  <th className="p-2 text-left">Rain (mm)</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(results.rainfall_series).map(([year, rain]) => (
                  <tr
                    key={year}
                    className={
                      year === results.max_year
                        ? "bg-green-100 font-bold"
                        : "border-t"
                    }
                  >
                    <td className="p-2">
                      {year}{" "}
                      {year === results.max_year && (
                        <span className="ml-2 bg-green-500 text-white px-2 py-0.5 text-xs rounded">
                          Max
                        </span>
                      )}
                    </td>
                    <td className="p-2">{rain}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Water Potential */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h5 className="font-semibold">💧 Water Potential</h5>
          <p>
            Max predicted rainfall: <b>{results.max_rain_mm} mm</b> in{" "}
            {results.max_year}
          </p>
          <p>
            Harvestable water (liters): <b>{results.harvested_liters}</b>
          </p>

          {results.groundwater_category ? (
            <>
              <hr className="my-3" />
              <p>
                <strong>Groundwater (detected):</strong>
              </p>
              <p>
                Dominant depth category: <b>{results.groundwater_category}</b> (
                {results.groundwater_category_percent}% stations)
              </p>
              {results.recharge_fraction !== undefined && (
                <>
                  <p>
                    Estimated recharge fraction to groundwater:{" "}
                    <b>{(results.recharge_fraction * 100).toFixed(1)}%</b>
                  </p>
                  <p>
                    Estimated recharge to groundwater from harvested water:{" "}
                    <b>{results.estimated_recharge_to_ground_liters}</b> L/year
                  </p>
                  <p className="text-gray-500 text-sm">
                    Note: recharge fraction is a conservative heuristic. For
                    precise hydrogeological design use local aquifer parameters.
                  </p>
                </>
              )}
            </>
          ) : (
            <p className="text-gray-500 text-sm">
              Groundwater dataset not available for this district/year — no
              recharge estimate shown.
            </p>
          )}
        </div>

        {/* Recommended System */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h5 className="font-semibold">⚙ Recommended System</h5>
          <p>
            <b>{rec.type}</b>
          </p>

          {rec.type === "Large Storage Tank" ? (
            <>
              <p>
                Recommended storage to hold approx:{" "}
                <b>{rec.required_storage_l}</b> liters
              </p>
              <p>Suggested units:</p>
              <ul className="list-disc pl-6">
                {rec.chosen_tanks?.map((it, idx) => (
                  <li key={idx}>
                    {it.count} × {it.label} ({it.per_unit_volume_l} L each)
                    <div className="text-gray-500 text-sm">
                      Suggested shape: {it.suggested_shape}
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-3 font-semibold">Cost breakdown:</p>
              <ul className="list-disc pl-6">
                {Object.entries(rec.breakdown.summary).map(([k, v]) => (
                  <li key={k}>{k.replace("_", " ")}: ₹{v}</li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <p>
                Recommended recharge design to accept approx:{" "}
                <b>{rec.required_recharge_l}</b> liters
              </p>
              <ul className="list-disc pl-6">
                {rec.chosen_recharge?.map((it, idx) => (
                  <li key={idx}>
                    {it.count} × {it.label} ({it.per_unit_volume_l} L)
                  </li>
                ))}
              </ul>
              <p className="mt-3 font-semibold">Cost breakdown:</p>
              <ul className="list-disc pl-6">
                {Object.entries(rec.breakdown.summary).map(([k, v]) => (
                  <li key={k}>{k.replace("_", " ")}: ₹{v}</li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* Comparison */}
        {results.comparison && (
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h5 className="font-semibold">🧾 Comparison</h5>
            <p>
              <strong>User option total:</strong> ₹{results.comparison.user_total}{" "}
              | <strong>Recommended total:</strong>{" "}
              ₹{results.comparison.recommended_total}
            </p>
            <p>
              <strong>Difference:</strong> ₹{results.comparison.difference}
            </p>

            <div className="grid md:grid-cols-2 gap-4 mt-3">
              <div>
                <h6 className="font-semibold">User option details</h6>
                <p>Type: {results.comparison.user_option.type}</p>
                <p>Units needed: {results.comparison.user_option.units_needed}</p>
                <h6 className="font-semibold mt-2">Breakdown</h6>
                <ul className="list-disc pl-6">
                  {Object.entries(
                    results.comparison.user_option.breakdown.summary
                  ).map(([k, v]) => (
                    <li key={k}>{k.replace("_", " ")}: ₹{v}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h6 className="font-semibold">Visual</h6>
                <div
                  className="border rounded p-2 bg-white"
                  dangerouslySetInnerHTML={{ __html: results.comparison.svg }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-4">
          <a
            href={`/download/${results.username}`}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
          >
            📥 Download PDF Report
          </a>
          <button
            onClick={onBack}
            className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
          >
            🔙 Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;
