import { saveBookmark, getBookmarks, getAllBookmarks } from './bookmarks';
import { chrome } from 'jest-chrome';

describe('Bookmark Management', () => {
  beforeEach(() => {
    // Reset chrome.storage.local mock before each test
    chrome.storage.local.get.mockReset();
    chrome.storage.local.set.mockReset();
    chrome.storage.local.clear(); // Clear any actual stored data in the mock
    // Do not attempt to clear chrome.runtime.lastError here.
    // Tests that expect an error will set it.
    // Tests that don't expect an error will rely on it being falsy by default.
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('saveBookmark', () => {
    it('should save a new bookmark for a new domain', async () => {
      const url = 'https://example.com/page1';
      const title = 'Example Page 1';

      chrome.storage.local.get.mockImplementationOnce((keys, callback) => {
        callback({}); // No existing bookmarks for 'example.com'
      });
      chrome.storage.local.set.mockImplementationOnce((items, callback) => {
        callback();
      });

      await saveBookmark(url, title);

      expect(chrome.storage.local.get).toHaveBeenCalledWith(['example.com'], expect.any(Function));
      expect(chrome.storage.local.set).toHaveBeenCalledWith(
        {
          'example.com': [
            { url, title, addedAt: expect.any(String) },
          ],
        },
        expect.any(Function)
      );
    });

    it('should add a bookmark to an existing domain', async () => {
      const url1 = 'https://example.com/page1';
      const title1 = 'Example Page 1';
      const url2 = 'https://example.com/page2';
      const title2 = 'Example Page 2';

      // Mock first call to saveBookmark (for url1)
      chrome.storage.local.get.mockImplementationOnce((keys, callback) => {
        callback({});
      });
      chrome.storage.local.set.mockImplementationOnce((items, callback) => {
        // Simulate storage for the next get call
        chrome.storage.local.get.mockImplementationOnce((k, cb) => {
          cb({ 'example.com': items['example.com'] });
        });
        callback();
      });
      await saveBookmark(url1, title1);

      // Mock second call to saveBookmark (for url2)
      // get will now return the bookmark saved above
      chrome.storage.local.set.mockImplementationOnce((items, callback) => {
        callback();
      });
      await saveBookmark(url2, title2);

      expect(chrome.storage.local.set).toHaveBeenCalledTimes(2);
      expect(chrome.storage.local.set).toHaveBeenLastCalledWith(
        {
          'example.com': [
            { url: url1, title: title1, addedAt: expect.any(String) },
            { url: url2, title: title2, addedAt: expect.any(String) },
          ],
        },
        expect.any(Function)
      );
    });

    it('should not save a duplicate URL for the same domain', async () => {
      const url = 'https://example.com/page1';
      const title = 'Example Page 1';
      const existingBookmarks = {
        'example.com': [{ url, title: 'Old Title', addedAt: new Date().toISOString() }],
      };

      chrome.storage.local.get.mockImplementationOnce((keys, callback) => {
        callback(existingBookmarks);
      });

      await saveBookmark(url, 'New Title for Same URL');

      expect(chrome.storage.local.set).not.toHaveBeenCalled();
    });

    it('should reject if URL is invalid', async () => {
      const url = 'invalid-url';
      const title = 'Invalid Test';
      await expect(saveBookmark(url, title)).rejects.toThrow('Invalid URL: invalid-url');
      expect(chrome.storage.local.get).not.toHaveBeenCalled();
      expect(chrome.storage.local.set).not.toHaveBeenCalled();
    });

    it('should reject if chrome.storage.local.get fails', async () => {
      // @ts-ignore
      chrome.runtime.lastError = { message: 'Failed to get' };
      chrome.storage.local.get.mockImplementationOnce((keys, callback) => {
        callback(undefined); // Pass undefined for items to trigger error check in code
      });

      await expect(saveBookmark('https://example.com', 'Test')).rejects.toEqual({ message: 'Failed to get' });
    });

    it('should reject if chrome.storage.local.set fails', async () => {
      chrome.storage.local.get.mockImplementationOnce((keys, callback) => {
        callback({});
      });
      // @ts-ignore
      chrome.runtime.lastError = { message: 'Failed to set' };
      chrome.storage.local.set.mockImplementationOnce((items, callback) => {
        callback(); // callback is called, but lastError is set
      });

      await expect(saveBookmark('https://example.com', 'Test')).rejects.toEqual({ message: 'Failed to set' });
    });
  });

  describe('getBookmarks', () => {
    it('should retrieve bookmarks for a given domain', async () => {
      const domain = 'example.com';
      const bookmarks = [{ url: 'https://example.com/page1', title: 'Page 1', addedAt: 'test-date' }];
      chrome.storage.local.get.mockImplementationOnce((keys, callback) => {
        callback({ [domain]: bookmarks });
      });

      const result = await getBookmarks(domain);
      expect(result).toEqual(bookmarks);
      expect(chrome.storage.local.get).toHaveBeenCalledWith([domain], expect.any(Function));
    });

    it('should return an empty array if no bookmarks for the domain', async () => {
      const domain = 'nonexistent.com';
      chrome.storage.local.get.mockImplementationOnce((keys, callback) => {
        callback({});
      });

      const result = await getBookmarks(domain);
      expect(result).toEqual([]);
    });

    it('should return empty array if domain is empty string', async () => {
      const result = await getBookmarks('');
      expect(result).toEqual([]);
      expect(chrome.storage.local.get).not.toHaveBeenCalled();
    });

    it('should reject if chrome.storage.local.get fails', async () => {
      const domain = 'example.com';
      // @ts-ignore
      chrome.runtime.lastError = { message: 'Failed to get' };
      chrome.storage.local.get.mockImplementationOnce((keys, callback) => {
        callback(undefined);
      });
      await expect(getBookmarks(domain)).rejects.toEqual({ message: 'Failed to get' });
    });
  });

  describe('getAllBookmarks', () => {
    it('should retrieve all bookmarks from storage', async () => {
      const allData = {
        'example.com': [{ url: 'https://example.com/page1', title: 'Page 1', addedAt: 'test-date1' }],
        'another.com': [{ url: 'https://another.com/item', title: 'Item', addedAt: 'test-date2' }],
      };
      chrome.storage.local.get.mockImplementationOnce((keys, callback) => {
        // Passing null to get should retrieve all items
        expect(keys).toBeNull();
        callback(allData);
      });

      const result = await getAllBookmarks();
      expect(result).toEqual(allData);
      expect(chrome.storage.local.get).toHaveBeenCalledWith(null, expect.any(Function));
    });

    it('should return an empty object if storage is empty', async () => {
      chrome.storage.local.get.mockImplementationOnce((keys, callback) => {
        callback({});
      });

      const result = await getAllBookmarks();
      expect(result).toEqual({});
    });

    it('should reject if chrome.storage.local.get fails', async () => {
      // @ts-ignore
      chrome.runtime.lastError = { message: 'Failed to get all' };
      chrome.storage.local.get.mockImplementationOnce((keys, callback) => {
        callback(undefined);
      });
      await expect(getAllBookmarks()).rejects.toEqual({ message: 'Failed to get all' });
    });
  });

  describe('Error: Chrome storage not available', () => {
    let originalChrome;

    beforeAll(() => {
      originalChrome = global.chrome;
    });

    afterAll(() => {
      global.chrome = originalChrome; // Restore original chrome object
    });

    it('saveBookmark should throw if chrome.storage is undefined', async () => {
      // @ts-ignore
      global.chrome = { ...originalChrome, storage: undefined };
      await expect(saveBookmark('https://example.com', 'Test')).rejects.toThrow('Chrome storage API is not available.');
    });

    it('getBookmarks should throw if chrome.storage is undefined', async () => {
      // @ts-ignore
      global.chrome = { ...originalChrome, storage: undefined };
      await expect(getBookmarks('example.com')).rejects.toThrow('Chrome storage API is not available.');
    });

    it('getAllBookmarks should throw if chrome.storage is undefined', async () => {
      // @ts-ignore
      global.chrome = { ...originalChrome, storage: undefined };
      await expect(getAllBookmarks()).rejects.toThrow('Chrome storage API is not available.');
    });
  });
});
