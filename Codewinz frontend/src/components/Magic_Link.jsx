import React from 'react'
import { useEffect,useState } from 'react';
import { useParams } from 'react-router';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import axiosClient from '../../utils/axiosClient';
import { useDispatch } from 'react-redux';
import { checkAuth } from '../../authSlice';
const Magic_Link = () => {
  const dispatch=useDispatch();
  const [load,setLoad]=useState(1);
   const {isAuthenticated,error}=useSelector((state)=>state.auth);
    const {token}=useParams();
    const navigate=useNavigate();
    //in backend will verify this token first and than generate a new token for him and make 
    //person login through that token and move him to home first send it token to cookie for future direct login
    useEffect(()=>{
  
    const check=async()=>{
      try{
    const {data}=await axiosClient.post("/user/verifyMail",{"token":token});
    //this will send me a token on cookie using which i will be directly redirected to home as check detect it 
    //if error will display
    dispatch(checkAuth());
    if(!error){
     navigate("/");
    }
    else setLoad(0);
    
    }
    //jaise he error mai load state 0 mtlab loading roak rha aur error dikha dunga
    catch(err){
      console.log(err);
      setLoad(0);
     
    }
  }
    check();
    },[token])
    //navn once get authentication
  
  

 //didnt need to return anything as automatically home have redirection to login if not authenticated and if authenticated above one navigate to home
  return (
    <></>
   
  )
}

export default Magic_Link;
