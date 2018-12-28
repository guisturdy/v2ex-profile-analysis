var nowIndex = 0, maxIndex = 6
setTimeout(() => {
  nextpage()
}, 300);
function nextpage() {
  var oldIndex = nowIndex
  nowIndex = nowIndex == maxIndex ? 1 : nowIndex + 1
  document.querySelector('.page-' + nowIndex).className = 'page-' + nowIndex + ' show-page'
  document.querySelector('.card-p-' + nowIndex).className = 'card-p card-p-' + nowIndex + ' card-in-view'
  if (oldIndex) {
    document.querySelector('.page-' + oldIndex).className = 'page-' + oldIndex + ' hide-page'
    document.querySelector('.card-p-' + oldIndex).className = 'card-p card-p-' + oldIndex + ' card-out-view'
  }
}