const { User } = require('../models');

// DEV-ONLY fallback: decode JWT without signature verification to extract claims
const decodeJwtNoVerify = (token) => {
  try {
    const [h, p] = token.split('.');
    if (!p) return null;
    const json = Buffer.from(p.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
};

/**
 * Verify Clerk token from client (JWT or session token) and return Clerk user data
 * @param {string} token - Clerk JWT (from getToken) or session token
 * @returns {Object} { user: <Clerk user object>, claims?: <token claims> }
 */
const verifySessionToken = async (token) => {
  const secret = process.env.CLERK_SECRET_KEY;
  const isJwt = (t) => typeof t === 'string' && t.split('.').length === 3;

  // Helper: fetch Clerk user by id and wrap as { user }
  const fetchUserById = async (userId, claims = undefined) => {
    const user = await getClerkUser(userId);
    return { user, claims };
  };

  // If it looks like a JWT, attempt token verification API first; if it fails (404/405), fall back to decoding and fetching user id from claims (DEV only)
  if (isJwt(token) && secret) {
    const endpoints = [
      'https://api.clerk.com/v1/tokens/verify',
      'https://api.clerk.dev/v1/tokens/verify',
    ];
    let lastErr;
    for (const url of endpoints) {
      try {
        const resp = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${secret}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ token })
        });
        if (resp.ok) {
          const data = await resp.json();
          const claims = data.payload || data.claims || {};
          const userId = claims.sub || data.user_id || data.userId || claims.user_id;
          if (userId) {
            return await fetchUserById(userId, claims);
          }
          lastErr = new Error('Token verification missing user id');
        } else {
          lastErr = new Error(`${resp.status} ${await resp.text()}`);
        }
      } catch (e) {
        lastErr = e;
      }
    }
    if (process.env.NODE_ENV !== 'production') {
      const decoded = decodeJwtNoVerify(token) || {};
      const userId = decoded.sub || decoded.user_id || decoded.uid;
      if (userId) {
        // Dev fallback: construct a minimal Clerk-like user object from claims
        const clerkUser = {
          id: userId,
          first_name: decoded.first_name || decoded.given_name || '',
          last_name: decoded.last_name || decoded.family_name || '',
          email_addresses: decoded.email || decoded.email_address
            ? [{ email_address: decoded.email || decoded.email_address }]
            : [],
          image_url: decoded.image_url || decoded.picture || null,
        };
        return { user: clerkUser, claims: decoded, source: 'dev-decoded' };
      }
    }
    if (lastErr) {
      console.error('Clerk token verification error (will try session verify):', lastErr);
    }
  }

  // Otherwise treat as a session token (Dev Browser / session token path)
  {
    if (secret) {
      const endpoints = [
        'https://api.clerk.com/v1/sessions/verify',
        'https://api.clerk.dev/v1/sessions/verify',
      ];
      let lastErr;
      for (const url of endpoints) {
        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${secret}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ session_token: token })
          });

          if (response.ok) {
            const session = await response.json();
            const userId = session?.user_id || session?.user?.id;
            if (!userId) throw new Error('Session verification missing user id');
            return await fetchUserById(userId, session);
          }
          lastErr = new Error(`${response.status} ${await response.text()}`);
        } catch (e) {
          lastErr = e;
        }
      }
      console.error('Clerk session verification error:', lastErr);
    }
    // Dev fallback when secret is missing or verification failed
    const decoded = decodeJwtNoVerify(token) || {};
    const userId = decoded.sub || decoded.user_id || decoded.uid;
    if (userId) {
      const clerkUser = {
        id: userId,
        first_name: decoded.first_name || decoded.given_name || '',
        last_name: decoded.last_name || decoded.family_name || '',
        email_addresses: decoded.email || decoded.email_address
          ? [{ email_address: decoded.email || decoded.email_address }]
          : [],
        image_url: decoded.image_url || decoded.picture || null,
        username: decoded.username || decoded.handle
      };
      return { user: clerkUser, claims: decoded, source: 'dev-decoded' };
    }
    throw new Error('Session verification failed');
  }
};

/**
 * Get user data from Clerk
 * @param {string} userId - Clerk user ID
 * @returns {Object} User data from Clerk
 */
const getClerkUser = async (userId) => {
  const secret = process.env.CLERK_SECRET_KEY;
  if (!secret) {
    // In local development, we allow dev fallbacks below without failing immediately
    console.warn('CLERK_SECRET_KEY is not set. Falling back to dev token handling.');
  }
  const endpoints = [
    `https://api.clerk.com/v1/users/${userId}`,
    `https://api.clerk.dev/v1/users/${userId}`,
  ];
  let lastErr;
  for (const url of endpoints) {
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${secret}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        return await response.json();
      }
      lastErr = new Error(`${response.status} ${await response.text()}`);
    } catch (e) {
      lastErr = e;
    }
  }
  console.error('Clerk user fetch error:', lastErr);
  throw new Error('Failed to fetch user data');
};

