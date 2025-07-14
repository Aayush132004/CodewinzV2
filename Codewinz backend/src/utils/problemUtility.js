 const axios = require('axios');


const getLanguageById=(lang)=>{
    const language={
        "c++":54,
        "javascript":63,
        "java":62,
    }
    return language[lang.toLowerCase()];
}




const submitBatch=async (submissions)=>{


const options = {
  method: 'POST',
  url: 'https://judge0-ce.p.rapidapi.com/submissions/batch',
  params: {
    base64_encoded: 'false'
  },
  headers: {
    'x-rapidapi-key': process.env.JUDGE0_API,
    'x-rapidapi-host': 'judge0-ce.p.rapidapi.com',
    'Content-Type': 'application/json'
  },
  data: {
  submissions
  }
};

async function fetchData() {
	try {
		const response = await axios.request(options);
		return response.data;
	} catch (error) {
		console.log(error.message)
	}
}

return await fetchData();
}

const waiting=async(timer)=>{
    setTimeout(()=>{
        return 1;
    },timer);
}
const submitToken=async(resultToken)=>{
const options = {
  method: 'GET',
  url: 'https://judge0-ce.p.rapidapi.com/submissions/batch',
  params: {
    //convert to a string where values separated by , array.join() method of array in js
    tokens: resultToken.join(","),
    base64_encoded: 'false',
    fields: '*'
  },
  headers: {
    'x-rapidapi-key':process.env.JUDGE0_API,
    'x-rapidapi-host': 'judge0-ce.p.rapidapi.com'
  }
};

async function fetchData() {
	try {
		const response = await axios.request(options);
		return response.data;
	} 
    catch (error) {
		console.log(error.message)
	}
}

//require to send token to judge0 again and again till we get for each submission response id >2 ie code runned no processing or waiting
while(true){
const result= await fetchData();
const IsResultObtained=result.submissions.every((r)=>r.status_id>2);
if(IsResultObtained)
    return result.submissions;
//dont wanna send req to judge0 so fast again and again as ratelimit so after some time ie 1sec
//till than run a random fn that run for 1 sec basically a dummy settimeout fn named it waiting
await waiting(1000);

}
//can even do recursive call in else instead of while loop ie after waiting return await fetchData();
}
module.exports={getLanguageById,submitBatch,submitToken};