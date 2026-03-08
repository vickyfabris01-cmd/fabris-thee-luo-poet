import { insertRecord } from "./db";

/**
 * Send an invite to the poet
 * @param {object} inviteData - Invite data
 * @param {string} inviteData.sender_name - Name of the sender (null if anonymous)
 * @param {boolean} inviteData.is_anonymous - Whether the invite is anonymous
 * @param {string} inviteData.message - The invite message
 * @returns {Promise<object>} Result with success flag and data/error
 */
export async function sendInvite(inviteData) {
  try {
    const payload = {
      sender_name: inviteData.sender_name || null,
      is_anonymous: inviteData.is_anonymous || false,
      message: inviteData.message || "",
      contact_method: "email",
      is_read: false,
      created_at: new Date().toISOString(),
    };

    const result = await insertRecord("invites", payload);

    if (result.success && result.data) {
      return {
        success: true,
        data: result.data,
        message: "Invite sent successfully!",
      };
    } else {
      return {
        success: false,
        error: result.error || "Failed to send invite. Please try again.",
      };
    }
  } catch (err) {
    return {
      success: false,
      error: `Error sending invite: ${err.message}`,
    };
  }
}

/**
 * Validate invite input
 * @param {object} inviteData - Invite data to validate
 * @returns {object} Validation result with isValid flag and errors array
 */
export function validateInvite(inviteData) {
  const errors = [];

  if (!inviteData.message || inviteData.message.trim().length === 0) {
    errors.push("Message is required");
  }

  if (inviteData.message && inviteData.message.length > 5000) {
    errors.push("Message must be less than 5000 characters");
  }

  if (!inviteData.is_anonymous && inviteData.sender_name && inviteData.sender_name.length > 100) {
    errors.push("Name must be less than 100 characters");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