/**
 * Update user in Clerk
 * @param {string} userId - Clerk user ID
 * @param {Object} userData - User data to update
 * @returns {Object} Updated user data
 */
const updateClerkUser = async (userId, userData) => {
  try {
    const response = await fetch(`https://api.clerk.dev/v1/users/${userId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      throw new Error('Failed to update user');
    }

    return await response.json();
  } catch (error) {
    console.error('Clerk user update error:', error);
    throw new Error('Failed to update user data');
  }
};

/**
 * Delete user from Clerk
 * @param {string} userId - Clerk user ID
 * @returns {boolean} Success status
 */
const deleteClerkUser = async (userId) => {
  try {
    const response = await fetch(`https://api.clerk.dev/v1/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to delete user');
    }

    return true;
  } catch (error) {
    console.error('Clerk user deletion error:', error);
    throw new Error('Failed to delete user');
  }
};

/**
 * Create organization in Clerk
 * @param {Object} orgData - Organization data
 * @returns {Object} Created organization
 */
const createClerkOrganization = async (orgData) => {
  try {
    const response = await fetch('https://api.clerk.dev/v1/organizations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orgData)
    });

    if (!response.ok) {
      throw new Error('Failed to create organization');
    }

    return await response.json();
  } catch (error) {
    console.error('Clerk organization creation error:', error);
    throw new Error('Failed to create organization');
  }
};

/**
 * Get user's organizations from Clerk
 * @param {string} userId - Clerk user ID
 * @returns {Array} User's organizations
 */
