import { saveBookmark, getBookmarks, removeBookmark, getDomain } from './bookmarks'

describe('bookmarks utility', () => {
  beforeEach(() => {
    chrome.storage.local.get.mockImplementation((keys, cb) => cb({}))
    chrome.storage.local.set.mockImplementation((obj, cb) => cb && cb())
  })

  test('getDomain returns hostname', () => {
    expect(getDomain('https://github.com/user/repo')).toBe('github.com')
  })

  test('saveBookmark stores data', async () => {
    await saveBookmark('https://example.com', 'Example')
    expect(chrome.storage.local.set).toHaveBeenCalled()
  })

  test('removeBookmark updates storage', async () => {
    chrome.storage.local.get.mockImplementation((keys, cb) => {
      cb({ myBookmarks: { 'example.com': [{ url: 'https://example.com', title: 't' }] } })
    })
    await removeBookmark('https://example.com')
    expect(chrome.storage.local.set).toHaveBeenCalled()
  })
})
