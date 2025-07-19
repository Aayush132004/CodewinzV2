import {createAsyncThunk,createSlice, isRejectedWithValue} from '@reduxjs/toolkit'
import axiosClient from "../Codewinz frontend/utils/axiosClient";

export const registerUser=createAsyncThunk(
    'auth/register',
    async(userData,{rejectWithValue})=>{
        try{
            const response=await axiosClient.post('/user/register',userData);
            return response.data.user;
        }
        catch(err){
            return rejectWithValue(err.response?.data || err.message);
        }
        }
    
);

export const loginUser=createAsyncThunk(
    'auth/login',
     async(credentials,{rejectWithValue})=>{
        try{
            const response=await axiosClient.post('/user/login',credentials);
            return response.data.user;
        }
        catch(err){
            return rejectWithValue(err.response?.data || err.message);
        }
     }

);
export const googleLogin=createAsyncThunk(
    'auth/googleLogin',
    async(id_token,{rejectWithValue})=>{
        try{
            const response = await axiosClient.post("/user/googleLogin", {id_token});
  
         //our server send jwt wrapped in cookie if valid login and send user data automatic redicrect as 
         //isAuthenticate become 1
           return response.data.user;
    
      
           } 
           catch(err){
                 console.log(err);  
                return rejectWithValue(err.response.data);
           }
    }
        
    
)
export const logoutUser=createAsyncThunk(
    "auth/logout",
    async(_,{rejectWithValue})=>{
        try{
            await axiosClient.post('/user/logout');
            return null;
        }
        catch(err){
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);

export const checkAuth=createAsyncThunk(
    "auth/check",
    async(_,{rejectWithValue})=>{
        try{
            const response=await axiosClient.get('/user/check');
            return response.data.user ;
        }
        catch(err){
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);







const authSlice=createSlice({
    name:'auth',
    initialState:{
        user:null,
        isAuthenticated:false,
        loading:false,
        error:null
    },
    reducers:{

    },
    extraReducers:(builder)=>{
        builder
        //register user cases 
        .addCase(registerUser.pending,(state)=>{
            state.loading=true;
            state.error=null;
        })
        .addCase(registerUser.fulfilled,(state,action)=>{
         state.loading=false;
         state.user=action.payload;
         state.error=null;
         state.isAuthenticated=!!action.payload;
        })
        .addCase(registerUser.rejected,(state,action)=>{
            state.loading=false;
            state.isAuthenticated=false;
            state.error=action.payload?.message||"Something went wrong"
        })
        
        //login user cases
        .addCase(loginUser.pending,(state)=>{
            state.loading=true;
            state.error=null;
        })
        .addCase(loginUser.fulfilled,(state,action)=>{
            state.loading=false;
            state.error=null;
            state.user=action.payload;
            state.isAuthenticated=!!action.payload;
        })
        .addCase(loginUser.rejected,(state,action)=>{
            state.loading=false;
            state.error=action.payload?.message||'Something went wrong';
            state.isAuthenticated=false;
            state.user=null;
        })
        //checkAuth cases
        .addCase(checkAuth.pending,(state)=>{
            state.loading=true;
            state.error=null;
        })
        .addCase(checkAuth.fulfilled,(state,action)=>{
            state.loading=false;
            state.user=action.payload;
            state.isAuthenticated=!!action.payload;
        })
        .addCase(checkAuth.rejected,(state,action)=>{
            state.loading=false;
          ;
            state.isAuthenticated=false;
            state.user=null;
        })
        //logout cases
        .addCase(logoutUser.pending,(state)=>{
            state.loading=true;
            state.error=null;
        })
        .addCase(logoutUser.fulfilled,(state)=>{
            state.loading=false;
            state.error=null;
            state.isAuthenticated=false; 
            state.user=null;
        })
        .addCase(logoutUser.rejected,(state,action)=>{
            state.loading=false;
            state.error=action.payload?.message||'something went wrong';
            state.isAuthenticated=false;
            state.user=null;

        })
        ///google login
        .addCase(googleLogin.pending,(state)=>{
            state.loading=true;
            state.isAuthenticated=false;
            state.user=null;
            state.error=null;
        })
        .addCase(googleLogin.fulfilled,(state,action)=>{
            state.loading=false;
            state.isAuthenticated=true;
            state.user=action.payload;
            state.error=null;
        })
        .addCase(googleLogin.rejected,(state,action)=>{
             state.loading=false;
            state.isAuthenticated=false;
            state.user=null;
            state.error=action.payload?.message||"something went wrong";
        })
        

    }
})

export default authSlice.reducer;








