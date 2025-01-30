import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const HealthQuestionnaire = () => {
    const navigate = useNavigate();
    const { patientId } = useParams();
    
    const [formData, setFormData] = useState({
        allergies: "",
        primaryLanguage: "",
        preferredLanguage: "",
        primaryConcern: "",
        symptomDuration: "",
        symptomTriggers: "",
        painLevel: "",
        chronicConditions: "",
        pastSurgeries: "",
        medications: "",
        familyHistory: "",
        diet: "",
        substanceUse: "",
        physicalActivity: "",
        menstrualCycle: "",
        pregnancyStatus: "",
        mentalHealth: "",
        sleepConcerns: ""
    });
    
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch("/api/submit-health-questionnaire", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...formData, patientId })
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
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-3xl w-full">
                <h2 className="text-2xl font-bold mb-4 text-center">Health Questionnaire</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">Do you have any known allergies (medications, food, environmental)?</label>
                        <input type="text" name="allergies" className="w-full p-2 border rounded" onChange={handleChange} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">What is your primary language?</label>
                        <input type="text" name="primaryLanguage" className="w-full p-2 border rounded" onChange={handleChange} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Would you prefer assistance in another language?</label>
                        <input type="text" name="preferredLanguage" className="w-full p-2 border rounded" onChange={handleChange} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">What brings you in today? Please describe your primary concern or symptoms.</label>
                        <textarea name="primaryConcern" className="w-full p-2 border rounded" onChange={handleChange}></textarea>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">How long have you been experiencing these symptoms?</label>
                        <input type="text" name="symptomDuration" className="w-full p-2 border rounded" onChange={handleChange} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Have you noticed anything that improves or worsens your symptoms?</label>
                        <input type="text" name="symptomTriggers" className="w-full p-2 border rounded" onChange={handleChange} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Are you currently experiencing pain? If so, how would you rate it on a scale of 1 to 10?</label>
                        <input type="number" name="painLevel" min="1" max="10" className="w-full p-2 border rounded" onChange={handleChange} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Do you have any chronic medical conditions (e.g., diabetes, hypertension, asthma)?</label>
                        <input type="text" name="chronicConditions" className="w-full p-2 border rounded" onChange={handleChange} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Have you had any surgeries or hospitalizations in the past?</label>
                        <input type="text" name="pastSurgeries" className="w-full p-2 border rounded" onChange={handleChange} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Are you currently taking any medications, including over-the-counter or supplements?</label>
                        <input type="text" name="medications" className="w-full p-2 border rounded" onChange={handleChange} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Is there any family history of medical conditions such as heart disease, cancer, or genetic disorders?</label>
                        <input type="text" name="familyHistory" className="w-full p-2 border rounded" onChange={handleChange} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">How would you describe your diet? Do you follow any specific dietary restrictions or plans?</label>
                        <input type="text" name="diet" className="w-full p-2 border rounded" onChange={handleChange} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Do you smoke or use tobacco products? Do you consume alcohol? If yes, how frequently and in what quantity?</label>
                        <input type="text" name="substanceUse" className="w-full p-2 border rounded" onChange={handleChange} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">How often do you engage in physical activity or exercise?</label>
                        <input type="text" name="physicalActivity" className="w-full p-2 border rounded" onChange={handleChange} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">When was your last menstrual period? Do you have a regular menstrual cycle?</label>
                        <input type="text" name="menstrualCycle" className="w-full p-2 border rounded" onChange={handleChange} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Are you currently pregnant or planning to become pregnant?</label>
                        <input type="text" name="pregnancyStatus" className="w-full p-2 border rounded" onChange={handleChange} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Have you been experiencing feelings of stress, anxiety, or depression recently?</label>
                        <input type="text" name="mentalHealth" className="w-full p-2 border rounded" onChange={handleChange} />
                    </div>
                    <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded">Submit</button>
                </form>
            </div>
        </div>
    );
};

export default HealthQuestionnaire;
