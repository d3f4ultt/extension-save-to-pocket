// Functions to manage bookmarks using chrome.storage.local

/**
 * Saves a bookmark (URL and title) to chrome.storage.local, organized by domain.
 *
 * @param {string} url The URL of the page to bookmark.
 * @param {string} title The title of the page to bookmark.
 * @returns {Promise<void>} A promise that resolves when the bookmark is saved, or rejects on error.
 */
export async function saveBookmark(url, title) {
  if (!chrome.storage || !chrome.storage.local) {
    throw new Error("Chrome storage API is not available.");
  }

  let domain;
  try {
    domain = new URL(url).hostname;
  } catch (error) {
    console.error("Invalid URL:", url, error);
    return Promise.reject(new Error(`Invalid URL: ${url}`));
  }

  return new Promise((resolve, reject) => {
    chrome.storage.local.get([domain], (result) => {
      if (chrome.runtime.lastError) {
        console.error("Error getting bookmarks:", chrome.runtime.lastError);
        return reject(chrome.runtime.lastError);
      }

      const bookmarksForDomain = result[domain] || [];
      // Avoid adding duplicate URLs for the same domain
      if (bookmarksForDomain.some(bookmark => bookmark.url === url)) {
        console.log("Bookmark already exists for this URL:", url);
        // Optionally, could update the title or other metadata if it already exists
        return resolve();
      }

      bookmarksForDomain.push({ url, title, addedAt: new Date().toISOString() });

      chrome.storage.local.set({ [domain]: bookmarksForDomain }, () => {
        if (chrome.runtime.lastError) {
          console.error("Error saving bookmark:", chrome.runtime.lastError);
          return reject(chrome.runtime.lastError);
        }
        console.log("Bookmark saved:", { domain, url, title });
        resolve();
      });
    });
  });
}

/**
 * Retrieves bookmarks for a specific domain from chrome.storage.local.
 *
 * @param {string} domain The domain for which to retrieve bookmarks.
 * @returns {Promise<Array<{url: string, title: string, addedAt: string}>>}
 *          A promise that resolves with an array of bookmark objects, or an empty array if none found.
 *          Rejects on error.
 */
export async function getBookmarks(domain) {
  if (!chrome.storage || !chrome.storage.local) {
    throw new Error("Chrome storage API is not available.");
  }
  if (!domain) {
    return Promise.resolve([]); // Or reject(new Error("Domain cannot be empty"));
  }

  return new Promise((resolve, reject) => {
    chrome.storage.local.get([domain], (result) => {
      if (chrome.runtime.lastError) {
        console.error("Error getting bookmarks for domain:", domain, chrome.runtime.lastError);
        return reject(chrome.runtime.lastError);
      }
      resolve(result[domain] || []);
    });
  });
}

/**
 * Retrieves all bookmarks from chrome.storage.local.
 *
 * @returns {Promise<Object<string, Array<{url: string, title: string, addedAt: string}>>>}
 *          A promise that resolves with an object where keys are domains and values are arrays of bookmarks.
 *          Rejects on error.
 */
export async function getAllBookmarks() {
  if (!chrome.storage || !chrome.storage.local) {
    throw new Error("Chrome storage API is not available.");
  }

  return new Promise((resolve, reject) => {
    chrome.storage.local.get(null, (items) => { // Passing null gets all items
      if (chrome.runtime.lastError) {
        console.error("Error getting all bookmarks:", chrome.runtime.lastError);
        return reject(chrome.runtime.lastError);
      }
      resolve(items || {});
    });
  });
}
