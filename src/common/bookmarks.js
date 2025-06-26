export function getDomain(url) {
  try {
    return new URL(url).hostname
  } catch (e) {
    return 'unknown'
  }
}

export function getBookmarks() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['myBookmarks'], (result) => {
      resolve(result.myBookmarks || {})
    })
  })
}

export async function saveBookmark(url, title) {
  const domain = getDomain(url)
  const data = await getBookmarks()
  if (!data[domain]) data[domain] = []
  data[domain].push({ url, title, addedAt: Date.now() })
  return new Promise((resolve) => {
    chrome.storage.local.set({ myBookmarks: data }, () => resolve())
  })
}

export async function removeBookmark(url) {
  const domain = getDomain(url)
  const data = await getBookmarks()
  if (data[domain]) {
    data[domain] = data[domain].filter((item) => item.url !== url)
    if (!data[domain].length) delete data[domain]
    return new Promise((resolve) => {
      chrome.storage.local.set({ myBookmarks: data }, () => resolve())
    })
  }
  return Promise.resolve()
}
