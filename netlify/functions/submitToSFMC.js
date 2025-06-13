const fetch = require('node-fetch');

exports.handler = async function (event, context) {
  if (event.httpMethod !== 'POST') {
    console.log("HTTP Method:", event.httpMethod);
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { email, firstName, lastName, address, city, state, zip, phone, role} = JSON.parse(event.body);

  const clientId = process.env.SFMC_CLIENT_ID;
  const clientSecret = process.env.SFMC_CLIENT_SECRET;
  const authUrl = 'https://mcqq-5gpd44fzw9wpkgqt7zy12fy.auth.marketingcloudapis.com/v2/token';
  const restUrl = 'https://mcqq-5gpd44fzw9wpkgqt7zy12fy.rest.marketingcloudapis.com';

  try {
    // 1. Authenticate
    const authResponse = await fetch(authUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret
      })
    });

    const { access_token } = await authResponse.json();

    // 2. Insert into Data Extension (use external key)
    const deKey = '849745B9-887C-4AD2-9A85-0E0CF65B12A9';

    const response = await fetch(`${restUrl}/hub/v1/dataevents/key:${deKey}/rowset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${access_token}`
      },
      body: JSON.stringify([
        {
          keys: { "Email Address": email },
          values: { "First Name": firstName, "Last Name": lastName, "Address": address, "City": city, "State": state, "Zip Code": zip, "Phone": phone, "Patient Type": role}
        }
      ])
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Data submitted successfully!' })
    };
  } catch (error) {
    console.error('Error submitting to SFMC:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to submit data.', error: error.message })
    };
  }
};