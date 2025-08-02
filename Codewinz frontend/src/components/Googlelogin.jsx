import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { googleLogin } from "../../authSlice";
import { useNavigate } from "react-router";

const Googlelogin = () => {
    const dispatch = useDispatch();
    const { isAuthenticated, loading, error } = useSelector((state) => state.auth);
    const navigate = useNavigate();

    // Initially setup google sdk and build connection with google
    useEffect(() => {
        window.google?.accounts.id.initialize({
            client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
            callback: handleGoogleResponse,
        });
    }, []);

    // Runs once google gives google_id token, then automatically sdk triggers this callback
    const handleGoogleResponse = async (google_token) => {
        const id_token = google_token.credential;
        dispatch(googleLogin(id_token));
    };

    // When click google show popup and send token of id to our sdk client and above fn runs
    const showGooglePopup = () => {
        window.google?.accounts.id.prompt();
    };

    return (
        <div className="w-full">
            <button
                onClick={showGooglePopup}
                disabled={loading}
                className="group relative w-full flex items-center justify-center gap-3 px-6 py-3 bg-white border-2 border-gray-200 rounded-xl font-semibold text-gray-700 transition-all duration-300 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-100 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:shadow-none"
            >
                {/* Loading Spinner */}
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-xl">
                        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}

                {/* Google Icon */}
                <div className="flex-shrink-0 transition-transform duration-300 group-hover:scale-110">
                    <svg 
                        className="w-5 h-5" 
                        viewBox="0 0 24 24" 
                        fill="none"
                    >
                        <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                        />
                        <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                        />
                        <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            fill="#FBBC05"
                        />
                        <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                        />
                    </svg>
                </div>

                {/* Button Text */}
                <span className="text-sm font-medium transition-colors duration-300 group-hover:text-gray-900">
                    Continue with Google
                </span>

                {/* Hover Effect Background */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 -z-10"></div>
            </button>

            {/* Error Message */}
            {error && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <p className="text-sm text-red-700">
                            {error || "Authentication failed. Please try again."}
                        </p>
                    </div>
                </div>
            )}

            {/* Alternative: Compact Icon-Only Version */}
            {/* Uncomment this section if you prefer a compact circular button */}
            {/*
            <button
                onClick={showGooglePopup}
                disabled={loading}
                className="group relative w-12 h-12 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center transition-all duration-300 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-100 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? (
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                    <svg className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" viewBox="0 0 24 24" fill="none">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                )}
            </button>
            */}
        </div>
    );
};

export default Googlelogin;