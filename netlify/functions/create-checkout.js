const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const { tier, successUrl, cancelUrl } = JSON.parse(event.body);

    let priceId = '';
    let mode = 'payment'; // 'payment' for one-time token, 'subscription' for annual

    if (tier === '5k') {
      priceId = process.env.STRIPE_PRICE_5K;
    } else if (tier === '10k') {
      priceId = process.env.STRIPE_PRICE_10K;
    } else if (tier === 'agency') {
      priceId = process.env.STRIPE_PRICE_AGENCY;
      mode = 'subscription';
    }

    if (!priceId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: `Stripe Price ID for tier '${tier}' is not configured in Netlify environment variables.` 
        }),
      };
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'STRIPE_SECRET_KEY environment variable is missing.' }),
      };
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: mode,
      metadata: {
        tier: tier
      },
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ url: session.url, sessionId: session.id }),
    };
  } catch (error) {
    console.error('Stripe Checkout Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
