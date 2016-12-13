import openlayers from 'openlayers'

export default class DrawControl extends openlayers.control.Control {
    constructor(className) {
        const element = document.createElement('div')
        super({element})
        element.className = `${className || ''} ol-unselectable ol-control`
        element.title = 'Click to draw a bounding box'
        element.innerHTML = '<i class="fa fa-plus fa-1x"><span>  DRAW</span></i>'
        const hyperlink = this.element.firstChild
        hyperlink.addEventListener('click',  this._clicked.bind(this))

    }
    _clicked() {
        console.log("the button was clicked, yo!")
    }



}