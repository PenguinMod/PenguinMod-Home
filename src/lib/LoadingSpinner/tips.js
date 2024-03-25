import tips from ".\Tips.json"
const rareTipChange = 0.001
const rareTip = "Fun fact: This tip only happens 1/" + 1/rareTipChange + " of the time. You are lucky!"

function getRandomTipId() {
  let doRareTip = Math.floor(Math.random() * 1/rareTipChange) === 1

  if (doRareTip) {
    return -1
  }
  else {
    return Math.floor(Math.random() * tips.length)
  }
  
}

function getTip(id) {
  if (id === -1) {
    return rareTip
  }
  else {
    return tips[id]
  }
}
