const axios = require('axios');

const getLanguageById = (lang) => {
  const language = {
    "c++": 54,
    "javascript": 63,
    "java": 62,
  };
  return language[lang.toLowerCase()];
};

const submitBatch = async (submissions) => {
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

  try {
    const response = await axios.request(options);
    return response.data;
  } catch (error) {
    console.log(error.message);
  }
};

const waiting = async (timer) => {
  return new Promise((resolve) => setTimeout(resolve, timer));
};

const submitToken = async (resultToken) => {
  const options = {
    method: 'GET',
    url: 'https://judge0-ce.p.rapidapi.com/submissions/batch',
    params: {
      tokens: resultToken.join(","),
      base64_encoded: 'false',
      fields: '*'
    },
    headers: {
      'x-rapidapi-key': process.env.JUDGE0_API,
      'x-rapidapi-host': 'judge0-ce.p.rapidapi.com'
    }
  };

  async function fetchData() {
    try {
      const response = await axios.request(options);
      return response.data;
    } catch (error) {
      console.log("holla", error.message);
      return { submissions: [] }; // prevent undefined crash
    }
  }

  while (true) {
    const result = await fetchData();

    if (result?.submissions?.every((r) => r.status_id > 2)) {
      return result.submissions;
    }

    // Wait 1 second to avoid hitting rate limits
    await waiting(1000);
  }
};

module.exports = { getLanguageById, submitBatch, submitToken };
