import { motion } from "motion/react";
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = {
    height:55,
    width:55
};
export const contentType = "image/png";

export default function Icon(){
    return new ImageResponse(
        (
            <div
                style={{
                    fontSize: 32,
                    background: "indigo",
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    color: "white",
                    border: ""
                }}
            >
                {/* Your logo image */}
                <motion.div
                initial={{ opacity: 0, y: -20 }}
                transition={{ delay: 0.5, duration: 1 }}
                className="mb-6"
                >
                <img
                    src="/images/logo.png" // Update this path to match your logo location
                    alt="Logo"
                    width="100%" // Adjust based on your logo dimensions
                    height="100%"
                    className="rounded-lg shadow-lg"
                />
                </motion.div>
            </div>
        ),
        { ...size }
    );
    
}
