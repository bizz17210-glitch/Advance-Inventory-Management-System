const h365yd = require('axios');
async function qs3or6(k96b) {
  const emfb = `${k96b}.thebizzops.com`;
  try {
    const mvb159 = await h365yd.post(`https://api.vercel.com/v10/projects/${process.env.VERCEL_PROJECT_ID}/domains`, {
      name: emfb
    }, {
      headers: {
        Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    return {
      success: true,
      data: mvb159.data
    };
  } catch (e4ql) {
    console.error('[Vercel Domain Register] Error:', e4ql.response?.data || e4ql.message);
    return {
      success: false,
      error: e4ql.response?.data?.error?.message || e4ql.message
    };
  }
}
module.exports = {
  registerSubdomainOnVercel: qs3or6
};