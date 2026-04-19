const config = {
    content: ["./index.html", "./src/**/*.{ts,tsx}"],
    theme: {
        extend: {
            colors: {
                shell: "#f4f5fb",
                ink: "#111827",
                muted: "#6b7280"
            },
            boxShadow: {
                panel: "0 12px 40px rgba(76, 81, 191, 0.08), 0 2px 8px rgba(15, 23, 42, 0.05)"
            },
            fontFamily: {
                display: ["Space Grotesk", "sans-serif"],
                sans: ["Manrope", "sans-serif"]
            }
        }
    },
    plugins: []
};
export default config;
