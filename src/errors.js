/**
 * Helpers for returning common error responses.
 */

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
 * Generate promise response for missing page.
 *
 * @param {string} url - Url to reject.
 */
export function Forbidden(url) {
  return {
    status: 403,
    message: `Not authorized to access \`${url}\``,
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
    message: `Could not find resource \`${id}\``,
  };
}


export default {
  NotFound,
  Forbidden,
  Missing,
};
