/**
 * Helpers for returning common error responses.
 */


// 400
/**
 * Generate promise response for missing page.
 *
 * @param {string} url - Url to reject.
 */
export function Forbidden(url) {
  return {
    status: 403,
    message: Boolean(url) ? `Not authorized to access \`${url}\`` : 'Unauthorized',
  };
}

/**
 * Generate promise response for missing resource.
 *
 * @param {string} url - Url to reject.
 */
export function NotFound(url) {
  return {
    status: 404,
    message: `URL \`${url}\` not in API`,
  };
}

/**
 * Generate promise response for missing resource.
 *
 * @param {object} id - Id of missing resource.
 */
export function Missing(id) {
  return {
    status: 404,
    message: `Could not find either resource \`${id}\` or nested payload for resource.`,
  };
}

// 500
/**
 * Generate promise response for internal server error.
 */
export function ServerError() {
  return {
    status: 500,
    message: 'Internal Server Error',
  };
}


// exports
// -------
export default {
  NotFound,
  Forbidden,
  Missing,
  ServerError,
};
