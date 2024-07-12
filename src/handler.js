const axios = require("axios");
const hubspotApiKey = process.env.HUBSPOT_API_KEY;

exports.handler = async (event) => {
  const body = JSON.parse(event.body);
  const contactId = body.objectId;

  try {
    // Get the newly created contact details
    const newContactResponse = await axios.get(
      `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}`,
      {
        headers: {
          Authorization: `Bearer ${hubspotApiKey}`,
        },
      }
    );
    const newContact = newContactResponse.data;

    // Search for existing contacts by email
    let existingContact = await searchContactByEmail(
      newContact.properties.email
    );
    if (!existingContact) {
      // Search for existing contacts by phone
      existingContact = await searchContactByPhone(newContact.properties.phone);
    }

    if (existingContact) {
      // Merge contacts if a match is found
      await mergeContacts(existingContact.id, newContact.id);
    }

    // Update lead status if needed (add your logic here)

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Contact processed successfully" }),
    };
  } catch (error) {
    console.error("Error processing contact:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Error processing contact" }),
    };
  }
};

async function searchContactByEmail(email) {
  if (!email) return null;
  const response = await axios.get(
    `https://api.hubapi.com/crm/v3/objects/contacts/search`,
    {
      headers: {
        Authorization: `Bearer ${hubspotApiKey}`,
      },
      params: {
        q: email,
      },
    }
  );
  return response.data.results.length > 0 ? response.data.results[0] : null;
}

async function searchContactByPhone(phone) {
  if (!phone) return null;
  const response = await axios.get(
    `https://api.hubapi.com/crm/v3/objects/contacts/search`,
    {
      headers: {
        Authorization: `Bearer ${hubspotApiKey}`,
      },
      params: {
        q: phone,
      },
    }
  );
  return response.data.results.length > 0 ? response.data.results[0] : null;
}

async function mergeContacts(primaryId, secondaryId) {
  await axios.post(
    `https://api.hubapi.com/crm/v3/objects/contacts/${primaryId}/merge`,
    {
      mergeObjectId: secondaryId,
    },
    {
      headers: {
        Authorization: `Bearer ${hubspotApiKey}`,
      },
    }
  );
}
