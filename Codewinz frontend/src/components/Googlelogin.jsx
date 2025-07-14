
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { googleLogin } from "../../authSlice";
import { useNavigate } from "react-router";

const Googlelogin = () => {
    const dispatch=useDispatch();
    const{isAuthenticated,loading,error}=useSelector((state)=>state.auth);
    const navigate=useNavigate();

       
    //initially setup google sdk and built connection with google
  useEffect(() => {
    window.google?.accounts.id.initialize({
      client_id:import.meta.env.VITE_GOOGLE_CLIENT_ID, // Replace this
      callback: handleGoogleResponse,
    });
  }, []);


//runs once google give google_id token as than automatically sdk trigger this callback

  const handleGoogleResponse = async (google_token) => {
    const id_token = google_token.credential;
    dispatch(googleLogin(id_token));
    //checking token came or not 
    // console.log(id_token);
  //google_token sending to our server from google response
   
  };
  //when click google show popup and send token of id to our sdk client and above fn runs
  const showGooglePopup = () => {
    window.google?.accounts.id.prompt();
  };

  return (
               <button onClick={showGooglePopup} disabled={loading} className="btn btn-circle btn-outline border-blue-500 hover:bg-red-500 hover:border-red-500 transition-all duration-300">
          
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21.805 10.023h-9.03v3.997h5.223c-.225 1.226-.905 2.275-1.922 2.994v2.481h3.112c1.82-1.676 2.872-4.148 2.872-7.028 0-.685-.06-1.351-.162-1.999z" />
                <path d="M12.775 21c2.46 0 4.523-.81 6.03-2.206l-3.112-2.48c-.863.576-1.975.917-2.918.917-2.242 0-4.144-1.517-4.822-3.556H4.73v2.555c1.498 2.936 4.543 4.77 8.045 4.77z" />
                <path d="M7.953 13.675c-.2-.576-.31-1.194-.31-1.825s.11-1.25.31-1.825v-2.555H4.73c-.59 1.176-.927 2.492-.927 3.88s.337 2.704.927 3.88l3.223-2.555z" />
                <path d="M12.775 6.94c1.34 0 2.54.462 3.483 1.37l2.612-2.612c-1.508-1.406-3.57-2.206-6.03-2.206-3.502 0-6.547 1.834-8.045 4.77l3.223 2.556c.678-2.039 2.58-3.556 4.822-3.556z" />
              </svg>
             </button> 
  );
};

export default Googlelogin;
