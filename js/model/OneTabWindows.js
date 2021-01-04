export class OneTabWindows {
  constructor() {
    this.saveOneTabWindows = false
    this._oneTabWindows = []
  }
  addWindow(myWindow) {
    if(this.saveOneTabWindows) 
      this._oneTabWindows.push(myWindow)
  }
  getWindowById(id) {
    return this.saveOneTabWindows ? this._oneTabWindows.find(x => x.currentChromeId === id) : null
  }
  removeWindowById(id) {
    if(!this.saveOneTabWindows) 
      return
      
    let i = this._oneTabWindows.findIndex(x => x.currentChromeId === id)
    this._oneTabWindows.splice(i, 1)
  }
  getAndRemoveAllWindows() {
    if(!this.saveOneTabWindows) 
      return null

    let newArray = Array.from(this._oneTabWindows)
    this._oneTabWindows = []
    return newArray
  }
}