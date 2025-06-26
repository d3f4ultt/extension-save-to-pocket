import { saveBookmark } from 'common/bookmarks'

function injectButton() {
  if (document.getElementById('universal-bookmark-button')) return
  const button = document.createElement('button')
  button.id = 'universal-bookmark-button'
  button.textContent = 'Save'
  button.style.position = 'fixed'
  button.style.bottom = '10px'
  button.style.right = '10px'
  button.style.zIndex = '100000'
  button.addEventListener('click', async () => {
    await saveBookmark(window.location.href, document.title)
    button.textContent = 'Saved!'
    setTimeout(() => { button.textContent = 'Save' }, 1000)
  })
  document.body.appendChild(button)
}

(function () {
  if (window.top !== window) return
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectButton)
  } else {
    injectButton()
  }
})()
