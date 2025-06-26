import { saveBookmark } from '../../common/bookmarks';

function createSaveButton() {
  const button = document.createElement('button');
  button.textContent = 'Save to MyBookmarks'; // distinguish from pocket
  button.style.position = 'fixed';
  button.style.bottom = '20px';
  button.style.right = '20px';
  button.style.zIndex = '9999';
  button.style.padding = '10px 15px';
  button.style.backgroundColor = '#007bff';
  button.style.color = 'white';
  button.style.border = 'none';
  button.style.borderRadius = '5px';
  button.style.cursor = 'pointer';
  button.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
  button.style.fontSize = '14px';
  button.id = 'my-custom-bookmark-button';

  button.addEventListener('click', async () => {
    const url = window.location.href;
    const title = document.title || url;

    button.textContent = 'Saving...';
    button.disabled = true;

    try {
      await saveBookmark(url, title);
      button.textContent = 'Saved!';
      // Optionally, revert to 'Save to MyBookmarks' after a few seconds
      setTimeout(() => {
        button.textContent = 'Save to MyBookmarks';
        button.disabled = false;
      }, 2000);
    } catch (error) {
      console.error('Failed to save bookmark:', error);
      button.textContent = 'Error Saving';
      // Optionally, revert to 'Save to MyBookmarks' after a few seconds
      setTimeout(() => {
        button.textContent = 'Save to MyBookmarks';
        button.disabled = false;
      }, 3000);
    }
  });

  return button;
}

// Ensure the button isn't added multiple times if the script is injected again
if (!document.getElementById('my-custom-bookmark-button')) {
  const saveButton = createSaveButton();
  document.body.appendChild(saveButton);
} else {
  console.log('MyBookmarks button already exists.');
}

// For testing purposes, allow manual trigger if needed from console
// window.triggerMyBookmarkSave = async () => {
//   const btn = document.getElementById('my-custom-bookmark-button');
//   if (btn) btn.click();
// };
