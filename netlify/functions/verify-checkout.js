const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const { session_id } = event.queryStringParameters || {};

    if (!session_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing session_id parameter' }),
      };
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'STRIPE_SECRET_KEY environment variable is missing.' }),
      };
    }

    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session && session.payment_status === 'paid') {
      const tier = session.metadata?.tier || 'free';
      
      let limit = 50;
      if (tier === '5k') limit = 5000;
      else if (tier === '10k') limit = 10000;
      else if (tier === 'agency') limit = Infinity;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: 'success',
          tier: tier,
          limit: limit,
          customerEmail: session.customer_details?.email || '',
        }),
      };
    } else {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: 'unpaid',
          limit: 50,
        }),
      };
    }
  } catch (error) {
    console.error('Stripe Verification Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
