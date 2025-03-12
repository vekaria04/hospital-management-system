import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API_BASE_URL from "../config";

const HealthQuestionnaire = () => {
  const navigate = useNavigate();
  const { patientId } = useParams();

  const [formData, setFormData] = useState({
    lossOfVision: "",
    visionEye: "",
    visionOnset: "",
    visionPain: "",
    visionDuration: "",
    redness: "",
    rednessEye: "",
    rednessOnset: "",
    rednessPain: "",
    rednessDuration: "",
    watering: "",
    wateringEye: "",
    wateringOnset: "",
    wateringPain: "",
    wateringDuration: "",
    dischargeType: "",
    itching: "",
    itchingEye: "",
    itchingDuration: "",
    pain: "",
    painEye: "",
    painOnset: "",
    painDuration: "",
    htn: "",
    dm: "",
    heartDisease: "",
    allergyDrops: "",
    allergyTablets: "",
    seasonalAllergies: "",
    contactLenses: "",
    contactLensYears: "",
    contactLensFrequency: "",
    cataractOrInjury: "",
    retinalLasers: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/api/submit-health-questionnaire`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, patientId }),
      });
      if (response.ok) {
        alert("Health questionnaire submitted successfully!");
        navigate("/");
      } else {
        alert("Failed to submit the health questionnaire.");
      }
    } catch (error) {
      console.error("Error submitting questionnaire:", error);
      alert("An error occurred while submitting the health questionnaire.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900">
    <div className="max-w-2xl w-full bg-gradient-to-br from-purple-700 to-indigo-700 p-10 rounded-lg shadow-lg text-white">
    <h2 className="text-3xl font-bold text-center mb-6">
      Health Questionnaire
    </h2>
    <form onSubmit={handleSubmit} className="space-y-4">
      
      {/* Ophthalmology History */}
      <h3 className="text-xl font-semibold">Ophthalmology History</h3>

      {/* Loss of Vision */}
      <label className="block text-sm font-medium">Have you experienced loss of vision?</label>
      <select name="lossOfVision" value={formData.lossOfVision} onChange={handleChange} className="w-full p-2 bg-purple-100 text-black border rounded">
        <option value="">Select</option>
        <option value="Yes">Yes</option>
        <option value="No">No</option>
      </select>
      {formData.lossOfVision === "Yes" && (
        <>
          <label className="block text-sm font-medium">Which Eye?</label>
          <select name="visionEye" value={formData.visionEye} onChange={handleChange} className="w-full p-2 bg-purple-100 text-black border rounded">
            <option value="">Select</option>
            <option value="R">Right</option>
            <option value="L">Left</option>
            <option value="Both">Both</option>
          </select>

          <label className="block text-sm font-medium">Onset?</label>
          <select name="visionOnset" value={formData.visionOnset} onChange={handleChange} className="w-full p-2 bg-purple-100 text-black border rounded">
            <option value="">Select</option>
            <option value="Sudden">Sudden</option>
            <option value="Gradual">Gradual</option>
          </select>

          <label className="block text-sm font-medium">Pain?</label>
          <select name="visionPain" value={formData.visionPain} onChange={handleChange} className="w-full p-2 bg-purple-100 text-black border rounded">
            <option value="">Select</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>

          <label className="block text-sm font-medium">Duration?</label>
          <select name="visionDuration" value={formData.visionDuration} onChange={handleChange} className="w-full p-2 bg-purple-100 text-black border rounded">
            <option value="">Select</option>
            <option value="<2 Years">Less than 2 years</option>
            <option value="2-5 Years">2-5 years</option>
            <option value="5+ Years">More than 5 years</option>
          </select>
        </>
      )}

      {/* Redness */}
      <label className="block text-sm font-medium">Have you experienced redness in your eyes?</label>
      <select name="redness" value={formData.redness} onChange={handleChange} className="w-full p-2 bg-purple-100 text-black border rounded">
        <option value="">Select</option>
        <option value="Yes">Yes</option>
        <option value="No">No</option>
      </select>
      {formData.redness === "Yes" && (
        <>
          <label className="block text-sm font-medium">Which Eye?</label>
          <select name="rednessEye" value={formData.rednessEye} onChange={handleChange} className="w-full p-2 bg-purple-100 text-black border rounded">
            <option value="">Select</option>
            <option value="R">Right</option>
            <option value="L">Left</option>
            <option value="Both">Both</option>
          </select>

          <label className="block text-sm font-medium">Onset?</label>
          <select name="rednessOnset" value={formData.rednessOnset} onChange={handleChange} className="w-full p-2 bg-purple-100 text-black border rounded">
            <option value="">Select</option>
            <option value="Sudden">Sudden</option>
            <option value="Gradual">Gradual</option>
          </select>

          <label className="block text-sm font-medium">Pain?</label>
          <select name="rednessPain" value={formData.rednessPain} onChange={handleChange} className="w-full p-2 bg-purple-100 text-black border rounded">
            <option value="">Select</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>

          <label className="block text-sm font-medium">Duration?</label>
          <select name="rednessDuration" value={formData.rednessDuration} onChange={handleChange} className="w-full p-2 bg-purple-100 text-black border rounded">
            <option value="">Select</option>
            <option value="<1 Week">Less than 1 week</option>
            <option value="1-4 Weeks">1-4 weeks</option>
            <option value="4+ Weeks">More than 4 weeks</option>
          </select>
        </>
      )}

      {/* Watering */}
      <label className="block text-sm font-medium">Have your eyes been watering?</label>
      <select name="watering" value={formData.watering} onChange={handleChange} className="w-full p-2 bg-purple-100 text-black border rounded">
        <option value="">Select</option>
        <option value="Yes">Yes</option>
        <option value="No">No</option>
      </select>
      {formData.watering === "Yes" && (
        <>
          <label className="block text-sm font-medium">Discharge Type?</label>
          <select name="dischargeType" value={formData.dischargeType} onChange={handleChange} className="w-full p-2 bg-purple-100 text-black border rounded">
            <option value="">Select</option>
            <option value="Clear">Clear</option>
            <option value="Sticky">Sticky</option>
          </select>
        </>
      )}

      {/* Itching */}
      <label className="block text-sm font-medium">Have you experienced itching?</label>
      <select name="itching" value={formData.itching} onChange={handleChange} className="w-full p-2 bg-purple-100 text-black border rounded">
        <option value="">Select</option>
        <option value="Yes">Yes</option>
        <option value="No">No</option>
      </select>

      {/* Pain */}
      <label className="block text-sm font-medium">Have you experienced eye pain?</label>
      <select name="pain" value={formData.pain} onChange={handleChange} className="w-full p-2 bg-purple-100 text-black border rounded">
        <option value="">Select</option>
        <option value="Yes">Yes</option>
        <option value="No">No</option>
      </select>

        {/* Systemic History */}
        <h3 className="text-xl font-semibold mt-6">Systemic History</h3>

        <label className="block text-sm font-medium">Do you have hypertension (HTN)?</label>
        <select name="htn" value={formData.htn} onChange={handleChange} className="w-full p-2 bg-purple-100 text-black border rounded">
          <option value="">Select</option>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>

        <label className="block text-sm font-medium">Do you have diabetes (DM)?</label>
        <select name="dm" value={formData.dm} onChange={handleChange} className="w-full p-2 bg-purple-100 text-black border rounded">
          <option value="">Select</option>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>

        {/* Allergy History */}
        <h3 className="text-xl font-semibold mt-6">Allergy History</h3>

        <label className="block text-sm font-medium">Are you allergic to any eye drops?</label>
        <select name="allergyDrops" value={formData.allergyDrops} onChange={handleChange} className="w-full p-2 bg-purple-100 text-black border rounded">
          <option value="">Select</option>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>

        {/* Contact Lenses History */}
        <h3 className="text-xl font-semibold mt-6">Contact Lenses History</h3>

        <label className="block text-sm font-medium">Do you use contact lenses?</label>
        <select name="contactLenses" value={formData.contactLenses} onChange={handleChange} className="w-full p-2 bg-purple-100 text-black border rounded">
          <option value="">Select</option>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
        {formData.contactLenses === "Yes" && (
          <>
            <label className="block text-sm font-medium">How long have you used contact lenses?</label>
            <select name="contactLensYears" value={formData.contactLensYears} onChange={handleChange} className="w-full p-2 bg-purple-100 text-black border rounded">
              <option value="">Select</option>
              <option value="<1 Year">Less than 1 year</option>
              <option value="1-5 Years">1-5 years</option>
              <option value="5+ Years">More than 5 years</option>
            </select>
          </>
        )}

        {/* Eye Surgical History */}
        <h3 className="text-xl font-semibold mt-6">Eye Surgical History</h3>

        <label className="block text-sm font-medium">Have you had a cataract or eye injury?</label>
        <select name="cataractOrInjury" value={formData.cataractOrInjury} onChange={handleChange} className="w-full p-2 bg-purple-100 text-black border rounded">
          <option value="">Select</option>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>

        <label className="block text-sm font-medium">Have you had retinal laser treatment?</label>
        <select name="retinalLasers" value={formData.retinalLasers} onChange={handleChange} className="w-full p-2 bg-purple-100 text-black border rounded">
          <option value="">Select</option>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>

        <button type="submit" className="w-full py-3 px-6 bg-orange-500 text-white font-semibold rounded-md hover:bg-orange-600 shadow-md focus:ring-2 focus:ring-orange-400">
          Submit
        </button>
      </form>
    </div>
  </div>
  );
};

export default HealthQuestionnaire;


