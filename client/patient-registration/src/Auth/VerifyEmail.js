import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const VerifyEmail = () => {
    const { token } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        fetch(`/verify/${token}`)
            .then((res) => res.json())
            .then((data) => {
                alert(data.message);
                navigate("/login");
            })
            .catch((err) => console.error("Verification error:", err));
    }, [token, navigate]);

    return <h2 className="text-center text-white">Verifying your email...</h2>;
};
export default VerifyEmail;