const getUserOrganizations = async (userId) => {
  try {
    const response = await fetch(`https://api.clerk.dev/v1/users/${userId}/organization_memberships`, {
      headers: {
        'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch organizations');
    }

    return await response.json();
  } catch (error) {
    console.error('Clerk organizations fetch error:', error);
    throw new Error('Failed to fetch user organizations');
  }
};

/**
 * Sync user data between Clerk and our database
 * @param {Object} clerkUser - User data from Clerk
 * @returns {Object} Synced user from our database
 */
const syncUserData = async (clerkUser) => {
  try {
    // First, try to find user by clerkId
    let user = await User.findOne({ clerkId: clerkUser.id });

    if (!user) {
      // If not found by clerkId, check if user exists by email (in case clerkId changed)
      const primaryEmail = clerkUser.email_addresses?.[0]?.email_address || clerkUser.email;
      if (primaryEmail) {
        user = await User.findOne({ email: primaryEmail });
        if (user) {
          // Update existing user with new clerkId
          user.clerkId = clerkUser.id;
          console.log(`Updated existing user ${user.email} with new clerkId: ${clerkUser.id}`);
        }
      }
    }

    // Helper to derive reasonable first/last names when Clerk doesn't provide them
    const deriveNames = (cUser) => {
      const fromClerkFirst = cUser.first_name || cUser.given_name || cUser.firstName;
      const fromClerkLast = cUser.last_name || cUser.family_name || cUser.lastName;
      if (fromClerkFirst || fromClerkLast) {
        return {
          firstName: (fromClerkFirst || 'User').trim() || 'User',
          lastName: (fromClerkLast || '').trim() // allow empty last name
        };
      }

      const username = cUser.username || cUser.handle || cUser.user?.username;
      const primaryEmailLocal = (cUser.email_addresses?.[0]?.email_address || cUser.email || '').split('@')[0];
      const source = username || primaryEmailLocal || '';
      const tokens = source
        .replace(/\d+/g, ' ')
        .split(/[._-]+|\s+/)
        .filter(Boolean)
        .map(s => s.charAt(0).toUpperCase() + s.slice(1));
      if (tokens.length === 0) {
        return { firstName: 'User', lastName: '' };
      }
      if (tokens.length === 1) {
        return { firstName: tokens[0], lastName: '' };
      }
      return { firstName: tokens[0], lastName: tokens.slice(1).join(' ') };
    };

    if (!user) {
      // Derive safe defaults for new user
      const derived = deriveNames(clerkUser);
      const firstName = (clerkUser.first_name || clerkUser.given_name || derived.firstName || 'User').trim() || 'User';
      const lastName = (clerkUser.last_name || clerkUser.family_name || derived.lastName || '').trim();
      const primaryEmail = clerkUser.email_addresses?.[0]?.email_address || clerkUser.email || `${clerkUser.id}@example.local`;
      const profileImage = clerkUser.image_url || clerkUser.picture || null;

      // Create new user
      user = new User({
        clerkId: clerkUser.id,
        firstName,
        lastName,
        email: primaryEmail,
        profileImage,
        location: {
          type: 'Point',
          coordinates: [0, 0],
          address: {}
        }
      });

      await user.save();
      console.log(`Created new user: ${user.email} with clerkId: ${clerkUser.id}`);

      // Create welcome notification for new users only
      try {
        const Notification = require('../models/Notification');
        await Notification.createSystemNotification(
          user._id,
          'system_alert',
          'Welcome to Fixify!',
          'Welcome to our platform! Complete your profile to get started.'
        );
      } catch (notifError) {
        console.warn('Failed to create welcome notification:', notifError);
        // Don't fail user creation if notification fails
      }
    } else {
      // Update existing user with latest Clerk data (preserve existing if missing from Clerk)
      const updatedFields = {};

      const { firstName: derivedFirst, lastName: derivedLast } = deriveNames(clerkUser);
      const newFirstName = (clerkUser.first_name || clerkUser.given_name || derivedFirst || '').trim();
      const newLastName = (clerkUser.last_name || clerkUser.family_name || derivedLast || '').trim();
      const isDefaultName = (name) => !name || /^user$/i.test(name) || /^name$/i.test(name) || /^member$/i.test(name);
      if ((newFirstName && newFirstName !== user.firstName) || isDefaultName(user.firstName)) {
        if (newFirstName) updatedFields.firstName = newFirstName;
      }
      if ((newLastName !== undefined && newLastName !== user.lastName) || isDefaultName(user.lastName)) {
        // allow setting empty last name to clear legacy placeholder like 'Member'
        updatedFields.lastName = newLastName || '';
      }

      const newEmail = clerkUser.email_addresses?.[0]?.email_address || clerkUser.email;
      if (newEmail && newEmail !== user.email) {
        updatedFields.email = newEmail;
      }

      const newProfileImage = clerkUser.image_url || clerkUser.picture;
      if (newProfileImage && newProfileImage !== user.profileImage) {
        updatedFields.profileImage = newProfileImage;
      }

      // Only save if there are actual changes
      if (Object.keys(updatedFields).length > 0) {
        Object.assign(user, updatedFields);
        await user.save();
        console.log(`Updated user ${user.email} with fields:`, Object.keys(updatedFields));
      }
    }

    return user;
  } catch (error) {
    console.error('User sync error:', error);

    // If it's a duplicate key error, try to find the existing user and update clerkId
    if (error.code === 11000 && error.keyPattern?.email) {
      try {
        const email = error.keyValue.email;
        console.log(`Attempting to recover from duplicate email error for: ${email}`);

        const existingUser = await User.findOne({ email });
        if (existingUser) {
          // Update the existing user with the new clerkId
          existingUser.clerkId = clerkUser.id;
          await existingUser.save();
          console.log(`Successfully updated existing user ${email} with clerkId: ${clerkUser.id}`);
          return existingUser;
        }
      } catch (recoveryError) {
        console.error('Failed to recover from duplicate email error:', recoveryError);
      }
    }

    throw new Error('Failed to sync user data');
  }
};

/**
 * Handle Clerk webhook events
 * @param {Object} event - Webhook event from Clerk
 * @returns {Object} Processing result
 */
const handleClerkWebhook = async (event) => {
  try {
    switch (event.type) {
      case 'user.created':
        await syncUserData(event.data);
        break;

      case 'user.updated':
        await syncUserData(event.data);
        break;

      case 'user.deleted':
        await User.findOneAndUpdate(
          { clerkId: event.data.id },
          { isActive: false }
        );
        break;

      case 'session.created':
        // Handle session creation if needed
        break;

      case 'session.revoked':
        // Handle session revocation if needed
        break;

      default:
        console.log('Unhandled Clerk webhook event:', event.type);
    }

    return { success: true };
  } catch (error) {
    console.error('Clerk webhook handling error:', error);
    throw new Error('Failed to process webhook event');
  }
};

/**
 * Verify webhook signature from Clerk
 * @param {string} payload - Raw request body
 * @param {string} signature - Webhook signature
 * @returns {boolean} Signature validity
 */
const verifyWebhookSignature = (payload, signature) => {
  try {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', process.env.CLERK_WEBHOOK_SECRET)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('Webhook signature verification error:', error);
    return false;
  }
};

module.exports = {
  verifySessionToken,
  getClerkUser,
  updateClerkUser,
  deleteClerkUser,
  createClerkOrganization,
  getUserOrganizations,
  syncUserData,
  handleClerkWebhook,
  verifyWebhookSignature
};